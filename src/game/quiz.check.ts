// Kiểm tra lõi game Lớp Toán: npx tsx src/game/quiz.check.ts
// Câu hỏi do math.ts tự sinh (bank rỗng); kiểm chứng độc lập của đáp án nằm ở math.check.ts.
import assert from 'node:assert/strict';
import { Classroom, LineBag, compactVi, dayPeriod, plain, scramble, topicName } from './quiz';
import type { Question } from './questions';
import { GAME } from './config';
import { makeMath } from './math';
import { LINES, PICK_TOPICS, POLLS } from './loi-thoai';

const mk = (answer: string, d: Question['difficulty'] = 'easy', id = answer): Question => ({ id, answer, clue: 'gợi ý', kind: 'Đây là thử.', category: 'x', difficulty: d });
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (c: Classroom, i: number, comment: string, createTime: number, now: number) => c.chat({ ...who(i), comment, createTime }, now);
/** 1 đáp án số SAI nhưng dài đúng bằng đáp án thật (để bị tính là 1 lượt trả lời sai) */
const wrongSameLen = (answer: string) => {
  const n = Number(answer) + 1;
  if (String(n).length === answer.length && String(n) !== answer) return String(n);
  const nine = '9'.repeat(answer.length);
  return nine !== answer ? nine : '8'.repeat(answer.length);
};
let t = 1_000_000;

// ---------- tiện ích chữ (vẫn dùng cho tên / bình luận thường) ----------
assert.equal(compactVi('  Bảng   Đen! '), 'bảngđen');
assert.equal(plain('Vào Lớp'), 'vaolop');
assert.equal(compactVi('Bảng đen'.normalize('NFD')), 'bảngđen');
assert.equal(compactVi('hóa học'), compactVi('hoá học'));
assert.equal(compactVi('thủy tinh'), compactVi('thuỷ tinh'));
assert.notEqual(compactVi('hoàng'), compactVi('hoang'));
const s = scramble('BẢNG ĐEN', () => 0.3);
assert.deepEqual([...s].sort(), [...'BẢNGĐEN'].sort());
assert.notEqual(s.join(''), 'BẢNGĐEN');

