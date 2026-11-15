import { describe, expect, it } from "vitest";
import { clean, clock, initialNight, threatAt, tick, usage } from "./engine";

describe("turno de Aurora", () => {
  it("completa el turno en 60 segundos", () => {
    let s = { ...initialNight(), phase: "playing" as const } as ReturnType<typeof initialNight>;
    for (let i = 0; i < 60; i++) s = tick(s);
    expect(s.phase).toBe("won");
    expect(clock(s.elapsed)).toBe("06:00");
  });
  it("incrementa el consumo de controles y monitor", () => {
    const base = { ...initialNight(), phase: "playing" as const };
    const active = { ...base, shield: true, cover: true, monitor: true };
    expect(usage(active)).toBe(4);
    expect(tick(active).battery).toBeLessThan(tick(base).battery);
  });
  it("el impacto de polvo requiere la cubierta", () => {
    const s = { ...initialNight(), phase: "playing" as const, elapsed: 21 };
    expect(tick(s).integrity).toBeLessThan(s.integrity);
    expect(tick({ ...s, cover: true }).integrity).toBe(s.integrity);
    expect(threatAt(21, "dust")).toBe("inminente");
  });
  it("el escudo protege del evento solar", () => {
    const s = { ...initialNight(), phase: "playing" as const, elapsed: 43 };
    expect(tick(s).oxygen).toBeLessThan(tick({ ...s, shield: true }).oxygen);
  });
  it("la limpieza solo funciona desde la cámara solar y cuesta batería", () => {
    const s = { ...initialNight(), phase: "playing" as const, dust: 60 };
    expect(clean(s)).toEqual(s);
    const result = clean({ ...s, monitor: true, camera: 2 });
    expect(result.dust).toBeLessThan(s.dust);
    expect(result.battery).toBeLessThan(s.battery);
  });
  it("termina cuando se agotan los recursos", () => {
    const s = { ...initialNight(), phase: "playing" as const, battery: 0.1, cover: true };
    expect(tick(s).phase).toBe("lost");
  });
});
