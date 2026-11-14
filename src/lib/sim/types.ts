export type ScenarioId = "vivo" | "tormenta";
export type RoomId = "control" | "exterior" | "vitales";

/** Procedencia de un dato, para etiquetarlo en pantalla. */
export type DataKind = "live" | "archive" | "historical" | "reference" | "simulated";

export type EventKind = "cme" | "storm" | "flare" | "sep" | "dust-devil" | "panel" | "o2" | "martian";

export interface WeatherEvent {
  kind: EventKind;
  title: string;
  detail: string;
}

export interface WeatherDay {
  sol: number;
  earthDate: string;
  /** 0 = calma, 3 = tormenta severa. Derivado de eventos DONKI reales. */
  risk: 0 | 1 | 2 | 3;
  label: string;
  /** Multiplicador de generación solar (1 = normal, 0.15 = tormenta global). */
  solarFactor: number;
  /** Multiplicador de dosis (1 = línea base, 12 = evento solar severo). */
  doseFactor: number;
  /** Polvo extra que se deposita ese sol (0.02 = normal). */
  dustDelta: number;
  source: DataKind;
  sourceLabel: string;
  event?: WeatherEvent;
}

export interface Study {
  accession: string;
  title: string;
  organism: string;
  description: string;
  url: string;
  tag: string;
}

export interface Allocation {
  /** kWh por sol */
  life: number;
  shield: number;
  comms: number;
  science: number;
}

export interface LogEntry {
  sol: number;
  text: string;
  tone: "info" | "good" | "warn" | "bad";
}

export interface SolReport {
  sol: number;
  solarKwh: number;
  availableKwh: number;
  spendKwh: number;
  shieldPct: number;
  doseMsv: number;
  o2: number;
  events: WeatherEvent[];
  notes: string[];
}

export interface GameState {
  scenario: ScenarioId;
  scenarioName: string;
  sol: number;
  solsTotal: number;
  phase: "briefing" | "plan" | "report";
  battery: number;
  o2: number;
  food: number;
  dust: number;
  solarHealth: number;
  o2Health: number;
  shieldPct: number;
  doseMsv: number;
  science: number;
  studies: Study[];
  log: LogEntry[];
  weather: WeatherDay;
  allocation: Allocation;
  hasForecast: boolean;
  failed: null | "o2" | "power";
  lastReport: SolReport | null;
  actionsUsed: string[];
  martianSeen: boolean;
}
