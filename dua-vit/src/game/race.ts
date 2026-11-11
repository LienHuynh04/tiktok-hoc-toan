// Engine Đua Vịt: MỖI người xem là 1 tay đua vịt, đua CÙNG LÚC trong hồ bơi 200m.
// Bình luận bất cứ lúc nào là có vịt đua mang tên mình. Cứ ~11 giây có 1 đợt KHẨU LỆNH
// (BƠI / QUẠT / ĐẠP...): ai gõ đúng khẩu lệnh trong 5 giây thì vịt của mình bốc tốc 4 giây.
// Ở sảnh chờ: đủ 100 tim -> XUẤT PHÁT NGAY dù chưa đủ 6 tay đua (chỉ cần >= 2 người thật).
// Đủ 150 tim -> SÓNG LỚN đẩy cả đoàn tăng tốc (nhịp chơi chung của cả phòng).
// HỒ LUÔN SÔI ĐỘNG: phòng ít người thật thì vịt demo (tên hài hước kiểu người dùng thật,
// sân khấu gắn dấu 🤖 trước tên) tự xuống bơi lấp làn để màn hình không bao giờ trống;
// đủ người thật thì demo rút. Demo không nhận bục vinh quang, không tính Vua Vịt.
// Về nhất được vinh danh trên bục; quà chỉ được cảm ơn, không mua được tốc độ.

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

type Phase = 'lobby' | 'race' | 'finish' | 'podium';

interface Racer {
  p: Person;
  art: number;
  dist: number;
  base: number;
  boostUntil: number;
  boostFrom: number; // bốc tốc bắt đầu từ lúc này (vịt demo bốc tốc trễ một chút cho tự nhiên)
  likeBoostUntil: number; // tăng tốc cá nhân từ tim của chính chủ vịt: hết hiệu lực lúc này
  likeBoostPct: number; // mức tăng tốc cá nhân đang dồn (0.1 = +10%)
  place: number; // 0 = chưa về đích
  wins: number; // vô địch chặng này... (reset mỗi buổi theo session)
  totalWins: number; // vô địch cả buổi (bảng Vua Tốc Độ)
  lastActive: number;
  inRace: boolean; // có mặt trong chặng hiện tại
  bot: boolean; // vịt demo lấp hồ (chế độ hồ luôn sôi động) — không nhận giải
}

export interface RaceView {
  phase: Phase;
  phaseRemainSec: number;
  raceNo: number;
  racers: {
    username: string;
    nickname: string;
    avatar: string;
    art: number;
    distPct: number;
    boosting: boolean;
    likeBoost: number; // mức tăng tốc cá nhân từ tim đang còn hiệu lực (0 = không có)
    place: number;
    wins: number;
    demo: boolean;
  }[];
  racerCount: number;
  event: { word: string; remainSec: number } | null;
  tailwind: { active: boolean; remainSec: number; meter: number; goal: number };
  lobbyLikes: { meter: number; goal: number };
  podium: { top: { nickname: string; avatar: string; art: number; place: number }[] } | null;
  top: { nickname: string; avatar: string; totalWins: number }[];
  totals: { races: number };
  musicOn: boolean;
  musicVolume: number;
}

