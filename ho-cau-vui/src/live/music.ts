// Nhạc nền hồ câu soạn bằng Web Audio ngay trong trang stage: sớm mai bên hồ —
// đệm hợp âm ấm (pad), giai điệu gảy ngũ cung chậm rãi vọng qua delay, tiếng nước
// vỗ bờ rất khẽ. Không dùng file nhạc ngoài (repo chỉ đẩy được file chữ) nên không
// dính bản quyền. Nhạc tự nhỏ xuống (duck) trong lúc MC đọc, cho tiếng nói rõ.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook sẽ gọi
// resume() liên tục (mọi sự kiện + watchdog) nên nhạc tự lên ngay khi được phép.

const BPM = 72;
const BEAT = 60 / BPM;
const CHORD_SEC = BEAT * 8; // mỗi hợp âm 2 nhịp phách (2 bars)
const STEP_SEC = BEAT / 2; // giai điệu chạy theo nốt móc đơn

// Cmaj7 – G/B – Am7 – Fmaj7: vòng hợp âm hiền, đúng chất buổi sớm yên tĩnh
const CHORDS: number[][] = [
  [130.81, 196.0, 329.63, 493.88], // C3 G3 E4 B4 — Cmaj7
  [123.47, 196.0, 293.66, 392.0], // B2 G3 D4 G4 — G/B
  [110.0, 164.81, 261.63, 392.0], // A2 E3 C4 G4 — Am7
  [174.61, 220.0, 261.63, 329.63], // F3 A3 C4 E4 — Fmaj7
];
const BASS = [65.41, 98.0, 55.0, 87.31]; // C2 G2 A1 F2
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // ngũ cung C: C5 D5 E5 G5 A5 C6
// 16 bước móc đơn cho 1 vòng hợp âm; -1 = nghỉ. Hai biến tấu thay nhau cho khỏi nhàm.
const PATTERN_A = [4, -1, 2, -1, 3, -1, 2, 1, 2, -1, 0, -1, 1, 2, -1, -1];
const PATTERN_B = [2, -1, 4, -1, 5, 4, -1, 2, 3, -1, 2, 1, -1, 0, -1, -1];
const BASE_LEVEL = 0.5;

class FishingMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null; // âm lượng tổng (theo thanh trượt ở trang điều khiển)
  private duck: GainNode | null = null; // nhỏ xuống khi MC đọc
  private delaySend: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private chordIdx = 0;
  private stepIdx = 0;
  private nextChordAt = 0;
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
      comp.threshold.value = -28;
      comp.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.gain.value = 1;
      this.duck.connect(comp);
      this.bus = ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.duck);
      // delay vọng lại cho tiếng gảy có không gian mặt hồ
      const delay = ctx.createDelay(1);
      delay.delayTime.value = BEAT * 0.75; // nốt móc ba
      const fb = ctx.createGain();
      fb.gain.value = 0.34;
      const fbFilter = ctx.createBiquadFilter();
      fbFilter.type = 'lowpass';
      fbFilter.frequency.value = 1800;
      delay.connect(fbFilter).connect(fb).connect(delay);
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      delay.connect(wet).connect(this.bus);
      this.delaySend = ctx.createGain();
      this.delaySend.gain.value = 1;
      this.delaySend.connect(delay);
      this.startWater();
    }
    return this.ctx;
  }

  /** Tiếng nước vỗ bờ: nhiễu lọc dải, lên xuống rất chậm như sóng lăn tăn */
  private startWater() {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 480;
    bp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.value = 0.011;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.005;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(bp).connect(g).connect(this.bus);
    src.start();
    lfo.start();
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

  /** MC đang đọc thì nhạc nhỏ xuống còn ~1/3, hết đọc lại lớn dần */
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
      this.playBass(BASS[i], this.nextChordAt);
      this.chordIdx++;
      this.nextChordAt += CHORD_SEC;
    }
    while (this.nextStepAt < ahead) {
      const pattern = Math.floor(this.stepIdx / 16) % 2 === 0 ? PATTERN_A : PATTERN_B;
      const note = pattern[this.stepIdx % 16];
      if (note >= 0) this.playPluck(PENTA[note], this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += STEP_SEC;
    }
  }

  private playChord(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    for (const f of freqs) {
      for (const [type, mult, vol] of [
        ['sine', 1, 0.045],
        ['triangle', 1.003, 0.018],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(vol, at + 2.8);
        g.gain.setValueAtTime(vol, at + CHORD_SEC - 1.2);
        g.gain.linearRampToValueAtTime(0, at + CHORD_SEC + 2.2);
        osc.connect(g).connect(this.bus);
        osc.start(at);
        osc.stop(at + CHORD_SEC + 2.3);
      }
    }
  }

  private playBass(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.05, at + 0.5);
    g.gain.setValueAtTime(0.05, at + CHORD_SEC - 1.5);
    g.gain.linearRampToValueAtTime(0, at + CHORD_SEC);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + CHORD_SEC + 0.1);
  }

  private playPluck(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.delaySend) return;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    lp.connect(this.bus);
    lp.connect(this.delaySend);
    for (const [type, vol] of [
      ['triangle', 0.075],
      ['sine', 0.03],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.5);
      osc.connect(g).connect(lp);
      osc.start(at);
      osc.stop(at + 1.6);
    }
  }
}

export const music = new FishingMusic();
