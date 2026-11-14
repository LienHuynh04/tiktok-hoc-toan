// Engine Bug Đại Náo Nhà Sen: CẢ PHÒNG cùng điều khiển MỘT con mèo Bug phá nhà,
// Sen (máy) đuổi bắt liên tục. Không sảnh chờ, không chờ lượt: Bug không có lệnh
// thì tự đi phá lặt vặt, có lệnh thì cả phòng giành quyền lái.
// Lệnh chỉ có tác dụng ĐÚNG NGỮ CẢNH (ĐẨY cạnh đồ dễ vỡ, LEO ở rèm, ĐU trên đèn...);
// sai ngữ cảnh thì Bug làm trò hề, không phạt ai.
// Tiến trình CẢ BUỔI không reset theo chương: cân nặng (tim cả phòng nuôi),
// cấp mập, số LÌ. Quà chỉ được cảm ơn — không mua điểm/tốc độ/sức mạnh.
// Hàm thuần + đồng hồ/rng tiêm vào: test chạy tất định (bug.check.ts).

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

export type ZoneId =
  | 'floor' | 'table' | 'sofa' | 'curtains' | 'curtainTop' | 'chandelier'
  | 'shelf' | 'plant' | 'bin' | 'box' | 'robot';

export type Cmd = 'CHAY' | 'NHAY' | 'DAY' | 'LEO' | 'DU' | 'NE' | 'GIA_NGU' | 'AN_VA';

type BugPose = 'sit' | 'run' | 'jump' | 'push' | 'climb' | 'swing' | 'ride' | 'dodge' | 'sleep' | 'flop' | 'caught' | 'hide' | 'smug';
type SenState = 'chase' | 'stunned' | 'fooled' | 'holdBug' | 'wait';

export const ZONES: Record<ZoneId, { x: number; y: number; label: string }> = {
  floor: { x: 540, y: 1400, label: 'giữa sàn' },
  table: { x: 700, y: 1015, label: 'trên bàn' },
  sofa: { x: 270, y: 1330, label: 'trên sofa' },
  curtains: { x: 955, y: 1150, label: 'cạnh rèm' },
  curtainTop: { x: 955, y: 640, label: 'trên đỉnh rèm' },
  chandelier: { x: 540, y: 720, label: 'trên đèn chùm' },
  shelf: { x: 175, y: 735, label: 'trên kệ sách' },
  plant: { x: 520, y: 1420, label: 'cạnh chậu cây' },
  bin: { x: 945, y: 1410, label: 'cạnh thùng rác' },
  box: { x: 830, y: 1440, label: 'trong hộp carton' },
  robot: { x: 540, y: 1400, label: 'trên robot hút bụi' },
};

const LINKS: Record<ZoneId, ZoneId[]> = {
  floor: ['table', 'sofa', 'curtains', 'plant', 'shelf', 'bin', 'box'],
  table: ['floor', 'chandelier'],
  sofa: ['floor'],
  curtains: ['floor', 'curtainTop'],
  curtainTop: ['curtains'],
  chandelier: ['table'],
  shelf: ['floor'],
  plant: ['floor'],
  bin: ['floor'],
  box: ['floor'],
  robot: ['floor'],
};

export interface MissionDef {
  label: string;
  zone: ZoneId;
  action: Cmd;
  combo?: boolean;
}

export const MISSION_TEMPLATE: MissionDef[] = [
  { label: 'Đẩy cốc trên bàn', zone: 'table', action: 'DAY' },
  { label: 'Xô chậu cây', zone: 'plant', action: 'DAY' },
  { label: 'Leo rèm cửa', zone: 'curtains', action: 'LEO' },
  { label: 'Làm rơi sách trên kệ', zone: 'shelf', action: 'DAY' },
  { label: 'Cưỡi robot hút bụi', zone: 'robot', action: 'NHAY' },
  { label: 'Đu đèn chùm', zone: 'chandelier', action: 'DU', combo: true },
  { label: 'Đẩy lọ hoa trên bàn', zone: 'table', action: 'DAY' },
  { label: 'Đẩy đổ thùng rác', zone: 'bin', action: 'DAY' },
  { label: 'Nhảy tưng bừng trên sofa', zone: 'sofa', action: 'NHAY' },
  { label: 'Phá cả sofa', zone: 'sofa', action: 'DAY', combo: true },
];

interface VoteOption {
  word: string;
  label: string;
  zone: ZoneId;
  action: Cmd | 'CHUI';
}

const VOTE_POOL: { a: VoteOption; b: VoteOption }[] = [
  { a: { word: 'REM', label: 'Leo rèm', zone: 'curtains', action: 'LEO' }, b: { word: 'HOP', label: 'Chui hộp carton', zone: 'box', action: 'CHUI' } },
  { a: { word: 'BAN', label: 'Lên bàn phá', zone: 'table', action: 'DAY' }, b: { word: 'SOFA', label: 'Nhảy tưng trên sofa', zone: 'sofa', action: 'NHAY' } },
  { a: { word: 'DEN', label: 'Đu đèn chùm', zone: 'chandelier', action: 'DU' }, b: { word: 'ROBOT', label: 'Cưỡi robot hút bụi', zone: 'robot', action: 'NHAY' } },
];