// ---------- lời thoại: đủ nhiều, không trùng, bốc hết xấp mới lặp ----------
for (const [key, list] of Object.entries(LINES)) {
  assert.ok(list.length >= 2, `${key}: ít nhất 2 câu`);
  const texts = (list as unknown[]).map((l) => (typeof l === 'function' ? (l as (...a: string[]) => string)('A', 'B') : l));
  assert.equal(new Set(texts).size, texts.length, `${key}: có câu trùng`);
  for (const x of texts as string[]) assert.ok(!/[—–]/.test(x), `${key}: có gạch ngang: ${x}`);
}
assert.ok(PICK_TOPICS.length >= 20);
assert.ok(GAME.mathTopics.length >= 4, 'đủ dạng toán để bình chọn');
assert.equal(new Set(GAME.mathTopics.map((x) => x.label)).size, GAME.mathTopics.length, 'nhãn dạng toán không trùng');
const bag = new LineBag(() => 0.42);
const seen = new Set<number>();
for (let i = 0; i < 10; i++) seen.add(bag.pick('k', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
assert.equal(seen.size, 10, 'đọc hết 10 câu mới được lặp');
let prev = -1;
for (let i = 0; i < 200; i++) {
  const x = bag.pick('k2', [0, 1, 2, 3]);
  assert.notEqual(x, prev, 'không lặp ngay câu vừa đọc');
  prev = x;
}

// ---------- 1 câu toán, 1000 người, tới lệch thứ tự ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  const asked = c.tick((t += GAME.introSec * 1000));
  assert.equal(c.phase, 'question');
  assert.ok(c.q?.math, 'câu hỏi phải là câu toán tự sinh');
  assert.ok(asked.some((l) => l.main && l.text.includes('Câu 1.')), 'câu hỏi là câu chính, được đọc trước');
  const answer = c.q!.answer;
  assert.match(answer, /^\d+$/);
  assert.deepEqual(c.slots(), Array(answer.length).fill(null), 'ô đáp án: mỗi chữ số 1 ô, chưa mở ô nào');
  chat(c, 9999, 'khó quá', t, t); // nói chuyện thường không bị tính sai
  chat(c, 9999, answer, t + 9000, t);
  assert.equal(c.correct.length, 1);
  chat(c, 5000, wrongSameLen(answer), t, t); // sai trước thì không được trả lời lại
  chat(c, 5000, answer, t, t);
  assert.ok(!c.correct.some((a) => a.username === 'u5000'));
  chat(c, 5001, `${answer}0`, t, t); // số dài hơn đáp án: không tính là trả lời, vẫn được trả lời lại
  assert.ok(!c.correct.some((a) => a.username === 'u5001'));
  chat(c, 5001, answer, t + 9500, t); // createTime trễ nhất để không giành hạng nhất của phần flood bên dưới
  assert.ok(c.correct.some((a) => a.username === 'u5001'), 'gõ thừa số 0 không bị khoá lượt trả lời');
  for (let i = 0; i < 1000; i++) chat(c, i, i < 300 ? answer : 'xin chào cô', t + 5000 - i, t + 10);
  assert.equal(c.correct.length, 302);
  assert.equal(c.correct[0].username, 'u299', 'createTime sớm nhất đứng đầu');
  assert.deepEqual(c.correct.slice(0, 4).map((a) => a.points), [10, 7, 5, 3]);
  assert.equal(c.correct[10].points, 1);
  c.tick((t += GAME.questionSec * 1000 + 50));
  // chưa ai đúng thì vào bonus trước; ở đây đã có người đúng nên reveal luôn (hoặc qua bonus nếu nhịp tick rơi đúng)
  for (let k = 0; k < 5 && (c.phase as string) !== 'reveal'; k++) c.tick((t = c.phaseEndsAt));
  assert.equal(c.phase, 'reveal');
  assert.equal(c.students.get('u299')!.score, 10);
  assert.equal(c.students.get('u299')!.session, 10);
  assert.equal(c.seats()[0].username, 'u299');
  assert.equal(c.weekDelta.get('u299')!.points, 10);
  assert.equal(c.slots(true).join(''), answer);
  // chạy hết tiết -> tổng kết -> ra chơi -> bình chọn dạng toán -> tiết mới xoá điểm tiết, giữ điểm buổi
  for (let k = 0; k < 300 && c.phase !== 'results'; k++) c.tick((t = c.phaseEndsAt));
  assert.equal(c.phase, 'results');
  c.tick((t += GAME.resultsSec * 1000));
  assert.equal(c.phase, 'recess');
  for (let k = 0; k < 10 && c.phase !== 'vote'; k++) c.tick((t += 40_000));
  assert.equal(c.phase, 'vote', 'hết giờ ra chơi là bình chọn dạng toán tiết sau');
  c.tick((t = c.phaseEndsAt));
  assert.equal(c.phase, 'intro');
  assert.equal(c.students.get('u299')!.score, 0);
  assert.ok(c.students.get('u299')!.session >= 10);
}

// ---------- nhịp giọng: dừng giờ lúc cô đọc, chỉ nói thêm lúc chờ trả lời ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  assert.ok(!c.chatterWindow(t), 'đang giới thiệu tiết: không chào');
  c.tick((t += GAME.introSec * 1000));
  const end = c.phaseEndsAt;
  c.hold(4000);
  assert.equal(c.phaseEndsAt, end + 4000, 'đọc đề xong mới đếm giờ');
  assert.ok(c.chatterWindow(t + 4000), 'đang chờ trả lời: được chào');
  assert.ok(!c.chatterWindow(c.phaseEndsAt - GAME.chatterMinLeftMs + 1), 'sắp hết giờ: không chào');
  c.hold(GAME.maxHoldMs * 3);
  assert.equal(c.phaseEndsAt, end + GAME.maxHoldMs, 'dừng giờ có trần');
  chat(c, 1, c.q!.answer, t + 4000, t + 4000);
  const reveal = c.tick((t = c.phaseEndsAt));
  for (let k = 0; k < 5 && c.phase !== 'reveal'; k++) reveal.push(...c.tick((t = c.phaseEndsAt)));
  assert.equal(c.phase, 'reveal');
  assert.ok(reveal.every((l) => l.main), 'lúc hiện đáp án: toàn câu chính, đọc theo chương trình');
  assert.ok(!c.chatterWindow(t), 'đang hiện đáp án: không chào');
}

