import React, { useState, useEffect, useRef } from "react";
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

  // Load surah data
  useEffect(() => {
    if (!surahId) return;
    setLoading(true);
    Promise.all([
      api.getSurah(parseInt(surahId)),
      api.getVerses(parseInt(surahId)),
    ]).then(([surahData, versesData]) => {
      setSurah(surahData);
      setVerses(versesData.verses || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [surahId]);

  // Load audio timings
  useEffect(() => {
    if (surahId) loadSurah(parseInt(surahId));
  }, [surahId, loadSurah]);

  // Auto-scroll to active verse
  useEffect(() => {
    if (currentVerseKey && verseRefs.current[currentVerseKey]) {
      verseRefs.current[currentVerseKey].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentVerseKey]);

  const handleBookmark = async (verse) => {
    try {
      await api.createBookmark({
        verse_key: verse.verse_key,
        surah_name: surah?.name_simple || "",
        text_uthmani: verse.text_uthmani,
        translation_en: verse.translation_en,
      });
    } catch (e) {
      console.error("Bookmark error:", e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <div className="skeleton h-14 w-64 mx-auto mb-3" />
          <div className="skeleton h-4 w-40 mx-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-8 border-b border-[#c8943f]/10">
            <div className="skeleton h-6 w-16 mb-4" />
            <div className="skeleton h-16 w-full mb-3" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="mushaf-reader" className="max-w-4xl mx-auto px-4 sm:px-8 pb-32">
      {/* Surah Header */}
      {surah && (
        <div className="text-center py-12 animate-fadeIn">
          <div className="inline-block border border-[#c8943f]/20 px-8 py-6">
            <h1 className="arabic-text text-5xl sm:text-6xl text-[#c8943f] leading-tight">
              {surah.name_arabic}
            </h1>
            <p className="text-[#fdfbf7] text-lg mt-2 font-light">{surah.name_simple}</p>
            <p className="text-[#8b95a5] text-sm mt-1">
              {surah.translated_name?.name} &middot; {surah.verses_count} Ayahs &middot;{" "}
              {surah.revelation_place === "makkah" ? "Meccan" : "Medinan"}
            </p>
          </div>
        </div>
      )}

      {/* Bismillah */}
      {surah && surah.bismillah_pre && (
        <div className="text-center py-8 mb-4 border-b border-[#c8943f]/10 animate-fadeIn">
          <p className="arabic-text text-3xl sm:text-4xl text-[#fdfbf7]">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
          <p className="translation-text text-base text-[#8b95a5] mt-3">
            In the name of Allah, the Entirely Merciful, the Especially Merciful
          </p>
        </div>
      )}

      {/* Verses */}
      <div data-testid="verses-container">
        {verses.map((verse) => (
          <div key={verse.verse_key} ref={(el) => (verseRefs.current[verse.verse_key] = el)}>
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
