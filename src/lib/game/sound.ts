"use client";

/**
 * Sounds synthesized in real time with the Web Audio API.
 * No external audio files are needed; everything is generated with oscillators and white noise.
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

  // Physical button click
  button() {
    this.tone(480, 260, 0.07, "square", 0.05);
  }

  // CCTV camera switch
  cameraSwitch() {
    this.noiseBurst(0.1, 0.05);
    this.tone(850, 420, 0.06, "sine", 0.04);
  }

  // Armored gate (hydraulic thud)
  gateClunk() {
    this.tone(160, 45, 0.35, "sawtooth", 0.12);
    this.noiseBurst(0.18, 0.08, 0.05);
  }

  // Outdoor light switch
  lightClick() {
    this.tone(750, 800, 0.04, "square", 0.04);
  }

  // EVA airlock depressurization (going out to the panels)
  depressurize() {
    this.noiseBurst(0.6, 0.15);
    this.tone(300, 80, 0.5, "triangle", 0.08);
  }

  // Airlock pressurization (coming back into the cabin)
  pressurize() {
    this.noiseBurst(0.5, 0.12);
    this.tone(120, 440, 0.4, "sine", 0.08);
  }

  // Compressed-air blower for cleaning the panels
  airPuff() {
    this.noiseBurst(0.12, 0.09);
    this.tone(600, 200, 0.1, "sine", 0.03);
  }

  // Window wiper
  wiper() {
    this.tone(380, 520, 0.18, "sawtooth", 0.05);
    this.tone(520, 360, 0.18, "sawtooth", 0.05, 0.18);
  }

  // Mischievous chuckle of the little Martian
  alienChuckle() {
    [0, 0.08, 0.16, 0.24].forEach((d, i) => {
      this.tone(900 + (i % 2) * 200, 1100 + (i % 2) * 200, 0.06, "triangle", 0.06, d);
    });
  }

  // Frightened little Martian fleeing from the light
  alienScared() {
    this.tone(1200, 300, 0.35, "sawtooth", 0.09);
    this.noiseBurst(0.2, 0.06);
  }

  // Mini-Rover toy
  boop() {
    this.tone(520, 880, 0.12, "sine", 0.08);
  }

  // General alarm
  alarm() {
    this.tone(550, 550, 0.2, "triangle", 0.08);
    this.tone(550, 550, 0.2, "triangle", 0.08, 0.25);
  }

  // Dust storm hitting
  dustHit() {
    this.noiseBurst(0.6, 0.16);
    this.tone(85, 35, 0.5, "sawtooth", 0.14);
  }

  // Solar flare flash
  flareFlash() {
    this.tone(1100, 1900, 0.4, "sine", 0.1);
  }

  // Solar flare impact
  flareHit() {
    this.noiseBurst(0.5, 0.15);
    this.tone(700, 160, 0.45, "sawtooth", 0.12);
  }

  // Total blackout
  blackout() {
    this.tone(220, 35, 0.95, "sawtooth", 0.12);
  }

  // Oxygen pump
  oxygenPump() {
    this.tone(280, 440, 0.12, "sine", 0.05);
  }

  // Victory fanfare (06:00 AM)
  win() {
    [0, 0.12, 0.24, 0.38, 0.52].forEach((d, i) => {
      this.tone(440 + i * 110, 440 + i * 130, 0.22, "sine", 0.07, d);
    });
  }

  // Defeat
  lose() {
    this.tone(280, 70, 0.7, "sawtooth", 0.09);
  }
}
