/**
 * Motor puro del turno de Aurora Outpost (estilo "guardia nocturna").
 *
 * Importante para el jurado: solo `historicalEvent` (ver src/data/mars_sols.json)
 * es un dato real de la NASA. Todo lo que hay aquí abajo -tormenta de polvo,
 * nivel de la llamarada, consumo de batería, oxígeno- es una regla de diseño
 * de juego pensada para niños de 7 a 12 años, no una medición ni un pronóstico.
 */

export type Camera = 1 | 2 | 3 | 4;
export type Phase = "ready" | "playing" | "blackout" | "won" | "lost";
export type LossReason = "dust" | "flare" | "oxygen" | "battery" | null;
export type DustPhase = "idle" | "far" | "approaching" | "window" | "retreated" | "hit";

export interface SolRules {
  dustStart: number;
  dustAtWindow: number;
  dustHitAfter: number;
  flareLevel1: number;
  flareLevel2: number;
  flareCritical: number;
  flareFlashSeconds: number;
  oxygenDrainPerSecond: number;
  batteryIdleDrainPerSecond: number;
}

export const TOTAL_SECONDS = 60;
const PUMP_RATE = 5;
const SYSTEM_DRAIN = 0.6;
const BLACKOUT_SECONDS = 3;

export interface GameState {
  elapsed: number;
  battery: number;
  oxygen: number;
  gateLeft: boolean;
  gateRight: boolean;
  lightLeft: boolean;
  lightRight: boolean;
  monitorOpen: boolean;
  camera: Camera;
  pumping: boolean;
  dustPhase: DustPhase;
  dustWindowSince: number | null;
  flareLevel: 0 | 1 | 2 | 3;
  flareFlashEnd: number | null;
  flareGateFailed: boolean;
  flareResolved: boolean;
  phase: Phase;
  lossReason: LossReason;
  blackoutSince: number | null;
  roverBoops: number;
}

export function initialState(): GameState {
  return {
    elapsed: 0,
    battery: 100,
    oxygen: 100,
    gateLeft: false,
    gateRight: false,
    lightLeft: false,
    lightRight: false,
    monitorOpen: false,
    camera: 1,
    pumping: false,
    dustPhase: "idle",
    dustWindowSince: null,
    flareLevel: 0,
    flareFlashEnd: null,
    flareGateFailed: false,
    flareResolved: false,
    phase: "ready",
    lossReason: null,
    blackoutSince: null,
    roverBoops: 0,
  };
}

export function activeSystems(s: GameState): number {
  return [s.gateLeft, s.gateRight, s.lightLeft, s.lightRight, s.monitorOpen].filter(Boolean).length;
}

/** 1 a 5, como las barras de uso de energía. */
export function usageBars(s: GameState): number {
  return Math.min(5, 1 + activeSystems(s));
}

/** 12:00 AM a 06:00 AM; 10 segundos reales = 1 hora del turno. */
export function clockLabel(elapsed: number): string {
  const hour = Math.min(6, Math.floor(elapsed / 10));
  if (hour === 0) return "12:00 AM";
  return `0${hour}:00 AM`;
}

function pumpingNow(s: GameState): boolean {
  return s.pumping && s.monitorOpen && s.camera === 4;
}

