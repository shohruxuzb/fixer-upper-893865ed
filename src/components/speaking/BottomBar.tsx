import React from "react";
import { Mic, Check, ChevronRight } from "lucide-react";
import { SoundWaveBars } from "./SoundWaveBars";

interface Props {
  isRecording: boolean;
  hasRecorded: boolean;
  isExaminerSpeaking: boolean;
  isPreparing: boolean;
  prepTimeLeft: number;
  recordingDuration: number;
  onRecord: () => void;
  onNext: () => void;
  onSkipPrep: () => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const BottomBar: React.FC<Props> = ({
  isRecording,
  hasRecorded,
  isExaminerSpeaking,
  isPreparing,
  prepTimeLeft,
  recordingDuration,
  onRecord,
  onNext,
  onSkipPrep,
}) => {
  return (
    <div className="h-[80px] border-t flex items-center justify-between px-6 bg-card"
      style={{ borderColor: "hsl(220, 13%, 90%)" }}
    >
      {/* Left: Record button */}
      <div>
        {!isPreparing && (
          <button
            onClick={onRecord}
            disabled={isExaminerSpeaking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground"
                : hasRecorded
                ? "bg-green-600 text-white"
                : "bg-foreground text-background"
            } disabled:opacity-40`}
          >
            {isRecording ? (
              <>
                <SoundWaveBars color="bg-destructive-foreground" />
                <span>Recording... {fmt(recordingDuration)}</span>
              </>
            ) : hasRecorded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Recorded</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Record</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2 text-sm">
        {isPreparing ? (
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold">
            ⏱ Preparation {fmt(prepTimeLeft)}
          </span>
        ) : isExaminerSpeaking ? (
          <span className="flex items-center gap-2 text-primary">
            <SoundWaveBars color="bg-primary" />
            <span className="font-medium">Examiner speaking...</span>
          </span>
        ) : !isRecording && !hasRecorded ? (
          <span className="text-destructive font-medium">On pause</span>
        ) : null}
      </div>

      {/* Right: Next or Skip */}
      <div className="flex items-center gap-2">
        {isPreparing ? (
          <button
            onClick={onSkipPrep}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Preparation <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!hasRecorded}
            className="flex items-center gap-1 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-sm disabled:opacity-40 transition-all"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
