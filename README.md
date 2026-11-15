# Aurora Outpost · Your first shift on Mars

Web game for kids aged 7 to 12, inspired by shift-based watch games. From a first-person cabin, raise the shield in time, watch four cameras and survive until 06:00 AM. A shift lasts 60 seconds. No account or download needed, and it works even with no internet (it uses a local fallback).

## Run it

In PowerShell, from this folder:

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>. To verify the demo:

```powershell
npm test
npm run build
```

If OneDrive throws an `EINVAL` error with the `.next` cache, pick a fresh build folder before starting:

```powershell
$env:NEXT_DIST_DIR = ".next-aurora-dev"
npm run dev -- -p 3217
```

In that case open <http://localhost:3217>. Use a different folder name if that cache also has problems.

## How to play

- **Bars (left):** battery (green), oxygen (orange) and integrity (cyan). They drain in real time.
- **SHIELD (orange switch):** raise it to lower the armored gate over the MARS window and block the storm and the flare. It drains extra battery per second.
- **LIGHT (yellow switch):** shines a beam over the window for 3 seconds, then lowers on its own. Use it to see if there is dust in the air; every press updates Michi's diagnosis.
- **CAMERAS (blue switch):** opens the CCTV tablet with 4 tabs (Surface, Solar Panels, Space Weather & Dose, Greenhouse & Science). Closing it lowers the switch.
- **OXYGEN (green switch):** rises for an instant (+25% oxygen, −10% battery) and lowers on its own.
- **CLEAN PANELS (left door or a button inside CAM 02):** instant mechanical cleaning with compressed air: −8% battery and −25 dust points. If there is not enough battery, it warns you. In CAM 02 the panels look visibly dirty as dust builds up and look clean and glossy again right after a cleaning.
- **CRT (right):** shows the SOL, the time (12:00 AM → 06:00 AM) and “SYSTEMS OK” / “ALERT!”. Raise the shield when it shows ALERT.
- **Battery:** every active system (shield, light, cameras) drains power. Turn them off when you do not need them.
- **Michi Marciano (bottom left):** the game guide (fiction). You can minimize it with the `?` button and read it aloud with the 🔊 button.

## Structure

- `src/app/page.tsx`: the whole first-person game (background `cabina.jpg`, switches, bars, CRT, 4-camera CCTV tablet, panel cleaning, Michi Marciano).
- `src/app/api/nasa/route.ts`: own endpoint with the real NASA data (DONKI + OSDR) and a local fallback (`revalidate = 3600`).
- `src/lib/game/nasa.ts`: types, reference physical constants and real fallbacks for the NASA feed.
- `src/lib/game/engine.ts`: shift types and rules (clock, battery, oxygen, storm, flare).
- `src/lib/game/sound.ts`: effects synthesized with the Web Audio API.
- `src/lib/game/sols.ts`: reads the preloaded sols.
- `src/data/mars_sols.json`: data for each sol, including the real historical NASA DONKI record.
- `public/images/michi_guia.png`: the guide's portrait, generated with AI.
- `src/app/creditos/`: sources, fiction notices and AI disclosure.

## Data and transparency

The game queries two real sources through its own endpoint `/api/nasa`. If there is no internet or the quota runs out, it falls back automatically to a local copy and marks it as archive or historical (never as live data):

- **NASA DONKI** (space weather): recent coronal mass ejections with their identifier, date and measured speed. Shown on camera 03 with the label “Live real data · NASA DONKI” or “Historical record · NASA DONKI”.
- **NASA OSDR** (radiation and biology): real `OSD-xxx` studies. Shown on camera 04 and on the victory screen with the label “Real study · NASA OSDR”.

Reference data cited: the surface dose (~0.64 mSv/sol, MSL-RAD), the Spirit rover dust case on Sol 1812 (NASA PIA11799), the orbital tile from NASA Mars Trek and the 600 mSv career limit.

**The rules are fictional:** the 60-second clock, the dust storm, the flare level, the battery and oxygen drain, the shield, the lights, the cameras, the panel cleaning, the dust and the mini-rover are design rules and scenes, not NASA measurements or forecasts. Michi Marciano is a fictional character. The app is not a training or safety tool. Details and sources are at `/creditos`.

## AI

The code, styles and text were created with AI assistance. Most of the artwork is vector graphics (SVG) and CSS; Michi's portrait (`public/images/michi_guia.png`) is an AI-generated image and is identified as such. Sounds are synthesized in code with the Web Audio API (there are no audio files); the optional read-aloud uses the browser's speech synthesis. The interface uses no NASA logos or graphic identifiers.
