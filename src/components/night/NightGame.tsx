"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Camera, Check, CircleHelp, Gauge, Moon, Pause, Play, Radio, RefreshCw, Shield, Sun, Volume2, VolumeX, Wind, X, Zap } from "lucide-react";
import { clean, clock, initialNight, threatAt, tick, usage, type Camera as CameraId, type Night } from "@/lib/night/engine";
import solarEvent from "@/lib/data/solar-event.json";
import "./night.css";

const CAMERAS = [
  { id: 1, name: "Horizonte norte", short: "HORIZONTE" },
  { id: 2, name: "Campo solar", short: "PANELES" },
  { id: 3, name: "Sensor solar", short: "ÓRBITA" },
  { id: 4, name: "Invernadero", short: "VITALES" },
] as const;

function level(value: number) { return Math.max(0, Math.min(100, value)); }

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="night-meter">
    <div className="meter-title"><span>{label}</span><strong>{Math.ceil(value)}<small>%</small></strong></div>
    <div className="meter-track"><span style={{ width: `${level(value)}%`, background: color }} /></div>
  </div>;
}

function sourceSound(context: AudioContext, kind: "button" | "camera" | "alarm") {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  osc.type = kind === "alarm" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(kind === "camera" ? 690 : kind === "alarm" ? 420 : 180, now);
  osc.frequency.exponentialRampToValueAtTime(kind === "button" ? 90 : 530, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain); gain.connect(context.destination); osc.start(now); osc.stop(now + 0.17);
}

function CameraView({ game, onClean }: { game: Night; onClean: () => void }) {
  const dust = threatAt(game.elapsed, "dust");
  const solar = threatAt(game.elapsed, "solar");
  const stageText = { lejos: "A LO LEJOS", cerca: "ACERCÁNDOSE", inminente: "IMPACTO INMINENTE", impacto: "IMPACTO" };
  return <div className={`camera-picture camera-${game.camera}`}>
    {game.camera === 1 && <>
      <div className="cam-landscape" />
      {dust && <div className={`dust-cloud dust-${dust}`} aria-hidden="true" />}
      <div className="cam-caption"><Wind size={17} /> {dust ? `POLVO · ${stageText[dust]}` : "HORIZONTE DESPEJADO"}</div>
    </>}
    {game.camera === 2 && <>
      <div className="cam-panels"><div /><div /><div /></div>
      <div className="camera-info"><span>POLVO ACUMULADO</span><strong>{Math.ceil(game.dust)}%</strong><button onClick={onClean} disabled={game.battery < 8 || game.dust <= 0}>LIMPIAR · −8% BATERÍA</button></div>
    </>}
    {game.camera === 3 && <>
      <div className="cam-orbit" />
      <div className="solar-orb"><Sun size={42} /></div>
      <div className="cam-caption"><Radio size={17} /> {solar ? `EVENTO SOLAR · ${stageText[solar]}` : "SENSOR EN VIGILANCIA"}</div>
      <div className="camera-source">REGISTRO HISTÓRICO · DONKI<br />{solarEvent.startTime} · {solarEvent.activityID}</div>
    </>}
    {game.camera === 4 && <>
      <div className="greenhouse"><span>✳</span><span>✳</span><span>✳</span><span>✳</span><span>✳</span></div>
      <div className="camera-info"><span>OXÍGENO DE LA BASE</span><strong>{Math.ceil(game.oxygen)}%</strong><p>LECTURA DEL JUEGO</p></div>
    </>}
    <div className="scanlines" aria-hidden="true" />
    <div className="cam-corners" aria-hidden="true" />
  </div>;
}

