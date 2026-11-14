import { NextResponse } from "next/server";
import vivoJson from "@/lib/data/snapshots/weather-vivo.json";
import tormentaJson from "@/lib/data/snapshots/weather-tormenta.json";
import { fetchWindow, liveStart } from "@/lib/nasa/donki";

export const revalidate = 600;

const SNAPSHOTS = {
  vivo: vivoJson as unknown as { days: unknown[]; mode: string; fetchedAt: string | null },
  tormenta: tormentaJson as unknown as { days: unknown[]; mode: string; fetchedAt: string | null },
};

/**
 * Clima espacial real.
 * - scenario=vivo      → últimos 10 días (EN VIVO)
 * - scenario=tormenta  → 2024-05-08 (ARCHIVO REAL)
 * Si la API falla o DATA_MODE=historico, devuelve el snapshot real y lo marca.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario") === "tormenta" ? "tormenta" : "vivo";
  const forceHistorical = process.env.DATA_MODE === "historico";

  if (forceHistorical) {
    return NextResponse.json({
      ...SNAPSHOTS[scenario],
      scenario,
      fallback: true,
      reason: "DATA_MODE=historico",
    });
  }

  try {
    const start = scenario === "vivo" ? liveStart(10) : "2024-05-08";
    const mode = scenario === "vivo" ? "live" : "archive";
    const data = await fetchWindow(start, 10, mode);
    return NextResponse.json({ ...data, scenario, fallback: false });
  } catch (error) {
    return NextResponse.json({
      ...SNAPSHOTS[scenario],
      scenario,
      fallback: true,
      reason: error instanceof Error ? error.message : "API no disponible",
    });
  }
}
