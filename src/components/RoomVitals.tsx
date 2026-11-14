"use client";

import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import Meter from "./Meter";
import SourceBadge from "./SourceBadge";
import { C } from "@/lib/sim/constants";
import { dosePercent, projectDose } from "@/lib/sim/engine";
import type { GameState } from "@/lib/sim/types";

export default function RoomVitals({ game }: { game: GameState }) {
  const projected = projectDose(game.doseMsv, Math.max(1, game.sol - 1));
  const pct = dosePercent(game.doseMsv);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck size={17} className="text-[#6fa8ff]" /> Dosímetro de la tripulación
            </h2>
            <SourceBadge kind="reference" text="Referencia NASA" />
          </div>

          <div className="mt-4">
            <Meter label="Dosis acumulada" value={game.doseMsv} max={C.doseLimitMsv} unit="mSv" tone="bad" />
            <p className="mt-1 text-[10px] text-muted">
              {pct.toFixed(2)} % del límite de carrera ({C.doseLimitMsv} mSv)
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-line/70 bg-white/[0.02] p-3">
            <div className="flex items-baseline justify-between">
              <span className="micro">Proyección a {C.projectionSols} soles</span>
              <span className="num text-lg text-warn">{projected.toFixed(0)} mSv</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#141a25]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (projected / C.doseLimitMsv) * 100)}%`,
                  background: "linear-gradient(90deg,#f2c14e,#ef6b6b)",
                }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted">
              A este ritmo, una estancia de {C.projectionSols} soles llegaría al{" "}
              {Math.min(999, Math.round((projected / C.doseLimitMsv) * 100))} % del límite. La radiación
              no se siente y no se cura: solo se previene.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line/70 bg-white/[0.02] p-2.5">
              <div className="micro !text-[9px]">Escudo actual</div>
              <div className="num text-lg text-[#6fa8ff]">{game.shieldPct.toFixed(0)} %</div>
            </div>
            <div className="rounded-lg border border-line/70 bg-white/[0.02] p-2.5">
              <div className="micro !text-[9px]">Dosis de hoy</div>
              <div className="num text-lg text-bad">
                {(game.lastReport?.doseMsv ?? 0).toFixed(2)} <span className="text-[10px]">mSv</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel p-4">
          <h3 className="micro">Bitácora de la misión</h3>
          <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {[...game.log].reverse().map((l, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-snug">
                <span className="num shrink-0 text-muted">S{String(l.sol).padStart(2, "0")}</span>
                <span
                  style={{
                    color:
                      l.tone === "bad" ? "#ef6b6b" : l.tone === "good" ? "#79dc8d" : l.tone === "warn" ? "#f2c14e" : "#8b93a6",
                  }}
                >
                  {l.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-4 lg:col-span-7">
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen size={17} className="text-dust" /> Cartas de ciencia
            </h2>
            <SourceBadge kind="archive" text="Estudios reales · OSDR" />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Cada punto de ciencia desbloquea un estudio real del repositorio abierto de la NASA. Son
            investigaciones que existen: puedes abrir el enlace y leerlas.
          </p>

          {game.studies.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center">
              <p className="text-sm text-muted">Todavía no has desbloqueado ningún estudio.</p>
              <p className="mt-1 text-[11px] text-muted">
                Asigna 5 kWh a ciencia (o envía el rover) para conseguir el primero.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {game.studies.map((s) => (
                <a
                  key={s.accession}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border border-line/80 bg-white/[0.02] p-3 transition-colors hover:border-dust/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip" style={{ color: "#6fa8ff", borderColor: "#6fa8ff44" }}>
                      {s.accession}
                    </span>
                    <ExternalLink size={13} className="text-muted transition-colors group-hover:text-dust" />
                  </div>
                  <h3 className="mt-2 line-clamp-3 text-[12.5px] font-semibold leading-snug">{s.title}</h3>
                  {s.organism ? (
                    <p className="mt-1 text-[10px] text-muted">Organismo: {s.organism}</p>
                  ) : null}
                  {s.description ? (
                    <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-muted">{s.description}</p>
                  ) : null}
                  <p className="mt-2 text-[9px] uppercase tracking-widest text-dust/70">{s.tag}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="panel p-4">
          <h3 className="micro">Contramedidas reales (no hay cura para la radiación)</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              ["Blindaje", "Material entre la tripulación y el cielo: la única defensa directa."],
              ["Ejercicio", "Contrarresta la pérdida de hueso y músculo documentada en órbita."],
              ["Sueño", "El descanso protege el sistema inmune y la cognición."],
              ["Nutrición", "Antioxidantes y calorías suficientes reducen el daño celular."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-line/70 bg-white/[0.02] p-2.5">
                <div className="text-[12px] font-semibold">{t}</div>
                <p className="mt-0.5 text-[10px] leading-snug text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
