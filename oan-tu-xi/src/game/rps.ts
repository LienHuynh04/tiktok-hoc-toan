// Engine Oẳn Tù Xì: người xem đấu tay đôi với CÔ GIÁO (admin). Gõ "kéo" / "búa" / "bao"
// là thách đấu (đòn khóa sẵn) hoặc gõ "chơi" để xếp hàng rồi ra đòn khi được gọi lên bảng.
// Hết người thách đấu, cô tự gọi 1 bạn đang ngồi lớp lên đấu thử (không ra đòn thì thôi, không phạt).
// Thắng cô: +1 sao. Hòa: đấu lại 1 lần. THUA: ra PHÒNG CHỜ — qua 3 lượt đấu hoặc hết 60 giây
// (hoặc chuông 300 tim reo) thì được về lớp. Đòn của cô bốc ngẫu nhiên công bằng.
// Quà chỉ được cảm ơn, tim chỉ rung chuông thả phòng chờ — không ai mua được sao.

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

type Phase = 'idle' | 'pick' | 'chant' | 'result' | 'break';

interface Student {
  p: Person;
  wins: number; // sao trong tiết
  totalWins: number; // sao cả buổi (bảng Vua Oẳn Tù Xì)
  streak: number;
  hue: number;
  lastActive: number;
  waitingUntil: number; // 0 = đang ở lớp
  waitDuelsLeft: number;
}

interface Duel {
  username: string;
  pick: Choice | null;
  adminPick: Choice;
  auto: boolean; // cô tự gọi lên (không ra đòn thì bỏ qua, không phạt)
  rematch: boolean;
  outcome: 'win' | 'lose' | 'draw' | null;
}

export interface RpsView {
  phase: Phase;
  phaseRemainSec: number;
  session: number;
  duelNo: number;
  duelsPerSession: number;
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
  waiting: { username: string; nickname: string; avatar: string; hue: number; remainSec: number; duelsLeft: number }[];
  queue: { nickname: string }[];
  duel: {
    nickname: string;
    avatar: string;
    hue: number;
    hasPicked: boolean;
    pick: Choice | null; // chỉ lộ khi đã hô/mở kết quả
    adminPick: Choice | null; // chỉ lộ ở pha kết quả
    outcome: 'win' | 'lose' | 'draw' | null;
    rematch: boolean;
    auto: boolean;
  } | null;
  lastResult: { nickname: string; outcome: 'win' | 'lose' | 'draw'; pick: Choice; adminPick: Choice; at: number } | null;
  sessionTop: { nickname: string; wins: number }[];
  top: { nickname: string; avatar: string; totalWins: number }[];
  totals: { duels: number; studentWins: number; adminWins: number; draws: number };
  bell: { have: number; goal: number };
  musicOn: boolean;
  musicVolume: number;
}

const F = (s: string) => `F: ${s}`;
const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const IDLE_LINES = [
  'Lớp mình gõ kéo, búa hoặc bao để thách đấu cô giáo nhé. Búa đập kéo, kéo cắt bao, bao trùm búa.',
  'Bạn nào thắng cô được một sao, thua thì ra phòng chờ ngồi một lúc rồi lại về lớp chơi tiếp.',
  'Đang trống lượt đấu, bạn nào muốn lên bảng đấu với cô thì gõ kéo, búa hoặc bao nào.',
];

