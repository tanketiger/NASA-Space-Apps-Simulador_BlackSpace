import { C } from "./constants";
import type { GameState, SolReport, Study, WeatherDay } from "./types";

/** Convierte kWh invertidos en escudo a porcentaje de protección. */
export function shieldPctFromKwh(kwh: number): number {
  return Math.max(0, Math.min(100, (kwh / C.shieldKwhMax) * 100));
}

/** kWh que produce la planta solar ese sol (polvo + daño + clima). */
export function solarGeneration(state: GameState, weather: WeatherDay): number {
  return C.solarNominalKwh * state.solarHealth * (1 - state.dust * 0.85) * weather.solarFactor;
}

/** Energía total disponible ese sol (batería + solar + RTG), limitada por la capacidad. */
export function availableEnergy(state: GameState, weather: WeatherDay): number {
  return Math.min(C.batteryCap, state.battery + solarGeneration(state, weather) + C.rtgKwh);
}

/** Demanda de soporte vital, sube si hay fuga de O₂. */
export function lifeDemand(state: GameState): number {
  return C.lifeDemand + (1 - state.o2Health) * 6;
}

/** Dosis del sol, dado el escudo y el clima espacial real. */
export function doseForSol(state: GameState, weather: WeatherDay, eva: boolean): number {
  const cut = (shieldPctFromKwh(state.allocation.shield) / 100) * C.shieldDoseCut;
  const base = C.doseBaseMsv * weather.doseFactor * (1 - cut);
  const extra = eva ? C.roverDoseMsv * weather.doseFactor : 0;
  return base + extra;
}

export interface EndSolResult {
  next: GameState;
  report: SolReport;
}

/**
 * Resuelve un sol completo. Función pura: mismo estado + mismo clima = mismo resultado.
 * Esto es lo que hace la simulación auditable.
 */
export function endSol(
  state: GameState,
  nextWeather: WeatherDay,
  studyPool: Study[],
): EndSolResult {
  const w = state.weather;
  const solar = solarGeneration(state, w);
  const available = Math.min(C.batteryCap, state.battery + solar + C.rtgKwh);

  const requested = state.allocation.life + state.allocation.shield + state.allocation.comms + state.allocation.science;
  const ratio = requested > available ? available / requested : 1;
  const life = state.allocation.life * ratio;
  const shield = state.allocation.shield * ratio;
  const comms = state.allocation.comms * ratio;
  const science = state.allocation.science * ratio;
  const spend = life + shield + comms + science;

  const demand = lifeDemand(state);
  const shieldPct = shieldPctFromKwh(shield);
  const eva = state.actionsUsed.includes("rover");

  // ── Oxígeno ────────────────────────────────────────────────
  let o2 = state.o2;
  if (life >= demand) {
    o2 = Math.min(100, o2 + C.o2Recovery);
  } else {
    const deficit = (demand - life) / demand;
    o2 = Math.max(0, o2 - deficit * C.o2DropOnDeficit);
  }

  // ── Radiación ──────────────────────────────────────────────
  const dose = doseForSol(state, w, eva);
  const doseMsv = state.doseMsv + dose;

  // ── Comida y polvo ─────────────────────────────────────────
  const food = Math.max(0, state.food - 1);
  const dust = Math.min(1, state.dust + w.dustDelta);

  // ── Ciencia ────────────────────────────────────────────────
  const points = Math.floor(science / C.scienceKwh);
  const newStudies: Study[] = [];
  let pool = studyPool.filter((s) => !state.studies.some((x) => x.accession === s.accession));
  for (let i = 0; i < points && pool.length > 0; i++) {
    const idx = (state.sol * 7 + i * 13) % pool.length;
    newStudies.push(pool[idx]);
    pool = pool.filter((_, j) => j !== idx);
  }

  // ── Batería y fallos ───────────────────────────────────────
  const battery = Math.max(0, available - spend);
  let failed: GameState["failed"] = null;
  if (o2 <= 0) failed = "o2";
  else if (battery <= 0 && o2 < 35) failed = "power";

  // ── Bitácora ───────────────────────────────────────────────
  const log = [...state.log];
  const notes: string[] = [];
  const events = w.event ? [w.event] : [];

  if (w.event) {
    log.push({ sol: state.sol, text: `${w.event.title}: ${w.event.detail}`, tone: "warn" });
    notes.push(`Evento real: ${w.event.title}`);
  }
  if (life < demand) {
    log.push({ sol: state.sol, text: `Soporte vital insuficiente: el O₂ bajó a ${o2.toFixed(0)} %.`, tone: "bad" });
    notes.push("Déficit de soporte vital");
  }
  if (shieldPct >= 80) {
    log.push({ sol: state.sol, text: `Escudo al ${shieldPct.toFixed(0)} %: la dosis se redujo a ${dose.toFixed(2)} mSv.`, tone: "good" });
  }
  for (const s of newStudies) {
    log.push({ sol: state.sol, text: `Nuevo estudio desbloqueado: ${s.title} (${s.accession}).`, tone: "good" });
  }
  if (comms >= C.commsKwh) {
    log.push({ sol: state.sol, text: "Enlace con la Tierra completado: pronóstico del próximo sol disponible.", tone: "info" });
  }

  const report: SolReport = {
    sol: state.sol,
    solarKwh: solar,
    availableKwh: available,
    spendKwh: spend,
    shieldPct,
    doseMsv: dose,
    o2,
    events,
    notes,
  };

  const next: GameState = {
    ...state,
    sol: state.sol + 1,
    phase: failed || state.sol >= state.solsTotal ? "report" : "plan",
    battery,
    o2,
    food,
    dust,
    shieldPct,
    doseMsv,
    science: state.science + points,
    studies: [...state.studies, ...newStudies],
    log: log.slice(-40),
    weather: nextWeather,
    hasForecast: comms >= C.commsKwh,
    failed,
    lastReport: report,
    actionsUsed: [],
  };

  return { next, report };
}

/** Proyección didáctica de dosis a una estancia de 900 soles. */
export function projectDose(doseMsv: number, sols: number): number {
  if (sols <= 0) return 0;
  return (doseMsv / sols) * C.projectionSols;
}

export function dosePercent(doseMsv: number): number {
  return Math.min(100, (doseMsv / C.doseLimitMsv) * 100);
}
