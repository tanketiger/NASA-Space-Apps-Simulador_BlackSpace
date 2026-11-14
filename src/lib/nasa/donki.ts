import type { WeatherDay } from "@/lib/sim/types";

const BASE = "https://api.nasa.gov";
const KEY = process.env.NASA_API_KEY ?? "DEMO_KEY";

export interface DonkiWindow {
  days: WeatherDay[];
  mode: "live" | "archive";
  fetchedAt: string;
  fallback: boolean;
}

const LABELS = ["Calma", "Actividad ligera", "Actividad alta", "Tormenta severa"] as const;

function dayKey(iso?: string) {
  return (iso ?? "").slice(0, 10);
}

function dates(start: string, n: number) {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function get<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`NASA ${res.status}`);
  return (await res.json()) as T[];
}

interface CmeAnalysis {
  time21_5?: string;
  speed?: number;
}
interface Flare {
  beginTime?: string;
  classType?: string;
}
interface Gst {
  startTime?: string;
}
interface Sep {
  eventTime?: string;
  startTime?: string;
}

/** Trae una ventana real de DONKI y la convierte en días jugables. */
export async function fetchWindow(start: string, sols: number, mode: "live" | "archive"): Promise<DonkiWindow> {
  const end = dates(start, sols).at(-1)!;
  const q = `startDate=${start}&endDate=${end}&api_key=${KEY}`;

  const [analysis, flares, gsts, seps] = await Promise.all([
    get<CmeAnalysis>(`/DONKI/CMEAnalysis?${q}`).catch(() => []),
    get<Flare>(`/DONKI/FLR?${q}`).catch(() => []),
    get<Gst>(`/DONKI/GST?${q}`).catch(() => []),
    get<Sep>(`/DONKI/SEP?${q}`).catch(() => []),
  ]);

  const days: WeatherDay[] = dates(start, sols).map((date, i) => {
    const speeds = analysis.filter((a) => dayKey(a.time21_5) === date).map((a) => a.speed ?? 0);
    const classes = flares.filter((f) => dayKey(f.beginTime) === date).map((f) => f.classType ?? "");
    const hasGst = gsts.some((g) => dayKey(g.startTime) === date);
    const hasSep = seps.some((s) => dayKey(s.eventTime ?? s.startTime) === date);

    let risk = 0;
    if (speeds.length) risk = 1;
    if (speeds.some((s) => s >= 500)) risk = 2;
    if (speeds.some((s) => s >= 800)) risk = 3;
    if (hasGst || hasSep) risk = 3;
    if (classes.some((c) => c.startsWith("M"))) risk = Math.max(risk, 2);
    if (classes.some((c) => c.startsWith("X"))) risk = 3;

    const event =
      risk >= 3 && hasGst
        ? { kind: "storm" as const, title: "Tormenta geomagnetica", detail: "GST real de DONKI." }
        : risk >= 2 && speeds.length
          ? {
              kind: "cme" as const,
              title: "Eyeccion de masa coronal",
              detail: `CME real a ${Math.round(Math.max(...speeds))} km/s.`,
            }
          : risk >= 2 && classes.length
            ? { kind: "flare" as const, title: "Erupcion solar", detail: `Clase ${classes.sort().at(-1)}.` }
            : undefined;

    return {
      sol: i + 1,
      earthDate: date,
      risk: risk as 0 | 1 | 2 | 3,
      label: LABELS[risk],
      solarFactor: 1,
      doseFactor: [1, 1.6, 4, 12][risk],
      dustDelta: 0.02,
      source: mode,
      sourceLabel: mode === "live" ? "Datos reales en vivo · NASA DONKI" : "Archivo real · NASA DONKI",
      ...(event ? { event } : {}),
    };
  });

  return { days, mode, fetchedAt: new Date().toISOString(), fallback: false };
}

export function liveStart(sols: number) {
  return new Date(Date.now() - (sols - 1) * 864e5).toISOString().slice(0, 10);
}
