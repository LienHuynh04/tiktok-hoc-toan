// Kiểm chứng ĐỘC LẬP cho math.ts (bộ sinh câu hỏi Lớp 1-12 + Hình học).
// Nguyên tắc: không tin đáp án của bộ sinh. Phần hiện trên bảng (math.show) luôn là
// 1 biểu thức tính ra đáp án, hoặc 1 phương trình / dãy số chứa "?" — máy tính riêng
// ở đây tự tính lại biểu thức / thay đáp án vào phương trình để đối chiếu.
// Chạy: npx tsx src/game/math.check.ts
import { makeMath, makeGeometry, MATH_GRADES, GEO_COUNT } from './math';

// ---------- máy tính biểu thức độc lập (đệ quy): số thập phân , . + − × : / ^ ( ) √ ∛ | | ! ----------
function evaluate(srcIn: string): number {
  const src = srcIn.replace(/\s+/g, '');
  let pos = 0;
  const peek = () => src[pos];
  const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === '+' || peek() === '−' || peek() === '-') { const op = src[pos++]; const r = parseTerm(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === '×' || peek() === ':' || peek() === '/' || peek() === '*') { const op = src[pos++]; const r = parseFactor(); v = op === '×' || op === '*' ? v * r : v / r; }
    return v;
  }
  function parseFactor(): number {
    let v = parseUnary();
    while (peek() === '^') { pos++; v = v ** parseUnary(); }
    return v;
  }
  function parseUnary(): number {
    const ch = peek();
    if (ch === '−' || ch === '-') { pos++; return -parseUnary(); }
    if (ch === '+') { pos++; return parseUnary(); }
    if (ch === '√') { pos++; return Math.sqrt(parseUnary()); }
    if (ch === '∛') { pos++; return Math.cbrt(parseUnary()); }
    if (ch === '|') { pos++; const v = parseExpr(); if (peek() === '|') pos++; return Math.abs(v); }
    if (ch === '(') { pos++; const v = parseExpr(); if (peek() === ')') pos++; return peek() === '!' ? (pos++, fact(v)) : v; }
    let num = '';
    while (pos < src.length && /[0-9.,]/.test(src[pos])) num += src[pos++];
    if (!num) throw new Error(`không đọc được số tại ${pos} trong "${srcIn}"`);
    let v = parseFloat(num.replace(',', '.'));
    if (peek() === '!') { pos++; v = fact(v); }
    return v;
  }
  const v = parseExpr();
  if (pos !== src.length) throw new Error(`còn thừa ký tự tại ${pos} trong "${srcIn}"`);
  return v;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Đối chiếu 1 câu: show tính ra đáp án / thay đáp án vào phương trình thì đúng */
function verifyShow(showRaw: string, answer: string): string | null {
  const show = showRaw.replace(/\s*=\s*\?\s*$/, '');
  const ans = Number(answer);
  try {
    if (show.includes('?')) {
      if (show.includes('=')) {
        const [l, r] = show.split('=').map((s) => evaluate(s.replaceAll('?', `(${answer})`)));
        return close(l, r) ? null : `phương trình không cân bằng khi thay đáp án: ${showRaw} (${l} ≠ ${r})`;
      }
      // dãy số: "a, b, c, ?" phải là cấp số cộng và đáp án là số hạng tiếp theo
      const parts = show.split(',').map((s) => s.trim());
      if (parts[parts.length - 1] !== '?' || parts.length < 4) return `dạng "?" lạ: ${showRaw}`;
      const nums = parts.slice(0, -1).map(Number);
      const d = nums[1] - nums[0];
      for (let i = 2; i < nums.length; i++) if (nums[i] - nums[i - 1] !== d) return `dãy không đều: ${showRaw}`;
      return nums[nums.length - 1] + d === ans ? null : `số tiếp theo của dãy phải là ${nums[nums.length - 1] + d}, bộ sinh nói ${answer}: ${showRaw}`;
    }
    const v = evaluate(show);
    return close(v, ans) ? null : `biểu thức tính ra ${v} nhưng đáp án là ${answer}: ${showRaw}`;
  } catch (e) {
    return `máy tính độc lập lỗi: ${(e as Error).message}`;
  }
}

// ---------- chạy kiểm chứng ----------
const SAMPLES = 600;
let checked = 0;
const fails: string[] = [];

if (JSON.stringify(MATH_GRADES) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
  fails.push(`MATH_GRADES phải đủ lớp 1-12, đang có: ${MATH_GRADES.join(',')}`);
}
if (GEO_COUNT < 10) fails.push(`phải có ít nhất 10 bộ sinh hình học, đang có ${GEO_COUNT}`);

const seenCats = new Set<string>();
function checkOne(q: ReturnType<typeof makeMath>, origin: string) {
  checked++;
  seenCats.add(q.category);
  if (!/^\d+$/.test(q.answer)) fails.push(`${origin}: đáp án không phải số nguyên không âm: "${q.answer}" (${q.math?.show})`);
  if (!q.clue.trim() || !q.category.trim() || !q.math?.say.trim()) fails.push(`${origin}: thiếu clue/category/say: ${q.id}`);
  const err = q.math ? verifyShow(q.math.show, q.answer) : 'thiếu math';
  if (err) fails.push(`${origin}: ${err} [câu: ${q.clue}]`);
}

for (const grade of MATH_GRADES) {
  for (let i = 0; i < SAMPLES; i++) checkOne(makeMath(grade), `lớp ${grade}`);
}
for (let i = 0; i < SAMPLES; i++) checkOne(makeGeometry(), 'hình học');

if (!seenCats.has('Hình học')) fails.push('chưa thấy câu nào thuộc category Hình học');

if (fails.length) {
  console.error(`MATH CHECK FAIL — ${fails.length} lỗi / ${checked} câu:`);
  for (const f of fails.slice(0, 20)) console.error(' -', f);
  process.exit(1);
}
console.log(`MATH CHECK PASS — ${checked} câu (12 lớp × ${SAMPLES} + hình học ${SAMPLES}), mọi đáp án đều tính lại độc lập từ phần hiện trên bảng.`);
console.log(`Category đã gặp: ${[...seenCats].sort().join(' · ')}`);
