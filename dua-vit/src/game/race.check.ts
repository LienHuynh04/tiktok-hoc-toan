// Kiểm chứng engine Đua Vịt — chạy: npm run check
// Vào đua bằng bình luận, chưa đủ 2 người thì chưa xuất phát, khẩu lệnh bốc tốc,
// sóng lớn từ tim, đua tới bục vinh quang và tính vô địch. Thêm: sảnh chờ đủ 100 tim
// thì xuất phát ngay dù chưa đủ 6 người; bao nhiêu người vào thì bấy nhiêu vịt hiện.
import { RaceRoom, artFor, type Person } from './race';

let fails = 0;
function ok(cond: boolean, label: string) {
  if (!cond) {
    fails++;
    console.error('SAI:', label);
  }
}

const t0 = 1_000_000;
const P = (username: string, nickname = username): Person => ({ username, nickname, spoken: nickname, avatar: '' });
const cyc = (seq: number[]) => {
  let i = 0;
  return () => seq[i++ % seq.length];
};
const rng = cyc([0.13, 0.57, 0.91, 0.34, 0.78, 0.22, 0.66, 0.45]);

ok(artFor('abc') === artFor('abc') && artFor('abc') >= 0 && artFor('abc') <= 9, 'màu vịt chọn theo tài khoản, ổn định trong 0-9');

{
  const r = new RaceRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  const step = (ms: number) => {
    now += ms;
    return r.tick(now);
  };

  r.chat({ ...P('solo', 'Một Mình'), comment: 'xin đua' }, now);
  step(18000);
  ok(r.view(now).phase === 'lobby', 'mới 1 tay đua: chưa xuất phát, vẫn chờ');

  r.chat({ ...P('hai', 'Bạn Hai'), comment: 'tôi nữa' }, now);
  step(18000);
  let v = r.view(now);
  ok(v.phase === 'race' && v.raceNo === 1 && v.racerCount === 2, 'đủ 2 tay đua: chặng 1 xuất phát');

  // chạy 10 giây: cả hai đều tiến lên
  for (let i = 0; i < 40; i++) step(250);
  v = r.view(now);
  ok(v.racers.every((x) => x.distPct > 0), 'đang đua: mọi tay đua đều di chuyển');

  // đợi đợt khẩu lệnh đầu tiên (mở sau ~13s từ lúc xuất phát)
  let guard = 0;
  while (!r.view(now).event && guard++ < 80) step(250);
  const ev = r.view(now).event;
  ok(!!ev, 'có đợt khẩu lệnh tăng tốc');
  const before = r.view(now).racers.find((x) => x.username === 'solo')!;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'gõ sai nè' }, now);
  ok(r.view(now).racers.find((x) => x.username === 'solo')!.boosting === false, 'gõ sai khẩu lệnh: không bốc tốc');
  r.chat({ ...P('solo', 'Một Mình'), comment: ev!.word.toLowerCase() }, now);
  ok(r.view(now).racers.find((x) => x.username === 'solo')!.boosting === true, 'gõ đúng khẩu lệnh (không cần hoa/thường): bốc tốc');
  ok(before.distPct >= 0, 'dữ liệu tay đua hợp lệ');

  // sóng lớn
  const lines = r.like(150, now);
  ok(r.view(now).tailwind.active && lines.some((l) => l.text.includes('Sóng lớn')), 'đủ 150 tim giữa chặng: sóng lớn thổi');

  // đua tới khi lên bục
  guard = 0;
  while (r.view(now).phase !== 'podium' && guard++ < 1400) step(250);
  v = r.view(now);
  ok(v.phase === 'podium' && v.podium?.top.length === 2 && v.podium.top[0].place === 1, 'kết thúc chặng: bục vinh quang có nhất/nhì');
  ok(v.top.length >= 1 && v.top[0].totalWins === 1, 'người vô địch được tính 1 lần lên bảng Vua Tốc Độ');
  ok(v.totals.races === 1, 'đếm số chặng = 1');

  // hết bục -> về sảnh chờ chặng mới
  step(9000);
  ok(r.view(now).phase === 'lobby', 'hết bục vinh quang: về chờ chặng tiếp theo');
  const v2 = r.view(now);
  ok(v2.musicOn === true && Math.abs(v2.musicVolume - 0.9) < 1e-9, 'nhạc bật mặc định, âm lượng 0.9');
}

