/**
 * Lõi Auto Tarot Live: mỗi người chơi có 1 PHIÊN RIÊNG với máy trạng thái
 * WAITING_TOPIC → WAITING_CARD → READING → COMPLETED.
 * - WAITING_TOPIC: đã gõ TAROT (hoặc "xem bài") nhưng chưa chọn chủ đề, có 30 giây.
 * - WAITING_CARD: đã có chủ đề, nằm trong hàng chờ; người đầu hàng được gọi lên chọn 1 trong 3 lá úp (5 giây).
 * - READING: đã chọn lá, chủ phòng đang đọc lời giải theo đúng chủ đề của người đó.
 * - COMPLETED: đọc xong, phiên đóng; người chơi phải nhường ít nhất 2 lượt của người khác (hoặc chờ 5 phút) mới xem lại.
 * Nhiều người ở các trạng thái khác nhau cùng lúc, nhưng chỉ 1 người được chọn lá/đọc tại một thời điểm (lần lượt).
 * Hàm thuần theo thời gian truyền vào (now), trả về các câu Say để useTarot đọc. Mọi câu đọc bắt đầu bằng "F: ".
 */
import { CARDS, TOPICS, detectTopic, readingText, DISCLAIMER, type TarotCard, type TopicKey } from './cards';
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
  main?: boolean;
  priority?: boolean;
  ttl?: number;
}
export type Phase = 'idle' | 'offer' | 'reveal';
export type PlayerState = 'WAITING_TOPIC' | 'WAITING_CARD' | 'READING' | 'COMPLETED';

interface Drawn {
  card: TarotCard;
  reversed: boolean;
}
interface Session extends Person {
  state: PlayerState;
  topic: TopicKey | null;
  topicAt: number; // mốc có chủ đề, quyết định thứ tự hàng chờ
  stateEndsAt: number; // hạn của trạng thái hiện tại
  drawn: Drawn[] | null; // 3 lá úp của người đang được gọi (chỉ phiên đang hoạt động)
  picked: number;
  auto: boolean;
  cardName: string; // lá đã lật (hiện ở trạng thái COMPLETED)
}

export interface TarotView {
  phase: Phase;
  queue: { nickname: string; avatar: string; topic: string }[];
  choosing: { nickname: string; avatar: string; secLeft: number }[];
  sessions: { nickname: string; state: PlayerState; topic: string; secLeft: number }[];
  current: {
    username: string;
    nickname: string;
    avatar: string;
    topic: string;
    state: PlayerState;
    picked: number;
    auto: boolean;
    secLeft: number;
    cards: { numeral: string; name: string; en: string; symbol: string; c1: string; c2: string; keywords: string; reversed: boolean; faceUp: boolean; img: string }[];
  } | null;
  lastDone: { nickname: string; topic: string; cardName: string } | null;
  readings: number;
  displayLines: string[];
  disclaimer: string;
}

