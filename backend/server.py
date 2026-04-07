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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="TILAWA API", description="Quranic Ecosystem with RAG & Local Data")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    research_mode: bool = False
    language: str = "en"

class VerseData(BaseModel):
    surah: int
    ayah: int
    arabic: str
    translation: Optional[str] = None

# ==================== TILAWA DESIGN TOKENS ====================

TILAWA_COLORS = {
    "dark": {
        "bgBase": "#0A0E14",
        "bgSurface": "#111820",
        "bgSurface2": "#192130",
        "green": "#1A6B4A",
        "gold": "#C9A84C",
        "goldLight": "#E8C96A",
        "textArabic": "#F0ECD8",
        "textSecondary": "#9AAABB",
        "textMuted": "#5A6A7A"
    },
    "parchment": {
        "bgParchment": "#F5EDD6",
        "textBrown": "#2C1810",
        "goldDark": "#8B6914"
    },
    "tajweed": {
        "ikhfa": "#27AE60",
        "idgham": "#3498DB",
        "ghunnah": "#F39C12",
        "qalqalah": "#E74C3C",
        "madd": "#9B59B6"
    }
}

# ==================== MULTILINGUAL TRANSLATIONS ====================

SUPPORTED_TRANSLATIONS = {
    "hi": {"id": "hi.hindi", "name": "Hindi", "direction": "ltr"},
    "ur": {"id": "ur.jalandhry", "name": "Urdu (Jalandhry)", "direction": "rtl"},
    "ur_mufti_taqi": {"id": "ur.muftiTaqiUsmani", "name": "Urdu (Mufti Taqi Usmani)", "direction": "rtl"},
    "te": {"id": "te.telugu", "name": "Telugu", "direction": "ltr"},
    "ta": {"id": "ta.tamil", "name": "Tamil", "direction": "ltr"},
    "kn": {"id": "kn.kannada", "name": "Kannada", "direction": "ltr"},
    "ml": {"id": "ml.malayalam", "name": "Malayalam", "direction": "ltr"},
    "mr": {"id": "mr.marathi", "name": "Marathi", "direction": "ltr"},
    "pa": {"id": "pa.punjabi", "name": "Punjabi", "direction": "ltr"},
    "bn": {"id": "bn.bengali", "name": "Bengali", "direction": "ltr"},
    "gu": {"id": "gu.gujarati", "name": "Gujarati", "direction": "ltr"},
    "en": {"id": "en.asad", "name": "English (Asad)", "direction": "ltr"},
    "en_sahih": {"id": "en.sahih", "name": "English (Sahih Intl)", "direction": "ltr"},
    "ar": {"id": "quran-simple", "name": "Arabic (Simple)", "direction": "rtl"},
    "tr": {"id": "tr.ates", "name": "Turkish", "direction": "ltr"},
    "id": {"id": "id.indonesian", "name": "Indonesian", "direction": "ltr"},
    "fr": {"id": "fr.hamidullah", "name": "French", "direction": "ltr"},
    "de": {"id": "de.aburida", "name": "German", "direction": "ltr"},
}

# ==================== RECITERS ====================

RECITERS = {
    "yasser_dossari": {
        "id": "yasser_dossari",
        "name": "Yasser Al-Dossari",
        "style": "Murattal",
        "audio_format": "everyayah",
        "audio_base_url": "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps"
    },
    "alafasy": {
        "id": "alafasy",
        "name": "Mishary Rashid Alafasy",
        "style": "Murattal",
        "audio_format": "islamic_network",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.alafasy"
    },
    "sudais": {
        "id": "sudais",
        "name": "Abdul Rahman Al-Sudais",
        "style": "Murattal",
        "audio_format": "islamic_network",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais"
    },
    "minshawi": {
        "id": "minshawi",
        "name": "Mohamed Siddiq El-Minshawi",
        "style": "Mujawwad",
        "audio_format": "islamic_network",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.minshawi"
    },
    "husary": {
        "id": "husary",
        "name": "Mahmoud Khalil Al-Husary",
        "style": "Murattal",
        "audio_format": "islamic_network",
        "audio_base_url": "https://cdn.islamic.network/quran/audio/128/ar.husary"
    }
}

# ==================== LOCAL QURAN DATA ====================

QURAN_LOCAL = {
    "verses": {},  # {surah_number: {ayah_number: arabic_text}}
    "surahs": [],
    "loaded": False
}

