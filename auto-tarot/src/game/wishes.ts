// Ý muốn của người xem (panel TikTok LIVE Studio do chủ kênh tự cài) — game TỰ THỰC HIỆN khi quà thật tới.
// Luật nhà: mọi ý muốn chỉ là vinh danh/hiệu ứng, TUYỆT ĐỐI không đổi thứ tự lượt xem, không điểm số.
export type WishKey = 'greet' | 'heart' | 'star' | 'luck';

export interface WishDef {
  key: WishKey;
  icon: string;
  label: string;
  price: number; // xu, chỉ để hiển thị
}

export const WISHES: WishDef[] = [
  { key: 'greet', icon: '🌹', label: 'Gửi lời chào', price: 1 },
  { key: 'heart', icon: '🫰', label: 'Cử chỉ thả tim', price: 5 },
  { key: 'star', icon: '🌹', label: 'Lên Bảng Sao Đêm', price: 10 },
  { key: 'luck', icon: '🍀', label: 'Mưa Sao May Mắn', price: 10 },
];

// Bỏ dấu tiếng Việt + thường hoá để khớp tên quà TikTok (Anh/Việt đều được)
export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Nhận diện ý muốn từ tên quà + tổng xu của sự kiện. Hoa hồng 1 xu = lời chào; hoa hồng từ 10 xu (combo) = lên bảng sao.
export function matchWish(giftName: string, coins: number): WishKey | null {
  const n = normName(giftName);
  if (n.includes('clover') || n.includes('co bon la') || n.includes('four leaf')) return 'luck';
  if (n.includes('finger') || n.includes('tha tim')) return 'heart';
  if (n.includes('rose') || n.includes('hoa hong')) return coins >= 10 ? 'star' : 'greet';
  return null;
}
