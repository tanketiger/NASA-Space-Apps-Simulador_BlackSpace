"use client";

import type { GameState, LossReason } from "@/lib/game/engine";
import type { SolDefinition } from "@/lib/game/sols";

const LOSS_COPY: Record<Exclude<LossReason, null>, { title: string; tip: string; icon: string }> = {
  dust: {
    title: "¡LA TORMENTA GOLPEÓ POR LA IZQUIERDA!",
    tip: "Usa CAM 01 o la LUZ IZQ para verla llegar, y cierra la COMPUERTA IZQ antes de que toque la ventana.",
    icon: "🌪️",
  },
  flare: {
    title: "¡LA LLAMARADA GOLPEÓ POR LA DERECHA!",
    tip: "Vigila CAM 03: cuando el nivel llegue a 3, cierra la COMPUERTA DER mientras dura el destello.",
    icon: "☀️",
  },
  oxygen: {
    title: "¡SE ACABÓ EL OXÍGENO!",
    tip: "Abre CAM 04 y mantén presionado el botón de bombeo para recargar el invernadero a tiempo.",
    icon: "🌱",
  },
  battery: {
    title: "¡SE ACABÓ LA BATERÍA!",
    tip: "Usa las compuertas, las luces y el monitor solo cuando los necesites: cada uno gasta energía.",
    icon: "🔋",
  },
};

const CONFETTI_COLORS = ["#38bdf8", "#facc15", "#4ade80", "#f87171", "#fb923c"];

export default function GameOverScreen({
  state,
  sol,
  mode,
  onStart,
  onRetry,
  onResume,
  onNextSol,
  onHelp,
  onCloseHelp,
  hasNextSol,
}: {
  state: GameState;
  sol: SolDefinition;
  mode: "ready" | "paused" | "help";
  onStart: () => void;
  onRetry: () => void;
  onResume: () => void;
  onNextSol: () => void;
  onHelp: () => void;
  onCloseHelp: () => void;
  hasNextSol: boolean;
}) {
  if (state.phase === "won") {
    return (
      <div className="overlay-screen">
        <div className="overlay-card" style={{ position: "relative", overflow: "hidden" }}>
          <Confetti />
          <span className="win-icon" aria-hidden="true">🎉</span>
          <span className="overlay-badge">¡{sol.label} COMPLETADO!</span>
          <h1>¡Lo lograste!</h1>
          <p>Vigilaste las cámaras y cerraste las compuertas justo a tiempo. La base aguantó hasta las 06:00 AM.</p>
          <div className="result-row">
            <div className="result-chip mono"><span>BATERÍA</span><strong>{Math.ceil(state.battery)}%</strong></div>
            <div className="result-chip mono"><span>OXÍGENO</span><strong>{Math.ceil(state.oxygen)}%</strong></div>
          </div>
          {hasNextSol ? (
            <button className="big-cta" onClick={onNextSol}>SIGUIENTE SOL ➡️</button>
          ) : (
            <button className="big-cta" onClick={onRetry}>JUGAR DE NUEVO 🔁</button>
          )}
        </div>
      </div>
    );
  }

  if (state.phase === "lost" && state.lossReason) {
    const copy = LOSS_COPY[state.lossReason];
    return (
      <div className="overlay-screen">
        <div className="overlay-card shake-once">
          <span className="loss-icon" aria-hidden="true">{copy.icon}</span>
          <span className="overlay-badge" style={{ borderColor: "#f87171", color: "#f87171" }}>
            {sol.label} · NO LO LOGRASTE
          </span>
          <h1 style={{ color: "#fca5a5" }}>{copy.title}</h1>
          <p>{copy.tip}</p>
          <button className="big-cta" style={{ background: "linear-gradient(180deg,#f87171,#dc2626)", color: "#3a0a0a" }} onClick={onRetry}>
            REINTENTAR {sol.label} 🔁
          </button>
        </div>
      </div>
    );
  }

  if (mode === "help") {
    return (
      <div className="overlay-screen">
        <div className="overlay-card">
          <span className="win-icon" aria-hidden="true">❓</span>
          <h1>¿Cómo se juega?</h1>
          <div className="steps-row">
            <span className="step-chip"><span className="step-icon">📷</span>Revisa las cámaras</span>
            <span className="step-chip"><span className="step-icon">💡</span>Enciende las luces</span>
            <span className="step-chip"><span className="step-icon">🔒</span>Cierra la compuerta a tiempo</span>
            <span className="step-chip"><span className="step-icon">💧</span>Bombea oxígeno</span>
          </div>
          <p>
            Sobrevive hasta las <strong>06:00 AM</strong>. Una tormenta se acerca por la izquierda y una llamarada
            solar por la derecha: ciérralas justo a tiempo. No dejes todo encendido: cada sistema gasta batería.
          </p>
          <p style={{ fontSize: 11, color: "#64748b" }}>
            Juego de ficción con una imagen histórica real de NASA DONKI como referencia. No predice el clima de Marte.
          </p>
          <button className="big-cta" onClick={onCloseHelp}>ENTENDIDO 👍</button>
        </div>
      </div>
    );
  }

  if (mode === "paused") {
    return (
      <div className="overlay-screen">
        <div className="overlay-card">
          <span className="win-icon" aria-hidden="true">⏸️</span>
          <h1>Turno en pausa</h1>
          <p>La base espera tus órdenes.</p>
          <button className="big-cta" onClick={onResume}>CONTINUAR ▶️</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-screen">
      <div className="overlay-card">
        <span className="sol-chip">{sol.label} · {sol.difficulty}</span>
        <span className="win-icon" aria-hidden="true">🚀</span>
        <h1>Aurora Outpost</h1>
        <p>Tu primer turno de vigilancia en Marte. Dura solo 60 segundos reales: de 12:00 AM a 06:00 AM.</p>
        <div className="steps-row">
          <span className="step-chip"><span className="step-icon">📷</span>Cámaras</span>
          <span className="step-chip"><span className="step-icon">🔒</span>Compuertas</span>
          <span className="step-chip"><span className="step-icon">🔋</span>Batería</span>
        </div>
        <button className="big-cta" onClick={onStart}>COMENZAR TURNO 🚀</button>
        <button className="mini-link" onClick={onHelp}>¿Cómo se juega?</button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 36 }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.6 + Math.random() * 1.2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 60 - 30,
  }));
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
