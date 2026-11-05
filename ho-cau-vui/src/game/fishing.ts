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

export interface AnglerPopup {
  kind: 'catch' | 'miss' | 'bait';
  fish?: string;
  w?: number;
  at: number;
}

interface Angler {
  p: Person;
  totalKg: number;
  bestKg: number;
  catches: number;
  nextBiteAt: number;
  lastCatchAt: number;
  hue: number;
  popup: AnglerPopup | null;
  act: { kind: 'jerk' | 'bait'; at: number } | null;
  lastJerkAt: number;
  lastBaitAt: number;
}

export interface CatchInfo {
  username: string;
  nickname: string;
  fish: string;
  w: number;
  tier: string;
  at: number;
}

export interface Spotlight {
  username: string;
  nickname: string;
  avatar: string;
  fish: string;
  w: number;
  tier: string;
  hue: number;
  at: number;
  isRoundBest: boolean;
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
    popup: AnglerPopup | null;
    act: { kind: 'jerk' | 'bait'; at: number } | null;
  }[];
  anglerCount: number;
  top: { nickname: string; avatar: string; totalKg: number }[];
  roundRemainSec: number;
  roundBest: { nickname: string; fish: string; w: number } | null;
  lastCatch: CatchInfo | null;
  spotlight: Spotlight | null;
  lastJoin: { nickname: string; at: number } | null;
  rareCount: number;
  rareGoal: number;
  likeMeter: number;
  likeGoal: number;
  golden: boolean;
  totalFish: number;
  totalKg: number;
  musicOn: boolean; // nhạc nền do trang stage phát riêng (live/music.ts), phòng chỉ giữ trạng thái
  musicVolume: number;
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
  private spot: (Spotlight & { until: number }) | null = null;
  private lastJoin: { nickname: string; at: number } | null = null;
  private lastIdleAt = 0;
  musicOn = true; // nhạc nền bật sẵn khi mở hồ (chủ kênh chốt: game nào có nhạc là tự phát)
  musicVolume = GAME.musicVolume;
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
    this.spot = null;
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
      popup: null,
      act: null,
      lastJerkAt: 0,
      lastBaitAt: 0,
    });
    if (announce) this.lastJoin = { nickname: p.nickname, at: now };
  }

  /** Gõ GIẬT: cá sắp cắn thì giật lên luôn; chưa thì 40% vớ được cá, 60% hụt. Nguội 6 giây. */
  private jerk(a: Angler, now: number): Say[] {
    if (now - a.lastJerkAt < GAME.jerkCooldownMs) return [];
    a.lastJerkAt = now;
    a.act = { kind: 'jerk', at: now };
    if (a.nextBiteAt - now <= 4500 || this.rng() < 0.4) {
      return this.doCatch(a, now);
    }
    a.popup = { kind: 'miss', at: now };
    a.nextBiteAt += 2000;
    return [{ text: M(`${a.p.spoken} giật hụt rồi, cá chạy mất dép!`), ttl: 12_000 }];
  }

  /** Gõ THẢ MỒI: dụ cá bu lại, lần cắn tới đến trong 1-3 giây. Nguội 25 giây. */
  private bait(a: Angler, now: number): Say[] {
    if (now - a.lastBaitAt < GAME.baitCooldownMs) return [];
    a.lastBaitAt = now;
    a.act = { kind: 'bait', at: now };
    a.popup = { kind: 'bait', at: now };
    a.nextBiteAt = Math.min(a.nextBiteAt, now + (1 + this.rng() * 2) * 1000);
    return [{ text: M(`${a.p.spoken} vừa thả mồi, cá đang bu lại quanh phao...`), ttl: 12_000 }];
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    const isNew = !this.anglers.has(p.username);
    this.join(p, now);
    const a = this.anglers.get(p.username)!;
    const tokens = plain(p.comment).split(' ').filter(Boolean);
    const has = (t: string) => tokens.includes(t);
    const hasPair = (x: string, y: string) => tokens.some((t, i) => t === x && tokens[i + 1] === y);
    if (has('GIAT')) return this.jerk(a, now);
    if (hasPair('THA', 'MOI') || has('MOI')) return this.bait(a, now);
    if (!has('CAU')) return [];
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
    if (this.spot) this.spot.until += ms;
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
    a.popup = { kind: 'catch', fish: sp.name, w, at: now };
    a.nextBiteAt = this.biteDelay(now);
    this.totalFish++;
    this.totalKgAll += w;
    const info: CatchInfo = { username: a.p.username, nickname: a.p.nickname, fish: sp.name, w, tier: sp.tier, at: now };
    this.lastCatch = info;
    const beatsRound = !this.roundBest || w > this.roundBest.w;
    if (beatsRound) this.roundBest = { ...info };
    // Ống kính chúc mừng: cá hiếm, cá to, hoặc phá kỷ lục vòng -> ống kính chuyển hẳn qua cần thủ đó
    const notable = !!sp.rare || w >= GAME.spotlightMinKg || (beatsRound && w >= 5);
    if (notable && (!this.spot || now >= this.spot.until || w >= this.spot.w)) {
      this.spot = {
        username: a.p.username,
        nickname: a.p.nickname,
        avatar: a.p.avatar,
        fish: sp.name,
        w,
        tier: sp.tier,
        hue: a.hue,
        at: now,
        isRoundBest: beatsRound,
        until: now + GAME.spotlightSec * 1000,
      };
    }
    if (sp.rare) {
      this.rareCount++;
      return [
        {
          main: true,
          text: M(`Ống kính đang hướng về ${a.p.spoken}! Không thể tin được, bạn ấy vừa giật được ${sp.name} nặng ${w} ký — ${sp.tier} của hồ! Xin chúc mừng!`),
        },
      ];
    }
    if (w >= GAME.spotlightMinKg) {
      return [{ main: true, text: M(`Ống kính chuyển qua ${a.p.spoken}! Bạn ấy giật được ${sp.name} ${w} ký, một con cá thật to. Cả hồ chúc mừng nào!`) }];
    }
    if (beatsRound && w >= 5) {
      return [{ text: M(`${a.p.spoken} vươn lên dẫn đầu vòng với ${sp.name} ${w} ký!`), ttl: 20_000 }];
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

  /** Chủ phòng xem thử cảnh chúc mừng: chỉ hiện ống kính + đọc chúc mừng, không cộng điểm */
  demoSpotlight(now: number): Say[] {
    const first = [...this.anglers.values()][0];
    const p = first?.p ?? { username: 'guest', nickname: 'Bạn đầu tiên', spoken: 'bạn đầu tiên', avatar: '' };
    this.spot = {
      username: p.username,
      nickname: p.nickname,
      avatar: p.avatar,
      fish: 'Cá tầm',
      w: 23.5,
      tier: 'Cá hiếm',
      hue: first?.hue ?? 200,
      at: now,
      isRoundBest: true,
      until: now + GAME.spotlightSec * 1000,
    };
    return [{ main: true, text: M(`Ống kính chuyển qua ${p.spoken}! Bạn ấy giật được Cá tầm 23 ký rưỡi, cá hiếm của hồ. Cả hồ chúc mừng nào!`) }];
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
        popup: a.popup,
        act: a.act,
      })),
      anglerCount: list.length,
      top: [...list]
        .sort((x, y) => y.totalKg - x.totalKg)
        .slice(0, 5)
        .map((a) => ({ nickname: a.p.nickname, avatar: a.p.avatar, totalKg: Math.round(a.totalKg * 10) / 10 })),
      roundRemainSec: Math.max(0, Math.ceil((this.roundEndsAt - now) / 1000)),
      roundBest: this.roundBest ? { nickname: this.roundBest.nickname, fish: this.roundBest.fish, w: this.roundBest.w } : null,
      lastCatch: this.lastCatch,
      spotlight:
        this.spot && now < this.spot.until
          ? {
              username: this.spot.username,
              nickname: this.spot.nickname,
              avatar: this.spot.avatar,
              fish: this.spot.fish,
              w: this.spot.w,
              tier: this.spot.tier,
              hue: this.spot.hue,
              at: this.spot.at,
              isRoundBest: this.spot.isRoundBest,
            }
          : null,
      lastJoin: this.lastJoin,
      rareCount: this.rareCount,
      rareGoal: GAME.rareGoal,
      likeMeter: this.likeMeter,
      likeGoal: GAME.likeGoal,
      golden: now < this.goldenUntil,
      totalFish: this.totalFish,
      totalKg: Math.round(this.totalKgAll * 10) / 10,
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
