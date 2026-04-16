import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAudio } from "@/lib/AudioContext";
import api from "@/lib/api";
import { Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward, Volume2, VolumeX, BookOpen, Share2, Link2, ExternalLink } from "lucide-react";

export default function RecitationPage() {
  const { surahId } = useParams();
  const navigate = useNavigate();
  const [surah, setSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVerse, setActiveVerse] = useState(null);
  const verseRefs = useRef({});

  const {
    isPlaying, isLoading: audioLoading, currentVerseKey, currentWordPosition,
    loadSurah, playVerse, togglePlay, nextVerse, prevVerse,
    volume, setVolume, currentSurahId
  } = useAudio();

  // Load surah data
  useEffect(() => {
    if (!surahId) return;
    setLoading(true);
    Promise.all([
      api.getSurah(parseInt(surahId)),
      api.getVerses(parseInt(surahId), "20")
    ]).then(([surahData, versesData]) => {
      setSurah(surahData);
      setVerses(versesData.verses || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [surahId]);

  // Load audio
  useEffect(() => {
    if (surahId) loadSurah(parseInt(surahId));
  }, [surahId, loadSurah]);

  // Auto-scroll to active verse
  useEffect(() => {
    if (currentVerseKey && verseRefs.current[currentVerseKey]) {
      verseRefs.current[currentVerseKey].scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      setActiveVerse(currentVerseKey);
    }
  }, [currentVerseKey]);

  const handleVerseClick = useCallback((verseKey) => {
    playVerse(verseKey);
    setActiveVerse(verseKey);
  }, [playVerse]);

  // Share verse or surah
  const shareContent = useCallback(async (title, text, url) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Share failed:', e);
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(url || text);
        setCopiedVerse(title);
        setTimeout(() => setCopiedVerse(null), 2000);
      } catch (e) {
        console.error('Copy failed:', e);
      }
    }
  }, []);

  const [copiedVerse, setCopiedVerse] = useState(null);

  const shareVerse = useCallback((verse) => {
    const arabicText = verse.words?.filter(w => w.char_type !== 'end').map(w => w.text_uthmani).join(' ') || verse.text_uthmani;
    const translation = verse.translations?.[0]?.text || '';
    const text = `${arabicText}\n\n"${translation}"\n\n— ${surah?.name_simple} ${verse.verse_key}`;
    const url = `${window.location.origin}/recitation/${surahId}#${verse.verse_key}`;
    shareContent(`${surah?.name_simple} ${verse.verse_key}`, text, url);
  }, [surah, surahId, shareContent]);

  const shareSurah = useCallback(() => {
    const url = `${window.location.origin}/recitation/${surahId}`;
    shareContent(
      `${surah?.name_simple} - Tilawa`,
      `Read ${surah?.name_simple} (${surah?.translated_name?.name}) on Tilawa — ${surah?.verses_count} Ayahs`,
      url
    );
  }, [surah, surahId, shareContent]);

  // Navigate between surahs
  const goToSurah = (id) => {
    if (id >= 1 && id <= 114) navigate(`/recitation/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-[#E6C364]/30 border-t-[#E6C364] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9a9a9a] text-sm tracking-widest uppercase">Loading Surah...</p>
        </div>
      </div>
    );
  }

  const sid = parseInt(surahId);

  return (
    <div className="min-h-screen pb-32 relative">
      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#E6C364] opacity-[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#9B59B6] opacity-[0.02] rounded-full blur-[120px]" />
      </div>

      {/* ═══ Top Navigation Bar ═══ */}
      <div className="sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#9a9a9a] hover:text-[#E6C364] transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">All Surahs</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToSurah(sid - 1)}
              disabled={sid <= 1}
              className="p-2 text-[#9a9a9a] hover:text-[#E6C364] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Surah"
            >
              <SkipBack size={14} />
            </button>
            <div className="text-center px-4">
              <p className="text-[#E6C364] text-sm font-medium tracking-wider">{surah?.name_simple}</p>
              <p className="text-[10px] text-[#666] tracking-widest uppercase">{surah?.translated_name?.name}</p>
            </div>
            <button
              onClick={() => goToSurah(sid + 1)}
              disabled={sid >= 114}
              className="p-2 text-[#9a9a9a] hover:text-[#E6C364] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Surah"
            >
              <SkipForward size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareSurah}
              className="p-2 text-[#9a9a9a] hover:text-[#E6C364] transition-colors"
              title="Share Surah"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-2 text-[#9a9a9a] hover:text-[#E6C364] transition-colors"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Surah Header ═══ */}
      <div className="relative z-10 text-center py-12 sm:py-16 px-4">
        {/* Decorative top mark */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#E6C364]/40" />
          <BookOpen size={16} className="text-[#E6C364]/60" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#E6C364]/40" />
        </div>

        <h1 className="arabic-text text-5xl sm:text-6xl lg:text-7xl text-[#E6C364] leading-tight mb-3 drop-shadow-[0_0_30px_rgba(230,195,100,0.15)]">
          {surah?.name_arabic}
        </h1>
        <p className="text-[#E5E2E1] text-lg font-light font-['Noto_Serif'] mb-1">{surah?.name_simple}</p>
        <p className="text-[#9a9a9a] text-xs tracking-[0.2em] uppercase">
          {surah?.verses_count} Ayahs &middot; {surah?.revelation_place === "makkah" ? "Meccan" : "Medinan"}
        </p>

        {/* Decorative bottom mark */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-[#E6C364]/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#E6C364]/30" />
          <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-[#E6C364]/20" />
        </div>
      </div>

      {/* ═══ Bismillah ═══ */}
      {surah?.bismillah_pre && (
        <div className="relative z-10 text-center pb-10 mb-4">
          <p className="arabic-text text-3xl sm:text-4xl text-[#E5E2E1]/80 leading-relaxed">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

      {/* ═══ Verses ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
        {verses.map((verse) => {
          const isActive = currentVerseKey === verse.verse_key;
          const isManualActive = activeVerse === verse.verse_key;

          return (
            <div
              key={verse.verse_key}
              ref={el => (verseRefs.current[verse.verse_key] = el)}
              className={`
                group relative py-10 sm:py-12 border-b border-white/[0.03] transition-all duration-700
                ${isActive ? "bg-[#E6C364]/[0.03] rounded-2xl px-4 sm:px-6 -mx-4 sm:-mx-6 border-[#E6C364]/10" : ""}
              `}
            >
              {/* Active verse glow */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#E6C364]/[0.02] via-transparent to-[#E6C364]/[0.02] rounded-2xl pointer-events-none" />
              )}

              {/* Verse Number Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-500
                    ${isActive
                      ? "bg-[#E6C364]/15 border-[#E6C364]/40 text-[#E6C364] shadow-[0_0_20px_-5px_rgba(230,195,100,0.3)]"
                      : "bg-white/[0.03] border-white/10 text-[#666]"}
                  `}>
                    <span className="text-xs font-mono font-semibold">{verse.verse_number}</span>
                  </div>
                  <span className="text-[10px] text-[#666] tracking-widest">{verse.verse_key}</span>
                </div>

                {/* Play & Share buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => shareVerse(verse)}
                    className="text-[#666] hover:text-[#E6C364] hover:bg-[#E6C364]/10 p-2 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                    title="Share this verse"
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={() => handleVerseClick(verse.verse_key)}
                    className={`
                      p-2.5 rounded-xl transition-all duration-300
                      ${isActive && isPlaying
                        ? "bg-[#E6C364] text-[#0A0A0F] shadow-[0_0_25px_-5px_rgba(230,195,100,0.5)]"
                        : "text-[#666] hover:text-[#E6C364] hover:bg-[#E6C364]/10 opacity-0 group-hover:opacity-100"}
                    `}
                    title={isActive && isPlaying ? "Playing..." : "Play this verse"}
                  >
                    {isActive && isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* ═══ Arabic Text ═══ */}
              <div
                className="arabic-text text-3xl sm:text-4xl lg:text-[2.8rem] leading-[2.2] sm:leading-[2.4] text-right cursor-pointer select-none"
                dir="rtl"
                onClick={() => handleVerseClick(verse.verse_key)}
              >
                {verse.words?.map(word => {
                  if (word.char_type === "end") {
                    return (
                      <span key={word.position} className="text-[#E6C364]/40 mx-1 inline-block">
                        {word.text_uthmani}
                      </span>
                    );
                  }

                  const isWordActive = isActive && currentWordPosition === word.position;
                  return (
                    <span
                      key={word.position}
                      className={`
                        inline-block mx-[2px] px-1 rounded-md transition-all duration-300
                        ${isWordActive
                          ? "text-[#E6C364] bg-[#E6C364]/10 scale-105 shadow-[0_0_15px_-5px_rgba(230,195,100,0.3)]"
                          : isActive
                            ? "text-[#E5E2E1]"
                            : "text-[#E5E2E1]/90 hover:text-[#E5E2E1]"}
                      `}
                    >
                      {word.text_uthmani}
                    </span>
                  );
                })}
              </div>

              {/* ═══ Translation ═══ */}
              {verse.translations?.slice(0, 1).map(tr => (
                <p key={tr.id} className={`
                  mt-6 text-base sm:text-lg leading-relaxed transition-all duration-500
                  ${isActive ? "text-[#9a9a9a]" : "text-[#666]"}
                `}>
                  {tr.text}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {/* ═══ End of Surah ═══ */}
      <div className="relative z-10 text-center py-16 px-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#E6C364]/20" />
          <div className="w-2 h-2 rounded-full bg-[#E6C364]/20" />
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#E6C364]/20" />
        </div>
        <p className="text-[#9a9a9a] text-sm italic mb-1">صَدَقَ ٱللَّهُ ٱلْعَظِيمُ</p>
        <p className="text-[#666] text-xs">Allah the Almighty has spoken the truth</p>

        {/* Next Surah Button */}
        {sid < 114 && (
          <button
            onClick={() => goToSurah(sid + 1)}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-[#E6C364]/20 text-[#E6C364] text-sm rounded-xl hover:bg-[#E6C364]/10 hover:border-[#E6C364]/40 transition-all"
          >
            Next: Surah {sid + 1}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* ═══ Floating Mini Player ═══ */}
      {currentSurahId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+10rem)] z-40">
          <div className="flex items-center gap-2 bg-[#111116]/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <button onClick={prevVerse} className="text-[#9a9a9a] hover:text-[#E6C364] transition-colors p-1">
              <SkipBack size={14} />
            </button>
            <button
              onClick={togglePlay}
              disabled={audioLoading}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E6C364] to-[#C9A84C] text-[#0A0A0F] hover:shadow-lg hover:shadow-[#E6C364]/20 transition-all"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button onClick={nextVerse} className="text-[#9a9a9a] hover:text-[#E6C364] transition-colors p-1">
              <SkipForward size={14} />
            </button>
            {currentVerseKey && (
              <span className="text-[10px] text-[#E6C364] font-mono ml-1 min-w-[40px]">{currentVerseKey}</span>
            )}
          </div>
        </div>
      )}
      {/* ═══ Copied Toast ═══ */}
      {copiedVerse && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="bg-[#E6C364] text-[#0A0A0F] px-4 py-2 rounded-xl text-sm font-medium shadow-[0_10px_30px_-5px_rgba(230,195,100,0.4)] flex items-center gap-2">
            <Link2 size={14} />
            Link copied for {copiedVerse}
          </div>
        </div>
      )}
    </div>
  );
}
