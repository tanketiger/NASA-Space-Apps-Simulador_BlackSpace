"use client";

import type { GameState } from "@/lib/game/engine";
import { clockLabel } from "@/lib/game/engine";

const DUST_VISIBLE = new Set(["far", "approaching", "window", "hit"]);

export default function CockpitScene({
  state,
  pan,
  onToggleGate,
  onLightDown,
  onLightUp,
  onToggleSound,
  onHelp,
  onPause,
  soundOn,
}: {
  state: GameState;
  pan: number;
  onToggleGate: (side: "left" | "right") => void;
  onLightDown: (side: "left" | "right") => void;
  onLightUp: (side: "left" | "right") => void;
  onToggleSound: () => void;
  onHelp: () => void;
  onPause: () => void;
  soundOn: boolean;
}) {
  const dustShown = DUST_VISIBLE.has(state.dustPhase);
  const flareFlashing = state.flareLevel === 3 && !state.flareResolved;

  return (
    <>
      {/* Capa 0: exterior con paneo de cabeza */}
      <div className="exterior-pan" style={{ transform: `translateX(${pan}px)` }} aria-hidden="true">
        <div className="sky" />
        <span className="moon phobos" />
        <span className="moon deimos" />
        <div className="mountains">
          <svg viewBox="0 0 1200 220" preserveAspectRatio="none">
            <polygon points="0,220 0,140 150,60 320,150 480,40 650,140 820,70 980,160 1120,80 1200,150 1200,220" fill="#7a3c28" stroke="#090D16" strokeWidth="6" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="ground" />
        <div className="far-panels left-group">
          <span className="far-panel" />
          <span className="far-panel" />
        </div>
        <div className="far-panels right-group">
          <span className="far-panel" />
        </div>
        {dustShown && <span className="dust-devil" style={{ left: "38%" }} />}
        {flareFlashing && <span className="dust-devil" style={{ left: "70%", opacity: 0.0 }} aria-hidden="true" />}
      </div>

      {/* Capa 1: amenazas visibles y vidrio oscuro de las ventanas */}
      <div className="window-threats">
        <div className={`threat-left ${state.lightLeft ? "lit" : ""}`}>
          <span className={`storm-cloud ${state.dustPhase}`} />
        </div>
        <div className={`threat-right ${state.lightRight ? "lit" : ""}`}>
          <span className={`flare-glow level-${state.flareLevel}`} />
        </div>
      </div>
      <div className={`window-glass-left ${state.lightLeft ? "lit" : ""}`} />
      <div className={`window-glass-right ${state.lightRight ? "lit" : ""}`} />
      <div className={`window-tint-center ${flareFlashing ? "flare-active" : ""}`} />

      {/* Capa 2: compuertas */}
      <div className={`gate left ${state.gateLeft ? "closed" : ""}`}>
        <div className="gate-face" />
      </div>
      <div className={`gate right ${state.gateRight ? "closed" : ""}`}>
        <div className="gate-face" />
      </div>

      {/* Marco decorativo de las ventanas: va sobre los muros y las compuertas. */}
      <div className="window-rim-left" />
      <div className="window-rim-right" />
      <div className="window-rim-center" />

      {/* Capa 3: marco de cabina, alarmas y botones */}
      <div className="cabin-frame">
        <div className="cabin-side left">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rivet" style={{ top: `${10 + i * 15}%`, left: "12%" }} />
          ))}
        </div>
        <div className="cabin-side right">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rivet" style={{ top: `${10 + i * 15}%`, right: "12%" }} />
          ))}
        </div>
        <div className="alarm-strip">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`alarm-light ${state.dustPhase === "window" || flareFlashing ? "on" : ""}`} />
          ))}
        </div>
      </div>

      <div className="control-panel left" aria-label="Controles izquierdos">
        <button
          className={`arcade-btn gate-btn ${state.gateLeft ? "active" : ""}`}
          onClick={() => onToggleGate("left")}
          disabled={state.phase !== "playing"}
          aria-pressed={state.gateLeft}
        >
          <span className="btn-icon" aria-hidden="true">{state.gateLeft ? "🔒" : "🔓"}</span>
          <span className="btn-label">COMPUERTA IZQ</span>
        </button>
        <button
          className={`arcade-btn light-btn ${state.lightLeft ? "active" : ""}`}
          onPointerDown={() => onLightDown("left")}
          onPointerUp={() => onLightUp("left")}
          onPointerLeave={() => onLightUp("left")}
          disabled={state.phase !== "playing"}
        >
          <span className="btn-icon" aria-hidden="true">💡</span>
          <span className="btn-label">LUZ IZQ</span>
        </button>
      </div>

      <div className="control-panel right" aria-label="Controles derechos">
        <button
          className={`arcade-btn gate-btn ${state.gateRight ? "active" : ""}`}
          onClick={() => onToggleGate("right")}
          disabled={state.phase !== "playing"}
          aria-pressed={state.gateRight}
        >
          <span className="btn-icon" aria-hidden="true">{state.gateRight ? "🔒" : "🔓"}</span>
          <span className="btn-label">COMPUERTA DER</span>
        </button>
        <button
          className={`arcade-btn light-btn ${state.lightRight ? "active" : ""}`}
          onPointerDown={() => onLightDown("right")}
          onPointerUp={() => onLightUp("right")}
          onPointerLeave={() => onLightUp("right")}
          disabled={state.phase !== "playing"}
        >
          <span className="btn-icon" aria-hidden="true">💡</span>
          <span className="btn-label">LUZ DER</span>
        </button>
      </div>

      {/* HUD superior */}
      <div className="hud-top">
        <div className="hud-clock mono">
          {clockLabel(state.elapsed)}
          <small>SOL EN CURSO</small>
        </div>
        <div className="hud-icons">
          <button className="icon-btn" onClick={onToggleSound} aria-label={soundOn ? "Silenciar" : "Activar sonido"}>
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button className="icon-btn" onClick={onHelp} aria-label="Cómo jugar">❓</button>
          {state.phase === "playing" && (
            <button className="icon-btn" onClick={onPause} aria-label="Pausar">⏸️</button>
          )}
        </div>
      </div>
    </>
  );
}
