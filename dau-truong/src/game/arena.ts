// Engine Đấu Trường Sinh Tồn: mỗi người xem là 1 quái nhí trong 1 đấu trường tròn.
// Bình luận là vào trận. Quái tự di chuyển và tự đánh nhau; người chơi đổi THẾ bằng lệnh:
// "ăn" (đi ăn cỏ hồi máu, né đánh nhau) · "săn" (lao vào đối thủ gần nhất) · "trốn" (chạy xa kẻ địch).
// Vòng độc thu hẹp dần buộc mọi người phải chạm trán. Quái cuối cùng còn sống là vô địch vòng.
// Đủ 120 tim -> MƯA HỒI PHỤC cho mọi quái còn sống (nhịp chơi chung). Quà chỉ được cảm ơn.

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

type Phase = 'lobby' | 'battle' | 'podium';
export type Stance = 'an' | 'san' | 'tron';

interface Fighter {
  p: Person;
  art: number;
  wins: number;
  totalWins: number;
  lastActive: number;
  joinedAt: number;
}

interface Monster {
  username: string;
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  stance: Stance;
  kills: number;
  place: number; // 0 = đang sống/chưa xếp hạng
  heading: number;
  lastCombatAt: number;
  lastAttacker: string | null;
}

export interface ArenaView {
  phase: Phase;
  phaseRemainSec: number;
  round: number;
  monsters: {
    username: string;
    nickname: string;
    avatar: string;
    art: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    stance: Stance;
    alive: boolean;
    kills: number;
  }[];
  aliveCount: number;
  entrantCount: number;
  poolCount: number;
  ring: { r: number };
  killFeed: { killer: string; victim: string; at: number }[];
  heal: { have: number; goal: number };
  podium: { winner: { nickname: string; avatar: string; art: number } | null; top: { nickname: string; art: number; kills: number; place: number }[] } | null;
  top: { nickname: string; avatar: string; totalWins: number }[];
  totals: { rounds: number };
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

const IDLE_LINES = [
  'Cả nhà bình luận bất cứ chữ gì là có quái nhí vào đấu trường nhé!',
  'Trong trận, gõ "ăn" để quái đi hồi máu, "săn" để lao vào đánh, "trốn" để chạy né nhé!',
  'Vòng độc thu hẹp dần, đừng đứng ngoài vòng lâu là mất máu đấy!',
];

export function artFor(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return h % 9;
}

export class ArenaRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private pool = new Map<string, Fighter>();
  private monsters = new Map<string, Monster>();
  private phase: Phase = 'lobby';
  private phaseEndsAt = 0;
  private round = 0;
  private totals = { rounds: 0 };
  private battleStartedAt = 0;
  private deathCount = 0;
  private killFeed: ArenaView['killFeed'] = [];
  private podiumInfo: ArenaView['podium'] = null;
  private likeMeter = 0;
  private lastTickAt = 0;
  private lastIdleAt = 0;
  private idleIdx = 0;
  private warnedHalf = false;
  private announcedFinal = false;

  constructor(now: number, private rng: () => number = Math.random) {
    this.phaseEndsAt = now + GAME.lobbySec * 1000;
    this.lastTickAt = now;
    this.lastIdleAt = now;
  }

  newSession(now: number): Say[] {
    this.pool.clear();
    this.monsters.clear();
    this.round = 0;
    this.totals = { rounds: 0 };
    this.phase = 'lobby';
    this.phaseEndsAt = now + GAME.lobbySec * 1000;
    this.likeMeter = 0;
    this.lastTickAt = now;
    return [
      {
        main: true,
        text: M(
          'Chào cả nhà đến với Đấu Trường Sinh Tồn! Bình luận bất cứ chữ gì là bạn có một quái nhí vào đấu trường. Quái tự đánh nhau, bạn chỉ cần gõ ăn, săn hoặc trốn để đổi thế cho quái của mình. Ai sống sót cuối cùng là vô địch vòng nhé!',
        ),
      },
    ];
  }

