import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    setLoading(true);
    api.getBookmarks().then(d => {
      setBookmarks(d.bookmarks || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const removeBookmark = async (id) => {
    try {
      await api.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  return (
    <div data-testid="bookmarks-page" className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-light text-[#fdfbf7] mb-2">Bookmarks</h1>
        <p className="text-sm text-[#8b95a5]">Your saved verses</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="text-center py-20">
          <Bookmark size={40} className="mx-auto mb-4 text-[#8b95a5] opacity-20" />
          <p className="text-[#8b95a5]">No bookmarks yet</p>
          <p className="text-[11px] text-[#8b95a5] mt-1">Click the bookmark icon on any verse to save it</p>
        </div>
      )}

      {!loading && bookmarks.length > 0 && (
        <div className="space-y-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              data-testid={`bookmark-${bm.id}`}
              className="bg-[#0d131f] border border-[#c8943f]/15 p-5 hover:border-[#c8943f]/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] text-[#c8943f] border border-[#c8943f]/30 px-2 py-0.5">
                      {bm.verse_key}
                    </span>
                    {bm.surah_name && (
                      <span className="text-[11px] text-[#8b95a5]">{bm.surah_name}</span>
                    )}
                  </div>
                  {bm.text_uthmani && (
                    <p className="arabic-text text-xl text-[#fdfbf7] mb-2" dir="rtl">
                      {bm.text_uthmani}
                    </p>
                  )}
                  {bm.translation_en && (
                    <p className="translation-text text-sm text-[#8b95a5] line-clamp-2">
                      {bm.translation_en}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    data-testid={`goto-bookmark-${bm.id}`}
                    onClick={() => {
                      const surahId = bm.verse_key?.split(":")[0];
                      if (surahId) navigate(`/mushaf/${surahId}`);
                    }}
                    className="text-[#8b95a5] hover:text-[#c8943f] transition-colors p-1.5"
                    title="Go to verse"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    data-testid={`delete-bookmark-${bm.id}`}
                    onClick={() => removeBookmark(bm.id)}
                    className="text-[#8b95a5] hover:text-[#E74C3C] transition-colors p-1.5"
                    title="Remove bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
