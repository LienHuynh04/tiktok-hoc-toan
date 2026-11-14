// Hình vẽ SVG bằng code (gốc) cho Bug Đại Náo Nhà Sen.
// Bug: mèo xám TRƠN một màu (không vằn), ngực + chân trắng, mắt vàng, vòng cổ hoa xanh.
// Sen: tomboy tóc ngắn rối nâu sẫm, pajama xanh nhạt, mũ ngủ tím.
// Neo tâm ở (0,0) = điểm chạm đất (chân), hình vẽ đi lên theo chiều âm của y.

export type BugPoseArt = 'sit' | 'run' | 'jump' | 'push' | 'climb' | 'swing' | 'ride' | 'dodge' | 'sleep' | 'flop' | 'caught' | 'hide' | 'smug';
export type SenPoseArt = 'chase' | 'stunned' | 'fooled' | 'holdBug' | 'wait';

const GREY = '#9aa3ab';
const GREY_DARK = '#7e8891';
const INK = '#4a3226';

function bugEyes(pose: string, hx = 57, hy = -122): string {
  // vẽ quanh điểm chuẩn (57,-122) rồi tịnh tiến tới tâm đầu thật (hx,hy)
  const inner = bugEyesInner(pose);
  return `<g transform="translate(${hx - 57} ${hy + 122})">${inner}</g>`;
}

