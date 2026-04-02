import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, ChevronRight } from "lucide-react";
import api from "@/lib/api";

export default function TajweedHub() {
  const [rules, setRules] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTajweedRules().then(d => setRules(d.rules || [])).catch(() => {});
    api.getSurahs().then(d => setSurahs(d.surahs || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSurah) { setVerses([]); return; }
    setLoadingVerses(true);
    api.getVerses(selectedSurah).then(d => {
      setVerses(d.verses || []);
      setLoadingVerses(false);
    }).catch(() => setLoadingVerses(false));
  }, [selectedSurah]);

  return (
    <div data-testid="tajweed-hub" className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-[#c8943f]/30 bg-[#c8943f]/10 rounded-full">
          <Mic size={24} className="text-[#c8943f]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#fdfbf7] mb-2">Tajweed Practice</h1>
        <p className="text-sm text-[#8b95a5]">Select a verse to practice your recitation</p>
      </div>

      {/* Tajweed Rules */}
      <div className="mb-12">
        <h2 className="text-sm text-[#8b95a5] tracking-widest uppercase mb-4">Tajweed Rules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              data-testid={`tajweed-rule-${rule.id}`}
              className="bg-[#0d131f] border border-[#c8943f]/15 p-4 hover:border-[#c8943f]/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: rule.color }} />
                <span className="text-sm text-[#fdfbf7] font-medium">{rule.name}</span>
              </div>
              <p className="arabic-text text-lg text-[#c8943f] mb-1">{rule.name_arabic}</p>
              <p className="text-[11px] text-[#8b95a5] line-clamp-2">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Verse Selector */}
      <div>
        <h2 className="text-sm text-[#8b95a5] tracking-widest uppercase mb-4">Select a Verse to Practice</h2>

        {/* Surah dropdown */}
        <select
          data-testid="tajweed-surah-select"
          className="w-full bg-[#0d131f] border border-[#c8943f]/20 text-[#fdfbf7] px-4 py-3 text-sm focus:outline-none focus:border-[#c8943f]/50 mb-4 appearance-none cursor-pointer"
          value={selectedSurah || ""}
          onChange={(e) => setSelectedSurah(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Choose a Surah...</option>
          {surahs.map(s => (
            <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>
          ))}
        </select>

        {/* Verse list */}
        {loadingVerses && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        )}
        {!loadingVerses && verses.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {verses.slice(0, 30).map(v => (
              <div
                key={v.verse_key}
                data-testid={`tajweed-verse-${v.verse_key}`}
                className="bg-[#0d131f] border border-[#c8943f]/15 p-3 flex items-center justify-between cursor-pointer hover:border-[#c8943f]/30 transition-all group"
                onClick={() => navigate(`/tajweed/session/${v.verse_key}`)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-[11px] text-[#c8943f] border border-[#c8943f]/30 px-2 py-0.5 shrink-0">
                    {v.verse_key}
                  </span>
                  <p className="arabic-text text-lg text-[#fdfbf7] truncate" dir="rtl">
                    {v.text_uthmani}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#8b95a5] group-hover:text-[#c8943f] transition-colors shrink-0 ml-2" />
              </div>
            ))}
            {verses.length > 30 && (
              <p className="text-center text-[11px] text-[#8b95a5] py-2">
                Showing first 30 verses. Select to practice.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