export function tick(state: GameState, rules: SolRules): GameState {
  if (state.phase !== "playing" && state.phase !== "blackout") return state;
  const s = { ...state, elapsed: state.elapsed + 1 };

  // --- Oxígeno (regla de diseño, no una medición real) ---
  if (pumpingNow(s)) s.oxygen = Math.min(100, s.oxygen + (PUMP_RATE - rules.oxygenDrainPerSecond));
  else s.oxygen = Math.max(0, s.oxygen - rules.oxygenDrainPerSecond);

  // --- Batería ---
  if (s.phase === "playing") {
    const drain = rules.batteryIdleDrainPerSecond + SYSTEM_DRAIN * activeSystems(s);
    s.battery = Math.max(0, s.battery - drain);
    if (s.battery <= 0) {
      s.phase = "blackout";
      s.blackoutSince = s.elapsed;
      s.gateLeft = false;
      s.gateRight = false;
      s.lightLeft = false;
      s.lightRight = false;
      s.monitorOpen = false;
      s.pumping = false;
    }
  } else if (s.phase === "blackout" && s.blackoutSince !== null && s.elapsed - s.blackoutSince >= BLACKOUT_SECONDS) {
    s.phase = "lost";
    s.lossReason = "battery";
  }

  // --- Tormenta de polvo (ruta izquierda) ---
  if (s.dustPhase === "idle" && s.elapsed >= rules.dustStart) s.dustPhase = "far";
  else if (s.dustPhase === "far" && s.elapsed >= (rules.dustStart + rules.dustAtWindow) / 2) s.dustPhase = "approaching";
  else if (s.dustPhase === "approaching" && s.elapsed >= rules.dustAtWindow) {
    s.dustPhase = "window";
    s.dustWindowSince = s.elapsed;
  } else if (s.dustPhase === "window") {
    if (s.gateLeft) {
      s.dustPhase = "retreated";
    } else if (s.dustWindowSince !== null && s.elapsed - s.dustWindowSince >= rules.dustHitAfter) {
      s.dustPhase = "hit";
      if (s.phase === "playing" || s.phase === "blackout") {
        s.phase = "lost";
        s.lossReason = s.lossReason ?? "dust";
      }
    }
  }

  // --- Llamarada solar (ruta derecha) ---
  if (s.flareLevel === 0 && s.elapsed >= rules.flareLevel1) s.flareLevel = 1;
  if (s.flareLevel === 1 && s.elapsed >= rules.flareLevel2) s.flareLevel = 2;
  if (s.flareLevel === 2 && s.elapsed >= rules.flareCritical) {
    s.flareLevel = 3;
    s.flareFlashEnd = rules.flareCritical + rules.flareFlashSeconds;
  }
  if (s.flareLevel === 3 && s.flareFlashEnd !== null && !s.flareResolved) {
    if (!s.gateRight) s.flareGateFailed = true;
    if (s.elapsed >= s.flareFlashEnd) {
      s.flareResolved = true;
      if (s.flareGateFailed && (s.phase === "playing" || s.phase === "blackout")) {
        s.phase = "lost";
        s.lossReason = s.lossReason ?? "flare";
      }
    }
  }

  // --- Oxígeno agotado ---
  if (s.oxygen <= 0 && (s.phase === "playing" || s.phase === "blackout")) {
    s.phase = "lost";
    s.lossReason = s.lossReason ?? "oxygen";
  }

  // --- Victoria ---
  if (s.phase === "playing" && s.elapsed >= TOTAL_SECONDS) s.phase = "won";

  return s;
}

export function toggleGate(s: GameState, side: "left" | "right"): GameState {
  if (s.phase !== "playing") return s;
  return side === "left" ? { ...s, gateLeft: !s.gateLeft } : { ...s, gateRight: !s.gateRight };
}

export function setLight(s: GameState, side: "left" | "right", held: boolean): GameState {
  if (s.phase !== "playing" && !(s.phase === "blackout")) return s;
  if (s.phase === "blackout") return s;
  return side === "left" ? { ...s, lightLeft: held } : { ...s, lightRight: held };
}

export function toggleMonitor(s: GameState): GameState {
  if (s.phase !== "playing") return s;
  return { ...s, monitorOpen: !s.monitorOpen, pumping: s.monitorOpen ? false : s.pumping };
}

export function setCamera(s: GameState, camera: Camera): GameState {
  if (!s.monitorOpen) return s;
  return { ...s, camera, pumping: camera === 4 ? s.pumping : false };
}

export function setPumping(s: GameState, held: boolean): GameState {
  if (s.phase !== "playing" || !s.monitorOpen || s.camera !== 4) return { ...s, pumping: false };
  return { ...s, pumping: held };
}

export function boopRover(s: GameState): GameState {
  return { ...s, roverBoops: s.roverBoops + 1 };
}

export function startPlaying(s: GameState): GameState {
  return { ...initialState(), phase: "playing" };
}
