import React from "react";

const WordSpan = React.memo(function WordSpan({ word, isActive, onClick }) {
  if (word.char_type === "end") {
    return <span className="inline-block mx-2 text-[#666]/50 text-2xl select-none">{word.text_uthmani}</span>;
  }

  return (
    <span
      data-testid={`word-${word.position}`}
      className={`inline-block px-1.5 py-0.5 cursor-pointer transition-all duration-200 rounded-lg ${
        isActive ? "text-[#E6C364] bg-[#E6C364]/10 scale-105" : "text-[#E5E2E1] hover:text-[#E6C364]/80"
      }`}
      onClick={onClick}
      title={word.text_transliteration ? `${word.text_transliteration} — ${word.translation}` : ""}
    >
      {word.text_uthmani}
    </span>
  );
});

export default WordSpan;
