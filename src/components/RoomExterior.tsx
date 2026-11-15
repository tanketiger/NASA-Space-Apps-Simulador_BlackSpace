"use client";

import { Brush, Bug, Leaf, Radio, Wrench } from "lucide-react";
import Meter from "./Meter";
import SourceBadge from "./SourceBadge";
import { IMG } from "@/lib/assets";
import { C } from "@/lib/sim/constants";
import { solarGeneration } from "@/lib/sim/engine";
import type { GameState } from "@/lib/sim/types";

function Panel({ dust }: { dust: number }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[#2a3346] bg-[#0b1220]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b2b45,#0d1727)]" />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(120,200,255,0.22) 0 1px, transparent 1px 16px), repeating-linear-gradient(0deg, rgba(120,200,255,0.22) 0 1px, transparent 1px 16px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.16), transparent 46%)" }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: 0.12 + dust * 0.75,
          background:
            "radial-gradient(120% 90% at 22% 8%, #c79a63 0%, #9c7448 45%, #6b4f33 100%)",
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: dust * 0.5,
          backgroundImage:
            "radial-gradient(circle at 30% 40%, rgba(200,160,110,0.9) 0 3px, transparent 4px), radial-gradient(circle at 70% 65%, rgba(180,140,95,0.8) 0 2px, transparent 3px)",
          backgroundSize: "26px 26px, 34px 34px",
        }}
      />
    </div>
  );
}

export default function RoomExterior({
  game,
  cleanPanels,
  dispatchRover,
  greenhouse,
  repair,
}: {
  game: GameState;
  cleanPanels: () => void;
  dispatchRover: () => void;
  greenhouse: () => void;
  repair: () => void;
}) {
  const solar = solarGeneration(game, game.weather);
  const used = (k: string) => game.actionsUsed.includes(k);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <section className="panel overflow-hidden">
          <div className="relative h-52 sm:h-64">
            <img
              src={IMG.surface}
              alt="Superficie real de Marte (mosaico NASA/USGS)"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <SourceBadge kind="archive" text="Imagen real · Mars Trek" />
              <span className="chip" style={{ color: "#f2c14e", borderColor: "#f2c14e44" }}>
                Sol {game.sol} · {game.weather.earthDate}
              </span>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-lg font-semibold">Exterior del puesto</h2>
              <p className="text-[11px] text-white/70">
                Polvo en los paneles: {(game.dust * 100).toFixed(0)} % · Generación: {solar.toFixed(1)} kWh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Panel dust={game.dust} />
                <p className="micro mt-1.5 !text-[9px]">Panel {i + 1}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Acciones del sol</h2>
            <span className="micro">1 vez por sol</span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button onClick={cleanPanels} disabled={used("clean") || game.battery < C.cleanKwh} className="btn justify-start">
              <Brush size={15} className="text-dust" />
              <span className="text-left">
                Limpiar paneles
                <span className="block text-[10px] font-normal text-muted">
                  −{C.cleanDust * 100} % de polvo · cuesta {C.cleanKwh} kWh
                </span>
              </span>
            </button>

            <button onClick={dispatchRover} disabled={used("rover") || game.battery < C.roverKwh} className="btn justify-start">
              <Bug size={15} className="text-ice" />
              <span className="text-left">
                Enviar el rover
                <span className="block text-[10px] font-normal text-muted">
                  +{C.roverScience} ciencia · +{C.roverDoseMsv} mSv · {C.roverKwh} kWh
                </span>
              </span>
            </button>

            <button
              onClick={greenhouse}
              disabled={used("greenhouse") || game.battery < C.greenhouseKwh}
              className="btn justify-start"
            >
              <Leaf size={15} className="text-good" />
              <span className="text-left">
                Cosechar invernadero
                <span className="block text-[10px] font-normal text-muted">
                  +1 día de comida · {C.greenhouseKwh} kWh
                </span>
              </span>
            </button>

            <button onClick={repair} disabled={used("repair") || game.battery < C.repairKwh} className="btn justify-start">
              <Wrench size={15} className="text-warn" />
              <span className="text-left">
                Reparar sistemas
                <span className="block text-[10px] font-normal text-muted">
                  Paneles y O₂ al 100 % · {C.repairKwh} kWh
                </span>
              </span>
            </button>
          </div>

          <p className="mt-3 flex items-center gap-2 text-[10px] text-muted">
            <Radio size={12} /> El rover solo sale si el clima lo permite: su dosis depende del evento solar del sol.
          </p>
        </section>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <section className="panel p-4">
          <h3 className="micro">Estado de la planta solar</h3>
          <div className="mt-3 space-y-4">
            <Meter label="Polvo acumulado" value={game.dust * 100} tone="warn" />
            <Meter label="Salud de los paneles" value={game.solarHealth * 100} tone="good" />
            <Meter label="Generación de hoy" value={solar} max={C.solarNominalKwh} unit="kWh" tone="dust" />
          </div>
          <p className="mt-3 text-[10px] leading-snug text-muted">
            La planta nominal produce {C.solarNominalKwh} kWh por sol con los paneles limpios. El polvo
            puede quitar hasta el 85 % de esa energía.
          </p>
        </section>

        <section className="panel p-4">
          <h3 className="micro">Peligros reales de Marte</h3>
          <ul className="mt-2 space-y-2 text-[11px] leading-snug text-muted">
            <li>
              <span className="text-ink/90">Tormenta de polvo global.</span> En 2018 apagó a Opportunity
              durante semanas.
            </li>
            <li>
              <span className="text-ink/90">Remolino de polvo.</span> Puede limpiar los paneles solo: es
              un evento real y a veces ayuda.
            </li>
            <li>
              <span className="text-ink/90">Ciclos térmicos.</span> −90 °C de noche, 20 °C de día: fatiga
              de materiales.
            </li>
            <li>
              <span className="text-ink/90">Radiación.</span> Sin campo magnético ni atmósfera densa, la
              dosis se acumula.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
