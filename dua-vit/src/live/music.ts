// Nhạc nền Đua Vịt — bản remix gốc soạn bằng Web Audio ngay trong trang stage:
// nhịp đua 132 BPM, trống kick 4 phách dồn dập, bass đuổi theo từng nốt móc kép,
// hợp âm đâm (stab) lệch phách, giai điệu gốc thang A thứ chạy trên vòng Am–F–C–G.
// Không dùng file nhạc ngoài (repo chỉ đẩy được file chữ) nên không dính bản quyền.
// Nhạc tự nhỏ xuống (duck) khi MC đọc. Trình duyệt bắt buộc có 1 tương tác đầu tiên
// mới cho phát tiếng: hook gọi resume() liên tục nên nhạc tự lên ngay khi được phép.

const BPM = 132;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // lưới nốt tư (16th)

// Dữ liệu bản nhạc — xuất ra để bản render nghe thử (ngoài trình duyệt) dùng chung 1 nguồn
export const TRACK = {
  bpm: BPM,
  // Am – F – C – G: vòng hợp âm dance/đua kinh điển, mỗi hợp âm 1 ô nhịp
  chords: [
    [220.0, 261.63, 329.63], // A3 C4 E4 — Am
    [174.61, 220.0, 261.63], // F3 A3 C4 — F
    [261.63, 329.63, 392.0], // C4 E4 G4 — C
    [196.0, 246.94, 293.66], // G3 B3 D4 — G
  ] as number[][],
  bass: [55.0, 43.65, 65.41, 49.0], // A1 F1 C2 G1
  // Giai điệu gốc: 8 ô nhịp x 8 nốt móc đơn; -1 = nghỉ (tần số Hz)
  melody: [
    [440, -1, 523.25, 659.25, -1, 880, -1, 659.25],
    [783.99, -1, 659.25, 587.33, -1, 523.25, -1, -1],
    [440, -1, 523.25, 659.25, -1, 783.99, -1, 880],
    [659.25, -1, 587.33, 523.25, 587.33, 659.25, -1, -1],
    [440, -1, 523.25, 659.25, -1, 880, -1, 1046.5],
    [880, -1, 783.99, 659.25, -1, 587.33, -1, 659.25],
    [783.99, -1, 880, 1046.5, -1, 880, -1, 783.99],
    [659.25, -1, 587.33, -1, 523.25, 587.33, 659.25, -1],
  ] as number[][],
};

const BASE_LEVEL = 0.4;
const ARP_IDX = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 2]; // 16 bước arp trong 1 ô nhịp

class DuckRaceMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
  private delaySend: GainNode | null = null;
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
      // echo 3/4 phách cho giai điệu có đuôi kiểu remix
      const delay = ctx.createDelay(1);
      delay.delayTime.value = BEAT * 0.75;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const fbFilter = ctx.createBiquadFilter();
      fbFilter.type = 'lowpass';
      fbFilter.frequency.value = 2400;
      delay.connect(fbFilter).connect(fb).connect(delay);
      const wet = ctx.createGain();
      wet.gain.value = 0.18;
      delay.connect(wet).connect(this.bus);
      this.delaySend = ctx.createGain();
      this.delaySend.gain.value = 1;
      this.delaySend.connect(delay);
      // đệm nhiễu dùng cho hat/clap
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

  // 1 ô nhịp = 16 bước; hợp âm đổi theo ô nhịp (vòng 4 hợp âm), giai điệu 8 ô nhịp lặp lại
  private playStep(step: number, at: number) {
    const inBar = step % 16;
    const bar = Math.floor(step / 16);
    const chord = TRACK.chords[bar % 4];
    const root = TRACK.bass[bar % 4];
    if (inBar % 4 === 0) this.kick(at);
    if (inBar === 4 || inBar === 12) this.clap(at);
    this.hat(at, inBar % 2 === 0 ? 0.016 : 0.032, inBar === 14);
    if (inBar % 2 === 0) this.bassNote(root * (inBar % 8 === 6 ? 2 : 1), at);
    if (inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14) this.stab(chord, at);
    this.arp(chord[ARP_IDX[inBar]] * 2, at);
    if (inBar % 2 === 0) {
      const mel = TRACK.melody[bar % 8][inBar / 2];
      if (mel > 0) this.lead(mel, at);
    }
  }

  private kick(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(46, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.26);
  }

  private noise(at: number, dur: number, filterType: BiquadFilterType, freq: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + dur + 0.02);
  }

  private hat(at: number, vol: number, open: boolean) {
    this.noise(at, open ? 0.22 : 0.05, 'highpass', 7500, vol);
  }

  private clap(at: number) {
    this.noise(at, 0.16, 'bandpass', 1700, 0.11);
    this.noise(at + 0.012, 0.2, 'bandpass', 1500, 0.08);
  }

  private bassNote(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, at);
    f.frequency.exponentialRampToValueAtTime(220, at + STEP * 1.6);
    f.connect(this.bus);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.11, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + STEP * 1.7);
    osc.connect(f).connect(g);
    osc.start(at);
    osc.stop(at + STEP * 1.8);
  }

  private stab(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    f.connect(this.bus);
    for (const fr of freqs) {
      for (const det of [1, 1.005]) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = fr * 2 * det;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.028, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
        osc.connect(g).connect(f);
        osc.start(at);
        osc.stop(at + 0.21);
      }
    }
  }

  private arp(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.016, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + STEP * 0.95);
    osc.connect(f).connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + STEP);
  }

  private lead(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.delaySend) return;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.connect(this.bus);
    lp.connect(this.delaySend);
    for (const [type, vol] of [
      ['sawtooth', 0.045],
      ['triangle', 0.03],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 0.85);
      osc.connect(g).connect(lp);
      osc.start(at);
      osc.stop(at + BEAT * 0.9);
    }
  }
}

export const music = new DuckRaceMusic();
