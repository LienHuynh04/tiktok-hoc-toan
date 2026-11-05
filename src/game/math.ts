import type { Question, FigSpec } from './questions';

// =====================================================
//  LỚP TOÁN: câu hỏi TỰ SINH lúc vào tiết, theo CHƯƠNG TRÌNH TỪ LỚP 1 ĐẾN LỚP 12.
//  - makeMath(grade): bốc 1 bộ sinh thuộc đúng lớp đó (mỗi lớp 3-5 dạng).
//  - makeGeometry(rand): bốc 1 câu hình học bất kỳ (chu vi, diện tích, thể tích,
//    Pi-ta-go, vectơ, lượng giác cơ bản...) trải các lớp 3-10.
//  Đáp án LUÔN là số nguyên không âm (người xem gõ số, vd "83").
//  Quy ước bất biến để math.check.ts kiểm chứng độc lập được:
//    phần hiện trên bảng (show) luôn là 1 biểu thức tính ra đáp án,
//    hoặc 1 phương trình / dãy số chứa "?" mà thay đáp án vào thì đúng.
//  Kiểm tra độc lập: npx tsx src/game/math.check.ts
// =====================================================

/** Cấp độ cũ 1-6 đã đổi thành LỚP 1-12; giữ tên type để quiz.ts khỏi đổi nhiều */
export type MathLevel = number;

interface Raw {
  fig?: FigSpec;
  show: string;
  say: string;
  clue: string;
  n: number;
  reveal?: string;
  cat: string;
  kind: string;
}
interface H {
  int: (lo: number, hi: number) => number;
  coin: () => boolean;
  pick: <T>(arr: readonly T[]) => T;
}
interface GenDef {
  grade: number;
  geo?: boolean;
  hard?: boolean; // dạng nâng cao thật sự (Vi-ét, đạo hàm, tích phân...): chỉ ra theo tỉ lệ câu khó
  fn: (h: H) => Raw;
}

const NAMES = ['Bạn An', 'Bạn Bình', 'Bạn Chi', 'Bạn Dũng', 'Bạn Hà', 'Bạn Khang', 'Bạn Linh', 'Bạn Minh', 'Bạn Ngọc', 'Bạn Phúc'];
const ITEMS: [string, string][] = [
  ['viên', 'kẹo'],
  ['cái', 'bánh'],
  ['quả', 'cam'],
  ['quyển', 'vở'],
  ['cây', 'bút chì'],
  ['viên', 'bi'],
  ['cái', 'tem dán'],
  ['quả', 'táo'],
];
const NHAM = { cat: 'Toán nhẩm', kind: 'Câu toán nhẩm.' };
const DO = { cat: 'Toán đố', kind: 'Câu toán đố.' };
const HINH = { cat: 'Hình học', kind: 'Câu hình học.' };