{
  // Sảnh chờ: 3 tay đua (chưa đủ 6) — 99 tim chưa xuất phát, tim thứ 100 xuất phát ngay
  const r = new RaceRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  const step = (ms: number) => {
    now += ms;
    return r.tick(now);
  };
  r.chat({ ...P('a1', 'Bạn An'), comment: 'đua' }, now);
  r.chat({ ...P('a2', 'Bạn Bình'), comment: 'đua' }, now);
  r.chat({ ...P('a3', 'Bạn Chi'), comment: 'đua' }, now);
  r.like(99, now);
  step(500);
  ok(r.view(now).phase === 'lobby' && r.view(now).lobbyLikes.meter === 99 && r.view(now).lobbyLikes.goal === 100, 'sảnh chờ: 99/100 tim, chưa xuất phát');
  const lines = r.like(1, now);
  step(500);
  ok(r.view(now).phase === 'race', 'đủ 100 tim với 3 tay đua (chưa đủ 6): xuất phát ngay, không chờ hết giờ chờ');
  ok(lines.some((l) => l.text.includes('100 tim')), 'MC báo tin xuất phát sớm nhờ đủ 100 tim');
  ok(r.view(now).lobbyLikes.meter === 0, 'đã xuất phát: bộ đếm tim sảnh chờ về 0 cho chặng sau');

  // nhịp nhanh: từ lúc xuất phát tới bục vinh quang không quá 80 giây giờ máy
  let raceSteps = 0;
  while (r.view(now).phase !== 'podium' && raceSteps < 400) {
    step(250);
    raceSteps++;
  }
  ok(r.view(now).phase === 'podium' && raceSteps * 0.25 <= 80, `chặng đua gọn trong ${raceSteps * 0.25}s giờ máy (mục tiêu <= 80s)`);
}

{
  // Mới 1 tay đua: tim đủ 100 vẫn phải chờ; người thứ 2 vừa vào là xuất phát ngay
  const r = new RaceRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  r.chat({ ...P('solo2', 'Một Mình'), comment: 'đua' }, now);
  r.like(150, now);
  now += 500;
  r.tick(now);
  ok(r.view(now).phase === 'lobby', 'mới 1 tay đua: đủ 100 tim vẫn chưa xuất phát');
  r.chat({ ...P('hai2', 'Bạn Hai'), comment: 'đua' }, now);
  now += 500;
  r.tick(now);
  ok(r.view(now).phase === 'race', 'người thứ 2 vào lúc tim đã đủ 100: xuất phát ngay');
}

{
  // Bao nhiêu người vào thì bấy nhiêu vịt: 30 người -> view có đủ 30 (không cắt ở 24)
  const r = new RaceRoom(t0, rng);
  r.newSession(t0);
  const now = t0;
  for (let i = 0; i < 30; i++) r.chat({ ...P('u' + i, 'Bạn ' + i), comment: 'đua' }, now);
  ok(r.view(now).racers.length === 30 && r.view(now).racerCount === 30, '30 người vào: sân khấu nhận đủ 30 vịt');
  const d = new RaceRoom(t0, rng);
  d.newSession(t0);
  d.demoRace(t0);
  ok(d.view(t0).racerCount >= 20, 'đua thử: hồ đầy vịt (>= 20 con) cho kín màn hình');
}

if (fails) {
  console.error(`race.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('race.check: tất cả đều đúng');