export class RpsRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private students = new Map<string, Student>();
  private queue: { username: string; pick: Choice | null }[] = [];
  private phase: Phase = 'idle';
  private phaseEndsAt = 0;
  private duel: Duel | null = null;
  private session = 0;
  private duelNo = 0;
  private totals = { duels: 0, studentWins: 0, adminWins: 0, draws: 0 };
  private sessionTopSnap: { nickname: string; wins: number }[] = [];
  private lastResult: RpsView['lastResult'] = null;
  private lastDuelEndAt = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;
  private bellMeter = 0;
  private hueSeed = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.lastDuelEndAt = now;
    this.lastIdleAt = now;
  }

  // ---------- vòng đời ----------

  newSession(now: number): Say[] {
    this.session++;
    this.duelNo = 0;
    this.queue = [];
    this.duel = null;
    this.phase = 'idle';
    this.phaseEndsAt = 0;
    this.lastDuelEndAt = now;
    for (const s of this.students.values()) {
      s.wins = 0;
      s.streak = 0;
      s.waitingUntil = 0;
      s.waitDuelsLeft = 0;
    }
    return [
      {
        main: true,
        text: F(
          `Chào cả lớp! Tiết ${this.session} oẳn tù xì bắt đầu. Gõ kéo, búa hoặc bao là thách đấu cô ngay. Thắng cô được một sao, hòa thì đấu lại, thua thì ra phòng chờ ngồi một lúc nhé!`,
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
      waitDuelsLeft: 0,
    });
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: F(`Chào bạn mới ${p.spoken}! Ngồi vào lớp nhé, gõ kéo, búa hoặc bao là đấu với cô được luôn.`), ttl: 20_000 }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName}. Cô cảm ơn bạn nhiều nhé!`) }];
  }

  like(count: number, now: number): Say[] {
    this.bellMeter += count;
    if (this.bellMeter < GAME.likeBellGoal) return [];
    this.bellMeter -= GAME.likeBellGoal;
    const waiting = [...this.students.values()].filter((s) => s.waitingUntil > now);
    if (!waiting.length) return [];
    for (const s of waiting) {
      s.waitingUntil = 0;
      s.waitDuelsLeft = 0;
    }
    return [{ text: F('Chuông reo rồi! Các bạn ở phòng chờ được về lớp hết, chơi tiếp nào!'), ttl: 30_000 }];
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

    // bạn đang đấu: mọi đòn gõ ra trong lượt đều tính
    if (this.phase === 'pick' && this.duel?.username === p.username) {
      const pick = this.pickFrom(tokens, true);
      if (pick && !this.duel.pick) {
        this.duel.pick = pick;
        this.phaseEndsAt = now; // hô luôn, khỏi chờ hết giờ
      }
      return [];
    }
    if (s.waitingUntil > now) return []; // đang ở phòng chờ thì chưa thách đấu được
    if (this.duel?.username === p.username) return [];
    if (this.queue.some((q) => q.username === p.username)) return [];

    const pick = this.pickFrom(tokens, false);
    const wantsPlay = tokens[0] === 'CHOI' || tokens[0] === 'OAN' || tokens.includes('THACH');
    if (pick) {
      this.queue.push({ username: p.username, pick });
      return [{ text: F(`${p.spoken} đã thách đấu cô bằng một đòn giấu kín! Chờ tới lượt lên bảng nhé.`), ttl: 15_000 }];
    }
    if (wantsPlay) {
      this.queue.push({ username: p.username, pick: null });
      return [{ text: F(`${p.spoken} đã xếp hàng thách đấu cô! Tới lượt cô sẽ gọi lên bảng.`), ttl: 15_000 }];
    }
    return [];
  }

  /** Nút xem thử ở trang điều khiển: 1 bạn mẫu thách đấu ngay */
  demoDuel(now: number): Say[] {
    const demo: Person = { username: 'ban-demo', nickname: 'Bạn Demo', spoken: 'bạn Demo', avatar: '' };
    this.join(demo, now);
    const s = this.students.get(demo.username)!;
    if (s.waitingUntil > now) {
      s.waitingUntil = 0;
      s.waitDuelsLeft = 0;
    }
    if (!this.queue.some((q) => q.username === demo.username) && this.duel?.username !== demo.username) {
      this.queue.push({ username: demo.username, pick: CHOICES[Math.floor(this.rng() * 3)] });
    }
    return [];
  }

  // ---------- diễn biến ----------

  private startDuel(now: number): Say[] {
    // lấy người thách đấu đầu tiên còn hợp lệ
    while (this.queue.length) {
      const q = this.queue.shift()!;
      const s = this.students.get(q.username);
      if (!s || s.waitingUntil > now) continue;
      this.duel = { username: q.username, pick: q.pick, adminPick: 'bua', auto: false, rematch: false, outcome: null };
      this.phase = 'pick';
      this.phaseEndsAt = now + (q.pick ? GAME.lockedPickDelayMs : GAME.pickWindowSec * 1000);
      return [
        {
          main: true,
          text: F(
            q.pick
              ? `Mời bạn ${s.p.spoken} lên bảng! Bạn đã chọn sẵn đòn rồi, cả lớp đếm oẳn tù xì nào!`
              : `Mời bạn ${s.p.spoken} lên bảng đấu với cô! ${s.p.spoken} ơi, gõ kéo, búa hoặc bao để ra đòn nhé!`,
          ),
        },
      ];
    }
    // hết người thách đấu: cô gọi 1 bạn đang ngồi lớp, ưu tiên bạn vừa hoạt động
    const seated = [...this.students.values()].filter((s) => s.waitingUntil <= now);
    if (!seated.length) return [];
    const active = seated.filter((s) => now - s.lastActive < 300_000);
    const pool = active.length ? active : seated;
    const s = pool[Math.floor(this.rng() * pool.length)];
    this.duel = { username: s.p.username, pick: null, adminPick: 'bua', auto: true, rematch: false, outcome: null };
    this.phase = 'pick';
    this.phaseEndsAt = now + GAME.pickWindowSec * 1000;
    return [
      {
        main: true,
        text: F(`Cô gọi bạn ${s.p.spoken} lên bảng đấu thử một lượt nhé! Gõ kéo, búa hoặc bao nào, không ra đòn cũng không sao.`),
      },
    ];
  }

  private releaseWaiting(s: Student) {
    s.waitingUntil = 0;
    s.waitDuelsLeft = 0;
  }

  private resolveDuel(now: number): Say[] {
    const d = this.duel!;
    const s = this.students.get(d.username)!;
    const outcome = judge(d.pick!, d.adminPick);
    d.outcome = outcome;
    const pickName = CHOICE_META[d.pick!].name;
    const adminName = CHOICE_META[d.adminPick].name;
    const lines: Say[] = [];

    if (outcome === 'draw' && !d.rematch) {
      // hòa lần 1: đấu lại ngay, chưa tính lượt
      d.rematch = true;
      d.pick = null;
      this.phase = 'pick';
      this.phaseEndsAt = now + GAME.rematchWindowSec * 1000;
      lines.push({
        main: true,
        text: F(`Hòa! ${s.p.spoken} và cô cùng ra ${pickName}. Đấu lại nào, ${s.p.spoken} gõ đòn mới đi!`),
      });
      return lines;
    }

    this.totals.duels++;
    this.duelNo++;
    this.lastResult = { nickname: s.p.nickname, outcome, pick: d.pick!, adminPick: d.adminPick, at: now };

    if (outcome === 'win') {
      s.wins++;
      s.totalWins++;
      s.streak++;
      this.totals.studentWins++;
      const phrase = BEAT_PHRASE[`${d.pick}-${d.adminPick}`];
      lines.push({
        main: true,
        text: F(
          `${phrase}! ${s.p.spoken} ra ${pickName}, cô ra ${adminName}. ${s.p.spoken} thắng cô, được một sao!` +
            (s.streak >= 3 ? ` Chuỗi ${s.streak} trận thắng liên tiếp, ghê chưa!` : ''),
        ),
      });
    } else if (outcome === 'lose') {
      s.streak = 0;
      this.totals.adminWins++;
      const phrase = BEAT_PHRASE[`${d.adminPick}-${d.pick}`];
      s.waitingUntil = now + GAME.resultSec * 1000 + GAME.waitingSec * 1000; // tính từ lúc hết pha kết quả
      s.waitDuelsLeft = GAME.waitingDuels;
      lines.push({
        main: true,
        text: F(`${phrase}! Cô ra ${adminName}, ${s.p.spoken} ra ${pickName}. Cô thắng lượt này, ${s.p.spoken} ra phòng chờ ngồi một lúc nhé!`),
      });
    } else {
      this.totals.draws++;
      lines.push({
        main: true,
        text: F(`Lại hòa nữa, cùng ra ${pickName}! Lượt này huề, ${s.p.spoken} về chỗ, không ai ra phòng chờ cả.`),
      });
    }

    // mỗi lượt đấu xong, các bạn phòng chờ gần được về hơn 1 lượt
    for (const o of this.students.values()) {
      if (o.p.username !== d.username && o.waitingUntil > now && o.waitDuelsLeft > 0) {
        o.waitDuelsLeft--;
        if (o.waitDuelsLeft <= 0) {
          this.releaseWaiting(o);
          lines.push({ text: F(`Bạn ${o.p.spoken} đã qua đủ lượt chờ, được về lớp rồi!`), ttl: 20_000 });
        }
      }
    }

    this.phase = 'result';
    this.phaseEndsAt = now + GAME.resultSec * 1000;
    this.lastDuelEndAt = now + GAME.resultSec * 1000;
    return lines;
  }

  private startBreak(now: number): Say[] {
    const top = [...this.students.values()]
      .filter((s) => s.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3)
      .map((s) => ({ nickname: s.p.nickname, wins: s.wins }));
    this.sessionTopSnap = top;
    for (const s of this.students.values()) this.releaseWaiting(s); // hết tiết: phòng chờ về hết
    this.phase = 'break';
    this.phaseEndsAt = now + GAME.breakSec * 1000;
    const best = top[0];
    return [
      {
        main: true,
        text: F(
          `Hết tiết ${this.session}! Tiết này lớp thắng cô ${this.sessionWins()} lượt, cô thắng ${this.sessionAdminWins()} lượt.` +
            (best ? ` Bạn thắng nhiều nhất là ${best.nickname} với ${best.wins} sao. Cả lớp giỏi lắm!` : '') +
            ' Nghỉ giải lao một chút rồi vào tiết mới nhé!',
        ),
      },
    ];
  }

  private sessionWinsMark = 0;
  private sessionAdminMark = 0;
  private sessionWins() {
    return this.totals.studentWins - this.sessionWinsMark;
  }
  private sessionAdminWins() {
    return this.totals.adminWins - this.sessionAdminMark;
  }

  tick(now: number): Say[] {
    const lines: Say[] = [];

    // phòng chờ hết giờ thì về lớp
    for (const s of this.students.values()) {
      if (s.waitingUntil && s.waitingUntil <= now && this.phase !== 'result') {
        this.releaseWaiting(s);
        lines.push({ text: F(`Bạn ${s.p.spoken} hết giờ phòng chờ, về lớp rồi!`), ttl: 20_000 });
      }
    }

    if (this.phase === 'idle') {
      if (now - this.lastDuelEndAt >= GAME.betweenDuelsMs && this.students.size > 0) {
        lines.push(...this.startDuel(now));
      } else if (now - this.lastIdleAt >= GAME.idleLineEveryMs && now - this.lastDuelEndAt > 45_000) {
        this.lastIdleAt = now;
        lines.push({ text: F(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]), ttl: 30_000 });
      }
    } else if (this.phase === 'pick' && now >= this.phaseEndsAt) {
      const d = this.duel!;
      if (!d.pick) {
        if (d.auto) {
          // cô tự gọi mà bạn không ra đòn (kể cả lượt đấu lại): bỏ qua, không phạt, không tính lượt
          lines.push({
            main: true,
            text: F(
              d.rematch
                ? `Bạn ${this.students.get(d.username)?.p.spoken ?? ''} chưa ra đòn lại, lượt này tính hòa nhé!`
                : `Bạn ${this.students.get(d.username)?.p.spoken ?? ''} chưa ra đòn, cô gọi bạn khác nhé!`,
            ),
          });
          this.duel = null;
          this.phase = 'idle';
          this.lastDuelEndAt = now;
          return lines;
        }
        d.pick = CHOICES[Math.floor(this.rng() * 3)]; // đã thách đấu mà hết giờ: bốc đòn ngẫu nhiên cho công bằng
      }
      d.adminPick = CHOICES[Math.floor(this.rng() * 3)];
      this.phase = 'chant';
      this.phaseEndsAt = now + GAME.chantMs;
    } else if (this.phase === 'chant' && now >= this.phaseEndsAt) {
      lines.push(...this.resolveDuel(now));
    } else if (this.phase === 'result' && now >= this.phaseEndsAt) {
      this.duel = null;
      if (this.duelNo >= GAME.duelsPerSession) {
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
    const d = this.duel;
    const ds = d ? this.students.get(d.username) : null;
    const reveal = this.phase === 'result';
    return {
      phase: this.phase,
      phaseRemainSec: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      session: Math.max(1, this.session),
      duelNo: this.duelNo,
      duelsPerSession: GAME.duelsPerSession,
      students: seated.slice(0, 10).map((s) => ({
        username: s.p.username,
        nickname: s.p.nickname,
        avatar: s.p.avatar,
        wins: s.wins,
        streak: s.streak,
        hue: s.hue,
        dueling: d?.username === s.p.username,
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
          duelsLeft: s.waitDuelsLeft,
        })),
      queue: this.queue.slice(0, 4).map((q) => ({ nickname: this.students.get(q.username)?.p.nickname ?? '' })),
      duel:
        d && ds
          ? {
              nickname: ds.p.nickname,
              avatar: ds.p.avatar,
              hue: ds.hue,
              hasPicked: !!d.pick,
              pick: reveal ? d.pick : null,
              adminPick: this.phase === 'result' ? d.adminPick : null,
              outcome: this.phase === 'result' ? d.outcome : null,
              rematch: d.rematch,
              auto: d.auto,
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
