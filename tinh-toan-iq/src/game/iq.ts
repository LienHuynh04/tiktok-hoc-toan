/**
 * Lõi game "Tính Toán IQ Cao": các trò tính nhẩm IQ cao, cả phòng đua tốc độ.
 * Mỗi câu: hiện đề 15 giây, mọi người gõ đáp án vào bình luận; 3 bạn đúng nhanh nhất
 * được 100/70/50 điểm, đủ 3 bạn đúng là chốt câu sớm. Chuỗi đúng liên tiếp được thưởng.
 * Điểm cộng dồn cả buổi thành Bảng xếp hạng. Hàm thuần theo now, trả về Say để useIQ đọc.
 * Mọi câu MC đọc đều bắt đầu bằng "M: " (giọng nam dẫn game).
 */
import { GAME } from './config';
import { plain } from '../live/chatter';

export interface Person {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
}
export interface ChatIn extends Person {
  comment: string;
  createTime: number;
  safe?: boolean;
}
export interface Say {
  text: string;
  main?: boolean;
  priority?: boolean;
  ttl?: number;
}
export type IQPhase = 'idle' | 'ask' | 'reveal' | 'board';

export interface GenQ {
  tag: string;
  prompt: string; // hiện to trên sân khấu
  say: string; // MC đọc
  answer: string;
  explain: string; // câu giải thích khi công bố đáp án
}

interface Player {
  p: Person;
  score: number;
  correct: number;
  streak: number;
  wins: number; // số lần nhanh nhất
}
interface CorrectEntry {
  p: Person;
  points: number;
  rank: number;
}

export interface IQView {
  phase: IQPhase;
  round: number;
  tag: string;
  prompt: string;
  answer: string; // trang điều khiển dùng để giả lập; sân khấu chỉ hiện ở pha reveal
  explain: string;
  secLeft: number;
  questionSec: number;
  correct: { nickname: string; avatar: string; points: number; rank: number }[];
  wrongCount: number;
  top: { nickname: string; avatar: string; score: number; correct: number; streak: number; wins: number }[];
  totalPlayers: number;
}

// ---------- bộ sinh câu hỏi ----------
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (n: number) => String(n).split('').map((d) => SUP[d]).join('');

interface H {
  int: (lo: number, hi: number) => number;
  coin: () => boolean;
  pick: <T>(arr: readonly T[]) => T;
}

