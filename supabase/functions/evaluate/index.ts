import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(text.substring(start, end + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let question = "";
    let manualText = "";
    let audioBytes: Uint8Array | null = null;
    let audioFilename = "audio.wav";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      question = formData.get("question")?.toString() || "";
      manualText = formData.get("manual_text")?.toString() || "";
      const audioFile = formData.get("audio") as File | null;
      if (audioFile) {
        audioBytes = new Uint8Array(await audioFile.arrayBuffer());
        audioFilename = audioFile.name || "audio.wav";
      }
    } else {
      const body = await req.json();
      question = body.question || "";
      manualText = body.manual_text || "";
    }

    let transcript = manualText;

    // Transcribe audio via Groq Whisper if provided
    if (!transcript && audioBytes) {
      const form = new FormData();
      const mimeType = audioFilename.endsWith(".webm") ? "audio/webm" : "audio/wav";
      const blob = new Blob([audioBytes], { type: mimeType });
      form.append("file", blob, audioFilename);
      form.append("model", "whisper-large-v3");

      const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: form,
      });

      if (!whisperRes.ok) {
        const errText = await whisperRes.text();
        console.error("Whisper error:", whisperRes.status, errText);
        return new Response(JSON.stringify({ error: "Transcription failed", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const whisperData = await whisperRes.json();
      transcript = whisperData.text || "";
    }

    if (!transcript) {
      return new Response(JSON.stringify({ error: "No transcript to evaluate" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Evaluate via Groq LLM
    const prompt = `You are a certified IELTS examiner. 
Your task is to strictly evaluate the speaking performance on IELTS Band Descriptors.

Assessment Criteria:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation

Rules:
1. Always return ONLY a JSON object.
2. Band scores must be realistic (0–9) in steps of 0.5.
3. Give detailed strengths and weaknesses.

Examples for calibration:
Q: "Where do you live?" 
A: "I live in Tashkent. Big city. Good food."  
→ {
  "overall_band": "5.0",
  "fluency": "5.0",
  "vocabulary": "5.0",
  "grammar": "5.0",
  "pronunciation": "5.5",
  "strengths": ["Basic communication possible"],
  "weaknesses": ["Short sentences", "Limited vocabulary", "Many grammar errors"]
}

Q: "Where do you live?"  
A: "I currently reside in Tashkent, the capital of Uzbekistan. It is a lively city with diverse food and cultural attractions."  
→ {
  "overall_band": "7.0",
  "fluency": "7.0",
  "vocabulary": "7.0",
  "grammar": "7.0",
  "pronunciation": "7.0",
  "strengths": ["Good fluency", "Appropriate vocabulary", "Clear sentence structure"],
  "weaknesses": ["Could expand ideas more", "Minor pronunciation slips"]
}

Now evaluate the following:

Question: "${question}"
Answer: "${transcript}"

Return only JSON:`;

    const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error("Groq chat error:", chatRes.status, errText);
      return new Response(JSON.stringify({ error: "Evaluation failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatData = await chatRes.json();
    const textOutput = chatData.choices?.[0]?.message?.content || "";

    let evaluation;
    try {
      evaluation = extractJson(textOutput);
    } catch {
      evaluation = { error: "Failed to parse evaluation", raw: textOutput };
    }

    return new Response(JSON.stringify({ transcript, evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
