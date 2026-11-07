// Kiểm chứng engine Đua Xe Kart Live — chạy: npm run check
// Nhận xe bằng bình luận, lái bằng TRÁI/PHẢI, kỹ năng bằng nitro tự kiếm,
// tim/quà tác động thẳng vào xe người gửi THEO ĐẶC TẢ user chốt 2026-11-07.
import { KartRoom, colorFor, type Person } from './kart';
import { GAME } from './config';

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

ok(colorFor('abc') === colorFor('abc') && colorFor('abc') >= 0 && colorFor('abc') < 24, 'màu xe chọn theo tài khoản, ổn định');

{
  const r = new KartRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  const step = (ms: number) => {
    now += ms;
    r.tick(now);
  };
  const view = () => r.view(now);
  const kart = (u: string) => view().racers.find((x) => x.username === u)!;

  // ——— 1 mình: chưa xuất phát ———
  r.chat({ ...P('solo', 'Một Mình'), comment: 'xin đua' }, now);
  step(GAME.lobbySec * 1000 + 1000);
  ok(view().phase === 'lobby', 'mới 1 tay đua: vẫn chờ ở vạch xuất phát');

  // ——— đủ 2 xe: đếm ngược rồi xuất phát ———
  r.chat({ ...P('hai', 'Bạn Hai'), comment: 'tôi nữa' }, now);
  step(1000); // 1 tick để phòng rút ngắn thời gian chờ xuống tối đa 8s
  step(8100);
  ok(view().phase === 'countdown', 'đủ 2 tay đua: vào đếm ngược');
  step(GAME.countdownSec * 1000 + 100);
  ok(view().phase === 'race' && view().raceNo === 1 && view().racerCount === 2, 'chặng 1 xuất phát với 2 xe');

  // ——— đổi làn bằng bình luận ———
  const lane0 = kart('solo').lane;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'trái' }, now);
  ok(kart('solo').lane === Math.max(-1, lane0 - 1), 'gõ TRÁI: xe lách sang trái');
  r.chat({ ...P('solo', 'Một Mình'), comment: 'phải nè' }, now);
  ok(kart('solo').lane === Math.max(-1, lane0 - 1), 'đổi làn liên tục bị khóa nhịp 900ms');
  step(1000);
  r.chat({ ...P('solo', 'Một Mình'), comment: 'phải' }, now);
  ok(kart('solo').lane === lane0, 'sau 900ms: gõ PHẢI lách về được');

  // ——— nitro đầy dần khi lái; chưa đầy thì gõ NITRO không ăn ———
  const anyRoom = r as unknown as { karts: Map<string, { nitro: number; dist: number }> };
  anyRoom.karts.get('solo')!.nitro = 50;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'nitro' }, now);
  ok(kart('solo').nitro === 50 && !kart('solo').boosting, 'nitro chưa đầy: gõ NITRO không tốn, không bốc');
  anyRoom.karts.get('solo')!.nitro = 100;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'NITRO' }, now);
  ok(kart('solo').nitro === 0 && kart('solo').boosting, 'đầy thanh: NITRO bốc tốc, thanh về 0');

  // ——— ĐẠN: bắn xe ngay trước mặt; KHIÊN đỡ được ———
  anyRoom.karts.get('hai')!.dist = kart('solo').dist + 30; // hai ở trước solo 30m
  anyRoom.karts.get('hai')!.nitro = 100;
  r.chat({ ...P('hai', 'Bạn Hai'), comment: 'khiên' }, now);
  ok(kart('hai').shielded && kart('hai').nitro === 0, 'KHIÊN dựng khiên, tốn trọn thanh');
  anyRoom.karts.get('solo')!.nitro = 100;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'đạn' }, now);
  ok(!kart('hai').shielded && !kart('hai').slowed, 'đạn trúng khiên: khiên vỡ, xe không chậm');
  anyRoom.karts.get('solo')!.nitro = 100;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'đạn' }, now);
  ok(kart('hai').slowed, 'không khiên: trúng đạn là chậm lại');
  // ngoài tầm đạn thì giữ nitro
  anyRoom.karts.get('hai')!.dist = kart('solo').dist + 200;
  anyRoom.karts.get('solo')!.nitro = 100;
  r.chat({ ...P('solo', 'Một Mình'), comment: 'đạn' }, now);
  ok(kart('solo').nitro === 100, 'xe trước ngoài 45m: không bắn, giữ nguyên nitro');

  // ——— tim THEO ĐẶC TẢ: nạp cho xe của NGƯỜI THẢ ———
  const nitroHaiBefore = kart('hai').nitro;
  anyRoom.karts.get('solo')!.nitro = 10;
  r.like(P('solo', 'Một Mình'), 50, now);
  ok(kart('solo').nitro === 50, 'thả 50 tim: nitro xe mình +40 (50 x 0,8)');
  ok(kart('solo').boosting, 'thả tim: xe tăng tốc nhẹ ngay (cheer)');
  ok(kart('hai').nitro === nitroHaiBefore, 'tim của người khác không nạp cho xe mình');
  ok(view().totalLikes === 50, 'tổng tim của phòng được đếm');

  // ——— VÀO GIỮA CHẶNG: nhận xe sau đoàn cuối ———
  const minDist = Math.min(...view().racers.map((x) => x.dist));
  r.chat({ ...P('muon', 'Bạn Muộn'), comment: 'cho đua với' }, now);
  ok(kart('muon').dist <= minDist && view().racerCount === 3, 'vào giữa chặng: xuất phát sau đoàn, vẫn đua được');

  // ——— QUÀ THEO ĐẶC TẢ: bốc tốc / chơi xấu / siêu tốc ———
  anyRoom.karts.get('solo')!.dist = kart('hai').dist + 500; // solo bỏ xa, không dính chơi xấu
  r.gift(P('hai', 'Bạn Hai'), 10, now);
  ok(kart('hai').boosting, 'quà nhỏ 10 xu: xe bốc tốc');
  anyRoom.karts.get('muon')!.dist = kart('hai').dist + 30; // muon (đã vào đua ở bước trước) ở ngay trước hai 30m
  r.gift(P('hai', 'Bạn Hai'), 50, now);
  ok(kart('muon').slowed, 'quà 50 xu: xe ngay phía trước bị làm chậm (chơi xấu)');
  ok(view().supporters[0]?.nickname === 'Bạn Hai' && view().supporters[0].coins === 60, 'người ủng hộ lên bảng vinh danh (10+50 xu)');
  r.gift(P('hai', 'Bạn Hai'), 299, now);
  const haiVip = kart('hai');
  ok(haiVip.nitro === 100 && haiVip.aura && haiVip.auraVip && haiVip.boosting, 'quà VIP 299 xu: đầy nitro + hào quang + siêu tốc');

  // ——— đua tới đích: có vô địch, có điểm, qua bục vinh quang rồi về sảnh ———
  let guard = 0;
  while (view().phase !== 'podium' && guard++ < 400) step(1000);
  ok(view().phase === 'podium', 'đua hết giờ/chạm đích: lên bục vinh quang');
  ok(view().podium?.top.length === 3 && view().top.length > 0, 'bục có top 3, bảng Vua Đường Đua có điểm');
  ok(view().totals.races === 1, 'đã tính 1 chặng');
  step(GAME.podiumSec * 1000 + 200);
  ok(view().phase === 'lobby', 'hết bục: về sảnh chờ chặng mới');

  // ——— demo cho trang điều khiển ———
  const saysDemo = r.demoRace(now);
  step(500);
  ok(view().racerCount >= 7 && saysDemo.length >= 0, 'demo: 7 bot vào đua được');
}

if (fails === 0) console.log('KART CHECK: tất cả đạt ✔');
else {
  console.error(`KART CHECK: ${fails} lỗi`);
  process.exit(1);
}
