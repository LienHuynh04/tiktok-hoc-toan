// Thư viện hình vẽ Trang Trí Tết: mọi món đồ đều là tranh SVG vẽ bằng code (gốc, đồng bộ phong cách),
// neo tại tâm (0,0), khung vẽ khoảng 120x130. Người xem gõ chữ gì -> khớp từ khoá -> hiện hình đó.
export type ZoneKey = 'mai' | 'cua' | 'cuaSo' | 'tuong' | 'cay' | 'san' | 'troi';

export interface AssetDef {
  id: string;
  name: string; // tên hiển thị tiếng Việt
  keys: string[]; // từ khoá đã bỏ dấu, khớp theo cụm từ trong bình luận
  zones: ZoneKey[]; // vùng treo ưu tiên theo thứ tự
  size: number; // hệ số cỡ so với khung chuẩn
  draw: (v: number) => string; // v = biến thể màu 0..2
}

// Bỏ dấu tiếng Việt + thường hoá (dùng chung cho khớp từ khoá)
export function normText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const R = '#d92b2b';
const R2 = '#b91f1f';
const G = '#f5b921';
const G2 = '#ffd34d';
const CREAM = '#fff3d6';
const GREEN = '#3e9b4f';
const PINK = '#f7a8b8';
const BROWN = '#8a5a2b';

function lantern(color: string, color2: string, ch: string) {
  return `<line x1="0" y1="-62" x2="0" y2="-38" stroke="${G}" stroke-width="3"/>
  <rect x="-10" y="-40" width="20" height="8" rx="2" fill="${G}"/>
  <ellipse cx="0" cy="0" rx="34" ry="30" fill="${color}"/>
  <path d="M-34 0 Q0 -34 34 0 Q0 34 -34 0" fill="none" stroke="${color2}" stroke-width="2" opacity="0.55"/>
  <path d="M-16 -26 Q-22 0 -16 26 M16 -26 Q22 0 16 26" fill="none" stroke="${color2}" stroke-width="2" opacity="0.55"/>
  <text x="0" y="9" text-anchor="middle" font-size="24" font-weight="800" fill="${CREAM}" font-family="'Be Vietnam Pro',sans-serif">${ch}</text>
  <rect x="-10" y="30" width="20" height="7" rx="2" fill="${G}"/>
  <path d="M-6 37 v14 M0 37 v18 M6 37 v14" stroke="${R}" stroke-width="3" stroke-linecap="round"/>`;
}

function branch(blossom: string, blossom2: string, fruit?: string) {
  const buds = [
    [-30, -28], [-8, -40], [16, -34], [34, -18], [-40, -6], [26, 2], [-18, -12], [6, -16],
  ]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 7 : 9}" fill="${i % 3 ? blossom : blossom2}"/><circle cx="${x}" cy="${y}" r="2.6" fill="${G2}"/>`)
    .join('');
  return `<path d="M-44 52 Q-20 10 -34 -22 M-44 52 Q0 22 8 -30 M-44 52 Q26 30 40 -8" stroke="#6b4423" stroke-width="6" fill="none" stroke-linecap="round"/>
  ${buds}${fruit ?? ''}`;
}

function diamond(ch: string, color = R) {
  return `<line x1="0" y1="-62" x2="0" y2="-44" stroke="${G}" stroke-width="3"/>
  <g transform="rotate(45)"><rect x="-30" y="-30" width="60" height="60" rx="8" fill="${color}"/><rect x="-23" y="-23" width="46" height="46" rx="6" fill="none" stroke="${G2}" stroke-width="2.5"/></g>
  <text x="0" y="13" text-anchor="middle" font-size="30" font-weight="800" fill="${G2}" font-family="'Be Vietnam Pro',sans-serif">${ch}</text>
  <path d="M0 44 v10" stroke="${G}" stroke-width="3"/><circle cx="0" cy="58" r="4" fill="${G}"/>`;
}

