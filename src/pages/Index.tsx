import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { evaluateAnswer, EvaluationResult } from "@/lib/evaluate";
import { getRandomQuestion } from "@/lib/ielts-questions";
import { EvaluationCard } from "@/components/EvaluationCard";
import { Mic, MicOff, Send, RotateCcw, Volume2, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type TestState = "intro" | "testing" | "result";

const Index = () => {
  const [testState, setTestState] = useState<TestState>("intro");
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1);
  const [question, setQuestion] = useState(getRandomQuestion(1));
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");

  const { isRecording, audioBlob, duration, startRecording, stopRecording, clearRecording } = useAudioRecorder();

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStartTest = () => {
    setTestState("testing");
    setCurrentPart(1);
    setQuestion(getRandomQuestion(1));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (inputMode === "text" && !typedAnswer.trim()) {
      toast.error("Please type your answer first");
      return;
    }
    if (inputMode === "voice" && !audioBlob) {
      toast.error("Please record your answer first");
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await evaluateAnswer({
        question: question.question,
        audioBlob: inputMode === "voice" ? audioBlob : null,
        manualText: inputMode === "text" ? typedAnswer : undefined,
      });
      setResult(res);
      setTestState("result");
    } catch (err: any) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    const nextPart = currentPart < 3 ? ((currentPart + 1) as 1 | 2 | 3) : 1;
    setCurrentPart(nextPart);
    setQuestion(getRandomQuestion(nextPart));
    setResult(null);
    setTypedAnswer("");
    clearRecording();
    setTestState("testing");
  };

  const speakQuestion = () => {
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  // Intro screen
  if (testState === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                IELTS Speaking Test Simulator
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                IELTS Speaking <span className="text-primary">AI</span>
              </h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Practice with realistic exam conditions and get detailed feedback
              </p>
            </div>

            <div className="bg-card rounded-2xl border shadow-sm p-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AI Examiner</p>
                  <p className="text-sm text-muted-foreground">Ready to begin your speaking test</p>
                </div>
              </div>
              <blockquote className="border-l-4 border-primary/30 pl-4 text-muted-foreground italic text-sm leading-relaxed">
                "Good morning/afternoon. My name is Alex, and I'm your AI examiner today. In this speaking test, I will ask you some questions about yourself and familiar topics. The test has three parts and will take approximately 15 minutes. Are you ready to begin?"
              </blockquote>
            </div>

            <div className="bg-card rounded-2xl border shadow-sm p-6 text-left">
              <h3 className="font-bold text-foreground mb-4">Test Structure</h3>
              <div className="space-y-3">
                {[
                  { part: 1, title: "Introduction & familiar topics", time: "4-5 minutes" },
                  { part: 2, title: "Individual long turn (cue card)", time: "3-4 minutes" },
                  { part: 3, title: "Two-way discussion", time: "4-5 minutes" },
                ].map((p) => (
                  <div key={p.part} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm">Part {p.part}</span>
                      <span className="text-sm text-muted-foreground">{p.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{p.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="text-lg px-10 py-6 rounded-xl font-bold" onClick={handleStartTest}>
              Start Speaking Test
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <footer className="text-center py-4 text-xs text-muted-foreground">
          Powered by Groq AI • Realistic IELTS Experience
        </footer>
      </div>
    );
  }

  // Test / Result screen
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">IELTS Speaking AI</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((p) => (
              <span
                key={p}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  p === currentPart
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Part {p}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Question */}
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Part {currentPart} Question
              </span>
              <p className="text-lg font-semibold text-foreground mt-2 leading-relaxed">
                {question.question}
              </p>
            </div>
            <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={speakQuestion}>
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {testState === "testing" && (
          <>
            {/* Input Mode Toggle */}
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant={inputMode === "voice" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("voice")}
                className="rounded-full"
              >
                <Mic className="h-4 w-4 mr-1" /> Voice
              </Button>
              <Button
                variant={inputMode === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("text")}
                className="rounded-full"
              >
                <Send className="h-4 w-4 mr-1" /> Type
              </Button>
            </div>

            {/* Voice Mode */}
            {inputMode === "voice" && (
              <div className="bg-card rounded-2xl border shadow-sm p-8 flex flex-col items-center gap-6">
                <div className="relative">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/30"
                        : "bg-primary text-primary-foreground hover:scale-105 shadow-lg shadow-primary/30"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </button>
                </div>

                {isRecording && (
                  <p className="text-sm font-mono text-destructive font-semibold">
                    Recording... {formatTime(duration)}
                  </p>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Recording ready ({formatTime(duration)})
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearRecording}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Re-record
                      </Button>
                      <Button size="sm" onClick={handleSubmit} disabled={isEvaluating}>
                        {isEvaluating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                        Submit
                      </Button>
                    </div>
                  </div>
                )}

                {!isRecording && !audioBlob && (
                  <p className="text-sm text-muted-foreground">Tap the microphone to start recording</p>
                )}
              </div>
            )}

            {/* Text Mode */}
            {inputMode === "text" && (
              <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
                <Textarea
                  placeholder="Type your answer here..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  rows={5}
                  className="resize-none text-base"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={isEvaluating || !typedAnswer.trim()}>
                    {isEvaluating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Results */}
        {testState === "result" && result && (
          <>
            <EvaluationCard result={result} />
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={handleNextQuestion} className="rounded-xl font-bold">
                Next Question
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
