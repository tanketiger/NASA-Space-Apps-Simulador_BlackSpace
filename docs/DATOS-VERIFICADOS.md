# Verified data and the verdict on the "25%"

> This file exists so the jury (and the team) can audit every figure in the game.
> Every figure shown on screen must be traceable back to here.

---

## 1. The "25% power recovery" — VERDICT

**The claim as it appears in the brief is not correct.** The 25% exists, but it means something
else.

| Claim | Verdict | What the source actually says |
|---|---|---|
| "The panels recover 25% of power" | ❌ **False** | No NASA source says that. |
| "25% of sunlight got past the dust" | ✅ **Correct** | Before the **Sol 1812** cleaning of the Spirit rover, **only 25% of the light** reaching the array got past the dust. After cleaning it rose to **28%**. |
| "A cleaning can raise power ~14%" | ✅ **Correct** | That same event raised output from **210 Wh to 240 Wh** (+30 Wh, ≈ +14%). |
| "The cell efficiency was ~25%" | ⚠️ **Close** | The MER triple-junction cells had a conversion efficiency of ≈26%. That is a different thing. |

**Primary source (NASA Photojournal PIA11799):**
> *"Before the Sol 1812 cleaning, only 25 percent of sunlight hitting the array was getting
> past the dust to be used by the photovoltaic cells. That factor improved to 28 percent after
> the cleaning event."*
> — <https://science.nasa.gov/photojournal/spirit-solar-panel-on-sol-1813-still-very-dusty/>

### How it is implemented in the game

We model **transmittance**, not "magic recovery":

```
solar_transmittance = 100% − dust
```

- Dust builds up over the shift and reduces transmittance.
- The **CLEAN PANELS** action (left door, or the button inside CAM 02) instantly removes **25
  percentage points** of dust and costs **8% of the battery**.
- CAM 02 shows both numbers on screen: **PANEL DUST** and **SOLAR TRANSMITTANCE**, plus a
  **STATUS: CLEAN / DUSTY** readout. The panels themselves are rendered dirty as dust builds up
  (a dull, dusty coating) and look clean and glossy again right after a cleaning, so the effect is
  visible and not just a number.

That way the player **feels** the real figure without being told an invented percentage.

---

## 2. Real figures used by the game

| Datum | Value | Source |
|---|---|---|
| MMRTG electrical power | **≈100 W continuous** | NASA, *Mars Rover Power* — <https://science.nasa.gov/resource/mars-rover-power/> |
| MER solar array output at the start | **≈800–900 Wh/sol** | NASA/JPL via PDS Geosciences Node |
| Output after 90 sols (dust + season) | **≈600 Wh/sol** | MER solar array design and operation (NTRS 20090026397) |
| MER cell efficiency | **≈26%** (triple junction) | NTRS 20090026397 |
| Solar irradiance on Mars | **≈590 W/m²** (≈43% of Earth) | NASA Mars Facts |
| Absorbed surface dose | **0.21 mGy/day** | MSL-RAD, Hassler et al. (2014) |
| Equivalent surface dose | **0.64 ± 0.12 mSv/day** | MSL-RAD, Hassler et al. (2014) |
| End of Opportunity | **June 10, 2018**, global dust storm | NASA, *Mars Exploration Rovers* |
| Distance record (fun fact) | Perseverance passed Opportunity on **October 11, 2026** | NASA, *Mars Exploration Rovers* |

### Note on the dose

0.64 mSv/day × 900 sols ≈ **576 mSv**, that is **≈96% of the 600 mSv career limit**.
That is the figure that makes the mechanic work: on a long mission **there is no room for error**.
In the game the dose bar moves slowly (that is honest), and the **victory screen projects to 900
sols**, which is where the number becomes dramatic and understandable.

---

## 3. What we will NOT say

- ❌ "The panels recharge 25%" → **removed**.
- ❌ "The Martian damages the oxygen system" → **removed**: Michi Marciano is a fictional guide and
  does not change radiation or O₂; those only change from real causes.
- ❌ "Radiation detox area" → **removed**: it does not exist.
- ❌ "Real-time data" for OSDR, RadLab or the Mars climate → those are **historical/archive** and
  are labeled as such.

---

## 4. Provenance labels (used verbatim in the UI)

```
🟢 LIVE REAL DATA   → DONKI (last 30 days)
🔵 REAL ARCHIVE     → OSDR, Mars Trek, MSL-RAD reference dose
⚪ REFERENCE        → NASA science pages (power, dose, light delay)
🔴 GAME MODEL       → the outpost state, the storm, the flare, the astronaut body
```
