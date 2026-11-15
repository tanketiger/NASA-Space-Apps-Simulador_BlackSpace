"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraTablet from "./CameraTablet";
import CockpitScene from "./CockpitScene";
import DeskConsole from "./DeskConsole";
import GameOverScreen from "./GameOverScreen";
import "./game.css";
import {
  boopRover,
  initialState,
  setCamera,
  setLight,
  setPumping,
  startPlaying,
  tick,
  toggleGate,
  toggleMonitor,
  type Camera,
  type GameState,
} from "@/lib/game/engine";
import { GameSound } from "@/lib/game/sound";
import { SOLS, solByIndex } from "@/lib/game/sols";

type UiMode = "idle" | "help" | "paused";

export default function AuroraGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [solIndex, setSolIndex] = useState(0);
  const [mode, setMode] = useState<UiMode>("idle");
  const [pan, setPan] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const sound = useRef<GameSound | null>(null);
  const prev = useRef(state);
  const sol = solByIndex(solIndex);

  if (!sound.current && typeof window !== "undefined") sound.current = new GameSound();
  useEffect(() => {
    if (sound.current) sound.current.enabled = soundOn;
  }, [soundOn]);

  // Reloj del turno: 1 tick de motor por segundo real, solo mientras se juega.
  useEffect(() => {
    if ((state.phase !== "playing" && state.phase !== "blackout") || mode !== "idle") return;
    const id = window.setInterval(() => {
      setState((s) => tick(s, sol.rules));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.phase, mode, sol]);

  // Sonidos para eventos que dispara el motor por sí solo (no un clic directo).
  useEffect(() => {
    const p = prev.current;
    const s = state;
    const snd = sound.current;
    if (snd) {
      if (s.dustPhase === "hit" && p.dustPhase !== "hit") snd.dustHit();
      if (s.dustPhase === "window" && p.dustPhase !== "window") snd.alarm();
      if (s.flareLevel === 3 && p.flareLevel !== 3) snd.flareFlash();
      if (s.lossReason === "flare" && p.lossReason !== "flare") snd.flareHit();
      if (s.phase === "blackout" && p.phase !== "blackout") snd.blackout();
      if (s.phase === "won" && p.phase !== "won") snd.win();
      if (s.phase === "lost" && p.phase !== "lost") snd.lose();
      if (s.pumping && !p.pumping) snd.oxygenPump();
    }
    prev.current = state;
  }, [state]);

  // Paneo de cabeza según la posición del puntero.
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ratio = e.clientX / window.innerWidth - 0.5;
    setPan(-ratio * 140);
  }, []);

  function playButtonSound() { sound.current?.button(); }

  function handleStart() {
    playButtonSound();
    setMode("idle");
    setState(startPlaying(initialState()));
  }

  function handleRetry() {
    playButtonSound();
    setState(startPlaying(initialState()));
  }

  function handleNextSol() {
    playButtonSound();
    setSolIndex((i) => Math.min(SOLS.length - 1, i + 1));
    setState(startPlaying(initialState()));
  }

  function handleToggleGate(side: "left" | "right") {
    sound.current?.gateClunk();
    setState((s) => toggleGate(s, side));
  }
  function handleLightDown(side: "left" | "right") {
    sound.current?.lightClick();
    setState((s) => setLight(s, side, true));
  }
  function handleLightUp(side: "left" | "right") {
    setState((s) => setLight(s, side, false));
  }
  function handleToggleMonitor() {
    sound.current?.cameraSwitch();
    setState((s) => toggleMonitor(s));
  }
  function handleSetCamera(cam: Camera) {
    sound.current?.cameraSwitch();
    setState((s) => setCamera(s, cam));
  }
  function handlePumpDown() {
    setState((s) => setPumping(s, true));
  }
  function handlePumpUp() {
    setState((s) => setPumping(s, false));
  }
  function handleBoopRover() {
    sound.current?.boop();
    setState((s) => boopRover(s));
  }
  function handlePause() {
    playButtonSound();
    setMode("paused");
  }
  function handleResume() {
    playButtonSound();
    setMode("idle");
  }
  function handleHelp() {
    playButtonSound();
    setMode("help");
  }
  function handleCloseHelp() {
    playButtonSound();
    setMode("idle");
  }

  const showOverlay = state.phase === "ready" || state.phase === "won" || state.phase === "lost" || mode !== "idle";

  return (
    <div className="game-root" onPointerMove={handlePointerMove}>
      <CockpitScene
        state={state}
        pan={pan}
        onToggleGate={handleToggleGate}
        onLightDown={handleLightDown}
        onLightUp={handleLightUp}
        onToggleSound={() => setSoundOn((v) => !v)}
        onHelp={handleHelp}
        onPause={handlePause}
        soundOn={soundOn}
      />
      <DeskConsole state={state} onOpenMonitor={handleToggleMonitor} onBoopRover={handleBoopRover} />
      {state.monitorOpen && state.phase === "playing" && (
        <CameraTablet
          state={state}
          sol={sol}
          onSetCamera={handleSetCamera}
          onPumpDown={handlePumpDown}
          onPumpUp={handlePumpUp}
        />
      )}
      {state.phase === "blackout" && (
        <div className="blackout-fade" aria-hidden="true">
          <span className="blackout-text mono">SIN ENERGÍA…</span>
        </div>
      )}
      {showOverlay && (
        <GameOverScreen
          state={state}
          sol={sol}
          mode={mode === "idle" ? "ready" : mode}
          onStart={handleStart}
          onRetry={handleRetry}
          onResume={handleResume}
          onNextSol={handleNextSol}
          onHelp={handleHelp}
          onCloseHelp={handleCloseHelp}
          hasNextSol={solIndex < SOLS.length - 1}
        />
      )}
    </div>
  );
}
