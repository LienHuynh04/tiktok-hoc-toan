// Nhạc nền lớp học oẳn tù xì soạn bằng Web Audio ngay trong trang stage: giai điệu
// vui tươi kiểu nhạc lớp học — đệm hợp âm sáng, tiếng gảy ngũ cung nhảy nhót, bass
// nảy theo phách. Không dùng file nhạc ngoài (repo chỉ đẩy được file chữ) nên không
// dính bản quyền. Nhạc tự nhỏ xuống (duck) trong lúc cô giáo đọc, cho tiếng nói rõ.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook sẽ gọi
// resume() liên tục (mọi sự kiện + watchdog) nên nhạc tự lên ngay khi được phép.

const BPM = 104;
const BEAT = 60 / BPM;
const CHORD_SEC = BEAT * 4; // mỗi hợp âm 1 ô nhịp 4 phách
const STEP_SEC = BEAT / 2; // giai điệu chạy theo nốt móc đơn

// C – Am – F – G: vòng hợp âm tươi sáng kinh điển của nhạc vui
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 523.25], // C4 E4 G4 C5 — C
  [220.0, 261.63, 329.63, 440.0], // A3 C4 E4 A4 — Am
  [174.61, 220.0, 261.63, 349.23], // F3 A3 C4 F4 — F
  [196.0, 246.94, 293.66, 392.0], // G3 B3 D4 G4 — G
];
const BASS = [130.81, 110.0, 87.31, 98.0]; // C3 A2 F2 G2
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // ngũ cung C: C5 D5 E5 G5 A5 C6
// 8 bước móc đơn cho 1 hợp âm; -1 = nghỉ. Hai biến tấu thay nhau cho khỏi nhàm.
const PATTERN_A = [2, -1, 4, 3, 2, 1, 2, -1];
const PATTERN_B = [4, 3, 2, 4, 5, 4, 3, 2];
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
      this.stepIdx++;
      this.nextStepAt += STEP_SEC;
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
