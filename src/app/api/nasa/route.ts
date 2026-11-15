import { NextResponse } from "next/server";
import {
  CME_SOURCE_HISTORICAL,
  CME_SOURCE_LIVE,
  OSDR_FALLBACK,
  OSDR_SOURCE,
  localCmeEvents,
  type CmeEvent,
  type NasaFeed,
  type OsdrStudy,
} from "@/lib/game/nasa";

/**
 * Feed de datos reales de la NASA con respaldo local automático.
 *
 * - NASA DONKI (clima espacial): CME recientes. Si falla, hay rate-limit o no
 *   hay eventos, se devuelve una ventana real de archivo (mayo 2024) y, como
 *   último recurso, los registros históricos de src/data/mars_sols.json.
 * - NASA OSDR (radiación/biología): estudios reales. Sin API key.
 *
 * Si no hay internet o se agota la cuota, NUNCA se inventa un dato: se devuelve
 * el respaldo local marcando isLive:false y su etiqueta de procedencia.
 */
export const revalidate = 3600;

const NASA_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

/** Ventana real de archivo de DONKI (tormenta solar de mayo de 2024). */
const ARCHIVE_START = "2024-05-01";
const ARCHIVE_END = "2024-05-15";

interface DonkiCme {
  activityID?: string;
  startTime?: string;
  link?: string;
  cmeAnalyses?: { isMostAccurate?: boolean; speed?: number }[];
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDonki(json: DonkiCme[]): CmeEvent[] {
  return json
    .filter((e) => e.activityID && e.startTime)
    .map((e) => {
      const analyses = e.cmeAnalyses ?? [];
      const best = analyses.find((a) => a.isMostAccurate) ?? analyses[0];
      return {
        activityID: String(e.activityID),
        startTime: String(e.startTime),
        speedKmS: typeof best?.speed === "number" ? best.speed : null,
        link: e.link
          ? String(e.link)
          : `https://ccmc.gsfc.nasa.gov/DONKI/view/CME/${String(e.activityID).split("-").slice(0, 3).join("-")}`,
      };
    })
    .sort((a, b) => (a.startTime < b.startTime ? 1 : -1))
    .slice(0, 6);
}

async function fetchDonki(startDate: string, endDate: string): Promise<CmeEvent[]> {
  const url = `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_KEY}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`DONKI ${res.status}`);
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) throw new Error("DONKI: respuesta inesperada");
  return parseDonki(json as DonkiCme[]);
}

async function getCme(): Promise<NasaFeed["cme"]> {
  // 1) En vivo: últimos 30 días.
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 86_400_000);
    const events = await fetchDonki(isoDay(start), isoDay(now));
    if (events.length > 0) {
      return { events, isLive: true, mode: "live", sourceLabel: CME_SOURCE_LIVE };
    }
  } catch {
    // cae al archivo
  }

  // 2) Archivo real de DONKI.
  try {
    const events = await fetchDonki(ARCHIVE_START, ARCHIVE_END);
    if (events.length > 0) {
      return { events, isLive: false, mode: "archive", sourceLabel: CME_SOURCE_HISTORICAL };
    }
  } catch {
    // cae al respaldo local
  }

  // 3) Respaldo local (mars_sols.json).
  return {
    events: localCmeEvents(),
    isLive: false,
    mode: "local",
    sourceLabel: CME_SOURCE_HISTORICAL,
  };
}

async function getOsdr(): Promise<NasaFeed["osdr"]> {
  try {
    const res = await fetch("https://osdr.nasa.gov/osdr/data/search?term=radiation&size=6", {
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`OSDR ${res.status}`);
    const json = (await res.json()) as {
      hits?: { hits?: { _source?: Record<string, unknown> }[] };
    };
    const studies: OsdrStudy[] = (json.hits?.hits ?? [])
      .map((hit) => {
        const src = hit._source ?? {};
        const accession = String(src.Accession ?? "");
        // OJO: en OSDR "Project Title" puede venir como cadena vacía, por eso
        // usamos || (no ??) para caer al "Study Title" real del estudio.
        const title = String(src["Project Title"] || src["Study Title"] || "");
        return { accession, title, url: `https://osdr.nasa.gov/bio/studies/${accession}` };
      })
      .filter((s) => /^OSD-\d+/.test(s.accession) && s.title.length > 0);
    if (studies.length > 0) {
      return { studies, isLive: true, sourceLabel: OSDR_SOURCE };
    }
  } catch {
    // cae al respaldo
  }
  return { studies: OSDR_FALLBACK, isLive: false, sourceLabel: OSDR_SOURCE };
}

export async function GET() {
  const [cme, osdr] = await Promise.all([getCme(), getOsdr()]);
  const payload: NasaFeed = { cme, osdr, fetchedAt: new Date().toISOString() };
  return NextResponse.json(payload);
}
