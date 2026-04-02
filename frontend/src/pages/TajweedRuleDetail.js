import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Play, Mic, BookOpen, Lightbulb } from "lucide-react";
import api from "@/lib/api";

export default function TajweedRuleDetail() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ruleId) return;
    api.getTajweedRule(ruleId).then(r => {
      setRule(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ruleId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <div className="skeleton h-10 w-64 mb-6" />
        <div className="skeleton h-40 w-full mb-6" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 text-center">
        <p className="text-[#8b95a5]">Rule not found</p>
      </div>
    );
  }

  return (
    <div data-testid="tajweed-rule-detail" className="max-w-3xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8b95a5] mb-8">
        <button onClick={() => navigate("/tajweed")} className="hover:text-[#c8943f] transition-colors">Tajweed Rules</button>
        <ChevronRight size={14} />
        <span className="text-[#c8943f]">{rule.name}</span>
      </div>

      {/* Rule Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-4 h-4 rounded-full shrink-0" style={{ background: rule.color }} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#fdfbf7]">{rule.name} <span className="text-[#8b95a5]">({rule.name_arabic})</span></h1>
          <p className="text-sm text-[#8b95a5] mt-1">{rule.description}</p>
        </div>
      </div>

      {/* Rule Overview */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-[#c8943f]" />
          <h2 className="text-sm text-[#fdfbf7] tracking-wider uppercase">Rule Overview</h2>
        </div>
        <p className="text-base text-[#8b95a5] leading-relaxed">{rule.overview}</p>
      </div>

      {/* Example */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 mb-6">
        <h2 className="text-[11px] text-[#8b95a5] tracking-widest uppercase mb-4">Example in Context</h2>
        <div className="text-center">
          <p className="arabic-text text-4xl mb-3" style={{ color: rule.color }} dir="rtl">{rule.example}</p>
          <p className="text-sm text-[#8b95a5]">{rule.example_ref}</p>
        </div>
      </div>

      {/* Practice Tip */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 mb-8">
        <div className="flex items-start gap-3">
          <Lightbulb size={16} className="text-[#c8943f] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm text-[#fdfbf7] mb-2">Practice Tip</h3>
            <p className="text-sm text-[#8b95a5] leading-relaxed">{rule.practice_tip}</p>
          </div>
        </div>
      </div>

      {/* Practice Guide Actions */}
      <h2 className="text-sm text-[#8b95a5] tracking-widest uppercase mb-4">Practice Guide</h2>
      <div className="space-y-3">
        <button
          data-testid="rule-practice-recording"
          onClick={() => navigate("/tajweed")}
          className="w-full bg-[#0d131f] border border-[#c8943f]/15 p-5 flex items-center gap-4 hover:border-[#c8943f]/30 transition-all group"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-[#c8943f]/10 border border-[#c8943f]/30 rounded-full shrink-0">
            <Mic size={16} className="text-[#c8943f]" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm text-[#fdfbf7] group-hover:text-[#c8943f] transition-colors">Recording Session</p>
            <p className="text-[11px] text-[#8b95a5]">Record your recitation to compare with the master</p>
          </div>
          <ChevronRight size={16} className="text-[#8b95a5] group-hover:text-[#c8943f] transition-colors" />
        </button>

        <button
          data-testid="rule-practice-quiz"
          onClick={() => navigate("/tajweed/quiz")}
          className="w-full bg-[#0d131f] border border-[#c8943f]/15 p-5 flex items-center gap-4 hover:border-[#c8943f]/30 transition-all group"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-[#9B59B6]/10 border border-[#9B59B6]/30 rounded-full shrink-0">
            <BookOpen size={16} className="text-[#9B59B6]" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm text-[#fdfbf7] group-hover:text-[#c8943f] transition-colors">Rule Identification</p>
            <p className="text-[11px] text-[#8b95a5]">Test your knowledge with quiz questions</p>
          </div>
          <ChevronRight size={16} className="text-[#8b95a5] group-hover:text-[#c8943f] transition-colors" />
        </button>
      </div>
    </div>
  );
}
