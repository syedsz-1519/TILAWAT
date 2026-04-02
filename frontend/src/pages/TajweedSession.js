import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, RotateCcw, ChevronRight, Play, Star, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

export default function TajweedSession() {
  const { verseKey } = useParams();
  const navigate = useNavigate();
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordState, setRecordState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!verseKey) return;
    api.getVerse(verseKey).then(v => { setVerse(v); setLoading(false); }).catch(() => setLoading(false));
  }, [verseKey]);

  useEffect(() => {
    if (recordState !== "countdown") return;
    if (countdown <= 0) { setRecordState("recording"); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [recordState, countdown]);

  useEffect(() => {
    if (recordState !== "recording") return;
    const timer = setTimeout(() => {
      setRecordState("processing");
      api.createTajweedSession(verseKey).then(session => { setResult(session); setRecordState("done"); }).catch(() => setRecordState("idle"));
    }, 4000);
    return () => clearTimeout(timer);
  }, [recordState, verseKey]);

  const startRecording = useCallback(() => { setResult(null); setCountdown(3); setRecordState("countdown"); }, []);
  const retry = useCallback(() => { setResult(null); setRecordState("idle"); }, []);

  const getScoreColor = (score) => score >= 85 ? "#2ECC71" : score >= 70 ? "#c8943f" : "#E74C3C";
  const getScoreLabel = (score) => score >= 90 ? "Excellent" : score >= 80 ? "Good" : score >= 70 ? "Needs Work" : "Practice More";

  // SVG circle for score ring
  const ScoreRing = ({ score, size = 120 }) => {
    const r = (size - 12) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#161e2e" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
    );
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12"><div className="skeleton h-10 w-64 mx-auto mb-8" /><div className="skeleton h-32 w-full mb-8" /></div>;
  }

  return (
    <div data-testid="tajweed-session" className="max-w-3xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8b95a5] mb-6">
        <button onClick={() => navigate("/tajweed")} className="hover:text-[#c8943f] transition-colors">Tajweed</button>
        <ChevronRight size={14} />
        <span className="text-[#c8943f]">Practice Session</span>
      </div>

      {/* Verse Card */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-[#fdfbf7]">{verse?.verse_key}</p>
            <p className="text-[11px] text-[#8b95a5]">Surah {verse?.surah_id}</p>
          </div>
          <button data-testid="listen-reference-btn" className="flex items-center gap-2 text-[11px] text-[#c8943f] border border-[#c8943f]/30 px-3 py-1.5 hover:bg-[#c8943f]/10 transition-colors">
            <Play size={12} /> Listen to Sheikh Al-Afasy
          </button>
        </div>
        <p className="arabic-text text-3xl sm:text-4xl text-[#fdfbf7] leading-[2.2] text-center" dir="rtl">{verse?.text_uthmani}</p>
        {verse?.translation_en && (
          <div className="mt-5 pt-4 border-t border-[#c8943f]/10">
            <p className="text-[10px] text-[#8b95a5] tracking-wider uppercase mb-1">English &middot; Sahih International</p>
            <p className="translation-text text-base text-[#8b95a5] italic">"{verse.translation_en}"</p>
          </div>
        )}
      </div>

      {/* Recording Area */}
      <div className="flex flex-col items-center justify-center min-h-[35vh] gap-6">
        {recordState === "idle" && (
          <>
            <button data-testid="tajweed-record-btn" onClick={startRecording}
              className="w-28 h-28 rounded-full bg-[#c8943f]/10 border border-[#c8943f]/30 flex items-center justify-center text-[#c8943f] hover:bg-[#c8943f]/20 hover:scale-105 transition-all duration-300 relative">
              <Mic size={36} />
            </button>
            <p className="text-sm text-[#8b95a5]">Tap to start recording</p>
          </>
        )}

        {recordState === "countdown" && (
          <>
            <div className="w-28 h-28 rounded-full border-2 border-[#c8943f] flex items-center justify-center">
              <span className="text-5xl text-[#c8943f] font-light">{countdown}</span>
            </div>
            <p className="text-sm text-[#c8943f] tracking-widest uppercase">Get Ready...</p>
          </>
        )}

        {recordState === "recording" && (
          <>
            <div className="w-28 h-28 rounded-full bg-[#E74C3C]/10 border border-[#E74C3C]/40 flex items-center justify-center relative">
              <MicOff size={36} className="text-[#E74C3C]" />
              <span className="absolute inset-0 rounded-full border border-[#E74C3C] animate-ping opacity-20" />
            </div>
            <p className="text-sm text-[#E74C3C] tracking-widest uppercase">Recording... Click to finish</p>
            <div className="flex items-center gap-1 h-8">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-1 bg-[#c8943f] rounded-full" style={{ height: `${Math.random() * 28 + 4}px`, animation: `pulse ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate`, animationDelay: `${i * 0.04}s` }} />
              ))}
            </div>
          </>
        )}

        {recordState === "processing" && (
          <>
            <div className="w-28 h-28 rounded-full border border-[#c8943f]/30 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#c8943f] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-[#c8943f] tracking-widest uppercase">Analyzing Recitation...</p>
          </>
        )}

        {recordState === "done" && result && (
          <div className="w-full animate-slideUp">
            {/* Score + XP Row */}
            <div className="flex items-center justify-center gap-8 mb-8">
              {/* Score Ring */}
              <div className="relative">
                <ScoreRing score={result.overall_score} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-light" style={{ color: getScoreColor(result.overall_score) }}>{result.overall_score}%</span>
                  <span className="text-[10px] text-[#8b95a5]">Accuracy</span>
                </div>
              </div>
              {/* XP Badge */}
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-[#c8943f] mb-1">
                  <Star size={18} />
                  <span className="text-2xl font-light">+{result.word_scores?.length * 10 || 50}</span>
                </div>
                <p className="text-[11px] text-[#8b95a5]">XP Earned</p>
                <p className="text-xs mt-2" style={{ color: getScoreColor(result.overall_score) }}>{getScoreLabel(result.overall_score)}</p>
              </div>
            </div>

            {/* Tajweed Analysis */}
            {result.word_scores?.some(ws => ws.errors?.length > 0) && (
              <div className="bg-[#0d131f] border border-[#c8943f]/15 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} className="text-[#c8943f]" />
                  <p className="text-sm text-[#fdfbf7]">Tajweed Analysis</p>
                </div>
                <div className="space-y-3">
                  {result.word_scores?.filter(ws => ws.errors?.length > 0).map(ws => (
                    <div key={ws.position} className="flex items-start gap-3 p-3 border border-[#c8943f]/10 bg-[#070a0f]">
                      <span className="text-[11px] text-[#8b95a5] shrink-0 mt-0.5">Word {ws.position}</span>
                      <span className="arabic-text text-lg shrink-0" style={{ color: getScoreColor(ws.score) }}>{ws.text}</span>
                      <div className="flex-1">
                        {ws.errors.map((err, j) => (
                          <p key={j} className="text-[11px] text-[#8b95a5]">
                            <span className="font-medium" style={{ color: err.color }}>{err.name || err.rule}</span> rule — needs attention ({ws.score}%)
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Word Scores Grid */}
            <div className="bg-[#0d131f] border border-[#c8943f]/15 p-5 mb-6">
              <p className="text-[11px] text-[#8b95a5] tracking-widest uppercase mb-4">Word-by-Word Score</p>
              <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                {result.word_scores?.map(ws => (
                  <div key={ws.position} data-testid={`word-score-${ws.position}`}
                    className="text-center p-2.5 border transition-colors min-w-[60px]"
                    style={{ borderColor: getScoreColor(ws.score) + "40", backgroundColor: getScoreColor(ws.score) + "08" }}>
                    <p className="arabic-text text-xl" style={{ color: getScoreColor(ws.score) }}>{ws.text}</p>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: getScoreColor(ws.score) }}>{ws.score}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button data-testid="tajweed-retry-btn" onClick={retry}
                className="flex items-center gap-2 border border-[#c8943f]/30 text-[#c8943f] px-6 py-2.5 hover:bg-[#c8943f]/10 transition-colors text-sm">
                <RotateCcw size={14} /> Retry Session
              </button>
              <button data-testid="tajweed-next-btn" onClick={() => navigate("/tajweed")}
                className="flex items-center gap-2 bg-[#c8943f] text-[#070a0f] px-6 py-2.5 hover:bg-[#e6b058] transition-colors text-sm font-medium">
                Next Verse <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