const F = (s: string) => `F: ${s}`;
const LINES = {
  welcome: [
    F('Xin chào cả nhà đã ghé phòng xem bài đêm nay. Ở đây mình xem bài Ẩn Chính chỉ để giải trí và tham khảo cho vui thôi nhé.'),
    F('Chào mừng cả nhà ghé xem bài. Ai muốn xem thì cứ chọn một chủ đề mình đang quan tâm, mình đọc lần lượt từng bạn một.'),
  ],
  howto: [
    F('Cách xem bài rất dễ: bạn gõ thẳng chủ đề muốn xem, ví dụ tình yêu, người cũ, công việc, tài chính, tương lai hoặc thông điệp vũ trụ. Tới lượt của bạn, mình bày 3 lá úp, bạn gõ số 1, 2 hoặc 3 để chọn lá.'),
    F('Mình nhắc lại cách chơi nhé: gõ một chủ đề như tình yêu hay công việc để vào hàng chờ. Khi tới lượt, bạn chọn 1 trong 3 lá úp bằng cách gõ 1, 2 hoặc 3.'),
  ],
  topicPrompt: [
    (n: string) => F(`Bạn ${n} ơi, bạn muốn xem về chủ đề nào? Gõ tình yêu, người cũ, công việc, tài chính, tương lai hoặc thông điệp vũ trụ nhé. Mình chờ bạn 30 giây.`),
    (n: string) => F(`Mình đã ghi tên bạn ${n}. Bạn chọn một chủ đề giúp mình: tình yêu, người cũ, công việc, tài chính, tương lai hay thông điệp vũ trụ.`),
  ],
  join: [
    (n: string, pos: number) => F(`Mình ghi tên bạn ${n} vào hàng chờ rồi, bạn đang ở vị trí thứ ${pos}. Chờ mình một lát nhé.`),
    (n: string, pos: number) => F(`Đã nhận yêu cầu của bạn ${n}. Hàng chờ đang có bạn ở vị trí thứ ${pos}, mình sẽ gọi tên khi tới lượt.`),
  ],
  topicSet: [
    (n: string, topic: string, pos: number) => F(`Rồi, mình xem cho bạn ${n} về ${topic}. Bạn đang ở vị trí thứ ${pos} trong hàng chờ nhé.`),
  ],
  queueFull: [
    (n: string) => F(`Bạn ${n} ơi, hàng chờ đang đầy rồi. Bạn chờ một lát rồi gõ lại chủ đề giúp mình nhé.`),
  ],
  cooldown: [
    (n: string) => F(`Bạn ${n} vừa xem xong rồi, mình nhường lượt cho các bạn khác một chút nhé. Lát nữa bạn xem tiếp vẫn được.`),
  ],
  called: [
    (n: string, topic: string) => F(`Mời bạn ${n} lên xem bài về chủ đề ${topic}.`),
    (n: string, topic: string) => F(`Tới lượt bạn ${n} rồi. Hôm nay mình xem cho bạn về ${topic} nhé.`),
  ],
  pickPrompt: [
    F('Trước mặt bạn là 3 lá bài úp. Bạn gõ số 1, 2 hoặc 3 để chọn 1 lá. Mình chờ bạn 5 giây thôi, chọn nhanh tay nhé.'),
    F('Ba lá bài đang úp trước mặt bạn đây. Gõ 1, 2 hoặc 3 để chọn lá dành cho mình, nhanh tay trong 5 giây nhé.'),
  ],
  autoPick: [
    (n: string) => F(`Hết 5 giây mà bạn ${n} chưa chọn nên mình tự chọn lá ở giữa cho bạn nhé.`),
  ],
  revealIntro: [
    (n: string) => F(`Lá bài của bạn ${n} đây.`),
    (n: string) => F(`Mình lật lá bài của bạn ${n} lên nhé.`),
  ],
  skip: [
    F('Mình chuyển sang bạn tiếp theo trong hàng chờ nhé.'),
  ],
  thank: [
    (n: string, g: string) => F(`Cảm ơn bạn ${n} đã tặng ${g} cho phòng. Mình ghi nhận tấm lòng của bạn nhé.`),
    (n: string, g: string) => F(`Bạn ${n} vừa tặng ${g}. Cảm ơn bạn nhiều, chúc bạn một buổi tối thật vui.`),
  ],
  follow: [
    (n: string) => F(`Chào bạn ${n} mới theo dõi phòng. Khi nào muốn xem bài thì gõ thẳng một chủ đề như tình yêu hoặc công việc nhé.`),
  ],
  idle: [
    F('Phòng đang vắng, ai muốn xem bài cho vui thì gõ một chủ đề: tình yêu, người cũ, công việc, tài chính, tương lai hoặc thông điệp vũ trụ.'),
    F('Mình vẫn đang ở đây chờ bạn tiếp theo. Gõ tình yêu, công việc hoặc tài chính là vào hàng chờ xem bài ngay.'),
    F('Trong lúc chờ bạn mới, mình nhắc lại là bài ở phòng mình chỉ để giải trí thôi nhé. Ai tò mò về lá bài của mình thì gõ một chủ đề là được.'),
  ],
};

const INTENT_KEYS = [' tarot ', ' xem bai ', ' boi bai '];

