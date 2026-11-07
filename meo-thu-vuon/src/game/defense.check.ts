// Kiểm tra engine Mèo Thủ Vườn: npx tsx src/game/defense.check.ts
import assert from 'node:assert/strict';
import { DefenseRoom, DEF_INFO } from './defense';
import { GAME } from './config';

let fails = 0;
const ok = (cond: boolean, label: string) => {
  if (!cond) {
    fails++;
    console.error('FAIL:', label);
  } else console.log('ok:', label);
};
const cyc = (arr: number[]) => {
  let i = 0;
  return () => arr[i++ % arr.length];
};
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const run = (room: DefenseRoom, from: number, ms: number, step = 100) => {
  let t = from;
  while (t < from + ms) {
    t += step;
    room.tick(t);
  }
  return t;
};

// ---------- trồng cây: tốn nắng chung, 1 ô 1 cây, làn đầy thì thôi ----------
{
  const room = new DefenseRoom(0, cyc([0.1, 0.5, 0.9]));
  room.newSession(0);
  room.sun = 1000;
  const lines = room.chat({ ...who(1), comment: '3' }, 100);
  ok(room.defenders.length === 1 && room.defenders[0].lane === 2, 'gõ "3" trồng vào làn 3');
  ok(room.sun === 1000 - DEF_INFO[room.defenders[0].kind].cost, 'trừ đúng giá hậu vệ đang cầm');
  ok(lines.length === 1, 'có câu MC khi trồng');
  const sunBefore = room.sun;
  room.sun = 10;
  room.chat({ ...who(2), comment: '1' }, 200);
  ok(room.sun === 10 && room.defenders.length === 1, 'không đủ nắng thì không trồng, không trừ');
  room.sun = sunBefore;
}

// ---------- hoa đèn sinh nắng + nắng trời ----------
{
  const room = new DefenseRoom(0, cyc([0.2]));
  room.newSession(0);
  room.sun = 500;
  // ép offer về hoa đèn bằng cách trồng tới khi gặp
  let t = 100;
  for (let k = 0; k < 10 && !room.defenders.some((d) => d.kind === 'den'); k++) {
    room.chat({ ...who(1), comment: '2' }, t);
    room.offerEndsAt = t; // ép đổi offer ngay
    t += 100;
    room.tick(t);
  }
  ok(room.defenders.some((d) => d.kind === 'den'), 'trồng được Hoa Đèn Lồng');
  const s0 = room.sun;
  t = run(room, t, 7500);
  ok(room.sun > s0, 'hoa đèn + nắng trời làm bể nắng tăng theo thời gian');
}

// ---------- bắn hạ chuột, tính sát thương cho chủ cây ----------
{
  const room = new DefenseRoom(0, cyc([0.0, 0.99]));
  room.newSession(0);
  room.sun = 999;
  // trồng mèo len ở làn 1 (offer đầu tiên là len)
  room.chat({ ...who(7), comment: '1' }, 100);
  ok(room.defenders[0]?.kind === 'len', 'offer đầu là Mèo Bắn Len');
  room.phase = 'wave';
  room.wave = 1; // đợt 1: hệ số máu chuột = 1 (đợt 0 chỉ là lúc chờ mở màn)
  (room as any).spawnRat('trum', 4); // mồi nhử bất tử ở làn 5: giữ pha wave, không cho tự sang đợt mới
  room.rats[0].hp = 1e9;
  room.rats[0].x = 6.4;
  (room as any).spawnRat('xam', 0);
  room.rats[1].x = 2.4;
  run(room, 100, 16000);
  ok(room.rats.filter((r) => r.lane === 0).length === 0, 'mèo len bắn hạ được chuột xám');
  const hero = room.top(1)[0];
  ok(!!hero && hero.p.username === 'u7' && hero.kills >= 1 && hero.dmg >= 100, 'sát thương + hạ gục tính cho chủ cây');
  room.rats = [];
  room.tick(20000);
  ok(room.view(20000).phase === 'rest', 'dọn sạch đợt -> về pha nghỉ');
}