const GENS: ((h: H) => GenQ)[] = [
  // Tính nhanh: a + b × c − d (nhân trước)
  (h) => {
    const a = h.int(5, 25), b = h.int(3, 9), c = h.int(3, 9);
    const mid = a + b * c;
    const d = h.int(2, mid - 3);
    const n = mid - d;
    return {
      tag: 'Tính nhanh', prompt: `${a} + ${b} × ${c} − ${d}`, say: `${a} cộng ${b} nhân ${c}, trừ ${d}. Bằng mấy?`,
      answer: String(n), explain: `Nhân trước: ${b} nhân ${c} bằng ${b * c}. Rồi ${a} cộng ${b * c} trừ ${d} bằng ${n}.`,
    };
  },
  // Tính nhanh: (a + b) × c − d
  (h) => {
    const a = h.int(3, 15), b = h.int(3, 15), c = h.int(2, 9);
    const mid = (a + b) * c;
    const d = h.int(2, mid - 3);
    const n = mid - d;
    return {
      tag: 'Tính nhanh', prompt: `(${a} + ${b}) × ${c} − ${d}`, say: `${a} cộng ${b}, tất cả nhân ${c}, trừ ${d}. Bằng mấy?`,
      answer: String(n), explain: `Trong ngoặc trước: ${a} cộng ${b} bằng ${a + b}. Nhân ${c} được ${mid}, trừ ${d} còn ${n}.`,
    };
  },
  // Dãy số: cấp số cộng / nhân / bình phương / Fibonacci / đan xen
  (h) => {
    const fam = h.int(0, 4);
    if (fam === 0) {
      const s = h.int(2, 30), d = h.pick([2, 3, 4, 5, 6, 7, 9, 11]);
      const terms = [0, 1, 2, 3].map((i) => s + i * d);
      const n = s + 4 * d;
      return { tag: 'Dãy số', prompt: `${terms.join(', ')}, ?`, say: `Dãy số ${terms.join(', ')}. Số tiếp theo là số mấy?`, answer: String(n), explain: `Mỗi số hơn số trước ${d} đơn vị, số tiếp theo là ${n}.` };
    }
    if (fam === 1) {
      const s = h.pick([2, 3, 4, 5]), r = h.pick([2, 3]);
      const terms = [0, 1, 2, 3].map((i) => s * r ** i);
      const n = s * r ** 4;
      return { tag: 'Dãy số', prompt: `${terms.join(', ')}, ?`, say: `Dãy số ${terms.join(', ')}. Số tiếp theo là số mấy?`, answer: String(n), explain: `Mỗi số gấp ${r} lần số trước, số tiếp theo là ${n}.` };
    }
    if (fam === 2) {
      const s = h.int(1, 6);
      const terms = [0, 1, 2, 3].map((i) => (s + i) ** 2);
      const n = (s + 4) ** 2;
      return { tag: 'Dãy số', prompt: `${terms.join(', ')}, ?`, say: `Dãy số ${terms.join(', ')}. Số tiếp theo là số mấy?`, answer: String(n), explain: `Đây là dãy số bình phương ${s}, ${s + 1}, ${s + 2}, ${s + 3}, số tiếp theo là ${s + 4} bình phương bằng ${n}.` };
    }
    if (fam === 3) {
      const a = h.int(1, 5), b = a + h.int(1, 5);
      const terms = [a, b, a + b, a + 2 * b];
      const n = 2 * a + 3 * b;
      return { tag: 'Dãy số', prompt: `${terms.join(', ')}, ?`, say: `Dãy số ${terms.join(', ')}. Số tiếp theo là số mấy?`, answer: String(n), explain: `Mỗi số bằng tổng hai số ngay trước nó, số tiếp theo là ${terms[2]} cộng ${terms[3]} bằng ${n}.` };
    }
    const s = h.int(5, 20), p = h.pick([3, 4, 5, 6]), q = h.pick([1, 2, 3]);
    const terms = [s, s + p, s + p - q, s + 2 * p - q];
    const n = s + 2 * p - 2 * q;
    return { tag: 'Dãy số', prompt: `${terms.join(', ')}, ?`, say: `Dãy số ${terms.join(', ')}. Số tiếp theo là số mấy?`, answer: String(n), explain: `Dãy đan xen cộng ${p} rồi trừ ${q}, số tiếp theo là ${terms[3]} trừ ${q} bằng ${n}.` };
  },
  // Tìm số còn thiếu: a × ? + b = c và biến thể
  (h) => {
    const fam = h.int(0, 2);
    if (fam === 0) {
      const x = h.int(2, 12), a = h.int(2, 9), b = h.int(1, 20);
      const c = a * x + b;
      return { tag: 'Tìm số thiếu', prompt: `${a} × ? + ${b} = ${c}`, say: `${a} nhân x cộng ${b} bằng ${c}. x bằng mấy?`, answer: String(x), explain: `Lấy ${c} trừ ${b} còn ${c - b}, chia ${a} được x bằng ${x}.` };
    }
    if (fam === 1) {
      const x = h.int(3, 40), b = h.int(2, 30);
      return { tag: 'Tìm số thiếu', prompt: `? + ${b} = ${x + b}`, say: `x cộng ${b} bằng ${x + b}. x bằng mấy?`, answer: String(x), explain: `x bằng ${x + b} trừ ${b} bằng ${x}.` };
    }
    const x = h.int(2, 12), b = h.int(2, 9);
    return { tag: 'Tìm số thiếu', prompt: `${x * b} : ? = ${x}`, say: `${x * b} chia x bằng ${x}. x bằng mấy?`, answer: String(b), explain: `${x * b} chia ${x} bằng ${b} nên x bằng ${b}.` };
  },
  // Luỹ thừa và căn
  (h) => {
    const fam = h.int(0, 2);
    if (fam === 0) {
      const [base, e] = h.pick([[2, 5], [2, 6], [2, 7], [3, 3], [3, 4], [4, 3], [5, 3], [6, 2], [7, 2], [9, 2]] as const);
      const n = base ** e;
      return { tag: 'Luỹ thừa', prompt: `${base}${sup(e)} = ?`, say: `${base} mũ ${e} bằng mấy?`, answer: String(n), explain: `${base} mũ ${e} bằng ${n}.` };
    }
    if (fam === 1) {
      const r = h.pick([11, 12, 13, 14, 15, 16, 18, 20, 21, 22, 24, 25]);
      return { tag: 'Căn bậc hai', prompt: `√${r * r} = ?`, say: `Căn bậc hai của ${r * r} là số mấy?`, answer: String(r), explain: `Vì ${r} nhân ${r} bằng ${r * r} nên căn bậc hai của ${r * r} là ${r}.` };
    }
    const r = h.pick([3, 4, 5, 6, 7]);
    return { tag: 'Luỹ thừa', prompt: `${r}${sup(3)} = ?`, say: `${r} mũ 3 bằng mấy?`, answer: String(r ** 3), explain: `${r} mũ 3 bằng ${r} nhân ${r} nhân ${r} bằng ${r ** 3}.` };
  },
  // So sánh không cần tính hết: số nào lớn hơn, gõ 1 hoặc 2
  (h) => {
    let a = 0, b = 0, c = 0, d = 0, e1 = 0, e2 = 0, add = 0;
    do {
      a = h.int(4, 12); b = h.int(4, 9); c = h.int(4, 12); d = h.int(4, 9); add = h.int(0, 9);
      e1 = a * b + add; e2 = c * d;
    } while (e1 === e2);
    const left = add ? `${a} × ${b} + ${add}` : `${a} × ${b}`;
    const win = e1 > e2 ? 1 : 2;
    return {
      tag: 'So sánh nhanh', prompt: `1) ${left}\n2) ${c} × ${d}`, say: `Số nào lớn hơn? Gõ 1 hoặc 2. Một: ${left}. Hai: ${c} nhân ${d}.`,
      answer: String(win), explain: `${left} bằng ${e1}, còn ${c} nhân ${d} bằng ${e2}. Số ${win} lớn hơn.`,
    };
  },
  // Phần trăm và phân số của một số
  (h) => {
    if (h.coin()) {
      const pct = h.pick([10, 20, 25, 50, 75]);
      const base = h.pick([80, 120, 160, 200, 240, 300, 400]);
      const n = (base * pct) / 100;
      return { tag: 'Phần trăm', prompt: `${pct}% của ${base} = ?`, say: `${pct} phần trăm của ${base} là bao nhiêu?`, answer: String(n), explain: `${pct} phần trăm của ${base} bằng ${base} nhân ${pct} chia 100 bằng ${n}.` };
    }
    const den = h.pick([2, 3, 4, 5, 6, 8]);
    const total = h.pick([48, 60, 72, 84, 96, 108, 120].filter((x) => x % den === 0));
    const num = h.int(1, den - 1);
    const n = (total / den) * num;
    return { tag: 'Phân số', prompt: `${num}/${den} của ${total} = ?`, say: `${num} phần ${den} của ${total} là bao nhiêu?`, answer: String(n), explain: `${total} chia ${den} bằng ${total / den}, nhân ${num} bằng ${n}.` };
  },
];

