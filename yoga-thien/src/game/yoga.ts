// Engine Phòng Yoga Thiền: cả lớp tập theo tư thế người xem gọi (gõ tên tư thế là vào thế),
// không ai gọi thì lớp tự chảy theo chuỗi nhẹ nhàng FLOW. Quà/tim chỉ cảm ơn và tạo hiệu ứng,
// không đổi được lịch tập. Nhạc thiền do trang stage phát riêng (live/music.ts).

import { GAME } from './config';
import { POSES, POSE_BY_KEY, FLOW, findPose } from './poses';

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

export interface YogaView {
  poseKey: string;
  label: string;
  sanskrit: string;
  benefit: string;
  cell: number;
  byName: string | null;
  byUser: string | null;
  auto: boolean;
  remainSec: number;
  totalSec: number;
  queue: { label: string; byName: string }[];
  mats: { nickname: string; avatar: string; username: string; active: boolean }[];
  matCount: number;
  top: { nickname: string; count: number }[];
  totalPoses: number;
  likes: number;
  likeGoal: number;
  flowers: boolean;
  musicOn: boolean;
}

interface Req {
  key: string;
  by: Person;
}

const BREATH_LINES = [
  'F: Hít vào thật sâu… và thở ra thật chậm…',
  'F: Hít vào, đưa hơi lên đầy ngực… thở ra, thả lỏng vai xuống…',
  'F: Giữ thế thật nhẹ nhàng… hít thở đều, không cần gắng sức…',
];

const F = (s: string) => `F: ${s}`;

export class YogaRoom {
  private poseKey = 'sen';
  private by: Person | null = null;
  private startedAt = 0;
  private endsAt = 0;
  private midSaid = false;
  private breathIdx = 0;
  private queue: Req[] = [];
  private mats = new Map<string, Person>();
  private counts = new Map<string, { nickname: string; count: number }>();
  private lastReqAt = new Map<string, number>();
  private totalPoses = 0;
  private likes = 0;
  private flowersUntil = 0;
  private lastIdleAt = 0;
  musicOn = true;

  constructor(now: number) {
    this.startedAt = now;
    this.endsAt = now + GAME.poseSec * 1000;
    this.lastIdleAt = now;
  }

  newSession(now: number): Say[] {
    this.poseKey = 'sen';
    this.by = null;
    this.startedAt = now;
    this.endsAt = now + GAME.poseSec * 1000;
    this.midSaid = false;
    this.queue = [];
    this.mats.clear();
    this.counts.clear();
    this.lastReqAt.clear();
    this.totalPoses = 0;
    this.likes = 0;
    this.flowersUntil = 0;
    this.lastIdleAt = now;
    return [
      {
        main: true,
        text: F('Chào mừng cả nhà đến với Phòng Yoga Thiền. Lớp mình đang ngồi thiền với tư thế Hoa Sen. Bạn muốn tập tư thế nào, cứ gõ tên tư thế, ví dụ CÂY, HOA SEN hay CHIẾN BINH. Nhạc thiền đang mở, mình cùng hít thở thật chậm nhé.'),
      },
    ];
  }

  private startPose(key: string, by: Person | null, now: number): Say[] {
    const pose = POSE_BY_KEY[key];
    this.poseKey = key;
    this.by = by;
    this.startedAt = now;
    this.endsAt = now + GAME.poseSec * 1000;
    this.midSaid = false;
    if (by) {
      this.totalPoses++;
      const c = this.counts.get(by.username) ?? { nickname: by.nickname, count: 0 };
      c.count++;
      c.nickname = by.nickname;
      this.counts.set(by.username, c);
    }
    const who = by ? ` theo yêu cầu của ${by.spoken}` : '';
    return [
      { main: true, text: F(`Mời cả lớp${who} vào tư thế ${pose.label}. ${pose.guide}`) },
      { text: F(`Tư thế ${pose.label} giúp ${pose.benefit}.`), ttl: 45_000 },
    ];
  }

  private advance(now: number): Say[] {
    const next = this.queue.shift();
    if (next) return this.startPose(next.key, next.by, now);
    const idx = FLOW.indexOf(this.poseKey);
    return this.startPose(FLOW[(idx + 1) % FLOW.length], null, now);
  }

  /** Đồng hồ bị giữ trong lúc giọng chính đang đọc (hook gọi) */
  hold(ms: number) {
    this.startedAt += ms;
    this.endsAt += ms;
  }

