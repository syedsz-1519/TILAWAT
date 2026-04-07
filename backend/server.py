from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import json
import asyncio
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import sqlite3
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="TILAWA API", description="Quranic Ecosystem Backend with RAG")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    research_mode: bool = False  # Enable RAG from library
    language: str = "en"  # Translation language

class TranslationRequest(BaseModel):
    surah: int
    language: str

class LibraryChunk(BaseModel):
    id: str
    book_name: str
    page_number: int
    content: str
    embedding: Optional[List[float]] = None

class ReciterInfo(BaseModel):
    id: str
    name: str
    style: str
    audio_base_url: str

# ==================== MULTILINGUAL TRANSLATIONS ====================

SUPPORTED_TRANSLATIONS = {
    # Indian Languages
    "hi": {"id": "hi.hindi", "name": "Hindi", "direction": "ltr", "font": "Noto Sans Devanagari"},
    "ur": {"id": "ur.jalandhry", "name": "Urdu (Jalandhry)", "direction": "rtl", "font": "Noto Nastaliq Urdu"},
    "ur_mufti_taqi": {"id": "ur.muftiTaqiUsmani", "name": "Urdu (Mufti Taqi Usmani)", "direction": "rtl", "font": "Noto Nastaliq Urdu"},
    "te": {"id": "te.telugu", "name": "Telugu", "direction": "ltr", "font": "Noto Sans Telugu"},
    "ta": {"id": "ta.tamil", "name": "Tamil", "direction": "ltr", "font": "Noto Sans Tamil"},
    "kn": {"id": "kn.kannada", "name": "Kannada", "direction": "ltr", "font": "Noto Sans Kannada"},
    "ml": {"id": "ml.malayalam", "name": "Malayalam", "direction": "ltr", "font": "Noto Sans Malayalam"},
    "mr": {"id": "mr.marathi", "name": "Marathi", "direction": "ltr", "font": "Noto Sans Devanagari"},
    "pa": {"id": "pa.punjabi", "name": "Punjabi", "direction": "ltr", "font": "Noto Sans Gurmukhi"},
    "bn": {"id": "bn.bengali", "name": "Bengali", "direction": "ltr", "font": "Noto Sans Bengali"},
    "gu": {"id": "gu.gujarati", "name": "Gujarati", "direction": "ltr", "font": "Noto Sans Gujarati"},
    "or": {"id": "or.odia", "name": "Odia", "direction": "ltr", "font": "Noto Sans Oriya"},
    # Common Languages
    "en": {"id": "en.asad", "name": "English (Asad)", "direction": "ltr", "font": "Figtree"},
    "en_sahih": {"id": "en.sahih", "name": "English (Sahih Intl)", "direction": "ltr", "font": "Figtree"},
    "ar": {"id": "quran-simple", "name": "Arabic (Simple)", "direction": "rtl", "font": "Amiri"},
    "tr": {"id": "tr.ates", "name": "Turkish", "direction": "ltr", "font": "Figtree"},
    "id": {"id": "id.indonesian", "name": "Indonesian", "direction": "ltr", "font": "Figtree"},
    "fr": {"id": "fr.hamidullah", "name": "French", "direction": "ltr", "font": "Figtree"},
}

# ==================== RECITERS ====================

RECITERS = {
    "alafasy": {
        "id": "alafasy",
        "name": "Mishary Rashid Alafasy",
        "style": "Murattal",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.alafasy"
    },
    "yasser_dossari": {
        "id": "yasser_dossari", 
        "name": "Yasser Al-Dossari",
        "style": "Murattal",
        "audio_base_url": "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps"
    },
    "sudais": {
        "id": "sudais",
        "name": "Abdul Rahman Al-Sudais",
        "style": "Murattal",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais"
    },
    "minshawi": {
        "id": "minshawi",
        "name": "Mohamed Siddiq El-Minshawi",
        "style": "Mujawwad",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.minshawi"
    },
    "husary": {
        "id": "husary",
        "name": "Mahmoud Khalil Al-Husary",
        "style": "Murattal",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.husary"
    }
}

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
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            response = await http_client.get("https://api.alquran.cloud/v1/surah")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    QURAN_CACHE["surahs"] = data["data"]
                    logger.info(f"Loaded {len(QURAN_CACHE['surahs'])} surahs")
        except Exception as e:
            logger.error(f"Error loading surahs: {e}")
    
    QURAN_CACHE["loaded"] = True

