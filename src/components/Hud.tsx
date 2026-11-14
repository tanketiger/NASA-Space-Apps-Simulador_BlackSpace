"use client";

import Brand from "./Brand";
import Meter from "./Meter";
import SourceBadge from "./SourceBadge";
import type { GameState } from "@/lib/sim/types";

const RISK = {
  0: { label: "Calma", color: "#79dc8d" },
  1: { label: "Actividad ligera", color: "#f2c14e" },
  2: { label: "Actividad alta", color: "#e8a15c" },
  3: { label: "Tormenta severa", color: "#ef6b6b" },
} as const;

export default function Hud({ game, onMenu }: { game: GameState; onMenu: () => void }) {
  const risk = RISK[game.weather.risk];
  const live = game.weather.source === "live";

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Brand />

        <div className="hidden h-9 w-px bg-line md:block" />

        <div className="flex items-baseline gap-2">
          <span className="micro">Sol</span>
          <span className="num text-2xl font-semibold leading-none text-dust">
            {String(game.sol).padStart(2, "0")}
          </span>
          <span className="num text-xs text-muted">/ {game.solsTotal}</span>
        </div>

        <div className="flex flex-col">
          <span className="micro">Fecha terrestre</span>
          <span className="num text-xs text-ink/90">{game.weather.earthDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="chip"
            style={{ color: risk.color, borderColor: `${risk.color}55`, background: `${risk.color}12` }}
          >
            <span className="pulse-soft" aria-hidden>
              ●
            </span>
            {risk.label}
          </span>
          <SourceBadge kind={game.weather.source} text={live ? "EN VIVO" : "ARCHIVO"} />
        </div>

        <div className="ml-auto grid w-full grid-cols-2 gap-x-5 gap-y-2 sm:w-auto sm:grid-cols-4">
          <div className="w-[118px]">
            <Meter label="Batería" value={game.battery} max={60} unit="kWh" tone="dust" compact />
          </div>
          <div className="w-[118px]">
            <Meter label="Oxígeno" value={game.o2} tone="ice" compact />
          </div>
          <div className="w-[118px]">
            <Meter label="Dosis" value={game.doseMsv} max={600} unit="mSv" tone="bad" compact />
          </div>
          <div className="w-[118px]">
            <Meter label="Comida" value={game.food} max={15} unit="días" tone="good" compact />
          </div>
        </div>

        <button onClick={onMenu} className="btn !px-3 !py-2 text-[11px]" aria-label="Volver al menú">
          Menú
        </button>
      </div>
    </header>
  );
}
