import type { Question } from './questions';

// =====================================================
//  LỚP TOÁN: câu hỏi TỰ SINH lúc vào tiết, không dùng file câu hỏi chữ.
//  6 cấp độ:
//   1 cộng trừ 1 chữ số · 2 cộng trừ 2 chữ số · 3 nhân chia bảng cửu chương
//   4 phép tính hai bước · 5 tìm số còn thiếu (? + 7 = 15, dãy số để ở cấp 6)
//   6 toán đố bằng lời + dãy số + chu vi (đáp án vẫn là 1 số, gõ số là đúng)
//  Đáp án luôn là số tự nhiên dương, người xem gõ số (vd "83").
//  Kiểm tra độc lập: npx tsx src/game/math.check.ts (đánh giá lại phép tính bằng máy tính riêng)
// =====================================================

export type MathLevel = 1 | 2 | 3 | 4 | 5 | 6;

const DIFF = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'hard', 5: 'medium', 6: 'hard' } as const;
const KIND = {
  1: 'Câu toán nhẩm.',
  2: 'Câu toán nhẩm.',
  3: 'Câu toán nhẩm.',
  4: 'Câu toán hai bước.',
  5: 'Câu tìm số còn thiếu.',
  6: 'Câu toán đố.',
} as const;
const CAT = { 1: 'Toán nhẩm', 2: 'Toán nhẩm', 3: 'Toán nhẩm', 4: 'Toán hai bước', 5: 'Tìm số thiếu', 6: 'Toán đố' } as const;

const NAMES = ['Bạn An', 'Bạn Bình', 'Bạn Chi', 'Bạn Dũng', 'Bạn Hà', 'Bạn Khang', 'Bạn Linh', 'Bạn Minh', 'Bạn Ngọc', 'Bạn Phúc'];
const ITEMS: [string, string][] = [
  // [đơn vị đếm, vật]
  ['viên', 'kẹo'],
  ['cái', 'bánh'],
  ['quả', 'cam'],
  ['quyển', 'vở'],
  ['cây', 'bút chì'],
  ['viên', 'bi'],
  ['cái', 'tem dán'],
  ['quả', 'táo'],
];

