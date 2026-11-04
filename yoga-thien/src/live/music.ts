// Nhạc thiền soạn bằng Web Audio ngay trong trang stage: đệm hợp âm êm (pad) chồng lớp
// + tiếng chuông bát hát điểm xuyết theo thang ngũ cung. Không dùng file nhạc ngoài
// nên không dính bản quyền. Âm lượng rất nhỏ, hợp để nghe thư giãn và dễ ngủ.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook sẽ gọi resume()
// liên tục (mọi sự kiện + watchdog) nên nhạc tự lên ngay khi được phép.

const CHORDS: number[][] = [
  [196.0, 261.63, 329.63, 493.88], // G3 C4 E4 B4 — Cmaj7
  [220.0, 261.63, 329.63, 392.0], // A3 C4 E4 G4 — Am7
  [174.61, 220.0, 261.63, 329.63], // F3 A3 C4 E4 — Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G3 B3 D4 E4 — G6
];
const BOWL_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // ngũ cung C
const CHORD_SEC = 10;

class MeditationMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private chordIdx = 0;
  private nextChordAt = 0;
  private nextBowlAt = 0;
  enabled = false;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -28;
      comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(comp);
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
    if (!ctx || !this.master) return;
    if (on) {
      void ctx.resume();
      const t = ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0.5, t, 1.2);
      if (!this.timer) {
        this.nextChordAt = t;
        this.nextBowlAt = t + 2.5;
        this.timer = setInterval(() => this.schedule(), 400);
        this.schedule();
      }
    } else {
      const t = ctx.currentTime;
      this.master.gain.setTargetAtTime(0, t, 0.4);
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const ahead = ctx.currentTime + 1.2;
    while (this.nextChordAt < ahead) {
      this.playChord(CHORDS[this.chordIdx % CHORDS.length], this.nextChordAt);
      this.chordIdx++;
      this.nextChordAt += CHORD_SEC;
    }
    if (this.nextBowlAt < ahead) {
      this.playBowl(this.nextBowlAt);
      this.nextBowlAt = ctx.currentTime + 6 + Math.random() * 8;
    }
  }

  private playChord(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    for (const f of freqs) {
      for (const [type, mult, vol] of [
        ['sine', 1, 0.05],
        ['triangle', 1.003, 0.02],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(vol, at + 3.2);
        g.gain.setValueAtTime(vol, at + CHORD_SEC - 1.5);
        g.gain.linearRampToValueAtTime(0, at + CHORD_SEC + 2.5);
        osc.connect(g).connect(this.master);
        osc.start(at);
        osc.stop(at + CHORD_SEC + 2.6);
      }
    }
  }

  private playBowl(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const f = BOWL_NOTES[Math.floor(Math.random() * BOWL_NOTES.length)];
    for (const [mult, vol] of [
      [1, 0.055],
      [2.99, 0.014],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 5);
      osc.connect(g).connect(this.master);
      osc.start(at);
      osc.stop(at + 5.1);
    }
  }
}

export const music = new MeditationMusic();