// ---------- không ai đúng: thêm giờ (bonus), KHÔNG mở số; quà to cũng chỉ thêm giờ, mỗi câu 1 lần ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  c.tick((t += GAME.questionSec * 1000));
  assert.equal(c.phase, 'bonus');
  assert.equal(c.revealed.size, 0, 'câu toán không mở số (mở là lộ đáp án)');
  c.tick((t += GAME.bonusSec * 1000));
  assert.equal(c.phase, 'reveal');
  const g = new Classroom([], t);
  g.newRound(t);
  g.tick((t += GAME.introSec * 1000));
  const end0 = g.phaseEndsAt;
  for (let i = 0; i < 20; i++) g.gift(who(1), GAME.hintGiftCoins, t);
  assert.equal(g.phaseEndsAt, end0 + GAME.bonusSec * 1000, '20 quà to cũng chỉ +10 giây 1 lần mỗi câu');
  assert.equal(g.revealed.size, 0);
  assert.equal(g.flowers, 20);
}

// ---------- tiết thật: 20 câu đều là toán, đúng roundPlan; câu 20 nhân đôi; chuỗi 3 câu ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const plan: string[] = [];
  for (let k = 0; k < GAME.questionsPerRound; k++) {
    assert.equal(c.phase, 'question');
    const q = c.q!;
    assert.ok(q.math, `câu ${k + 1} phải là câu toán`);
    plan.push(GAME.roundPlan[k]);
    assert.match(q.answer, /^\d+$/, 'câu toán: đáp án là số');
    assert.equal(c.tiles.length, 0, 'câu toán không xáo chữ');
    assert.ok(c.view(t).math.length > 0, 'bảng phải hiện phép tính / đề');
    if (k === GAME.questionsPerRound - 1) assert.ok(c.golden, 'câu 20 là câu hỏi vàng');
    else assert.ok(!c.golden);
    chat(c, 1, q.answer, t, t);
    if (k === GAME.questionsPerRound - 1) assert.equal(c.correct[0].points, 20);
    for (let j = 0; j < 6 && (c.phase as string) !== 'reveal'; j++) c.tick((t = c.phaseEndsAt));
    assert.equal(c.phase, 'reveal', `câu ${k + 1}: phải qua pha hiện đáp án`);
    c.tick((t = c.phaseEndsAt)); // reveal -> praise / câu tiếp / results
    if ((k + 1) % GAME.praiseEvery === 0 && k + 1 < GAME.questionsPerRound) {
      assert.equal(c.phase, 'praise', `dừng điểm danh sau câu ${k + 1}`);
      assert.equal(c.view(t).praiseTop[0].username, 'u1');
      c.tick((t += GAME.praiseSec * 1000));
    }
  }
  assert.ok(c.students.get('u1')!.desk.length >= 3, 'quà điểm danh đặt lên bàn');
  assert.ok(c.students.get('u1')!.desk.length <= GAME.deskGifts);
  assert.deepEqual(plan, [...GAME.roundPlan]);
  assert.ok(GAME.roundPlan.every((d) => d.startsWith('math')), 'roundPlan của Lớp Toán: 100% câu toán');
  // 19 câu x 10 + câu vàng 20 + 6 lần chuỗi (câu 3, 6, ..., 18) x 5
  assert.equal(c.students.get('u1')!.score, 19 * 10 + 20 + 6 * GAME.streakBonus);
  assert.equal(c.phase, 'results');
  assert.equal(c.usedLog.length, 0, 'câu toán tự sinh không ghi vào sổ lớp');
}