# Surah metadata (Tanzil format)
SURAH_METADATA = [
    {"number": 1, "name": "سُورَةُ ٱلْفَاتِحَةِ", "englishName": "Al-Faatiha", "englishNameTranslation": "The Opening", "numberOfAyahs": 7, "revelationType": "Meccan"},
    {"number": 2, "name": "سُورَةُ البَقَرَةِ", "englishName": "Al-Baqara", "englishNameTranslation": "The Cow", "numberOfAyahs": 286, "revelationType": "Medinan"},
    {"number": 3, "name": "سُورَةُ آلِ عِمۡرَانَ", "englishName": "Aal-i-Imraan", "englishNameTranslation": "The Family of Imraan", "numberOfAyahs": 200, "revelationType": "Medinan"},
    {"number": 4, "name": "سُورَةُ النِّسَاءِ", "englishName": "An-Nisaa", "englishNameTranslation": "The Women", "numberOfAyahs": 176, "revelationType": "Medinan"},
    {"number": 5, "name": "سُورَةُ المَائـِدَةِ", "englishName": "Al-Maaida", "englishNameTranslation": "The Table", "numberOfAyahs": 120, "revelationType": "Medinan"},
    {"number": 6, "name": "سُورَةُ الأَنۡعَامِ", "englishName": "Al-An'aam", "englishNameTranslation": "The Cattle", "numberOfAyahs": 165, "revelationType": "Meccan"},
    {"number": 7, "name": "سُورَةُ الأَعۡرَافِ", "englishName": "Al-A'raaf", "englishNameTranslation": "The Heights", "numberOfAyahs": 206, "revelationType": "Meccan"},
    {"number": 8, "name": "سُورَةُ الأَنفَالِ", "englishName": "Al-Anfaal", "englishNameTranslation": "The Spoils of War", "numberOfAyahs": 75, "revelationType": "Medinan"},
    {"number": 9, "name": "سُورَةُ التَّوۡبَةِ", "englishName": "At-Tawba", "englishNameTranslation": "The Repentance", "numberOfAyahs": 129, "revelationType": "Medinan"},
    {"number": 10, "name": "سُورَةُ يُونُسَ", "englishName": "Yunus", "englishNameTranslation": "Jonah", "numberOfAyahs": 109, "revelationType": "Meccan"},
]

