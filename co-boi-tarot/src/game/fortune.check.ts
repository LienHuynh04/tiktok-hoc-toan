// Kiểm tra lõi Cô Bói Tarot: npx tsx src/game/fortune.check.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FortuneRoom, formatPoints, DEMO_USERNAME, type ChatIn } from './fortune';
import { DECK } from './cards78';
import { GAME, POSITIONS } from './config';
import { composeReading, detectTheme, extractQuestion, THEMES, type ThemeKey } from './reading';
import { GUEST_POOL, drawGuestChar, guestCharById, parseGenderCommand } from './guests';

// rand xác định để test lặp lại được
const seq = [0.13, 0.57, 0.91, 0.33, 0.71, 0.05, 0.49, 0.83, 0.27, 0.62, 0.18, 0.44];
let si = 0;
const rand = () => seq[si++ % seq.length];

let t = 1_000_000;
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (c: FortuneRoom, i: number, comment: string, now: number) =>
  c.chat({ ...who(i), comment, createTime: now, safe: true } as ChatIn, now);
const texts = (lines: { text: string }[]) => lines.map((l) => l.text.replace(/^F: /, ''));

// ---------- dữ liệu bộ bài: đủ 78 lá, lời giải sạch, file ảnh có thật ----------
assert.equal(DECK.length, 78, 'đủ 78 lá');
assert.equal(new Set(DECK.map((c) => c.id)).size, 78, 'id lá không trùng');
const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
for (const c of DECK) {
  assert.ok(c.up.length > 30 && c.rev.length > 20, `${c.id}: nghĩa xuôi/ngược đủ dài`);
  assert.ok(c.tipUp.length > 10 && c.tipRev.length > 10, `${c.id}: có lời khuyên 2 chiều`);
  assert.ok(!/[—–]/.test(c.up + c.rev + c.tipUp + c.tipRev), `${c.id}: không dùng gạch ngang dài`);
  assert.ok(fs.existsSync(path.join(assetsDir, c.img)), `${c.id}: thiếu file ảnh ${c.img}`);
}
for (const p of ['teller-idle.png', 'teller-deal.png', 'teller-read.png', 'teller-happy.png', 'room-bg.jpg']) {
  assert.ok(fs.existsSync(path.join(assetsDir, 'assets', p)), `thiếu asset ${p}`);
}
assert.equal(GAME.likesPerPoint, 100, '100 tim = 1 điểm');
assert.equal(POSITIONS.length, 3);

// ---------- nhận diện câu hỏi + chủ đề ----------
// Luật của user: câu hỏi lưu/hiện/đọc phải là comment NGUYÊN VĂN người xem gõ, không sửa chữ nào
assert.equal(extractQuestion('Cô ơi, chuyện tình cảm sắp tới của em thế nào?'), 'Cô ơi, chuyện tình cảm sắp tới của em thế nào?', 'câu hỏi thường: giữ nguyên văn');
assert.equal(extractQuestion('HỎI: em có nên đổi việc không cô'), 'HỎI: em có nên đổi việc không cô', 'có tiền tố HỎI:: vẫn giữ nguyên văn cả tiền tố');
assert.equal(extractQuestion('Hỏi: chuyện tình cảm sắp tới của em thế nào?'), 'Hỏi: chuyện tình cảm sắp tới của em thế nào?', 'tiền tố Hỏi: viết thường: giữ nguyên văn');
assert.equal(extractQuestion('  HỎI: em có nên đổi việc không cô  '), 'HỎI: em có nên đổi việc không cô', 'chỉ cắt khoảng trắng hai đầu');
assert.equal(extractQuestion('HỎI:'), null, 'chỉ có tiền tố, không nội dung: không phải câu hỏi');
assert.equal(extractQuestion('Hỏi: à'), null, 'sau tiền tố quá ngắn: không phải câu hỏi');
assert.ok(extractQuestion('cho em hỏi chuyện tiền bạc cuối năm ra sao'));
assert.equal(extractQuestion('live hay quá cô ơi'), null, 'câu khen không phải câu hỏi');
assert.equal(extractQuestion('hay quá'), null);
assert.equal(detectTheme('chuyện tình cảm sắp tới của em thế nào'), 'love');
assert.equal(detectTheme('công việc tháng này có thuận lợi không'), 'work');
assert.equal(detectTheme('tiền bạc cuối năm của em ra sao'), 'money');
assert.equal(detectTheme('em sắp thi đại học, kết quả có tốt không'), 'study');
assert.equal(detectTheme('gia đình em sắp tới có chuyện gì vui không'), 'family');
assert.equal(detectTheme('dạo này em thấy mệt mỏi quá'), 'general');

