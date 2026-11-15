"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameSound } from "@/lib/game/sound";
import { SOLS } from "@/lib/game/sols";
import type { SolRules } from "@/lib/game/engine";
import {
  BASE_DOSE_MSV_PER_SOL,
  CAREER_LIMIT_MSV,
  CAREER_SOLS,
  CME_DOSE_MULTIPLIER,
  CME_SOURCE_HISTORICAL,
  DOSE_SOURCE,
  MARS_TREK_TILE,
  OSDR_SOURCE,
  PANELS_SOURCE,
  SURFACE_SOURCE,
  localFeed,
  solarTransmittance,
  studyForSol,
  type CmeEvent,
  type NasaFeed,
} from "@/lib/game/nasa";

// ─────────────────────────────────────────────────────────────────────────────
// Aurora Outpost · first-person survival shift (60 s)
//
// The background is /images/cabina.jpg. Every layer is positioned in % INSIDE a
// "stage" that keeps the real image aspect ratio (2752x1536) and covers the
// screen: that way `left: 27.3%` always lands on the same drawn point, no matter
// the window size.
//
// Data honesty note (for judges):
//   · REAL      → the CME event (NASA DONKI) and the studies (NASA OSDR), shown
//                 with their provenance label and link.
//   · REFERENCE → the MSL-RAD dose (0.64 mSv/sol) and the Sol 1812 fact.
//   · GAME      → Sol, clock, storm, flare, battery, oxygen, dust, gates,
//                 lights, cameras and Michi Marciano himself.
// ─────────────────────────────────────────────────────────────────────────────

const IMG_RATIO = 2752 / 1536; // real aspect ratio of cabina.jpg (16:9)
const SOL_SECONDS = 60; // 1 Sol = 60 real seconds
const HOUR_SECONDS = 10; // 1 shift hour = 10 real seconds
const LIGHT_SECONDS = 3; // the LIGHT beam lasts 3 s
const CLEAN_BATTERY_COST = 8; // % battery per panel cleaning
const CLEAN_DUST_AMOUNT = 25; // dust percentage points removed
const DUST_VISIBLE_FROM = 12; // below this the panels read as fully clean
const DUST_FULL_AT = 24; // dust above this renders the full dirty overlay
const O2_LOW_THRESHOLD = 35; // low-air warning

const HAZARD = "repeating-linear-gradient(45deg, #facc15 0 16px, #0b0f1a 16px 32px)";

const CAMS = [
  { id: 1, label: "CAM 01 · SURFACE" },
  { id: 2, label: "CAM 02 · SOLAR PANELS" },
  { id: 3, label: "CAM 03 · SPACE WEATHER & DOSE" },
  { id: 4, label: "CAM 04 · GREENHOUSE & SCIENCE" },
] as const;

// Michi Marciano's lines. Every sentence carries its provenance tag.
const MICHI = {
  intro:
    "Space meow! Survive until 06:00 AM. Your power is limited: check the cameras and raise the SHIELD only when danger comes. (Reference data · NASA)",
  lightCalm:
    "Light cuts through the Martian night! Mars' atmosphere is only about 1% as dense as Earth's, which is why the sky and the dust behave so differently. (Reference data · NASA)",
  lightStorm:
    "Look at that dust in the light beam! Global storms can block up to 85% of sunlight from the panels, like the 2018 storm that shut down the Opportunity rover. Raise the SHIELD! (Real historical data · NASA Opportunity)",
  lightFlare:
    "Radiation alert! This record really happened in NASA DONKI. A coronal mass ejection can multiply the surface dose (0.64 mSv/sol). Close the gate! (Historical record · NASA DONKI)",
  lowOxygen:
    "Low air! Check CAM 04 or press the green OXYGEN switch before your reserves run out. (Game model · not NASA data)",
  panelsCleaned:
    "Panels clean! Before the Sol 1812 cleaning, only 25% of sunlight passed through the dust on the Spirit rover; cleaning raised transmittance to 28%. (Reference data · NASA PIA11799)",
  lowBattery:
    "Not enough battery: you need at least 8% battery to clean the panels. (Game model · not NASA data)",
};

