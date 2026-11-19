/**
 * Lõi Cô Bói Tarot: hàng chờ XẾP THEO ĐIỂM (cơ chế riêng của game này, chủ kênh chốt
 * 2026-11-18, xem CLAUDE.md), khách ngồi vào bàn, trải 3 lá lật từng lá, đọc đoạn luận.
 * Hàm thuần theo thời gian truyền vào (now), không tự phát tiếng: trả về các câu Say.
 * Mọi câu đọc đều bắt đầu bằng "F: " (giọng nữ cô bói, xem live/voice.ts).
 */
import { DECK, isMajor } from './cards78';
import { GAME, POSITIONS } from './config';
import { composeReading, detectTheme, extractQuestion, type DrawnCard, type ThemeKey, THEMES } from './reading';
import { drawGuestChar, guestCharById, parseGenderCommand, type GuestChar, type GuestGender } from './guests';
import { maskBanned } from '../live/bannedWords';

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
export type Phase = 'idle' | 'welcome' | 'deal' | 'flip' | 'reading' | 'rest';
export type Pose = 'idle' | 'deal' | 'read';

interface Queued extends Person {
  question: string;
  theme: ThemeKey;
  joinedAt: number;
  seq: number; // thứ tự vào hàng chờ (đếm tăng dần): bằng điểm thì ai vào trước ở trước
  genderPref: GuestGender | null; // khách gõ NAM/NỮ lúc chờ: tới lượt bốc nhân vật đúng giới
}
interface Current {
  guest: Queued;
  drawn: DrawnCard[];
  dealt: number;
  flipped: number;
  reading: string[];
  charId: string | null; // nhân vật khách đang ngồi (pool trong guests.ts)
  demo: boolean; // true = khách mẫu (lượt xem thử lúc phòng vắng): không điểm, không vào hàng chờ
}

/** Sự kiện nhảy hạng trong hàng chờ (vì điểm của chính người đó tăng): sân khấu hiện toast "số cũ → số mới" */
export interface RankJump {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  from: number; // hạng trước (1 = đầu hàng chờ)
  to: number; // hạng sau, luôn nhỏ hơn from
  likes: number; // tổng số tim đã được tính của người này
  gifts: number; // tổng số lần tặng quà đã được tính của người này
  points: number; // điểm hiện tại (số lẻ)
  at: number; // mốc thời gian phát sinh (ms)
}

export interface FortuneView {
  phase: Phase;
  readings: number;
  queueCount: number;
  queue: { username: string; nickname: string; avatar: string; points: number; question: string }[];
  queueTop4: { username: string; nickname: string; avatar: string; points: number; question: string }[];
  queueMore: number; // số người ngoài top 4 (cho dòng "+N người nữa")
  rankJumps: RankJump[]; // nhảy hạng còn hạn hiển thị, tối đa 2, cũ trước mới sau
  nameplate: { nickname: string } | null; // khách đang ngồi: dữ liệu cho bảng tên trên ghế
  current: {
    username: string;
    nickname: string;
    avatar: string;
    question: string;
    themeLabel: string;
    points: number;
    dealt: number;
    flipped: number;
    demo: boolean; // khách đang ngồi là khách mẫu (sân khấu hiện nhãn "Khách mẫu / lượt xem thử")
    pose: Pose;
    guestChar: GuestChar | null;
    cards: { img: string; name: string; en: string; keywords: string; reversed: boolean; faceUp: boolean; position: string; major: boolean }[];
  } | null;
  readingText: string;
}

const F = (s: string) => `F: ${s}`;