// ---------- bộ soạn lời giải: mọi chủ đề x mọi lá x 2 chiều đều ra đoạn 6 câu ----------
{
  const lastIdx = new Map<string, number>();
  const pick = (key: string, arr: readonly string[]) => {
    let i = (lastIdx.get(key) ?? -1) + 1;
    if (i >= arr.length) i = 0;
    lastIdx.set(key, i);
    return arr[i];
  };
  const pickFn = (key: string, arr: readonly ((n: string) => string)[], n: string) => pick(key, arr.map((f) => f(n)));
  for (const theme of Object.keys(THEMES) as ThemeKey[]) {
    for (const card of DECK) {
      for (const reversed of [false, true]) {
        const drawn = [
          { card, reversed },
          { card: DECK[(DECK.indexOf(card) + 7) % 78], reversed: !reversed },
          { card: DECK[(DECK.indexOf(card) + 23) % 78], reversed },
        ];
        const s = composeReading({ guestName: 'Bạn Test', theme, drawn }, pickFn, pick);
        assert.equal(s.length, 6, `${theme}/${card.id}: đoạn luận phải có 6 câu`);
        assert.ok(s.join(' ').includes(card.name), `${theme}/${card.id}: đoạn luận có tên lá`);
        assert.ok(s[4].includes(reversed ? drawn[2].card.tipRev : drawn[2].card.tipUp), `${theme}/${card.id}: câu áp chót là lời khuyên của lá 3`);
        assert.ok(!/[—–]/.test(s.join(' ')), `${theme}/${card.id}: đoạn luận không gạch ngang dài`);
      }
    }
  }
}

// ---------- điểm lẻ: điểm = quà (xu) + tim/100, hiện 1 chữ số thập phân (cắt xuống) ----------
{
  assert.equal(formatPoints(0), '0.0');
  assert.equal(formatPoints(0.99), '0.9', '0.99 hiện thành 0.9 như bảng điểm mẫu');
  assert.equal(formatPoints(1), '1.0');
  assert.equal(formatPoints(2.9), '2.9');
  assert.equal(formatPoints(123.5), '123.5');
  assert.equal(formatPoints(123.59), '123.5', 'cắt xuống 1 chữ số thập phân, không làm tròn lên');

  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  chat(c, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t); // vào hàng, đang trống nên được ngồi ngay
  chat(c, 2, 'Công việc của em tháng này sao cô?', t);
  chat(c, 3, 'Tiền bạc cuối năm của em ra sao?', t);
  assert.equal(c.view(t).current?.nickname, 'Bạn 1');
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 2', 'Bạn 3'], 'chưa có điểm: xếp theo thứ tự vào');

  c.addLikes(who(3), 99);
  assert.ok(Math.abs(c.pointsOf('u3') - 0.99) < 1e-9, '99 tim = 0.99 điểm (tính lẻ, không chờ đủ 100)');
  assert.equal(formatPoints(c.pointsOf('u3')), '0.9', 'hiện trên sân khấu là 0.9');
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 3', 'Bạn 2'], '0.99 đã hơn 0: lên trước ngay');
  c.addLikes(who(3), 1);
  assert.ok(Math.abs(c.pointsOf('u3') - 1) < 1e-9, 'đủ 100 tim = 1 điểm');

  const added = c.addGiftPoints(who(2), 1); // 1 bông hồng = 1 xu
  assert.equal(added, 1);
  assert.equal(c.pointsOf('u2'), 1);
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 2', 'Bạn 3'], 'bằng điểm: ai vào trước ở trước (Bạn 2 vào trước Bạn 3)');
  c.addGiftPoints(who(3), 5);
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 3', 'Bạn 2'], 'Bạn 3 nhiều điểm hơn: vượt lên');

  // khách đang ngồi không vào hàng chờ lần 2; người trong hàng chờ hỏi lại thì cập nhật câu hỏi
  chat(c, 1, 'Em hỏi lại chuyện khác được không?', t);
  assert.equal(c.view(t).queue.length, 2);
  chat(c, 2, 'Em đổi câu hỏi: gia đình em sắp tới sao cô?', t);
  assert.equal(c.view(t).queue.length, 2);
  assert.ok(c.view(t).queue.find((q) => q.username === 'u2')!.question.includes('gia đình'));

  // xoá khỏi hàng chờ
  c.removeFromQueue('u2');
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 3']);
}

