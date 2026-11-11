// Bộ vịt đua: 10 màu, vẽ SVG bằng code (gốc), vịt nhìn ngang đang bơi, neo tâm (0,0), khung ~120x90.
// Màu của mỗi người chơi cố định theo tài khoản (artFor trong race.ts, 0-9).
export const DUCK_COLORS: { body: string; wing: string; label: string }[] = [
  { body: '#ffd94d', wing: '#f5b921', label: 'Vịt Vàng' },
  { body: '#f7a8b8', wing: '#f77fa1', label: 'Vịt Hồng' },
  { body: '#7ec3f2', wing: '#4a97d9', label: 'Vịt Xanh Biển' },
  { body: '#ffb26b', wing: '#f08c2e', label: 'Vịt Cam' },
  { body: '#c9a7eb', wing: '#a678e0', label: 'Vịt Tím' },
  { body: '#9fe8c1', wing: '#57c98a', label: 'Vịt Bạc Hà' },
  { body: '#fdfdf8', wing: '#d9d4c5', label: 'Vịt Trắng' },
  { body: '#8d99ae', wing: '#5f6b7d', label: 'Vịt Xám' },
  { body: '#ff8fa3', wing: '#e85d75', label: 'Vịt Đỏ' },
  { body: '#d4f26b', wing: '#a8d92e', label: 'Vịt Chanh' },
];

export function duckSvg(art: number, boosting = false): string {
  const c = DUCK_COLORS[art % DUCK_COLORS.length];
  const splash = boosting
    ? `<path d="M-52 26 q-8 -8 -16 -6 M-48 32 q-10 -2 -16 3 M-56 18 q-6 -10 -13 -11" stroke="#dff3ff" stroke-width="3.4" fill="none" stroke-linecap="round"/>
       <circle cx="-58" cy="8" r="3" fill="#dff3ff"/><circle cx="-50" cy="-2" r="2.4" fill="#dff3ff"/>`
    : '';
  return `${splash}
  <path d="M-38 6 q-16 -4 -20 -18 q10 0 16 6 q10 -8 18 -6 q-4 10 -14 14z" fill="${c.wing}"/>
  <ellipse cx="-2" cy="10" rx="40" ry="21" fill="${c.body}"/>
  <path d="M-16 2 q14 -8 26 2 q-6 12 -20 12 q-10 -6 -6 -14z" fill="${c.wing}"/>
  <circle cx="34" cy="-12" r="16" fill="${c.body}"/>
  <path d="M48 -13 l16 4 l-15 6z" fill="#f08c2e"/>
  <path d="M47 -4 q6 3 12 1" stroke="#d9761f" stroke-width="2" fill="none"/>
  <circle cx="38" cy="-15" r="3" fill="#26221f"/>
  <circle cx="30" cy="-24" r="5.4" fill="#ffffff" opacity="0.5"/>
  <path d="M-40 30 q10 6 22 1 M-6 33 q12 5 24 0 M28 31 q9 4 18 0" stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>`;
}