/** Điểm hiện với đúng 1 chữ số thập phân, cắt xuống (0.99 -> "0.9", 123.5 -> "123.5") như bảng điểm mẫu */
export function formatPoints(n: number): string {
  return (Math.floor(Math.max(0, n) * 10 + 1e-6) / 10).toFixed(1);
}
const LINES = {
  welcome: [
    F('Xin chào cả nhà đã ghé phòng Cô Bói Tarot. Ở đây cô xem bài bằng bộ bài thật 78 lá, chỉ để giải trí và tham khảo cho vui thôi nhé.'),
    F('Chào mừng cả nhà đến với phòng của cô. Ai có câu hỏi trong lòng thì cứ gõ câu hỏi lên, cô ghi vào hàng chờ và xem lần lượt theo điểm.'),
  ],
  howto: [
    F('Cách vào xem rất dễ: bạn cứ gõ câu hỏi của mình lên, ví dụ hỏi chuyện tình cảm sắp tới thế nào, là cô ghi tên bạn vào hàng chờ. Điểm càng cao thì càng được lên trước: một trăm tim là một điểm, một bông hồng là một điểm.'),
    F('Mình nhắc lại cách chơi nhé: gõ câu hỏi của bạn lên chat là vào hàng chờ. Hàng chờ xếp theo điểm, điểm cao lên trước, một trăm tim bằng một điểm, quà một xu bằng một điểm.'),
  ],
  join: [
    (n: string, pos: number, pts: number) => F(`Cô ghi câu hỏi của bạn ${n} rồi. Bạn đang ở vị trí thứ ${pos} trong hàng chờ với ${pts} điểm, chờ cô một lát nhé.`),
    (n: string, pos: number, pts: number) => F(`Đã nhận câu hỏi của bạn ${n}. Vị trí hiện tại của bạn là thứ ${pos}, đang có ${pts} điểm. Tới lượt cô sẽ gọi tên bạn.`),
  ],
  queueFull: [
    (n: string) => F(`Bạn ${n} ơi, hàng chờ đang đầy rồi. Bạn chờ một lát rồi gõ lại câu hỏi giúp cô nhé.`),
  ],
  seat: [
    (n: string) => F(`Mời bạn ${n} ngồi vào bàn với cô. Cô nghe câu hỏi của bạn đây.`),
    (n: string) => F(`Tới lượt bạn ${n} rồi, ngồi xuống đây với cô nào. Để cô nghe chuyện của bạn.`),
  ],
  questionLine: [(q: string) => F(`Câu hỏi của bạn là: ${q}`)],
  deal: [
    F('Cô xào bài và trải ba lá úp cho bạn đây. Ba lá này sẽ trả lời theo ba ý: chuyện đang là gì, điều đang cần, và nên làm gì.'),
    F('Cô trải ba lá xuống bàn đây, mình lật từng lá một cho hồi hộp nhé.'),
  ],
  flipSuspense: [
    F('Nào, mình lật lá đầu tiên nhé.'),
    F('Cô lật lá tiếp theo đây, nghe kỹ nhé.'),
    F('Và lá cuối cùng, lá quan trọng nhất đây.'),
  ],
  flipLine: [
    (pos: string, name: string, dir: string) => F(`${pos}: lá ${name}, ${dir}.`),
  ],
  readingIntro: [
    F('Ba lá đã mở hết rồi. Giờ cô đọc cả trải bài cho bạn nghe đây.'),
    F('Đủ ba lá rồi nhé. Cô ghép cả ba lá lại thành lời giải cho bạn đây.'),
  ],
  skip: [F('Cô chuyển sang bạn tiếp theo trong hàng chờ nhé.')],
  endReading: [F('Cô khép phần xem này tại đây nhé, cảm ơn bạn đã ghé bàn của cô.')],
  thank: [
    (n: string, g: string, pts: number) => F(`Cảm ơn bạn ${n} đã tặng ${g} cho phòng. Cô cộng cho bạn ${pts} điểm vào hàng chờ nhé, dễ thương quá.`),
    (n: string, g: string, pts: number) => F(`Bạn ${n} vừa tặng ${g}. Cảm ơn bạn nhiều, bạn được cộng thêm ${pts} điểm đấy.`),
  ],
  thankNoPoints: [
    (n: string, g: string) => F(`Cảm ơn bạn ${n} đã tặng ${g} cho phòng nhé. Có câu hỏi thì cứ gõ lên chat, cô ghi vào hàng chờ cho bạn.`),
    (n: string, g: string) => F(`Bạn ${n} vừa tặng ${g}, cô cảm ơn nhiều nhé. Nhớ gõ câu hỏi lên chat để vào hàng chờ xem bài nha.`),
  ],
  follow: [
    (n: string) => F(`Chào bạn ${n} mới theo dõi phòng. Khi nào có câu hỏi thì cứ gõ lên chat, cô ghi vào hàng chờ cho bạn nhé.`),
  ],
  genderSwitch: [
    (n: string, g: GuestGender) => F(`Rồi, cô đổi nhân vật cho bạn ${n} sang bạn ${g === 'm' ? 'nam' : 'nữ'} nhé.`),
    (n: string, g: GuestGender) => F(`Được luôn, bạn ${n} giờ ngồi ghế với nhân vật ${g === 'm' ? 'nam' : 'nữ'} rồi đó.`),
  ],
  idle: [
    F('Phòng đang vắng, ai có câu hỏi trong lòng thì cứ gõ lên chat nhé. Cô xem lần lượt theo điểm trong hàng chờ.'),
    F('Cô vẫn đang ngồi đây chờ bạn tiếp theo. Gõ câu hỏi của bạn lên là cô ghi vào hàng chờ ngay.'),
    F('Trong lúc chờ bạn mới, cô nhắc lại là xem bài ở phòng cô chỉ để giải trí thôi nhé. Ai tò mò thì cứ mạnh dạn hỏi một câu.'),
    F('Bạn muốn chọn nhân vật ngồi ghế theo ý mình thì gõ một chữ NAM hoặc NỮ lên chat, cô đổi nhân vật cho bạn ngay nhé.'),
    F('Xem bài ở phòng cô chỉ để giải trí và tham khảo cho vui thôi, cả nhà đừng tin để quyết định việc quan trọng nhé. Ai có thắc mắc gì trong lòng thì cứ gõ câu hỏi lên, cô xem cho.'),
    F('Ai mới vào phòng thì cô chào nhé. Muốn xem bài, bạn cứ gõ câu hỏi của mình lên chat, cô ghi vào hàng chờ theo điểm, điểm cao thì được lên trước.'),
  ],
  demoIntro: [
    F('Chưa có bạn nào lên, cô xem thử một lượt mẫu nha. Ai muốn xem thật thì cứ gõ câu hỏi lên chat, cô nhường bàn cho bạn ngay.'),
    F('Phòng đang vắng, cô làm một lượt mẫu cho cả nhà xem cách chơi nhé. Bạn nào gõ câu hỏi lên là cô chuyển sang xem cho bạn liền.'),
  ],
  demoYield: [F('Có bạn thật lên rồi, cô khép lượt mẫu tại đây để nhường bàn cho bạn nhé.')],
  demoOutro: [
    F('Lượt mẫu xong rồi đó. Ai muốn cô xem cho mình thì cứ gõ câu hỏi lên chat nhé.'),
    F('Đó là một lượt mẫu cho cả nhà xem thử. Tới lượt bạn thì cứ gõ câu hỏi lên, cô xem y như vậy cho bạn.'),
  ],
};