  join(p: Person, now: number) {
    const f = this.pool.get(p.username);
    if (f) {
      f.lastActive = now;
      f.p = p;
      return;
    }
    this.pool.set(p.username, { p, art: artFor(p.username), wins: 0, totalWins: 0, lastActive: now, joinedAt: now });
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    return [{ text: M(`Chào ${p.spoken}! Quái nhí của bạn đã sẵn sàng ở cổng đấu trường rồi!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: M(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Chúc quái nhí của bạn sống sót tới cuối!`) }];
  }

  like(count: number, now: number): Say[] {
    this.likeMeter += count;
    if (this.likeMeter >= GAME.healGoal && this.phase === 'battle') {
      this.likeMeter = 0;
      let healed = 0;
      for (const m of this.monsters.values()) {
        if (m.alive && m.hp < GAME.maxHp) {
          m.hp = Math.min(GAME.maxHp, m.hp + GAME.healAmount);
          healed++;
        }
      }
      if (healed > 0) return [{ priority: true, text: M(`Mưa hồi phục! Cả phòng thả tim đủ ${GAME.healGoal}, ${healed} quái nhí được hồi ${GAME.healAmount} máu!`) }];
      return [];
    }
    if (this.likeMeter > GAME.healGoal) this.likeMeter = GAME.healGoal;
    return [];
  }

  hold(ms: number) {
    if (this.phaseEndsAt) this.phaseEndsAt += ms;
    if (this.battleStartedAt) this.battleStartedAt += ms;
    this.lastTickAt += ms;
    for (const m of this.monsters.values()) m.lastCombatAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return this.phase !== 'battle';
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    this.join(p, now);
    if (p.safe === false || this.phase !== 'battle') return [];
    const m = this.monsters.get(p.username);
    if (!m || !m.alive) return [];
    const first = plain(p.comment).split(' ')[0];
    if (first === 'AN') m.stance = 'an';
    else if (first === 'SAN') m.stance = 'san';
    else if (first === 'TRON') m.stance = 'tron';
    return [];
  }

  demoBattle(now: number): Say[] {
    const names = ['Bạn An', 'Bạn Bình', 'Bạn Chi', 'Bạn Dũng', 'Bạn Hà', 'Bạn Khoa', 'Bạn Linh', 'Bạn Minh'];
    names.forEach((n, i) => this.join({ username: '__demo' + i, nickname: n, spoken: n, avatar: '' }, now));
    if (this.phase === 'lobby') this.phaseEndsAt = now;
    return [];
  }

  // ---------- vòng đấu ----------

  private ringRadius(now: number): number {
    if (this.phase !== 'battle') return 52;
    const t = Math.min(1, (now - this.battleStartedAt) / (GAME.ringShrinkSec * 1000));
    return 52 - (52 - 12) * t;
  }

  private startBattle(now: number): Say[] {
    this.round++;
    this.totals.rounds++;
    this.monsters.clear();
    this.deathCount = 0;
    this.killFeed = [];
    this.warnedHalf = false;
    this.announcedFinal = false;
    const entrants = [...this.pool.values()].sort((a, b) => a.joinedAt - b.joinedAt).slice(0, GAME.maxFighters);
    entrants.forEach((f, i) => {
      const ang = (i / Math.max(1, entrants.length)) * Math.PI * 2 + this.rng() * 0.4;
      const rad = 26 + this.rng() * 14;
      this.monsters.set(f.p.username, {
        username: f.p.username,
        x: 50 + Math.cos(ang) * rad,
        y: 50 + Math.sin(ang) * rad,
        hp: GAME.maxHp,
        alive: true,
        stance: 'san',
        kills: 0,
        place: 0,
        heading: this.rng() * Math.PI * 2,
        lastCombatAt: 0,
        lastAttacker: null,
      });
    });
    this.phase = 'battle';
    this.battleStartedAt = now;
    this.phaseEndsAt = now + GAME.battleMaxSec * 1000;
    return [{ main: true, text: M(`Vòng ${this.round} bắt đầu! ${entrants.length} quái nhí vào đấu trường. Vòng độc sẽ thu hẹp dần, quái nào sống sót cuối cùng là vô địch!`) }];
  }

