/** Reglas didácticas ficticias; no representan mediciones de una base real. */
export type Phase = "ready" | "playing" | "won" | "lost";
export type Threat = "dust" | "solar" | null;
export type Stage = "lejos" | "cerca" | "inminente" | "impacto" | null;
export type Camera = 1 | 2 | 3 | 4;

export interface Night {
  phase: Phase;
  elapsed: number;
  battery: number;
  oxygen: number;
  integrity: number;
  dust: number;
  shield: boolean;
  cover: boolean;
  monitor: boolean;
  camera: Camera;
  impacts: number;
  protected: number;
  lastMessage: string;
  alien: boolean;
  alienGone: boolean;
}

export const initialNight = (): Night => ({
  phase: "ready", elapsed: 0, battery: 100, oxygen: 100, integrity: 100,
  dust: 18, shield: false, cover: false, monitor: false, camera: 1,
  impacts: 0, protected: 0, lastMessage: "Todo listo para el turno.", alien: false, alienGone: false,
});

// Momentos elegidos para el juego, no fechas o pronósticos de la NASA.
export const EVENTS = [
  { kind: "dust" as const, start: 10, impact: 22 },
  { kind: "solar" as const, start: 32, impact: 44 },
];

export function threatAt(time: number, kind: Exclude<Threat, null>): Stage {
  const event = EVENTS.find((item) => item.kind === kind)!;
  const delta = time - event.start;
  if (delta < 0 || time >= event.impact + 2) return null;
  if (time >= event.impact) return "impacto";
  if (delta < 4) return "lejos";
  if (delta < 8) return "cerca";
  return "inminente";
}

export function usage(s: Night): number {
  return 1 + Number(s.monitor) + Number(s.shield) + Number(s.cover);
}

export function tick(state: Night): Night {
  if (state.phase !== "playing") return state;
  const elapsed = state.elapsed + 1;
  // Percentages and rates are deliberately game parameters, not NASA data.
  const generation = state.cover ? 0 : Math.max(0, 0.32 * (1 - state.dust / 100));
  let battery = Math.max(0, Math.min(100, state.battery - 0.52 - 0.43 * (usage(state) - 1) + generation));
  let oxygen = Math.max(0, state.oxygen - 0.12);
  let integrity = state.integrity;
  let dust = Math.min(100, state.dust + (state.cover ? 0.03 : 0.22));
  let { impacts, protected: saved, lastMessage, alien, alienGone } = state;

  if (elapsed === 22) {
    impacts++;
    if (state.cover) { saved++; lastMessage = "¡Cubierta a tiempo! Paneles protegidos."; }
    else { dust = Math.min(100, dust + 36); integrity = Math.max(0, integrity - 14); lastMessage = "El polvo alcanzó los paneles. Límpialos."; }
  }
  if (elapsed === 44) {
    impacts++;
    if (state.shield) { saved++; lastMessage = "¡Escudo a tiempo! La base está protegida."; }
    else { oxygen = Math.max(0, oxygen - 25); integrity = Math.max(0, integrity - 16); lastMessage = "El evento solar dañó la base. Revisa el oxígeno."; }
  }
  if (elapsed === 28 && !alienGone) { alien = true; lastMessage = "¡Un visitante de ficción en la ventana!"; }
  if (elapsed === 36 && alien) { alien = false; alienGone = true; lastMessage = "El visitante se fue solo."; }
  const phase: Phase = battery <= 0 || oxygen <= 0 || integrity <= 0 ? "lost" : elapsed >= 60 ? "won" : "playing";
  return { ...state, elapsed, battery, oxygen, integrity, dust, impacts, protected: saved, lastMessage, alien, alienGone, phase };
}

export function clean(state: Night): Night {
  if (state.phase !== "playing" || !state.monitor || state.camera !== 2 || state.battery < 8 || state.dust <= 0) return state;
  return { ...state, battery: state.battery - 8, dust: Math.max(0, state.dust - 32), lastMessage: "Paneles limpiados. La limpieza también usa energía." };
}

export function clock(elapsed: number): string {
  return `${String(Math.min(6, Math.floor(elapsed / 10))).padStart(2, "0")}:00`;
}
