import { NextResponse } from "next/server";

export const revalidate = 86400;

interface NasaImageItem {
  href?: string;
  links?: { href?: string }[];
  data?: { title?: string; nasa_id?: string; date_created?: string }[];
}

/**
 * Imagenes reales de la NASA (NASA Image and Video Library).
 * CORS esta abierto, pero cacheamos en el servidor para no golpear la API.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "mars surface";
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error(`NASA Images ${res.status}`);
    const json = (await res.json()) as { collection?: { items?: NasaImageItem[] } };
    const items = (json.collection?.items ?? [])
      .filter((i) => i.links?.[0]?.href)
      .slice(0, 12)
      .map((i) => ({
        href: i.links?.[0]?.href,
        title: i.data?.[0]?.title ?? q,
        nasaId: i.data?.[0]?.nasa_id ?? "",
        date: i.data?.[0]?.date_created ?? "",
      }));
    return NextResponse.json({ items, query: q });
  } catch (error) {
    return NextResponse.json({
      items: [],
      reason: error instanceof Error ? error.message : "NASA Images no disponible",
    });
  }
}
