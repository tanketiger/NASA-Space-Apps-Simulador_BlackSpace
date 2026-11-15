import raw from "@/data/mars_sols.json";
import type { SolRules } from "./engine";

export interface HistoricalEvent {
  source: string;
  activityID: string;
  date: string;
  link: string;
  note: string;
}

export interface SolDefinition {
  sol: number;
  label: string;
  difficulty: string;
  historicalEvent: HistoricalEvent;
  rules: SolRules;
}

const data = raw as unknown as { sols: SolDefinition[] };

export const SOLS: SolDefinition[] = data.sols;

export function solByIndex(index: number): SolDefinition {
  return SOLS[Math.min(index, SOLS.length - 1)];
}
