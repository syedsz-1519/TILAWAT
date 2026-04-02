import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle, XCircle, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

export default function TajweedQuiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuizQuestions(8).then(d => {
      setQuestions(d.questions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const q = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  const selectAnswer = useCallback((optionId) => {
    if (submitted) return;
    setSelected(optionId);
  }, [submitted]);

  const nextQuestion = useCallback(() => {
    if (selected) {
      const newAnswers = { ...answers, [String(q.id)]: selected };
      setAnswers(newAnswers);

      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        // Submit quiz
        setSubmitted(true);
        api.submitQuiz(newAnswers).then(r => setResults(r)).catch(() => {});
      }
    }
  }, [selected, answers, q, current, questions.length]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-48 w-full mb-6" />
      </div>
    );
  }

  // Results Screen
  if (submitted && results) {
    return (
      <div data-testid="quiz-results" className="max-w-2xl mx-auto px-4 sm:px-8 py-12 pb-32">
        <div className="text-center mb-10 animate-slideUp">
          <div className="w-28 h-28 mx-auto mb-4 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: results.percentage >= 70 ? "#2ECC71" : results.percentage >= 50 ? "#E6C364" : "#E74C3C" }}>
            <span className="text-4xl font-light" style={{ color: results.percentage >= 70 ? "#2ECC71" : results.percentage >= 50 ? "#E6C364" : "#E74C3C" }}>
              {results.percentage}%
            </span>
          </div>
          <h2 className="text-2xl text-[#E5E2E1] font-light mb-1">Quiz Complete</h2>
          <p className="text-sm text-[#9a9a9a]">{results.score} of {results.total} correct</p>
          <div className="inline-flex items-center gap-1.5 mt-3 text-[#E6C364] text-sm">
            <Award size={14} /> +{results.xp_earned} XP Earned
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-4 mb-8">
          {results.results?.map((r, i) => {
            const question = questions.find(q => q.id === r.question_id);
            return (
              <div key={r.question_id} className={`bg-[#1a1a22] border p-5 ${r.is_correct ? "border-[#2ECC71]/30" : "border-[#E74C3C]/30"}`}>
                <div className="flex items-start gap-3">
                  {r.is_correct ? <CheckCircle size={18} className="text-[#2ECC71] shrink-0 mt-0.5" /> : <XCircle size={18} className="text-[#E74C3C] shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm text-[#E5E2E1] mb-1">Q{i + 1}: {question?.question}</p>
                    {!r.is_correct && (
                      <p className="text-[11px] text-[#E74C3C] mb-1">Your answer: {r.selected} &middot; Correct: {r.correct}</p>
                    )}
                    <p className="text-[11px] text-[#9a9a9a]">{r.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button data-testid="quiz-retry-btn" onClick={() => window.location.reload()}
            className="border border-[#E6C364]/30 text-[#E6C364] px-6 py-2.5 hover:bg-[#E6C364]/10 transition-colors text-sm">
            Retry Quiz
          </button>
          <button data-testid="quiz-dashboard-btn" onClick={() => navigate("/dashboard")}
            className="bg-[#E6C364] text-[#111116] px-6 py-2.5 hover:bg-[#f0d47a] transition-colors text-sm font-medium">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div data-testid="tajweed-quiz" className="max-w-2xl mx-auto px-4 sm:px-8 py-12 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-light text-[#E5E2E1]">Tajweed Mastery Quiz</h1>
        <span className="text-[11px] text-[#9a9a9a]">Question {current + 1} of {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-1.5 bg-[#2a2a36]" />
        <p className="text-[10px] text-[#E6C364] mt-1 text-right">{Math.round(progress)}%</p>
      </div>

      {q && (
        <div className="animate-fadeIn">
          {/* Verse Snippet */}
          <div className="bg-[#1a1a22] border border-[#E6C364]/15 p-6 mb-6 text-center">
            <p className="arabic-text text-3xl text-[#E6C364] mb-2" dir="rtl">{q.verse_snippet}</p>
            <p className="text-[11px] text-[#9a9a9a]">{q.verse_ref}</p>
          </div>

          {/* Question */}
          <h2 className="text-base text-[#E5E2E1] mb-6 leading-relaxed">{q.question}</h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {q.options?.map(opt => (
              <button
                key={opt.id}
                data-testid={`quiz-option-${opt.id}`}
                onClick={() => selectAnswer(opt.id)}
                className={`w-full flex items-center gap-4 p-4 border text-left transition-all ${
                  selected === opt.id
                    ? "border-[#E6C364] bg-[#E6C364]/10 text-[#E6C364]"
                    : "border-[#E6C364]/15 bg-[#1a1a22] text-[#9a9a9a] hover:border-[#E6C364]/30 hover:text-[#E5E2E1]"
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center border text-sm shrink-0 ${
                  selected === opt.id ? "border-[#E6C364] text-[#E6C364]" : "border-[#E6C364]/30 text-[#9a9a9a]"
                }`}>{opt.id}</span>
                <span className="text-sm">{opt.text}</span>
                {selected === opt.id && <CheckCircle size={16} className="ml-auto text-[#E6C364]" />}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              data-testid="quiz-next-btn"
              onClick={nextQuestion}
              disabled={!selected}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                selected
                  ? "bg-[#E6C364] text-[#111116] hover:bg-[#f0d47a]"
                  : "bg-[#2a2a36] text-[#9a9a9a] cursor-not-allowed"
              }`}
            >
              {current < questions.length - 1 ? "Next Question" : "Submit Quiz"}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
