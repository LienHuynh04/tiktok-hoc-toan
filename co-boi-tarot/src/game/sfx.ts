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

  /** Một lần lật: vút ngay khi lá nhấc lên, thụp đúng lúc lá chạm bàn (~0.82s, khớp animation fortune-flip-lift) */
  flip() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.whoosh(t);
    this.thock(t + 0.82);
  }
}

export const sfx = new FlipSfx();
