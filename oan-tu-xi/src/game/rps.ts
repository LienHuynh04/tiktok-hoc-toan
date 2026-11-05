// Engine Oẳn Tù Xì: người xem đấu tay đôi với CHỦ PHÒNG (admin) theo TRẬN.
// Gõ "kéo" / "búa" / "bao" là thách đấu (lượt ném đầu khóa sẵn đòn đó), gõ "chơi" thì xếp hàng.
// Mỗi trận 3 TIM: thắng 1 lượt ném thì đối thủ mất 1 tim, hòa ném lại, hết tim là thua trận.
// Từ lượt ném 7 trở đi là ĐỘT TỬ: thua 1 lượt là thua cả trận. Thắng trận: +1 sao.
// THUA TRẬN: ra GHẾ CHỜ (phòng chờ) — qua 3 trận nữa, hết 60 giây, chuông 300 tim reo,
// hoặc hết vòng thì được về. Hết người thách đấu, chủ phòng gọi ngẫu nhiên 1 bạn lên đấu
// giao lưu (thua trận cũng KHÔNG phải ra ghế chờ). Đòn của chủ phòng bốc ngẫu nhiên công bằng.
// Quà chỉ được cảm ơn, tim chỉ rung chuông thả ghế chờ — không ai mua được sao.

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

export type Choice = 'keo' | 'bua' | 'bao';
export const CHOICES: Choice[] = ['keo', 'bua', 'bao'];
/** BEATS[x] = đòn mà x thắng */
export const BEATS: Record<Choice, Choice> = { bua: 'keo', keo: 'bao', bao: 'bua' };
export const BEAT_PHRASE: Record<string, string> = { 'bua-keo': 'Búa đập Kéo', 'keo-bao': 'Kéo cắt Bao', 'bao-bua': 'Bao trùm Búa' };
export const CHOICE_META: Record<Choice, { name: string; emoji: string }> = {
  keo: { name: 'Kéo', emoji: '✌️' },
  bua: { name: 'Búa', emoji: '✊' },
  bao: { name: 'Bao', emoji: '✋' },
};

export function judge(mine: Choice, theirs: Choice): 'win' | 'lose' | 'draw' {
  if (mine === theirs) return 'draw';
  return BEATS[mine] === theirs ? 'win' : 'lose';
}

type Phase = 'idle' | 'pick' | 'chant' | 'throw' | 'matchEnd' | 'break';
type Outcome = 'win' | 'lose' | 'draw';

interface Student {
  p: Person;
  wins: number; // sao trong vòng
  totalWins: number; // sao cả buổi (bảng Vua Oẳn Tù Xì)
  streak: number;
  hue: number;
  lastActive: number;
  waitingUntil: number; // 0 = đang ở sảnh
  waitMatchesLeft: number;
}

interface Match {
  username: string;
  auto: boolean; // chủ phòng gọi giao lưu: thua không ra ghế chờ
  playerHearts: number;
  hostHearts: number;
  throwNo: number;
  pick: Choice | null;
  adminPick: Choice;
  throwOutcome: Outcome | null;
  matchOutcome: 'win' | 'lose' | null;
  taunt: { text: string; side: 'host' | 'player' } | null;
}

