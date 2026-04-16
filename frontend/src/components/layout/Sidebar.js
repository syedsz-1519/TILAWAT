import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Mic, Bookmark, Menu, X, ChevronRight, LayoutDashboard, BookOpen } from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/tajweed", icon: Mic, label: "Tajweed" },
  { path: "/hadiths", icon: BookOpen, label: "Hadiths" },
  { path: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
];

export default function Sidebar({ isOpen, onToggle }) {
  const [surahs, setSurahs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const activeSurahId = (() => { const m = location.pathname.match(/\/mushaf\/(\d+)/); return m ? parseInt(m[1]) : null; })();

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api.getSurahs()
      .then(d => {
        const list = d?.surahs || [];
        setSurahs(list);
        if (!Array.isArray(list) || list.length === 0) {
          setLoadError("No surahs returned from API.");
        }
        setLoading(false);
      })
      .catch((e) => {
        setLoadError(e?.message || "Failed to load surahs.");
        setLoading(false);
      });
  }, []);

  const filtered = surahs.filter(s =>
    s.name_simple?.toLowerCase().includes(filter.toLowerCase()) || s.name_arabic?.includes(filter) || String(s.id) === filter
  );

  const goToSurah = (id) => { navigate(`/mushaf/${id}`); if (window.innerWidth < 1024) onToggle(); };

  return (
    <>
      {isOpen && <div data-testid="sidebar-overlay" className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onToggle} />}
      <aside data-testid="sidebar" className={`fixed left-0 top-0 h-screen w-80 bg-[#111116] border-r border-[#E6C364]/8 flex flex-col z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Header */}
        <div className="p-6 border-b border-[#E6C364]/8 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate("/")} data-testid="sidebar-logo">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-[#E6C364] font-['Noto_Serif']">TILAWA</h1>
            <p className="text-[9px] tracking-[0.25em] text-[#9a9a9a] mt-0.5 uppercase">Sacred Quran Reader</p>
          </div>
          <button data-testid="sidebar-close-btn" className="lg:hidden text-[#9a9a9a] hover:text-[#E6C364] transition-colors" onClick={onToggle}><X size={20} /></button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <input data-testid="surah-search-input"
              className="w-full bg-[#1a1a22] border border-[#E6C364]/10 text-[#E5E2E1] placeholder-[#666] pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-[#E6C364]/30 transition-colors"
              placeholder="Search surahs..." value={filter} onChange={e => setFilter(e.target.value)} />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          </div>
        </div>

        {/* Surah List */}
        <ScrollArea className="flex-1">
          <div data-testid="surah-list">
            {loading ? Array.from({ length: 10 }).map((_, i) => (<div key={i} className="p-4 border-b border-[#E6C364]/5"><div className="skeleton h-4 w-32 mb-2" /><div className="skeleton h-3 w-20" /></div>))
            : (filtered.length ? filtered.map(surah => (
              <div key={surah.id} data-testid={`surah-item-${surah.id}`}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-[#E6C364]/5 transition-all duration-200 group ${
                  surah.id === activeSurahId ? "text-[#E6C364] bg-[#E6C364]/8 border-l-2 border-l-[#E6C364]" : "text-[#9a9a9a] hover:text-[#E6C364] hover:bg-[#E6C364]/5"
                }`}
                onClick={() => goToSurah(surah.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="verse-badge text-[11px]">{surah.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{surah.name_simple}</p>
                    <p className="text-[10px] text-[#666] truncate">{surah.translated_name?.name} &middot; {surah.verses_count}</p>
                  </div>
                </div>
                <span className="arabic-text text-lg leading-none shrink-0">{surah.name_arabic}</span>
              </div>
            )) : (
              <div className="px-4 py-3 text-sm text-[#9a9a9a]">
                {loadError ? (
                  <div className="text-red-300">
                    {loadError}
                    <div className="text-[11px] text-[#666] mt-1">
                      Tip: open `http://localhost:3000/api/surahs` in browser to confirm proxy.
                    </div>
                  </div>
                ) : (
                  <div>No matches.</div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Nav */}
        <div className="p-3 border-t border-[#E6C364]/8 space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button key={path} data-testid={`nav-${label.toLowerCase()}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                location.pathname.startsWith(path) ? "text-[#E6C364] bg-[#E6C364]/8" : "text-[#9a9a9a] hover:text-[#E6C364] hover:bg-[#E6C364]/5"
              }`}
              onClick={() => { navigate(path); if (window.innerWidth < 1024) onToggle(); }}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
