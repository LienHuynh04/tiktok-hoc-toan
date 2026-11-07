// Nhạc nền TẾT cho sân khấu Niên Thú, soạn thủ tục bằng Web Audio ngay trong trang
// stage (bản nhạc tự soạn, không dùng file ngoài nên không dính bản quyền): trống hội
// "tùng tùng" giữ nhịp lễ hội, phách gỗ điểm móc đơn, chiêng nhỏ mở mỗi vòng, giai
// điệu gảy theo thang ngũ cung tươi vui trên vòng hợp âm C – F – G – Am. Nhạc tự nhỏ
// xuống (duck) trong lúc MC đọc, cho tiếng nói rõ.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook sẽ gọi
// resume() liên tục (mọi sự kiện + watchdog) nên nhạc tự lên ngay khi được phép.

const BPM = 116;
const BEAT = 60 / BPM;
const CHORD_SEC = BEAT * 4; // mỗi hợp âm 1 ô nhịp 4 phách
const STEP_SEC = BEAT / 2; // giai điệu + phách chạy theo nốt móc đơn

// C – F – G – Am: vòng hợp âm sáng, rộn ràng kiểu lễ hội đầu năm
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 523.25], // C4 E4 G4 C5 — C
  [174.61, 220.0, 261.63, 349.23], // F3 A3 C4 F4 — F
  [196.0, 246.94, 293.66, 392.0], // G3 B3 D4 G4 — G
  [220.0, 261.63, 329.63, 440.0], // A3 C4 E4 A4 — Am
];
const BASS = [130.81, 87.31, 98.0, 110.0]; // C3 F2 G2 A2
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // ngũ cung C: C5 D5 E5 G5 A5 C6
// 8 bước móc đơn cho 1 hợp âm; -1 = nghỉ. Giai điệu nhảy nhót, hai biến tấu thay nhau.
const PATTERN_A = [4, 2, 3, 2, 4, -1, 3, 2];
const PATTERN_B = [5, 4, 3, 4, 2, 3, 1, 2];
const BASE_LEVEL = 0.42;

class ClassroomMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null; // âm lượng tổng (theo thanh trượt ở trang điều khiển)
  private duck: GainNode | null = null; // nhỏ xuống khi cô đọc
  private delaySend: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private chordIdx = 0;
  private stepIdx = 0;
  private nextChordAt = 0;
  private nextStepAt = 0;
  private nextBeatAt = 0;
  private beatIdx = 0;
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
      comp.threshold.value = -28;
      comp.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.gain.value = 1;
      this.duck.connect(comp);
      this.bus = ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.duck);
      // delay ngắn cho tiếng gảy có độ nảy vui tai
      const delay = ctx.createDelay(1);
      delay.delayTime.value = BEAT * 0.5;
      const fb = ctx.createGain();
      fb.gain.value = 0.25;
      const fbFilter = ctx.createBiquadFilter();
      fbFilter.type = 'lowpass';
      fbFilter.frequency.value = 2200;
      delay.connect(fbFilter).connect(fb).connect(delay);
      const wet = ctx.createGain();
      wet.gain.value = 0.15;
      delay.connect(wet).connect(this.bus);
      this.delaySend = ctx.createGain();
      this.delaySend.gain.value = 1;
      this.delaySend.connect(delay);
    }
    return this.ctx;
  }

  /** Gọi bất cứ lúc nào: nếu nhạc đang bật mà context bị treo thì mở lại */
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
        this.nextChordAt = t + 0.1;
        this.nextStepAt = t + 0.1;
        this.nextBeatAt = t + 0.1;
        this.beatIdx = 0;
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
    this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, this.ctx.currentTime, 0.2);
  }

  /** Cô đang đọc thì nhạc nhỏ xuống còn ~1/3, hết đọc lại lớn dần */
  setDucked(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    if (!this.ctx || !this.duck) return;
    this.duck.gain.setTargetAtTime(on ? 0.32 : 1, this.ctx.currentTime, 0.25);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 1.2;
    while (this.nextChordAt < ahead) {
      const i = this.chordIdx % CHORDS.length;
      this.playChord(CHORDS[i], this.nextChordAt);
      this.playBass(BASS[i], this.nextChordAt, 0.055);
      this.playBass(BASS[i], this.nextChordAt + CHORD_SEC / 2, 0.035); // bass nảy thêm giữa ô nhịp
      this.chordIdx++;
      this.nextChordAt += CHORD_SEC;
    }
    while (this.nextStepAt < ahead) {
      const pattern = Math.floor(this.stepIdx / 8) % 2 === 0 ? PATTERN_A : PATTERN_B;
      const note = pattern[this.stepIdx % 8];
      if (note >= 0) this.playPluck(PENTA[note], this.nextStepAt);
      if (this.stepIdx % 2 === 1) this.playClap(this.nextStepAt); // phách gỗ điểm ở móc đơn lẻ
      this.stepIdx++;
      this.nextStepAt += STEP_SEC;
    }
    while (this.nextBeatAt < ahead) {
      const beat = this.beatIdx % 4;
      // trống hội: phách 1 và 3 trống lớn "tùng", phách 2 và 4 trống nhỏ "cắc"
      if (beat === 0 || beat === 2) this.playDrum(this.nextBeatAt, true);
      else this.playDrum(this.nextBeatAt, false);
      if (this.beatIdx % 16 === 0) this.playGong(this.nextBeatAt); // chiêng mở mỗi vòng 4 ô nhịp
      this.beatIdx++;
      this.nextBeatAt += BEAT;
    }
  }

  /** Trống hội tổng hợp: màng trống = sine trượt tần + lớp nhiễu ngắn ở đầu tiếng */
  private playDrum(at: number, big: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const f0 = big ? 165 : 210;
    const f1 = big ? 52 : 78;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f1, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(big ? 0.22 : 0.11, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + (big ? 0.34 : 0.2));
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 0.4);
    const dur = 0.03;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = big ? 900 : 1800;
    const ng = ctx.createGain();
    ng.gain.value = big ? 0.05 : 0.035;
    src.connect(hp).connect(ng).connect(this.bus);
    src.start(at);
  }

  /** Phách gỗ: tiếng "cốc" ngắn bằng nhiễu lọc băng hẹp */
  private playClap(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const dur = 0.035;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(bp).connect(g).connect(this.bus);
    src.start(at);
  }

  /** Chiêng nhỏ mở vòng: vài hài kim loại không nguyên tỉ lệ, ngân dài, âm lượng nhỏ */
  private playGong(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const base = 392.0;
    for (const [mult, vol] of [
      [1, 0.028],
      [2.02, 0.014],
      [2.74, 0.01],
      [4.1, 0.005],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
      osc.connect(g).connect(this.bus);
      osc.start(at);
      osc.stop(at + 2.8);
    }
  }

  private playChord(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    for (const f of freqs) {
      for (const [type, mult, vol] of [
        ['sine', 1, 0.04],
        ['triangle', 1.003, 0.016],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.7);
        g.gain.setValueAtTime(vol, at + CHORD_SEC - 0.3);
        g.gain.linearRampToValueAtTime(0, at + CHORD_SEC + 0.9);
        osc.connect(g).connect(this.bus);
        osc.start(at);
        osc.stop(at + CHORD_SEC + 1);
      }
    }
  }

  private playBass(freq: number, at: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 1.4);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + BEAT * 1.5);
  }

  private playPluck(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.delaySend) return;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.connect(this.bus);
    lp.connect(this.delaySend);
    for (const [type, vol] of [
      ['triangle', 0.07],
      ['sine', 0.028],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
      osc.connect(g).connect(lp);
      osc.start(at);
      osc.stop(at + 0.8);
    }
  }
}

export const music = new ClassroomMusic();
