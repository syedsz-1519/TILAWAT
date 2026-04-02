import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, ChevronRight, BookOpen, Award, Search, Volume2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "noon_sakinah", label: "Noon Sakinah" },
  { id: "meem_sakinah", label: "Meem Sakinah" },
  { id: "madd", label: "Madd Rules" },
  { id: "qalqalah", label: "Qalqalah" },
];

export default function TajweedHub() {
  const [rules, setRules] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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

  const filteredRules = activeTab === "all" ? rules : rules.filter(r => r.category === activeTab);

  return (
    <div data-testid="tajweed-hub" className="max-w-5xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.2em] text-[#E6C364] uppercase mb-2">Tajweed Library</p>
        <h1 className="text-3xl sm:text-4xl font-light text-[#E5E2E1] mb-2">Knowledge Seekers</h1>
        <p className="text-sm text-[#9a9a9a]">Explore the art of recitation through our curated repository of Tajweed scholarship</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <button data-testid="tajweed-quiz-btn" onClick={() => navigate("/tajweed/quiz")}
          className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 flex items-center gap-3 hover:border-[#E6C364]/30 transition-all group">
          <div className="w-10 h-10 flex items-center justify-center bg-[#9B59B6]/10 border border-[#9B59B6]/30 rounded-full shrink-0">
            <Award size={16} className="text-[#9B59B6]" />
          </div>
          <div className="text-left">
            <p className="text-sm text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors">Take Quiz</p>
            <p className="text-[10px] text-[#9a9a9a]">Test your knowledge</p>
          </div>
        </button>
        <button data-testid="tajweed-dashboard-btn" onClick={() => navigate("/dashboard")}
          className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 flex items-center gap-3 hover:border-[#E6C364]/30 transition-all group">
          <div className="w-10 h-10 flex items-center justify-center bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-full shrink-0">
            <BookOpen size={16} className="text-[#2ECC71]" />
          </div>
          <div className="text-left">
            <p className="text-sm text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors">Dashboard</p>
            <p className="text-[10px] text-[#9a9a9a]">Track your progress</p>
          </div>
        </button>
        <button data-testid="tajweed-practice-btn" onClick={() => document.getElementById("practice-section")?.scrollIntoView({ behavior: "smooth" })}
          className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 flex items-center gap-3 hover:border-[#E6C364]/30 transition-all group">
          <div className="w-10 h-10 flex items-center justify-center bg-[#E6C364]/10 border border-[#E6C364]/30 rounded-full shrink-0">
            <Mic size={16} className="text-[#E6C364]" />
          </div>
          <div className="text-left">
            <p className="text-sm text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors">Practice</p>
            <p className="text-[10px] text-[#9a9a9a]">Record a verse</p>
          </div>
        </button>
      </div>

      {/* Rules Library with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
        <TabsList className="bg-[#1a1a22] border border-[#E6C364]/15 p-1 w-full flex overflow-x-auto gap-1">
          {CATEGORIES.map(cat => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              data-testid={`tab-${cat.id}`}
              className="flex-1 text-xs data-[state=active]:bg-[#E6C364]/10 data-[state=active]:text-[#E6C364] text-[#9a9a9a] whitespace-nowrap"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Qalqalah Quick Reference */}
          {activeTab === "qalqalah" && (
            <div className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 mb-6">
              <p className="text-[11px] text-[#9a9a9a] tracking-widest uppercase mb-3">Quick Reference — The Qalqalah Letters</p>
              <div className="flex items-center justify-center gap-4">
                {["ق", "ط", "ب", "ج", "د"].map(letter => (
                  <span key={letter} className="w-12 h-12 flex items-center justify-center arabic-text text-2xl text-[#E74C3C] border border-[#E74C3C]/30 bg-[#E74C3C]/5">
                    {letter}
                  </span>
                ))}
              </div>
              <p className="text-center text-[11px] text-[#9a9a9a] mt-3">Mnemonic: قُطْبُ جَدٍّ (Qutub Jad)</p>
            </div>
          )}

          {/* Rules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                data-testid={`tajweed-rule-${rule.id}`}
                className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 hover:border-[#E6C364]/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/tajweed/rule/${rule.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: rule.color }} />
                    <span className="text-sm text-[#E5E2E1] group-hover:text-[#E6C364] transition-colors font-medium">{rule.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#9a9a9a] group-hover:text-[#E6C364] transition-colors" />
                </div>
                <p className="arabic-text text-2xl mb-2" style={{ color: rule.color }} dir="rtl">{rule.name_arabic}</p>
                <p className="text-[11px] text-[#9a9a9a] line-clamp-2 mb-3">{rule.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-[#9a9a9a] border-t border-[#E6C364]/10 pt-3">
                  <Volume2 size={10} />
                  <span className="arabic-text text-sm" style={{ color: rule.color }}>{rule.example}</span>
                  <span>&middot; {rule.example_ref}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-[#1a1a22] border border-[#E6C364]/15 p-5 mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#E5E2E1]">Your Mastery</p>
              <span className="text-[11px] text-[#E6C364]">{Math.min(3, filteredRules.length)} of {filteredRules.length} Rules Explored</span>
            </div>
            <Progress value={Math.min(3, filteredRules.length) / Math.max(filteredRules.length, 1) * 100} className="h-1.5 bg-[#2a2a36]" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Practice Section */}
      <div id="practice-section">
        <h2 className="text-sm text-[#9a9a9a] tracking-widest uppercase mb-4">Practice — Select a Verse</h2>

        <select
          data-testid="tajweed-surah-select"
          className="w-full bg-[#1a1a22] border border-[#E6C364]/20 text-[#E5E2E1] px-4 py-3 text-sm focus:outline-none focus:border-[#E6C364]/50 mb-4 appearance-none cursor-pointer"
          value={selectedSurah || ""}
          onChange={(e) => setSelectedSurah(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Choose a Surah...</option>
          {surahs.map(s => (
            <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>
          ))}
        </select>

        {loadingVerses && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12" />)}
          </div>
        )}
        {!loadingVerses && verses.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {verses.slice(0, 30).map(v => (
              <div
                key={v.verse_key}
                data-testid={`tajweed-verse-${v.verse_key}`}
                className="bg-[#1a1a22] border border-[#E6C364]/15 p-3 flex items-center justify-between cursor-pointer hover:border-[#E6C364]/30 transition-all group"
                onClick={() => navigate(`/tajweed/session/${v.verse_key}`)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-[11px] text-[#E6C364] border border-[#E6C364]/30 px-2 py-0.5 shrink-0">{v.verse_key}</span>
                  <p className="arabic-text text-lg text-[#E5E2E1] truncate" dir="rtl">{v.text_uthmani}</p>
                </div>
                <ChevronRight size={16} className="text-[#9a9a9a] group-hover:text-[#E6C364] transition-colors shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
