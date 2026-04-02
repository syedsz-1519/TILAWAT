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
            style={{ borderColor: results.percentage >= 70 ? "#2ECC71" : results.percentage >= 50 ? "#c8943f" : "#E74C3C" }}>
            <span className="text-4xl font-light" style={{ color: results.percentage >= 70 ? "#2ECC71" : results.percentage >= 50 ? "#c8943f" : "#E74C3C" }}>
              {results.percentage}%
            </span>
          </div>
          <h2 className="text-2xl text-[#fdfbf7] font-light mb-1">Quiz Complete</h2>
          <p className="text-sm text-[#8b95a5]">{results.score} of {results.total} correct</p>
          <div className="inline-flex items-center gap-1.5 mt-3 text-[#c8943f] text-sm">
            <Award size={14} /> +{results.xp_earned} XP Earned
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-4 mb-8">
          {results.results?.map((r, i) => {
            const question = questions.find(q => q.id === r.question_id);
            return (
              <div key={r.question_id} className={`bg-[#0d131f] border p-5 ${r.is_correct ? "border-[#2ECC71]/30" : "border-[#E74C3C]/30"}`}>
                <div className="flex items-start gap-3">
                  {r.is_correct ? <CheckCircle size={18} className="text-[#2ECC71] shrink-0 mt-0.5" /> : <XCircle size={18} className="text-[#E74C3C] shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm text-[#fdfbf7] mb-1">Q{i + 1}: {question?.question}</p>
                    {!r.is_correct && (
                      <p className="text-[11px] text-[#E74C3C] mb-1">Your answer: {r.selected} &middot; Correct: {r.correct}</p>
                    )}
                    <p className="text-[11px] text-[#8b95a5]">{r.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button data-testid="quiz-retry-btn" onClick={() => window.location.reload()}
            className="border border-[#c8943f]/30 text-[#c8943f] px-6 py-2.5 hover:bg-[#c8943f]/10 transition-colors text-sm">
            Retry Quiz
          </button>
          <button data-testid="quiz-dashboard-btn" onClick={() => navigate("/dashboard")}
            className="bg-[#c8943f] text-[#070a0f] px-6 py-2.5 hover:bg-[#e6b058] transition-colors text-sm font-medium">
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
        <h1 className="text-xl font-light text-[#fdfbf7]">Tajweed Mastery Quiz</h1>
        <span className="text-[11px] text-[#8b95a5]">Question {current + 1} of {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-1.5 bg-[#161e2e]" />
        <p className="text-[10px] text-[#c8943f] mt-1 text-right">{Math.round(progress)}%</p>
      </div>

      {q && (
        <div className="animate-fadeIn">
          {/* Verse Snippet */}
          <div className="bg-[#0d131f] border border-[#c8943f]/15 p-6 mb-6 text-center">
            <p className="arabic-text text-3xl text-[#c8943f] mb-2" dir="rtl">{q.verse_snippet}</p>
            <p className="text-[11px] text-[#8b95a5]">{q.verse_ref}</p>
          </div>

          {/* Question */}
          <h2 className="text-base text-[#fdfbf7] mb-6 leading-relaxed">{q.question}</h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {q.options?.map(opt => (
              <button
                key={opt.id}
                data-testid={`quiz-option-${opt.id}`}
                onClick={() => selectAnswer(opt.id)}
                className={`w-full flex items-center gap-4 p-4 border text-left transition-all ${
                  selected === opt.id
                    ? "border-[#c8943f] bg-[#c8943f]/10 text-[#c8943f]"
                    : "border-[#c8943f]/15 bg-[#0d131f] text-[#8b95a5] hover:border-[#c8943f]/30 hover:text-[#fdfbf7]"
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center border text-sm shrink-0 ${
                  selected === opt.id ? "border-[#c8943f] text-[#c8943f]" : "border-[#c8943f]/30 text-[#8b95a5]"
                }`}>{opt.id}</span>
                <span className="text-sm">{opt.text}</span>
                {selected === opt.id && <CheckCircle size={16} className="ml-auto text-[#c8943f]" />}
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
                  ? "bg-[#c8943f] text-[#070a0f] hover:bg-[#e6b058]"
                  : "bg-[#161e2e] text-[#8b95a5] cursor-not-allowed"
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
