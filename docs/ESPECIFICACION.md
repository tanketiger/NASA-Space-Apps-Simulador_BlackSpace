# AURORA — Outpost on Mars

> **Master document of the project (adjusted).**
> This version reflects what is actually built today. Anything marked *future* is not implemented
> and is not presented as implemented.

**Status:** specification v0.3 — implemented as a 60-second shift game.

---

## 1. One-sentence pitch

**AURORA** is a web game where a kid aged 7 to 12 runs an outpost on Mars and discovers, by playing,
that **power is finite and that the real space weather decides whether the plan works**.

Each sol (Martian day) splits the same power among things that compete: **survive, protect yourself
and do science**. There is no free option.

---

## 2. The two audiences

| Audience | What they take away |
|---|---|
| **Kids 7–12** | A clear game, with three big meters, 60-second decisions and consequences visible at the end of the shift. |
| **Judges / planners** | A trade-off model with figures traceable to NASA sources, useful to explain why a "safe" decision eats the next one's margin. |

**Golden rule:** if a decision has no cost, it does not go in the game.

---

## 3. The design sentence (non-negotiable)

> **"Each sol you have limited power; the real weather on Mars decides whether your plan works."**

---

## 4. Game loop (one shift = 60 seconds)

```
┌─ CABIN ──────────────────────────────────────────────────┐
│ Three meters: battery · oxygen · integrity                │
│ Central MARS window · CRT telemetry · four switches       │
│ CCTV tablet (4 cameras) · Michi Marciano guide            │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌─ DECISIONS (every second) ───────────────────────────────┐
│ SHIELD  → block the storm and the flare (drains battery)  │
│ LIGHT   → 3 s beam, reveals the dust (drains battery)     │
│ CAMERAS → open the CCTV tablet (drains battery)           │
│ OXYGEN  → +25% O₂ for −10% battery                        │
│ CLEAN   → −25 dust for −8% battery                        │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌─ SHIFT RESOLUTION ───────────────────────────────────────┐
│ Storm + flare hits → integrity → battery/oxygen drain →   │
│ victory at 06:00 AM, or a loss with the cause explained   │
└───────────────────────────┬───────────────────────────────┘
                            ▼
                  Victory screen
        (OSDR study + dose projection to 900 sols)
```

**Loss condition:** battery reaches 0, oxygen reaches 0, or integrity reaches 0.
**Win condition:** reach 06:00 AM with the outpost still running.

---

## 5. Resource economy (figures with sources)

All the figures in this table are **real and citable**. See `DATOS-VERIFICADOS.md`.

| Parameter | Value in the game | Real basis |
|---|---|---|
| Solar plant | **30 kWh/sol** nominal (24 m²) | Martian irradiance ≈ 590 W/m² (43% of Earth); MER-style triple-junction cells |
| RTG generator | **2.4 kWh/sol** constant (100 W) | Curiosity's MMRTG: ~100 W continuous electrical |
| Base dose on the surface | **0.64 mSv/sol** | MSL-RAD (Hassler et al., 2014): 0.21 mGy/day → 0.64 ± 0.12 mSv/day |
| Career limit | **600 mSv** | NASA crew exposure standard |
| Didactic projection | **900 sols** | Reference length of a surface stay |
| Panel cleaning | **−25 dust, −8% battery** | Spirit Sol 1812 transmittance (PIA11799) |
| Oxygen pump | **+25% O₂, −10% battery** | Game rule |
| CME dose factor | **×2** | Didactic factor for a coronal mass ejection |

> The kWh figures are the design basis of the outpost; the in-game meters are normalized to 0–100%
> so that a kid can read them at a glance.

---

## 6. The cabin (implemented)

- **Three meters:** battery (green), oxygen (orange) and integrity (cyan), drawn inside the slots of
  the background image.
- **Central MARS window:** dust-storm overlay, the LIGHT beam and the armored shield gate.
- **Four switches:** SHIELD (orange), LIGHT (yellow), CAMERAS (blue), OXYGEN (green), each with an
  indicator LED and a press animation.
- **CRT telemetry monitor:** Sol, time and “SYSTEMS OK” / “ALERT!”.
- **Left door:** CLEAN PANELS (−8% battery).
- **Mini-rover:** an easter egg that bounces when you boop it.
- **Michi Marciano:** the fictional guide card, with five contextual lines.

### CCTV (four cameras)

| Camera | Content | Provenance label |
|---|---|---|
| **CAM 01 · SURFACE** | Real orbital tile (NASA Mars Trek) with a CCTV filter and storm state | `Real image of Mars · Mars Trek (archive)` |
| **CAM 02 · SOLAR PANELS** | Dust %, solar transmittance, CLEAN PANELS button; the panels look dirty as dust builds up and clean again after cleaning | `Game model · NASA PIA11799 reference` |
| **CAM 03 · SPACE WEATHER & DOSE** | Real CME (live or archive) + surface dose | `Live real data · NASA DONKI` / `Historical record · NASA DONKI` and `Real measured dose · RadLab / MSL-RAD` |
| **CAM 04 · GREENHOUSE & SCIENCE** | Oxygen + a real OSDR study card | `Real study · NASA OSDR` |

