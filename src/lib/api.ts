export const API_BASE_URL = "https://ai-speaking-1.onrender.com";

// ---------- AUTH ----------
export async function registerUser(username: string, password: string, email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json() as Promise<{ access_token: string; token_type: string; api_key: string }>;
}

export async function loginUser(username: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);
  const res = await fetch(`${API_BASE_URL}/auth/token`, { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get user");
  return res.json() as Promise<{ username: string; email: string }>;
}

// ---------- QUESTIONS ----------
export async function fetchQuestions(part: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/generate-part${part}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Part ${part} questions`);
  return res.json();
}

// ---------- TTS ----------
export async function fetchTTSAudio(text: string, token: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/mock-test-voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("TTS failed");
  return res.blob();
}

// ---------- EVALUATION (async with polling) ----------
export async function submitEvaluation(
  questions: string[],
  answers: string[],
  part: number,
  token: string,
  audios?: (Blob | null)[]
): Promise<string> {
  const form = new FormData();
  form.append("questions", JSON.stringify(questions));
  form.append("answers", JSON.stringify(answers));
  form.append("part", String(part));

  if (audios) {
    audios.forEach((audio, i) => {
      if (audio) form.append("audios", audio, `part_answer_${i}.webm`);
    });
  }

  const res = await fetch(`${API_BASE_URL}/evaluate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Evaluation failed" }));
    throw new Error(err.error || "Evaluation failed");
  }
  const data = await res.json();
  return data.job_id;
}

export async function pollJobResult(jobId: string, token: string): Promise<any> {
  while (true) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to poll job");
    const data = await res.json();
    if (data.status === "done") return data.result;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ---------- AGGREGATE ----------
export async function aggregateResults(evaluations: any[], token: string) {
  const res = await fetch(`${API_BASE_URL}/aggregate-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ evaluations }),
  });
  if (!res.ok) throw new Error("Failed to aggregate results");
  return res.json();
}

// ---------- EMOTION ----------
export async function startEmotionTracking(token: string) {
  const res = await fetch(`${API_BASE_URL}/emotion/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to start emotion tracking");
  return res.json();
}

export async function stopEmotionTracking(question: string, part: number, token: string) {
  const params = new URLSearchParams({ question, part: part.toString() });
  const res = await fetch(`${API_BASE_URL}/emotion/stop?${params}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to stop emotion tracking");
  return res.json();
}
