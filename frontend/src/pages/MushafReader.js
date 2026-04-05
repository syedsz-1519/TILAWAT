import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import VerseRow from "@/components/mushaf/VerseRow";
import { useAudio } from "@/lib/AudioContext";
import api from "@/lib/api";

export default function MushafReader() {
  const { surahId } = useParams();
  const [surah, setSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { loadSurah, currentVerseKey, currentWordPosition } = useAudio();
  const verseRefs = useRef({});
  const [selectedLang, setSelectedLang] = useState(localStorage.getItem("tilawa_pref_lang") || 122);
  const [languages, setLanguages] = useState({});

  useEffect(() => { api.getTranslations().then(setLanguages).catch(() => {}); }, []);

  useEffect(() => {
    if (!surahId) return;
    setLoading(true);
    // Request English (20) and selected language
    Promise.all([api.getSurah(parseInt(surahId)), api.getVerses(parseInt(surahId), `20,${selectedLang}`)])
      .then(([surahData, versesData]) => {
        setSurah(surahData);
        setVerses(versesData.verses || []);
        setLoading(false);
        // Save Last Read
        localStorage.setItem("tilawa_last_read", JSON.stringify({
          surahId: parseInt(surahId),
          surahName: surahData.name_simple,
          time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
      }).catch(() => setLoading(false));
  }, [surahId, selectedLang]);

  useEffect(() => { if (surahId) loadSurah(parseInt(surahId)); }, [surahId, loadSurah]);

  useEffect(() => {
    if (currentVerseKey && verseRefs.current[currentVerseKey]) {
      verseRefs.current[currentVerseKey].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentVerseKey]);

  const handleBookmark = useCallback(async (verse) => {
    try {
      await api.createBookmark({
        verse_key: verse.verse_key, surah_name: surah?.name_simple || "",
        text_uthmani: verse.text_uthmani, translation_en: verse.translation_en,
      });
    } catch (e) { console.error("Bookmark error:", e); }
  }, [surah]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12"><div className="skeleton h-14 w-64 mx-auto mb-3" /><div className="skeleton h-4 w-40 mx-auto" /></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-8 border-b border-[#E6C364]/10"><div className="skeleton h-6 w-16 mb-4" /><div className="skeleton h-16 w-full mb-3" /><div className="skeleton h-4 w-3/4" /></div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="mushaf-reader" className="max-w-4xl mx-auto px-4 sm:px-8 pb-32">
      {/* Surah Header */}
      {surah && (
        <div className="text-center py-10 animate-fadeIn">
          <div className="inline-block card-elevated px-8 py-6">
            <h1 className="arabic-text text-5xl sm:text-6xl text-[#E6C364] leading-tight">{surah.name_arabic}</h1>
            <p className="text-[#E5E2E1] text-lg mt-2 font-light font-['Noto_Serif']">{surah.name_simple}</p>
            <p className="text-[#9a9a9a] text-sm mt-1">
              {surah.translated_name?.name} &middot; {surah.verses_count} Ayahs &middot; {surah.revelation_place === "makkah" ? "Meccan" : "Medinan"}
            </p>
          </div>
        </div>
      )}

      {/* Bismillah */}
      {surah && surah.bismillah_pre && (
        <div className="text-center py-8 mb-4 border-b border-[#E6C364]/10 animate-fadeIn relative">
          <p className="arabic-text text-3xl sm:text-4xl text-[#E5E2E1]">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
        </div>
      )}

      {/* Verses */}
      <div data-testid="verses-container">
        {verses.map(verse => (
          <div key={verse.verse_key} ref={el => (verseRefs.current[verse.verse_key] = el)}>
            <VerseRow
              verse={verse}
              isActive={currentVerseKey === verse.verse_key}
              activeWordPosition={currentVerseKey === verse.verse_key ? currentWordPosition : null}
              onBookmark={handleBookmark}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
