# APIs: what is used and how it is configured

## Summary

| # | API | Credential needed? | Status | What it is used for |
|---|---|---|---|---|
| 1 | **NASA Open APIs** (`api.nasa.gov`) — DONKI | ❌ No (`DEMO_KEY` works; a key raises the limit) | ✅ live | Space weather: recent CMEs |
| 2 | **OSDR** (`osdr.nasa.gov/osdr/data/search`) | ❌ No | ✅ live | Real health/biology studies |
| 3 | **Mars Trek** (`trek.nasa.gov/tiles/...`) | ❌ No | ✅ live | Real image of Mars |
| 4 | **RadLab** (OSDR dosimetry) | ❌ No (no public API found) | ⚪ reference value | Measured dose (MSL-RAD) |

Everything is served through **one** route handler, `src/app/api/nasa/route.ts`, so the browser
never sees an API key and there is a single cache point (`revalidate = 3600`, i.e. one hour).

---

## 1. NASA Open API key (optional)

`DEMO_KEY` works for demos but is shared and rate-limited (~30 requests/hour). For a hackathon
demo the server caches for an hour, so that is usually enough.

**How to get one (2 minutes):**

1. Go to <https://api.nasa.gov/>
2. Fill in the *"Generate API Key"* form: first name, last name and email.
3. The key appears on screen and arrives by email (something like `AbCdEf123456...`).

**How to configure it:** create a `.env.local` file in the project root with:

```
NASA_API_KEY=your_key_here
```

That file is already in `.gitignore`, so **it is not pushed to GitHub**. The route handler reads it
from the environment (`process.env.NASA_API_KEY`) and falls back to `DEMO_KEY` when it is missing.

> ⚠️ Never commit the key and never put it in client code.

**Limits:** 1,000 requests/hour per key.

---

## 2. DONKI — space weather

The route handler queries recent coronal mass ejections:

```
GET https://api.nasa.gov/DONKI/CME?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=...
```

Notes learned the hard way:

- **`startDate` and `endDate` are required.** A bare call returns `HTTP 400`.
- The handler first tries the **last 30 days**. If there are no events, it falls back to a **real
  archive window** (`2024-05-01` … `2024-05-15`, the May 2024 solar storm).
- If the network or the quota fails, it uses the historical records in `src/data/mars_sols.json`.
- The UI label reflects the source: **“Live real data · NASA DONKI”** vs **“Historical record ·
  NASA DONKI”**.

The fields extracted per event are `activityID`, `startTime` and the measured `speed` (km/s).

---

## 3. OSDR — no credential needed

Its search API is open:

```
GET https://osdr.nasa.gov/osdr/data/search?term=radiation&size=6
```

It returns real studies with accessions such as `OSD-73`, `OSD-489` and `OSD-158`. Their public
page is `https://osdr.nasa.gov/bio/repo/data/studies/<ACCESSION>` (note the `/bio/repo/data/`
prefix: `/bio/studies/<ACCESSION>` returns 404).

**Note:** OSDR blocks CORS, so the query is made from the server. It also returns non-`OSD-`
records (for example metagenome accessions), so the handler filters to `/^OSD-\d+/`.

---

## 4. Mars Trek — no credential needed

The tiles respond with open CORS:

```
https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{x}/{y}.jpg
```

The game uses one public tile for CAM 01 (surface) and labels it **“Real image of Mars · Mars Trek
(archive)”**.

---

## 5. RadLab — reference value only

No public RadLab endpoint was found, so the game does **not** invent one. It uses the real
reference value from the RAD instrument on Curiosity (MSL-RAD): **0.64 mSv/sol**, labeled
**“Real measured dose · RadLab / MSL-RAD”**.

If a real endpoint appears later, only the adapter in `src/lib/game/nasa.ts` needs to change.

---

## 6. Environment variables

```env
NASA_API_KEY=...   # optional; DEMO_KEY is used when it is missing
```

No other variable is required. The game always works offline thanks to the local fallback.
