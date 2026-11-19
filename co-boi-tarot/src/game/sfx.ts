import { IS_STAGE } from '../live/page';

/**
 * Hiệu ứng âm thanh lật bài, tổng hợp bằng Web Audio ngay trong trang stage (không file nhạc):
 * tiếng "vút" (whoosh) khi lá nhấc lên xoay, tiếng "thụp" (thock) trầm khi lá chạm bàn.
 * Chỉ phát trên trang stage và không ở chế độ xem thử im lặng (?mute=1). Trình duyệt cần 1
 * tương tác đầu tiên trong LIVE Studio mới cho mở tiếng: mỗi lần gọi đều thử resume(),
 * chưa mở khoá được thì bỏ qua lặng lẽ (giống cách nhạc nền xử lý).
 */
const MUTED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mute') === '1';
const ENABLED = IS_STAGE && !MUTED;

class FlipSfx {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext | null {
    if (!ENABLED || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Vút: nhiễu trắng qua bandpass quét 500 -> 2600 Hz, phồng rồi xẹp trong ~0.38s */
  private whoosh(at: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const dur = 0.38;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(500, at);
    bp.frequency.exponentialRampToValueAtTime(2600, at + dur * 0.75);
    bp.frequency.exponentialRampToValueAtTime(900, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  /** Thụp: sine trượt 170 -> 62 Hz trong 0.13s + một click nhiễu rất ngắn, nghe như lá chạm mặt bàn */
  private thock(at: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, at);
    osc.frequency.exponentialRampToValueAtTime(62, at + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.18);
    const click = ctx.createBufferSource();
    click.buffer = this.noiseBuffer();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.07, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
    click.connect(hp).connect(cg).connect(ctx.destination);
    click.start(at);
    click.stop(at + 0.06);
  }

  private noiseBuf: AudioBuffer | null = null;
  private noiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    return this.noiseBuf;
  }

  /** Một lần lật: vút ngay khi lá nhấc lên, thụp đúng lúc lá chạm bàn (~0.82s, khớp animation fortune-flip-lift).
   *  Lá 3 lật chậm kiểu slow-motion (1.4s): tiếng thụp dời tới ~1.18s cho khớp hình. */
  flip(slow = false) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.whoosh(t);
    this.thock(t + (slow ? 1.18 : 0.82));
  }

  /** Tiếng chuông hộp nhạc đơn: sine + hài âm cao tắt nhanh, thân ngân theo decay truyền vào */
  private chime(freq: number, at: number, vol: number, decay = 1.4) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + decay + 0.1);
    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 3.98;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vol * 0.22, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    harm.connect(hg).connect(ctx.destination);
    harm.start(at);
    harm.stop(at + 0.35);
  }

  /** Lá xuôi thường: arpeggio chuông sáng 3 nốt đi lên, gọi ở khoảnh khắc lá chạm bàn */
  upright() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.chime(659.25, t, 0.11);
    this.chime(783.99, t + 0.07, 0.11);
    this.chime(880.0, t + 0.14, 0.12, 1.8);
  }

  /** Lá ngược: chuông trầm tối (A2 + E3) ngân dài, hơi nặng, gọi ở khoảnh khắc lá chạm bàn */
  reversed() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.chime(110.0, t, 0.2, 2.2);
    this.chime(164.81, t + 0.05, 0.13, 1.9);
    this.chime(220.0, t + 0.1, 0.06, 1.2);
  }

  /** Lá Ẩn Chính: nhạc hiệu vàng — chùm chuông 5 nốt + ngân sáng dài + tiếng cồng mềm */
  major() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    [523.25, 659.25, 783.99, 880.0, 1046.5].forEach((f, i) => this.chime(f, t + i * 0.06, 0.12, 2.0));
    this.chime(2093.0, t + 0.3, 0.035, 1.8); // vệt sáng cao
    const gong = ctx.createOscillator();
    gong.type = 'sine';
    gong.frequency.value = 196.0;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.09, t);
    gg.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    gong.connect(gg).connect(ctx.destination);
    gong.start(t);
    gong.stop(t + 2.5);
  }

  /** Nhảy hạng trong hàng chờ: 2 tiếng chuông nhỏ lấp lánh */
  sparkle() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.chime(880.0, t, 0.07, 0.7);
    this.chime(1318.5, t + 0.08, 0.07, 0.9);
  }
}

export const sfx = new FlipSfx();
