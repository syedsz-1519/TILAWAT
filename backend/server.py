from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="TILAWA API", description="Quranic Ecosystem Backend")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SurahInfo(BaseModel):
    number: int
    name: str
    english_name: str
    english_translation: str
    revelation_type: str
    number_of_ayahs: int

class VerseInfo(BaseModel):
    surah: int
    ayah: int
    arabic: str
    translation_en: Optional[str] = None
    translation_ur: Optional[str] = None
    audio_url: Optional[str] = None

class CardExportRequest(BaseModel):
    surah: int
    ayah: int
    style: str = "dark"  # dark, parchment, minimal
    include_translation: bool = True

# ==================== QURAN DATA CACHE ====================

QURAN_CACHE = {
    "surahs": [],
    "verses": {},
    "loaded": False
}

async def load_quran_data():
    """Load Quran data from alquran.cloud API"""
    if QURAN_CACHE["loaded"]:
        return
    
    logger.info("Loading Quran data from API...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Load surah list
        try:
            response = await client.get("https://api.alquran.cloud/v1/surah")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    QURAN_CACHE["surahs"] = data["data"]
                    logger.info(f"Loaded {len(QURAN_CACHE['surahs'])} surahs")
        except Exception as e:
            logger.error(f"Error loading surahs: {e}")
    
    QURAN_CACHE["loaded"] = True

async def get_surah_verses(surah_number: int):
    """Fetch verses for a specific surah with translations"""
    cache_key = f"surah_{surah_number}"
    
    # Check MongoDB cache first
    cached = await db.quran_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            # Fetch Arabic text
            ar_response = await http_client.get(f"https://api.alquran.cloud/v1/surah/{surah_number}")
            ar_data = ar_response.json() if ar_response.status_code == 200 else None
            
            # Fetch English translation
            en_response = await http_client.get(f"https://api.alquran.cloud/v1/surah/{surah_number}/en.asad")
            en_data = en_response.json() if en_response.status_code == 200 else None
            
            if ar_data and ar_data.get("status") == "OK":
                verses = []
                ar_ayahs = ar_data["data"]["ayahs"]
                en_ayahs = en_data["data"]["ayahs"] if en_data and en_data.get("status") == "OK" else []
                
                for i, ar_ayah in enumerate(ar_ayahs):
                    verse = {
                        "surah": surah_number,
                        "ayah": ar_ayah["numberInSurah"],
                        "arabic": ar_ayah["text"],
                        "translation_en": en_ayahs[i]["text"] if i < len(en_ayahs) else None,
                        "audio_url": f"https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ar_ayah['number']}.mp3",
                        "audio_word_url": f"https://audio.qurancdn.com/wbw/{surah_number}_{ar_ayah['numberInSurah']}.mp3"
                    }
                    verses.append(verse)
                
                # Cache in MongoDB
                await db.quran_cache.update_one(
                    {"key": cache_key},
                    {"$set": {"key": cache_key, "data": verses, "cached_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
                
                return verses
        except Exception as e:
            logger.error(f"Error fetching surah {surah_number}: {e}")
    
    return []

# ==================== AI CHAT ====================

SYSTEM_PROMPT = """You are Tilawa AI (تلاوة), a knowledgeable and respectful Islamic assistant specialized in Quranic studies. 

Your expertise includes:
- Tafseer (Quranic interpretation) from authentic scholars
- Tajweed rules and proper recitation
- Arabic grammar as it relates to the Quran
- Historical context of revelations (Asbab al-Nuzul)
- Cross-references between related verses
- Sahih Hadith that explain Quranic verses

Guidelines:
- Always provide authentic, respectful Islamic context
- Cite sources when possible (e.g., "According to Tafseer Ibn Kathir...")
- Be gentle and encouraging in your responses
- If unsure, say so rather than speculate
- Respect all Islamic schools of thought
- Use Arabic terms with translations when appropriate

You can help with:
- Explaining the meaning of verses
- Teaching Tajweed rules
- Finding verses on specific topics
- Comparing different translations
- Answering questions about Islamic practices mentioned in the Quran"""

async def stream_ai_response(message: str, session_id: str):
    """Stream AI response using Emergent LLM"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        yield f"data: {json.dumps({'error': 'AI service not configured'})}\n\n"
        return
    
    # Get chat history from MongoDB
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    history = session.get("messages", []) if session else []
    
    # Initialize chat
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    # Add history to chat context
    for msg in history[-10:]:  # Last 10 messages for context
        if msg["role"] == "user":
            chat.messages.append({"role": "user", "content": msg["content"]})
        else:
            chat.messages.append({"role": "assistant", "content": msg["content"]})
    
    try:
        user_msg = UserMessage(text=message)
        full_response = ""
        
        # Stream the response
        async for chunk in chat.send_message_stream(user_msg):
            if chunk:
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        
        # Save to MongoDB
        await db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()},
                            {"role": "assistant", "content": full_response, "timestamp": datetime.now(timezone.utc).isoformat()}
                        ]
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"id": session_id, "created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
        
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Tilawa API - Quranic Ecosystem", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Surah Routes
@api_router.get("/surahs", response_model=List[dict])
async def get_surahs():
    """Get list of all 114 surahs"""
    await load_quran_data()
    return QURAN_CACHE["surahs"]

@api_router.get("/surah/{surah_number}")
async def get_surah(surah_number: int):
    """Get surah info and verses"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=400, detail="Surah number must be between 1 and 114")
    
    await load_quran_data()
    
    surah_info = next((s for s in QURAN_CACHE["surahs"] if s["number"] == surah_number), None)
    verses = await get_surah_verses(surah_number)
    
    return {
        "info": surah_info,
        "verses": verses
    }

@api_router.get("/verse/{surah_number}/{ayah_number}")
async def get_verse(surah_number: int, ayah_number: int):
    """Get a specific verse with translations"""
    verses = await get_surah_verses(surah_number)
    verse = next((v for v in verses if v["ayah"] == ayah_number), None)
    
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    return verse

@api_router.get("/search")
async def search_quran(q: str = Query(..., min_length=2)):
    """Search Quran by text"""
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(f"https://api.alquran.cloud/v1/search/{q}/all/en")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    return data["data"]
        except Exception as e:
            logger.error(f"Search error: {e}")
    
    return {"count": 0, "matches": []}

# AI Chat Routes
@api_router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream AI chat response"""
    session_id = request.session_id or str(uuid.uuid4())
    
    return StreamingResponse(
        stream_ai_response(request.message, session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-ID": session_id
        }
    )

@api_router.post("/chat")
async def chat_simple(request: ChatRequest):
    """Non-streaming chat endpoint"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    session_id = request.session_id or str(uuid.uuid4())
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    try:
        user_msg = UserMessage(text=request.message)
        response = await chat.send_message(user_msg)
        
        # Save to MongoDB
        await db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                        ]
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"id": session_id, "created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        return {"messages": []}
    return {"messages": session.get("messages", [])}

# Tajweed Lessons
TAJWEED_LESSONS = [
    {
        "id": 1,
        "name": "Ikhfa",
        "arabic": "إخفاء",
        "description": "Hiding/Concealment - When noon saakin or tanween is followed by one of 15 letters, it is pronounced with a light nasalization.",
        "color": "#3A5A6B",
        "letters": "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
        "examples": [
            {"arabic": "مِن تَحْتِهَا", "transliteration": "min tahtiha", "meaning": "from beneath it"},
            {"arabic": "أَنْزَلْنَاهُ", "transliteration": "anzalnahu", "meaning": "We sent it down"}
        ]
    },
    {
        "id": 2,
        "name": "Idgham",
        "arabic": "إدغام",
        "description": "Merging - When noon saakin or tanween is followed by certain letters (ي ن م و ل ر), it merges into the following letter.",
        "color": "#4A7C59",
        "letters": "ي ر م ل و ن",
        "examples": [
            {"arabic": "مِن رَّبِّهِمْ", "transliteration": "mir rabbihim", "meaning": "from their Lord"},
            {"arabic": "مِن نِّعْمَةٍ", "transliteration": "min ni'matin", "meaning": "from blessing"}
        ]
    },
    {
        "id": 3,
        "name": "Iqlab",
        "arabic": "إقلاب",
        "description": "Conversion - When noon saakin or tanween is followed by the letter ba (ب), it converts to a meem sound with nasalization.",
        "color": "#C07C41",
        "letters": "ب",
        "examples": [
            {"arabic": "مِن بَعْدِ", "transliteration": "mim ba'di", "meaning": "from after"},
            {"arabic": "سَمِيعٌ بَصِيرٌ", "transliteration": "sami'um basir", "meaning": "All-Hearing, All-Seeing"}
        ]
    },
    {
        "id": 4,
        "name": "Qalqalah",
        "arabic": "قلقلة",
        "description": "Echo/Bouncing - Letters (ق ط ب ج د) when they have sukoon create a bouncing or echoing sound.",
        "color": "#8F3D3D",
        "letters": "ق ط ب ج د",
        "examples": [
            {"arabic": "يَخْلُقْ", "transliteration": "yakhluq", "meaning": "He creates"},
            {"arabic": "الْفَلَقِ", "transliteration": "al-falaq", "meaning": "the daybreak"}
        ]
    },
    {
        "id": 5,
        "name": "Ghunnah",
        "arabic": "غنة",
        "description": "Nasalization - A nasal sound produced from the nose cavity, primarily with noon and meem when they have shaddah.",
        "color": "#8B5A70",
        "letters": "ن م",
        "examples": [
            {"arabic": "إِنَّ", "transliteration": "inna", "meaning": "indeed"},
            {"arabic": "ثُمَّ", "transliteration": "thumma", "meaning": "then"}
        ]
    }
]

@api_router.get("/tajweed/lessons")
async def get_tajweed_lessons():
    """Get all tajweed lessons"""
    return TAJWEED_LESSONS

@api_router.get("/tajweed/lesson/{lesson_id}")
async def get_tajweed_lesson(lesson_id: int):
    """Get a specific tajweed lesson"""
    lesson = next((l for l in TAJWEED_LESSONS if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load Quran data on startup"""
    await load_quran_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
