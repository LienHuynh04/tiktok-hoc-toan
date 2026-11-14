// Lớp hình ẢNH THẬT cho sân khấu Bug Đại Náo Nhà Sen (thay hình vẽ SVG phẳng).
// - Nền: tranh màu nước phòng khách của kênh (public/assets/room-bg.png, 1152x2048 -> sân khấu 1080x1920, tỉ lệ 0.9375 đều 2 trục).
// - Nhân vật: bộ sprite tư thế tách nền (public/assets/bug-*.png, sen-*.png).
// - Engine (bug.ts) vẫn làm việc ở toạ độ "phòng cũ"; module này WARP toạ độ engine -> toạ độ tranh
//   bằng nội suy Shepard qua các điểm neo zone (đo trực tiếp trên tranh), để Bug đứng đúng lên
//   kệ sách / bàn / sofa / rèm / đèn chùm trong tranh. Chỉ là lớp trình diễn — engine không đổi.
// - Nếu asset nào lỗi tải, BugStage tự rơi về hình SVG cũ (art.ts) để game không bao giờ gãy.

import type { ZoneId } from './bug';
import type { BugView } from './bug';

export const ART = {
  room: '/assets/room-bg.png',
  boxFront: '/assets/box-front.png',
  bug: {
    stand: '/assets/bug-sprite.png',
    run: '/assets/bug-run.png',
    climb: '/assets/bug-climb.png',
    hang: '/assets/bug-hang.png',
    jump: '/assets/bug-jump.png',
    sleep: '/assets/bug-sleep.png',
  },
  sen: {
    stand: '/assets/sen-sprite.png',
    run: '/assets/sen-run.png',
  },
} as const;

// Vị trí đặt lớp mặt-trước hộp carton (cắt từ chính room-bg.png, paint px 612,1750 -> 852,1872).
export const BOX_FRONT_RECT = { left: 574, top: 1641, width: 225, height: 114 };

// Điểm neo trên tranh (toạ độ sân khấu 1080x1920, điểm = chân/đáy của nhân vật).
export const PAINT_ANCHORS: Record<ZoneId, { x: number; y: number }> = {
  floor: { x: 540, y: 1595 },
  table: { x: 470, y: 1294 },
  sofa: { x: 216, y: 1303 },
  curtains: { x: 825, y: 1468 },
  curtainTop: { x: 745, y: 660 },
  chandelier: { x: 523, y: 656 },
  shelf: { x: 170, y: 838 },
  plant: { x: 235, y: 1600 },
  bin: { x: 984, y: 1594 },
  box: { x: 684, y: 1631 },
  robot: { x: 540, y: 1595 },
};

// Cặp neo engine -> tranh cho warp (zone + 4 góc phòng để mép không bị kéo méo).
const WARP_PAIRS: { e: { x: number; y: number }; s: { x: number; y: number } }[] = [
  { e: { x: 540, y: 1400 }, s: PAINT_ANCHORS.floor },
  { e: { x: 700, y: 1015 }, s: PAINT_ANCHORS.table },
  { e: { x: 270, y: 1330 }, s: PAINT_ANCHORS.sofa },
  { e: { x: 955, y: 1150 }, s: PAINT_ANCHORS.curtains },
  { e: { x: 955, y: 640 }, s: PAINT_ANCHORS.curtainTop },
  { e: { x: 540, y: 720 }, s: PAINT_ANCHORS.chandelier },
  { e: { x: 175, y: 735 }, s: PAINT_ANCHORS.shelf },
  { e: { x: 520, y: 1420 }, s: PAINT_ANCHORS.plant },
  { e: { x: 945, y: 1410 }, s: PAINT_ANCHORS.bin },
  { e: { x: 830, y: 1440 }, s: PAINT_ANCHORS.box },
  { e: { x: 30, y: 470 }, s: { x: 30, y: 540 } },
  { e: { x: 1050, y: 470 }, s: { x: 1050, y: 540 } },
  { e: { x: 30, y: 1560 }, s: { x: 30, y: 1600 } },
  { e: { x: 1050, y: 1560 }, s: { x: 1050, y: 1600 } },
];

/**
 * Warp toạ độ engine -> toạ độ sân khấu/tranh (Shepard, trọng số 1/(d^2+9)).
 * Hằng số cộng phải NHỎ: cặp neo plant/floor chỉ cách nhau 28px trong engine nhưng cách 305px
 * trên tranh — kernel rộng sẽ kéo Bug lệch cả chục px khỏi chậu cây/bàn. Kernel hẹp cho sai số
 * tại neo < ~4px; đường chạy giữa 2 zone uốn nhẹ theo neo gần nhất (chấp nhận được).
 */
export function toStage(x: number, y: number): { x: number; y: number } {
  let sw = 0;
  let dx = 0;
  let dy = 0;
  for (const p of WARP_PAIRS) {
    const ddx = x - p.e.x;
    const ddy = y - p.e.y;
    const w = 1 / (ddx * ddx + ddy * ddy + 9);
    sw += w;
    dx += w * (p.s.x - p.e.x);
    dy += w * (p.s.y - p.e.y);
  }
  return { x: x + dx / sw, y: y + dy / sw };
}

export type BugArtPose = 'stand' | 'run' | 'climb' | 'hang' | 'jump' | 'sleep' | 'flop';

/** Máy trạng thái tư thế Bug — chỉ đọc trạng thái engine, không đổi logic. */
export function resolveBugArtPose(v: BugView): BugArtPose {
  const { zone, pose, moving } = v.bug;
  if (zone === 'chandelier' || pose === 'swing') return 'hang';
  if (pose === 'sleep') return 'sleep';
  if (pose === 'jump' || pose === 'dodge') return 'jump';
  if (moving || pose === 'run') return 'run';
  if (pose === 'climb' || zone === 'curtainTop') return 'climb';
  if ((zone === 'curtains' || zone === 'shelf') && pose === 'push') return 'climb';
  if (pose === 'flop') return 'flop';
  return 'stand';
}

// Kích thước hiển thị (px sân khấu) tại scale engine = 0.9 (cấp mập 1); BugStage nhân tiếp scale/0.9.
// Tỉ lệ khung hình thật của từng file để không méo hình.
export const BUG_POSE_SIZE: Record<BugArtPose, { w: number; h: number }> = {
  stand: { w: 238, h: 246 }, // bug-sprite.png 930x960
  run: { w: 336, h: 184 }, // bug-run.png 1403x770
  climb: { w: 220, h: 241 }, // bug-climb.png 1292x1418
  hang: { w: 205, h: 241 }, // bug-hang.png 1145x1344
  jump: { w: 302, h: 177 }, // bug-jump.png 1780x1042
  sleep: { w: 268, h: 189 }, // bug-sleep.png 1395x982
  flop: { w: 238, h: 246 }, // dùng sprite đứng, lật nghiêng 82°
};

export const SEN_SIZE = {
  run: { w: 168, h: 392 }, // sen-run.png 832x1940
  stand: { w: 126, h: 394 }, // sen-sprite.png 378x1183
};
