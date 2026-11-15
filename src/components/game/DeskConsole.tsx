"use client";

import { useState } from "react";
import { usageBars, type GameState } from "@/lib/game/engine";

export default function DeskConsole({
  state,
  onOpenMonitor,
  onBoopRover,
}: {
  state: GameState;
  onOpenMonitor: () => void;
  onBoopRover: () => void;
}) {
  const [boop, setBoop] = useState(false);
  const bars = usageBars(state);
  const fanStopped = state.phase === "blackout" || state.battery <= 0;

  function handleBoop() {
    onBoopRover();
    setBoop(true);
    window.setTimeout(() => setBoop(false), 400);
  }

  return (
    <>
      <div className="open-cams-bar">
        <button
          onClick={onOpenMonitor}
          className={state.monitorOpen ? "open" : ""}
          disabled={state.phase !== "playing"}
          aria-pressed={state.monitorOpen}
        >
          <span aria-hidden="true">{state.monitorOpen ? "▼" : "▲"}</span>
          {state.monitorOpen ? "BAJAR CÁMARAS" : "ABRIR CÁMARAS"}
          <span aria-hidden="true">📷</span>
        </button>
      </div>

      <div className="desk-wrap">
        <div className="desk-curve">
          <div className="crt-monitor mono">
            <div className="crt-title">PANEL DE LA BASE</div>
            <div className="crt-row"><span>BATERÍA</span><span>{Math.ceil(state.battery)}%</span></div>
            <div className="crt-row"><span>USO</span><span>{bars}/5</span></div>
            <div className="usage-row" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`usage-bar ${n <= bars ? "on" : ""} b${n}`} />
              ))}
            </div>
            <div className="crt-row"><span>OXÍGENO</span><span>{Math.ceil(state.oxygen)}%</span></div>
          </div>

          <div className="fan-unit" aria-hidden="true">
            <svg className={`fan-blades ${fanStopped ? "stopped" : ""}`} viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="6" fill="#090D16" />
              {[0, 90, 180, 270].map((deg) => (
                <ellipse key={deg} cx="32" cy="14" rx="7" ry="16" fill="#cbd5e1" stroke="#090D16" strokeWidth="3" transform={`rotate(${deg} 32 32)`} />
              ))}
            </svg>
          </div>

          <button className="rover-toy-btn" onClick={handleBoop} aria-label="Mini rover de juguete" style={{ background: "none", border: "none", padding: 0 }}>
            <svg className={`rover-toy ${boop ? "boop" : ""}`} viewBox="0 0 100 70">
              <ellipse cx="50" cy="58" rx="42" ry="8" fill="#00000030" />
              <rect x="18" y="26" width="64" height="26" rx="8" fill="#e2e8f0" stroke="#090D16" strokeWidth="4" />
              <circle cx="30" cy="54" r="10" fill="#334155" stroke="#090D16" strokeWidth="4" />
              <circle cx="70" cy="54" r="10" fill="#334155" stroke="#090D16" strokeWidth="4" />
              <rect x="34" y="10" width="32" height="18" rx="6" fill="#38bdf8" stroke="#090D16" strokeWidth="4" />
              <circle cx="50" cy="6" r="4" fill="#facc15" stroke="#090D16" strokeWidth="3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