/** Câu hỏi mẫu của khách mẫu: đủ các chủ đề để lượt mẫu trông như lượt thật */
export const DEMO_QUESTIONS = [
  'Cô ơi, chuyện tình cảm sắp tới của em thế nào?',
  'Công việc của em tháng này có thuận lợi không cô?',
  'Tiền bạc cuối năm của em ra sao hả cô?',
  'Em sắp thi, kết quả có tốt không cô?',
  'Gia đình em sắp tới có chuyện gì vui không cô?',
  'Em có nên đổi việc lúc này không cô?',
  'Chuyện học hành của em dạo này thế nào cô?',
  'Sắp tới em có gặp may mắn gì không cô?',
];

/** Username của khách mẫu: có dấu gạch ngang nên không bao giờ trùng username TikTok thật */
export const DEMO_USERNAME = 'khach-mau';

export const DISCLAIMER_LINE = 'Cô nhắc nhẹ cả phòng, xem tarot ở đây chỉ mang tính giải trí và tham khảo cho vui thôi nhé.';

export class FortuneRoom {
  phase: Phase = 'idle';
  phaseEndsAt = 0;
  private phaseStartedAt = 0;
  queue: Queued[] = [];
  current: Current | null = null;
  readings = 0;
  lastReading = '';
  // Điểm lẻ: điểm = điểm quà (xu) + tim đã tính / 100. Tim/quà CHỈ tính từ lúc người đó vào hàng chờ
  // hoặc đang ngồi xem (đúng dòng ghi chú trên sân khấu mẫu: "tim tính từ lúc em vào hàng").
  private giftPts = new Map<string, number>();
  private likeCnt = new Map<string, number>(); // tổng số tim đã được tính của từng người
  private giftCnt = new Map<string, number>(); // tổng số lần tặng quà đã được tính của từng người
  private jumps: RankJump[] = [];
  private jumpSeq = 0;
  private lastJumpAt = new Map<string, number>();
  private lastNow = 0; // mốc thời gian gần nhất engine được gọi (dự phòng khi addLikes/addGiftPoints không truyền now)
  private lastCharId: string | null = null; // nhân vật của khách gần nhất: khách sau tránh trùng
  private lastIdleAt = 0;
  private lastLineIdx = new Map<string, number>();
  // Khách mẫu: phòng trống liên tục từ mốc này (có khách ngồi hoặc có người chờ là mốc bị đặt lại)
  private emptySince: number;
  private demoYield = false; // khách thật đã vào hàng trong lúc khách mẫu đang xem: lượt mẫu phải nhường nhanh
  private demoYieldAnnounced = false; // đã nói câu nhường bàn trong pha đọc của lượt mẫu chưa
  private demoCutVoice = false; // lượt mẫu đang đọc mà phải nhường: trang stage bỏ các câu đang chờ đọc 1 lần

