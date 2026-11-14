// Nhạc nền Bug Đi WC — bản nhạc GỐC soạn bằng Web Audio ngay trong trang stage:
// "Rặn Đi Bug Ơi": C–F–G–C, 112 BPM, bass tuba nảy kiểu oom-pah (thấp, tròn, hơi
// "phụt phụt" như phim hoạt hình), giai điệu pluck ngốc nghếch nhảy bậc, điểm xuyết
// tiếng sáo trượt (slide whistle) cuối vòng. Soạn riêng cho game này, không dùng lại
// giai điệu của Đấu Trường Mèo / Đại Náo / Đua Vịt. Không file nhạc ngoài nên không
// dính bản quyền. Nhạc tự nhỏ xuống (duck) khi MC đọc. Trình duyệt bắt buộc có 1
// tương tác đầu tiên mới cho phát tiếng: hook gọi resume() liên tục.

const BPM = 112;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // lưới nốt tư (16th)

// Dữ liệu bản nhạc — nguồn duy nhất của giai điệu
export const TRACK = {
  bpm: BPM,
  // C – F – G – C, mỗi hợp âm 1 ô nhịp
  chords: [
    [130.81, 164.81, 196.0], // C3 E3 G3 — C
    [174.61, 220.0, 261.63], // F3 A3 C4 — F
    [196.0, 246.94, 293.66], // G3 B3 D4 — G
    [130.81, 164.81, 196.0], // C3 E3 G3 — C
  ] as number[][],
  bass: [65.41, 87.31, 98.0, 65.41], // C2 F2 G2 C2 — tuba
  fifth: [98.0, 130.81, 146.83, 98.0], // G2 C3 D3 G2 — nốt 5 cho oom-pah
  // Giai điệu gốc ngốc nghếch: 4 ô nhịp x 8 nốt móc đơn; -1 = nghỉ (tần số Hz)
  melody: [
    [523.25, -1, 659.25, 587.33, 523.25, -1, 392.0, 440.0],
    [440.0, -1, 523.25, 587.33, 659.25, -1, 587.33, 523.25],
    [587.33, -1, 493.88, 587.33, 783.99, -1, 587.33, 493.88],
    [523.25, 440.0, 392.0, 440.0, 523.25, -1, -1, -1],
  ] as number[][],
};

const BASE_LEVEL = 0.34;

class WcMusic {
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
    const bi = bar % 4;
    // Oom-pah: tuba nốt gốc ở bước 0 & 8, nốt 5 ở bước 4 & 12
    if (inBar === 0 || inBar === 8) this.tuba(TRACK.bass[bi], at);
    if (inBar === 4 || inBar === 12) this.tuba(TRACK.fifth[bi], at, 0.16);
    // gõ "tách" nhẹ giữ nhịp như đế giày hoạt hình
    if (inBar % 4 === 2) this.tock(at);
    if (inBar % 2 === 0) {
      const mel = TRACK.melody[bi][inBar / 2];
      if (mel > 0) this.pluck(mel, at);
    }
    // hợp âm rải nhẹ đầu ô nhịp (banjo câm)
    if (inBar === 0) TRACK.chords[bi].forEach((f, i) => this.pluck(f * 2, at + i * STEP * 0.5, 0.02));
    // sáo trượt ngốc nghếch cuối vòng 4 ô nhịp: lướt lên rồi tuột xuống
    if (bi === 3 && inBar === 12) this.slideWhistle(at);
  }

  /** Tuba: sóng tam giác trầm + một chút vuông qua lowpass, phồng nhanh xẹp chậm kiểu hơi thổi */
  private tuba(freq: number, at: number, vol = 0.21) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const sq = ctx.createOscillator();
    sq.type = 'square';
    sq.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.045);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, at + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    const sg = ctx.createGain();
    sg.gain.value = 0.3;
    osc.connect(lp);
    sq.connect(sg).connect(lp);
    lp.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.32);
    sq.start(at);
    sq.stop(at + 0.32);
  }

  private pluck(freq: number, at: number, vol = 0.07) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, at);
    lp.frequency.exponentialRampToValueAtTime(700, at + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    osc.connect(lp).connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.18);
  }

  private tock(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1900;
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
    src.connect(f).connect(g).connect(this.bus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + 0.06);
  }

  /** Sáo trượt: lướt từ 700Hz lên 1400Hz rồi tuột về 800Hz */
  private slideWhistle(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, at);
    osc.frequency.exponentialRampToValueAtTime(1420, at + 0.16);
    osc.frequency.exponentialRampToValueAtTime(760, at + 0.34);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.028, at + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.36);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.38);
  }
}

export const music = new WcMusic();
