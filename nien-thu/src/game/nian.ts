// Engine Đốt Pháo Đuổi Niên Thú (game Tết): CẢ PHÒNG cùng đuổi 1 con Niên Thú.
// Theo tích dân gian, Niên Thú sợ tiếng pháo và màu đỏ. Mỗi "câu" (12 giây) hiện 1 thử
// thách nhanh (tính nhẩm / gõ lại câu chúc Tết / đếm đồ Tết): ai gõ đúng đáp án là châm
// 1 quả pháo nổ vào Niên Thú. Quả pháo đầu tiên của câu nổ x2, chuỗi đúng liên tiếp cộng
// thêm sát thương, Niên còn dưới 1/3 máu hóa cuồng nộ (pháo x1,5 cho nhanh nó chạy).
// Niên bỏ chạy -> pháo hoa ăn mừng, xướng tên người châm pháo kết liễu + top 3 sát thương,
// rồi Niên cấp cao hơn lại xuống núi. Tim nạp DÂY PHÁO: đầy 250 -> cả phòng đốt dây pháo
// dài trừ 5% máu Niên (chỉ là nhịp chơi chung). Quà chỉ được cảm ơn — không mua được gì.

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

export interface NianView {
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
export const BOSS_ROSTER: { name: string; emoji: string }[] = [{ name: 'NIÊN THÚ', emoji: '🧨' }];
/** tên 3 hình dạng theo mức máu: >2/3, >1/3, còn lại */
export const FORM_NAMES = ['Dáng Ngủ Đông', 'Dáng Hung Hăng', 'Dáng Cuồng Nộ'];
const TYPE_PHRASES = ['CHÚC MỪNG NĂM MỚI', 'AN KHANG THỊNH VƯỢNG', 'VẠN SỰ NHƯ Ý', 'NĂM MỚI PHÁT TÀI', 'SỨC KHỎE DỒI DÀO', 'TÂN NIÊN HẠNH PHÚC', 'ĐỐT PHÁO ĐUỔI NIÊN', 'CẢ PHÒNG ĐÓN TẾT'];
const COUNT_EMOJIS = ['🧧', '🏮', '🌸', '🍊', '🧨'];
const TAUNTS_CALM = ['Hừ, pháo giấy mà đòi dọa ta à?', 'Ta ngủ cả năm mới dậy, để ta ăn Tết đã!', 'Đốt pháo nhỏ thế này thì tới giao thừa nhé!'];
const TAUNTS_HURT = ['Nóng! Nóng quá! Bọn ngươi đốt cái gì đấy?', 'Ái ái! Pháo nổ to quá, tai ta ù rồi!', 'Từ từ nào, cả làng ăn hiếp một mình ta!'];
const TAUNTS_RAGE = ['TA SỢ PHÁO! ĐỪNG ĐỐT NỮA!', 'Huhu, cho ta về núi ngủ tiếp đi!', 'Đùng đùng hoài! Ta chạy đây, đừng đuổi nữa!'];
const IDLE_LINES = [
  'Cả nhà ơi, gõ đáp án đúng là châm một quả pháo nổ vào Niên Thú nhé. Ai cũng châm được, không cần chờ lượt đâu!',
  'Quả pháo đầu tiên của mỗi câu nổ gấp đôi. Canh sẵn đáp án nào cả nhà!',
  'Đủ 250 tim là cả phòng đốt dây pháo dài nổ đùng đùng. Thanh dây pháo ở phía dưới màn hình đấy!',
];

export function hpForLevel(level: number): number {
  return Math.round(GAME.baseHp * Math.pow(GAME.hpGrowth, level - 1));
}

export class NianRoom {
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
  private reveal: NianView['reveal'] = null;
  private downInfo: NianView['down'] = null;
  private meteor: NianView['meteor'] = null;
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
          'Chúc mừng năm mới cả nhà! Niên Thú lại xuống núi quậy Tết rồi. Cả phòng mình cùng đốt pháo đuổi nó về núi nhé: màn hình hiện câu hỏi gì, gõ đáp án đúng là châm một quả pháo nổ đùng. Ai cũng chơi được ngay, không cần chờ lượt. Đuổi được Niên là cả làng ăn Tết yên!',
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
    return [{ text: M(`Chào ${p.spoken} mới vào phòng đón Tết! Gõ đáp án đúng là cùng cả phòng đốt pháo đuổi Niên nhé!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Cả phòng cảm ơn bạn, tiếp tục đốt pháo đuổi Niên nào!`) }];
  }

  like(count: number, now: number): Say[] {
    this.rageMeter += count;
    if (this.rageMeter < GAME.rageGoal || this.phase === 'down' || this.phase === 'spawn') return [];
    this.rageMeter = 0;
    const dmg = Math.max(1, Math.round(this.maxHp * GAME.meteorPct));
    this.applyDamage(null, dmg, now, false);
    this.meteor = { dmg, at: now };
    const lines: Say[] = [{ main: true, text: M(`Dây pháo cả phòng! Cả nhà thả tim đủ ${GAME.rageGoal}, dây pháo dài nổ đùng đùng, Niên Thú mất ${dmg} máu, sợ xanh mặt!`) }];
    if (this.hp <= 0) lines.push(...this.bossDown('Dây Pháo Cả Phòng', 'dây pháo của cả phòng', now));
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
    return { kind, text: emoji.repeat(n), spoken: `Đếm nhanh đồ Tết: trên màn hình có bao nhiêu món? Gõ số nhé!`, answer: String(n), answerText: `${n} món ${emoji}` };
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
          `Niên Thú cấp ${this.level} bỏ chạy về núi rồi! Quả pháo kết liễu thuộc về ${killerSpoken}!` +
            (top ? ` Tay đốt pháo giỏi nhất là ${top.nickname} với ${top.damage} sát thương.` : '') +
            ` Cả làng ăn Tết yên rồi! Nhưng nghe nói Niên cấp ${this.level + 1} còn hung hơn, sắp xuống núi nữa đấy!`,
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
      out.push({ main: true, text: M(`Niên Thú cấp ${this.level} xuống núi với ${this.maxHp} máu! Cả phòng sẵn sàng pháo: gõ đáp án đúng là châm pháo!`) });
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
        out.push({ main: true, text: M(`Hết giờ! Đáp án là ${q.answerText}. Câu này chưa bạn nào châm trúng pháo, Niên Thú đang cười nhạo cả phòng kìa!`) });
      } else {
        this.missRounds = 0;
        out.push({
          main: true,
          text: M(`Đáp án: ${q.answerText}! ${hitsCount} bạn châm pháo trúng, tổng ${this.roundDmg} sát thương.` + (best ? ` Quả pháo to nhất của ${best.nickname}: ${best.dmg} điểm!` : '')),
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

  view(now: number): NianView {
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
