// Engine Mèo Thủ Vườn: game THỦ LÀN cả phòng chơi cùng lúc (thể loại thủ nhà theo làn,
// nhân vật + luật chơi là bản gốc riêng: mèo/cây trong vườn chống đàn chuột ham ăn).
// Cả phòng dùng CHUNG một bể nắng: game lần lượt "cầm" 1 hậu vệ, người xem gõ số làn
// 1-5 là trồng hậu vệ đó vào làn bằng nắng chung. Đủ 120 tim -> MƯA NẮNG cho cả vườn.
// Quà chỉ được cảm ơn, không mua được nắng / hậu vệ / sát thương.

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

export type DefKind = 'len' | 'den' | 'rong' | 'chau' | 'bom' | 'bang';
export type RatKind = 'xam' | 'non' | 'chay' | 'phomai' | 'tui' | 'trum';
type Phase = 'rest' | 'wave' | 'over';

export const DEF_INFO: Record<DefKind, { name: string; cost: number; hp: number; art: number; desc: string }> = {
  len: { name: 'Mèo Bắn Len', cost: 100, hp: 130, art: 0, desc: 'ném len liên tục' },
  den: { name: 'Hoa Đèn Lồng', cost: 50, hp: 110, art: 1, desc: 'thắp nắng cho vườn' },
  rong: { name: 'Xương Rồng Gai', cost: 125, hp: 130, art: 2, desc: 'phun gai đau nhất' },
  chau: { name: 'Chậu Đá', cost: 50, hp: 420, art: 3, desc: 'tường chắn siêu bền' },
  bom: { name: 'Nấm Bom', cost: 150, hp: 90, art: 4, desc: 'nổ tung 3x3 ngay' },
  bang: { name: 'Mèo Băng', cost: 150, hp: 130, art: 5, desc: 'thổi băng làm chậm' },
};
const DEF_DMG: Partial<Record<DefKind, { dmg: number; rate: number; slow?: number }>> = {
  len: { dmg: 12, rate: 1.35 },
  rong: { dmg: 24, rate: 1.9 },
  bang: { dmg: 8, rate: 1.55, slow: 2.5 },
};
export const RAT_INFO: Record<RatKind, { name: string; hp: number; speed: number; bite: number; art: number }> = {
  xam: { name: 'Chuột Xám', hp: 100, speed: 0.16, bite: 12, art: 0 },
  non: { name: 'Chuột Nón Sắt', hp: 330, speed: 0.125, bite: 14, art: 1 },
  chay: { name: 'Chuột Thể Thao', hp: 85, speed: 0.3, bite: 10, art: 2 },
  phomai: { name: 'Chuột Ôm Phô Mai', hp: 250, speed: 0.145, bite: 12, art: 3 },
  tui: { name: 'Chuột Ba Lô', hp: 170, speed: 0.18, bite: 12, art: 4 },
  trum: { name: 'Chuột Trùm Răng Sắt', hp: 3000, speed: 0.075, bite: 40, art: 5 },
};
/** vòng quay "đang cầm": mèo bắn len xuất hiện nhiều nhất để vườn luôn có hỏa lực */
const OFFER_SEQ: DefKind[] = ['len', 'den', 'len', 'rong', 'chau', 'len', 'bang', 'rong', 'bom', 'den'];

interface Defender {
  kind: DefKind;
  lane: number;
  col: number;
  hp: number;
  owner: string;
  nickname: string;
  lastShot: number;
  lastGen: number;
  explodeAt: number;
}
interface Rat {
  id: number;
  kind: RatKind;
  lane: number;
  x: number; // vị trí mũi chuột (đơn vị ô), đi từ phải (cols) về trái (0 = sát nhà)
  hp: number;
  maxHp: number;
  slowUntil: number;
}
interface Proj {
  lane: number;
  x: number;
  kind: 'yarn' | 'thorn' | 'ice';
  dmg: number;
  owner: string;
  slowSec: number;
}
interface Planter {
  p: Person;
  dmg: number;
  kills: number;
  planted: number;
}

const t = (text: string, main = false): Say => ({ text: `M: ${text}`, main, priority: !main });

export class DefenseRoom {
  phase: Phase = 'rest';
  phaseEndsAt = 0;
  wave = 0;
  sun = GAME.startSun;
  houseHp = GAME.houseHp;
  dogs: boolean[] = Array(GAME.lanes).fill(true);
  defenders: Defender[] = [];
  rats: Rat[] = [];
  projs: Proj[] = [];
  planters = new Map<string, Planter>();
  musicOn = true;
  musicVolume = GAME.musicVolume;