export interface RpsView {
  phase: Phase;
  phaseRemainSec: number;
  session: number;
  matchNo: number;
  matchesPerSession: number;
  students: {
    username: string;
    nickname: string;
    avatar: string;
    wins: number;
    streak: number;
    hue: number;
    dueling: boolean;
  }[];
  studentCount: number;
  waiting: { username: string; nickname: string; avatar: string; hue: number; remainSec: number; matchesLeft: number }[];
  queue: { nickname: string }[];
  duel: {
    nickname: string;
    avatar: string;
    hue: number;
    auto: boolean;
    throwNo: number;
    playerHearts: number;
    hostHearts: number;
    maxHearts: number;
    suddenDeath: boolean;
    hasPicked: boolean;
    pick: Choice | null; // chỉ lộ khi mở đòn
    adminPick: Choice | null; // chỉ lộ khi mở đòn
    throwOutcome: Outcome | null;
    matchOutcome: 'win' | 'lose' | null;
    taunt: { text: string; side: 'host' | 'player' } | null;
  } | null;
  lastResult: { nickname: string; outcome: 'win' | 'lose'; at: number } | null;
  sessionTop: { nickname: string; wins: number }[];
  top: { nickname: string; avatar: string; totalWins: number }[];
  totals: { matches: number; throws: number; studentWins: number; adminWins: number; draws: number };
  bell: { have: number; goal: number };
  musicOn: boolean;
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

// Câu trêu vui của chủ phòng (nói thân thiện, không cà khịa quá đà)
const QUIPS_HOST_THROW = ['Ha ha, trúng đòn tủ của mình rồi!', 'Đòn này mình luyện mười năm rồi đấy!', 'Thấy chưa, chủ phòng không đùa được đâu!'];
const QUIPS_PLAYER_THROW = ['Ối giời, đòn gì mà hiểm thế!', 'Ái chà, mình toát mồ hôi rồi đấy!', 'Ghê ghê, bạn này không phải dạng vừa!'];
const QUIPS_DRAW = ['Đọc vị được nhau rồi đấy!', 'Tâm linh tương thông hay sao mà giống nhau thế!', 'Hòa hoãn binh, ném lại nào!'];
const IDLE_LINES = [
  'Cả nhà gõ kéo, búa hoặc bao để thách đấu chủ phòng nhé. Mỗi trận ba tim, hết tim là thua trận.',
  'Ai thắng trận được một sao. Thua trận thì ra ghế chờ ngồi một lúc, qua ba trận là được về chơi tiếp.',
  'Đang trống trận, bạn nào muốn đấu với chủ phòng thì gõ kéo, búa hoặc bao nào.',
];

export class RpsRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private students = new Map<string, Student>();
  private queue: { username: string; pick: Choice | null }[] = [];
  private phase: Phase = 'idle';
  private phaseEndsAt = 0;
  private match: Match | null = null;
  private session = 0;
  private matchNo = 0;
  private totals = { matches: 0, throws: 0, studentWins: 0, adminWins: 0, draws: 0 };
  private sessionTopSnap: { nickname: string; wins: number }[] = [];
  private lastResult: RpsView['lastResult'] = null;
  private lastMatchEndAt = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;
  private bellMeter = 0;
  private hueSeed = 0;
  private sessionWinsMark = 0;
  private sessionAdminMark = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.lastMatchEndAt = now;
    this.lastIdleAt = now;
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }
  private randomChoice(): Choice {
    return CHOICES[Math.floor(this.rng() * 3)];
  }

  // ---------- vòng đời ----------

  newSession(now: number): Say[] {
    this.session++;
    this.matchNo = 0;
    this.queue = [];
    this.match = null;
    this.phase = 'idle';
    this.phaseEndsAt = 0;
    this.lastMatchEndAt = now;
    for (const s of this.students.values()) {
      s.wins = 0;
      s.streak = 0;
      s.waitingUntil = 0;
      s.waitMatchesLeft = 0;
    }
    return [
      {
        main: true,
        text: M(
          `Chào cả nhà! Oẳn tù xì đấu với chủ phòng, vòng ${this.session} bắt đầu! Gõ kéo, búa hoặc bao là thách đấu. Mỗi trận ba tim, hết tim là thua trận, thua thì ra ghế chờ ngồi một lúc. Thắng trận được một sao nhé!`,
        ),
      },
    ];
  }

  join(p: Person, now: number) {
    const s = this.students.get(p.username);
    if (s) {
      s.lastActive = now;
      s.p = p;
      return;
    }
    this.hueSeed += 67;
    this.students.set(p.username, {
      p,
      wins: 0,
      totalWins: 0,
      streak: 0,
      hue: this.hueSeed % 360,
      lastActive: now,
      waitingUntil: 0,
      waitMatchesLeft: 0,
    });
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: M(`Chào bạn mới ${p.spoken}! Gõ kéo, búa hoặc bao là thách đấu chủ phòng được luôn đấy.`), ttl: 20_000 }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Chủ phòng cảm ơn bạn nhiều nhé!`) }];
  }

  like(count: number, now: number): Say[] {
    this.bellMeter += count;
    if (this.bellMeter < GAME.likeBellGoal) return [];
    this.bellMeter -= GAME.likeBellGoal;
    const waiting = [...this.students.values()].filter((s) => s.waitingUntil > now);
    if (!waiting.length) return [];
    for (const s of waiting) this.releaseWaiting(s);
    return [{ text: M('Chuông reo rồi! Các bạn ở ghế chờ được về hết, vào đấu tiếp nào!'), ttl: 30_000 }];
  }

  /** Đồng hồ game dừng trong lúc giọng chính đang đọc: dời mọi mốc giờ theo ms */
  hold(ms: number) {
    if (this.phaseEndsAt) this.phaseEndsAt += ms;
    for (const s of this.students.values()) if (s.waitingUntil) s.waitingUntil += ms;
  }

  chatterWindow(_now: number): boolean {
    return this.phase === 'idle' || this.phase === 'break';
  }

  // ---------- bình luận ----------

  /** Đòn trong câu: chỉ nhận khi là từ đầu tiên, hoặc cả câu tối đa 2 từ (tránh "bao giờ", "ăn kẹo"...) */
  private pickFrom(tokens: string[], anywhere: boolean): Choice | null {
    const find = (t: string) => (tokens.includes(t) ? t : null);
    const hit = find('KEO') ?? find('BUA') ?? find('BAO');
    if (!hit) return null;
    if (!anywhere && tokens[0] !== hit && tokens.length > 2) return null;
    return hit.toLowerCase() as Choice;
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    this.join(p, now);
    const s = this.students.get(p.username)!;
    const tokens = plain(p.comment).split(' ').filter(Boolean);
    if (!tokens.length) return [];

    // bạn đang đấu: mọi đòn gõ ra trong lượt ném đều tính
    if (this.phase === 'pick' && this.match?.username === p.username) {
      const pick = this.pickFrom(tokens, true);
      if (pick && !this.match.pick) {
        this.match.pick = pick;
        this.phaseEndsAt = now; // hô luôn, khỏi chờ hết giờ
      }
      return [];
    }
    if (s.waitingUntil > now) return []; // đang ở ghế chờ thì chưa thách đấu được
    if (this.match?.username === p.username) return [];
    if (this.queue.some((q) => q.username === p.username)) return [];

    const pick = this.pickFrom(tokens, false);
    const wantsPlay = tokens[0] === 'CHOI' || tokens[0] === 'OAN' || tokens.includes('THACH');
    if (pick) {
      this.queue.push({ username: p.username, pick });
      return [{ text: M(`${p.spoken} đã thách đấu chủ phòng bằng một đòn giấu kín! Chờ tới lượt vào trận nhé.`), ttl: 15_000 }];
    }
    if (wantsPlay) {
      this.queue.push({ username: p.username, pick: null });
      return [{ text: M(`${p.spoken} đã xếp hàng thách đấu chủ phòng! Tới lượt mình sẽ gọi tên.`), ttl: 15_000 }];
    }
    return [];
  }

  /** Nút xem thử ở trang điều khiển: 1 bạn mẫu thách đấu ngay */
  demoDuel(now: number): Say[] {
    const demo: Person = { username: 'ban-demo', nickname: 'Bạn Demo', spoken: 'bạn Demo', avatar: '' };
    this.join(demo, now);
    const s = this.students.get(demo.username)!;
    if (s.waitingUntil > now) this.releaseWaiting(s);
    if (!this.queue.some((q) => q.username === demo.username) && this.match?.username !== demo.username) {
      this.queue.push({ username: demo.username, pick: this.randomChoice() });
    }
    return [];
  }

  // ---------- diễn biến ----------

  private releaseWaiting(s: Student) {
    s.waitingUntil = 0;
    s.waitMatchesLeft = 0;
  }

  private startMatch(now: number): Say[] {
    while (this.queue.length) {
      const q = this.queue.shift()!;
      const s = this.students.get(q.username);
      if (!s || s.waitingUntil > now) continue;
      this.match = {
        username: q.username,
        auto: false,
        playerHearts: GAME.matchHearts,
        hostHearts: GAME.matchHearts,
        throwNo: 1,
        pick: q.pick,
        adminPick: 'bua',
        throwOutcome: null,
        matchOutcome: null,
        taunt: null,
      };
      this.phase = 'pick';
      this.phaseEndsAt = now + (q.pick ? GAME.lockedPickDelayMs : GAME.pickWindowSec * 1000);
      return [
        {
          main: true,
          text: M(
            q.pick
              ? `Trận đấu bắt đầu! Bạn ${s.p.spoken} đấu với chủ phòng, mỗi người ba tim. ${s.p.spoken} đã chọn sẵn đòn, cả nhà đếm oẳn tù xì nào!`
              : `Trận đấu bắt đầu! Bạn ${s.p.spoken} đấu với chủ phòng, mỗi người ba tim. ${s.p.spoken} ơi, gõ kéo, búa hoặc bao để ra đòn nhé!`,
          ),
        },
      ];
    }
    // hết người thách đấu: gọi ngẫu nhiên 1 bạn lên đấu giao lưu
    const seated = [...this.students.values()].filter((s) => s.waitingUntil <= now);
    if (!seated.length) return [];
    const active = seated.filter((s) => now - s.lastActive < 300_000);
    const pool = active.length ? active : seated;
    const s = pool[Math.floor(this.rng() * pool.length)];
    this.match = {
      username: s.p.username,
      auto: true,
      playerHearts: GAME.matchHearts,
      hostHearts: GAME.matchHearts,
      throwNo: 1,
      pick: null,
      adminPick: 'bua',
      throwOutcome: null,
      matchOutcome: null,
      taunt: null,
    };
    this.phase = 'pick';
    this.phaseEndsAt = now + GAME.pickWindowSec * 1000;
    return [
      {
        main: true,
        text: M(`Chưa ai thách đấu, chủ phòng gọi bạn ${s.p.spoken} lên đấu giao lưu một trận nhé! Gõ kéo, búa hoặc bao nào, thua cũng không phải ra ghế chờ đâu.`),
      },
    ];
  }

  private resolveThrow(now: number): Say[] {
    const mt = this.match!;
    const s = this.students.get(mt.username)!;
    const outcome = judge(mt.pick!, mt.adminPick);
    mt.throwOutcome = outcome;
    this.totals.throws++;
    const pickName = CHOICE_META[mt.pick!].name;
    const adminName = CHOICE_META[mt.adminPick].name;
    const lines: Say[] = [];
    const sudden = mt.throwNo >= GAME.suddenDeathThrow;

    if (outcome === 'draw') {
      this.totals.draws++;
      mt.taunt = { text: this.pick(QUIPS_DRAW), side: 'host' };
      lines.push({ main: true, text: M(`Hòa! Cả hai cùng ra ${pickName}. ${mt.taunt.text} Ném lại nào!`) });
      this.phase = 'throw';
      this.phaseEndsAt = now + GAME.throwSec * 1000;
      return lines;
    }

    if (outcome === 'win') {
      mt.hostHearts = sudden ? 0 : mt.hostHearts - 1;
      mt.taunt = { text: this.pick(QUIPS_PLAYER_THROW), side: 'host' };
      lines.push({
        main: true,
        text: M(
          `${BEAT_PHRASE[`${mt.pick}-${mt.adminPick}`]}! ${s.p.spoken} ra ${pickName}, chủ phòng ra ${adminName}. Chủ phòng mất một tim! ${mt.taunt.text}`,
        ),
      });
    } else {
      mt.playerHearts = sudden ? 0 : mt.playerHearts - 1;
      mt.taunt = { text: this.pick(QUIPS_HOST_THROW), side: 'host' };
      lines.push({
        main: true,
        text: M(
          `${BEAT_PHRASE[`${mt.adminPick}-${mt.pick}`]}! Chủ phòng ra ${adminName}, ${s.p.spoken} ra ${pickName}. ${s.p.spoken} mất một tim! ${mt.taunt.text}`,
        ),
      });
    }

    if (mt.playerHearts > 0 && mt.hostHearts > 0) {
      this.phase = 'throw';
      this.phaseEndsAt = now + GAME.throwSec * 1000;
      return lines;
    }
    lines.push(...this.finishMatch(now));
    return lines;
  }

  private finishMatch(now: number): Say[] {
    const mt = this.match!;
    const s = this.students.get(mt.username)!;
    const playerWon = mt.hostHearts <= 0;
    mt.matchOutcome = playerWon ? 'win' : 'lose';
    this.totals.matches++;
    this.matchNo++;
    this.lastResult = { nickname: s.p.nickname, outcome: mt.matchOutcome, at: now };
    const lines: Say[] = [];

    if (playerWon) {
      s.wins++;
      s.totalWins++;
      s.streak++;
      this.totals.studentWins++;
      const flawless = mt.playerHearts === GAME.matchHearts;
      mt.taunt = { text: flawless ? 'Thắng trắng luôn! Chủ phòng xin chịu thua 😭' : 'Bạn thắng cả trận rồi! Chủ phòng phục bạn đấy 👏', side: 'host' };
      lines.push({
        main: true,
        text: M(
          `Hết tim! Bạn ${s.p.spoken} thắng cả trận trước chủ phòng, nhận một sao!` +
            (flawless ? ' Thắng trắng ba không, ghê thật!' : '') +
            (s.streak >= 3 ? ` Chuỗi ${s.streak} trận thắng liên tiếp rồi!` : ''),
        ),
      });
    } else {
      s.streak = 0;
      this.totals.adminWins++;
      if (mt.auto) {
        mt.taunt = { text: 'Giao lưu vui thôi, bạn về chỗ xem tiếp nhé 😄', side: 'host' };
        lines.push({
          main: true,
          text: M(`Hết tim! Chủ phòng thắng trận giao lưu này. Bạn ${s.p.spoken} đấu hay lắm, về chỗ xem tiếp nhé, không phải ra ghế chờ đâu.`),
        });
      } else {
        s.waitingUntil = now + GAME.matchEndSec * 1000 + GAME.waitingSec * 1000; // tính từ lúc hết pha kết quả trận
        s.waitMatchesLeft = GAME.waitingMatches;
        mt.taunt = { text: 'Ra ghế chờ ngồi uống nước, xem các bạn khác đấu nhé 🪑', side: 'host' };
        lines.push({
          main: true,
          text: M(`Hết tim! Chủ phòng thắng trận này. Bạn ${s.p.spoken} ra ghế chờ ngồi một lúc nhé, qua ba trận là được về đấu tiếp!`),
        });
      }
    }

    // mỗi trận xong, các bạn ghế chờ gần được về hơn 1 trận
    for (const o of this.students.values()) {
      if (o.p.username !== mt.username && o.waitingUntil > now && o.waitMatchesLeft > 0) {
        o.waitMatchesLeft--;
        if (o.waitMatchesLeft <= 0) {
          this.releaseWaiting(o);
          lines.push({ text: M(`Bạn ${o.p.spoken} đã qua đủ số trận chờ, được về đấu tiếp rồi!`), ttl: 20_000 });
        }
      }
    }

    this.phase = 'matchEnd';
    this.phaseEndsAt = now + GAME.matchEndSec * 1000;
    this.lastMatchEndAt = now + GAME.matchEndSec * 1000;
    return lines;
  }

  private startBreak(now: number): Say[] {
    const top = [...this.students.values()]
      .filter((s) => s.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3)
      .map((s) => ({ nickname: s.p.nickname, wins: s.wins }));
    this.sessionTopSnap = top;
    for (const s of this.students.values()) this.releaseWaiting(s); // hết vòng: ghế chờ về hết
    this.phase = 'break';
    this.phaseEndsAt = now + GAME.breakSec * 1000;
    const best = top[0];
    return [
      {
        main: true,
        text: M(
          `Hết vòng ${this.session}! Vòng này cả nhà thắng chủ phòng ${this.totals.studentWins - this.sessionWinsMark} trận, chủ phòng thắng ${this.totals.adminWins - this.sessionAdminMark} trận.` +
            (best ? ` Bạn thắng nhiều nhất là ${best.nickname} với ${best.wins} sao.` : '') +
            ' Nghỉ giải lao một chút rồi vào vòng mới nhé!',
        ),
      },
    ];
  }

  tick(now: number): Say[] {
    const lines: Say[] = [];

    // ghế chờ hết giờ thì về
    for (const s of this.students.values()) {
      if (s.waitingUntil && s.waitingUntil <= now && this.phase !== 'matchEnd') {
        this.releaseWaiting(s);
        lines.push({ text: M(`Bạn ${s.p.spoken} hết giờ ghế chờ, về đấu tiếp rồi!`), ttl: 20_000 });
      }
    }

    if (this.phase === 'idle') {
      if (now - this.lastMatchEndAt >= GAME.betweenMatchesMs && this.students.size > 0) {
        lines.push(...this.startMatch(now));
      } else if (now - this.lastIdleAt >= GAME.idleLineEveryMs && now - this.lastMatchEndAt > 45_000) {
        this.lastIdleAt = now;
        lines.push({ text: M(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]), ttl: 30_000 });
      }
    } else if (this.phase === 'pick' && now >= this.phaseEndsAt) {
      const mt = this.match!;
      if (!mt.pick) mt.pick = this.randomChoice(); // hết giờ chưa ra đòn: bốc ngẫu nhiên cho trận đấu tiếp diễn
      mt.adminPick = this.randomChoice();
      mt.throwOutcome = null;
      this.phase = 'chant';
      this.phaseEndsAt = now + GAME.chantMs;
    } else if (this.phase === 'chant' && now >= this.phaseEndsAt) {
      lines.push(...this.resolveThrow(now));
    } else if (this.phase === 'throw' && now >= this.phaseEndsAt) {
      const mt = this.match!;
      mt.throwNo++;
      mt.pick = null;
      mt.throwOutcome = null;
      mt.taunt = null;
      this.phase = 'pick';
      this.phaseEndsAt = now + GAME.pickWindowSec * 1000;
    } else if (this.phase === 'matchEnd' && now >= this.phaseEndsAt) {
      this.match = null;
      if (this.matchNo >= GAME.matchesPerSession) {
        lines.push(...this.startBreak(now));
      } else {
        this.phase = 'idle';
      }
    } else if (this.phase === 'break' && now >= this.phaseEndsAt) {
      this.sessionWinsMark = this.totals.studentWins;
      this.sessionAdminMark = this.totals.adminWins;
      lines.push(...this.newSession(now));
    }
    return lines;
  }

  // ---------- ảnh chụp cho sân khấu ----------

  view(now: number): RpsView {
    const all = [...this.students.values()];
    const seated = all
      .filter((s) => s.waitingUntil <= now)
      .sort((a, b) => b.wins - a.wins || b.lastActive - a.lastActive);
    const mt = this.match;
    const ms = mt ? this.students.get(mt.username) : null;
    const reveal = this.phase === 'throw' || this.phase === 'matchEnd';
    return {
      phase: this.phase,
      phaseRemainSec: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      session: Math.max(1, this.session),
      matchNo: this.matchNo,
      matchesPerSession: GAME.matchesPerSession,
      students: seated.slice(0, 10).map((s) => ({
        username: s.p.username,
        nickname: s.p.nickname,
        avatar: s.p.avatar,
        wins: s.wins,
        streak: s.streak,
        hue: s.hue,
        dueling: mt?.username === s.p.username,
      })),
      studentCount: seated.length,
      waiting: all
        .filter((s) => s.waitingUntil > now)
        .map((s) => ({
          username: s.p.username,
          nickname: s.p.nickname,
          avatar: s.p.avatar,
          hue: s.hue,
          remainSec: Math.max(0, Math.ceil((s.waitingUntil - now) / 1000)),
          matchesLeft: s.waitMatchesLeft,
        })),
      queue: this.queue.slice(0, 4).map((q) => ({ nickname: this.students.get(q.username)?.p.nickname ?? '' })),
      duel:
        mt && ms
          ? {
              nickname: ms.p.nickname,
              avatar: ms.p.avatar,
              hue: ms.hue,
              auto: mt.auto,
              throwNo: mt.throwNo,
              playerHearts: mt.playerHearts,
              hostHearts: mt.hostHearts,
              maxHearts: GAME.matchHearts,
              suddenDeath: mt.throwNo >= GAME.suddenDeathThrow,
              hasPicked: !!mt.pick,
              pick: reveal ? mt.pick : null,
              adminPick: reveal ? mt.adminPick : null,
              throwOutcome: reveal ? mt.throwOutcome : null,
              matchOutcome: this.phase === 'matchEnd' ? mt.matchOutcome : null,
              taunt: mt.taunt,
            }
          : null,
      lastResult: this.lastResult && now - this.lastResult.at < 60_000 ? this.lastResult : null,
      sessionTop: this.phase === 'break' ? this.sessionTopSnap : [],
      top: all
        .filter((s) => s.totalWins > 0)
        .sort((a, b) => b.totalWins - a.totalWins)
        .slice(0, 5)
        .map((s) => ({ nickname: s.p.nickname, avatar: s.p.avatar, totalWins: s.totalWins })),
      totals: { ...this.totals },
      bell: { have: this.bellMeter, goal: GAME.likeBellGoal },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
