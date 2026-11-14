import { NextResponse } from "next/server";

export const revalidate = 3600;

/**
 * RadLab (dosimetria de OSDR).
 *
 * No hay endpoint publico documentado, asi que el adaptador es configurable:
 * si RADLAB_BASE_URL existe, se consulta; si no, devolvemos el valor de
 * referencia real de MSL/RAD y lo marcamos como tal. Nunca inventamos una
 * lectura: o es medida, o es referencia citada.
 */
export async function GET() {
  const base = process.env.RADLAB_BASE_URL;

  if (!base) {
    return NextResponse.json({
      available: false,
      source: "reference",
      sourceLabel: "Referencia NASA MSL/RAD (Hassler et al., 2014)",
      absorbedDoseRateMGyDay: 0.21,
      doseEquivalentRateMsvDay: 0.64,
      uncertaintyMsvDay: 0.12,
      note: "Configura RADLAB_BASE_URL para usar mediciones reales de RadLab.",
    });
  }

  try {
    const res = await fetch(base, {
      headers: process.env.RADLAB_API_KEY ? { Authorization: `Bearer ${process.env.RADLAB_API_KEY}` } : {},
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`RadLab ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ available: true, source: "archive", sourceLabel: "RadLab · OSDR", data });
  } catch (error) {
    return NextResponse.json({
      available: false,
      source: "reference",
      sourceLabel: "Referencia NASA MSL/RAD (Hassler et al., 2014)",
      absorbedDoseRateMGyDay: 0.21,
      doseEquivalentRateMsvDay: 0.64,
      uncertaintyMsvDay: 0.12,
      reason: error instanceof Error ? error.message : "RadLab no disponible",
    });
  }
}
