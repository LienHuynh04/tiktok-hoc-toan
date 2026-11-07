// Engine Đua Xe Kart Live — ĐUA VÔ HẠN: đường đua chạy MÃI không có đích,
// MỖI người xem là 1 tay đua kart, góc nhìn 3D từ phía sau đoàn đua.
// - Người xem vào LÚC NÀO cũng nhận xe và đua ngay (xuất phát gần đoàn đua),
//   xe tự chạy liên tục; chủ xe chỉ cần gõ lệnh khi muốn lái/chơi kỹ năng.
// - Tính ĐIỂM (user chốt 2026-11-07): cứ 100m được +1 điểm; qua mỗi cột mốc
//   1000m được thưởng theo HẠNG tại thời điểm qua mốc (10/7/5/3/2/1). Bảng
//   Vua Đường Đua xếp theo tổng điểm cả buổi live.
// - Xe của người xem vắng mặt quá 10 phút (không bình luận/tim/quà) sẽ rời
//   đường đua để nhường chỗ; bot demo thì chạy mãi.
// - Lái bằng bình luận: TRÁI / PHẢI đổi làn né thùng dầu và vũng nhớt, cán đệm tăng tốc.
// - Thanh nitro đầy dần khi lái + cán đệm + né đẹp. Đầy thanh chọn 1 kỹ năng:
//   NITRO (bốc tốc), ĐẠN (làm chậm xe ngay trước mặt), KHIÊN (chặn 1 đòn).
// - TƯƠNG TÁC THEO ĐẶC TẢ USER CHỐT 2026-11-07 (ngoại lệ riêng của game này,
//   khác luật quà-vinh-danh của các game còn lại — user đã được báo rủi ro
//   pay-to-win/TikTok và vẫn chọn theo đặc tả):
//   thả tim -> xe của NGƯỜI THẢ tăng tốc nhẹ + nạp nitro; quà nhỏ -> bốc tốc;
//   quà >=30 xu -> bốc tốc + làm chậm xe ngay phía trước; quà VIP >=100 xu ->
//   SIÊU TỐC x1,6 + đầy nitro + hào quang vinh danh.

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

type Phase = 'lobby' | 'race';

interface Kart {
  p: Person;
  color: number;
  personal: number; // hệ số tốc độ riêng ±5%, cố định theo tên
  dist: number;
  speed: number; // tốc độ tức thời (m/s) — stage dùng để nội suy mượt
  lane: number; // -1 | 0 | 1
  nitro: number;
  cheerUntil: number; // thả tim: tăng tốc nhẹ
  vipUntil: number; // quà VIP: siêu tốc
  boostUntil: number;
  padUntil: number;
  slowUntil: number;
  slowMult: number;
  shieldUntil: number;
  wins: number; // số lần dẫn đầu qua cột mốc
  points: number; // điểm cả buổi: quãng đường + thưởng cột mốc
  inRace: boolean;
  lastLaneAt: number;
  lastActiveAt: number; // lần cuối chủ xe tương tác (để xét rời đường đua)
  nextPointAt: number; // mốc quãng đường kế tiếp được +điểm
  nextCheckpointAt: number; // cột mốc 1000m kế tiếp
  hzIdx: number; // con trỏ chướng ngại tiếp theo sẽ cán
  padIdx: number; // con trỏ đệm tiếp theo
  auraUntil: number;
  auraVip: boolean;
}

interface Hazard {
  dist: number;
  blocked: boolean[]; // [làn -1, làn 0, làn 1] — luôn chừa đúng 1 làn thoát
  kind: 'barrel' | 'oil';
}

interface Pad {
  dist: number;
  lane: number;
}

