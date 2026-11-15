import { describe, expect, it } from "vitest";
import {
  activeSystems,
  clockLabel,
  initialState,
  setCamera,
  setLight,
  setPumping,
  tick,
  toggleGate,
  toggleMonitor,
  usageBars,
  type GameState,
  type SolRules,
} from "./engine";

/** Umbrales lejanos: en estas pruebas no interesa que dispare la tormenta o la llamarada. */
const NEUTRAL = { dustStart: 999, dustAtWindow: 999, dustHitAfter: 999, flareLevel1: 999, flareLevel2: 999, flareCritical: 999, flareFlashSeconds: 1 };

const RULES: SolRules = {
  ...NEUTRAL,
  oxygenDrainPerSecond: 1,
  batteryIdleDrainPerSecond: 0.3,
};

const DUST_RULES: SolRules = { ...RULES, dustStart: 2, dustAtWindow: 6, dustHitAfter: 2 };
const FLARE_RULES: SolRules = { ...RULES, flareLevel1: 3, flareLevel2: 6, flareCritical: 10, flareFlashSeconds: 2 };

function play(n: number, state: GameState = { ...initialState(), phase: "playing" }, rules = RULES) {
  let s = state;
  for (let i = 0; i < n; i++) s = tick(s, rules);
  return s;
}

describe("reloj del turno", () => {
  it("avanza una hora cada 10 segundos", () => {
    expect(clockLabel(0)).toBe("12:00 AM");
    expect(clockLabel(9)).toBe("12:00 AM");
    expect(clockLabel(10)).toBe("01:00 AM");
    expect(clockLabel(60)).toBe("06:00 AM");
  });

  it("gana al llegar a las 06:00 AM", () => {
    const s = play(60);
    expect(s.phase).toBe("won");
  });
});

describe("consumo de energía", () => {
  it("cada sistema activo suma una barra de uso", () => {
    const base = { ...initialState(), phase: "playing" as const };
    expect(usageBars(base)).toBe(1);
    const withGate = toggleGate(base, "left");
    expect(activeSystems(withGate)).toBe(1);
    expect(usageBars(withGate)).toBe(2);
  });

  it("más sistemas activos gastan batería más rápido", () => {
    const idle = play(5);
    const busy = play(5, {
      ...initialState(),
      phase: "playing",
      gateLeft: true,
      gateRight: true,
      lightLeft: true,
      monitorOpen: true,
    });
    expect(busy.battery).toBeLessThan(idle.battery);
  });

  it("entra en apagón al llegar a 0% y pierde 3 segundos después", () => {
    let s: GameState = { ...initialState(), phase: "playing", battery: 0.2 };
    s = tick(s, RULES);
    expect(s.phase).toBe("blackout");
    s = play(1, s);
    s = play(1, s);
    expect(s.phase).toBe("blackout");
    s = play(1, s);
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("battery");
  });
});

describe("tormenta de polvo (ruta izquierda)", () => {
  it("golpea la base si la compuerta izquierda sigue abierta", () => {
    const s = play(9, undefined, DUST_RULES);
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("dust");
  });

  it("se retira si la compuerta izquierda está cerrada a tiempo", () => {
    let s = play(6, undefined, DUST_RULES);
    expect(s.dustPhase).toBe("window");
    s = toggleGate(s, "left");
    s = play(1, s, DUST_RULES);
    expect(s.dustPhase).toBe("retreated");
    expect(s.phase).toBe("playing");
  });
});

describe("llamarada solar (ruta derecha)", () => {
  it("daña la base si la compuerta derecha está abierta durante el destello", () => {
    const s = play(13, undefined, FLARE_RULES);
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("flare");
  });

  it("bloquea la radiación si la compuerta derecha está cerrada durante el destello", () => {
    let s = play(9, undefined, FLARE_RULES);
    s = toggleGate(s, "right");
    s = play(4, s, FLARE_RULES);
    expect(s.flareResolved).toBe(true);
    expect(s.phase).toBe("playing");
  });
});

describe("oxígeno e invernadero", () => {
  it("baja constantemente y puede agotarse", () => {
    const s = play(100, undefined, { ...RULES, oxygenDrainPerSecond: 2 });
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("oxygen");
  });

  it("bombear solo funciona con el monitor abierto en la cámara 4", () => {
    let s: GameState = { ...initialState(), phase: "playing", oxygen: 50 };
    s = setPumping(s, true);
    expect(s.pumping).toBe(false);
    s = toggleMonitor(s);
    s = setCamera(s, 4);
    s = setPumping(s, true);
    expect(s.pumping).toBe(true);
    const before = s.oxygen;
    s = tick(s, RULES);
    expect(s.oxygen).toBeGreaterThan(before);
  });
});

