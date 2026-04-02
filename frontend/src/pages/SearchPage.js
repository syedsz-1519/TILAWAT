import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.search(q.trim());
      setResults(data.results || []);
    } catch (e) {
      console.error("Search error:", e);
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div data-testid="search-page" className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-light text-[#E5E2E1] mb-2">Search the Quran</h1>
        <p className="text-sm text-[#9a9a9a]">Search by Arabic text, translation, or meaning</p>
      </div>

      {/* Search Input */}
      <div className="relative mb-10">
        <input
          data-testid="search-input"
          className="w-full bg-[#1a1a22] border border-[#E6C364]/20 text-[#E5E2E1] placeholder-[#9a9a9a] pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-[#E6C364]/50 transition-colors"
          placeholder="Search verses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir="auto"
        />
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]" />
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#9a9a9a]">No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] text-[#9a9a9a] tracking-wider uppercase mb-4">
            {results.length} results
          </p>
          {results.map((r, i) => (
            <div
              key={`${r.verse_key}-${i}`}
              data-testid={`search-result-${r.verse_key}`}
              className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 hover:border-[#E6C364]/30 transition-all cursor-pointer group"
              onClick={() => {
                const surahId = r.verse_key?.split(":")[0];
                if (surahId) navigate(`/mushaf/${surahId}`);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[11px] text-[#E6C364] border border-[#E6C364]/30 px-2 py-0.5 mb-3">
                    {r.verse_key}
                  </span>
                  {r.text_uthmani && (
                    <p className="arabic-text text-2xl text-[#E5E2E1] mb-3" dir="rtl">
                      {r.text_uthmani}
                    </p>
                  )}
                  {r.translation_en && (
                    <p className="translation-text text-base text-[#9a9a9a] line-clamp-2">
                      {r.translation_en}
                    </p>
                  )}
                </div>
                <ArrowRight size={16} className="text-[#9a9a9a] group-hover:text-[#E6C364] transition-colors mt-1 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!searched && !loading && (
        <div className="text-center py-16 text-[#9a9a9a]">
          <Search size={40} className="mx-auto mb-4 opacity-20" />
          <p>Enter a word or phrase to search the Holy Quran</p>
        </div>
      )}
    </div>
  );
}
