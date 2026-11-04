/**
 * Lõi Phòng Tarot: hàng chờ xem bài, chọn 1 trong 3 lá úp, lật bài và đọc lời giải.
 * Hàm thuần theo thời gian truyền vào (now), không tự phát tiếng: trả về các câu Say để useTarot đọc.
 * Mọi câu đọc đều bắt đầu bằng "F: " (giọng nữ chủ phòng, xem live/voice.ts).
 */
import { CARDS, TOPICS, detectTopic, DISCLAIMER, type TarotCard, type TopicKey } from './cards';
import { GAME } from './config';
import { plain } from '../live/chatter';

export interface Person {
  username: string;
  nickname: string;
  spoken: string; // tên an toàn để đọc lên
  avatar: string;
}
export interface ChatIn extends Person {
  comment: string;
  createTime: number;
  safe?: boolean;
}
export interface Say {
  text: string;
  main?: boolean; // câu chính của chương trình: đọc ngay, đồng hồ dừng trong lúc đọc
  priority?: boolean; // câu nói thêm ưu tiên (cảm ơn quà)
  ttl?: number; // câu nói thêm chờ quá lâu thì bỏ
}
export type Phase = 'idle' | 'offer' | 'reveal';

interface Queued extends Person {
  topic: TopicKey;
}
interface Drawn {
  card: TarotCard;
  reversed: boolean;
}
interface Current {
  reader: Queued;
  drawn: Drawn[];
  picked: number; // -1 = chưa chọn
  auto: boolean;
}

export interface TarotView {
  phase: Phase;
  queue: { nickname: string; avatar: string; topic: string }[];
  current: {
    username: string; // chỉ để trang điều khiển bấm giả lập chọn lá; sân khấu không hiện
    nickname: string;
    avatar: string;
    topic: string;
    picked: number;
    auto: boolean;
    secLeft: number;
    cards: { numeral: string; name: string; en: string; symbol: string; c1: string; c2: string; keywords: string; reversed: boolean; faceUp: boolean }[];
  } | null;
  readings: number; // số lượt đã xem trong buổi
  displayLines: string[]; // lời giải đang hiện chữ trên sân khấu
  disclaimer: string;
}

// ---------- Câu chủ phòng đọc (không dùng gạch ngang dài, tránh câu mệnh lệnh xin tim/quà) ----------
const F = (s: string) => `F: ${s}`;
const LINES = {
  welcome: [
    F('Xin chào cả nhà đã ghé Phòng Tarot. Mình xem bài Ẩn Chính ở đây chỉ để giải trí và tham khảo cho vui thôi nhé.'),
    F('Chào mừng cả nhà đến với Phòng Tarot. Ai muốn xem bài thì cứ vào hàng chờ, mình đọc lần lượt từng bạn một.'),
  ],
  howto: [
    F('Cách vào xem bài rất dễ: bạn gõ TAROT kèm chủ đề, ví dụ TAROT tình yêu, TAROT công việc hoặc TAROT tài chính. Tới lượt, bạn chọn 1 trong 3 lá úp bằng cách gõ số 1, 2 hoặc 3.'),
    F('Mình nhắc lại cách chơi nhé: gõ TAROT kèm chủ đề để vào hàng chờ. Khi tới lượt của bạn, trước mặt sẽ có 3 lá bài úp, bạn gõ 1, 2 hoặc 3 để chọn lá của mình.'),
  ],
  join: [
    (n: string, pos: number) => F(`Mình ghi tên bạn ${n} vào hàng chờ rồi, bạn đang ở vị trí thứ ${pos}. Chờ mình một lát nhé.`),
    (n: string, pos: number) => F(`Đã nhận yêu cầu của bạn ${n}. Hàng chờ đang có bạn ở vị trí thứ ${pos}, mình sẽ gọi tên khi tới lượt.`),
  ],
  queueFull: [
    (n: string) => F(`Bạn ${n} ơi, hàng chờ đang đầy rồi. Bạn chờ một lát rồi gõ lại TAROT giúp mình nhé.`),
  ],
  called: [
    (n: string, topic: string) => F(`Mời bạn ${n} lên xem bài về chủ đề ${topic}.`),
    (n: string, topic: string) => F(`Tới lượt bạn ${n} rồi. Hôm nay mình xem cho bạn về ${topic} nhé.`),
  ],
  pickPrompt: [
    F('Trước mặt bạn là 3 lá bài úp. Bạn gõ số 1, 2 hoặc 3 để chọn 1 lá. Mình chờ bạn 20 giây.'),
    F('Ba lá bài đang úp trước mặt bạn đây. Gõ 1, 2 hoặc 3 để chọn lá dành cho mình nhé.'),
  ],
  autoPick: [
    (n: string) => F(`Bạn ${n} chưa kịp chọn nên mình tự chọn lá ở giữa cho bạn nhé.`),
  ],
  revealIntro: [
    (n: string) => F(`Lá bài của bạn ${n} đây.`),
    (n: string) => F(`Mình lật lá bài của bạn ${n} lên nhé.`),
  ],
  cardLine: [
    (name: string, dir: string) => F(`Lá ${name}, ${dir}.`),
  ],
  skip: [
    F('Mình chuyển sang bạn tiếp theo trong hàng chờ nhé.'),
  ],
  thank: [
    (n: string, g: string) => F(`Cảm ơn bạn ${n} đã tặng ${g} cho phòng. Mình ghi nhận tấm lòng của bạn nhé.`),
    (n: string, g: string) => F(`Bạn ${n} vừa tặng ${g}. Cảm ơn bạn nhiều, chúc bạn một buổi tối thật vui.`),
  ],
  follow: [
    (n: string) => F(`Chào bạn ${n} mới theo dõi phòng. Khi nào muốn xem bài thì gõ TAROT kèm chủ đề nhé.`),
  ],
  idle: [
    F('Phòng đang vắng, ai muốn xem bài cho vui thì gõ TAROT kèm chủ đề nhé. Mình xem lần lượt theo hàng chờ.'),
    F('Mình vẫn đang ở đây chờ bạn tiếp theo. Gõ TAROT tình yêu, TAROT công việc hoặc TAROT tài chính là vào hàng chờ ngay.'),
    F('Trong lúc chờ bạn mới, mình nhắc lại là bài ở phòng mình chỉ để giải trí thôi nhé. Ai tò mò về lá bài của mình thì gõ TAROT là được.'),
  ],
};

