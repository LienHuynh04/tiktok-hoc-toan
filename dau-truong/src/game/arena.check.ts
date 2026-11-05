// Kiểm chứng engine Đấu Trường Sinh Tồn — chạy: npm run check
// Vào trận bằng bình luận, đổi thế ăn/săn/trốn, vòng độc thu hẹp, mưa hồi phục,
// hỗn chiến tới người thắng cuối cùng và tính cúp vô địch.
import { ArenaRoom, artFor, type Person } from './arena';

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
const rng = cyc([0.13, 0.57, 0.91, 0.34, 0.78, 0.22, 0.66, 0.45, 0.05, 0.83]);

ok(artFor('abc') === artFor('abc') && artFor('abc') >= 0 && artFor('abc') <= 8, 'quái chọn theo tài khoản, ổn định trong 0-8');

{
  const r = new ArenaRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  const step = (ms: number) => {
    now += ms;
    return r.tick(now);
  };

  r.chat({ ...P('solo', 'Một Mình'), comment: 'vào trận' }, now);
  step(15000);
  ok(r.view(now).phase === 'lobby', 'mới 1 người đăng ký: chưa mở trận');

  for (let i = 0; i < 7; i++) r.chat({ ...P('u' + i, 'Bạn' + i), comment: 'chiến' }, now);
  step(15000);
  let v = r.view(now);
  ok(v.phase === 'battle' && v.entrantCount === 8 && v.aliveCount === 8, 'đủ người: vòng 1 mở với 8 quái');
  const r0 = v.ring.r;

  // đổi thế
  r.chat({ ...P('u0'), comment: 'ăn' }, now);
  r.chat({ ...P('u1'), comment: 'trốn' }, now);
  v = r.view(now);
  ok(v.monsters.find((m) => m.username === 'u0')?.stance === 'an', 'gõ "ăn": quái chuyển thế ăn (hồi máu)');
  ok(v.monsters.find((m) => m.username === 'u1')?.stance === 'tron', 'gõ "trốn": quái chuyển thế trốn');
  ok(v.monsters.find((m) => m.username === 'u2')?.stance === 'san', 'mặc định là thế săn');

  // mưa hồi phục có câu đọc khi đang battle
  const lines = r.like(120, now);
  ok(lines.some((l) => l.text.includes('Mưa hồi phục')) || r.view(now).heal.have === 0, 'đủ 120 tim: kích hoạt mưa hồi phục');

  // vòng độc thu hẹp theo thời gian
  for (let i = 0; i < 200; i++) step(250); // +50 giây
  ok(r.view(now).ring.r < r0, 'sau 50s: vòng độc đã thu hẹp');

  // hỗn chiến tới khi có vô địch
  let guard = 0;
  while (r.view(now).phase !== 'podium' && guard++ < 1200) step(250);
  v = r.view(now);
  ok(v.phase === 'podium' && !!v.podium?.winner, 'trận kết thúc: có vô địch sinh tồn');
  ok(v.top.length >= 1 && v.top[0].totalWins === 1, 'vô địch được tính 1 cúp lên bảng Vua Sinh Tồn');
  ok(v.totals.rounds === 1, 'đếm số vòng = 1');

  step(9000);
  ok(r.view(now).phase === 'lobby', 'hết trao cúp: về mở cổng vòng mới');
  ok(v.musicOn === true && Math.abs(v.musicVolume - 0.9) < 1e-9, 'nhạc bật mặc định, âm lượng 0.9');
}

if (fails) {
  console.error(`arena.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('arena.check: tất cả đều đúng');
