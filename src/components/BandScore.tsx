import { cn } from "@/lib/utils";

interface BandScoreProps {
  label: string;
  score: string | number;
  size?: "sm" | "lg";
}

function getBandColor(score: number) {
  if (score >= 7) return "text-emerald-600 border-emerald-200 bg-emerald-50";
  if (score >= 5.5) return "text-amber-600 border-amber-200 bg-amber-50";
  return "text-red-500 border-red-200 bg-red-50";
}

export function BandScore({ label, score, size = "sm" }: BandScoreProps) {
  const numScore = typeof score === "number" ? score : parseFloat(score) || 0;
  const isLarge = size === "lg";

  return (
    <div className={cn(
      "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
      getBandColor(numScore),
      isLarge && "p-5"
    )}>
      <span className={cn(
        "font-black tabular-nums",
        isLarge ? "text-4xl" : "text-2xl"
      )}>
        {score}
      </span>
      <span className={cn(
        "font-medium opacity-80 mt-1",
        isLarge ? "text-sm" : "text-xs"
      )}>
        {label}
      </span>
    </div>
  );
}
