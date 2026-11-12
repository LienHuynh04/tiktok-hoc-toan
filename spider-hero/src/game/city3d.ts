// Thành phố 3D vô tận, sinh tất định bằng hạt giống theo chỉ số khu phố.
// Engine (hero.ts) dùng để biết nóc nhà nào chạy được + điểm bám tơ ở đâu,
// sân khấu (HeroStage) dùng cùng dữ liệu này để dựng mesh — hai bên khớp nhau.
//
// Bố cục: đường bay dọc trục +x ở z = 0. Hàng nhà GIỮA (z = 0) có nóc thấp để
// Hero chạy; hai hàng THÁP hai bên (z = ±32) cao hơn nhiều, là điểm bám tơ và
// tạo chiều sâu. Đường xe chạy ở z = ±16. Thỉnh thoảng gặp sông + cầu.

export interface Block {
  i: number;
  x: number; // mép trái (m)
  w: number; // bề ngang (m)
  midH: number; // chiều cao nhà giữa (0 = công viên: không có nóc để chạy)
  leftH: number; // tháp bên trái (z = -32)
  rightH: number; // tháp bên phải (z = +32)
  kind: number; // biến thể kiến trúc 0..3
  crane: boolean; // cần cẩu trên tháp cao hơn
  park: boolean;
}

export interface River {
  x0: number;
  x1: number;
}

export function seeded(seed: number): () => number {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BRIDGE_DECK_Y = 10;

const cache: Block[] = [];
const rivers: River[] = [];
let cursorX = 0;
let nextRiverAt = 1450;

function genNext(): Block {
  const i = cache.length;
  const r = seeded(5000 + i * 131);
  if (cursorX >= nextRiverAt) {
    const wRiver = 230 + Math.floor(r() * 110);
    rivers.push({ x0: cursorX, x1: cursorX + wRiver });
    cursorX += wRiver;
    nextRiverAt = cursorX + 1350 + Math.floor(r() * 650);
  }
  const w = 24 + Math.floor(r() * 14); // 24..37m
  const park = r() < 0.07;
  const b: Block = {
    i,
    x: cursorX,
    w,
    midH: park ? 0 : 13 + Math.floor(r() * 17), // nhà giữa 13..29m — chạy được
    leftH: 38 + Math.floor(r() * 78), // tháp 38..115m
    rightH: 38 + Math.floor(r() * 78),
    kind: Math.floor(r() * 4),
    crane: r() < 0.22,
    park,
  };
  cache.push(b);
  cursorX += w + 3 + Math.floor(r() * 4); // hẻm giữa hai khu 3..6m
  return b;
}

/** Mọi khu phố giao với đoạn [x0, x1] (sinh thêm nếu chưa đủ xa). */
export function blocksInRange(x0: number, x1: number): Block[] {
  while (!cache.length || cache[cache.length - 1].x < x1) genNext();
  return cache.filter((b) => b.x + b.w > x0 && b.x < x1);
}

export function riverAt(x: number): River | null {
  blocksInRange(x - 10, x + 500);
  return rivers.find((r) => x >= r.x0 - 4 && x <= r.x1 + 4) ?? null;
}

/**
 * Chiều cao mặt đứng được tại x: nóc nhà giữa, mặt cầu nếu đang qua sông,
 * hoặc -1 nếu là hẻm/công viên (không đáp được, phải bay qua).
 */
export function roofAt(x: number): number {
  const rv = riverAt(x);
  if (rv) return BRIDGE_DECK_Y;
  const bs = blocksInRange(x - 2, x + 2);
  const b = bs.find((k) => x >= k.x && x <= k.x + k.w);
  if (!b || b.midH <= 0) return -1;
  return b.midH;
}

export interface Anchor3 {
  x: number;
  y: number;
  z: number;
}

/** Điểm bám tơ: đỉnh hai hàng tháp, đầu cần cẩu, và hai tháp cầu khi qua sông. */
export function anchorsInRange(x0: number, x1: number): Anchor3[] {
  const out: Anchor3[] = [];
  for (const b of blocksInRange(x0, x1)) {
    out.push({ x: b.x + b.w - 1, y: b.leftH, z: -32 });
    out.push({ x: b.x + 1, y: b.rightH, z: 32 });
    if (b.crane) out.push({ x: b.x + b.w / 2, y: Math.max(b.leftH, b.rightH) + 14, z: 0 });
  }
  blocksInRange(x0, x1 + 600);
  for (const r of rivers) {
    if (r.x1 < x0 || r.x0 > x1) continue;
    out.push({ x: r.x0 + 30, y: 62, z: 0 });
    out.push({ x: r.x1 - 30, y: 62, z: 0 });
  }
  return out.sort((a, b) => a.x - b.x);
}
