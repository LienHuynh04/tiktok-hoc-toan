// Kiểm chứng engine Bug Leo 1000 Bậc — chạy: npm run check
// Tất định: rng theo hàng đợi cố định + đồng hồ bước tay.
import { ClimbRoom, parseCommand, type Person } from './climb';

let fails = 0;
function ok(cond: boolean, label: string) {
  if (!cond) {
    fails++;
    console.error('SAI:', label);
  }
}

const t0 = 1_000_000;
const P = (username: string, nickname = username): Person => ({ username, nickname, spoken: nickname, avatar: '' });
/** rng lấy theo thứ tự mảng; hết mảng thì trả 0.99 (gần như không trượt/không bất ngờ). */
const seq = (vals: number[]) => {
  const q = [...vals];
  return () => (q.length ? q.shift()! : 0.99);
};
const cyc = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

// --- Phân tích lệnh (bỏ dấu, hoa/thường, dấu câu) ---
ok(parseCommand('leo') === 'LEO', 'parse: "leo" -> LEO');
ok(parseCommand('NHẢY!') === 'NHAY', 'parse: "NHẢY!" -> NHAY');
ok(parseCommand('đẩy') === 'DAY', 'parse: "đẩy" -> DAY');
ok(parseCommand('hello cả nhà') === null, 'parse: chat thường -> null');

// --- Tim: gom thành năng lượng, xả dần thành bậc thật ---
{
  const r = new ClimbRoom(t0, seq([]));
  r.newSession(t0);
  r.like(P('u1', 'Bạn Một'), 50, t0);
  ok(r.view(t0).steps === 0, 'tim: vừa thả tim chưa leo ngay (đang gom năng lượng)');
  r.tick(t0 + 1000); // xả tối đa 60 bậc/giây -> xả hết 50 trong 1 giây
  const v = r.view(t0 + 1000);
  ok(v.steps === 50, 'tim: sau 1 giây xả, Bug leo +50 bậc');
  ok(v.top[0]?.nickname === 'Bạn Một' && v.top[0]?.steps === 50, 'tim: người thả tim được ghi công 50 bậc');
}

// --- LEO: +3 bậc, mỗi người cách nhau 5 giây ---
{
  const r = new ClimbRoom(t0, seq([]));
  r.chat(P('u1'), 'LEO', t0);
  ok(r.view(t0).steps === 3, 'LEO lần 1: +3 bậc');
  r.chat(P('u1'), 'LEO', t0 + 1000);
  ok(r.view(t0 + 1000).steps === 3, 'LEO lại sau 1 giây (chưa hết chờ): không cộng');
  r.chat(P('u2'), 'LEO', t0 + 1000);
  ok(r.view(t0 + 1000).steps === 6, 'LEO của người khác: vẫn cộng');
  r.chat(P('u1'), 'LEO', t0 + 6000);
  ok(r.view(t0 + 6000).steps === 9, 'LEO sau 6 giây: cộng tiếp');
}

// --- NHẢY: vọt +8; rng thấp thì trượt −5; trượt không xuống dưới 0 ---
{
  const r = new ClimbRoom(t0, seq([0.9]));
  r.debugSetSteps(100);
  r.chat(P('u1'), 'NHẢY', t0);
  ok(r.view(t0).steps === 108, 'NHẢY (rng 0.9): vọt +8 bậc');

  const r2 = new ClimbRoom(t0, seq([0.1]));
  r2.debugSetSteps(100);
  const says = r2.chat(P('u1', 'Bạn Trượt'), 'NHẢY', t0);
  ok(r2.view(t0).steps === 95, 'NHẢY (rng 0.1 < 0.25): trượt, tụt 5 bậc');
  ok(r2.view(t0).bubble === 'TRƯỢT!', 'trượt: hiện bong bóng TRƯỢT!');
  ok(says.some((s) => s.text.includes('trượt')), 'trượt: có câu MC nhắc chuyện trượt');

  const r3 = new ClimbRoom(t0, seq([0.1]));
  r3.debugSetSteps(3);
  r3.chat(P('u1'), 'NHẢY', t0);
  ok(r3.view(t0).steps === 0, 'trượt ở bậc 3: tụt về 0, không âm');
}

