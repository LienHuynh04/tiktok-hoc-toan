// Engine Bug Leo 1000 Bậc: cả phòng cùng đẩy MỘT con mèo Bug leo cầu thang lên
// gác mái ăn con cá to. Bug tự leo chậm; TIM dồn chung thành năng lượng leo,
// lệnh chat LEO/NHẢY cộng bậc, ĐẨY dọn chướng ngại chắn đường.
// Lực kéo xuống CHỈ do máy tạo: cuộn len / dép của Sen lăn xuống húc Bug,
// đoạn bậc trơn làm leo chậm một nửa, thỉnh thoảng Bug ngủ gật.
// QUÀ CHỈ ĐƯỢC CẢM ƠN — không cộng bậc, không sức mạnh, không tính thắng.
// Hàm thuần + đồng hồ/rng tiêm vào: test chạy tất định (climb.check.ts).

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

export type Cmd = 'LEO' | 'NHAY' | 'DAY';
export type HazardKind = 'yarn' | 'slipper';

const F = (s: string) => `F: ${s}`;

export const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CMD_MAP: Record<string, Cmd> = { LEO: 'LEO', NHAY: 'NHAY', DAY: 'DAY' };

export function parseCommand(comment: string): Cmd | null {
  return CMD_MAP[plain(comment)] ?? null;
}

const TUMBLE_BUBBLES = ['TRƯỢT!', 'LĂN!', 'BẬT!', 'ÁI!'];

const DAY_FAIL_LINES = [
  'Bug đẩy không khí! Chưa có gì chắn đường cả!',
  'Bug giơ chân đẩy một cái... vào khoảng không!',
  'Chưa thấy cuộn len đâu, Bug đẩy hụt rồi!',
];

export interface ClimbView {
  steps: number;
  goalSteps: number;
  wins: number;
  winsGoal: number;
  difficulty: number;
  sessionArc: number;
  progress: number; // 0..1
  inSlippery: boolean;
  bands: [number, number][];
  bug: { moving: boolean; tumbling: boolean };
  hazard: { kind: HazardKind; atStep: number } | null;
  nap: { leo: number; need: number; remainSec: number } | null;
  bubble: string | null;
  banner: { kind: 'win' | 'grand'; title: string; sub: string } | null;
  credit: { nickname: string; steps: number } | null;
  top: { nickname: string; steps: number }[];
  lastEvent: { text: string; kind: 'ok' | 'fail' | 'info' } | null;
  totals: { likes: number; wins: number; tumbles: number; leos: number; leaps: number; cleared: number; naps: number };
  musicOn: boolean;
  musicVolume: number;
}

interface HazardState {
  kind: HazardKind;
  atStep: number;
}