// ---------- nhịp một lượt xem: welcome -> deal (3 lá) -> flip (từng lá) -> reading -> rest -> khách tiếp ----------
{
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  chat(c, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t);
  chat(c, 2, 'Công việc của em sao cô?', t);
  assert.equal(c.phase, 'welcome');
  const v0 = c.view(t);
  assert.equal(v0.current?.question, 'Cô ơi chuyện tình cảm của em thế nào?', 'câu hỏi trên sân khấu = nguyên văn comment khách gõ');
  assert.equal(v0.current?.cards.length, 3);
  assert.ok(v0.current!.cards.every((x) => !x.faceUp), 'chưa lật lá nào');
  const ids = v0.current!.cards.map((x) => x.img);
  assert.equal(new Set(ids).size, 3, '3 lá rút ra phải khác nhau');

  c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.phase, 'deal');
  c.tick((t += GAME.dealStepMs * 3));
  assert.equal(c.view(t).current?.dealt, 3, 'đủ 3 lá úp trên bàn');
  c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.phase, 'flip');

  const flipLines = c.tick((t += GAME.flipStepMs + 10));
  assert.equal(c.view(t).current?.flipped, 1, 'lật lá 1');
  assert.ok(texts(flipLines).some((x) => x.includes(POSITIONS[0])), 'câu lật có tên vị trí 1');
  c.tick((t += GAME.flipStepMs));
  assert.equal(c.view(t).current?.flipped, 2, 'lật lá 2');
  c.tick((t += GAME.flipStepMs));
  assert.equal(c.view(t).current?.flipped, 3, 'lật lá 3');
  assert.ok(c.view(t).current!.cards.every((x) => x.faceUp), 'cả 3 lá đều ngửa');

  const readLines = c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.phase, 'reading');
  assert.equal(c.readings, 1);
  assert.ok(c.view(t).readingText.length > 200, 'đoạn luận hiện chữ trên sân khấu');
  assert.ok(texts(readLines).some((x) => x.includes('giải trí')), 'lượt đầu có nhắc chỉ mang tính giải trí');
  assert.ok(c.view(t).current?.pose === 'read');

  c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.phase, 'rest');
  c.tick((t = c.phaseEndsAt + 1));
  assert.equal(c.view(t).current?.nickname, 'Bạn 2', 'nghỉ xong: khách tiếp theo ngồi vào');
}

