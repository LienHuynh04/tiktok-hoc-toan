// Nhạc nền Đấu Trường Mèo — bản nhạc GỐC soạn bằng Web Audio ngay trong trang stage:
// "Mèo Đấu Sàn": Dm, 128 BPM, vòng hợp âm Dm–F–C–G, giai điệu marimba nảy tưng tưng
// như mèo nhảy qua nhảy lại trong đấu trường, bass pizzicato, shaker + pop giữ nhịp sôi động.
// Soạn riêng cho game này (không dùng lại giai điệu của Bug Đại Náo hay Đua Vịt).
// Không dùng file nhạc ngoài nên không dính bản quyền. Nhạc tự nhỏ xuống (duck) khi MC đọc.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook gọi resume() liên tục.

const BPM = 128;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // lưới nốt tư (16th)

// Dữ liệu bản nhạc — nguồn duy nhất của giai điệu
export const TRACK = {
  bpm: BPM,
  // Dm – F – C – G, mỗi hợp âm 1 ô nhịp
  chords: [
    [146.83, 174.61, 220.0], // D3 F3 A3 — Dm
    [174.61, 220.0, 261.63], // F3 A3 C4 — F
    [130.81, 164.81, 196.0], // C3 E3 G3 — C
    [196.0, 246.94, 293.66], // G3 B3 D4 — G
  ] as number[][],
  bass: [73.42, 87.31, 65.41, 98.0], // D2 F2 C2 G2
  // Giai điệu gốc: 4 ô nhịp x 8 nốt móc đơn; -1 = nghỉ (tần số Hz)
  melody: [
    [587.33, 698.46, 880.0, 698.46, 587.33, 698.46, 880.0, 1046.5],
    [880.0, 698.46, 880.0, 1046.5, 880.0, 698.46, 587.33, 698.46],
    [659.25, 783.99, 1046.5, 783.99, 880.0, 783.99, 659.25, 587.33],
    [587.33, 783.99, 880.0, 1174.66, 1046.5, 880.0, 783.99, 587.33],
  ] as number[][],
};

const BASE_LEVEL = 0.36;

class ArenaMusic {
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
    if (inBar === 0 || inBar === 8) this.pop(at);
    if (inBar % 2 === 0) this.shaker(at, inBar % 8 === 0 ? 0.02 : 0.011);
    if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 14) this.pizz(root * (inBar === 14 ? 2 : 1), at);
    if (inBar % 2 === 0) {
      const mel = TRACK.melody[bar % 4][inBar / 2];
      if (mel > 0) this.marimba(mel, at);
    }
    // chuông nhỏ điểm xuyết cuối ô nhịp 4
    if (bar % 4 === 3 && inBar === 12) this.marimba(1567.98, at, 0.02);
  }

  private marimba(freq: number, at: number, vol = 0.075) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const harm = ctx.createOscillator();
    harm.type = 'triangle';
    harm.frequency.value = freq * 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vol * 0.25, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    osc.connect(g).connect(this.bus);
    harm.connect(hg).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.32);
    harm.start(at);
    harm.stop(at + 0.1);
  }

  private pizz(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.11, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.24);
  }

  private chordPluck(freqs: number[], at: number) {
    freqs.forEach((fr, i) => this.marimba(fr * 2, at + i * STEP * 0.5, 0.028));
  }

  private pop(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, at);
    osc.frequency.exponentialRampToValueAtTime(120, at + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.1);
  }

  private shaker(at: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(f).connect(g).connect(this.bus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + 0.07);
  }
}

export const music = new ArenaMusic();