// ---------- sinh câu toán: mọi cấp đều cho đáp án số nguyên dương ----------
for (const lv of [1, 2, 3, 4, 5, 6] as const) {
  for (let i = 0; i < 200; i++) {
    const q = makeMath(lv);
    assert.ok(Number.isInteger(Number(q.answer)) && Number(q.answer) > 0, q.math!.show);
    assert.equal(q.math!.level, lv);
  }
}

// ---------- đọc đề xong cô hô bắt đầu; còn 5 giây cô nhắc, đồng hồ không dừng ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  const start = c.tick((t += GAME.introSec * 1000));
  assert.equal(c.phase, 'question');
  assert.ok(LINES.go.includes(start[start.length - 1].text.slice(3)), 'câu cuối lúc ra đề là hô bắt đầu');
  assert.ok(start[start.length - 1].go);
  assert.ok(start.every((l) => l.main));
  c.hold(3000);
  c.tick(t);
  assert.equal(c.view(t).boardShown, false, 'đang đọc đề: chưa hiện phép tính');
  c.showBoard();
  assert.equal(c.view(t).boardShown, true);
  assert.ok(!c.tick((t = c.phaseEndsAt - GAME.warnLeftSec * 1000 - 500)).some((l) => l.warn));
  const warn = c.tick((t += 600));
  assert.equal(warn.filter((l) => l.warn).length, 1);
  assert.ok(!warn.some((l) => l.warn && l.main), 'nhắc giờ không dừng đồng hồ');
  assert.ok(!c.tick((t += 200)).some((l) => l.warn), 'chỉ nhắc 1 lần');
}

// ---------- giờ ra chơi ----------
const recessOf = (game: 'rps' | 'callup' | 'pick' | 'roll' | 'heart', seed = 0.1) => {
  const c = new Classroom([], t, () => seed);
  c.newRound(t);
  for (let i = 0; i < 5; i++) chat(c, i, 'chào cô', t, t);
  c.forceRecess(game, t);
  return c;
};
{
  const c = recessOf('rps', 0.1);
  chat(c, 1, 'bao', t, t);
  chat(c, 2, 'Kéo', t, t);
  chat(c, 1, 'kéo', t, t);
  c.tick((t += GAME.recessPlaySec.rps * 1000));
  assert.equal(c.view(t).recess!.teacher, 'búa');
  assert.equal(c.students.get('u1')!.session, GAME.rpsPoints);
  assert.equal(c.students.get('u1')!.score, 0);
  assert.equal(c.students.get('u2')!.session, 0);
  c.tick((t += GAME.recessResultSec * 1000));
  assert.equal(c.recess!.stage, 'board');
  c.tick((t += GAME.recessBoardSec * 1000));
  assert.equal(c.phase, 'vote', 'sau bảng lớp trưởng là bình chọn dạng toán');
}
{
  // kiểm tra miệng bằng câu toán: chỉ bạn được gọi mới được trả lời, đúng +5, chốt ngay
  const c = recessOf('callup');
  assert.equal(c.recess!.game, 'callup');
  assert.ok(c.recess!.callQ?.math, 'kiểm tra miệng của Lớp Toán phải là câu toán');
  assert.ok(c.view(t).recess!.callMath.length > 0, 'bảng hiện phép tính kiểm tra miệng');
  const target = c.recess!.callTarget!;
  const answer = c.recess!.callQ!.answer;
  const other = [...c.students.values()].find((u) => u.username !== target.username)!;
  c.chat({ ...other, comment: answer, createTime: t }, t);
  assert.equal(c.recess!.callResult, '');
  c.chat({ ...target, comment: answer, createTime: t }, t);
  assert.equal(c.recess!.callResult, 'right');
  c.tick(t);
  assert.equal(c.students.get(target.username)!.session, GAME.callUpPoints);
}
{
  const c = recessOf('pick');
  chat(c, 1, '1', t, t);
  chat(c, 2, '2', t, t);
  chat(c, 3, '1', t, t);
  chat(c, 1, '2', t, t);
  assert.deepEqual(c.view(t).recess!.votes, [2, 1]);
  const out = c.tick((t += GAME.recessPlaySec.pick * 1000));
  assert.ok(out.some((l) => l.text.includes('67')), 'đọc phần trăm phe thắng');
}
{
  const c = recessOf('roll');
  for (let i = 0; i < 15; i++) chat(c, 100 + i, 'Có mặt!', t + 100 - i, t);
  c.tick((t += GAME.recessPlaySec.roll * 1000));
  assert.equal(c.students.get('u114')!.session, GAME.rollPoints);
  assert.equal(c.students.get('u100')!.session, 0);
}
{
  const c = recessOf('heart');
  c.like(GAME.heartTarget / GAME.heartBoost - 1, t, false);
  c.like(1, t, false);
  assert.equal(c.recess!.hearts, GAME.heartTarget, '60 tim thật x5 = 300');
  c.tick((t += GAME.recessPlaySec.heart * 1000));
  assert.equal(c.students.get('u1')!.session, 1);
}

