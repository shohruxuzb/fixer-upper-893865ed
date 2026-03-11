import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchQuestions, fetchTTSAudio, submitEvaluation, pollJobResult, startEmotionTracking, stopEmotionTracking } from "@/lib/api";
import { savePartResults } from "@/lib/results-store";
import { TopBar } from "@/components/speaking/TopBar";
import { BottomBar } from "@/components/speaking/BottomBar";
import { ExaminerAnimation } from "@/components/speaking/ExaminerAnimation";
import { CueCardDisplay } from "@/components/speaking/CueCardDisplay";
import { Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface CueCard {
  topic: string;
  bullets: string[];
  instruction: string;
}

const PREP_TIME = 60;

const SpeakingPartInner: React.FC<{ part: 1 | 2 | 3 }> = ({ part }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Questions state
  const [questions, setQuestions] = useState<string[]>([]);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);

  // Interaction state
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Recorded data
  const answersRef = useRef<{ text: string; audioBlob: Blob | null }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global timer
  useEffect(() => {
    const t = setInterval(() => setElapsedTime((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Load questions
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchQuestions(part, token);
        if (part === 2) {
          setCueCard({ topic: data.topic, bullets: data.bullets, instruction: data.instruction });
          setQuestions([data.topic]);
          setIsPreparing(true);
          setPrepTimeLeft(PREP_TIME);
        } else {
          const qs = Array.isArray(data.questions) ? data.questions : [data.question];
          setQuestions(qs);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    })();
  }, [part, token]);

  // Prep timer
  useEffect(() => {
    if (!isPreparing) return;
    const t = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setIsPreparing(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPreparing]);

  // Play TTS when question changes and not preparing
  useEffect(() => {
    if (loading || !token || questions.length === 0) return;
    if (part === 2 && isPreparing) return;
    playQuestion(questions[currentQ]);
    startEmotionTracking(token).catch(() => {});
  }, [currentQ, loading, isPreparing]);

  // When prep ends for part 2, play question
  useEffect(() => {
    if (part === 2 && !isPreparing && !loading && questions.length > 0) {
      playQuestion(questions[0]);
    }
  }, [isPreparing]);

  const playQuestion = useCallback(async (text: string) => {
    if (!token) return;
    setIsExaminerSpeaking(true);
    try {
      const blob = await fetchTTSAudio(text, token);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsExaminerSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setIsExaminerSpeaking(false);
      await audio.play();
    } catch {
      setIsExaminerSpeaking(false);
    }
  }, [token]);

  const handleReplay = () => {
    if (questions[currentQ]) playQuestion(questions[currentQ]);
  };

  // Recording
  const handleRecord = useCallback(async () => {
    if (isRecording) {
      // Stop
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setIsRecording(false);
      setHasRecorded(true);

      stopEmotionTracking(questions[currentQ], part, token!).catch(() => {});
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          // Store answer
          while (answersRef.current.length <= currentQ) answersRef.current.push({ text: "", audioBlob: null });
          answersRef.current[currentQ] = { text: "", audioBlob: blob };
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        recTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  }, [isRecording, currentQ, questions, part, token]);

  // Next question
  const handleNext = useCallback(async () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1);
      setHasRecorded(false);
      setRecordingDuration(0);
    } else {
      // Submit all answers for evaluation
      setIsEvaluating(true);
      try {
        const qs = questions;
        const ansStrings = qs.map((_, i) => answersRef.current[i]?.text || "");
        const audios = qs.map((_, i) => answersRef.current[i]?.audioBlob || null);

        const jobId = await submitEvaluation(qs, ansStrings, part, token!, audios);
        const result = await pollJobResult(jobId, token!);

        savePartResults(part, [{
          transcript: ansStrings.filter(Boolean).join(" | ") || "Audio response",
          evaluation: result,
        }]);

        if (part < 3) {
          navigate(`/speaking/part/${part + 1}`);
        } else {
          navigate("/results");
        }
      } catch (err: any) {
        toast.error(err.message || "Evaluation failed");
      } finally {
        setIsEvaluating(false);
      }
    }
  }, [currentQ, questions, part, token, navigate]);

  const handleSkipPrep = () => {
    setIsPreparing(false);
    setPrepTimeLeft(0);
  };

  if (!token) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(0,0%,100%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 font-medium text-foreground">Generating questions...</span>
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[hsl(0,0%,100%)] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="font-medium text-foreground">Evaluating your answers...</span>
        <span className="text-sm text-muted-foreground">This may take a moment</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[hsl(0,0%,100%)]">
      <TopBar
        questionNumber={currentQ + 1}
        totalQuestions={questions.length}
        elapsedTime={elapsedTime}
        onClose={() => navigate("/")}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6 overflow-auto">
        {isPreparing && cueCard ? (
          <CueCardDisplay cueCard={cueCard} />
        ) : (
          <>
            <ExaminerAnimation isSpeaking={isExaminerSpeaking} />

            {/* Question text */}
            <div className="flex items-center gap-3 max-w-lg mx-auto animate-fade-in">
              <p className="text-lg font-medium text-muted-foreground text-center">
                {questions[currentQ]}
              </p>
              <button
                onClick={handleReplay}
                className="shrink-0 h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </main>

      <BottomBar
        isRecording={isRecording}
        hasRecorded={hasRecorded}
        isExaminerSpeaking={isExaminerSpeaking}
        isPreparing={isPreparing}
        prepTimeLeft={prepTimeLeft}
        recordingDuration={recordingDuration}
        onRecord={handleRecord}
        onNext={handleNext}
        onSkipPrep={handleSkipPrep}
      />
    </div>
  );
};

const SpeakingPart: React.FC = () => {
  const { partNum } = useParams();
  const part = (Number(partNum) || 1) as 1 | 2 | 3;
  return <SpeakingPartInner key={part} part={part} />;
};

export default SpeakingPart;
