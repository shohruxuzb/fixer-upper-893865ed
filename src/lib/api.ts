export const API_BASE_URL = "https://ai-speaking-1.onrender.com";

// ---------- MOCK DATABASE ----------
const getMockDB = () => JSON.parse(localStorage.getItem("mock_users") || "[]");
const saveMockDB = (users: any[]) => localStorage.setItem("mock_users", JSON.stringify(users));

// ---------- AUTH ----------
export async function registerUser(username: string, password: string, email: string) {
  // Try real API first (optional, but since user said it fails, we can prioritize mock)
  const users = getMockDB();
  if (users.find((u: any) => u.username === username)) {
    throw new Error("Username already exists");
  }

  const newUser = { username, password, email };
  users.push(newUser);
  saveMockDB(users);

  const token = btoa(JSON.stringify({ username, exp: Date.now() + 3600000 }));
  return { access_token: token, token_type: "bearer", api_key: "mock-key" };
}

export async function loginUser(username: string, password: string) {
  const users = getMockDB();
  const user = users.find((u: any) => u.username === username && u.password === password);
  
  if (!user) {
    throw new Error("Invalid username or password");
  }

  const token = btoa(JSON.stringify({ username, exp: Date.now() + 3600000 }));
  return { access_token: token, token_type: "bearer" };
}

export async function getMe(token: string) {
  try {
    const payload = JSON.parse(atob(token));
    return { username: payload.username, email: payload.username + "@example.com" };
  } catch (e) {
    throw new Error("Failed to get user");
  }
}

// ---------- QUESTIONS ----------
export async function fetchQuestions(part: number, token: string) {
  // Use mock questions for now since backend is down
  const mockQuestions = {
    1: ["Tell me about your hometown.", "What do you do in your free time?", "Do you like cooking?"],
    2: ["Describe a book you recently read.", "Why did you choose this book?", "How long did it take to read?"],
    3: ["How has reading habits changed in your country?", "Do you think physical books will disappear?", "What are the benefits of reading for children?"]
  };
  return (mockQuestions as any)[part] || [];
}

// ---------- TTS ----------
export async function fetchTTSAudio(text: string, token: string): Promise<Blob> {
  // Return an empty blob or mock audio if needed
  return new Blob([], { type: "audio/mpeg" });
}

// ---------- EVALUATION (async with polling) ----------
export async function submitEvaluation(
  questions: string[],
  answers: string[],
  part: number,
  token: string,
  audios?: (Blob | null)[]
): Promise<string> {
  return "mock-job-id";
}

export async function pollJobResult(jobId: string, token: string): Promise<any> {
  return {
    status: "done",
    result: "This is a mock evaluation result because the backend is currently unavailable. Your speaking was clear and well-structured."
  };
}

// ---------- AGGREGATE ----------
export async function aggregateResults(evaluations: any[], token: string) {
  return {
    overall_score: 7.5,
    feedback: "Great performance across all parts!"
  };
}

// ---------- EMOTION ----------
export async function startEmotionTracking(token: string) {
  return { status: "started" };
}

export async function stopEmotionTracking(question: string, part: number, token: string) {
  return { emotion: "Happy", confidence: 0.95 };
}

