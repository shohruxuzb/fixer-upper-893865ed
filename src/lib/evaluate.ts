export interface EvaluationResult {
  transcript: string;
  evaluation: {
    overall_band: number | string;
    fluency: number | string;
    vocabulary: number | string;
    grammar: number | string;
    pronunciation: number | string;
    fluency_emotion_adjustment?: number;
    delivery_score?: number;
    delivery_band?: string;
    strengths?: string[];
    weaknesses?: string[];
    improved_answers?: string[];
    emotion_feedback?: string;
    error?: string;
  };
}