  private spawnQueue: { kind: RatKind; lane: number; at: number }[] = [];
  private ratSeq = 0;
  private offerIdx = 0;
  offerEndsAt = 0; // public để test ép đổi offer
  private skyAt = 0;
  private likeCarry = 0;
  private sunRainAt = -1e9;
  private lastBoom: { lane: number; col: number; at: number } | null = null;
  private lastHintAt = -1e9;
  private lastIdleAt = 0;
  private lastTickAt = 0;
  private overAt = 0;

  constructor(
    private now0: number,
    private rand: () => number = Math.random,
  ) {
    this.lastTickAt = now0;
    this.offerEndsAt = now0 + GAME.offerEverySec * 1000;
    this.skyAt = now0 + GAME.skySunEverySec * 1000;
    this.phaseEndsAt = now0 + 6000; // vào phòng 6 giây là đợt 1 kéo tới
  }

  get offer(): DefKind {
    return OFFER_SEQ[this.offerIdx % OFFER_SEQ.length];
  }

  newSession(now: number): Say[] {
    this.planters.clear();
    this.startRun(now);
    return [t('Chào cả nhà! Mèo Thủ Vườn bắt đầu. Đàn chuột sắp kéo tới ăn vụng, cả phòng cùng trồng hậu vệ giữ vườn nha. Gõ số làn 1 tới 5 để trồng con đang cầm!', true)];
  }

  private startRun(now: number) {
    this.phase = 'rest';
    this.phaseEndsAt = now + 5000;
    this.wave = 0;
    this.sun = GAME.startSun;
    this.houseHp = GAME.houseHp;
    this.dogs = Array(GAME.lanes).fill(true);
    this.defenders = [];
    this.rats = [];
    this.projs = [];
    this.spawnQueue = [];
    this.likeCarry = 0;
  }

  join(p: Person, _now: number) {
    if (!this.planters.has(p.username)) this.planters.set(p.username, { p, dmg: 0, kills: 0, planted: 0 });
    else this.planters.get(p.username)!.p = p;
  }

  follow(p: Person, now: number): Say[] {
    this.join(p, now);
    this.sun = Math.min(GAME.sunCap, this.sun + GAME.followSun);
    return [t(`Cảm ơn ${p.spoken} vừa theo dõi! Cả vườn được tặng ${GAME.followSun} nắng.`)];
  }

  thank(p: Person, giftName: string): Say {
    return { ...t(`Cảm ơn ${p.spoken} tặng ${giftName}! Quà là tấm lòng, vườn không bán nắng đâu nha.`), priority: true };
  }

  like(count: number, now: number): Say[] {
    this.likeCarry += count;
    if (this.likeCarry < GAME.likeGoal) return [];
    this.likeCarry -= GAME.likeGoal;
    this.sun = Math.min(GAME.sunCap, this.sun + GAME.likeSun);
    this.sunRainAt = now;
    return [t(`Đủ ${GAME.likeGoal} tim! MƯA NẮNG xuống vườn, cộng ${GAME.likeSun} nắng cho cả phòng!`, true)];
  }

