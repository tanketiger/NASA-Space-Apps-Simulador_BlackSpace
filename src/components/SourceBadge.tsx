import type { DataKind } from "@/lib/sim/types";

const MAP: Record<DataKind, { label: string; color: string; bg: string; dot: string }> = {
  live: { label: "Datos reales en vivo", color: "#79dc8d", bg: "rgba(121,220,141,0.1)", dot: "●" },
  archive: { label: "Archivo real", color: "#6fa8ff", bg: "rgba(111,168,255,0.1)", dot: "◆" },
  historical: { label: "Histórico real", color: "#e8a15c", bg: "rgba(232,161,92,0.1)", dot: "◇" },
  reference: { label: "Dato de referencia", color: "#b9c0cf", bg: "rgba(185,192,207,0.08)", dot: "○" },
  simulated: { label: "Modelo del juego", color: "#ef6b6b", bg: "rgba(239,107,107,0.1)", dot: "▲" },
};

export default function SourceBadge({
  kind,
  text,
  className = "",
}: {
  kind: DataKind;
  text?: string;
  className?: string;
}) {
  const m = MAP[kind];
  return (
    <span
      className={`chip ${className}`}
      style={{ color: m.color, borderColor: `${m.color}44`, background: m.bg }}
      title={m.label}
    >
      <span aria-hidden>{m.dot}</span>
      {text ?? m.label}
    </span>
  );
}
