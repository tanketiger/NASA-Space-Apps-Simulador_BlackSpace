# Aurora Outpost: real-time shift demo

## Goal

Web game for kids aged 7 to 12: from a first-person cabin, watch four cameras and reach 06:00 AM
without running out of battery or oxygen. A shift lasts 60 real seconds (10 seconds = 1 shift hour).
You can retry, and there are three sols with increasing difficulty.

## Implemented demo

- **Shift clock:** from 12:00 AM to 06:00 AM, one engine tick per real second. You win at 06:00 AM.
- **Central MARS window:** shows the storm; a dust overlay darkens the landscape and drifts orange
  particles across it, and the cabin vibrates while the shield gate is open during the storm.
- **SHIELD switch (orange):** lowers the armored gate over the window and blocks the storm and the
  flare. Drains extra battery per second.
- **LIGHT switch (yellow):** shines a beam over the window for 3 seconds and then lowers on its own;
  every press updates Michi's diagnosis.
- **CAMERAS switch (blue):** opens the CCTV tablet with four tabs:
  - **CAM 01 · SURFACE** — real orbital tile from NASA Mars Trek, with a CCTV filter and the storm
    state.
  - **CAM 02 · SOLAR PANELS** — dust %, solar transmittance and the CLEAN PANELS button. The
    panels look visibly dirty as dust builds up and visibly clean again right after a cleaning.
  - **CAM 03 · SPACE WEATHER & DOSE** — real CME (live or archive) plus the surface dose.
  - **CAM 04 · GREENHOUSE & SCIENCE** — oxygen and a real OSDR study card.
- **OXYGEN switch (green):** rises for an instant (+25% oxygen, −10% battery).
- **CLEAN PANELS:** instant mechanical cleaning with compressed air (−8% battery, −25 dust points),
  available from the left door and from inside CAM 02.
- **Battery:** every active system (shield, light, cameras) drains power; panel dust adds a small
  extra. If it reaches 0 the shift is lost.
- **CRT:** telemetry monitor with the Sol, the time and “SYSTEMS OK” / “ALERT!”.
- **Michi Marciano:** the fictional guide card (bottom left), with five contextual lines, a
  minimize/expand button and an optional read-aloud voice.
- **Victory screen:** “SOL COMPLETE!” plus the OSDR study unlocked that shift and a didactic
  projection of crew dose over 900 sols versus the 600 mSv career limit.
- **Sounds:** synthesized with the Web Audio API, with a mute option.

## What is real and what is not

The real data shown comes from **two** live sources: the CME records from **NASA DONKI** (CAM 03) and
the studies from **NASA OSDR** (CAM 04 and the victory screen). Both carry a provenance label and a
link, and both fall back to a local copy when there is no internet.

Reference data cited: the surface dose (0.64 mSv/sol, MSL-RAD), the Spirit rover dust case on Sol
1812 (NASA PIA11799), the orbital tile from NASA Mars Trek and the 600 mSv career limit.

Everything about the outpost state, the consumption, the damage, the phases and the timings are
**fictional** rules, not measurements or a validated model. The shift does not predict the weather or
an astronaut's dose. The cameras are illustrations and CSS compositions, not real transmissions. The
gates, the lights and the oxygen pump are narrative mechanisms; their cost and effect are not NASA
values. The difficulty parameters of each sol live in `src/data/mars_sols.json` and are design
decisions.

The "25%" of Spirit refers to the light that got past the dust, not to a universal power recovery.
See source PIA11799, linked in the credits.

## Offline behavior

The game never asks the player for a key. It queries its own `/api/nasa` endpoint; if there is no
internet or the quota runs out, it falls back automatically to local data and marks it as archive or
historical. The links to the sources do require a connection.

## Pending

Selection and verification of additional data (more OSDR studies, RadLab), more sols, playtests with
kids and educational adaptation. None of these is presented as already implemented.
