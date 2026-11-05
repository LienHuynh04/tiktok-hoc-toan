// Engine Đại Chiến Boss: CẢ PHÒNG cùng đánh 1 con boss.
// Mỗi "câu" (12 giây) hiện 1 thử thách nhanh (tính nhẩm / gõ lại cụm từ / đếm nhanh):
// ai gõ đúng đáp án là nhân vật của mình đánh boss 1 đòn. Đòn đầu tiên của câu x2,
// chuỗi đúng liên tiếp cộng thêm sát thương, boss dưới 1/3 máu hóa cuồng nộ (đòn x1,5).
// Boss gục -> ăn mừng, xướng tên người kết liễu + top 3 sát thương, boss cấp cao hơn xuất hiện.
// Tim nạp thanh Nộ: đầy 250 -> MƯA SAO BĂNG trừ 5% máu boss (chỉ là nhịp chơi chung).
// Quà chỉ được cảm ơn — không mua được sát thương, điểm hay bất kỳ lợi thế nào.

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

type Phase = 'spawn' | 'fight' | 'reveal' | 'down';
type QKind = 'math' | 'type' | 'count';

interface Fighter {
  p: Person;
  damage: number; // sát thương lên con boss hiện tại (bảng MVP của boss)
  totalDamage: number; // sát thương cả buổi
  hits: number;
  streak: number;
  hue: number;
  lastActive: number;
}

interface Hit {
  username: string;
  nickname: string;
  dmg: number;
  crit: boolean;
  at: number;
}

interface Question {
  kind: QKind;
  text: string; // hiện trên sân khấu
  spoken: string; // MC đọc
  answer: string; // đáp án đã chuẩn hóa
  answerText: string; // đáp án để hiện lúc công bố
}

