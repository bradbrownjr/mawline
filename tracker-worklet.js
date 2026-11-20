import createLibopenmpt from './vendor/libopenmpt/libopenmpt.js';
class Tracker extends AudioWorkletProcessor {
  constructor(options) { super(); this.playing = false; this.mod = null; this.port.onmessage = e => { if (e.data === 'play') this.playing = true; if (e.data === 'stop') { this.playing = false; this.mod?.set_position_seconds(0); } }; this.ready(options.processorOptions); }
  async ready({ wasm, song }) {
    const lib = await createLibopenmpt({ wasmBinary: wasm, print: () => {}, printErr: () => {} });
    const bytes = new Uint8Array(song), data = lib._malloc(bytes.length), err = lib._malloc(8); lib.HEAPU8.set(bytes, data); lib.HEAPU8.fill(0, err, err + 8);
    const mod = lib._openmpt_module_create_from_memory2(data, bytes.length, 0, 0, 0, 0, err, err + 4, 0); lib._free(data); lib._free(err);
    if (!mod) return; this.mod = { lib, mod, set_position_seconds: (s) => lib._openmpt_module_set_position_seconds(mod, s) };
  }
  process(_, outputs) {
    const out = outputs[0]; if (!this.playing || !this.mod) { out[0].fill(0); out[1].fill(0); return true; }
    const { lib, mod } = this.mod, n = out[0].length, lp = lib._malloc(n * 4), rp = lib._malloc(n * 4);
    const got = lib._openmpt_module_read_float_stereo(mod, sampleRate, n, lp, rp); out[0].set(new Float32Array(lib.HEAPU8.buffer, lp, got)); out[1].set(new Float32Array(lib.HEAPU8.buffer, rp, got)); if (got < n) { out[0].fill(0, got); out[1].fill(0, got); this.mod.set_position_seconds(0); } lib._free(lp); lib._free(rp); return true;
  }
}
registerProcessor('mawline-tracker', Tracker);