const M = (s: string) => `M: ${s}`;
export const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const EVENT_WORDS = ['BƠI', 'QUẠT', 'ĐẠP', 'LẶN', 'VỊT', 'TĂNG TỐC'];
// Tên của vịt demo: đặt kiểu tên người dùng thật hay dùng cho vui (sân khấu vẫn gắn
// dấu 🤖 trước tên để ai cũng biết đây là vịt máy lấp hồ, không phải người xem thật)
export const BOT_NAMES = [
  'tôi là công chúa',
  'công chúa bong bóng',
  'đại gia chân đất',
  'thánh lầy đây rồi',
  'mèo lười chính hiệu',
  'anh hùng bàn phím',
  'nữ hoàng thả thính',
  'ông hoàng tốc độ',
  'bà hàng xóm nhiều chuyện',
  'đẹp trai nhất xóm',
  'chị đại về làng',
  'hoàng tử ngủ gật',
  'tiểu thư thất lạc',
  'dân chơi hệ giàu',
  'không tên cũng nổi',
  'ăn hại nhưng vui',
  'vịt nhà người ta',
  'bé heo ham ăn',
  'thánh soi đây nè',
  'cô nàng hậu đậu',
  'trùm cuối xóm tôi',
  'fan cứng của Bug',
  'người qua đường 2077',
  'sen của mèo Bug',
];
const IDLE_LINES = [
  'Cả nhà bình luận bất cứ chữ gì là có vịt đua mang tên mình nhé, đua hoàn toàn miễn phí!',
  'Khi màn hình hiện khẩu lệnh to, gõ đúng khẩu lệnh đó là vịt của mình bốc tốc ngay!',
  'Đủ 150 tim là có sóng lớn đẩy cả đoàn vịt tăng tốc đấy cả nhà!',
  'Ở sảnh chờ mà đủ 100 tim là chặng đua xuất phát ngay, không cần chờ đủ 6 tay đua đâu cả nhà!',
];

export function artFor(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return h % 10;
}

