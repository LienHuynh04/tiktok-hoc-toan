// Engine Spider Hero — anh hùng nguyên bản tự chạy/nhảy/đu tơ bay vô tận qua
// thành phố 3D. Người xem không điều khiển trực tiếp: họ THẢ TIM, tim cộng dồn
// vào quỹ chung, engine rút quỹ theo BẢNG MỐC LIKE (config) thành hiệu ứng —
// gom batch, có cooldown, ưu tiên mốc lớn, không cắt ngang animation đang chạy.
//
// Vật lý chạy bằng advance(now) theo giờ thật (stage gọi mỗi khung hình);
// tick(now) lo MC + bộ rút hiệu ứng. Mọi toạ độ là mét thế giới (x tiến, y lên,
// z ngang; đường bay ở z = 0).
import { GAME, LIKE_TIERS } from './config';
import { anchorsInRange, roofAt, type Anchor3 } from './city3d';

export interface Person {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
}

export interface Say {
  text: string;
  main?: boolean;
  priority?: boolean;
  ttl?: number;
}

export type FxKind = 'web1' | 'web5' | 'jump' | 'webDual' | 'speed' | 'flip' | 'barrage' | 'storm' | 'explosion' | 'mega';

export interface FxEvent {
  id: number;
  fx: FxKind;
  at: number;
}

export interface WebFx {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  born: number;
  ttl: number;
  gold: boolean;
}

export interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  born: number;
  ttl: number;
  kind: 'spark' | 'heart' | 'poof';
}

export type HeroMode = 'run' | 'air' | 'swing' | 'hang';

export interface HeroScene {
  hero: {
    x: number;
    y: number;
    z: number;
    rot: number;
    vx: number;
    vy: number;
    mode: HeroMode;
    ax: number;
    ay: number;
    az: number;
    runPhase: number;
    landAt: number;
  };
  webs: WebFx[];
  sparks: Spark[];
  storm: boolean;
  burst: boolean;
  dist: number;
}

export interface HeroView {
  dist: number;
  speedKmh: number;
  mode: HeroMode;
  totalLikes: number;
  credit: number;
  nextTier: { fx: FxKind; label: string; cost: number; have: number } | null;
  fxRecent: FxEvent[];
  banner: string | null;
  quiz: { text: string; answer: number; leftMs: number; totalMs: number; solvedBy: string | null } | null;
  totals: { flips: number; storms: number; jumps: number; webShots: number };
  scene: HeroScene;
  musicOn: boolean;
  musicVolume: number;
}

// MC của phòng: giọng NỮ (tiền tố "F:" — khung giọng đọc "M:" là nam, "F:" là nữ)
const M = (s: string) => `F: ${s}`;

// Đọc số tiếng Việt (0–999) cho MC đọc câu đố thành tiếng
const VI_ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function viNum(n: number): string {
  if (n < 10) return VI_ONES[n];
  if (n < 20) {
    const u = n % 10;
    return 'mười' + (u === 0 ? '' : u === 5 ? ' lăm' : ' ' + VI_ONES[u]);
  }
  const t = Math.floor(n / 10);
  const u = n % 10;
  return VI_ONES[t] + ' mươi' + (u === 0 ? '' : u === 1 ? ' mốt' : u === 5 ? ' lăm' : ' ' + VI_ONES[u]);
}

const FX_BANNER: Partial<Record<FxKind, string>> = {
  speed: '⚡ ĐU DÂY TỐC ĐỘ CAO!',
  flip: '🌀 LỘN VÒNG TRÊN KHÔNG!',
  barrage: '🕸️ MƯA TƠ NHIỀU HƯỚNG!',
  storm: '🕸️ BÃO TƠ!',
  explosion: '💥 VỤ NỔ TƠ!',
  mega: '🌟 SIÊU BÃO TƠ!',
};

