import React, { useCallback } from "react";
import WordSpan from "./WordSpan";
import { useAudio } from "@/lib/AudioContext";
import { Play, Bookmark } from "lucide-react";

export default function VerseRow({ verse, isActive, activeWordPosition, onBookmark }) {
  const { playVerse } = useAudio();
  const handleWordClick = useCallback(() => { playVerse(verse.verse_key); }, [playVerse, verse.verse_key]);

  return (
    <div
      data-testid={`verse-${verse.verse_key}`}
      className={`py-8 border-b border-[#E6C364]/8 transition-all duration-300 ${isActive ? "bg-[#E6C364]/[0.04] rounded-2xl px-4 -mx-4" : ""}`}
    >
      {/* Verse Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="verse-badge"><span>{verse.verse_number}</span></div>
          <span className="text-[11px] text-[#9a9a9a] tracking-wider">{verse.verse_key}</span>
        </div>
        <div className="flex items-center gap-1">
          <button data-testid={`play-verse-${verse.verse_key}`} onClick={() => playVerse(verse.verse_key)}
            className="text-[#9a9a9a] hover:text-[#E6C364] transition-colors p-2 rounded-lg hover:bg-[#E6C364]/5" title="Play">
            <Play size={14} />
          </button>
          <button data-testid={`bookmark-verse-${verse.verse_key}`} onClick={() => onBookmark?.(verse)}
            className="text-[#9a9a9a] hover:text-[#E6C364] transition-colors p-2 rounded-lg hover:bg-[#E6C364]/5" title="Bookmark">
            <Bookmark size={14} />
          </button>
        </div>
      </div>

      {/* Arabic */}
      <div className="arabic-text text-3xl sm:text-4xl lg:text-[2.6rem] leading-[2.4] flex flex-wrap justify-end gap-x-1" dir="rtl">
        {verse.words?.map(word => (
          <WordSpan key={word.position} word={word} isActive={isActive && activeWordPosition === word.position} onClick={handleWordClick} />
        ))}
      </div>

      {/* Translation */}
      {verse.translation_en && (
        <p className="translation-text text-lg sm:text-xl text-[#9a9a9a] mt-5 leading-relaxed">{verse.translation_en}</p>
      )}
    </div>
  );
}
