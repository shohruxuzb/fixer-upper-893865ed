import { EvaluationResult } from "@/lib/evaluate";
import { BandScore } from "./BandScore";
import { CheckCircle, AlertTriangle } from "lucide-react";

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

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-emerald-50/50 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-700 mb-3">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {evaluation.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-amber-50/50 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-amber-700 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Areas to Improve
          </h3>
          <ul className="space-y-1.5">
            {evaluation.weaknesses?.map((w, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
