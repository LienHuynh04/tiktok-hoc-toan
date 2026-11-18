// Nhạc nền Cô Bói Tarot — bản nhạc GỐC soạn bằng Web Audio ngay trong trang stage:
// "Đêm Trăng Bói Bài": vòng hợp âm Am – F – C – G ở âm vực thấp, pad mềm lên xuống
// chậm như hơi thở, điểm xuyết chuông gió pentatonic (A C D E G) thưa và ngân dài.
// Soạn riêng cho game này, không dùng file nhạc ngoài nên không dính bản quyền.
// Nhạc tự nhỏ xuống (duck) khi cô đang đọc. Trình duyệt bắt buộc có 1 tương tác đầu
// tiên mới cho phát tiếng: hook gọi resume() liên tục, không có cách lách nào khác.

const BAR_SEC = 8; // 1 ô nhịp pad dài 8 giây, nhịp thiền
const BELL_EVERY = 2; // chuông điểm mỗi 2 giây (lưới 4 nốt mỗi ô nhịp)

export const TRACK = {
  // Am – F – C – G: tần số pad (2 nốt thấp + 2 nốt giữa mỗi hợp âm)
  chords: [
    [110.0, 164.81, 220.0, 261.63], // A2 E3 A3 C4 — Am
    [87.31, 130.81, 174.61, 220.0], // F2 C3 F3 A3 — F
    [98.0, 146.83, 196.0, 261.63], // G2 D3 G3... giữ nhịp trầm (dùng G sớm cho mượt)
    [130.81, 196.0, 246.94, 329.63], // C3 G3 B3 E4 — C
  ] as number[][],
  // Chuông pentatonic A: dãy cố định 16 bước (0 = nghỉ), ngân dài, thưa
  bells: [440.0, 0, 523.25, 0, 659.25, 0, 587.33, 0, 440.0, 0, 349.23, 0, 392.0, 0, 523.25, 0] as number[],
};

const BASE_LEVEL = 0.3;

class MysticMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
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
      this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, t, 1.2);
      if (!this.timer) {
        this.nextStepAt = t + 0.1;
        this.timer = setInterval(() => this.schedule(), 400);
        this.schedule();
      }
    } else {
      this.bus.gain.setTargetAtTime(0, t, 0.4);
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (!this.enabled || !this.ctx || !this.bus) return;
    this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, this.ctx.currentTime, 0.25);
  }

  setDucked(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    if (!this.ctx || !this.duck) return;
    this.duck.gain.setTargetAtTime(on ? 0.3 : 1, this.ctx.currentTime, 0.25);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 2.5;
    while (this.nextStepAt < ahead) {
      this.playStep(this.stepIdx, this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += BELL_EVERY;
    }
  }

  // 1 bước = 2 giây; 4 bước = 1 ô nhịp pad. Chuông theo dãy 16 bước (32 giây).
  private playStep(step: number, at: number) {
    const bar = Math.floor(step / 4);
    if (step % 4 === 0) this.pad(TRACK.chords[bar % TRACK.chords.length], at);
    const bell = TRACK.bells[step % TRACK.bells.length];
    if (bell > 0) this.bell(bell, at, step % 8 === 4 ? 0.05 : 0.038);
    if (step % 16 === 12) this.bell(880.0, at, 0.016); // điểm sáng rất khẽ cuối vòng
  }

  /** Pad: 4 nốt sine+triangle detuned nhẹ, attack nhả chậm 3 giây, ngân hết ô nhịp */
  private pad(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    for (const f of freqs) {
      for (const det of [0, 4]) {
        const osc = ctx.createOscillator();
        osc.type = det === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.detune.value = det;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(det === 0 ? 0.028 : 0.01, at + 3);
        g.gain.setValueAtTime(det === 0 ? 0.028 : 0.01, at + BAR_SEC - 2.6);
        g.gain.linearRampToValueAtTime(0, at + BAR_SEC + 0.4);
        osc.connect(g).connect(this.bus);
        osc.start(at);
        osc.stop(at + BAR_SEC + 0.5);
      }
    }
  }

  /** Chuông gió: sine + harmonic, decay dài 2.5 giây */
  private bell(freq: number, at: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 2.76;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vol * 0.22, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    osc.connect(g).connect(this.bus);
    harm.connect(hg).connect(this.bus);
    osc.start(at);
    osc.stop(at + 2.7);
    harm.start(at);
    harm.stop(at + 0.55);
  }
}

export const music = new MysticMusic();
