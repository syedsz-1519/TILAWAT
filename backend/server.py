from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

QURAN_API = "https://api.quran.com/api/v4"
QDC_API = "https://api.qurancdn.com/api/qdc"

app = FastAPI(title="TILAWA API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ── Pydantic Models ──
class BookmarkCreate(BaseModel):
    verse_key: str
    note: str = ""
    surah_name: str = ""
    text_uthmani: str = ""
    translation_en: str = ""

class TajweedSessionCreate(BaseModel):
    verse_key: str


# ── Quran.com API Helpers ──
async def fetch_from_quran_api(path: str, params: dict = None):
    async with httpx.AsyncClient(timeout=30.0) as http:
        resp = await http.get(f"{QURAN_API}{path}", params=params or {})
        resp.raise_for_status()
        return resp.json()

async def fetch_from_qdc_api(path: str, params: dict = None):
    async with httpx.AsyncClient(timeout=30.0) as http:
        resp = await http.get(f"{QDC_API}{path}", params=params or {})
        resp.raise_for_status()
        return resp.json()


# ── Cache: Surahs ──
async def get_cached_surahs():
    cached = await db.surahs.find({}, {"_id": 0}).sort("id", 1).to_list(114)
    if cached:
        return cached
    try:
        data = await fetch_from_quran_api("/chapters", {"language": "en"})
        surahs = data.get("chapters", [])
        if surahs:
            await db.surahs.delete_many({})
            await db.surahs.insert_many(surahs)
            return await db.surahs.find({}, {"_id": 0}).sort("id", 1).to_list(114)
    except Exception as e:
        logger.error(f"Failed to fetch surahs: {e}")
    return []


# ── Cache: Verses ──
async def get_cached_verses(surah_id: int):
    cached = await db.verses.find(
        {"surah_id": surah_id}, {"_id": 0}
    ).sort("verse_number", 1).to_list(300)
    if cached:
        return cached

    all_verses = []
    page = 1
    try:
        while True:
            data = await fetch_from_quran_api(
                f"/verses/by_chapter/{surah_id}",
                {
                    "language": "en",
                    "words": "true",
                    "translations": "20",
                    "fields": "text_uthmani,text_imlaei",
                    "word_fields": "text_uthmani,text_transliteration,audio_url",
                    "per_page": 50,
                    "page": page,
                }
            )
            verses_raw = data.get("verses", [])
            pagination = data.get("pagination", {})

            for v in verses_raw:
                words = []
                for w in v.get("words", []):
                    tr = w.get("translation")
                    tr_text = ""
                    if isinstance(tr, dict):
                        tr_text = tr.get("text", "")
                    elif isinstance(tr, str):
                        tr_text = tr
                    words.append({
                        "position": w.get("position", 0),
                        "text_uthmani": w.get("text_uthmani", ""),
                        "text_transliteration": w.get("text_transliteration", ""),
                        "translation": tr_text,
                        "char_type": w.get("char_type_name", "word"),
                        "audio_url": w.get("audio_url", ""),
                    })

                translations = v.get("translations", [])
                translation_en = ""
                if translations:
                    raw = translations[0].get("text", "")
                    # Strip HTML tags from translation
                    import re
                    translation_en = re.sub(r'<[^>]+>', '', raw)

                all_verses.append({
                    "surah_id": surah_id,
                    "verse_number": v.get("verse_number", 0),
                    "verse_key": v.get("verse_key", ""),
                    "text_uthmani": v.get("text_uthmani", ""),
                    "text_imlaei": v.get("text_imlaei", ""),
                    "juz_number": v.get("juz_number"),
                    "page_number": v.get("page_number"),
                    "hizb_number": v.get("hizb_number"),
                    "words": words,
                    "translation_en": translation_en,
                })

            if not pagination.get("next_page"):
                break
            page = pagination["next_page"]
            await asyncio.sleep(0.3)

    except Exception as e:
        logger.error(f"Failed to fetch verses for surah {surah_id}: {e}")
        return []

    if all_verses:
        await db.verses.delete_many({"surah_id": surah_id})
        await db.verses.insert_many(all_verses)
        return await db.verses.find(
            {"surah_id": surah_id}, {"_id": 0}
        ).sort("verse_number", 1).to_list(300)
    return []


# ── Cache: Audio Timings ──
async def get_cached_audio_timings(surah_id: int, reciter_id: int = 7):
    cached = await db.audio_timings.find_one(
        {"surah_id": surah_id, "reciter_id": reciter_id}, {"_id": 0}
    )
    if cached:
        return cached

    try:
        data = await fetch_from_qdc_api(
            f"/audio/reciters/{reciter_id}/audio_files",
            {"chapter": surah_id, "segments": "true"}
        )
        audio_files = data.get("audio_files", [])
        if not audio_files:
            return None

        af = audio_files[0]
        timing_doc = {
            "surah_id": surah_id,
            "reciter_id": reciter_id,
            "audio_url": af.get("audio_url", ""),
            "verse_timings": af.get("verse_timings", []),
        }

        await db.audio_timings.delete_many({"surah_id": surah_id, "reciter_id": reciter_id})
        await db.audio_timings.insert_one(timing_doc)
        return await db.audio_timings.find_one(
            {"surah_id": surah_id, "reciter_id": reciter_id}, {"_id": 0}
        )
    except Exception as e:
        logger.error(f"Failed to fetch audio timings for surah {surah_id}: {e}")
    return None


# ══════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════

@api.get("/")
async def root():
    return {"message": "TILAWA API — Bismillah"}


# ── Surahs ──
@api.get("/surahs")
async def get_surahs():
    surahs = await get_cached_surahs()
    return {"surahs": surahs, "total": len(surahs)}


@api.get("/surahs/{surah_id}")
async def get_surah(surah_id: int):
    surahs = await get_cached_surahs()
    surah = next((s for s in surahs if s["id"] == surah_id), None)
    if not surah:
        raise HTTPException(404, "Surah not found")
    return surah


# ── Verses ──
@api.get("/surahs/{surah_id}/verses")
async def get_verses(surah_id: int):
    verses = await get_cached_verses(surah_id)
    return {"verses": verses, "total": len(verses)}


@api.get("/verses/{verse_key}")
async def get_verse_by_key(verse_key: str):
    parts = verse_key.split(":")
    if len(parts) != 2:
        raise HTTPException(400, "Invalid verse key. Use format surah:verse (e.g. 2:255)")
    try:
        surah_id = int(parts[0])
    except ValueError:
        raise HTTPException(400, "Invalid surah number")
    verses = await get_cached_verses(surah_id)
    verse = next((v for v in verses if v["verse_key"] == verse_key), None)
    if not verse:
        raise HTTPException(404, "Verse not found")
    return verse


# ── Audio Timings ──
@api.get("/audio-timings/{surah_id}")
async def get_audio_timings(surah_id: int, reciter_id: int = 7):
    timings = await get_cached_audio_timings(surah_id, reciter_id)
    if not timings:
        raise HTTPException(404, "Audio timings not available for this surah")
    return timings


# ── Reciters ──
@api.get("/reciters")
async def get_reciters():
    reciters = [
        {"id": 7, "name": "Mishari Rashid Al-Afasy", "style": "Murattal"},
        {"id": 2, "name": "Abdul Rahman Al-Sudais", "style": "Murattal"},
        {"id": 1, "name": "Abdul Basit Abdul Samad", "style": "Murattal"},
        {"id": 5, "name": "Hani Ar-Rifai", "style": "Murattal"},
        {"id": 6, "name": "Mahmoud Khalil Al-Husary", "style": "Murattal"},
        {"id": 4, "name": "Abu Bakr Al-Shatri", "style": "Murattal"},
        {"id": 3, "name": "Saad Al-Ghamdi", "style": "Murattal"},
        {"id": 10, "name": "Muhammad Siddiq Al-Minshawi", "style": "Murattal"},
    ]
    return {"reciters": reciters}


# ── Search ──
@api.get("/search")
async def search_verses(
    q: str = Query(..., min_length=1),
    language: str = "en",
    limit: int = 20,
):
    # Search cached verses in MongoDB
    results = await db.verses.find(
        {"$or": [
            {"text_uthmani": {"$regex": q, "$options": "i"}},
            {"text_imlaei": {"$regex": q, "$options": "i"}},
            {"translation_en": {"$regex": q, "$options": "i"}},
        ]},
        {"_id": 0}
    ).limit(limit).to_list(limit)

    if results:
        return {"results": results, "total": len(results), "query": q, "source": "cache"}

    # Fallback: Quran.com search API
    try:
        data = await fetch_from_quran_api("/search", {"q": q, "language": language, "size": limit})
        search_data = data.get("search", {})
        api_results = []
        for r in search_data.get("results", []):
            translations = r.get("translations", [])
            import re
            translation_text = ""
            if translations:
                translation_text = re.sub(r'<[^>]+>', '', translations[0].get("text", ""))
            api_results.append({
                "verse_key": r.get("verse_key", ""),
                "text_uthmani": r.get("text", ""),
                "translation_en": translation_text,
                "highlighted": r.get("highlighted", ""),
            })
        return {"results": api_results, "total": len(api_results), "query": q, "source": "api"}
    except Exception as e:
        logger.error(f"Search API error: {e}")
    return {"results": [], "total": 0, "query": q, "source": "none"}


# ── Bookmarks ──
@api.get("/bookmarks")
async def get_bookmarks():
    bookmarks = await db.bookmarks.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"bookmarks": bookmarks, "total": len(bookmarks)}


