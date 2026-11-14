// Kiểm chứng engine Đấu Trường Mèo: thả mèo, sức mạnh kiếm bằng chat, tim hồi
// máu mèo của chính chủ, công thức va chạm, hạ gục, boss + đập sân, kết vòng,
// bot sưởi sân. Chạy: npm run check.
import { ArenaRoom, hitDamage, type Person } from './arena';

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

// RNG tất định để test lặp lại được
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
const catOf = (room: ArenaRoom, now: number, username: string) => room.view(now).cats.find((c) => c.username === username);
const stopAll = (room: ArenaRoom, now: number) => {
  for (const c of room.view(now).cats) room.debugStop(c.username);
};

// ---------- 1. Comment đầu tiên thả đúng 1 mèo cho mỗi người ----------
{
  const room = new ArenaRoom(T, mulberry32(1));
  room.chat(person('anhA'), 'chào', T);
  eq(room.view(T).cats.filter((c) => c.username === 'anhA').length, 1, 'comment đầu thả đúng 1 mèo');
  room.chat(person('anhA'), 'nữa nè', T);
  eq(room.view(T).cats.filter((c) => c.username === 'anhA').length, 1, 'comment tiếp không thả thêm mèo');
  eq(catOf(room, T, 'anhA')?.power, 11, 'comment tiếp của chính chủ: +1 sức mạnh');
  room.chat(person('chiB'), 'meo', T);
  eq(room.view(T).cats.length, 2, 'người khác comment: thêm mèo của người đó');
}

// ---------- 2. Sức mạnh chat có trần +30/vòng ----------
{
  const room = new ArenaRoom(T, mulberry32(2));
  room.chat(person('anhA'), 'vào sân', T);
  for (let i = 0; i < 45; i++) room.chat(person('anhA'), `chat ${i}`, T);
  eq(catOf(room, T, 'anhA')?.power, 40, 'sức mạnh = 10 gốc + tối đa 30 từ chat');
}

// ---------- 3. Tim chỉ hồi mèo của chính người thả, trần 100, gộp lượt ----------
{
  const room = new ArenaRoom(T, mulberry32(3));
  room.chat(person('anhA'), 'a', T);
  room.chat(person('chiB'), 'b', T);
  room.debugSetHp('anhA', 50);
  room.debugSetHp('chiB', 60);
  room.like(person('chiB'), 5, T);
  eq(catOf(room, T, 'chiB')?.hp, 62, 'tim của B hồi +2 cho mèo của B');
  eq(catOf(room, T, 'anhA')?.hp, 50, 'tim của B KHÔNG hồi cho mèo của A');
  room.like(person('nguoiC'), 10, T); // C không có mèo
  eq(catOf(room, T, 'anhA')?.hp, 50, 'người không có mèo thả tim: không ai được hồi (A)');
  eq(catOf(room, T, 'chiB')?.hp, 62, 'người không có mèo thả tim: không ai được hồi (B)');
  room.like(person('anhA'), 1, T);
  eq(catOf(room, T, 'anhA')?.hp, 52, 'tim của A hồi +2 cho mèo của A');
  room.like(person('anhA'), 1, T);
  eq(catOf(room, T, 'anhA')?.hp, 52, 'tim dồn dập bị gộp lượt: không hồi thêm trong cùng nhịp');
  room.like(person('anhA'), 1, T + 2100);
  eq(catOf(room, T, 'anhA')?.hp, 54, 'qua nhịp gộp mới hồi tiếp +2');
  room.debugSetHp('anhA', 99);
  room.like(person('anhA'), 1, T + 4200);
  eq(catOf(room, T, 'anhA')?.hp, 100, 'hồi máu trần 100');
}

