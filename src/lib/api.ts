export const API_BASE_URL = "https://ai-speaking-1.onrender.com";

export interface EvaluationResponse {
  answers: any;
  evaluation: {
    overall_band: number | string;
    fluency: number | string;
    vocabulary: number | string;
    grammar: number | string;
    pronunciation: number | string;
    strengths: string[];
    weaknesses: string[];
    improved_answers?: string[];
  };
}

export async function fetchQuestions(part: number): Promise<{ questions: string[] }> {
  const url = `${API_BASE_URL}/generate-part${part}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Part ${part} questions`);
  return res.json();
}

export async function evaluatePart(
  questions: string[],
  answers: string[],
  audios?: (Blob | null)[]
): Promise<EvaluationResponse> {
  const formData = new FormData();
  formData.append("questions", JSON.stringify(questions));
  formData.append("answers", JSON.stringify(answers));

  if (audios) {
    audios.forEach((audio, i) => {
      if (audio) {
        formData.append("audios", audio, `part_answer_${i}.webm`);
      }
    });
  }

  const res = await fetch(`${API_BASE_URL}/evaluate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Evaluation failed" }));
    throw new Error(err.error || "Evaluation failed");
  }

  return res.json();
}

export async function aggregateResults(evaluations: any[]): Promise<{ weighted_band: number }> {
  const res = await fetch(`${API_BASE_URL}/aggregate-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evaluations }),
  });

  if (!res.ok) throw new Error("Failed to aggregate results");
  return res.json();
}

export async function startEmotionTracking(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/emotion/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to start emotion tracking");
  return res.json();
}

export async function stopEmotionTracking(question: string, part: number): Promise<any> {
  const params = new URLSearchParams({ question, part: part.toString() });
  const res = await fetch(`${API_BASE_URL}/emotion/stop?${params.toString()}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to stop emotion tracking");
  return res.json();
}
