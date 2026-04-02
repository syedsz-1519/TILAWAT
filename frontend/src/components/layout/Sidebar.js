import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Mic, Bookmark, Menu, X, ChevronRight } from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/search", icon: Search, label: "Search" },
  { path: "/tajweed", icon: Mic, label: "Tajweed" },
  { path: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
];

export default function Sidebar({ isOpen, onToggle }) {
  const [surahs, setSurahs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const activeSurahId = (() => {
    const match = location.pathname.match(/\/mushaf\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  })();

  useEffect(() => {
    api.getSurahs().then(data => {
      setSurahs(data.surahs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = surahs.filter(s =>
    s.name_simple?.toLowerCase().includes(filter.toLowerCase()) ||
    s.name_arabic?.includes(filter) ||
    String(s.id) === filter
  );

  const goToSurah = (id) => {
    navigate(`/mushaf/${id}`);
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        data-testid="sidebar"
        className={`fixed left-0 top-0 h-screen w-80 bg-[#070a0f] border-r border-[#c8943f]/15 flex flex-col z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#c8943f]/15 flex items-center justify-between">
          <div
            className="cursor-pointer"
            onClick={() => navigate("/")}
            data-testid="sidebar-logo"
          >
            <h1 className="text-2xl font-light tracking-[0.3em] text-[#c8943f]">
              TILAWA
            </h1>
            <p className="text-[10px] tracking-[0.25em] text-[#8b95a5] mt-0.5 uppercase">
              Sacred Quran Reader
            </p>
          </div>
          <button
            data-testid="sidebar-close-btn"
            className="lg:hidden text-[#8b95a5] hover:text-[#c8943f] transition-colors"
            onClick={onToggle}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Filter */}
        <div className="p-4">
          <div className="relative">
            <input
              data-testid="surah-search-input"
              className="w-full bg-[#0d131f] border border-[#c8943f]/20 text-[#fdfbf7] placeholder-[#8b95a5] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c8943f]/50 transition-colors"
              placeholder="Search surahs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b95a5]" />
          </div>
        </div>

        {/* Surah List */}
        <ScrollArea className="flex-1">
          <div data-testid="surah-list">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-[#c8943f]/10">
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))
            ) : (
              filtered.map((surah) => (
                <div
                  key={surah.id}
                  data-testid={`surah-item-${surah.id}`}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-[#c8943f]/10 transition-all duration-200 group ${
                    surah.id === activeSurahId
                      ? "text-[#c8943f] bg-[#c8943f]/10 border-l-2 border-l-[#c8943f]"
                      : "text-[#8b95a5] hover:text-[#c8943f] hover:bg-[#c8943f]/5"
                  }`}
                  onClick={() => goToSurah(surah.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 flex items-center justify-center text-[11px] border border-[#c8943f]/30 text-[#c8943f] shrink-0 rotate-45">
                      <span className="-rotate-45">{surah.id}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{surah.name_simple}</p>
                      <p className="text-[11px] text-[#8b95a5] truncate">
                        {surah.translated_name?.name} &middot; {surah.verses_count} ayahs
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="arabic-text text-lg leading-none">{surah.name_arabic}</span>
                    <ChevronRight size={14} className="text-[#c8943f]/0 group-hover:text-[#c8943f]/60 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="p-3 border-t border-[#c8943f]/15 space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              data-testid={`nav-${label.toLowerCase()}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                location.pathname.startsWith(path)
                  ? "text-[#c8943f] bg-[#c8943f]/10"
                  : "text-[#8b95a5] hover:text-[#c8943f] hover:bg-[#c8943f]/5"
              }`}
              onClick={() => {
                navigate(path);
                if (window.innerWidth < 1024) onToggle();
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
