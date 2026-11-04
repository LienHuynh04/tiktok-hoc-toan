// Engine Hồ Cá Vui: người xem bình luận "câu" là xuống hồ, mỗi cần thủ có 1 cần câu,
// cá tự cắn câu theo nhịp ngẫu nhiên, cân ký tính vào bảng xếp hạng. Vòng câu 3 phút:
// con cá to nhất vòng được đội vương miện. Quà chỉ được cảm ơn, không đổi được cá —
// cá to hay nhỏ là do may rủi công bằng cho mọi cần thủ.

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

export interface Species {
  name: string;
  min: number;
  max: number;
  w: number; // trọng số may rủi
  tier: string;
  color: string;
  rare?: boolean;
}

export const SPECIES: Species[] = [
  { name: 'Cá rô phi', min: 0.3, max: 2, w: 30, tier: 'Cá thường', color: '#94a3b8' },
  { name: 'Cá diêu hồng', min: 0.8, max: 3.5, w: 22, tier: 'Cá thường', color: '#f9a8d4' },
  { name: 'Cá trê', min: 1, max: 5, w: 16, tier: 'Cá thường', color: '#a8a29e' },
  { name: 'Cá chép', min: 2, max: 7, w: 12, tier: 'Cá khá', color: '#fbbf24' },
  { name: 'Cá lóc', min: 2, max: 8, w: 8, tier: 'Cá khá', color: '#84cc16' },
  { name: 'Cá trắm cỏ', min: 4, max: 12, w: 5, tier: 'Cá to', color: '#34d399' },
  { name: 'Cá tra', min: 6, max: 18, w: 3.5, tier: 'Cá to', color: '#38bdf8' },
  { name: 'Cá mè hoa', min: 8, max: 25, w: 2, tier: 'Cá to', color: '#a78bfa' },
  { name: 'Cá tầm', min: 15, max: 40, w: 1.2, tier: 'Cá hiếm', color: '#f472b6', rare: true },
  { name: 'Cá hô', min: 30, max: 80, w: 0.3, tier: 'Cá siêu hiếm', color: '#facc15', rare: true },
];

const TOTAL_W = SPECIES.reduce((s, x) => s + x.w, 0);

export function rollSpecies(rng: () => number): Species {
  let r = rng() * TOTAL_W;
  for (const sp of SPECIES) {
    r -= sp.w;
    if (r <= 0) return sp;
  }
  return SPECIES[0];
}

export function rollWeight(sp: Species, rng: () => number): number {
  // thiên về đầu nhẹ trong mỗi loài, thỉnh thoảng mới vọt lên gần max
  const t = Math.pow(rng(), 1.6);
  return Math.round((sp.min + (sp.max - sp.min) * t) * 10) / 10;
}

interface Angler {
  p: Person;
  totalKg: number;
  bestKg: number;
  catches: number;
  nextBiteAt: number;
  lastCatchAt: number;
  hue: number;
}

export interface CatchInfo {
  username: string;
  nickname: string;
  fish: string;
  w: number;
  tier: string;
  at: number;
}

export interface FishView {
  anglers: {
    username: string;
    nickname: string;
    avatar: string;
    totalKg: number;
    catches: number;
    hue: number;
    justCaught: boolean;
    crown: boolean;
  }[];
  anglerCount: number;
  top: { nickname: string; avatar: string; totalKg: number }[];
  roundRemainSec: number;
  roundBest: { nickname: string; fish: string; w: number } | null;
  lastCatch: CatchInfo | null;
  lastJoin: { nickname: string; at: number } | null;
  rareCount: number;
  rareGoal: number;
  likeMeter: number;
  likeGoal: number;
  golden: boolean;
  totalFish: number;
  totalKg: number;
}

