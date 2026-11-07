/**
 * Lõi Trang Trí Tết — Nhà Của Chúng Ta.
 * Người xem bình luận tên một món đồ bất kỳ -> bé An cầm món đồ đi treo lên ngôi nhà.
 * - Khớp được thư viện hình (assets.ts): treo đúng hình đó (con chó -> hình con chó).
 * - Chưa có hình sẵn: bé An làm một TẤM THẸ TÊN ghi đúng chữ người chơi gõ và treo lên (không bao giờ mất lượt).
 * Mỗi người 1 món đang chờ tối đa, giãn cách 8 giây; hàng chờ xử lý lần lượt: đi -> treo -> ăn mừng.
 * Hàm thuần theo thời gian truyền vào (now). Mọi câu đọc bắt đầu bằng "F: " (giọng nữ).
 */
import { GAME } from './config';
import { ASSETS, matchAsset, normText, type ZoneKey } from './assets';

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
export interface ChatIn extends Person {
  comment: string;
  safe: boolean;
}

const F = (s: string) => `F: ${s}`;

const LINES = {
  welcome: [
    F('Chào mừng cả nhà ghé Nhà Của Chúng Ta! Hôm nay mình cùng nhau trang trí nhà đón Tết nhé.'),
    F('Nhà Của Chúng Ta mở cửa rồi đây, cả nhà vào trang trí nhà đón Tết cùng bé An nào.'),
  ],
  howto: [
    F('Cách chơi dễ lắm: bạn gõ tên một món đồ bất kỳ, ví dụ lồng đèn, bánh chưng, con chó hay máy bay, bé An sẽ cầm món đồ đó treo lên nhà cho bạn.'),
    F('Ai muốn treo gì thì cứ gõ tên món đồ vào bình luận nhé, bé An treo lên nhà ngay. Gõ con mèo, con chó, hoa mai gì cũng được hết.'),
  ],
  start: [
    (n: string, item: string) => F(`Bạn ${n} xin treo ${item} nè, bé An mang đi treo ngay đây.`),
    (n: string, item: string) => F(`Tới món ${item} của bạn ${n} rồi, xem bé An treo ở đâu nè.`),
    (n: string, item: string) => F(`Bé An đang treo ${item} cho bạn ${n} đó, chờ một chút xíu nhé.`),
  ],
  tag: [
    (n: string, label: string) => F(`Món ${label} này nhà mình chưa có hình sẵn, bé An làm tặng bạn ${n} một tấm thẻ ghi tên món đồ, treo lên nhà luôn nè.`),
  ],
  follow: [
    (n: string) => F(`Chào bạn ${n} mới ghé nhà, bé An treo tặng bạn một bao lì xì lấy may đầu năm nè.`),
  ],
  likeGoal: [
    F('Đủ một trăm tim rồi cả nhà ơi, bắn pháo hoa ăn mừng thôi! Nhà mình càng lúc càng rực rỡ rồi.'),
  ],
  queueFull: [
    (n: string) => F(`Bạn ${n} ơi, bé An đang treo nhiều đồ quá, bạn chờ một lát rồi gõ lại món đồ giúp mình nhé.`),
  ],
  thank: [
    (n: string, g: string) => F(`Cảm ơn bạn ${n} đã tặng ${g} cho nhà mình nhé, chúc bạn năm mới nhiều sức khỏe và may mắn.`),
    (n: string, g: string) => F(`Bạn ${n} tặng ${g} nè, cả nhà cảm ơn bạn nhiều lắm.`),
  ],
  idle: [
    F('Nhà mình đang chờ thêm đồ trang trí đó, bạn gõ tên một món đồ là bé An treo lên ngay.'),
    F('Trên mái nhà còn chỗ treo lồng đèn nè, cây mai cũng đang chờ bao lì xì đó cả nhà.'),
    F('Bạn gõ thử con chó, con mèo hay máy bay xem, bé An treo được hết đó.'),
  ],
};

