"use client";

import { ArrowRight, Clock, Radio, ShieldCheck } from "lucide-react";
import Brand from "./Brand";
import SourceBadge from "./SourceBadge";
import { SCENARIOS } from "@/lib/sim/scenarios";
import type { ScenarioId } from "@/lib/sim/types";

const BADGE = {
  live: { kind: "live" as const, text: "EN VIVO" },
  archive: { kind: "archive" as const, text: "HISTORICO" },
  empty: { kind: "reference" as const, text: "SIN DATOS" },
};

export default function Onboarding({
  onStart,
  hasGame,
  onContinue,
}: {
  onStart: (s: ScenarioId) => void;
  hasGame: boolean;
  onContinue: () => void;
}) {
  const list = [SCENARIOS.vivo, SCENARIOS.tormenta];

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-[1100px] flex-col justify-center px-5 py-12">
      <div className="rise">
        <Brand size={44} />

        <h1 className="mt-8 max-w-[18ch] text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
          Cuatro personas.
          <br />
          <span className="text-dust">Una base.</span>
          <br />
          Energía limitada.
        </h1>

        <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-muted">
          Eres el control de misión de <span className="text-ink">AURORA</span>, un puesto avanzado en
          Marte. Cada sol tienes la misma energía y cuatro cosas que la necesitan: sobrevivir,
          protegerte, comunicarte y hacer ciencia.{" "}
          <span className="text-ink">Ninguna es gratis.</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">
            <Radio size={12} /> Datos reales de la NASA
          </span>
          <span className="chip">
            <ShieldCheck size={12} /> Sin cuenta ni descarga
          </span>
          <span className="chip">
            <Clock size={12} /> 10 minutos
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {list.map((s) => {
          const b = BADGE[s.badge];
          const maxRisk = Math.max(...s.days.map((d) => d.risk));
          return (
            <button
              key={s.id}
              onClick={() => onStart(s.id)}
              className="panel group p-5 text-left transition-all hover:-translate-y-0.5 hover:border-dust/40"
            >
              <div className="flex items-center justify-between">
                <SourceBadge kind={b.kind} text={b.text} />
                <ArrowRight
                  size={18}
                  className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-dust"
                />
              </div>
              <h2 className="mt-3 text-lg font-semibold">{s.name}</h2>
              <p className="mt-1 text-[11.5px] leading-snug text-muted">{s.tagline}</p>
              <div className="mt-3 flex gap-3 text-[10px] text-muted">
                <span>{s.days.length} soles</span>
                <span>Riesgo max: {maxRisk}/3</span>
              </div>
            </button>
          );
        })}
      </div>

      {hasGame && (
        <button onClick={onContinue} className="btn btn-primary mt-4 w-full">
          Continuar la partida guardada
        </button>
      )}

      <p className="mt-6 max-w-[70ch] text-[10px] leading-snug text-muted">
        Las imagenes son fotos reales de misiones de la NASA. El cuerpo de la tripulación es un modelo
        del juego, no un dato de la NASA. Cada dato lleva su etiqueta de procedencia.
      </p>
    </main>
  );
}