const GENS: GenDef[] = [
  // ---------- LỚP 1 ----------
  { grade: 1, fn: (h) => { const a = h.int(3, 9), b = h.int(2, 9); const say = `${a} cộng ${b}`; return { show: `${a} + ${b}`, say, clue: `${say} bằng mấy?`, n: a + b, ...NHAM }; } },
  { grade: 1, fn: (h) => { const b = h.int(2, 9), a = b + h.int(2, 9); const say = `${a} trừ ${b}`; return { show: `${a} − ${b}`, say, clue: `${say} bằng mấy?`, n: a - b, ...NHAM }; } },
  { grade: 1, fn: (h) => { const a = h.int(1, 9), b = h.int(1, 9), c = h.int(1, 8); const say = `${a} cộng ${b} cộng ${c}`; return { show: `${a} + ${b} + ${c}`, say, clue: `${say} bằng mấy?`, n: a + b + c, ...NHAM }; } },
  // ---------- LỚP 2 ----------
  { grade: 2, fn: (h) => { const a = h.int(14, 68), b = h.int(12, 39); const say = `${a} cộng ${b}`; return { show: `${a} + ${b}`, say, clue: `${say} bằng mấy?`, n: a + b, ...NHAM }; } },
  { grade: 2, fn: (h) => { const a = h.int(41, 99), b = h.int(12, a - 8); const say = `${a} trừ ${b}`; return { show: `${a} − ${b}`, say, clue: `${say} bằng mấy?`, n: a - b, ...NHAM }; } },
  { grade: 2, fn: (h) => { const a = h.int(11, 49), b = h.int(3, 9); const say = `${a} nhân ${b}`; return { show: `${a} × ${b}`, say, clue: `${say} bằng mấy?`, n: a * b, ...NHAM }; } },
  // ---------- LỚP 3 ----------
  { grade: 3, fn: (h) => { const a = h.int(6, 12), b = h.int(3, 9); if (h.coin()) { const say = `${a} nhân ${b}`; return { show: `${a} × ${b}`, say, clue: `${say} bằng mấy?`, n: a * b, ...NHAM }; } const say = `${a * b} chia ${b}`; return { show: `${a * b} : ${b}`, say, clue: `${say} bằng mấy?`, n: a, ...NHAM }; } },
  { grade: 3, fn: (h) => { const a = h.int(12, 99), m = h.pick([10, 100]); const say = `${a} nhân ${m}`; return { show: `${a} × ${m}`, say, clue: `${say} bằng mấy?`, n: a * m, ...NHAM }; } },
  { grade: 3, fn: (h) => { const a = h.int(12, 99), m = h.pick([10, 100]); const say = `${a * m} chia ${m}`; return { show: `${a * m} : ${m}`, say, clue: `${say} bằng mấy?`, n: a, ...NHAM }; } },
  // ---------- LỚP 4 ----------
  { grade: 4, fn: (h) => {
    const kind = h.int(0, 2);
    if (kind === 0) { const a = h.int(10, 60), b = h.int(3, 9), c = h.int(3, 9); const say = `${a} cộng ${b} nhân ${c}`; return { show: `${a} + ${b} × ${c}`, say, clue: `${say} bằng mấy? Nhớ làm phép nhân trước nha.`, n: a + b * c, cat: 'Toán hai bước', kind: 'Câu toán hai bước.' }; }
    if (kind === 1) { const a = h.int(4, 9), b = h.int(4, 9), c = h.int(2, 15); const say = `${a} nhân ${b} trừ ${c}`; return { show: `${a} × ${b} − ${c}`, say, clue: `${say} bằng mấy?`, n: a * b - c, cat: 'Toán hai bước', kind: 'Câu toán hai bước.' }; }
    const a = h.int(2, 9), b = h.int(2, 9), c = h.int(3, 8); const say = `${a} cộng ${b}, tất cả nhân ${c}`; return { show: `(${a} + ${b}) × ${c}`, say, clue: `${say} bằng mấy?`, n: (a + b) * c, cat: 'Toán hai bước', kind: 'Câu toán hai bước.' };
  } },
  { grade: 4, fn: (h) => {
    // phân số của một số: lấy num/den của total
    const den = h.pick([2, 3, 4, 6]);
    const total = h.pick([12, 18, 24, 30, 36, 48].filter((x) => x % den === 0));
    const num = h.int(1, den - 1);
    const n = (total / den) * num;
    return { show: `${total} : ${den} × ${num}`, say: `${num} phần ${den} của ${total}`, clue: `${num} phần ${den} của ${total} là bao nhiêu?`, reveal: `${total} chia ${den} bằng ${total / den}, nhân ${num} bằng ${n}`, n, ...DO };
  } },
  { grade: 4, fn: (h) => { const a = h.int(120, 680), b = h.int(110, 390); const say = `${a} cộng ${b}`; return { show: `${a} + ${b}`, say, clue: `${say} bằng mấy?`, n: a + b, ...NHAM }; } },
  // ---------- LỚP 5 ----------
  { grade: 5, fn: (h) => {
    // tìm số còn thiếu (4 kiểu như bản cũ)
    const kind = h.int(0, 3);
    const CAT5 = { cat: 'Tìm số thiếu', kind: 'Câu tìm số còn thiếu.' };
    if (kind === 0) { const x = h.int(3, 40), b = h.int(3, 40); return { show: `? + ${b} = ${x + b}`, say: `số còn thiếu cộng ${b} bằng ${x + b}`, clue: `Số nào cộng với ${b} thì bằng ${x + b}?`, reveal: `${x} cộng ${b} bằng ${x + b}`, n: x, ...CAT5 }; }
    if (kind === 1) { const x = h.int(3, 40), b = h.int(3, 40); return { show: `${x + b} − ? = ${b}`, say: `${x + b} trừ số còn thiếu bằng ${b}`, clue: `${x + b} trừ đi số nào thì còn ${b}?`, reveal: `${x + b} trừ ${x} bằng ${b}`, n: x, ...CAT5 }; }
    if (kind === 2) { const x = h.int(3, 12), b = h.int(3, 9); return { show: `? × ${b} = ${x * b}`, say: `số còn thiếu nhân ${b} bằng ${x * b}`, clue: `Số nào nhân với ${b} thì bằng ${x * b}?`, reveal: `${x} nhân ${b} bằng ${x * b}`, n: x, ...CAT5 }; }
    const x = h.int(3, 12), b = h.int(3, 9); return { show: `${x * b} : ? = ${x}`, say: `${x * b} chia số còn thiếu bằng ${x}`, clue: `${x * b} chia cho số nào thì bằng ${x}?`, reveal: `${x * b} chia ${b} bằng ${x}`, n: b, ...CAT5 };
  } },
  { grade: 5, fn: (h) => { const pct = h.pick([10, 20, 25, 50, 75]); const base = h.pick([40, 60, 80, 100, 120, 200, 240, 300]); const n = (base * pct) / 100; return { show: `${base} × ${pct} : 100`, say: `${pct} phần trăm của ${base}`, clue: `${pct} phần trăm của ${base} là bao nhiêu?`, reveal: `${base} nhân ${pct} chia 100 bằng ${n}`, n, cat: 'Phần trăm', kind: 'Câu phần trăm.' }; } },
  { grade: 5, fn: (h) => { const a = h.int(5, 60), b = h.int(5, 60); let c = h.int(5, 60); c += (3 - ((a + b + c) % 3)) % 3; const say = `trung bình cộng của ${a}, ${b} và ${c}`; return { show: `(${a} + ${b} + ${c}) : 3`, say, clue: `Trung bình cộng của ${a}, ${b} và ${c} là bao nhiêu?`, n: (a + b + c) / 3, ...NHAM }; } },
  { grade: 5, fn: (h) => { const [from, to, f] = h.pick([['ki lô mét', 'mét', 1000], ['mét', 'xăng ti mét', 100], ['ki lô gam', 'gam', 1000], ['giờ', 'phút', 60], ['phút', 'giây', 60]] as const); const v = h.int(2, 15); return { show: `${v} × ${f}`, say: `${v} ${from} đổi ra ${to}`, clue: `${v} ${from} bằng bao nhiêu ${to}?`, n: v * f, cat: 'Đổi đơn vị', kind: 'Câu đổi đơn vị.' }; } },
  // ---------- LỚP 6 ----------
  { grade: 6, fn: (h) => {
    const who = h.pick(NAMES); const [unit, item] = h.pick(ITEMS); const kind = h.int(0, 2);
    if (kind === 0) { const boxes = h.int(3, 9), per = h.int(4, 12); return { show: `${boxes} × ${per}`, say: `${boxes} nhân ${per}`, clue: `${who} có ${boxes} hộp, mỗi hộp có ${per} ${unit} ${item}. ${who} có tất cả bao nhiêu ${unit} ${item}?`, n: boxes * per, ...DO }; }
    if (kind === 1) { const groups = h.int(3, 9), per = h.int(4, 12); return { show: `${groups * per} : ${groups}`, say: `${groups * per} chia ${groups}`, clue: `Có ${groups * per} ${unit} ${item}, chia đều cho ${groups} bạn. Mỗi bạn được bao nhiêu ${unit} ${item}?`, n: per, ...DO }; }
    const a = h.int(25, 80), b = h.int(8, 20), c = h.int(5, 25); return { show: `${a} − ${b} + ${c}`, say: `${a} trừ ${b} cộng ${c}`, clue: `${who} có ${a} ${unit} ${item}. ${who} cho bạn ${b} ${unit}, rồi mua thêm ${c} ${unit}. Giờ ${who} có bao nhiêu ${unit} ${item}?`, n: a - b + c, ...DO };
  } },
  { grade: 6, fn: (h) => { const start = h.int(2, 20), step = h.pick([2, 3, 4, 5, 10]); const n = start + 3 * step; return { show: `${start}, ${start + step}, ${start + 2 * step}, ?`, say: `dãy số ${start}, ${start + step}, ${start + 2 * step}`, clue: `Dãy số ${start}, ${start + step}, ${start + 2 * step}, số tiếp theo là số mấy?`, reveal: `Mỗi số hơn số trước ${step} đơn vị, số tiếp theo là ${n}`, n, cat: 'Dãy số', kind: 'Câu dãy số.' }; } },
  { grade: 6, fn: (h) => { const [p, q] = h.pick([[2, 3], [3, 4], [2, 5], [3, 5], [1, 2], [1, 3]] as const); const u = h.int(3, 12); const total = (p + q) * u; const n = p * u; return { show: `${total} : ${p + q} × ${p}`, say: `chia ${total} theo tỉ lệ ${p} và ${q}`, clue: `Chia ${total} viên kẹo cho hai bạn theo tỉ lệ ${p} và ${q}. Bạn thứ nhất được bao nhiêu viên?`, reveal: `Mỗi phần là ${total} chia ${p + q} bằng ${u} viên, bạn thứ nhất có ${p} phần nên được ${n} viên`, n, ...DO }; } },
  { grade: 6, fn: (h) => { const tme = h.int(2, 9), v = h.int(5, 30); const s = v * tme; return { show: `${s} : ${tme}`, say: `${s} chia ${tme}`, clue: `Một xe đi được ${s} ki lô mét trong ${tme} giờ. Vận tốc của xe là bao nhiêu ki lô mét mỗi giờ?`, reveal: `Lấy ${s} chia ${tme} bằng ${v} ki lô mét mỗi giờ`, n: v, ...DO }; } },
];