// ---------- lớp trưởng: đổi người thì cô thông báo; chỉ tính điểm tiết này ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const said: string[] = [];
  const step = () => {
    said.push(...c.tick((t += GAME.questionSec * 1000 + 1)).map((l) => l.text));
    for (let j = 0; j < 5 && (c.phase as string) !== 'question' && (c.phase as string) !== 'praise'; j++) {
      said.push(...c.tick((t = c.phaseEndsAt)).map((l) => l.text));
      if (c.phase === 'praise') c.tick((t += GAME.praiseSec * 1000));
    }
  };
  chat(c, 1, c.q!.answer, t, t);
  step();
  chat(c, 2, c.q!.answer, t, t);
  chat(c, 1, c.q!.answer, t + 1, t);
  step();
  chat(c, 2, c.q!.answer, t, t);
  said.push(...c.tick((t += GAME.questionSec * 1000 + 1)).map((l) => l.text));
  for (let j = 0; j < 5 && c.phase !== 'reveal'; j++) said.push(...c.tick((t = c.phaseEndsAt)).map((l) => l.text));
  assert.equal(c.view(t).seats.find((x) => x.username === 'u2')!.title, 'lop-truong');
  assert.ok(said.some((l) => l.includes('Bạn 2') && /lớp trưởng/i.test(l)), 'cô báo lớp trưởng mới');
}
{
  const c = new Classroom([], t);
  const playRound = (winner: number) => {
    c.newRound(t);
    for (let k = 0; k < 300 && c.phase !== 'results'; k++) {
      if (c.phase === 'question' && c.correct.length === 0) chat(c, winner, c.q!.answer, t, t);
      c.tick((t = c.phaseEndsAt));
    }
  };
  playRound(1);
  assert.equal(c.view(t).seats.find((s) => s.username === 'u1')!.title, 'lop-truong');
  playRound(2);
  assert.equal(c.view(t).seats.find((s) => s.username === 'u2')!.title, 'lop-truong', 'tiết 2: bạn thắng tiết 2 làm lớp trưởng');
  assert.equal(c.view(t).seats.find((s) => s.username === 'u1')!.title, '', 'điểm tiết trước không còn tính');
  c.newRound(t);
  assert.ok(c.view(t).seats.every((s) => s.title === ''), 'đầu tiết: chưa ai là lớp trưởng');
  assert.deepEqual(
    c.view(t).champions.map((x) => [x.round, x.username]),
    [
      [2, 'u2'],
      [1, 'u1'],
    ],
  );
}

