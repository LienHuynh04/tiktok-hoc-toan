/**
 * Chế độ game "Lá Bài May Mắn": cả phòng cùng chơi theo vòng.
 * Mỗi vòng: hiện 3 lá úp, MỌI người xem gõ 1/2/3 chọn lá của mình (đổi ý được tới khi hết giờ),
 * hết giờ lật cả 3 lá: lá xuôi được trọn điểm may mắn của lá, lá ngược được một nửa.
 * Điểm cộng dồn cả buổi thành Bảng xếp hạng Top May Mắn. Hàm thuần theo now như TarotRoom.
 */
import { CARDS, type TarotCard } from './cards';
import { GAME } from './config';
import type { Person, Say } from './tarot';

export type LuckyPhase = 'wait' | 'pick' | 'reveal';

interface DrawnL {
  card: TarotCard;
  reversed: boolean;
  points: number; // chỉ tính khi lật bài
}
interface Score {
  p: Person;
  total: number;
  rounds: number;
  best: number;
}

export interface LuckyView {
  phase: LuckyPhase;
  round: number;
  secLeft: number;
  players: number; // số người đã chọn lá ở vòng này
  counts: number[]; // số người chọn từng lá
  cards: { numeral: string; name: string; en: string; symbol: string; c1: string; c2: string; keywords: string; reversed: boolean; faceUp: boolean; points: number; count: number }[];
  top: { nickname: string; avatar: string; total: number; best: number }[];
  totalPlayers: number; // tổng số người đã có điểm trong buổi
}

const F = (s: string) => `F: ${s}`;
const LINES = {
  open: [
    F('Mình mở chế độ game Lá Bài May Mắn nhé. Cả phòng cùng chơi, ai cũng chọn được lá của mình, không phải chờ tới lượt đâu.'),
    F('Chuyển sang game Lá Bài May Mắn đây. Trò này cả phòng chơi cùng lúc, chọn lá nào là lá của mình, lật lên có điểm may mắn cộng dồn cả buổi.'),
  ],
  howto: [
    F('Cách chơi rất dễ: mỗi vòng có 3 lá úp, bạn gõ số 1, 2 hoặc 3 để chọn lá của mình. Hết giờ mình lật cả 3 lá, lá xuôi được trọn điểm, lá ngược được một nửa điểm. Ai nhiều điểm nhất buổi sẽ đứng đầu bảng may mắn.'),
  ],
  roundStart: [
    (r: number) => F(`Vòng ${r} bắt đầu. Ba lá bài đã úp sẵn rồi, cả phòng gõ 1, 2 hoặc 3 để chọn lá của mình nhé. Mình chờ ${GAME.luckyPickSec} giây.`),
    (r: number) => F(`Mời cả phòng vào vòng ${r}. Chọn lá của bạn bằng số 1, 2 hoặc 3. Đổi ý thì gõ lại số khác trước khi hết giờ là được.`),
  ],
  revealIntro: [
    (n: number) => F(`Hết giờ. Có ${n} bạn đã chọn lá ở vòng này. Mình lật cả 3 lá lên nhé.`),
  ],
  cardLine: [
    (i: number, name: string, dir: string, pts: number, count: number) => F(`Lá số ${i}: ${name}, ${dir}, ${pts} điểm cho ${count} bạn chọn lá này.`),
  ],
  roundTop: [
    (names: string, pts: number) => F(`Vòng này bạn ${names} chọn trúng lá cao nhất, được ${pts} điểm.`),
    (names: string, pts: number) => F(`Xin chúc mừng bạn ${names} với ${pts} điểm ở vòng này, lá chọn rất sáng.`),
  ],
  noPick: [F('Vòng này chưa có bạn nào chọn lá. Vòng sau gõ 1, 2 hoặc 3 thật nhanh nhé.')],
  boardTop: [
    (n: string, total: number) => F(`Hiện bạn ${n} đang dẫn đầu bảng may mắn với ${total} điểm.`),
  ],
};

export class LuckyGame {
  phase: LuckyPhase = 'wait';
  phaseEndsAt = 0;
  round = 0;
  private drawn: DrawnL[] = [];
  private picks = new Map<string, { p: Person; idx: number }>();
  private scores = new Map<string, Score>();
  private lastLineIdx = new Map<string, number>();

  constructor(
    private now0: number,
    private rand: () => number = Math.random,
  ) {}

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

  /** Bật chế độ game: vào thẳng vòng 1 cho nóng phòng */
  start(now: number): Say[] {
    return [
      { text: this.pick('luckyOpen', LINES.open), main: true },
      { text: this.pick('luckyHowto', LINES.howto), main: true },
      ...this.startRound(now),
    ];
  }

  /** Buổi mới: xoá điểm, về vòng 0 */
  reset() {
    this.scores.clear();
    this.picks.clear();
    this.drawn = [];
    this.round = 0;
    this.phase = 'wait';
    this.phaseEndsAt = 0;
  }

