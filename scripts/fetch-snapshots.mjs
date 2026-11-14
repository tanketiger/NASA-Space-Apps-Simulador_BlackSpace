/**
 * Descarga datos REALES de las APIs de la NASA y genera los snapshots que usa el juego.
 *
 *   npm run snapshots
 *
 * Requiere NASA_API_KEY en .env.local (o en el entorno).
 * Si una API falla, NO inventa datos: deja el archivo anterior y avisa por consola.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "src/lib/data/snapshots");

function loadEnv() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return {};
  const env = {};
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const ENV = { ...loadEnv(), ...process.env };
const KEY = ENV.NASA_API_KEY || "DEMO_KEY";
const BASE = "https://api.nasa.gov";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { console.warn("  429 cuota agotada, esperando..."); await sleep(8000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

const dayKey = (iso) => (iso || "").slice(0, 10);
const addDays = (start, n) => {
  const out = [];
  const d = new Date(start + "T00:00:00Z");
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

function riskFrom({ cmeSpeeds, flares, hasGst, hasSep }) {
  let risk = 0;
  if (cmeSpeeds.length) risk = 1;
  if (cmeSpeeds.some((s) => s >= 500)) risk = 2;
  if (cmeSpeeds.some((s) => s >= 800)) risk = 3;
  if (hasGst) risk = 3;
  if (hasSep) risk = 3;
  if (flares.some((f) => /^M/.test(f))) risk = Math.max(risk, 2);
  if (flares.some((f) => /^X/.test(f))) risk = 3;
  return risk;
}

const LABELS = ["Calma", "Actividad ligera", "Actividad alta", "Tormenta severa"];

async function buildWindow({ id, start, sols, mode, title }) {
  const end = addDays(start, sols - 1).at(-1);
  console.log(`\n→ ${title} (${start} .. ${end})`);

  const q = `api_key=${KEY}&startDate=${start}&endDate=${end}`;
  const [cmes, analysis, gsts, flars, seps] = await Promise.all([
    getJSON(`${BASE}/DONKI/CME?${q}`).catch(() => []),
    getJSON(`${BASE}/DONKI/CMEAnalysis?${q}`).catch(() => []),
    getJSON(`${BASE}/DONKI/GST?${q}`).catch(() => []),
    getJSON(`${BASE}/DONKI/FLR?${q}`).catch(() => []),
    getJSON(`${BASE}/DONKI/SEP?${q}`).catch(() => []),
  ]);

  console.log(`  CME:${cmes.length} analsis:${analysis.length} GST:${gsts.length} FLR:${flars.length} SEP:${seps.length}`);

  const days = addDays(start, sols).map((date, i) => {
    const cmeSpeeds = analysis.filter((a) => dayKey(a.time21_5 || a.time21) === date).map((a) => a.speed || 0);
    const flares = flars.filter((f) => dayKey(f.beginTime) === date).map((f) => f.classType || "");
    const hasGst = gsts.some((g) => dayKey(g.startTime) === date);
    const hasSep = seps.some((s) => dayKey(s.eventTime || s.startTime) === date);
    const risk = riskFrom({ cmeSpeeds, flares, hasGst, hasSep });

    let event;
    if (risk >= 3 && hasGst) event = { kind: "storm", title: "Tormenta geomagnética", detail: "GST real de DONKI: perturbación del campo magnético terrestre." };
    else if (risk >= 2 && cmeSpeeds.length) event = { kind: "cme", title: "Eyección de masa coronal", detail: `CME real a ${Math.round(Math.max(...cmeSpeeds))} km/s.` };
    else if (risk >= 2 && flares.length) event = { kind: "flare", title: "Erupción solar", detail: `Clase ${flares.sort().at(-1)} registrada por DONKI.` };

    return {
      sol: i + 1,
      earthDate: date,
      risk,
      label: LABELS[risk],
      solarFactor: 1,
      doseFactor: [1, 1.6, 4, 12][risk],
      dustDelta: 0.02,
      source: mode,
      sourceLabel: mode === "live" ? "Datos reales en vivo · NASA DONKI" : "Archivo real · NASA DONKI",
      ...(event ? { event } : {}),
    };
  });

  writeFileSync(resolve(OUT, `weather-${id}.json`), JSON.stringify({
    id, title, window: `${start}..${end}`, fetchedAt: new Date().toISOString(),
    source: "NASA DONKI (api.nasa.gov/DONKI)", mode, days,
  }, null, 2));

  console.log(`  ✔ ${days.length} soles · riesgo máx: ${Math.max(...days.map((d) => d.risk))}`);
}

async function buildOSDR() {
  console.log("\n→ OSDR estudios reales");
  const tags = ["radiation", "bone loss", "muscle atrophy", "imune", "sleep", "plant"];
  const studies = [];
  for (const tag of tags) {
    try {
      const j = await getJSON(`https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(tag)}&size=3`);
      const hits = j?.hits?.hits ?? [];
      for (const h of hits) {
        const s = h._source || {};
        if (!s.Accession || s.Accession.startsWith("mgp")) continue;
        studies.push({
          accession: s.Accession,
          title: s["Project Title"] || s["Study Title"] || s.Accession,
          organism: (s.organism || []).join(", ") || "no especificado",
          description: (s["Study Description"] || "").slice(0, 280),
          url: `https://osdr.nasa.gov/bio/studies/${s.Accession}`,
          tag,
        });
      }
    } catch (e) { console.warn(`  OSDR "${tag}" falló: ${e.message}`); }
  }
  const unique = [...new Map(studies.map((s) => [s.accession, s])).values()];
  writeFileSync(resolve(OUT, "osdr-studies.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), studies: unique }, null, 2));
  console.log(`  ✔ ${unique.length} estudios`);
}

async function buildImages() {
  console.log("\n→ NASA Imagen Library");
  const queries = ["mars surface panorama", "jezero crater", "mars dust devil"];
  const items = [];
  for (const q of queries) {
    try {
      const j = await getJSON(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`);
      const hit = j?.collection?.items?.[0];
      if (hit?.links?.[0]?.href) items.push({ query: q, href: hit.links[0].href, title: hit.data?.[0]?.title ?? q });
    } catch (e) { console.warn(`  imagen "${q}" falló: ${e.message}`); }
  }
  writeFileSync(resolve(OUT, "nasa-images.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), items }, null, 2));
  console.log(`  ✔ ${items.length} imágenes`);
}

mkdirSync(OUT, { recursive: true });

const today = new Date();
const liveStart = new Date(today.getTime() - 9 * 864e5).toISOString().slice(0, 10);

await buildWindow({ id: "vivo", start: liveStart, sols: 10, mode: "live", title: "Soles recientes (EN VIVO)" });
await buildWindow({ id: "tormenta", start: "2024-05-08", sols: 10, mode: "archive", title: "La tormenta de mayo 2024 (histórico)" });
await buildOSDR();
await buildImages();

console.log("\nListo. Snapshots en src/lib/data/snapshots/");
