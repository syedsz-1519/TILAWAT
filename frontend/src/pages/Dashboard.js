import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Star, BookOpen, Award, Target, ChevronRight, Mic, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

const FEATURED_SURAHS = [
  { id: 2, name_arabic: "البقرة", name: "Al-Baqarah", mastery: 85, level: "Expert", color: "#2ECC71" },
  { id: 67, name_arabic: "الملك", name: "Al-Mulk", mastery: 40, level: "Novice", color: "#c8943f" },
  { id: 18, name_arabic: "الكهف", name: "Al-Kahf", mastery: 62, level: "Intermediate", color: "#3498DB" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboardStats().then(s => {
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="skeleton h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32" />)}
        </div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div data-testid="dashboard-page" className="max-w-5xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.2em] text-[#c8943f] uppercase mb-2">Hifdh Journey</p>
        <h1 className="text-3xl sm:text-4xl font-light text-[#fdfbf7] mb-1">Mastery & Momentum</h1>
        <p className="translation-text text-base text-[#8b95a5] italic">
          "Verily, He who has ordained the Quran for thee, will bring thee back to the Place of Return."
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {/* Streak */}
        <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6" data-testid="streak-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-full">
              <Flame size={18} className="text-[#E74C3C]" />
            </div>
            <div>
              <p className="text-[11px] text-[#8b95a5] tracking-wider uppercase">Current Streak</p>
              <p className="text-2xl text-[#fdfbf7] font-light">{s.streak_days} <span className="text-sm text-[#8b95a5]">Days</span></p>
            </div>
          </div>
          <Progress value={(s.streak_days / s.streak_target) * 100} className="h-1.5 bg-[#161e2e]" />
          <p className="text-[10px] text-[#8b95a5] mt-2">{s.streak_days} of {s.streak_target} day goal</p>
        </div>

        {/* XP */}
        <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6" data-testid="xp-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-[#c8943f]/10 border border-[#c8943f]/30 rounded-full">
              <Star size={18} className="text-[#c8943f]" />
            </div>
            <div>
              <p className="text-[11px] text-[#8b95a5] tracking-wider uppercase">Total XP</p>
              <p className="text-2xl text-[#fdfbf7] font-light">{s.xp_total} <span className="text-sm text-[#8b95a5]">XP</span></p>
            </div>
          </div>
          <p className="text-sm text-[#c8943f]">Level {s.level}</p>
        </div>

        {/* Accuracy */}
        <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6" data-testid="accuracy-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-full">
              <Target size={18} className="text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-[11px] text-[#8b95a5] tracking-wider uppercase">Average Accuracy</p>
              <p className="text-2xl text-[#fdfbf7] font-light">{s.average_score}%</p>
            </div>
          </div>
          <p className="text-sm text-[#8b95a5]">{s.total_sessions} practice sessions</p>
        </div>
      </div>

      {/* Tajweed Progress */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-[#c8943f]" />
            <p className="text-sm text-[#fdfbf7]">Tajweed Rules Mastery</p>
          </div>
          <span className="text-[11px] text-[#c8943f]">{s.rules_mastered} of {s.total_rules} Rules</span>
        </div>
        <Progress value={(s.rules_mastered / Math.max(s.total_rules, 1)) * 100} className="h-2 bg-[#161e2e]" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <button
          data-testid="dashboard-practice-btn"
          onClick={() => navigate("/tajweed")}
          className="bg-[#0d131f] border border-[#c8943f]/15 p-6 text-left hover:border-[#c8943f]/30 transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-[#c8943f]/10 border border-[#c8943f]/30 rounded-full shrink-0">
            <Mic size={20} className="text-[#c8943f]" />
          </div>
          <div>
            <p className="text-sm text-[#fdfbf7] group-hover:text-[#c8943f] transition-colors">Practice Tajweed</p>
            <p className="text-[11px] text-[#8b95a5]">Record and analyze your recitation</p>
          </div>
          <ChevronRight size={16} className="text-[#8b95a5] group-hover:text-[#c8943f] ml-auto transition-colors" />
        </button>

        <button
          data-testid="dashboard-quiz-btn"
          onClick={() => navigate("/tajweed/quiz")}
          className="bg-[#0d131f] border border-[#c8943f]/15 p-6 text-left hover:border-[#c8943f]/30 transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-[#9B59B6]/10 border border-[#9B59B6]/30 rounded-full shrink-0">
            <Award size={20} className="text-[#9B59B6]" />
          </div>
          <div>
            <p className="text-sm text-[#fdfbf7] group-hover:text-[#c8943f] transition-colors">Tajweed Quiz</p>
            <p className="text-[11px] text-[#8b95a5]">Test your knowledge of Tajweed rules</p>
          </div>
          <ChevronRight size={16} className="text-[#8b95a5] group-hover:text-[#c8943f] ml-auto transition-colors" />
        </button>
      </div>

      {/* Surah Progress Cards */}
      <div className="mb-8">
        <h2 className="text-sm text-[#8b95a5] tracking-widest uppercase mb-4">Surah Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURED_SURAHS.map(surah => (
            <div
              key={surah.id}
              data-testid={`surah-progress-${surah.id}`}
              className="bg-[#0d131f] border border-[#c8943f]/15 p-5 hover:border-[#c8943f]/30 transition-all cursor-pointer"
              onClick={() => navigate(`/mushaf/${surah.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="arabic-text text-2xl text-[#fdfbf7]">{surah.name_arabic}</p>
                  <p className="text-sm text-[#8b95a5]">{surah.name}</p>
                </div>
                <div className="w-14 h-14 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: surah.color }}>
                  <span className="text-lg font-light" style={{ color: surah.color }}>{surah.mastery}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Award size={12} style={{ color: surah.color }} />
                <span className="text-[11px]" style={{ color: surah.color }}>Mastery Level: {surah.level}</span>
              </div>
              <button className="w-full text-center text-sm border border-[#c8943f]/30 text-[#c8943f] py-2 hover:bg-[#c8943f]/10 transition-colors">
                Start Recitation
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inspirational Quote */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 text-center">
        <BookOpen size={16} className="text-[#c8943f] mx-auto mb-3" />
        <p className="arabic-text text-2xl text-[#c8943f] mb-2" dir="rtl">
          إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
        </p>
        <p className="translation-text text-base text-[#8b95a5] italic">
          "Verily, this Quran guides to that which is most right."
        </p>
      </div>
    </div>
  );
}
