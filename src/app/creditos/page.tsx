import Link from "next/link";
import { SOLS } from "@/lib/game/sols";

export const metadata = { title: "Fuentes y créditos · Aurora Outpost" };

export default function Creditos() {
  return (
    <main style={{ maxWidth: 760, margin: "auto", padding: "48px 24px", lineHeight: 1.7, color: "#1f2937" }}>
      <Link href="/" style={{ color: "#0ea5e9" }}>← Volver al juego</Link>
      <h1 style={{ fontSize: "2rem", marginTop: 24 }}>Fuentes y créditos</h1>
      <p>
        Aurora Outpost es un juego de ficción para niños de 7 a 12 años, inspirado en los juegos de
        vigilancia por turnos. No es un simulador de entrenamiento ni una herramienta de predicción.
        La jugabilidad (tormenta, llamarada, batería, oxígeno) son reglas de diseño; los datos de la
        NASA solo se citan como referencia y siempre con su etiqueta de procedencia en pantalla.
      </p>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Datos reales que se consultan</h2>
      <p>
        El juego pide a un endpoint propio (<code>/api/nasa</code>) dos conjuntos de datos reales. Si no hay
        internet o se agota la cuota, se usa automáticamente un respaldo local y se marca como
        <em> archivo</em> o <em>histórico</em>, nunca como dato en vivo:
      </p>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <strong>NASA DONKI (clima espacial):</strong> eyecciones de masa coronal (CME) recientes, con su
          identificador, fecha y velocidad medida (<code>api.nasa.gov/DONKI</code>). Se muestran en la
          cámara 03 con la etiqueta «Datos reales en vivo · NASA DONKI» o «Registro histórico · NASA DONKI».
        </li>
        <li>
          <strong>NASA OSDR (radiación y biología):</strong> estudios reales (accesiones <code>OSD-xxx</code>)
          del Open Science Data Repository (<code>osdr.nasa.gov</code>), que no requieren clave. Se muestran
          en la cámara 04 y en la pantalla de victoria con la etiqueta «Estudio real · NASA OSDR».
        </li>
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Datos de referencia citados</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <strong>Dosis de radiación en superficie:</strong> ~0,64 mSv por sol, tomada del instrumento RAD
          del rover Curiosity (MSL-RAD). Etiqueta: «Dosis medida real · RadLab / MSL-RAD».
        </li>
        <li>
          <strong>Polvo en los paneles solares:</strong> se cita el caso del rover Spirit en el Sol 1812,
          cuando el polvo redujo la luz que llegaba a los paneles (NASA PIA11799). Etiqueta: «Modelo del
          juego · referencia NASA PIA11799».
        </li>
        <li>
          <strong>Imagen de Marte:</strong> la cámara 01 usa una tesela orbital pública de NASA Mars Trek
          (<code>trek.nasa.gov</code>). Etiqueta: «Imagen real de Marte · Mars Trek (archivo)».
        </li>
        <li>
          <strong>Límite de carrera:</strong> la proyección didáctica de la pantalla de victoria compara la
          dosis acumulada en 900 soles con el límite de referencia de 600 mSv. Etiqueta: «Dato de referencia ·
          NASA».
        </li>
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Datos históricos de DONKI usados como respaldo</h2>
      <p>
        Si la consulta en vivo falla, cada sol cita un registro real de DONKI. Es solo una referencia
        histórica; no determina el nivel de la llamarada del juego ni demuestra que esa eyección haya
        llegado a Marte.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {SOLS.map((sol) => (
          <li key={sol.sol}>
            <strong>{sol.label}:</strong> {sol.historicalEvent.activityID} ({sol.historicalEvent.date}
            {sol.historicalEvent.speedKmS ? `, ${sol.historicalEvent.speedKmS} km/s` : ""}).{" "}
            <a href={sol.historicalEvent.link} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9" }}>
              Consultar registro ↗
            </a>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Qué es ficticio</h2>
      <p>
        El reloj de 60 segundos, la tormenta de polvo, el nivel de la llamarada, el consumo de batería y
        oxígeno, las compuertas, las luces, el monitor de cámaras, el invernadero y el mini-rover son reglas
        y escenas de diseño del juego, no mediciones ni pronósticos de la NASA. Los parámetros de dificultad
        de cada sol (en <code>src/data/mars_sols.json</code>) también son decisiones de diseño.
      </p>
      <p>
        <strong>Michi Marciano</strong> es un personaje de ficción creado para el juego: no es un
        asistente real ni un científico, y sus consejos son parte de la mecánica del juego. Por eso lleva
        siempre la etiqueta «FICCIÓN · GUÍA DEL JUEGO» y, cuando cita un dato, indica si es real, de
        referencia o una regla del juego.
      </p>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Arte, sonido e IA</h2>
      <p>
        La mayoría de las ilustraciones son gráficos vectoriales (SVG) y CSS creados para este proyecto. El
        retrato del guía «Michi Marciano» (<code>public/images/michi_guia.png</code>) es una imagen generada
        con inteligencia artificial a partir de una descripción de texto, y se identifica como tal. Los
        sonidos se sintetizan en el momento con la Web Audio API: no hay archivos de audio. La lectura en voz
        alta opcional usa la síntesis de voz del propio navegador (<code>speechSynthesis</code>). También se
        usó asistencia de IA para escribir y revisar código, estilos y textos.
      </p>
      <p>La interfaz no incluye logotipos ni identificadores gráficos de la NASA.</p>
    </main>
  );
}