// --- Chướng ngại: cuộn len húc trúng tụt 10–25 bậc; dép tụt 15; không âm ---
{
  const r = new ClimbRoom(t0, seq([0.5, 0.5, 0.5]));
  r.debugSetSteps(100);
  r.forceHazard('yarn', t0); // xuất hiện ở bậc 190, lăn xuống 16 bậc/giây
  ok(r.view(t0).hazard?.kind === 'yarn', 'cuộn len xuất hiện phía trên Bug');
  r.tick(t0 + 6000); // lăn 96 bậc -> chạm Bug ở bậc 100
  const v = r.view(t0 + 6000);
  ok(v.hazard === null, 'bị húc: chướng ngại biến mất');
  ok(v.totals.tumbles === 1, 'bị húc: tính 1 lần lăn');
  ok(v.steps === 82, 'cuộn len (rng 0.5): tụt 18 bậc (10 + 8), còn 82');
  ok(v.bug.tumbling === true, 'bị húc: Bug đang lăn lộn');

  const r2 = new ClimbRoom(t0, cyc([0.5]));
  r2.debugSetSteps(5);
  r2.forceHazard('slipper', t0);
  r2.tick(t0 + 6000);
  ok(r2.view(t0 + 6000).steps === 0, 'dép húc ở bậc 5 (tụt 15): về 0, không âm');

  // ĐẨY dọn chướng ngại trong tầm thì không bị húc
  const r3 = new ClimbRoom(t0, cyc([0.5]));
  r3.debugSetSteps(100);
  r3.forceHazard('yarn', t0); // ở bậc 190, cách Bug 90 bậc
  r3.tick(t0 + 2000); // lăn xuống còn cách ~57 bậc: vào tầm ĐẨY (70)
  const says = r3.chat(P('u9', 'Bạn Chín'), 'ĐẨY', t0 + 2000);
  ok(r3.view(t0).hazard === null, 'ĐẨY trong tầm 70 bậc: dọn bay cuộn len');
  ok(r3.view(t0).totals.cleared === 1, 'ĐẨY: tính 1 lần dọn chướng ngại');
  ok(says.some((s) => s.main && s.text.includes('Bạn Chín')), 'ĐẨY: MC đọc tên người dọn đường');
}

// --- Bậc trơn: leo trong dải 300–330 chỉ được một nửa ---
{
  const r = new ClimbRoom(t0, seq([]));
  r.debugSetSteps(310);
  ok(r.view(t0).inSlippery === true, 'bậc 310: đang trong dải trơn 300–330');
  r.chat(P('u1'), 'LEO', t0); // +3 mà trơn -> +1,5
  ok(r.view(t0).steps === 311, 'LEO trong dải trơn: +3 thành +1,5 (hiện 311)');
  const r2 = new ClimbRoom(t0, seq([]));
  r2.debugSetSteps(100);
  ok(r2.view(t0).inSlippery === false, 'bậc 100: ngoài dải trơn');
  r2.chat(P('u1'), 'LEO', t0);
  ok(r2.view(t0).steps === 103, 'LEO ngoài dải trơn: +3 đầy đủ');
}

// --- Ngủ gật: đứng yên, LEO không cộng bậc, đủ 10 LEO thì dậy ---
{
  const r = new ClimbRoom(t0, seq([]));
  r.forceNap(t0);
  ok(r.view(t0).nap !== null, 'ngủ gật: trạng thái ngủ hiện lên');
  r.tick(t0 + 4000);
  ok(r.view(t0 + 4000).steps === 0, 'ngủ gật: Bug không tự leo');
  for (let i = 1; i <= 9; i++) r.chat(P(`w${i}`), 'LEO', t0 + 4500);
  ok(r.view(t0 + 4500).nap?.leo === 9, 'gọi dậy: 9/10 LEO');
  ok(r.view(t0 + 4500).steps === 0, 'LEO lúc ngủ: không cộng bậc');
  r.chat(P('w10'), 'LEO', t0 + 4500);
  ok(r.view(t0 + 4500).nap === null, 'đủ 10 LEO: Bug tỉnh dậy');
  r.tick(t0 + 6600);
  ok(r.view(t0 + 6600).steps === 1, 'sau khi dậy: Bug tự leo lại (+1 bậc sau 2 giây)');
}