export const ASSETS: AssetDef[] = [
  // ---------- Đồ Tết cổ truyền ----------
  { id: 'long-den', name: 'Lồng đèn đỏ', keys: ['long den', 'den long', 'den do'], zones: ['mai', 'cua', 'troi'], size: 1.05, draw: () => lantern(R, R2, '福') },
  { id: 'long-den-vang', name: 'Lồng đèn vàng', keys: ['long den vang', 'den long vang', 'den vang'], zones: ['mai', 'cua', 'troi'], size: 1.05, draw: () => lantern('#e8930c', '#b96f06', '禄') },
  { id: 'day-phao', name: 'Dây pháo', keys: ['day phao', 'phao tet', 'phao hoa', 'phao'], zones: ['mai', 'cua', 'tuong'], size: 1,
    draw: () => `<line x1="0" y1="-62" x2="0" y2="-46" stroke="${G}" stroke-width="3"/>${[-1, 1].map((s) => [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${s * 12 - 6}" y="${-44 + i * 17}" width="12" height="14" rx="3" fill="${i % 2 ? R : '#e0342f'}" transform="rotate(${s * 6} ${s * 12} ${-44 + i * 17})"/>`).join('')).join('')}<path d="M-8 60 l-4 8 M0 62 v10 M8 60 l4 8" stroke="${G}" stroke-width="3" stroke-linecap="round"/>` },
  { id: 'cau-doi', name: 'Câu đối Tết', keys: ['cau doi'], zones: ['cua'], size: 1.25,
    draw: () => [-34, 34].map((x) => `<rect x="${x - 13}" y="-58" width="26" height="116" rx="5" fill="${R}"/><rect x="${x - 9}" y="-52" width="18" height="104" rx="3" fill="none" stroke="${G2}" stroke-width="1.6"/><text x="${x}" y="-24" text-anchor="middle" font-size="17" font-weight="800" fill="${G2}" font-family="'Be Vietnam Pro',sans-serif">T</text><text x="${x}" y="2" text-anchor="middle" font-size="17" font-weight="800" fill="${G2}" font-family="'Be Vietnam Pro',sans-serif">Â</text><text x="${x}" y="28" text-anchor="middle" font-size="17" font-weight="800" fill="${G2}" font-family="'Be Vietnam Pro',sans-serif">N</text>`).join('') },
  { id: 'chu-tet', name: 'Chữ Tết', keys: ['chu tet'], zones: ['cua', 'tuong', 'mai'], size: 1, draw: () => diamond('Tết') },
  { id: 'chu-phuc', name: 'Chữ Phúc', keys: ['chu phuc', 'phuc'], zones: ['cua', 'tuong', 'mai'], size: 1, draw: () => diamond('Phúc') },
  { id: 'chu-loc', name: 'Chữ Lộc', keys: ['chu loc', 'loc'], zones: ['cua', 'tuong', 'mai'], size: 1, draw: () => diamond('Lộc', '#0e7a4f') },
  { id: 'bao-li-xi', name: 'Bao lì xì', keys: ['bao li xi', 'li xi', 'hong bao', 'phong bao'], zones: ['cay', 'tuong', 'cua'], size: 0.9,
    draw: () => `<line x1="0" y1="-62" x2="0" y2="-34" stroke="${R}" stroke-width="2.5"/><rect x="-24" y="-34" width="48" height="66" rx="6" fill="${R}"/><path d="M-24 -34 h48 l-24 20 z" fill="${R2}"/><circle cx="0" cy="-16" r="9" fill="${G}"/><text x="0" y="18" text-anchor="middle" font-size="21" font-weight="800" fill="${G2}" font-family="'Be Vietnam Pro',sans-serif">福</text><rect x="-24" y="24" width="48" height="8" fill="${G}" opacity="0.85"/>` },
  { id: 'canh-mai', name: 'Cành mai vàng', keys: ['canh mai', 'hoa mai', 'mai vang', 'cay mai'], zones: ['cay', 'san', 'tuong'], size: 1.15, draw: () => branch('#ffd34d', '#ffb703') },
  { id: 'hoa-dao', name: 'Hoa đào', keys: ['hoa dao', 'canh dao', 'dao tet'], zones: ['cay', 'san', 'tuong'], size: 1.15, draw: () => branch(PINK, '#f77fa1') },
  { id: 'chau-cuc', name: 'Chậu cúc', keys: ['chau cuc', 'hoa cuc', 'cuc vang', 'chau hoa'], zones: ['san', 'cua'], size: 1.05,
    draw: () => `<path d="M-30 18 h60 l-7 34 a6 6 0 0 1 -6 5 h-34 a6 6 0 0 1 -6 -5 z" fill="#c1502e"/><rect x="-33" y="12" width="66" height="10" rx="4" fill="#a03e21"/>${[[-24, 2], [-8, -8], [10, -6], [24, 4], [0, 6], [-16, 10], [16, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${G2}"/><circle cx="${x}" cy="${y}" r="4.5" fill="#e8930c"/>`).join('')}<path d="M-20 14 q10 -12 22 -4 M4 14 q12 -10 20 0" stroke="${GREEN}" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'banh-chung', name: 'Bánh chưng', keys: ['banh chung', 'met banh'], zones: ['san', 'cua'], size: 1,
    draw: () => `<ellipse cx="0" cy="40" rx="46" ry="10" fill="#d9a05b"/><rect x="-30" y="-6" width="60" height="44" rx="7" fill="#2e7d46"/><path d="M-30 8 h60 M-30 24 h60 M-14 -6 v44 M4 -6 v44" stroke="#1e5c31" stroke-width="3.4"/><rect x="-24" y="-24" width="50" height="38" rx="7" fill="#359457" transform="rotate(-7)"/><path d="M-22 -12 l48 8 M-14 -24 l10 40" stroke="#1e5c31" stroke-width="3"/>` },
  { id: 'banh-tet', name: 'Bánh tét', keys: ['banh tet'], zones: ['san', 'cua'], size: 1,
    draw: () => `<rect x="-44" y="2" width="88" height="30" rx="15" fill="#2e7d46"/><path d="M-22 2 v30 M0 2 v30 M22 2 v30" stroke="#1e5c31" stroke-width="3.4"/><circle cx="34" cy="17" r="14" fill="#f7e3ac"/><circle cx="34" cy="17" r="7" fill="#e8930c"/><path d="M-44 10 q-8 7 0 14 M44 10 q8 7 0 14" stroke="${BROWN}" stroke-width="3" fill="none"/>` },
  { id: 'dua-hau', name: 'Dưa hấu đỏ', keys: ['dua hau'], zones: ['san'], size: 1,
    draw: () => `<path d="M0 -34 a40 48 0 1 0 0.01 0 z" fill="#2e7d46"/><path d="M0 -30 a34 42 0 1 0 0.01 0 z" fill="#a8d97c"/><path d="M-40 4 a40 34 0 0 0 80 0 z" fill="#e63950"/><path d="M-40 4 a40 8 0 0 0 80 0" fill="#f2f7d9"/>${[[-18, 22], [0, 30], [18, 22], [-8, 40], [10, 42]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="4" fill="#26221f"/>`).join('')}<path d="M0 -34 q6 -10 14 -10" stroke="#1e5c31" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'nut-that', name: 'Nút thắt may mắn', keys: ['nut that', 'dong tam ket', 'nut may man'], zones: ['mai', 'cua', 'cay'], size: 0.95,
    draw: () => `<line x1="0" y1="-62" x2="0" y2="-30" stroke="${R}" stroke-width="3"/><path d="M0 -30 c-22 -18 -34 6 -18 16 c10 6 18 -2 18 -8 c0 6 8 14 18 8 c16 -10 4 -34 -18 -16z" fill="none" stroke="${R}" stroke-width="6"/><circle cx="0" cy="-30" r="5" fill="${G}"/><path d="M-5 16 v26 M0 18 v32 M5 16 v26" stroke="${R}" stroke-width="3.4" stroke-linecap="round"/><rect x="-9" y="12" width="18" height="7" rx="2" fill="${G}"/>` },
  { id: 'den-hoa-dang', name: 'Đèn hoa đăng', keys: ['den hoa dang', 'hoa dang', 'den hoa'], zones: ['san', 'cuaSo'], size: 0.95,
    draw: () => `<path d="M0 34 c-24 0 -34 -14 -34 -26 c10 2 14 -2 18 -8 c2 6 8 10 16 10 c8 0 14 -4 16 -10 c4 6 8 10 18 8 c0 12 -10 26 -34 26z" fill="#f77fa1"/><path d="M0 30 c-16 0 -24 -9 -25 -18 c8 1 12 -2 15 -6 c3 5 6 7 10 7 c4 0 7 -2 10 -7 c3 4 7 7 15 6 c-1 9 -9 18 -25 18z" fill="#ffd34d"/><ellipse cx="0" cy="-6" rx="7" ry="10" fill="#ffb703"/><ellipse cx="0" cy="-4" rx="3" ry="6" fill="#fff3d6"/>` },

  // ---------- Con vật ----------
  { id: 'con-cho', name: 'Con chó', keys: ['con cho', 'cho con', 'cun con', 'cho', 'dog', 'puppy'], zones: ['san'], size: 1.1,
    draw: (v) => { const c = ['#d9a05b', '#b07a3f', '#8d8d94'][v]; return `<ellipse cx="-2" cy="18" rx="34" ry="24" fill="${c}"/><circle cx="26" cy="-6" r="21" fill="${c}"/><path d="M10 -20 q-10 -14 -4 -24 q12 2 14 12z M40 -22 q12 -8 18 2 q-4 10 -14 10z" fill="${v === 2 ? '#6f6f76' : '#a8743a'}"/><circle cx="20" cy="-8" r="3.4" fill="#26221f"/><circle cx="36" cy="-10" r="3.4" fill="#26221f"/><ellipse cx="29" cy="1" rx="5" ry="4" fill="#26221f"/><path d="M24 8 q5 5 10 1" stroke="#26221f" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-34 8 q-14 -6 -10 -20" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-16 38 v12 M16 38 v12" stroke="${c}" stroke-width="8" stroke-linecap="round"/><ellipse cx="-24" cy="6" rx="9" ry="6" fill="#fff3d6" opacity="0.5"/>`; } },
  { id: 'con-meo', name: 'Con mèo', keys: ['con meo', 'meo con', 'meo', 'cat'], zones: ['san', 'cuaSo'], size: 1.05,
    draw: (v) => { const c = ['#9aa0a8', '#e8e2d6', '#f0a35e'][v]; return `<path d="M28 34 q26 4 22 -18 q-2 -10 -12 -12" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/><ellipse cx="-4" cy="22" rx="30" ry="24" fill="${c}"/><circle cx="-6" cy="-12" r="23" fill="${c}"/><path d="M-26 -24 l-3 -14 l13 7z M12 -26 l4 -13 l11 9z" fill="${c}"/><path d="M-24 -27 l-1 -8 l7 4z M14 -28 l2 -7 l6 5z" fill="#f7a8b8"/><circle cx="-14" cy="-12" r="3.2" fill="#26221f"/><circle cx="3" cy="-12" r="3.2" fill="#26221f"/><path d="M-6 -3 q3 3 6 0" stroke="#26221f" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-30 -4 h-12 M-29 2 l-11 4 M17 -4 h12 M16 2 l11 4" stroke="#6b6f76" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="-8" cy="26" rx="14" ry="10" fill="#ffffff" opacity="0.45"/>`; } },
  { id: 'con-ga', name: 'Con gà trống', keys: ['con ga', 'ga trong', 'ga'], zones: ['san'], size: 1.05,
    draw: () => `<path d="M-26 6 q-20 -22 -8 -38 q4 12 10 14 q-2 -14 6 -20 q2 12 10 16 q10 -8 16 -4 q-8 16 -6 30z" fill="#3e7cb1"/><ellipse cx="2" cy="14" rx="28" ry="22" fill="#f2f0e6"/><circle cx="24" cy="-10" r="14" fill="#f2f0e6"/><path d="M16 -22 q2 -8 8 -6 q6 -4 8 3 q6 0 4 7 q-8 4 -20 -4z" fill="${R}"/><path d="M36 -8 l12 3 l-11 5z" fill="#e8930c"/><circle cx="22" cy="-11" r="2.6" fill="#26221f"/><path d="M26 2 q4 6 -1 9 q-5 -3 -1 -9" fill="${R}"/><path d="M-6 34 v12 M12 34 v12" stroke="#e8930c" stroke-width="4" stroke-linecap="round"/><path d="M-8 10 q12 -8 22 0 q-10 10 -22 2" fill="#e8e2d6"/>` },
  { id: 'con-vit', name: 'Con vịt', keys: ['con vit', 'vit con', 'vit'], zones: ['san'], size: 1,
    draw: () => `<ellipse cx="0" cy="16" rx="32" ry="22" fill="#ffd94d"/><circle cx="22" cy="-8" r="16" fill="#ffd94d"/><path d="M36 -10 l14 4 l-13 6z" fill="#e8930c"/><circle cx="20" cy="-10" r="2.8" fill="#26221f"/><path d="M-28 8 q-12 -4 -14 -14 q10 0 16 6z" fill="#f5c81e"/><path d="M-8 36 q4 5 10 3 M10 37 q4 4 9 2" stroke="#e8930c" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-14 12 q10 -8 20 -2 q-8 8 -20 4" fill="#ffe98a"/>` },
  { id: 'con-tho', name: 'Con thỏ', keys: ['con tho', 'tho con', 'tho'], zones: ['san'], size: 1,
    draw: () => `<ellipse cx="-12" cy="-34" rx="7" ry="22" fill="#e8e2d6" transform="rotate(-8 -12 -34)"/><ellipse cx="8" cy="-36" rx="7" ry="23" fill="#e8e2d6" transform="rotate(7 8 -36)"/><ellipse cx="-12" cy="-34" rx="3.4" ry="15" fill="#f7a8b8" transform="rotate(-8 -12 -34)"/><ellipse cx="8" cy="-36" rx="3.4" ry="16" fill="#f7a8b8" transform="rotate(7 8 -36)"/><ellipse cx="0" cy="18" rx="26" ry="24" fill="#f4f1ea"/><circle cx="0" cy="-8" r="19" fill="#f4f1ea"/><circle cx="-7" cy="-9" r="2.8" fill="#26221f"/><circle cx="7" cy="-9" r="2.8" fill="#26221f"/><path d="M-2 -2 h4 l-2 3z" fill="#f77fa1"/><path d="M0 1 v4 M0 5 q-4 3 -7 1 M0 5 q4 3 7 1" stroke="#c9c2b4" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="-24" cy="24" r="7" fill="#ffffff"/>` },
  { id: 'con-heo', name: 'Con heo', keys: ['con heo', 'heo con', 'lon con', 'heo'], zones: ['san'], size: 1.05,
    draw: () => `<ellipse cx="0" cy="16" rx="34" ry="25" fill="#f7a8b8"/><circle cx="24" cy="-4" r="20" fill="#f7a8b8"/><path d="M10 -18 q-6 -10 2 -13 q6 4 3 11z M36 -20 q8 -6 12 1 q-3 7 -10 5z" fill="#f28ba3"/><ellipse cx="27" cy="0" rx="8" ry="6.4" fill="#f28ba3"/><circle cx="24" cy="0" r="1.8" fill="#c9577a"/><circle cx="30" cy="0" r="1.8" fill="#c9577a"/><circle cx="16" cy="-8" r="2.8" fill="#26221f"/><circle cx="33" cy="-9" r="2.8" fill="#26221f"/><path d="M-33 6 q-9 -2 -7 -10" fill="none" stroke="#f28ba3" stroke-width="4" stroke-linecap="round"/><path d="M-14 39 v9 M16 39 v9" stroke="#f28ba3" stroke-width="7" stroke-linecap="round"/>` },
  { id: 'con-ca', name: 'Con cá', keys: ['con ca', 'ca chep', 'ca'], zones: ['san', 'cuaSo'], size: 1,
    draw: (v) => { const c = ['#e8930c', '#e63950', '#3e7cb1'][v]; return `<path d="M-38 0 q26 -24 52 -6 q10 7 24 14 q-12 8 -24 14 q-26 16 -52 -6 q-8 -8 0 -22z" fill="${c}"/><path d="M38 -2 l18 -14 v32 l-18 -16z" fill="${c}" opacity="0.8"/><circle cx="-22" cy="-3" r="4" fill="#fff"/><circle cx="-22" cy="-3" r="2.2" fill="#26221f"/><path d="M-6 -16 q8 -10 16 -2 M-4 16 q8 8 14 2" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/><circle cx="16" cy="-20" r="4" fill="#bfe3ff" opacity="0.8"/><circle cx="26" cy="-30" r="3" fill="#bfe3ff" opacity="0.7"/>`; } },
  { id: 'con-chim', name: 'Con chim', keys: ['con chim', 'chim'], zones: ['troi', 'cay'], size: 0.95,
    draw: () => `<ellipse cx="0" cy="6" rx="24" ry="19" fill="#5eb1e8"/><circle cx="16" cy="-10" r="13" fill="#5eb1e8"/><path d="M28 -11 l11 3 l-10 5z" fill="#e8930c"/><circle cx="14" cy="-12" r="2.4" fill="#26221f"/><path d="M-6 0 q-20 -16 -30 -4 q12 14 26 12 M-22 14 l-14 8 M-16 20 l-10 9" stroke="#3e7cb1" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-2 22 q2 8 -3 12 M10 21 q3 7 0 12" stroke="#e8930c" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="2" cy="12" rx="12" ry="9" fill="#bfe3ff"/>` },
  { id: 'con-buom', name: 'Con bướm', keys: ['con buom', 'buom'], zones: ['troi', 'cay', 'tuong'], size: 0.85,
    draw: (v) => { const c = ['#b565d8', '#f77fa1', '#5eb1e8'][v]; return `<path d="M-4 -6 q-30 -26 -38 -6 q-4 14 16 16 q14 1 22 -4z M4 -6 q30 -26 38 -6 q4 14 -16 16 q-14 1 -22 -4z M-4 8 q-24 6 -20 20 q3 12 20 4 q8 -4 6 -14z M4 8 q24 6 20 20 q-3 12 -20 4 q-8 -4 -6 -14z" fill="${c}"/><ellipse cx="0" cy="6" rx="5" ry="17" fill="#4a3049"/><circle cx="0" cy="-13" r="6" fill="#4a3049"/><path d="M-2 -18 q-6 -8 -12 -9 M2 -18 q6 -8 12 -9" stroke="#4a3049" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; } },
  { id: 'con-rong', name: 'Con rồng', keys: ['con rong', 'rong'], zones: ['troi', 'mai'], size: 1.2,
    draw: () => `<path d="M-44 30 q20 -34 44 -30 q22 4 30 -14" fill="none" stroke="#2e9e5b" stroke-width="13" stroke-linecap="round"/><path d="M-44 30 q20 -34 44 -30 q22 4 30 -14" fill="none" stroke="#ffd34d" stroke-width="4" stroke-dasharray="5 9" stroke-linecap="round"/><circle cx="36" cy="-18" r="14" fill="#2e9e5b"/><path d="M28 -30 l-4 -12 l10 6z M42 -31 l2 -12 l8 8z" fill="#e63950"/><circle cx="32" cy="-20" r="2.8" fill="#fff"/><circle cx="32" cy="-20" r="1.5" fill="#26221f"/><path d="M46 -14 q8 2 6 8" stroke="#e63950" stroke-width="3" fill="none"/><path d="M22 -8 q-8 8 -16 6 M-16 6 q-6 9 -14 10" stroke="#2e9e5b" stroke-width="5" fill="none" stroke-linecap="round"/>` },

  // ---------- Trời & hoa ----------
  { id: 'mat-troi', name: 'Mặt trời', keys: ['mat troi', 'ong mat troi'], zones: ['troi'], size: 1.05,
    draw: () => `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-34" x2="0" y2="-46" stroke="#ffb703" stroke-width="6" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}<circle cx="0" cy="0" r="27" fill="#ffd34d"/><circle cx="0" cy="0" r="27" fill="none" stroke="#ffb703" stroke-width="3"/><circle cx="-9" cy="-3" r="3" fill="#b96f06"/><circle cx="9" cy="-3" r="3" fill="#b96f06"/><path d="M-9 8 q9 8 18 0" stroke="#b96f06" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  { id: 'mat-trang', name: 'Mặt trăng', keys: ['mat trang', 'anh trang'], zones: ['troi'], size: 1,
    draw: () => `<path d="M14 -30 a34 34 0 1 0 12 52 a27 27 0 1 1 -12 -52z" fill="#ffe98a"/><path d="M-16 -8 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M12 18 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4z" fill="#ffd34d"/>` },
  { id: 'ngoi-sao', name: 'Ngôi sao', keys: ['ngoi sao'], zones: ['troi', 'mai', 'cay'], size: 0.9,
    draw: () => `<line x1="0" y1="-62" x2="0" y2="-24" stroke="${G}" stroke-width="2.6"/><path d="M0 -26 l8 16 18 2 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -2z" fill="#ffd34d" stroke="#e8930c" stroke-width="2.4" stroke-linejoin="round"/>` },
  { id: 'cau-vong', name: 'Cầu vồng', keys: ['cau vong'], zones: ['troi'], size: 1.3,
    draw: () => `<path d="M-48 34 a48 48 0 0 1 96 0" fill="none" stroke="#e63950" stroke-width="9"/><path d="M-38 34 a38 38 0 0 1 76 0" fill="none" stroke="#ffb703" stroke-width="9"/><path d="M-28 34 a28 28 0 0 1 56 0" fill="none" stroke="#2e9e5b" stroke-width="9"/><path d="M-18 34 a18 18 0 0 1 36 0" fill="none" stroke="#3e7cb1" stroke-width="9"/><ellipse cx="-48" cy="36" rx="16" ry="10" fill="#ffffff"/><ellipse cx="48" cy="36" rx="16" ry="10" fill="#ffffff"/>` },
  { id: 'dam-may', name: 'Đám mây', keys: ['dam may'], zones: ['troi'], size: 1.05,
    draw: () => `<path d="M-38 18 a14 14 0 0 1 2 -27 a18 18 0 0 1 32 -6 a13 13 0 0 1 22 8 a12 12 0 0 1 8 25z" fill="#ffffff"/><path d="M-38 18 a14 14 0 0 1 2 -27 a18 18 0 0 1 32 -6 a13 13 0 0 1 22 8 a12 12 0 0 1 8 25z" fill="none" stroke="#dbe9f5" stroke-width="3"/><circle cx="-10" cy="2" r="2.6" fill="#9db8cc"/><circle cx="8" cy="2" r="2.6" fill="#9db8cc"/><path d="M-8 10 q8 6 16 0" stroke="#9db8cc" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
  { id: 'bong-bay', name: 'Bóng bay', keys: ['bong bay', 'bong'], zones: ['troi', 'cua'], size: 1,
    draw: () => `<path d="M-16 6 q-4 16 2 26 M2 10 q0 14 -2 22 M20 4 q4 16 -2 28" stroke="#9db8cc" stroke-width="2" fill="none"/><ellipse cx="-18" cy="-18" rx="15" ry="19" fill="#e63950"/><ellipse cx="2" cy="-24" rx="15" ry="19" fill="#3e7cb1"/><ellipse cx="21" cy="-16" rx="15" ry="19" fill="#ffb703"/><ellipse cx="-23" cy="-25" rx="5" ry="8" fill="#ffffff" opacity="0.45"/><path d="M-4 32 h8 l-4 6z" fill="#8a5a2b"/>` },
  { id: 'trai-tim', name: 'Trái tim', keys: ['trai tim', 'tim'], zones: ['troi', 'tuong', 'cay'], size: 0.95,
    draw: () => `<path d="M0 34 c-30 -18 -40 -32 -40 -48 a20 20 0 0 1 40 -8 a20 20 0 0 1 40 8 c0 16 -10 30 -40 48z" fill="#e63950"/><path d="M-24 -18 a9 9 0 0 1 12 -6" stroke="#ffb3c1" stroke-width="5" fill="none" stroke-linecap="round"/>` },
  { id: 'hoa-hong', name: 'Hoa hồng', keys: ['hoa hong', 'bong hong', 'hong'], zones: ['tuong', 'cuaSo', 'san'], size: 0.9,
    draw: () => `<path d="M0 8 v34 M0 26 q-14 -2 -18 -14 q12 0 18 8 M0 30 q14 -2 18 -14 q-12 0 -18 8" stroke="${GREEN}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0 -34 a15 15 0 0 1 15 15 a15 15 0 0 1 -6 12 a13 13 0 0 1 -9 3 a13 13 0 0 1 -13 -13 a15 15 0 0 1 13 -17z" fill="#e63950"/><path d="M-6 -22 a7 7 0 0 1 12 2 a6 6 0 0 1 -5 7" fill="none" stroke="#ff8fa3" stroke-width="3" stroke-linecap="round"/>` },
  { id: 'hoa-sen', name: 'Hoa sen', keys: ['hoa sen', 'sen'], zones: ['san', 'tuong'], size: 0.95, draw: () => denSen() },
  { id: 'hoa-huong-duong', name: 'Hoa hướng dương', keys: ['hoa huong duong', 'huong duong'], zones: ['san', 'tuong'], size: 1,
    draw: () => `<path d="M0 4 v38 M0 26 q-14 -2 -18 -13 q12 0 18 7" stroke="${GREEN}" stroke-width="4.4" fill="none" stroke-linecap="round"/>${[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => `<ellipse cx="0" cy="-26" rx="6.4" ry="13" fill="#ffd34d" transform="rotate(${a} 0 -12)"/>`).join('')}<circle cx="0" cy="-12" r="13" fill="#8a5a2b"/><circle cx="0" cy="-12" r="13" fill="none" stroke="#6f4423" stroke-width="2"/>${[[-5, -16], [4, -9], [-2, -5], [6, -16], [-7, -9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#5b3a1a"/>`).join('')}` },

  // ---------- Đồ ăn & đồ vật ----------
  { id: 'kem', name: 'Cây kem', keys: ['cay kem', 'kem'], zones: ['san'], size: 1,
    draw: (v) => { const c = ['#f77fa1', '#8a5a2b', '#a8d97c'][v]; return `<path d="M-16 2 h32 l-16 44z" fill="#e0aa6e"/><path d="M-16 10 l20 8 M16 10 l-20 8" stroke="#c98d4e" stroke-width="2.4"/><circle cx="0" cy="-12" r="19" fill="${c}"/><circle cx="-6" cy="-18" r="5" fill="#ffffff" opacity="0.5"/><path d="M0 -31 q2 -8 9 -9" stroke="#2e7d46" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="10" cy="-38" r="4.6" fill="#e63950"/>`; } },
  { id: 'tra-sua', name: 'Trà sữa', keys: ['tra sua', 'tra dao', 'nuoc ngot'], zones: ['san'], size: 1,
    draw: () => `<path d="M-20 -26 h40 l-5 62 a6 6 0 0 1 -6 5 h-18 a6 6 0 0 1 -6 -5z" fill="#f7e3ac"/><path d="M-19 -6 h38 l-3 40 a6 6 0 0 1 -6 5 h-20 a6 6 0 0 1 -6 -5z" fill="#d9a05b"/>${[[-10, 26], [2, 31], [11, 22], [-3, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="#4a2f1d"/>`).join('')}<rect x="-23" y="-32" width="46" height="8" rx="4" fill="#e63950"/><line x1="8" y1="-48" x2="13" y2="-30" stroke="#3e7cb1" stroke-width="5" stroke-linecap="round"/>` },
  { id: 'banh-kem', name: 'Bánh kem', keys: ['banh kem', 'banh sinh nhat'], zones: ['san'], size: 1.05,
    draw: () => `<rect x="-34" y="8" width="68" height="26" rx="5" fill="#f7a8b8"/><rect x="-34" y="8" width="68" height="9" rx="4" fill="#fff3d6"/><rect x="-26" y="-14" width="52" height="22" rx="5" fill="#fff3d6"/><path d="M-26 -14 q6 8 13 0 q6 8 13 0 q6 8 12 0 q6 8 14 0" fill="#e63950"/>${[-14, 0, 14].map((x) => `<line x1="${x}" y1="-26" x2="${x}" y2="-15" stroke="#ffd34d" stroke-width="3.4"/><circle cx="${x}" cy="-29" r="3.4" fill="#ffb703"/>`).join('')}<ellipse cx="0" cy="38" rx="40" ry="6" fill="#d9d4c5"/>` },
  { id: 'hop-qua', name: 'Hộp quà', keys: ['hop qua', 'mon qua', 'qua tet', 'tang qua'], zones: ['san', 'tuong'], size: 1,
    draw: (v) => { const c = [R, '#3e7cb1', '#0e7a4f'][v]; return `<rect x="-30" y="-6" width="60" height="42" rx="4" fill="${c}"/><rect x="-34" y="-16" width="68" height="13" rx="4" fill="${c}"/><rect x="-4" y="-16" width="8" height="52" fill="${G2}"/><path d="M0 -16 c-14 -2 -18 -14 -10 -18 c7 -3 12 5 10 12 c2 -7 9 -13 14 -9 c7 5 1 15 -14 15z" fill="${G2}"/>`; } },
  { id: 'non-la', name: 'Nón lá', keys: ['non la', 'non'], zones: ['tuong', 'san'], size: 1,
    draw: () => `<path d="M0 -30 l44 34 a50 12 0 0 1 -88 0z" fill="#e8cf8f"/><path d="M0 -30 l30 26 M0 -30 l-30 26 M0 -30 v38" stroke="#c9a85c" stroke-width="2.2"/><path d="M-44 4 a50 12 0 0 0 88 0" fill="none" stroke="#c9a85c" stroke-width="3"/><path d="M-8 10 q-3 12 2 20 M8 10 q3 12 -2 20" stroke="${R}" stroke-width="3" fill="none"/>` },
  { id: 'tien-vang', name: 'Thỏi vàng', keys: ['thoi vang', 'tien vang', 'vang', 'tien'], zones: ['san', 'tuong'], size: 1,
    draw: () => `<path d="M-30 26 a30 14 0 0 1 12 -24 a30 12 0 0 1 36 0 a30 14 0 0 1 12 24z" fill="${G}"/><ellipse cx="0" cy="4" rx="17" ry="8" fill="#ffd34d"/><ellipse cx="0" cy="4" rx="9" ry="4" fill="#e8930c"/><path d="M-38 34 a38 10 0 0 0 76 0 l-6 8 h-64z" fill="#e8930c"/><text x="0" y="30" text-anchor="middle" font-size="13" font-weight="800" fill="#fff3d6" font-family="'Be Vietnam Pro',sans-serif">LỘC</text>` },
  { id: 'bong-da', name: 'Quả bóng đá', keys: ['bong da', 'qua bong', 'trai bong'], zones: ['san'], size: 0.95,
    draw: () => `<circle cx="0" cy="4" r="30" fill="#ffffff"/><circle cx="0" cy="4" r="30" fill="none" stroke="#c9c2b4" stroke-width="2.4"/><path d="M0 -10 l11 8 -4 13 h-14 l-4 -13z" fill="#26221f"/><path d="M0 -26 v8 M24 -12 l-9 4 M19 22 l-7 -8 M-19 22 l7 -8 M-24 -12 l9 4" stroke="#26221f" stroke-width="2.6"/>` },
  { id: 'dan-guitar', name: 'Đàn guitar', keys: ['dan guitar', 'guitar', 'dan'], zones: ['tuong', 'san'], size: 1.05,
    draw: () => `<path d="M14 -34 l16 -14 l7 8 l-13 13" fill="#8a5a2b"/><rect x="28" y="-52" width="10" height="14" rx="2" fill="#6f4423" transform="rotate(40 33 -45)"/><path d="M-4 6 c-14 -4 -24 8 -18 20 c5 11 20 13 28 6 c10 4 22 -4 19 -15 c-2 -10 -14 -14 -22 -9 c-3 -3 -8 -3 -11 -2z" fill="#c1502e"/><circle cx="-6" cy="16" r="9" fill="#4a2f1d"/><path d="M2 -30 l6 34" stroke="#e8e2d6" stroke-width="1.6"/>` },
  { id: 'may-bay', name: 'Máy bay', keys: ['may bay'], zones: ['troi'], size: 1.1,
    draw: () => `<path d="M-44 6 q0 -10 12 -11 l30 -1 l14 -13 q4 -3 7 1 l3 5 q1 4 -3 6 l-12 7 l16 1 q10 1 10 7 q0 6 -10 7 l-46 2 q-12 0 -12 -11z" fill="#e8e2d6"/><path d="M-44 6 q0 -10 12 -11 l8 0 q-4 5 -4 11 q0 6 4 11 l-8 0 q-12 0 -12 -11z" fill="#e63950"/><path d="M-16 -3 h34" stroke="#5eb1e8" stroke-width="5" stroke-linecap="round"/><path d="M-2 14 l-8 14 h10 l8 -12z" fill="#c9c2b4"/>` },
  { id: 'ten-lua', name: 'Tên lửa', keys: ['ten lua'], zones: ['troi'], size: 1.05,
    draw: () => `<path d="M0 -46 c14 12 18 30 14 52 h-28 c-4 -22 0 -40 14 -52z" fill="#e8e2d6"/><path d="M0 -46 c6 5 10 12 12 20 h-24 c2 -8 6 -15 12 -20z" fill="#e63950"/><circle cx="0" cy="-8" r="8" fill="#5eb1e8"/><circle cx="0" cy="-8" r="8" fill="none" stroke="#9db8cc" stroke-width="2.4"/><path d="M-14 4 q-12 10 -12 24 l12 -4 M14 4 q12 10 12 24 l-12 -4" fill="#e63950"/><path d="M0 8 q6 12 0 24 q-6 -12 0 -24z" fill="#ffb703"/><path d="M0 14 q3.4 7 0 14 q-3.4 -7 0 -14z" fill="#ffd34d"/>` },
  { id: 'xe-dap', name: 'Xe đạp', keys: ['xe dap'], zones: ['san'], size: 1.1,
    draw: () => `<circle cx="-26" cy="26" r="15" fill="none" stroke="#4a4a52" stroke-width="4"/><circle cx="28" cy="26" r="15" fill="none" stroke="#4a4a52" stroke-width="4"/><path d="M-26 26 l14 -22 h20 l8 22 M-12 4 l10 22 M12 4 l16 22 M-16 -2 h12" stroke="#e63950" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-20 -6 h14 M24 -2 q8 -2 9 -8" stroke="#4a4a52" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="0" cy="26" r="4.4" fill="#4a4a52"/>` },
  { id: 'cai-o', name: 'Cái ô', keys: ['cai o', 'o che', 'du'], zones: ['tuong', 'san'], size: 1,
    draw: () => `<path d="M0 -34 a42 42 0 0 1 42 34 a10 7 0 0 1 -14 0 a10 7 0 0 1 -14 0 a10 7 0 0 1 -14 0 a10 7 0 0 1 -14 0 a10 7 0 0 1 -14 0 a42 42 0 0 1 42 -34z" fill="#e63950"/><path d="M0 -34 l0 30 M0 -34 l-28 30 M0 -34 l28 30" stroke="#ffb3c1" stroke-width="2.2"/><path d="M0 2 v34 a7 7 0 0 0 14 0" fill="none" stroke="#8a5a2b" stroke-width="4.4" stroke-linecap="round"/><circle cx="0" cy="-36" r="3.6" fill="${G}"/>` },
];

function denSen() {
  return `<path d="M0 26 c-20 -2 -30 -16 -31 -30 c9 1 15 -2 19 -8 c1 7 5 12 12 14 c7 -2 11 -7 12 -14 c4 6 10 9 19 8 c-1 14 -11 28 -31 30z" fill="#f77fa1"/><path d="M0 20 c-12 -1 -19 -9 -20 -19 c6 0 10 -2 13 -6 c1 5 3 9 7 10 c4 -1 6 -5 7 -10 c3 4 7 6 13 6 c-1 10 -8 18 -20 19z" fill="#ffb3c1"/><ellipse cx="0" cy="-2" rx="6" ry="8" fill="#ffd34d"/><path d="M-30 34 q30 10 60 0" stroke="${GREEN}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}

// Bình luận đúng 1 chữ này thì ra món tương ứng (tránh bắt nhầm trong câu dài kiểu "hay quá")
const EXACT_ONE_WORD: Record<string, string> = { qua: 'hop-qua' };

// Khớp bình luận -> món đồ: cụm từ khoá dài nhất thắng; không khớp -> null (engine sẽ dùng thẻ tên)
export function matchAsset(comment: string): AssetDef | null {
  const norm = normText(comment);
  if (!norm.includes(' ') && EXACT_ONE_WORD[norm]) return ASSETS.find((a) => a.id === EXACT_ONE_WORD[norm]) ?? null;
  const p = ` ${norm} `;
  let best: AssetDef | null = null;
  let bestLen = 0;
  for (const a of ASSETS) {
    for (const k of a.keys) {
      if (k.length > bestLen && p.includes(` ${k} `)) {
        best = a;
        bestLen = k.length;
      }
    }
  }
  return best;
}

// Thẻ tên dự phòng: món đồ là một tấm thẻ treo ghi đúng chữ người chơi gõ (khi thư viện chưa có hình)
export function tagSvg(label: string): string {
  const t = label.length > 14 ? `${label.slice(0, 13)}…` : label;
  return `<line x1="0" y1="-62" x2="0" y2="-30" stroke="${G}" stroke-width="2.6"/>
  <rect x="-46" y="-30" width="92" height="58" rx="12" fill="#fff8ea"/>
  <rect x="-46" y="-30" width="92" height="58" rx="12" fill="none" stroke="${R}" stroke-width="3"/>
  <circle cx="0" cy="-30" r="4.6" fill="${G}"/>
  <text x="0" y="4" text-anchor="middle" font-size="16.5" font-weight="800" fill="#b91f1f" font-family="'Be Vietnam Pro',sans-serif">${t}</text>
  <text x="0" y="21" text-anchor="middle" font-size="10.5" fill="#a3814f" font-family="'Be Vietnam Pro',sans-serif">đồ bạn xin treo</text>`;
}
