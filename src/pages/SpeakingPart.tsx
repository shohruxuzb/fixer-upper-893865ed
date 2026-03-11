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
        const data = await fetchQuestions(part, token) as any;
        if (part === 2) {
          setCueCard({
            topic: data.topic || "",
            bullets: data.bullets || [],
            instruction: data.instruction || ""
          });
          setQuestions([data.topic || ""]);
          setIsPreparing(true);
          setPrepTimeLeft(PREP_TIME);
        } else {
          const qs = Array.isArray(data.questions) ? data.questions : (data.question ? [data.question] : []);
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

  const playQuestion = useCallback((text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    setIsExaminerSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en-US'));
    if (englishVoice) utterance.voice = englishVoice;
    utterance.onend = () => setIsExaminerSpeaking(false);
    utterance.onerror = () => setIsExaminerSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Play TTS when question changes and not preparing
  useEffect(() => {
    if (loading || !token || questions.length === 0) return;
    if (part === 2 && isPreparing) return;
    playQuestion(questions[currentQ]);
    startEmotionTracking(token).catch(() => { });
  }, [currentQ, loading, isPreparing, questions, token, part, playQuestion]);

  // When prep ends for part 2, play question
  useEffect(() => {
    if (part === 2 && !isPreparing && !loading && questions.length > 0) {
      playQuestion(questions[0]);
    }
  }, [isPreparing, loading, questions, part, playQuestion]);

  const handleReplay = () => {
    if (questions[currentQ]) playQuestion(questions[currentQ]);
  };

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setIsRecording(false);
      setHasRecorded(true);
      stopEmotionTracking(questions[currentQ], part, token!).catch(() => { });
    } else {
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

  const handleNext = useCallback(async () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1);
      setHasRecorded(false);
      setRecordingDuration(0);
    } else {
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <span className="ml-3 font-medium">Generating questions...</span>
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <span className="font-medium text-xl">Evaluating your answers...</span>
        <span className="text-indigo-200">This may take a moment</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <TopBar
        questionNumber={currentQ + 1}
        totalQuestions={questions.length}
        elapsedTime={elapsedTime}
        onClose={() => navigate("/")}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Side: Examiner Animation */}
          <div className="flex justify-center order-1 lg:order-none scale-110 lg:scale-125">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl">
                <ExaminerAnimation isSpeaking={isExaminerSpeaking} />
              </div>
            </div>
          </div>

          {/* Right Side: Question / Cue Card */}
          <div className="flex flex-col gap-8 order-2 lg:order-none">
            {isPreparing && cueCard && part === 2 ? (
              <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-indigo-500 animate-in zoom-in-95 fade-in duration-500">
                <CueCardDisplay cueCard={cueCard} />
              </div>
            ) : (
              <div className="bg-white p-10 rounded-3xl shadow-xl border-l-8 border-teal-400 flex flex-col gap-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-teal-50 rounded-2xl text-teal-600 shadow-sm">
                    <Volume2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-teal-600 uppercase tracking-[0.2em] mb-3">Part {part} • Question {currentQ + 1}</h3>
                    <p className="text-2xl font-semibold text-slate-800 leading-relaxed">
                      {questions[currentQ]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReplay}
                  className="self-start px-6 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-3 shadow-sm hover:translate-y-[-2px] active:translate-y-0"
                >
                  <Volume2 className="h-5 w-5" />
                  LISTEN AGAIN
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
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
    </div>
  );
};


const SpeakingPart: React.FC = () => {
  const { partNum } = useParams();
  const part = (Number(partNum) || 1) as 1 | 2 | 3;
  return <SpeakingPartInner key={part} part={part} />;
};

export default SpeakingPart;