def load_local_quran():
    """Load Quran from local tanzil file"""
    global QURAN_LOCAL
    
    if QURAN_LOCAL["loaded"]:
        return
    
    quran_file = ROOT_DIR / "data" / "quran-simple-plain.txt"
    
    if not quran_file.exists():
        logger.warning(f"Quran file not found: {quran_file}")
        return
    
    try:
        with open(quran_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                parts = line.split('|')
                if len(parts) >= 3:
                    surah = int(parts[0])
                    ayah = int(parts[1])
                    text = parts[2]
                    
                    if surah not in QURAN_LOCAL["verses"]:
                        QURAN_LOCAL["verses"][surah] = {}
                    
                    QURAN_LOCAL["verses"][surah][ayah] = text
        
        QURAN_LOCAL["loaded"] = True
        total_verses = sum(len(ayahs) for ayahs in QURAN_LOCAL["verses"].values())
        logger.info(f"Loaded {total_verses} verses from local Quran file (114 surahs)")
        
    except Exception as e:
        logger.error(f"Error loading local Quran: {e}")

def get_local_verse(surah: int, ayah: int) -> Optional[str]:
    """Get verse from local data"""
    load_local_quran()
    return QURAN_LOCAL["verses"].get(surah, {}).get(ayah)

def get_local_surah(surah_number: int) -> List[Dict]:
    """Get all verses for a surah from local data"""
    load_local_quran()
    
    surah_verses = QURAN_LOCAL["verses"].get(surah_number, {})
    verses = []
    
    for ayah_num in sorted(surah_verses.keys()):
        verses.append({
            "surah": surah_number,
            "ayah": ayah_num,
            "arabic": surah_verses[ayah_num]
        })
    
    return verses

# ==================== RAG LIBRARY SYSTEM ====================

LIBRARY_CHUNKS = []

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
    """Generate simple embedding for RAG"""
    words = text.lower().split()
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    embedding = [0.0] * 384
    for i, (word, freq) in enumerate(sorted(word_freq.items())[:384]):
        embedding[i % 384] = freq / max(len(words), 1)
    
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = [x / norm for x in embedding]
    
    return embedding

async def ingest_pdf_to_library(pdf_path: str, book_name: str):
    """Ingest PDF into library with chunking"""
    global LIBRARY_CHUNKS
    
    try:
        import pdfplumber
        
        chunks_added = 0
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    # Chunk: 700 chars, 150 overlap
                    chunk_size = 700
                    overlap = 150
                    
                    for i in range(0, len(text), chunk_size - overlap):
                        chunk_text = text[i:i + chunk_size].strip()
                        if len(chunk_text) > 50:
                            chunk = {
                                "id": str(uuid.uuid4()),
                                "book_name": book_name,
                                "page_number": page_num + 1,
                                "content": chunk_text,
                                "embedding": get_simple_embedding(chunk_text)
                            }
                            LIBRARY_CHUNKS.append(chunk)
                            
                            # Store in MongoDB
                            await db.library_chunks.insert_one({
                                "id": chunk["id"],
                                "book_name": book_name,
                                "page_number": page_num + 1,
                                "content": chunk_text,
                                "embedding": chunk["embedding"],
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
                            chunks_added += 1
        
        logger.info(f"Ingested {chunks_added} chunks from {book_name}")
        return chunks_added
        
    except Exception as e:
        logger.error(f"Error ingesting PDF: {e}")
        return 0

async def search_library(query: str, top_k: int = 4) -> List[Dict]:
    """Search library using cosine similarity"""
    if not LIBRARY_CHUNKS:
        return []
    
    query_embedding = get_simple_embedding(query)
    
    similarities = []
    for chunk in LIBRARY_CHUNKS:
        if chunk.get("embedding"):
            sim = cosine_similarity([query_embedding], [chunk["embedding"]])[0][0]
            similarities.append((sim, chunk))
    
    similarities.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in similarities[:top_k]]

async def load_library_from_db():
    """Load library chunks from MongoDB"""
    global LIBRARY_CHUNKS
    chunks = await db.library_chunks.find({}, {"_id": 0}).to_list(10000)
    LIBRARY_CHUNKS = chunks
    logger.info(f"Loaded {len(LIBRARY_CHUNKS)} library chunks from database")

# ==================== FETCH TRANSLATION FROM API ====================

async def fetch_translation(surah: int, language: str = "en") -> Dict[int, str]:
    """Fetch translation from alquran.cloud API"""
    trans_info = SUPPORTED_TRANSLATIONS.get(language, SUPPORTED_TRANSLATIONS["en"])
    cache_key = f"trans_{surah}_{language}"
    
    # Check cache
    cached = await db.translation_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached and cached.get("data"):
        # Convert string keys back to int
        return {int(k): v for k, v in cached["data"].items()}
    
    translations = {}
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            response = await http_client.get(f"https://api.alquran.cloud/v1/surah/{surah}/{trans_info['id']}")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    for ayah in data["data"]["ayahs"]:
                        translations[ayah["numberInSurah"]] = ayah["text"]
                    
                    # Cache with string keys (MongoDB requirement)
                    cache_data = {str(k): v for k, v in translations.items()}
                    await db.translation_cache.update_one(
                        {"key": cache_key},
                        {"$set": {"key": cache_key, "data": cache_data, "cached_at": datetime.now(timezone.utc).isoformat()}},
                        upsert=True
                    )
        except Exception as e:
            logger.error(f"Error fetching translation: {e}")
    
    return translations

# ==================== AI CHAT ====================

SYSTEM_PROMPT = """You are Tilawa AI (تلاوة), a knowledgeable Islamic assistant specialized in Quranic studies.

Your expertise includes Tafseer, Tajweed, Arabic grammar, Asbab al-Nuzul, and Sahih Hadith.

Guidelines:
- Provide authentic, respectful Islamic context
- Cite sources when possible
- Be gentle and encouraging
- If unsure, say so
- Respect all Islamic schools of thought"""

SYSTEM_PROMPT_RAG = """You are Tilawa AI with access to Islamic literature including Mukashafatul Quloob (Imam Ghazali) and other texts.

When answering:
1. Use the provided library context for sourced answers
2. Cite sources: "As mentioned in Mukashafatul Quloob..."
3. If context is insufficient, provide general Islamic guidance

LIBRARY CONTEXT:
{library_context}

Answer the user's question using the above context."""

async def chat_with_ai(message: str, session_id: str, research_mode: bool = False, language: str = "en"):
    """Chat with AI, optionally using RAG"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        return "AI service not configured"
    
    if research_mode and LIBRARY_CHUNKS:
        relevant = await search_library(message, top_k=4)
        if relevant:
            context = "\n\n".join([f"[{c['book_name']}, Page {c['page_number']}]\n{c['content']}" for c in relevant])
            system = SYSTEM_PROMPT_RAG.format(library_context=context)
        else:
            system = SYSTEM_PROMPT
    else:
        system = SYSTEM_PROMPT
    
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system).with_model("openai", "gpt-4o")
    
    try:
        response = await chat.send_message(UserMessage(text=message))
        
        await db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {"messages": {"$each": [
                    {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()},
                    {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                ]}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"id": session_id, "created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return f"Error: {str(e)}"

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "TILAWA API - Quranic Ecosystem", "version": "2.0.0", "local_quran": QURAN_LOCAL["loaded"]}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "local_verses": sum(len(a) for a in QURAN_LOCAL["verses"].values()), "library_chunks": len(LIBRARY_CHUNKS)}

@api_router.get("/design-tokens")
async def get_design_tokens():
    """Get TILAWA design system tokens"""
    return TILAWA_COLORS

@api_router.get("/translations")
async def get_translations():
    return SUPPORTED_TRANSLATIONS

@api_router.get("/reciters")
async def get_reciters():
    return RECITERS

# ==================== SURAH ROUTES ====================

@api_router.get("/surahs")
async def get_surahs():
    """Get all 114 surahs metadata"""
    # Load full metadata from API if not cached
    cached = await db.surah_metadata.find({}, {"_id": 0}).to_list(200)
    if len(cached) >= 114:
        return cached
    
    # Fetch from API
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            response = await http_client.get("https://api.alquran.cloud/v1/surah")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    surahs = data["data"]
                    # Cache
                    for s in surahs:
                        await db.surah_metadata.update_one(
                            {"number": s["number"]},
                            {"$set": s},
                            upsert=True
                        )
                    return surahs
        except Exception as e:
            logger.error(f"Error fetching surahs: {e}")
    
    return SURAH_METADATA  # Fallback

@api_router.get("/surah/{surah_number}")
async def get_surah(surah_number: int, language: str = "en", reciter: str = "yasser_dossari"):
    """Get surah with local Arabic + API translation"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=400, detail="Surah must be 1-114")
    
    # Get local Arabic verses
    local_verses = get_local_surah(surah_number)
    
    # Fetch translation
    translations = await fetch_translation(surah_number, language)
    
    # Get reciter info
    reciter_info = RECITERS.get(reciter, RECITERS["yasser_dossari"])
    
    # Get surah metadata
    surahs = await get_surahs()
    surah_info = next((s for s in surahs if s["number"] == surah_number), None)
    
    # Build verses with audio URLs
    verses = []
    global_ayah = sum(s.get("numberOfAyahs", 0) for s in surahs[:surah_number-1]) if surahs else 0
    
    for v in local_verses:
        global_ayah += 1
        
        if reciter_info["audio_format"] == "everyayah":
            audio_url = f"{reciter_info['audio_base_url']}/{surah_number:03d}{v['ayah']:03d}.mp3"
        else:
            audio_url = f"{reciter_info['audio_base_url']}/{global_ayah}.mp3"
        
        verses.append({
            "surah": surah_number,
            "ayah": v["ayah"],
            "ayah_global": global_ayah,
            "arabic": v["arabic"],
            "translation": translations.get(v["ayah"]),
            "audio_url": audio_url,
            "reciter": reciter_info["name"]
        })
    
    return {
        "info": surah_info,
        "verses": verses,
        "translation": SUPPORTED_TRANSLATIONS.get(language),
        "reciter": reciter_info,
        "design": TILAWA_COLORS
    }

@api_router.get("/mushaf/{surah_number}")
async def get_mushaf(surah_number: int, language: str = "en", reciter: str = "yasser_dossari"):
    """Mushaf screen endpoint - same as surah but with design tokens"""
    return await get_surah(surah_number, language, reciter)

@api_router.get("/verse/{surah}/{ayah}")
async def get_verse(surah: int, ayah: int, language: str = "en", reciter: str = "yasser_dossari"):
    """Get single verse"""
    arabic = get_local_verse(surah, ayah)
    if not arabic:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    translations = await fetch_translation(surah, language)
    reciter_info = RECITERS.get(reciter, RECITERS["yasser_dossari"])
    
    if reciter_info["audio_format"] == "everyayah":
        audio_url = f"{reciter_info['audio_base_url']}/{surah:03d}{ayah:03d}.mp3"
    else:
        surahs = await get_surahs()
        global_ayah = sum(s.get("numberOfAyahs", 0) for s in surahs[:surah-1]) + ayah
        audio_url = f"{reciter_info['audio_base_url']}/{global_ayah}.mp3"
    
    return {
        "surah": surah,
        "ayah": ayah,
        "arabic": arabic,
        "translation": translations.get(ayah),
        "audio_url": audio_url,
        "reciter": reciter_info["name"]
    }

# ==================== AI CHAT ====================

@api_router.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    response = await chat_with_ai(request.message, session_id, request.research_mode, request.language)
    return {"response": response, "session_id": session_id, "research_mode": request.research_mode}

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    return {"messages": session.get("messages", []) if session else []}

# ==================== LIBRARY ====================

@api_router.get("/library/books")
async def get_library_books():
    return LIBRARY_BOOKS

@api_router.get("/library/chunks")
async def get_library_chunks(book_name: Optional[str] = None, limit: int = 100):
    chunks = [c for c in LIBRARY_CHUNKS if not book_name or c.get("book_name") == book_name]
    return [{k: v for k, v in c.items() if k != "embedding"} for c in chunks[:limit]]

@api_router.post("/library/search")
async def search_library_api(q: str = Query(..., min_length=2)):
    results = await search_library(q, top_k=5)
    return [{k: v for k, v in c.items() if k != "embedding"} for c in results]

@api_router.post("/library/ingest")
async def ingest_library():
    """Ingest the Mukashafatul Quloob PDF"""
    pdf_path = ROOT_DIR / "data" / "Mukashafatul_Quloob.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    
    chunks = await ingest_pdf_to_library(str(pdf_path), "mukashafatul_quloob")
    return {"status": "success", "chunks_ingested": chunks}

# ==================== TAJWEED ====================

TAJWEED_LESSONS = [
    {"id": 1, "name": "Ikhfa", "arabic": "إخفاء", "color": "#27AE60", "letters": "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
     "description": "Hiding - Noon saakin/tanween followed by 15 letters is pronounced with light nasalization.",
     "examples": [{"arabic": "مِن تَحْتِهَا", "transliteration": "min tahtiha", "meaning": "from beneath it"}]},
    {"id": 2, "name": "Idgham", "arabic": "إدغام", "color": "#3498DB", "letters": "ي ر م ل و ن",
     "description": "Merging - Noon saakin/tanween merges into following letters (يرملون).",
     "examples": [{"arabic": "مِن رَّبِّهِمْ", "transliteration": "mir rabbihim", "meaning": "from their Lord"}]},
    {"id": 3, "name": "Iqlab", "arabic": "إقلاب", "color": "#F39C12", "letters": "ب",
     "description": "Conversion - Noon saakin/tanween before ب converts to meem with nasalization.",
     "examples": [{"arabic": "مِن بَعْدِ", "transliteration": "mim ba'di", "meaning": "from after"}]},
    {"id": 4, "name": "Qalqalah", "arabic": "قلقلة", "color": "#E74C3C", "letters": "ق ط ب ج د",
     "description": "Echo - Letters قطبجد with sukoon create a bouncing sound.",
     "examples": [{"arabic": "يَخْلُقْ", "transliteration": "yakhluq", "meaning": "He creates"}]},
    {"id": 5, "name": "Ghunnah", "arabic": "غنة", "color": "#9B59B6", "letters": "ن م",
     "description": "Nasalization - 2-beat nasal sound on noon/meem with shaddah.",
     "examples": [{"arabic": "إِنَّ", "transliteration": "inna", "meaning": "indeed"}]},
]

@api_router.get("/tajweed/lessons")
async def get_tajweed_lessons():
    return TAJWEED_LESSONS

@api_router.get("/tajweed/lesson/{lesson_id}")
async def get_tajweed_lesson(lesson_id: int):
    lesson = next((l for l in TAJWEED_LESSONS if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

# ==================== SEARCH ====================

@api_router.get("/search")
async def search_quran(q: str = Query(..., min_length=2)):
    """Search local Quran data"""
    load_local_quran()
    results = []
    query_lower = q.lower()
    
    for surah_num, ayahs in QURAN_LOCAL["verses"].items():
        for ayah_num, text in ayahs.items():
            if q in text:  # Arabic search
                results.append({
                    "surah": surah_num,
                    "ayah": ayah_num,
                    "text": text,
                    "match_type": "arabic"
                })
    
    return {"count": len(results), "matches": results[:50]}

# ==================== SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    load_local_quran()
    await load_library_from_db()
    
    # Auto-ingest PDF if library is empty
    if len(LIBRARY_CHUNKS) == 0:
        pdf_path = ROOT_DIR / "data" / "Mukashafatul_Quloob.pdf"
        if pdf_path.exists():
            logger.info("Auto-ingesting Mukashafatul Quloob PDF...")
            await ingest_pdf_to_library(str(pdf_path), "mukashafatul_quloob")

@app.on_event("shutdown")
async def shutdown():
    client.close()