// ---------- chuột cắn đổ chậu đá, chó gác cứu làn, mất tim nhà, thua ván ----------
{
  const room = new DefenseRoom(0, cyc([0.3]));
  room.newSession(0);
  room.sun = 999;
  // trồng chậu đá: quay offer tới 'chau'
  let t = 100;
  for (let k = 0; k < 12 && !room.defenders.some((d) => d.kind === 'chau'); k++) {
    room.chat({ ...who(1), comment: '4' }, t);
    room.offerEndsAt = t;
    t += 100;
    room.tick(t);
  }
  const wall = room.defenders.find((d) => d.kind === 'chau');
  ok(!!wall && wall.lane === 3, 'trồng được Chậu Đá ở làn 4');
  room.defenders = room.defenders.filter((d) => d.kind === 'chau'); // bỏ hậu vệ khác: test thuần cú cắn vào tường
  room.phase = 'wave';
  (room as any).spawnRat('trum', 0); // mồi nhử làn 1: giữ pha wave ổn định suốt test
  room.rats[0].hp = 1e9;
  room.rats[0].x = 6.4;
  (room as any).spawnRat('xam', 3);
  room.rats[1].x = wall!.col + 0.9;
  t = run(room, t, 45000);
  ok(!room.defenders.some((d) => d.kind === 'chau'), 'chuột cắn đổ được chậu đá theo thời gian');
  // chó gác: thả chuột vào làn trống 5, cho chạy xuyên về nhà
  (room as any).spawnRat('xam', 4);
  room.rats[room.rats.length - 1].x = 0.1;
  const hpBefore = room.houseHp;
  t = run(room, t, 4000);
  ok(room.dogs[4] === false && room.houseHp === hpBefore, 'chó gác cứu làn 5: nhà không mất tim, chó đã dùng');
  // làn 5 hết chó: chuột vào nhà trừ tim
  (room as any).spawnRat('xam', 4);
  room.rats[room.rats.length - 1].x = 0.1;
  t = run(room, t, 4000);
  ok(room.houseHp === hpBefore - 1, 'hết chó: chuột vào nhà trừ 1 tim');
  // ép nhà còn 1 tim rồi cho chuột vào -> thua
  room.houseHp = 1;
  (room as any).spawnRat('xam', 4);
  room.rats[room.rats.length - 1].x = 0.1;
  t = run(room, t, 4000);
  ok(room.view(t).phase === 'over', 'mất tim cuối -> thua ván');
  t = run(room, t, GAME.overSec * 1000 + 1000);
  ok(room.view(t).phase === 'rest' && room.houseHp === GAME.houseHp, 'hết giờ tổng kết -> ván mới, nhà hồi đầy tim');
}

// ---------- đợt 5 có trùm; tim đủ mốc -> mưa nắng; follow tặng nắng chung ----------
{
  const room = new DefenseRoom(0, cyc([0.42, 0.11, 0.77]));
  room.newSession(0);
  room.wave = 4;
  room.phase = 'rest';
  room.phaseEndsAt = 100;
  room.tick(200);
  ok(room.wave === 5, 'sang đợt 5');
  ok((room as any).spawnQueue.some((s: any) => s.kind === 'trum'), 'đợt 5 có Chuột Trùm trong hàng chờ');
  const s0 = room.sun;
  room.like(GAME.likeGoal - 1, 300);
  ok(room.sun === s0, 'chưa đủ mốc tim thì chưa mưa nắng');
  room.like(1, 400);
  ok(room.sun === s0 + GAME.likeSun, 'đủ 120 tim -> mưa nắng +75 cho cả vườn');
  const s1 = room.sun;
  room.follow(who(9), 500);
  ok(room.sun === s1 + GAME.followSun, 'follow mới tặng cả vườn 50 nắng');
}

console.log(fails === 0 ? 'DEFENSE CHECK PASS' : `DEFENSE CHECK FAIL x${fails}`);
process.exit(fails ? 1 : 0);
