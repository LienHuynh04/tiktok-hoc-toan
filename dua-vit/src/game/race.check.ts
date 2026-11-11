// Kiểm chứng engine Đua Thú Siêu Tốc — chạy: npm run check
// Vào đua bằng bình luận, chưa đủ 2 người thì chưa xuất phát, khẩu lệnh bốc tốc,
// sóng lớn từ tim, đua tới bục vinh quang và tính vô địch.
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

if (fails) {
  console.error(`race.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('race.check: tất cả đều đúng');
