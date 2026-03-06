import { EvaluationResult } from "./evaluate";

const STORAGE_KEY = "ielts_part_results";

export interface PartResults {
  part: number;
  results: EvaluationResult[];
}

export function savePartResults(part: number, results: EvaluationResult[]) {
  const all = getAllPartResults();
  const existing = all.findIndex((r) => r.part === part);
  if (existing >= 0) {
    all[existing] = { part, results };
  } else {
    all.push({ part, results });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllPartResults(): PartResults[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearAllResults() {
  localStorage.removeItem(STORAGE_KEY);
}