// ---------- lá ngược: rand ép toàn ngược thì view + lời giải đều ghi ngược ----------
{
  const c = new FortuneRoom(t, () => 0.01);
  c.newSession(t);
  chat(c, 5, 'Xem tổng quan cho em với cô?', t);
  c.tick((t = c.phaseEndsAt + 1)); // deal
  c.tick((t = c.phaseEndsAt + 1)); // flip
  c.tick((t += GAME.flipStepMs + 10));
  c.tick((t += GAME.flipStepMs));
  const flip3 = c.tick((t += GAME.flipStepMs));
  assert.ok(c.view(t).current!.cards.every((x) => x.reversed), 'cả 3 lá đều ngược');
  assert.ok(texts(flip3).some((x) => x.includes('chiều ngược')), 'câu lật nhắc chiều ngược');
}

// ---------- giữ giờ khi đang đọc + cửa sổ nói thêm ----------
{
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  chat(c, 9, 'Cô ơi xem cho em chuyện học hành?', t);
  const end0 = c.phaseEndsAt;
  c.hold(3000);
  assert.equal(c.phaseEndsAt, end0 + 3000, 'đang đọc câu chính thì đồng hồ pha đứng lại');
  assert.ok(!c.chatterWindow(t), 'đang trong lượt xem: không chen câu thêm');
}

// ---------- nhân vật khách: pool 12 (6 nam, 6 nữ), bốc tránh trùng, lệnh NAM/NỮ ----------
{
  assert.equal(GUEST_POOL.length, 12, 'pool có đúng 12 nhân vật');
  assert.equal(GUEST_POOL.filter((c) => c.gender === 'm').length, 6, '6 nhân vật nam');
  assert.equal(GUEST_POOL.filter((c) => c.gender === 'f').length, 6, '6 nhân vật nữ');
  assert.equal(new Set(GUEST_POOL.map((c) => c.id)).size, 12, 'id nhân vật không trùng');
  for (const c of GUEST_POOL) {
    assert.ok(fs.existsSync(path.join(assetsDir, c.img)), `${c.id}: thiếu file ảnh ${c.img}`);
    assert.equal(guestCharById(c.id)?.id, c.id);
  }
  assert.equal(guestCharById(null), null);
  assert.equal(guestCharById('khong-co'), null);

  // nhận lệnh: đúng 1 chữ NAM/NỮ, bỏ dấu được; câu dài có chữ nam/nữ thì không phải lệnh
  assert.equal(parseGenderCommand('NAM'), 'm');
  assert.equal(parseGenderCommand('nam'), 'm');
  assert.equal(parseGenderCommand('NỮ'), 'f');
  assert.equal(parseGenderCommand('nữ'), 'f');
  assert.equal(parseGenderCommand('Nu'), 'f');
  assert.equal(parseGenderCommand('nam ơi cho em hỏi với'), null);
  assert.equal(parseGenderCommand('bạn nam kia xem chưa'), null);
  assert.equal(parseGenderCommand('Cô ơi chuyện tình cảm của em thế nào?'), null);

  // bốc: pool trống -> null (không crash); lọc giới đúng; tránh nhân vật bị loại khi còn lựa chọn
  assert.equal(drawGuestChar(rand, { pool: [] }), null, 'pool trống: trả null, không crash');
  for (let i = 0; i < 200; i++) {
    assert.equal(drawGuestChar(Math.random, { gender: 'f' })?.gender, 'f', 'bốc theo giới nữ');
    assert.equal(drawGuestChar(Math.random, { gender: 'm' })?.gender, 'm', 'bốc theo giới nam');
    assert.notEqual(drawGuestChar(Math.random, { excludeId: 'm3' })?.id, 'm3', 'tránh nhân vật khách trước');
  }
  const two = [GUEST_POOL[0], GUEST_POOL[6]];
  for (let i = 0; i < 20; i++) {
    assert.equal(drawGuestChar(Math.random, { pool: two, excludeId: 'm1' })?.id, 'f1', 'pool 2 người, loại 1 thì bốc người còn lại');
  }

  // luồng phòng: khách ngồi có nhân vật; gõ NAM/NỮ đổi đúng giới ngay; khách sau không trùng nhân vật khách trước
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  chat(c, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t);
  const g0 = c.view(t).current?.guestChar;
  assert.ok(g0, 'khách ngồi vào bàn là có nhân vật');
  assert.ok(g0!.img.includes('/assets/guests/'), 'view lộ đường ảnh nhân vật');
  chat(c, 1, 'NAM', t);
  assert.equal(c.view(t).current?.guestChar?.gender, 'm', 'gõ NAM: đổi sang nhân vật nam');
  chat(c, 1, 'nữ', t);
  assert.equal(c.view(t).current?.guestChar?.gender, 'f', 'gõ nữ (có dấu, thường): đổi sang nhân vật nữ');
  const prevId = c.view(t).current?.guestChar?.id;

  chat(c, 2, 'Công việc của em sao cô?', t); // vào hàng chờ
  chat(c, 2, 'NAM', t); // chọn giới lúc đang chờ
  c.skip(t);
  c.tick((t += 3000));
  assert.equal(c.view(t).current?.nickname, 'Bạn 2', 'khách tiếp theo ngồi vào');
  assert.equal(c.view(t).current?.guestChar?.gender, 'm', 'đã gõ NAM lúc chờ: bốc nhân vật nam');
  assert.notEqual(c.view(t).current?.guestChar?.id, prevId, 'khách sau không trùng nhân vật của khách trước');
}

