const EVALUATE_URL = `${import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:8000"}/functions/v1/evaluate`;

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

async function pollJobResult(jobId: string, maxAttempts: number = 30): Promise<EvaluationResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${EVALUATE_URL}/${jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (res.status === 200) {
      return res.json();
    } else if (res.status === 202) {
      // Still processing, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    } else {
      const err = await res.json().catch(() => ({ error: "Network error" }));
      throw new Error(err.error || "Job polling failed");
    }
  }

  throw new Error("Evaluation timed out after 30 seconds");
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

  // Check if we got a 202 (async job) response
  if (res.status === 202) {
    const data = await res.json();
    if (data.job_id) {
      return pollJobResult(data.job_id);
    }
  }

  return res.json();
}
