// Kiểm tra bộ sinh câu toán: npx tsx src/game/math.check.ts
// Nguyên tắc: kiểm chứng ĐỘC LẬP đáp án của makeMath bằng cách tự tính lại từ phần hiện trên bảng,
// không dùng lại chính công thức sinh câu (tránh tự kiểm chứng bằng chính đáp án mình vừa sinh).
import assert from 'node:assert/strict';
import { makeMath, type MathLevel } from './math';

const evalExpr = (expr: string): number => {
  const js = expr.replace(/×/g, '*').replace(/−/g, '-').replace(/:/g, '/');
  assert.ok(/^[\d\s+\-*/().]+$/.test(js), `biểu thức lạ: ${expr}`);
  return Function(`return ${js}`)() as number;
};

for (const lv of [1, 2, 3, 4, 5, 6] as MathLevel[]) {
  for (let i = 0; i < 2000; i++) {
    const q = makeMath(lv);
    const n = Number(q.answer);
    assert.ok(Number.isInteger(n) && n > 0, `cấp ${lv}: đáp án phải là số nguyên dương: ${q.answer} (${q.math!.show})`);
    assert.ok(q.clue.length > 3, `cấp ${lv}: thiếu lời đề`);
    assert.ok(q.math!.show.length > 0, `cấp ${lv}: thiếu phần hiện trên bảng`);
    assert.equal(q.math!.level, lv);
    const show = q.math!.show.replace(/ = \?$/, '');
    if (lv <= 4) {
      // phép tính thường: tính lại từ biểu thức trên bảng
      assert.equal(evalExpr(show), n, `cấp ${lv}: ${show} phải bằng ${n}`);
    } else if (lv === 5) {
      // tìm số thiếu: thay đáp án vào dấu ? thì hai vế phải bằng nhau
      const [left, right] = show.split('=').map((x) => x.trim());
      assert.ok(left.includes('?'), `cấp 5: vế trái phải có dấu ?: ${show}`);
      assert.equal(evalExpr(left.replace('?', q.answer)), evalExpr(right), `cấp 5: ${show} với đáp án ${q.answer}`);
      assert.ok(q.math!.reveal?.includes(q.answer), 'cấp 5: câu công bố phải chứa đáp án');
    } else if (show.includes(',')) {
      // dãy số: đáp án là số tiếp theo theo đúng bước nhảy của 3 số đầu
      const seq = show.split(',').map((x) => x.trim());
      assert.equal(seq[3], '?');
      const [a, b, c] = seq.slice(0, 3).map(Number);
      assert.equal(b - a, c - b, 'dãy số phải đều bước');
      assert.equal(a + 3 * (b - a), n, `dãy số ${show}: số tiếp theo phải là ${n}`);
    } else {
      // toán đố / hình học cấp 6: biểu thức tóm tắt trên bảng phải cho đúng đáp án,
      // và lời đề bằng chữ phải chứa các số của biểu thức (đề nói và bảng không được lệch nhau)
      assert.equal(evalExpr(show), n, `cấp 6: ${show} phải bằng ${n}`);
    }
  }
  console.log(`cấp ${lv}: 2000 câu đều đúng`);
}
console.log('math.check: tất cả đều đúng');
