import React from "react";
import { X, Lightbulb } from "lucide-react";

interface Props {
  questionNumber: number;
  totalQuestions: number;
  elapsedTime: number;
  onClose: () => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const TopBar: React.FC<Props> = ({ questionNumber, totalQuestions, elapsedTime, onClose }) => {
  return (
    <header className="h-[60px] flex items-center justify-between px-4 border-b bg-card/80 backdrop-blur sticky top-0 z-20">
      <span className="font-bold text-foreground text-lg">IELTS Speaking AI</span>

      <button className="flex items-center gap-2 px-4 py-1.5 rounded-full shadow-sm text-sm font-bold text-foreground"
        style={{ backgroundColor: "hsl(220, 14%, 96%)" }}
      >
        <Lightbulb className="h-4 w-4" />
        Tips & Tricks
      </button>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full border text-xs font-mono text-muted-foreground">
          Total: {questionNumber} / {totalQuestions} · {fmt(elapsedTime)}
        </span>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
