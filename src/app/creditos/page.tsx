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
        Funciona con datos precargados: no pide claves ni consulta ninguna API durante la partida.
      </p>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Dato histórico real</h2>
      <p>
        Cada sol muestra, en la cámara 03, un registro real de una eyección de masa coronal observada por
        el instrumento DONKI de la NASA (<code>api.nasa.gov/DONKI</code>). Es solo una referencia histórica
        citada en pantalla; no determina el nivel de la llamarada del juego ni demuestra que esa eyección
        haya llegado a Marte.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {SOLS.map((sol) => (
          <li key={sol.sol}>
            <strong>{sol.label}:</strong> {sol.historicalEvent.activityID} ({sol.historicalEvent.date}).{" "}
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

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Arte, sonido e IA</h2>
      <p>
        Todas las ilustraciones son gráficos vectoriales (SVG) y CSS creados para este proyecto; no se
        generaron imágenes con inteligencia artificial. Los sonidos se sintetizan en el momento con la
        Web Audio API: no hay archivos de audio ni voces grabadas o generadas por IA. Se usó asistencia de
        IA para escribir y revisar código, estilos y textos de esta página.
      </p>
      <p>La interfaz no incluye logotipos ni identificadores gráficos de la NASA.</p>
    </main>
  );
}
