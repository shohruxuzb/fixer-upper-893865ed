const EVALUATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate`;

export interface EvaluationResult {
  transcript: string;
  evaluation: {
    overall_band: number | string;
    fluency: number | string;
    vocabulary: number | string;
    grammar: number | string;
    pronunciation: number | string;
    strengths: string[];
    weaknesses: string[];
    improved_answers?: string[];
    emotion_feedback?: string;
    error?: string;
  };
}

export async function evaluateAnswer({
  question,
  audioBlob,
  videoBlob,
  manualText,
}: {
  question: string;
  audioBlob?: Blob | null;
  videoBlob?: Blob | null;
  manualText?: string;
}): Promise<EvaluationResult> {
  const formData = new FormData();
  formData.append("question", question);

  if (manualText) {
    formData.append("manual_text", manualText);
  } else if (audioBlob) {
    formData.append("audio", audioBlob, "recording.webm");
  }

  if (videoBlob) {
    formData.append("video", videoBlob, "video.webm");
  }

  const res = await fetch(EVALUATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Evaluation failed");
  }

  return res.json();
}
