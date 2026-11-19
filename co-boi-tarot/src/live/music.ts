// Nhạc nền Cô Bói Tarot — bản nhạc GỐC soạn bằng Web Audio ngay trong trang stage:
// "Hộp Nhạc Đêm Trăng": giai điệu hộp nhạc (music box) tự sáng tác trên vòng hợp âm
// Am – F – C – G, đệm pad mềm và (khi có khách) nhịp trầm rất khẽ. Soạn riêng cho game
// này, không dùng file nhạc ngoài nên không dính bản quyền.
// Nhạc BIẾN THEO PHA: phòng vắng = thưa và mơ màng; có khách/trải/lật bài = đủ giai
// điệu + nhịp trầm; đang đọc bài = thưa lại và tự nhỏ xuống (duck) dưới giọng cô.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook gọi resume()
// liên tục, không có cách lách nào khác.

export type MusicMode = 'idle' | 'active' | 'reading';

const STEP_SEC = 0.5; // lưới giai điệu: mỗi bước 0.5 giây
const STEPS_PER_BAR = 16; // 1 ô nhịp = 8 giây (khớp vòng pad cũ)
const BAR_SEC = STEP_SEC * STEPS_PER_BAR;

export const TRACK = {
  // Am – F – C – G: tần số pad (2 nốt thấp + 2 nốt giữa mỗi hợp âm)
  chords: [
    [110.0, 164.81, 220.0, 261.63], // A2 E3 A3 C4 — Am
    [87.31, 130.81, 174.61, 220.0], // F2 C3 F3 A3 — F
    [98.0, 146.83, 196.0, 261.63], // G2 D3 G3... giữ nhịp trầm (dùng G sớm cho mượt)
    [130.81, 196.0, 246.94, 329.63], // C3 G3 B3 E4 — C
  ] as number[][],
  // Giai điệu hộp nhạc tự sáng tác: 64 bước = 4 ô nhịp (Am F C G), 0 = nghỉ.
  // Nốt chỉ nằm ở bước chẵn; chế độ thưa (idle/reading) bỏ thêm một nửa số nốt.
  melody: [
    // Am: A4 C5 E5 A5 G5 E5 C5 E5
    440.0, 0, 523.25, 0, 659.25, 0, 880.0, 0, 783.99, 0, 659.25, 0, 523.25, 0, 659.25, 0,
    // F: F5 A5 G5 F5 E5 F5 D5 (nghỉ)
    698.46, 0, 880.0, 0, 783.99, 0, 698.46, 0, 659.25, 0, 698.46, 0, 587.33, 0, 0, 0,
    // C: E5 G5 C6 G5 A5 G5 E5 (nghỉ)
    659.25, 0, 783.99, 0, 1046.5, 0, 783.99, 0, 880.0, 0, 783.99, 0, 659.25, 0, 0, 0,
    // G: D5 G5 A5 G5 E5 D5 B4 (nghỉ, dẫn về Am)
    587.33, 0, 783.99, 0, 880.0, 0, 783.99, 0, 659.25, 0, 587.33, 0, 493.88, 0, 0, 0,
  ] as number[],
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
  private mode: MusicMode = 'idle';

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
        this.timer = setInterval(() => this.schedule(), 200);
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

  /** Chế độ theo pha của phòng: idle (vắng) / active (có khách, trải, lật, đoán) / reading (đang đọc bài) */
  setMode(mode: MusicMode) {
    this.mode = mode;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 1.4;
    while (this.nextStepAt < ahead) {
      this.playStep(this.stepIdx, this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += STEP_SEC;
    }
  }

  // 1 bước = 0.5 giây; 16 bước = 1 ô nhịp pad. Giai điệu hộp nhạc chạy vòng 64 bước (32 giây).
  private playStep(step: number, at: number) {
    const inBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    if (inBar === 0) this.pad(TRACK.chords[bar % TRACK.chords.length], at);
    // Nhịp trầm rất khẽ: chỉ khi có khách (active), gõ nốt gốc của hợp âm ở đầu và giữa ô nhịp
    if (this.mode === 'active' && (inBar === 0 || inBar === 8)) {
      this.bass(TRACK.chords[bar % TRACK.chords.length][0], at);
    }
    const note = TRACK.melody[step % TRACK.melody.length];
    if (note > 0) {
      // Chế độ thưa (vắng / đang đọc): chỉ giữ nốt ở các bước chia hết cho 4, còn lại bỏ
      const sparse = this.mode !== 'active';
      if (!sparse || step % 4 === 0) this.musicBox(note, at);
    }
    if (step % 64 === 60) this.musicBox(1318.5, at, 0.35); // điểm sáng rất khẽ cuối vòng 4 ô nhịp
  }

  /** Hộp nhạc: sine nền + hài âm cao (gần 4 lần tần số) tắt nhanh, thân nốt ngân ~1.6 giây */
  private musicBox(freq: number, at: number, volScale = 1) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const vol = (this.mode === 'reading' ? 0.042 : 0.055) * volScale;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 1.7);
    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 3.98;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vol * 0.25, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    harm.connect(hg).connect(this.bus);
    harm.start(at);
    harm.stop(at + 0.4);
  }

  /** Nhịp trầm: triangle ở tần số gốc của hợp âm, lên xuống mềm trong ~1.4 giây */
  private bass(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.05, at + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + 1.5);
  }

  /** Pad: 4 nốt sine+triangle detuned nhẹ, attack nhả chậm 3 giây, ngân hết ô nhịp */
  private pad(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const level = this.mode === 'idle' ? 0.8 : 1; // phòng vắng: pad cũng lùi nhẹ cho thoáng
    for (const f of freqs) {
      for (const det of [0, 4]) {
        const osc = ctx.createOscillator();
        osc.type = det === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.detune.value = det;
        const g = ctx.createGain();
        const peak = (det === 0 ? 0.028 : 0.01) * level;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(peak, at + 3);
        g.gain.setValueAtTime(peak, at + BAR_SEC - 2.6);
        g.gain.linearRampToValueAtTime(0, at + BAR_SEC + 0.4);
        osc.connect(g).connect(this.bus);
        osc.start(at);
        osc.stop(at + BAR_SEC + 0.5);
      }
    }
  }
}

export const music = new MysticMusic();
