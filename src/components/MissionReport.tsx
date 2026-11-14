"use client";

import { RotateCcw, X } from "lucide-react";
import SourceBadge from "./SourceBadge";
import { C } from "@/lib/sim/constants";
import { projectDose } from "@/lib/sim/engine";
import type { GameState } from "@/lib/sim/types";

export default function MissionReport({
  game,
  onClose,
  onRestart,
}: {
  game: GameState;
  onClose: () => void;
  onRestart: () => void;
}) {
  const survived = !game.failed;
  const sols = Math.max(1, game.sol - 1);
  const projected = projectDose(game.doseMsv, sols);
  const pct = Math.round((projected / C.doseLimitMsv) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
      <div className="panel rise max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="micro">Informe final</span>
            <h2 className="mt-1 text-2xl font-bold">
              {survived ? "Mision completada" : "Mision terminada"}
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              {survived
                ? "La tripulacion sobrevivio. Esta es la huella que dejo tu gestion."
                : game.failed === "o2"
                  ? "El oxigeno llego a cero. La tripulacion tuvo que evacuar."
                  : "La bateria se agoto y los sistemas criticos se apagaron."}
            </p>
          </div>
          <button onClick={onClose} className="btn !p-2" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { k: "Soles", v: `${sols}`, c: "#e8a15c" },
            { k: "Dosis", v: `${game.doseMsv.toFixed(1)} mSv`, c: "#ef6b6b" },
            { k: "Ciencia", v: `${game.studies.length}`, c: "#5fd0c8" },
            { k: "O2 final", v: `${game.o2.toFixed(0)} %`, c: "#79dc8d" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-line/70 bg-white/[0.02] p-3">
              <div className="micro !text-[9px]">{x.k}</div>
              <div className="num mt-0.5 text-lg" style={{ color: x.c }}>
                {x.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-warn/30 bg-warn/[0.06] p-4">
          <div className="flex items-baseline justify-between">
            <span className="micro">Si esta mision durara {C.projectionSols} soles</span>
            <span className="num text-xl text-warn">{projected.toFixed(0)} mSv</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#141a25]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: "linear-gradient(90deg,#f2c14e,#ef6b6b)",
              }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Eso seria el <span className="text-warn">{pct} %</span> del limite de carrera de {C.doseLimitMsv}{" "}
            mSv. La radiacion no se siente y no se cura: solo se previene.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="micro">Estudios reales desbloqueados</h3>
          {game.studies.length === 0 ? (
            <p className="mt-1 text-[11px] text-muted">Ninguno. La ciencia tambien cuesta energia.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {game.studies.map((s) => (
                <li key={s.accession} className="flex items-baseline gap-2 text-[11px]">
                  <span className="num shrink-0 text-[#6fa8ff]">{s.accession}</span>
                  <span className="line-clamp-1 text-muted">{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
          <SourceBadge kind="live" text="DONKI en vivo" />
          <SourceBadge kind="archive" text="OSDR / Mars Trek" />
          <SourceBadge kind="reference" text="MSL-RAD" />
          <SourceBadge kind="simulated" text="Cuerpo: modelo" />
          <button onClick={onRestart} className="btn btn-primary ml-auto">
            <RotateCcw size={15} /> Nueva mision
          </button>
        </div>
      </div>
    </div>
  );
}