  private toPodium(now: number): Say[] {
    const placed = [...this.monsters.values()].sort((a, b) => a.place - b.place);
    const winnerM = placed[0];
    const winnerF = winnerM ? this.pool.get(winnerM.username) : undefined;
    if (winnerF) {
      winnerF.wins++;
      winnerF.totalWins++;
    }
    this.podiumInfo = {
      winner: winnerM && winnerF ? { nickname: winnerF.p.nickname, avatar: winnerF.p.avatar, art: winnerF.art } : null,
      top: placed.slice(0, 3).map((m) => ({ nickname: this.pool.get(m.username)?.p.nickname ?? m.username, art: this.pool.get(m.username)?.art ?? 0, kills: m.kills, place: m.place })),
    };
    this.phase = 'podium';
    this.phaseEndsAt = now + GAME.podiumSec * 1000;
    return [
      {
        main: true,
        text: M(
          `Vòng ${this.round} kết thúc!` +
            (winnerF ? ` Vô địch sinh tồn là quái nhí của bạn ${winnerF.p.spoken} với ${winnerM?.kills ?? 0} lần hạ đối thủ!` : '') +
            ' Nghỉ một chút, vòng mới lại mở cổng nhé cả nhà!',
        ),
      },
    ];
  }

  private kill(m: Monster, now: number) {
    m.alive = false;
    m.hp = 0;
    const total = this.monsters.size;
    m.place = total - this.deathCount;
    this.deathCount++;
    const killerName = m.lastAttacker ? this.pool.get(m.lastAttacker)?.p.nickname : null;
    if (m.lastAttacker) {
      const k = this.monsters.get(m.lastAttacker);
      if (k) k.kills++;
    }
    this.killFeed = [{ killer: killerName ?? 'Vòng độc', victim: this.pool.get(m.username)?.p.nickname ?? m.username, at: now }, ...this.killFeed].slice(0, 5);
  }

