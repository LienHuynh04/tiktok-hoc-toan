// Kiểm tra lõi Auto Tarot Live: npx tsx src/game/tarot.check.ts
import assert from 'node:assert/strict';
import { TarotRoom, type ChatIn } from './tarot';
import { CARDS, TOPICS, TOPIC_LINES, detectTopic, readingText, countWords, DISCLAIMER, type TopicKey } from './cards';
import { GAME } from './config';
import { WISHES, matchWish } from './wishes';
import { plain } from '../live/chatter';

// rand xác định để test lặp lại được
const seq = [0.13, 0.57, 0.91, 0.33, 0.71, 0.05, 0.49, 0.83, 0.27, 0.62];
let si = 0;
const rand = () => seq[si++ % seq.length];

const t0 = 1_000_000;
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (c: TarotRoom, i: number, comment: string, now: number) => c.chat({ ...who(i), comment, createTime: now } as ChatIn, now);

// ---------- dữ liệu: 22 lá x 6 chủ đề, lời giải 35–55 từ ----------
assert.equal(CARDS.length, 22, 'đủ 22 lá Ẩn Chính');
assert.equal(Object.keys(TOPICS).length, 6, 'đúng 6 chủ đề theo thiết kế');
for (const c of CARDS) {
  const byTopic = TOPIC_LINES[c.id];
  assert.ok(byTopic, `${c.id}: có bảng lời giải theo chủ đề`);
  for (const k of Object.keys(TOPICS) as TopicKey[]) {
    assert.ok(byTopic[k]?.length > 40, `${c.id}/${k}: có lời giải theo chủ đề đủ dài`);
    assert.ok(!/[—–]/.test(byTopic[k]), `${c.id}/${k}: không dùng gạch ngang dài`);
  }
  for (const k of Object.keys(TOPICS) as TopicKey[]) {
    for (const rev of [false, true]) {
      for (const v of [0, 1]) {
        const words = countWords(readingText(c, rev, k, 'Minh Anh', v).join(' '));
        assert.ok(words >= 35 && words <= 55, `${c.id}/${k}/rev=${rev}/v=${v}: lời giải ${words} từ, ngoài khoảng 35–55`);
      }
    }
  }
}
assert.equal(GAME.pickSec, 5, 'mỗi người có 5 giây chọn lá');
assert.equal(GAME.revealSec, 15, 'mỗi lượt xem bài hiện 15 giây trên sân khấu');

// ---------- ý muốn của người xem: khớp quà đúng ý muốn ----------
assert.equal(matchWish('Rose', 1), 'greet', 'hoa hồng 1 xu = gửi lời chào');
assert.equal(matchWish('Hoa hồng', 1), 'greet', 'tên quà tiếng Việt cũng khớp');
assert.equal(matchWish('Rose', 10), 'star', 'hoa hồng 10 xu (combo) = lên Bảng Sao Đêm');
assert.equal(matchWish('Finger Heart', 5), 'heart', 'finger heart = cử chỉ thả tim');
assert.equal(matchWish('Cử chỉ thả tim', 5), 'heart', 'tên tiếng Việt của thả tim cũng khớp');
assert.equal(matchWish('Four-leaf clover', 10), 'luck', 'cỏ bốn lá = mưa sao may mắn');
assert.equal(matchWish('Cỏ bốn lá', 10), 'luck', 'tên tiếng Việt của cỏ bốn lá cũng khớp');
assert.equal(matchWish('Mũ kỳ diệu', 99), null, 'quà lạ không khớp ý muốn nào');
assert.equal(WISHES.length, 4, 'đủ 4 ý muốn');
assert.equal(GAME.topicSec, 30, 'chọn chủ đề trong 30 giây');

// ---------- nhận diện chủ đề ----------
assert.equal(detectTopic(plain('người cũ')), 'ex', 'người cũ phải ra chủ đề Người cũ, không nhầm Tình yêu');
assert.equal(detectTopic(plain('thông điệp vũ trụ')), 'universe');
assert.equal(detectTopic(plain('TAROT tình yêu')), 'love');
assert.equal(detectTopic(plain('tương lai')), 'future');
assert.equal(detectTopic(plain('hôm nay trời đẹp quá')), null, 'chat thường không có chủ đề');

// ---------- BƯỚC 1+2+3: gõ thẳng chủ đề -> chọn lá -> đọc đúng chủ đề ----------
{
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  chat(c, 1, 'tình yêu', t0);
  let v = c.view(t0);
  assert.equal(v.current?.nickname, 'Bạn 1', 'người đầu tiên được gọi lên ngay');
  assert.equal(v.current?.state, 'WAITING_CARD');
  assert.equal(v.current?.topic, 'Tình yêu');
  assert.equal(v.current?.cards.length, 3, 'bày đúng 3 lá úp');
  assert.ok(v.current!.cards.every((k) => !k.faceUp), 'cả 3 lá đang úp');
  const lines = chat(c, 1, '2', t0 + 1000);
  v = c.view(t0 + 1000);
  assert.equal(v.current?.state, 'READING', 'chọn lá xong chuyển READING');
  assert.equal(v.current?.picked, 1);
  assert.ok(v.current!.cards[1].faceUp, 'đúng lá số 2 được lật');
  const spoken = lines.map((l) => l.text).join(' ');
  assert.ok(spoken.includes('tình yêu'), 'lời đọc nhắc đúng chủ đề của người chơi');
  assert.ok(v.displayLines.length >= 4, 'lời giải hiện lên sân khấu');
  c.tick(t0 + 1000 + GAME.revealSec * 1000 + 1);
  v = c.view(t0 + 1000 + GAME.revealSec * 1000 + 1);
  assert.equal(v.lastDone?.nickname, 'Bạn 1', 'đọc xong ghi nhận COMPLETED qua lastDone');
  assert.equal(v.readings, 1);
}