// Vị trí tâm của từng ô treo trên sân khấu 1080x1920 (khớp hình nhà trong DecorStage)
export const SLOTS: Record<ZoneKey, { x: number; y: number }[]> = {
  troi: [
    { x: 140, y: 150 }, { x: 340, y: 105 }, { x: 570, y: 165 }, { x: 800, y: 100 }, { x: 960, y: 175 },
    { x: 235, y: 275 }, { x: 705, y: 275 }, { x: 915, y: 320 },
  ],
  mai: [230, 355, 480, 605, 730, 855, 960].map((x) => ({ x, y: 512 })),
  cua: [
    { x: 448, y: 1045 }, { x: 712, y: 1045 }, { x: 580, y: 782 }, { x: 580, y: 1090 },
  ],
  cuaSo: [
    { x: 330, y: 805 }, { x: 830, y: 805 }, { x: 330, y: 1005 }, { x: 830, y: 1005 },
  ],
  tuong: [
    { x: 248, y: 565 }, { x: 918, y: 565 }, { x: 425, y: 590 }, { x: 742, y: 590 },
    { x: 238, y: 1195 }, { x: 928, y: 1210 },
  ],
  cay: [
    { x: 60, y: 1300 }, { x: 150, y: 1280 }, { x: 95, y: 1365 }, { x: 45, y: 1420 },
    { x: 160, y: 1445 }, { x: 110, y: 1505 }, { x: 188, y: 1355 }, { x: 70, y: 1475 },
  ],
  san: [
    { x: 185, y: 1605 }, { x: 330, y: 1630 }, { x: 480, y: 1605 }, { x: 625, y: 1635 },
    { x: 770, y: 1605 }, { x: 905, y: 1630 },
  ],
};

const REQUEST_HEADS = ['treo ', 'cho ', 'them ', 'xin ', 've ', 'lam ', 'hang '];
const CHAT_STOP = new Set([
  'hay qua', 'hay', 'dep qua', 'dep', 'haha', 'hahaha', 'hihi', 'ok', 'oke', 'hi', 'hello', 'chao ca nha',
  'cam on', 'xinh', 'tot', 'gioi', 'tuyet', 'wow', 'cute', 'de thuong', 'khong', 'co', 'roi', 'ne', 'di',
  'oi', 'nhe', 'nha', 'luon', 'qua', 'that', 'cai nay', 'sao', 'gi', 'ai', 'dau', 'chua', 'nua', 'may',
  'like', 'follow', 'share', 'live hay qua', 'hay ghe', 'xem', 'do', 'a', 'o', 'e', 'u', 'la', 'cua', 'va',
]);

