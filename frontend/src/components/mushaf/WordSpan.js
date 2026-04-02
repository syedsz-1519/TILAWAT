import React from "react";

const WordSpan = React.memo(function WordSpan({ word, isActive, onClick }) {
  if (word.char_type === "end") {
    return (
      <span className="inline-block mx-2 text-[#8b95a5]/50 text-2xl select-none">
        {word.text_uthmani}
      </span>
    );
  }

  return (
    <span
      data-testid={`word-${word.position}`}
      className={`inline-block px-1 py-0.5 cursor-pointer transition-colors duration-200 rounded-sm ${
        isActive
          ? "text-[#c8943f] bg-[#c8943f]/10"
          : "text-[#fdfbf7] hover:text-[#c8943f]/80"
      }`}
      onClick={onClick}
      title={word.text_transliteration ? `${word.text_transliteration} — ${word.translation}` : ""}
    >
      {word.text_uthmani}
    </span>
  );
});

export default WordSpan;
