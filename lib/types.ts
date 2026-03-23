export interface Participant {
  id: string;
  name: string;
  vote: string | null;
  joinedAt: number;
}

export interface Room {
  id: string;
  name: string;
  cardValues: string[];
  participants: Participant[];
  revealed: boolean;
  currentStory: string;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"];

export function calcStats(votes: string[]): {
  average: number | null;
  min: string | null;
  max: string | null;
  consensus: boolean;
} {
  const numeric = votes.filter((v) => !isNaN(Number(v))).map(Number);
  if (numeric.length === 0) return { average: null, min: null, max: null, consensus: false };

  const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
  const sorted = [...numeric].sort((a, b) => a - b);
  const consensus = new Set(votes).size === 1;

  return {
    average: Math.round(avg * 10) / 10,
    min: String(sorted[0]),
    max: String(sorted[sorted.length - 1]),
    consensus,
  };
}