// ---------- lớp vắng: tiết gắn nhãn ôn bài, có bạn vào thì hết ôn ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  assert.ok(!c.review);
  t += GAME.emptyRoomMs + 1000;
  const said = c.newRound(t);
  assert.ok(c.review, 'lớp vắng: tiết ôn bài');
  assert.ok(said.some((l) => LINES.reviewIntro.includes(l.text.slice(3))));
  assert.equal(c.usedLog.length, 0, 'câu toán không ghi sổ');
  const qs = (c as unknown as { roundQs: Question[] }).roundQs;
  assert.ok(qs.every((q) => !!q.math), 'tiết ôn bài của Lớp Toán vẫn toàn câu toán mới');
  c.tick((t += GAME.introSec * 1000));
  chat(c, 1, 'cô ơi', t, t);
  for (let k = 0; k < 10 && c.qNo < 2; k++) c.tick((t = c.phaseEndsAt));
  assert.equal(c.qNo, 2);
  assert.ok(!c.review, 'có bạn vào: hết ôn bài');
  assert.ok(c.view(t).review === false);
}

// ---------- intro() cho câu chữ (tiện ích cũ, giữ tương thích) ----------
{
  const c = new Classroom([], t);
  const q = (answer: string, kind: string, slot?: 'anh' | 'su') => ({ ...mk(answer), kind, slot });
  assert.equal(c.intro(q('BẢNG ĐEN', 'Đây là thứ ở trường lớp.')), 'Đây là một từ gồm 7 chữ cái, là thứ ở trường lớp.');
  assert.equal(c.intro(q('NGÔ QUYỀN', 'Câu lịch sử nè.', 'su')), 'Câu lịch sử nè. Đây là một từ gồm 8 chữ cái.');
  assert.equal(c.intro(q('CAT', 'Câu tiếng Anh nè.', 'anh')), 'Câu tiếng Anh nè. Đây là một từ tiếng Anh gồm 3 chữ cái.');
}