export interface BossView {
  phase: Phase;
  phaseRemainSec: number;
  boss: { name: string; emoji: string; level: number; hp: number; maxHp: number; form: 0 | 1 | 2; taunt: string | null; tauntAt: number };
  question: { no: number; kind: QKind; text: string; remainSec: number } | null;
  reveal: { answerText: string; hitsCount: number; totalDmg: number; bestHit: { nickname: string; dmg: number } | null } | null;
  down: { bossName: string; level: number; killer: string; mvp: { nickname: string; damage: number }[] } | null;
  meteor: { dmg: number; at: number } | null;
  fighters: { username: string; nickname: string; avatar: string; hue: number; damage: number; hits: number; streak: number }[];
  fighterCount: number;
  lastHits: Hit[];
  rage: { have: number; goal: number };
  totals: { bossesDown: number; questions: number; hits: number };
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

// Boss tự chế, đổi luân phiên theo cấp (không dùng nhân vật của ai khác)
export const BOSS_ROSTER: { name: string; emoji: string }[] = [
  { name: 'ROBOT HÁM ĂN', emoji: '🤖' },
  { name: 'QUÁI VẬT BÁNH KEM', emoji: '🧁' },
  { name: 'RỒNG PHUN KHÓI BẾP', emoji: '🐲' },
  { name: 'MA CÀ RỒNG SỢ TỎI', emoji: '🧛' },
  { name: 'KHỦNG LONG NGÁO NGƠ', emoji: '🦖' },
];
const TYPE_PHRASES = ['ĐÁNH BOSS THẬT HAY', 'CẢ PHÒNG CỐ LÊN', 'GÕ NHANH THẮNG BOSS', 'HÔM NAY BOSS GỤC', 'ĐOÀN KẾT LÀ SỨC MẠNH', 'MỘT ĐÒN NỮA THÔI'];
const COUNT_EMOJIS = ['🍓', '🐟', '⭐', '🍎', '🐱'];
const TAUNTS_CALM = ['Ha ha, cả phòng gãi ngứa cho ta à?', 'Đánh thế này thì tới mai nhé!', 'Ta còn chưa thèm né đấy!'];
const TAUNTS_HURT = ['Ái đau đấy! Ai vừa đánh lén ta?', 'Từ từ nào, đông người ăn hiếp một mình ta!', 'Ta bắt đầu nóng mặt rồi đấy!'];
const TAUNTS_RAGE = ['KHÔNG ĐƯỢC ĐÁNH NỮA! TA GIẬN RỒI!', 'Cả phòng lui ra! Ta sắp quậy đây!', 'Đau quá đau quá! Cứu ta với!'];
const IDLE_LINES = [
  'Cả nhà ơi, gõ đáp án đúng là đánh boss một đòn nhé. Ai cũng đánh được, không cần chờ lượt đâu!',
  'Đòn đầu tiên của mỗi câu được nhân đôi sát thương. Canh sẵn đáp án nào cả nhà!',
  'Đủ 250 tim là mưa sao băng dội boss. Thanh nộ đang ở phía dưới màn hình đấy!',
];

export function hpForLevel(level: number): number {
  return Math.round(GAME.baseHp * Math.pow(GAME.hpGrowth, level - 1));
}

export class BossRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private fighters = new Map<string, Fighter>();
  private phase: Phase = 'spawn';
  private phaseEndsAt = 0;
  private level = 1;
  private hp = 0;
  private maxHp = 0;
  private form: 0 | 1 | 2 = 0;
  private taunt: string | null = null;
  private tauntAt = 0;
  private question: Question | null = null;
  private qNo = 0;
  private roundHits = new Set<string>();
  private roundDmg = 0;
  private lastHits: Hit[] = [];
  private reveal: BossView['reveal'] = null;
  private downInfo: BossView['down'] = null;
  private meteor: BossView['meteor'] = null;
  private rageMeter = 0;
  private missRounds = 0;
  private totals = { bossesDown: 0, questions: 0, hits: 0 };
  private hueSeed = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;
  private kindIdx = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.lastIdleAt = now;
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }
  private ri(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1));
  }
  private bossDef() {
    return BOSS_ROSTER[(this.level - 1) % BOSS_ROSTER.length];
  }

  // ---------- vòng đời ----------

  newSession(now: number): Say[] {
    this.fighters.clear();
    this.level = 1;
    this.totals = { bossesDown: 0, questions: 0, hits: 0 };
    this.qNo = 0;
    this.rageMeter = 0;
    this.missRounds = 0;
    this.lastHits = [];
    this.spawnBoss(now);
    return [
      {
        main: true,
        text: M(
          'Chào cả nhà đến với Đại Chiến Boss! Cả phòng mình cùng đánh một con boss chung nhé. Màn hình hiện câu hỏi gì, cả nhà gõ đáp án đúng là đánh boss một đòn. Ai cũng chơi được ngay, không cần chờ lượt. Đánh gục boss là cả phòng cùng thắng!',
        ),
      },
    ];
  }

  private spawnBoss(now: number) {
    this.maxHp = hpForLevel(this.level);
    this.hp = this.maxHp;
    this.form = 0;
    this.taunt = null;
    this.question = null;
    this.roundHits.clear();
    this.roundDmg = 0;
    this.reveal = null;
    this.downInfo = null;
    for (const f of this.fighters.values()) f.damage = 0;
    this.phase = 'spawn';
    this.phaseEndsAt = now + GAME.spawnSec * 1000;
  }

  join(p: Person, now: number) {
    const f = this.fighters.get(p.username);
    if (f) {
      f.lastActive = now;
      f.p = p;
      return;
    }
    this.fighters.set(p.username, {
      p,
      damage: 0,
      totalDamage: 0,
      hits: 0,
      streak: 0,
      hue: (this.hueSeed++ * 47) % 360,
      lastActive: now,
    });
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: M(`Chào ${p.spoken} mới vào phòng! Gõ đáp án đúng là cùng cả phòng đánh boss nhé!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Cả phòng cảm ơn bạn, tiếp tục đánh boss nào!`) }];
  }

  like(count: number, now: number): Say[] {
    this.rageMeter += count;
    if (this.rageMeter < GAME.rageGoal || this.phase === 'down' || this.phase === 'spawn') return [];
    this.rageMeter = 0;
    const dmg = Math.max(1, Math.round(this.maxHp * GAME.meteorPct));
    this.applyDamage(null, dmg, now, false);
    this.meteor = { dmg, at: now };
    const lines: Say[] = [{ main: true, text: M(`Mưa sao băng! Cả phòng thả tim đủ ${GAME.rageGoal}, sao băng dội boss mất ${dmg} máu!`) }];
    if (this.hp <= 0) lines.push(...this.bossDown('Mưa Sao Băng', 'mưa sao băng của cả phòng', now));
    return lines;
  }

  hold(ms: number) {
    if (this.phaseEndsAt) this.phaseEndsAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return this.phase === 'fight';
  }

  // ---------- câu hỏi ----------

  private makeQuestion(): Question {
    const kinds: QKind[] = ['math', 'type', 'count'];
    const kind = kinds[this.kindIdx++ % kinds.length];
    if (kind === 'math') {
      const lv = Math.min(6, 1 + Math.floor((this.level - 1) / 2)); // boss cấp càng cao số càng to
      const op = this.ri(0, 3);
      let a = 0;
      let b = 0;
      let sym = '+';
      let ans = 0;
      if (op === 0) {
        a = this.ri(3, 9 + lv * 6);
        b = this.ri(3, 9 + lv * 6);
        sym = '+';
        ans = a + b;
      } else if (op === 1) {
        a = this.ri(5, 12 + lv * 7);
        b = this.ri(2, a - 1);
        sym = '−';
        ans = a - b;
      } else if (op === 2) {
        a = this.ri(2, 6 + lv);
        b = this.ri(2, 9);
        sym = '×';
        ans = a * b;
      } else {
        a = this.ri(2, 12 + lv * 4);
        b = this.ri(2, 9);
        sym = '÷';
        ans = Math.floor(a / b) * b === a ? a / b : 0;
        if (!ans) {
          // không chia hết thì đổi thành nhân cho chắc
          sym = '×';
          ans = a * b;
        } else {
          return { kind, text: `${a} ${sym} ${b} = ?`, spoken: `Tính nhanh: ${a} chia ${b} bằng mấy?`, answer: String(ans), answerText: `${a} ${sym} ${b} = ${ans}` };
        }
      }
      const word = sym === '+' ? 'cộng' : sym === '−' ? 'trừ' : 'nhân';
      return { kind, text: `${a} ${sym} ${b} = ?`, spoken: `Tính nhanh: ${a} ${word} ${b} bằng mấy?`, answer: String(ans), answerText: `${a} ${sym} ${b} = ${ans}` };
    }
    if (kind === 'type') {
      const phrase = this.pick(TYPE_PHRASES);
      return { kind, text: phrase, spoken: `Gõ lại đúng cụm từ trên màn hình nhé!`, answer: plain(phrase), answerText: phrase };
    }
    const emoji = this.pick(COUNT_EMOJIS);
    const n = this.ri(5, 15);
    return { kind, text: emoji.repeat(n), spoken: `Đếm nhanh: có bao nhiêu hình trên màn hình? Gõ số nhé!`, answer: String(n), answerText: `${n} hình ${emoji}` };
  }

  private startQuestion(now: number): Say[] {
    this.qNo++;
    this.totals.questions++;
    this.question = this.makeQuestion();
    this.roundHits.clear();
    this.roundDmg = 0;
    this.phase = 'fight';
    this.phaseEndsAt = now + GAME.questionSec * 1000;
    return [{ main: true, text: M(`Câu ${this.qNo}: ${this.question.spoken}`) }];
  }

  /** Kiểm tra 1 bình luận có phải đáp án đúng của câu hiện tại không */
  private checkAnswer(q: Question, comment: string): boolean {
    if (q.kind === 'type') return plain(comment) === q.answer;
    const m = comment.match(/-?\d+/);
    return !!m && m[0] === q.answer;
  }
  private isAttempt(q: Question, comment: string): boolean {
    if (q.kind === 'type') return plain(comment).length >= 4;
    return /\d/.test(comment);
  }

  // ---------- đánh boss ----------

  private applyDamage(f: Fighter | null, dmg: number, now: number, crit: boolean) {
    this.hp = Math.max(0, this.hp - dmg);
    if (f) {
      f.damage += dmg;
      f.totalDamage += dmg;
      this.lastHits = [{ username: f.p.username, nickname: f.p.nickname, dmg, crit, at: now }, ...this.lastHits].slice(0, 6);
    }
    const frac = this.hp / this.maxHp;
    const newForm: 0 | 1 | 2 = frac > 2 / 3 ? 0 : frac > 1 / 3 ? 1 : 2;
    if (newForm !== this.form) {
      this.form = newForm;
      this.taunt = this.pick(newForm === 1 ? TAUNTS_HURT : TAUNTS_RAGE);
      this.tauntAt = now;
    }
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    this.join(p, now);
    const f = this.fighters.get(p.username)!;
    f.lastActive = now;
    if (this.phase !== 'fight' || !this.question || p.safe === false) return [];
    if (this.roundHits.has(p.username)) return [];
    const q = this.question;
    if (this.checkAnswer(q, p.comment)) {
      this.roundHits.add(p.username);
      f.streak++;
      f.hits++;
      this.totals.hits++;
      const crit = this.roundHits.size === 1;
      let dmg = GAME.hitDamage + Math.min(GAME.streakBonusCap, (f.streak - 1) * 2);
      if (crit) dmg *= GAME.firstHitMult;
      if (this.form === 2) dmg = Math.round(dmg * GAME.enrageMult);
      this.roundDmg += dmg;
      this.applyDamage(f, dmg, now, crit);
      if (this.hp <= 0) return this.bossDown(f.p.nickname, f.p.spoken, now);
      return [];
    }
    if (this.isAttempt(q, p.comment)) f.streak = 0;
    return [];
  }

  private bossDown(killerName: string, killerSpoken: string, now: number): Say[] {
    this.phase = 'down';
    this.phaseEndsAt = now + GAME.downSec * 1000;
    this.totals.bossesDown++;
    const def = this.bossDef();
    const mvp = [...this.fighters.values()]
      .filter((x) => x.damage > 0)
      .sort((a, b) => b.damage - a.damage)
      .slice(0, 3)
      .map((x) => ({ nickname: x.p.nickname, damage: x.damage }));
    this.downInfo = { bossName: def.name, level: this.level, killer: killerName, mvp };
    const top = mvp[0];
    return [
      {
        main: true,
        text: M(
          `Boss ${def.name} cấp ${this.level} gục rồi! Đòn kết liễu thuộc về ${killerSpoken}!` +
            (top ? ` Đánh khỏe nhất là ${top.nickname} với ${top.damage} sát thương.` : '') +
            ` Cả phòng giỏi quá! Boss cấp ${this.level + 1} sắp xuất hiện, mạnh hơn đấy!`,
        ),
      },
    ];
  }

  demoFight(now: number): Say[] {
    // Gọi 3 khán giả mẫu lên đánh thử trúng để xem hiệu ứng (chỉ dùng khi test)
    const demos: Person[] = [
      { username: '__demo1', nickname: 'Bạn An', spoken: 'bạn An', avatar: '' },
      { username: '__demo2', nickname: 'Bạn Bình', spoken: 'bạn Bình', avatar: '' },
      { username: '__demo3', nickname: 'Bạn Chi', spoken: 'bạn Chi', avatar: '' },
    ];
    for (const d of demos) {
      this.join(d, now);
      const f = this.fighters.get(d.username)!;
      f.streak++;
      f.hits++;
      const dmg = GAME.hitDamage + 5;
      this.roundDmg += dmg;
      if (this.phase !== 'fight') continue;
      this.applyDamage(f, dmg, now, false);
      if (this.hp <= 0) {
        this.bossDown(f.p.nickname, f.p.spoken, now);
        break;
      }
    }
    return [];
  }

  // ---------- nhịp game ----------

  tick(now: number): Say[] {
    const out: Say[] = [];
    if (now < this.phaseEndsAt) {
      // nhắc cách chơi khi phòng yên ắng lâu
      if (this.phase === 'fight' && now - this.lastIdleAt >= GAME.idleLineEveryMs) {
        this.lastIdleAt = now;
        out.push({ text: M(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]) });
      }
      return out;
    }
    if (this.phase === 'spawn') {
      const def = this.bossDef();
      out.push({ main: true, text: M(`Boss ${def.name} cấp ${this.level} xuất hiện với ${this.maxHp} máu! Cả phòng sẵn sàng, gõ đáp án đúng là đánh!`) });
      out.push(...this.startQuestion(now));
    } else if (this.phase === 'fight') {
      const q = this.question!;
      const hitsCount = this.roundHits.size;
      const best = this.lastHits.filter((h) => h.at >= this.phaseEndsAt - GAME.questionSec * 1000).sort((a, b) => b.dmg - a.dmg)[0];
      this.reveal = { answerText: q.answerText, hitsCount, totalDmg: this.roundDmg, bestHit: best ? { nickname: best.nickname, dmg: best.dmg } : null };
      this.phase = 'reveal';
      this.phaseEndsAt = now + GAME.revealSec * 1000;
      if (hitsCount === 0) {
        this.missRounds++;
        if (this.missRounds >= 2) {
          this.taunt = this.pick(TAUNTS_CALM);
          this.tauntAt = now;
          this.missRounds = 0;
        }
        out.push({ main: true, text: M(`Hết giờ! Đáp án là ${q.answerText}. Câu này chưa bạn nào đánh trúng, boss đang cười nhạo cả phòng kìa!`) });
      } else {
        this.missRounds = 0;
        out.push({
          main: true,
          text: M(`Đáp án: ${q.answerText}! ${hitsCount} bạn đánh trúng, tổng ${this.roundDmg} sát thương.` + (best ? ` Đòn mạnh nhất của ${best.nickname}: ${best.dmg} điểm!` : '')),
        });
      }
      this.question = null;
    } else if (this.phase === 'reveal') {
      this.reveal = null;
      if (this.hp > 0) out.push(...this.startQuestion(now));
    } else if (this.phase === 'down') {
      this.level++;
      this.spawnBoss(now);
    }
    return out;
  }

  view(now: number): BossView {
    const def = this.bossDef();
    const remain = Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000));
    const fighters = [...this.fighters.values()]
      .sort((a, b) => b.damage - a.damage || b.totalDamage - a.totalDamage)
      .slice(0, 8)
      .map((f) => ({ username: f.p.username, nickname: f.p.nickname, avatar: f.p.avatar, hue: f.hue, damage: f.damage, hits: f.hits, streak: f.streak }));
    return {
      phase: this.phase,
      phaseRemainSec: remain,
      boss: { name: def.name, emoji: def.emoji, level: this.level, hp: this.hp, maxHp: this.maxHp, form: this.form, taunt: this.taunt, tauntAt: this.tauntAt },
      question: this.phase === 'fight' && this.question ? { no: this.qNo, kind: this.question.kind, text: this.question.text, remainSec: remain } : null,
      reveal: this.phase === 'reveal' ? this.reveal : null,
      down: this.phase === 'down' ? this.downInfo : null,
      meteor: this.meteor && now - this.meteor.at < 4000 ? this.meteor : null,
      fighters,
      fighterCount: this.fighters.size,
      lastHits: this.lastHits,
      rage: { have: Math.min(this.rageMeter, GAME.rageGoal), goal: GAME.rageGoal },
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
