import createLibopenmpt from './vendor/libopenmpt/libopenmpt.js';

// Small, deliberately self-contained libopenmpt player. The module is loaded only after
// a gesture, which is required by browsers before they allow sound.
export class TrackerMusic {
  constructor() { this.ctx = null; this.node = null; this.muted = false; }
  async play() {
    if (this.muted) return;
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: 48000 });
      await this.ctx.audioWorklet.addModule('./tracker-worklet.js');
      const [wasm, song] = await Promise.all([fetch('./vendor/libopenmpt/libopenmpt.wasm').then(r => r.arrayBuffer()), fetch('./music/peachy_chip.xm').then(r => r.arrayBuffer())]);
      this.node = new AudioWorkletNode(this.ctx, 'mawline-tracker', { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { wasm, song } });
      this.node.connect(this.ctx.destination);
    }
    await this.ctx.resume(); this.node.port.postMessage('play');
  }
  pause() { this.ctx?.suspend(); }
  resume() { if (!this.muted) this.ctx?.resume(); }
  stop() { this.node?.port.postMessage('stop'); }
  toggle() { this.muted = !this.muted; if (this.muted) this.pause(); else this.play(); }
}
// Keeps Vite-like static hosting from tree-shaking the ESM dependency in editors.
void createLibopenmpt;
