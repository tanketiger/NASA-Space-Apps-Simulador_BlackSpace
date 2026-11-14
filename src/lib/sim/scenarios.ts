import vivoJson from "@/lib/data/snapshots/weather-vivo.json";
import tormentaJson from "@/lib/data/snapshots/weather-tormenta.json";
import osdrJson from "@/lib/data/snapshots/osdr-studies.json";
import type { GameState, ScenarioId, Study, WeatherDay } from "./types";

interface Snapshot {
  id: string;
  title: string;
  window: string;
  fetchedAt: string | null;
  source: string;
  mode: "live" | "archive";
  placeholder?: boolean;
  days: WeatherDay[];
}

const vivo = vivoJson as unknown as Snapshot;
const tormenta = tormentaJson as unknown as Snapshot;

export interface Scenario {
  id: ScenarioId;
  name: string;
  tagline: string;
  badge: "live" | "archive" | "empty";
  days: WeatherDay[];
}

function badgeOf(s: Snapshot): Scenario["badge"] {
  if (s.placeholder) return "empty";
  return s.mode === "live" ? "live" : "archive";
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  vivo: {
    id: "vivo",
    name: "Soles recientes",
    tagline: "El clima espacial de los últimos 10 días, tal como lo midió la NASA.",
    badge: badgeOf(vivo),
    days: vivo.days,
  },
  tormenta: {
    id: "tormenta",
    name: "La tormenta de mayo",
    tagline: "La semana en que el Sol golpeó la Tierra. Datos históricos reales de 2024.",
    badge: badgeOf(tormenta),
    days: tormenta.days,
  },
};

/** Estudios reales de OSDR, priorizando los que traen descripción. */
export const STUDY_POOL: Study[] = ((osdrJson as unknown as { studies: Study[] }).studies ?? [])
  .slice()
  .sort((a, b) => {
    const score = (s: Study) => (s.accession.startsWith("OSD-") ? 0 : 2) + (s.description ? 0 : 1);
    return score(a) - score(b);
  })
  .map((s) => ({
    ...s,
    url: s.accession ? `https://osdr.nasa.gov/bio/studies/${s.accession}` : "https://osdr.nasa.gov/",
  }));

export function createInitialState(scenarioId: ScenarioId): GameState {
  const scenario = SCENARIOS[scenarioId];
  const first = scenario.days[0];
  return {
    scenario: scenarioId,
    scenarioName: scenario.name,
    sol: 1,
    solsTotal: scenario.days.length,
    phase: "plan",
    battery: 45,
    o2: 92,
    food: 8,
    dust: 0.22,
    solarHealth: 1,
    o2Health: 1,
    shieldPct: 40,
    doseMsv: 0,
    science: 0,
    studies: [],
    log: [
      { sol: 1, text: "Base AURORA operativa. Tripulación de 4 personas a salvo.", tone: "info" },
    ],
    weather: first,
    allocation: { life: 12, shield: 6, comms: 3, science: 4 },
    hasForecast: false,
    failed: null,
    lastReport: null,
    actionsUsed: [],
    martianSeen: false,
  };
}
