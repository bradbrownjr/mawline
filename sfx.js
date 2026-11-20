// Tiny Web Audio sound effects. They are generated at runtime, so no borrowed samples
// or extra media files are required.
export class ArcadeSounds {
  constructor() { this.context = null; this.muted = false; }
  tone(frequency, seconds, type = 'square', sweep = 0, volume = 0.045) {
    if (this.muted) return;
    const ctx = this.context ??= new AudioContext();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + sweep), ctx.currentTime + seconds);
    gain.gain.setValueAtTime(volume, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + seconds);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + seconds);
  }
  dot() { this.tone(520, .045, 'square', 110); }
  power() { this.tone(180, .24, 'sawtooth', 620, .06); }
  ghost() { this.tone(760, .12, 'square', 400, .055); }
  fruit() { this.tone(340, .2, 'triangle', 700, .055); }
  cut() { this.tone(210, .12, 'sawtooth', -120, .06); }
  death() { this.tone(480, .55, 'sawtooth', -430, .075); }
  toggle() { this.muted = !this.muted; }
}