type Phase = "playing" | "won" | "lost";
type LossReason = "battery" | "oxygen" | "integrity" | null;

interface GameState {
  phase: Phase;
  elapsed: number; // 0..60 seconds of the Sol
  battery: number; // 0..100
  oxygen: number; // 0..100
  integrity: number; // 0..100
  panelDust: number; // 0..100 dust on the solar panels
  shield: boolean; // armored central gate lowered
  lightUntil: number; // elapsed until which the outside light is on
  camsOpen: boolean; // CCTV tablet open
  panelsCleaned: boolean; // achievement: cleaned the panels
  booped: boolean; // achievement: booped the rover
  pumped: boolean; // achievement: used the O2 pump
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
    panelsCleaned: false,
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

/** One simulation step (1 real second). */
function tick(s: GameState, rules: SolRules): GameState {
  if (s.phase !== "playing") return s;

  const t = s.elapsed + 1;
  const next: GameState = { ...s, elapsed: t };

  const stormStart = rules.dustStart;
  const stormEnd = rules.dustAtWindow;
  const flareStart = rules.flareLevel2;
  const flareEnd = rules.flareCritical;

  const lightOn = t < next.lightUntil;

  // Battery: -0.4 %/s with the base off, up to -1.2 %/s with 3 systems active
  // (shield + light + cameras). Panel dust adds a small extra.
  const activeSystems = (next.shield ? 1 : 0) + (lightOn ? 1 : 0) + (next.camsOpen ? 1 : 0);
  const systemsDrain = 0.4 + 0.8 * (activeSystems / 3);
  const dustDrain = (next.panelDust / 100) * 0.5;
  next.battery = clamp(next.battery - (systemsDrain + dustDrain));

  // Oxygen: a steady -1 %/s.
  next.oxygen = clamp(next.oxygen - 1);

  // Dust builds up on the solar panels (cleared with the panel button).
  next.panelDust = clamp(next.panelDust + 0.6);

  // Integrity: hits from environmental events; the shield blocks them.
  const inStorm = t >= stormStart && t <= stormEnd;
  const inFlare = t >= flareStart && t <= flareEnd;
  if ((inStorm || inFlare) && !next.shield) next.integrity = clamp(next.integrity - 3);
  if ((t === stormStart || t === flareStart) && !next.shield) next.integrity = clamp(next.integrity - 10);

  // Losses.
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
  const [lightPressed, setLightPressed] = useState(false);
  const [o2Pulse, setO2Pulse] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Michi Marciano
  const [michi, setMichi] = useState(MICHI.intro);
  const [michiOpen, setMichiOpen] = useState(true);
  const [michiVoice, setMichiVoice] = useState(false);

  // Real NASA data (with an immediate local fallback).
  const [nasa, setNasa] = useState<NasaFeed>(() => localFeed());

  const sound = useRef<GameSound | null>(null);
  const prev = useRef<GameState>(state);
  const voiceRef = useRef(michiVoice);
  voiceRef.current = michiVoice;
  const o2Warned = useRef(false);

  if (!sound.current && typeof window !== "undefined") sound.current = new GameSound();
  useEffect(() => {
    if (sound.current) sound.current.enabled = soundOn;
  }, [soundOn]);

  // Michi says something and (if enabled) reads it out loud in English.
  const say = useCallback((msg: string) => {
    setMichi(msg);
    if (voiceRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = "en-US";
        const en = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("en"));
        if (en) u.voice = en;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {
        /* voice not available */
      }
    }
  }, []);

