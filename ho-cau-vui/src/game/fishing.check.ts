// Kiểm chứng engine câu cá: npx tsx src/game/fishing.check.ts
import { FishingRoom, rollSpecies, rollWeight, SPECIES } from './fishing';

let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fails++;
    console.error('SAI:', msg);
  }
};

// RNG xác định để kiểm chứng lặp lại được
let seed = 42;
const rng = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

// --- quay loài & cân nặng ---
ok(rollSpecies(() => 0).name === 'Cá rô phi', 'rng 0 -> rô phi');
ok(rollSpecies(() => 0.9999).name === 'Cá hô', 'rng ~1 -> cá hô');
for (const sp of SPECIES) {
  ok(rollWeight(sp, () => 0) === sp.min, `${sp.name} nặng tối thiểu`);
  const wMax = rollWeight(sp, () => 0.99999);
  ok(wMax <= sp.max && wMax > sp.min, `${sp.name} nặng trong khoảng`);
}
// phân phối: cá thường phải áp đảo cá hiếm
{
  let rare = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) if (rollSpecies(rng).rare) rare++;
  ok(rare / n < 0.03, `tỉ lệ cá hiếm ${(rare / n).toFixed(3)} < 3%`);
}

// --- engine ---
const t0 = 1_000_000;
const room = new FishingRoom(t0, rng);
room.newSession(t0);
const p1 = { username: 'u1', nickname: 'An', spoken: 'An', avatar: '' };
const p2 = { username: 'u2', nickname: 'Bình', spoken: 'Bình', avatar: '' };
const p3 = { username: 'u3', nickname: 'Cúc', spoken: 'Cúc', avatar: '' };

room.chat({ ...p1, comment: 'câu' }, t0);
room.chat({ ...p2, comment: 'cho mình câu với' }, t0);
room.join(p3, t0);
let v = room.view(t0);
ok(v.anglerCount === 3, '3 cần thủ xuống hồ');
ok(v.lastJoin?.nickname === 'Bình', 'banner xuống hồ cho người gõ câu mới nhất');

// mô phỏng 10 phút: cá phải cắn, điểm phải khớp
let now = t0;
const lines: string[] = [];
for (let s = 0; s < 600; s++) {
  now += 1000;
  for (const l of room.tick(now)) lines.push(l.text);
}
v = room.view(now);
ok(v.totalFish > 10, `cá cắn đều (được ${v.totalFish} con)`);
const sumTop = v.top.reduce((s, t) => s + t.totalKg, 0);
ok(Math.abs(sumTop - v.totalKg) < 0.11, 'tổng kg bảng xếp hạng khớp tổng hồ');
ok(lines.some((t) => t.includes('Vương miện')), 'có trao vương miện khi hết vòng');
ok(v.anglers.some((a) => a.crown), 'có cần thủ đội vương miện');

// tim đủ 1000 -> cắn liên tục
room.like(1000, now);
ok(room.view(now).golden, '1000 tim -> cá cắn liên tục');

// ống kính chúc mừng: cá nhỏ không lên, cá hiếm/quá to thì lên
{
  const r2 = new FishingRoom(t0, () => 0); // rô phi 0,3 kg
  r2.newSession(t0);
  r2.join(p1, t0);
  r2.tick(t0 + 60_000);
  ok(!r2.view(t0 + 60_000).spotlight, 'cá nhỏ không lên ống kính');
  const r3 = new FishingRoom(t0, () => 0.9999); // cá hô 80 kg
  r3.newSession(t0);
  r3.join(p1, t0);
  r3.tick(t0 + 60_000);
  const sp = r3.view(t0 + 60_000).spotlight;
  ok(!!sp && sp.fish === 'Cá hô' && sp.nickname === 'An', 'cá hô -> ống kính chúc mừng hiện đúng người');
  const before = r3.view(t0 + 60_000).totalKg;
  r3.demoSpotlight(t0 + 60_000);
  ok(r3.view(t0 + 60_000).totalKg === before, 'xem thử chúc mừng không cộng điểm');
}

// lệnh GIẬT khi cá sắp cắn -> lên cá ngay + popup; THẢ MỒI -> cá cắn trong 3s; GIẬT bừa -> hụt
{
  const rj = new FishingRoom(t0, () => 0); // phao cắn ở giây thứ 4
  rj.newSession(t0);
  rj.chat({ ...p1, comment: 'câu' }, t0);
  rj.chat({ ...p1, comment: 'giật' }, t0 + 500);
  let vv = rj.view(t0 + 500);
  ok(vv.totalFish === 1 && vv.anglers[0].popup?.kind === 'catch', 'giật khi sắp cắn -> lên cá + popup');
  rj.chat({ ...p1, comment: 'giật' }, t0 + 800);
  ok(rj.view(t0 + 800).totalFish === 1, 'giật trong lúc nguội 6s không ăn thêm');

  const rb = new FishingRoom(t0, () => 0.99); // phao cắn ở ~giây 12
  rb.newSession(t0);
  rb.chat({ ...p1, comment: 'câu' }, t0);
  rb.chat({ ...p1, comment: 'giật' }, t0 + 100);
  ok(rb.view(t0 + 100).anglers[0].popup?.kind === 'miss', 'giật bừa lúc cá chưa cắn -> hụt');
  rb.chat({ ...p1, comment: 'thả mồi' }, t0 + 200);
  rb.tick(t0 + 3400);
  ok(rb.view(t0 + 3400).totalFish === 1, 'thả mồi -> cá cắn trong ~3 giây');
}

if (fails) {
  console.error(`fishing.check: ${fails} lỗi`);
  process.exit(1);
}
console.log('fishing.check: tất cả đều đúng');
