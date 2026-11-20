import createLibopenmpt from './vendor/libopenmpt/libopenmpt.js';

// Small, deliberately self-contained libopenmpt player. The module is loaded only after
// a gesture, which is required by browsers before they allow sound.
export class TrackerMusic {
  constructor() { this.ctx = null; this.node = null; this.module = null; this.muted = false; this.loading = null; this.playing = false; }
  async play() {
    this.playing = true;
    if (this.muted) return;
    if (!this.loading && !this.ctx) this.loading = this.load();
    await this.loading;
    // Loading module audio can take longer than a button press. Honor a pause that happened
    // while that work was in flight instead of unexpectedly bringing the song back.
    if (!this.playing || this.muted || !this.ctx || !this.node) return;
    await this.ctx.resume();
    if (this.node.port) this.node.port.postMessage('play');
  }
  async load() {
    try {
      this.ctx = new AudioContext({ sampleRate: 48000 });
      const [wasm, song] = await Promise.all([fetch('./vendor/libopenmpt/libopenmpt.wasm').then(r => r.arrayBuffer()), fetch('./music/peachy_chip.xm').then(r => r.arrayBuffer())]);
      if (this.ctx.audioWorklet && globalThis.isSecureContext) {
        await this.ctx.audioWorklet.addModule('./tracker-worklet.js');
        this.node = new AudioWorkletNode(this.ctx, 'mawline-tracker', { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { wasm, song } });
      } else await this.loadHttpFallback(wasm, song);
      this.node.connect(this.ctx.destination);
    } catch (error) {
      console.error('Mawline music could not start:', error);
      this.loading = null;
    }
  }
  // ScriptProcessor is deprecated but remains a useful compatibility path: unlike
  // AudioWorklet it runs from a LAN HTTP origin. HTTPS continues to use the low-latency worklet.
  async loadHttpFallback(wasm, song) {
    const lib = await createLibopenmpt({ wasmBinary: wasm, print: () => {}, printErr: () => {} });
    const bytes = new Uint8Array(song), data = lib._malloc(bytes.length), err = lib._malloc(8);
    lib.HEAPU8.set(bytes, data); lib.HEAPU8.fill(0, err, err + 8);
    const mod = lib._openmpt_module_create_from_memory2(data, bytes.length, 0, 0, 0, 0, err, err + 4, 0);
    lib._free(data); lib._free(err); if (!mod) throw new Error('libopenmpt could not open Peachy Chip');
    this.module = { lib, mod };
    this.node = this.ctx.createScriptProcessor(1024, 0, 2);
    this.node.onaudioprocess = (event) => {
      const left = event.outputBuffer.getChannelData(0), right = event.outputBuffer.getChannelData(1), n = left.length;
      const lp = lib._malloc(n * 4), rp = lib._malloc(n * 4);
      const got = lib._openmpt_module_read_float_stereo(mod, this.ctx.sampleRate, n, lp, rp);
      left.set(new Float32Array(lib.HEAPU8.buffer, lp, got)); right.set(new Float32Array(lib.HEAPU8.buffer, rp, got));
      if (got < n) { left.fill(0, got); right.fill(0, got); lib._openmpt_module_set_position_seconds(mod, 0); }
      lib._free(lp); lib._free(rp);
    };
  }
  pause() { this.playing = false; this.ctx?.suspend(); }
  resume() { if (!this.muted) { this.playing = true; this.ctx?.resume(); } }
  stop() { if (this.node?.port) this.node.port.postMessage('stop'); else if (this.module) this.module.lib._openmpt_module_set_position_seconds(this.module.mod, 0); }
  toggle() { this.muted = !this.muted; if (this.muted) this.pause(); else this.play(); }
}
// Keeps Vite-like static hosting from tree-shaking the ESM dependency in editors.
void createLibopenmpt;
