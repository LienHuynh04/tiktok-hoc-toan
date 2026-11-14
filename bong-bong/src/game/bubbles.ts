// Engine Bong Bóng Avatar: mỗi người xem là 1 bong bóng xà phòng mang avatar của
// chính họ, nổi lên và liên tục đụng vào nhau. Bong bóng to dần CHỈ bằng tim và
// chat của chính chủ (trần x2,2). Đụng mạnh mà chênh lệch kích thước >= 35% thì
// bong bóng nhỏ hơn bị nứt; 3 vết nứt là nổ BỐP, người làm nổ được +1 điểm "nổ".
// Quà CHỈ được cảm ơn + bong bóng tim trang trí — không to thêm, không chống nứt.
// Hàm thuần + đồng hồ/rng tiêm vào: test chạy tất định (bubbles.check.ts).

import { GAME } from './config';

export interface Say {
  text: string;
  main?: boolean;
  priority?: boolean;
  ttl?: number;
}

export interface Person {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
}

const F = (s: string) => `F: ${s}`;

/** Màu đĩa chữ cái dự phòng: băm FNV-1a + trộn cuối từ username (như arena-meo) */
export function hashHue(username: string): number {
  let h = 2166136261;
  for (let i = 0; i < username.length; i++) {
    h ^= username.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return Math.abs(h) % 360;
}

const radiusOf = (growth: number) => GAME.baseRadius * growth;
/** Bong bóng càng to càng trôi chậm */
const speedScale = (growth: number) => Math.min(1, Math.max(0.45, 1 / growth));

interface Bubble {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
  bot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  growth: number;
  cracks: number;
  floatY: number;
  phase: number;
  driftSeed: number;
  goldenUntil: number;
  lastLikeAt: number;
  maxAnnounced: boolean;
  hue: number;
  outsideMs: number; // thời gian liên tục ở ngoài vòng gió (gây cấn)
}

interface Fx {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'pop' | 'crack' | 'sparkle' | 'grow' | 'fish' | 'confetti';
  size: number;
  until: number;
}

/** Ba biến thể vỡ hiếm */
export type RareKind = 'fish' | 'bugface' | 'confetti';

/** Một avatar trong "hồ người vỡ": bị văng ra khỏi bong bóng, nhảy dù xuống hồ, chờ hồi sinh */
interface PoolEntry {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
  hue: number;
  x: number;
  y: number;
  state: 'spin' | 'falling' | 'pooled';
  spinUntil: number;
  bugFaceUntil: number;
  rare: RareKind | null;
  poppedAt: number;
  seed: number;
}

interface Heart {
  id: number;
  x: number;
  y: number;
  until: number;
}

interface SessionStat {
  nickname: string;
  pops: number;
  wins: number;
  biggest: number;
}

export interface BubbleView {
  username: string;
  nickname: string;
  avatar: string;
  bot: boolean;
  x: number;
  y: number;
  radius: number;
  growth: number;
  cracks: number;
  golden: boolean;
  crown: boolean;
  hue: number;
  wob: number;
  bomb: boolean; // đang ôm bom hẹn giờ
  bombSec: number; // giây đếm ngược còn lại của quả bom (0 nếu không ôm bom)
  bounty: boolean; // đang là mục tiêu to nhất sân
}

export interface PoolView {
  username: string;
  nickname: string;
  avatar: string;
  hue: number;
  x: number;
  y: number;
  state: 'spin' | 'falling' | 'pooled';
  bugFace: boolean;
  rare: RareKind | null;
}

export interface BubblesView {
  phase: 'battle' | 'intermission';
  round: number;
  intermissionSec: number;
  bubbles: BubbleView[];
  board: { username: string; nickname: string; pops: number; wins: number; biggest: number }[];
  effects: { id: number; x: number; y: number; text: string; kind: Fx['kind']; size: number }[];
  hearts: { id: number; x: number; y: number }[];
  paw: { x: number; y: number; side: 'left' | 'right' } | null;
  gustDir: number | null;
  goldenName: string | null;
  pool: PoolView[];
  ring: { cx: number; cy: number; r: number } | null;
  bomb: { username: string; sec: number } | null;
  bountyUser: string | null;
  lastWinner: string | null;
  celebration: 'roundwin' | null;
  aliveReal: number;
  aliveTotal: number;
  totals: { rounds: number; spawns: number; pops: number };
  musicOn: boolean;
  musicVolume: number;
}

const SIM_PEOPLE: Person[] = [
  'Mèo Mun', 'Bé Bơ', 'Tí Nị', 'Miu Miu', 'Bánh Bao', 'Cá Viên',
  'Sữa Chua', 'Mochi', 'Pate', 'Bơ Đậu', 'Xí Muội', 'Trà Sữa',
].map((nickname, i) => ({ username: `sim${i + 1}`, nickname, spoken: nickname, avatar: '' }));

const STEP_MS = 20;

export class BubblesRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private lastTickAt: number;
  private acc = 0;
  private phase: 'battle' | 'intermission' = 'battle';
  private round = 1;
  private intermissionEndsAt = 0;
  private bubbles = new Map<string, Bubble>();
  private session = new Map<string, SessionStat>();
  private realSpawnedThisRound = 0;
  private totalSpawns = 0;
  private totalPops = 0;
  private pendingSpawn = new Map<string, Person>();
  private lockout = new Map<string, number>();
  private pairCd = new Map<string, number>();
  private effects: Fx[] = [];
  private hearts: Heart[] = [];
  private fxId = 0;
  private lastWinner: string | null = null;
  private lastWinnerName: string | null = null;
  private celebration: { kind: 'roundwin'; until: number } | null = null;
  private pendingSays: Say[] = [];
  private nextFanAt: number;
  private gustUntil = 0;
  private gustDir = 1;
  private nextGoldenAt: number;
  private nextPawAt: number;
  private paw: { x: number; y: number; side: 'left' | 'right'; until: number } | null = null;
  private lastActionAt: number;
  private lastIdleLineAt: number;
  private idleLineIdx = 0;
  private botIdx = 0;
  // Vỡ lạ
  private pool: PoolEntry[] = [];
  // Gây cấn: vòng gió
  private ringActive = false;
  private ringR = GAME.ringStartR;
  private ringNextAt: number;
  // Gây cấn: bom chuyền
  private bomb: { carrier: string; endsAt: number; lastTransferAt: number; warned3s: boolean } | null = null;
  private nextBombAt: number;
  // Gây cấn: mục tiêu to nhất (chấm lại định kỳ, không nhấp nháy theo từng khung)
  private bountyUser: string | null = null;
  private bountyReevalAt = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.lastTickAt = now;
    this.lastActionAt = now;
    this.lastIdleLineAt = now;
    this.nextFanAt = now + GAME.fanEveryMs;
    this.nextGoldenAt = now + GAME.goldenEveryMs;
    this.nextPawAt = now + GAME.pawFirstMs;
    this.ringNextAt = now + GAME.ringGraceMs;
    this.nextBombAt = now + GAME.bombFirstMs;
  }

  // ---------- Tiện ích ----------
  private aliveBubbles(): Bubble[] {
    return [...this.bubbles.values()];
  }
  private aliveReal(): Bubble[] {
    return this.aliveBubbles().filter((b) => !b.bot);
  }
  private stat(username: string, nickname: string): SessionStat {
    let s = this.session.get(username);
    if (!s) {
      s = { nickname, pops: 0, wins: 0, biggest: 1 };
      this.session.set(username, s);
    }
    s.nickname = nickname;
    return s;
  }
  private addFx(x: number, y: number, text: string, kind: Fx['kind'], now: number, size = 0, ms = 950) {
    this.effects.push({ id: ++this.fxId, x, y, text, kind, size, until: now + ms });
    if (this.effects.length > 40) this.effects.splice(0, this.effects.length - 40);
  }
  private say(s: Say) {
    this.pendingSays.push(s);
  }
  private drainSays(): Say[] {
    const out = this.pendingSays;
    this.pendingSays = [];
    return out;
  }

  // ---------- Buổi / chào / cảm ơn ----------
  newSession(now: number): Say[] {
    const fresh = new BubblesRoom(now, this.rng);
    fresh.musicOn = this.musicOn;
    fresh.musicVolume = this.musicVolume;
    Object.assign(this, fresh);
    return [
      { text: F('Chào cả nhà! Bong Bóng Avatar mở sân rồi đây!'), main: true },
      { text: F('Luật chơi nè: vào phòng hoặc comment bất kỳ là bạn có một bong bóng mang avatar của chính bạn nổi lên sân. Thả tim thì bong bóng của bạn to dần, đụng nhau mạnh mà chênh lệch kích thước thì bong bóng nhỏ hơn bị nứt, ba vết nứt là nổ bốp đấy!') },
    ];
  }

  follow(p: Person, _now: number): Say[] {
    return [{ text: F(`Chào bạn ${p.spoken} mới theo dõi phòng! Vào phòng là bong bóng của bạn nổi lên sân ngay đấy!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    // Quà CHỈ được cảm ơn: không to thêm, không chống nứt, không điểm.
    return [{ text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Tặng bạn mấy bong bóng tim bay lên trời cho vui nè!`), priority: true }];
  }

  /** Bong bóng tim trang trí bay lên khi có quà (hình ảnh thuần tuý, không tác dụng gameplay) */
  giftHearts(username: string, now: number) {
    const b = this.bubbles.get(username);
    const cx = b ? b.x : GAME.field.x0 + this.rng() * (GAME.field.x1 - GAME.field.x0);
    const cy = b ? b.y : GAME.field.y1 - 60;
    for (let i = 0; i < 3; i++) {
      this.hearts.push({ id: ++this.fxId, x: cx + (i - 1) * 54, y: cy + (i % 2) * 30, until: now + 2600 });
    }
    if (this.hearts.length > 24) this.hearts.splice(0, this.hearts.length - 24);
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  // ---------- Thả bong bóng / tăng kích thước ----------
  private spawnBubble(p: Person, bot: boolean, now: number, growthOverride?: number): Bubble {
    const f = GAME.field;
    const growth = growthOverride ?? 1;
    const r = radiusOf(growth);
    const x = f.x0 + r + 20 + this.rng() * (f.x1 - f.x0 - 2 * r - 40);
    const b: Bubble = {
      username: p.username,
      nickname: p.nickname,
      spoken: p.spoken,
      avatar: p.avatar,
      bot,
      x,
      y: f.y1 - r - 8,
      vx: (this.rng() - 0.5) * 40,
      vy: -150,
      growth,
      cracks: 0,
      floatY: GAME.floatTop + this.rng() * (GAME.floatBottom - GAME.floatTop),
      phase: this.rng() * 10,
      driftSeed: this.rng(),
      goldenUntil: 0,
      lastLikeAt: -Infinity,
      maxAnnounced: false,
      hue: hashHue(p.username),
      outsideMs: 0,
    };
    // Lên sân lại = rời hồ người vỡ
    const pi = this.pool.findIndex((e) => e.username === p.username);
    if (pi >= 0) this.pool.splice(pi, 1);
    this.bubbles.set(p.username, b);
    this.totalSpawns++;
    if (!bot) {
      this.realSpawnedThisRound++;
      const s = this.stat(p.username, p.nickname);
      if (growth > s.biggest) s.biggest = growth;
    }
    this.lastActionAt = now;
    return b;
  }

  private trySpawn(p: Person, now: number) {
    if (this.bubbles.has(p.username)) return;
    if ((this.lockout.get(p.username) ?? 0) > now) return; // vừa nổ: chờ hết 8 giây
    if (this.phase === 'battle') {
      if (this.aliveBubbles().length < GAME.maxBubbles) this.spawnBubble(p, false, now);
      else this.pendingSpawn.set(p.username, p);
    } else {
      this.pendingSpawn.set(p.username, p);
    }
  }

  /** Vào phòng live là có bong bóng */
  join(p: Person, now: number): Say[] {
    this.trySpawn(p, now);
    return [];
  }

  chat(p: Person, _comment: string, now: number): Say[] {
    const b = this.bubbles.get(p.username);
    if (b && !b.bot) {
      // Chat tiếp của chính chủ: +1% kích thước (cùng trần x2,2). Tin thả bong bóng không tính.
      this.grow(b, GAME.chatGrow, now);
      this.lastActionAt = now;
      return [];
    }
    this.trySpawn(p, now);
    return [];
  }

  private grow(b: Bubble, amount: number, now: number): Say[] {
    if (b.growth >= GAME.growthCap) return [];
    b.growth = Math.min(GAME.growthCap, b.growth + amount);
    if (!b.bot) {
      const s = this.stat(b.username, b.nickname);
      if (b.growth > s.biggest) s.biggest = b.growth;
    }
    if (b.growth >= GAME.growthCap && !b.maxAnnounced) {
      b.maxAnnounced = true;
      return [{ text: F(`Ôi chà, bong bóng của ${b.spoken} đã to hết cỡ rồi, tròn vo như quả bóng bay khổng lồ! Ai đụng vào lúc này là mệt đấy!`), priority: true }];
    }
    return [];
  }

  // ---------- Tim: bong bóng của CHÍNH người thả to dần ----------
  like(p: Person, _count: number, now: number): Say[] {
    const b = this.bubbles.get(p.username);
    if (!b || b.bot) return []; // không có bong bóng: không to cho ai cả
    if (now - b.lastLikeAt < GAME.likeBatchMs) return []; // gộp lượt: 1 nhịp 1 lần +3%
    b.lastLikeAt = now;
    return this.grow(b, GAME.likeGrow, now);
  }

  // ---------- Nứt / nổ ----------
  private crack(target: Bubble, scorer: Bubble | null, now: number) {
    if (target.goldenUntil > now) return; // bong bóng vàng không bị nứt
    target.cracks++;
    this.addFx(target.x, target.y - radiusOf(target.growth) - 14, 'Nứt!', 'crack', now);
    this.lastActionAt = now;
    if (target.cracks >= GAME.cracksToPop) this.popBubble(target, scorer, now);
  }

  private popBubble(victim: Bubble, scorer: Bubble | null, now: number) {
    const r = radiusOf(victim.growth);
    const vx = victim.x;
    const vy = victim.y;
    const wasBounty = victim.username === this.bountyUser;
    this.bubbles.delete(victim.username);
    if (this.bomb && this.bomb.carrier === victim.username) {
      this.bomb = null;
      this.scheduleNextBomb(now);
    }
    if (!victim.bot) this.lockout.set(victim.username, now + GAME.respawnLockMs);
    this.pairCd.forEach((_v, k) => {
      if (k.includes(victim.username)) this.pairCd.delete(k);
    });
    this.totalPops++;
    this.addFx(vx, vy, 'BỐP!', 'pop', now, r * 2, GAME.popShowMs);

    // VỠ HIẾM: 10% lần nổ của người thật (rng tất định trong kiểm chứng)
    let rare: RareKind | null = null;
    if (!victim.bot && this.rng() < GAME.rareChance) {
      const roll = this.rng();
      rare = roll < 1 / 3 ? 'fish' : roll < 2 / 3 ? 'bugface' : 'confetti';
      if (rare === 'fish') this.addFx(vx, vy, '🐟', 'fish', now, r * 2, 1700);
      if (rare === 'confetti') this.addFx(vx, vy, '🎉', 'confetti', now, r * 2, 1700);
    }

    const hasScorer = !!(scorer && !scorer.bot && scorer.username !== victim.username);
    if (hasScorer) {
      // Điểm nổ: đang vàng x2, vỡ hiếm x2, hạ đúng mục tiêu x2 — chồng nhau nhưng trần x4
      let mult = 1;
      if (scorer!.goldenUntil > now) mult *= 2;
      if (rare) mult *= 2;
      if (wasBounty) mult *= 2;
      if (mult > 4) mult = 4;
      this.stat(scorer!.username, scorer!.nickname).pops += mult;
      this.addFx(scorer!.x, scorer!.y - radiusOf(scorer!.growth) - 20, `+${mult} NỔ`, 'grow', now);
      // HẤP THỤ: người làm nổ nhận 30% phần to vượt mức gốc của nạn nhân (vẫn trần x2,2)
      const absorb = (victim.growth - 1) * GAME.absorbRate;
      if (absorb > 0) for (const s of this.grow(scorer!, absorb, now)) this.say(s);
    }

    if (!victim.bot) {
      if (rare) {
        this.say({
          text: F(
            `VỠ HIẾM! Bong bóng của ${victim.spoken} vừa nổ theo kiểu hiếm có khó tìm${
              hasScorer ? `, ${scorer!.spoken} được tính điểm gấp đôi cho cú nổ này` : ''
            }! Cả phòng chứng kiến khoảnh khắc hiếm đấy!`,
          ),
          priority: true,
        });
      } else if (hasScorer) {
        this.say({ text: F(`Bốp! Bong bóng của ${victim.spoken} nổ rồi — ${scorer!.spoken} là người làm nổ đấy!`) });
      } else {
        this.say({ text: F(`Bốp! Bong bóng của ${victim.spoken} nổ tung rồi!`) });
      }

      // HỒ NGƯỜI VỠ: avatar KHÔNG biến mất — bị văng ra, xoay chóng mặt, mở dù rơi xuống hồ
      this.pool = this.pool.filter((e) => e.username !== victim.username);
      this.pool.unshift({
        username: victim.username,
        nickname: victim.nickname,
        spoken: victim.spoken,
        avatar: victim.avatar,
        hue: victim.hue,
        x: vx,
        y: vy,
        state: 'spin',
        spinUntil: now + (rare === 'bugface' ? GAME.bugFaceMs : GAME.spinMs),
        bugFaceUntil: rare === 'bugface' ? now + GAME.bugFaceMs : 0,
        rare,
        poppedAt: now,
        seed: this.rng() * 10,
      });
      if (this.pool.length > GAME.poolCap) this.pool.length = GAME.poolCap;
    }
  }

  private scheduleNextBomb(now: number) {
    this.nextBombAt = now + GAME.bombEveryMinMs + this.rng() * (GAME.bombEveryMaxMs - GAME.bombEveryMinMs);
  }

  // ---------- Sự kiện máy ----------
  triggerFan(now: number): Say[] {
    this.gustDir = this.rng() < 0.5 ? -1 : 1;
    this.gustUntil = now + GAME.fanMs;
    this.nextFanAt = now + GAME.fanEveryMs;
    return [{ text: F(`GIÓ QUẠT! Quạt trần quay vù vù, cả đàn bong bóng bị thổi bay sang một bên kìa!`), priority: true }];
  }

  forceGolden(now: number): Say[] {
    const reals = this.aliveReal().filter((b) => b.goldenUntil <= now);
    if (!reals.length) {
      this.nextGoldenAt = now + 10_000;
      return [];
    }
    const b = reals[Math.floor(this.rng() * reals.length)];
    b.goldenUntil = now + GAME.goldenMs;
    this.nextGoldenAt = now + GAME.goldenEveryMs;
    this.addFx(b.x, b.y - radiusOf(b.growth) - 20, 'VÀNG!', 'grow', now);
    return [{ text: F(`Ồ, bong bóng của ${b.spoken} bỗng phát sáng vàng óng! Mười lăm giây này không ai làm nứt được nó, mà nó làm nổ ai là được tính đôi đấy!`), priority: true }];
  }

  triggerPaw(now: number): Say[] {
    const candidates = this.aliveBubbles()
      .filter((b) => b.goldenUntil <= now)
      .sort((a, b2) => b2.growth - a.growth);
    if (!candidates.length) {
      this.nextPawAt = now + GAME.pawEveryMs;
      return [];
    }
    const target = candidates[0];
    this.nextPawAt = now + GAME.pawEveryMs;
    this.paw = { x: target.x, y: target.y, side: target.x < (GAME.field.x0 + GAME.field.x1) / 2 ? 'left' : 'right', until: now + GAME.pawShowMs };
    target.cracks += 1;
    this.addFx(target.x, target.y - radiusOf(target.growth) - 14, 'Nứt!', 'crack', now);
    if (target.cracks >= GAME.cracksToPop) {
      this.popBubble(target, null, now);
    } else {
      target.cracks += 1;
      this.addFx(target.x + 16, target.y - radiusOf(target.growth) - 30, 'Nứt!', 'crack', now);
      if (target.cracks >= GAME.cracksToPop) this.popBubble(target, null, now);
    }
    return [{ text: F(`Ối, chân của Bug từ đâu thò ra quệt một cái! Bong bóng to nhất của ${target.spoken} bị cào trúng, nứt liền hai vết!`), priority: true }];
  }

  /** Gắn bom hẹn giờ vào 1 bong bóng người thật ngẫu nhiên (bom KHÔNG BAO GIỜ gắn vào bot) */
  attachBomb(now: number): Say[] {
    if (this.phase !== 'battle' || this.bomb) return [];
    const reals = this.aliveReal();
    if (!reals.length) {
      this.nextBombAt = now + 15_000; // chưa có người thật: hẹn lại sau một lát
      return [];
    }
    const carrier = reals[Math.floor(this.rng() * reals.length)];
    this.bomb = { carrier: carrier.username, endsAt: now + GAME.bombMs, lastTransferAt: now, warned3s: false };
    this.addFx(carrier.x, carrier.y - radiusOf(carrier.growth) - 26, '💣', 'grow', now);
    return [
      {
        text: F(
          `Bom hẹn giờ xuất hiện! Bong bóng của ${carrier.spoken} đang ôm bom, mười giây đếm ngược bắt đầu! Đụng vào bong bóng người thật khác là bom chuyền sang người đó đấy!`,
        ),
        priority: true,
      },
    ];
  }

  /** Nút ở trang điều khiển (và lịch máy gọi chung): vòng gió xuất hiện / thu hẹp ngay 1 nấc */
  forceRingStep(now: number): Say[] {
    if (this.phase !== 'battle') return [];
    if (!this.ringActive) {
      this.ringActive = true;
      this.ringR = GAME.ringStartR;
      this.ringNextAt = now + GAME.ringStepMs;
      return [
        {
          text: F('Vòng gió bắt đầu thu hẹp rồi! Bong bóng nào ở ngoài vòng lâu là bị nứt dần đấy, bơi vào trong vòng cho an toàn!'),
          priority: true,
        },
      ];
    }
    if (this.ringR > GAME.ringMinR) {
      this.ringR = Math.max(GAME.ringMinR, this.ringR * GAME.ringShrink);
      this.ringNextAt = now + GAME.ringStepMs;
      if (this.ringR <= GAME.ringMinR) {
        return [{ text: F('Vòng gió đã thu hẹp hết cỡ rồi! Sân giờ chật lắm, cẩn thận đụng nhau đấy!') }];
      }
    }
    this.ringNextAt = now + GAME.ringStepMs; // đã hẹp hết cỡ: giãn nhịp kiểm tra lại
    return [];
  }

  /** Chấm lại mục tiêu to nhất: định kỳ 15 giây hoặc ngay khi mục tiêu cũ không còn */
  private latchBounty(now: number) {
    const cur = this.bountyUser ? this.bubbles.get(this.bountyUser) : undefined;
    if (cur && !cur.bot && now < this.bountyReevalAt) return; // mục tiêu còn đó và chưa tới kỳ chấm lại
    this.bountyReevalAt = now + GAME.bountyReevalMs;
    const reals = this.aliveReal();
    const biggest = reals.length ? reals.reduce((m, b) => (b.growth > m.growth ? b : m)) : null;
    const next = biggest && biggest.growth >= GAME.bountyMinGrowth ? biggest.username : null;
    if (next !== this.bountyUser) {
      this.bountyUser = next;
      if (next) {
        const t = this.bubbles.get(next)!;
        if (t.growth >= 1.3) {
          this.say({
            text: F(`Bong bóng của ${t.spoken} đang to nhất sân — là mục tiêu của cả phòng đấy! Ai làm nổ được nó là tính điểm đôi!`),
          });
        }
      }
    }
  }

  // ---------- Vòng đấu ----------
  private endRound(now: number): Say[] {
    this.bomb = null;
    const alive = this.aliveReal();
    const winner = alive.length === 1 ? alive[0] : null;
    this.phase = 'intermission';
    this.intermissionEndsAt = now + GAME.intermissionMs;
    if (winner) {
      this.stat(winner.username, winner.nickname).wins++;
      this.lastWinner = winner.username;
      this.lastWinnerName = winner.nickname;
      this.celebration = { kind: 'roundwin', until: now + 5000 };
      return [
        {
          text: F(`Kết thúc vòng ${this.round}! Bong bóng của ${winner.spoken} là bong bóng cuối cùng còn nguyên trên sân — Vua Bong Bóng của vòng này! Tám giây nữa vòng mới bắt đầu nhé cả nhà!`),
          main: true,
        },
      ];
    }
    return [{ text: F(`Kết thúc vòng ${this.round} mà không còn bong bóng người thật nào nguyên vẹn — vòng này hoà! Tám giây nữa vòng mới bắt đầu nhé!`), main: true }];
  }

  /** Nút ở trang điều khiển: kết thúc vòng ngay (bong bóng to nhất đang dẫn đầu thắng) */
  forceEndRound(now: number): Say[] {
    if (this.phase !== 'battle') return [];
    const alive = this.aliveReal().sort((a, b) => b.growth - a.growth);
    if (alive.length > 1) {
      for (const b of alive.slice(1)) this.popBubble(b, null, now);
    }
    return this.endRound(now);
  }

  private startRound(now: number) {
    this.round++;
    this.phase = 'battle';
    this.bubbles.clear();
    this.pairCd.clear();
    this.lockout.clear();
    this.realSpawnedThisRound = 0;
    // Vòng mới: vòng gió làm lại từ đầu, bom hẹn lại từ đầu, mục tiêu chấm lại
    this.ringActive = false;
    this.ringR = GAME.ringStartR;
    this.ringNextAt = now + GAME.ringGraceMs;
    this.bomb = null;
    this.nextBombAt = now + GAME.bombFirstMs;
    this.bountyUser = null;
    this.bountyReevalAt = 0;
    const pending = [...this.pendingSpawn.values()];
    this.pendingSpawn.clear();
    for (const p of pending.slice(0, GAME.maxBubbles)) this.spawnBubble(p, false, now);
  }

  // ---------- BOT sưởi sân ----------
  private manageBots(now: number) {
    const real = this.aliveReal().length;
    if (real >= GAME.botRealThreshold) {
      for (const b of [...this.bubbles.values()]) if (b.bot) this.bubbles.delete(b.username);
      return;
    }
    let total = this.aliveBubbles().length;
    let guard = 0;
    while (total < GAME.botFillTo && guard++ < 8) {
      const name = GAME.botNames[this.botIdx % GAME.botNames.length];
      this.botIdx++;
      const username = `bot${this.botIdx}`;
      if (this.bubbles.has(username)) continue;
      this.spawnBubble({ username, nickname: name, spoken: name.replace(' 🤖', ''), avatar: '' }, true, now, 1.1 + this.rng() * 0.4);
      total++;
    }
  }

  // ---------- Vật lý (bước cố định, tất định) ----------
  private step(dtMs: number, now: number) {
    const dt = dtMs / 1000;
    const f = GAME.field;
    const bubbles = this.aliveBubbles();
    const gust = now < this.gustUntil;
    const rcx = (f.x0 + f.x1) / 2;
    const rcy = (f.y0 + f.y1) / 2;
    const ringOn = this.ringActive && this.phase === 'battle';

    for (const b of bubbles) {
      if (!this.bubbles.has(b.username)) continue; // vừa nổ trong chính bước này (vòng gió)
      const r = radiusOf(b.growth);
      const ss = speedScale(b.growth);
      b.phase += dt;
      // trôi ngang lững lờ + nổi về độ cao cá nhân
      const targetVx = Math.sin(b.phase * 0.6 + b.driftSeed * Math.PI * 2) * 36 * ss;
      const desiredVy = Math.max(-160, Math.min(160, (b.floatY - b.y) * 1.5)) * ss;
      b.vx += (targetVx - b.vx) * Math.min(1, dt * 1.8);
      b.vy += (desiredVy - b.vy) * Math.min(1, dt * 2.2);
      if (gust) b.vx += this.gustDir * 620 * dt;
      // Vòng gió: ở ngoài vòng bị kéo nhẹ về tâm, ở lâu quá thì nứt dần (áp dụng cả bot)
      if (ringOn) {
        const distC = Math.hypot(b.x - rcx, b.y - rcy) || 1;
        if (distC > this.ringR) {
          const pull = Math.min(120, (distC - this.ringR) * 0.9);
          b.vx += ((rcx - b.x) / distC) * pull * dt;
          b.vy += ((rcy - b.y) / distC) * pull * dt;
          b.outsideMs += dtMs;
          if (b.outsideMs >= GAME.ringCrackMs) {
            b.outsideMs = 0;
            this.crack(b, null, now);
          }
        } else {
          b.outsideMs = Math.max(0, b.outsideMs - dtMs);
        }
      }
      // trần tốc độ chung
      const sp = Math.hypot(b.vx, b.vy);
      const cap = 300;
      if (sp > cap) {
        b.vx = (b.vx / sp) * cap;
        b.vy = (b.vy / sp) * cap;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < f.x0 + r) { b.x = f.x0 + r; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > f.x1 - r) { b.x = f.x1 - r; b.vx = -Math.abs(b.vx) * 0.7; }
      if (b.y < f.y0 + r) { b.y = f.y0 + r; b.vy = Math.abs(b.vy) * 0.7; }
      if (b.y > f.y1 - r) { b.y = f.y1 - r; b.vy = -Math.abs(b.vy) * 0.7; }
    }

    // Bong bóng — bong bóng: nảy đàn hồi theo khối lượng (m ~ r^2), đụng mạnh + chênh cỡ thì nứt
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const A = bubbles[i];
        const B = bubbles[j];
        if (!this.bubbles.has(A.username) || !this.bubbles.has(B.username)) continue; // có bong bóng vừa nổ
        const rA = radiusOf(A.growth);
        const rB = radiusOf(B.growth);
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dist = Math.hypot(dx, dy);
        const min = rA + rB;
        if (dist === 0 || dist >= min) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        const mA = rA * rA;
        const mB = rB * rB;
        const overlap = min - dist;
        A.x -= nx * overlap * (mB / (mA + mB));
        A.y -= ny * overlap * (mB / (mA + mB));
        B.x += nx * overlap * (mA / (mA + mB));
        B.y += ny * overlap * (mA / (mA + mB));
        // Bom chuyền: carrier đụng bong bóng NGƯỜI THẬT khác thì bom sang người đó
        // (giữ tối thiểu 3 giây mới chuyền tiếp; đếm ngược vẫn chạy tiếp, không đặt lại)
        if (this.phase === 'battle' && this.bomb && now - this.bomb.lastTransferAt >= GAME.bombTransferCdMs) {
          const other = A.username === this.bomb.carrier ? B : B.username === this.bomb.carrier ? A : null;
          if (other && !other.bot) {
            this.bomb.carrier = other.username;
            this.bomb.lastTransferAt = now;
            this.addFx((A.x + B.x) / 2, (A.y + B.y) / 2 - 18, '💣➜', 'sparkle', now, 0, 700);
          }
        }
        const rvn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rvn >= 0) continue; // đang tách ra rồi
        const vAn = A.vx * nx + A.vy * ny;
        const vBn = B.vx * nx + B.vy * ny;
        const vAn2 = (vAn * (mA - mB) + 2 * mB * vBn) / (mA + mB);
        const vBn2 = (vBn * (mB - mA) + 2 * mA * vAn) / (mA + mB);
        A.vx += (vAn2 - vAn) * nx;
        A.vy += (vAn2 - vAn) * ny;
        B.vx += (vBn2 - vBn) * nx;
        B.vy += (vBn2 - vBn) * ny;

        if (this.phase !== 'battle') continue;
        const relSpeed = -rvn;
        const key = A.username < B.username ? `${A.username}|${B.username}` : `${B.username}|${A.username}`;
        if (now - (this.pairCd.get(key) ?? -Infinity) < GAME.pairCooldownMs) continue;
        this.pairCd.set(key, now);
        if (relSpeed < 55) continue;
        const big = rA >= rB ? A : B;
        const small = big === A ? B : A;
        const ratio = Math.max(rA, rB) / Math.min(rA, rB);
        // Ngoại lệ MỤC TIÊU: nạn nhân đang là mục tiêu to nhất thì bỏ qua yêu cầu tỉ lệ 35%
        // (chỉ cần to hơn + đụng đủ mạnh) — nếu không, mục tiêu cỡ lớn không bao giờ bị hạ bằng va chạm.
        const bountyHit = small.username === this.bountyUser;
        if (relSpeed >= GAME.crackSpeed && (ratio >= GAME.crackRatio || bountyHit)) {
          // Bot KHÔNG BAO GIỜ là kẻ làm nứt (kể cả nứt bot khác) — chỉ người thật mới gây nứt.
          if (!big.bot) this.crack(small, big, now);
        } else {
          this.addFx((A.x + B.x) / 2, (A.y + B.y) / 2 - 10, '✦', 'sparkle', now, 0, 600);
        }
      }
    }

    // Hồ người vỡ: avatar xoay một lúc -> mở dù rơi xuống -> đáp xuống hồ chờ hồi sinh
    for (const e of this.pool) {
      if (e.state === 'spin' && now >= e.spinUntil) e.state = 'falling';
      if (e.state === 'falling') {
        e.y += GAME.fallSpeed * dt;
        e.x += Math.sin(now / 350 + e.seed * 6) * 26 * dt;
        if (e.x < 60) e.x = 60;
        if (e.x > 1020) e.x = 1020;
        if (e.y >= GAME.poolY) {
          e.y = GAME.poolY;
          e.state = 'pooled';
          this.say({ text: F(`${e.spoken} nhảy dù đáp xuống hồ người vỡ an toàn rồi! Nghỉ một chút, comment lại là lên sân tiếp!`) });
        }
      }
    }
  }

  // ---------- Tick ----------
  tick(now: number): Say[] {
    const says: Say[] = [];
    if (this.phase === 'battle') this.latchBounty(now); // chấm mục tiêu TRƯỚC khi chạy vật lý: ổn định suốt tick này
    let elapsed = now - this.lastTickAt;
    this.lastTickAt = now;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 1000) elapsed = 1000;
    this.acc += elapsed;
    let guard = 0;
    while (this.acc >= STEP_MS && guard++ < 50) {
      this.acc -= STEP_MS;
      this.step(STEP_MS, now);
    }
    says.push(...this.drainSays());

    this.effects = this.effects.filter((e) => e.until > now);
    this.hearts = this.hearts.filter((h) => h.until > now);
    if (this.paw && now >= this.paw.until) this.paw = null;

    if (this.phase === 'intermission') {
      if (now >= this.intermissionEndsAt) {
        this.startRound(now);
        says.push({ text: F(`Vòng ${this.round} bắt đầu! Bong bóng của ai chưa lên sân thì vào phòng hoặc comment một tiếng là nổi lên ngay!`) });
      }
      return says;
    }

    // Sự kiện máy theo lịch
    if (now >= this.nextFanAt) says.push(...this.triggerFan(now));
    if (now >= this.nextGoldenAt) says.push(...this.forceGolden(now));
    if (now >= this.nextPawAt) says.push(...this.triggerPaw(now));

    // Vòng gió thu hẹp theo lịch (sau 40 giây yên bình đầu vòng)
    if (now >= this.ringNextAt) says.push(...this.forceRingStep(now));

    // Bom hẹn giờ: theo lịch gắn, cảnh báo ở 3 giây cuối, hết giờ là nổ (đi đường pop chung, không ai được điểm)
    if (!this.bomb && now >= this.nextBombAt) says.push(...this.attachBomb(now));
    if (this.bomb) {
      const carrier = this.bubbles.get(this.bomb.carrier);
      if (!carrier) {
        this.bomb = null;
        this.scheduleNextBomb(now);
      } else {
        if (!this.bomb.warned3s && this.bomb.endsAt - now <= 3_000) {
          this.bomb.warned3s = true;
          says.push({ text: F('Bom sắp nổ rồi, còn ba giây thôi!'), priority: true });
        }
        if (now >= this.bomb.endsAt) {
          this.bomb = null;
          this.scheduleNextBomb(now);
          this.addFx(carrier.x, carrier.y, '💥', 'pop', now, radiusOf(carrier.growth) * 2, 1_200);
          if (carrier.goldenUntil > now) {
            says.push({
              text: F(`Bùm! Mà bong bóng của ${carrier.spoken} đang vàng óng nên chặn đứng quả bom luôn, ghê chưa!`),
              priority: true,
            });
          } else {
            says.push({ text: F(`BÙM! Quả bom nổ ngay trên bong bóng của ${carrier.spoken} rồi!`), priority: true });
            this.popBubble(carrier, null, now);
          }
        }
      }
    }

    // Kết vòng: còn tối đa 1 bong bóng người thật và vòng đã có ít nhất 3 người thật vào sân
    if (this.realSpawnedThisRound >= 3 && this.aliveReal().length <= 1) {
      says.push(...this.endRound(now));
      return says;
    }

    this.manageBots(now);

    // MC nhắc luật khi phòng im lặng lâu (câu trung tính, không kêu gọi)
    if (now - this.lastActionAt > GAME.idleLineEveryMs && now - this.lastIdleLineAt > GAME.idleLineEveryMs) {
      this.lastIdleLineAt = now;
      const lines = [
        F('Nhắc nhẹ luật sân: vào phòng hoặc comment là bong bóng mang avatar của bạn nổi lên. Thả tim thì bong bóng của chính bạn to dần lên đấy.'),
        F('Đụng nhau nhẹ thì chỉ nảy ra thôi, nhưng đụng mạnh mà chênh lệch kích thước từ ba mươi lăm phần trăm trở lên thì bong bóng nhỏ hơn bị nứt, ba vết nứt là nổ bốp.'),
        F('Bong bóng nào trụ lại cuối cùng là Vua Bong Bóng của vòng. Cứ chừng chín mươi giây lại có một bong bóng phát sáng vàng, không ai làm nứt được nó đâu.'),
      ];
      says.push({ text: lines[this.idleLineIdx++ % lines.length] });
    }
    return says;
  }

  // ---------- Nút test ở trang điều khiển ----------
  /** Thả n bong bóng giả lập (người xem mô phỏng, không phải BOT) */
  spawnSim(n: number, now: number): Say[] {
    let added = 0;
    for (const p of SIM_PEOPLE) {
      if (added >= n) break;
      if (this.bubbles.has(p.username)) continue;
      if (this.aliveBubbles().length >= GAME.maxBubbles) break;
      this.spawnBubble(p, false, now, 0.95 + this.rng() * 0.5);
      added++;
    }
    return added ? [{ text: F(`Có ${added} bong bóng mới nổi lên sân! Sân nhộn nhịp hẳn lên!`) }] : [];
  }

  /** Tim giả lập: bong bóng giả lập to nhất được "thả tim" 12 lượt (to thêm ~36%) */
  simGrow(now: number): Say[] {
    const sims = this.aliveBubbles().filter((b) => b.username.startsWith('sim'));
    if (!sims.length) return [];
    const b = sims.sort((a, b2) => b2.growth - a.growth)[0];
    for (let i = 0; i < 12; i++) this.grow(b, GAME.likeGrow, now);
    this.addFx(b.x, b.y - radiusOf(b.growth) - 20, 'To dần!', 'grow', now);
    return [];
  }

  /** Nút test ở trang điều khiển: ép nổ bong bóng người thật nhỏ nhất (người làm nổ = bong bóng to nhất còn lại), đi đúng đường pop chung */
  debugForcePop(now: number): Say[] {
    const reals = this.aliveReal();
    if (!reals.length) return [];
    const victim = reals.reduce((m, b) => (b.growth < m.growth ? b : m));
    const scorer = reals.filter((b) => b.username !== victim.username).reduce<Bubble | null>(
      (m, b) => (!m || b.growth > m.growth ? b : m),
      null,
    );
    this.popBubble(victim, scorer, now);
    return [];
  }

  // ---------- Móc kiểm chứng (test dùng, như debugPlace của arena-meo) ----------
  debugSetRng(fn: () => number) {
    this.rng = fn;
  }

  debugPlace(username: string, x: number, y: number) {
    const b = this.bubbles.get(username);
    if (b) {
      b.x = x;
      b.y = y;
      b.floatY = y;
    }
  }

  debugSetVel(username: string, vx: number, vy: number) {
    const b = this.bubbles.get(username);
    if (b) {
      b.vx = vx;
      b.vy = vy;
    }
  }

  debugSetGrowth(username: string, growth: number) {
    const b = this.bubbles.get(username);
    if (b) b.growth = growth;
  }

  // ---------- Ảnh chụp cho stage / trang điều khiển ----------
  view(now: number): BubblesView {
    const bubbles: BubbleView[] = [];
    for (const b of this.bubbles.values()) {
      bubbles.push({
        username: b.username,
        nickname: b.nickname,
        avatar: b.avatar,
        bot: b.bot,
        x: Math.round(b.x),
        y: Math.round(b.y),
        radius: Math.round(radiusOf(b.growth)),
        growth: Math.round(b.growth * 100) / 100,
        cracks: b.cracks,
        golden: b.goldenUntil > now,
        crown: b.username === this.lastWinner,
        hue: b.hue,
        wob: Math.round(Math.sin(b.phase * 4) * 100) / 100,
        bomb: this.bomb?.carrier === b.username,
        bombSec: this.bomb?.carrier === b.username ? Math.max(0, Math.ceil((this.bomb.endsAt - now) / 1000)) : 0,
        bounty: this.phase === 'battle' && b.username === this.bountyUser,
      });
    }
    const board = [...this.session.entries()]
      .map(([username, s]) => ({ username, nickname: s.nickname, pops: s.pops, wins: s.wins, biggest: Math.round(s.biggest * 100) / 100 }))
      .filter((s) => s.pops > 0 || s.wins > 0 || s.biggest > 1)
      .sort((a, b) => b.pops - a.pops || b.wins - a.wins || b.biggest - a.biggest || a.nickname.localeCompare(b.nickname))
      .slice(0, 8);
    const golden = this.aliveBubbles().find((b) => b.goldenUntil > now);
    return {
      phase: this.phase,
      round: this.round,
      intermissionSec: this.phase === 'intermission' ? Math.max(0, Math.ceil((this.intermissionEndsAt - now) / 1000)) : 0,
      bubbles,
      board,
      effects: this.effects.filter((e) => e.until > now).map((e) => ({ id: e.id, x: Math.round(e.x), y: Math.round(e.y), text: e.text, kind: e.kind, size: e.size })),
      hearts: this.hearts.filter((h) => h.until > now).map((h) => ({ id: h.id, x: Math.round(h.x), y: Math.round(h.y) })),
      paw: this.paw ? { x: Math.round(this.paw.x), y: Math.round(this.paw.y), side: this.paw.side } : null,
      gustDir: now < this.gustUntil ? this.gustDir : null,
      goldenName: golden ? golden.nickname : null,
      pool: this.pool.map((e) => ({
        username: e.username,
        nickname: e.nickname,
        avatar: e.avatar,
        hue: e.hue,
        x: Math.round(e.x),
        y: Math.round(e.state === 'pooled' ? e.y + Math.sin(now / 480 + e.seed * 7) * 7 : e.y),
        state: e.state,
        bugFace: now < e.bugFaceUntil,
        rare: e.rare,
      })),
      ring:
        this.ringActive && this.phase === 'battle'
          ? { cx: Math.round((GAME.field.x0 + GAME.field.x1) / 2), cy: Math.round((GAME.field.y0 + GAME.field.y1) / 2), r: Math.round(this.ringR) }
          : null,
      bomb: this.bomb ? { username: this.bomb.carrier, sec: Math.max(0, Math.ceil((this.bomb.endsAt - now) / 1000)) } : null,
      bountyUser: this.phase === 'battle' ? this.bountyUser : null,
      lastWinner: this.lastWinnerName,
      celebration: this.celebration && now < this.celebration.until ? this.celebration.kind : null,
      aliveReal: this.aliveReal().length,
      aliveTotal: this.aliveBubbles().length,
      totals: { rounds: this.round, spawns: this.totalSpawns, pops: this.totalPops },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
