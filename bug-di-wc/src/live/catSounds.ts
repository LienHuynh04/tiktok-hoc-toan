// Tiếng mèo TỔNG HỢP bằng Web Audio — không dùng file ghi âm/mẫu nào.
// Meow = dao động răng cưa qua 2 formant bandpass quét theo cao độ (miệng mèo mở/đóng),
// gằn rặn = burst trầm ngắn, xì = nhiễu trắng highpass, tru dài = meow kéo dài có vibrato,
// chirp/trill mừng = 2 nốt lướt nhanh, grừ nhàn = xung ~23Hz cổng hoá (purr).
// Chỉ phát trên trang stage, sau tương tác đầu tiên (cùng luật mở khoá như nhạc/giọng).
// Âm lượng + bật/tắt chỉnh ở trang điều khiển (lệnh custom cat_on/cat_vol).

type Cue = 'meow' | 'meowBig' | 'sadMeow' | 'hiss' | 'yowl' | 'chirp';

const BASE_LEVEL = 0.5;

class CatSounds {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  enabled = true;
  private volume = 0.9;
  private purrNodes: { stop: () => void } | null = null;
  private lastGruntAt = 0;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 6;
      comp.connect(ctx.destination);
      this.bus = ctx.createGain();
      this.bus.gain.value = BASE_LEVEL * this.volume;
      this.bus.connect(comp);
      const len = Math.floor(ctx.sampleRate * 1);
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.ctx;
  }

  resume() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopPurr();
    else this.resume();
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.ctx && this.bus) this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, this.ctx.currentTime, 0.1);
  }

  play(cue: Cue) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.02;
    if (cue === 'meow') this.meow(t, 0.4, 520, 880);
    else if (cue === 'meowBig') this.meow(t, 0.62, 460, 1020, 0.16);
    else if (cue === 'sadMeow') this.meow(t, 0.7, 700, 320, 0.1);
    else if (cue === 'hiss') this.hiss(t);
    else if (cue === 'yowl') this.yowl(t);
    else if (cue === 'chirp') this.chirp(t);
  }

  /** Tiếng gằn khi đang rặn: gọi lặp từ hook, nhịp/tần theo nhịp tim (tự throttle bên trong) */
  grunt(ratePerSec: number) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running') return;
    const now = performance.now();
    const gap = Math.max(280, 1100 - ratePerSec * 55); // tim càng nhanh, gằn càng dồn
    if (now - this.lastGruntAt < gap) return;
    this.lastGruntAt = now;
    const t = ctx.currentTime + 0.02;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const base = 150 + Math.min(90, ratePerSec * 6);
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 0.62, t + 0.13);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(lp).connect(g).connect(this.bus!);
    o.start(t);
    o.stop(t + 0.17);
  }

  /** Grừ nhàn (purr): dao động trầm 55Hz được cổng hoá ~23Hz như tiếng mèo grừ thật */
  startPurr() {
    if (!this.enabled || this.purrNodes) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running' || !this.bus) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 54;
    const og = ctx.createGain();
    og.gain.value = 0.5;
    const gate = ctx.createGain();
    gate.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 23;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.035;
    lfo.connect(lfoG).connect(gate.gain);
    gate.gain.value = 0.035;
    o.connect(og).connect(gate).connect(this.bus);
    o.start();
    lfo.start();
    this.purrNodes = {
      stop: () => {
        try {
          o.stop();
          lfo.stop();
        } catch {
          // đã dừng
        }
        o.disconnect();
        lfo.disconnect();
      },
    };
  }

  stopPurr() {
    this.purrNodes?.stop();
    this.purrNodes = null;
  }

  private lastSnoreAt = 0;

  /** Ngáy nhè nhẹ khi Bug ngủ gật: còi hơi sine trầm lướt xuống + thở ra. Hook gọi lặp, tự throttle ~2,6s */
  snore() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || ctx.state !== 'running' || !this.bus) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSnoreAt < 2600) return;
    this.lastSnoreAt = nowMs;
    const t = ctx.currentTime + 0.02;
    // tiếng "khò" vào: sine 300 -> 210Hz, rung nhẹ
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(205, t + 0.55);
    const vib = ctx.createOscillator();
    vib.frequency.value = 26;
    const vibG = ctx.createGain();
    vibG.gain.value = 14;
    vib.connect(vibG).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.14);
    g.gain.setValueAtTime(0.055, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.65);
    vib.start(t);
    vib.stop(t + 0.65);
    // tiếng thở ra "phù": nhiễu qua bandpass trầm, nhỏ
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t + 0.62);
    ng.gain.exponentialRampToValueAtTime(0.02, t + 0.8);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
    src.connect(bp).connect(ng).connect(this.bus);
    src.start(t + 0.62);
    src.stop(t + 1.3);
  }

  get purring() {
    return !!this.purrNodes;
  }

  // ----- Các tiếng cụ thể -----
  /** Meow: nền răng cưa quét cao độ + 2 formant quét theo (miệng mở) + rung nhẹ cuối tiếng */
  private meow(t: number, dur: number, f0: number, f1: number, vol = 0.13) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.35);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.72, t + dur);
    const vib = ctx.createOscillator();
    vib.frequency.value = 28;
    const vibG = ctx.createGain();
    vibG.gain.setValueAtTime(0, t);
    vibG.gain.linearRampToValueAtTime(9, t + dur * 0.5);
    vib.connect(vibG).connect(o.frequency);
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.Q.value = 1.1;
    bp1.frequency.setValueAtTime(700, t);
    bp1.frequency.exponentialRampToValueAtTime(1150, t + dur * 0.4);
    bp1.frequency.exponentialRampToValueAtTime(620, t + dur);
    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.Q.value = 2.2;
    bp2.frequency.setValueAtTime(2400, t);
    bp2.frequency.exponentialRampToValueAtTime(3100, t + dur * 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.18);
    g.gain.setValueAtTime(vol, t + Math.max(dur * 0.18, dur - 0.1));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    o.connect(bp1).connect(g);
    o.connect(bp2).connect(g2).connect(g);
    g.connect(this.bus!);
    o.start(t);
    o.stop(t + dur + 0.05);
    vib.start(t);
    vib.stop(t + dur + 0.05);
  }

  private hiss(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(hp).connect(g).connect(this.bus!);
    src.start(t);
    src.stop(t + 0.6);
  }

  private yowl(t: number) {
    // tru dài hờn dỗi: meow kéo dài, quét rộng, vibrato mạnh
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(980, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.8);
    const vib = ctx.createOscillator();
    vib.frequency.value = 11;
    const vibG = ctx.createGain();
    vibG.gain.value = 26;
    vib.connect(vibG).connect(o.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
    bp.frequency.exponentialRampToValueAtTime(800, t + 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.12);
    g.gain.setValueAtTime(0.15, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(bp).connect(g).connect(this.bus!);
    o.start(t);
    o.stop(t + 0.9);
    vib.start(t);
    vib.stop(t + 0.9);
  }

  private chirp(t: number) {
    // trill mừng: 3 nốt lướt lên nhanh liên tiếp
    for (let i = 0; i < 3; i++) {
      const at = t + i * 0.11;
      const ctx = this.ctx!;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(950 + i * 120, at);
      o.frequency.exponentialRampToValueAtTime(1500 + i * 120, at + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.09, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      o.connect(g).connect(this.bus!);
      o.start(at);
      o.stop(at + 0.12);
    }
  }
}

export const catSounds = new CatSounds();