export class TarotRoom {
  phase: Phase = 'idle';
  phaseEndsAt = 0;
  queue: Queued[] = [];
  current: Current | null = null;
  readings = 0;
  displayLines: string[] = [];
  private lastIdleAt = 0;
  private lastLineIdx = new Map<string, number>();

  constructor(
    private now0: number,
    private rand: () => number = Math.random,
  ) {
    this.lastIdleAt = now0;
  }

  /** Bốc 1 câu trong nhóm, tránh lặp lại câu vừa bốc */
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

  /** Mở buổi mới (nút Reset / Ván mới ở trang điều khiển) */
  newSession(now: number): Say[] {
    this.phase = 'idle';
    this.phaseEndsAt = 0;
    this.queue = [];
    this.current = null;
    this.readings = 0;
    this.displayLines = [];
    this.lastIdleAt = now;
    return [
      { text: this.pick('welcome', LINES.welcome), main: true },
      { text: this.pick('howto', LINES.howto), main: true },
    ];
  }

  chat(e: ChatIn, now: number): Say[] {
    const p = plain(e.comment);
    // chọn lá: chỉ người đang được xem mới chọn được, gõ đúng 1 số 1/2/3
    if (this.phase === 'offer' && this.current && e.username === this.current.reader.username) {
      const digit = p.trim();
      if (digit === '1' || digit === '2' || digit === '3') return this.doPick(Number(digit) - 1, false, now);
    }
    // vào hàng chờ: comment có chữ tarot
    if (!p.includes(' tarot ')) return [];
    if (this.current?.reader.username === e.username || this.queue.some((q) => q.username === e.username)) return [];
    const topic = detectTopic(p);
    if (this.queue.length >= GAME.queueMax && this.phase !== 'idle') {
      return [{ text: this.pickFn('queueFull', LINES.queueFull, e.spoken), ttl: GAME.chatterMaxWaitMs }];
    }
    this.queue.push({ username: e.username, nickname: e.nickname, spoken: e.spoken, avatar: e.avatar, topic });
    const out: Say[] = [{ text: this.pickFn('join', LINES.join, e.spoken, this.queue.length), ttl: GAME.chatterMaxWaitMs }];
    if (this.phase === 'idle') out.push(...this.startOffer(now));
    return out;
  }

  private startOffer(now: number): Say[] {
    const reader = this.queue.shift();
    if (!reader) {
      this.phase = 'idle';
      return [];
    }
    // rút 3 lá khác nhau từ 22 lá Ẩn Chính
    const pool = [...CARDS];
    const drawn: Drawn[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(this.rand() * pool.length);
      const [card] = pool.splice(idx, 1);
      drawn.push({ card, reversed: this.rand() < GAME.reversedChance });
    }
    this.current = { reader, drawn, picked: -1, auto: false };
    this.phase = 'offer';
    this.phaseEndsAt = now + GAME.pickSec * 1000;
    this.displayLines = [];
    return [
      { text: this.pickFn('called', LINES.called, reader.spoken, TOPICS[reader.topic].label), main: true },
      { text: this.pick('pickPrompt', LINES.pickPrompt), main: true },
    ];
  }