export function makeMath(level: MathLevel, rand = Math.random): Question {
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const coin = () => rand() < 0.5;
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  let show = '';
  let say = '';
  let clue = '';
  let reveal: string | undefined;
  let category: string = CAT[level];
  let n = 0;

  if (level === 1) {
    if (coin()) {
      const a = int(3, 9), b = int(2, 9);
      [show, say, n] = [`${a} + ${b}`, `${a} cộng ${b}`, a + b];
    } else {
      const b = int(2, 9), a = b + int(2, 9);
      [show, say, n] = [`${a} − ${b}`, `${a} trừ ${b}`, a - b];
    }
    clue = `${say} bằng mấy?`;
  } else if (level === 2) {
    const kind = int(0, 2);
    if (kind === 0) {
      const a = int(14, 68), b = int(12, 39);
      [show, say, n] = [`${a} + ${b}`, `${a} cộng ${b}`, a + b];
    } else if (kind === 1) {
      const a = int(41, 99), b = int(12, a - 8);
      [show, say, n] = [`${a} − ${b}`, `${a} trừ ${b}`, a - b];
    } else {
      const a = int(11, 49), b = int(3, 9);
      [show, say, n] = [`${a} × ${b}`, `${a} nhân ${b}`, a * b];
    }
    clue = `${say} bằng mấy?`;
  } else if (level === 3) {
    const a = int(6, 12), b = int(3, 9);
    if (coin()) [show, say, n] = [`${a} × ${b}`, `${a} nhân ${b}`, a * b];
    else [show, say, n] = [`${a * b} : ${b}`, `${a * b} chia ${b}`, a];
    clue = `${say} bằng mấy?`;
  } else if (level === 4) {
    const kind = int(0, 2);
    if (kind === 0) {
      const a = int(10, 60), b = int(3, 9), c = int(3, 9);
      [show, say, n] = [`${a} + ${b} × ${c}`, `${a} cộng ${b} nhân ${c}`, a + b * c];
    } else if (kind === 1) {
      const a = int(4, 9), b = int(4, 9), c = int(2, 15);
      [show, say, n] = [`${a} × ${b} − ${c}`, `${a} nhân ${b} trừ ${c}`, a * b - c];
    } else {
      const a = int(2, 9), b = int(2, 9), c = int(3, 8);
      [show, say, n] = [`(${a} + ${b}) × ${c}`, `${a} cộng ${b}, tất cả nhân ${c}`, (a + b) * c];
    }
    clue = `${say} bằng mấy? Nhớ làm phép nhân trước nha.`;
  } else if (level === 5) {
    // Tìm số còn thiếu: hiện "? + 7 = 15", đáp án là số thay vào dấu ?
    const kind = int(0, 3);
    if (kind === 0) {
      const x = int(3, 40), b = int(3, 40);
      show = `? + ${b} = ${x + b}`;
      say = `số còn thiếu cộng ${b} bằng ${x + b}`;
      clue = `Số nào cộng với ${b} thì bằng ${x + b}?`;
      reveal = `${x} cộng ${b} bằng ${x + b}`;
      n = x;
    } else if (kind === 1) {
      const x = int(3, 40), b = int(3, 40);
      show = `${x + b} − ? = ${b}`;
      say = `${x + b} trừ số còn thiếu bằng ${b}`;
      clue = `${x + b} trừ đi số nào thì còn ${b}?`;
      reveal = `${x + b} trừ ${x} bằng ${b}`;
      n = x;
    } else if (kind === 2) {
      const x = int(3, 12), b = int(3, 9);
      show = `? × ${b} = ${x * b}`;
      say = `số còn thiếu nhân ${b} bằng ${x * b}`;
      clue = `Số nào nhân với ${b} thì bằng ${x * b}?`;
      reveal = `${x} nhân ${b} bằng ${x * b}`;
      n = x;
    } else {
      const x = int(3, 12), b = int(3, 9);
      show = `${x * b} : ? = ${x}`;
      say = `${x * b} chia số còn thiếu bằng ${x}`;
      clue = `${x * b} chia cho số nào thì bằng ${x}?`;
      reveal = `${x * b} chia ${b} bằng ${x}`;
      n = b;
    }
  } else {
    const kind = int(0, 4);
    const who = pick(NAMES);
    const [unit, item] = pick(ITEMS);
    if (kind === 0) {
      // toán đố: nhiều hộp, mỗi hộp có chừng này cái
      const boxes = int(3, 9), per = int(4, 12);
      show = `${boxes} × ${per}`;
      say = `${boxes} nhân ${per}`;
      clue = `${who} có ${boxes} hộp, mỗi hộp có ${per} ${unit} ${item}. ${who} có tất cả bao nhiêu ${unit} ${item}?`;
      n = boxes * per;
    } else if (kind === 1) {
      // toán đố: chia đều
      const groups = int(3, 9), per = int(4, 12);
      show = `${groups * per} : ${groups}`;
      say = `${groups * per} chia ${groups}`;
      clue = `Có ${groups * per} ${unit} ${item}, chia đều cho ${groups} bạn. Mỗi bạn được bao nhiêu ${unit} ${item}?`;
      n = per;
    } else if (kind === 2) {
      // toán đố: có chừng này, cho đi chừng này, mua thêm chừng này
      const a = int(25, 80), b = int(8, 20), c = int(5, 25);
      show = `${a} − ${b} + ${c}`;
      say = `${a} trừ ${b} cộng ${c}`;
      clue = `${who} có ${a} ${unit} ${item}. ${who} cho bạn ${b} ${unit}, rồi mua thêm ${c} ${unit}. Giờ ${who} có bao nhiêu ${unit} ${item}?`;
      n = a - b + c;
    } else if (kind === 3) {
      // dãy số: cấp số cộng đơn giản
      const start = int(2, 20), step = pick([2, 3, 4, 5, 10]);
      show = `${start}, ${start + step}, ${start + 2 * step}, ?`;
      say = `dãy số ${start}, ${start + step}, ${start + 2 * step}`;
      clue = `Dãy số ${start}, ${start + step}, ${start + 2 * step}, số tiếp theo là số mấy?`;
      reveal = `Mỗi số hơn số trước ${step} đơn vị, số tiếp theo là ${start + 3 * step}`;
      category = 'Dãy số';
      n = start + 3 * step;
    } else {
      // chu vi hình vuông / chữ nhật
      if (coin()) {
        const a = int(3, 15);
        show = `${a} × 4`;
        say = `${a} nhân 4`;
        clue = `Một hình vuông có cạnh ${a} xăng ti mét. Chu vi hình vuông đó là bao nhiêu xăng ti mét?`;
        n = a * 4;
      } else {
        const a = int(4, 15), b = int(3, 12);
        show = `(${a} + ${b}) × 2`;
        say = `${a} cộng ${b}, tất cả nhân 2`;
        clue = `Một hình chữ nhật dài ${a} xăng ti mét, rộng ${b} xăng ti mét. Chu vi của nó là bao nhiêu xăng ti mét?`;
        n = (a + b) * 2;
      }
      category = 'Hình học';
    }
  }

  return {
    id: `toan${level}:${show}:${clue}`,
    answer: String(n),
    clue,
    category,
    kind: category === 'Dãy số' ? 'Câu dãy số.' : category === 'Hình học' ? 'Câu hình học.' : KIND[level],
    difficulty: DIFF[level],
    math: { show: level === 5 || category === 'Dãy số' ? show : `${show} = ?`, say, level, reveal },
  };
}