  constructor(
    private now0: number,
    private rand: () => number = Math.random,
  ) {
    this.lastIdleAt = now0;
    this.emptySince = now0;
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

  pointsOf(username: string): number {
    const key = username.toLowerCase();
    return (this.giftPts.get(key) ?? 0) + (this.likeCnt.get(key) ?? 0) / GAME.likesPerPoint;
  }

  /** Người này có đang "trong phòng tính điểm" không: đang ở hàng chờ hoặc đang ngồi xem */
  private isActiveMember(username: string): boolean {
    const key = username.toLowerCase();
    return this.current?.guest.username.toLowerCase() === key || this.queue.some((q) => q.username.toLowerCase() === key);
  }

  /** Hạng trong hàng chờ (1 = đầu hàng), 0 nếu không ở trong hàng */
  private rankInQueue(username: string): number {
    const key = username.toLowerCase();
    const i = this.queue.findIndex((q) => q.username.toLowerCase() === key);
    return i < 0 ? 0 : i + 1;
  }

  private joinSeq = 0;
  private sortQueue() {
    this.queue.sort((a, b) => {
      const d = this.pointsOf(b.username) - this.pointsOf(a.username);
      return d !== 0 ? d : a.seq - b.seq;
    });
  }

  /**
   * Sau khi điểm của 1 người trong hàng chờ tăng và hàng đã xếp lại: nếu hạng của chính họ
   * tốt lên thì ghi 1 sự kiện nhảy hạng cho sân khấu hiện toast. Chặn spam: mỗi người cách
   * nhau ít nhất rankToastMinIntervalMs mới báo lần nữa (hạng thật vẫn đổi bình thường).
   */
  private trackRankJump(username: string, rankBefore: number, now: number) {
    if (rankBefore <= 0) return; // không ở trong hàng trước đó (mới vào / đang ngồi): không báo
    const rankAfter = this.rankInQueue(username);
    if (rankAfter <= 0 || rankAfter >= rankBefore) return; // hạng không đổi hoặc tụt: không báo
    const key = username.toLowerCase();
    if (now - (this.lastJumpAt.get(key) ?? -Infinity) < GAME.rankToastMinIntervalMs) return;
    this.lastJumpAt.set(key, now);
    const entry = this.queue[rankAfter - 1];
    this.jumps.push({
      id: ++this.jumpSeq,
      username: entry.username,
      nickname: entry.nickname,
      avatar: entry.avatar,
      from: rankBefore,
      to: rankAfter,
      likes: this.likeCnt.get(key) ?? 0,
      gifts: this.giftCnt.get(key) ?? 0,
      points: this.pointsOf(key),
      at: now,
    });
    if (this.jumps.length > 12) this.jumps = this.jumps.slice(-12);
  }

  /** Tim: chỉ tính khi người thả đang ở hàng chờ hoặc đang ngồi xem; điểm lẻ = tổng tim / 100 */
  addLikes(p: Person, count: number, now?: number) {
    if (!this.isActiveMember(p.username)) return;
    const key = p.username.toLowerCase();
    const add = Math.max(0, Math.floor(count));
    if (add <= 0) return;
    const rankBefore = this.rankInQueue(p.username);
    this.likeCnt.set(key, (this.likeCnt.get(key) ?? 0) + add);
    this.sortQueue();
    this.trackRankJump(p.username, rankBefore, now ?? this.lastNow);
  }

  /** Quà: xu của quà thành điểm (1 xu = 1 điểm, bông hồng 1 xu = 1 điểm); chỉ tính khi người tặng đang ở hàng chờ/đang ngồi */
  addGiftPoints(p: Person, coins: number, now?: number) {
    const add = Math.max(0, Math.floor(coins));
    if (add <= 0 || !this.isActiveMember(p.username)) return 0;
    const key = p.username.toLowerCase();
    const rankBefore = this.rankInQueue(p.username);
    this.giftPts.set(key, (this.giftPts.get(key) ?? 0) + add);
    this.giftCnt.set(key, (this.giftCnt.get(key) ?? 0) + 1);
    this.sortQueue();
    this.trackRankJump(p.username, rankBefore, now ?? this.lastNow);
    return add;
  }

  newSession(now: number): Say[] {
    this.phase = 'idle';
    this.phaseEndsAt = 0;
    this.phaseStartedAt = now;
    this.queue = [];
    this.current = null;
    this.readings = 0;
    this.lastReading = '';
    this.giftPts.clear();
    this.likeCnt.clear();
    this.giftCnt.clear();
    this.jumps = [];
    this.lastJumpAt.clear();
    this.lastNow = now;
    this.lastCharId = null;
    this.lastIdleAt = now;
    this.emptySince = now;
    this.demoYield = false;
    this.demoYieldAnnounced = false;
    this.demoCutVoice = false;
    return [
      { text: this.pick('welcome', LINES.welcome), main: true },
      { text: this.pick('howto', LINES.howto), main: true },
    ];
  }

  chat(e: ChatIn, now: number): Say[] {
    this.lastNow = now;
    if (e.safe === false) return [];
    // Lệnh đổi nhân vật: bình luận đúng 1 chữ NAM / NỮ (không dấu cũng được)
    const gender = parseGenderCommand(e.comment);
    if (gender) {
      if (this.current?.guest.username === e.username) {
        const cur = this.current;
        const nextChar = drawGuestChar(this.rand, { gender, excludeId: cur.charId });
        if (nextChar && nextChar.id !== cur.charId) {
          cur.charId = nextChar.id;
          this.lastCharId = nextChar.id;
        }
        return [{ text: this.pickFn('genderSwitch', LINES.genderSwitch, e.spoken, gender), ttl: GAME.chatterMaxWaitMs }];
      }
      const waiting = this.queue.find((x) => x.username === e.username);
      if (waiting) waiting.genderPref = gender;
      return [];
    }
    const q = extractQuestion(e.comment);
    if (!q) return [];
    if (this.current?.guest.username === e.username) return [];
    const question = maskBanned(q).slice(0, GAME.questionMaxChars);
    const existing = this.queue.find((x) => x.username === e.username);
    if (existing) {
      existing.question = question;
      existing.theme = detectTheme(question);
      existing.nickname = e.nickname;
      existing.avatar = e.avatar;
      return [];
    }
    if (this.queue.length >= GAME.queueMax) {
      return [{ text: this.pickFn('queueFull', LINES.queueFull, e.spoken), ttl: GAME.chatterMaxWaitMs }];
    }
    this.queue.push({ username: e.username, nickname: e.nickname, spoken: e.spoken, avatar: e.avatar, question, theme: detectTheme(question), joinedAt: now, seq: this.joinSeq++, genderPref: null });
    // khách thật vào hàng trong lúc khách mẫu đang xem: lượt mẫu phải nhường bàn nhanh
    if (this.current?.demo) this.demoYield = true;
    this.sortQueue();
    const pos = this.queue.findIndex((x) => x.username === e.username) + 1;
    const out: Say[] = [{ text: this.pickFn('join', LINES.join, e.spoken, pos, this.pointsOf(e.username)), ttl: GAME.chatterMaxWaitMs }];
    if (this.phase === 'idle') out.push(...this.seatNext(now));
    return out;
  }

  private seatNext(now: number): Say[] {
    this.sortQueue();
    const guest = this.queue.shift();
    if (!guest) {
      this.phase = 'idle';
      this.current = null;
      return [];
    }
    // khách đã lên ghế: bỏ các toast nhảy hạng còn treo của họ (toast chỉ dành cho người còn chờ)
    this.jumps = this.jumps.filter((j) => j.username !== guest.username);
    this.beginTurn(guest, false, now);
    return [
      { text: this.pickFn('seat', LINES.seat, guest.spoken), main: true },
      { text: this.pickFn('questionLine', LINES.questionLine, guest.question), main: true },
    ];
  }

  /** Mở một lượt xem: rút 3 lá khác nhau từ đủ 78 lá, bốc nhân vật khách, vào pha welcome */
  private beginTurn(guest: Queued, demo: boolean, now: number) {
    const pool = [...DECK];
    const drawn: DrawnCard[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(this.rand() * pool.length);
      const [card] = pool.splice(idx, 1);
      drawn.push({ card, reversed: this.rand() < GAME.reversedChance });
    }
    const ch = drawGuestChar(this.rand, { gender: guest.genderPref, excludeId: this.lastCharId });
    if (ch) this.lastCharId = ch.id;
    this.current = { guest, drawn, dealt: 0, flipped: 0, reading: [], charId: ch?.id ?? null, demo };
    this.demoYield = false;
    this.demoYieldAnnounced = false;
    this.lastReading = '';
    this.phase = 'welcome';
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + GAME.welcomeSec * 1000;
  }

  /**
   * Khách mẫu: phòng trống đủ lâu thì cô tự xem một lượt mẫu (nhãn rõ ràng trên sân khấu).
   * Không vào hàng chờ, không điểm, không tính vào số lượt đã xem. Khách thật vào hàng
   * là lượt mẫu nhường (xem demoYield trong tick).
   */
  private seatDemo(now: number): Say[] {
    const question = this.pick('demoQ', DEMO_QUESTIONS);
    const guest: Queued = {
      username: DEMO_USERNAME,
      nickname: 'Khách mẫu',
      spoken: 'bạn khách mẫu',
      avatar: '',
      question,
      theme: detectTheme(question),
      joinedAt: now,
      seq: -1,
      genderPref: null,
    };
    this.beginTurn(guest, true, now);
    return [
      { text: this.pick('demoIntro', LINES.demoIntro), main: true },
      { text: this.pickFn('questionLine', LINES.questionLine, question), main: true },
    ];
  }

  private startDeal(now: number): Say[] {
    this.phase = 'deal';
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + GAME.dealStepMs * 3 + GAME.dealTailMs;
    return [{ text: this.pick('deal', LINES.deal), main: true }];
  }

  private startFlip(now: number): Say[] {
    this.phase = 'flip';
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + GAME.flipStepMs * 3 + GAME.flipTailMs;
    return [];
  }

  private flipOne(now: number): Say[] {
    const cur = this.current;
    if (!cur) return [];
    const i = cur.flipped;
    const d = cur.drawn[i];
    cur.flipped++;
    const dir = d.reversed ? 'chiều ngược' : 'chiều xuôi';
    return [
      { text: this.pick('flipSuspense', LINES.flipSuspense), main: true },
      { text: this.pickFn('flipLine', LINES.flipLine, POSITIONS[i], d.card.name, dir), main: true },
    ];
  }

  private startReading(now: number): Say[] {
    const cur = this.current;
    if (!cur) return [];
    cur.reading = composeReading(
      { guestName: cur.guest.spoken, theme: cur.guest.theme, drawn: cur.drawn },
      (key, arr, n) => this.pickFn(key, arr as readonly ((x: string) => string)[], n),
      (key, arr) => this.pick(key, arr),
    );
    this.lastReading = cur.reading.join(' ');
    this.phase = 'reading';
    this.phaseStartedAt = now;
    // Lượt mẫu không tính vào số lượt đã xem; lời giải đầy đủ vẫn hiện chữ trên sân khấu.
    // Lượt mẫu đang phải nhường bàn: giọng chỉ đọc câu mở + câu nhường, pha đọc rút ngắn.
    if (cur.demo && this.demoYield) {
      this.phaseEndsAt = now + 4000;
      this.demoYieldAnnounced = true;
      return [
        { text: this.pick('readingIntro', LINES.readingIntro), main: true },
        { text: this.pick('demoYield', LINES.demoYield), main: true },
      ];
    }
    if (!cur.demo) this.readings++;
    this.phaseEndsAt = now + GAME.readingSec * 1000;
    const out: Say[] = [{ text: this.pick('readingIntro', LINES.readingIntro), main: true }];
    for (const s of cur.reading) out.push({ text: F(s), main: true });
    if (!cur.demo && (this.readings === 1 || this.readings % GAME.disclaimerEvery === 0)) out.push({ text: F(DISCLAIMER_LINE), main: true });
    return out;
  }

  private startRest(now: number, sec = GAME.restSec): Say[] {
    const wasDemo = this.current?.demo ?? false;
    this.current = null;
    this.phase = 'rest';
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + sec * 1000;
    // Khép lượt mẫu bình thường (không bị nhường): cô chào tiễn và mời khách thật gõ câu hỏi
    if (wasDemo && !this.demoYield) return [{ text: this.pick('demoOutro', LINES.demoOutro), ttl: GAME.chatterMaxWaitMs }];
    return [];
  }

  /** Trang stage gọi sau mỗi tick: true đúng 1 lần khi lượt mẫu đang đọc phải bỏ câu chờ để nhường bàn */
  consumeDemoCut(): boolean {
    const c = this.demoCutVoice;
    this.demoCutVoice = false;
    return c;
  }

  tick(now: number): Say[] {
    this.lastNow = now;
    const cur = this.current;
    // Phòng còn người (đang ngồi hoặc đang chờ) thì mốc "trống phòng" đặt lại từ đầu
    if (cur || this.queue.length) this.emptySince = now;
    switch (this.phase) {
      case 'idle': {
        if (this.queue.length) return this.seatNext(now);
        // Trống liên tục đủ lâu: khách mẫu ngồi vào xem thử để sân khấu không đứng yên
        if (now - this.emptySince >= GAME.demoAfterMs) return this.seatDemo(now);
        if (now - this.lastIdleAt >= GAME.idleLineEveryMs) {
          this.lastIdleAt = now;
          return [{ text: this.pick('idle', LINES.idle), ttl: GAME.chatterMaxWaitMs }];
        }
        return [];
      }
      case 'welcome':
        return now >= this.phaseEndsAt ? this.startDeal(now) : [];
      case 'deal': {
        if (!cur) return [];
        const should = Math.min(3, Math.floor((now - this.phaseStartedAt) / GAME.dealStepMs) + 1);
        if (should > cur.dealt) cur.dealt = should;
        return now >= this.phaseEndsAt ? this.startFlip(now) : [];
      }
      case 'flip': {
        if (!cur) return [];
        // Lượt mẫu đang nhường: lật nốt các lá còn lại với nhịp rút gọn (không cắt giữa chừng 1 lá)
        const step = cur.demo && this.demoYield ? GAME.demoFlipStepMs : GAME.flipStepMs;
        const should = Math.min(3, Math.floor((now - this.phaseStartedAt) / step));
        if (should > cur.flipped) return this.flipOne(now);
        const done = cur.demo && this.demoYield ? cur.flipped >= 3 : now >= this.phaseEndsAt && cur.flipped >= 3;
        return done ? this.startReading(now) : [];
      }
      case 'reading': {
        // Khách thật vào hàng giữa lúc lượt mẫu đang đọc: nói câu nhường, bỏ các câu luận đang
        // chờ đọc (câu đang đọc dở thì đọc nốt), rút pha đọc xuống rất ngắn rồi nghỉ ngắn
        if (cur?.demo && this.demoYield && !this.demoYieldAnnounced) {
          this.demoYieldAnnounced = true;
          this.demoCutVoice = true;
          this.phaseEndsAt = Math.min(this.phaseEndsAt, now + 1200);
          return [{ text: this.pick('demoYield', LINES.demoYield), main: true }];
        }
        if (now >= this.phaseEndsAt) return this.startRest(now, cur?.demo && this.demoYield ? GAME.demoRestSec : GAME.restSec);
        return [];
      }
      case 'rest': {
        if (now >= this.phaseEndsAt) {
          if (this.queue.length) return this.seatNext(now);
          this.phase = 'idle';
          this.lastIdleAt = now;
        }
        return [];
      }
    }
  }

  /** Chủ kênh bấm Bỏ lượt / Sang khách tiếp */
  skip(now: number): Say[] {
    if (!this.current && !this.queue.length) return [];
    const out: Say[] = [{ text: this.pick('skip', LINES.skip), main: true }];
    this.startRest(now, 2);
    return out;
  }

  /** Chủ kênh bấm Kết thúc phần đọc: khép lượt hiện tại sớm */
  endReading(now: number): Say[] {
    if (!this.current) return [];
    const out: Say[] = [{ text: this.pick('endReading', LINES.endReading), main: true }];
    this.startRest(now, 2);
    return out;
  }

  /** Trang điều khiển xoá 1 người khỏi hàng chờ */
  removeFromQueue(username: string) {
    this.queue = this.queue.filter((q) => q.username !== username);
  }

  thank(p: Person, giftName: string, pointsAdded: number): Say[] {
    // Chưa vào hàng chờ thì quà chỉ được cảm ơn, không cộng điểm: dùng mẫu câu không nhắc điểm
    const text =
      pointsAdded > 0
        ? this.pickFn('thank', LINES.thank, p.spoken, giftName, pointsAdded)
        : this.pickFn('thankNoPoints', LINES.thankNoPoints, p.spoken, giftName);
    return [{ text, priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  follow(p: Person): Say[] {
    return [{ text: this.pickFn('follow', LINES.follow, p.spoken), ttl: GAME.chatterMaxWaitMs }];
  }

  /** Đang đọc câu chính thì đồng hồ pha đứng lại (cả mốc bắt đầu pha để nhịp trải/lật không nhảy) */
  hold(ms: number) {
    if (this.phase !== 'idle') {
      this.phaseEndsAt += ms;
      this.phaseStartedAt += ms;
    }
  }

  /** Câu nói thêm chỉ đọc lúc phòng trống hoặc đang nghỉ giữa hai lượt */
  chatterWindow(now: number): boolean {
    void now;
    return this.phase === 'idle' || this.phase === 'rest';
  }

  view(now: number): FortuneView {
    this.lastNow = now;
    const cur = this.current;
    const pose: Pose = !cur ? 'idle' : this.phase === 'deal' || this.phase === 'flip' ? 'deal' : this.phase === 'reading' ? 'read' : 'idle';
    const queueItems = this.queue.map((q) => ({
      username: q.username,
      nickname: q.nickname,
      avatar: q.avatar,
      points: this.pointsOf(q.username),
      question: q.question,
    }));
    // Toast nhảy hạng: còn hạn hiển thị, người đó còn trong hàng chờ, tối đa 2 cái mới nhất
    const rankJumps = this.jumps.filter((j) => now - j.at < GAME.rankToastMs && this.rankInQueue(j.username) > 0).slice(-2);
    return {
      phase: this.phase,
      readings: this.readings,
      queueCount: this.queue.length,
      queue: queueItems,
      queueTop4: queueItems.slice(0, GAME.queueTopN),
      queueMore: Math.max(0, this.queue.length - GAME.queueTopN),
      rankJumps,
      nameplate: cur ? { nickname: cur.guest.nickname } : null,
      current: cur
        ? {
            username: cur.guest.username,
            nickname: cur.guest.nickname,
            avatar: cur.guest.avatar,
            question: cur.guest.question,
            themeLabel: THEMES[cur.guest.theme].label,
            points: this.pointsOf(cur.guest.username),
            dealt: cur.dealt,
            flipped: cur.flipped,
            demo: cur.demo,
            pose,
            guestChar: guestCharById(cur.charId),
            cards: cur.drawn.map((d, i) => ({
              img: d.card.img,
              name: d.card.name,
              en: d.card.en,
              keywords: d.card.keywords,
              reversed: d.reversed,
              faceUp: i < cur.flipped,
              position: POSITIONS[i],
              major: isMajor(d.card),
            })),
          }
        : null,
      readingText: this.phase === 'reading' || this.phase === 'rest' ? this.lastReading : '',
    };
  }
}
