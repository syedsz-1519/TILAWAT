# TILAWA — Product Requirements Document

## Original Problem Statement
Build TILAWA — a research-grade Islamic EdTech web platform for Quran learning with AI-powered Tajweed analysis, word-by-word audio sync, semantic search, and gamified learning paths.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB + Quran.com API v4 proxy
- **Design**: Dark theme (#070a0f) + gold accents (#c8943f) + Amiri Quran font
- **Audio**: HTML5 Audio + QDC API for word-level timestamps

## User Personas
- **Quran Student**: Wants to read, listen, and learn with word-by-word sync
- **Tajweed Learner**: Practices recitation with feedback (mocked for MVP)
- **Researcher**: Searches Quran by text or meaning

## Core Requirements (Static)
1. Browse 114 surahs with metadata
2. Read verses with Arabic text (Uthmani script) and English translation
3. Word-by-word audio synchronization with Mishari Al-Afasy recitation
4. Text search across verses
5. Bookmark verses
6. Tajweed practice UI with mock scoring
7. Tajweed rules reference

## What's Been Implemented (Phase 1 MVP — April 2, 2026)
- **Mushaf Reader**: Full surah list, verse display with Amiri Quran font, word-by-word audio highlighting, audio player bar with play/pause/seek/volume/speed/repeat
- **Search**: Text search with results from Quran.com API fallback
- **Tajweed Practice**: Mock recording UI with simulated word-level scoring, tajweed rules reference
- **Bookmarks**: Create, list, delete bookmarks
- **Audio**: Chapter-level audio from QDC with word-level timestamp sync
- **Backend**: FastAPI proxy caching Quran.com API data in MongoDB
- **Design**: Dark theme, gold accents, RTL Arabic text, responsive layout

## Prioritized Backlog
### P0 (Next Phase)
- User authentication (JWT or Google Auth)
- Real Tajweed ML analysis (OpenAI Whisper + GPT for feedback)
- Semantic search with AI embeddings

### P1
- Dashboard with streaks, XP, progress charts
- Learning paths with modules and quizzes
- Multiple reciter support with audio switching
- Tafseer (commentary) panel

### P2
- Offline support
- Mobile-optimized responsive improvements
- i18n (Arabic UI language)
- User reading progress tracking
- Social sharing of verses

## Next Tasks
1. Add user authentication
2. Implement real Tajweed AI analysis
3. Build dashboard with progress tracking
4. Add multiple reciter switching
5. Implement learning paths with gamification