async def get_surah_verses(surah_number: int, language: str = "en", reciter: str = "yasser_dossari"):
    """Fetch verses for a specific surah with translations"""
    cache_key = f"surah_{surah_number}_{language}"
    
    # Check MongoDB cache first
    cached = await db.quran_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached and cached.get("data"):
        return cached["data"]
    
    # Get translation ID
    trans_info = SUPPORTED_TRANSLATIONS.get(language, SUPPORTED_TRANSLATIONS["en"])
    trans_id = trans_info["id"]
    
    # Get reciter info
    reciter_info = RECITERS.get(reciter, RECITERS["yasser_dossari"])
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            # Fetch Arabic text
            ar_response = await http_client.get(f"https://api.alquran.cloud/v1/surah/{surah_number}")
            ar_data = ar_response.json() if ar_response.status_code == 200 else None
            
            # Fetch translation
            trans_response = await http_client.get(f"https://api.alquran.cloud/v1/surah/{surah_number}/{trans_id}")
            trans_data = trans_response.json() if trans_response.status_code == 200 else None
            
            if ar_data and ar_data.get("status") == "OK":
                verses = []
                ar_ayahs = ar_data["data"]["ayahs"]
                trans_ayahs = trans_data["data"]["ayahs"] if trans_data and trans_data.get("status") == "OK" else []
                
                for i, ar_ayah in enumerate(ar_ayahs):
                    # Build audio URL based on reciter
                    if reciter == "yasser_dossari":
                        # Yasser Al-Dossari format: {surah:03d}{ayah:03d}.mp3
                        audio_url = f"{reciter_info['audio_base_url']}/{surah_number:03d}{ar_ayah['numberInSurah']:03d}.mp3"
                    else:
                        # Islamic.network format
                        audio_url = f"{reciter_info['audio_base_url']}/{ar_ayah['number']}.mp3"
                    
                    verse = {
                        "surah": surah_number,
                        "ayah": ar_ayah["numberInSurah"],
                        "ayah_global": ar_ayah["number"],
                        "arabic": ar_ayah["text"],
                        "translation": trans_ayahs[i]["text"] if i < len(trans_ayahs) else None,
                        "translation_language": language,
                        "audio_url": audio_url,
                        "reciter": reciter_info["name"]
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

# ==================== RAG / LIBRARY SYSTEM ====================

# Simple in-memory vector store for library embeddings
LIBRARY_EMBEDDINGS = []
LIBRARY_CHUNKS = []

# Sample library metadata (will be populated when PDFs are uploaded)
LIBRARY_BOOKS = {
    "mukashafatul_quloob": {
        "title": "Mukashafatul Quloob",
        "author": "Imam Al-Ghazali",
        "topics": ["spiritual purification", "heart softening", "tazkiyah"],
        "language": "ar"
    },
    "muntakhab_ahadees": {
        "title": "Muntakhab Ahadees",
        "author": "Maulana Yusuf Kandhalvi",
        "topics": ["sahaba stories", "hadith", "kalimah", "salat", "ilm"],
        "language": "ur_roman"
    },
    "shifa_shareef": {
        "title": "Ash-Shifa",
        "author": "Qadi Iyad",
        "topics": ["seerah", "prophet rights", "prophet character"],
        "language": "ur_roman"
    }
}

def get_simple_embedding(text: str) -> List[float]:
    """Generate a simple TF-IDF-like embedding for text (fallback when sentence-transformers not available)"""
    # Simple word frequency based embedding
    words = text.lower().split()
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Create a fixed-size embedding
    embedding = [0.0] * 384  # Match sentence-transformer dimension
    for i, (word, freq) in enumerate(sorted(word_freq.items())[:384]):
        embedding[i % 384] = freq / len(words)
    
    # Normalize
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = [x / norm for x in embedding]
    
    return embedding

async def search_library(query: str, top_k: int = 4) -> List[Dict]:
    """Search library using cosine similarity"""
    if not LIBRARY_CHUNKS:
        return []
    
    query_embedding = get_simple_embedding(query)
    
    similarities = []
    for i, chunk in enumerate(LIBRARY_CHUNKS):
        if chunk.get("embedding"):
            sim = cosine_similarity([query_embedding], [chunk["embedding"]])[0][0]
            similarities.append((sim, chunk))
    
    # Sort by similarity
    similarities.sort(key=lambda x: x[0], reverse=True)
    
    return [chunk for _, chunk in similarities[:top_k]]

async def add_library_chunk(book_name: str, page_number: int, content: str):
    """Add a chunk to the library with embedding"""
    chunk = {
        "id": str(uuid.uuid4()),
        "book_name": book_name,
        "page_number": page_number,
        "content": content,
        "embedding": get_simple_embedding(content)
    }
    LIBRARY_CHUNKS.append(chunk)
    
    # Also store in MongoDB for persistence
    await db.library_chunks.insert_one({
        "id": chunk["id"],
        "book_name": book_name,
        "page_number": page_number,
        "content": content,
        "embedding": chunk["embedding"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return chunk

async def load_library_from_db():
    """Load library chunks from MongoDB on startup"""
    global LIBRARY_CHUNKS
    chunks = await db.library_chunks.find({}, {"_id": 0}).to_list(10000)
    LIBRARY_CHUNKS = chunks
    logger.info(f"Loaded {len(LIBRARY_CHUNKS)} library chunks from database")

# ==================== AI CHAT WITH RAG ====================

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

SYSTEM_PROMPT_RAG = """You are Tilawa AI (تلاوة), a knowledgeable Islamic assistant with access to a curated library of Islamic literature.

When answering questions, you MUST:
1. Use the provided library context to give accurate, sourced answers
2. Always cite your sources like: "As mentioned in Mukashafatul Quloob by Imam Ghazali..." or "In Muntakhab Ahadees, it is narrated that..."
3. If the library context doesn't contain relevant information, say so and provide general Islamic guidance
4. Be respectful and use proper Islamic etiquette

Library Books Available:
- Mukashafatul Quloob (Imam Ghazali): Spiritual purification and heart softening
- Muntakhab Ahadees: Sahaba stories and core Hadith principles
- Ash-Shifa (Qadi Iyad): Seerah and rights of Prophet Muhammad (PBUH)

LIBRARY CONTEXT:
{library_context}

Now answer the user's question using the above context."""

async def chat_with_rag(message: str, session_id: str, research_mode: bool = False, language: str = "en"):
    """Chat with optional RAG from library"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        return "AI service not configured"
    
    # Build system prompt
    if research_mode and LIBRARY_CHUNKS:
        # Search library for relevant context
        relevant_chunks = await search_library(message, top_k=4)
        if relevant_chunks:
            library_context = "\n\n".join([
                f"[{chunk['book_name']}, Page {chunk['page_number']}]\n{chunk['content']}"
                for chunk in relevant_chunks
            ])
            system_prompt = SYSTEM_PROMPT_RAG.format(library_context=library_context)
        else:
            system_prompt = SYSTEM_PROMPT
    else:
        system_prompt = SYSTEM_PROMPT
    
    # Add language instruction
    if language != "en":
        lang_name = SUPPORTED_TRANSLATIONS.get(language, {}).get("name", "English")
        system_prompt += f"\n\nPlease respond in {lang_name} language when appropriate."
    
    # Initialize chat
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")
    
    try:
        user_msg = UserMessage(text=message)
        response = await chat.send_message(user_msg)
        
        # Save to MongoDB
        await db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()},
                            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat(), "research_mode": research_mode}
                        ]
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"id": session_id, "created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return f"I apologize, I encountered an error: {str(e)}"

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Tilawa API - Quranic Ecosystem with RAG", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Translations & Languages
@api_router.get("/translations")
async def get_translations():
    """Get all supported translations"""
    return SUPPORTED_TRANSLATIONS

@api_router.get("/reciters")
async def get_reciters():
    """Get all supported reciters"""
    return RECITERS

# Surah Routes
@api_router.get("/surahs")
async def get_surahs():
    """Get list of all 114 surahs"""
    await load_quran_data()
    return QURAN_CACHE["surahs"]

@api_router.get("/surah/{surah_number}")
async def get_surah(
    surah_number: int, 
    language: str = "en",
    reciter: str = "yasser_dossari"
):
    """Get surah info and verses with translation"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=400, detail="Surah number must be between 1 and 114")
    
    await load_quran_data()
    
    surah_info = next((s for s in QURAN_CACHE["surahs"] if s["number"] == surah_number), None)
    verses = await get_surah_verses(surah_number, language, reciter)
    
    trans_info = SUPPORTED_TRANSLATIONS.get(language, SUPPORTED_TRANSLATIONS["en"])
    
    return {
        "info": surah_info,
        "verses": verses,
        "translation": trans_info,
        "reciter": RECITERS.get(reciter, RECITERS["yasser_dossari"])
    }

@api_router.get("/verse/{surah_number}/{ayah_number}")
async def get_verse(
    surah_number: int, 
    ayah_number: int,
    language: str = "en",
    reciter: str = "yasser_dossari"
):
    """Get a specific verse with translations"""
    verses = await get_surah_verses(surah_number, language, reciter)
    verse = next((v for v in verses if v["ayah"] == ayah_number), None)
    
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    return verse

@api_router.get("/search")
async def search_quran(q: str = Query(..., min_length=2), language: str = "en"):
    """Search Quran by text"""
    trans_info = SUPPORTED_TRANSLATIONS.get(language, SUPPORTED_TRANSLATIONS["en"])
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(f"https://api.alquran.cloud/v1/search/{q}/all/{trans_info['id']}")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    return data["data"]
        except Exception as e:
            logger.error(f"Search error: {e}")
    
    return {"count": 0, "matches": []}

# AI Chat Routes
@api_router.post("/chat")
async def chat(request: ChatRequest):
    """Chat with AI (supports research mode for RAG)"""
    session_id = request.session_id or str(uuid.uuid4())
    
    response = await chat_with_rag(
        request.message, 
        session_id, 
        request.research_mode,
        request.language
    )
    
    return {"response": response, "session_id": session_id, "research_mode": request.research_mode}

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        return {"messages": []}
    return {"messages": session.get("messages", [])}

# Library Routes
@api_router.get("/library/books")
async def get_library_books():
    """Get list of available library books"""
    return LIBRARY_BOOKS

@api_router.get("/library/chunks")
async def get_library_chunks(book_name: Optional[str] = None, limit: int = 100):
    """Get library chunks (optionally filtered by book)"""
    if book_name:
        chunks = [c for c in LIBRARY_CHUNKS if c.get("book_name") == book_name]
    else:
        chunks = LIBRARY_CHUNKS
    
    # Remove embeddings from response
    return [
        {k: v for k, v in chunk.items() if k != "embedding"}
        for chunk in chunks[:limit]
    ]

@api_router.post("/library/search")
async def search_library_endpoint(q: str = Query(..., min_length=2)):
    """Search library using semantic search"""
    results = await search_library(q, top_k=5)
    return [
        {k: v for k, v in chunk.items() if k != "embedding"}
        for chunk in results
    ]

@api_router.post("/library/upload")
async def upload_library_file(file: UploadFile = File(...), book_name: str = "unknown"):
    """Upload a PDF or text file to the library"""
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    content = await file.read()
    
    try:
        if file.filename.endswith('.pdf'):
            import pdfplumber
            import io
            
            chunks_added = 0
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        # Chunk with 700 chars, 150 overlap
                        chunk_size = 700
                        overlap = 150
                        for i in range(0, len(text), chunk_size - overlap):
                            chunk_text = text[i:i + chunk_size]
                            if len(chunk_text.strip()) > 50:
                                await add_library_chunk(book_name, page_num + 1, chunk_text)
                                chunks_added += 1
            
            return {"status": "success", "chunks_added": chunks_added, "book_name": book_name}
        
        else:  # .txt file
            text = content.decode('utf-8')
            chunk_size = 700
            overlap = 150
            chunks_added = 0
            
            for i in range(0, len(text), chunk_size - overlap):
                chunk_text = text[i:i + chunk_size]
                if len(chunk_text.strip()) > 50:
                    await add_library_chunk(book_name, i // (chunk_size - overlap) + 1, chunk_text)
                    chunks_added += 1
            
            return {"status": "success", "chunks_added": chunks_added, "book_name": book_name}
    
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    """Load data on startup"""
    await load_quran_data()
    await load_library_from_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
