import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, RotateCcw, ChevronRight, Play, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function TajweedSession() {
  const { verseKey } = useParams();
  const navigate = useNavigate();
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordState, setRecordState] = useState("idle"); // idle | countdown | recording | processing | done
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!verseKey) return;
    api.getVerse(verseKey).then(v => {
      setVerse(v);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [verseKey]);

  // Countdown logic
  useEffect(() => {
    if (recordState !== "countdown") return;
    if (countdown <= 0) {
      setRecordState("recording");
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [recordState, countdown]);

  // Recording simulation
  useEffect(() => {
    if (recordState !== "recording") return;
    const timer = setTimeout(() => {
      setRecordState("processing");
      // Submit mock session
      api.createTajweedSession(verseKey).then(session => {
        setResult(session);
        setRecordState("done");
      }).catch(() => setRecordState("idle"));
    }, 4000);
    return () => clearTimeout(timer);
  }, [recordState, verseKey]);

  const startRecording = useCallback(() => {
    setResult(null);
    setCountdown(3);
    setRecordState("countdown");
  }, []);

  const retry = useCallback(() => {
    setResult(null);
    setRecordState("idle");
  }, []);

  const getScoreColor = (score) => {
    if (score >= 85) return "#2ECC71";
    if (score >= 70) return "#c8943f";
    return "#E74C3C";
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <div className="skeleton h-10 w-64 mx-auto mb-8" />
        <div className="skeleton h-32 w-full mb-8" />
      </div>
    );
  }

  return (
    <div data-testid="tajweed-session" className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-[#8b95a5] mb-8">
        <button onClick={() => navigate("/tajweed")} className="hover:text-[#c8943f] transition-colors">
          Tajweed
        </button>
        <ChevronRight size={14} />
        <span className="text-[#c8943f]">{verseKey}</span>
      </div>

      {/* Verse Display */}
      <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 sm:p-8 mb-8 text-center">
        <p className="text-[11px] text-[#8b95a5] tracking-widest uppercase mb-4">Target Verse</p>
        <p className="arabic-text text-3xl sm:text-4xl text-[#fdfbf7] leading-[2.2]" dir="rtl">
          {verse?.text_uthmani}
        </p>
        {verse?.translation_en && (
          <p className="translation-text text-lg text-[#8b95a5] mt-4">{verse.translation_en}</p>
        )}
      </div>

      {/* Recording Area */}
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        {recordState === "idle" && (
          <>
            <button
              data-testid="tajweed-record-btn"
              onClick={startRecording}
              className="w-28 h-28 rounded-full bg-[#c8943f]/10 border border-[#c8943f]/30 flex items-center justify-center text-[#c8943f] hover:bg-[#c8943f]/20 hover:scale-105 transition-all duration-300"
            >
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
            <div className="w-28 h-28 rounded-full bg-[#E74C3C]/10 border border-[#E74C3C]/40 flex items-center justify-center relative animate-pulse-gold">
              <MicOff size={36} className="text-[#E74C3C]" />
              <span className="absolute inset-0 rounded-full border border-[#E74C3C] animate-ping opacity-20" />
            </div>
            <p className="text-sm text-[#E74C3C] tracking-widest uppercase">Recording...</p>
            {/* Simulated waveform */}
            <div className="flex items-center gap-1 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#c8943f] rounded-full"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {recordState === "processing" && (
          <>
            <div className="w-28 h-28 rounded-full border border-[#c8943f]/30 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#c8943f] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-[#c8943f] tracking-widest uppercase">Analyzing...</p>
          </>
        )}

        {recordState === "done" && result && (
          <div className="w-full animate-slideUp">
            {/* Overall Score */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4"
                style={{ borderColor: getScoreColor(result.overall_score) }}
              >
                <span className="text-4xl font-light" style={{ color: getScoreColor(result.overall_score) }}>
                  {result.overall_score}
                </span>
              </div>
              <p className="text-sm text-[#8b95a5] mt-3">Overall Score</p>
            </div>

            {/* Word Scores */}
            <div className="bg-[#0d131f] border border-[#c8943f]/15 p-5 mb-6">
              <p className="text-[11px] text-[#8b95a5] tracking-widest uppercase mb-4">Word Analysis</p>
              <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                {result.word_scores?.map((ws) => (
                  <div
                    key={ws.position}
                    data-testid={`word-score-${ws.position}`}
                    className="text-center p-2 border transition-colors"
                    style={{
                      borderColor: getScoreColor(ws.score) + "40",
                      backgroundColor: getScoreColor(ws.score) + "10",
                    }}
                  >
                    <p className="arabic-text text-xl" style={{ color: getScoreColor(ws.score) }}>
                      {ws.text}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: getScoreColor(ws.score) }}>
                      {ws.score}%
                    </p>
                    {ws.errors?.map((err, j) => (
                      <span
                        key={j}
                        className="inline-block text-[9px] mt-1 px-1 rounded-sm"
                        style={{ background: err.color + "20", color: err.color }}
                      >
                        {err.name || err.rule}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                data-testid="tajweed-retry-btn"
                onClick={retry}
                className="flex items-center gap-2 border border-[#c8943f]/30 text-[#c8943f] px-6 py-2.5 hover:bg-[#c8943f]/10 transition-colors text-sm"
              >
                <RotateCcw size={14} /> Retry
              </button>
              <button
                data-testid="tajweed-next-btn"
                onClick={() => navigate("/tajweed")}
                className="flex items-center gap-2 bg-[#c8943f] text-[#070a0f] px-6 py-2.5 hover:bg-[#e6b058] transition-colors text-sm font-medium"
              >
                Next Verse <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