  private doPick(idx: number, auto: boolean, now: number): Say[] {
    const cur = this.current;
    if (!cur || this.phase !== 'offer') return [];
    cur.picked = idx;
    cur.auto = auto;
    this.phase = 'reveal';
    this.phaseEndsAt = now + GAME.revealSec * 1000;
    this.readings++;
    const { card, reversed } = cur.drawn[idx];
    const dir = reversed ? 'chiều ngược' : 'chiều xuôi';
    const meaning = reversed ? card.rev : card.up;
    const close = this.pick(`close-${cur.reader.topic}`, TOPICS[cur.reader.topic].close);
    const raw: Say[] = [];
    if (auto) raw.push({ text: this.pickFn('autoPick', LINES.autoPick, cur.reader.spoken), main: true });
    raw.push({ text: this.pickFn('revealIntro', LINES.revealIntro, cur.reader.spoken), main: true });
    raw.push({ text: this.pickFn('cardLine', LINES.cardLine, card.name, dir), main: true });
    raw.push({ text: F(meaning), main: true });
    raw.push({ text: F(close), main: true });
    if (this.readings === 1 || this.readings % GAME.disclaimerEvery === 0) raw.push({ text: F(DISCLAIMER), main: true });
    this.displayLines = raw.map((l) => l.text.replace(/^F: /, ''));
    return raw;
  }

  tick(now: number): Say[] {
    if (this.phase === 'offer' && now >= this.phaseEndsAt) return this.doPick(1, true, now); // hết giờ: tự chọn lá giữa
    if (this.phase === 'reveal' && now >= this.phaseEndsAt) {
      this.current = null;
      this.displayLines = [];
      if (this.queue.length) return this.startOffer(now);
      this.phase = 'idle';
      this.lastIdleAt = now;
      return [];
    }
    if (this.phase === 'idle') {
      if (this.queue.length) return this.startOffer(now);
      if (now - this.lastIdleAt >= GAME.idleLineEveryMs) {
        this.lastIdleAt = now;
        return [{ text: this.pick('idle', LINES.idle), ttl: GAME.chatterMaxWaitMs }];
      }
    }
    return [];
  }

  /** Chủ kênh bấm Bỏ lượt: bỏ qua người đang xem, sang người tiếp */
  skip(now: number): Say[] {
    if (!this.current && !this.queue.length) return [];
    this.current = null;
    this.displayLines = [];
    this.phase = 'idle';
    const out: Say[] = [{ text: this.pick('skip', LINES.skip), main: true }];
    if (this.queue.length) out.push(...this.startOffer(now));
    return out;
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ text: this.pickFn('thank', LINES.thank, p.spoken, giftName), priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  follow(p: Person): Say[] {
    return [{ text: this.pickFn('follow', LINES.follow, p.spoken), ttl: GAME.chatterMaxWaitMs }];
  }

  /** Đang đọc câu chính thì đồng hồ của pha hiện tại đứng lại (giữ nguyên như Lớp Toán) */
  hold(ms: number) {
    if (this.phase === 'offer' || this.phase === 'reveal') this.phaseEndsAt += ms;
  }

  /** Câu nói thêm chỉ đọc lúc đang chờ chọn lá (còn hơn 5 giây) hoặc phòng đang trống */
  chatterWindow(now: number): boolean {
    if (this.phase === 'idle') return true;
    if (this.phase === 'offer') return this.phaseEndsAt - now > 5000;
    return false;
  }

  view(now: number): TarotView {
    const cur = this.current;
    return {
      phase: this.phase,
      queue: this.queue.map((q) => ({ nickname: q.nickname, avatar: q.avatar, topic: TOPICS[q.topic].label })),
      current: cur
        ? {
            username: cur.reader.username,
            nickname: cur.reader.nickname,
            avatar: cur.reader.avatar,
            topic: TOPICS[cur.reader.topic].label,
            picked: cur.picked,
            auto: cur.auto,
            secLeft: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
            cards: cur.drawn.map((d, i) => ({
              numeral: d.card.numeral,
              name: d.card.name,
              en: d.card.en,
              symbol: d.card.symbol,
              c1: d.card.c1,
              c2: d.card.c2,
              keywords: d.card.keywords,
              reversed: d.reversed,
              faceUp: this.phase === 'reveal' && i === cur.picked,
            })),
          }
        : null,
      readings: this.readings,
      displayLines: this.phase === 'reveal' ? this.displayLines : [],
      disclaimer: 'Xem tarot tại phòng chỉ mang tính giải trí, tham khảo cho vui.',
    };
  }
}