---

## 7. Events

### 7.1 Real events (NASA data)

| Event | Trigger | Effect in the game |
|---|---|---|
| **CME / solar storm** | DONKI: recent CME record | The dose of the sol is multiplied (×2) |
| **Dust storm** | Scenario (design rule) | The landscape darkens, dust drifts and the cabin vibrates if the gate is open |
| **Panel dust** | Always on (design rule) | Solar transmittance falls; clean it to recover it |

### 7.2 Michi Marciano (fiction)

Michi is the game's guide, **clearly labeled as fiction**:

- Always carries the label `FICTION · GAME GUIDE`.
- When he cites a datum, he says whether it is real, reference data or a game rule.
- He does **not** change radiation or oxygen: those only change from real causes.

---

## 8. Data: live vs. historical (required in the UI)

Every datum on screen carries a visible label. **A historical datum is never presented as live.**

| Datum on screen | Source | Type | Exact label |
|---|---|---|---|
| Space weather (CMEs) | **DONKI** | 🟢 **LIVE REAL DATA** (last 30 days) | `Live real data · NASA DONKI` |
| Space weather (fallback) | **DONKI archive / local** | 🟠 **REAL HISTORICAL** | `Historical record · NASA DONKI` |
| Terrain and mosaic of Mars | **Mars Trek** | 🔵 Real archive | `Real image of Mars · Mars Trek (archive)` |
| Health and biology studies | **OSDR** | 🔵 Real archive | `Real study · NASA OSDR` |
| Measured radiation dose | **MSL-RAD / RadLab** | ⚪ Reference | `Real measured dose · RadLab / MSL-RAD` |
| Panel power, dose limit, light delay | **NASA science pages** | ⚪ Real reference | `Reference data · NASA` |
| Outpost state (storm, flare, dust) | **Game model** | 🔴 **SIMULATED** | `Game model · not NASA data` |

> **Honesty rule:** the environment is real; the outpost state is a model. Saying so on screen is
> what separates a credible project from one the jury discards.

---

## 9. Replayability

The engine is the same across sols; only the difficulty parameters and the cited real CME change.
That is replayability **without inventing data**.

| Sol | Difficulty | Cited real CME (fallback) |
|---|---|---|
| **SOL 1** | Training | `2024-05-08T05:36:00-CME-001` (870 km/s) |
| **SOL 2** | Intermediate | `2023-02-24T02:00:00-CME-001` (244 km/s) |
| **SOL 3** | Advanced | `2022-03-28T00:36:00-CME-001` (441 km/s) |

---

## 10. Accessibility

- Read-aloud with the Web Speech API (browser `speechSynthesis`), in English.
- Simple, short texts; technical terms explained in context, not in a glossary.
- No account, no download, nothing to install: it opens in the browser.
- Works offline thanks to the local data fallback.

---

## 11. Compliance

- **Zero NASA branding**: no logos, flags, patches or institutional typefaces. Own identity (AURORA)
  and own palette.
- **AI-generated content**: declared in `/creditos`; Michi's portrait is an AI-generated image and is
  identified as such.
- **Data**: every data screen links to the verifiable original source.

---

## 12. Scope

**Implemented (MVP):**
- First-person cabin with three meters and four switches.
- 60-second shift engine with real-time consequences.
- 3 sols with increasing difficulty.
- CCTV tablet with 4 cameras and provenance labels.
- Panel cleaning (−8% battery, −25 dust) and oxygen pump.
- Real NASA data through `/api/nasa` with a local fallback.
- Victory screen with a real OSDR study and a dose projection.

**Future (phase 2):**
- More sols and more OSDR studies.
- Rover expedition mechanic.
- Virtual reality, multiplayer, 3D habitat models, professional dubbing.

---

## 13. Demo script (3 minutes for the jury)

1. Open the game and start a shift.
2. Show CAM 03 with a real CME: `Live real data · NASA DONKI` plus its measured speed.
3. Press LIGHT and show the dust beam and the storm; raise the SHIELD to block it.
4. Open CAM 02, clean the panels and show dust % and transmittance changing.
5. Reach 06:00 AM: show the victory screen with the OSDR study and the projection to 900 sols.
6. Close with the sentence: *every decision has a price, and the price adds up*.

---

## 14. Stack

- **Next.js 15 + TypeScript + Tailwind CSS 4** (100% web, deployed on Vercel).
- **Pure shift engine** in `src/lib/game/engine.ts`, with unit tests.
- **Web Audio API** for synthesized sound (no audio files).
- **Route handler** as a data proxy (CORS + optional API key + 1-hour cache + local fallback).
- No database and no localStorage: each shift is independent.
