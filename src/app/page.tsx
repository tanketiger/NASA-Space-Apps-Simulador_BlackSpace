"use client";

import { useEffect, useRef, useState } from "react";
import { GameSound } from "@/lib/game/sound";
import { SOLS } from "@/lib/game/sols";
import type { SolRules } from "@/lib/game/engine";

// ─────────────────────────────────────────────────────────────────────────────
// Aurora Outpost · turno de supervivencia en primera persona (60 s)
//
// El fondo es /images/cabina.jpg. Todas las capas se colocan en % DENTRO de un
// "escenario" que conserva la proporción real de la imagen (2752x1536) y la
// cubre a pantalla completa: así un `left: 27.3%` cae siempre sobre el mismo
// punto dibujado, sin importar el tamaño de la ventana.
//
// Aviso: SOL, reloj, tormenta, llamarada, consumo, compuertas, luces, cámaras,
// oxígeno, EVA y el rover son reglas de diseño del juego, NO datos de la NASA.
// El único dato real es `historicalEvent` (ver src/data/mars_sols.json).
// ─────────────────────────────────────────────────────────────────────────────

const IMG_RATIO = 2752 / 1536; // proporción real de cabina.jpg (16:9)
const SOL_SECONDS = 60; // 1 Sol = 60 s reales
const HOUR_SECONDS = 10; // 1 hora del turno = 10 s reales

const HAZARD = "repeating-linear-gradient(45deg, #facc15 0 16px, #0b0f1a 16px 32px)";

// 3 pestañas CCTV. El mapeo a archivos es una suposición: cámbialo si quieres
// otra vista en cada pestaña.
const CAMS = [
  { id: 1, label: "CAM 01 · RADAR", file: "/images/cam01.png" },
  { id: 2, label: "CAM 02 · PANELES SOLARES", file: "/images/exterior_paneles.png" },
  { id: 3, label: "CAM 03 · INVERNADERO", file: "/images/cam04.png" },
];

type Phase = "playing" | "won" | "lost";
type LossReason = "battery" | "oxygen" | "integrity" | null;

interface GameState {
  phase: Phase;
  elapsed: number; // 0..60 segundos del Sol
  battery: number; // 0..100
  oxygen: number; // 0..100
  integrity: number; // 0..100
  panelDust: number; // 0..100 polvo de los paneles solares
  shield: boolean; // compuerta central blindada bajada
  lightUntil: number; // elapsed hasta el que la luz exterior está encendida
  camsOpen: boolean; // tablet CCTV abierta
  evaUntil: number; // elapsed hasta el que dura la salida EVA
  evaDone: boolean; // logro: limpió paneles
  booped: boolean; // logro: hizo boop al rover
  pumped: boolean; // logro: usó la bomba de O2
  lossReason: LossReason;
}

