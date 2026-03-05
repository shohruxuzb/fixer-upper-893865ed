import { EvaluationResult } from "@/lib/evaluate";
import { BandScore } from "./BandScore";
import { CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface Props {
  result: EvaluationResult;
}

export function EvaluationCard({ result }: Props) {
  const { transcript, evaluation } = result;

  if (evaluation.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        <p className="font-semibold">Evaluation Error</p>
        <p className="text-sm mt-1">{evaluation.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Transcript */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Answer</h3>
        <p className="text-foreground leading-relaxed italic">"{transcript}"</p>
      </div>

      {/* Band Scores */}
      <div className="grid grid-cols-5 gap-3">
        <BandScore label="Overall" score={evaluation.overall_band} size="lg" />
        <BandScore label="Fluency" score={evaluation.fluency} />
        <BandScore label="Vocabulary" score={evaluation.vocabulary} />
        <BandScore label="Grammar" score={evaluation.grammar} />
        <BandScore label="Pronunciation" score={evaluation.pronunciation} />
      </div>

      {/* Emotion Feedback */}
      {evaluation.emotion_feedback && (
        <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--gold) / 0.08)", borderColor: "hsl(var(--gold) / 0.3)" }}>
          <h3 className="flex items-center gap-2 font-semibold mb-2" style={{ color: "hsl(var(--navy))" }}>
            <span className="text-xl">🎭</span>
            Delivery & Confidence
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--navy) / 0.85)" }}>
            {evaluation.emotion_feedback}
          </p>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--success) / 0.05)" }}>
          <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
            <CheckCircle className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {evaluation.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span style={{ color: "hsl(var(--success))" }} className="mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-5" style={{ backgroundColor: "hsl(var(--warning) / 0.05)" }}>
          <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
            Areas to Improve
          </h3>
          <ul className="space-y-1.5">
            {evaluation.weaknesses?.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span style={{ color: "hsl(var(--warning))" }} className="mt-0.5">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Improved Answers */}
      {evaluation.improved_answers && evaluation.improved_answers.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            Improved Sample Answers
          </h3>
          <ul className="space-y-3">
            {evaluation.improved_answers.map((a, i) => (
              <li key={i} className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 italic">
                "{a}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