// ---------- lấp im lặng: TẮT lúc đang hỏi câu toán (gõ số / 1 chữ dễ lẫn đáp án) ----------
{
  const c = new Classroom([], t);
  t += GAME.engageEveryMs;
  for (let i = 0; i < 5; i++) chat(c, i, 'hi', t, t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  c.showBoard();
  const out = c.tick(t);
  assert.equal(c.love, null, 'đang hỏi toán: không rủ gõ số 1');
  assert.equal(c.poll, null, 'đang hỏi toán: không bình chọn gõ 1 chữ');
  assert.ok(!out.some((l) => LINES.loveCall.includes(l.text.slice(3)) || LINES.funFact.includes(l.text.slice(3))));
}

// ---------- học sinh tương tác: bong bóng chat, tặng hoa đi lên bục, phạt lên bục, ngủ gật ----------
{
  const c = new Classroom([], t, () => 0);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const seat = (u: string) => c.view(t).seats.find((s) => s.username === u)!;
  chat(c, 1, 'cô ơi con đói', t, t);
  assert.equal(seat('u1').bubble, 'cô ơi con đói', 'bình luận thường hiện bong bóng');
  chat(c, 2, 'X'.repeat(c.answerLetters.length), t, t);
  assert.equal(seat('u2').bubble, '', 'câu trả lời không hiện bong bóng (lộ đáp án)');
  c.chat({ ...who(3), comment: 'tục tĩu', createTime: t, safe: false }, t);
  assert.equal(seat('u3').bubble, '', 'bình luận có từ cấm không hiện');
  assert.equal(c.view(t + GAME.bubbleMs).seats.find((s) => s.username === 'u1')!.bubble, '', 'bong bóng tự tắt');
  c.gift(who(1), 1, t);
  c.gift(who(3), 1, t + 500);
  assert.equal(c.view(t).walk!.username, 'u1');
  assert.equal(c.view(t + GAME.walkMs).walk, null);
  const said = c.tick((t = c.phaseEndsAt));
  for (let k = 0; k < 5 && c.phase !== 'reveal'; k++) said.push(...c.tick((t = c.phaseEndsAt)));
  assert.ok(said.some((l) => LINES.roastStand.some((f) => f('Bạn 2') === l.text.slice(3))), 'cô phạt lên bục');
  assert.deepEqual(c.view(t).punished.map((p) => p.username), ['u2']);
  assert.ok(seat('u2').standing);
  assert.equal(c.view(t + GAME.standSec * 1000).punished.length, 0, 'hết giờ phạt thì về chỗ');
  assert.ok(c.view(t + GAME.sleepAfterMs + 1).seats.every((s) => s.sleeping));
}

// ---------- xếp ghế: cùng điểm thì bạn đang tương tác ngồi trước bạn đã im lâu ----------
{
  const c = new Classroom([], t);
  chat(c, 1, 'hi', t, t);
  chat(c, 2, 'hi', t + 1000, t + 1000);
  assert.equal(c.seats()[0].username, 'u1', 'cùng điểm, cùng còn ở: ai vào trước ngồi trước');
  t += GAME.seatActiveMs + 5000;
  chat(c, 2, 'cô ơi', t, t);
  c.tick(t);
  assert.equal(c.seats()[0].username, 'u2', 'bạn im lâu nhường ghế cho bạn đang tương tác');
}

// ---------- chào theo giờ ----------
{
  const at = (h: number) => new Date(2026, 10, 4, h, 30).getTime();
  assert.deepEqual([6, 11, 15, 19, 23, 2].map((h) => dayPeriod(at(h))), ['sang', 'trua', 'chieu', 'toi', 'khuya', 'khuya']);
  const c = new Classroom([], at(7));
  const first = c.newRound(at(7)).map((l) => l.text.slice(3));
  assert.ok(first.some((x) => LINES.timeMorning.includes(x)), 'tiết đầu: chào buổi sáng');
  const night = c.newRound(at(23)).map((l) => l.text.slice(3));
  assert.ok(night.some((x) => LINES.timeNight.includes(x)), 'đổi buổi: chào khuya');
}

// ---------- nút "Bỏ câu này" với câu toán: bỏ qua sang câu tiếp, không điểm, không ghi sổ ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  assert.ok(c.q?.math);
  chat(c, 1, c.q!.answer, t, t);
  const said = c.banCurrent(t);
  assert.ok(said.some((l) => LINES.banned.includes(l.text.slice(3))), 'cô nói bỏ câu');
  assert.equal(c.qNo, 2, 'sang câu tiếp liền');
  assert.equal(c.students.get('u1')!.score, 0, 'câu bị bỏ không tính điểm');
  assert.equal(c.banLog.length, 0, 'câu toán tự sinh không ghi sổ bỏ câu');
}

// ---------- phòng vắng: có người đúng thì 8 giây sau chốt; phòng đông thì đủ giờ ----------
{
  const small = new Classroom([], t);
  small.newRound(t);
  small.tick((t += GAME.introSec * 1000));
  chat(small, 1, small.q!.answer, t, t);
  assert.equal(small.phaseEndsAt, t + GAME.smallRoomEndAfterSec * 1000);
  const big = new Classroom([], t);
  big.newRound(t);
  big.tick((t += GAME.introSec * 1000));
  const end = big.phaseEndsAt;
  for (let i = 10; i < 10 + GAME.smallRoomPlayers; i++) chat(big, i, 'xin chào', t, t);
  chat(big, 1, big.q!.answer, t, t);
  assert.equal(big.phaseEndsAt, end, 'phòng đông: chạy đủ giờ');
}