export function makeQuestion(rand = Math.random): GenQ {
  const h: H = {
    int: (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1)),
    coin: () => rand() < 0.5,
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
  };
  return GENS[Math.floor(rand() * GENS.length)](h);
}

// ---------- câu MC đọc ----------
const M = (s: string) => `M: ${s}`;
const LINES = {
  welcome: [M('Xin chào cả phòng, mình là MC của Tính Toán IQ Cao. Đây là sân chơi tính nhẩm đua tốc độ, cả phòng cùng trả lời, ai nhanh tay đúng là có điểm.')],
  howto: [M('Cách chơi: mình đọc câu hỏi, cả phòng gõ đáp án vào bình luận. Ba bạn đúng nhanh nhất được 100, 70 và 50 điểm. Đúng liên tiếp 3 câu được thưởng thêm 30 điểm. Điểm cộng dồn cả buổi lên bảng xếp hạng.')],
  askIntro: [(round: number, tag: string) => M(`Câu ${round}, dạng ${tag}.`)],
  firstRight: [(n: string) => M(`Bạn ${n} trả lời đúng đầu tiên!`)],
  answerLine: [(ans: string, explain: string) => M(`Đáp án là ${ans}. ${explain}`)],
  fastest: [(n: string, pts: number) => M(`Nhanh nhất câu này là bạn ${n}, cộng ${pts} điểm.`)],
  nobody: [M('Câu này chưa bạn nào trả lời đúng. Đừng nản, câu sau nhanh tay hơn nhé.')],
  streak: [(n: string, streak: number) => M(`Bạn ${n} đang có chuỗi ${streak} câu đúng liên tiếp, thưởng thêm ${GAME.streakBonus} điểm!`)],
  boardTop: [(n: string, score: number) => M(`Tới chặng này, bạn ${n} đang dẫn đầu với ${score} điểm. Cả phòng tiếp tục nhé!`)],
  thank: [
    (n: string, g: string) => M(`Cảm ơn bạn ${n} đã tặng ${g} cho phòng nhé.`),
    (n: string, g: string) => M(`Bạn ${n} vừa tặng ${g}. Cảm ơn bạn nhiều.`),
  ],
  follow: [(n: string) => M(`Chào bạn ${n} mới theo dõi phòng. Gõ đáp án vào bình luận là chơi cùng cả phòng được ngay nhé.`)],
  idle: [
    M('Phòng đang chờ người chơi. Khi MC bắt đầu, cả phòng gõ đáp án vào bình luận, ba bạn đúng nhanh nhất có điểm nhé.'),
    M('Tính Toán IQ Cao là game tính nhẩm đua tốc độ. Bạn không cần đăng ký gì cả, cứ gõ đáp án đúng và nhanh là lên bảng xếp hạng.'),
  ],
};

