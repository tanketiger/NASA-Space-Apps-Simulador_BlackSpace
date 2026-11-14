import { describe, expect, it } from "vitest";
import { C } from "./constants";
import { doseForSol, endSol, projectDose, shieldPctFromKwh, solarGeneration } from "./engine";
import { createInitialState, STUDY_POOL } from "./scenarios";
import type { WeatherDay } from "./types";

const calm: WeatherDay = {
  sol: 1,
  earthDate: "2026-11-05",
  risk: 0,
  label: "Calma",
  solarFactor: 1,
  doseFactor: 1,
  dustDelta: 0.02,
  source: "live",
  sourceLabel: "test",
};

const storm: WeatherDay = { ...calm, risk: 3, label: "Tormenta severa", doseFactor: 12 };

describe("motor de simulación", () => {
  it("genera menos energía cuando hay polvo", () => {
    const game = createInitialState("vivo");
    const clean = solarGeneration({ ...game, dust: 0 }, calm);
    const dirty = solarGeneration({ ...game, dust: 0.8 }, calm);
    expect(clean).toBeGreaterThan(dirty);
    expect(dirty).toBeLessThan(clean * 0.4);
  });

  it("el escudo reduce la dosis y tiene rendimientos decrecientes", () => {
    const game = createInitialState("vivo");
    const noShield = doseForSol({ ...game, allocation: { ...game.allocation, shield: 0 } }, calm, false);
    const halfShield = doseForSol({ ...game, allocation: { ...game.allocation, shield: 7.5 } }, calm, false);
    const fullShield = doseForSol({ ...game, allocation: { ...game.allocation, shield: 15 } }, calm, false);

    expect(halfShield).toBeLessThan(noShield);
    expect(fullShield).toBeLessThan(halfShield);
    expect(fullShield).toBeGreaterThan(0);
    expect(shieldPctFromKwh(15)).toBe(100);
    expect(shieldPctFromKwh(99)).toBe(100);
  });

  it("una tormenta solar multiplica la dosis", () => {
    const game = createInitialState("vivo");
    const quiet = doseForSol(game, calm, false);
    const bad = doseForSol(game, storm, false);
    expect(bad).toBeGreaterThan(quiet * 5);
  });

  it("si falta soporte vital, el oxígeno cae", () => {
    const game = createInitialState("vivo");
    const { next } = endSol(
      { ...game, allocation: { life: 0, shield: 0, comms: 0, science: 0 } },
      calm,
      STUDY_POOL,
    );
    expect(next.o2).toBeLessThan(game.o2);
  });

  it("el sol consume batería y acumula dosis", () => {
    const game = createInitialState("vivo");
    const { next, report } = endSol(game, calm, STUDY_POOL);
    expect(report.spendKwh).toBeGreaterThan(0);
    expect(next.doseMsv).toBeGreaterThan(0);
    expect(next.sol).toBe(2);
    expect(next.battery).toBeLessThanOrEqual(C.batteryCap);
  });

  it("la proyección a 900 soles es lineal", () => {
    expect(projectDose(10, 10)).toBeCloseTo(10 * 90, 5);
    expect(projectDose(0, 10)).toBe(0);
  });
});