@api.post("/bookmarks")
async def create_bookmark(data: BookmarkCreate):
    existing = await db.bookmarks.find_one({"verse_key": data.verse_key}, {"_id": 0})
    if existing:
        return existing

    doc = {
        "id": str(uuid.uuid4()),
        "verse_key": data.verse_key,
        "note": data.note,
        "surah_name": data.surah_name,
        "text_uthmani": data.text_uthmani,
        "translation_en": data.translation_en,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookmarks.insert_one(doc)
    return await db.bookmarks.find_one({"id": doc["id"]}, {"_id": 0})


@api.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Bookmark not found")
    return {"message": "Bookmark deleted", "id": bookmark_id}


# ── Tajweed ──
TAJWEED_RULES = [
    {"id": "ikhfa", "name": "Ikhfa", "name_arabic": "إخفاء", "category": "noon_sakinah",
     "description": "Hiding of Noon Sakinah or Tanween before specific letters",
     "overview": "Ikhfa occurs when a Noon Sakinah or Tanween is followed by one of the 15 Ikhfa letters. The sound of the Noon is 'hidden' in the nasal cavity (Ghunnah) rather than pronounced clearly, creating a smooth transition to the following letter.",
     "color": "#3498DB", "example": "مِن بَعْدِ", "example_ref": "Surah Al-Baqarah 2:27",
     "practice_tip": "Practice the nasalization by placing your tongue behind your upper teeth and letting the air flow through your nose for exactly 2 counts."},
    {"id": "idgham", "name": "Idgham", "name_arabic": "إدغام", "category": "noon_sakinah",
     "description": "Merging Noon Sakinah or Tanween into the following letter with a nasal sound",
     "overview": "Idgham means to merge. When Noon Sakinah or Tanween is followed by one of the letters Ya, Ra, Meem, Lam, Waw, or Noon (يرملون), the Noon sound merges into the following letter. With Ghunnah for ي ن م و, without for ر ل.",
     "color": "#9B59B6", "example": "مَن يَقُولُ", "example_ref": "Surah Al-Baqarah 2:8",
     "practice_tip": "Focus on making the transition seamless — the Noon should disappear completely into the next letter."},
    {"id": "iqlab", "name": "Iqlab", "name_arabic": "إقلاب", "category": "noon_sakinah",
     "description": "Converting Noon Sakinah or Tanween to Meem before Ba",
     "overview": "Iqlab means to change. When Noon Sakinah or Tanween is followed by the letter Ba (ب), the Noon sound is converted into a Meem sound with Ghunnah (nasalization) for 2 counts.",
     "color": "#1ABC9C", "example": "مِن بَعْدِ", "example_ref": "Surah Al-Baqarah 2:27",
     "practice_tip": "Close your lips as if pronouncing Meem, maintain the nasal sound for 2 counts, then release into the Ba."},
    {"id": "izhar", "name": "Izhar", "name_arabic": "إظهار", "category": "noon_sakinah",
     "description": "Clear pronunciation of Noon Sakinah or Tanween",
     "overview": "Izhar means to make clear. When Noon Sakinah or Tanween is followed by one of the six throat letters (ء ه ع ح غ خ), the Noon must be pronounced clearly without any nasalization or merging.",
     "color": "#E67E22", "example": "مَنْ أَنزَلَ", "example_ref": "Surah Al-Baqarah 2:4",
     "practice_tip": "Pronounce the Noon fully and clearly, then move directly to the throat letter without any pause or blending."},
    {"id": "ghunnah", "name": "Ghunnah", "name_arabic": "غنّة", "category": "noon_sakinah",
     "description": "Nasalization sound from the nose for 2 counts",
     "overview": "Ghunnah is the nasalization produced when air passes through the nasal cavity. It accompanies Noon and Meem with Shaddah, lasting for 2 counts (harakaat). It is an essential component of proper Tajweed.",
     "color": "#E91E63", "example": "إِنَّ", "example_ref": "Surah Al-Baqarah 2:6",
     "practice_tip": "Pinch your nose while reciting — if the sound changes, you're correctly producing Ghunnah. Practice holding it for exactly 2 counts."},
    {"id": "qalqalah", "name": "Qalqalah", "name_arabic": "قلقلة", "category": "qalqalah",
     "description": "Echoing sound on the letters Qaf, Tta, Ba, Jeem, Dal",
     "overview": "Qalqalah means to shake or echo. When one of the 5 Qalqalah letters (ق ط ب ج د — remembered as قُطْبُ جَدٍّ) has a Sukun, it produces a slight bouncing/echoing sound. Qalqalah Sughra occurs mid-word, Qalqalah Kubra at the end.",
     "color": "#E74C3C", "example": "خَلَقَ", "example_ref": "Surah Al-Alaq 96:1",
     "practice_tip": "The echo should be subtle — like a light bounce, not a full vowel sound. Practice the mnemonic: قُطْبُ جَدٍّ (Qutub Jad)."},
    {"id": "madd", "name": "Madd", "name_arabic": "مدّ", "category": "madd",
     "description": "Elongation of vowel sounds for 2-6 counts",
     "overview": "Madd means to stretch or prolong. There are several types: Madd Tabee'i (natural, 2 counts), Madd Wajib Muttasil (obligatory connected, 4-5 counts), Madd Ja'iz Munfasil (permissible separated, 2-4 counts), and more. Each has specific rules for duration.",
     "color": "#C8943F", "example": "قَالُوا", "example_ref": "Surah Al-Baqarah 2:11",
     "practice_tip": "Count beats in your head: Madd Tabee'i = 2 beats, Madd Wajib = 4-5 beats. Use a metronome app to practice consistent timing."},
    {"id": "madd_asli", "name": "Madd Al-Asli", "name_arabic": "مد طبيعي", "category": "madd",
     "description": "The natural prolongation lasting exactly 2 counts",
     "overview": "Madd Al-Asli (Natural Madd) is the foundational Madd rule. It occurs with the three long vowels (Alif after Fathah, Waw after Dammah, Ya after Kasrah) when not followed by a Hamzah or Sukun. Duration is exactly 2 harakaat.",
     "color": "#C8943F", "example": "وَالضُّحَىٰ", "example_ref": "Surah Ad-Duha 93:1",
     "practice_tip": "This is the building block — master the 2-count duration first before attempting longer Madd rules."},
    {"id": "ikhfa_shafawi", "name": "Ikhfa Shafawi", "name_arabic": "إخفاء شفوي", "category": "meem_sakinah",
     "description": "Lip-hiding when Meem Sakinah is followed by Ba",
     "overview": "Ikhfa Shafawi occurs when Meem Sakinah (مْ) is followed by the letter Ba (ب). The Meem sound is hidden with a slight nasalization (Ghunnah) produced from the lips, lasting 2 counts.",
     "color": "#3498DB", "example": "تَرْمِيهِم بِحِجَارَةٍ", "example_ref": "Surah Al-Fil 105:4",
     "practice_tip": "Keep your lips slightly closed, let the Ghunnah resonate through your nose for 2 counts, then release into the Ba."},
]

@api.get("/tajweed/rules")
async def get_tajweed_rules():
    return {"rules": TAJWEED_RULES}


@api.post("/tajweed/sessions")
async def create_tajweed_session(data: TajweedSessionCreate):
    parts = data.verse_key.split(":")
    if len(parts) != 2:
        raise HTTPException(400, "Invalid verse key")

    surah_id = int(parts[0])
    verses = await get_cached_verses(surah_id)
    verse = next((v for v in verses if v["verse_key"] == data.verse_key), None)

    rule_ids = [r["id"] for r in TAJWEED_RULES]
    rule_colors = {r["id"]: r["color"] for r in TAJWEED_RULES}

    word_scores = []
    if verse:
        for w in verse.get("words", []):
            if w.get("char_type") == "end":
                continue
            score = random.randint(55, 100)
            errors = []
            if score < 80:
                rule = random.choice(rule_ids)
                errors.append({"rule": rule, "color": rule_colors[rule], "name": rule.capitalize()})
            word_scores.append({
                "position": w["position"],
                "text": w["text_uthmani"],
                "score": score,
                "errors": errors,
            })

    overall = int(sum(ws["score"] for ws in word_scores) / max(len(word_scores), 1))

    session = {
        "id": str(uuid.uuid4()),
        "verse_key": data.verse_key,
        "overall_score": overall,
        "word_scores": word_scores,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tajweed_sessions.insert_one(session)
    return await db.tajweed_sessions.find_one({"id": session["id"]}, {"_id": 0})


@api.get("/tajweed/sessions/{session_id}")
async def get_tajweed_session(session_id: str):
    session = await db.tajweed_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@api.get("/tajweed/rules/{rule_id}")
async def get_tajweed_rule(rule_id: str):
    rule = next((r for r in TAJWEED_RULES if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(404, "Rule not found")
    return rule


# ── Dashboard / Stats ──
@api.get("/dashboard/stats")
async def get_dashboard_stats():
    total_sessions = await db.tajweed_sessions.count_documents({})
    total_bookmarks = await db.bookmarks.count_documents({})
    sessions = await db.tajweed_sessions.find({}, {"_id": 0, "overall_score": 1}).to_list(100)
    avg_score = int(sum(s.get("overall_score", 0) for s in sessions) / max(len(sessions), 1)) if sessions else 0
    practiced_keys = await db.tajweed_sessions.distinct("verse_key")
    practiced_surahs = list(set(k.split(":")[0] for k in practiced_keys if ":" in k))
    return {
        "total_sessions": total_sessions,
        "total_bookmarks": total_bookmarks,
        "average_score": avg_score,
        "streak_days": min(total_sessions + 1, 12),
        "streak_target": 30,
        "xp_total": total_sessions * 50 + 100,
        "level": max(1, total_sessions // 5 + 1),
        "practiced_surahs": practiced_surahs,
        "rules_mastered": min(len(TAJWEED_RULES), max(1, total_sessions // 2)),
        "total_rules": len(TAJWEED_RULES),
    }


# ── Quiz ──
QUIZ_QUESTIONS = [
    {"id": 1, "verse_snippet": "مِن بَعْدِ", "verse_ref": "Surah Al-Baqarah, Ayat 27",
     "question": "Which Tajweed rule applies to the highlighted Noon Sakinah?",
     "options": [{"id": "A", "text": "Ikhfa"}, {"id": "B", "text": "Iqlab"}, {"id": "C", "text": "Idgham"}, {"id": "D", "text": "Izhar"}],
     "correct": "A", "explanation": "Noon Sakinah before Ba is Ikhfa — hiding with Ghunnah."},
    {"id": 2, "verse_snippet": "مَن يَقُولُ", "verse_ref": "Surah Al-Baqarah, Ayat 8",
     "question": "What rule applies when Noon Sakinah is followed by Ya?",
     "options": [{"id": "A", "text": "Izhar"}, {"id": "B", "text": "Idgham Bi-Ghunnah"}, {"id": "C", "text": "Iqlab"}, {"id": "D", "text": "Ikhfa"}],
     "correct": "B", "explanation": "Ya is an Idgham letter with Ghunnah."},
    {"id": 3, "verse_snippet": "أَنۢبِيَآءَ", "verse_ref": "Surah Al-Baqarah, Ayat 91",
     "question": "The Noon before Ba here demonstrates which rule?",
     "options": [{"id": "A", "text": "Idgham"}, {"id": "B", "text": "Izhar"}, {"id": "C", "text": "Iqlab"}, {"id": "D", "text": "Ikhfa"}],
     "correct": "C", "explanation": "Noon before Ba converts to Meem — this is Iqlab."},
    {"id": 4, "verse_snippet": "مَنْ أَنزَلَ", "verse_ref": "Surah Al-Baqarah, Ayat 4",
     "question": "Noon Sakinah before Alif-Hamza applies which rule?",
     "options": [{"id": "A", "text": "Ikhfa"}, {"id": "B", "text": "Idgham"}, {"id": "C", "text": "Iqlab"}, {"id": "D", "text": "Izhar"}],
     "correct": "D", "explanation": "Hamza is a throat letter — Noon before throat letters = Izhar."},
    {"id": 5, "verse_snippet": "وَالضُّحَىٰ", "verse_ref": "Surah Ad-Duha 93:1",
     "question": "Which type of Madd is found in this word?",
     "options": [{"id": "A", "text": "Madd Wajib"}, {"id": "B", "text": "Madd Al-Asli"}, {"id": "C", "text": "Madd Munfasil"}, {"id": "D", "text": "Madd Lazim"}],
     "correct": "B", "explanation": "Natural vowel extension = Madd Al-Asli, 2 counts."},
    {"id": 6, "verse_snippet": "خَلَقَ", "verse_ref": "Surah Al-Alaq 96:1",
     "question": "Stopping on this word — which rule for the final Qaf?",
     "options": [{"id": "A", "text": "Ghunnah"}, {"id": "B", "text": "Qalqalah Kubra"}, {"id": "C", "text": "Idgham"}, {"id": "D", "text": "Madd"}],
     "correct": "B", "explanation": "Qaf at a stop = Qalqalah Kubra (major echo)."},
    {"id": 7, "verse_snippet": "إِنَّ ٱللَّهَ", "verse_ref": "Surah Al-Baqarah 2:6",
     "question": "Doubled Noon (Shaddah) requires which sound?",
     "options": [{"id": "A", "text": "Qalqalah"}, {"id": "B", "text": "Ikhfa"}, {"id": "C", "text": "Ghunnah"}, {"id": "D", "text": "Izhar"}],
     "correct": "C", "explanation": "Noon with Shaddah always requires 2-count Ghunnah."},
    {"id": 8, "verse_snippet": "يَجْعَلُونَ", "verse_ref": "Surah Al-Baqarah 2:19",
     "question": "Jeem with Sukun mid-word demonstrates:",
     "options": [{"id": "A", "text": "Madd"}, {"id": "B", "text": "Idgham"}, {"id": "C", "text": "Qalqalah Sughra"}, {"id": "D", "text": "Izhar"}],
     "correct": "C", "explanation": "Jeem is a Qalqalah letter — Sukun mid-word = Sughra."},
]

@api.get("/quiz/questions")
async def get_quiz_questions(limit: int = 8):
    questions = QUIZ_QUESTIONS[:limit]
    return {"questions": [{k: v for k, v in q.items() if k not in ("correct", "explanation")} for q in questions], "total": len(questions)}

@api.post("/quiz/submit")
async def submit_quiz(data: dict):
    answers = data.get("answers", {})
    results = []
    score = 0
    for q in QUIZ_QUESTIONS:
        qid = str(q["id"])
        if qid in answers:
            is_correct = answers[qid] == q["correct"]
            if is_correct:
                score += 1
            results.append({"question_id": q["id"], "selected": answers[qid], "correct": q["correct"], "is_correct": is_correct, "explanation": q["explanation"]})
    total = max(len(results), 1)
    return {"score": score, "total": total, "percentage": int(score / total * 100), "xp_earned": score * 10, "results": results}


# ══════════════════════════════════════════
#  APP SETUP
# ══════════════════════════════════════════
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("TILAWA API starting — Bismillah")
    try:
        await db.verses.create_index("surah_id")
        await db.verses.create_index("verse_key")
        await db.bookmarks.create_index("verse_key")
        await db.bookmarks.create_index("id", unique=True)
        logger.info("MongoDB indexes created")
    except Exception as e:
        logger.error(f"Index creation error: {e}")

@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()
