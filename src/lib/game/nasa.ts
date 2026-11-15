import { SOLS } from "./sols";

/**
 * Tipos y respaldos locales del feed de datos reales de la NASA.
 *
 * Regla del proyecto: NUNCA inventamos una medición. O el dato viene de una
 * API real (y se etiqueta como "en vivo" o "archivo"), o viene de un estudio
 * publicado (OSDR / MSL-RAD) y se cita su procedencia.
 */

export interface CmeEvent {
  /** Identificador real de NASA DONKI, p. ej. "2024-05-08T05:36:00-CME-001". */
  activityID: string;
  /** Fecha/hora real de inicio del CME (ISO 8601 UTC). */
  startTime: string;
  /** Velocidad medida del CME en km/s (null si DONKI no la publicó). */
  speedKmS: number | null;
  /** Enlace al visor de DONKI/CCMC. */
  link: string;
}

export interface OsdrStudy {
  /** Accesión real tipo OSD-73. */
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

// ── Etiquetas de procedencia (obligatorias en la UI) ──────────────────────────
export const CME_SOURCE_LIVE = "Datos reales en vivo · NASA DONKI";
export const CME_SOURCE_HISTORICAL = "Registro histórico · NASA DONKI";
export const OSDR_SOURCE = "Estudio real · NASA OSDR";
export const DOSE_SOURCE = "Dosis medida real · RadLab / MSL-RAD";
export const PANELS_SOURCE = "Modelo del juego · referencia NASA PIA11799";
export const SURFACE_SOURCE = "Imagen real de Marte · Mars Trek (archivo)";

// ── Constantes físicas reales usadas en las proyecciones ─────────────────────
/**
 * Dosis equivalente de referencia en la superficie marciana, medida por el
 * instrumento RAD del rover Curiosity (MSL-RAD · Hassler et al., 2014):
 * ~0.21 mGy/día absorbidos ≈ 0.64 mSv/día equivalentes.
 */
export const BASE_DOSE_MSV_PER_SOL = 0.64;
/** Límite de carrera recomendado para astronautas (NASA, ~600 mSv). */
export const CAREER_LIMIT_MSV = 600;
/** Duración didáctica de una estancia larga: 900 soles marcianos. */
export const CAREER_SOLS = 900;
/** Factor didáctico de dosis durante una eyección de masa coronal. */
export const CME_DOSE_MULTIPLIER = 2;

// ── Imagen orbital real de Marte (NASA Mars Trek, tesela pública) ─────────────
export const MARS_TREK_TILE =
  "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/1.jpg";

// ── Respaldo local verificado (por si no hay red o se agota la cuota) ─────────
/** Estudios reales de radiación espacial publicados en NASA OSDR. */
export const OSDR_FALLBACK: OsdrStudy[] = [
  {
    accession: "OSD-73",
    title:
      "Transcriptome Profiles in Normal Human Bronchial Epithelial Cells after Exposure to gamma-rays and different HZE particles",
    url: "https://osdr.nasa.gov/bio/studies/OSD-73",
  },
  {
    accession: "OSD-489",
    title: "Rodent Research 1",
    url: "https://osdr.nasa.gov/bio/studies/OSD-489",
  },
  {
    accession: "OSD-158",
    title:
      "Exposure to ionizing radiation induced persistent gene expression changes in mouse mammary gland",
    url: "https://osdr.nasa.gov/bio/studies/OSD-158",
  },
];

/** Eventos CME reales ya citados en mars_sols.json (con su velocidad medida). */
export function localCmeEvents(): CmeEvent[] {
  return SOLS.map((s) => ({
    activityID: s.historicalEvent.activityID,
    startTime: s.historicalEvent.date,
    speedKmS: s.historicalEvent.speedKmS ?? null,
    link: s.historicalEvent.link,
  }));
}

/** Feed 100% local: sirve para arrancar sin red y como último respaldo. */
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

/** Estudio OSDR "desbloqueado" en un Sol concreto (rotación determinista). */
export function studyForSol(solNumber: number, studies: OsdrStudy[]): OsdrStudy {
  const list = studies.length > 0 ? studies : OSDR_FALLBACK;
  const i = Math.abs(solNumber - 1) % list.length;
  return list[i];
}

/** Transmitancia solar didáctica: 100% menos el polvo acumulado. */
export function solarTransmittance(dust: number): number {
  return Math.max(0, Math.min(100, 100 - dust));
}