export class ClimbRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private rng: () => number;
  private startedAt: number;
  private lastTickAt: number;
  private lastSayAt: number;

  private stepsF = 0;
  private pool = 0; // năng lượng bậc từ tim, xả dần thành bậc thật
  private autoAcc = 0;
  private lastGainAt = 0;

  private wins = 0;
  private difficulty = 1;
  private sessionArc = 1;

  private contributions = new Map<string, { nickname: string; steps: number }>();
  private leoCooldown = new Map<string, number>();
  private seen = new Set<string>();

  private hazard: HazardState | null = null;
  private nextHazardAt: number;
  private tumbleUntil = 0;

  private napping = false;
  private napEndsAt = 0;
  private napLeo = 0;
  private nextNapAt: number;

  private bubbleText: string | null = null;
  private bubbleUntil = 0;
  private banner: { kind: 'win' | 'grand'; title: string; sub: string; until: number } | null = null;
  private credit: { nickname: string; steps: number } | null = null;
  private lastEvent: { text: string; kind: 'ok' | 'fail' | 'info' } | null = null;

  private totals = { likes: 0, wins: 0, tumbles: 0, leos: 0, leaps: 0, cleared: 0, naps: 0 };

  constructor(now: number, rng: () => number = Math.random) {
    this.rng = rng;
    this.startedAt = now;
    this.lastTickAt = now;
    this.lastSayAt = now;
    this.nextHazardAt = now + GAME.hazardFirstMs;
    this.nextNapAt = now + GAME.napFirstMs;
  }

  // ---------- Tiện ích nội bộ ----------

  bands(): [number, number][] {
    const w = (this.difficulty - 1) * GAME.bandWidenPerDifficulty;
    return GAME.slipperyBands.map(([a, b]) => [Math.max(0, a - w), Math.min(GAME.goalSteps, b + w)] as [number, number]);
  }

  inBandAt(s: number): boolean {
    return this.bands().some(([a, b]) => s >= a && s <= b);
  }

  private hazardInterval(): number {
    const base = GAME.hazardMinMs + this.rng() * (GAME.hazardMaxMs - GAME.hazardMinMs);
    return base / (1 + 0.18 * (this.difficulty - 1));
  }

  private creditTo(p: Person, steps: number) {
    if (steps <= 0) return;
    const cur = this.contributions.get(p.username) ?? { nickname: p.nickname, steps: 0 };
    cur.steps += steps;
    cur.nickname = p.nickname;
    this.contributions.set(p.username, cur);
  }

  private topList(n = 3): { nickname: string; steps: number }[] {
    return [...this.contributions.values()]
      .sort((a, b) => b.steps - a.steps)
      .slice(0, n)
      .map((c) => ({ nickname: c.nickname, steps: Math.floor(c.steps) }));
  }

  private setBubble(text: string, now: number, ms = 1800) {
    this.bubbleText = text;
    this.bubbleUntil = now + ms;
  }

  /** Cộng bậc thật (đã qua hệ số bậc trơn). Trả về câu MC nếu chạm mốc thắng. */
  private gain(amount: number, now: number): Say[] {
    if (amount <= 0 || this.napping) return [];
    const eff = this.inBandAt(this.stepsF) ? amount * 0.5 : amount;
    this.stepsF += eff;
    this.lastGainAt = now;
    if (this.stepsF >= GAME.goalSteps) return this.onWin(now);
    return [];
  }

  private onWin(now: number): Say[] {
    const top = this.topList(1)[0] ?? null;
    this.wins++;
    this.totals.wins++;
    this.credit = top ? { nickname: top.nickname, steps: top.steps } : null;
    const grand = this.wins >= GAME.winsGoal;
    const topText = top ? `${top.nickname} đóng góp nhiều nhất lượt này: ${top.steps} bậc!` : 'Cả phòng cùng góp sức!';
    this.banner = {
      kind: grand ? 'grand' : 'win',
      title: grand ? 'ĐỈNH GÁC MÁI!' : 'VỀ ĐÍCH — BUG ĂN ĐƯỢC CÁ TO!',
      sub: topText,
      until: now + (grand ? 10_000 : 7_000),
    };
    this.setBubble('CÁ TO ƠI!', now, 2500);
    this.lastEvent = { text: grand ? 'Hoàn thành 10 lượt leo — ĐỈNH GÁC MÁI!' : `Thắng lượt ${this.wins}! ${topText}`, kind: 'ok' };
    const lines: Say[] = [
      {
        main: true,
        text: F(
          grand
            ? `Không thể tin được! Bug hoàn thành mười lượt leo cầu thang, chạm ĐỈNH GÁC MÁI! ${top ? `Lượt cuối này ${top.nickname} đóng góp nhiều nhất. ` : ''}Hoan hô cả phòng! Vòng leo mới bắt đầu ngay đây!`
            : `Về đích rồi! Bug leo đủ một nghìn bậc, ăn được con cá to trên gác mái! ${top ? `${top.nickname} đóng góp nhiều nhất lượt này với ${top.steps} bậc. ` : ''}Cả phòng bắt đầu lượt leo mới, độ khó tăng lên một chút!`,
        ),
      },
    ];
    // reset lượt leo, GIỮ nguyên wins (trừ khi vừa đạt đỉnh), độ khó tăng
    this.stepsF = 0;
    this.pool = 0;
    this.autoAcc = 0;
    this.contributions.clear();
    this.hazard = null;
    this.nextHazardAt = now + this.hazardInterval();
    this.difficulty++;
    if (grand) {
      this.wins = 0;
      this.sessionArc++;
    }
    this.lastSayAt = now;
    return lines;
  }

  private spawnHazard(now: number, kind?: HazardKind): Say[] {
    const atStep = Math.min(GAME.goalSteps - 5, this.stepsF + GAME.hazardSpawnAhead);
    if (atStep - this.stepsF < 20) {
      this.nextHazardAt = now + 8000;
      return [];
    }
    const k = kind ?? (this.rng() < 0.6 ? 'yarn' : 'slipper');
    this.hazard = { kind: k, atStep };
    this.lastEvent = { text: k === 'yarn' ? 'Cuộn len đang lăn xuống!' : 'Dép của Sen đang trượt xuống!', kind: 'info' };
    this.lastSayAt = now;
    return [
      {
        priority: true,
        text: F(k === 'yarn' ? 'Cả phòng chú ý, cuộn len đang lăn xuống cầu thang về phía Bug!' : 'Ối, dép của Sen trượt xuống cầu thang rồi, cẩn thận Bug ơi!'),
      },
    ];
  }

  private hitHazard(now: number): Say[] {
    const h = this.hazard!;
    const damage = h.kind === 'yarn' ? GAME.yarnMin + Math.floor(this.rng() * (GAME.yarnMax - GAME.yarnMin + 1)) : GAME.slipperDamage;
    this.stepsF = Math.max(0, this.stepsF - damage);
    this.hazard = null;
    this.nextHazardAt = now + this.hazardInterval();
    this.tumbleUntil = now + GAME.tumbleMs;
    this.totals.tumbles++;
    const bubble = TUMBLE_BUBBLES[Math.floor(this.rng() * TUMBLE_BUBBLES.length)];
    this.setBubble(bubble, now, 2000);
    this.lastEvent = { text: `${h.kind === 'yarn' ? 'Cuộn len' : 'Dép của Sen'} húc trúng Bug: tụt ${damage} bậc!`, kind: 'fail' };
    this.lastSayAt = now;
    return [
      {
        main: true,
        text: F(
          h.kind === 'yarn'
            ? `Ái chà! Cuộn len húc trúng Bug, Bug lăn xuống mất ${damage} bậc! Cả phòng đẩy Bug leo lại nào!`
            : `Dép của Sen bay trúng Bug! Bug tụt ${damage} bậc. Không sao, leo lại từ đây!`,
        ),
      },
    ];
  }

  private startNap(now: number): Say[] {
    this.napping = true;
    this.napEndsAt = now + GAME.napMs;
    this.napLeo = 0;
    this.totals.naps++;
    this.setBubble('Zzz...', now, GAME.napMs);
    this.lastEvent = { text: 'Bug ngủ gật giữa cầu thang!', kind: 'info' };
    this.lastSayAt = now;
    return [{ main: true, text: F('Bug buồn ngủ rồi, ngủ gật ngay giữa cầu thang! Cả phòng gõ LEO gọi Bug dậy nào!') }];
  }

  private wake(now: number, byRoom: boolean): Say[] {
    this.napping = false;
    this.nextNapAt = now + GAME.napEveryMinMs + this.rng() * GAME.napEveryVarMs;
    this.setBubble('ĐI TIẾP!', now, 1500);
    this.lastEvent = { text: byRoom ? 'Cả phòng gọi Bug dậy thành công!' : 'Bug tự tỉnh dậy, leo tiếp!', kind: 'ok' };
    this.lastSayAt = now;
    return byRoom ? [{ main: true, text: F('Bug tỉnh rồi! Cả phòng gọi dậy nhanh quá. Leo tiếp nào!') }] : [];
  }

  // ---------- Sự kiện từ phòng live ----------

  newSession(now: number): Say[] {
    this.lastSayAt = now;
    return [
      { main: true, text: F('Chào cả nhà! Bug bắt đầu leo một nghìn bậc lên gác mái, trên đó có con cá to đang chờ!') },
      {
        priority: true,
        text: F('Cách leo rất đơn giản: thả tim là cộng một bậc, gõ LEO cộng ba bậc, gõ NHẢY vọt tám bậc mà coi chừng trượt, thấy cuộn len chắn đường thì gõ ĐẨY. Quà chỉ để cảm ơn Bug thôi nha.'),
      },
    ];
  }

  join(p: Person, now: number): Say[] {
    if (this.seen.has(p.username)) return [];
    this.seen.add(p.username);
    this.lastSayAt = now;
    return [{ text: F(`Chào ${p.spoken} đến xem Bug leo cầu thang!`) }];
  }

  follow(p: Person, now: number): Say[] {
    this.lastSayAt = now;
    return [{ text: F(`Cảm ơn ${p.spoken} đã theo dõi kênh! Bug leo tiếp đây.`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [
      {
        priority: true,
        text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName} cho Bug! Quà chỉ để cảm ơn thôi, Bug vẫn leo bằng sức của cả phòng nha.`),
      },
    ];
  }

  like(p: Person, count: number, now: number): Say[] {
    const n = Math.max(0, Math.floor(count) || 0);
    if (n <= 0) return [];
    this.pool += n;
    this.creditTo(p, n);
    this.totals.likes += n;
    if (n >= 50) this.lastEvent = { text: `${p.nickname} thả ${n} tim: +${n} bậc năng lượng!`, kind: 'ok' };
    void now;
    return [];
  }

  chat(p: Person, comment: string, now: number): Say[] {
    this.seen.add(p.username);
    const cmd = parseCommand(comment);
    if (!cmd) return [];
    if (now < this.tumbleUntil && cmd !== 'DAY') return [];

    if (cmd === 'LEO') {
      if (this.napping) {
        const last = this.leoCooldown.get(p.username) ?? -Infinity;
        if (now - last < GAME.leoCooldownMs) return [];
        this.leoCooldown.set(p.username, now);
        this.napLeo++;
        this.setBubble(`Dậy... ${this.napLeo}/${GAME.napWakeLeo}`, now, 1200);
        if (this.napLeo >= GAME.napWakeLeo) return this.wake(now, true);
        return [];
      }
      const last = this.leoCooldown.get(p.username) ?? -Infinity;
      if (now - last < GAME.leoCooldownMs) return [];
      this.leoCooldown.set(p.username, now);
      this.totals.leos++;
      this.creditTo(p, GAME.leoSteps);
      this.lastEvent = { text: `${p.nickname} gõ LEO: Bug +${GAME.leoSteps} bậc`, kind: 'ok' };
      return this.gain(GAME.leoSteps, now);
    }

    if (cmd === 'NHAY') {
      if (this.napping) {
        this.lastEvent = { text: 'Bug đang ngủ gật, nhảy sao được!', kind: 'fail' };
        return [];
      }
      this.totals.leaps++;
      if (this.rng() < GAME.leapSlipChance) {
        this.stepsF = Math.max(0, this.stepsF - GAME.leapSlipSteps);
        this.setBubble('TRƯỢT!', now, 1600);
        this.lastEvent = { text: `${p.nickname} gõ NHẢY: Bug trượt chân, tụt ${GAME.leapSlipSteps} bậc!`, kind: 'fail' };
        this.lastSayAt = now;
        return [{ text: F(`Ui da, ${p.spoken} cho Bug nhảy mà trượt chân, tụt năm bậc! Nhảy cẩn thận thôi nha.`) }];
      }
      this.creditTo(p, GAME.leapSteps);
      this.setBubble('NHẢY!', now, 1200);
      this.lastEvent = { text: `${p.nickname} gõ NHẢY: Bug vọt +${GAME.leapSteps} bậc!`, kind: 'ok' };
      return this.gain(GAME.leapSteps, now);
    }

    // DAY — ĐẨY
    if (this.hazard && this.hazard.atStep > this.stepsF && this.hazard.atStep - this.stepsF <= GAME.dayClearRange) {
      const kind = this.hazard.kind;
      this.hazard = null;
      this.nextHazardAt = now + this.hazardInterval();
      this.totals.cleared++;
      this.setBubble('ĐẨY BAY!', now, 1600);
      this.lastEvent = { text: `${p.nickname} gõ ĐẨY: dọn bay ${kind === 'yarn' ? 'cuộn len' : 'chiếc dép'} chắn đường!`, kind: 'ok' };
      this.lastSayAt = now;
      return [
        {
          main: true,
          text: F(`Hay quá! ${p.spoken} vừa đẩy bay ${kind === 'yarn' ? 'cuộn len' : 'chiếc dép'} chắn đường! Bug leo tiếp an toàn rồi!`),
        },
      ];
    }
    const line = DAY_FAIL_LINES[Math.floor(this.rng() * DAY_FAIL_LINES.length)];
    this.lastEvent = { text: line, kind: 'fail' };
    return [];
  }

  // ---------- Vòng lặp chính ----------

  tick(now: number): Say[] {
    const says: Say[] = [];
    const dt = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    if (dt <= 0) return says;

    const tumbling = now < this.tumbleUntil;

    // Ngủ gật: tới giờ thì ngủ, hết giờ thì tự dậy
    if (!this.napping && now >= this.nextNapAt && !tumbling) says.push(...this.startNap(now));
    if (this.napping && now >= this.napEndsAt) says.push(...this.wake(now, false));

    // Chướng ngại: tới giờ thì xuất hiện, lăn xuống dần
    if (!this.hazard && now >= this.nextHazardAt && !this.napping) says.push(...this.spawnHazard(now));
    if (this.hazard && !tumbling) {
      this.hazard.atStep -= (GAME.hazardSpeed * dt) / 1000;
      if (this.hazard.atStep <= this.stepsF) says.push(...this.hitHazard(now));
    }

    if (!this.napping && now >= this.tumbleUntil) {
      // Tự leo +1 bậc / 2 giây (vừa bị húc trong tick này thì đứng yên chịu trận)
      this.autoAcc += dt;
      while (this.autoAcc >= GAME.autoStepMs) {
        this.autoAcc -= GAME.autoStepMs;
        says.push(...this.gain(1, now));
        if (this.napping) break;
      }
      // Xả năng lượng tim thành bậc thật (từng đợt)
      if (this.pool > 0) {
        const amount = Math.min(this.pool, (GAME.likeDrainPerSec * dt) / 1000);
        this.pool -= amount;
        says.push(...this.gain(amount, now));
      }
    }

    // Vào đoạn bậc trơn: nhắc 1 lần mỗi lần bước vào
    const inBand = this.inBandAt(this.stepsF);
    if (inBand && !this.wasInBand) {
      this.lastSayAt = now;
      says.push({ priority: true, text: F('Đang ở đoạn bậc trơn đây, leo chậm lại một nửa, cả phòng đẩy mạnh lên nào!') });
    }
    this.wasInBand = inBand;

    // Phòng im lặng lâu: MC nhắc luật bằng câu trung tính
    if (now - this.lastSayAt > GAME.idleLineEveryMs) {
      this.lastSayAt = now;
      says.push({
        text: F('Bug vẫn đang leo lên gác mái: thả tim cộng một bậc, gõ LEO cộng ba bậc, gõ NHẢY vọt tám bậc, cuộn len tới thì gõ ĐẨY dọn đường.'),
      });
    }
    return says;
  }

  private wasInBand = false;

  // ---------- Hook cho trang điều khiển / test ----------

  /** Nhảy thẳng tới 1 bậc (test thắng nhanh). Kẹp 0..999. */
  debugSetSteps(n: number) {
    this.stepsF = Math.max(0, Math.min(GAME.goalSteps - 1, Math.floor(n)));
    if (this.hazard && this.hazard.atStep <= this.stepsF) this.hazard = null;
  }

  forceHazard(kind: HazardKind, now: number): Say[] {
    this.hazard = null;
    return this.spawnHazard(now, kind);
  }

  forceNap(now: number): Say[] {
    if (this.napping) return [];
    return this.startNap(now);
  }

  /** Nút "Chơi thử" ở trang điều khiển: bơm năng lượng + gọi chướng ngại ra xem. */
  demo(now: number): Say[] {
    const demo: Person = { username: 'khach-demo', nickname: 'Khách Demo', spoken: 'Khách Demo', avatar: '' };
    this.like(demo, 150, now);
    this.lastEvent = { text: 'Đang chơi thử: +150 bậc năng lượng từ tim demo!', kind: 'info' };
    return [{ main: true, text: F('Đang chạy bản chơi thử đây: Bug nhận một trăm năm mươi bậc năng lượng, leo vèo vèo cho cả nhà xem!') }];
  }

  view(now: number): ClimbView {
    const steps = Math.floor(this.stepsF);
    return {
      steps,
      goalSteps: GAME.goalSteps,
      wins: this.wins,
      winsGoal: GAME.winsGoal,
      difficulty: this.difficulty,
      sessionArc: this.sessionArc,
      progress: Math.min(1, this.stepsF / GAME.goalSteps),
      inSlippery: this.inBandAt(this.stepsF),
      bands: this.bands(),
      bug: { moving: this.pool > 0 || now - this.lastGainAt < 900, tumbling: now < this.tumbleUntil },
      hazard: this.hazard ? { kind: this.hazard.kind, atStep: this.hazard.atStep } : null,
      nap: this.napping ? { leo: this.napLeo, need: GAME.napWakeLeo, remainSec: Math.max(0, Math.ceil((this.napEndsAt - now) / 1000)) } : null,
      bubble: now < this.bubbleUntil ? this.bubbleText : null,
      banner: this.banner && now < this.banner.until ? { kind: this.banner.kind, title: this.banner.title, sub: this.banner.sub } : null,
      credit: this.credit,
      top: this.topList(3),
      lastEvent: this.lastEvent,
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