  chat(p: Person & { comment: string; createTime?: number; safe?: boolean }, now: number): Say[] {
    const lines: Say[] = [];
    if (!this.mats.has(p.username)) {
      this.mats.set(p.username, p);
      if (this.mats.size <= 10) {
        lines.push({ text: F(`Chào ${p.spoken} đến với lớp yoga. Thảm của bạn đã sẵn sàng rồi.`), ttl: 20_000 });
      }
    }
    const pose = findPose(p.comment);
    if (!pose) return lines;
    if (now - (this.lastReqAt.get(p.username) ?? 0) < GAME.reqCooldownMs) return lines;
    this.lastReqAt.set(p.username, now);
    if (pose.key === this.poseKey && this.queue.length === 0) {
      lines.push({ text: F(`Lớp mình đang tập tư thế ${pose.label} rồi đó ${p.spoken}.`), ttl: 15_000 });
      return lines;
    }
    if (!this.by && this.queue.length === 0) {
      // Lớp đang tự tập: nhường ngay cho yêu cầu của khán giả
      return [...lines, ...this.startPose(pose.key, p, now)];
    }
    if (this.queue.length >= GAME.queueMax) {
      lines.push({ text: F(`Lịch tập đã xếp đủ rồi, ${p.spoken} đợi lớp tập xong ít phút nhé.`), ttl: 15_000 });
      return lines;
    }
    this.queue.push({ key: pose.key, by: p });
    lines.push({ text: F(`Đã ghi lịch tư thế ${pose.label} cho bạn ${p.spoken}.`), ttl: 20_000 });
    return lines;
  }

  /** Người mới bước vào phòng live: nhận thảm ngay, không đọc thành tiếng để khỏi ồn */
  join(p: Person) {
    if (!this.mats.has(p.username)) this.mats.set(p.username, p);
  }

  follow(p: Person): Say[] {
    if (!this.mats.has(p.username)) this.mats.set(p.username, p);
    return [{ text: F(`Cảm ơn ${p.spoken} đã theo dõi kênh. Mời bạn vào thảm, cùng lớp hít thở thư giãn nhé.`), ttl: 30_000 }];
  }

  thank(p: Person, giftName: string): Say[] {
    return [{ priority: true, text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName}. Chúc bạn một ngày thật an yên.`) }];
  }

  like(count: number, now: number): Say[] {
    this.likes += count;
    if (this.likes >= GAME.likeGoal) {
      this.likes -= GAME.likeGoal;
      this.flowersUntil = now + 7_000;
      return [{ text: F('Mưa cánh hoa sen tặng cả lớp mình nè. Cảm ơn cả nhà đã thả tim.'), ttl: 30_000 }];
    }
    return [];
  }

  /** Chủ phòng bấm nút: vào thẳng tư thế, hoặc chuyển bài */
  forcePose(key: string, now: number): Say[] {
    if (!POSE_BY_KEY[key]) return [];
    return this.startPose(key, null, now);
  }

  skip(now: number): Say[] {
    return this.advance(now);
  }

  chatterWindow(now: number): boolean {
    return now > this.startedAt + 2_500;
  }

  tick(now: number): Say[] {
    if (now >= this.endsAt) return this.advance(now);
    const lines: Say[] = [];
    if (!this.midSaid && now >= this.startedAt + (this.endsAt - this.startedAt) / 2) {
      this.midSaid = true;
      lines.push({ text: BREATH_LINES[this.breathIdx++ % BREATH_LINES.length], ttl: 25_000 });
    }
    if (this.mats.size === 0 && now - this.lastIdleAt > GAME.idleLineEveryMs) {
      this.lastIdleAt = now;
      lines.push({
        text: F('Mời bạn vào lớp yoga thư giãn cùng mình. Gõ tên tư thế như HOA SEN, CÂY, CHIẾN BINH hay THƯ GIÃN là cả lớp tập theo bạn ngay.'),
        ttl: 50_000,
      });
    }
    return lines;
  }

  view(now: number): YogaView {
    const pose = POSE_BY_KEY[this.poseKey] ?? POSES[0];
    return {
      poseKey: this.poseKey,
      label: pose.label,
      sanskrit: pose.sanskrit,
      benefit: pose.benefit,
      cell: pose.cell,
      byName: this.by?.nickname ?? null,
      byUser: this.by?.username ?? null,
      auto: !this.by,
      remainSec: Math.max(0, Math.ceil((this.endsAt - now) / 1000)),
      totalSec: GAME.poseSec,
      queue: this.queue.map((q) => ({ label: POSE_BY_KEY[q.key].label, byName: q.by.nickname })),
      mats: [...this.mats.values()].slice(0, 10).map((m) => ({
        nickname: m.nickname,
        avatar: m.avatar,
        username: m.username,
        active: this.by?.username === m.username,
      })),
      matCount: this.mats.size,
      top: [...this.counts.values()].sort((a, b) => b.count - a.count).slice(0, 5),
      totalPoses: this.totalPoses,
      likes: this.likes,
      likeGoal: GAME.likeGoal,
      flowers: now < this.flowersUntil,
      musicOn: this.musicOn,
    };
  }
}