// ---------- HÌNH HỌC (trải lớp 3-10, bốc riêng bằng makeGeometry) ----------
GENS.push(
  { grade: 3, geo: true, fn: (h) => { const a = h.int(3, 15); return { show: `${a} × 4`, say: `${a} nhân 4`, clue: `Một hình vuông có cạnh ${a} xăng ti mét. Chu vi hình vuông đó là bao nhiêu xăng ti mét?`, n: a * 4, fig: { kind: 'square', a, la: `${a} cm`, what: 'chu vi' }, ...HINH }; } },
  { grade: 4, geo: true, fn: (h) => { const a = h.int(4, 15), b = h.int(3, 12); return { show: `(${a} + ${b}) × 2`, say: `${a} cộng ${b}, tất cả nhân 2`, clue: `Một hình chữ nhật dài ${a} xăng ti mét, rộng ${b} xăng ti mét. Chu vi của nó là bao nhiêu xăng ti mét?`, n: (a + b) * 2, fig: { kind: 'rect', a, b, la: `${a} cm`, lb: `${b} cm`, what: 'chu vi' }, ...HINH }; } },
  { grade: 4, geo: true, fn: (h) => { const a = h.int(3, 16), b = h.int(3, 12); return { show: `${a} × ${b}`, say: `${a} nhân ${b}`, clue: `Một hình chữ nhật dài ${a} xăng ti mét, rộng ${b} xăng ti mét. Diện tích của nó là bao nhiêu xăng ti mét vuông?`, n: a * b, fig: { kind: 'rect', a, b, la: `${a} cm`, lb: `${b} cm`, what: 'diện tích' }, ...HINH }; } },
  { grade: 5, geo: true, fn: (h) => { const a = h.int(3, 15); return { show: `${a} × ${a}`, say: `${a} nhân ${a}`, clue: `Một hình vuông có cạnh ${a} xăng ti mét. Diện tích hình vuông đó là bao nhiêu xăng ti mét vuông?`, n: a * a, fig: { kind: 'square', a, la: `${a} cm`, what: 'diện tích' }, ...HINH }; } },
  { grade: 5, geo: true, fn: (h) => { const base = h.int(4, 20); let hh = h.int(3, 16); if ((base * hh) % 2) hh += 1; return { show: `${base} × ${hh} : 2`, say: `${base} nhân ${hh} chia 2`, clue: `Một hình tam giác có đáy ${base} xăng ti mét, chiều cao ${hh} xăng ti mét. Diện tích tam giác là bao nhiêu xăng ti mét vuông?`, n: (base * hh) / 2, fig: { kind: 'triangle', a: base, b: hh, la: `${base} cm`, lb: `${hh} cm`, what: 'diện tích' }, ...HINH }; } },
  { grade: 5, geo: true, fn: (h) => { const a = h.int(2, 9), b = h.int(2, 8), c = h.int(2, 7); return { show: `${a} × ${b} × ${c}`, say: `${a} nhân ${b} nhân ${c}`, clue: `Một hình hộp chữ nhật dài ${a} đề xi mét, rộng ${b} đề xi mét, cao ${c} đề xi mét. Thể tích của nó là bao nhiêu đề xi mét khối?`, n: a * b * c, fig: { kind: 'box', a, b, c, la: `${a} dm`, lb: `${b} dm`, lc: `${c} dm`, what: 'thể tích' }, ...HINH }; } },
  { grade: 6, geo: true, fn: (h) => { const a = h.int(3, 10); return { show: `${a} × ${a} × ${a}`, say: `${a} nhân ${a} nhân ${a}`, clue: `Một hình lập phương có cạnh ${a} xăng ti mét. Thể tích hình lập phương là bao nhiêu xăng ti mét khối?`, n: a * a * a, fig: { kind: 'cube', a, la: `${a} cm`, what: 'thể tích' }, ...HINH }; } },
  { grade: 6, geo: true, fn: (h) => { const r = h.pick([10, 20]); const n = Math.round(3.14 * r * r); return { show: `3,14 × ${r} × ${r}`, say: `ba phẩy mười bốn nhân ${r} nhân ${r}`, clue: `Một hình tròn có bán kính ${r} xăng ti mét. Lấy pi bằng 3,14, diện tích hình tròn là bao nhiêu xăng ti mét vuông?`, reveal: `Ba phẩy mười bốn nhân ${r} nhân ${r} bằng ${n}`, n, fig: { kind: 'circle', a: r, la: `R = ${r} cm`, what: 'diện tích' }, ...HINH }; } },
  { grade: 8, geo: true, fn: (h) => { const [a, b, c] = h.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]] as const); return { show: `√(${a}^2 + ${b}^2)`, say: `căn của ${a} bình phương cộng ${b} bình phương`, clue: `Một tam giác vuông có hai cạnh góc vuông là ${a} và ${b} xăng ti mét. Cạnh huyền dài bao nhiêu xăng ti mét?`, reveal: `Theo Pi ta go, cạnh huyền bằng căn của ${a * a} cộng ${b * b} bằng ${c}`, n: c, fig: { kind: 'rtriangle', a, b, c, la: `${a} cm`, lb: `${b} cm`, lc: '?', what: 'cạnh huyền' }, ...HINH }; } },
  { grade: 8, geo: true, fn: (h) => { const [a, , c] = h.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]] as const); const b = Math.round(Math.sqrt(c * c - a * a)); return { show: `√(${c}^2 − ${a}^2)`, say: `căn của ${c} bình phương trừ ${a} bình phương`, clue: `Một tam giác vuông có cạnh huyền ${c} xăng ti mét, một cạnh góc vuông ${a} xăng ti mét. Cạnh góc vuông còn lại dài bao nhiêu xăng ti mét?`, reveal: `Theo Pi ta go, cạnh còn lại bằng căn của ${c * c} trừ ${a * a} bằng ${b}`, n: b, fig: { kind: 'rtriangle', a, b, c, la: `${a} cm`, lb: '?', lc: `${c} cm`, what: 'cạnh góc vuông còn lại' }, ...HINH }; } },
  { grade: 9, geo: true, fn: (h) => { const hyp = h.pick([10, 12, 16, 20, 24]); const n = hyp / 2; return { show: `${hyp} : 2`, say: `${hyp} chia 2`, clue: `Một tam giác vuông có cạnh huyền ${hyp} xăng ti mét. Cạnh góc vuông đối diện với góc 30 độ dài bao nhiêu xăng ti mét?`, reveal: `Cạnh đối diện góc 30 độ bằng nửa cạnh huyền, ${hyp} chia 2 bằng ${n}`, n, fig: { kind: 'rtriangle', a: 0, b: n, c: hyp, lb: '?', lc: `${hyp} cm`, angle: 30, what: 'cạnh đối diện góc 30°' }, ...HINH }; } },
  { grade: 10, geo: true, fn: (h) => { const [a, b, c] = h.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const); return { show: `√(${a}^2 + ${b}^2)`, say: `căn của ${a} bình phương cộng ${b} bình phương`, clue: `Vectơ u có toạ độ là ${a} và ${b}. Độ dài của vectơ u là bao nhiêu?`, reveal: `Độ dài vectơ bằng căn của ${a * a} cộng ${b * b} bằng ${c}`, n: c, fig: { kind: 'vector', a, b, c, la: `${a}`, lb: `${b}`, what: 'độ dài vectơ' }, ...HINH }; } },
);