export class HeroRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  // --- vật lý ---
  private mode: HeroMode = 'run';
  private x = 20;
  private y = 20;
  private z = 0;
  private vx = GAME.runSpeed;
  private vy = 0;
  private ax = 0;
  private ay = 80;
  private az = 0;
  private len = 30;
  private ang = -0.5;
  private omg = 1;
  private rot = 0;
  private rotV = 0;
  private modeSince = 0;
  private runPhase = 0;
  private landAt = 0;
  private lastAdvance = 0;
  private started = false;

  // --- like + hiệu ứng ---
  private totalLikes = 0;
  private credit = 0;
  private tierReadyAt = new Map<FxKind, number>();
  private fxQueue: FxEvent[] = [];
  private fxSeq = 0;
  private lastSchedAt = 0;
  private burstUntil = 0;
  private stormUntil = 0;
  private webs: WebFx[] = [];
  private sparks: Spark[] = [];

  // --- nhịp show ---
  private nextMilestone = GAME.milestoneM;
  private pendingMilestone = 0;
  private bannerText: string | null = null;
  private bannerUntil = 0;
  private nextIdleAt = 0;
  private totals = { flips: 0, storms: 0, jumps: 0, webShots: 0 };

  // --- treo ngược trình diễn ---
  private nextHangAt = Number.MAX_SAFE_INTEGER;
  private hangFromX = 0;
  private hangFromY = 0;
  private pendingHang = false;

  // --- câu đố tính nhanh ---
  private quiz: { text: string; spoken: string; answer: number; endsAt: number; solvedBy: string | null; rewarded: Set<string> } | null = null;
  private nextQuizAt = 0;

  constructor(
    private now0: number,
    private rng: () => number = Math.random,
  ) {
    this.resetHero(now0);
    this.lastAdvance = now0;
  }

  newSession(now: number): Say[] {
    this.totalLikes = 0;
    this.credit = 0;
    this.tierReadyAt.clear();
    this.fxQueue = [];
    this.burstUntil = 0;
    this.stormUntil = 0;
    this.webs = [];
    this.sparks = [];
    this.totals = { flips: 0, storms: 0, jumps: 0, webShots: 0 };
    this.nextMilestone = GAME.milestoneM;
    this.pendingMilestone = 0;
    this.bannerText = null;
    this.resetHero(now);
    this.lastAdvance = now;
    this.nextIdleAt = now + GAME.idleLineEveryMs;
    this.started = true;
    return [
      { main: true, text: M('Chào cả nhà! Spider Hero ra phố đây. Cả nhà thả tim càng nhiều, Hero bắn tơ càng hoành tráng nhé!') },
      { text: M('Năm trăm tim là có Bão Tơ, một ngàn tim là Vụ Nổ Tơ luôn đó. Thả tim đi cả nhà!'), ttl: GAME.chatterMaxWaitMs },
    ];
  }

  private resetHero(now: number) {
    this.x = 20;
    const roof = roofAt(this.x);
    this.y = roof > 0 ? roof : 18;
    this.z = 0;
    this.mode = 'run';
    this.vx = GAME.runSpeed;
    this.vy = 0;
    this.rot = 0;
    this.rotV = 0;
    this.runPhase = 0;
    this.modeSince = now;
    this.nextHangAt = now + 12_000; // lần treo ngược đầu tiên sau ~12 giây
    this.pendingHang = false;
    this.quiz = null;
    this.nextQuizAt = now + GAME.quizFirstMs;
  }

  // ---------------- vật lý ----------------

  advance(now: number) {
    let dt = Math.min(0.25, Math.max(0, (now - this.lastAdvance) / 1000));
    this.lastAdvance = now;
    while (dt > 0) {
      const step = Math.min(dt, 1 / 120);
      dt -= step;
      this.stepPhysics(step, now);
    }
    this.webs = this.webs.filter((w) => now - w.born < w.ttl);
    this.sparks = this.sparks.filter((s) => now - s.born < s.ttl);
    if (this.fxQueue.length > 40) this.fxQueue.splice(0, this.fxQueue.length - 40);
  }

  private syncSwingPos() {
    this.x = this.ax + this.len * Math.sin(this.ang);
    this.y = this.ay - this.len * Math.cos(this.ang);
  }

  private stepPhysics(dt: number, now: number) {
    const burst = now < this.burstUntil;
    if (this.mode === 'run') {
      const sp = GAME.runSpeed * (burst ? 1.35 : 1);
      this.vx = sp;
      this.x += sp * dt;
      this.runPhase += sp * dt * 1.75;
      const ahead = roofAt(this.x + 1.2);
      const cur = roofAt(this.x);
      if (ahead < 0 || cur - ahead > 7) {
        // hết nóc nhà: nhảy vọt sang toà tiếp theo
        this.mode = 'air';
        this.modeSince = now;
        this.vy = GAME.jumpVel;
        this.y = cur > 0 ? cur : this.y;
      } else {
        this.y = ahead > 0 ? ahead : this.y;
      }
      this.rot *= 1 - 8 * dt;
      return;
    }
    if (this.mode === 'hang') {
      // Treo ngược dưới điểm bám: trượt mượt về vị trí treo, đung đưa nhẹ,
      // hết giờ thì buông tay lộn một vòng lao tiếp.
      const t = (now - this.modeSince) / GAME.hangMs;
      if (t >= 1) {
        this.release(Math.max(this.vx, 10.5), 1.2, now, false);
        this.rotV = -5.2;
        this.totals.flips++;
        return;
      }
      const blend = Math.min(1, t / 0.16);
      const ease = blend * blend * (3 - 2 * blend);
      const sway = Math.sin((now - this.modeSince) / 430) * 0.85 * (1 - t * 0.35);
      const hx = this.ax + 2.2 + sway;
      const hy = this.ay - GAME.hangLen;
      this.x = this.hangFromX + (hx - this.hangFromX) * ease;
      this.y = this.hangFromY + (hy - this.hangFromY) * ease;
      this.rot = Math.PI + Math.sin((now - this.modeSince) / 430) * 0.05;
      return;
    }
    if (this.mode === 'swing') {
      const alpha = -(GAME.gravity / this.len) * Math.sin(this.ang) - 0.03 * this.omg;
      this.omg += alpha * dt;
      this.ang += this.omg * dt;
      this.syncSwingPos();
      // Tầng an toàn: vòng đu chạm gần mặt đất thì buông tơ vọt lên, không quệt đất
      if (this.y < 8) {
        const vx = Math.max(this.len * this.omg * Math.cos(this.ang), 11);
        const vy = Math.max(this.len * this.omg * Math.sin(this.ang), 9.5);
        this.spawnSparks(this.x, 7, this.z, 4, 'poof', now);
        this.release(vx, vy, now, false);
        return;
      }
      this.z += (this.az * 0.3 - this.z) * Math.min(1, 2.2 * dt);
      this.rot = -this.ang * 0.4;
      if (this.ang > GAME.releaseAngle && this.omg > 0) {
        // Đến lượt trình diễn: thay vì buông tơ bay tiếp, Hero bắt sợi tơ treo ngược
        // (chỉ khi điểm bám đủ cao và sợi tơ đủ dài để treo an toàn).
        if (now >= this.nextHangAt && this.ay >= GAME.hangMinAnchorY && this.len >= 14) {
          this.mode = 'hang';
          this.modeSince = now;
          this.hangFromX = this.x;
          this.hangFromY = this.y;
          this.nextHangAt = now + GAME.hangEveryMs + this.rng() * 20_000;
          this.pendingHang = true;
          return;
        }
        let vx = this.len * this.omg * Math.cos(this.ang);
        let vy = this.len * this.omg * Math.sin(this.ang);
        const sp = Math.hypot(vx, vy);
        let boost = (burst ? 1.3 : 1) * (sp < GAME.cruiseMin ? GAME.cruiseMin / Math.max(sp, 0.01) : 1);
        if (sp * boost > 30) boost = 30 / Math.max(sp, 0.01); // trần tốc độ: bay quá nhanh thì khung hình khó theo
        vx *= boost;
        vy *= boost;
        this.release(vx, vy, now, this.rng() < 0.3);
      }
      return;
    }
    // air: bay tự do
    this.vy -= GAME.gravity * dt;
    if (burst) this.vx += 5 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += (0 - this.z) * Math.min(1, 1.4 * dt);
    this.rot += this.rotV * dt;
    this.rotV *= 1 - 0.35 * dt;
    // đáp nóc nhà
    const roof = roofAt(this.x);
    if (roof > 0 && this.vy <= 0 && this.y <= roof + 0.05 && this.y > roof - 7) {
      const hard = this.vy < -15;
      this.mode = 'run';
      this.modeSince = now;
      this.y = roof;
      this.vy = 0;
      this.rot = 0;
      this.rotV = 0;
      this.landAt = now;
      if (hard) this.spawnSparks(this.x, roof + 0.4, this.z, 6, 'poof', now);
      return;
    }
    // bắn tơ mới khi gần đỉnh cung / bắt đầu rơi
    if (this.vy < 2.2 && now - this.modeSince > 320) {
      const a = this.pickAnchor();
      if (a) this.attach(a, now);
    }
    // an toàn: không bao giờ rơi xuống đường
    if (this.y < 7 && this.mode === 'air') {
      const a = this.pickAnchor(true);
      if (a) this.attach(a, now);
      else {
        this.vy = Math.abs(this.vy) * 0.5 + 6;
        this.vx = Math.max(this.vx, 13);
        this.y = 7;
      }
    }
  }

  private release(vx: number, vy: number, now: number, flip: boolean) {
    this.vx = vx;
    this.vy = vy;
    this.mode = 'air';
    this.modeSince = now;
    if (flip) {
      this.rotV = (this.rng() < 0.5 ? -1 : 1) * (4.4 + this.rng() * 1.4);
      this.totals.flips++;
    } else {
      this.rotV = 0;
    }
  }

  private pickAnchor(emergency = false): Anchor3 | null {
    const from = this.x + (emergency ? -6 : GAME.anchorMinAhead);
    const to = this.x + (emergency ? 85 : GAME.anchorMaxAhead);
    const cands = anchorsInRange(from, to).filter((a) => a.y > this.y + 9);
    if (!cands.length) return null;
    // Chỉ bám điểm nào mà vòng đu thấp nhất vẫn cách mặt đất >= 8m (tơ dài hơn
    // chiều cao điểm bám thì mèo sẽ quệt đất). Hết lựa chọn an toàn mới lấy
    // điểm thoáng nhất — và tầng an toàn trong lúc đu sẽ xử lý nốt.
    const safe = cands.filter((a) => a.y - Math.hypot(a.x - this.x, a.y - this.y) >= 8);
    const pool = safe.length ? safe : cands;
    let best = pool[0];
    let bestScore = Infinity;
    for (const a of pool) {
      const d = Math.hypot(a.x - this.x, a.y - this.y);
      const score = safe.length ? Math.abs(d - 32) + (a.y < this.y + 16 ? 18 : 0) : -(a.y - d);
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }

  private attach(a: Anchor3, now: number) {
    this.ax = a.x;
    this.ay = a.y;
    this.az = a.z;
    const dx = this.x - a.x;
    const dy = this.y - a.y;
    this.len = Math.max(GAME.minWebLen, Math.hypot(dx, dy));
    this.ang = Math.atan2(dx, -dy);
    const vt = this.vx * Math.cos(this.ang) + this.vy * Math.sin(this.ang);
    this.omg = vt / this.len;
    if (this.omg < 0.5) this.omg = 0.5 + this.rng() * 0.25; // trợ lực: không đu ngược/đứng yên
    this.mode = 'swing';
    this.modeSince = now;
    this.rotV = 0;
  }

  private spawnSparks(x: number, y: number, z: number, n: number, kind: Spark['kind'], now: number) {
    for (let i = 0; i < n; i++) {
      this.sparks.push({
        x: x + (this.rng() - 0.5) * 3,
        y: y + (this.rng() - 0.5) * 3,
        z: z + (this.rng() - 0.5) * 3,
        vx: (this.rng() - 0.5) * 8,
        vy: 1 + this.rng() * 5,
        vz: (this.rng() - 0.5) * 8,
        born: now + i * 25,
        ttl: 700 + this.rng() * 600,
        kind,
      });
    }
  }

  private spawnWebs(n: number, now: number, gold: boolean) {
    const anchors = anchorsInRange(this.x - 25, this.x + 75);
    for (let i = 0; i < n; i++) {
      const a = anchors.length
        ? anchors[Math.floor(this.rng() * anchors.length)]
        : { x: this.x + 25, y: this.y + 30, z: 0 };
      this.webs.push({
        x1: this.x + 0.6,
        y1: this.y + 0.9,
        z1: this.z,
        x2: a.x,
        y2: a.y,
        z2: a.z,
        born: now + i * 45,
        ttl: 900 + this.rng() * 600,
        gold,
      });
      this.totals.webShots++;
    }
    if (this.webs.length > 90) this.webs.splice(0, this.webs.length - 90);
  }

  // ---------------- LIKE: quỹ chung + rút hiệu ứng theo mốc ----------------

  like(_p: Person, count: number, now: number): Say[] {
    this.totalLikes += count;
    this.credit += count;
    return this.schedule(now);
  }

  /** Bộ rút hiệu ứng: chạy theo nhịp (gom batch ~90ms), ưu tiên mốc đắt nhất đủ điều kiện. */
  private schedule(now: number): Say[] {
    if (now - this.lastSchedAt < 90) return [];
    this.lastSchedAt = now;
    const out: Say[] = [];
    for (let iter = 0; iter < 10; iter++) {
      if (this.credit < 1) break;
      const tier = [...LIKE_TIERS]
        .sort((a, b) => b.cost - a.cost)
        .find((t) => t.cost <= this.credit && now >= (this.tierReadyAt.get(t.fx) ?? 0) && this.fxStateOk(t.fx));
      if (!tier) break;
      this.credit -= tier.cost;
      this.tierReadyAt.set(tier.fx, now + tier.cooldownMs);
      this.fireFx(tier.fx, now, out);
    }
    return out;
  }

  private fxStateOk(fx: FxKind): boolean {
    if (fx === 'jump') return this.mode === 'run';
    if (fx === 'flip') return this.mode !== 'run';
    return true;
  }

  private fireFx(fx: FxKind, now: number, out: Say[]) {
    this.fxQueue.push({ id: ++this.fxSeq, fx, at: now });
    const banner = FX_BANNER[fx];
    if (banner) {
      this.bannerText = banner;
      this.bannerUntil = now + 3600;
    }
    switch (fx) {
      case 'web1':
        this.spawnWebs(1, now, false);
        break;
      case 'web5':
        this.spawnWebs(5, now, false);
        break;
      case 'webDual':
        this.spawnWebs(2, now, false);
        this.spawnWebs(2, now + 120, false);
        break;
      case 'barrage':
        this.spawnWebs(14, now, false);
        out.push({ text: M('Mưa tơ nhiều hướng! Cả nhà thả tim dữ quá, Hero bắn tơ không kịp nghỉ tay!'), ttl: GAME.chatterMaxWaitMs });
        break;
      case 'jump':
        this.mode = 'air';
        this.modeSince = now;
        this.vy = 13.5;
        this.vx *= 1.12;
        this.totals.jumps++;
        break;
      case 'speed':
        this.burstUntil = now + 6000;
        out.push({ text: M('Tốc độ cao! Hero đu dây nhanh như gió luôn!'), ttl: GAME.chatterMaxWaitMs });
        break;
      case 'flip':
        if (this.mode === 'swing') {
          const vx = this.len * this.omg * Math.cos(this.ang);
          const vy = this.len * this.omg * Math.sin(this.ang);
          this.release(Math.max(vx, 10), Math.max(vy, 6), now, true);
        } else {
          this.rotV = (this.rng() < 0.5 ? -1 : 1) * 6.4;
          this.totals.flips++;
        }
        break;
      case 'storm':
        this.stormUntil = now + 6000;
        this.burstUntil = now + 8000;
        this.totals.storms++;
        this.spawnWebs(24, now, true);
        out.push({ priority: true, text: M(`Bão Tơ! Cả phòng đã thả tới ${this.totalLikes.toLocaleString('vi-VN')} tim rồi. Tơ giăng kín phố luôn!`) });
        break;
      case 'explosion':
        this.stormUntil = now + 5000;
        this.burstUntil = now + 9000;
        this.totals.storms++;
        this.spawnWebs(36, now, true);
        this.spawnSparks(this.x, this.y + 1, this.z, 26, 'spark', now);
        if (this.mode === 'air') this.rotV = 7.2;
        out.push({ priority: true, text: M('Vụ Nổ Tơ! Một ngàn tim bùng nổ, Hero lộn vòng giữa trời, tơ bay khắp phố!') });
        break;
      case 'mega':
        this.stormUntil = now + 12000;
        this.burstUntil = now + 14000;
        this.totals.storms++;
        this.spawnWebs(60, now, true);
        this.spawnSparks(this.x, this.y + 1, this.z, 40, 'spark', now);
        if (this.mode === 'air') this.rotV = 8;
        out.push({ priority: true, text: M(`Siêu Bão Tơ! Năm ngàn tim! Đây là khoảnh khắc đỉnh nhất của buổi live hôm nay!`) });
        break;
    }
  }

  // ---------------- sự kiện khác ----------------

  join(_p: Person, _now: number) {
    // Người vào phòng: Hero tự bay liên tục, không cần đăng ký
  }

  follow(p: Person, _now: number): Say[] {
    return [{ text: M(`Cảm ơn ${p.spoken} đã theo dõi kênh! Ngồi xem Hero bay và thả tim cùng cả phòng nhé!`), ttl: GAME.chatterMaxWaitMs }];
  }

  /** Sinh một câu tính nhanh mức dễ (cộng/trừ/nhân/chia, số nhỏ). */
  private makeQuiz(now: number) {
    const kind = Math.floor(this.rng() * 4);
    let a = 0;
    let b = 0;
    let ans = 0;
    let sym = '';
    let word = '';
    if (kind === 0) {
      a = 15 + Math.floor(this.rng() * 76);
      b = 8 + Math.floor(this.rng() * 63);
      ans = a + b;
      sym = '+';
      word = 'cộng';
    } else if (kind === 1) {
      a = 30 + Math.floor(this.rng() * 70);
      b = 5 + Math.floor(this.rng() * (a - 10));
      ans = a - b;
      sym = '−';
      word = 'trừ';
    } else if (kind === 2) {
      a = 2 + Math.floor(this.rng() * 8);
      b = 3 + Math.floor(this.rng() * 10);
      ans = a * b;
      sym = '×';
      word = 'nhân';
    } else {
      b = 2 + Math.floor(this.rng() * 8);
      ans = 3 + Math.floor(this.rng() * 10);
      a = b * ans;
      sym = '÷';
      word = 'chia';
    }
    return {
      text: `${a} ${sym} ${b} = ?`,
      spoken: `${viNum(a)} ${word} ${viNum(b)}`,
      answer: ans,
      endsAt: now + GAME.quizMs,
      solvedBy: null as string | null,
      rewarded: new Set<string>(),
    };
  }

  /**
   * Bình luận của người xem: nếu đang có câu đố và bình luận chứa đúng đáp án
   * (con số đầu tiên trong bình luận) thì thưởng — người đúng đầu tiên cho Hero
   * TĂNG TỐC + cộng tim vào quỹ chung; người đúng tiếp theo trong giờ cũng
   * được cộng tim (mỗi người 1 lần/câu). Sai thì im lặng, không phạt.
   */
  chat(e: { p: Person; comment: string }, now: number): Say[] {
    const q = this.quiz;
    if (!q || now >= q.endsAt) return [];
    const m = /-?\d+/.exec(e.comment);
    if (!m || parseInt(m[0], 10) !== q.answer) return [];
    if (q.rewarded.has(e.p.username)) return [];
    q.rewarded.add(e.p.username);
    this.spawnSparks(this.x, this.y + 1.5, this.z, 6, 'heart', now);
    if (!q.solvedBy) {
      q.solvedBy = e.p.nickname;
      this.credit += GAME.quizFirstReward;
      this.burstUntil = Math.max(this.burstUntil, now + 4000);
      q.endsAt = Math.min(q.endsAt, now + 3500); // có người đúng rồi: khép câu nhanh cho nhịp show chạy tiếp
      this.bannerText = `🎉 ${e.p.nickname} tính đúng! Hero TĂNG TỐC!`;
      this.bannerUntil = now + 3200;
      const out = this.schedule(now);
      out.push({
        main: true,
        text: M(`Chính xác! ${e.p.spoken} tính đúng rồi! ${q.spoken} bằng ${viNum(q.answer)}. Hero tăng tốc, cộng ${GAME.quizFirstReward} tim vào quỹ chung nè!`),
      });
      return out;
    }
    this.credit += GAME.quizExtraReward;
    return this.schedule(now);
  }

  thank(p: Person, giftName: string): Say[] {
    this.spawnSparks(this.x, this.y + 1.5, this.z, 8, 'heart', Date.now());
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Hero cúi chào bạn thật ngầu nè!`) }];
  }

  /** Nút test ở trang điều khiển: nạp một đợt tim lớn để xem hiệu ứng mốc cao. */
  demoHero(now: number): Say[] {
    this.totalLikes += 620;
    this.credit += 620;
    this.lastSchedAt = 0;
    return this.schedule(now);
  }

  // ---------------- nhịp MC ----------------

  tick(now: number): Say[] {
    this.advance(now);
    const out: Say[] = [];
    out.push(...this.schedule(now));
    const dist = Math.max(0, Math.floor(this.x - 20));
    while (dist >= this.nextMilestone) {
      this.pendingMilestone = this.nextMilestone;
      this.nextMilestone += GAME.milestoneM;
    }
    if (this.pendingMilestone > 0) {
      const km = (this.pendingMilestone / 1000).toLocaleString('vi-VN');
      this.bannerText = `🎉 Hero đã bay được ${km} km!`;
      this.bannerUntil = now + 4000;
      out.push({ main: true, text: M(`Cả đội ơi, Hero đã bay được ${km} ki lô mét rồi! Thả tim tiếp để bay xa hơn nữa nhé!`) });
      this.pendingMilestone = 0;
    }
    if (this.pendingHang) {
      this.pendingHang = false;
      this.bannerText = '🙃 Hero treo ngược ngắm phố!';
      this.bannerUntil = now + 3600;
      const lines = [
        'Ối, Hero treo ngược ngắm phố nè cả nhà! Nhìn phố từ trên cao xuống đẹp ghê á!',
        'Hero treo ngược một lát cho đỡ mỏi tay. Cả nhà thấy Hero ngầu chưa!',
      ];
      out.push({ main: true, text: M(lines[Math.floor(this.rng() * lines.length)]) });
    }
    // Câu đố tính nhanh: mở theo nhịp, hết giờ thì đóng (kèm đáp án cho vui)
    if (!this.quiz && now >= this.nextQuizAt) {
      this.quiz = this.makeQuiz(now);
      out.push({
        main: true,
        text: M(`Tính nhanh nè cả nhà! ${this.quiz.spoken} bằng mấy? Gõ đáp án vào bình luận — ai đúng là Hero tăng tốc liền đó!`),
      });
    }
    if (this.quiz && now >= this.quiz.endsAt) {
      if (!this.quiz.solvedBy && this.rng() < 0.6) {
        out.push({ text: M(`Hết giờ! Đáp án là ${viNum(this.quiz.answer)} nè cả nhà. Câu sau cố lên nha!`), ttl: GAME.chatterMaxWaitMs });
      }
      this.quiz = null;
      this.nextQuizAt = now + GAME.quizEveryMs;
    }
    if (now >= this.nextIdleAt) {
      this.nextIdleAt = now + GAME.idleLineEveryMs;
      const lines = [
        'Hero bay qua khu phố này hoài mà không chán. Cả nhà thả tim là tơ bay vèo vèo đẹp lắm!',
        'Càng nhiều người thả tim cùng lúc, hiệu ứng càng lớn. Năm trăm tim là bão tơ đó cả nhà!',
        'Nhìn Hero đu qua tháp cầu kìa, đẹp như phim luôn. Tim đâu, thả cho Hero đi cả nhà!',
        'Quỹ tim đang nhích lên rồi, để dành hiệu ứng lớn thì cứ thả đều đều nhé!',
      ];
      out.push({ text: M(lines[Math.floor(this.rng() * lines.length)]), ttl: GAME.chatterMaxWaitMs });
    }
    return out;
  }

  /** Show bay liên tục: MC nói không làm dừng vật lý, chỉ dời câu rảnh tiếp theo. */
  hold(ms: number) {
    this.nextIdleAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  /** Stage lấy các sự kiện hiệu ứng mới kể từ id đã biết (để dựng hiệu ứng 3D). */
  fxSince(id: number): FxEvent[] {
    return this.fxQueue.filter((f) => f.id > id);
  }

  // ---------------- ảnh chụp ----------------

  scene(now: number): HeroScene {
    return {
      hero: {
        x: this.x,
        y: this.y,
        z: this.z,
        rot: this.rot,
        vx: this.mode === 'swing' ? this.len * this.omg * Math.cos(this.ang) : this.mode === 'hang' ? 0 : this.vx,
        vy: this.mode === 'swing' ? this.len * this.omg * Math.sin(this.ang) : this.mode === 'hang' ? 0 : this.vy,
        mode: this.mode,
        ax: this.ax,
        ay: this.ay,
        az: this.az,
        runPhase: this.runPhase,
        landAt: this.landAt,
      },
      webs: [...this.webs],
      sparks: [...this.sparks],
      storm: now < this.stormUntil,
      burst: now < this.burstUntil,
      dist: Math.max(0, Math.floor(this.x - 20)),
    };
  }

  view(now: number): HeroView {
    this.advance(now);
    const sc = this.scene(now);
    const next = [...LIKE_TIERS].sort((a, b) => a.cost - b.cost).find((t) => t.cost > this.credit);
    return {
      dist: sc.dist,
      speedKmh: Math.round(Math.hypot(sc.hero.vx, sc.hero.vy) * 3.6),
      mode: this.mode,
      totalLikes: this.totalLikes,
      credit: this.credit,
      nextTier: next ? { fx: next.fx, label: next.label, cost: next.cost, have: this.credit } : null,
      fxRecent: this.fxQueue.filter((f) => now - f.at < 2500),
      banner: now < this.bannerUntil ? this.bannerText : null,
      quiz: this.quiz
        ? {
            text: this.quiz.text,
            answer: this.quiz.answer,
            leftMs: Math.max(0, this.quiz.endsAt - now),
            totalMs: GAME.quizMs,
            solvedBy: this.quiz.solvedBy,
          }
        : null,
      totals: { ...this.totals },
      scene: sc,
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
