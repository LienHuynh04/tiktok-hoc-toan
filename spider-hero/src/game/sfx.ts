// Hiệu ứng âm thanh Spider Hero — tổng hợp bằng Web Audio, không dùng file ngoài:
// thwip khi tơ bám, whoosh khi buông tơ/tăng tốc, thud khi đáp nóc nhà, pop khi
// bão tơ nổ. Âm lượng để nhỏ dưới nhạc và giọng MC. Trình duyệt chỉ cho phát
// tiếng sau tương tác đầu tiên — trang stage gọi resume() liên tục như nhạc.

class HeroSfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.ctx;
  }

  resume() {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private noise(dur: number, fFrom: number, fTo: number, vol: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = 1.1;
    f.frequency.setValueAtTime(fFrom, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, fTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  private sweep(dur: number, fFrom: number, fTo: number, vol: number, type: OscillatorType = 'sine') {
    const ctx = this.ensure();
    if (!ctx || !this.master || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(fFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, fTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** Tơ vừa bám vào điểm neo: "thwip" ngắn, sắc. */
  thwip() {
    this.sweep(0.08, 950, 280, 0.5, 'square');
    this.noise(0.06, 2800, 900, 0.35);
  }

  /** Buông tơ lao đi / tăng tốc: gió rít qua. */
  whoosh(strength = 0.7) {
    this.noise(0.38, 420, 1500, 0.25 + 0.45 * Math.min(1, strength));
  }

  /** Đáp nóc nhà: tiếng "bụp" trầm. */
  thud() {
    this.sweep(0.13, 130, 44, 0.7);
    this.noise(0.1, 300, 120, 0.3, 'lowpass');
  }

  /** Bão tơ / vụ nổ tơ: nổ sáng + ù tai ngắn. */
  pop(big = false) {
    this.noise(big ? 0.5 : 0.3, 900, 2400, big ? 0.6 : 0.4);
    this.sweep(big ? 0.4 : 0.25, 300, 1250, 0.25, 'triangle');
  }
}

export const sfx = new HeroSfx();
