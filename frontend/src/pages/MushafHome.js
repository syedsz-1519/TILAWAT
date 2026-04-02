import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Star, ChevronRight, Clock } from "lucide-react";
import api from "@/lib/api";

export default function MushafHome() {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSurahs().then(data => { setSurahs(data.surahs || []); setLoading(false); }).catch(() => setLoading(false));
    const lr = localStorage.getItem("tilawa_last_read");
    if (lr) { try { setLastRead(JSON.parse(lr)); } catch(e) {} }
  }, []);

  return (
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <div className="text-center py-14 px-4">
        <p className="text-[11px] tracking-[0.3em] text-[#E6C364] uppercase mb-4">
          Bismillah hir Rahman nir Raheem
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#E5E2E1] mb-3 font-['Noto_Serif']">
          The Noble Quran
        </h1>
        <p className="text-base text-[#9a9a9a] max-w-lg mx-auto">
          Read, listen, and learn with word-by-word audio synchronization
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Last Read Card */}
        {lastRead && (
          <div
            data-testid="last-read-card"
            className="card-elevated p-5 mb-8 flex items-center justify-between cursor-pointer group"
            onClick={() => navigate(`/mushaf/${lastRead.surahId}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#E6C364]/10 border border-[#E6C364]/30 rounded-xl">
                <Clock size={20} className="text-[#E6C364]" />
              </div>
              <div>
                <p className="text-sm text-[#E5E2E1] font-medium group-hover:text-[#E6C364] transition-colors">Continue Reading</p>
                <p className="text-[11px] text-[#9a9a9a]">{lastRead.surahName} &middot; Last read {lastRead.time}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#9a9a9a] group-hover:text-[#E6C364] transition-colors" />
          </div>
        )}

        {/* Surah Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg text-[#E5E2E1] font-light">114 Surahs</h2>
          <div className="flex items-center gap-4 text-[11px] text-[#9a9a9a]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E6C364]" /> Meccan</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2ECC71]" /> Medinan</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {surahs.map(surah => (
              <div
                key={surah.id}
                data-testid={`surah-card-${surah.id}`}
                className="card-surface p-4 cursor-pointer group"
                onClick={() => navigate(`/mushaf/${surah.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="verse-badge">
                      {surah.id}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-[#E5E2E1] font-medium group-hover:text-[#E6C364] transition-colors truncate">{surah.name_simple}</p>
                      <p className="text-[11px] text-[#9a9a9a] truncate">{surah.translated_name?.name} &middot; {surah.verses_count} ayahs</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="arabic-text text-xl leading-none text-[#E5E2E1]">{surah.name_arabic}</p>
                    <p className="text-[10px] mt-1" style={{ color: surah.revelation_place === "makkah" ? "#E6C364" : "#2ECC71" }}>
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
