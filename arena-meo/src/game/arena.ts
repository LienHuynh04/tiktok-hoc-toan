// Engine Đấu Trường Mèo: mèo của từng người xem (badge avatar + tai mèo) nảy trong
// phòng khách nhà Sen và tự đấu nhau khi va chạm. Sức mạnh CHỈ kiếm bằng chơi:
// chat của chính chủ (+1, trần +30/vòng), hạ mèo khác (+2). Tim hồi +2 HP cho mèo
// của CHÍNH người thả tim (gộp lượt theo nhịp, như mẫu tim cá nhân của Đua Vịt).
// Quà CHỈ được cảm ơn + trái tim bay quanh mèo người tặng — không HP, không sức
// mạnh, không sát thương, không bảo vệ. Boss Bug Mập là sự kiện cả phòng cùng đánh.
// Hàm thuần + đồng hồ/rng tiêm vào: test chạy tất định (arena.check.ts).

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

const F = (s: string) => `F: ${s}`;

/** Màu vòng badge: băm FNV-1a + trộn cuối từ username — tên gần giống nhau vẫn ra màu khác hẳn */
export function hashHue(username: string): number {
  let h = 2166136261;
  for (let i = 0; i < username.length; i++) {
    h ^= username.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return Math.abs(h) % 360;
}

/** Sát thương của 1 đòn va chạm: kẻ mạnh hơn gây 4 + chênh lệch sức mạnh (tối thiểu 2) */
export function hitDamage(attPower: number, defPower: number): number {
  return Math.max(2, 4 + attPower - defPower);
}

interface Cat {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
  bot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  hp: number;
  chatPower: number;
  koPower: number;
  alive: boolean;
  koAt: number;
  lastHealAt: number;
  hitFlashUntil: number;
  giftFxUntil: number;
  kosThisLife: number;
  hue: number;
}

interface Boss {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  endsAt: number;
  lastHitBy: string | null;
}

interface Fx {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'dmg' | 'heal' | 'ko' | 'pow';
  until: number;
}

interface SessionStat {
  nickname: string;
  wins: number;
  kos: number;
  bossKills: number;
}

export interface CatView {
  username: string;
  nickname: string;
  avatar: string;
  bot: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  power: number;
  alive: boolean;
  ko: boolean;
  hue: number;
  crown: boolean;
  hitFlash: boolean;
  giftFx: boolean;
}

export interface ArenaView {
  phase: 'battle' | 'intermission';
  round: number;
  intermissionSec: number;
  cats: CatView[];
  boss: { x: number; y: number; hp: number; maxHp: number; remainSec: number } | null;
  effects: { id: number; x: number; y: number; text: string; kind: Fx['kind'] }[];
  board: { username: string; nickname: string; wins: number; kos: number; bossKills: number }[];
  lastWinner: string | null;
  celebration: 'bossdown' | 'roundwin' | null;
  aliveReal: number;
  aliveTotal: number;
  totals: { rounds: number; spawns: number };
  musicOn: boolean;
  musicVolume: number;
}

const SIM_PEOPLE: Person[] = [
  'Mèo Mun', 'Bé Bơ', 'Tí Nị', 'Miu Miu', 'Bánh Bao', 'Cá Viên',
  'Sữa Chua', 'Mochi', 'Pate', 'Bơ Đậu', 'Xí Muội', 'Trà Sữa',
].map((nickname, i) => ({ username: `sim${i + 1}`, nickname, spoken: nickname, avatar: '' }));

const STEP_MS = 20;

export class ArenaRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private startedAt: number;
  private lastTickAt: number;
  private acc = 0;
  private phase: 'battle' | 'intermission' = 'battle';
  private round = 1;
  private roundStartedAt: number;
  private intermissionEndsAt = 0;
  private cats = new Map<string, Cat>();
  private session = new Map<string, SessionStat>();
  private realSpawnedThisRound = 0;
  private totalSpawns = 0;
  private deadThisRound = new Set<string>();
  private pendingSpawn = new Map<string, Person>();
  private boss: Boss | null = null;
  private pendingBoss = false;
  private nextBossAt: number;
  private pairCd = new Map<string, number>();
  private bossCd = new Map<string, number>();
  private effects: Fx[] = [];
  private fxId = 0;
  private lastWinner: string | null = null; // username người thắng vòng trước (đội vương miện)
  private lastWinnerName: string | null = null;
  private celebration: { kind: 'bossdown' | 'roundwin'; until: number } | null = null;
  private pendingSays: Say[] = [];
  private lastActionAt: number;
  private lastIdleLineAt: number;
  private idleLineIdx = 0;
  private botIdx = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.startedAt = now;
    this.lastTickAt = now;
    this.roundStartedAt = now;
    this.lastActionAt = now;
    this.lastIdleLineAt = now;
    this.nextBossAt = now + GAME.bossFirstMs;
  }

  // ---------- Tiện ích ----------
  private aliveCats(): Cat[] {
    return [...this.cats.values()].filter((c) => c.alive);
  }
  private aliveReal(): Cat[] {
    return this.aliveCats().filter((c) => !c.bot);
  }
  private stat(username: string, nickname: string): SessionStat {
    let s = this.session.get(username);
    if (!s) {
      s = { nickname, wins: 0, kos: 0, bossKills: 0 };
      this.session.set(username, s);
    }
    s.nickname = nickname;
    return s;
  }
  private addFx(x: number, y: number, text: string, kind: Fx['kind'], now: number, ms = 950) {
    this.effects.push({ id: ++this.fxId, x, y, text, kind, until: now + ms });
    if (this.effects.length > 40) this.effects.splice(0, this.effects.length - 40);
  }
  private say(s: Say) {
    this.pendingSays.push(s);
  }
  private drainSays(): Say[] {
    const out = this.pendingSays;
    this.pendingSays = [];
    return out;
  }

  // ---------- Buổi / chào / cảm ơn ----------
  newSession(now: number): Say[] {
    const fresh = new ArenaRoom(now, this.rng);
    fresh.musicOn = this.musicOn;
    fresh.musicVolume = this.musicVolume;
    Object.assign(this, fresh);
    return [
      { text: F('Chào cả nhà! Đấu Trường Mèo mở cửa rồi đây!'), main: true },
      { text: F('Luật chơi rất đơn giản: comment bất kỳ là mèo của bạn xuất hiện trong phòng khách nhà Sen. Mèo tự nảy và đấu nhau, chat càng nhiều mèo càng mạnh, thả tim là hồi máu cho chính mèo của bạn đấy!') },
    ];
  }

  join(_p: Person, _now: number): Say[] {
    return [];
  }

  follow(p: Person, _now: number): Say[] {
    return [{ text: F(`Chào bạn ${p.spoken} mới theo dõi phòng! Comment bất kỳ để thả mèo của bạn vào đấu trường nhé!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    // Quà CHỈ được cảm ơn: không HP, không sức mạnh, không sát thương, không bảo vệ.
    return [{ text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Mèo của bạn nhận được một tràng trái tim yêu thương!`), priority: true }];
  }

  /** Hiệu ứng trái tim bay quanh mèo của người tặng (hình ảnh thuần tuý, không tác dụng gameplay) */
  giftFx(username: string, now: number) {
    const cat = this.cats.get(username);
    if (cat && cat.alive) cat.giftFxUntil = now + GAME.giftFxMs;
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  // ---------- Thả mèo / tăng sức mạnh ----------
  private spawnCat(p: Person, bot: boolean, now: number): Cat {
    const a = GAME.arena;
    const r = GAME.catRadius;
    const x = a.x0 + r + 30 + this.rng() * (a.x1 - a.x0 - 2 * r - 60);
    const y = a.y0 + r + 30 + this.rng() * (a.y1 - a.y0 - 2 * r - 60);
    const ang = this.rng() * Math.PI * 2;
    const speed = GAME.catSpeedMin + this.rng() * (GAME.catSpeedMax - GAME.catSpeedMin);
    const cat: Cat = {
      username: p.username,
      nickname: p.nickname,
      spoken: p.spoken,
      avatar: p.avatar,
      bot,
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      hp: GAME.hpMax,
      chatPower: 0,
      koPower: 0,
      alive: true,
      koAt: 0,
      lastHealAt: -Infinity,
      hitFlashUntil: 0,
      giftFxUntil: 0,
      kosThisLife: 0,
      hue: hashHue(p.username),
    };
    this.cats.set(p.username, cat);
    this.totalSpawns++;
    if (!bot) {
      this.realSpawnedThisRound++;
      this.stat(p.username, p.nickname);
    }
    this.lastActionAt = now;
    return cat;
  }

  chat(p: Person, _comment: string, now: number): Say[] {
    const cat = this.cats.get(p.username);
    if (cat && cat.alive) {
      // Chat tiếp của chính chủ: +1 sức mạnh (trần +30/vòng). Tin đầu tiên thả mèo không tính.
      if (cat.chatPower < GAME.chatPowerCap) {
        cat.chatPower++;
        if (cat.chatPower % 10 === 0) this.addFx(cat.x, cat.y - 70, `Sức mạnh ${catPower(cat)}!`, 'pow', now);
      }
      this.lastActionAt = now;
      return [];
    }
    if (cat && !cat.alive) {
      // Đã bị hạ trong vòng này: ghi danh, vòng sau comment lại là vào sân
      this.pendingSpawn.set(p.username, p);
      return [];
    }
    if (this.phase === 'battle') {
      if (this.aliveCats().length < GAME.maxCats) this.spawnCat(p, false, now);
      else this.pendingSpawn.set(p.username, p);
    } else {
      this.pendingSpawn.set(p.username, p);
    }
    return [];
  }

  // ---------- Tim: hồi máu cho mèo của CHÍNH người thả ----------
  like(p: Person, count: number, now: number): Say[] {
    if (count <= 0) return [];
    const cat = this.cats.get(p.username);
    if (!cat || !cat.alive || cat.bot) return []; // không có mèo (hoặc mèo đã hạ): không hồi cho ai cả
    if (now - cat.lastHealAt < GAME.likeHealCooldownMs) return []; // gộp lượt: 1 nhịp 1 lần +2 HP
    cat.lastHealAt = now;
    if (cat.hp < GAME.hpMax) {
      cat.hp = Math.min(GAME.hpMax, cat.hp + GAME.likeHeal);
      this.addFx(cat.x, cat.y - 70, `+${GAME.likeHeal} HP`, 'heal', now);
    }
    return [];
  }

  // ---------- Boss ----------
  triggerBoss(now: number): Say[] {
    if (this.boss) return [];
    if (this.phase !== 'battle') {
      this.pendingBoss = true;
      return [{ text: F('Boss Bug Mập đang lấp ló ngoài cửa, vòng sau là xông vào đấy cả nhà!') }];
    }
    return this.spawnBoss(now);
  }

  private spawnBoss(now: number): Say[] {
    const alive = this.aliveCats().length;
    const maxHp = GAME.bossHpBase + GAME.bossHpPerCat * alive;
    const a = GAME.arena;
    this.boss = {
      x: (a.x0 + a.x1) / 2,
      y: a.y0 + GAME.bossRadius + 60,
      vx: GAME.bossSpeed * 0.7,
      vy: GAME.bossSpeed * 0.7,
      hp: maxHp,
      maxHp,
      endsAt: now + GAME.bossDurationMs,
      lastHitBy: null,
    };
    this.bossCd.clear();
    this.setCelebration(null);
    return [
      { text: F('Trời ơi, BOSS BUG MẬP xuất hiện rồi! Mèo khổng lồ nặng chín ký, máu trâu lắm đấy. Cả phòng xông lên, mèo nào chạm vào boss là boss mất máu, mà boss quệt lại thì đau lắm nha!'), main: true },
    ];
  }

  private setCelebration(kind: 'bossdown' | 'roundwin' | null, now = 0) {
    this.celebration = kind ? { kind, until: now + 5000 } : null;
  }

  private bossDown(now: number): Say[] {
    const boss = this.boss!;
    this.boss = null;
    this.nextBossAt = now + GAME.bossEveryMs;
    const survivors = this.aliveReal();
    for (const c of survivors) this.stat(c.username, c.nickname).wins++;
    let hero: SessionStat | null = null;
    if (boss.lastHitBy && !boss.lastHitBy.startsWith('bot')) {
      const cat = this.cats.get(boss.lastHitBy);
      hero = this.stat(boss.lastHitBy, cat?.nickname ?? boss.lastHitBy);
      hero.bossKills++;
    }
    this.setCelebration('bossdown', now);
    this.addFx(boss.x, boss.y, 'BOSS GỤC!', 'ko', now, 1600);
    return [
      {
        text: F(
          `Hạ được Boss Bug Mập rồi cả nhà ơi! ${survivors.length} mèo sống sót, mỗi mèo được cộng một điểm thắng.${hero ? ` Đòn kết liễu là của ${hero.nickname}!` : ''} Mưa cá ăn mừng nào!`,
        ),
        main: true,
      },
    ];
  }

  private bossSlam(now: number): Say[] {
    this.boss = null;
    this.nextBossAt = now + GAME.bossEveryMs;
    const victims = this.aliveCats()
      .sort((a, b) => a.hp - b.hp)
      .slice(0, 3);
    for (const v of victims) this.koCat(v, null, now);
    return [
      {
        text: F(`Hết giờ! Boss Bug Mập nhảy lên đập sân một cái rung chuyển! Ba mèo yếu nhất bị loại rồi: ${victims.map((v) => v.nickname).join(', ')}. Boss lăn về ngủ, hẹn ba phút nữa quay lại!`),
        main: true,
      },
    ];
  }

  // ---------- Hạ mèo ----------
  private koCat(victim: Cat, killer: Cat | null, now: number) {
    if (!victim.alive) return;
    victim.alive = false;
    victim.hp = 0;
    victim.koAt = now;
    if (!victim.bot) this.deadThisRound.add(victim.username);
    this.addFx(victim.x, victim.y - 40, 'KO!', 'ko', now, 1300);
    if (killer && killer !== victim) {
      killer.koPower += GAME.koPowerBonus;
      killer.kosThisLife++;
      if (!killer.bot) {
        this.stat(killer.username, killer.nickname).kos++;
        if (killer.kosThisLife === 2) {
          this.say({ text: F(`${killer.spoken} đang thắng thế! Hạ hai mèo liên tiếp rồi đấy!`), priority: true });
        } else if (killer.kosThisLife >= 3) {
          this.say({ text: F(`Không cản nổi ${killer.spoken} nữa rồi! Chuỗi hạ gục ${killer.kosThisLife} mèo!`), priority: true });
        }
      }
    }
    this.lastActionAt = now;
  }

  private hurt(target: Cat, dmg: number, source: Cat | null, now: number) {
    if (!target.alive || dmg <= 0) return;
    target.hp -= dmg;
    target.hitFlashUntil = now + 160;
    this.addFx(target.x + (this.rng() - 0.5) * 30, target.y - 66, `-${dmg}`, 'dmg', now);
    if (target.hp <= 0) this.koCat(target, source, now);
  }

  // ---------- Vòng đấu ----------
  private endRound(now: number): Say[] {
    const alive = this.aliveReal();
    const winner = alive.length === 1 ? alive[0] : null;
    this.phase = 'intermission';
    this.intermissionEndsAt = now + GAME.intermissionMs;
    this.boss = null; // boss đang dở dang thì cũng rút (phòng khi)
    if (winner) {
      this.stat(winner.username, winner.nickname).wins++;
      this.lastWinner = winner.username;
      this.lastWinnerName = winner.nickname;
      this.setCelebration('roundwin', now);
      return [
        {
          text: F(`Kết thúc vòng ${this.round}! Mèo của ${winner.spoken} là mèo cuối cùng trụ lại sân — thắng vòng, đội vương miện oai chưa! Mười giây nữa vòng mới bắt đầu, cả nhà chuẩn bị comment thả mèo nhé!`),
          main: true,
        },
      ];
    }
    return [
      { text: F(`Kết thúc vòng ${this.round} mà không còn mèo người thật nào trụ lại — vòng này hoà! Mười giây nữa vòng mới bắt đầu nhé cả nhà!`), main: true },
    ];
  }

  /** Nút ở trang điều khiển: kết thúc vòng ngay (người đang dẫn đầu thắng) */
  forceEndRound(now: number): Say[] {
    if (this.phase !== 'battle') return [];
    const alive = this.aliveReal().sort((a, b) => b.hp - a.hp || catPower(b) - catPower(a));
    if (alive.length > 1) {
      // loại hết trừ người dẫn đầu để endRound chốt đúng 1 người thắng
      for (const c of alive.slice(1)) this.koCat(c, null, now);
    }
    return this.endRound(now);
  }

  private startRound(now: number): Say[] {
    this.round++;
    this.phase = 'battle';
    this.roundStartedAt = now;
    this.cats.clear();
    this.pairCd.clear();
    this.bossCd.clear();
    this.deadThisRound.clear();
    this.realSpawnedThisRound = 0;
    const pending = [...this.pendingSpawn.values()];
    this.pendingSpawn.clear();
    for (const p of pending.slice(0, GAME.maxCats)) this.spawnCat(p, false, now);
    const says: Say[] = [{ text: F(`Vòng ${this.round} bắt đầu! Comment bất kỳ để thả mèo vào sân nhé cả nhà!`) }];
    if (this.pendingBoss) {
      this.pendingBoss = false;
      says.push(...this.spawnBoss(now));
    }
    return says;
  }

  // ---------- BOT sưởi sân ----------
  private manageBots(now: number) {
    const real = this.aliveReal().length;
    if (real >= 4) {
      // Đủ người thật: bot rút hết, nhường sân (bot không bao giờ thắng vòng)
      for (const c of [...this.cats.values()]) if (c.bot) this.cats.delete(c.username);
      return;
    }
    let total = this.aliveCats().length;
    let guard = 0;
    while (total < GAME.botFillTo && guard++ < 8) {
      const name = GAME.botNames[this.botIdx % GAME.botNames.length];
      this.botIdx++;
      const username = `bot${this.botIdx}`;
      if (this.cats.has(username)) continue;
      this.spawnCat({ username, nickname: name, spoken: name.replace(' 🤖', ''), avatar: '' }, true, now);
      total++;
    }
  }

  // ---------- Vật lý + chiến đấu (bước cố định, tất định) ----------
  private step(dtMs: number, now: number) {
    const dt = dtMs / 1000;
    const a = GAME.arena;
    const r = GAME.catRadius;
    const cats = this.aliveCats();

    for (const c of cats) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < a.x0 + r) { c.x = a.x0 + r; c.vx = Math.abs(c.vx); }
      if (c.x > a.x1 - r) { c.x = a.x1 - r; c.vx = -Math.abs(c.vx); }
      if (c.y < a.y0 + r) { c.y = a.y0 + r; c.vy = Math.abs(c.vy); }
      if (c.y > a.y1 - r) { c.y = a.y1 - r; c.vy = -Math.abs(c.vy); }
      // giữ nguyên tốc độ nảy (va chạm đàn hồi không làm mèo nhanh/chậm dần)
      const sp = Math.hypot(c.vx, c.vy) || 1;
      c.vx = (c.vx / sp) * c.speed;
      c.vy = (c.vy / sp) * c.speed;
    }

    // Mèo — mèo
    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const A = cats[i];
        const B = cats[j];
        if (!A.alive || !B.alive) continue;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dist = Math.hypot(dx, dy);
        const min = r * 2;
        if (dist === 0 || dist >= min) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (min - dist) / 2;
        A.x -= nx * overlap;
        A.y -= ny * overlap;
        B.x += nx * overlap;
        B.y += ny * overlap;
        // đổi thành phần vận tốc theo pháp tuyến (khối lượng bằng nhau)
        const van = A.vx * nx + A.vy * ny;
        const vbn = B.vx * nx + B.vy * ny;
        A.vx += (vbn - van) * nx;
        A.vy += (vbn - van) * ny;
        B.vx += (van - vbn) * nx;
        B.vy += (van - vbn) * ny;
        if (this.phase !== 'battle') continue;
        const key = A.username < B.username ? `${A.username}|${B.username}` : `${B.username}|${A.username}`;
        if (now - (this.pairCd.get(key) ?? -Infinity) < GAME.hitCooldownMs) continue;
        this.pairCd.set(key, now);
        const pa = catPower(A);
        const pb = catPower(B);
        if (pa > pb) this.hurt(B, hitDamage(pa, pb), A, now);
        else if (pb > pa) this.hurt(A, hitDamage(pb, pa), B, now);
        else {
          this.hurt(A, hitDamage(pa, pb), B, now);
          this.hurt(B, hitDamage(pb, pa), A, now);
        }
      }
    }

    // Boss
    const boss = this.boss;
    if (boss) {
      const br = GAME.bossRadius;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (boss.x < a.x0 + br) { boss.x = a.x0 + br; boss.vx = Math.abs(boss.vx); }
      if (boss.x > a.x1 - br) { boss.x = a.x1 - br; boss.vx = -Math.abs(boss.vx); }
      if (boss.y < a.y0 + br) { boss.y = a.y0 + br; boss.vy = Math.abs(boss.vy); }
      if (boss.y > a.y1 - br) { boss.y = a.y1 - br; boss.vy = -Math.abs(boss.vy); }
      const bsp = Math.hypot(boss.vx, boss.vy) || 1;
      boss.vx = (boss.vx / bsp) * GAME.bossSpeed;
      boss.vy = (boss.vy / bsp) * GAME.bossSpeed;

      for (const c of cats) {
        if (!c.alive) continue;
        const dx = c.x - boss.x;
        const dy = c.y - boss.y;
        const dist = Math.hypot(dx, dy);
        const min = br + r;
        if (dist === 0 || dist >= min) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        c.x = boss.x + nx * min;
        c.y = boss.y + ny * min;
        const vn = c.vx * nx + c.vy * ny;
        if (vn < 0) {
          c.vx -= 2 * vn * nx;
          c.vy -= 2 * vn * ny;
        }
        if (this.phase !== 'battle') continue;
        if (now - (this.bossCd.get(c.username) ?? -Infinity) < GAME.bossHitCooldownMs) continue;
        this.bossCd.set(c.username, now);
        const dmgToBoss = hitDamage(catPower(c), GAME.bossPower);
        boss.hp -= dmgToBoss;
        if (!c.bot) boss.lastHitBy = c.username;
        this.addFx(boss.x + (this.rng() - 0.5) * 120, boss.y - br - 10, `-${dmgToBoss}`, 'dmg', now);
        if (boss.hp <= 0) {
          this.say(this.bossDown(now)[0]);
          break;
        }
        this.hurt(c, hitDamage(GAME.bossPower, catPower(c)), null, now);
      }
    }
  }

  // ---------- Tick ----------
  tick(now: number): Say[] {
    const says: Say[] = [];
    let elapsed = now - this.lastTickAt;
    this.lastTickAt = now;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 1000) elapsed = 1000; // tab bị treo lâu: đừng dồn vật lý một cục
    this.acc += elapsed;
    let guard = 0;
    while (this.acc >= STEP_MS && guard++ < 50) {
      this.acc -= STEP_MS;
      this.step(STEP_MS, now);
    }
    says.push(...this.drainSays());

    this.effects = this.effects.filter((e) => e.until > now);

    if (this.phase === 'intermission') {
      if (now >= this.intermissionEndsAt) says.push(...this.startRound(now));
      return says;
    }

    // Boss theo lịch ~3 phút (chỉ khi đang đấu)
    if (!this.boss && !this.pendingBoss && now >= this.nextBossAt) {
      says.push(...this.spawnBoss(now));
    }
    // Boss quá giờ: đập sân
    if (this.boss && now >= this.boss.endsAt) {
      says.push(...this.bossSlam(now));
    }

    // Kết vòng: còn tối đa 1 mèo người thật và vòng đã có ít nhất 3 mèo người thật vào sân.
    // Đang có boss thì khoan kết vòng — để cả phòng đánh boss xong đã.
    if (!this.boss && this.realSpawnedThisRound >= 3 && this.aliveReal().length <= 1) {
      says.push(...this.endRound(now));
      return says;
    }

    this.manageBots(now);

    // MC nhắc luật khi phòng im lặng lâu (câu trung tính, không kêu gọi)
    if (now - this.lastActionAt > GAME.idleLineEveryMs && now - this.lastIdleLineAt > GAME.idleLineEveryMs) {
      this.lastIdleLineAt = now;
      const lines = [
        F('Nhắc nhẹ luật sân: comment bất kỳ là mèo của bạn vào sân. Chat càng nhiều, mèo càng mạnh; thả tim là hồi máu cho chính mèo của bạn.'),
        F('Mèo nào trụ lại cuối cùng là thắng vòng và được đội vương miện vòng sau. Boss Bug Mập cứ chừng ba phút lại ghé sân một lần đấy!'),
        F('Sức mạnh trong sân này chỉ kiếm bằng chơi thôi: chat để mạnh lên, hạ mèo khác để cộng thêm sức mạnh.'),
      ];
      says.push({ text: lines[this.idleLineIdx++ % lines.length] });
    }
    return says;
  }

  // ---------- Nút test ở trang điều khiển ----------
  /** Thả n mèo giả lập (người xem mô phỏng, không phải BOT) */
  spawnSim(n: number, now: number): Say[] {
    let added = 0;
    for (const p of SIM_PEOPLE) {
      if (added >= n) break;
      if (this.cats.has(p.username)) continue;
      if (this.aliveCats().length >= GAME.maxCats) break;
      this.spawnCat(p, false, now);
      added++;
    }
    return added ? [{ text: F(`Có ${added} mèo mới vào sân! Đấu trường nhộn nhịp hẳn lên!`) }] : [];
  }

  /** Chat mô phỏng: 1 mèo giả lập ngẫu nhiên được +5 sức mạnh như đã chat 5 tin */
  simPower(now: number): Say[] {
    const sims = this.aliveCats().filter((c) => c.username.startsWith('sim'));
    if (!sims.length) return [];
    const cat = sims[Math.floor(this.rng() * sims.length)];
    cat.chatPower = Math.min(GAME.chatPowerCap, cat.chatPower + 5);
    this.addFx(cat.x, cat.y - 70, `Sức mạnh ${catPower(cat)}!`, 'pow', now);
    return [];
  }

  /** Tim mô phỏng: hồi máu cho mèo giả lập đang yếu nhất, như chính chủ thả tim nhiều lượt */
  simHeal(now: number): Say[] {
    const sims = this.aliveCats().filter((c) => c.username.startsWith('sim')).sort((a, b) => a.hp - b.hp);
    if (!sims.length) return [];
    const cat = sims[0];
    const owner = SIM_PEOPLE.find((p) => p.username === cat.username)!;
    for (let i = 0; i < 10; i++) {
      cat.lastHealAt = -Infinity;
      this.like(owner, 1, now);
    }
    return [];
  }

  // ---------- Hỗ trợ kiểm chứng (test dùng, như sendBugTo của Bug Đại Náo) ----------
  debugPlace(username: string, x: number, y: number) {
    const cat = this.cats.get(username);
    if (cat) {
      cat.x = x;
      cat.y = y;
    }
  }

  debugSetHp(username: string, hp: number) {
    const cat = this.cats.get(username);
    if (cat) cat.hp = hp;
  }

  debugStop(username: string) {
    const cat = this.cats.get(username);
    if (cat) {
      cat.speed = 0;
      cat.vx = 0;
      cat.vy = 0;
    }
  }

  // ---------- Ảnh chụp cho stage / trang điều khiển ----------
  view(now: number): ArenaView {
    const cats: CatView[] = [];
    for (const c of this.cats.values()) {
      const ko = !c.alive;
      if (ko && now - c.koAt > GAME.koShowMs) continue;
      cats.push({
        username: c.username,
        nickname: c.nickname,
        avatar: c.avatar,
        bot: c.bot,
        x: Math.round(c.x),
        y: Math.round(c.y),
        hp: Math.max(0, Math.ceil(c.hp)),
        maxHp: GAME.hpMax,
        power: catPower(c),
        alive: c.alive,
        ko,
        hue: c.hue,
        crown: c.username === this.lastWinner,
        hitFlash: now < c.hitFlashUntil,
        giftFx: now < c.giftFxUntil,
      });
    }
    const board = [...this.session.entries()]
      .map(([username, s]) => ({ username, nickname: s.nickname, wins: s.wins, kos: s.kos, bossKills: s.bossKills }))
      .sort((a, b) => b.wins - a.wins || b.kos - a.kos || b.bossKills - a.bossKills || a.nickname.localeCompare(b.nickname))
      .slice(0, 8);
    return {
      phase: this.phase,
      round: this.round,
      intermissionSec: this.phase === 'intermission' ? Math.max(0, Math.ceil((this.intermissionEndsAt - now) / 1000)) : 0,
      cats,
      boss: this.boss
        ? {
            x: Math.round(this.boss.x),
            y: Math.round(this.boss.y),
            hp: Math.max(0, Math.ceil(this.boss.hp)),
            maxHp: this.boss.maxHp,
            remainSec: Math.max(0, Math.ceil((this.boss.endsAt - now) / 1000)),
          }
        : null,
      effects: this.effects.filter((e) => e.until > now).map((e) => ({ id: e.id, x: Math.round(e.x), y: Math.round(e.y), text: e.text, kind: e.kind })),
      board,
      lastWinner: this.lastWinnerName,
      celebration: this.celebration && now < this.celebration.until ? this.celebration.kind : null,
      aliveReal: this.aliveReal().length,
      aliveTotal: this.aliveCats().length,
      totals: { rounds: this.round, spawns: this.totalSpawns },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}

/** Sức mạnh hiện tại của 1 mèo = gốc + chat + hạ gục (chỉ tăng bằng chơi) */
export function catPower(c: { chatPower: number; koPower: number }): number {
  return GAME.basePower + c.chatPower + c.koPower;
}
