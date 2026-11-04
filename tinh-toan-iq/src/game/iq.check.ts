// Kiểm tra lõi Tính Toán IQ Cao: npx tsx src/game/iq.check.ts
// Nguyên tắc: kiểm chứng ĐỘC LẬP đáp án của makeQuestion bằng cách tự tính lại từ đề (prompt),
// không dùng lại công thức sinh câu; phần engine kiểm tra luật điểm + vòng đời câu hỏi bằng đồng hồ giả.
import assert from 'node:assert/strict';
import { IQGame, makeQuestion, type ChatIn, type GenQ } from './iq';
import { GAME } from './config';

// ---------- máy tính biểu thức độc lập ----------
function evaluate(srcIn: string): number {
  const src = srcIn.replace(/\s+/g, '');
  let pos = 0;
  const peek = () => src[pos];
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
    if (ch === '(') { pos++; const v = parseExpr(); if (peek() === ')') pos++; return v; }
    let num = '';
    while (pos < src.length && /[0-9.]/.test(src[pos])) num += src[pos++];
    if (!num) throw new Error(`không đọc được số trong "${srcIn}"`);
    return parseFloat(num);
  }
  const v = parseExpr();
  if (pos !== src.length) throw new Error(`biểu thức thừa ký tự: "${srcIn}"`);
  return v;
}

const UNSUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const desup = (s: string) => s.split('').map((ch) => UNSUP[ch] ?? ch).join('');

function verifyGen(q: GenQ): string | null {
  const ans = Number(q.answer);
  try {
    switch (q.tag) {
      case 'Tính nhanh':
        return evaluate(q.prompt) === ans ? null : `tính lại khác đáp án: ${q.prompt}`;
      case 'Dãy số': {
        const terms = q.prompt.replace(/, \?$/, '').split(', ').map(Number);
        const diffs = terms.slice(1).map((x, i) => x - terms[i]);
        if (diffs.every((d) => d === diffs[0])) return terms[terms.length - 1] + diffs[0] === ans ? null : 'cấp số cộng sai';
        if (terms.every((x) => x > 0) && terms.slice(1).every((x, i) => x % terms[i] === 0)) {
          const r = terms[1] / terms[0];
          if (terms.slice(1).every((x, i) => x === terms[i] * r)) return terms[terms.length - 1] * r === ans ? null : 'cấp số nhân sai';
        }
        const roots = terms.map((x) => Math.sqrt(x));
        if (roots.every((r) => Number.isInteger(r)) && roots.slice(1).every((r, i) => r === roots[i] + 1)) {
          return (roots[roots.length - 1] + 1) ** 2 === ans ? null : 'dãy bình phương sai';
        }
        if (terms.slice(2).every((x, i) => x === terms[i] + terms[i + 1])) return terms[terms.length - 2] + terms[terms.length - 1] === ans ? null : 'dãy Fibonacci sai';
        if (diffs.length >= 3 && diffs[0] === diffs[2] && diffs[1] !== diffs[0]) return terms[terms.length - 1] + diffs[1] === ans ? null : 'dãy đan xen sai';
        return `không nhận ra quy luật dãy: ${q.prompt}`;
      }
      case 'Tìm số thiếu': {
        const [l, r] = q.prompt.split(' = ');
        return evaluate(l.replace('?', `(${q.answer})`)) === evaluate(r) ? null : `thay đáp án vào không cân bằng: ${q.prompt}`;
      }
      case 'Luỹ thừa': {
        const m = q.prompt.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = \?$/);
        if (!m) return `đề luỹ thừa lạ: ${q.prompt}`;
        return Number(m[1]) ** Number(desup(m[2])) === ans ? null : `luỹ thừa sai: ${q.prompt}`;
      }
      case 'Căn bậc hai': {
        const m = q.prompt.match(/^√(\d+) = \?$/);
        if (!m) return `đề căn lạ: ${q.prompt}`;
        return Math.sqrt(Number(m[1])) === ans ? null : `căn sai: ${q.prompt}`;
      }
      case 'So sánh nhanh': {
        const lines = q.prompt.split('\n');
        const v1 = evaluate(lines[0].replace(/^1\) /, ''));
        const v2 = evaluate(lines[1].replace(/^2\) /, ''));
        if (v1 === v2) return 'hai vế bằng nhau, không so sánh được';
        return (v1 > v2 ? '1' : '2') === q.answer ? null : `so sánh sai: ${q.prompt} (${v1} vs ${v2})`;
      }
      case 'Phần trăm': {
        const m = q.prompt.match(/^(\d+)% của (\d+) = \?$/);
        if (!m) return `đề phần trăm lạ: ${q.prompt}`;
        return (Number(m[2]) * Number(m[1])) / 100 === ans ? null : `phần trăm sai: ${q.prompt}`;
      }
      case 'Phân số': {
        const m = q.prompt.match(/^(\d+)\/(\d+) của (\d+) = \?$/);
        if (!m) return `đề phân số lạ: ${q.prompt}`;
        return (Number(m[3]) / Number(m[2])) * Number(m[1]) === ans ? null : `phân số sai: ${q.prompt}`;
      }
      default:
        return `tag lạ: ${q.tag}`;
    }
  } catch (e) {
    return `máy tính độc lập lỗi ở "${q.prompt}": ${(e as Error).message}`;
  }
}