function bugEyesInner(pose: string): string {
  switch (pose) {
    case 'sleep':
      return `<path d="M52 -122 q7 6 14 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
              <path d="M84 -196 l12 0 l-12 10 l12 0" stroke="#7fb3e0" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.8) translate(30 -40)"/>
              <path d="M96 -214 l10 0 l-10 8 l10 0" stroke="#7fb3e0" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.7) translate(52 -70)"/>`;
    case 'caught':
      return `<path d="M50 -128 l14 10 M64 -128 l-14 10" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
              <path d="M78 -148 q4 8 0 12 q-4 -4 0 -12" fill="#8ecdf3"/>`;
    case 'smug':
      return `<path d="M48 -124 q8 5 16 0" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
              <path d="M46 -130 h20" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
    case 'swing':
    case 'jump':
      return `<circle cx="57" cy="-122" r="8.6" fill="#f7c948"/><circle cx="57" cy="-122" r="4" fill="${INK}"/><circle cx="54" cy="-125" r="1.8" fill="#fff"/>`;
    default:
      return `<circle cx="57" cy="-122" r="7.4" fill="#f7c948"/><circle cx="57" cy="-122" r="3.4" fill="${INK}"/><circle cx="54.5" cy="-124.5" r="1.6" fill="#fff"/>`;
  }
}

export function bugSvg(fatStage: number, pose: BugPoseArt): string {
  const fat = Math.min(5, Math.max(1, fatStage));
  const rx = 74 + fat * 9; // thân ngang: cấp 1 ~83, cấp 5 ~119
  const ry = 50 + fat * 7; // thân cao
  const bodyCy = -ry - 26;
  const headX = rx * 0.62;
  const headY = bodyCy - ry * 0.52;
  const headR = 37 + fat * 1.6;

  if (pose === 'hide') {
    // chỉ nhô đầu + 2 chân bám mép hộp
    return `<g>
      <path d="M${headX - headR + 4} ${headY + 6} l-6 -26 l22 12 z" fill="${GREY}"/>
      <path d="M${headX + headR - 16} ${headY + 2} l4 -27 l20 15 z" fill="${GREY}"/>
      <circle cx="${headX}" cy="${headY + 16}" r="${headR}" fill="${GREY}"/>
      <ellipse cx="${headX - 6}" cy="${headY + 34}" rx="17" ry="12" fill="#ffffff" opacity="0.9"/>
      ${bugEyes('sit', headX, headY + 12)}
      <path d="M${headX + 16} ${headY + 22} l7 3 l-7 3 z" fill="#e58aa5"/>
      <ellipse cx="${headX - 34}" cy="-2" rx="11" ry="7" fill="#ffffff"/>
      <ellipse cx="${headX + 30}" cy="-2" rx="11" ry="7" fill="#ffffff"/>
    </g>`;
  }

  const flop = pose === 'flop' ? ` transform="rotate(-58 0 -10)"` : pose === 'sleep' ? ` transform="rotate(-10 0 0)"` : pose === 'climb' ? ` transform="rotate(-8 0 0)"` : '';
  const legs =
    pose === 'ride'
      ? ''
      : `<path d="M-38 -34 v26 q0 8 10 8 h6 q8 0 8 -8 v-18" fill="${GREY}"/>
         <path d="M28 -34 v26 q0 8 10 8 h6 q8 0 8 -8 v-18" fill="${GREY}"/>
         <ellipse cx="-18" cy="-2" rx="13" ry="6" fill="#ffffff"/>
         <ellipse cx="46" cy="-2" rx="13" ry="6" fill="#ffffff"/>`;
  const tail =
    pose === 'dodge' || pose === 'run'
      ? `<path d="M${-rx + 2} ${bodyCy + 4} q-44 6 -52 -26 q26 2 40 20" fill="${GREY_DARK}"/>`
      : `<path d="M${-rx + 2} ${bodyCy - 6} q-40 -26 -30 -62 q20 22 34 44 q6 12 -4 18z" fill="${GREY}"/>`;
  const pawUp =
    pose === 'push'
      ? `<ellipse cx="${headX + 34}" cy="${bodyCy + 16}" rx="17" ry="10" fill="#ffffff" transform="rotate(24 ${headX + 34} ${bodyCy + 16})"/>`
      : pose === 'swing' || pose === 'climb'
        ? `<path d="M${headX - 16} ${headY - headR + 4} v-30 M${headX + 14} ${headY - headR + 2} v-32" stroke="${GREY_DARK}" stroke-width="11" stroke-linecap="round"/>
           <ellipse cx="${headX - 16}" cy="${headY - headR - 28}" rx="9" ry="7" fill="#ffffff"/>
           <ellipse cx="${headX + 14}" cy="${headY - headR - 30}" rx="9" ry="7" fill="#ffffff"/>`
        : '';

  return `<g${flop}>
    ${tail}
    ${legs}
    <ellipse cx="0" cy="${bodyCy}" rx="${rx}" ry="${ry}" fill="${GREY}"/>
    <ellipse cx="${rx * 0.18}" cy="${bodyCy + ry * 0.38}" rx="${rx * 0.52}" ry="${ry * 0.5}" fill="#ffffff" opacity="0.88"/>
    ${pawUp}
    <path d="M${headX - headR + 2} ${headY - headR + 14} l-4 -25 l21 11 z" fill="${GREY}"/>
    <path d="M${headX + headR - 14} ${headY - headR + 10} l5 -25 l19 16 z" fill="${GREY}"/>
    <path d="M${headX - headR + 6} ${headY - headR + 12} l-2 -13 l11 6 z" fill="#e8b7c2"/>
    <circle cx="${headX}" cy="${headY}" r="${headR}" fill="${GREY}"/>
    <ellipse cx="${headX + 8}" cy="${headY + 14}" rx="17" ry="12" fill="#ffffff" opacity="0.92"/>
    <path d="M${headX - 2} ${headY + 4} q-16 8 -30 6 M${headX - 2} ${headY + 10} q-14 12 -26 16 M${headX + 26} ${headY + 2} q13 2 24 -3" stroke="${GREY_DARK}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>
    ${bugEyes(pose === 'sit' || pose === 'run' || pose === 'push' || pose === 'climb' || pose === 'ride' || pose === 'dodge' || pose === 'flop' ? 'happy' : pose, headX, headY)}
    <path d="M${headX + 20} ${headY + 2} l8 3.4 l-8 3.4 z" fill="#e58aa5"/>
    <path d="M${headX + 14} ${headY + 12} q6 5 12 1" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${headX - headR + 6} ${headY + headR - 12} q20 14 44 10" stroke="#5b9bd5" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g transform="translate(${headX - 6} ${headY + headR - 4})">
      <circle cx="0" cy="-7" r="5.4" fill="#7fb3e0"/><circle cx="-6.4" cy="0" r="5.4" fill="#7fb3e0"/><circle cx="6.4" cy="0" r="5.4" fill="#7fb3e0"/><circle cx="-3.6" cy="7" r="5.4" fill="#7fb3e0"/><circle cx="3.6" cy="7" r="5.4" fill="#7fb3e0"/>
      <circle cx="0" cy="0" r="3.6" fill="#f7c948"/>
    </g>
  </g>`;
}

export function senSvg(state: SenPoseArt): string {
  const SKIN = '#ffd9b8';
  const HAIR = '#4a3226';
  const PJ = '#a8c8e8';
  const PJ_D = '#8fb4dd';
  const mouth =
    state === 'stunned'
      ? `<circle cx="0" cy="-196" r="6" fill="#8a4b2d"/>`
      : state === 'holdBug'
        ? `<path d="M-8 -192 q8 -6 16 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
        : `<path d="M-9 -194 q9 8 18 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  const arms =
    state === 'chase'
      ? `<path d="M-34 -268 q-30 26 -18 58" stroke="${PJ_D}" stroke-width="17" fill="none" stroke-linecap="round"/>
         <path d="M34 -268 q34 8 44 -16" stroke="${PJ_D}" stroke-width="17" fill="none" stroke-linecap="round"/>
         <circle cx="80" cy="-286" r="9" fill="${SKIN}"/><circle cx="-50" cy="-206" r="9" fill="${SKIN}"/>`
      : state === 'stunned'
        ? `<path d="M-34 -268 q-26 -22 -34 -44 M34 -268 q26 -22 34 -44" stroke="${PJ_D}" stroke-width="17" fill="none" stroke-linecap="round"/>
           <circle cx="-70" cy="-316" r="9" fill="${SKIN}"/><circle cx="70" cy="-316" r="9" fill="${SKIN}"/>`
        : state === 'holdBug'
          ? `<path d="M-36 -262 q-6 44 30 52 M36 -262 q6 44 -30 52" stroke="${PJ_D}" stroke-width="17" fill="none" stroke-linecap="round"/>
             <circle cx="0" cy="-222" r="21" fill="${GREY}"/>
             <path d="M-16 -238 l-2 -13 l11 6 z M12 -240 l3 -13 l10 8 z" fill="${GREY}"/>
             <circle cx="-5" cy="-226" r="2.8" fill="${INK}"/><circle cx="7" cy="-226" r="2.8" fill="${INK}"/>`
          : `<path d="M-34 -268 q-14 34 -6 62 M34 -268 q14 34 6 62" stroke="${PJ_D}" stroke-width="17" fill="none" stroke-linecap="round"/>
             <circle cx="-40" cy="-202" r="9" fill="${SKIN}"/><circle cx="40" cy="-202" r="9" fill="${SKIN}"/>`;
  return `<g>
    <path d="M-32 -186 v172 q0 12 13 12 h7 q11 0 11 -12 v-164 M16 -186 v172 q0 12 13 12 h7 q11 0 11 -12 v-164" fill="${PJ}"/>
    <ellipse cx="-12" cy="-2" rx="15" ry="6" fill="${SKIN}"/><ellipse cx="34" cy="-2" rx="15" ry="6" fill="${SKIN}"/>
    <path d="M-40 -282 q0 -14 14 -14 h52 q14 0 14 14 v96 q0 14 -14 14 h-52 q-14 0 -14 -14 z" fill="${PJ}"/>
    <path d="M0 -292 v112" stroke="${PJ_D}" stroke-width="3"/>
    <circle cx="0" cy="-262" r="3.4" fill="#ffffff"/><circle cx="0" cy="-238" r="3.4" fill="#ffffff"/><circle cx="0" cy="-214" r="3.4" fill="#ffffff"/>
    ${arms}
    <circle cx="0" cy="-330" r="37" fill="${SKIN}"/>
    <path d="M-39 -328 a39 39 0 0 1 78 0 l-1 10 q-7 -13 -13 -8 q-3 -11 -11 -9 q-3 -9 -11 -10 q-9 0 -12 9 q-10 -3 -13 7 q-8 -3 -11 9 l-1 -8z" fill="${HAIR}"/>
    <path d="M-39 -330 q-7 20 -1 36 q7 3 11 -4 q-3 -20 -10 -32z" fill="${HAIR}"/>
    <path d="M39 -330 q7 20 1 36 q-7 3 -11 -4 q3 -20 10 -32z" fill="${HAIR}"/>
    <path d="M-18 -360 l6 -13 l6 12 M4 -364 l7 -12 l5 13" stroke="${HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M-30 -366 q-24 -16 -14 -38 q20 2 26 20 q4 14 -4 22z" fill="#9b7ede"/>
    <circle cx="-43" cy="-402" r="7.5" fill="#b79ced"/>
    <path d="M-24 -342 q10 -5 20 -1 M6 -343 q10 -4 19 1" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-14" cy="-330" r="3.6" fill="${INK}"/><circle cx="15" cy="-330" r="3.6" fill="${INK}"/>
    ${mouth}
    <circle cx="-24" cy="-318" r="6" fill="#f5a08c" opacity="0.55"/><circle cx="25" cy="-318" r="6" fill="#f5a08c" opacity="0.55"/>
  </g>`;
}
