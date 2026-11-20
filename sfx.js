// Tiny Web Audio sound effects. They are generated at runtime, so no borrowed samples
// or extra media files are required.
export class ArcadeSounds {
  constructor() { this.context = null; this.muted = false; }
  tone(frequency, seconds, type = 'square', sweep = 0, volume = 0.045, at = 0) {
    if (this.muted) return;
    const ctx = this.context ??= new AudioContext();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const start = ctx.currentTime + at;
    osc.type = type; osc.frequency.setValueAtTime(frequency, start);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + sweep), start + seconds);
    // A small attack avoids clicks; the fast release keeps pellet runs crisp.
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + seconds);
  }
  notes(notes, type = 'square', volume = .05) { let at = .005; for (const [frequency, ms, sweep = 0] of notes) { const seconds = ms / 1000; this.tone(frequency, seconds, type, sweep, volume, at); at += seconds; } }
  coin() { this.notes([[1047, 70], [1319, 210]], 'square', .07); }
  // Pellets are collected continuously, so this stays deliberately soft and rounded.
  dot() { this.notes([[880, 18, 28], [1047, 14, 18]], 'triangle', .009); }
  power() { this.notes([[196, 65, 240], [294, 65, 350], [440, 130, 520]], 'sawtooth', .055); }
  ghost() { this.notes([[523, 55], [659, 55], [784, 130]], 'square', .06); }
  fruit() { this.notes([[392, 60], [523, 60], [659, 130]], 'triangle', .06); }
  cut() { this.notes([[300, 70, -120], [180, 110, -70]], 'sawtooth', .055); }
  death() { this.notes([[523, 55, -90], [392, 65, -80], [262, 120, -70]], 'triangle', .025); }
  toggle() { this.muted = !this.muted; }
}