const M = (s: string) => `M: ${s}`;
const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export class FishingRoom {
  private anglers = new Map<string, Angler>();
  private roundEndsAt = 0;
  private roundBest: (CatchInfo & { username: string }) | null = null;
  private crownUser: string | null = null;
  private rareCount = 0;
  private likeMeter = 0;
  private goldenUntil = 0;
  private totalFish = 0;
  private totalKgAll = 0;
  private lastCatch: CatchInfo | null = null;
  private lastJoin: { nickname: string; at: number } | null = null;
  private lastIdleAt = 0;
  private rng: () => number;

  constructor(now: number, rng: () => number = Math.random) {
    this.rng = rng;
    this.roundEndsAt = now + GAME.roundSec * 1000;
    this.lastIdleAt = now;
  }

  newSession(now: number): Say[] {
    this.anglers.clear();
    this.roundEndsAt = now + GAME.roundSec * 1000;
    this.roundBest = null;
    this.crownUser = null;
    this.rareCount = 0;
    this.likeMeter = 0;
    this.goldenUntil = 0;
    this.totalFish = 0;
    this.totalKgAll = 0;
    this.lastCatch = null;
    this.lastJoin = null;
    this.lastIdleAt = now;
    return [
      {
        main: true,
        text: M('Chào mừng cả nhà đến với Hồ Cá Vui! Muốn xuống hồ, bạn chỉ cần bình luận chữ CÂU là có ngay một cần câu bên hồ. Cá to cá nhỏ là do may rủi, ai câu được con to nhất vòng sẽ được đội vương miện. Mời cả nhà xuống hồ nào!'),
      },
    ];
  }

  private biteDelay(now: number): number {
    const base = GAME.biteMinSec + this.rng() * (GAME.biteMaxSec - GAME.biteMinSec);
    const sec = now < this.goldenUntil ? base / 2 : base;
    return now + sec * 1000;
  }

  join(p: Person, now: number, announce = false) {
    if (this.anglers.has(p.username)) return;
    this.anglers.set(p.username, {
      p,
      totalKg: 0,
      bestKg: 0,
      catches: 0,
      nextBiteAt: now + (4 + this.rng() * 8) * 1000,
      lastCatchAt: 0,
      hue: Math.floor(this.rng() * 360),
    });
    if (announce) this.lastJoin = { nickname: p.nickname, at: now };
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    const isNew = !this.anglers.has(p.username);
    this.join(p, now);
    const tokens = plain(p.comment).split(' ');
    const wantsFish = tokens.some((t) => t === 'CAU');
    if (!wantsFish) return [];
    const a = this.anglers.get(p.username)!;
    // gõ "câu" = quăng cần lại: cá sắp cắn nhanh hơn
    a.nextBiteAt = Math.min(a.nextBiteAt, now + (2 + this.rng() * 3) * 1000);
    if (isNew) {
      this.lastJoin = { nickname: p.nickname, at: now };
      return [{ text: M(`Chào cần thủ ${p.spoken} đã xuống hồ! Chúc bạn giật được cá to nhé.`), ttl: 20_000 }];
    }
    return [];
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: M(`Cảm ơn ${p.spoken} đã theo dõi kênh. Bạn có một cần câu bên hồ rồi đó, bình luận chữ CÂU để quăng cần nhé.`), ttl: 30_000 }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}. Chúc bạn hôm nay giật cá thật to!`) }];
  }

  like(count: number, now: number): Say[] {
    this.likeMeter += count;
    if (this.likeMeter >= GAME.likeGoal) {
      this.likeMeter -= GAME.likeGoal;
      this.goldenUntil = now + 20_000;
      return [{ text: M('Đủ một nghìn tim rồi cả nhà ơi! Cá đang cắn câu liên tục trong hai mươi giây, ai cũng dễ giật được cá to!'), ttl: 30_000 }];
    }
    return [];
  }

  hold(ms: number) {
    this.roundEndsAt += ms;
    if (this.goldenUntil) this.goldenUntil += ms;
    for (const a of this.anglers.values()) a.nextBiteAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  private doCatch(a: Angler, now: number): Say[] {
    const sp = rollSpecies(this.rng);
    const w = rollWeight(sp, this.rng);
    a.totalKg += w;
    a.bestKg = Math.max(a.bestKg, w);
    a.catches++;
    a.lastCatchAt = now;
    a.nextBiteAt = this.biteDelay(now);
    this.totalFish++;
    this.totalKgAll += w;
    const info: CatchInfo = { username: a.p.username, nickname: a.p.nickname, fish: sp.name, w, tier: sp.tier, at: now };
    this.lastCatch = info;
    if (!this.roundBest || w > this.roundBest.w) this.roundBest = { ...info };
    if (sp.rare) {
      this.rareCount++;
      return [
        {
          main: true,
          text: M(`Không thể tin được! ${a.p.spoken} vừa giật được ${sp.name} nặng ${w} ký — ${sp.tier} của hồ! Xin chúc mừng!`),
        },
      ];
    }
    if (w >= 15) {
      return [{ main: true, text: M(`${a.p.spoken} giật được ${sp.name} ${w} ký! Một con cá thật to, cả hồ vỗ tay nào!`) }];
    }
    if (w >= 7) {
      return [{ text: M(`${a.p.spoken} vừa lên ${sp.name} ${w} ký.`), ttl: 20_000 }];
    }
    return [];
  }

  private endRound(now: number): Say[] {
    const lines: Say[] = [];
    if (this.roundBest) {
      this.crownUser = this.roundBest.username;
      lines.push({
        main: true,
        text: M(`Hết giờ vòng câu! Vương miện thuộc về ${this.roundBest.nickname} với con ${this.roundBest.fish} nặng ${this.roundBest.w} ký. Vòng mới bắt đầu, cả nhà quăng cần tiếp nào!`),
      });
    } else {
      lines.push({ main: true, text: M('Hết giờ vòng câu mà chưa ai giật được con nào. Vòng mới bắt đầu, chúc cả nhà may mắn hơn!') });
    }
    this.roundBest = null;
    this.roundEndsAt = now + GAME.roundSec * 1000;
    return lines;
  }

  nextRound(now: number): Say[] {
    return this.endRound(now);
  }

  tick(now: number): Say[] {
    const lines: Say[] = [];
    if (now >= this.roundEndsAt) lines.push(...this.endRound(now));
    if (this.rareCount >= GAME.rareGoal) {
      this.rareCount = 0;
      this.goldenUntil = now + 15_000;
      lines.push({ main: true, text: M('Cả hồ đã câu đủ một trăm con cá hiếm! Mở hội ăn mừng: cá cắn câu liên tục trong mười lăm giây!') });
    }
    for (const a of this.anglers.values()) {
      if (a.nextBiteAt <= now) lines.push(...this.doCatch(a, now));
    }
    if (this.anglers.size === 0 && now - this.lastIdleAt > GAME.idleLineEveryMs) {
      this.lastIdleAt = now;
      lines.push({
        text: M('Hồ đang vắng, mời bạn xuống câu cùng cho vui. Chỉ cần bình luận chữ CÂU là có cần câu ngay bên hồ.'),
        ttl: 50_000,
      });
    }
    return lines;
  }

  view(now: number): FishView {
    const list = [...this.anglers.values()];
    return {
      anglers: list.slice(0, 14).map((a) => ({
        username: a.p.username,
        nickname: a.p.nickname,
        avatar: a.p.avatar,
        totalKg: Math.round(a.totalKg * 10) / 10,
        catches: a.catches,
        hue: a.hue,
        justCaught: now - a.lastCatchAt < 2500,
        crown: this.crownUser === a.p.username,
      })),
      anglerCount: list.length,
      top: [...list]
        .sort((x, y) => y.totalKg - x.totalKg)
        .slice(0, 5)
        .map((a) => ({ nickname: a.p.nickname, avatar: a.p.avatar, totalKg: Math.round(a.totalKg * 10) / 10 })),
      roundRemainSec: Math.max(0, Math.ceil((this.roundEndsAt - now) / 1000)),
      roundBest: this.roundBest ? { nickname: this.roundBest.nickname, fish: this.roundBest.fish, w: this.roundBest.w } : null,
      lastCatch: this.lastCatch,
      lastJoin: this.lastJoin,
      rareCount: this.rareCount,
      rareGoal: GAME.rareGoal,
      likeMeter: this.likeMeter,
      likeGoal: GAME.likeGoal,
      golden: now < this.goldenUntil,
      totalFish: this.totalFish,
      totalKg: Math.round(this.totalKgAll * 10) / 10,
    };
  }
}
