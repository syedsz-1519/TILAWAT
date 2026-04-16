-- ════════════════════════════════════════════════════════════
--  TILAWA DATABASE SCHEMA v1.0
--  PostgreSQL 15+
--  Run: psql -U tilawa_user -d tilawa_db -f schema.sql
-- ════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- For fast Arabic text search
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- For transliteration search
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for semantic search embeddings

-- ──────────────────────────────────────────────────────────
--  ENUM TYPES
-- ──────────────────────────────────────────────────────────

CREATE TYPE revelation_type   AS ENUM ('meccan', 'medinan');
CREATE TYPE tajweed_rule_type AS ENUM (
    'ikhfa', 'idgham', 'iqlab', 'izhar', 'ghunnah',
    'qalqalah', 'madd', 'waqf', 'shaddah', 'other'
);
CREATE TYPE lesson_status     AS ENUM ('locked', 'available', 'in_progress', 'completed');
CREATE TYPE achievement_type  AS ENUM ('streak', 'completion', 'accuracy', 'time');

-- ──────────────────────────────────────────────────────────
--  QURAN CONTENT TABLES
-- ──────────────────────────────────────────────────────────

CREATE TABLE surahs (
    id                  SMALLINT        PRIMARY KEY,       -- 1–114
    name_arabic         VARCHAR(50)     NOT NULL,
    name_transliterated VARCHAR(100)    NOT NULL,
    name_english        VARCHAR(100)    NOT NULL,
    revelation_type     revelation_type NOT NULL,
    verse_count         SMALLINT        NOT NULL,
    juz_start           SMALLINT        NOT NULL,
    page_start          SMALLINT        NOT NULL,
    audio_url_base      TEXT,

    CONSTRAINT surahs_verse_count_check CHECK (verse_count > 0)
);

CREATE TABLE verses (
    id                  SERIAL          PRIMARY KEY,
    surah_id            SMALLINT        NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
    verse_number        SMALLINT        NOT NULL,
    verse_key           VARCHAR(10)     NOT NULL UNIQUE,
    text_uthmani        TEXT            NOT NULL,
    text_imlaei         TEXT            NOT NULL,
    text_simple         TEXT            NOT NULL,
    juz_number          SMALLINT        NOT NULL,
    page_number         SMALLINT        NOT NULL,
    hizb_quarter        SMALLINT,
    sajdah_type         VARCHAR(20),

    CONSTRAINT verses_unique_key UNIQUE (surah_id, verse_number)
);

CREATE INDEX idx_verses_surah    ON verses(surah_id);
CREATE INDEX idx_verses_juz      ON verses(juz_number);
CREATE INDEX idx_verses_uthmani  ON verses USING GIN (text_uthmani gin_trgm_ops);

CREATE TABLE words (
    id                  SERIAL          PRIMARY KEY,
    verse_id            INTEGER         NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    surah_id            SMALLINT        NOT NULL,
    verse_number        SMALLINT        NOT NULL,
    position            SMALLINT        NOT NULL,
    text_uthmani        VARCHAR(200)    NOT NULL,
    text_transliteration VARCHAR(200),
    audio_url           TEXT,
    audio_start_ms      INTEGER,
    audio_end_ms        INTEGER,
    pos_tag             VARCHAR(20),
    lemma               VARCHAR(100),
    root                CHAR(6),

    CONSTRAINT words_unique_pos UNIQUE (verse_id, position)
);

CREATE INDEX idx_words_verse       ON words(verse_id);

CREATE TABLE word_translations (
    id          SERIAL          PRIMARY KEY,
    word_id     INTEGER         NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    language    CHAR(5)         NOT NULL,
    translation VARCHAR(500)    NOT NULL,

    CONSTRAINT wt_unique UNIQUE (word_id, language)
);

CREATE TABLE translations (
    id              SERIAL      PRIMARY KEY,
    verse_id        INTEGER     NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    language        CHAR(5)     NOT NULL,
    translator_key  VARCHAR(50) NOT NULL,
    text            TEXT        NOT NULL,
    translator_name VARCHAR(100),

    CONSTRAINT translations_unique UNIQUE (verse_id, translator_key)
);

-- Users & Progress tables

CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255)    UNIQUE NOT NULL,
    password_hash       TEXT            NOT NULL,
    username            VARCHAR(50)     UNIQUE NOT NULL,
    full_name           VARCHAR(200),
    avatar_url          TEXT,
    preferred_language  CHAR(5)         NOT NULL DEFAULT 'en',
    ui_language         CHAR(5)         NOT NULL DEFAULT 'en',
    xp_total            INTEGER         NOT NULL DEFAULT 0,
    streak_days         SMALLINT        NOT NULL DEFAULT 0,
    streak_last_date    DATE,
    level               SMALLINT        NOT NULL DEFAULT 1,
    settings            JSONB           NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_active_at      TIMESTAMPTZ,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE
);

-- ──────────────────────────────────────────────────────────
--  AI AGENT & CONVERSATION LOGS
-- ──────────────────────────────────────────────────────────

CREATE TABLE chat_history (
    id                  SERIAL          PRIMARY KEY,
    interaction_id      UUID            NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    user_id             UUID            REFERENCES users(id) ON DELETE SET NULL, -- Nullable for local testing
    user_query          TEXT            NOT NULL,
    agent_response      TEXT            NOT NULL,
    engine              VARCHAR(50)     NOT NULL DEFAULT 'Ollama_Llama3_Local',
    timestamp           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for searching chat records fast
CREATE INDEX idx_chat_history_time ON chat_history(timestamp DESC);

CREATE TABLE verse_generations (
    id                  SERIAL          PRIMARY KEY,
    user_prompt         TEXT            NOT NULL,
    arabic_text         TEXT            NOT NULL,
    translation_text    TEXT            NOT NULL,
    reference_id        VARCHAR(100)    NOT NULL,
    generated_by        VARCHAR(50)     NOT NULL DEFAULT 'Gemini_1.5_Pro',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
