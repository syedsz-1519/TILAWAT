import React, { useEffect, useMemo, useRef, useState } from "react";
import { Book, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import api from "@/lib/api";

export default function HadithLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("bukhari");
  const [activeBook, setActiveBook] = useState(null);
  const [collections, setCollections] = useState([]);
  const [books, setBooks] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const COLLECTIONS = useMemo(() => {
    if (collections.length) return collections;
    return [
      { id: "bukhari", title: "Sahih al-Bukhari", description: "The most authentic compilation of prophetic traditions.", hadith_count: 7563 },
    ];
  }, [collections]);

  const active = COLLECTIONS.find(c => c.id === activeCollection) || COLLECTIONS[0];
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const pageIndex = Math.floor(offset / limit) + 1;

  const fetchPage = async (nextOffset = 0, q = searchQuery) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getHadiths({ collection: activeCollection, q, book: activeBook ?? undefined, offset: nextOffset, limit });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setOffset(res.offset || nextOffset);
    } catch (e) {
      setError(e?.message || "Failed to load hadiths");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getHadithCollections()
      .then(d => setCollections(d.collections || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveBook(null);
    setBooks([]);
    if (activeCollection === "bukhari") {
      api.getBukhariBooks()
        .then(d => setBooks(d.books || []))
        .catch(() => {});
    }
    fetchPage(0, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCollection]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(0, searchQuery), 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    fetchPage(0, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBook]);

  return (
    <div data-testid="hadith-library" className="max-w-5xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <p className="text-[11px] tracking-[0.2em] text-[#E6C364] uppercase mb-2">Prophetic Traditions</p>
        <h1 className="text-3xl sm:text-4xl font-light text-[#E5E2E1] mb-4">Hadith Library</h1>
        <p className="text-base text-[#9a9a9a] max-w-2xl leading-relaxed">
          Explore authentic narrations and teachings of the Prophet Muhammad (ﷺ). Search the full collection and browse by pages.
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
            placeholder="Search hadith text (e.g. fasting, intention, prayer)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="text-[11px] text-[#666] ml-2 shrink-0 hidden sm:block">
            {loading ? "Searching…" : `${total.toLocaleString()} results`}
          </div>
        </div>
      </div>

      {/* Library Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COLLECTIONS.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCollection(c.id)}
            className={`bg-[#1a1a22] border p-6 flex flex-col hover:-translate-y-1 transition-all group cursor-pointer ${
              c.id === activeCollection ? "border-[#E6C364]/60" : "border-[#E6C364]/10 hover:border-[#E6C364]/40"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#111116] border border-[#E6C364]/20">
                <Book size={20} className="text-[#E6C364]" />
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#111] text-[#9a9a9a] rounded">
                {(c.hadith_count ?? 0).toLocaleString()} Hadiths
              </span>
            </div>
            <h3 className="text-lg font-medium text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors mb-2">
              {c.title || c.id}
            </h3>
            <p className="text-xs text-[#8a8a8a] leading-relaxed flex-1">
              {c.description || ""}
            </p>
          </div>
        ))}
      </div>
      
      {/* Results */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.2em] text-[#E6C364] uppercase">Now browsing</p>
            <h2 className="text-xl font-light text-[#E5E2E1] truncate">{active?.title || "Collection"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm bg-[#1a1a22] border border-[#E6C364]/15 text-[#9a9a9a] hover:text-[#E6C364] hover:border-[#E6C364]/30 transition-colors disabled:opacity-40"
              onClick={() => fetchPage(Math.max(0, offset - limit))}
              disabled={loading || offset === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-[11px] text-[#666] w-[120px] text-center">
              Page {pageIndex} / {pageCount}
            </div>
            <button
              className="px-3 py-2 text-sm bg-[#1a1a22] border border-[#E6C364]/15 text-[#9a9a9a] hover:text-[#E6C364] hover:border-[#E6C364]/30 transition-colors disabled:opacity-40"
              onClick={() => fetchPage(Math.min(offset + limit, Math.max(0, (pageCount - 1) * limit)))}
              disabled={loading || offset + limit >= total}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Book filter (matches your Library tab pattern) */}
        {books.length ? (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button
              onClick={() => setActiveBook(null)}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                activeBook == null ? "bg-[#E6C364] text-[#111] border-[#E6C364]" : "bg-[#1a1a22] text-[#9a9a9a] border-[#E6C364]/15 hover:border-[#E6C364]/35 hover:text-[#E6C364]"
              }`}
            >
              All Books
            </button>
            {books.slice(0, 12).map(b => (
              <button
                key={b.book}
                onClick={() => setActiveBook(b.book)}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                  activeBook === b.book ? "bg-[#E6C364] text-[#111] border-[#E6C364]" : "bg-[#1a1a22] text-[#9a9a9a] border-[#E6C364]/15 hover:border-[#E6C364]/35 hover:text-[#E6C364]"
                }`}
                title={b.name}
              >
                {b.name}
              </button>
            ))}
            {books.length > 12 ? (
              <span className="text-[11px] text-[#666] ml-1">+{books.length - 12} more (coming next)</span>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="bg-[#1a1a22] border border-red-500/30 p-4 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="space-y-3">
          {loading && !items.length ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1a1a22] border border-[#E6C364]/10 p-5">
                <div className="skeleton h-4 w-48 mb-3" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-5/6" />
              </div>
            ))
          ) : (
            items.map((h) => (
              <div key={`${h.collection}-${h.hadithnumber}`} className="bg-[#1a1a22] border border-[#E6C364]/10 p-5 hover:border-[#E6C364]/25 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-[11px] text-[#9a9a9a]">
                    <span className="text-[#E6C364] font-semibold">#{h.hadithnumber}</span>
                    {h.book_name ? <span className="mx-2 text-[#666]">·</span> : null}
                    {h.book_name ? <span className="uppercase tracking-wider">{h.book_name}</span> : null}
                  </div>
                  <div className="text-[11px] text-[#666]">
                    Book {h?.reference?.book ?? "—"} · Hadith {h?.reference?.hadith ?? "—"}
                  </div>
                </div>
                <p className="text-sm text-[#E5E2E1] leading-relaxed whitespace-pre-wrap">{h.text}</p>
              </div>
            ))
          )}
        </div>

        {!loading && !items.length ? (
          <div className="mt-6 text-sm text-[#9a9a9a]">No results. Try a different search term.</div>
        ) : null}
      </div>

    </div>
  );
}