// ---------- 4. Công thức sát thương va chạm (kèm sàn tối thiểu) ----------
{
  eq(hitDamage(20, 10), 14, 'công thức: 4 + chênh lệch sức mạnh');
  eq(hitDamage(10, 10), 4, 'ngang sức mạnh: 4');
  eq(hitDamage(10, 30), 2, 'yếu hơn hẳn: sàn tối thiểu 2');

  const room = new ArenaRoom(T, mulberry32(4));
  room.chat(person('manh'), 'vào', T);
  for (let i = 0; i < 10; i++) room.chat(person('manh'), 'chat', T); // sức mạnh 20
  room.chat(person('yeu'), 'vào', T); // sức mạnh 10
  stopAll(room, T);
  room.debugPlace('manh', 400, 900);
  room.debugPlace('yeu', 450, 900);
  room.tick(T + 120);
  eq(catOf(room, T + 120, 'yeu')?.hp, 86, 'va chạm: kẻ yếu mất 4 + (20-10) = 14 HP');
  eq(catOf(room, T + 120, 'manh')?.hp, 100, 'va chạm: kẻ mạnh không mất HP');

  const room2 = new ArenaRoom(T, mulberry32(5));
  room2.chat(person('a1'), 'x', T);
  room2.chat(person('a2'), 'x', T);
  stopAll(room2, T);
  room2.debugPlace('a1', 400, 900);
  room2.debugPlace('a2', 450, 900);
  room2.tick(T + 120);
  eq(catOf(room2, T + 120, 'a1')?.hp, 96, 'ngang sức mạnh: cả hai cùng mất 4 (a1)');
  eq(catOf(room2, T + 120, 'a2')?.hp, 96, 'ngang sức mạnh: cả hai cùng mất 4 (a2)');
}

// ---------- 5. Hạ gục: mèo bị loại, người hạ được ghi công + sức mạnh ----------
{
  const room = new ArenaRoom(T, mulberry32(6));
  room.chat(person('sathu'), 'vào', T);
  for (let i = 0; i < 30; i++) room.chat(person('sathu'), 'chat', T); // sức mạnh 40
  room.chat(person('nannhan'), 'vào', T);
  stopAll(room, T);
  room.debugSetHp('nannhan', 5);
  room.debugPlace('sathu', 400, 900);
  room.debugPlace('nannhan', 450, 900);
  room.tick(T + 120);
  eq(catOf(room, T + 120, 'nannhan')?.alive, false, 'mèo tụt về 0 HP bị loại khỏi sân');
  eq(catOf(room, T + 120, 'sathu')?.power, 42, 'hạ 1 mèo: +2 sức mạnh');
  eq(room.view(T + 120).board.find((b) => b.username === 'sathu')?.kos, 1, 'bảng điểm ghi 1 lần hạ gục cho người hạ');
  room.chat(person('nannhan'), 'cho mình vào lại', T + 130);
  eq(room.view(T + 130).cats.filter((c) => c.username === 'nannhan' && c.alive).length, 0, 'đã bị hạ thì chưa vào lại ngay trong vòng');
}