export class IQGame {
  phase: IQPhase = 'idle';
  phaseEndsAt = 0;
  round = 0;
  q: GenQ | null = null;
  correctList: CorrectEntry[] = [];
  private wrongUsers = new Set<string>();
  private players = new Map<string, Player>();
  private lastIdleAt = 0;
  private lastLineIdx = new Map<string, number>();

  constructor(
    private now0: number,
    private rand: () => number = Math.random,
  ) {
    this.lastIdleAt = now0;
  }

  private pick(key: string, arr: readonly string[]): string {
    let i = Math.floor(this.rand() * arr.length);
    if (arr.length > 1 && i === this.lastLineIdx.get(key)) i = (i + 1) % arr.length;
    this.lastLineIdx.set(key, i);
    return arr[i];
  }
  private pickFn<A extends unknown[]>(key: string, arr: readonly ((...a: A) => string)[], ...args: A): string {
    let i = Math.floor(this.rand() * arr.length);
    if (arr.length > 1 && i === this.lastLineIdx.get(key)) i = (i + 1) % arr.length;
    this.lastLineIdx.set(key, i);
    return arr[i](...args);
  }

  newSession(now: number): Say[] {
    this.round = 0;
    this.q = null;
    this.correctList = [];
    this.wrongUsers.clear();
    this.players.clear();
    this.phase = 'idle';
    this.phaseEndsAt = 0;
    this.lastIdleAt = now;
    return [
      { text: this.pick('welcome', LINES.welcome), main: true },
      { text: this.pick('howto', LINES.howto), main: true },
      ...this.startQuestion(now),
    ];
  }

  private startQuestion(now: number): Say[] {
    this.round++;
    this.q = makeQuestion(this.rand);
    this.correctList = [];
    this.wrongUsers.clear();
    this.phase = 'ask';
    this.phaseEndsAt = now + GAME.questionSec * 1000;
    return [
      { text: this.pickFn('askIntro', LINES.askIntro, this.round, this.q.tag), main: true },
      { text: M(this.q.say), main: true },
    ];
  }

  private finishQuestion(now: number): Say[] {
    if (!this.q) return [];
    this.phase = 'reveal';
    this.phaseEndsAt = now + GAME.revealSec * 1000;
    const out: Say[] = [{ text: this.pickFn('answerLine', LINES.answerLine, this.q.answer, this.q.explain), main: true }];
    const top = this.correctList[0];
    if (top) out.push({ text: this.pickFn('fastest', LINES.fastest, top.p.spoken, top.points), main: true });
    else out.push({ text: this.pick('nobody', LINES.nobody), main: true });
    return out;
  }