// ---------- tim/quà CHỈ tính từ lúc vào hàng ("tim tính từ lúc em vào hàng") ----------
{
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  c.addLikes(who(7), 500, t);
  assert.equal(c.pointsOf('u7'), 0, 'thả 500 tim trước khi vào hàng: 0 điểm');
  assert.equal(c.addGiftPoints(who(7), 5, t), 0, 'tặng quà trước khi vào hàng: không cộng điểm');
  assert.equal(c.pointsOf('u7'), 0, 'quà trước khi vào hàng không được tính bù');
  chat(c, 7, 'Cô ơi chuyện tiền bạc của em ra sao?', t); // vào hàng, phòng trống nên ngồi ngay
  assert.equal(c.view(t).current?.nickname, 'Bạn 7');
  assert.equal(c.pointsOf('u7'), 0, 'vừa vào vẫn 0 điểm');
  c.addLikes(who(7), 50, t); // đang ngồi xem: tim được tính
  assert.ok(Math.abs(c.pointsOf('u7') - 0.5) < 1e-9, 'đang ngồi thả 50 tim = 0.5 điểm');
  assert.equal(c.addGiftPoints(who(7), 2, t), 2, 'đang ngồi tặng quà: cộng điểm bình thường');
  assert.ok(Math.abs(c.pointsOf('u7') - 2.5) < 1e-9);
}