// --- Thắng lượt: đủ 1000 bậc -> wins +1, bậc về 0, độ khó +1, ghi công người đóng góp nhiều nhất ---
{
  const r = new ClimbRoom(t0, cyc([0.9, 0.5, 0.3]));
  r.newSession(t0);
  r.like(P('anhA', 'Anh A'), 120, t0);
  r.tick(t0 + 3000); // xả hết 120 bậc năng lượng
  ok(r.view(t0 + 3000).top[0]?.nickname === 'Anh A', 'trước thắng: Anh A đang dẫn đầu đóng góp');
  r.debugSetSteps(995);
  r.chat(P('beB', 'Bé B'), 'LEO', t0 + 3000); // 998
  const says = r.chat(P('beB', 'Bé B'), 'NHẢY', t0 + 3000); // rng 0.9: vọt +8 -> thắng
  const v = r.view(t0 + 3000);
  ok(v.wins === 1, 'thắng: wins = 1');
  ok(v.steps === 0, 'thắng: bậc reset về 0 cho lượt mới');
  ok(v.difficulty === 2, 'thắng: độ khó tăng lên 2');
  ok(v.credit?.nickname === 'Anh A', 'thắng: ghi công người đóng góp nhiều nhất (Anh A)');
  ok(v.banner?.kind === 'win', 'thắng: banner về đích hiện lên');
  ok(says.some((s) => s.main && s.text.startsWith('F:') && s.text.includes('Anh A')), 'thắng: MC nữ đọc tên người đóng góp nhiều nhất');
  ok(v.bands[0][0] === 295 && v.bands[0][1] === 335, 'độ khó 2: dải trơn rộng thêm 5 bậc mỗi phía (295–335)');
}

// --- Thắng 10 lượt: ĐỈNH GÁC MÁI, wins về 0, vòng buổi mới ---
{
  const r = new ClimbRoom(t0, cyc([0.5]));
  let now = t0;
  for (let i = 1; i <= 10; i++) {
    now += 6000;
    r.debugSetSteps(999);
    r.chat(P('u1'), 'LEO', now);
    if (i < 10) ok(r.view(now).wins === i, `lượt ${i}: wins = ${i}`);
  }
  const v = r.view(now);
  ok(v.banner?.kind === 'grand', '10 lượt thắng: banner ĐỈNH GÁC MÁI');
  ok(v.wins === 0, '10 lượt thắng: wins reset về 0');
  ok(v.sessionArc === 2, '10 lượt thắng: sang vòng buổi 2');
  ok(v.difficulty === 11, '10 lượt thắng: độ khó tích lũy 11');
  ok(v.totals.wins === 10, 'tổng lượt thắng cả buổi = 10');
}

// --- Bảng đóng góp: xếp hạng đúng thứ tự ---
{
  const r = new ClimbRoom(t0, seq([0.9]));
  r.like(P('a', 'Người A'), 50, t0);
  r.chat(P('b', 'Người B'), 'LEO', t0);
  r.chat(P('b', 'Người B'), 'LEO', t0 + 6000);
  r.chat(P('b', 'Người B'), 'LEO', t0 + 12000);
  r.chat(P('c', 'Người C'), 'NHẢY', t0);
  const top = r.view(t0 + 12000).top;
  ok(top.length === 3 && top[0].nickname === 'Người A' && top[0].steps === 50, 'đóng góp: A dẫn đầu 50 bậc (tim)');
  ok(top[1].nickname === 'Người B' && top[1].steps === 9, 'đóng góp: B thứ hai 9 bậc (3 LEO)');
  ok(top[2].nickname === 'Người C' && top[2].steps === 8, 'đóng góp: C thứ ba 8 bậc (NHẢY)');
}

if (fails) {
  console.error(`\n❌ ${fails} kiểm chứng THẤT BẠI`);
  process.exit(1);
}
console.log('✅ Tất cả kiểm chứng Bug Leo 1000 Bậc đều PASS');