  // Real NASA feed (DONKI + OSDR). If it fails, the local fallback stays.
  useEffect(() => {
    let alive = true;
    fetch("/api/nasa")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: NasaFeed) => {
        if (alive && d?.cme && d?.osdr) setNasa(d);
      })
      .catch(() => {
        /* offline: we keep the local fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  const s = state;

  const stormStart = rules.dustStart;
  const stormEnd = rules.dustAtWindow;
  const flareStart = rules.flareLevel2;
  const flareEnd = rules.flareCritical;

  const lightOn = s.elapsed < s.lightUntil;
  const inStorm = s.elapsed >= stormStart && s.elapsed <= stormEnd;
  const inFlare = s.elapsed >= flareStart && s.elapsed <= flareEnd;

  // Active danger (siren) and incoming danger (CRT alert, with a 3 s warning).
  const danger = s.phase === "playing" && (inStorm || inFlare);
  const alert =
    s.phase === "playing" &&
    ((s.elapsed >= stormStart - 3 && s.elapsed <= stormEnd) ||
      (s.elapsed >= flareStart - 3 && s.elapsed <= flareEnd));

  // The cabin shakes if there is a storm and the SHIELD gate is open.
  const shaking = inStorm && !s.shield && s.phase === "playing";

  // Clock: one engine tick per real second, only while playing.
  useEffect(() => {
    if (s.phase !== "playing") return;
    const id = window.setInterval(() => setState((p) => tick(p, rules)), 1000);
    return () => window.clearInterval(id);
  }, [s.phase, rules]);

  // Sounds and achievements triggered by the engine itself.
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

  // At the start of each Sol, Michi welcomes the player.
  useEffect(() => {
    setMichi(MICHI.intro);
    o2Warned.current = false;
  }, [solIndex]);

  // Low-oxygen warning (once per dip).
  useEffect(() => {
    if (s.phase !== "playing") return;
    if (s.oxygen < O2_LOW_THRESHOLD && !o2Warned.current) {
      o2Warned.current = true;
      say(MICHI.lowOxygen);
    } else if (s.oxygen >= O2_LOW_THRESHOLD + 5) {
      o2Warned.current = false;
    }
  }, [s.oxygen, s.phase, say]);

  // ── Switch actions ──────────────────────────────────────────────────────────
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
    setLightPressed(true);
    window.setTimeout(() => setLightPressed(false), 450);
    setState((p) => ({ ...p, lightUntil: p.elapsed + LIGHT_SECONDS }));

    // Michi updates her diagnosis based on the danger active right now.
    if (inStorm) say(MICHI.lightStorm);
    else if (inFlare) say(MICHI.lightFlare);
    else say(MICHI.lightCalm);
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

  /** Instant mechanical panel cleaning (compressed air). */
  function cleanPanels() {
    if (s.phase !== "playing") return;
    if (s.battery < CLEAN_BATTERY_COST) {
      sound.current?.button();
      say(MICHI.lowBattery);
      return;
    }
    sound.current?.airPuff();
    setState((p) => ({
      ...p,
      battery: clamp(p.battery - CLEAN_BATTERY_COST),
      panelDust: clamp(p.panelDust - CLEAN_DUST_AMOUNT),
      panelsCleaned: true,
    }));
    say(MICHI.panelsCleaned);
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

  // ── Real data for the UI ────────────────────────────────────────────────────
  const cmeEvent: CmeEvent = useMemo(() => {
    if (nasa.cme.isLive && nasa.cme.events.length > 0) return nasa.cme.events[0];
    return {
      activityID: sol.historicalEvent.activityID,
      startTime: sol.historicalEvent.date,
      speedKmS: sol.historicalEvent.speedKmS ?? null,
      link: sol.historicalEvent.link,
    };
  }, [nasa.cme, sol]);

  const cmeLabel = nasa.cme.isLive ? nasa.cme.sourceLabel : CME_SOURCE_HISTORICAL;
  const study = studyForSol(sol.sol, nasa.osdr.studies);
  const transmittance = solarTransmittance(s.panelDust);
  // Panels read as CLEAN while the dust is below DUST_VISIBLE_FROM, then get
  // progressively dirtier up to DUST_FULL_AT. Since a cleaning always removes
  // 25 points (and the shift never accumulates more than ~36), cleaning always
  // drops the panels back into the clean range.
  const dustLevel = clamp((s.panelDust - DUST_VISIBLE_FROM) / DUST_FULL_AT, 0, 1);
  const dosePerSol = BASE_DOSE_MSV_PER_SOL * (inFlare ? CME_DOSE_MULTIPLIER : 1);
  const careerDose = Math.round(BASE_DOSE_MSV_PER_SOL * CAREER_SOLS);

  const achievements = [
    s.panelsCleaned && "🧹 Panels cleaned",
    s.pumped && "💨 Oxygen refill",
    s.booped && "🤖 Rover boop",
    s.integrity >= 99 && "🛡️ Perfect shield",
  ].filter(Boolean) as string[];

  return (
    <main
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Stage with the real cabina.jpg aspect ratio, scaled to cover */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${IMG_RATIO}))`,
          height: `max(100vh, calc(100vw / ${IMG_RATIO}))`,
          containerType: "inline-size",
        }}
      >
        <div className={`relative h-full w-full ${shaking ? "cabin-shake" : ""}`}>
          <img
            src="/images/cabina.jpg"
            alt="Aurora outpost cabin on Mars"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* ═══ CENTRAL "MARS" WINDOW ═══ */}
          <div
            className="absolute overflow-hidden"
            style={{ left: "39.4%", top: "18.6%", width: "31.1%", height: "28.9%" }}
            title="MARS window"
          >
            {/* Dust storm: darkens the landscape and drags orange dust */}
            {inStorm && (
              <>
                <div aria-hidden="true" className="absolute inset-0 bg-black/50" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-orange-900/45 backdrop-blur-[1px]"
                />
                <div aria-hidden="true" className="absolute inset-0 overflow-hidden opacity-80">
                  <div className="dust-drift absolute inset-[-10%]">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 20% 30%, rgba(214,140,70,0.55) 0 2px, transparent 3px), radial-gradient(circle at 60% 60%, rgba(190,120,60,0.5) 0 3px, transparent 4px), radial-gradient(circle at 85% 25%, rgba(230,160,90,0.45) 0 2px, transparent 3px)",
                        backgroundSize: "22% 30%, 31% 41%, 17% 27%",
                        backgroundRepeat: "repeat",
                      }}
                    />
                  </div>
                </div>
                {[
                  { top: "18%", delay: "0s" },
                  { top: "46%", delay: "0.7s" },
                  { top: "72%", delay: "1.4s" },
                ].map((p, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="absolute left-0 h-[3px] w-[70%] rounded-full bg-orange-200/40"
                    style={{
                      top: p.top,
                      filter: "blur(1px)",
                      animation: `dust-streak 2.6s linear infinite`,
                      animationDelay: p.delay,
                    }}
                  />
                ))}
              </>
            )}

            {/* Brief flash when the light turns on */}
            {flash && <div className="absolute inset-0 bg-yellow-100/80" />}

            {/* LIGHT switch beam: reveals the dust in suspension */}
            {lightOn && (
              <div
                aria-hidden="true"
                className="light-beam absolute inset-0 mix-blend-screen"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 15%, rgba(253,224,71,0.55) 0%, rgba(253,224,71,0.22) 45%, transparent 78%)",
                }}
              />
            )}

            {/* Armored metal gate: lowers when the shield is active */}
            <div
              className={`absolute inset-0 flex flex-col transition-transform duration-200 ease-out ${
                s.shield ? "translate-y-0" : "-translate-y-full"
              }`}
            >
              <div className="h-[15%]" style={{ backgroundImage: HAZARD }} />
              <div className="relative grid flex-1 place-items-center border-y-4 border-slate-950 bg-gradient-to-b from-[#8d969d] via-[#6d767d] to-[#4a535a] shadow-[inset_0_0_28px_rgba(0,0,0,0.55),inset_0_6px_10px_rgba(255,255,255,0.12)]">
                <span className="text-[10px] font-black tracking-[0.35em] text-slate-900/55">SHIELD</span>
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

          {/* ═══ LIFE BARS · each inside its drawn slot ═══ */}
          <StatBar
            label="Battery"
            value={s.battery}
            className="bg-green-500"
            style={{ left: "27.3%", top: "17.4%", width: "7.6%", height: "5.1%" }}
          />
          <StatBar
            label="Oxygen"
            value={s.oxygen}
            className="bg-orange-500"
            style={{ left: "27.3%", top: "26.5%", width: "7.6%", height: "5.5%" }}
          />
          <StatBar
            label="Integrity"
            value={s.integrity}
            className="bg-cyan-500"
            style={{ left: "27.3%", top: "35.5%", width: "7.6%", height: "5.1%" }}
          />

          {/* ═══ RIGHT CRT · screen lit over the drawn glass ═══ */}
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
            title="CRT telemetry monitor"
          >
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
                {alert ? "ALERT!" : "SYSTEMS OK"}
              </div>
            </div>
          </div>

          {/* Siren: pulsing red glow when there is active danger */}
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

          {/* ═══ SHIELD SWITCH (orange) ═══ */}
          <SwitchZone
            label="Shield"
            accent="#f97316"
            on={s.shield}
            style={{ left: "20%", top: "55.5%", width: "8%", height: "18.5%" }}
            onClick={toggleShield}
          />

          {/* ═══ LIGHT SWITCH (yellow) ═══ */}
          <SwitchZone
            label="Light"
            accent="#facc15"
            on={lightOn}
            pressed={lightPressed}
            style={{ left: "29.9%", top: "52.8%", width: "5.4%", height: "16.5%" }}
            onClick={useLight}
          />

          {/* ═══ CAMERAS SWITCH (blue) ═══ */}
          <SwitchZone
            label="Cameras"
            accent="#3b82f6"
            on={s.camsOpen}
            style={{ left: "77.3%", top: "54.2%", width: "7%", height: "16%" }}
            onClick={toggleCams}
          />

          {/* ═══ OXYGEN SWITCH (green) ═══ */}
          <SwitchZone
            label="Oxygen"
            accent="#22c55e"
            on={o2Pulse}
            style={{ left: "86.4%", top: "55.5%", width: "7.4%", height: "21%" }}
            onClick={pumpO2}
          />

          {/* ═══ LEFT DOOR · CLEAN SOLAR PANELS (instant) ═══ */}
          <button
            type="button"
            onClick={cleanPanels}
            disabled={s.phase !== "playing"}
            title="Clean solar panels (-8% battery)"
            aria-label="Go out to solar panels"
            className="group absolute cursor-pointer rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
            style={{ left: "1.5%", top: "5.5%", width: "20%", height: "44%" }}
          >
            <span className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto w-[86%] rounded bg-black/75 px-1 py-0.5 text-center text-[9px] font-bold leading-tight text-cyan-200 opacity-0 transition-opacity group-hover:opacity-100">
              CLEAN PANELS (-8% BATTERY)
            </span>
          </button>

          {/* ═══ ROVER BOOP! ═══ */}
          <button
            type="button"
            onClick={boopRover}
            title="BOOP!"
            aria-label="Boop the rover"
            className={`group absolute cursor-pointer rounded-full hover:bg-white/10 ${bounce ? "animate-bounce" : ""}`}
            style={{ left: "48.5%", top: "56.5%", width: "11%", height: "18.5%" }}
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-yellow-200 opacity-0 transition-opacity group-hover:opacity-100">
              BOOP!
            </span>
          </button>
        </div>
      </div>

      {/* ═══ MICHI MARCIANO · guide assistant (fiction) ═══ */}
      <MichiGuide
        message={michi}
        open={michiOpen}
        onToggle={() => setMichiOpen((o) => !o)}
        voice={michiVoice}
        onVoice={() => setMichiVoice((v) => !v)}
      />

      {/* ═══ CCTV TABLET (CAMERAS switch above) ═══ */}
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
                CLOSE ✕
              </button>
            </div>

            {/* Camera tabs */}
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

            <div className="relative aspect-video w-full overflow-hidden rounded border-2 border-slate-700 bg-black">
              {/* ── CAM 01 · SURFACE ── */}
              {cam === 1 && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARS_TREK_TILE}
                    alt="Real orbital image of Mars (NASA Mars Trek)"
                    className="h-full w-full object-cover"
                    style={{ filter: inStorm ? "brightness(0.55) saturate(0.8)" : "saturate(1.05)" }}
                  />
                  {inStorm && (
                    <div className="absolute inset-0 bg-orange-900/40 backdrop-blur-[1px]" />
                  )}
                  <Provenance text={SURFACE_SOURCE} />
                  <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-amber-200">
                    {inStorm ? "DUST STORM ACTIVE" : "No storm · clear sky"}
                  </div>
                </>
              )}

              {/* ── CAM 02 · SOLAR PANELS ── */}
              {cam === 2 && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/exterior_paneles.png"
                    alt="Solar panels of the outpost"
                    className="h-full w-full object-cover transition-[filter] duration-700 ease-out"
                    style={{
                      // Clean panels are glossy and vivid. Dust dulls them, washes
                      // out the colour and lifts the shadows, so dirty vs. clean is
                      // obvious at a glance.
                      filter:
                        dustLevel > 0
                          ? `brightness(${(1 + 0.55 * dustLevel).toFixed(3)}) saturate(${(
                              1 - 0.85 * dustLevel
                            ).toFixed(3)}) contrast(${(1 - 0.4 * dustLevel).toFixed(3)})`
                          : "brightness(1.05) saturate(1.15) contrast(1.08)",
                    }}
                  />
                  {/* Dust coating: invisible while the panels are clean, a thick tan layer when dirty */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: dustLevel,
                      background:
                        "linear-gradient(160deg, rgba(206,174,134,0.95) 0%, rgba(188,152,110,0.9) 55%, rgba(166,130,92,0.95) 100%)",
                    }}
                  />
                  {/* Dust speckles so the coating reads as powder, not a flat tint */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: dustLevel * 0.9,
                      backgroundImage:
                        "radial-gradient(circle at 20% 30%, rgba(120,90,58,0.55) 0 1.5px, transparent 2.5px), radial-gradient(circle at 65% 55%, rgba(120,90,58,0.45) 0 2px, transparent 3px), radial-gradient(circle at 85% 20%, rgba(255,240,210,0.5) 0 1.5px, transparent 2.5px)",
                      backgroundSize: "26px 22px, 34px 30px, 20px 18px",
                      backgroundRepeat: "repeat",
                    }}
                  />
                  {/* Clean sheen: a soft glossy highlight over the glass when the panels are clean */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: 1 - dustLevel,
                      background:
                        "linear-gradient(115deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 26%, transparent 46%)",
                    }}
                  />
                  <Provenance text={PANELS_SOURCE} />
                  <div className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-amber-200">
                    PANEL DUST: {Math.round(s.panelDust)}%
                    <br />
                    SOLAR TRANSMITTANCE: {Math.round(transmittance)}%
                    <br />
                    <span className={dustLevel <= 0 ? "text-lime-300" : "text-amber-400"}>
                      {dustLevel <= 0 ? "STATUS: CLEAN ✓" : "STATUS: DUSTY"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={cleanPanels}
                    className="absolute bottom-2 right-2 cursor-pointer rounded bg-amber-500 px-3 py-2 font-mono text-[11px] font-bold text-slate-900 hover:bg-amber-400"
                  >
                    [CLEAN PANELS (-8% BATTERY)]
                  </button>
                </>
              )}

              {/* ── CAM 03 · SPACE WEATHER & DOSE ── */}
              {cam === 3 && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 70% 20%, rgba(249,115,22,0.35) 0%, transparent 45%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.3) 0%, transparent 45%), #05070d",
                    }}
                  />
                  <Provenance text={cmeLabel} />
                  <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 font-mono text-[12px] text-slate-100">
                    <div className="text-[13px] font-bold text-orange-300">CORONAL MASS EJECTION (CME)</div>
                    <div>
                      ID: <span className="text-lime-300">{cmeEvent.activityID}</span>
                    </div>
                    <div>
                      Start: <span className="text-lime-300">{cmeEvent.startTime}</span>
                    </div>
                    <div>
                      Measured speed:{" "}
                      <span className="text-lime-300">
                        {cmeEvent.speedKmS !== null ? `${cmeEvent.speedKmS} km/s` : "not published"}
                      </span>
                    </div>
                    <div className="mt-2 border-t border-slate-700 pt-2">
                      Surface dose:{" "}
                      <span className="text-cyan-300">{dosePerSol.toFixed(2)} mSv/sol</span>
                      {inFlare && <span className="ml-2 text-red-400">×{CME_DOSE_MULTIPLIER} during active CME</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">{DOSE_SOURCE}</div>
                  </div>
                </>
              )}

              {/* ── CAM 04 · GREENHOUSE & SCIENCE ── */}
              {cam === 4 && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/cam04.png"
                    alt="Greenhouse of the outpost"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <Provenance text={OSDR_SOURCE} />
                  <div className="absolute inset-x-3 bottom-3 rounded-lg border border-lime-400/40 bg-black/80 p-3 font-mono text-[11px] text-slate-100">
                    <div className="flex items-center justify-between text-[10px] text-lime-300">
                      <span>STUDY UNLOCKED · {study.accession}</span>
                      <span>O2 {Math.round(s.oxygen)}%</span>
                    </div>
                    <div className="mt-1 leading-snug">{study.title}</div>
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-[10px] text-cyan-300 underline"
                    >
                      osdr.nasa.gov/bio/studies/{study.accession}
                    </a>
                  </div>
                </>
              )}

              {/* Common CCTV filter */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 4px)",
                }}
              />
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-lime-200">
                {CAMS.find((c) => c.id === cam)?.label}
              </div>
            </div>

            <p className="mt-2 text-center font-mono text-[10px] text-slate-400">
              Provenance labels show whether each datum is real (NASA), reference data, or a game rule.
            </p>
          </div>
        </div>
      )}

      {/* ═══ END OF SHIFT ═══ */}
      {s.phase !== "playing" && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border-4 border-slate-900 bg-slate-800 p-6 text-center text-slate-100 shadow-2xl">
            {s.phase === "won" ? (
              <>
                <div className="text-5xl">🎉</div>
                <h1 className="mt-2 text-2xl font-black text-lime-400">SOL COMPLETE!</h1>
                <p className="mt-2 text-sm text-slate-300">
                  {sol.label} completed at 06:00 AM. Battery {Math.round(s.battery)}% · Oxygen{" "}
                  {Math.round(s.oxygen)}% · Integrity {Math.round(s.integrity)}%.
                </p>

                {/* Real OSDR study unlocked this shift */}
                <div className="mt-3 rounded-lg border border-lime-400/40 bg-black/40 p-3 text-left">
                  <div className="font-mono text-[10px] text-lime-300">
                    {OSDR_SOURCE} · {study.accession}
                  </div>
                  <div className="mt-1 text-xs text-slate-200">{study.title}</div>
                </div>

                {/* Didactic dose projection */}
                <div className="mt-3 rounded-lg border border-cyan-400/30 bg-black/40 p-3 text-left text-xs text-cyan-100">
                  Over {CAREER_SOLS} sols the crew would accumulate ~{careerDose} mSv, against the{" "}
                  {CAREER_LIMIT_MSV} mSv career limit. (Reference data · NASA · MSL-RAD)
                </div>

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
                    LOAD NEXT SOL ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-5 cursor-pointer rounded-lg bg-lime-500 px-6 py-3 font-black text-slate-900 hover:bg-lime-400"
                  >
                    PLAY AGAIN ↻
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl">
                  {s.lossReason === "battery" ? "🔋" : s.lossReason === "oxygen" ? "🫁" : "☄️"}
                </div>
                <h1 className="mt-2 text-2xl font-black text-red-400">SYSTEMS DOWN!</h1>
                <p className="mt-2 text-sm text-slate-300">
                  {s.lossReason === "battery"
                    ? "The battery ran out. Every switch you turn on drains power: use them only when you need them."
                    : s.lossReason === "oxygen"
                    ? "Oxygen ran out. Press the OXYGEN switch to refill (+25%, costs 10% battery)."
                    : "Integrity hit 0%. Raise the SHIELD switch when the CRT shows ALERT!."}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-5 cursor-pointer rounded-lg bg-red-500 px-6 py-3 font-black text-white hover:bg-red-400"
                >
                  RETRY {sol.label} ↻
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

/** Provenance tag for a datum (real / reference / game). */
function Provenance({ text }: { text: string }) {
  return (
    <div className="absolute left-2 top-2 z-10 rounded bg-black/80 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-cyan-200">
      {text}
    </div>
  );
}

/** Compact Michi Marciano card, the guide assistant (fiction). */
function MichiGuide({
  message,
  open,
  onToggle,
  voice,
  onVoice,
}: {
  message: string;
  open: boolean;
  onToggle: () => void;
  voice: boolean;
  onVoice: () => void;
}) {
  return (
    <div
      className="absolute z-50 w-[min(20rem,86vw)]"
      style={{ left: "3%", bottom: "3%" }}
    >
      <div
        className="rounded-xl border-2 border-emerald-500/60 bg-slate-950/92 p-2 shadow-[0_0_24px_rgba(16,185,129,0.25)] backdrop-blur-sm"
        style={{ fontFamily: "var(--font-chakra), ui-monospace, monospace" }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/images/michi_guia.png"
            alt="Michi Marciano, the game guide"
            className="h-11 w-11 shrink-0 rounded-full border-2 border-emerald-400/70 object-cover"
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-emerald-300">Michi Marciano</div>
            <div className="text-[9px] font-bold tracking-[0.12em] text-amber-300">
              FICTION · GAME GUIDE
            </div>
          </div>
          <button
            type="button"
            onClick={onVoice}
            aria-label="Voice narration"
            title="Voice narration (English)"
            className={`cursor-pointer rounded border px-1.5 py-0.5 text-[11px] ${
              voice
                ? "border-emerald-400 text-emerald-300"
                : "border-slate-600 text-slate-400 hover:border-emerald-400"
            }`}
          >
            {voice ? "🔊" : "🔈"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Minimize guide" : "Expand guide"}
            title={open ? "Minimize" : "Expand"}
            className="cursor-pointer rounded border border-slate-600 px-1.5 py-0.5 text-[11px] text-slate-300 hover:border-emerald-400"
          >
            {open ? "–" : "?"}
          </button>
        </div>

        {open && (
          <p className="mt-2 rounded bg-black/50 p-2 text-[14px] leading-snug text-emerald-50">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/** Status bar fitted into its drawn slot. Empties from left to right. */
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

/** Transparent clickable area over a drawn switch, with an indicator LED. */
function SwitchZone({
  label,
  accent,
  on,
  pressed = false,
  style,
  onClick,
}: {
  label: string;
  accent: string;
  on: boolean;
  pressed?: boolean;
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
      {/* Soft halo over the drawn switch when it is on */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg transition-all duration-200"
        style={{
          background: on
            ? `radial-gradient(circle at 50% 58%, ${accent}66 0%, ${accent}26 26%, transparent 52%)`
            : "transparent",
          opacity: on ? 1 : 0,
          transform: pressed ? "translateY(6%)" : "translateY(0)",
        }}
      />
      {/* Indicator LED: off / on. Dips for an instant when pressed. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[9%] h-[6%] w-[11%] min-h-[6px] min-w-[6px] -translate-x-1/2 rounded-full transition-all duration-200"
        style={{
          transform: pressed ? "translate(-50%, 60%)" : "translate(-50%, 0)",
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