// ---------- nhảy hạng: báo đúng 1 lần khi hạng thật đổi, nén spam, không báo cho khách đang ngồi / khi bằng điểm ----------
{
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  chat(c, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t); // ngồi ngay
  for (let i = 2; i <= 6; i++) chat(c, i, `Câu hỏi của bạn ${i} thế nào hả cô?`, t);
  // dựng thứ hạng bằng quà: Bạn 2..6 lần lượt 50/40/30/20/10 điểm, đúng thứ tự vào hàng nên chưa ai "nhảy"
  c.addGiftPoints(who(2), 50, t);
  c.addGiftPoints(who(3), 40, t);
  c.addGiftPoints(who(4), 30, t);
  c.addGiftPoints(who(5), 20, t);
  c.addGiftPoints(who(6), 10, t);
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 2', 'Bạn 3', 'Bạn 4', 'Bạn 5', 'Bạn 6']);
  assert.equal(c.view(t).rankJumps.length, 0, 'điểm tăng nhưng hạng giữ nguyên: không có toast');

  c.addLikes(who(6), 2500, t); // Bạn 6: 10 + 25 = 35 điểm, hạng 5 -> 3
  let jumps = c.view(t).rankJumps;
  assert.equal(jumps.length, 1, 'nhảy hạng: đúng 1 sự kiện');
  assert.equal(jumps[0].username, 'u6');
  assert.deepEqual([jumps[0].from, jumps[0].to], [5, 3], 'số 5 -> số 3');
  assert.equal(jumps[0].likes, 2500, 'toast ghi tổng tim đã tính');
  assert.equal(jumps[0].gifts, 1, 'toast ghi số lần tặng quà đã tính');
  assert.ok(Math.abs(jumps[0].points - 35) < 1e-9);

  c.addLikes(who(6), 100, t); // 36 điểm, vẫn hạng 3
  assert.equal(c.view(t).rankJumps.length, 1, 'hạng không đổi: không báo thêm');

  c.addGiftPoints(who(6), 10, t); // 46 điểm: hạng 3 -> 2 nhưng quá gần lần báo trước
  assert.deepEqual(c.view(t).queue.map((q) => q.nickname), ['Bạn 2', 'Bạn 6', 'Bạn 3', 'Bạn 4', 'Bạn 5'], 'hạng thật vẫn đổi dù nén toast');
  assert.equal(c.view(t).rankJumps.length, 1, 'nhảy hạng trong cửa sổ nén: không spam toast');

  c.addGiftPoints(who(6), 10, t + GAME.rankToastMinIntervalMs + 1); // 56 điểm: hạng 2 -> 1, đã qua cửa sổ nén
  jumps = c.view(t + GAME.rankToastMinIntervalMs + 1).rankJumps;
  assert.equal(jumps.length, 2, 'qua cửa sổ nén: báo lần nhảy mới, xếp tối đa 2 toast');
  assert.deepEqual([jumps[1].from, jumps[1].to], [2, 1]);

  c.addLikes(who(1), 10000, t + GAME.rankToastMinIntervalMs + 1); // khách đang ngồi thả tim
  assert.ok(!c.view(t + GAME.rankToastMinIntervalMs + 1).rankJumps.some((j) => j.username === 'u1'), 'khách đang ngồi: không có toast nhảy hạng');
  assert.equal(c.view(t + GAME.rankToastMinIntervalMs + 1 + GAME.rankToastMs + 1).rankJumps.length, 0, 'toast hết hạn hiển thị thì biến mất');

  // bằng điểm tuyệt đối nhưng vào sau: hạng giữ nguyên, không báo
  const c2 = new FortuneRoom(t, rand);
  c2.newSession(t);
  chat(c2, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t);
  chat(c2, 2, 'Công việc của em sao cô?', t);
  chat(c2, 3, 'Tiền bạc của em ra sao?', t);
  c2.addGiftPoints(who(2), 10, t);
  c2.addLikes(who(3), 1000, t); // Bạn 3 = 10.0 điểm, bằng Bạn 2 nhưng vào sau
  assert.deepEqual(c2.view(t).queue.map((q) => q.nickname), ['Bạn 2', 'Bạn 3'], 'bằng điểm: người vào trước vẫn trước');
  assert.equal(c2.view(t).rankJumps.length, 0, 'bằng điểm, hạng không đổi: không báo nhảy hạng');
}

