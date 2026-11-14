import { NextResponse } from "next/server";
import osdrJson from "@/lib/data/snapshots/osdr-studies.json";
import type { Study } from "@/lib/sim/types";

export const revalidate = 86400;

const SNAPSHOT = osdrJson as unknown as { studies: Study[]; fetchedAt: string };

/**
 * Busca estudios reales en OSDR.
 * Su API bloquea CORS, por eso esta consulta vive en el servidor.
 */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q") ?? "radiation";

  try {
    const res = await fetch(
      `https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(term)}&size=8`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error(`OSDR ${res.status}`);

    const json = (await res.json()) as {
      hits?: { hits?: { _source?: Record<string, unknown> }[] };
    };

    const studies: Study[] = (json.hits?.hits ?? [])
      .map((hit) => {
        const s = (hit._source ?? {}) as Record<string, unknown>;
        const accession = String(s.Accession ?? "");
        return {
          accession,
          title: String(s["Project Title"] ?? s["Study Title"] ?? accession),
          organism: Array.isArray(s.organism) ? s.organism.join(", ") : "",
          description: String(s["Study Description"] ?? "").slice(0, 300),
          url: `https://osdr.nasa.gov/bio/studies/${accession}`,
          tag: term,
        };
      })
      .filter((s) => s.accession && s.title);

    return NextResponse.json({ studies, fetchedAt: new Date().toISOString(), fallback: false });
  } catch (error) {
    return NextResponse.json({
      ...SNAPSHOT,
      fallback: true,
      reason: error instanceof Error ? error.message : "OSDR no disponible",
    });
  }
}
