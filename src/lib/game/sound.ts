"use client";

/**
 * Sonidos sintetizados en tiempo real con Web Audio API.
 * No requiere archivos externos de audio; todo se genera con osciladores y ruido blanco.
 */
export class GameSound {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freqFrom: number,
    freqTo: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    delay = 0
  ) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  private noiseBurst(duration: number, gainPeak: number, delay = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delay;
    gain.gain.setValueAtTime(gainPeak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  // Clic de botón físico
  button() {
    this.tone(480, 260, 0.07, "square", 0.05);
  }

  // Cambio de cámaras CCTV
  cameraSwitch() {
    this.noiseBurst(0.1, 0.05);
    this.tone(850, 420, 0.06, "sine", 0.04);
  }

  // Compuerta blindada (golpe hidráulico)
  gateClunk() {
    this.tone(160, 45, 0.35, "sawtooth", 0.12);
    this.noiseBurst(0.18, 0.08, 0.05);
  }

  // Interruptor de luz exterior
  lightClick() {
    this.tone(750, 800, 0.04, "square", 0.04);
  }

  // Despresurización de esclusa EVA (salir a paneles)
  depressurize() {
    this.noiseBurst(0.6, 0.15);
    this.tone(300, 80, 0.5, "triangle", 0.08);
  }

  // Presurización de esclusa (volver a cabina)
  pressurize() {
    this.noiseBurst(0.5, 0.12);
    this.tone(120, 440, 0.4, "sine", 0.08);
  }

  // Soplador de aire comprimido para limpiar paneles
  airPuff() {
    this.noiseBurst(0.12, 0.09);
    this.tone(600, 200, 0.1, "sine", 0.03);
  }

  // Limpiaparabrisas del ventanal
  wiper() {
    this.tone(380, 520, 0.18, "sawtooth", 0.05);
    this.tone(520, 360, 0.18, "sawtooth", 0.05, 0.18);
  }

  // Risa traviesa del marcianito
  alienChuckle() {
    [0, 0.08, 0.16, 0.24].forEach((d, i) => {
      this.tone(900 + (i % 2) * 200, 1100 + (i % 2) * 200, 0.06, "triangle", 0.06, d);
    });
  }

  // Marcianito asustado huyendo por la luz
  alienScared() {
    this.tone(1200, 300, 0.35, "sawtooth", 0.09);
    this.noiseBurst(0.2, 0.06);
  }

  // Juguete Mini-Rover
  boop() {
    this.tone(520, 880, 0.12, "sine", 0.08);
  }

  // Alarma general
  alarm() {
    this.tone(550, 550, 0.2, "triangle", 0.08);
    this.tone(550, 550, 0.2, "triangle", 0.08, 0.25);
  }

  // Tormenta de polvo impactando
  dustHit() {
    this.noiseBurst(0.6, 0.16);
    this.tone(85, 35, 0.5, "sawtooth", 0.14);
  }

  // Destello de llamarada solar
  flareFlash() {
    this.tone(1100, 1900, 0.4, "sine", 0.1);
  }

  // Golpe de llamarada solar
  flareHit() {
    this.noiseBurst(0.5, 0.15);
    this.tone(700, 160, 0.45, "sawtooth", 0.12);
  }

  // Apagón total
  blackout() {
    this.tone(220, 35, 0.95, "sawtooth", 0.12);
  }

  // Bomba de oxígeno
  oxygenPump() {
    this.tone(280, 440, 0.12, "sine", 0.05);
  }

  // Fanfarria de victoria (06:00 AM)
  win() {
    [0, 0.12, 0.24, 0.38, 0.52].forEach((d, i) => {
      this.tone(440 + i * 110, 440 + i * 130, 0.22, "sine", 0.07, d);
    });
  }

  // Derrota
  lose() {
    this.tone(280, 70, 0.7, "sawtooth", 0.09);
  }
}