// ---------- view cho panel sân khấu: top 4 + số còn lại + bảng tên khách ----------
{
  const c = new FortuneRoom(t, rand);
  c.newSession(t);
  assert.equal(c.view(t).nameplate, null, 'chưa có khách ngồi: không có dữ liệu bảng tên');
  assert.equal(c.view(t).queueTop4.length, 0);
  assert.equal(c.view(t).queueMore, 0);
  chat(c, 1, 'Cô ơi chuyện tình cảm của em thế nào?', t);
  assert.equal(c.view(t).nameplate?.nickname, 'Bạn 1', 'khách ngồi: view lộ tên cho bảng tên trên ghế');
  const qs = ['Công việc của em sao cô?', 'Tiền bạc của em ra sao?', 'Em sắp thi, kết quả có tốt không cô?', 'Gia đình em sắp tới có chuyện gì vui không?', 'Chuyện học hành của em thế nào?', 'Em có nên đổi việc lúc này không cô?', 'Sức khỏe của em dạo này sao cô?'];
  for (let i = 2; i <= 8; i++) chat(c, i, qs[i - 2], t);
  assert.equal(c.view(t).queueCount, 7, '7 người đang chờ');
  assert.equal(c.view(t).queueTop4.length, GAME.queueTopN, 'panel chỉ lộ top 4');
  assert.equal(c.view(t).queueMore, 3, 'còn 3 người ngoài top 4 cho dòng "+N người nữa"');
  c.addGiftPoints(who(8), 3, t); // Bạn 8 tặng quà: lên đầu hàng chờ
  assert.equal(c.view(t).queueTop4[0].nickname, 'Bạn 8', 'top 4 xếp theo điểm thật');
  assert.deepEqual(c.view(t).queueTop4.map((q) => q.username), c.view(t).queue.slice(0, 4).map((q) => q.username), 'top 4 khớp đầu danh sách đầy đủ');
}

// ---------- khách mẫu: trống 40s thì ngồi vào, không điểm/không hàng chờ, chạy hết lượt mà không tính lượt ----------
{
  let td = t;
  const c = new FortuneRoom(td, rand);
  c.newSession(td);
  c.tick(td + GAME.demoAfterMs - 1);
  assert.equal(c.view(td).current, null, 'chưa đủ 40s trống: chưa có khách mẫu');
  const intro = c.tick(td + GAME.demoAfterMs + 1);
  const v = c.view(td + GAME.demoAfterMs + 1);
  assert.equal(v.current?.demo, true, 'đủ 40s trống: khách mẫu ngồi vào');
  assert.equal(v.current?.nickname, 'Khách mẫu');
  assert.ok(v.current?.guestChar, 'khách mẫu cũng có nhân vật ngồi ghế');
  assert.ok(v.current!.question.length > 10, 'khách mẫu có câu hỏi mẫu');
  assert.ok(texts(intro).some((x) => x.includes('lượt mẫu')), 'cô giới thiệu rõ đây là lượt mẫu');
  assert.equal(v.queueCount, 0, 'khách mẫu không vào hàng chờ');
  assert.equal(c.pointsOf(DEMO_USERNAME), 0, 'khách mẫu không có điểm');

  // chạy hết một lượt mẫu: welcome -> deal -> flip -> reading -> rest -> idle
  c.tick((td = c.phaseEndsAt + 1)); // deal
  c.tick((td += GAME.dealStepMs * 3));
  c.tick((td = c.phaseEndsAt + 1)); // flip
  c.tick((td += GAME.flipStepMs + 10));
  c.tick((td += GAME.flipStepMs));
  c.tick((td += GAME.flipStepMs));
  assert.equal(c.view(td).current?.flipped, 3, 'lượt mẫu lật đủ 3 lá');
  c.tick((td = c.phaseEndsAt + 1)); // reading
  assert.equal(c.phase, 'reading');
  assert.ok(c.view(td).readingText.length > 200, 'lượt mẫu vẫn hiện đoạn luận đầy đủ');
  assert.equal(c.readings, 0, 'lượt mẫu không tính vào số lượt đã xem');
  c.tick((td = c.phaseEndsAt + 1)); // rest
  assert.equal(c.phase, 'rest');
  c.tick((td = c.phaseEndsAt + 1)); // idle
  assert.equal(c.phase, 'idle');
  assert.equal(c.view(td).current, null, 'lượt mẫu xong: ghế trống lại');
}