export interface KartView {
  at: number;
  phase: Phase;
  checkpoints: number; // số cột mốc người dẫn đầu đã qua
  leaderDist: number;
  racers: {
    username: string;
    nickname: string;
    avatar: string;
    color: number;
    dist: number;
    speed: number;
    lane: number;
    nitro: number;
    boosting: boolean;
    slowed: boolean;
    shielded: boolean;
    place: number; // hạng theo quãng đường tại thời điểm chụp
    wins: number;
    points: number;
    aura: boolean;
    auraVip: boolean;
  }[];
  racerCount: number;
  hazards: { dist: number; blocked: number[]; kind: 'barrel' | 'oil' }[];
  pads: { dist: number; lane: number }[];
  totalLikes: number;
  top: { nickname: string; avatar: string; points: number; wins: number }[];
  supporters: { nickname: string; coins: number }[];
  lastEvent: { text: string; at: number } | null;
  totals: { checkpoints: number };
  musicOn: boolean;
  musicVolume: number;
}

const M = (s: string) => `M: ${s}`;
export const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const KART_COLORS = [
  0xef4444, 0x3b82f6, 0xf59e0b, 0x22c55e, 0xa855f7, 0xec4899, 0x06b6d4, 0xf97316,
  0x84cc16, 0xeab308, 0x14b8a6, 0xf43f5e, 0x6366f1, 0x10b981, 0xd946ef, 0x0ea5e9,
  0xfb7185, 0xa3e635, 0xfacc15, 0x38bdf8, 0xfb923c, 0x4ade80, 0xc084fc, 0x94a3b8,
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
export const colorFor = (username: string) => hashStr(username) % KART_COLORS.length;
const isBot = (username: string) => username.startsWith('bot_');

const IDLE_LINES = [
  'Cả nhà bình luận bất cứ chữ gì là nhận một chiếc kart mang tên mình, vào là đua ngay nhé!',
  'Đường đua này chạy mãi không có đích: cứ 100 mét là được 1 điểm, qua mỗi cột mốc 1 cây số còn được thưởng điểm theo hạng nữa!',
  'Đang đua thì gõ TRÁI hoặc PHẢI để đổi làn né thùng dầu, nhớ cán đệm phát sáng để nạp nitro!',
  'Thanh nitro đầy thì gõ NITRO để bốc tốc, ĐẠN để chơi xe trước mặt, hoặc KHIÊN để phòng thủ!',
  'Thả tim là xe của bạn tăng tốc nhẹ và nạp thêm nitro đấy, thả càng nhiều xe càng bốc!',
  'Tặng quà là xe bốc tốc vượt lên, quà càng lớn bốc càng mạnh, quà VIP còn được siêu tốc nữa!',
];

const BOT_NAMES = ['Tí Hon', 'Bé Na', 'Cu Tèo', 'Chị Bảy', 'Anh Ba', 'Mèo Mướp', 'Ốc Tiêu', 'Bắp Rang', 'Sữa Đậu', 'Khoai Lang'];

export class KartRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private karts = new Map<string, Kart>();
  private phase: Phase = 'lobby';
  private raceStartedAt = 0;
  private hazards: Hazard[] = [];
  private pads: Pad[] = [];
  private nextSpawnAt = 160;
  private totalLikes = 0;
  private checkpoints = 0; // cột mốc cao nhất đoàn đã qua
  private supporters = new Map<string, { nickname: string; coins: number }>();
  private lastEvent: KartView['lastEvent'] = null;
  private leaderName = '';
  private lastLeadSayAt = 0;
  private lastCheckpointSayAt = 0;
  private lastTickAt = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;
  private timeOffset = 0; // hold(): dời mọi mốc thời gian khi MC đang đọc câu chính

  constructor(now: number, private rng: () => number = Math.random) {
    this.lastTickAt = this.eff(now);
    this.lastIdleAt = this.eff(now);
  }

  private eff(now: number) {
    return now - this.timeOffset;
  }
  hold(ms: number) {
    if (ms > 0) this.timeOffset += ms;
  }
  chatterWindow(_now: number): boolean {
    return true;
  }

  private t(text: string, main = false): Say {
    return { text: M(text), ...(main ? { main: true } : {}) };
  }
  private event(text: string, now: number) {
    this.lastEvent = { text, at: now };
  }

  newSession(now: number): Say[] {
    const t = this.eff(now);
    this.karts.clear();
    this.supporters.clear();
    this.hazards = [];
    this.pads = [];
    this.nextSpawnAt = 160;
    this.phase = 'lobby';
    this.totalLikes = 0;
    this.checkpoints = 0;
    this.leaderName = '';
    void t;
    return [this.t('Chào cả nhà đến với Đua Xe Kart Live! Đây là đường đua VÔ HẠN: bình luận bất cứ chữ gì là nhận ngay một chiếc kart và đua liền, chạy mãi không dừng. Cứ 100 mét là có điểm, qua cột mốc 1 cây số được thưởng lớn. Thả tim là xe tăng tốc và nạp nitro, tặng quà là xe bốc tốc vượt lên nhé!', true)];
  }

  private addKart(p: Person, t: number): Kart {
    let k = this.karts.get(p.username);
    if (k) {
      k.lastActiveAt = t;
      return k;
    }
    const h = hashStr(p.username);
    k = {
      p,
      color: colorFor(p.username),
      personal: 1 - GAME.speedVar + (h % 1000) / 1000 * GAME.speedVar * 2,
      dist: 0,
      speed: 0,
      lane: (h % 3) - 1,
      nitro: GAME.startNitro,
      cheerUntil: 0,
      vipUntil: 0,
      boostUntil: 0,
      padUntil: 0,
      slowUntil: 0,
      slowMult: GAME.slowMult,
      shieldUntil: 0,
      wins: 0,
      points: 0,
      inRace: false,
      lastLaneAt: 0,
      lastActiveAt: t,
      nextPointAt: GAME.pointEveryM,
      nextCheckpointAt: GAME.checkpointM,
      hzIdx: 0,
      padIdx: 0,
      auraUntil: 0,
      auraVip: false,
    };
    this.karts.set(p.username, k);
    return k;
  }

  /** Vào phòng (member) — chỉ ghi danh, chưa cần nói */
  join(p: Person, now: number) {
    this.addKart(p, this.eff(now));
  }

  follow(p: Person, now: number): Say[] {
    const t = this.eff(now);
    const k = this.addKart(p, t);
    this.enterRace(k, t);
    return [this.t(`Cảm ơn ${p.spoken} đã theo dõi! Xe kart của bạn đã lăn bánh rồi đấy!`)];
  }

  private enterRace(k: Kart, t: number) {
    if (k.inRace) return;
    k.inRace = true;
    const others = [...this.karts.values()].filter((o) => o !== k && o.inRace);
    if (this.phase === 'race' && others.length > 0) {
      // Vào giữa đường đua vô hạn: xuất phát sau tay đua GIỮA đoàn một đoạn,
      // gần camera và vào nhịp ngay, kèm khiên 3 giây cho quen đường
      const dists = others.map((o) => o.dist).sort((a, b) => a - b);
      const median = dists[Math.floor(dists.length / 2)];
      k.dist = Math.max(0, median - GAME.spawnBehindMedianM);
      k.shieldUntil = Math.max(k.shieldUntil, t + GAME.spawnShieldSec * 1000);
    } else {
      k.dist = 0;
    }
    k.nextPointAt = (Math.floor(k.dist / GAME.pointEveryM) + 1) * GAME.pointEveryM;
    k.nextCheckpointAt = (Math.floor(k.dist / GAME.checkpointM) + 1) * GAME.checkpointM;
    // bỏ qua chướng ngại/đệm đã nằm sau vị trí xuất phát
    k.hzIdx = 0;
    while (k.hzIdx < this.hazards.length && this.hazards[k.hzIdx].dist < k.dist) k.hzIdx++;
    k.padIdx = 0;
    while (k.padIdx < this.pads.length && this.pads[k.padIdx].dist < k.dist) k.padIdx++;
    if (k.nitro < GAME.startNitro) k.nitro = GAME.startNitro;
  }

  /** Quà THEO ĐẶC TẢ (user chốt 2026-11-07): tác động thẳng vào cuộc đua.
   * <30 xu: bốc tốc giftSmallSec giây. >=30 xu: bốc tốc giftBigSec giây + làm
   * chậm xe ngay phía trước (khiên đỡ được). >=100 xu (VIP): SIÊU TỐC
   * vipBoostMult trong vipBoostSec giây + đầy nitro + hào quang vinh danh. */
  gift(p: Person, coins: number, now: number) {
    const t = this.eff(now);
    const k = this.addKart(p, t);
    this.enterRace(k, t);
    k.auraUntil = t + GAME.auraSec * 1000;
    if (coins >= GAME.vipGiftCoins) k.auraVip = true;
    const s = this.supporters.get(p.username) ?? { nickname: p.nickname, coins: 0 };
    s.coins += coins;
    s.nickname = p.nickname;
    this.supporters.set(p.username, s);
    if (this.phase !== 'race') return;
    if (coins >= GAME.vipGiftCoins) {
      k.vipUntil = t + GAME.vipBoostSec * 1000;
      k.nitro = 100;
      this.event(`👑 ${p.nickname} SIÊU TỐC VIP!`, t);
    } else if (coins >= GAME.giftBigCoins) {
      k.boostUntil = t + GAME.giftBigSec * 1000;
      // chơi xấu xe ngay phía trước (trong tầm đạn)
      let target: Kart | null = null;
      for (const o of this.karts.values()) {
        if (o === k || !o.inRace) continue;
        const gap = o.dist - k.dist;
        if (gap > 0 && gap <= GAME.shotRangeM && (!target || gap < target.dist - k.dist)) target = o;
      }
      if (target && target.shieldUntil <= t) {
        target.slowUntil = t + GAME.shotSlowSec * 1000;
        target.slowMult = GAME.shotSlowMult;
        this.event(`💥 Quà của ${p.nickname} làm chậm ${target.p.nickname}!`, t);
      }
    } else {
      k.boostUntil = t + GAME.giftSmallSec * 1000;
    }
  }

  thank(p: Person, giftName: string, coins: number): Say[] {
    const line =
      coins >= GAME.vipGiftCoins
        ? `Cảm ơn ${p.spoken} đã tặng ${giftName}! Quà VIP kích hoạt SIÊU TỐC cho xe của bạn, nitro đầy tràn luôn!`
        : coins >= GAME.giftBigCoins
          ? `Cảm ơn ${p.spoken} đã tặng ${giftName}! Xe của bạn bốc tốc mạnh, còn xe phía trước bị làm chậm lại kìa!`
          : `Cảm ơn ${p.spoken} đã tặng ${giftName}! Xe của bạn bốc tốc vượt lên rồi!`;
    return [{ ...this.t(line, true), priority: true }];
  }

  /** Tim THEO ĐẶC TẢ: nạp nitro + tăng tốc nhẹ cho xe của NGƯỜI THẢ (tự nhận xe nếu chưa có) */
  like(p: Person, count: number, now: number): Say[] {
    const t = this.eff(now);
    this.totalLikes += count;
    const k = this.addKart(p, t);
    this.enterRace(k, t);
    if (this.phase === 'race') {
      k.nitro = Math.min(100, k.nitro + count * GAME.likeNitroPerLike);
      k.cheerUntil = t + GAME.cheerMs;
    }
    return [];
  }

  chat(e: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    const t = this.eff(now);
    const k = this.addKart(e, t);
    const wasIn = k.inRace;
    this.enterRace(k, t);
    if (!wasIn) {
      // chào tay đua mới (câu phụ, không chặn nhịp)
      return [this.t(`Chào ${e.spoken}! Xe kart của bạn đã lăn bánh, gõ TRÁI, PHẢI để lái nhé!`)];
    }
    if (this.phase !== 'race') return [];

    const words = plain(e.comment).split(' ');
    const has = (...ws: string[]) => ws.some((w) => words.includes(w));
    // Đổi làn
    if (has('TRAI', 'TRAI1') || plain(e.comment).startsWith('TRAI')) {
      if (t - k.lastLaneAt >= GAME.laneCooldownMs && k.lane > -1) {
        k.lane--;
        k.lastLaneAt = t;
      }
      return [];
    }
    if (has('PHAI') || plain(e.comment).startsWith('PHAI')) {
      if (t - k.lastLaneAt >= GAME.laneCooldownMs && k.lane < 1) {
        k.lane++;
        k.lastLaneAt = t;
      }
      return [];
    }
    // Kỹ năng — tốn trọn thanh nitro
    if (has('NITRO', 'TANG', 'TOC')) return this.skillNitro(k, t);
    if (has('DAN', 'BAN')) return this.skillShot(k, t);
    if (has('KHIEN')) return this.skillShield(k, t);
    return [];
  }

  private skillNitro(k: Kart, t: number): Say[] {
    if (k.nitro < GAME.skillCost) return [];
    k.nitro = 0;
    k.boostUntil = t + GAME.boostSec * 1000;
    return [];
  }

  private skillShot(k: Kart, t: number): Say[] {
    if (k.nitro < GAME.skillCost) return [];
    // tìm xe gần nhất ngay phía trước trong tầm đạn
    let target: Kart | null = null;
    for (const o of this.karts.values()) {
      if (o === k || !o.inRace) continue;
      const gap = o.dist - k.dist;
      if (gap > 0 && gap <= GAME.shotRangeM && (!target || gap < target.dist - k.dist)) target = o;
    }
    if (!target) return []; // không có mục tiêu thì giữ nitro, không phí
    k.nitro = 0;
    if (target.shieldUntil > t) {
      target.shieldUntil = 0;
      this.event(`🛡️ ${target.p.nickname} đỡ đạn bằng khiên!`, t);
      return [this.t(`Khiên của ${target.p.spoken} vừa đỡ trọn một viên đạn! Hay quá!`)];
    }
    target.slowUntil = t + GAME.shotSlowSec * 1000;
    target.slowMult = GAME.shotSlowMult;
    this.event(`💥 ${k.p.nickname} bắn chậm ${target.p.nickname}!`, t);
    return [this.t(`Bùm! ${k.p.spoken} bắn trúng xe của ${target.p.spoken}, xe phía trước chậm hẳn lại!`)];
  }

  private skillShield(k: Kart, t: number): Say[] {
    if (k.nitro < GAME.skillCost) return [];
    k.nitro = 0;
    k.shieldUntil = t + GAME.shieldSec * 1000;
    return [];
  }

  startRace(now: number): Say[] {
    const t = this.eff(now);
    if (this.phase !== 'lobby') return [];
    if (![...this.karts.values()].some((k) => k.inRace)) return [];
    return this.startEndless(t);
  }

  private startEndless(t: number): Say[] {
    this.phase = 'race';
    this.raceStartedAt = t;
    return [this.t('Đường đua vô hạn bắt đầu! Xe cứ chạy mãi, ai vào lúc nào cũng đua được. Cứ 100 mét là có điểm, qua cột mốc 1 cây số được thưởng lớn nhé!', true)];
  }

  demoRace(now: number): Say[] {
    const t = this.eff(now);
    const says: Say[] = [];
    for (let i = 0; i < 7; i++) {
      const name = BOT_NAMES[i];
      const p: Person = { username: `bot_${i}`, nickname: name, spoken: name, avatar: '' };
      const k = this.addKart(p, t);
      this.enterRace(k, t);
    }
    if (this.phase === 'lobby') says.push(...this.startEndless(t));
    return says;
  }

  /** Sinh chướng ngại + đệm phía trước đoàn đua, dọn những thứ đoàn đã bỏ xa */
  private spawnAhead(leaderDist: number, minDist: number) {
    while (this.nextSpawnAt < leaderDist + 260) {
      const d = this.nextSpawnAt;
      if (this.rng() < 0.62) {
        const safeLane = Math.floor(this.rng() * 3) - 1;
        const blocked = [-1, 0, 1].map((l) => l !== safeLane);
        this.hazards.push({ dist: d, blocked, kind: this.rng() < 0.6 ? 'barrel' : 'oil' });
      } else {
        this.pads.push({ dist: d, lane: Math.floor(this.rng() * 3) - 1 });
      }
      this.nextSpawnAt += 55 + this.rng() * 55;
    }
    // dọn phía sau: mọi xe đều đã cán qua (con trỏ của từng xe đã vượt) — trừ số đã dọn khỏi đầu mảng
    const cut = minDist - 120;
    let n = 0;
    while (n < this.hazards.length && this.hazards[n].dist < cut) n++;
    if (n > 0) {
      this.hazards.splice(0, n);
      for (const k of this.karts.values()) k.hzIdx = Math.max(0, k.hzIdx - n);
    }
    let m = 0;
    while (m < this.pads.length && this.pads[m].dist < cut) m++;
    if (m > 0) {
      this.pads.splice(0, m);
      for (const k of this.karts.values()) k.padIdx = Math.max(0, k.padIdx - m);
    }
  }

  private speedOf(k: Kart, t: number, leaderDist: number): number {
    let mult = 1;
    if (k.vipUntil > t) mult = GAME.vipBoostMult;
    else if (k.boostUntil > t) mult = GAME.boostMult;
    else if (k.padUntil > t) mult = GAME.padMult;
    else if (k.cheerUntil > t) mult = GAME.cheerMult;
    if (k.slowUntil > t) mult *= k.slowMult;
    const gap = leaderDist - k.dist;
    const rubber = gap > 80 ? 1 + Math.min(GAME.rubberBand, ((gap - 80) / 500) * GAME.rubberBand) : 1;
    return GAME.baseSpeed * k.personal * mult * rubber;
  }

  tick(now: number): Say[] {
    const t = this.eff(now);
    const dt = Math.min(0.5, Math.max(0, (t - this.lastTickAt) / 1000));
    this.lastTickAt = t;
    const says: Say[] = [];

    // ——— rời đường đua khi vắng mặt quá lâu (bot thì không) ———
    for (const k of [...this.karts.values()]) {
      if (!isBot(k.p.username) && t - k.lastActiveAt > GAME.idleRetireSec * 1000) {
        this.karts.delete(k.p.username);
        if (k.inRace) {
          this.event(`👋 ${k.p.nickname} rời đường đua`, t);
          says.push(this.t(`${k.p.spoken} vắng lâu nên xe đã rời đường đua. Khi nào quay lại, bình luận là có xe mới ngay nhé!`));
        }
      }
    }

    const active = [...this.karts.values()].filter((k) => k.inRace);

    if (this.phase === 'lobby') {
      if (active.length >= 1) {
        says.push(...this.startEndless(t));
      } else {
        if (t - this.lastIdleAt >= GAME.idleLineEveryMs) {
          this.lastIdleAt = t;
          says.push(this.t(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]));
        }
        return says;
      }
    }

    if (active.length === 0) {
      this.phase = 'lobby';
      this.leaderName = '';
      return says;
    }

    // ——— ĐANG ĐUA VÔ HẠN ———
    const leaderDist = Math.max(0, ...active.map((k) => k.dist));
    const minDist = Math.min(...active.map((k) => k.dist));
    this.spawnAhead(leaderDist, minDist);

    for (const k of active) {
      k.speed = this.speedOf(k, t, leaderDist);
      k.dist += k.speed * dt;
      k.nitro = Math.min(100, k.nitro + GAME.nitroPassive * dt);

      // cán đệm tăng tốc
      while (k.padIdx < this.pads.length && this.pads[k.padIdx].dist <= k.dist) {
        const pad = this.pads[k.padIdx++];
        if (pad.lane === k.lane) {
          k.padUntil = t + GAME.padSec * 1000;
          k.nitro = Math.min(100, k.nitro + GAME.padNitro);
        }
      }
      // cán chướng ngại
      while (k.hzIdx < this.hazards.length && this.hazards[k.hzIdx].dist <= k.dist) {
        const hz = this.hazards[k.hzIdx++];
        const laneIdx = k.lane + 1;
        if (hz.blocked[laneIdx]) {
          if (k.shieldUntil > t) {
            k.shieldUntil = 0; // khiên đỡ đòn, xe đi tiếp
          } else {
            k.slowUntil = t + GAME.slowSec * 1000;
            k.slowMult = GAME.slowMult;
          }
        } else {
          k.nitro = Math.min(100, k.nitro + GAME.dodgeNitro); // né đẹp
        }
      }
      // ——— ĐIỂM quãng đường: mỗi pointEveryM được +pointValue ———
      while (k.dist >= k.nextPointAt) {
        k.points += GAME.pointValue;
        k.nextPointAt += GAME.pointEveryM;
      }
      // ——— CỘT MỐC: thưởng theo hạng tại thời điểm qua mốc ———
      while (k.dist >= k.nextCheckpointAt) {
        const rank = 1 + active.filter((o) => o !== k && o.dist > k.dist).length;
        const bonus = GAME.checkpointBonus[rank - 1] ?? 1;
        k.points += bonus;
        const km = Math.round(k.nextCheckpointAt / GAME.checkpointM);
        k.nextCheckpointAt += GAME.checkpointM;
        if (km > this.checkpoints) this.checkpoints = km;
        if (rank === 1) {
          k.wins++;
          this.event(`🏁 ${k.p.nickname} dẫn đầu qua cột mốc ${km}km (+${bonus}đ)`, t);
          if (t - this.lastCheckpointSayAt > 15_000) {
            this.lastCheckpointSayAt = t;
            says.push(this.t(`${k.p.spoken} dẫn đầu qua cột mốc ${km} cây số, nhận thưởng ${bonus} điểm! Tổng điểm của bạn ấy đang là ${k.points} điểm!`, true));
          }
        }
      }
    }

    // đổi ngôi dẫn đầu (theo quãng đường)
    const leader = [...active].sort((a, b) => b.dist - a.dist)[0];
    if (leader && leader.p.username !== this.leaderName) {
      const first = this.leaderName === '';
      this.leaderName = leader.p.username;
      if (!first && t - this.lastLeadSayAt > 9000) {
        this.lastLeadSayAt = t;
        this.event(`⚡ ${leader.p.nickname} vượt lên dẫn đầu!`, t);
        says.push(this.t(`${leader.p.spoken} vừa vượt lên dẫn đầu đoàn đua!`));
      }
    }

    // câu rảnh giữa buổi đua dài
    if (t - this.lastIdleAt >= GAME.idleLineEveryMs) {
      this.lastIdleAt = t;
      says.push(this.t(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]));
    }
    return says;
  }

  view(now: number): KartView {
    const t = this.eff(now);
    const sorted = [...this.karts.values()].filter((k) => k.inRace).sort((a, b) => b.dist - a.dist);
    const racers = sorted.slice(0, GAME.maxRacers).map((k, i) => ({
      username: k.p.username,
      nickname: k.p.nickname,
      avatar: k.p.avatar,
      color: k.color,
      dist: Math.round(k.dist * 10) / 10,
      speed: Math.round(k.speed * 10) / 10,
      lane: k.lane,
      nitro: Math.round(k.nitro),
      boosting: k.boostUntil > t || k.padUntil > t || k.cheerUntil > t || k.vipUntil > t,
      slowed: k.slowUntil > t,
      shielded: k.shieldUntil > t,
      place: i + 1,
      wins: k.wins,
      points: k.points,
      aura: k.auraUntil > t,
      auraVip: k.auraUntil > t && k.auraVip,
    }));
    const leaderDist = racers.length ? Math.max(...racers.map((r) => r.dist)) : 0;
    const near = (d: number) => d > leaderDist - 90 && d < leaderDist + 300;
    return {
      at: now,
      phase: this.phase,
      checkpoints: this.checkpoints,
      leaderDist,
      racers,
      racerCount: sorted.length,
      hazards: this.hazards.filter((h) => near(h.dist)).map((h) => ({ dist: h.dist, blocked: [-1, 0, 1].filter((l) => h.blocked[l + 1]), kind: h.kind })),
      pads: this.pads.filter((p) => near(p.dist)).map((p) => ({ dist: p.dist, lane: p.lane })),
      totalLikes: this.totalLikes,
      top: [...this.karts.values()]
        .filter((k) => k.points > 0)
        .sort((a, b) => b.points - a.points || b.wins - a.wins)
        .slice(0, 5)
        .map((k) => ({ nickname: k.p.nickname, avatar: k.p.avatar, points: k.points, wins: k.wins })),
      supporters: [...this.supporters.values()].sort((a, b) => b.coins - a.coins).slice(0, 5),
      lastEvent: this.lastEvent && t - this.lastEvent.at < 6000 ? this.lastEvent : null,
      totals: { checkpoints: this.checkpoints },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
