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

      {/* Translations */}
      {verse.translations?.map(tr => (
        <div key={tr.id} className="mt-5 flex gap-3 group">
          <button onClick={() => {
            import('@/lib/api').then(m => m.default.generateTts(tr.text).then(blob => {
              const audio = new Audio(URL.createObjectURL(blob));
              audio.play();
            }).catch(e => alert("Audio generation failed: " + e.message)));
          }} className="mt-1 flex-shrink-0 text-[#9a9a9a] hover:text-[#E6C364] opacity-50 group-hover:opacity-100 transition-all rounded-full p-1" title="Play Voice (ElevenLabs)">
            <Play size={14} />
          </button>
          <p className="translation-text text-lg sm:text-xl text-[#9a9a9a] leading-relaxed flex-1">{tr.text}</p>
        </div>
      ))}
    </div>
  );
}