export class RaceRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private racers = new Map<string, Racer>();
  private phase: Phase = 'lobby';
  private phaseEndsAt = 0;
  private raceNo = 0;
  private totals = { races: 0 };
  private event: { word: string; endsAt: number; usedBy: Set<string> } | null = null;
  private nextEventAt = 0;
  private tailwindUntil = 0;
  private likeMeter = 0;
  private lobbyLikes = 0; // tim ở sảnh chờ/bục: đủ lobbyLikeGoal -> xuất phát sớm
  private botSeq = 0; // số thứ tự vịt demo (tên lấy vòng quanh kho tên BOT_NAMES)
  private realFinishOpened = false; // cửa sổ cán đích đã mở bởi tay đua thật chưa
  private finishCount = 0;
  private podiumInfo: RaceView['podium'] = null;
  private lastTickAt = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.phaseEndsAt = now + GAME.lobbySec * 1000;
    this.lastTickAt = now;
    this.lastIdleAt = now;
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  newSession(now: number): Say[] {
    this.racers.clear();
    this.raceNo = 0;
    this.totals = { races: 0 };
    this.phase = 'lobby';
    this.phaseEndsAt = now + GAME.lobbySec * 1000;
    this.event = null;
    this.likeMeter = 0;
    this.lobbyLikes = 0;
    this.botSeq = 0;
    this.realFinishOpened = false;
    this.tailwindUntil = 0;
    this.lastTickAt = now;
    return [
      {
        main: true,
        text: M(
          'Chào cả nhà đến với Đua Vịt! Bình luận bất cứ chữ gì là bạn có ngay một bé vịt đua mang tên mình, nhảy xuống hồ bơi 200 mét. Khi màn hình hiện khẩu lệnh to, gõ đúng khẩu lệnh là vịt của bạn bốc tốc. Ai về đích đầu tiên là vô địch chặng nhé!',
        ),
      },
    ];
  }

  private realCount(): number {
    let n = 0;
    for (const r of this.racers.values()) if (!r.bot) n++;
    return n;
  }

  // Hồ luôn sôi động: ở sảnh chờ/bục, phòng ít người thật thì vịt demo xuống lấp hồ;
  // đủ attractRealMax người thật thì demo rút hết. Chỉ gọi lúc chưa đua để không xáo trộn chặng.
  private ensureBots(now: number) {
    if (this.phase !== 'lobby' && this.phase !== 'podium') return;
    const real = this.realCount();
    if (real >= GAME.attractRealMax) {
      for (const [u, r] of this.racers) if (r.bot) this.racers.delete(u);
      return;
    }
    const want = Math.max(0, GAME.attractField - real);
    const bots = [...this.racers.values()].filter((r) => r.bot);
    for (let i = want; i < bots.length; i++) this.racers.delete(bots[i].p.username);
    for (let i = bots.length; i < want; i++) {
      const seq = this.botSeq++;
      const name = BOT_NAMES[seq % BOT_NAMES.length];
      const p: Person = { username: '__bot' + seq, nickname: name, spoken: name, avatar: '' };
      this.racers.set(p.username, {
        p,
        art: artFor(p.username),
        dist: 0,
        base: GAME.baseMin + this.rng() * GAME.baseVar,
        boostUntil: 0,
        boostFrom: 0,
        likeBoostUntil: 0,
        likeBoostPct: 0,
        place: 0,
        wins: 0,
        totalWins: 0,
        lastActive: now,
        inRace: true,
        bot: true,
      });
    }
  }

  join(p: Person, now: number) {
    const r = this.racers.get(p.username);
    if (r) {
      r.lastActive = now;
      r.p = p;
      return;
    }
    if (this.racers.size >= GAME.maxRacers) return;
    const inRace = this.phase === 'lobby' || this.phase === 'podium';
    this.racers.set(p.username, {
      p,
      art: artFor(p.username),
      dist: 0,
      base: GAME.baseMin + this.rng() * GAME.baseVar,
      boostUntil: 0,
      boostFrom: 0,
      likeBoostUntil: 0,
      likeBoostPct: 0,
      place: 0,
      wins: 0,
      totalWins: 0,
      lastActive: now,
      inRace,
      bot: false,
    });
    // tim sảnh chờ đã đủ 100 mà giờ mới có tay đua thật thứ 2: xuất phát ngay, khỏi chờ hết giờ chờ
    if (this.phase === 'lobby' && this.lobbyLikes >= GAME.lobbyLikeGoal && this.realCount() >= 2) {
      this.phaseEndsAt = now;
    }
    this.ensureBots(now);
    // vào giữa chặng: vẫn được đua tiếp từ vạch xuất phát (chặng sau tự cân bằng lại)
    if (this.phase === 'race' || this.phase === 'finish') {
      const r2 = this.racers.get(p.username)!;
      r2.inRace = true;
    }
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: M(`Chào ${p.spoken}! Vịt đua của bạn đã xuống hồ rồi, gõ đúng khẩu lệnh trên màn hình là bốc tốc nhé!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Chúc vịt đua của bạn bơi thật bốc!`) }];
  }

  like(p: Person, count: number, now: number): Say[] {
    // Vịt của chính người thả tim bơi nhanh hơn (ngoại lệ tim-cá nhân riêng của
    // Đua Vịt, chủ kênh chốt 2026-11-11): chỉ giữa chặng, chỉ vịt người thật
    // chưa về đích. Tim vẫn dồn vào mốc chung (xuất phát sớm / sóng lớn) như cũ.
    const mine = this.racers.get(p.username);
    if (mine && !mine.bot && mine.inRace && mine.place === 0 && (this.phase === 'race' || this.phase === 'finish')) {
      const add = GAME.likeBoostStep * Math.min(Math.max(count, 1), GAME.likeBoostMaxPerEvent);
      mine.likeBoostPct = Math.min(GAME.likeBoostMax, (now < mine.likeBoostUntil ? mine.likeBoostPct : 0) + add);
      mine.likeBoostUntil = now + GAME.likeBoostSec * 1000;
    }
    // Sảnh chờ / bục vinh quang: tim dồn vào mốc xuất phát sớm (100 tim), không dồn sóng lớn
    if (this.phase === 'lobby' || this.phase === 'podium') {
      const before = this.lobbyLikes;
      this.lobbyLikes = Math.min(GAME.lobbyLikeGoal, this.lobbyLikes + count);
      if (this.phase === 'lobby' && before < GAME.lobbyLikeGoal && this.lobbyLikes >= GAME.lobbyLikeGoal && this.realCount() >= 2) {
        this.phaseEndsAt = now; // tick kế tiếp sẽ xuất phát ngay
        return [{ priority: true, text: M(`Cả phòng thả đủ ${GAME.lobbyLikeGoal} tim! Chưa đủ 6 tay đua vẫn xuất phát ngay đây, cả nhà sẵn sàng nhé!`) }];
      }
      return [];
    }
    this.likeMeter += count;
    if (this.likeMeter >= GAME.tailwindGoal && (this.phase === 'race' || this.phase === 'finish')) {
      this.likeMeter = 0;
      this.tailwindUntil = now + GAME.tailwindSec * 1000;
      return [{ priority: true, text: M(`Sóng lớn! Cả phòng thả tim đủ ${GAME.tailwindGoal}, sóng đẩy cả đoàn vịt tăng tốc ${GAME.tailwindSec} giây!`) }];
    }
    if (this.likeMeter > GAME.tailwindGoal) this.likeMeter = GAME.tailwindGoal;
    return [];
  }

  hold(ms: number) {
    if (this.phaseEndsAt) this.phaseEndsAt += ms;
    if (this.event) this.event.endsAt += ms;
    this.nextEventAt += ms;
    if (this.tailwindUntil > 0) this.tailwindUntil += ms;
    for (const r of this.racers.values()) {
      if (r.boostUntil > 0) r.boostUntil += ms;
      if (r.boostFrom > 0) r.boostFrom += ms;
      if (r.likeBoostUntil > 0) r.likeBoostUntil += ms;
    }
    this.lastTickAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    this.join(p, now);
    const r = this.racers.get(p.username);
    if (!r || p.safe === false) return [];
    r.lastActive = now;
    if ((this.phase === 'race' || this.phase === 'finish') && this.event && now < this.event.endsAt && !this.event.usedBy.has(p.username)) {
      const c = plain(p.comment);
      const word = plain(this.event.word);
      if (c === word || c.split(' ')[0] === word || c.startsWith(word + ' ')) {
        this.event.usedBy.add(p.username);
        r.boostFrom = now;
        r.boostUntil = now + GAME.boostSec * 1000;
      }
    }
    return [];
  }

  demoRace(now: number): Say[] {
    const names = [
      'Bạn An', 'Bạn Bình', 'Bạn Chi', 'Bạn Dũng', 'Bạn Hà', 'Bạn Khoa', 'Bạn Lan', 'Bạn Minh',
      'Bạn Ngọc', 'Bạn Phúc', 'Bạn Quỳnh', 'Bạn Sơn', 'Bạn Thảo', 'Bạn Trang', 'Bạn Tú', 'Bạn Vy',
      'Bạn Đức', 'Bạn Hân', 'Bạn Khánh', 'Bạn Linh', 'Bạn Nam', 'Bạn Oanh', 'Bạn Phương', 'Bạn Quân',
    ];
    names.forEach((n, i) => this.join({ username: '__demo' + i, nickname: n, spoken: n, avatar: '' }, now));
    if (this.phase === 'lobby') {
      this.phaseEndsAt = now; // xuất phát ngay
    }
    return [];
  }

  // ---------- nhịp đua ----------

  private startRace(now: number): Say[] {
    this.raceNo++;
    this.totals.races++;
    this.lobbyLikes = 0;
    this.finishCount = 0;
    this.realFinishOpened = false;
    this.event = null;
    this.nextEventAt = now + GAME.eventEverySec * 1000;
    for (const r of this.racers.values()) {
      r.dist = 0;
      r.place = 0;
      r.boostUntil = 0;
      r.boostFrom = 0;
      r.likeBoostUntil = 0;
      r.likeBoostPct = 0;
      r.base = GAME.baseMin + this.rng() * GAME.baseVar;
      r.inRace = true;
    }
    this.phase = 'race';
    this.phaseEndsAt = now + GAME.raceMaxSec * 1000;
    const n = this.racers.size;
    return [{ main: true, text: M(`Chặng ${this.raceNo} xuất phát! ${n} tay đua vịt cùng lao xuống nước, ai về đích đầu tiên đây? Nhớ gõ đúng khẩu lệnh trên màn hình để bốc tốc nhé! Ai thả tim thì vịt của mình bơi nhanh hơn nữa đó!`) }];
  }

  private toPodium(now: number): Say[] {
    // Bục vinh quang chỉ dành cho NGƯỜI THẬT: vịt demo đua cho hồ sôi động, không nhận hạng.
    // Người thật đã về đích xếp theo thứ tự về đích, chưa về đích xếp theo quãng đường.
    const reals = [...this.racers.values()].filter((r) => !r.bot && r.inRace);
    const finished = reals.filter((r) => r.place > 0).sort((a, b) => a.place - b.place);
    const rest = reals.filter((r) => r.place === 0).sort((a, b) => b.dist - a.dist);
    const placed = [...finished, ...rest];
    placed.forEach((r, i) => {
      r.place = i + 1;
    });
    for (const r of this.racers.values()) if (r.bot) r.place = 0;
    const top = placed.slice(0, 3).map((r) => ({ nickname: r.p.nickname, avatar: r.p.avatar, art: r.art, place: r.place }));
    this.podiumInfo = { top };
    const winner = placed[0];
    if (winner) {
      winner.wins++;
      winner.totalWins++;
    }
    this.phase = 'podium';
    this.phaseEndsAt = now + GAME.podiumSec * 1000;
    this.event = null;
    return [
      {
        main: true,
        text: M(
          `Chặng ${this.raceNo} kết thúc!` +
            (winner ? ` Vô địch là bé vịt của bạn ${winner.p.spoken}!` : '') +
            (top[1] ? ` Về nhì: ${top[1].nickname}.` : '') +
            (top[2] ? ` Về ba: ${top[2].nickname}.` : '') +
            ' Nghỉ một chút rồi chặng mới lại xuất phát nhé cả nhà!',
        ),
      },
    ];
  }

  tick(now: number): Say[] {
    const out: Say[] = [];
    const dt = Math.min(0.5, Math.max(0, (now - this.lastTickAt) / 1000));
    this.lastTickAt = now;

    if (this.phase === 'lobby') {
      this.ensureBots(now);
      if (now >= this.phaseEndsAt) {
        if (this.racers.size >= 2) {
          out.push(...this.startRace(now));
        } else {
          this.phaseEndsAt = now + GAME.lobbySec * 1000;
          if (now - this.lastIdleAt >= GAME.idleLineEveryMs) {
            this.lastIdleAt = now;
            out.push({ text: M(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]) });
          }
        }
      }
      return out;
    }

    if (this.phase === 'podium') {
      this.ensureBots(now);
      if (now >= this.phaseEndsAt) {
        this.phase = 'lobby';
        this.phaseEndsAt = now + GAME.lobbySec * 1000;
        this.podiumInfo = null;
        for (const r of this.racers.values()) r.inRace = true;
      }
      return out;
    }

    // race / finish: mô phỏng chuyển động
    const tailwind = now < this.tailwindUntil;
    let allFinished = true;
    for (const r of this.racers.values()) {
      if (!r.inRace || r.place > 0) continue;
      allFinished = false;
      const wobble = 0.9 + this.rng() * 0.2;
      let mult = now >= r.boostFrom && now < r.boostUntil ? GAME.boostMult : 1;
      if (tailwind) mult *= GAME.tailwindMult;
      if (now < r.likeBoostUntil) mult *= 1 + r.likeBoostPct;
      r.dist += r.base * wobble * mult * dt;
      if (r.dist >= GAME.trackM) {
        r.dist = GAME.trackM;
        r.place = ++this.finishCount;
        // Cửa sổ cán đích mở khi tay đua THẬT đầu tiên về đích; chặng toàn vịt demo
        // (chưa có người xem nào) thì vịt demo về nhất cũng mở để vòng lặp chạy đều.
        const hasReal = [...this.racers.values()].some((x) => !x.bot && x.inRace);
        if (!this.realFinishOpened && (!r.bot || !hasReal)) {
          this.realFinishOpened = true;
          out.push({
            main: true,
            text: M(
              r.bot
                ? `Một bé vịt demo về đích đầu tiên! Các tay đua thật còn ${GAME.finishSec} giây để cán đích!`
                : `Về đích đầu tiên là bé vịt của bạn ${r.p.spoken}! Mọi người còn ${GAME.finishSec} giây để cán đích!`,
            ),
          });
          this.phase = 'finish';
          this.phaseEndsAt = now + GAME.finishSec * 1000;
        }
      }
    }

    // đợt khẩu lệnh
    if (this.phase === 'race') {
      if (this.event && now >= this.event.endsAt) this.event = null;
      if (!this.event && now >= this.nextEventAt) {
        const word = this.pick(EVENT_WORDS);
        this.event = { word, endsAt: now + GAME.eventWindowSec * 1000, usedBy: new Set() };
        this.nextEventAt = now + GAME.eventEverySec * 1000;
        // vịt demo thỉnh thoảng cũng bốc tốc theo khẩu lệnh (trễ một chút) cho hồ thêm sinh động
        for (const r of this.racers.values()) {
          if (r.bot && r.inRace && r.place === 0 && this.rng() < 0.45) {
            r.boostFrom = now + Math.floor(this.rng() * 3200);
            r.boostUntil = r.boostFrom + GAME.boostSec * 1000;
          }
        }
        out.push({ ttl: 6000, text: M(`Khẩu lệnh: ${word}! Gõ ${word} ngay để bốc tốc!`) });
      }
    }

    if (this.phase === 'finish' && (now >= this.phaseEndsAt || allFinished)) {
      out.push(...this.toPodium(now));
    } else if (this.phase === 'race' && now >= this.phaseEndsAt) {
      out.push(...this.toPodium(now));
    }
    return out;
  }

  view(now: number): RaceView {
    // hạng hiển thị của người thật chỉ tính trong nhóm người thật (vịt demo không chiếm huy chương)
    const finishedReals = [...this.racers.values()]
      .filter((r) => !r.bot && r.inRace && r.place > 0)
      .sort((a, b) => a.place - b.place);
    const dispPlace = new Map(finishedReals.map((r, i) => [r.p.username, i + 1] as const));
    const racers = [...this.racers.values()]
      .filter((r) => r.inRace)
      .sort((a, b) => (a.place || 99) - (b.place || 99) || b.dist - a.dist)
      .map((r) => ({
        username: r.p.username,
        nickname: r.p.nickname,
        avatar: r.p.avatar,
        art: r.art,
        distPct: Math.min(100, (r.dist / GAME.trackM) * 100),
        boosting: now >= r.boostFrom && now < r.boostUntil,
        likeBoost: now < r.likeBoostUntil ? r.likeBoostPct : 0,
        place: r.bot ? 0 : (dispPlace.get(r.p.username) ?? 0),
        wins: r.totalWins,
        demo: r.bot,
      }));
    const top = [...this.racers.values()]
      .filter((r) => r.totalWins > 0)
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, 5)
      .map((r) => ({ nickname: r.p.nickname, avatar: r.p.avatar, totalWins: r.totalWins }));
    return {
      phase: this.phase,
      phaseRemainSec: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      raceNo: this.raceNo,
      racers,
      racerCount: this.racers.size,
      event: this.event && now < this.event.endsAt ? { word: this.event.word, remainSec: Math.max(0, Math.ceil((this.event.endsAt - now) / 1000)) } : null,
      tailwind: {
        active: now < this.tailwindUntil,
        remainSec: Math.max(0, Math.ceil((this.tailwindUntil - now) / 1000)),
        meter: Math.min(this.likeMeter, GAME.tailwindGoal),
        goal: GAME.tailwindGoal,
      },
      lobbyLikes: { meter: this.lobbyLikes, goal: GAME.lobbyLikeGoal },
      podium: this.phase === 'podium' ? this.podiumInfo : null,
      top,
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
