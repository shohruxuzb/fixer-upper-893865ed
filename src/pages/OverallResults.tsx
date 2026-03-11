import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BandScore } from "@/components/BandScore";
import { getAllPartResults, clearAllResults, PartResults } from "@/lib/results-store";
import { aggregateResults } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, ArrowLeft, Volume2, VolumeX, CheckCircle, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 2) / 2; // round to nearest 0.5
}

function parseScore(s: string | number): number {
  const n = typeof s === "number" ? s : parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export default function OverallResults() {
  const navigate = useNavigate();
  const [partResults, setPartResults] = useState<PartResults[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [weightedBand, setWeightedBand] = useState<number | null>(null);
  const [isAggregating, setIsAggregating] = useState(false);

  useEffect(() => {
    const results = getAllPartResults();
    if (!results.length) {
      navigate("/");
      return;
    }
    const sortedResults = results.sort((a, b) => a.part - b.part);
    setPartResults(sortedResults);

    async function fetchAggregation() {
      setIsAggregating(true);
      try {
        const evaluations = sortedResults.map(r => r.results[0].evaluation);
        const agg = await aggregateResults(evaluations);
        setWeightedBand(agg.weighted_band);
      } catch (err) {
        console.error("Aggregation failed", err);
      } finally {
        setIsAggregating(false);
      }
    }
    fetchAggregation();
  }, [navigate]);

  // Collect all valid evaluations
  const allEvals = partResults.flatMap((pr) =>
    pr.results.filter((r) => !r.evaluation.error)
  );

  const overallBand = weightedBand ?? avg(allEvals.map((e) => parseScore(e.evaluation.overall_band)));

  const overallFluency = avg(allEvals.map((e) => parseScore(e.evaluation.fluency)));
  const overallVocabulary = avg(allEvals.map((e) => parseScore(e.evaluation.vocabulary)));
  const overallGrammar = avg(allEvals.map((e) => parseScore(e.evaluation.grammar)));
  const overallPronunciation = avg(allEvals.map((e) => parseScore(e.evaluation.pronunciation)));

  // Aggregate strengths and weaknesses (deduplicated)
  const allStrengths = [...new Set(allEvals.flatMap((e) => e.evaluation.strengths || []))];
  const allWeaknesses = [...new Set(allEvals.flatMap((e) => e.evaluation.weaknesses || []))];
  const allEmotions = allEvals
    .map((e) => e.evaluation.emotion_feedback)
    .filter(Boolean) as string[];

  // Per-part band scores
  const partBands = partResults.map((pr) => {
    const valid = pr.results.filter((r) => !r.evaluation.error);
    return {
      part: pr.part,
      band: avg(valid.map((r) => parseScore(r.evaluation.overall_band))),
    };
  });

  // TTS
  const buildSpeechText = useCallback(() => {
    let text = `Your overall IELTS Speaking band score is ${overallBand}. `;

    partBands.forEach((pb) => {
      text += `In Part ${pb.part}, you scored ${pb.band}. `;
    });

    text += `Your fluency score is ${overallFluency}. `;
    text += `Your vocabulary score is ${overallVocabulary}. `;
    text += `Your grammar score is ${overallGrammar}. `;
    text += `Your pronunciation score is ${overallPronunciation}. `;

    if (allStrengths.length) {
      text += `Your key strengths include: ${allStrengths.slice(0, 5).join(", ")}. `;
    }
    if (allWeaknesses.length) {
      text += `Areas to improve: ${allWeaknesses.slice(0, 5).join(", ")}. `;
    }
    if (allEmotions.length) {
      text += `Regarding your delivery and confidence: ${allEmotions[0]}`;
    }

    return text;
  }, [overallBand, overallFluency, overallVocabulary, overallGrammar, overallPronunciation, partBands, allStrengths, allWeaknesses, allEmotions]);

  const speakResults = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(buildSpeechText());
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [buildSpeechText]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const handleRetake = () => {
    clearAllResults();
    navigate("/speaking/part/1");
  };

  if (!partResults.length) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">IELTS Speaking AI</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
            Overall Results
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Title + TTS */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">Overall Results</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Combined evaluation across all {partResults.length} part{partResults.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant={isSpeaking ? "destructive" : "outline"}
            size="sm"
            onClick={isSpeaking ? stopSpeaking : speakResults}
            className="gap-2 rounded-full"
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isSpeaking ? "Stop" : "Listen"}
          </Button>
        </div>

        {/* Overall Band */}
        <div className="grid grid-cols-5 gap-3">
          <BandScore label="Overall" score={overallBand} size="lg" />
          <BandScore label="Fluency" score={overallFluency} />
          <BandScore label="Vocabulary" score={overallVocabulary} />
          <BandScore label="Grammar" score={overallGrammar} />
          <BandScore label="Pronunciation" score={overallPronunciation} />
        </div>

        {/* Per-Part Breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Part Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            {partBands.map((pb) => (
              <div key={pb.part} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground">Part {pb.part}</p>
                <p className="text-2xl font-black text-foreground mt-1">{pb.band}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--success) / 0.05)" }}>
            <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <CheckCircle className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
              Key Strengths
            </h3>
            <ul className="space-y-1.5">
              {allStrengths.length ? allStrengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span style={{ color: "hsl(var(--success))" }} className="mt-0.5">•</span> {s}
                </li>
              )) : (
                <li className="text-sm text-muted-foreground italic">No data available</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--warning) / 0.05)" }}>
            <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
              Areas to Improve
            </h3>
            <ul className="space-y-1.5">
              {allWeaknesses.length ? allWeaknesses.map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span style={{ color: "hsl(var(--warning))" }} className="mt-0.5">•</span> {w}
                </li>
              )) : (
                <li className="text-sm text-muted-foreground italic">No data available</li>
              )}
            </ul>
          </div>
        </div>

        {/* Emotion / Delivery section */}
        {allEmotions.length > 0 && (
          <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--gold) / 0.08)", borderColor: "hsl(var(--gold) / 0.3)" }}>
            <h3 className="flex items-center gap-2 font-semibold mb-3" style={{ color: "hsl(var(--navy))" }}>
              <span className="text-xl">🎭</span>
              Delivery & Confidence
            </h3>
            <div className="space-y-2">
              {allEmotions.map((em, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: "hsl(var(--navy) / 0.85)" }}>
                  <span className="font-medium">Part {partResults.find((pr) =>
                    pr.results.some((r) => r.evaluation.emotion_feedback === em)
                  )?.part}: </span>
                  {em}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4">
          <Button size="lg" onClick={handleRetake} className="rounded-xl font-bold gap-2">
            <RotateCcw className="h-4 w-4" /> Retake Test
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/")} className="rounded-xl font-bold gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
}
