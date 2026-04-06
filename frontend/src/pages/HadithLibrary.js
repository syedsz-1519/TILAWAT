import React, { useState } from "react";
import { Search, Book, Sparkles } from "lucide-react";

export default function HadithLibrary() {
  const [searchQuery, setSearchQuery] = useState("");

  const COLLECTIONS = [
    { title: "Sahih al-Bukhari", color: "#E6C364", count: "7,563 Hadiths", desc: "The most authentic compilation of prophetic traditions." },
    { title: "Sahih Muslim", color: "#3498DB", count: "3,033 Hadiths", desc: "The second most authentic collection." },
    { title: "Sunan an-Nasa'i", color: "#2ECC71", count: "5,758 Hadiths", desc: "Known for its strict criteria of transmission." },
    { title: "Sunan Abi Dawud", color: "#E74C3C", count: "5,274 Hadiths", desc: "Focused on jurisprudence and legal rulings." },
    { title: "Jami' at-Tirmidhi", color: "#9B59B6", count: "3,956 Hadiths", desc: "Comprehensive collection with scholar grades." },
    { title: "Sunan Ibn Majah", color: "#F1C40F", count: "4,341 Hadiths", desc: "One of the six major Sunni collections." }
  ];

  return (
    <div data-testid="hadith-library" className="max-w-5xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <p className="text-[11px] tracking-[0.2em] text-[#E6C364] uppercase mb-2">Prophetic Traditions</p>
        <h1 className="text-3xl sm:text-4xl font-light text-[#E5E2E1] mb-4">Hadith Library</h1>
        <p className="text-base text-[#9a9a9a] max-w-2xl leading-relaxed">
          Explore the authentic narrations and teachings of the Prophet Muhammad (ﷺ). Traverse the six major collections equipped with semantic vector search capabilities.
        </p>
      </div>

      {/* Semantic Search AI Bar */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-[#E6C364]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none" />
        <div className="relative bg-[#1a1a22] border border-[#E6C364]/20 rounded-full flex items-center px-6 py-4 shadow-2xl">
          <Sparkles size={20} className="text-[#E6C364] shrink-0" />
          <input
            type="text"
            className="bg-transparent w-full border-none outline-none text-[#E5E2E1] placeholder-[#666] ml-4 text-base"
            placeholder="Ask AI Search: 'What does the Prophet say about fasting?' or search keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button className="bg-[#E6C364] text-[#111] px-5 py-2 rounded-full text-sm font-semibold hover:bg-white transition-colors ml-2 shrink-0">
            Search
          </button>
        </div>
      </div>

      {/* Library Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COLLECTIONS.map((c, i) => (
          <div key={i} className="bg-[#1a1a22] border border-[#E6C364]/10 p-6 flex flex-col hover:border-[#E6C364]/40 hover:-translate-y-1 transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#111116] border border-[#E6C364]/20">
                <Book size={20} className="text-[#E6C364]" />
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#111] text-[#9a9a9a] rounded">
                {c.count}
              </span>
            </div>
            <h3 className="text-lg font-medium text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors mb-2">
              {c.title}
            </h3>
            <p className="text-xs text-[#8a8a8a] leading-relaxed flex-1">
              {c.desc}
            </p>
          </div>
        ))}
      </div>
      
      {/* Featured State: Mishkat ul Masabih */}
      <div className="mt-12 bg-gradient-to-br from-[#1a1a22] to-[#121218] border border-[#9B59B6]/30 p-8 relative overflow-hidden group rounded-lg">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#9B59B6]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
         <p className="text-[11px] tracking-[0.2em] text-[#9B59B6] uppercase mb-4">Featured Collection</p>
         <h2 className="text-2xl font-light text-[#E5E2E1] mb-2">Mishkat al-Masabih</h2>
         <p className="text-sm text-[#9a9a9a] max-w-xl mb-6">
           An expanded version of Al-Baghawi's Masabih al-Sunnah, Mishkat al-Masabih is comprehensively designed to provide a broad understanding of Islamic principles through Hadith. 
         </p>
         <button className="text-[12px] uppercase tracking-wider text-[#E5E2E1] bg-[#9B59B6]/20 border border-[#9B59B6]/50 px-4 py-2 hover:bg-[#9B59B6]/40 transition-colors">
           Explore Collection
         </button>
      </div>

    </div>
  );
}