// ---------- BƯỚC 1 hai nấc: gõ TAROT trước -> WAITING_TOPIC -> gõ chủ đề ----------
{
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  chat(c, 2, 'TAROT', t0);
  let v = c.view(t0);
  assert.equal(v.sessions.find((s) => s.nickname === 'Bạn 2')?.state, 'WAITING_TOPIC', 'chưa có chủ đề thì ở WAITING_TOPIC');
  assert.equal(v.choosing.length, 1, 'sân khấu thấy được người đang chọn chủ đề');
  chat(c, 2, 'công việc', t0 + 5000);
  v = c.view(t0 + 5000);
  assert.equal(v.current?.topic, 'Công việc', 'chọn xong chủ đề thì vào lượt với đúng chủ đề đó');
  assert.equal(v.current?.state, 'WAITING_CARD');
  // hết 30 giây không chọn chủ đề -> phiên tự huỷ
  const c2 = new TarotRoom(t0, rand);
  c2.newSession(t0);
  chat(c2, 3, 'xem bài', t0);
  assert.equal(c2.view(t0).sessions.length, 1);
  c2.tick(t0 + GAME.topicSec * 1000 + 1);
  assert.equal(c2.view(t0 + GAME.topicSec * 1000 + 1).sessions.length, 0, 'quá hạn chọn chủ đề thì phiên tự huỷ');
}

// ---------- không nhầm phiên giữa 2 người ----------
{
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  chat(c, 1, 'tài chính', t0); // Bạn 1 đang chọn lá
  chat(c, 2, 'người cũ', t0 + 1000); // Bạn 2 vào hàng chờ với chủ đề khác
  chat(c, 2, '1', t0 + 2000); // Bạn 2 gõ số: KHÔNG được tính là lượt chọn của Bạn 1
  let v = c.view(t0 + 2000);
  assert.equal(v.current?.nickname, 'Bạn 1');
  assert.equal(v.current?.picked, -1, 'số của người khác không làm lật bài của người đang xem');
  assert.equal(v.queue[0]?.topic, 'Người cũ', 'chủ đề của Bạn 2 giữ nguyên, không nhầm sang Tài chính');
  chat(c, 1, '3', t0 + 3000);
  v = c.view(t0 + 3000);
  assert.equal(v.current?.state, 'READING');
  assert.ok(v.displayLines.join(' ').includes('tài chính'), 'đọc đúng chủ đề Tài chính của Bạn 1');
  c.tick(t0 + 3000 + GAME.revealSec * 1000 + 1); // Bạn 1 xong -> tự chuyển Bạn 2
  v = c.view(t0 + 3000 + GAME.revealSec * 1000 + 1);
  assert.equal(v.current?.nickname, 'Bạn 2', 'tự động chuyển người tiếp theo');
  assert.equal(v.current?.topic, 'Người cũ');
}

// ---------- timeout chọn lá: tự chọn lá giữa ----------
{
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  chat(c, 1, 'tương lai', t0);
  c.tick(t0 + GAME.pickSec * 1000 + 1);
  const v = c.view(t0 + GAME.pickSec * 1000 + 1);
  assert.equal(v.current?.state, 'READING');
  assert.equal(v.current?.picked, 1, 'hết giờ tự chọn lá giữa');
  assert.equal(v.current?.auto, true);
}

// ---------- xem lại sau khi xem xong: phòng trống xem ngay, phòng có người xếp hàng như thường ----------
{
  const serve = (c: TarotRoom, i: number, topic: string, at: number) => {
    chat(c, i, topic, at);
    chat(c, i, '1', at + 1000);
    c.tick(at + 1000 + GAME.revealSec * 1000 + 1);
    return at + 1000 + GAME.revealSec * 1000 + 2;
  };
  // phòng trống: vừa xem xong, gõ lại chủ đề là được gọi lên ngay, không câu nhắc nhường nào
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  let now = serve(c, 1, 'tình yêu', t0);
  const again = chat(c, 1, 'công việc', now);
  assert.ok(!again.some((l) => l.text.includes('nhường')), 'không còn câu nhắc nhường lượt');
  assert.equal(c.view(now).current?.nickname, 'Bạn 1', 'phòng trống: xem lại là được gọi lên ngay');
  // phòng có người: bạn 2 đang được xem, bạn 1 vào lại thì xếp hàng chờ sau như người mới
  const c2 = new TarotRoom(t0, rand);
  c2.newSession(t0);
  now = serve(c2, 1, 'tình yêu', t0);
  chat(c2, 2, 'công việc', now); // bạn 2 được gọi lên (phòng vừa trống)
  chat(c2, 1, 'tài chính', now + 10); // bạn 1 quay lại xin xem tiếp
  const v2 = c2.view(now + 10);
  assert.equal(v2.current?.nickname, 'Bạn 2', 'người đang được xem vẫn là bạn 2');
  assert.ok(v2.queue.some((q) => q.nickname === 'Bạn 1'), 'phòng có người: bạn 1 xếp hàng chờ tới lượt như bình thường');
}

// ---------- chat thường không bị kéo vào phiên ----------
{
  const c = new TarotRoom(t0, rand);
  c.newSession(t0);
  chat(c, 9, 'tôi yêu kênh này quá trời luôn nè mọi người ơi', t0);
  assert.equal(c.view(t0).sessions.length, 0, 'câu chat dài có chữ yêu không tự tạo phiên');
}

assert.ok(!/[—–]/.test(DISCLAIMER));
console.log('AUTO TAROT CHECK: PASS');
