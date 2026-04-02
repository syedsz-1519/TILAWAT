import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";
import api from "@/lib/api";

const REVELATION_COLORS = {
  makkah: "#c8943f",
  madinah: "#2ECC71",
};

export default function MushafHome() {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSurahs().then(data => {
      setSurahs(data.surahs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <p className="text-[11px] tracking-[0.3em] text-[#c8943f] uppercase mb-4">
          Bismillah hir Rahman nir Raheem
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#fdfbf7] mb-3">
          The Noble Quran
        </h1>
        <p className="text-base lg:text-lg text-[#8b95a5] max-w-lg mx-auto">
          Read, listen, and learn the Holy Quran with word-by-word audio synchronization
        </p>
      </div>

      {/* Surah Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg text-[#fdfbf7] font-light">
            114 Surahs
          </h2>
          <div className="flex items-center gap-4 text-[11px] text-[#8b95a5]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#c8943f]" /> Meccan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#2ECC71]" /> Medinan
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {surahs.map((surah) => (
              <div
                key={surah.id}
                data-testid={`surah-card-${surah.id}`}
                className="bg-[#0d131f] border border-[#c8943f]/15 p-4 hover:border-[#c8943f]/30 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/mushaf/${surah.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 flex items-center justify-center text-xs border border-[#c8943f]/30 text-[#c8943f] shrink-0 rotate-45">
                      <span className="-rotate-45">{surah.id}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-[#fdfbf7] font-medium group-hover:text-[#c8943f] transition-colors truncate">
                        {surah.name_simple}
                      </p>
                      <p className="text-[11px] text-[#8b95a5] truncate">
                        {surah.translated_name?.name} &middot; {surah.verses_count} ayahs
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="arabic-text text-xl leading-none text-[#fdfbf7]">{surah.name_arabic}</p>
                    <p className="text-[10px] mt-1" style={{ color: REVELATION_COLORS[surah.revelation_place] || "#8b95a5" }}>
                      {surah.revelation_place === "makkah" ? "Meccan" : "Medinan"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