const FAIL_LINES: Record<Cmd, string[]> = {
  CHAY: ['Bug chạy vòng vòng rồi tự chóng mặt!'],
  NHAY: ['Bug nhảy hụt, tiếp đất bằng mông!', 'Bug nhảy lên rồi... đứng yên tại chỗ!'],
  DAY: ['Bug đẩy không khí! Chẳng có gì rơi cả!', 'Bug giơ chân đẩy khoảng không, tự ngã ngửa!'],
  LEO: ['Ở đây không có gì để leo, Bug cào cào sàn nhà!', 'Bug leo hụt, trượt dài một đoạn!'],
  DU: ['Bug với chân lên trời — trên này làm gì có đèn!', 'Chưa lên được đèn mà đòi đu! Bug với với rồi thôi.'],
  NE: ['Chẳng ai đuổi mà Bug cũng né! Né ma à?', 'Bug né một cái bóng vô hình rồi lăn quay!'],
  GIA_NGU: ['Bug giả ngủ... rồi ngủ quên thật luôn!', 'Bug ngáp một cái rõ to, chẳng lừa được ai!'],
  AN_VA: ['Bug lăn ra ăn vạ một mình, Sen đứng xa nhìn khó hiểu!', 'Ăn vạ sai lúc rồi! Chẳng ai ở gần mà thương.'],
};

const SUCCESS_LINES: Partial<Record<Cmd, string[]>> = {
  DAY: ['Rơi rồi! Bug đẩy là rơi!', 'Một món nữa bay màu dưới chân Bug!'],
  LEO: ['Bug leo vèo vèo như khỉ!', 'Cao nữa, cao nữa! Bug leo giỏi quá!'],
  NHAY: ['Bug nhảy một phát thật đẹp!', 'Bay lên nào! Bug nhảy cao chưa!'],
  DU: ['Đu qua đu lại! Đèn chùm rung rinh theo Bug!', 'Bug đu đèn như diễn viên xiếc!'],
  NE: ['Né đẹp! Sen chụp hụt rồi!', 'Bug lách qua như gió, Sen bắt trượt!'],
  GIA_NGU: ['Sen tưởng Bug ngủ thật, đứng lại ngắm... Trúng kế rồi!', 'Bug nằm im thin thít, Sen chần chừ không nỡ bắt!'],
  AN_VA: ['Bug lăn ra ăn vạ! Sen hoảng quá đứng sững lại!', 'Màn ăn vạ đỉnh cao: Sen bối rối, Bug tranh thủ chuồn!'],
};

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

const CMD_MAP: Record<string, Cmd> = {
  CHAY: 'CHAY',
  NHAY: 'NHAY',
  DAY: 'DAY',
  LEO: 'LEO',
  DU: 'DU',
  NE: 'NE',
  'GIA NGU': 'GIA_NGU',
  'AN VA': 'AN_VA',
};

export function parseCommand(comment: string): Cmd | null {
  return CMD_MAP[plain(comment)] ?? null;
}

export const CMD_LABEL: Record<Cmd, string> = {
  CHAY: 'CHẠY',
  NHAY: 'NHẢY',
  DAY: 'ĐẨY',
  LEO: 'LEO',
  DU: 'ĐU',
  NE: 'NÉ',
  GIA_NGU: 'GIẢ NGỦ',
  AN_VA: 'ĂN VẠ',
};

export interface BugView {
  chapter: number;
  catches: number;
  catchesGoal: number;
  kg: number;
  fatStage: number;
  fatName: string;
  fatNextKg: number | null;
  fatUnlock: string;
  li: number;
  liMax: number;
  bug: { x: number; y: number; zone: ZoneId; pose: BugPose; facing: 1 | -1; scale: number; moving: boolean };
  sen: { x: number; y: number; state: SenState; facing: 1 | -1 };
  robot: { x: number; dir: 1 | -1; ridden: boolean };
  missions: { label: string; done: boolean }[];
  missionIdx: number;
  missionLabel: string;
  hint: string;
  combo: { have: number; need: number; remainSec: number } | null;
  vote: { aLabel: string; bLabel: string; aWord: string; bWord: string; a: number; b: number; remainSec: number } | null;
  banner: { kind: string; title: string; sub: string } | null;
  credit: { nickname: string; label: string } | null;
  lastAction: { text: string; kind: 'ok' | 'fail' | 'info' } | null;
  zoomies: boolean;
  chatters: number;
  senSpeed: number;
  simViewers: number;
  totals: { missions: number; catches: number; dodges: number; levelups: number; votes: number };
  musicOn: boolean;
  musicVolume: number;
}

interface MissionState extends MissionDef {
  done: boolean;
}

interface ComboState {
  need: number;
  users: Set<string>;
  endsAt: number;
}

interface VoteState {
  a: VoteOption;
  b: VoteOption;
  votesA: Set<string>;
  votesB: Set<string>;
  firstA: Person | null;
  firstB: Person | null;
  endsAt: number;
}

const SEN_HOME = { x: 100, y: 780 };