  /** gõ số làn 1-5 (đứng một mình trong bình luận, vd "3", "làn 3", "3 đi") -> trồng hậu vệ đang cầm */
  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    this.join(p, now);
    if (p.safe === false || this.phase === 'over') return [];
    const m = p.comment.replace(/[^\d]/g, ' ').split(/\s+/).map(Number).find((n) => n >= 1 && n <= GAME.lanes);
    if (!m) return [];
    return this.plant(p, m - 1, now);
  }

  private plant(p: Person, lane: number, now: number): Say[] {
    const kind = this.offer;
    const info = DEF_INFO[kind];
    const col = this.firstFreeCol(lane);
    if (col < 0) return this.hint(now, `Làn ${lane + 1} kín chỗ rồi, chọn làn khác nha cả nhà!`);
    if (this.sun < info.cost) return this.hint(now, `Chưa đủ nắng! ${info.name} cần ${info.cost} nắng, vườn đang có ${this.sun}. Chờ hoa đèn với mưa nắng nha.`);
    this.sun -= info.cost;
    this.defenders.push({ kind, lane, col, hp: info.hp, owner: p.username, nickname: p.nickname, lastShot: now, lastGen: now, explodeAt: kind === 'bom' ? now + 800 : 0 });
    this.planters.get(p.username)!.planted++;
    if (kind === 'bom') return [{ ...t(`${p.spoken} trồng Nấm Bom ở làn ${lane + 1}! Bùm một cái là bay cả cụm chuột!`), ttl: 25_000 }];
    return [{ ...t(`${p.spoken} trồng ${info.name} ở làn ${lane + 1}!`), ttl: 25_000 }];
  }

  private hint(now: number, text: string): Say[] {
    if (now - this.lastHintAt < 5000) return [];
    this.lastHintAt = now;
    return [{ ...t(text), ttl: 20_000 }];
  }

  private firstFreeCol(lane: number): number {
    for (let c = 0; c < GAME.cols; c++) if (!this.defenders.some((d) => d.lane === lane && d.col === c)) return c;
    return -1;
  }

  // ---------- đợt chuột ----------
  private startWave(now: number) {
    this.wave++;
    this.phase = 'wave';
    const mk = (kind: RatKind, at: number) => this.spawnQueue.push({ kind, lane: Math.floor(this.rand() * GAME.lanes), at });
    const n = Math.min(26, 5 + this.wave * 2);
    const gap = Math.max(1700, 3400 - this.wave * 130);
    const pool: RatKind[] = ['xam', 'xam', 'xam'];
    if (this.wave >= 2) pool.push('non');
    if (this.wave >= 3) pool.push('chay', 'chay');
    if (this.wave >= 4) pool.push('phomai');
    if (this.wave >= 5) pool.push('tui');
    for (let i = 0; i < n; i++) mk(pool[Math.floor(this.rand() * pool.length)], now + 1200 + i * gap * (0.75 + this.rand() * 0.5));
    if (this.wave % 5 === 0) mk('trum', now + 4000);
  }

  private spawnRat(kind: RatKind, lane: number) {
    const info = RAT_INFO[kind];
    const hp = Math.round(info.hp * (1 + (this.wave - 1) * 0.12) * (kind === 'trum' ? 1 + Math.floor(this.wave / 5 - 1) * 0.5 : 1));
    this.rats.push({ id: ++this.ratSeq, kind, lane, x: GAME.cols + 0.4 + this.rand() * 0.5, hp, maxHp: hp, slowUntil: 0 });
  }

  // ---------- vòng lặp ----------
  tick(now: number): Say[] {
    const out: Say[] = [];
    const dt = Math.min(0.25, Math.max(0, (now - this.lastTickAt) / 1000));
    this.lastTickAt = now;
    if (this.phase === 'over') {
      if (now >= this.overAt) {
        this.startRun(now);
        out.push(t('Ván mới! Vườn lại xanh, chó gác lại đủ đàn. Cả phòng trồng lại từ đầu nha!', true));
      }
      return out;
    }

    // đổi hậu vệ đang cầm
    if (now >= this.offerEndsAt) {
      this.offerIdx++;
      this.offerEndsAt = now + GAME.offerEverySec * 1000;
    }
    // nắng trời rơi
    if (now >= this.skyAt) {
      this.skyAt = now + GAME.skySunEverySec * 1000;
      this.sun = Math.min(GAME.sunCap, this.sun + GAME.skySunValue);
    }
    // hoa đèn thắp nắng
    for (const d of this.defenders) {
      if (d.kind === 'den' && now - d.lastGen >= 7000) {
        d.lastGen = now;
        this.sun = Math.min(GAME.sunCap, this.sun + 25);
      }
    }

    if (this.phase === 'rest' && now >= this.phaseEndsAt) {
      this.startWave(now);
      out.push(
        this.wave % 5 === 0
          ? t(`Đợt ${this.wave}: CHUỘT TRÙM RĂNG SẮT kéo quân tới! Cả phòng tập trung hỏa lực, đừng để trùm chạm nhà!`, true)
          : t(`Đợt ${this.wave} tới rồi! Chuột đang kéo vào vườn, gõ số làn để trồng hậu vệ chặn chúng!`, true),
      );
    }
    if (this.phase === 'wave') {
      while (this.spawnQueue.length && this.spawnQueue[0].at <= now) {
        const s = this.spawnQueue.shift()!;
        this.spawnRat(s.kind, s.lane);
      }
      this.combat(now, dt, out);
      if (!this.spawnQueue.length && !this.rats.length && this.phase === 'wave') {
        this.sun = Math.min(GAME.sunCap, this.sun + GAME.waveClearBonus);
        this.phase = 'rest';
        this.phaseEndsAt = now + GAME.restSec * 1000;
        const mvp = this.top(1)[0];
        out.push(
          t(
            `Dọn sạch đợt ${this.wave}! Thưởng ${GAME.waveClearBonus} nắng. ${mvp ? `Người hùng của vườn: ${mvp.p.spoken} với ${Math.round(mvp.dmg)} sát thương. ` : ''}Nghỉ ${GAME.restSec} giây, trồng thêm hậu vệ đi cả nhà!`,
            true,
          ),
        );
      }
    }
    if (!out.length && now - this.lastIdleAt > GAME.idleLineEveryMs && this.phase === 'rest') {
      this.lastIdleAt = now;
      out.push({ ...t('Đang yên ắng nè. Gõ số làn 1 tới 5 để trồng hậu vệ trước, đợt chuột sau là mệt đó!'), ttl: 15_000 });
    }
    return out;
  }

  private combat(now: number, dt: number, out: Say[]) {
    // hậu vệ bắn / nấm nổ
    for (const d of [...this.defenders]) {
      if (d.kind === 'bom') {
        if (now >= d.explodeAt) {
          this.lastBoom = { lane: d.lane, col: d.col, at: now };
          for (const r of this.rats) {
            if (Math.abs(r.lane - d.lane) <= 1 && r.x >= d.col - 1.2 && r.x <= d.col + 2.4) this.damage(r, 320, d.owner);
          }
          this.defenders = this.defenders.filter((x) => x !== d);
          out.push({ ...t('BÙM! Nấm Bom nổ tung, cả cụm chuột bay màu!'), ttl: 20_000 });
        }
        continue;
      }
      const spec = DEF_DMG[d.kind];
      if (!spec) continue;
      const target = this.rats.some((r) => r.lane === d.lane && r.x > d.col + 0.4 && r.x < GAME.cols + 1.3);
      if (target && (now - d.lastShot) / 1000 >= spec.rate) {
        d.lastShot = now;
        this.projs.push({ lane: d.lane, x: d.col + 0.9, kind: d.kind === 'len' ? 'yarn' : d.kind === 'rong' ? 'thorn' : 'ice', dmg: spec.dmg, owner: d.owner, slowSec: spec.slow ?? 0 });
      }
    }
    this.rats = this.rats.filter((r) => r.hp > 0);
    // đạn bay
    for (const pr of [...this.projs]) {
      pr.x += 5.5 * dt;
      const hit = this.rats
        .filter((r) => r.lane === pr.lane && r.hp > 0 && pr.x >= r.x && pr.x <= r.x + 0.85)
        .sort((a, b) => a.x - b.x)[0];
      if (hit) {
        this.damage(hit, pr.dmg, pr.owner);
        if (pr.slowSec) hit.slowUntil = now + pr.slowSec * 1000;
        this.projs = this.projs.filter((x) => x !== pr);
      } else if (pr.x > GAME.cols + 1.4) this.projs = this.projs.filter((x) => x !== pr);
    }
    this.rats = this.rats.filter((r) => r.hp > 0);
    // chuột đi / cắn
    for (const r of [...this.rats]) {
      const blocker = this.defenders
        .filter((d) => d.lane === r.lane && r.x <= d.col + 1 && r.x >= d.col - 0.15)
        .sort((a, b) => b.col - a.col)[0];
      if (blocker) {
        blocker.hp -= RAT_INFO[r.kind].bite * dt;
        if (blocker.hp <= 0) {
          this.defenders = this.defenders.filter((x) => x !== blocker);
          out.push({ ...t(`${DEF_INFO[blocker.kind].name} ở làn ${r.lane + 1} bị chuột gặm đổ rồi! Trồng lại nhanh!`), ttl: 20_000 });
        }
        continue;
      }
      r.x -= RAT_INFO[r.kind].speed * dt * (now < r.slowUntil ? 0.55 : 1);
      if (r.x <= -0.2) {
        this.rats = this.rats.filter((x) => x !== r);
        if (this.dogs[r.lane]) {
          this.dogs[r.lane] = false;
          const before = this.rats.length;
          this.rats = this.rats.filter((x) => x.lane !== r.lane);
          out.push(t(`Chó gác ở làn ${r.lane + 1} lao ra đuổi sạch ${before - this.rats.length + 1} con chuột! Làn này hết chó rồi đó nha!`, true));
        } else {
          this.houseHp--;
          out.push(t(`Chuột chui vào nhà rồi! Nhà còn ${this.houseHp} tim. Giữ chặt các làn lên cả nhà ơi!`, true));
          if (this.houseHp <= 0) {
            this.phase = 'over';
            this.overAt = now + GAME.overSec * 1000;
            const mvp = this.top(1)[0];
            out.push(t(`Nhà bị chuột khoắng sạch sau ${this.wave} đợt! ${mvp ? `Người hùng của ván: ${mvp.p.spoken}. ` : ''}15 giây nữa vườn làm lại, lần này giữ chặt hơn nha!`, true));
          }
        }
      }
    }
  }

  private damage(r: Rat, dmg: number, owner: string) {
    r.hp -= dmg;
    const pl = this.planters.get(owner);
    if (pl) {
      pl.dmg += dmg;
      if (r.hp <= 0 && r.hp + dmg > 0) {
        pl.kills++;
        if (r.kind === 'tui') this.sun = Math.min(GAME.sunCap, this.sun + 25);
        if (r.kind === 'trum') pl.dmg += 200; // thưởng vinh danh hạ trùm (chỉ tính bảng sát thương)
      }
    }
  }

  top(n: number): Planter[] {
    return [...this.planters.values()].filter((x) => x.dmg > 0).sort((a, b) => b.dmg - a.dmg || b.kills - a.kills).slice(0, n);
  }

  /** giữ nguyên trạng thái trong lúc MC đọc câu chính (hook gọi khi giọng đang bận) */
  hold(ms: number) {
    this.phaseEndsAt += ms;
    this.offerEndsAt += ms;
    this.skyAt += ms;
    this.lastTickAt += ms;
    if (this.lastBoom) this.lastBoom.at += ms;
    for (const s of this.spawnQueue) s.at += ms;
    for (const d of this.defenders) {
      d.lastShot += ms;
      d.lastGen += ms;
      if (d.explodeAt) d.explodeAt += ms;
    }
    for (const r of this.rats) if (r.slowUntil) r.slowUntil += ms;
    if (this.phase === 'over') this.overAt += ms;
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  /** Demo cho trang điều khiển / chụp hình: trồng sẵn vài hậu vệ + thả 1 đàn chuột giữa vườn */
  demoDefense(now: number): Say[] {
    this.sun = 400;
    const plantAs = (username: string, nickname: string, lane: number, kind: DefKind) => {
      const p = { username, nickname, spoken: nickname, avatar: '' };
      this.join(p, now);
      const col = this.firstFreeCol(lane);
      if (col >= 0) this.defenders.push({ kind, lane, col, hp: DEF_INFO[kind].hp, owner: username, nickname, lastShot: now, lastGen: now, explodeAt: 0 });
    };
    plantAs('demo1', 'Bạn An', 0, 'len');
    plantAs('demo2', 'Bạn Bình', 1, 'den');
    plantAs('demo1', 'Bạn An', 1, 'len');
    plantAs('demo3', 'Bạn Chi', 2, 'rong');
    plantAs('demo4', 'Bạn Dũng', 3, 'chau');
    plantAs('demo2', 'Bạn Bình', 3, 'len');
    plantAs('demo5', 'Bạn Hà', 4, 'bang');
    if (this.phase === 'rest') this.startWave(now);
    this.spawnQueue = [];
    this.spawnRat('xam', 0);
    this.spawnRat('non', 1);
    this.spawnRat('chay', 2);
    this.spawnRat('phomai', 3);
    this.spawnRat('xam', 4);
    for (const r of this.rats) r.x = 3.4 + this.rand() * 2.2;
    return [t('Demo: vườn đã trồng sẵn, chuột đang vào giữa sân. Xem hậu vệ bắn chúng nó kìa!', true)];
  }

  view(_now: number) {
    const off = DEF_INFO[this.offer];
    return {
      phase: this.phase,
      wave: this.wave,
      sun: Math.floor(this.sun),
      houseHp: this.houseHp,
      dogs: [...this.dogs],
      offer: { kind: this.offer, name: off.name, cost: off.cost, art: off.art, desc: off.desc, endsAt: this.offerEndsAt },
      phaseEndsAt: this.phaseEndsAt,
      defenders: this.defenders.map((d) => ({ kind: d.kind, lane: d.lane, col: d.col, hpPct: Math.max(0, d.hp / DEF_INFO[d.kind].hp), nickname: d.nickname, art: DEF_INFO[d.kind].art })),
      rats: this.rats.map((r) => ({ id: r.id, kind: r.kind, lane: r.lane, x: r.x, hpPct: Math.max(0, r.hp / r.maxHp), slowed: _now < r.slowUntil, art: RAT_INFO[r.kind].art, boss: r.kind === 'trum' })),
      projs: this.projs.map((p) => ({ lane: p.lane, x: p.x, kind: p.kind })),
      ratsLeft: this.spawnQueue.length + this.rats.length,
      top: this.top(5).map((x) => ({ nickname: x.p.nickname, dmg: Math.round(x.dmg), kills: x.kills })),
      sunRainAt: this.sunRainAt,
      lastBoom: this.lastBoom,
      planters: this.planters.size,
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}

export type DefenseView = ReturnType<DefenseRoom['view']>;
