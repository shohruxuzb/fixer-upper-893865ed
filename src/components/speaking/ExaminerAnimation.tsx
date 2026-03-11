import React, { useRef, useEffect } from "react";
import { Player } from "@lottiefiles/react-lottie-player";

interface Props {
  isSpeaking: boolean;
}

const LOTTIE_URL = "https://assets10.lottiefiles.com/packages/lf20_lli9bfqf.json";

export const ExaminerAnimation: React.FC<Props> = ({ isSpeaking }) => {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    // Speed: normal when speaking, slow idle otherwise
    try {
      (player as any).setPlayerSpeed?.(isSpeaking ? 1 : 0.3);
    } catch {}
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-2xl shadow-md overflow-hidden max-w-sm w-full"
        style={{ backgroundColor: "hsl(210, 20%, 98%)" }}
      >
        <Player
          ref={playerRef}
          autoplay
          loop
          src={LOTTIE_URL}
          speed={isSpeaking ? 1 : 0.3}
          style={{ width: "100%", height: "320px" }}
        />
        {/* Status dot */}
        <div className="absolute bottom-3 right-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking ? "bg-green-400" : "bg-blue-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isSpeaking ? "bg-green-500" : "bg-blue-500"
              }`}
            />
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        IELTS Examiner
      </span>
    </div>
  );
};