function initialGame(): GameState {
  return {
    phase: "playing",
    elapsed: 0,
    battery: 100,
    oxygen: 100,
    integrity: 100,
    panelDust: 0,
    shield: false,
    lightUntil: 0,
    camsOpen: false,
    evaUntil: 0,
    evaDone: false,
    booped: false,
    pumped: false,
    lossReason: null,
  };
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

function clockLabel(elapsed: number) {
  const hour = Math.min(6, Math.floor(elapsed / HOUR_SECONDS));
  return hour <= 0 ? "12:00 AM" : `0${hour}:00 AM`;
}

/** Un paso de simulación (1 segundo real). */
function tick(s: GameState, rules: SolRules): GameState {
  if (s.phase !== "playing") return s;

  const t = s.elapsed + 1;
  const next: GameState = { ...s, elapsed: t };

  const stormStart = rules.dustStart;
  const stormEnd = rules.dustAtWindow;
  const flareStart = rules.flareLevel2;
  const flareEnd = rules.flareCritical;

  const lightOn = t < next.lightUntil;

  // Batería: -0.4 %/s con la base apagada, hasta -1.2 %/s con 3 sistemas activos
  // (escudo + luz + cámaras). El polvo de los paneles añade un extra pequeño.
  const activeSystems = (next.shield ? 1 : 0) + (lightOn ? 1 : 0) + (next.camsOpen ? 1 : 0);
  const systemsDrain = 0.4 + 0.8 * (activeSystems / 3);
  const dustDrain = (next.panelDust / 100) * 0.5;
  next.battery = clamp(next.battery - (systemsDrain + dustDrain));

  // Oxígeno: -1 %/s constante.
  next.oxygen = clamp(next.oxygen - 1);

  // El polvo se acumula en los paneles solares (se limpia con la salida EVA).
  next.panelDust = clamp(next.panelDust + 0.6);

  // Integridad: golpes de eventos ambientales; el escudo los bloquea.
  const inStorm = t >= stormStart && t <= stormEnd;
  const inFlare = t >= flareStart && t <= flareEnd;
  if ((inStorm || inFlare) && !next.shield) next.integrity = clamp(next.integrity - 3);
  if ((t === stormStart || t === flareStart) && !next.shield) next.integrity = clamp(next.integrity - 10);

  // Derrotas.
  if (next.battery <= 0) {
    next.phase = "lost";
    next.lossReason = "battery";
  } else if (next.oxygen <= 0) {
    next.phase = "lost";
    next.lossReason = "oxygen";
  } else if (next.integrity <= 0) {
    next.phase = "lost";
    next.lossReason = "integrity";
  } else if (t >= SOL_SECONDS) {
    next.phase = "won";
  }

  return next;
}

export default function Page() {
  const [solIndex, setSolIndex] = useState(0);
  const sol = SOLS[Math.min(solIndex, SOLS.length - 1)];
  const rules = sol.rules;

  const [state, setState] = useState<GameState>(initialGame);
  const [cam, setCam] = useState(1);
  const [flash, setFlash] = useState(false);
  const [o2Pulse, setO2Pulse] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const sound = useRef<GameSound | null>(null);
  const prev = useRef<GameState>(state);

  if (!sound.current && typeof window !== "undefined") sound.current = new GameSound();
  useEffect(() => {
    if (sound.current) sound.current.enabled = soundOn;
  }, [soundOn]);

  const s = state;

  const stormStart = rules.dustStart;
  const stormEnd = rules.dustAtWindow;
  const flareStart = rules.flareLevel2;
  const flareEnd = rules.flareCritical;

  const lightOn = s.elapsed < s.lightUntil;
  const evaActive = s.phase === "playing" && s.elapsed < s.evaUntil;
  const inStorm = s.elapsed >= stormStart && s.elapsed <= stormEnd;
  const inFlare = s.elapsed >= flareStart && s.elapsed <= flareEnd;

  // Peligro activo (sirena) y peligro inminente (alerta del CRT, con 3 s de aviso).
  const danger = s.phase === "playing" && (inStorm || inFlare);
  const alert =
    s.phase === "playing" &&
    ((s.elapsed >= stormStart - 3 && s.elapsed <= stormEnd) ||
      (s.elapsed >= flareStart - 3 && s.elapsed <= flareEnd));

  // Reloj: 1 tick de motor por segundo real, solo mientras se juega.
  useEffect(() => {
    if (s.phase !== "playing") return;
    const id = window.setInterval(() => setState((p) => tick(p, rules)), 1000);
    return () => window.clearInterval(id);
  }, [s.phase, rules]);

  // Sonidos y logros que dispara el propio motor.
  useEffect(() => {
    const p = prev.current;
    const c = state;
    const snd = sound.current;
    if (snd) {
      if (p.elapsed < stormStart && c.elapsed >= stormStart) snd.dustHit();
      if (p.elapsed < flareStart && c.elapsed >= flareStart) snd.flareHit();
      if (c.phase === "won" && p.phase !== "won") snd.win();
      if (c.phase === "lost" && p.phase !== "lost") snd.lose();
    }
    prev.current = state;
  }, [state, stormStart, flareStart]);

  // ── Acciones de los switches ────────────────────────────────────────────────
  function toggleShield() {
    if (s.phase !== "playing") return;
    sound.current?.gateClunk();
    setState((p) => ({ ...p, shield: !p.shield }));
  }

  function useLight() {
    if (s.phase !== "playing") return;
    sound.current?.lightClick();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 350);
    setState((p) => ({ ...p, lightUntil: p.elapsed + 2 }));
  }

  function toggleCams() {
    if (s.phase !== "playing") return;
    sound.current?.cameraSwitch();
    setState((p) => ({ ...p, camsOpen: !p.camsOpen }));
  }

  function pumpO2() {
    if (s.phase !== "playing") return;
    sound.current?.oxygenPump();
    setO2Pulse(true);
    window.setTimeout(() => setO2Pulse(false), 500);
    setState((p) => ({ ...p, oxygen: clamp(p.oxygen + 25), battery: clamp(p.battery - 10), pumped: true }));
  }

  function doEva() {
    if (s.phase !== "playing" || evaActive) return;
    sound.current?.depressurize();
    setState((p) => ({ ...p, oxygen: clamp(p.oxygen - 15), panelDust: 0, evaUntil: p.elapsed + 5, evaDone: true }));
  }

  function boopRover() {
    sound.current?.boop();
    setBounce(true);
    window.setTimeout(() => setBounce(false), 450);
    setState((p) => ({ ...p, booped: true }));
  }

  function retry() {
    sound.current?.button();
    setState(initialGame());
    setCam(1);
  }

  function nextSol() {
    sound.current?.button();
    setSolIndex((i) => Math.min(SOLS.length - 1, i + 1));
    setState(initialGame());
    setCam(1);
  }

  const camData = CAMS.find((c) => c.id === cam) ?? CAMS[0];

  const achievements = [
    s.evaDone && "🧹 Paneles limpios (EVA)",
    s.pumped && "💨 Recarga de oxígeno",
    s.booped && "🤖 Boop al rover",
    s.integrity >= 99 && "🛡️ Escudo perfecto",
  ].filter(Boolean) as string[];

  return (
    <main
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Escenario con la proporción real de cabina.jpg, escalado para cubrir */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${IMG_RATIO}))`,
          height: `max(100vh, calc(100vw / ${IMG_RATIO}))`,
          containerType: "inline-size",
        }}
      >
        <img
          src="/images/cabina.jpg"
          alt="Cabina del puesto avanzado Aurora en Marte"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* ═══ VENTANAL CENTRAL "MARTE" ═══ */}
        <div
          className="absolute overflow-hidden"
          style={{ left: "39.4%", top: "18.6%", width: "31.1%", height: "28.9%" }}
          title="Ventanal MARTE"
        >
          {/* Destello breve al encender la luz */}
          {flash && <div className="absolute inset-0 bg-yellow-100/80" />}

          {/* Luz exterior encendida: revela si hay tormenta en el ventanal */}
          {!flash && lightOn && (
            <div className="absolute inset-0 bg-amber-200/25">
              {inStorm && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 70%, rgba(146,64,14,0.75) 0%, rgba(120,53,15,0.55) 45%, rgba(69,26,3,0.35) 100%)",
                  }}
                />
              )}
            </div>
          )}

          {/* Compuerta metálica blindada: baja cuando el escudo está activo */}
          <div
            className={`absolute inset-0 flex flex-col transition-transform duration-200 ease-out ${
              s.shield ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            <div className="h-[15%]" style={{ backgroundImage: HAZARD }} />
            <div className="relative grid flex-1 place-items-center border-y-4 border-slate-950 bg-gradient-to-b from-[#8d969d] via-[#6d767d] to-[#4a535a] shadow-[inset_0_0_28px_rgba(0,0,0,0.55),inset_0_6px_10px_rgba(255,255,255,0.12)]">
              <span className="text-[10px] font-black tracking-[0.35em] text-slate-900/55">ESCUDO</span>
              {[
                { left: "3%", top: "12%" },
                { right: "3%", top: "12%" },
                { left: "3%", bottom: "12%" },
                { right: "3%", bottom: "12%" },
              ].map((pos, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="absolute h-[9%] w-[1.4%] rounded-full bg-slate-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
                  style={pos}
                />
              ))}
            </div>
            <div className="h-[15%]" style={{ backgroundImage: HAZARD }} />
          </div>
        </div>

        {/* ═══ BARRAS DE VIDA · cada una dentro de su ranura dibujada ═══ */}
        <StatBar
          label="Batería"
          value={s.battery}
          className="bg-green-500"
          style={{ left: "27.3%", top: "17.4%", width: "7.6%", height: "5.1%" }}
        />
        <StatBar
          label="Oxígeno"
          value={s.oxygen}
          className="bg-orange-500"
          style={{ left: "27.3%", top: "26.5%", width: "7.6%", height: "5.5%" }}
        />
        <StatBar
          label="Integridad"
          value={s.integrity}
          className="bg-cyan-500"
          style={{ left: "27.3%", top: "35.5%", width: "7.6%", height: "5.1%" }}
        />

        {/* ═══ CRT DERECHO · pantalla encendida sobre el cristal dibujado ═══ */}
        <div
          className="absolute overflow-hidden rounded-[7%]"
          style={{
            left: "74.5%",
            top: "22.4%",
            width: "10.2%",
            height: "19.2%",
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(9,30,19,0.985) 0%, rgba(2,8,5,0.985) 78%)",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), inset 0 0 44px rgba(34,197,94,0.08)",
          }}
          title="Monitor CRT de telemetría"
        >
          {/* Scanlines del CRT */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0 1px, transparent 1px 3px)",
            }}
          />
          <div className="relative flex h-full flex-col items-start justify-between px-[6%] pb-[9%] pt-[6%] font-mono text-green-400">
            <div
              className="whitespace-nowrap tracking-[0.02em]"
              style={{ fontSize: "0.9cqw", textShadow: "0 0 6px rgba(74,222,128,0.85)" }}
            >
              {sol.label} / {clockLabel(s.elapsed)}
            </div>
            <div
              className={`whitespace-nowrap font-bold tracking-[0.04em] ${
                alert ? "animate-pulse text-red-400" : "text-green-400"
              }`}
              style={{
                fontSize: "1.1cqw",
                textShadow: alert ? "0 0 8px rgba(248,113,113,0.9)" : "0 0 7px rgba(74,222,128,0.85)",
              }}
            >
              {alert ? "¡ALERTA!" : "SISTEMAS OK"}
            </div>
          </div>
        </div>

        {/* Sirena: brillo rojo parpadeante cuando hay peligro activo */}
        <div
          aria-hidden="true"
          className={`absolute rounded-full ${danger ? "animate-pulse" : ""}`}
          style={{
            left: "75.3%",
            top: "3%",
            width: "9.2%",
            height: "15.5%",
            pointerEvents: "none",
            background: danger
              ? "radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(220,38,38,0.35) 45%, transparent 72%)"
              : "transparent",
            boxShadow: danger ? "0 0 34px #ef4444, 0 0 60px #dc2626" : "none",
          }}
        />

        {/* ═══ SWITCH ESCUDO (naranja) ═══ */}
        <SwitchZone
          label="Escudo"
          accent="#f97316"
          on={s.shield}
          style={{ left: "20%", top: "55.5%", width: "8%", height: "18.5%" }}
          onClick={toggleShield}
        />

        {/* ═══ SWITCH LUZ (amarillo) ═══ */}
        <SwitchZone
          label="Luz"
          accent="#facc15"
          on={lightOn}
          style={{ left: "29.9%", top: "52.8%", width: "5.4%", height: "16.5%" }}
          onClick={useLight}
        />

        {/* ═══ SWITCH CÁMARAS (azul) ═══ */}
        <SwitchZone
          label="Cámaras"
          accent="#3b82f6"
          on={s.camsOpen}
          style={{ left: "77.3%", top: "54.2%", width: "7%", height: "16%" }}
          onClick={toggleCams}
        />

        {/* ═══ SWITCH OXÍGENO (verde) ═══ */}
        <SwitchZone
          label="Oxígeno"
          accent="#22c55e"
          on={o2Pulse}
          style={{ left: "86.4%", top: "55.5%", width: "7.4%", height: "21%" }}
          onClick={pumpO2}
        />

        {/* ═══ EVA · PUERTA DE SALIDA IZQUIERDA ═══ */}
        <button
          type="button"
          onClick={doEva}
          disabled={s.phase !== "playing" || evaActive}
          title="Salir a paneles solares"
          aria-label="Salir a paneles solares"
          className="group absolute cursor-pointer rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
          style={{ left: "1.5%", top: "5.5%", width: "20%", height: "44%" }}
        >
          <span className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto w-[86%] rounded bg-black/75 px-1 py-0.5 text-center text-[9px] font-bold leading-tight text-cyan-200 opacity-0 transition-opacity group-hover:opacity-100">
            SALIR A PANELES SOLARES
          </span>
        </button>

        {/* ═══ ROVER BOOP! ═══ */}
        <button
          type="button"
          onClick={boopRover}
          title="BOOP!"
          aria-label="Boop al rover"
          className={`group absolute cursor-pointer rounded-full hover:bg-white/10 ${bounce ? "animate-bounce" : ""}`}
          style={{ left: "48.5%", top: "56.5%", width: "11%", height: "18.5%" }}
        >
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-yellow-200 opacity-0 transition-opacity group-hover:opacity-100">
            BOOP!
          </span>
        </button>
      </div>

      {/* ═══ TABLET CCTV (switch CÁMARAS arriba) ═══ */}
      {s.camsOpen && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setState((p) => ({ ...p, camsOpen: false }))}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between font-mono text-xs text-lime-300">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                REC · CCTV AURORA // {sol.label} · {clockLabel(s.elapsed)}
              </span>
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, camsOpen: false }))}
                className="cursor-pointer rounded border border-yellow-400/40 px-2 py-1 text-yellow-200 hover:border-yellow-300"
              >
                CERRAR ✕
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded border-2 border-slate-700 bg-black">
              <img src={camData.file} alt={camData.label} className="h-full w-full object-cover" />
              {/* Polvo sobre los paneles solares (CAM 02) */}
              {cam === 2 && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: s.panelDust / 100,
                    background:
                      "radial-gradient(circle at 50% 60%, rgba(180,120,60,0.85) 0%, rgba(120,80,40,0.6) 60%, rgba(80,50,25,0.4) 100%)",
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 4px)",
                }}
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-xs text-lime-200">
                {camData.label}
              </div>
              {cam === 2 && (
                <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-amber-200">
                  POLVO EN PANELES: {Math.round(s.panelDust)}%
                </div>
              )}
              {cam === 1 && (
                <div className="absolute bottom-2 right-2 max-w-[60%] rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-sky-200">
                  NASA DONKI · {sol.historicalEvent.activityID}
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {CAMS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCam(c.id);
                    sound.current?.cameraSwitch();
                  }}
                  className={`cursor-pointer rounded border px-2 py-2 font-mono text-[10px] ${
                    cam === c.id
                      ? "border-yellow-300 bg-yellow-300/10 text-yellow-200"
                      : "border-slate-600 text-slate-300 hover:border-yellow-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MISIÓN EVA (pantalla negra momentánea) ═══ */}
      {evaActive && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black">
          <div className="text-center font-mono text-cyan-300">
            <div className="animate-pulse text-lg font-black sm:text-2xl">
              Limpiando paneles en el exterior (Misión EVA)
            </div>
            <div className="mt-3 text-sm text-cyan-200/80">
              Oxígeno -15% · Polvo de paneles → 0% · vuelves en {Math.max(0, Math.ceil(s.evaUntil - s.elapsed))} s
            </div>
          </div>
        </div>
      )}

      {/* ═══ FIN DEL TURNO ═══ */}
      {s.phase !== "playing" && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border-4 border-slate-900 bg-slate-800 p-6 text-center text-slate-100 shadow-2xl">
            {s.phase === "won" ? (
              <>
                <div className="text-5xl">🎉</div>
                <h1 className="mt-2 text-2xl font-black text-lime-400">¡SOL SUPERADO!</h1>
                <p className="mt-2 text-sm text-slate-300">
                  {sol.label} completado a las 06:00 AM. Batería {Math.round(s.battery)}% · Oxígeno{" "}
                  {Math.round(s.oxygen)}% · Integridad {Math.round(s.integrity)}%.
                </p>
                {achievements.length > 0 && (
                  <ul className="mt-3 space-y-1 text-left text-xs text-amber-200">
                    {achievements.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
                {solIndex < SOLS.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextSol}
                    className="mt-5 cursor-pointer rounded-lg bg-lime-500 px-6 py-3 font-black text-slate-900 hover:bg-lime-400"
                  >
                    CARGAR SIGUIENTE SOL ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-5 cursor-pointer rounded-lg bg-lime-500 px-6 py-3 font-black text-slate-900 hover:bg-lime-400"
                  >
                    JUGAR DE NUEVO ↻
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl">
                  {s.lossReason === "battery" ? "🔋" : s.lossReason === "oxygen" ? "🫁" : "☄️"}
                </div>
                <h1 className="mt-2 text-2xl font-black text-red-400">¡SISTEMAS INHABILITADOS!</h1>
                <p className="mt-2 text-sm text-slate-300">
                  {s.lossReason === "battery"
                    ? "Se acabó la batería. Cada switch encendido gasta energía: úsalos solo cuando haga falta."
                    : s.lossReason === "oxygen"
                    ? "Se acabó el oxígeno. Pulsa el switch OXÍGENO para recargar (+25%, cuesta 10% de batería)."
                    : "La integridad llegó a 0%. Sube el switch ESCUDO cuando el CRT marque ¡ALERTA!."}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-5 cursor-pointer rounded-lg bg-red-500 px-6 py-3 font-black text-white hover:bg-red-400"
                >
                  REINTENTAR {sol.label} ↻
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

/** Barra de estado encajada en su ranura dibujada. Se vacía de izquierda a derecha. */
function StatBar({
  label,
  value,
  className,
  style,
}: {
  label: string;
  value: number;
  className: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="absolute rounded-sm bg-black/50 p-[2px]"
      style={style}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full w-full overflow-hidden rounded-[2px] bg-black/60">
        <div
          className={`relative h-full ${className} transition-[width] duration-500 ease-linear`}
          style={{ width: `${clamp(value)}%`, boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.35)" }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0) 60%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Área clicable transparente sobre un switch dibujado, con LED indicador. */
function SwitchZone({
  label,
  accent,
  on,
  style,
  onClick,
}: {
  label: string;
  accent: string;
  on: boolean;
  style: React.CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className="group absolute cursor-pointer rounded-lg hover:bg-white/10"
      style={style}
    >
      {/* Halo suave sobre el switch dibujado cuando está encendido */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-200"
        style={{
          background: on
            ? `radial-gradient(circle at 50% 58%, ${accent}66 0%, ${accent}26 26%, transparent 52%)`
            : "transparent",
          opacity: on ? 1 : 0,
        }}
      />
      {/* LED indicador: apagado / encendido */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[9%] h-[6%] w-[11%] min-h-[6px] min-w-[6px] -translate-x-1/2 rounded-full transition-all duration-200"
        style={{
          background: on
            ? `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accent} 38%, ${accent} 100%)`
            : "radial-gradient(circle at 35% 30%, #7c8895 0%, #39434e 55%, #232c35 100%)",
          boxShadow: on
            ? `0 0 8px ${accent}, 0 0 20px ${accent}aa, inset 0 0 4px rgba(255,255,255,0.65)`
            : "0 1px 2px rgba(0,0,0,0.8), inset 0 0 3px rgba(0,0,0,0.55)",
          border: "1px solid rgba(0,0,0,0.5)",
        }}
      />
    </button>
  );
}
