import { SOLS } from "./sols";

/**
 * Types and local fallbacks for the real NASA data feed.
 *
 * Project rule: we NEVER invent a measurement. Either the datum comes from a real
 * API (and is labeled "live" or "archive"), or it comes from a published study
 * (OSDR / MSL-RAD) and its source is cited.
 */

export interface CmeEvent {
  /** Real NASA DONKI identifier, e.g. "2024-05-08T05:36:00-CME-001". */
  activityID: string;
  /** Real CME start date/time (ISO 8601 UTC). */
  startTime: string;
  /** Measured CME speed in km/s (null if DONKI did not publish it). */
  speedKmS: number | null;
  /** Link to the DONKI/CCMC viewer. */
  link: string;
}

export interface OsdrStudy {
  /** Real accession such as OSD-73. */
  accession: string;
  title: string;
  url: string;
}

export type CmeMode = "live" | "archive" | "local";

export interface NasaFeed {
  cme: {
    events: CmeEvent[];
    isLive: boolean;
    mode: CmeMode;
    sourceLabel: string;
  };
  osdr: {
    studies: OsdrStudy[];
    isLive: boolean;
    sourceLabel: string;
  };
  fetchedAt: string;
}

// ── Provenance labels (required in the UI) ────────────────────────────────────
export const CME_SOURCE_LIVE = "Live real data · NASA DONKI";
export const CME_SOURCE_HISTORICAL = "Historical record · NASA DONKI";
export const OSDR_SOURCE = "Real study · NASA OSDR";
export const DOSE_SOURCE = "Real measured dose · RadLab / MSL-RAD";
export const PANELS_SOURCE = "Game model · NASA PIA11799 reference";
export const SURFACE_SOURCE = "Real image of Mars · Mars Trek (archive)";

// ── Real physical constants used in the projections ───────────────────────────
/**
 * Reference equivalent dose on the Martian surface, measured by the RAD
 * instrument on the Curiosity rover (MSL-RAD · Hassler et al., 2014):
 * ~0.21 mGy/day absorbed ≈ 0.64 mSv/day equivalent.
 */
export const BASE_DOSE_MSV_PER_SOL = 0.64;
/** Recommended career limit for astronauts (NASA, ~600 mSv). */
export const CAREER_LIMIT_MSV = 600;
/** Didactic length of a long stay: 900 Martian sols. */
export const CAREER_SOLS = 900;
/** Didactic dose factor during a coronal mass ejection. */
export const CME_DOSE_MULTIPLIER = 2;

// ── Real orbital image of Mars (NASA Mars Trek, public tile) ──────────────────
export const MARS_TREK_TILE =
  "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/1.jpg";

// ── Verified local fallback (in case there is no network or the quota is gone) ─
/** Real space-radiation studies published in NASA OSDR. */
export const OSDR_FALLBACK: OsdrStudy[] = [
  {
    accession: "OSD-73",
    title:
      "Transcriptome Profiles in Normal Human Bronchial Epithelial Cells after Exposure to gamma-rays and different HZE particles",
    url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-73",
  },
  {
    accession: "OSD-489",
    title: "Rodent Research 1",
    url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-489",
  },
  {
    accession: "OSD-158",
    title:
      "Exposure to ionizing radiation induced persistent gene expression changes in mouse mammary gland",
    url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-158",
  },
];

/** Real CME events already cited in mars_sols.json (with their measured speed). */
export function localCmeEvents(): CmeEvent[] {
  return SOLS.map((s) => ({
    activityID: s.historicalEvent.activityID,
    startTime: s.historicalEvent.date,
    speedKmS: s.historicalEvent.speedKmS ?? null,
    link: s.historicalEvent.link,
  }));
}

/** 100% local feed: lets the game boot offline and acts as the last fallback. */
export function localFeed(): NasaFeed {
  return {
    cme: {
      events: localCmeEvents(),
      isLive: false,
      mode: "local",
      sourceLabel: CME_SOURCE_HISTORICAL,
    },
    osdr: { studies: OSDR_FALLBACK, isLive: false, sourceLabel: OSDR_SOURCE },
    fetchedAt: new Date().toISOString(),
  };
}

/** OSDR study "unlocked" on a given Sol (deterministic rotation). */
export function studyForSol(solNumber: number, studies: OsdrStudy[]): OsdrStudy {
  const list = studies.length > 0 ? studies : OSDR_FALLBACK;
  const i = Math.abs(solNumber - 1) % list.length;
  return list[i];
}

/** Didactic solar transmittance: 100% minus the accumulated dust. */
export function solarTransmittance(dust: number): number {
  return Math.max(0, Math.min(100, 100 - dust));
}