// rand xác định để test lặp lại được
const seq = [0.13, 0.57, 0.91, 0.33, 0.71, 0.05, 0.49, 0.83, 0.27, 0.62, 0.41, 0.18];
let si = 0;
const rand = () => seq[si++ % seq.length];

// ---------- bộ sinh: 1.200 câu, tính lại độc lập toàn bộ ----------
// (dùng LCG cho vòng quét bộ sinh: rand dãy ngắn ở dưới lặp quá đều, không phủ hết các dạng)
let lseed = 123456789;
const lcg = () => {
  lseed = (lseed * 1103515245 + 12345) % 2147483648;
  return lseed / 2147483648;
};
{
  const tags = new Set<string>();
  for (let i = 0; i < 1200; i++) {
    const q = makeQuestion(lcg);
    tags.add(q.tag);
    assert.ok(/^\d+$/.test(q.answer), `đáp án phải là số nguyên không âm: "${q.answer}" (${q.prompt})`);
    assert.ok(q.prompt.trim() && q.say.trim() && q.explain.trim(), `thiếu prompt/say/explain: ${q.prompt}`);
    const err = verifyGen(q);
    assert.ok(!err, err ?? '');
  }
  assert.ok(tags.size >= 7, `phải có ít nhất 7 dạng câu, đang có: ${[...tags].join(', ')}`);
}

// ---------- engine: luật điểm + vòng đời ----------
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (g: IQGame, i: number, comment: string, now: number) => g.chat({ ...who(i), comment, createTime: now } as ChatIn, now);
const texts = (lines: { text: string }[]) => lines.map((l) => l.text.replace(/^M: /, ''));
let t = 5_000_000;

{
  const g = new IQGame(t, rand);
  const open = g.newSession(t);
  assert.ok(open.length >= 3, 'mở buổi có chào + cách chơi + câu đầu');
  assert.equal(g.phase, 'ask');
  assert.equal(g.round, 1);
  const ans = g.view(t).answer;
  const wrong = String(Number(ans) + 9);

  chat(g, 1, wrong, t); // u1 sai trước
  chat(g, 2, ans, t); // u2 đúng đầu tiên: 100
  chat(g, 1, ans, t); // u1 đúng thứ hai: 70, chuỗi = 1 vì đã sai trước trong cùng câu
  assert.equal(g.phase, 'ask', 'mới 2 bạn đúng, chưa chốt câu');
  chat(g, 2, ans, t); // u2 trả lời lại: bỏ qua
  const lines = chat(g, 3, ans, t); // u3 đúng thứ ba: 50, đủ top 3 thì chốt câu
  assert.equal(g.phase, 'reveal', 'đủ 3 bạn đúng là chốt câu sớm');
  assert.ok(texts(lines).some((x) => x.includes('Đáp án là')), 'có câu công bố đáp án');
  const top = g.view(t).top;
  assert.equal(top.find((x) => x.nickname === 'Bạn 2')?.score, 100);
  assert.equal(top.find((x) => x.nickname === 'Bạn 1')?.score, 70);
  assert.equal(top.find((x) => x.nickname === 'Bạn 3')?.score, 50);
  assert.equal(g.view(t).correct.length, 3);

  // hết pha công bố thì sang câu 2
  g.tick((t += GAME.revealSec * 1000 + 1));
  assert.equal(g.phase, 'ask');
  assert.equal(g.round, 2);
  // không ai trả lời: hết giờ tự công bố
  const nobody = g.tick((t += GAME.questionSec * 1000 + 1));
  assert.equal(g.phase, 'reveal');
  assert.ok(texts(nobody).some((x) => x.includes('chưa bạn nào')), 'có câu động viên khi không ai đúng');

  // chơi nhanh tới hết câu 5: sau công bố câu 5 thì hiện bảng xếp hạng
  for (let r = 3; r <= 5; r++) {
    g.tick((t += GAME.revealSec * 1000 + 1)); // reveal -> ask (câu r)
    assert.equal(g.phase, 'ask');
    assert.equal(g.round, r);
    g.skip(t); // ask -> reveal
    assert.equal(g.phase, 'reveal');
    g.tick((t += GAME.revealSec * 1000 + 1)); // reveal -> (board sau câu 5 | ask)
  }
  assert.equal(g.phase, 'board', 'sau câu 5 thì hiện bảng xếp hạng');
  g.tick((t += GAME.boardSec * 1000 + 1));
  assert.equal(g.phase, 'ask');
  assert.equal(g.round, 6);
}

// ---------- chuỗi đúng liên tiếp: câu 3 được thưởng ----------
{
  const g = new IQGame(t, rand);
  g.newSession(t);
  for (let r = 1; r <= 3; r++) {
    const a = g.view(t).answer;
    chat(g, 1, a, t); // u1 luôn đúng đầu tiên
    g.skip(t); // chốt câu (reveal)
    g.tick((t += GAME.revealSec * 1000 + 1)); // sang câu sau
  }
  const me = g.view(t).top.find((x) => x.nickname === 'Bạn 1');
  assert.equal(me?.score, 100 + 100 + (100 + GAME.streakBonus), 'đúng liên tiếp 3 câu: câu 3 được +30 thưởng chuỗi');
  assert.equal(me?.streak, 3);
  assert.equal(me?.wins, 3);
}

console.log('iq.check: tất cả đều đúng');