  private startRound(now: number): Say[] {
    this.round++;
    const pool = [...CARDS];
    this.drawn = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(this.rand() * pool.length);
      const [card] = pool.splice(idx, 1);
      this.drawn.push({ card, reversed: this.rand() < GAME.reversedChance, points: 0 });
    }
    this.picks.clear();
    this.phase = 'pick';
    this.phaseEndsAt = now + GAME.luckyPickSec * 1000;
    return [{ text: this.pickFn('roundStart', LINES.roundStart, this.round), main: true }];
  }

  /** Người xem gõ 1/2/3 trong pha chọn lá (đổi ý được) */
  choose(p: Person, idx: number) {
    if (this.phase !== 'pick' || idx < 0 || idx > 2) return;
    this.picks.set(p.username, { p, idx });
  }

  counts(): number[] {
    const c = [0, 0, 0];
    for (const { idx } of this.picks.values()) c[idx]++;
    return c;
  }

  private revealRound(now: number): Say[] {
    this.phase = 'reveal';
    this.phaseEndsAt = now + GAME.luckyRevealSec * 1000;
    for (const d of this.drawn) d.points = d.reversed ? Math.ceil(d.card.luck / 2) : d.card.luck;
    const counts = this.counts();
    let topPts = 0;
    const topNames: string[] = [];
    for (const { p, idx } of this.picks.values()) {
      const pts = this.drawn[idx].points;
      const s = this.scores.get(p.username) ?? { p, total: 0, rounds: 0, best: 0 };
      s.p = p;
      s.total += pts;
      s.rounds++;
      s.best = Math.max(s.best, pts);
      this.scores.set(p.username, s);
      if (pts > topPts) {
        topPts = pts;
        topNames.length = 0;
        topNames.push(p.spoken);
      } else if (pts === topPts && topPts > 0 && !topNames.includes(p.spoken)) topNames.push(p.spoken);
    }
    const out: Say[] = [{ text: this.pickFn('revealIntro', LINES.revealIntro, this.picks.size), main: true }];
    if (this.picks.size === 0) {
      out.push({ text: this.pick('noPick', LINES.noPick), main: true });
      return out;
    }
    this.drawn.forEach((d, i) => {
      out.push({ text: this.pickFn('cardLine', LINES.cardLine, i + 1, d.card.name, d.reversed ? 'chiều ngược' : 'chiều xuôi', d.points, counts[i]), main: true });
    });
    if (topNames.length) out.push({ text: this.pickFn('roundTop', LINES.roundTop, topNames.slice(0, 2).join(' và '), topPts), main: true });
    if (this.round % 3 === 0) {
      const top = this.topList(1)[0];
      if (top) out.push({ text: this.pickFn('boardTop', LINES.boardTop, top.p.spoken, top.total), ttl: GAME.chatterMaxWaitMs });
    }
    return out;
  }

  tick(now: number): Say[] {
    if (this.phase === 'pick' && now >= this.phaseEndsAt) return this.revealRound(now);
    if (this.phase === 'reveal' && now >= this.phaseEndsAt) {
      this.phase = 'wait';
      this.phaseEndsAt = now + GAME.luckyWaitSec * 1000;
      return [];
    }
    if (this.phase === 'wait' && now >= this.phaseEndsAt && this.phaseEndsAt > 0) return this.startRound(now);
    return [];
  }

  /** Chủ kênh bấm qua pha: đang chọn thì lật luôn, đang lật thì sang vòng mới, đang nghỉ thì bắt đầu ngay */
  skipPhase(now: number): Say[] {
    if (this.phase === 'pick') return this.revealRound(now);
    if (this.phase === 'reveal') {
      this.phase = 'wait';
      this.phaseEndsAt = now + 800; // nghỉ rất ngắn rồi vào vòng mới
      return [];
    }
    return this.startRound(now);
  }

  hold(ms: number) {
    if (this.phase === 'pick' || this.phase === 'reveal') this.phaseEndsAt += ms;
  }

  chatterWindow(now: number): boolean {
    if (this.phase === 'wait') return true;
    if (this.phase === 'pick') return this.phaseEndsAt - now > 5000;
    return false;
  }

  private topList(n: number): Score[] {
    return [...this.scores.values()].sort((a, b) => b.total - a.total || b.best - a.best).slice(0, n);
  }

  view(now: number): LuckyView {
    const counts = this.counts();
    return {
      phase: this.phase,
      round: this.round,
      secLeft: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      players: this.picks.size,
      counts,
      cards: this.drawn.map((d, i) => ({
        numeral: d.card.numeral,
        name: d.card.name,
        en: d.card.en,
        symbol: d.card.symbol,
        c1: d.card.c1,
        c2: d.card.c2,
        keywords: d.card.keywords,
        reversed: d.reversed,
        faceUp: this.phase === 'reveal',
        points: this.phase === 'reveal' ? d.points : 0,
        count: counts[i],
      })),
      top: this.topList(8).map((s) => ({ nickname: s.p.nickname, avatar: s.p.avatar, total: s.total, best: s.best })),
      totalPlayers: this.scores.size,
    };
  }
}
