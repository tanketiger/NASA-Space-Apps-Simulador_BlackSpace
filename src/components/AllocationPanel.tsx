"use client";

import { C } from "@/lib/sim/constants";
import { availableEnergy, lifeDemand, shieldPctFromKwh, solarGeneration } from "@/lib/sim/engine";
import type { Allocation, GameState } from "@/lib/sim/types";

const ROWS: {
  key: keyof Allocation;
  label: string;
  max: number;
  hint: string;
  color: string;
}[] = [
  { key: "life", label: "Soporte vital", max: 20, hint: "Oxígeno, agua y temperatura. Si falta, el O₂ cae.", color: "#5fd0c8" },
  { key: "shield", label: "Escudo de radiación", max: 15, hint: "15 kWh = 100 %. Reduce hasta 85 % de la dosis.", color: "#6fa8ff" },
  { key: "comms", label: "Comunicaciones", max: 6, hint: "3 kWh desbloquean el pronóstico del próximo sol.", color: "#b98cff" },
  { key: "science", label: "Ciencia", max: 15, hint: "5 kWh = 1 estudio real de OSDR desbloqueado.", color: "#e8a15c" },
];

export default function AllocationPanel({
  game,
  setAllocation,
}: {
  game: GameState;
  setAllocation: (k: keyof Allocation, v: number) => void;
}) {
  const solar = solarGeneration(game, game.weather);
  const budget = availableEnergy(game, game.weather);
  const a = game.allocation;
  const total = a.life + a.shield + a.comms + a.science;
  const reserve = budget - total;
  const demand = lifeDemand(game);
  const short = a.life < demand;

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Reparto de energía del sol</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Todo sale de la misma batería. Lo que no gastes queda para mañana.
          </p>
        </div>
        <div className="text-right">
          <div className="micro">Disponible hoy</div>
          <div className="num text-2xl font-semibold text-dust">
            {budget.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-muted">kWh</span>
          </div>
        </div>
      </div>

      {/* Composición de la energía */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { k: "Solar", v: solar, c: "#e8a15c" },
          { k: "Batería", v: game.battery, c: "#79dc8d" },
          { k: "RTG nuclear", v: C.rtgKwh, c: "#6fa8ff" },
        ].map((x) => (
          <div key={x.k} className="rounded-lg border border-line/70 bg-white/[0.02] px-2 py-1.5">
            <div className="micro !text-[9px]">{x.k}</div>
            <div className="num text-sm" style={{ color: x.c }}>
              {x.v.toFixed(1)} <span className="text-[10px] text-muted">kWh</span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra segmentada */}
      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-[#141a25]">
        {ROWS.map((r) => (
          <div
            key={r.key}
            style={{ width: `${(a[r.key] / budget) * 100}%`, background: r.color, opacity: 0.85 }}
            title={`${r.label}: ${a[r.key]} kWh`}
          />
        ))}
        <div style={{ width: `${(Math.max(0, reserve) / budget) * 100}%` }} className="bg-white/10" />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted">
        <span>
          Asignado <span className="num text-ink/80">{total.toFixed(1)} kWh</span>
        </span>
        <span>
          Reserva <span className="num text-ink/80">{Math.max(0, reserve).toFixed(1)} kWh</span>
        </span>
      </div>

      <div className="mt-4 space-y-3.5">
        {ROWS.map((r) => (
          <div key={r.key}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`alloc-${r.key}`} className="flex items-center gap-2 text-[12.5px] font-medium">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
                {r.label}
                {r.key === "life" && (
                  <span className="micro !text-[9px]" style={{ color: short ? "#ef6b6b" : "#8b93a6" }}>
                    mín. {demand.toFixed(0)}
                  </span>
                )}
                {r.key === "shield" && (
                  <span className="micro !text-[9px]">{shieldPctFromKwh(a.shield).toFixed(0)} %</span>
                )}
              </label>
              <span className="num text-xs" style={{ color: r.color }}>
                {a[r.key].toFixed(1)} kWh
              </span>
            </div>
            <input
              id={`alloc-${r.key}`}
              type="range"
              min={0}
              max={r.max}
              step={0.5}
              value={a[r.key]}
              onChange={(e) => setAllocation(r.key, Number(e.target.value))}
              aria-label={r.label}
            />
            <p className="text-[10px] leading-snug text-muted">{r.hint}</p>
          </div>
        ))}
      </div>

      {short && (
        <p className="mt-4 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-[11px] text-bad">
          El soporte vital está por debajo del mínimo: la tripulación perderá oxígeno.
        </p>
      )}
      {total > budget && (
        <p className="mt-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-warn">
          Has pedido más energía de la que existe: el sistema recortará todo proporcionalmente.
        </p>
      )}
    </section>
  );
}