export interface PlacedItem {
  uid: number;
  assetId: string; // 'tag' = thẻ tên
  label?: string;
  name: string;
  x: number;
  y: number;
  s: number;
  rot: number;
  zone: ZoneKey;
  by: string;
  byName: string;
}
interface Job {
  p: Person;
  assetId: string;
  label?: string;
  name: string;
  zones: ZoneKey[];
}
export interface DecorView {
  placed: PlacedItem[];
  current: { nickname: string; name: string; assetId: string; label?: string; phase: 'walk' | 'hang' | 'cheer'; x: number; y: number } | null;
  queue: { nickname: string; name: string }[];
  total: number;
  likes: number;
  likeGoal: number;
  fireworksAt: number;
  top: { nickname: string; count: number }[];
  feed: { nickname: string; name: string }[];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class DecorRoom {
  placed: PlacedItem[] = [];
  private queue: Job[] = [];
  private current: (Job & { phase: 'walk' | 'hang' | 'cheer'; phaseEndsAt: number; x: number; y: number; s: number; rot: number; zone: ZoneKey }) | null = null;
  private lastReq = new Map<string, number>();
  private counts = new Map<string, { nickname: string; count: number }>();
  private feed: { nickname: string; name: string }[] = [];
  private likes = 0;
  private nextGoal = GAME.likeGoal;
  fireworksAt = 0;
  private uidSeq = 1;
  private lastIdleAt = 0;
  private lastFullTellAt = 0;
  private lastLineIdx = new Map<string, number>();

  constructor(private now0: number) {
    this.lastIdleAt = now0;
  }

  private pick(key: string, arr: readonly string[]): string {
    let i = Math.floor(Math.random() * arr.length);
    if (arr.length > 1 && i === this.lastLineIdx.get(key)) i = (i + 1) % arr.length;
    this.lastLineIdx.set(key, i);
    return arr[i];
  }
  private pickFn<A extends unknown[]>(key: string, arr: readonly ((...a: A) => string)[], ...args: A): string {
    let i = Math.floor(Math.random() * arr.length);
    if (arr.length > 1 && i === this.lastLineIdx.get(key)) i = (i + 1) % arr.length;
    this.lastLineIdx.set(key, i);
    return arr[i](...args);
  }

  newSession(now: number): Say[] {
    this.placed = [];
    this.queue = [];
    this.current = null;
    this.lastReq.clear();
    this.counts.clear();
    this.feed = [];
    this.likes = 0;
    this.nextGoal = GAME.likeGoal;
    this.fireworksAt = 0;
    this.lastIdleAt = now;
    return [
      { text: this.pick('welcome', LINES.welcome), main: true },
      { text: this.pick('howto', LINES.howto), main: true },
    ];
  }

  private slotFor(zones: ZoneKey[], seedKey: string): { x: number; y: number; s: number; rot: number; zone: ZoneKey } {
    const zoneScale: Record<ZoneKey, number> = { troi: 1, mai: 1, cua: 1, cuaSo: 0.9, tuong: 1, cay: 0.78, san: 1 };
    for (const z of zones) {
      const used = this.placed.filter((p) => p.zone === z).length;
      const slots = SLOTS[z];
      const h = hash(seedKey + z + used);
      if (used < slots.length) {
        const sl = slots[used];
        return { x: sl.x, y: sl.y, s: (0.92 + (h % 3) * 0.07) * zoneScale[z], rot: ((h % 5) - 2) * 2, zone: z };
      }
    }
    // vùng ưu tiên đã kín ô: xếp chồng lệch nhẹ trong vùng đầu tiên
    const z = zones[0];
    const slots = SLOTS[z];
    const used = this.placed.filter((p) => p.zone === z).length;
    const sl = slots[used % slots.length];
    const h = hash(seedKey + z + used);
    return { x: sl.x + ((h % 61) - 30), y: sl.y + ((h >> 3) % 41) - 20, s: 0.85, rot: ((h % 5) - 2) * 2, zone: z };
  }

  chat(e: ChatIn, now: number): Say[] {
    if (!e.safe) return [];
    const raw = e.comment.trim();
    if (!raw) return [];
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length > GAME.maxCommentWords) return [];
    const norm = normText(raw);
    const asset = matchAsset(raw);
    let job: Job | null = null;
    if (asset) {
      job = { p: e, assetId: asset.id, name: asset.name, zones: asset.zones };
    } else {
      // chưa có hình sẵn: chỉ nhận khi bình luận trông như một món đồ (ngắn, hoặc mở đầu bằng động từ xin treo)
      const isRequest = REQUEST_HEADS.some((h) => `${norm} `.startsWith(h)) || (words.length <= 3 && !CHAT_STOP.has(norm));
      if (!isRequest) return [];
      const cleanLabel = raw.replace(/\s+/g, ' ').slice(0, 30);
      job = { p: e, assetId: 'tag', label: cleanLabel, name: `thẻ "${cleanLabel}"`, zones: ['tuong', 'cay', 'mai'] };
    }
    if (now - (this.lastReq.get(e.username) ?? 0) < GAME.cooldownMs) return [];
    if (this.queue.some((q) => q.p.username === e.username) || this.current?.p.username === e.username) return [];
    if (this.queue.length >= GAME.queueMax) {
      if (now - this.lastFullTellAt > 15_000) {
        this.lastFullTellAt = now;
        return [{ text: this.pickFn('queueFull', LINES.queueFull, e.spoken), ttl: GAME.chatterMaxWaitMs }];
      }
      return [];
    }
    this.lastReq.set(e.username, now);
    this.queue.push(job);
    return [];
  }

