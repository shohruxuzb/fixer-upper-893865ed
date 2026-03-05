import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Volume2, ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

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
              Practice with realistic exam conditions and get detailed feedback with emotion analysis
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
              "Good morning/afternoon. My name is Alex, and I'm your AI examiner today. In this speaking test, I will ask you some questions about yourself and familiar topics. The test has three parts. Your camera will be used for emotion analysis to provide delivery feedback. Are you ready to begin?"
            </blockquote>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm p-6 text-left">
            <h3 className="font-bold text-foreground mb-4">Test Structure</h3>
            <div className="space-y-3">
              {[
                { part: 1, title: "Introduction & familiar topics", detail: "4 questions", time: "4-5 min" },
                { part: 2, title: "Individual long turn (cue card)", detail: "1 cue card", time: "3-4 min" },
                { part: 3, title: "Two-way discussion", detail: "3 questions", time: "4-5 min" },
              ].map((p) => (
                <button
                  key={p.part}
                  onClick={() => navigate(`/speaking/part/${p.part}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 w-full text-left hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary text-sm">Part {p.part}</span>
                    <span className="text-sm text-muted-foreground">{p.title}</span>
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{p.detail}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" className="text-lg px-10 py-6 rounded-xl font-bold" onClick={() => navigate("/speaking/part/1")}>
            Start Speaking Test
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by Groq AI • Emotion Analysis • Realistic IELTS Experience
      </footer>
    </div>
  );
};

export default Index;
