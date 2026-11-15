import Link from "next/link";
import { SOLS } from "@/lib/game/sols";

export const metadata = { title: "Sources and credits · Aurora Outpost" };

export default function Creditos() {
  return (
    <main style={{ maxWidth: 760, margin: "auto", padding: "48px 24px", lineHeight: 1.7, color: "#1f2937" }}>
      <Link href="/" style={{ color: "#0ea5e9" }}>← Back to the game</Link>
      <h1 style={{ fontSize: "2rem", marginTop: 24 }}>Sources and credits</h1>
      <p>
        Aurora Outpost is a fiction game for kids aged 7 to 12, inspired by shift-based watch games. It is
        not a training simulator or a prediction tool. The gameplay (storm, flare, battery, oxygen) are
        design rules; NASA data is only cited as reference and always with its provenance label on screen.
      </p>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Real data that is queried</h2>
      <p>
        The game asks its own endpoint (<code>/api/nasa</code>) for two sets of real data. If there is no
        internet or the quota runs out, a local fallback is used automatically and is marked as
        <em> archive</em> or <em> historical</em>, never as live data:
      </p>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <strong>NASA DONKI (space weather):</strong> recent coronal mass ejections (CMEs), with their
          identifier, date and measured speed (<code>api.nasa.gov/DONKI</code>). They are shown on camera 03
          with the label “Live real data · NASA DONKI” or “Historical record · NASA DONKI”.
        </li>
        <li>
          <strong>NASA OSDR (radiation and biology):</strong> real studies (accessions <code>OSD-xxx</code>)
          from the Open Science Data Repository (<code>osdr.nasa.gov</code>), which need no key. They are
          shown on camera 04 and on the victory screen with the label “Real study · NASA OSDR”.
        </li>
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Reference data cited</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <strong>Surface radiation dose:</strong> ~0.64 mSv per sol, taken from the RAD instrument on the
          Curiosity rover (MSL-RAD). Label: “Real measured dose · RadLab / MSL-RAD”.
        </li>
        <li>
          <strong>Dust on the solar panels:</strong> the game cites the Spirit rover case on Sol 1812, when
          dust reduced the light reaching the panels (NASA PIA11799). Label: “Game model · NASA PIA11799
          reference”.
        </li>
        <li>
          <strong>Image of Mars:</strong> camera 01 uses a public orbital tile from NASA Mars Trek
          (<code>trek.nasa.gov</code>). Label: “Real image of Mars · Mars Trek (archive)”.
        </li>
        <li>
          <strong>Career limit:</strong> the didactic projection on the victory screen compares the dose
          accumulated over 900 sols with the 600 mSv reference limit. Label: “Reference data · NASA”.
        </li>
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Historical DONKI data used as fallback</h2>
      <p>
        If the live query fails, each sol cites a real DONKI record. It is only a historical reference; it
        does not set the game&apos;s flare level and does not prove that the ejection reached Mars.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {SOLS.map((sol) => (
          <li key={sol.sol}>
            <strong>{sol.label}:</strong> {sol.historicalEvent.activityID} ({sol.historicalEvent.date}
            {sol.historicalEvent.speedKmS ? `, ${sol.historicalEvent.speedKmS} km/s` : ""}).{" "}
            <a href={sol.historicalEvent.link} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9" }}>
              View record ↗
            </a>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>What is fictional</h2>
      <p>
        The 60-second clock, the dust storm, the flare level, the battery and oxygen drain, the gates, the
        lights, the camera monitor, the greenhouse and the mini-rover are design rules and scenes, not NASA
        measurements or forecasts. The difficulty parameters of each sol (in{" "}
        <code>src/data/mars_sols.json</code>) are design decisions too.
      </p>
      <p>
        <strong>Michi Marciano</strong> is a fictional character created for the game: he is not a real
        assistant or a scientist, and his advice is part of the game mechanics. That is why he always carries
        the label “FICTION · GAME GUIDE” and, when he cites a datum, he says whether it is real, reference
        data or a game rule.
      </p>

      <h2 style={{ marginTop: 28, fontSize: "1.3rem" }}>Art, sound and AI</h2>
      <p>
        Most of the artwork is vector graphics (SVG) and CSS created for this project. The guide&apos;s
        portrait “Michi Marciano” (<code>public/images/michi_guia.png</code>) is an image generated with
        artificial intelligence from a text description, and it is identified as such. Sounds are synthesized
        on the fly with the Web Audio API: there are no audio files. The optional read-aloud uses the
        browser&apos;s own speech synthesis (<code>speechSynthesis</code>). AI assistance was also used to
        write and review code, styles and text.
      </p>
      <p>The interface includes no NASA logos or graphic identifiers.</p>
    </main>
  );
}