// ---------- sinh nhật ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  assert.equal(chat(c, 1, 'chúc mừng sinh nhật bạn ấy', t, t).length, 0, 'chúc người khác thì không tính');
  const said = chat(c, 1, 'Hôm nay sinh nhật con cô ơi', t, t);
  assert.equal(said.length, 1);
  assert.ok(said[0].priority && !said[0].main, 'nói chen lúc chờ trả lời, không cắt ngang đề');
  assert.equal(c.students.get('u1')!.desk.at(-1)!.icon, '🎂');
  assert.ok(c.view(t).clapping);
  assert.equal(c.view(t).birthday!.nickname, 'Bạn 1');
  assert.equal(chat(c, 2, 'sinh nhật mình nè', t + 1000, t + 1000).length, 0, 'chưa đủ 1 phút');
  assert.equal(chat(c, 1, 'sinh nhật con mà', t + 120_000, t + 120_000).length, 0, 'mỗi bạn 1 lần');
  assert.equal(chat(c, 2, 'sinh nhật mình nè', t + 120_000, t + 120_000).length, 1);
}

// ---------- chuyên cần ----------
{
  const c = new Classroom([], t);
  assert.equal(c.attendance(who(1), 1, t).length, 0, 'ngày đầu: chưa nói gì');
  assert.equal(c.attendance(who(2), 2, t).length, 1);
  const before = c.students.get('u3')?.desk.length ?? 0;
  const ms = c.attendance(who(3), GAME.attendMilestones[0], t);
  assert.ok(ms[0].priority);
  assert.equal(c.students.get('u3')!.desk.length, before + 1, 'mốc chuyên cần có quà');
  assert.equal(c.view(t).seats.find((s) => s.username === 'u3')!.days, GAME.attendMilestones[0]);
}

// ---------- cả lớp chọn dạng toán tiết sau ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  for (let k = 0; k < 300 && c.phase !== 'vote'; k++) c.tick((t = c.phaseEndsAt));
  assert.equal(c.phase, 'vote');
  const [a, b] = c.view(t).vote!.topics;
  assert.notEqual(a, b);
  assert.ok(GAME.mathTopics.some((x) => x.label === a) && GAME.mathTopics.some((x) => x.label === b), 'chủ đề bình chọn phải là dạng toán');
  chat(c, 1, '2', t, t);
  chat(c, 2, '2', t, t);
  chat(c, 2, '1', t, t);
  chat(c, 3, '1', t, t);
  assert.deepEqual(c.view(t).vote!.counts, [1, 2]);
  c.tick((t = c.phaseEndsAt));
  assert.equal(c.phase, 'intro');
  assert.equal(topicName(c.topic), b);
  const def = GAME.mathTopics.find((x) => x.label === c.topic)!;
  const qs = (c as unknown as { roundQs: Question[] }).roundQs;
  const inTopic = qs.filter((q) => def.levels.includes(q.math?.level ?? 0)).length;
  assert.ok(inTopic >= GAME.voteTopicQuestions, `dạng thắng phải chiếm ít nhất ${GAME.voteTopicQuestions} câu, thực tế ${inTopic}`);
}

// ---------- báo cáo ----------
{
  const c = new Classroom([], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const answer = c.q!.answer;
  for (let i = 0; i < 6; i++) chat(c, i, i < 4 ? answer : wrongSameLen(answer), t, t);
  for (let k = 0; k < 5 && (c.phase as string) !== 'reveal'; k++) c.tick((t = c.phaseEndsAt));
  assert.deepEqual(
    c.reportLog.map((r) => [r.attempts, r.correct]),
    [[6, 4]],
  );
  assert.ok(c.reportLog[0].category.length > 0);
}

console.log('quiz.check: tất cả đều đúng');