export class TarotRoom {
  sessions = new Map<string, Session>();
  activeUser: string | null = null;
  readings = 0;
  displayLines: string[] = [];
  lastDone: { nickname: string; topic: string; cardName: string } | null = null;
  private lastCompletion = new Map<string, { at: number; readingsAt: number }>();
  private cooldownTold = new Map<string, number>(); // username -> readingsAt đã nhắc
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
    this.sessions.clear();
    this.activeUser = null;
    this.readings = 0;
    this.displayLines = [];
    this.lastDone = null;
    this.lastCompletion.clear();
    this.cooldownTold.clear();
    this.lastIdleAt = now;
    return [
      { text: this.pick('welcome', LINES.welcome), main: true },
      { text: this.pick('howto', LINES.howto), main: true },
    ];
  }

  // ---------- hàng chờ ----------
  private waitingCard(): Session[] {
    return [...this.sessions.values()]
      .filter((s) => s.state === 'WAITING_CARD' && s.username !== this.activeUser)
      .sort((a, b) => a.topicAt - b.topicAt);
  }
  private active(): Session | null {
    return this.activeUser ? (this.sessions.get(this.activeUser) ?? null) : null;
  }
  private positionOf(s: Session): number {
    const ahead = this.waitingCard().filter((q) => q.topicAt < s.topicAt).length;
    return ahead + (this.activeUser && this.activeUser !== s.username ? 1 : 0) + 1;
  }
  private inCooldown(username: string, now: number): boolean {
    const c = this.lastCompletion.get(username);
    if (!c) return false;
    if (now - c.at >= GAME.cooldownMs) return false;
    return this.readings - c.readingsAt < GAME.cooldownOthers;
  }

  chat(e: ChatIn, now: number): Say[] {
    const p = plain(e.comment);
    const trimmed = p.trim();
    // BƯỚC 2: chỉ đúng người đang được gọi mới chọn lá được, người khác gõ số không ảnh hưởng
    const act = this.active();
    if (act && act.state === 'WAITING_CARD' && e.username === act.username && (trimmed === '1' || trimmed === '2' || trimmed === '3')) {
      return this.doPick(Number(trimmed) - 1, false, now);
    }
    const topic = detectTopic(p);
    const hasIntent = INTENT_KEYS.some((k) => p.includes(k));
    let existing = this.sessions.get(e.username);
    if (existing?.state === 'COMPLETED') {
      // phiên đã đóng: comment mới được xử lý như ý định mới (vẫn chịu khoá nhường lượt ở dưới)
      this.sessions.delete(e.username);
      existing = undefined;
    }

    if (existing) {
      // BƯỚC 1 (tiếp): người đang chọn chủ đề gõ chủ đề -> vào hàng chờ
      if (existing.state === 'WAITING_TOPIC' && topic) return this.setTopic(existing, topic, now);
      return []; // đang chờ/đang đọc/đã xong: các comment khác không làm nhầm phiên
    }

    // chống chiếm lượt: vừa xem xong thì phải nhường
    if (this.inCooldown(e.username, now)) {
      if ((topic || hasIntent) && this.cooldownTold.get(e.username) !== this.lastCompletion.get(e.username)?.readingsAt) {
        this.cooldownTold.set(e.username, this.lastCompletion.get(e.username)!.readingsAt);
        return [{ text: this.pickFn('cooldown', LINES.cooldown, e.spoken), ttl: GAME.chatterMaxWaitMs }];
      }
      return [];
    }

    // BƯỚC 1: gõ thẳng chủ đề (comment ngắn) hoặc TAROT + chủ đề -> vào hàng chờ luôn
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (topic && (hasIntent || wordCount <= 4 || p.includes(' xem '))) {
      if (this.waitingCard().length + (this.active() ? 1 : 0) >= GAME.queueMax) {
        return [{ text: this.pickFn('queueFull', LINES.queueFull, e.spoken), ttl: GAME.chatterMaxWaitMs }];
      }
      const s: Session = { ...this.personOf(e), state: 'WAITING_CARD', topic, topicAt: now, stateEndsAt: 0, drawn: null, picked: -1, auto: false, cardName: '' };
      this.sessions.set(e.username, s);
      const out: Say[] = [{ text: this.pickFn('join', LINES.join, e.spoken, this.positionOf(s)), ttl: GAME.chatterMaxWaitMs }];
      out.push(...this.maybeStartNext(now));
      return out;
    }
    // gõ TAROT / "xem bài" mà chưa có chủ đề -> mở phiên WAITING_TOPIC, nhắc chọn chủ đề
    if (hasIntent) {
      const choosing = [...this.sessions.values()].filter((s) => s.state === 'WAITING_TOPIC').length;
      if (choosing >= GAME.choosingMax) return [];
      const s: Session = { ...this.personOf(e), state: 'WAITING_TOPIC', topic: null, topicAt: 0, stateEndsAt: now + GAME.topicSec * 1000, drawn: null, picked: -1, auto: false, cardName: '' };
      this.sessions.set(e.username, s);
      return [{ text: this.pickFn('topicPrompt', LINES.topicPrompt, e.spoken), ttl: GAME.chatterMaxWaitMs }];
    }
    return [];
  }

  private personOf(e: ChatIn): Person {
    return { username: e.username, nickname: e.nickname, spoken: e.spoken, avatar: e.avatar };
  }

  private setTopic(s: Session, topic: TopicKey, now: number): Say[] {
    if (this.waitingCard().length + (this.active() ? 1 : 0) >= GAME.queueMax) {
      return [{ text: this.pickFn('queueFull', LINES.queueFull, s.spoken), ttl: GAME.chatterMaxWaitMs }];
    }
    s.topic = topic;
    s.topicAt = now;
    s.state = 'WAITING_CARD';
    s.stateEndsAt = 0;
    const out: Say[] = [{ text: this.pickFn('topicSet', LINES.topicSet, s.spoken, TOPICS[topic].label, this.positionOf(s)), ttl: GAME.chatterMaxWaitMs }];
    out.push(...this.maybeStartNext(now));
    return out;
  }

  /** Gọi người đầu hàng chờ lên chọn lá (nếu chưa có ai đang hoạt động) */
  private maybeStartNext(now: number): Say[] {
    if (this.activeUser) return [];
    const next = this.waitingCard()[0];
    if (!next || !next.topic) return [];
    const pool = [...CARDS];
    const drawn: Drawn[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(this.rand() * pool.length);
      const [card] = pool.splice(idx, 1);
      drawn.push({ card, reversed: this.rand() < GAME.reversedChance });
    }
    next.drawn = drawn;
    next.picked = -1;
    next.auto = false;
    next.stateEndsAt = now + GAME.pickSec * 1000;
    this.activeUser = next.username;
    this.displayLines = [];
    return [
      { text: this.pickFn('called', LINES.called, next.spoken, TOPICS[next.topic].label), main: true },
      { text: this.pick('pickPrompt', LINES.pickPrompt), main: true },
    ];
  }

  private doPick(idx: number, auto: boolean, now: number): Say[] {
    const cur = this.active();
    if (!cur || cur.state !== 'WAITING_CARD' || !cur.drawn || !cur.topic) return [];
    cur.picked = idx;
    cur.auto = auto;
    cur.state = 'READING';
    cur.stateEndsAt = now + GAME.revealSec * 1000;
    this.readings++;
    const { card, reversed } = cur.drawn[idx];
    cur.cardName = card.name;
    const parts = readingText(card, reversed, cur.topic, cur.spoken, Math.floor(this.rand() * 2));
    const raw: Say[] = [];
    if (auto) raw.push({ text: this.pickFn('autoPick', LINES.autoPick, cur.spoken), main: true });
    raw.push({ text: this.pickFn('revealIntro', LINES.revealIntro, cur.spoken), main: true });
    for (const part of parts) raw.push({ text: F(part), main: true });
    if (this.readings === 1 || this.readings % GAME.disclaimerEvery === 0) raw.push({ text: F(DISCLAIMER), main: true });
    this.displayLines = raw.map((l) => l.text.replace(/^F: /, ''));
    return raw;
  }

  private completeActive(now: number): Say[] {
    const cur = this.active();
    if (!cur) return [];
    cur.state = 'COMPLETED';
    cur.stateEndsAt = now + 5000; // giữ 5 giây để sân khấu/trang điều khiển kịp hiện trạng thái hoàn thành
    this.lastCompletion.set(cur.username, { at: now, readingsAt: this.readings });
    this.lastDone = { nickname: cur.nickname, topic: cur.topic ? TOPICS[cur.topic].label : '', cardName: cur.cardName };
    this.activeUser = null;
    this.displayLines = [];
    return this.maybeStartNext(now);
  }

  tick(now: number): Say[] {
    const out: Say[] = [];
    // dọn phiên COMPLETED đã quá 5 giây + phiên WAITING_TOPIC hết hạn chọn chủ đề
    for (const s of [...this.sessions.values()]) {
      if (s.state === 'COMPLETED' && now >= s.stateEndsAt) this.sessions.delete(s.username);
      else if (s.state === 'WAITING_TOPIC' && now >= s.stateEndsAt) this.sessions.delete(s.username);
    }
    const act = this.active();
    if (act && act.state === 'WAITING_CARD' && now >= act.stateEndsAt) out.push(...this.doPick(1, true, now));
    else if (act && act.state === 'READING' && now >= act.stateEndsAt) out.push(...this.completeActive(now));
    if (!this.activeUser) out.push(...this.maybeStartNext(now));
    if (!this.activeUser && this.sessions.size === 0 && now - this.lastIdleAt >= GAME.idleLineEveryMs) {
      this.lastIdleAt = now;
      out.push({ text: this.pick('idle', LINES.idle), ttl: GAME.chatterMaxWaitMs });
    }
    return out;
  }

  skip(now: number): Say[] {
    const act = this.active();
    if (!act && !this.waitingCard().length) return [];
    if (act) {
      this.sessions.delete(act.username);
      this.activeUser = null;
    }
    this.displayLines = [];
    const out: Say[] = [{ text: this.pick('skip', LINES.skip), main: true }];
    out.push(...this.maybeStartNext(now));
    return out;
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ text: this.pickFn('thank', LINES.thank, p.spoken, giftName), priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  follow(p: Person): Say[] {
    return [{ text: this.pickFn('follow', LINES.follow, p.spoken), ttl: GAME.chatterMaxWaitMs }];
  }

  hold(ms: number) {
    const act = this.active();
    if (act && (act.state === 'WAITING_CARD' || act.state === 'READING')) act.stateEndsAt += ms;
  }

  chatterWindow(now: number): boolean {
    const act = this.active();
    if (!act) return true;
    if (act.state === 'WAITING_CARD') return act.stateEndsAt - now > 5000;
    return false;
  }

  view(now: number): TarotView {
    const act = this.active();
    const secLeft = (s: Session) => Math.max(0, Math.ceil((s.stateEndsAt - now) / 1000));
    return {
      phase: act ? (act.state === 'READING' ? 'reveal' : 'offer') : 'idle',
      queue: this.waitingCard().map((q) => ({ nickname: q.nickname, avatar: q.avatar, topic: q.topic ? TOPICS[q.topic].label : '' })),
      choosing: [...this.sessions.values()]
        .filter((s) => s.state === 'WAITING_TOPIC')
        .map((s) => ({ nickname: s.nickname, avatar: s.avatar, secLeft: secLeft(s) })),
      sessions: [...this.sessions.values()].map((s) => ({
        nickname: s.nickname,
        state: s.state,
        topic: s.topic ? TOPICS[s.topic].label : '',
        secLeft: s.stateEndsAt ? secLeft(s) : 0,
      })),
      current: act
        ? {
            username: act.username,
            nickname: act.nickname,
            avatar: act.avatar,
            topic: act.topic ? TOPICS[act.topic].label : '',
            state: act.state,
            picked: act.picked,
            auto: act.auto,
            secLeft: secLeft(act),
            cards: (act.drawn ?? []).map((d, i) => ({
              numeral: d.card.numeral,
              name: d.card.name,
              en: d.card.en,
              symbol: d.card.symbol,
              c1: d.card.c1,
              c2: d.card.c2,
              keywords: d.card.keywords,
              reversed: d.reversed,
              faceUp: act.state === 'READING' && i === act.picked,
              img: `/assets/cards/${d.card.id}.jpg`, // ảnh bộ Rider-Waite ở public/assets/cards (thiếu file thì sân khấu tự dùng mặt vẽ CSS)
            })),
          }
        : null,
      lastDone: this.lastDone,
      readings: this.readings,
      displayLines: act && act.state === 'READING' ? this.displayLines : [],
      disclaimer: 'Xem tarot tại phòng chỉ mang tính giải trí, tham khảo cho vui.',
    };
  }
}