// ---------- 6. Máu boss tỉ lệ theo số mèo đang sống ----------
{
  const room = new ArenaRoom(T, mulberry32(7));
  for (const u of ['u1', 'u2', 'u3', 'u4']) room.chat(person(u), 'x', T);
  room.triggerBoss(T);
  eq(room.view(T).boss?.maxHp, 500, 'boss: 300 + 50 x 4 mèo sống = 500 HP');

  const room2 = new ArenaRoom(T, mulberry32(8));
  for (const u of ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8']) room2.chat(person(u), 'x', T);
  room2.triggerBoss(T);
  eq(room2.view(T).boss?.maxHp, 700, 'boss: 300 + 50 x 8 mèo sống = 700 HP');
}

// ---------- 7. Boss quá giờ: đập sân loại đúng 3 mèo yếu nhất ----------
{
  const room = new ArenaRoom(T, mulberry32(9));
  const users = ['m1', 'm2', 'm3', 'm4', 'm5'];
  for (const u of users) room.chat(person(u), 'x', T);
  stopAll(room, T);
  const spots: Record<string, [number, number]> = {
    m1: [150, 600], m2: [930, 600], m3: [150, 1500], m4: [930, 1500], m5: [540, 1550],
  };
  for (const u of users) room.debugPlace(u, spots[u][0], spots[u][1]);
  room.debugSetHp('m1', 95);
  room.debugSetHp('m2', 80);
  room.debugSetHp('m3', 60);
  room.debugSetHp('m4', 20);
  room.debugSetHp('m5', 5);
  room.triggerBoss(T);
  room.tick(T + 61_000);
  const v = room.view(T + 61_000);
  eq(v.boss, null, 'quá 60 giây: boss rời sân');
  eq(v.cats.filter((c) => !c.alive).length, 3, 'đập sân loại đúng 3 mèo');
  eq(catOf(room, T + 61_000, 'm5')?.alive, false, 'mèo yếu nhất (5 HP) bị loại');
  eq(catOf(room, T + 61_000, 'm4')?.alive, false, 'mèo yếu nhì (20 HP) bị loại');
  eq(catOf(room, T + 61_000, 'm3')?.alive, false, 'mèo yếu ba (60 HP) bị loại');
  eq(catOf(room, T + 61_000, 'm1')?.alive, true, 'mèo khoẻ nhất (95 HP) trụ lại');
  eq(catOf(room, T + 61_000, 'm2')?.alive, true, 'mèo khoẻ nhì (80 HP) trụ lại');
  eq(v.phase, 'battle', 'còn 2 mèo người thật: vòng đấu tiếp tục');
}

// ---------- 8. Kết vòng khi còn tối đa 1 mèo: người thật thắng, bot không bao giờ thắng ----------
{
  const room = new ArenaRoom(T, mulberry32(10));
  room.chat(person('vua'), 'vào', T);
  for (let i = 0; i < 30; i++) room.chat(person('vua'), 'chat', T);
  room.chat(person('b1'), 'x', T);
  room.chat(person('b2'), 'x', T);
  stopAll(room, T);
  room.debugSetHp('b1', 5);
  room.debugSetHp('b2', 5);
  room.debugPlace('vua', 400, 900);
  room.debugPlace('b1', 450, 900);
  room.tick(T + 150);
  eq(catOf(room, T + 150, 'b1')?.alive, false, 'b1 bị hạ');
  room.debugPlace('vua', 700, 1200);
  room.debugPlace('b2', 750, 1200);
  room.debugStop('vua');
  room.debugStop('b2');
  room.tick(T + 300);
  const v = room.view(T + 300);
  eq(v.phase, 'intermission', 'còn 1 mèo người thật: kết vòng, sang giờ nghỉ');
  eq(v.board.find((b) => b.username === 'vua')?.wins, 1, 'người trụ lại được +1 điểm thắng');
  eq(v.lastWinner, 'vua', 'MC/bảng ghi tên người thắng vòng');
  room.tick(T + 300 + 10_500);
  eq(room.view(T + 300 + 10_500).phase, 'battle', 'sau 10 giây nghỉ: vòng mới tự bắt đầu');
  eq(room.view(T + 300 + 10_500).round, 2, 'số vòng tăng lên 2');
}

// Hoà khi không còn mèo người thật nào (cả 3 bị boss đập sân cùng lúc)
{
  const room = new ArenaRoom(T, mulberry32(11));
  for (const u of ['h1', 'h2', 'h3']) room.chat(person(u), 'x', T);
  stopAll(room, T);
  room.debugPlace('h1', 150, 600);
  room.debugPlace('h2', 930, 600);
  room.debugPlace('h3', 150, 1500);
  room.triggerBoss(T);
  room.tick(T + 61_000);
  const v = room.view(T + 61_000);
  eq(v.phase, 'intermission', 'không còn mèo người thật: vòng kết thúc');
  eq(v.board.every((b) => b.wins === 0), true, 'không ai được điểm thắng vòng hoà');
  eq(v.lastWinner, null, 'vòng hoà: không có người thắng (bot cũng không thắng)');
}

// Sân chỉ có bot thì không bao giờ tự kết vòng
{
  const room = new ArenaRoom(T, mulberry32(12));
  for (let i = 0; i < 30; i++) room.tick(T + (i + 1) * 1000);
  eq(room.view(T + 30_000).phase, 'battle', 'chỉ có bot: vòng không tự kết thúc');
  eq(room.view(T + 30_000).round, 1, 'chỉ có bot: vẫn vòng 1');
}

// ---------- 9. Bot sưởi sân và rút khi đủ 4 người thật ----------
{
  const room = new ArenaRoom(T, mulberry32(13));
  room.tick(T + 100);
  const filled = room.view(T + 100).cats;
  eq(filled.length, 4, 'sân trống: bot vào đủ 4 cho nhộn');
  eq(filled.every((c) => c.bot), true, 'cả 4 đều là bot (có gắn cờ bot)');
  for (const u of ['r1', 'r2', 'r3', 'r4']) room.chat(person(u), 'x', T + 110);
  room.tick(T + 200);
  const v = room.view(T + 200);
  eq(v.cats.filter((c) => c.bot).length, 0, 'đủ 4 người thật: bot rút hết');
  eq(v.cats.filter((c) => !c.bot && c.alive).length, 4, '4 mèo người thật đang đấu');
}

if (failures) {
  console.log(`arena.check: ${failures} ca TRƯỢT`);
  process.exit(1);
}
console.log('arena.check: TẤT CẢ ĐẠT');