  follow(p: Person, now: number): Say[] {
    const liXi = ASSETS.find((a) => a.id === 'bao-li-xi')!;
    if (this.queue.length < GAME.queueMax && !this.queue.some((q) => q.p.username === p.username)) {
      this.queue.push({ p, assetId: liXi.id, name: liXi.name, zones: liXi.zones });
    }
    void now;
    return [{ text: this.pickFn('follow', LINES.follow, p.spoken), priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  like(count: number, now: number): Say[] {
    this.likes += Math.max(0, count);
    if (this.likes >= this.nextGoal) {
      this.nextGoal += GAME.likeGoal;
      this.fireworksAt = now;
      return [{ text: this.pick('likeGoal', LINES.likeGoal), priority: true, ttl: GAME.giftLineMaxWaitMs }];
    }
    return [];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ text: this.pickFn('thank', LINES.thank, p.spoken, giftName), priority: true, ttl: GAME.giftLineMaxWaitMs }];
  }

  chatterWindow(): boolean {
    return true;
  }

  tick(now: number): Say[] {
    const out: Say[] = [];
    if (this.current && now >= this.current.phaseEndsAt) {
      const cur = this.current;
      if (cur.phase === 'walk') {
        cur.phase = 'hang';
        cur.phaseEndsAt = now + GAME.hangMs;
        this.placed.push({
          uid: this.uidSeq++,
          assetId: cur.assetId,
          label: cur.label,
          name: cur.name,
          x: cur.x,
          y: cur.y,
          s: cur.s * (ASSETS.find((a) => a.id === cur.assetId)?.size ?? 1),
          rot: cur.rot,
          zone: cur.zone,
          by: cur.p.username,
          byName: cur.p.nickname,
        });
        const c = this.counts.get(cur.p.username) ?? { nickname: cur.p.nickname, count: 0 };
        c.count++;
        c.nickname = cur.p.nickname;
        this.counts.set(cur.p.username, c);
        this.feed = [{ nickname: cur.p.nickname, name: cur.name }, ...this.feed].slice(0, 3);
      } else if (cur.phase === 'hang') {
        cur.phase = 'cheer';
        cur.phaseEndsAt = now + GAME.cheerMs;
      } else {
        this.current = null;
      }
    }
    if (!this.current && this.queue.length > 0) {
      const job = this.queue.shift()!;
      const slot = this.slotFor(job.zones, job.p.username + job.assetId + this.uidSeq);
      this.current = { ...job, phase: 'walk', phaseEndsAt: now + GAME.walkMs, ...slot };
      out.push({ text: this.pickFn('start', LINES.start, job.p.spoken, job.name), ttl: GAME.chatterMaxWaitMs });
      if (job.assetId === 'tag') out.push({ text: this.pickFn('tag', LINES.tag, job.p.spoken, job.label ?? ''), ttl: GAME.chatterMaxWaitMs });
      this.lastIdleAt = now;
    }
    if (!this.current && this.queue.length === 0 && now - this.lastIdleAt >= GAME.idleLineEveryMs) {
      this.lastIdleAt = now;
      out.push({ text: this.pick('idle', LINES.idle), ttl: GAME.chatterMaxWaitMs });
    }
    return out;
  }

  view(now: number): DecorView {
    void now;
    return {
      placed: this.placed,
      current: this.current
        ? { nickname: this.current.p.nickname, name: this.current.name, assetId: this.current.assetId, label: this.current.label, phase: this.current.phase, x: this.current.x, y: this.current.y }
        : null,
      queue: this.queue.map((q) => ({ nickname: q.p.nickname, name: q.name })),
      total: this.placed.length,
      likes: this.likes,
      likeGoal: this.nextGoal,
      fireworksAt: this.fireworksAt,
      top: [...this.counts.values()].sort((a, b) => b.count - a.count).slice(0, 3),
      feed: this.feed,
    };
  }
}
