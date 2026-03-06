import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { EvaluationCard } from "@/components/EvaluationCard";
import { evaluateAnswer, EvaluationResult } from "@/lib/evaluate";
import { getRandomQuestions, getRandomQuestion, IELTSQuestion } from "@/lib/ielts-questions";
import { savePartResults } from "@/lib/results-store";
import { Loader2, ChevronRight, BookOpen, Mic, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PART_CONFIG: Record<number, { count: number; label: string }> = {
  1: { count: 4, label: "Introduction & Familiar Topics" },
  2: { count: 1, label: "Individual Long Turn (Cue Card)" },
  3: { count: 3, label: "Two-way Discussion" },
};

function SpeakingPartInner({ part }: { part: 1 | 2 | 3 }) {
  const navigate = useNavigate();
  const config = PART_CONFIG[part] || PART_CONFIG[1];

  const [questions] = useState<IELTSQuestion[]>(() =>
    config.count === 1 ? [getRandomQuestion(part)] : getRandomQuestions(part, config.count)
  );

  const [answers, setAnswers] = useState<Record<number, { audioBlob?: Blob | null; videoBlob?: Blob | null; text?: string }>>({});
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const allAnswered = useMemo(() => {
    return questions.every((_, i) => {
      const a = answers[i];
      if (!a) return false;
      return inputMode === "voice" ? !!a.audioBlob : !!a.text?.trim();
    });
  }, [answers, questions, inputMode]);

  const handleAnswered = (index: number, data: { audioBlob?: Blob | null; videoBlob?: Blob | null; text?: string }) => {
    setAnswers((prev) => ({ ...prev, [index]: data }));
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      const evalResults: EvaluationResult[] = [];
      for (let i = 0; i < questions.length; i++) {
        const a = answers[i];
        try {
          const res = await evaluateAnswer({
            question: questions[i].question,
            audioBlob: inputMode === "voice" ? a?.audioBlob : null,
            videoBlob: inputMode === "voice" ? a?.videoBlob : null,
            manualText: inputMode === "text" ? a?.text : undefined,
          });
          evalResults.push(res);
        } catch (innerErr: any) {
          console.error(`Question ${i + 1} evaluation failed:`, innerErr);
          toast.error(`Question ${i + 1} evaluation failed — skipping`);
          evalResults.push({
            transcript: answers[i]?.text || "(recording)",
            evaluation: {
              overall_band: "-",
              fluency: "-",
              vocabulary: "-",
              grammar: "-",
              pronunciation: "-",
              strengths: [],
              weaknesses: [],
              error: innerErr?.message || "Evaluation failed",
            },
          });
        }
      }
      setResults(evalResults);
      savePartResults(part, evalResults);
      setShowResults(true);
    } catch (err: any) {
      toast.error(err.message || "Evaluation failed");
      setShowResults(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextPart = part < 3 ? part + 1 : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  p === part ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Part {p}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Part info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Part {part}: {config.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {config.count} question{config.count > 1 ? "s" : ""} — answer {inputMode === "voice" ? "by speaking" : "by typing"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </div>

        {/* Input Mode Toggle */}
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

        {/* Questions */}
        {!showResults && (
          <>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionCard
                  key={i}
                  question={q}
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

        {/* Results */}
        {showResults && results.length > 0 && (
          <>
            {results.map((r, i) => (
              <div key={i}>
                {results.length > 1 && (
                  <h3 className="text-sm font-semibold text-primary mb-3">Question {i + 1} Results</h3>
                )}
                <EvaluationCard result={r} />
              </div>
            ))}
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

export default function SpeakingPart() {
  const { partNum } = useParams();
  const part = (Number(partNum) || 1) as 1 | 2 | 3;
  return <SpeakingPartInner key={part} part={part} />;
}