// ---------- LỚP 7 ----------
GENS.push(
  { grade: 7, fn: (h) => { const base = h.pick([2, 3, 5, 10]); const exp = base === 2 ? h.int(3, 6) : base === 3 ? h.int(2, 4) : base === 5 ? h.int(2, 3) : h.int(2, 4); const n = base ** exp; return { show: `${base}^${exp}`, say: `${base} mũ ${exp}`, clue: `${base} mũ ${exp} bằng bao nhiêu?`, n, cat: 'Luỹ thừa', kind: 'Câu luỹ thừa.' }; } },
  { grade: 7, fn: (h) => { const r = h.int(4, 15); return { show: `√${r * r}`, say: `căn bậc hai của ${r * r}`, clue: `Căn bậc hai của ${r * r} là số mấy?`, n: r, cat: 'Căn bậc hai', kind: 'Câu căn bậc hai.' }; } },
  { grade: 7, fn: (h) => { const a = h.int(2, 15), b = h.int(2, 12); return { show: `|−${a}| + ${b}`, say: `giá trị tuyệt đối của âm ${a}, cộng ${b}`, clue: `Giá trị tuyệt đối của âm ${a} cộng ${b} bằng bao nhiêu?`, n: a + b, ...NHAM }; } },
  { grade: 7, fn: (h) => { const x = h.int(3, 12), y = x + h.int(4, 15); return { show: `−${x} + ${y}`, say: `âm ${x} cộng ${y}`, clue: `Âm ${x} cộng ${y} bằng bao nhiêu?`, n: y - x, ...NHAM }; } },
  { grade: 7, fn: (h) => { const a = h.int(2, 9), b = h.int(3, 9), k = h.int(2, 8); const c = b * k, x = a * k; return { show: `${a} : ${b} = ? : ${c}`, say: `${a} chia ${b} bằng mấy chia ${c}`, clue: `Tìm số còn thiếu trong tỉ lệ thức: ${a} chia ${b} bằng số mấy chia ${c}?`, reveal: `Nhân chéo, số còn thiếu là ${a} nhân ${k} bằng ${x}`, n: x, cat: 'Tìm số thiếu', kind: 'Câu tìm số còn thiếu.' }; } },
);

