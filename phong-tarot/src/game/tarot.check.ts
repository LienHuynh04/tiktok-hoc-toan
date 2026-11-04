// Kiểm tra lõi Phòng Tarot: npx tsx src/game/tarot.check.ts
import assert from 'node:assert/strict';
import { TarotRoom, type ChatIn } from './tarot';
import { CARDS, TOPICS, DISCLAIMER } from './cards';
import { GAME } from './config';
import { plain } from '../live/chatter';

// rand xác định để test lặp lại được
const seq = [0.13, 0.57, 0.91, 0.33, 0.71, 0.05, 0.49, 0.83, 0.27, 0.62];
let si = 0;
const rand = () => seq[si++ % seq.length];

let t = 1_000_000;
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (c: TarotRoom, i: number, comment: string, now: number): ReturnType<TarotRoom['chat']> =>
  c.chat({ ...who(i), comment, createTime: now } as ChatIn, now);
const texts = (lines: { text: string }[]) => lines.map((l) => l.text.replace(/^F: /, ''));

// ---------- dữ liệu bộ bài: đủ 22 lá, lời giải sạch ----------
assert.equal(CARDS.length, 22, 'đủ 22 lá Ẩn Chính');
assert.equal(new Set(CARDS.map((c) => c.id)).size, 22, 'id lá không trùng');
for (const c of CARDS) {
  assert.ok(c.up.length > 40 && c.rev.length > 40, `${c.id}: lời giải xuôi/ngược phải đủ dài`);
  assert.ok(!/[—–]/.test(c.up + c.rev), `${c.id}: lời giải không dùng gạch ngang dài`);
  assert.ok(c.symbol && c.c1 && c.c2 && c.keywords, `${c.id}: đủ biểu tượng, màu, từ khoá`);
}
for (const [k, topic] of Object.entries(TOPICS)) {
  assert.ok(topic.close.length >= 2, `${k}: ít nhất 2 câu chốt`);
  for (const s of topic.close) assert.ok(!/[—–]/.test(s), `${k}: câu chốt không gạch ngang dài`);
}
assert.ok(!/[—–]/.test(DISCLAIMER));
assert.equal(GAME.pickSec, 5, 'mỗi người chỉ có 5 giây chọn lá');

// ---------- mở buổi, vào hàng chờ, được gọi tên ----------
{
  const c = new TarotRoom(t, rand);
  const hello = c.newSession(t);
  assert.equal(hello.length, 2);
  assert.ok(hello.every((l) => l.main), 'hai câu mở buổi là câu chính');
  assert.equal(c.phase, 'idle');

  const joined = chat(c, 1, 'TAROT tình yêu', t);
  assert.ok(texts(joined).some((x) => x.includes('Bạn 1')), 'có câu ghi tên vào hàng chờ');
  assert.equal(c.phase, 'offer', 'phòng đang trống: vào hàng chờ là được gọi ngay');
  const v = c.view(t);
  assert.equal(v.current?.nickname, 'Bạn 1');
  assert.equal(v.current?.topic, 'Tình yêu');
  assert.equal(v.current?.cards.length, 3);
  assert.ok(v.current!.cards.every((x) => !x.faceUp), '3 lá đều úp khi chờ chọn');
  const ids = v.current!.cards.map((x) => x.name);
  assert.equal(new Set(ids).size, 3, '3 lá rút ra phải khác nhau');

  // người khác gõ số: không tính
  const stray = chat(c, 2, '2', t);
  assert.equal(stray.length, 0);
  assert.equal(c.phase, 'offer');

  // chính chủ gõ lại TAROT: không vào hàng chờ lần 2
  assert.equal(chat(c, 1, 'TAROT công việc', t).length, 0);

  // chính chủ chọn lá 2
  const reveal = chat(c, 1, '2', t);
  assert.equal(c.phase, 'reveal');
  assert.equal(c.readings, 1);
  const pickedName = v.current!.cards[1].name;
  assert.ok(texts(reveal).some((x) => x.includes(pickedName)), 'câu đọc có tên lá đã chọn');
  assert.ok(c.view(t).current!.cards[1].faceUp, 'lá được chọn lật ngửa');
  assert.ok(c.view(t).displayLines.length >= 4, 'lời giải hiện chữ trên sân khấu');
  assert.ok(texts(reveal).some((x) => x.includes('giải trí')), 'lượt đầu có nhắc chỉ mang tính giải trí');

  // hết giờ đọc: về chờ, hàng chờ trống
  c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.phase, 'idle');
  assert.equal(c.view(t).current, null);
}

// ---------- hết giờ chọn: tự chọn lá giữa; hàng chờ nối tiếp; bỏ lượt ----------
{
  const c = new TarotRoom(t, rand);
  c.newSession(t);
  chat(c, 3, 'tarot công việc', t);
  assert.equal(c.phase, 'offer');
  assert.equal(c.view(t).current?.topic, 'Công việc');
  chat(c, 4, 'TAROT tài chính', t); // vào hàng chờ trong lúc người khác đang chọn
  chat(c, 5, 'TAROT', t);
  assert.equal(c.queue.length, 2);

  const auto = c.tick((t += GAME.pickSec * 1000 + 1));
  assert.equal(c.phase, 'reveal');
  assert.equal(c.view(t).current?.picked, 1, 'hết giờ: tự chọn lá giữa');
  assert.equal(c.view(t).current?.auto, true);
  assert.ok(texts(auto).some((x) => x.includes('tự chọn lá ở giữa')), 'có câu báo tự chọn');

  c.tick((t = c.phaseEndsAt + 1)); // đọc xong -> gọi bạn 4
  assert.equal(c.phase, 'offer');
  assert.equal(c.view(t).current?.nickname, 'Bạn 4');
  assert.equal(c.view(t).current?.topic, 'Tài chính');

  const skipped = c.skip(t); // chủ kênh bỏ lượt bạn 4 -> sang bạn 5
  assert.ok(skipped.length >= 1);
  assert.equal(c.view(t).current?.nickname, 'Bạn 5');
  assert.equal(c.view(t).current?.topic, 'Tổng quan');
}

// ---------- giữ giờ khi đang đọc + cửa sổ nói thêm ----------
{
  const c = new TarotRoom(t, rand);
  c.newSession(t);
  chat(c, 9, 'TAROT', t);
  const end0 = c.phaseEndsAt;
  c.hold(3000);
  assert.equal(c.phaseEndsAt, end0 + 3000, 'đang đọc câu chính thì đồng hồ chọn lá đứng lại');
  assert.ok(c.chatterWindow(t), 'đang chờ chọn lá: được nói câu thêm');
  chat(c, 9, '1', t);
  assert.ok(!c.chatterWindow(t), 'đang đọc bài: không chen câu thêm');
}

console.log('tarot.check: tất cả đều đúng');