  tick(now: number): Say[] {
    const out: Say[] = [];
    const dt = Math.min(0.5, Math.max(0, (now - this.lastTickAt) / 1000));
    this.lastTickAt = now;

    if (this.phase === 'lobby') {
      if (now >= this.phaseEndsAt) {
        if (this.pool.size >= 2) out.push(...this.startBattle(now));
        else {
          this.phaseEndsAt = now + GAME.lobbySec * 1000;
          if (now - this.lastIdleAt >= GAME.idleLineEveryMs) {
            this.lastIdleAt = now;
            out.push({ text: M(IDLE_LINES[this.idleIdx++ % IDLE_LINES.length]) });
          }
        }
      }
      return out;
    }

    if (this.phase === 'podium') {
      if (now >= this.phaseEndsAt) {
        this.phase = 'lobby';
        this.phaseEndsAt = now + GAME.lobbySec * 1000;
        this.podiumInfo = null;
        this.monsters.clear();
      }
      return out;
    }

    // battle: mô phỏng
    const alive = [...this.monsters.values()].filter((m) => m.alive);
    const ringR = this.ringRadius(now);
    if (!this.warnedHalf && ringR <= 32 && alive.length > 1) {
      this.warnedHalf = true;
      out.push({ text: M('Vòng độc đã thu hẹp một nửa! Mọi người cẩn thận, đừng đứng ngoài vòng!') });
    }
    for (const m of alive) {
      if (!m.alive) continue; // vừa bị hạ trong cùng nhịp mô phỏng
      // đối thủ gần nhất
      let foe: Monster | null = null;
      let foeD = Infinity;
      for (const o of alive) {
        if (o === m || !o.alive) continue;
        const d = Math.hypot(o.x - m.x, o.y - m.y);
        if (d < foeD) {
          foeD = d;
          foe = o;
        }
      }
      let vx = 0;
      let vy = 0;
      let speed = GAME.moveSpeed;
      if (m.stance === 'san' && foe) {
        vx = foe.x - m.x;
        vy = foe.y - m.y;
      } else if (m.stance === 'tron' && foe) {
        vx = m.x - foe.x;
        vy = m.y - foe.y;
        speed = GAME.fleeSpeed;
        // bị dồn thì chạy vòng quanh tâm sân
        const dc = Math.hypot(m.x - 50, m.y - 50);
        if (dc > ringR - 6) {
          vx = 50 - m.x;
          vy = 50 - m.y;
        }
      } else {
        // ăn: đi lang thang chậm + hồi máu khi yên ổn
        speed = GAME.grazeSpeed;
        if (this.rng() < 0.02) m.heading = this.rng() * Math.PI * 2;
        vx = Math.cos(m.heading);
        vy = Math.sin(m.heading);
        if (now - m.lastCombatAt > 4000) m.hp = Math.min(GAME.maxHp, m.hp + GAME.regenPerSec * dt);
      }
      const len = Math.hypot(vx, vy) || 1;
      // đang áp sát đối thủ ở thế săn thì đứng lại đánh, không lao xuyên qua
      if (!(m.stance === 'san' && foeD < 6.5)) {
        m.x = Math.min(96, Math.max(4, m.x + (vx / len) * speed * dt));
        m.y = Math.min(96, Math.max(4, m.y + (vy / len) * speed * dt));
      }
      // giao tranh
      if (foe && foeD < 7 && m.stance === 'san') {
        foe.hp -= GAME.baseDps * (0.8 + this.rng() * 0.4) * dt;
        foe.lastCombatAt = now;
        foe.lastAttacker = m.username;
        m.lastCombatAt = now;
      }
      // vòng độc
      const dc = Math.hypot(m.x - 50, m.y - 50);
      if (dc > ringR) {
        m.hp -= GAME.ringDps * dt;
        m.lastAttacker = null;
      }
      if (m.hp <= 0 && m.alive) this.kill(m, now);
    }

    const aliveNow = [...this.monsters.values()].filter((m) => m.alive);
    if (aliveNow.length === 2 && !this.announcedFinal) {
      this.announcedFinal = true;
      const names = aliveNow.map((m) => this.pool.get(m.username)?.p.spoken).filter(Boolean).join(' và ');
      out.push({ main: true, text: M(`Chỉ còn 2 quái nhí trên sân: ${names}! Ai sẽ là người sống sót cuối cùng đây?`) });
    }
    if (aliveNow.length <= 1 || now >= this.phaseEndsAt) {
      if (aliveNow.length === 1) aliveNow[0].place = 1;
      else if (aliveNow.length > 1) {
        // hết giờ: xếp hạng theo máu còn lại
        const sorted = [...aliveNow].sort((a, b) => b.hp - a.hp);
        sorted.forEach((m, i) => (m.place = i + 1));
      }
      out.push(...this.toPodium(now));
    }
    return out;
  }

  view(now: number): ArenaView {
    const monsters = [...this.monsters.values()]
      .sort((a, b) => Number(b.alive) - Number(a.alive) || b.hp - a.hp)
      .map((m) => {
        const f = this.pool.get(m.username);
        return {
          username: m.username,
          nickname: f?.p.nickname ?? m.username,
          avatar: f?.p.avatar ?? '',
          art: f?.art ?? 0,
          x: Math.round(m.x * 10) / 10,
          y: Math.round(m.y * 10) / 10,
          hp: Math.max(0, Math.ceil(m.hp)),
          maxHp: GAME.maxHp,
          stance: m.stance,
          alive: m.alive,
          kills: m.kills,
        };
      });
    const top = [...this.pool.values()]
      .filter((f) => f.totalWins > 0)
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, 5)
      .map((f) => ({ nickname: f.p.nickname, avatar: f.p.avatar, totalWins: f.totalWins }));
    return {
      phase: this.phase,
      phaseRemainSec: Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000)),
      round: this.round,
      monsters,
      aliveCount: monsters.filter((m) => m.alive).length,
      entrantCount: this.monsters.size,
      poolCount: this.pool.size,
      ring: { r: Math.round(this.ringRadius(now) * 10) / 10 },
      killFeed: this.killFeed,
      heal: { have: Math.min(this.likeMeter, GAME.healGoal), goal: GAME.healGoal },
      podium: this.phase === 'podium' ? this.podiumInfo : null,
      top,
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
