import type { ParsedResume, ScoringResult, ScreeningQuestion } from "./types";

export interface HistoryEntry {
  id: string;
  name: string;
  email: string;
  analyzedAt: string;
  model: string;
  jobTitle: string;
  score: number | null;
  recommendation: string | null;
  parsedResume: ParsedResume;
  scoring: ScoringResult | null;
  questions: ScreeningQuestion[];
  jobDescription: string;
}

const STORAGE_KEY = "talentflow_history";
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, "id" | "analyzedAt">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    analyzedAt: new Date().toISOString(),
  };

  const history = getHistory();
  history.unshift(full);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return full;
}

export function deleteFromHistory(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
