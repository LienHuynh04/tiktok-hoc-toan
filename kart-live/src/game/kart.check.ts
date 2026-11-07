// Kiểm chứng engine Đua Xe Kart Live — chạy: npm run check
// ĐUA VÔ HẠN: vào lúc nào cũng có xe, chạy mãi, tính điểm theo quãng đường +
// thưởng cột mốc. Tim/quà tác động thẳng vào xe người gửi THEO ĐẶC TẢ
// user chốt 2026-11-07.
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
  const anyRoom = r as unknown as {
    karts: Map<string, { nitro: number; dist: number; lastActiveAt: number; nextPointAt: number; nextCheckpointAt: number; shieldUntil: number }>;
    hazards: unknown[];
  };

  // ——— sảnh trống: chưa ai vào thì chưa đua ———
  step(1000);
  ok(view().phase === 'lobby' && view().racerCount === 0, 'chưa có tay đua: sảnh chờ');

  // ——— 1 người vào là đua ngay (đua vô hạn không chờ đủ xe) ———
  r.chat({ ...P('solo', 'Một Mình'), comment: 'xin đua' }, now);
  step(200);
  ok(view().phase === 'race' && view().racerCount === 1, '1 tay đua vào: đường đua vô hạn bắt đầu ngay');
  r.chat({ ...P('hai', 'Bạn Hai'), comment: 'tôi nữa' }, now);
  ok(view().racerCount === 2, 'người thứ hai vào: có xe ngay giữa đường đua');

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

  // ——— VÀO GIỮA ĐƯỜNG ĐUA: xuất phát gần đoàn, có khiên làm quen ———
  const distsBefore = view().racers.map((x) => x.dist).sort((a, b) => a - b);
  const medianBefore = distsBefore[Math.floor(distsBefore.length / 2)];
  r.chat({ ...P('muon', 'Bạn Muộn'), comment: 'cho đua với' }, now);
  ok(view().racerCount === 3, 'vào giữa đường đua: có xe ngay');
  ok(kart('muon').dist <= medianBefore && kart('muon').dist >= medianBefore - GAME.spawnBehindMedianM - 1, 'xe mới xuất phát sau tay đua giữa đoàn 30m');
  ok(kart('muon').shielded, 'xe mới có khiên 3 giây làm quen đường');

  // ——— QUÀ THEO ĐẶC TẢ: bốc tốc / chơi xấu / siêu tốc ———
  anyRoom.karts.get('solo')!.dist = kart('hai').dist + 500; // solo bỏ xa, không dính chơi xấu
  r.gift(P('hai', 'Bạn Hai'), 10, now);
  ok(kart('hai').boosting, 'quà nhỏ 10 xu: xe bốc tốc');
  anyRoom.karts.get('muon')!.dist = kart('hai').dist + 30; // muon ở ngay trước hai 30m
  anyRoom.karts.get('muon')!.shieldUntil = 0; // khiên làm quen của xe mới đã hết (không thì khiên đỡ đòn chơi xấu)
  r.gift(P('hai', 'Bạn Hai'), 50, now);
  ok(kart('muon').slowed, 'quà 50 xu: xe ngay phía trước bị làm chậm (chơi xấu)');
  ok(view().supporters[0]?.nickname === 'Bạn Hai' && view().supporters[0].coins === 60, 'người ủng hộ lên bảng vinh danh (10+50 xu)');
  r.gift(P('hai', 'Bạn Hai'), 299, now);
  const haiVip = kart('hai');
  ok(haiVip.nitro === 100 && haiVip.aura && haiVip.auraVip && haiVip.boosting, 'quà VIP 299 xu: đầy nitro + hào quang + siêu tốc');

  // ——— ĐIỂM: 100m = 1 điểm, qua cột mốc 1000m dẫn đầu được +10 và 1 sao ———
  const soloK = anyRoom.karts.get('solo')!;
  soloK.dist = 990;
  soloK.nextPointAt = 1000;
  soloK.nextCheckpointAt = 1000;
  anyRoom.karts.get('hai')!.dist = 100;
  anyRoom.karts.get('muon')!.dist = 50;
  const ptsBefore = kart('solo').points;
  step(1000);
  step(1000);
  ok(kart('solo').dist >= 1000, 'solo cán qua 1000m');
  ok(kart('solo').points - ptsBefore >= 11, 'qua 1000m dẫn đầu: +1 điểm đường +10 điểm cột mốc');
  ok(kart('solo').wins === 1, 'dẫn đầu qua cột mốc: +1 sao Vua Đường Đua');
  ok(view().checkpoints >= 1 && view().top[0]?.nickname === 'Một Mình', 'bảng điểm: solo dẫn đầu sau cột mốc 1');

  // ——— ĐUA MÃI KHÔNG DỪNG: chạy qua 2,5km vẫn đang đua, chướng ngại được dọn sau đoàn ———
  let guard = 0;
  while (view().leaderDist < 2500 && guard++ < 500) step(1000);
  ok(view().phase === 'race' && view().leaderDist >= 2500, 'đua vô hạn: qua 2,5km vẫn chạy tiếp, không về đích, không bục');
  ok(view().checkpoints >= 2, 'đã qua ít nhất 2 cột mốc');
  ok(anyRoom.hazards.length < 80, 'chướng ngại phía sau đoàn được dọn, mảng không phình vô hạn');

  // ——— VẮNG LÂU THÌ RỜI ĐƯỜNG ĐUA (bot thì không) ———
  anyRoom.karts.get('hai')!.lastActiveAt = now - (GAME.idleRetireSec * 1000 + 1000);
  const countBefore = view().racerCount;
  step(200);
  ok(!view().racers.some((x) => x.username === 'hai') && view().racerCount === countBefore - 1, 'vắng quá 10 phút: xe rời đường đua');

  // ——— demo cho trang điều khiển ———
  const saysDemo = r.demoRace(now);
  step(500);
  ok(view().racerCount >= 7 && saysDemo.length >= 0, 'demo: 7 bot vào đua được');
  anyRoom.karts.get('bot_0')!.lastActiveAt = now - 999_000_000;
  step(200);
  ok(view().racers.some((x) => x.username === 'bot_0'), 'bot demo không bị rời đường đua vì vắng');
}

if (fails === 0) console.log('KART CHECK: tất cả đạt ✔');
else {
  console.error(`KART CHECK: ${fails} lỗi`);
  process.exit(1);
}
