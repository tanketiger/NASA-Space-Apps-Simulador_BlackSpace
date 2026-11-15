"use client";

import { useEffect, useState } from "react";
import type { Camera, GameState } from "@/lib/game/engine";
import type { SolDefinition } from "@/lib/game/sols";

const TABS: { id: Camera; icon: string; label: string }[] = [
  { id: 1, icon: "🏜️", label: "CAM 01 · HORIZONTE" },
  { id: 2, icon: "🔋", label: "CAM 02 · PANELES" },
  { id: 3, icon: "☀️", label: "CAM 03 · ÓRBITA" },
  { id: 4, icon: "🌱", label: "CAM 04 · INVERNADERO" },
];

export default function CameraTablet({
  state,
  sol,
  onSetCamera,
  onPumpDown,
  onPumpUp,
}: {
  state: GameState;
  sol: SolDefinition;
  onSetCamera: (c: Camera) => void;
  onPumpDown: () => void;
  onPumpUp: () => void;
}) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 180);
    return () => window.clearTimeout(id);
  }, [state.camera]);

  return (
    <div className="cam-tablet-overlay" role="dialog" aria-modal="true" aria-label="Monitor de cámaras">
      <div className="cam-tablet">
        <div className="cam-screen">
          <div className="cam-rec"><span className="dot" aria-hidden="true" />REC</div>
          <div className="cam-label mono">{TABS.find((t) => t.id === state.camera)?.label}</div>
          <div className="cam-scene">
            {state.camera === 1 && <CamHorizonte state={state} />}
            {state.camera === 2 && <CamPaneles state={state} />}
            {state.camera === 3 && <CamOrbita state={state} sol={sol} />}
            {state.camera === 4 && (
              <CamInvernadero state={state} onPumpDown={onPumpDown} onPumpUp={onPumpUp} />
            )}
          </div>
          <div className="cam-scanlines" aria-hidden="true" />
          <div className={`cam-static ${flash ? "show" : ""}`} aria-hidden="true" />
        </div>
        <div className="cam-selector">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`cam-tab ${state.camera === tab.id ? "active" : ""}`}
              onClick={() => onSetCamera(tab.id)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label mono">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CamHorizonte({ state }: { state: GameState }) {
  const visible = state.dustPhase === "far" || state.dustPhase === "idle";
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div className="far-road" />
      {state.dustPhase !== "idle" && visible && (
        <span className="dust-devil" style={{ left: "50%", bottom: "30%", transform: "scale(1.4)" }} />
      )}
      {!visible && state.dustPhase !== "retreated" && state.dustPhase !== "hit" && (
        <p className="mono" style={{ position: "absolute", bottom: 18, left: 18, color: "#64748b", fontSize: 12 }}>
          SIN RASTRO EN ESTA CÁMARA
        </p>
      )}
    </div>
  );
}

function CamPaneles({ state }: { state: GameState }) {
  const showing = state.dustPhase === "approaching";
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div className="far-road" />
      <svg width="140" height="90" viewBox="0 0 140 90" style={{ position: "absolute", left: "50%", top: "35%", transform: "translate(-50%,-50%)" }}>
        <rect x="10" y="30" width="120" height="50" rx="6" fill="#1f6e6a" stroke="#090D16" strokeWidth="4" />
        <line x1="50" y1="30" x2="50" y2="80" stroke="#090D16" strokeWidth="3" />
        <line x1="90" y1="30" x2="90" y2="80" stroke="#090D16" strokeWidth="3" />
      </svg>
      {showing && <span className="dust-devil" style={{ left: "28%", bottom: "32%", transform: "scale(1.1)" }} />}
      {!showing && (
        <p className="mono" style={{ position: "absolute", bottom: 18, left: 18, color: "#64748b", fontSize: 12 }}>
          PANELES EN BUEN ESTADO
        </p>
      )}
    </div>
  );
}

function CamOrbita({ state, sol }: { state: GameState; sol: SolDefinition }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#060a18" }}>
      <div
        className="flare-glow"
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: `translate(-50%,-50%) scale(${0.5 + state.flareLevel * 0.25})`,
        }}
      />
      <p className="mono" style={{ position: "absolute", top: 14, left: 14, color: "#fde68a", fontSize: 12 }}>
        NIVEL DE LLAMARADA: {state.flareLevel}/3
      </p>
      <div className="history-chip mono">
        REGISTRO HISTÓRICO REAL · NASA DONKI
        <br />
        {sol.historicalEvent.activityID}
      </div>
    </div>
  );
}

function CamInvernadero({
  state,
  onPumpDown,
  onPumpUp,
}: {
  state: GameState;
  onPumpDown: () => void;
  onPumpUp: () => void;
}) {
  const wilted = state.oxygen < 40;
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#0c3d2c,#082117)" }}>
      <div style={{ position: "absolute", top: 14, left: 14, color: "#86efac", fontWeight: 700 }} className="mono">
        OXÍGENO: {Math.ceil(state.oxygen)}%
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, paddingBottom: 60 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ fontSize: 46, filter: wilted ? "grayscale(0.6) brightness(0.7)" : "none", transform: wilted ? "rotate(-8deg)" : "none" }} aria-hidden="true">
            🌿
          </span>
        ))}
      </div>
      <button
        className={`cam-pump-btn ${state.pumping ? "pumping" : ""}`}
        onPointerDown={onPumpDown}
        onPointerUp={onPumpUp}
        onPointerLeave={onPumpUp}
      >
        <span aria-hidden="true">💧</span> MANTÉN PRESIONADO PARA BOMBEAR
      </button>
    </div>
  );
}
