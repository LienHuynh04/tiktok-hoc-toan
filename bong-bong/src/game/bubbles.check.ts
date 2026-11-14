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
  room2.debugSetRng(() => 0.99); // tắt vỡ hiếm: ca này chỉ kiểm chứng tính đôi của bong bóng vàng
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

/** rng theo hàng đợi: hết phần tử thì dùng fallback (mặc định 0,99 = không vỡ hiếm) */
const queueRng = (vals: number[], fallback = 0.99) => () => (vals.length ? vals.shift()! : fallback);

// ---------- 11. VỠ LẠ: người làm nổ hấp thụ 30% phần to vượt gốc của nạn nhân (trần x2,2) ----------
{
  const room = new BubblesRoom(T, mulberry32(21));
  room.chat(person('popper'), 'x', T);
  room.chat(person('victim'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetRng(() => 0.99); // tắt vỡ hiếm cho ca này
  room.debugSetGrowth('popper', 1.9);
  room.debugSetGrowth('victim', 1.3);
  hit(room, 'popper', 'victim', T);
  hit(room, 'popper', 'victim', T + 500);
  hit(room, 'popper', 'victim', T + 1000);
  eq(bubOf(room, T + 1120, 'victim'), undefined, 'hấp thụ: nạn nhân nổ sau 3 nứt');
  const g = bubOf(room, T + 1120, 'popper')?.growth ?? 0;
  ok(Math.abs(g - 1.99) < 0.005, `hấp thụ: popper 1,9 + 30% x 0,3 = 1,99 (được ${g})`);
  eq(room.view(T + 1120).board.find((b) => b.username === 'popper')?.pops, 1, 'hấp thụ: vẫn chỉ +1 điểm nổ thường');

  const room2 = new BubblesRoom(T, mulberry32(22));
  room2.chat(person('popper'), 'x', T);
  room2.chat(person('victim'), 'x', T);
  room2.chat(person('khach1'), 'x', T);
  room2.chat(person('khach2'), 'x', T);
  room2.debugSetRng(() => 0.99);
  room2.debugSetGrowth('popper', 2.15);
  room2.debugSetGrowth('victim', 1.4);
  hit(room2, 'popper', 'victim', T);
  hit(room2, 'popper', 'victim', T + 500);
  hit(room2, 'popper', 'victim', T + 1000);
  eq(bubOf(room2, T + 1120, 'popper')?.growth, GAME.growthCap, 'hấp thụ: cộng dồn vẫn bị chặn ở trần x2,2');
}

// ---------- 12. VỠ HIẾM: rng ép trúng -> điểm x2 + biến thể đúng (mặt Bug / mưa cá) ----------
{
  const room = new BubblesRoom(T, mulberry32(23));
  room.chat(person('popper'), 'x', T);
  room.chat(person('victim'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetGrowth('popper', 2.2);
  room.debugSetRng(queueRng([0.05, 0.5])); // 0,05 < 10% -> vỡ hiếm; 0,5 -> biến thể mặt Bug
  hit(room, 'popper', 'victim', T);
  hit(room, 'popper', 'victim', T + 500);
  hit(room, 'popper', 'victim', T + 1000);
  eq(room.view(T + 1120).board.find((b) => b.username === 'popper')?.pops, 2, 'vỡ hiếm: người làm nổ được điểm đôi');
  const poolEntry = room.view(T + 1120).pool.find((e) => e.username === 'victim');
  eq(poolEntry?.rare, 'bugface', 'vỡ hiếm: biến thể mặt Bug');
  eq(poolEntry?.bugFace, true, 'vỡ hiếm: avatar đang hoá mặt Bug trong 2 giây đầu');
  eq(poolEntry?.state, 'spin', 'vỡ hiếm: avatar đang ở pha xoay chóng mặt');

  const room2 = new BubblesRoom(T, mulberry32(24));
  room2.chat(person('popper'), 'x', T);
  room2.chat(person('victim'), 'x', T);
  room2.chat(person('khach1'), 'x', T);
  room2.chat(person('khach2'), 'x', T);
  room2.debugSetGrowth('popper', 2.2);
  room2.debugSetRng(queueRng([0.05, 0.1])); // biến thể mưa cá
  hit(room2, 'popper', 'victim', T);
  hit(room2, 'popper', 'victim', T + 500);
  hit(room2, 'popper', 'victim', T + 1000);
  eq(room2.view(T + 1120).pool.find((e) => e.username === 'victim')?.rare, 'fish', 'vỡ hiếm: biến thể mưa cá');
  eq(room2.view(T + 1120).board.find((b) => b.username === 'popper')?.pops, 2, 'vỡ hiếm mưa cá: cũng điểm đôi');
}

// ---------- 13. HỒ NGƯỜI VỠ: nổ -> xoay -> rơi dù -> đáp hồ -> hồi sinh thì rời hồ ----------
{
  const room = new BubblesRoom(T, mulberry32(25));
  room.chat(person('popper'), 'x', T);
  room.chat(person('victim'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetRng(() => 0.99);
  room.debugSetGrowth('popper', 2.2);
  hit(room, 'popper', 'victim', T);
  hit(room, 'popper', 'victim', T + 500);
  hit(room, 'popper', 'victim', T + 1000);
  eq(room.view(T + 1120).pool.find((e) => e.username === 'victim')?.state, 'spin', 'hồ: vừa nổ, avatar đang xoay');
  for (let i = 1; i <= 20; i++) room.tick(T + 1120 + i * 400); // ~8 giây: xoay 0,7s + rơi dù ~6,3s
  eq(room.view(T + 9120).pool.find((e) => e.username === 'victim')?.state, 'pooled', 'hồ: avatar đã đáp xuống hồ');
  room.chat(person('victim'), 'cho mình lên lại', T + 9700); // qua khoá hồi sinh 8 giây
  ok(bubOf(room, T + 9700, 'victim') !== undefined, 'hồ: hồi sinh có bong bóng mới');
  eq(room.view(T + 9700).pool.find((e) => e.username === 'victim'), undefined, 'hồ: hồi sinh thì rời hồ');
}

// ---------- 14. VÒNG GIÓ: ngoài vòng 2,5 giây nứt 1 vết; trong vòng an toàn; bot cũng bị ----------
{
  const room = new BubblesRoom(T, mulberry32(26));
  room.chat(person('ngoai'), 'x', T);
  room.chat(person('trong'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetRng(() => 0.99);
  room.forceRingStep(T);
  eq(room.view(T).ring?.r, GAME.ringStartR, 'vòng gió: xuất hiện ở bán kính đầu');
  let t = T;
  for (let i = 0; i < 6; i++) {
    t += 500;
    room.debugPlace('ngoai', 82, 450); // góc xa tâm: chắc chắn ngoài vòng
    room.debugSetVel('ngoai', 0, 0);
    room.debugPlace('trong', 540, 1060); // ngay tâm vòng
    room.debugSetVel('trong', 0, 0);
    room.tick(t);
    if (i === 3) eq(bubOf(room, t, 'ngoai')?.cracks, 0, 'vòng gió: ngoài vòng 2 giây đầu chưa nứt');
  }
  eq(bubOf(room, t, 'ngoai')?.cracks, 1, 'vòng gió: ngoài vòng đủ 2,5 giây -> nứt 1 vết');
  eq(bubOf(room, t, 'trong')?.cracks, 0, 'vòng gió: ở trong vòng không bị nứt');

  const room2 = new BubblesRoom(T, mulberry32(27));
  room2.tick(T + 100); // bot vào sưởi sân
  room2.forceRingStep(T + 100);
  const botUser = room2.view(T + 100).bubbles.find((b) => b.bot)!.username;
  let t2 = T + 100;
  for (let i = 0; i < 6; i++) {
    t2 += 500;
    room2.debugPlace(botUser, 82, 450);
    room2.debugSetVel(botUser, 0, 0);
    room2.tick(t2);
  }
  eq(bubOf(room2, t2, botUser)?.cracks, 1, 'vòng gió: bot ở ngoài vòng cũng nứt như người thật');
}

// ---------- 15. BOM: gắn vào người thật (không bot), chuyền khi đụng sau 3s, nổ ở 0 không ai được điểm ----------
{
  const room = new BubblesRoom(T, mulberry32(28));
  room.chat(person('aa'), 'x', T);
  room.chat(person('bb'), 'x', T);
  room.chat(person('cc'), 'x', T);
  room.chat(person('dd'), 'x', T);
  room.debugSetRng(() => 0); // carrier = người thật đầu tiên
  const attachLines = room.attachBomb(T);
  ok(attachLines.length > 0 && attachLines[0].text.includes('Bom hẹn giờ'), 'bom: MC báo khi bom xuất hiện');
  eq(room.view(T).bomb?.username, 'aa', 'bom: gắn đúng người được chọn');
  eq(room.view(T).bomb?.sec, 10, 'bom: đếm ngược từ 10');
  room.debugPlace('aa', 500, 900);
  room.debugPlace('bb', 570, 900);
  room.debugSetVel('aa', 0, 0);
  room.debugSetVel('bb', 0, 0);
  room.tick(T + 1000);
  eq(room.view(T + 1000).bomb?.username, 'aa', 'bom: chưa đủ 3 giây giữ bom thì chưa chuyền');
  room.debugPlace('aa', 500, 900);
  room.debugPlace('bb', 570, 900);
  room.debugSetVel('aa', 0, 0);
  room.debugSetVel('bb', 0, 0);
  room.tick(T + 3100);
  eq(room.view(T + 3100).bomb?.username, 'bb', 'bom: sau 3 giây, đụng người thật khác là chuyền');

  const room2 = new BubblesRoom(T, mulberry32(29));
  room2.chat(person('aa'), 'x', T);
  room2.chat(person('bb'), 'x', T);
  room2.chat(person('cc'), 'x', T);
  room2.chat(person('dd'), 'x', T);
  room2.debugSetRng(() => 0);
  room2.attachBomb(T);
  let warned = false;
  let boomLine = false;
  for (let i = 1; i <= 10; i++) {
    room2.debugPlace('aa', 540, 600);
    room2.debugPlace('bb', 120, 1500);
    room2.debugPlace('cc', 960, 1500);
    room2.debugPlace('dd', 540, 1560);
    for (const u of ['aa', 'bb', 'cc', 'dd']) room2.debugSetVel(u, 0, 0);
    const lines = room2.tick(T + i * 1000).map((s) => s.text);
    if (lines.some((s) => s.includes('còn ba giây'))) warned = true;
    if (lines.some((s) => s.includes('BÙM'))) boomLine = true;
  }
  ok(warned, 'bom: MC cảnh báo ở 3 giây cuối');
  ok(boomLine, 'bom: MC báo khi bom nổ');
  eq(bubOf(room2, T + 10_000, 'aa'), undefined, 'bom: hết giờ, bong bóng ôm bom nổ');
  eq(room2.view(T + 10_000).totals.pops, 1, 'bom: tổng nổ của buổi = 1');
  eq(room2.view(T + 10_000).board.find((b) => b.username === 'bb')?.pops ?? 0, 0, 'bom: không ai được điểm từ vụ nổ bom');
  ok(room2.view(T + 10_000).pool.some((e) => e.username === 'aa'), 'bom: nạn nhân bom vẫn vào hồ người vỡ');

  const room3 = new BubblesRoom(T, mulberry32(30));
  room3.tick(T + 100); // chỉ có bot
  room3.attachBomb(T + 100);
  eq(room3.view(T + 100).bomb, null, 'bom: không bao giờ gắn vào bot');
}

// ---------- 16. MỤC TIÊU: chấm theo bong bóng to nhất, hạ mục tiêu được x2, mục tiêu đổi khi chấm lại ----------
{
  const room = new BubblesRoom(T, mulberry32(31));
  room.chat(person('anhA'), 'x', T);
  room.chat(person('chiB'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetGrowth('anhA', 2.0);
  room.tick(T + 100);
  eq(room.view(T + 100).bountyUser, 'anhA', 'mục tiêu: bong bóng to nhất được đánh dấu');
  eq(bubOf(room, T + 100, 'anhA')?.bounty, true, 'mục tiêu: cờ bounty hiện trên bong bóng đó');
  room.debugSetGrowth('chiB', 2.05);
  room.tick(T + 200);
  eq(room.view(T + 200).bountyUser, 'anhA', 'mục tiêu: chưa tới kỳ chấm lại (15s) thì chưa đổi');
  room.debugSetRng(() => 0.99); // tắt vỡ hiếm
  room.debugSetGrowth('chiB', 2.2);
  hit(room, 'chiB', 'anhA', T + 1000);
  hit(room, 'chiB', 'anhA', T + 1500);
  hit(room, 'chiB', 'anhA', T + 2000);
  eq(bubOf(room, T + 2120, 'anhA'), undefined, 'mục tiêu: bị hạ sau 3 nứt');
  eq(room.view(T + 2120).board.find((b) => b.username === 'chiB')?.pops, 2, 'mục tiêu: hạ đúng mục tiêu được điểm đôi');
  room.tick(T + 3000);
  eq(room.view(T + 3000).bountyUser, 'chiB', 'mục tiêu: mục tiêu cũ nổ -> chấm lại ngay, đổi sang người to nhất còn lại');
}

// ---------- 17. CHỒNG ĐIỂM: vàng x2 + vỡ hiếm x2 + mục tiêu x2 vẫn bị chặn ở x4 ----------
{
  const room = new BubblesRoom(T, mulberry32(32));
  room.chat(person('anhA'), 'x', T);
  room.chat(person('chiB'), 'x', T);
  room.chat(person('khach1'), 'x', T);
  room.chat(person('khach2'), 'x', T);
  room.debugSetGrowth('anhA', 2.0);
  room.tick(T + 100); // chấm mục tiêu: anhA
  eq(room.view(T + 100).bountyUser, 'anhA', 'chồng điểm: mục tiêu là anhA');
  room.debugSetGrowth('chiB', 2.2);
  room.debugSetRng(queueRng([0.3])); // forceGolden chọn người thứ 2 = chiB
  room.forceGolden(T + 200);
  eq(bubOf(room, T + 200, 'chiB')?.golden, true, 'chồng điểm: chiB đang vàng');
  room.debugSetRng(queueRng([0.05, 0.1])); // vỡ hiếm, biến thể mưa cá
  hit(room, 'chiB', 'anhA', T + 1000);
  hit(room, 'chiB', 'anhA', T + 1500);
  hit(room, 'chiB', 'anhA', T + 2000);
  eq(room.view(T + 2120).board.find((b) => b.username === 'chiB')?.pops, 4, 'chồng điểm: x2 x2 x2 bị chặn ở x4');
  eq(room.view(T + 2120).pool.find((e) => e.username === 'anhA')?.rare, 'fish', 'chồng điểm: vẫn ghi nhận vỡ hiếm mưa cá');
}

if (failures) {
  console.log(`bubbles.check: ${failures} ca TRƯỢT`);
  process.exit(1);
}
console.log('bubbles.check: TẤT CẢ ĐẠT');
