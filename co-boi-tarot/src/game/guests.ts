/**
 * Pool nhân vật khách: 12 nhân vật chibi tự vẽ cho game này (6 nam, 6 nữ), ngồi ghế quay
 * lưng 3/4 về phía cô bói. Khách ngồi vào bàn thì bốc 1 nhân vật; khách gõ NAM / NỮ
 * (không phân biệt dấu) thì đổi ngay sang nhân vật đúng giới. Ảnh: public/assets/guests/.
 */
import { plain } from '../live/chatter';

export type GuestGender = 'm' | 'f';

export interface GuestChar {
  id: string;
  gender: GuestGender;
  img: string;
}

const mk = (id: string, gender: GuestGender): GuestChar => ({ id, gender, img: `/assets/guests/${id}.png` });

export const GUEST_POOL: GuestChar[] = [
  mk('m1', 'm'), mk('m2', 'm'), mk('m3', 'm'), mk('m4', 'm'), mk('m5', 'm'), mk('m6', 'm'),
  mk('f1', 'f'), mk('f2', 'f'), mk('f3', 'f'), mk('f4', 'f'), mk('f5', 'f'), mk('f6', 'f'),
];

export function guestCharById(id: string | null | undefined): GuestChar | null {
  if (!id) return null;
  return GUEST_POOL.find((c) => c.id === id) ?? null;
}

export interface DrawOpts {
  pool?: readonly GuestChar[];
  /** tránh bốc lại đúng nhân vật này (khách trước / nhân vật đang ngồi) khi còn lựa chọn khác */
  excludeId?: string | null;
  /** chỉ bốc trong 1 giới; pool giới đó trống thì lùi về cả pool */
  gender?: GuestGender | null;
}

/** Bốc ngẫu nhiên 1 nhân vật. Pool trống hẳn thì trả null (sân khấu lùi về đĩa avatar). */
export function drawGuestChar(rand: () => number, opts: DrawOpts = {}): GuestChar | null {
  const pool = opts.pool ?? GUEST_POOL;
  let cands = opts.gender ? pool.filter((c) => c.gender === opts.gender) : [...pool];
  if (!cands.length) cands = [...pool];
  if (!cands.length) return null;
  const fresh = cands.filter((c) => c.id !== opts.excludeId);
  if (fresh.length) cands = fresh;
  return cands[Math.min(cands.length - 1, Math.floor(rand() * cands.length))];
}

/** Bình luận đúng 1 chữ NAM hoặc NỮ (bỏ dấu, không phân biệt hoa thường) thì là lệnh đổi nhân vật */
export function parseGenderCommand(comment: string): GuestGender | null {
  const p = plain(comment).trim();
  if (p === 'nam') return 'm';
  if (p === 'nu') return 'f';
  return null;
}
