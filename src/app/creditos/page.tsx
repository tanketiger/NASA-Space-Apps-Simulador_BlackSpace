import Link from "next/link";
import solarEvent from "@/lib/data/solar-event.json";

export const metadata = { title: "Fuentes y créditos · Aurora" };

export default function Creditos() {
  return <main style={{ maxWidth: 760, margin: "auto", padding: "48px 24px", lineHeight: 1.7 }}>
    <Link href="/" style={{ color: "#e8b576" }}>← Volver al juego</Link>
    <h1 style={{ fontSize: "2rem", marginTop: 24 }}>Fuentes y créditos</h1>
    <p>Esta demo es un juego educativo de ficción, no un simulador de entrenamiento ni un pronóstico de peligros en Marte. Funciona con recursos precargados; no consulta las API durante la partida.</p>
    <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Datos históricos reales</h2>
    <ul style={{ paddingLeft: 20 }}>
      <li><strong>Evento solar DONKI:</strong> eyección de masa coronal {solarEvent.activityID}, registrada el {solarEvent.startTime}. <a href={solarEvent.link} target="_blank" rel="noreferrer" style={{ color: "#e8b576" }}>Consultar registro ↗</a>. El registro no demuestra que la eyección impactara Marte ni determina el daño del juego.</li>
      <li><strong>Ventana:</strong> panorama PIA24921, cráter Jezero, imágenes tomadas en junio de 2022. NASA/JPL-Caltech/ASU/MSSS. <a href="https://images.nasa.gov/details/PIA24921" target="_blank" rel="noreferrer" style={{ color: "#e8b576" }}>Ver ficha ↗</a>.</li>
      <li><strong>Órbita:</strong> mosaico histórico Viking MDIM 2.1 mediante <a href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer" style={{ color: "#e8b576" }}>Mars Trek ↗</a>. La cámara orbital es una composición ficticia.</li>
      <li><strong>Referencia sobre polvo:</strong> en Spirit, la luz que atravesaba el polvo subió del 25 % al 28 % tras una limpieza; la producción cambió de 210 a 240 Wh. <a href="https://science.nasa.gov/photojournal/spirit-solar-panel-on-sol-1813-still-very-dusty/" target="_blank" rel="noreferrer" style={{ color: "#e8b576" }}>PIA11799 ↗</a>. Estos valores no son la fórmula de limpieza del juego.</li>
    </ul>
    <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Qué es ficticio</h2>
    <p>Las cámaras, el reloj acelerado, las barras, el polvo, los tiempos de llegada, el consumo, los daños, la eficacia de las protecciones, el invernadero y el marciano son reglas o representaciones del juego. No son mediciones NASA. La cubierta y el escudo son decisiones narrativas; no representan un diseño validado. La radiación acumulada no se elimina con una desintoxicación.</p>
    <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Uso de IA y audio</h2>
    <p>Se utilizó asistencia de IA para generar y revisar código, estilos y textos. Las imágenes históricas de NASA no se generaron con IA. Los gráficos de la interfaz son composiciones creadas mediante código; los sonidos se sintetizan mediante Web Audio API, sin archivos de audio ni voces generadas por IA.</p>
    <p>No se incluyen logotipos ni identificadores gráficos de NASA en la interfaz del juego. Los enlaces externos requieren conexión; no son necesarios para jugar.</p>
  </main>;
}