// ---------- LỚP 8 ----------
GENS.push(
  { grade: 8, fn: (h) => { const a = h.int(5, 12), b = h.int(2, a - 1); return { show: `${a}^2 − ${b}^2`, say: `${a} bình phương trừ ${b} bình phương`, clue: `${a} bình phương trừ ${b} bình phương bằng bao nhiêu?`, reveal: `${a} bình phương bằng ${a * a}, ${b} bình phương bằng ${b * b}, hiệu là ${a * a - b * b}`, n: a * a - b * b, cat: 'Đại số', kind: 'Câu đại số.' }; } },
  { grade: 8, fn: (h) => { const a = h.int(2, 9), x = h.int(2, 15), b = h.int(1, 20); const c = a * x + b; return { show: `${a} × ? + ${b} = ${c}`, say: `${a} nhân x cộng ${b} bằng ${c}`, clue: `Tìm x, biết ${a} nhân x cộng ${b} bằng ${c}. x bằng mấy?`, reveal: `${a} nhân ${x} cộng ${b} bằng ${c}`, n: x, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
  { grade: 8, fn: (h) => { const r = h.int(2, 6); return { show: `∛${r ** 3}`, say: `căn bậc ba của ${r ** 3}`, clue: `Căn bậc ba của ${r ** 3} là số mấy?`, n: r, cat: 'Căn bậc ba', kind: 'Câu căn bậc ba.' }; } },
);

// ---------- LỚP 9 ----------
GENS.push(
  { grade: 9, fn: (h) => { const r1 = h.int(1, 5), r2 = r1 + h.int(1, 6); const b = r1 + r2, c = r1 * r2; return { show: `?^2 − ${b} × ? + ${c} = 0`, say: `phương trình bậc hai có hai nghiệm`, clue: `Phương trình x bình phương trừ ${b} x cộng ${c} bằng 0 có hai nghiệm. Nghiệm lớn hơn là số mấy?`, reveal: `Hai nghiệm là ${r1} và ${r2}, nghiệm lớn hơn là ${r2}`, n: r2, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
  { grade: 9, fn: (h) => { const x = h.int(3, 15), y = h.int(2, x - 1); const S = x + y, D = x - y; return { show: `(${S} + ${D}) : 2`, say: `${S} cộng ${D}, tất cả chia 2`, clue: `Hai số có tổng là ${S} và hiệu là ${D}. Số lớn hơn là số mấy?`, reveal: `Số lớn bằng tổng cộng hiệu chia đôi, ${S} cộng ${D} chia 2 bằng ${x}`, n: x, ...DO }; } },
  { grade: 9, fn: (h) => { const a = h.int(2, 6), b = h.int(1, 12), x0 = h.int(2, 9); const n = a * x0 + b; return { show: `${a} × ${x0} + ${b}`, say: `${a} nhân ${x0} cộng ${b}`, clue: `Cho hàm số f x bằng ${a} x cộng ${b}. Giá trị f của ${x0} bằng bao nhiêu?`, reveal: `Thay x bằng ${x0} được ${a} nhân ${x0} cộng ${b} bằng ${n}`, n, cat: 'Hàm số', kind: 'Câu hàm số.' }; } },
);


// ---------- LỚP 9: dạng KHÓ bổ sung (tăng độ khó 2026-11-04) ----------
GENS.push(
  { grade: 9, hard: true, fn: (h) => { const r1 = h.int(2, 6), r2 = r1 + h.int(1, 4); const S = r1 + r2, P = r1 * r2; if (h.coin()) return { show: `${r1} + ${r2}`, say: `tổng hai nghiệm của phương trình`, clue: `Phương trình x bình phương trừ ${S} x cộng ${P} bằng 0 có hai nghiệm phân biệt. Tổng hai nghiệm bằng bao nhiêu?`, reveal: `Theo định lý Vi-ét, tổng hai nghiệm bằng ${S}`, n: S, cat: 'Phương trình', kind: 'Câu phương trình.' }; return { show: `${r1} × ${r2}`, say: `tích hai nghiệm của phương trình`, clue: `Phương trình x bình phương trừ ${S} x cộng ${P} bằng 0 có hai nghiệm phân biệt. Tích hai nghiệm bằng bao nhiêu?`, reveal: `Theo định lý Vi-ét, tích hai nghiệm bằng ${P}`, n: P, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
);

// ---------- LỚP 10 ----------
GENS.push(
  { grade: 10, fn: (h) => { const a = h.pick([1, 2]); const b = h.int(3, 9); let c = h.int(1, 6); if (b * b - 4 * a * c <= 0) c = 1; const n = b * b - 4 * a * c; return { show: `${b}^2 − 4 × ${a} × ${c}`, say: `${b} bình phương trừ bốn nhân ${a} nhân ${c}`, clue: `Phương trình bậc hai có a bằng ${a}, b bằng ${b}, c bằng ${c}. Biệt thức đen ta bằng bao nhiêu?`, reveal: `Đen ta bằng ${b} bình phương trừ ${4 * a * c} bằng ${n}`, n, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
  { grade: 10, fn: (h) => { const k = h.int(2, 9); return { show: `${2 * k} : 2`, say: `${2 * k} chia 2`, clue: `Parabol y bằng x bình phương trừ ${2 * k} x cộng 5 có đỉnh. Hoành độ của đỉnh là số mấy?`, reveal: `Hoành độ đỉnh bằng ${2 * k} chia 2 bằng ${k}`, n: k, cat: 'Hàm số', kind: 'Câu hàm số.' }; } },
  { grade: 10, fn: (h) => { const A = h.int(10, 25), B = h.int(8, 20), AB = h.int(3, Math.min(A, B) - 1); const n = A + B - AB; return { show: `${A} + ${B} − ${AB}`, say: `${A} cộng ${B} trừ ${AB}`, clue: `Một lớp có ${A} bạn thích toán, ${B} bạn thích văn, trong đó ${AB} bạn thích cả hai môn. Có bao nhiêu bạn thích ít nhất một trong hai môn?`, reveal: `Cộng hai nhóm rồi trừ phần trùng, ${A} cộng ${B} trừ ${AB} bằng ${n}`, n, ...DO }; } },
);


// ---------- LỚP 10: dạng KHÓ bổ sung (tăng độ khó 2026-11-04) ----------
GENS.push(
  { grade: 10, hard: true, fn: (h) => { const a = h.int(1, 9), b = h.int(2, 9); return { show: `${a} + ${b}`, say: `nghiệm lớn của phương trình trị tuyệt đối`, clue: `Phương trình trị tuyệt đối của x trừ ${a} bằng ${b} có nghiệm lớn hơn bằng bao nhiêu?`, reveal: `Nghiệm lớn hơn bằng ${a} cộng ${b} bằng ${a + b}`, n: a + b, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
  { grade: 10, hard: true, fn: (h) => { const [dx, dy, d] = h.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]] as const); return { show: `√(${dx}^2 + ${dy}^2)`, say: `căn của ${dx} bình phương cộng ${dy} bình phương`, clue: `Khoảng cách từ gốc tọa độ O đến điểm A có tọa độ ${dx} phẩy ${dy} bằng bao nhiêu?`, reveal: `Khoảng cách bằng căn của ${dx * dx} cộng ${dy * dy} bằng ${d}`, n: d, cat: 'Tọa độ', kind: 'Câu tọa độ.' }; } },
);

// ---------- LỚP 11 ----------
GENS.push(
  { grade: 11, fn: (h) => { const u1 = h.int(1, 15), d = h.int(2, 7), ni = h.int(4, 9); const n = u1 + (ni - 1) * d; return { show: `${u1} + ${ni - 1} × ${d}`, say: `${u1} cộng ${ni - 1} nhân ${d}`, clue: `Một cấp số cộng có số hạng đầu là ${u1}, công sai ${d}. Số hạng thứ ${ni} là số mấy?`, reveal: `Số hạng thứ ${ni} bằng ${u1} cộng ${ni - 1} nhân ${d} bằng ${n}`, n, cat: 'Dãy số', kind: 'Câu dãy số.' }; } },
  { grade: 11, fn: (h) => { const u1 = h.int(1, 5), r = h.pick([2, 3]), ni = h.int(3, 5); const n = u1 * r ** (ni - 1); return { show: `${u1} × ${r}^${ni - 1}`, say: `${u1} nhân ${r} mũ ${ni - 1}`, clue: `Một cấp số nhân có số hạng đầu là ${u1}, công bội ${r}. Số hạng thứ ${ni} là số mấy?`, n, cat: 'Dãy số', kind: 'Câu dãy số.' }; } },
  { grade: 11, fn: (h) => { const n0 = h.int(3, 6); let f = 1; const parts: number[] = []; for (let i = 1; i <= n0; i++) { f *= i; parts.push(i); } return { show: parts.join(' × '), say: parts.join(' nhân '), clue: `${n0} giai thừa bằng bao nhiêu?`, n: f, cat: 'Tổ hợp', kind: 'Câu tổ hợp.' }; } },
  { grade: 11, fn: (h) => { const [nn, k] = h.pick([[5, 2], [6, 2], [6, 3], [7, 2], [8, 2], [8, 3], [10, 2]] as const); const show = k === 2 ? `${nn} × ${nn - 1} : 2` : `${nn} × ${nn - 1} × ${nn - 2} : 6`; let n = 1; for (let i = 0; i < k; i++) n = (n * (nn - i)) / (i + 1); return { show, say: `tổ hợp chập ${k} của ${nn}`, clue: `Tổ hợp chập ${k} của ${nn} phần tử bằng bao nhiêu?`, n, cat: 'Tổ hợp', kind: 'Câu tổ hợp.' }; } },
  { grade: 11, fn: (h) => { const ni = h.int(4, 9), u1 = h.int(1, 10); let d = h.int(1, 5); let un = u1 + (ni - 1) * d; while ((ni * (u1 + un)) % 2 !== 0) { d += 1; un = u1 + (ni - 1) * d; } const n = (ni * (u1 + un)) / 2; return { show: `${ni} × (${u1} + ${un}) : 2`, say: `${ni} nhân tổng ${u1} cộng ${un}, tất cả chia 2`, clue: `Một cấp số cộng có số hạng đầu ${u1}, công sai ${d}. Tổng của ${ni} số hạng đầu tiên là bao nhiêu?`, reveal: `Số hạng thứ ${ni} là ${un}, tổng bằng ${ni} nhân ${u1 + un} chia 2 bằng ${n}`, n, cat: 'Dãy số', kind: 'Câu dãy số.' }; } },
);


// ---------- LỚP 11: dạng KHÓ bổ sung (tăng độ khó 2026-11-04) ----------
GENS.push(
  { grade: 11, hard: true, fn: (h) => { const [nn, k] = h.pick([[6, 2], [7, 2], [7, 3], [8, 2], [8, 3]] as const); const parts = Array.from({ length: k }, (_, i) => nn - i); let n = 1; for (const p of parts) n *= p; return { show: parts.join(' × '), say: `chỉnh hợp chập ${k} của ${nn}`, clue: `Chỉnh hợp chập ${k} của ${nn} phần tử bằng bao nhiêu?`, reveal: `Chỉnh hợp bằng tích ${parts.join(' nhân ')} bằng ${n}`, n, cat: 'Tổ hợp', kind: 'Câu tổ hợp.' }; } },
  { grade: 11, hard: true, fn: (h) => { const u1 = h.int(1, 3), m = h.int(4, 5); const terms = Array.from({ length: m }, (_, i) => u1 * 2 ** i); const n = terms.reduce((x, y) => x + y, 0); return { show: terms.join(' + '), say: `tổng ${m} số hạng đầu của cấp số nhân`, clue: `Một cấp số nhân có số hạng đầu là ${u1}, công bội 2. Tổng của ${m} số hạng đầu tiên là bao nhiêu?`, reveal: `Cộng dồn ${terms.join(' cộng ')} bằng ${n}`, n, cat: 'Dãy số', kind: 'Câu dãy số.' }; } },
);

// ---------- LỚP 12 ----------
GENS.push(
  { grade: 12, hard: true, fn: (h) => { const a = h.int(1, 5), x0 = h.int(2, 4); const n = 3 * x0 * x0 + a; return { show: `3 × ${x0}^2 + ${a}`, say: `ba nhân ${x0} bình phương cộng ${a}`, clue: `Đạo hàm của hàm số f x bằng x mũ ba cộng ${a} x, tính tại điểm x bằng ${x0}, cho kết quả là bao nhiêu?`, reveal: `Đạo hàm là ba x bình cộng ${a}, thay x bằng ${x0} được ${n}`, n, cat: 'Đạo hàm', kind: 'Câu đạo hàm.' }; } },
  { grade: 12, fn: (h) => { const base = h.pick([2, 3, 5, 10]); const e = base === 2 ? h.int(2, 6) : base === 3 ? h.int(2, 4) : h.int(2, 3); const val = base ** e; return { show: `${base}^? = ${val}`, say: `${base} mũ x bằng ${val}`, clue: `Tìm x, biết ${base} mũ x bằng ${val}. x bằng mấy?`, reveal: `${base} mũ ${e} bằng ${val} nên x bằng ${e}`, n: e, cat: 'Phương trình', kind: 'Câu phương trình.' }; } },
  { grade: 12, hard: true, fn: (h) => { const a = h.pick([3, 6]); const n = (a ** 3) / 3; return { show: `${a}^3 : 3`, say: `${a} mũ ba chia 3`, clue: `Tích phân từ 0 đến ${a} của x bình phương bằng bao nhiêu?`, reveal: `Tích phân bằng ${a} mũ ba chia 3 bằng ${n}`, n, cat: 'Tích phân', kind: 'Câu tích phân.' }; } },
  { grade: 12, fn: (h) => { const [a, b, c] = h.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const); return { show: `√(${a}^2 + ${b}^2)`, say: `căn của ${a} bình phương cộng ${b} bình phương`, clue: `Số phức z bằng ${a} cộng ${b} i. Mô đun của số phức z là bao nhiêu?`, reveal: `Mô đun bằng căn của ${a * a} cộng ${b * b} bằng ${c}`, n: c, cat: 'Số phức', kind: 'Câu số phức.' }; } },
);


// ---------- LỚP 12: dạng KHÓ bổ sung (tăng độ khó 2026-11-04) ----------
GENS.push(
  { grade: 12, hard: true, fn: (h) => { const x0 = h.int(1, 2); const a = x0 === 1 ? 1 : h.int(1, 4); const n = 4 * x0 ** 3 - 2 * a * x0; return { show: `4 × ${x0}^3 − ${2 * a} × ${x0}`, say: `bốn nhân ${x0} mũ ba trừ ${2 * a} nhân ${x0}`, clue: `Đạo hàm của hàm số f x bằng x mũ bốn trừ ${a} x bình phương, tính tại điểm x bằng ${x0}, bằng bao nhiêu?`, reveal: `Đạo hàm là bốn x mũ ba trừ ${2 * a} x, thay x bằng ${x0} được ${n}`, n, cat: 'Đạo hàm', kind: 'Câu đạo hàm.' }; } },
  { grade: 12, hard: true, fn: (h) => { const k = h.int(2, 6), c = h.int(1, 9); const n = k * k + c; return { show: `${k}^2 + ${c}`, say: `${k} bình phương cộng ${c}`, clue: `Hàm số y bằng trừ x bình phương cộng ${2 * k} x cộng ${c} đạt giá trị lớn nhất bằng bao nhiêu?`, reveal: `Đỉnh parabol ở x bằng ${k}, giá trị lớn nhất bằng ${n}`, n, cat: 'Hàm số', kind: 'Câu hàm số.' }; } },
  { grade: 12, hard: true, fn: (h) => { const a = h.pick([2, 4, 6]); const n = (a * a) / 2 + a; return { show: `${a}^2 : 2 + ${a}`, say: `${a} bình phương chia hai cộng ${a}`, clue: `Tích phân từ 0 đến ${a} của x cộng 1 bằng bao nhiêu?`, reveal: `Tích phân bằng ${a} bình phương chia hai cộng ${a} bằng ${n}`, n, cat: 'Tích phân', kind: 'Câu tích phân.' }; } },
);

// ---------- Xuất bản ----------
const DIFF = (grade: number): Question['difficulty'] => (grade <= 3 ? 'easy' : grade <= 8 ? 'medium' : 'hard');

function wrap(def: GenDef, raw: Raw): Question {
  const grade = def.grade;
  const show = raw.show.includes('?') || raw.show.includes('=') ? raw.show : `${raw.show} = ?`;
  return {
    id: `toan${grade}:${raw.show}:${raw.clue}`,
    answer: String(raw.n),
    clue: raw.clue,
    category: raw.cat,
    kind: raw.kind,
    difficulty: DIFF(grade),
    math: { show, say: raw.say, level: grade, reveal: raw.reveal, fig: raw.fig },
  };
}

function helpers(rand: () => number): H {
  return {
    int: (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1)),
    coin: () => rand() < 0.5,
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
  };
}

/** Bốc 1 câu toán thuộc đúng 1 lớp (1-12) */
export function makeMath(grade: number, rand = Math.random, opts?: { excludeHard?: boolean }): Question {
  let pool = GENS.filter((g) => g.grade === grade && !g.geo && (!opts?.excludeHard || !g.hard));
  if (!pool.length) pool = GENS.filter((g) => g.grade === grade && !g.geo);
  const def = pool[Math.floor(rand() * pool.length)] ?? GENS[0];
  return wrap(def, def.fn(helpers(rand)));
}

/** Bốc 1 câu KHÓ thật sự: chỉ từ các dạng nâng cao đã gắn nhãn hard (lớp 9-12) */
export function makeHardMath(rand = Math.random): Question {
  const pool = GENS.filter((g) => g.hard && !g.geo);
  const def = pool[Math.floor(rand() * pool.length)] ?? GENS[0];
  return wrap(def, def.fn(helpers(rand)));
}

/**
 * Bốc nguồn câu theo tỉ lệ chủ kênh chốt: hardChance câu khó; phần còn lại chia theo
 * lowShare cho khối lớp 1-9 (phần dư là lớp 10-12 thường). Với 0.2 / 0.5 thì tổng thể:
 * 20% khó, 50% lớp 1-9, 30% lớp 10-12 thường.
 */
export function rollQuestionBand(
  rand: () => number,
  hardChance: number,
  lowShare: number,
): { hard: true } | { grade: number } {
  if (rand() < hardChance) return { hard: true };
  const lowP = lowShare / (1 - hardChance);
  return rand() < lowP ? { grade: 1 + Math.floor(rand() * 9) } : { grade: 10 + Math.floor(rand() * 3) };
}

/** Bốc 1 câu hình học (các lớp 3-10); minGrade lọc bỏ hình dễ khi cần câu khó */
export function makeGeometry(rand = Math.random, minGrade = 1): Question {
  const pool = GENS.filter((g) => g.geo && g.grade >= minGrade);
  const def = pool[Math.floor(rand() * pool.length)];
  return wrap(def, def.fn(helpers(rand)));
}

/** Danh sách lớp có bộ sinh (cho kiểm thử) */
export const MATH_GRADES = [...new Set(GENS.filter((g) => !g.geo).map((g) => g.grade))].sort((a, b) => a - b);
export const GEO_COUNT = GENS.filter((g) => g.geo).length;