// ---------- khách mẫu nhường bàn: khách thật vào hàng giữa pha lật -> lật nốt nhanh, đọc rút gọn, khách thật lên ----------
{
  let td = t;
  const c = new FortuneRoom(td, rand);
  c.newSession(td);
  c.tick(td + GAME.demoAfterMs + 1); // khách mẫu ngồi
  c.tick((td = c.phaseEndsAt + 1)); // deal
  c.tick((td += GAME.dealStepMs * 3));
  c.tick((td = c.phaseEndsAt + 1)); // flip
  c.tick((td += GAME.flipStepMs + 10));
  assert.equal(c.view(td).current?.flipped, 1, 'lượt mẫu đã lật 1 lá');
  chat(c, 42, 'Cô ơi chuyện tình cảm của em thế nào?', td); // khách thật vào hàng
  assert.equal(c.view(td).queueCount, 1, 'khách thật ở trong hàng chờ');
  assert.equal(c.view(td).current?.demo, true, 'khách mẫu chưa bị giật khỏi ghế giữa lá đang lật');
  let readLines: { text: string }[] = [];
  const ph = () => (c as FortuneRoom).phase; // đọc pha qua hàm để tsc không thu hẹp kiểu sai trong vòng lặp
  for (let i = 0; i < 6 && ph() !== 'reading'; i++) {
    const lines = c.tick((td += 300));
    if (ph() === 'reading') readLines = lines; // chỉ lấy câu của đúng tick chuyển sang pha đọc
  }
  assert.equal(c.view(td).current?.flipped, 3, 'nhường bàn: các lá còn lại được lật nốt rất nhanh');
  assert.equal(c.phase, 'reading');
  assert.ok(texts(readLines).some((x) => x.includes('nhường bàn')), 'đọc rút gọn: có câu nhường bàn');
  assert.equal(readLines.length, 2, 'đọc rút gọn: chỉ câu mở + câu nhường, không đọc 6 câu luận của lượt mẫu');
  c.tick((td = c.phaseEndsAt + 1)); // rest ngắn
  c.tick((td = c.phaseEndsAt + 1)); // khách thật ngồi
  assert.equal(c.view(td).current?.nickname, 'Bạn 42', 'khách thật được ngồi ngay sau lượt mẫu');
  assert.equal(c.view(td).current?.demo, false);
}

// ---------- khách mẫu nhường bàn giữa pha đọc: bỏ câu chờ đọc, đọc nốt câu đang dở rồi nhường ----------
{
  let td = t;
  const c = new FortuneRoom(td, rand);
  c.newSession(td);
  c.tick(td + GAME.demoAfterMs + 1);
  c.tick((td = c.phaseEndsAt + 1)); // deal
  c.tick((td += GAME.dealStepMs * 3));
  c.tick((td = c.phaseEndsAt + 1)); // flip
  c.tick((td += GAME.flipStepMs + 10));
  c.tick((td += GAME.flipStepMs));
  c.tick((td += GAME.flipStepMs));
  const full = c.tick((td = c.phaseEndsAt + 1)); // reading đầy đủ (chưa ai nhường)
  assert.equal(c.phase, 'reading');
  assert.ok(full.length >= 7, 'chưa có khách thật: lượt mẫu đọc đủ câu mở + 6 câu luận');
  assert.equal(c.consumeDemoCut(), false, 'chưa nhường: không có yêu cầu bỏ câu chờ');
  chat(c, 43, 'Công việc của em sao cô?', td); // khách thật vào giữa pha đọc
  const y = c.tick((td += 200));
  assert.ok(texts(y).some((x) => x.includes('nhường bàn')), 'giữa pha đọc: cô nói câu nhường bàn');
  assert.equal(c.consumeDemoCut(), true, 'stage được báo bỏ các câu luận đang chờ đúng 1 lần');
  assert.equal(c.consumeDemoCut(), false, 'báo cắt chỉ 1 lần');
  c.tick((td = c.phaseEndsAt + 1)); // rest ngắn
  c.tick((td = c.phaseEndsAt + 1)); // khách thật ngồi
  assert.equal(c.view(td).current?.nickname, 'Bạn 43', 'khách thật lên ngay sau khi lượt mẫu nhường');
}

console.log('fortune.check: tất cả đều đúng');
