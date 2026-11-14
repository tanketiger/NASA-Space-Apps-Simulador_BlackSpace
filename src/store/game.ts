"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { C } from "@/lib/sim/constants";
import { availableEnergy, endSol } from "@/lib/sim/engine";
import { createInitialState, SCENARIOS, STUDY_POOL } from "@/lib/sim/scenarios";
import type { Allocation, GameState, RoomId, ScenarioId } from "@/lib/sim/types";

interface GameStore {
  game: GameState | null;
  room: RoomId;
  onboarding: boolean;
  reportOpen: boolean;
  martian: boolean;
  start: (scenario: ScenarioId) => void;
  reset: () => void;
  setRoom: (room: RoomId) => void;
  setAllocation: (key: keyof Allocation, value: number) => void;
  cleanPanels: () => void;
  dispatchRover: () => void;
  greenhouse: () => void;
  repair: () => void;
  nextSol: () => void;
  closeReport: () => void;
  scareMartian: () => void;
  finishOnboarding: () => void;
}

function clampAllocation(game: GameState, alloc: Allocation): Allocation {
  const budget = availableEnergy(game, game.weather);
  const total = alloc.life + alloc.shield + alloc.comms + alloc.science;
  if (total <= budget) return alloc;
  const k = budget / total;
  return {
    life: Math.round(alloc.life * k * 10) / 10,
    shield: Math.round(alloc.shield * k * 10) / 10,
    comms: Math.round(alloc.comms * k * 10) / 10,
    science: Math.round(alloc.science * k * 10) / 10,
  };
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      room: "control",
      onboarding: true,
      reportOpen: false,
      martian: false,

      start: (scenario) => set({ game: createInitialState(scenario), room: "control", onboarding: false }),

      reset: () => set({ game: null, room: "control", onboarding: true, reportOpen: false }),

      setRoom: (room) => set({ room }),

      setAllocation: (key, value) =>
        set((s) => {
          if (!s.game || s.game.phase !== "plan") return {};
          const next = { ...s.game.allocation, [key]: Math.max(0, value) };
          return { game: { ...s.game, allocation: clampAllocation(s.game, next) } };
        }),

      cleanPanels: () =>
        set((s) => {
          if (!s.game || s.game.phase !== "plan") return {};
          if (s.game.battery < C.cleanKwh || s.game.actionsUsed.includes("clean")) return {};
          return {
            game: {
              ...s.game,
              battery: s.game.battery - C.cleanKwh,
              dust: Math.max(0, s.game.dust - C.cleanDust),
              actionsUsed: [...s.game.actionsUsed, "clean"],
              log: [
                ...s.game.log,
                { sol: s.game.sol, text: "Paneles limpiados: +25 % de luz recuperada.", tone: "good" as const },
              ],
            },
          };
        }),

      dispatchRover: () =>
        set((s) => {
          if (!s.game || s.game.phase !== "plan") return {};
          if (s.game.battery < C.roverKwh || s.game.actionsUsed.includes("rover")) return {};
          return {
            game: {
              ...s.game,
              battery: s.game.battery - C.roverKwh,
              science: s.game.science + C.roverScience,
              actionsUsed: [...s.game.actionsUsed, "rover"],
              log: [
                ...s.game.log,
                {
                  sol: s.game.sol,
                  text: "Rover enviado a recolectar muestras. La dosis de la tripulación subirá al volver.",
                  tone: "info" as const,
                },
              ],
            },
          };
        }),

      greenhouse: () =>
        set((s) => {
          if (!s.game || s.game.phase !== "plan") return {};
          if (s.game.battery < C.greenhouseKwh || s.game.actionsUsed.includes("greenhouse")) return {};
          return {
            game: {
              ...s.game,
              battery: s.game.battery - C.greenhouseKwh,
              food: s.game.food + 1,
              actionsUsed: [...s.game.actionsUsed, "greenhouse"],
              log: [
                ...s.game.log,
                { sol: s.game.sol, text: "Cosecha completada: +1 día de comida.", tone: "good" as const },
              ],
            },
          };
        }),

      repair: () =>
        set((s) => {
          if (!s.game || s.game.phase !== "plan") return {};
          if (s.game.battery < C.repairKwh || s.game.actionsUsed.includes("repair")) return {};
          return {
            game: {
              ...s.game,
              battery: s.game.battery - C.repairKwh,
              solarHealth: 1,
              o2Health: 1,
              actionsUsed: [...s.game.actionsUsed, "repair"],
              log: [
                ...s.game.log,
                { sol: s.game.sol, text: "Sistemas reparados: paneles y generador de O₂ al 100 %.", tone: "good" as const },
              ],
            },
          };
        }),

      nextSol: () =>
        set((s) => {
          if (!s.game) return {};
          const scenario = SCENARIOS[s.game.scenario];
          const nextWeather = scenario.days[s.game.sol] ?? s.game.weather;
          const { next } = endSol(s.game, nextWeather, STUDY_POOL);
          const martian = !next.failed && Math.random() < 0.12;
          return {
            game: martian
              ? { ...next, dust: Math.min(1, next.dust + 0.08) }
              : next,
            martian,
            reportOpen: next.phase === "report",
          };
        }),

      closeReport: () => set({ reportOpen: false }),

      scareMartian: () =>
        set((s) => {
          if (!s.game) return {};
          return {
            martian: false,
            game: {
              ...s.game,
              martianSeen: true,
              log: [
                ...s.game.log,
                {
                  sol: s.game.sol,
                  text: "El marciano se asustó y salió corriendo. (Ficción: no es un dato de la NASA).",
                  tone: "info" as const,
                },
              ],
            },
          };
        }),

      finishOnboarding: () => set({ onboarding: false }),
    }),
    {
      name: "aurora-outpost-v1",
      partialize: (s) => ({ game: s.game, onboarding: s.onboarding }),
    },
  ),
);