export default function NightGame() {
  const [game, setGame] = useState<Night>(initialNight);
  const [help, setHelp] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const sound = useRef<AudioContext | null>(null);
  const lastTick = useRef(0);
  const lastAlert = useRef("");

  function beep(kind: "button" | "camera" | "alarm") {
    if (!soundOn) return;
    try {
      sound.current ??= new AudioContext();
      if (sound.current.state === "suspended") void sound.current.resume();
      sourceSound(sound.current, kind);
    } catch { /* El juego sigue funcionando sin audio. */ }
  }

  useEffect(() => {
    if (game.phase !== "playing" || paused || help) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const steps = Math.min(60, Math.floor((Date.now() - lastTick.current) / 1000));
      if (steps <= 0) return;
      lastTick.current += steps * 1000;
      setGame((previous) => {
        let next = previous;
        for (let i = 0; i < steps && next.phase === "playing"; i++) next = tick(next);
        return next;
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [game.phase, paused, help]);

  useEffect(() => {
    const alert = threatAt(game.elapsed, "dust") === "inminente" ? "dust" : threatAt(game.elapsed, "solar") === "inminente" ? "solar" : "";
    if (alert && alert !== lastAlert.current && sound.current && soundOn) sourceSound(sound.current, "alarm");
    lastAlert.current = alert;
  }, [game.elapsed, soundOn]);

  useEffect(() => () => { if (sound.current) void sound.current.close(); }, []);

  function start() { beep("button"); setPaused(false); setHelp(false); setGame({ ...initialNight(), phase: "playing" }); }
  function toggle(key: "shield" | "cover" | "monitor") { beep("button"); setGame((s) => s.phase === "playing" ? { ...s, [key]: !s[key] } : s); }
  function changeCamera(camera: CameraId) { beep("camera"); setGame((s) => ({ ...s, camera })); }
  const dust = threatAt(game.elapsed, "dust");
  const solar = threatAt(game.elapsed, "solar");
  const danger = dust === "inminente" || solar === "inminente";
  const running = game.phase === "playing";

  return <main className="night-app">
    <div className="game-shell">
      <header className="night-header">
        <div className="night-brand"><span className="brand-mark">A<span>✦</span></span><div><strong>AURORA</strong><small>PUESTO AVANZADO · MARTE</small></div></div>
        <div className="header-center"><span className="live-dot" /> SIMULADOR DE MISIÓN <span className="header-divider">/</span> SOL 01</div>
        <div className="header-actions">
          <button onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? "Silenciar sonidos" : "Activar sonidos"} title={soundOn ? "Silenciar sonidos" : "Activar sonidos"}>{soundOn ? <Volume2 size={17}/> : <VolumeX size={17}/>}</button>
          <button onClick={() => setHelp(true)} aria-label="Cómo jugar" title="Cómo jugar"><CircleHelp size={17}/></button>
          {running && <button onClick={() => { beep("button"); setPaused(!paused); }} aria-label={paused ? "Continuar" : "Pausar"} title={paused ? "Continuar" : "Pausar"}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>}
        </div>
      </header>

      <section className="cockpit" aria-label="Cabina de control">
        <div className="cockpit-top"><div><span className="eyebrow">ESTACIÓN AURORA <span>/</span> PUESTO DE CONTROL</span><h1>Tu turno en Marte<span>.</span></h1></div><div className="clock-box"><span>HORA DEL TURNO</span><strong>{clock(game.elapsed)}</strong><small>DE 06:00</small></div></div>

        <div className="console-layout">
          <aside className="side-console left-console">
            <div className="console-heading"><span>01</span> SISTEMAS DE LA BASE</div>
            <div className="meters">
              <Meter label="BATERÍA" value={game.battery} color="#e9b36d" />
              <Meter label="OXÍGENO" value={game.oxygen} color="#83cdd0" />
              <Meter label="INTEGRIDAD" value={game.integrity} color="#a7c29b" />
            </div>
            <div className="console-separator" />
            <div className="usage-head"><span>CONSUMO ACTUAL</span><strong>{usage(game)} <small>/ 4</small></strong></div>
            <div className="usage-bars" aria-label={`Consumo ${usage(game)} de 4 barras`}>{[1,2,3,4].map((i) => <span key={i} className={i <= usage(game) ? "active" : ""} />)}</div>
            <p className="console-note">Los sistemas activos consumen batería.</p>
            <div className="side-foot"><span className="status-light" /> SISTEMA OPERATIVO</div>
          </aside>

          <div className="viewport-wrap">
            <div className="viewport-label"><span>VISTA EXTERIOR</span><span>VENTANA PRINCIPAL <b>●</b></span></div>
            <div className={`viewport ${game.shield ? "shielded" : ""} ${danger ? "danger" : ""}`}>
              <div className="viewport-scene" />
              {dust && <div className={`window-dust dust-${dust}`} />}
              <div className="window-grid" />
              {game.shield && <div className="shield-overlay"><Shield size={25}/><span>ESCUDO CERRADO</span></div>}
              {game.alien && !game.shield && <button className="alien" onClick={() => { beep("camera"); setGame((s) => ({ ...s, alien: false, alienGone: true, lastMessage: "¡El visitante de ficción se fue!" })); }} aria-label="Espantar al marciano ficticio"><span>👽</span><small>¡BU!</small></button>}
              <div className="viewport-bottom"><span>IMAGEN HISTÓRICA · SUPERFICIE DE MARTE</span><span>NASA / JPL-CALTECH</span></div>
            </div>
            <div className={`system-message ${danger ? "is-danger" : ""}`} role="status"><span>{danger ? <AlertTriangle size={15} /> : <span className="status-light" />}</span><p>{danger ? (dust === "inminente" ? "¡Tormenta cerca! Cierra la cubierta de paneles." : "¡Evento solar cerca! Cierra el escudo.") : game.lastMessage}</p><span className="message-time">{clock(game.elapsed)}</span></div>
          </div>

          <aside className="side-console right-console">
            <div className="console-heading"><span>02</span> CONTROLES MANUALES</div>
            <p className="control-intro">Activa solo lo que necesites. Cada protección usa energía.</p>
            <button className={`control-switch ${game.shield ? "on" : ""}`} onClick={() => toggle("shield")} disabled={!running || paused} aria-pressed={game.shield}>
              <span className="switch-icon"><Shield size={21}/></span><span className="switch-text"><strong>ESCUDO</strong><small>RADIACIÓN</small></span><span className="switch-state"><i />{game.shield ? "CERRADO" : "ABIERTO"}</span>
            </button>
            <button className={`control-switch ${game.cover ? "on" : ""}`} onClick={() => toggle("cover")} disabled={!running || paused} aria-pressed={game.cover}>
              <span className="switch-icon"><Sun size={21}/></span><span className="switch-text"><strong>CUBIERTA</strong><small>PANELES</small></span><span className="switch-state"><i />{game.cover ? "CERRADA" : "ABIERTA"}</span>
            </button>
            <div className="control-tip"><span>✳</span><p>La cubierta protege del polvo, pero detiene la generación solar.</p></div>
            <div className="side-foot"><span className="status-light" /> CONTROLES DISPONIBLES</div>
          </aside>
        </div>

        <div className="desk-bottom"><div><span className="desk-line"/><span className="desk-line short"/><span className="desk-line"/></div><button className="open-monitor" onClick={() => toggle("monitor")} disabled={!running || paused}><Camera size={20}/> ABRIR MONITOR DE CÁMARAS <ArrowRight size={17}/></button><div className="desk-info"><span>RED DE VIGILANCIA</span><strong>04 CÁMARAS</strong></div></div>
      </section>
      <footer className="night-footer"><span>UNA NOCHE. MUCHAS DECISIONES.</span><span>DATOS HISTÓRICOS + MECÁNICAS FICTICIAS <a href="/creditos">FUENTES Y CRÉDITOS ↗</a></span></footer>

      {game.monitor && running && <div className="monitor-overlay" role="dialog" aria-modal="true" aria-label="Monitor de cámaras">
        <div className="monitor-frame">
          <div className="monitor-top"><div><span className="monitor-live">●</span> MONITOR DE VIGILANCIA <small> / AURORA</small></div><div className="monitor-top-actions"><span>{clock(game.elapsed)}</span><button onClick={() => toggle("monitor")} aria-label="Cerrar monitor"><X size={22}/></button></div></div>
          <div className="monitor-content"><div className="monitor-main"><div className="camera-heading"><span>CAM {String(game.camera).padStart(2,"0")} <b>/</b> {CAMERAS[game.camera - 1].name.toUpperCase()}</span><span className="cam-rec">● REPRESENTACIÓN DEL JUEGO</span></div><CameraView game={game} onClean={() => { beep("button"); setGame(clean); }}/><div className="monitor-caption"><span>SEÑAL DE CÁMARA · SIMULADA</span><span>EL TIEMPO SIGUE CORRIENDO</span></div></div>
          <div className="camera-list"><span className="camera-list-label">SELECCIONA UNA CÁMARA</span>{CAMERAS.map((cam) => <button key={cam.id} onClick={() => changeCamera(cam.id)} className={game.camera === cam.id ? "selected" : ""}><span className="camera-id">0{cam.id}</span><span><strong>{cam.name}</strong><small>{cam.short}</small></span><span className="camera-indicator" /></button>)}<div className="monitor-power"><Zap size={16}/> El monitor consume energía mientras está abierto.</div></div></div>
          <div className="monitor-bottom"><div><span className="status-light"/> BATERÍA <strong>{Math.ceil(game.battery)}%</strong></div><button onClick={() => toggle("monitor")}>BAJAR MONITOR <span>↓</span></button></div>
        </div>
      </div>}

      {(game.phase === "ready" || help || paused || game.phase === "won" || game.phase === "lost") && <div className="intro-overlay" role="dialog" aria-modal="true" aria-label="Información de la misión">
        <div className="intro-card">
          {help ? <><div className="intro-icon"><CircleHelp size={25}/></div><span className="eyebrow">GUÍA RÁPIDA</span><h2>Vigila. Decide. Sobrevive.</h2><ol><li>Abre las cámaras para buscar peligros.</li><li>Ante polvo, cierra la cubierta de los paneles. Ante un evento solar, cierra el escudo.</li><li>Vuelve a abrirlos después del impacto y cuida la batería.</li><li>Si los paneles tienen polvo, límpialos en la cámara 02.</li></ol><p className="science-note">Los datos NASA son históricos; los peligros, daños, consumos y cámaras son una simulación, no un pronóstico real.</p><button className="start-button" onClick={() => setHelp(false)}>ENTENDIDO <ArrowRight size={16}/></button></> : paused ? <><div className="intro-icon"><Pause size={24}/></div><span className="eyebrow">TURNO EN PAUSA</span><h2>La base te espera.</h2><button className="start-button" onClick={() => setPaused(false)}>CONTINUAR <Play size={16}/></button></> : game.phase === "ready" ? <><div className="intro-icon"><Moon size={25}/></div><span className="eyebrow">BIENVENIDO A LA ESTACIÓN AURORA</span><h2>¿Listo para tu turno?</h2><p>Vigila la base, protege los paneles y cuida el oxígeno hasta las <strong>06:00</strong>. Tu turno dura un minuto.</p><div className="intro-steps"><span><Camera size={16}/> REVISA CÁMARAS</span><span><Shield size={16}/> PROTEGE LA BASE</span><span><Zap size={16}/> AHORRA ENERGÍA</span></div><button className="start-button" onClick={start}>COMENZAR TURNO <ArrowRight size={17}/></button><button className="intro-help" onClick={() => setHelp(true)}>¿Cómo se juega?</button><p className="science-note">Juego de ficción con imágenes y registros históricos reales de NASA. No representa condiciones actuales.</p></> : <><div className="intro-icon">{game.phase === "won" ? <Check size={25}/> : <AlertTriangle size={25}/>}</div><span className="eyebrow">FIN DEL TURNO · {clock(game.elapsed)}</span><h2>{game.phase === "won" ? "¡Misión cumplida!" : "La base necesita ayuda."}</h2><p>{game.phase === "won" ? "Llegaste a las 06:00. Cada decisión ayudó a mantener la base en marcha." : "Un recurso se agotó. Observa las cámaras e inténtalo de nuevo."}</p><div className="result-grid"><div><span>BATERÍA</span><strong>{Math.ceil(game.battery)}%</strong></div><div><span>OXÍGENO</span><strong>{Math.ceil(game.oxygen)}%</strong></div><div><span>PROTEGIDOS</span><strong>{game.protected}/{game.impacts}</strong></div></div><p className="science-note">Los resultados son ficticios. Registro solar de referencia: {solarEvent.activityID}, histórico de DONKI.</p><button className="start-button" onClick={start}>JUGAR DE NUEVO <RefreshCw size={16}/></button></>}
        </div>
      </div>}
    </div>
  </main>;
}
