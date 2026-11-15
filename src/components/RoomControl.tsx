"use client";

import { Activity, Radio, Sun, Wind } from "lucide-react";
import AllocationPanel from "./AllocationPanel";
import Meter from "./Meter";
import SourceBadge from "./SourceBadge";
import { IMG, IMG_CREDITS } from "@/lib/assets";
import { C } from "@/lib/sim/constants";
import { solarGeneration } from "@/lib/sim/engine";
import type { Allocation, GameState } from "@/lib/sim/types";

export default function RoomControl({
  game,
  setAllocation,
  onExterior,
}: {
  game: GameState;
  setAllocation: (k: keyof Allocation, v: number) => void;
  onExterior: () => void;
}) {
  const solar = solarGeneration(game, game.weather);
  const w = game.weather;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Monitores de la base</h2>
            <SourceBadge kind="simulated" text="Modelo del juego" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-white/[0.02] p-3">
              <Meter label="Oxígeno del hábitat" value={game.o2} tone="ice" />
              <p className="mt-2 text-[10px] leading-snug text-muted">
                Mínimo seguro: 19,5 %. Si llega a 0, la misión termina.
              </p>
            </div>
            <div className="rounded-xl border border-line/70 bg-white/[0.02] p-3">
              <Meter
                label="Dosis acumulada"
                value={game.doseMsv}
                max={C.doseLimitMsv}
                unit="mSv"
                tone="bad"
                hint={`Límite de carrera: ${C.doseLimitMsv} mSv`}
              />
            </div>
            <div className="rounded-xl border border-line/70 bg-white/[0.02] p-3">
              <Meter label="Batería" value={game.battery} max={C.batteryCap} unit="kWh" tone="dust" />
              <p className="mt-2 text-[10px] leading-snug text-muted">
                Generación solar de hoy: <span className="num text-dust">{solar.toFixed(1)} kWh</span> · RTG{" "}
                {C.rtgKwh} kWh
              </p>
            </div>
            <div className="rounded-xl border border-line/70 bg-white/[0.02] p-3">
              <Meter label="Polvo en paneles" value={game.dust * 100} tone="warn" />
              <button onClick={onExterior} className="btn mt-2 w-full !py-1.5 text-[11px]">
                <Wind size={13} /> Ir a limpiar
              </button>
            </div>
          </div>
        </section>

        <AllocationPanel game={game} setAllocation={setAllocation} />
      </div>

      <div className="space-y-4 lg:col-span-5">
        {/* Clima espacial real */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sun size={16} className="text-dust" />
              <h2 className="text-sm font-semibold">Clima espacial</h2>
            </div>
            <SourceBadge kind={w.source} text={w.source === "live" ? "EN VIVO" : "ARCHIVO"} />
          </div>
          <div className="p-4">
            <div className="flex items-baseline gap-2">
              <span className="num text-3xl font-semibold text-dust">{w.risk}</span>
              <span className="text-sm text-muted">/ 3 · {w.label}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {w.event ? (
                <>
                  <span className="text-ink/90">{w.event.title}.</span> {w.event.detail}
                </>
              ) : (
                "Sin eventos solares relevantes en esta fecha."
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">
                <Radio size={11} /> Retardo Tierra–Marte: 4–24 min
              </span>
              <span className="chip">
                <Activity size={11} /> Dosis base: {C.doseBaseMsv} mSv/sol
              </span>
            </div>
            <p className="mt-3 text-[10px] text-muted">
              Fuente: <span className="text-ink/70">NASA DONKI</span> · {w.sourceLabel}
            </p>
          </div>
        </section>

        {/* Ventanas */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <h2 className="text-sm font-semibold">Ventanas al exterior</h2>
            <SourceBadge kind="archive" text="Imagen real" />
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {[IMG.windowA, IMG.windowB].map((src, i) => (
              <figure
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line/80"
              >
                <img
                  src={src}
                  alt={`Vista real de Marte desde la ventana ${i + 1}`}
                  className="h-full w-full scale-110 object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.18]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <figcaption className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                  <span className="micro !text-[8px] !text-white/70">Ventana {i + 1}</span>
                  <span className="micro !text-[8px] !text-white/50">NASA/JPL</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="px-4 pb-3 text-[9px] leading-snug text-muted">{IMG_CREDITS}</p>
        </section>

        {game.lastReport && (
          <section className="panel p-4">
            <h3 className="micro">Cierre del sol anterior</h3>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <span className="text-muted">Solar generada</span>
              <span className="num text-right text-dust">{game.lastReport.solarKwh.toFixed(1)} kWh</span>
              <span className="text-muted">Energía usada</span>
              <span className="num text-right">{game.lastReport.spendKwh.toFixed(1)} kWh</span>
              <span className="text-muted">Dosis del sol</span>
              <span className="num text-right text-bad">{game.lastReport.doseMsv.toFixed(2)} mSv</span>
              <span className="text-muted">Escudo</span>
              <span className="num text-right text-[#6fa8ff]">{game.lastReport.shieldPct.toFixed(0)} %</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
