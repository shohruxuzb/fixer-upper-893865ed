import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { EvaluationCard } from "@/components/EvaluationCard";
import { fetchQuestions, evaluatePart, startEmotionTracking, stopEmotionTracking } from "@/lib/api";
import { savePartResults } from "@/lib/results-store";
import { Loader2, ChevronRight, BookOpen, Mic, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PART_CONFIG: Record<number, { label: string }> = {
  1: { label: "Introduction & Familiar Topics" },
  2: { label: "Individual Long Turn (Cue Card)" },
  3: { label: "Two-way Discussion" },
};

const SpeakingPartInner: React.FC<{ part: 1 | 2 | 3 }> = ({ part }) => {
  const navigate = useNavigate();
  const config = PART_CONFIG[part] || PART_CONFIG[1];

  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [answers, setAnswers] = useState<Record<number, { audioBlob?: Blob | null; videoBlob?: Blob | null; text?: string }>>({});
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setIsLoadingQuestions(true);
      try {
        const data = await fetchQuestions(part);
        const qs = Array.isArray(data.questions)
          ? data.questions
          : [(data as any).question];
        setQuestions(qs);
      } catch (err) {
        toast.error("Failed to load questions from backend");
      } finally {
        setIsLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [part]);

  const allAnswered = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((_, i) => {
      const a = answers[i];
      if (!a) return false;
      return inputMode === "voice" ? !!a.audioBlob : !!a.text?.trim();
    });
  }, [answers, questions, inputMode]);

  const handleAnswered = (index: number, data: { audioBlob?: Blob | null; videoBlob?: Blob | null; text?: string }) => {
    setAnswers((prev) => ({ ...prev, [index]: data }));

    // Fire and forget emotion tracking calls
    stopEmotionTracking(questions[index], part).catch(err =>
      console.warn("Emotion tracking stop failed", err)
    );

    if (index + 1 < questions.length) {
      startEmotionTracking().catch(err =>
        console.warn("Emotion tracking start failed", err)
      );
    }
  };

  useEffect(() => {
    if (questions.length > 0) {
      startEmotionTracking().catch(err => console.warn("Initial emotion tracking failed", err));
    }
  }, [questions]);

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      const qs = questions;
      const ansStrings = qs.map((_, i) => answers[i]?.text || "");
      const audios = qs.map((_, i) => answers[i]?.audioBlob || null);

      const res = await evaluatePart(qs, ansStrings, audios);

      setResults(res.evaluation);
      savePartResults(part, [{
        transcript: ansStrings.filter(Boolean).join(" | ") || "Audio response",
        evaluation: res.evaluation
      }]);
      setShowResults(true);
    } catch (err: any) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextPart = part < 3 ? part + 1 : null;

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Generating questions...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">IELTS Speaking AI</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((p) => (
              <span
                key={p}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${p === part ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
              >
                Part {p}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Part {part}: {config.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {questions.length} question{questions.length > 1 ? "s" : ""} — answer {inputMode === "voice" ? "by speaking" : "by typing"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </div>

        {!showResults && (
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant={inputMode === "voice" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("voice")}
              className="rounded-full"
            >
              <Mic className="h-4 w-4 mr-1" /> Voice
            </Button>
            <Button
              variant={inputMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("text")}
              className="rounded-full"
            >
              <Send className="h-4 w-4 mr-1" /> Type
            </Button>
          </div>
        )}

        {!showResults && (
          <>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionCard
                  key={i}
                  question={{ part, question: q }}
                  index={i}
                  onAnswered={handleAnswered}
                  inputMode={inputMode}
                />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!allAnswered || isEvaluating}
                className="rounded-xl font-bold"
              >
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evaluating...</>
                ) : (
                  <>Submit Part {part}<ChevronRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </div>
          </>
        )}

        {showResults && results && (
          <>
            <EvaluationCard
              result={{
                transcript: "Part evaluation completed",
                evaluation: results
              }}
            />
            <div className="flex justify-center gap-3 pt-4">
              {nextPart ? (
                <Button size="lg" onClick={() => navigate(`/speaking/part/${nextPart}`)} className="rounded-xl font-bold">
                  Continue to Part {nextPart}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate("/results")} className="rounded-xl font-bold">
                  View Overall Results
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="rounded-xl font-bold">
                Back to Home
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const SpeakingPart: React.FC = () => {
  const { partNum } = useParams();
  const part = (Number(partNum) || 1) as 1 | 2 | 3;
  return <SpeakingPartInner key={part} part={part} />;
};

export default SpeakingPart;
