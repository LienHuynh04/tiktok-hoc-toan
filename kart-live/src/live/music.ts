// Nhạc nền Đua Xe Kart Live soạn bằng Web Audio ngay trong trang stage: nhịp
// synthwave 132 BPM dồn dập kiểu đường đua — kick bốn phách, bass móc đơn chạy
// liên tục, arp sáng ở quãng cao. Không dùng file nhạc ngoài (repo chỉ đẩy được
// file chữ) nên không dính bản quyền. Nhạc tự nhỏ xuống (duck) khi MC đang đọc.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook sẽ gọi
// resume() liên tục (mọi sự kiện + watchdog) nên nhạc tự lên ngay khi được phép.

const BPM = 132;
const BEAT = 60 / BPM;
const BAR = BEAT * 4; // 1 ô nhịp 4 phách
const STEP16 = BEAT / 4; // arp chạy nốt móc kép

// Am – F – C – G: vòng hợp âm căng mà sáng, hợp không khí đường đua ven biển
const CHORDS: number[][] = [
  [220.0, 261.63, 329.63], // A3 C4 E4 — Am
  [174.61, 220.0, 261.63], // F3 A3 C4 — F
  [196.0, 261.63, 329.63], // G3 C4 E4 — C/G
  [196.0, 246.94, 293.66], // G3 B3 D4 — G
];
const BASS = [55.0, 43.65, 65.41, 49.0]; // A1 F1 C2 G1
const ARP = [440.0, 523.25, 659.25, 523.25, 880.0, 659.25, 523.25, 659.25]; // nốt arp trên Am, các hợp âm khác dịch theo tỉ lệ
const ARP_RATIO = [1, 0.7937, 1.1892, 1.1225]; // tỉ lệ so với Am cho F, C, G (xấp xỉ theo nốt gốc)
const BASE_LEVEL = 0.4;

class KartMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private barIdx = 0;
  private stepIdx = 0;
  private nextBarAt = 0;
  private nextStepAt = 0;
  enabled = false;
  private volume = 1;
  private ducked = false;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.gain.value = 1;
      this.duck.connect(comp);
      this.bus = ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.duck);
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
    const ctx = this.ensureCtx();
    if (!ctx || !this.bus) return;
    const t = ctx.currentTime;
    if (on) {
      void ctx.resume();
      this.bus.gain.cancelScheduledValues(t);
      this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, t, 1.0);
      if (!this.timer) {
        this.nextBarAt = t + 0.1;
        this.nextStepAt = t + 0.1;
        this.timer = setInterval(() => this.schedule(), 200);
        this.schedule();
      }
    } else {
      this.bus.gain.setTargetAtTime(0, t, 0.3);
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (!this.enabled || !this.ctx || !this.bus) return;
    this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, this.ctx.currentTime, 0.2);
  }

  setDucked(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    if (!this.ctx || !this.duck) return;
    this.duck.gain.setTargetAtTime(on ? 0.32 : 1, this.ctx.currentTime, 0.25);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 0.9;
    while (this.nextBarAt < ahead) {
      const i = this.barIdx % CHORDS.length;
      const at = this.nextBarAt;
      this.playPad(CHORDS[i], at);
      for (let b = 0; b < 4; b++) {
        this.playKick(at + b * BEAT);
        this.playHat(at + b * BEAT + BEAT / 2, b % 2 === 0 ? 0.05 : 0.035);
      }
      for (let s = 0; s < 8; s++) this.playBass(BASS[i] * (s % 4 === 2 ? 2 : 1), at + s * (BEAT / 2));
      this.barIdx++;
      this.nextBarAt += BAR;
    }
    while (this.nextStepAt < ahead) {
      const bar = Math.floor(this.stepIdx / 16) % CHORDS.length;
      const note = ARP[this.stepIdx % 8] * ARP_RATIO[bar];
      this.playArp(note, this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += STEP16;
    }
  }

  private playKick(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.2);
  }

  private playHat(at: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(hp).connect(g).connect(this.bus);
    src.start(at);
  }

  private playBass(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, at);
    lp.frequency.exponentialRampToValueAtTime(300, at + BEAT / 2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.075, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT / 2 - 0.02);
    osc.connect(lp).connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + BEAT / 2);
  }

  private playPad(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.028, at + 0.3);
      g.gain.setValueAtTime(0.028, at + BAR - 0.25);
      g.gain.linearRampToValueAtTime(0, at + BAR + 0.3);
      osc.connect(g).connect(this.bus);
      osc.start(at);
      osc.stop(at + BAR + 0.4);
    }
  }

  private playArp(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.016, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + STEP16 * 1.8);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + STEP16 * 2);
  }
}

export const music = new KartMusic();