export class BugRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;
  simViewers = 0;

  private startedAt: number;
  private lastTickAt: number;
  private bug = { x: ZONES.floor.x, y: ZONES.floor.y, zone: 'floor' as ZoneId, movingTo: null as ZoneId | null, pose: 'sit' as BugPose, poseUntil: 0, facing: 1 as 1 | -1 };
  private sen = { x: SEN_HOME.x, y: SEN_HOME.y, state: 'chase' as SenState, stateUntil: 0, facing: 1 as 1 | -1 };
  private robot = { x: 300, dir: 1 as 1 | -1 };
  private ridingUntil = 0;
  private hangUntil = 0;
  private graceUntil = 0;
  private caughtUntil = 0;
  private li = GAME.liStart;
  private catches = 0;
  private chapter = 1;
  private missions: MissionState[] = [];
  private combo: ComboState | null = null;
  private vote: VoteState | null = null;
  private nextVoteAt: number;
  private voteIdx = 0;
  private likesPool = 0;
  private zoomiesMeter = 0;
  private zoomiesUntil = 0;
  private chatters = new Map<string, number>();
  private lastActionAt: number;
  private lastAction: { text: string; kind: 'ok' | 'fail' | 'info'; at: number } | null = null;
  private banner: { kind: string; title: string; sub: string; until: number } | null = null;
  private credit: { nickname: string; label: string; until: number } | null = null;
  private totals = { missions: 0, catches: 0, dodges: 0, levelups: 0, votes: 0 };
  private lastIdleLineAt: number;
  private idleLineIdx = 0;
  private anVaLiUntil = 0;
  private neLiUntil = 0;

  constructor(now: number, private rng: () => number = Math.random) {
    this.startedAt = now;
    this.lastTickAt = now;
    this.lastActionAt = now;
    this.lastIdleLineAt = now;
    this.nextVoteAt = now + GAME.voteFirstMs;
    this.missions = MISSION_TEMPLATE.map((m) => ({ ...m, done: false }));
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  // ---------- Số liệu suy ra ----------
  kg(): number {
    return Math.min(GAME.kgMax, GAME.kgStart + this.likesPool * GAME.kgPerLike);
  }

  fatStage(): number {
    const kg = this.kg();
    let stage = 1;
    for (const t of GAME.fatThresholds) if (kg >= t) stage++;
    return stage;
  }

  activeChatters(now: number): number {
    let n = 0;
    for (const at of this.chatters.values()) if (now - at < GAME.chatterWindowMs) n++;
    return Math.max(n, this.simViewers);
  }

  senSpeed(now: number): number {
    const minutes = (now - this.startedAt) / 60_000;
    const byTime = Math.min(GAME.senTimeCap, minutes * GAME.senPerMinute);
    const byChatters = Math.min(GAME.senChatterCap, this.activeChatters(now) * GAME.senPerChatter);
    return GAME.senBaseSpeed + byTime + byChatters;
  }

  bugSpeed(): number {
    const fat = 1 - GAME.bugFatSlowPerStage * (this.fatStage() - 1);
    return GAME.bugBaseSpeed * fat;
  }

  comboNeed(now: number): number {
    const raw = GAME.comboBase + Math.floor(this.activeChatters(now) * GAME.comboPerChatters);
    const capped = Math.min(GAME.comboCap, raw);
    return Math.max(2, capped - (this.fatStage() - 1)); // mập thì phá khỏe: ngưỡng combo nhẹ đi
  }

  private senDist(): number {
    return Math.hypot(this.sen.x - this.bug.x, this.sen.y - this.bug.y);
  }

  private setAction(text: string, kind: 'ok' | 'fail' | 'info', now: number) {
    this.lastAction = { text, kind, at: now };
    this.lastActionAt = now;
  }

  private setBanner(kind: string, title: string, sub: string, now: number, ms = 4200) {
    this.banner = { kind, title, sub, until: now + ms };
  }

  private currentMission(): MissionState | null {
    return this.missions.find((m) => !m.done) ?? null;
  }

  // ---------- Buổi / chào / cảm ơn ----------
  newSession(now: number): Say[] {
    const fresh = new BugRoom(now, this.rng);
    fresh.musicOn = this.musicOn;
    fresh.musicVolume = this.musicVolume;
    fresh.simViewers = this.simViewers;
    Object.assign(this, fresh);
    return [
      { text: F('Chào cả nhà! Bug Đại Náo Nhà Sen bắt đầu rồi đây!'), main: true },
      { text: F('Cả phòng cùng lái Bug phá nhà nhé: gõ ĐẨY khi Bug ở cạnh bàn, LEO ở rèm, ĐU khi Bug ở trên đèn chùm. Lệnh đúng chỗ mới có tác dụng, sai chỗ là Bug làm trò hề đấy!') },
      { text: F('Sen đang rình bắt Bug kia kìa. Gõ NÉ, GIẢ NGỦ, ĂN VẠ để cứu Bug lúc nguy cấp nhé cả nhà!') },
    ];
  }

  join(_p: Person, _now: number): Say[] {
    return [];
  }

  follow(p: Person, _now: number): Say[] {
    return [{ text: F(`Chào bạn ${p.spoken} mới theo dõi phòng! Bug đang phá nhà, gõ lệnh lái Bug cùng cả phòng nhé!`) }];
  }

  thank(p: Person, giftName: string): Say[] {
    // Quà CHỈ được cảm ơn: không điểm, không tốc độ, không sức mạnh, không miễn bắt.
    return [{ text: F(`Cảm ơn ${p.spoken} đã tặng ${giftName}! Bug cúi đầu cảm ơn bạn nhiều lắm!`), priority: true }];
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  // ---------- Chat: vote hoặc lệnh ----------
  chat(p: Person, comment: string, now: number): Say[] {
    this.chatters.set(p.username, now);
    if (this.vote) return this.castVote(p, comment, now);
    const cmd = parseCommand(comment);
    if (!cmd) return [];
    return this.doCommand(p, cmd, now);
  }

  private castVote(p: Person, comment: string, _now: number): Say[] {
    const v = this.vote!;
    const tokens = plain(comment).split(' ');
    const votedA = tokens.includes(v.a.word);
    const votedB = tokens.includes(v.b.word);
    if (!votedA && !votedB) return [];
    if (v.votesA.has(p.username) || v.votesB.has(p.username)) return [];
    if (votedA) {
      v.votesA.add(p.username);
      if (!v.firstA) v.firstA = p;
    } else {
      v.votesB.add(p.username);
      if (!v.firstB) v.firstB = p;
    }
    return [];
  }

  private missionMatches(m: MissionState): boolean {
    if (m.zone === 'curtains') return this.bug.zone === 'curtains' || this.bug.zone === 'curtainTop';
    return this.bug.zone === m.zone;
  }

  /** Lệnh đúng ngữ cảnh cho 1 nhiệm vụ cụ thể chưa (chưa tính combo)? */
  private contextOk(cmd: Cmd): boolean {
    const z = this.bug.zone;
    switch (cmd) {
      case 'CHAY':
        return true;
      case 'DAY':
        return z === 'table' || z === 'plant' || z === 'shelf' || z === 'bin' || z === 'sofa';
      case 'LEO':
        return z === 'curtains' || z === 'curtainTop' || z === 'shelf';
      case 'DU':
        return z === 'chandelier';
      case 'NHAY':
        return true; // nhảy lúc nào cũng được, tác dụng tùy chỗ (xử lý ở doCommand)
      case 'NE':
        return this.senDist() < 270;
      case 'GIA_NGU':
        return this.senDist() < 430;
      case 'AN_VA':
        return this.senDist() < 210;
    }
  }

  private doCommand(p: Person, cmd: Cmd, now: number): Say[] {
    const says: Say[] = [];
    const z = this.bug.zone;
    const mission = this.currentMission();

    // --- Combo đang chạy cho nhiệm vụ hiện tại: đếm tiếp ---
    if (this.combo && mission?.combo && cmd === mission.action && this.contextOk(cmd)) {
      if (this.combo.users.has(p.username)) {
        this.setAction(`${p.nickname} đã góp lệnh rồi — chờ thêm bạn khác nhé!`, 'info', now);
        return says;
      }
      this.combo.users.add(p.username);
      this.applyActionPose(cmd, now);
      this.setAction(`Combo ${mission.label}: ${this.combo.users.size}/${this.combo.need}!`, 'ok', now);
      if (this.combo.users.size >= this.combo.need) {
        this.combo = null;
        says.push(...this.completeMission(p, now));
      }
      return says;
    }

    if (!this.contextOk(cmd)) {
      this.bug.pose = cmd === 'GIA_NGU' ? 'sleep' : cmd === 'AN_VA' ? 'flop' : 'jump';
      this.bug.poseUntil = now + 1400;
      this.setAction(this.pick(FAIL_LINES[cmd]), 'fail', now);
      return says;
    }

    // --- Lệnh đúng ngữ cảnh ---
    switch (cmd) {
      case 'CHAY': {
        this.moveBugTowardMission(now);
        this.setAction('Bug chạy đi phá tiếp!', 'ok', now);
        break;
      }
      case 'NHAY': {
        if (z === 'table') {
          this.sendBugTo('chandelier');
          this.hangUntil = now + GAME.hangMs;
          this.bug.pose = 'swing';
          this.bug.poseUntil = now + GAME.hangMs;
          this.setAction('Bug nhảy vớ được đèn chùm!', 'ok', now);
        } else if (z === 'floor' && Math.abs(this.bug.x - this.robot.x) < 210) {
          this.bug.zone = 'robot';
          this.ridingUntil = now + GAME.rideMs;
          this.bug.pose = 'ride';
          this.bug.poseUntil = now + GAME.rideMs;
          this.setAction('Bug nhảy lên robot hút bụi!', 'ok', now);
        } else {
          this.bug.pose = 'jump';
          this.bug.poseUntil = now + 1100;
          this.setAction(this.pick(SUCCESS_LINES.NHAY!), 'ok', now);
        }
        break;
      }
      case 'LEO': {
        if (z === 'curtains') {
          this.sendBugTo('curtainTop');
          this.bug.pose = 'climb';
          this.bug.poseUntil = now + 2200;
        } else {
          this.bug.pose = 'climb';
          this.bug.poseUntil = now + 1600;
        }
        this.setAction(this.pick(SUCCESS_LINES.LEO!), 'ok', now);
        break;
      }
      case 'DU': {
        this.hangUntil = Math.max(this.hangUntil, now + 2500);
        this.bug.pose = 'swing';
        this.bug.poseUntil = now + 2200;
        this.setAction(this.pick(SUCCESS_LINES.DU!), 'ok', now);
        break;
      }
      case 'NE': {
        this.dodgeTo(now, 'Né đẹp! Bug lách đi mất rồi!');
        if (now >= this.neLiUntil && this.li < GAME.liMax) {
          this.li++;
          this.neLiUntil = now + 15_000;
        }
        break;
      }
      case 'GIA_NGU': {
        this.bug.pose = 'sleep';
        this.bug.poseUntil = now + 2600;
        this.sen.state = 'fooled';
        this.sen.stateUntil = now + 3000;
        this.setAction(this.pick(SUCCESS_LINES.GIA_NGU!), 'ok', now);
        break;
      }
      case 'AN_VA': {
        this.bug.pose = 'flop';
        this.bug.poseUntil = now + 2200;
        this.sen.state = 'stunned';
        this.sen.stateUntil = now + 2500;
        this.setAction(this.pick(SUCCESS_LINES.AN_VA!), 'ok', now);
        if (now >= this.anVaLiUntil && this.li < GAME.liMax) {
          this.li++;
          this.anVaLiUntil = now + 20_000;
        }
        break;
      }
      default: {
        this.applyActionPose(cmd, now);
        this.setAction(this.pick(SUCCESS_LINES[cmd] ?? SUCCESS_LINES.DAY!), 'ok', now);
      }
    }

    // --- Trúng nhiệm vụ hiện tại? ---
    if (mission && cmd === mission.action && this.missionMatches(mission)) {
      if (mission.combo) {
        if (!this.combo) {
          this.combo = { need: this.comboNeed(now), users: new Set([p.username]), endsAt: now + GAME.comboWindowMs };
          this.setAction(`Combo "${mission.label}" bắt đầu: cần ${this.combo.need} lệnh trong 5 giây! (1/${this.combo.need})`, 'ok', now);
          if (this.combo.users.size >= this.combo.need) {
            this.combo = null;
            says.push(...this.completeMission(p, now));
          }
        }
      } else {
        says.push(...this.completeMission(p, now));
      }
    }
    return says;
  }

  private applyActionPose(cmd: Cmd, now: number) {
    const pose: BugPose = cmd === 'DAY' ? 'push' : cmd === 'DU' ? 'swing' : cmd === 'LEO' ? 'climb' : cmd === 'NHAY' ? 'jump' : 'sit';
    this.bug.pose = pose;
    this.bug.poseUntil = now + 1500;
    if (cmd === 'DU') this.hangUntil = Math.max(this.hangUntil, now + 2500);
  }

  private dodgeTo(now: number, text: string) {
    // Né / bị bắt hụt: Bug chuồn tới vùng sàn xa Sen nhất
    const far = (['floor', 'sofa', 'box', 'table'] as ZoneId[])
      .map((zid) => ({ zid, d: Math.hypot(this.sen.x - ZONES[zid].x, this.sen.y - ZONES[zid].y) }))
      .sort((a, b) => b.d - a.d)[0].zid;
    this.sendBugTo(far);
    this.bug.pose = 'dodge';
    this.bug.poseUntil = now + 1500;
    this.graceUntil = now + GAME.graceMs;
    this.setAction(text, 'ok', now);
  }

  private moveBugTowardMission(now: number) {
    const mission = this.currentMission();
    const from = this.bug.zone === 'robot' ? 'floor' : this.bug.zone;
    if (this.bug.zone === 'robot') {
      this.bug.zone = 'floor';
      this.bug.x = this.robot.x;
      this.bug.y = ZONES.floor.y;
      this.ridingUntil = 0;
    }
    // Tìm bước đi tiếp theo về phía vùng nhiệm vụ (BFS trên đồ thị vùng)
    let target: ZoneId | null = null;
    if (mission && from !== mission.zone) {
      const prev = new Map<ZoneId, ZoneId | null>([[from, null]]);
      const queue: ZoneId[] = [from];
      while (queue.length) {
        const cur = queue.shift()!;
        if (cur === mission.zone) break;
        for (const nb of LINKS[cur]) {
          if (!prev.has(nb)) {
            prev.set(nb, cur);
            queue.push(nb);
          }
        }
      }
      if (prev.has(mission.zone)) {
        let cur: ZoneId = mission.zone;
        while (prev.get(cur) && prev.get(cur) !== from) cur = prev.get(cur)!;
        if (prev.get(cur) === from) target = cur;
      }
    }
    const neighbors = LINKS[from].filter((zid) => zid !== 'chandelier');
    if (!target || target === 'chandelier' || this.rng() >= 0.68) {
      target = this.pick(neighbors.length ? neighbors : (['floor'] as ZoneId[]));
    }
    if (target === from) target = 'floor';
    this.bug.movingTo = target;
    this.bug.pose = 'run';
    this.bug.poseUntil = now + 900;
    void now;
  }

  private completeMission(creditPerson: Person, now: number): Say[] {
    const m = this.currentMission();
    if (!m) return [];
    m.done = true;
    this.totals.missions++;
    if (this.li < GAME.liMax) this.li++;
    this.credit = { nickname: creditPerson.nickname, label: m.label, until: now + 7000 };
    const says: Say[] = [
      { text: F(`Hoàn thành nhiệm vụ "${m.label}"! Lệnh quyết định là của ${creditPerson.spoken}. Cả phòng giỏi quá!`), main: true },
    ];
    if (this.missions.every((x) => x.done)) {
      this.chapter++;
      this.catches = 0;
      this.totals.votes += 0; // giữ totals nhất quán
      this.setBanner('chapterwin', 'CẢ PHÒNG THẮNG CHƯƠNG!', `Phá sạch danh sách! Sang chương ${this.chapter}`, now, 6000);
      says.push({ text: F(`Cả phòng thắng chương rồi! Danh sách phá đã sạch trơn. Chương ${this.chapter} bắt đầu ngay đây, nhiệm vụ mới toanh!`), main: true });
      const rest = MISSION_TEMPLATE.slice(0, 9);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      this.missions = [...rest, MISSION_TEMPLATE[9]].map((x) => ({ ...x, done: false }));
      this.combo = null;
      this.sendBugTo('floor');
      this.sendSenHome();
    } else {
      this.setBanner('mission', 'PHÁ ĐƯỢC RỒI!', m.label, now);
      const next = this.currentMission();
      if (next) says.push({ text: F(`Nhiệm vụ tiếp theo: ${next.label}. ${next.combo ? 'Nhiệm vụ này cần cả phòng gõ cùng lúc đấy!' : ''}`) });
    }
    return says;
  }

  // ---------- Tim: nuôi Bug lớn (tiến trình cả buổi) ----------
  like(_p: Person, count: number, now: number): Say[] {
    const says: Say[] = [];
    const n = Math.max(0, Math.floor(count) || 0);
    if (n <= 0) return says;
    const stageBefore = this.fatStage();
    this.likesPool += n;
    this.zoomiesMeter += n;
    const stageAfter = this.fatStage();
    if (stageAfter > stageBefore) {
      this.totals.levelups++;
      this.setBanner('levelup', `LÊN CẤP ${stageAfter} · ${GAME.fatNames[stageAfter - 1]}!`, `Bug nặng ${this.kg().toFixed(1).replace('.', ',')} kg — mở khóa: ${GAME.fatUnlocks[stageAfter - 1]}`, now, 6000);
      says.push({ text: F(`Lên cấp mập rồi cả nhà ơi! Bug giờ là ${GAME.fatNames[stageAfter - 1]}, nặng ${this.kg().toFixed(1).replace('.', ',')} ki lô gam! Mưa cá ăn mừng nào!`), main: true });
    }
    if (this.zoomiesMeter >= GAME.zoomiesGoal) {
      this.zoomiesMeter -= GAME.zoomiesGoal;
      this.zoomiesUntil = now + GAME.zoomiesMs;
      this.setBanner('zoomies', 'ZOOMIES!', 'Bug tăng động chạy khắp nhà, Sen bắt không kịp!', now, GAME.zoomiesMs);
      says.push({ text: F('Bug zoomies rồi! Chạy như bay luôn, Sen đuổi theo không kịp đâu!'), main: true });
    }
    return says;
  }

  // ---------- Vote ----------
  forceVote(now: number): Say[] {
    if (this.vote) return [];
    const pair = VOTE_POOL[this.voteIdx % VOTE_POOL.length];
    this.voteIdx++;
    this.vote = { a: pair.a, b: pair.b, votesA: new Set(), votesB: new Set(), firstA: null, firstB: null, endsAt: now + GAME.voteMs };
    return [{ text: F(`Vote nhanh cả nhà ơi! Gõ ${this.vote.a.word} để ${this.vote.a.label.toLowerCase()}, gõ ${this.vote.b.word} để ${this.vote.b.label.toLowerCase()}. Mười giây, phía đông hơn thắng!`), main: true }];
  }

  private resolveVote(now: number): Say[] {
    const v = this.vote!;
    this.vote = null;
    this.nextVoteAt = now + GAME.voteEveryMinMs + Math.floor(this.rng() * GAME.voteEveryVarMs);
    this.totals.votes++;
    const aWin = v.votesA.size === v.votesB.size ? this.rng() < 0.5 : v.votesA.size > v.votesB.size;
    const win = aWin ? v.a : v.b;
    const winFirst = aWin ? v.firstA : v.firstB;
    const winCount = aWin ? v.votesA.size : v.votesB.size;
    const loseCount = aWin ? v.votesB.size : v.votesA.size;
    // Bug làm theo kết quả vote
    if (win.zone === 'chandelier') {
      this.sendBugTo('chandelier');
      this.hangUntil = now + GAME.hangMs;
      this.bug.pose = 'swing';
      this.bug.poseUntil = now + GAME.hangMs;
    } else if (win.zone === 'robot') {
      this.bug.zone = 'robot';
      this.ridingUntil = now + GAME.rideMs;
      this.bug.pose = 'ride';
      this.bug.poseUntil = now + GAME.rideMs;
    } else {
      this.sendBugTo(win.zone === 'curtains' && win.action === 'LEO' ? 'curtainTop' : win.zone);
      this.bug.pose = win.action === 'CHUI' ? 'hide' : win.action === 'DAY' ? 'push' : win.action === 'LEO' ? 'climb' : 'jump';
      this.bug.poseUntil = now + 2200;
    }
    this.setBanner('vote', `VOTE: ${win.label.toUpperCase()} THẮNG!`, `${winCount} phiếu — ${loseCount} phiếu`, now);
    const says: Say[] = [{ text: F(`Kết quả vote: ${win.label} thắng với ${winCount} phiếu! Bug làm ngay đây!`), main: true }];
    const mission = this.currentMission();
    if (mission && winFirst && win.action === mission.action && this.missionMatches(mission)) {
      says.push(...this.completeMission(winFirst, now));
    }
    return says;
  }

  // ---------- Tick ----------
  tick(now: number): Say[] {
    const says: Say[] = [];
    const dt = Math.min(0.5, Math.max(0, (now - this.lastTickAt) / 1000));
    this.lastTickAt = now;
    if (dt <= 0) return says;

    // Robot hút bụi chạy qua lại; Bug cưỡi thì đi theo
    const ridden = now < this.ridingUntil && this.bug.zone === 'robot';
    const robotSpeed = ridden ? 128 : 46;
    this.robot.x += this.robot.dir * robotSpeed * dt;
    if (this.robot.x > 950) { this.robot.x = 950; this.robot.dir = -1; }
    if (this.robot.x < 130) { this.robot.x = 130; this.robot.dir = 1; }
    if (ridden) {
      this.bug.x = this.robot.x;
      this.bug.y = ZONES.robot.y;
      this.bug.facing = this.robot.dir;
    } else if (this.bug.zone === 'robot') {
      this.bug.zone = 'floor';
      this.bug.x = this.robot.x;
      this.bug.y = ZONES.floor.y;
    }

    // Bug di chuyển tới vùng đích (lệnh CHẠY / tự đi dạo)
    if (this.bug.movingTo) {
      const dest = ZONES[this.bug.movingTo];
      const dx = dest.x - this.bug.x;
      const dy = dest.y - this.bug.y;
      const dist = Math.hypot(dx, dy);
      const step = this.bugSpeed() * (now < this.zoomiesUntil ? 2.1 : 1) * dt;
      if (dist <= step || dist < 4) {
        this.bug.x = dest.x;
        this.bug.y = dest.y;
        this.bug.zone = this.bug.movingTo;
        this.bug.movingTo = null;
        if (this.bug.pose === 'run') this.bug.pose = 'sit';
      } else {
        this.bug.x += (dx / dist) * step;
        this.bug.y += (dy / dist) * step;
        this.bug.facing = dx >= 0 ? 1 : -1;
      }
    }

    // Đu đèn hết giờ thì thả xuống bàn
    if (this.bug.zone === 'chandelier' && now > this.hangUntil && this.hangUntil > 0) {
      this.hangUntil = 0;
      this.sendBugTo('table');
      this.bug.pose = 'jump';
      this.bug.poseUntil = now + 900;
      this.setAction('Bug thả tay rơi xuống bàn!', 'info', now);
    }

    // Combo hết giờ mà chưa đủ: tan, làm lại từ đầu (không phạt)
    if (this.combo && now > this.combo.endsAt) {
      this.combo = null;
      this.setAction('Combo tan rồi! Cả phòng gõ lại cùng lúc nhé!', 'info', now);
    }

    // Vote: tới giờ thì mở, hết giờ thì chốt
    if (!this.vote && now >= this.nextVoteAt && !this.combo) says.push(...this.forceVote(now));
    if (this.vote && now >= this.vote.endsAt) says.push(...this.resolveVote(now));

    // Cảnh bị bắt kết thúc: trả Bug về sàn, Sen về cửa
    if (this.sen.state === 'holdBug' && now >= this.caughtUntil) {
      this.sendBugTo('floor');
      this.sendSenHome();
      this.graceUntil = now + GAME.graceMs;
    }

    // Sen đuổi
    const senBusy = (this.sen.state === 'stunned' || this.sen.state === 'fooled' || this.sen.state === 'holdBug') && now < this.sen.stateUntil;
    if (this.sen.state !== 'holdBug' && !senBusy) {
      if (this.sen.state !== 'chase') this.sen.state = 'chase';
      const safe = this.bug.zone === 'chandelier' || this.bug.zone === 'curtainTop';
      const tx = safe ? this.bug.x : this.bug.x;
      const ty = safe ? 1500 : this.bug.y;
      const dx = tx - this.sen.x;
      const dy = ty - this.sen.y;
      const dist = Math.hypot(dx, dy);
      const stopAt = this.vote ? 300 : 0;
      if (dist > stopAt) {
        const step = Math.min(dist - stopAt, this.senSpeed(now) * dt);
        this.sen.x += (dx / dist) * step;
        this.sen.y += (dy / dist) * step;
        this.sen.facing = dx >= 0 ? 1 : -1;
      }
      if (safe) this.sen.state = 'wait';
    }

    // Bắt?
    const canCatch =
      now >= this.graceUntil &&
      !this.vote &&
      now >= this.zoomiesUntil &&
      this.sen.state !== 'holdBug' &&
      this.bug.zone !== 'chandelier' &&
      this.bug.zone !== 'curtainTop';
    if (canCatch && this.senDist() < GAME.catchDist) {
      says.push(...this.attemptCatch(now));
    }

    // Không ai lái: Bug tự đi phá lặt vặt cho màn hình luôn sống
    if (!this.vote && this.sen.state !== 'holdBug' && now - this.lastActionAt > GAME.idleRoamMs) {
      this.moveBugTowardMission(now);
      this.setAction('Chưa ai lái, Bug tự đi lượn một vòng…', 'info', now);
    }

    // MC nhắc luật khi phòng im lặng lâu
    if (now - this.lastIdleLineAt > GAME.idleLineEveryMs && !this.vote) {
      this.lastIdleLineAt = now;
      const lines = [
        F('Cả phòng gõ lệnh để lái Bug nhé: ĐẨY, LEO, ĐU, NHẢY, CHẠY. Lệnh phải đúng chỗ Bug đang đứng mới có tác dụng!'),
        F('Sen càng lúc càng nhanh đấy. Thấy Sen tới gần thì gõ NÉ hoặc ĂN VẠ cứu Bug nhé!'),
        F(`Nhiệm vụ hiện tại: ${this.currentMission()?.label ?? 'đã phá sạch'} — cả phòng phối hợp hoàn thành nào!`),
      ];
      says.push({ text: lines[this.idleLineIdx++ % lines.length] });
    }
    return says;
  }

  private attemptCatch(now: number): Say[] {
    if (this.li > 0) {
      // Còn LÌ: tốn 1 LÌ, Bug tuột khỏi tay Sen, mặt tỉnh bơ
      this.li--;
      this.totals.dodges++;
      this.sen.state = 'stunned';
      this.sen.stateUntil = now + GAME.senStunMs;
      this.dodgeTo(now, 'Sen chụp được... mà Bug tuột mất! Độ lì cứu Bug!');
      this.bug.pose = 'smug';
      this.bug.poseUntil = now + 1800;
      this.setBanner('dodge', 'NÉ ĐƯỢC!', `Tốn 1 LÌ — còn ${this.li} LÌ`, now);
      return [{ text: F('Ối! Sen chụp được mà Bug tuột mất rồi! Độ lì của Bug đỉnh thật, mà tốn mất một LÌ rồi đấy!'), main: true }];
    }
    this.catches++;
    this.totals.catches++;
    this.sen.state = 'holdBug';
    this.sen.stateUntil = now + 2800;
    this.caughtUntil = now + 2800;
    this.bug.x = this.sen.x + 60;
    this.bug.y = this.sen.y + 30;
    this.bug.pose = 'caught';
    this.bug.poseUntil = now + 2800;
    this.combo = null;
    const says: Say[] = [{ text: F(`Bắt được rồi! Sen tóm được Bug rồi cả nhà ơi! Lần bắt thứ ${this.catches} trong chương này!`), main: true }];
    if (this.catches >= GAME.catchesToLose) {
      this.chapter++;
      this.catches = 0;
      this.setBanner('chapterlose', 'SEN THẮNG CHƯƠNG!', `Chương ${this.chapter} bắt đầu — danh sách phá giữ nguyên, cả phòng làm tiếp!`, now, 6000);
      says.push({ text: F(`Sen thắng chương này rồi! Nhưng đừng lo, tiến trình cả buổi vẫn còn nguyên: Bug vẫn nặng ${this.kg().toFixed(1).replace('.', ',')} ki lô gam, nhiệm vụ đã phá vẫn tính. Chương ${this.chapter}, cả phòng phục thù nào!`), main: true });
    } else {
      this.setBanner('caught', 'BUG BỊ BẮT!', `Lần ${this.catches}/${GAME.catchesToLose} trong chương — Bug xin lỗi Sen…`, now);
    }
    return says;
  }

  // ---------- Vị trí (dùng cho vote/test/trang điều khiển) ----------
  sendBugTo(zone: ZoneId) {
    if (zone === 'robot') {
      this.bug.zone = 'robot';
      this.bug.x = this.robot.x;
      this.bug.y = ZONES.robot.y;
      return;
    }
    this.bug.zone = zone;
    this.bug.x = ZONES[zone].x;
    this.bug.y = ZONES[zone].y;
    this.bug.movingTo = null;
  }

  sendSenTo(x: number, y: number) {
    this.sen.x = x;
    this.sen.y = y;
  }

  private sendSenHome() {
    this.sen.x = SEN_HOME.x;
    this.sen.y = SEN_HOME.y;
    this.sen.state = 'chase';
    this.sen.stateUntil = 0;
  }

  setSimViewers(n: number) {
    this.simViewers = Math.max(0, Math.floor(n) || 0);
  }

  /** Nút test ở trang điều khiển: nếm thử 1 nhiệm vụ + ít tim */
  demo(now: number): Say[] {
    const says: Say[] = [];
    const demoPerson: Person = { username: 'khach-demo', nickname: 'Khách Demo', spoken: 'Khách Demo', avatar: '' };
    this.sendBugTo('table');
    says.push(...this.doCommand(demoPerson, 'DAY', now));
    says.push(...this.like(demoPerson, 260, now));
    return says;
  }

  // ---------- Ảnh chụp cho stage / trang điều khiển ----------
  view(now: number): BugView {
    const stage = this.fatStage();
    const kg = this.kg();
    const mission = this.currentMission();
    const missionIdx = mission ? this.missions.indexOf(mission) : this.missions.length;
    const pose = now < this.bug.poseUntil ? this.bug.pose : this.bug.movingTo ? 'run' : 'sit';
    return {
      chapter: this.chapter,
      catches: this.catches,
      catchesGoal: GAME.catchesToLose,
      kg: Math.round(kg * 10) / 10,
      fatStage: stage,
      fatName: GAME.fatNames[stage - 1],
      fatNextKg: stage <= GAME.fatThresholds.length ? GAME.fatThresholds[stage - 1] : null,
      fatUnlock: GAME.fatUnlocks[stage - 1],
      li: this.li,
      liMax: GAME.liMax,
      bug: {
        x: Math.round(this.bug.x),
        y: Math.round(this.bug.y),
        zone: this.bug.zone,
        pose,
        facing: this.bug.facing,
        scale: 0.9 + (stage - 1) * 0.14,
        moving: !!this.bug.movingTo,
      },
      sen: { x: Math.round(this.sen.x), y: Math.round(this.sen.y), state: this.sen.state, facing: this.sen.facing },
      robot: { x: Math.round(this.robot.x), dir: this.robot.dir, ridden: this.bug.zone === 'robot' },
      missions: this.missions.map((m) => ({ label: m.label, done: m.done })),
      missionIdx,
      missionLabel: mission?.label ?? 'Đã phá sạch danh sách!',
      hint: mission
        ? `Nhiệm vụ: ${mission.label} — gõ ${CMD_LABEL[mission.action]} khi Bug ở ${ZONES[mission.zone].label}${mission.combo ? ' (cần cả phòng gõ cùng lúc!)' : ''}`
        : 'Danh sách phá đã sạch — chờ chương mới!',
      combo: this.combo
        ? { have: this.combo.users.size, need: this.combo.need, remainSec: Math.max(0, Math.ceil((this.combo.endsAt - now) / 1000)) }
        : null,
      vote: this.vote
        ? {
            aLabel: this.vote.a.label,
            bLabel: this.vote.b.label,
            aWord: this.vote.a.word,
            bWord: this.vote.b.word,
            a: this.vote.votesA.size,
            b: this.vote.votesB.size,
            remainSec: Math.max(0, Math.ceil((this.vote.endsAt - now) / 1000)),
          }
        : null,
      banner: this.banner && now < this.banner.until ? { kind: this.banner.kind, title: this.banner.title, sub: this.banner.sub } : null,
      credit: this.credit && now < this.credit.until ? { nickname: this.credit.nickname, label: this.credit.label } : null,
      lastAction: this.lastAction && now - this.lastAction.at < 6500 ? { text: this.lastAction.text, kind: this.lastAction.kind } : null,
      zoomies: now < this.zoomiesUntil,
      chatters: this.activeChatters(now),
      senSpeed: Math.round(this.senSpeed(now)),
      simViewers: this.simViewers,
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
    };
  }
}
