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

/** Distant thresholds: these tests do not want the storm or the flare to trigger. */
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

describe("shift clock", () => {
  it("advances one hour every 10 seconds", () => {
    expect(clockLabel(0)).toBe("12:00 AM");
    expect(clockLabel(9)).toBe("12:00 AM");
    expect(clockLabel(10)).toBe("01:00 AM");
    expect(clockLabel(60)).toBe("06:00 AM");
  });

  it("wins on reaching 06:00 AM", () => {
    const s = play(60);
    expect(s.phase).toBe("won");
  });
});

describe("power consumption", () => {
  it("every active system adds one usage bar", () => {
    const base = { ...initialState(), phase: "playing" as const };
    expect(usageBars(base)).toBe(1);
    const withGate = toggleGate(base, "left");
    expect(activeSystems(withGate)).toBe(1);
    expect(usageBars(withGate)).toBe(2);
  });

  it("more active systems drain the battery faster", () => {
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

  it("enters blackout at 0% and loses 3 seconds later", () => {
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

describe("dust storm (left route)", () => {
  it("hits the base if the left gate is still open", () => {
    const s = play(9, undefined, DUST_RULES);
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("dust");
  });

  it("retreats if the left gate is closed in time", () => {
    let s = play(6, undefined, DUST_RULES);
    expect(s.dustPhase).toBe("window");
    s = toggleGate(s, "left");
    s = play(1, s, DUST_RULES);
    expect(s.dustPhase).toBe("retreated");
    expect(s.phase).toBe("playing");
  });
});

describe("solar flare (right route)", () => {
  it("damages the base if the right gate is open during the flash", () => {
    const s = play(13, undefined, FLARE_RULES);
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("flare");
  });

  it("blocks the radiation if the right gate is closed during the flash", () => {
    let s = play(9, undefined, FLARE_RULES);
    s = toggleGate(s, "right");
    s = play(4, s, FLARE_RULES);
    expect(s.flareResolved).toBe(true);
    expect(s.phase).toBe("playing");
  });
});

describe("oxygen and greenhouse", () => {
  it("drops constantly and can run out", () => {
    const s = play(100, undefined, { ...RULES, oxygenDrainPerSecond: 2 });
    expect(s.phase).toBe("lost");
    expect(s.lossReason).toBe("oxygen");
  });

  it("pumping only works with the monitor open on camera 4", () => {
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
