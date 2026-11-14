// Kiểm chứng engine Bong Bóng Avatar: thả bong bóng khi vào phòng/comment, tim
// làm to bong bóng của chính chủ, trần x2,2, luật nứt (chênh 35% + đủ tốc độ),
// 3 nứt = nổ + điểm cho người làm nổ + khoá 8 giây, bong bóng vàng, chân Bug,
// bot không bao giờ gây nứt + rút khi đủ người thật, kết vòng. Chạy: npm run check.
import { BubblesRoom, type Person } from './bubbles';
import { GAME } from './config';

let failures = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}: expected ${e}, got ${a}`);
  }
}
function ok(cond: boolean, label: string) {
  if (!cond) {
    failures++;
    console.log(`FAIL ${label}`);
  }
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T = 1_000_000;
const person = (username: string): Person => ({ username, nickname: username, spoken: username, avatar: '' });
const bubOf = (room: BubblesRoom, now: number, username: string) => room.view(now).bubbles.find((b) => b.username === username);

/** Cho 2 bong bóng đụng nhau trực diện tại thời điểm t với tốc độ mỗi bên = speed (px/giây) */
function hit(room: BubblesRoom, big: string, small: string, t: number, speed = 170) {
  const v = room.view(t);
  const bB = v.bubbles.find((b) => b.username === big)!;
  const bS = v.bubbles.find((b) => b.username === small)!;
  const dist = bB.radius + bS.radius - 12; // chồng lấn nhẹ để chắc chắn va chạm ngay bước đầu
  room.debugPlace(big, 420, 900);
  room.debugPlace(small, 420 + dist, 900);
  room.debugSetVel(big, speed, 0);
  room.debugSetVel(small, -speed, 0);
  room.tick(t + 120);
}

// ---------- 1. Vào phòng / comment: đúng 1 bong bóng cho mỗi người ----------
{
  const room = new BubblesRoom(T, mulberry32(1));
  room.join(person('anhA'), T);
  eq(room.view(T).bubbles.filter((b) => b.username === 'anhA').length, 1, 'vào phòng: có đúng 1 bong bóng');
  room.join(person('anhA'), T);
  eq(room.view(T).bubbles.filter((b) => b.username === 'anhA').length, 1, 'vào phòng lần nữa: vẫn 1 bong bóng');
  room.chat(person('anhA'), 'chào', T);
  eq(room.view(T).bubbles.filter((b) => b.username === 'anhA').length, 1, 'comment tiếp: không thêm bong bóng');
  room.chat(person('chiB'), 'meo', T);
  eq(room.view(T).bubbles.length, 2, 'người khác comment: thêm bong bóng của người đó');
}

// ---------- 2. Tim chỉ làm to bong bóng của chính chủ + gộp lượt + trần x2,2 ----------
{
  const room = new BubblesRoom(T, mulberry32(2));
  room.chat(person('anhA'), 'a', T);
  room.chat(person('chiB'), 'b', T);
  room.like(person('anhA'), 99, T);
  eq(bubOf(room, T, 'anhA')?.growth, 1.03, 'tim của A: bong bóng A +3%');
  eq(bubOf(room, T, 'chiB')?.growth, 1, 'tim của A: bong bóng B không đổi');
  room.like(person('nguoiC'), 10, T); // C không có bong bóng
  eq(bubOf(room, T, 'anhA')?.growth, 1.03, 'người không có bong bóng thả tim: không ai to lên');
  room.like(person('anhA'), 1, T);
  eq(bubOf(room, T, 'anhA')?.growth, 1.03, 'tim dồn dập bị gộp lượt: không to thêm trong cùng nhịp');
  room.like(person('anhA'), 1, T + GAME.likeBatchMs + 100);
  eq(bubOf(room, T, 'anhA')?.growth, 1.06, 'qua nhịp gộp mới to tiếp +3%');
  let t = T + GAME.likeBatchMs + 100;
  for (let i = 0; i < 60; i++) {
    t += GAME.likeBatchMs + 100;
    room.like(person('anhA'), 1, t);
  }
  eq(bubOf(room, t, 'anhA')?.growth, GAME.growthCap, 'to mãi cũng dừng ở trần x2,2');
}

// ---------- 3. Chat của chính chủ làm to dần, cùng trần x2,2 ----------
{
  const room = new BubblesRoom(T, mulberry32(3));
  room.chat(person('anhA'), 'vào sân', T);
  for (let i = 0; i < 150; i++) room.chat(person('anhA'), `chat ${i}`, T);
  eq(bubOf(room, T, 'anhA')?.growth, GAME.growthCap, 'chat 150 tin: dừng đúng trần x2,2, không vượt');
}

// ---------- 4. Luật nứt: chênh >= 35% + đủ tốc độ; ngang cỡ hoặc đụng nhẹ thì không nứt ----------
{
  const room = new BubblesRoom(T, mulberry32(4));
  room.chat(person('to'), 'x', T);
  room.chat(person('nho'), 'x', T);
  room.debugSetGrowth('to', 2.0);
  hit(room, 'to', 'nho', T);
  eq(bubOf(room, T + 120, 'nho')?.cracks, 1, 'to gấp đôi + đụng mạnh: nhỏ nứt 1');
  eq(bubOf(room, T + 120, 'to')?.cracks, 0, 'bong bóng to không bị nứt ngược');

  const room2 = new BubblesRoom(T, mulberry32(5));
  room2.chat(person('a1'), 'x', T);
  room2.chat(person('a2'), 'x', T);
  hit(room2, 'a1', 'a2', T, 200);
  eq(bubOf(room2, T + 120, 'a1')?.cracks, 0, 'ngang cỡ: đụng mạnh cũng không nứt (a1)');
  eq(bubOf(room2, T + 120, 'a2')?.cracks, 0, 'ngang cỡ: đụng mạnh cũng không nứt (a2)');

  const room3 = new BubblesRoom(T, mulberry32(6));
  room3.chat(person('to'), 'x', T);
  room3.chat(person('nho'), 'x', T);
  room3.debugSetGrowth('to', 2.0);
  hit(room3, 'to', 'nho', T, 30); // mỗi bên 30px/s -> tốc độ tương đối ~60 < 100
  eq(bubOf(room3, T + 120, 'nho')?.cracks, 0, 'chênh cỡ nhưng đụng nhẹ: không nứt');
}

// ---------- 5. Ba vết nứt = nổ BỐP, người làm nổ +1 điểm, khoá hồi sinh 8 giây ----------
{
  const room = new BubblesRoom(T, mulberry32(7));
  room.chat(person('thang'), 'x', T);
  room.chat(person('thua'), 'x', T);
  room.debugSetGrowth('thang', 2.2);
  hit(room, 'thang', 'thua', T);
  hit(room, 'thang', 'thua', T + 500);
  eq(bubOf(room, T + 620, 'thua')?.cracks, 2, 'sau 2 cú đụng mạnh: 2 vết nứt');
  hit(room, 'thang', 'thua', T + 1000);
  eq(bubOf(room, T + 1120, 'thua'), undefined, '3 vết nứt: bong bóng nổ, biến mất khỏi sân');
  eq(room.view(T + 1120).board.find((b) => b.username === 'thang')?.pops, 1, 'người làm nổ được +1 điểm nổ');
  eq(room.view(T + 1120).totals.pops, 1, 'tổng số lần nổ của buổi = 1');
  room.chat(person('thua'), 'cho mình vào lại', T + 1000 + 4000);
  eq(bubOf(room, T + 5000, 'thua'), undefined, 'mới nổ 4 giây: comment cũng chưa hồi sinh');
  room.chat(person('thua'), 'vào lại nè', T + 1000 + 9000);
  ok(bubOf(room, T + 10000, 'thua') !== undefined, 'sau 8 giây: comment là có bong bóng mới');
  eq(bubOf(room, T + 10000, 'thua')?.cracks, 0, 'bong bóng mới: chưa vết nứt nào');
}

// ---------- 6. Bong bóng vàng: không bị nứt; làm nổ người khác tính đôi ----------
{
  const room = new BubblesRoom(T, mulberry32(8));
  room.chat(person('vang'), 'x', T);
  room.forceGolden(T); // chỉ có 1 bong bóng người thật -> chắc chắn là nó
  eq(bubOf(room, T, 'vang')?.golden, true, 'bong bóng được chọn phát sáng vàng');
  room.chat(person('to'), 'x', T);
  room.debugSetGrowth('to', 2.2);
  hit(room, 'to', 'vang', T);
  eq(bubOf(room, T + 120, 'vang')?.cracks, 0, 'đang vàng: bị bong bóng to đụng mạnh cũng không nứt');

  const room2 = new BubblesRoom(T, mulberry32(9));
  room2.chat(person('vang'), 'x', T);
  room2.forceGolden(T);
  room2.chat(person('nannhan'), 'x', T);
  room2.debugSetGrowth('vang', 2.2);
  hit(room2, 'vang', 'nannhan', T);
  hit(room2, 'vang', 'nannhan', T + 500);
  hit(room2, 'vang', 'nannhan', T + 1000);
  eq(bubOf(room2, T + 1120, 'nannhan'), undefined, 'bong bóng vàng làm nổ được bong bóng thường');
  eq(room2.view(T + 1120).board.find((b) => b.username === 'vang')?.pops, 2, 'đang vàng mà làm nổ: tính đôi (+2)');
}

// ---------- 7. Chân Bug: quệt đúng bong bóng to nhất, nứt đúng 2 vết ----------
{
  const room = new BubblesRoom(T, mulberry32(10));
  room.chat(person('to'), 'x', T);
  room.chat(person('nho'), 'x', T);
  room.debugSetGrowth('to', 2.0);
  room.triggerPaw(T);
  eq(bubOf(room, T, 'to')?.cracks, 2, 'chân Bug: bong bóng to nhất nứt đúng 2 vết');
  eq(bubOf(room, T, 'nho')?.cracks, 0, 'chân Bug: bong bóng nhỏ không bị gì');
  ok(room.view(T).paw !== null, 'chân Bug hiện trên sân cho người xem thấy');
}

// ---------- 8. Gió quạt thổi ngang ----------
{
  const room = new BubblesRoom(T, mulberry32(11));
  room.chat(person('a'), 'x', T);
  room.triggerFan(T);
  ok(room.view(T).gustDir === 1 || room.view(T).gustDir === -1, 'gió quạt: view báo hướng gió đang thổi');
}

// ---------- 9. Bot không bao giờ gây nứt + rút khi đủ 4 người thật ----------
{
  const room = new BubblesRoom(T, mulberry32(12));
  room.tick(T + 100);
  const bots = room.view(T + 100).bubbles.filter((b) => b.bot);
  eq(bots.length, GAME.botFillTo, 'sân trống: bot vào đủ số sưởi sân');
  const botName = bots[0].username;
  room.chat(person('r1'), 'x', T + 110);
  room.debugSetGrowth(botName, 2.2); // bot to hết cỡ
  hit(room, botName, 'r1', T + 200);
  eq(bubOf(room, T + 320, 'r1')?.cracks, 0, 'bot to đụng mạnh người thật: người thật KHÔNG nứt');
  room.chat(person('r2'), 'x', T + 330);
  room.chat(person('r3'), 'x', T + 330);
  room.chat(person('r4'), 'x', T + 330);
  room.tick(T + 400);
  eq(room.view(T + 400).bubbles.filter((b) => b.bot).length, 0, 'đủ 4 người thật: bot rút hết');
  eq(room.view(T + 400).bubbles.filter((b) => !b.bot).length, 4, '4 bong bóng người thật còn trên sân');
}

// ---------- 10. Kết vòng: còn 1 bong bóng người thật là thắng vòng ----------
{
  const room = new BubblesRoom(T, mulberry32(13));
  room.chat(person('vua'), 'x', T);
  room.chat(person('b1'), 'x', T);
  room.chat(person('b2'), 'x', T);
  room.debugSetGrowth('vua', 2.2);
  for (let k = 0; k < 3; k++) hit(room, 'vua', 'b1', T + k * 500);
  eq(bubOf(room, T + 1600, 'b1'), undefined, 'b1 bị nổ sau 3 lần nứt');
  for (let k = 0; k < 3; k++) hit(room, 'vua', 'b2', T + 2000 + k * 500);
  room.tick(T + 3600);
  const v = room.view(T + 3600);
  eq(v.phase, 'intermission', 'còn 1 bong bóng người thật: kết vòng, sang giờ nghỉ');
  eq(v.board.find((b) => b.username === 'vua')?.wins, 1, 'người trụ lại được +1 điểm thắng');
  eq(v.board.find((b) => b.username === 'vua')?.pops, 2, 'vua làm nổ cả 2 bong bóng kia: 2 điểm nổ');
  eq(v.lastWinner, 'vua', 'ghi tên Vua Bong Bóng của vòng');
  room.tick(T + 3600 + GAME.intermissionMs + 600);
  eq(room.view(T + 3600 + GAME.intermissionMs + 600).phase, 'battle', 'sau giờ nghỉ: vòng mới tự bắt đầu');
  eq(room.view(T + 3600 + GAME.intermissionMs + 600).round, 2, 'số vòng tăng lên 2');
}

// Sân chỉ có bot thì không bao giờ tự kết vòng
{
  const room = new BubblesRoom(T, mulberry32(14));
  for (let i = 0; i < 30; i++) room.tick(T + (i + 1) * 1000);
  eq(room.view(T + 30_000).phase, 'battle', 'chỉ có bot: vòng không tự kết thúc');
  eq(room.view(T + 30_000).round, 1, 'chỉ có bot: vẫn vòng 1');
}

if (failures) {
  console.log(`bubbles.check: ${failures} ca TRƯỢT`);
  process.exit(1);
}
console.log('bubbles.check: TẤT CẢ ĐẠT');
