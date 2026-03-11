import React from "react";

interface CueCard {
  topic: string;
  bullets: string[];
  instruction: string;
}

interface Props {
  cueCard: CueCard;
}

export const CueCardDisplay: React.FC<Props> = ({ cueCard }) => {
  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl border bg-card shadow-sm p-6 space-y-4 animate-fade-in">
      <h3 className="text-lg font-bold text-foreground text-center">Candidate Task Card</h3>
      <p className="text-base font-semibold text-foreground">{cueCard.topic}</p>
      <div>
        <p className="text-sm text-muted-foreground mb-2">You should say:</p>
        <ul className="space-y-1.5 pl-4">
          {cueCard.bullets.map((b, i) => (
            <li key={i} className="text-sm text-foreground list-disc">{b}</li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-muted-foreground">{cueCard.instruction}</p>
      <p className="text-sm font-bold text-foreground">
        You will have to talk for 1 to 2 minutes.
      </p>
    </div>
  );
};
