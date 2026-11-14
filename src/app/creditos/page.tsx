import Link from "next/link";

export const metadata = { title: "Creditos y procedencia · AURORA" };

const SOURCES = [
  {
    name: "NASA DONKI",
    kind: "Datos reales en vivo",
    use: "Clima espacial: CME, erupciones, tormentas geomagneticas y particulas solares.",
    url: "https://api.nasa.gov/",
  },
  {
    name: "NASA OSDR",
    kind: "Archivo real",
    use: "Estudios de biologia espacial y salud de astronautas (cartas de ciencia).",
    url: "https://osdr.nasa.gov/",
  },
  {
    name: "NASA Mars Trek",
    kind: "Archivo real",
    use: "Mosaico e imagenes reales de la superficie de Marte.",
    url: "https://trek.nasa.gov/mars/",
  },
  {
    name: "NASA Image and Video Library",
    kind: "Archivo real",
    use: "Fotografias reales de misiones para las ventanas del habitat.",
    url: "https://images.nasa.gov/",
  },
  {
    name: "MSL/RAD (Hassler et al., 2014)",
    kind: "Referencia cientifica",
    use: "Tasa de dosis en superficie: 0,21 mGy/dia y 0,64 mSv/dia.",
    url: "https://science.nasa.gov/resource/radiation-measurements-on-mars/",
  },
  {
    name: "Mars Rover Power (NASA)",
    kind: "Referencia",
    use: "Potencia del MMRTG (100 W) y contexto de energia solar en Marte.",
    url: "https://science.nasa.gov/resource/mars-rover-power/",
  },
];

export default function Creditos() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="micro hover:text-dust">
        ← Volver a la base
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Creditos y procedencia</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        AURORA es un proyecto educativo. El ambiente que simula viene de datos reales de la NASA;
        el cuerpo de la tripulacion es un modelo del juego. Nada de lo que ves se presenta como un
        dato que no sea.
      </p>

      <h2 className="mt-8 micro">Fuentes de datos</h2>
      <ul className="mt-3 space-y-3">
        {SOURCES.map((s) => (
          <li key={s.name} className="panel p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-dust">
                {s.name} ↗
              </a>
              <span className="micro !text-[9px]">{s.kind}</span>
            </div>
            <p className="mt-1 text-[11.5px] leading-snug text-muted">{s.use}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 micro">Uso de inteligencia artificial</h2>
      <div className="panel mt-3 p-4 text-[12px] leading-relaxed text-muted">
        <p>
          <span className="text-ink">Imagenes y video:</span> no se genero ningun recurso visual con IA.
          Todas las imagenes son fotografias reales de misiones de la NASA o graficos SVG propios.
        </p>
        <p className="mt-2">
          <span className="text-ink">Codigo y textos:</span> se uso asistencia de IA para redactar
          documentacion y para revisar el codigo. El motor de simulacion, sus constantes y sus fuentes
          son verificables en <code className="num">docs/DATOS-VERIFICADOS.md</code>.
        </p>
        <p className="mt-2">
          <span className="text-ink">Audio:</span> el prototipo no incluye audio.
        </p>
      </div>

      <h2 className="mt-8 micro">Marcas</h2>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        Este proyecto no utiliza logos, banderas, parches ni identificadores de mision de la NASA.
        AURORA es una identidad propia. Los nombres de misiones y organismos se mencionan solo como
        referencia cientifica.
      </p>

      <p className="mt-8 text-[10px] text-muted">
        Los datos historicos se etiquetan como historicos. Los datos en vivo se etiquetan como en vivo.
      </p>
    </main>
  );
}
