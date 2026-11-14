// Nhạc nền Bong Bóng Avatar — bản nhạc GỐC soạn bằng Web Audio ngay trong trang stage:
// "Bong Bóng Bay": C trưởng, 126 BPM, vòng hợp âm C–G–Am–F, giai điệu pluck mềm bay
// lững lờ như bong bóng xà phòng, điểm xuyết tiếng "blip" bong bóng (quét tần số lên)
// làm nhịp gõ — nghe như bong bóng nhỏ nổ bụp bụp theo nhạc.
// Soạn riêng cho game này (không dùng lại giai điệu của Đấu Trường Mèo hay game nào khác).
// Không dùng file nhạc ngoài nên không dính bản quyền. Nhạc tự nhỏ xuống (duck) khi MC đọc.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook gọi resume() liên tục.

const BPM = 126;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // lưới nốt tư (16th)

// Dữ liệu bản nhạc — nguồn duy nhất của giai điệu
export const TRACK = {
  bpm: BPM,
  // C – G – Am – F, mỗi hợp âm 1 ô nhịp
  chords: [
    [130.81, 164.81, 196.0], // C3 E3 G3 — C
    [196.0, 246.94, 293.66], // G3 B3 D4 — G
    [220.0, 261.63, 329.63], // A3 C4 E4 — Am
    [174.61, 220.0, 261.63], // F3 A3 C4 — F
  ] as number[][],
  bass: [65.41, 98.0, 55.0, 87.31], // C2 G2 A1 F2
  // Giai điệu gốc: 4 ô nhịp x 8 nốt móc đơn; 0 = nghỉ (tần số Hz). Bay bổng, nhiều quãng nhảy nhẹ.
  melody: [
    [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33],
    [493.88, 587.33, 783.99, 587.33, 659.25, 783.99, 880.0, 783.99],
    [440.0, 523.25, 659.25, 523.25, 587.33, 659.25, 783.99, 659.25],
    [698.46, 587.33, 523.25, 587.33, 659.25, 523.25, 392.0, 523.25],
  ] as number[][],
};

const BASE_LEVEL = 0.34;

class BubblesMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stepIdx = 0;
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
      comp.ratio.value = 8;
      comp.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.gain.value = 1;
      this.duck.connect(comp);
      this.bus = ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.duck);
      const len = Math.floor(ctx.sampleRate * 0.5);
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
    const ctx = this.ensureCtx();
    if (!ctx || !this.bus) return;
    const t = ctx.currentTime;
    if (on) {
      void ctx.resume();
      this.bus.gain.cancelScheduledValues(t);
      this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, t, 1.0);
      if (!this.timer) {
        this.nextStepAt = t + 0.08;
        this.timer = setInterval(() => this.schedule(), 300);
        this.schedule();
      }
    } else {
      this.bus.gain.setTargetAtTime(0, t, 0.35);
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
    this.duck.gain.setTargetAtTime(on ? 0.3 : 1, this.ctx.currentTime, 0.22);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 1.1;
    while (this.nextStepAt < ahead) {
      this.playStep(this.stepIdx, this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += STEP;
    }
  }

  // 1 ô nhịp = 16 bước; hợp âm đổi theo ô nhịp (vòng 4), giai điệu 4 ô nhịp lặp lại
  private playStep(step: number, at: number) {
    const inBar = step % 16;
    const bar = Math.floor(step / 16);
    const chord = TRACK.chords[bar % 4];
    const root = TRACK.bass[bar % 4];
    if (inBar === 0) this.chordPluck(chord, at);
    // tiếng "blip" bong bóng: nhịp gõ chính ở phách 2 và phách 4, điểm xuyết ngẫu nhiên theo vòng lặp cố định
    if (inBar === 4 || inBar === 12) this.blip(at, 620 + (bar % 3) * 90);
    if (inBar === 14 && bar % 2 === 1) this.blip(at, 880, 0.03);
    if (inBar % 4 === 2) this.shaker(at, 0.008);
    if (inBar === 0 || inBar === 8) this.pizz(root, at);
    if (inBar === 10) this.pizz(root * 1.5, at, 0.07);
    if (inBar % 2 === 0) {
      const mel = TRACK.melody[bar % 4][inBar / 2];
      if (mel > 0) this.pluck(mel, at);
    }
    // chuông nhỏ lấp lánh cuối vòng 4 ô nhịp
    if (bar % 4 === 3 && inBar === 12) this.pluck(1567.98, at, 0.018);
  }

  /** Nốt pluck mềm (sine + harmonic nhẹ, decay dài cho cảm giác bay) */
  private pluck(freq: number, at: number, vol = 0.07) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vol * 0.18, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    osc.connect(g).connect(this.bus);
    harm.connect(hg).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.6);
    harm.start(at);
    harm.stop(at + 0.14);
  }

  private pizz(freq: number, at: number, vol = 0.1) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.32);
  }

  private chordPluck(freqs: number[], at: number) {
    freqs.forEach((fr, i) => this.pluck(fr * 2, at + i * STEP * 0.75, 0.024));
  }

  /** Tiếng bong bóng "blip": quét tần số lên nhanh, tròn và ướt */
  private blip(at: number, base = 620, vol = 0.045) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, at);
    osc.frequency.exponentialRampToValueAtTime(base * 1.9, at + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.12);
  }

  private shaker(at: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    src.connect(f).connect(g).connect(this.bus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + 0.06);
  }
}

export const music = new BubblesMusic();
