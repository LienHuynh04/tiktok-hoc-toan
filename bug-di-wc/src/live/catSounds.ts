// Tiếng mèo TỔNG HỢP bằng Web Audio — không dùng file ghi âm/mẫu nào.
// Meow = dao động răng cưa qua 2 formant bandpass quét theo cao độ (miệng mèo mở/đóng),
// gằn rặn = burst trầm ngắn, xì = nhiễu trắng highpass, tru dài = meow kéo dài có vibrato,
// chirp/trill mừng = 2 nốt lướt nhanh, grừ nhàn = xung ~23Hz cổng hoá (purr).
// "Bẹt bẹt" (fart) = răng cưa lướt 90→40Hz bị cổng LFO ~25Hz + nhiễu bandpass trầm;
// "tủm" (plop) = sine rơi 500→90Hz + té nước. Âm lượng luôn ở mức điểm xuyết dưới MC/nhạc.
// Chỉ phát trên trang stage, sau tương tác đầu tiên (cùng luật mở khoá như nhạc/giọng).
// Âm lượng + bật/tắt chỉnh ở trang điều khiển (lệnh custom cat_on/cat_vol).

type Cue = 'meow' | 'meowBig' | 'sadMeow' | 'hiss' | 'yowl' | 'chirp' | 'fart' | 'fartBig' | 'fartTiny' | 'plop' | 'successPlop';

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
    else if (cue === 'fart') this.fartBurst(t, false);
    else if (cue === 'fartBig') this.fartBurst(t, true);
    else if (cue === 'fartTiny') this.fartOne(t, { dur: 0.09 + Math.random() * 0.04, f0: 150, f1: 95, vol: 0.075, flutter: 30 });
    else if (cue === 'plop') this.plop(t, 500, 0.15, 0.26);
    else if (cue === 'successPlop') this.successPlop(t);
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

  /**
   * Một tiếng "bẹt": răng cưa lướt xuống ~90→40Hz, gain bị cổng hoá bởi LFO ~25Hz
   * (chính cái rung "bẹt bẹt" phạch phạch) + một ít nhiễu qua bandpass trầm.
   * Mọi tham số được random hoá nhẹ nên không hai tiếng nào giống hệt nhau.
   */
  private fartOne(t: number, o: { dur: number; f0: number; f1: number; vol: number; flutter: number }) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(o.f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, o.f1), t + o.dur);
    // cổng rung "bẹt bẹt": LFO vuông điều biên độ gain quanh mức nền
    const flutter = ctx.createGain();
    flutter.gain.value = o.vol * 0.55;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = o.flutter;
    const lfoG = ctx.createGain();
    lfoG.gain.value = o.vol * 0.5;
    lfo.connect(lfoG).connect(flutter.gain);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + 0.018);
    env.gain.setValueAtTime(1, t + Math.max(0.02, o.dur - 0.05));
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(flutter).connect(lp).connect(env).connect(this.bus!);
    osc.start(t);
    osc.stop(t + o.dur + 0.03);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.03);
    // hơi xì kèm: nhiễu qua bandpass trầm, rất nhỏ
    if (this.noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      src.playbackRate.value = 0.7;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 340;
      bp.Q.value = 0.8;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(o.vol * 0.32, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(bp).connect(ng).connect(this.bus!);
      src.start(t);
      src.stop(t + o.dur + 0.03);
    }
  }

  /** Chuỗi bẹt: thường = 1–3 tiếng ngắn nối nhau; "big" = 2 tiếng dài, trầm và to hơn */
  private fartBurst(t: number, big: boolean) {
    const n = big ? 2 : 1 + Math.floor(Math.random() * 3);
    let at = t;
    for (let i = 0; i < n; i++) {
      const dur = big ? 0.34 + Math.random() * 0.24 : 0.12 + Math.random() * 0.33;
      this.fartOne(at, {
        dur,
        f0: (big ? 100 : 84) + Math.random() * 28,
        f1: 36 + Math.random() * 14,
        vol: big ? 0.17 : 0.105,
        flutter: 21 + Math.random() * 8,
      });
      at += dur + 0.06 + Math.random() * 0.05;
    }
  }

  /** "Tủm": sine rơi nhanh 500→90Hz (biến thể sâu từ ~300Hz) + té nước nhỏ */
  private plop(t: number, f0: number, vol: number, decay: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(88, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(this.bus!);
    o.start(t);
    o.stop(t + decay + 0.03);
    if (this.noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1150;
      bp.Q.value = 0.9;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t + 0.015);
      ng.gain.exponentialRampToValueAtTime(vol * 0.22, t + 0.045);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      src.connect(bp).connect(ng).connect(this.bus!);
      src.start(t + 0.015);
      src.stop(t + 0.16);
    }
  }

  /**
   * Khoảnh khắc THÀNH CÔNG: 1 tiếng bẹt anh hùng, rồi "tủm… tủm… TỦM" —
   * hẹn theo nhịp cục vàng rơi (~1,6s) trong nhịp ăn mừng 2,5s của engine.
   */
  private successPlop(t: number) {
    this.fartOne(t + 0.03, { dur: 0.62, f0: 118, f1: 33, vol: 0.18, flutter: 23 });
    this.plop(t + 0.82, 470, 0.14, 0.26);
    this.plop(t + 1.2, 520, 0.14, 0.26);
    this.plop(t + 1.62, 295, 0.2, 0.36); // TỦM cuối: sâu và to hơn
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