  chat(e: ChatIn, now: number): Say[] {
    if (this.phase !== 'ask' || !this.q) return [];
    if (plain(e.comment) !== plain(this.q.answer)) {
      // trả lời sai: mất chuỗi đúng liên tiếp (chỉ tính 1 lần mỗi câu)
      const pl = this.players.get(e.username);
      if (pl && !this.wrongUsers.has(e.username)) pl.streak = 0;
      this.wrongUsers.add(e.username);
      return [];
    }
    if (this.correctList.some((c) => c.p.username === e.username)) return [];
    const pl = this.players.get(e.username) ?? { p: e, score: 0, correct: 0, streak: 0, wins: 0 };
    pl.p = e;
    const rank = this.correctList.length + 1;
    let pts = rank <= GAME.points.length ? GAME.points[rank - 1] : GAME.latePoints;
    pl.streak = this.wrongUsers.has(e.username) ? 1 : pl.streak + 1;
    pl.correct++;
    if (rank === 1) pl.wins++;
    const out: Say[] = [];
    if (pl.streak > 0 && pl.streak % GAME.streakAt === 0) {
      pts += GAME.streakBonus;
      out.push({ text: this.pickFn('streak', LINES.streak, e.spoken, pl.streak), ttl: GAME.chatterMaxWaitMs });
    }
    pl.score += pts;
    this.players.set(e.username, pl);
    this.correctList.push({ p: e, points: pts, rank });
    if (rank === 1) out.unshift({ text: this.pickFn('firstRight', LINES.firstRight, e.spoken), ttl: GAME.chatterMaxWaitMs });
    if (this.correctList.length >= GAME.points.length) out.push(...this.finishQuestion(now));
    return out;
  }

  tick(now: number): Say[] {
    if (this.phase === 'ask' && now >= this.phaseEndsAt) return this.finishQuestion(now);
    if (this.phase === 'reveal' && now >= this.phaseEndsAt) {
      if (this.round % GAME.boardEvery === 0) {
        this.phase = 'board';
        this.phaseEndsAt = now + GAME.boardSec * 1000;
        const top = this.topList(1)[0];
        return top ? [{ text: this.pickFn('boardTop', LINES.boardTop, top.p.spoken, top.score), main: true }] : [];
      }
      return this.startQuestion(now);
    }
    if (this.phase === 'board' && now >= this.phaseEndsAt) return this.startQuestion(now);
    if (this.phase === 'idle' && now - this.lastIdleAt >= GAME.idleLineEveryMs) {
      this.lastIdleAt = now;
      return [{ text: this.pick('idle', LINES.idle), ttl: GAME.chatterMaxWaitMs }];
    }
    return [];
  }

  /** Chủ kênh bấm Qua câu: đang hỏi thì chốt đáp án, đang công bố thì sang câu mới */
  skip(now: number): Say[] {
    if (this.phase === 'ask') return this.finishQuestion(now);
    if (this.phase === 'reveal' || this.phase === 'board') return this.startQuestion(now);
    return this.startQuestion(now);
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ text: this.pickFn('thank', LINES.thank, p.spoken, giftName), priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  follow(p: Person): Say[] {
    return [{ text: this.pickFn('follow', LINES.follow, p.spoken), ttl: GAME.chatterMaxWaitMs }];
  }

  hold(ms: number) {
    if (this.phase === 'ask' || this.phase === 'reveal' || this.phase === 'board') this.phaseEndsAt += ms;
  }

  chatterWindow(now: number): boolean {
    if (this.phase === 'board' || this.phase === 'idle') return true;
    if (this.phase === 'ask') return this.phaseEndsAt - now > 5000;
    return false;
  }

  private topList(n: number): Player[] {
    return [...this.players.values()].sort((a, b) => b.score - a.score || b.correct - a.correct).slice(0, n);
  }

  view(now: number): IQView {
    return {
      phase: this.phase,
      round: this.round,
      tag: this.q?.tag ?? '',
      prompt: this.q?.prompt ?? '',
      answer: this.q?.answer ?? '',
      explain: this.phase === 'reveal' || this.phase === 'board' ? (this.q?.explain ?? '') : '',
      secLeft: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      questionSec: GAME.questionSec,
      correct: this.correctList.map((c) => ({ nickname: c.p.nickname, avatar: c.p.avatar, points: c.points, rank: c.rank })),
      wrongCount: this.wrongUsers.size,
      top: this.topList(8).map((s) => ({ nickname: s.p.nickname, avatar: s.p.avatar, score: s.score, correct: s.correct, streak: s.streak, wins: s.wins })),
      totalPlayers: this.players.size,
    };
  }
}
