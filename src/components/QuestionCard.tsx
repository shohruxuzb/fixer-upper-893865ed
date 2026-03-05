import { useState, useEffect } from "react";
import { IELTSQuestion } from "@/lib/ielts-questions";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";

interface Props {
  question: IELTSQuestion;
  index: number;
  onAnswered: (index: number, data: { audioBlob?: Blob | null; videoBlob?: Blob | null; text?: string }) => void;
  inputMode: "voice" | "text";
}

export function QuestionCard({ question, index, onAnswered, inputMode }: Props) {
  const { isRecording, audioBlob, videoBlob, duration, startRecording, stopRecording, clearRecording, videoPreviewRef } = useAudioRecorder();
  const [typedAnswer, setTypedAnswer] = useState("");
  const answered = inputMode === "voice" ? !!audioBlob : !!typedAnswer.trim();

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Notify parent when audioBlob/videoBlob become available after recording stops
  useEffect(() => {
    if (audioBlob) {
      onAnswered(index, { audioBlob, videoBlob });
    }
  }, [audioBlob, videoBlob]);

  const speakQuestion = () => {
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleStopAndSave = () => {
    stopRecording();
  };

  // Update parent when text changes
  const handleTextChange = (val: string) => {
    setTypedAnswer(val);
    onAnswered(index, { text: val });
  };

  const handleReRecord = () => {
    clearRecording();
    onAnswered(index, {});
  };

  return (
    <div className={`rounded-2xl border bg-card p-5 transition-all ${answered ? "border-primary/40 shadow-sm" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Question {index + 1}
          </span>
          <p className="text-base font-semibold text-foreground mt-1 leading-relaxed">
            {question.question}
          </p>
        </div>
        <Button variant="outline" size="icon" className="shrink-0 rounded-full h-8 w-8" onClick={speakQuestion}>
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {inputMode === "voice" ? (
        <div className="flex items-center gap-3 relative">
          {/* Video preview */}
          <video
            ref={videoPreviewRef}
            className={`absolute bottom-2 right-2 w-[120px] h-[90px] rounded-lg object-cover border-2 border-primary/30 z-10 ${isRecording ? "block" : "hidden"}`}
            muted
            playsInline
            style={{ transform: "scaleX(-1)" }}
          />

          {!audioBlob && !isRecording && (
            <Button variant="outline" size="sm" onClick={startRecording} className="gap-2">
              <Mic className="h-4 w-4 text-primary" /> Start Answer
            </Button>
          )}

          {isRecording && (
            <Button variant="destructive" size="sm" onClick={handleStopAndSave} className="gap-2 animate-pulse">
              <MicOff className="h-4 w-4" /> Stop ({formatTime(duration)})
            </Button>
          )}

          {audioBlob && !isRecording && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">✓ Recorded ({formatTime(duration)})</span>
              <Button variant="ghost" size="sm" onClick={handleReRecord}>
                <RotateCcw className="h-3 w-3 mr-1" /> Redo
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          placeholder="Type your answer here..."
          value={typedAnswer}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      )}
    </div>
  );
}
