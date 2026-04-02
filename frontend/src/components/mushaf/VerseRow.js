import React, { useCallback } from "react";
import WordSpan from "./WordSpan";
import { useAudio } from "@/lib/AudioContext";
import { Play, Bookmark } from "lucide-react";

export default function VerseRow({ verse, isActive, activeWordPosition, onBookmark }) {
  const { playVerse } = useAudio();

  const handleWordClick = useCallback((word) => {
    // Play from this verse when word is clicked
    playVerse(verse.verse_key);
  }, [playVerse, verse.verse_key]);

  return (
    <div
      data-testid={`verse-${verse.verse_key}`}
      className={`py-8 border-b border-[#c8943f]/10 transition-all duration-300 ${
        isActive ? "bg-[#c8943f]/[0.03]" : ""
      }`}
    >
      {/* Verse Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="verse-badge">
            <span>{verse.verse_number}</span>
          </div>
          <span className="text-[11px] text-[#8b95a5] tracking-wider">
            {verse.verse_key}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid={`play-verse-${verse.verse_key}`}
            onClick={() => playVerse(verse.verse_key)}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors p-1.5"
            title="Play this verse"
          >
            <Play size={14} />
          </button>
          <button
            data-testid={`bookmark-verse-${verse.verse_key}`}
            onClick={() => onBookmark?.(verse)}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors p-1.5"
            title="Bookmark"
          >
            <Bookmark size={14} />
          </button>
        </div>
      </div>

      {/* Arabic Text */}
      <div className="arabic-text text-3xl sm:text-4xl lg:text-[2.6rem] leading-[2.4] flex flex-wrap justify-end gap-x-1" dir="rtl">
        {verse.words?.map((word) => (
          <WordSpan
            key={word.position}
            word={word}
            isActive={isActive && activeWordPosition === word.position}
            onClick={() => handleWordClick(word)}
          />
        ))}
      </div>

      {/* Translation */}
      {verse.translation_en && (
        <p className="translation-text text-lg sm:text-xl text-[#8b95a5] mt-5 leading-relaxed">
          {verse.translation_en}
        </p>
      )}
    </div>
  );
}
