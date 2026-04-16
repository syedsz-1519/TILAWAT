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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children relative z-10 px-2 pb-10">
            {surahs.map(surah => (
              <div
                key={surah.id}
                data-testid={`surah-card-${surah.id}`}
                className="group relative overflow-hidden rounded-2xl bg-black/20 p-[1px] cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(230,195,100,0.15)]"
                onClick={() => navigate(`/mushaf/${surah.id}`)}
              >
                {/* Animated Edge Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#E6C364]/40 via-transparent to-[#9B59B6]/40 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>
                
                {/* Card Content Surface */}
                <div className="relative h-full w-full rounded-2xl bg-[#0F0F16]/90 backdrop-blur-3xl border border-white/5 hover:border-white/10 transition-colors p-5 z-10 flex flex-col justify-between">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-[#E6C364]/5 blur-[60px] group-hover:bg-[#E6C364]/10 transition-colors duration-700 rounded-full translate-x-10 -translate-y-10"></div>
                  
                  <div className="flex items-start justify-between relative z-20">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E6C364]/10 to-transparent border border-[#E6C364]/20 group-hover:border-[#E6C364]/50 transition-colors overflow-hidden">
                        <div className="absolute inset-0 bg-[#E6C364]/20 blur-md scale-0 group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[#E6C364] font-semibold font-mono relative z-10">{surah.id}</span>
                      </div>
                      <div>
                        <h3 className="text-base text-white font-medium group-hover:text-[#E6C364] transition-colors truncate tracking-wide">{surah.name_simple}</h3>
                        <p className="text-[11px] text-[#9a9a9a] uppercase tracking-wider mt-1 font-medium">{surah.translated_name?.name}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="arabic-text text-2xl text-white group-hover:text-[#E6C364] transition-colors drop-shadow-md">{surah.name_arabic}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center border-t border-white/5 pt-4 justify-between relative z-20">
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em]">
                       <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${surah.revelation_place === "makkah" ? "bg-[#E6C364] shadow-[#E6C364]" : "bg-[#2ECC71] shadow-[#2ECC71]"}`}></div>
                       <span className="text-white/60">{surah.revelation_place === "makkah" ? "Meccan" : "Medinan"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/recitation/${surah.id}`); }}
                        className="text-[10px] bg-[#E6C364]/10 text-[#E6C364] px-3 py-1 rounded-full border border-[#E6C364]/20 hover:bg-[#E6C364]/20 transition-colors"
                      >
                        ▶ Recite
                      </button>
                      <span className="text-[10px] bg-white/5 text-white/70 px-2 py-1 rounded-full border border-white/5">{surah.verses_count} Ayahs</span>
                    </div>
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
