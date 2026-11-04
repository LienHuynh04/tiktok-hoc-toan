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

if (fails) {
  console.error(`fishing.check: ${fails} lỗi`);
  process.exit(1);
}
console.log('fishing.check: tất cả đều đúng');
