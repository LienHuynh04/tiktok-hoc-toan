// Kiểm chứng engine Bug Đi WC: toán lực tim chung, tụt tiến độ + sàn mốc, buff
// NƯỚC/RAU, combo RẶN, mốc 1 lần, thắng + lên cấp, hết giờ giữ 40%, quà vô hiệu,
// chọc mèo → quạu → dỗi → xin lỗi, bong bóng chat (trần 5 + lọc từ cấm), MC không
// lặp câu liên tiếp. Chạy: npm run check.
import { WcRoom, type Person } from './wc';

let failures = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}: expected ${e}, got ${a}`);
  }
}
function near(actual: number, expected: number, label: string, tol = 0.15) {
  if (Math.abs(actual - expected) > tol) {
    failures++;
    console.log(`FAIL ${label}: expected ~${expected}, got ${actual}`);
  }
}
function ok(cond: boolean, label: string) {
  if (!cond) {
    failures++;
    console.log(`FAIL ${label}`);
  }
}

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

// ---------- 1. Tim gộp lượt → toán tiến độ ----------
{
  const room = new WcRoom(T, mulberry32(1));
  eq(room.debugNeed(), 600, 'cấp 1 cần 600 điểm lực');
  room.like(person('anhA'), 100, T);
  near(room.debugProgressPct(), 100 / 6, '100 tim = 100/600 tiến độ');
  room.like(person('chiB'), 50, T);
  near(room.debugProgressPct(), 25, 'tim người khác cộng chung vào 1 thanh');
  eq(room.view(T).topNow?.nickname, 'anhA', 'người góp nhiều nhất lượt là anhA');
  eq(room.view(T).board[0]?.power, 100, 'bảng buổi ghi tổng lực của anhA');
}

// ---------- 2. Tụt: chỉ sau 3s ân hạn, không qua sàn mốc ----------
{
  const room = new WcRoom(T, mulberry32(2));
  room.debugSetProgressPct(30, T); // mốc 25 đã khoá
  room.tick(T + 2000);
  near(room.debugProgressPct(), 30, 'trong 3s ân hạn: chưa tụt');
  room.tick(T + 8000);
  near(room.debugProgressPct(), 27.6, 'sau ân hạn: tụt 0,4%/s x 6s');
  room.tick(T + 30000);
  near(room.debugProgressPct(), 25, 'tụt tới sàn mốc 25 thì dừng');
  const room2 = new WcRoom(T, mulberry32(2));
  room2.debugSetProgressPct(10, T);
  room2.tick(T + 60000);
  near(room2.debugProgressPct(), 0, 'chưa qua mốc nào: tụt về 0');
}

// ---------- 3. RẶN: +0,6% ngay + combo người khác nhau trong 5s ----------
{
  const room = new WcRoom(T, mulberry32(3));
  room.chat(person('anhA'), 'RẶN', T);
  near(room.debugProgressPct(), 0.6, 'RẶN = +0,6%');
  room.chat(person('chiB'), 'rặn đi bug', T + 1000);
  room.chat(person('anhC'), 'RẶN', T + 2000);
  eq(room.view(T + 2000).combo, 3, 'combo đếm 3 người khác nhau');
  room.chat(person('anhA'), 'RẶN', T + 3000);
  eq(room.view(T + 3000).combo, 3, 'cùng 1 người chat lại không tăng combo');
  eq(room.view(T + 9000).combo, 0, 'qua cửa sổ 5s: combo rã');
  room.chat(person('anhD'), 'CỐ LÊN', T + 9000);
  near(room.debugProgressPct(), 0.6 * 4 + 0.3, 'CỐ LÊN = +0,3%');
}

// ---------- 4. NƯỚC: lực tim x1,5 khi buff còn hạn ----------
{
  const room = new WcRoom(T, mulberry32(4));
  room.chat(person('anhA'), 'uống nước đi Bug', T);
  eq(room.view(T).waterSec, 10, 'buff NƯỚC hiện 10s');
  room.like(person('anhA'), 100, T + 1000);
  near(room.debugProgressPct(), 25, 'tim trong buff: 100 x 1,5 = 150 điểm = 25%');
  room.like(person('anhA'), 100, T + 20000); // buff hết từ lâu
  near(room.debugProgressPct(), 25 + 100 / 6, 'hết buff: tim tính thường');
}

// ---------- 5. RAU/XƠ: chặn tụt khi còn hạn ----------
{
  const room = new WcRoom(T, mulberry32(5));
  room.debugSetProgressPct(40, T);
  room.chat(person('anhA'), 'ăn rau nè', T);
  room.tick(T + 9000);
  near(room.debugProgressPct(), 40, 'còn chất xơ: không tụt dù im tim 9s');
  room.tick(T + 13000);
  near(room.debugProgressPct(), 38.4, 'hết chất xơ: tụt lại 0,4%/s');
  const room2 = new WcRoom(T, mulberry32(5));
  room2.debugSetProgressPct(40, T);
  room2.chat(person('anhA'), 'cho bug ăn xơ', T);
  eq(room2.view(T).fiberSec, 10, 'chat XƠ cũng bật buff chất xơ');
}

// ---------- 6. Mốc chỉ bắn 1 lần mỗi lượt ----------
{
  const room = new WcRoom(T, mulberry32(6));
  room.like(person('anhA'), 200, T); // 33%
  eq(room.view(T).milestonesHit, [25], 'qua mốc 25');
  eq(room.drainCues().filter((c) => c === 'meowBig').length, 1, 'mốc 25: 1 tiếng meowBig');
  room.like(person('anhA'), 100, T + 1000); // 50%
  eq(room.view(T + 1000).milestonesHit, [25, 50], 'qua mốc 50');
  eq(room.drainCues().filter((c) => c === 'meowBig').length, 1, 'mốc 50: thêm đúng 1 meowBig');
  room.like(person('anhA'), 60, T + 2000); // 60%
  eq(room.drainCues().length, 0, 'không qua mốc mới: không cue nào');
}

// ---------- 7. Thắng ở đúng 100%: ghi công, lên cấp, nhu cầu x1,35 ----------
{
  const room = new WcRoom(T, mulberry32(7));
  room.like(person('anhA'), 400, T);
  room.like(person('chiB'), 200, T);
  const v = room.view(T);
  eq(v.phase, 'success', 'đủ 100%: phase success');
  eq(v.successTop, 'anhA', 'người rặn chính là người góp nhiều nhất');
  eq(v.totals.successes, 1, 'đếm 1 lần thành công');
  room.tick(T + 2500);
  eq(room.view(T + 2500).phase, 'intermission', 'sau nhịp ăn mừng 2,5s: nghỉ giữa lượt');
  room.tick(T + 12500);
  const v2 = room.view(T + 12500);
  eq(v2.phase, 'attempt', 'sau nghỉ 10s: lượt mới');
  eq(v2.level, 2, 'lên cấp táo bón 2');
  eq(room.debugNeed(), 810, 'nhu cầu cấp 2 = 600 x 1,35 = 810');
  eq(v2.board.find((b) => b.username === 'anhA')?.king, true, 'anhA giữ danh hiệu VUA RẶN');
}

// ---------- 8. Hết giờ: giữ 40% tiến độ sang lượt sau ----------
{
  const room = new WcRoom(T, mulberry32(8));
  room.debugSetProgressPct(50, T);
  room.forceTimeout(T + 1000);
  near(room.debugProgressPct(), 20, 'hết giờ: 50% x 40% = 20% mang sang');
  eq(room.view(T + 1000).attempt, 2, 'đã sang lượt 2');
}

// ---------- 9. Quà: KHÔNG đổi bất kỳ trạng thái gameplay nào ----------
{
  const room = new WcRoom(T, mulberry32(9));
  room.like(person('anhA'), 60, T);
  const before = room.debugProgressPct();
  const says = room.thank(person('chiB'), 'Hoa hồng');
  room.giftFx('chiB', T);
  near(room.debugProgressPct(), before, 'quà không đổi tiến độ');
  eq(room.view(T).board.find((b) => b.username === 'chiB'), undefined, 'quà không ghi lực cho người tặng');
  eq(room.drainCues().length, 0, 'quà không sinh tiếng mèo gameplay');
  ok(says.length >= 1 && says[0].priority === true, 'quà chỉ sinh lời cảm ơn ưu tiên');
  ok(room.view(T).giftFx, 'quà bật hiệu ứng giấy vệ sinh bay (hình ảnh)');
}

// ---------- 10. Chọc mèo: độ quạu tăng, qua ngưỡng có phản ứng ----------
{
  const room = new WcRoom(T, mulberry32(10));
  room.chat(person('anhA'), 'CHỌC', T);
  eq(room.debugAnnoyance(), 12, 'CHỌC = +12 quạu');
  room.chat(person('chiB'), 'chọc bug chơi nè', T);
  eq(room.debugAnnoyance(), 24, 'câu chứa "chọc" cũng tính');
  room.chat(person('anhC'), 'chọc', T);
  room.chat(person('anhD'), 'chọc', T);
  room.chat(person('anhE'), 'chọc', T); // 60
  eq(room.debugAnnoyance(), 60, '5 lần chọc = 60 quạu');
  ok(room.view(T).bugBubble !== null, 'quạu 60+: Bug càu nhàu trong bong bóng thoại');
  room.chat(person('anhF'), 'chọc', T); // 72
  room.chat(person('anhG'), 'chọc', T); // 84
  eq(room.drainCues().filter((c) => c === 'hiss').length, 1, 'quạu 80+: xì đúng 1 lần');
  room.chat(person('anhH'), 'chọc', T); // 96
  eq(room.drainCues().filter((c) => c === 'hiss').length, 0, 'chưa nguôi xuống 50: không xì lại');
}

// ---------- 11. Quạu tự nguôi 2/giây ----------
{
  const room = new WcRoom(T, mulberry32(11));
  room.chat(person('anhA'), 'chọc', T);
  room.chat(person('anhA'), 'chọc', T);
  room.chat(person('anhA'), 'chọc', T); // 36
  room.tick(T + 5000);
  near(room.debugAnnoyance(), 26, 'im lặng 5s: quạu nguôi 10');
}

// ---------- 12. Dỗi: chặn lực tim + lệnh rặn, tiến độ VẪN tụt ----------
{
  const room = new WcRoom(T, mulberry32(12));
  room.like(person('anhA'), 240, T); // 40% (sàn mốc chỉ 25, còn khoảng để tụt)
  for (let i = 0; i < 9; i++) room.chat(person(`teaser${i}`), 'chọc', T);
  ok(room.view(T).sulking, 'quạu 100: Bug dỗi');
  eq(room.drainCues().filter((c) => c === 'yowl').length, 1, 'dỗi: tru dài 1 lần');
  room.like(person('anhA'), 100, T + 1000);
  near(room.debugProgressPct(), 40, 'đang dỗi: tim không thành lực');
  room.chat(person('anhA'), 'RẶN', T + 1000);
  near(room.debugProgressPct(), 40, 'đang dỗi: lệnh RẶN vô hiệu');
  room.tick(T + 5000);
  near(room.debugProgressPct(), 38, 'đang dỗi: tiến độ vẫn tụt 0,4%/s');
  ok(room.view(T + 5000).sulking, 'dỗi 6s: ở 5s vẫn còn dỗi');
}

// ---------- 13. XIN LỖI rút ngắn dỗi; hết dỗi +2% và quạu về 30 ----------
{
  const room = new WcRoom(T, mulberry32(13));
  room.like(person('anhA'), 300, T); // 50%
  room.forceSulk(T);
  room.chat(person('anhB'), 'XIN LỖI', T + 4000); // dỗi còn 2s -> cắt 1,5 -> còn 0,5s
  ok(room.view(T + 4000).sulking, '1 câu xin lỗi chưa đủ hết dỗi');
  room.chat(person('anhC'), 'xin lỗi bug nha', T + 4000); // cắt tiếp -> hết
  const v = room.view(T + 4000);
  eq(v.sulking, false, 'xin lỗi đủ: hết dỗi ngay');
  eq(v.annoyance, 30, 'hết dỗi: quạu về 30');
  eq(v.bugBubble, 'Hứ! 😤', 'hết dỗi: Bug hất mặt "Hứ!"');
  near(room.debugProgressPct(), 52, 'hết dỗi: adrenaline +2%');
}

// ---------- 14. Hết giờ dỗi tự hết (tick) ----------
{
  const room = new WcRoom(T, mulberry32(14));
  room.forceSulk(T);
  room.tick(T + 6000);
  eq(room.view(T + 6000).sulking, false, 'qua 6s: tự hết dỗi');
  eq(room.view(T + 6000).annoyance, 30, 'quạu về 30 sau dỗi');
}

// ---------- 15. Bong bóng chat: hiện chat thường, trần 5, lọc từ cấm, cắt 40 chữ ----------
{
  const room = new WcRoom(T, mulberry32(15));
  room.chat(person('anhA'), 'Bug cố lên nè', T);
  const b1 = room.view(T).chatBubbles;
  eq(b1.length, 1, 'chat thường cũng lên bong bóng');
  eq(b1[0]?.text, 'Bug cố lên nè', 'bong bóng giữ nguyên nội dung chat');
  for (let i = 0; i < 7; i++) room.chat(person(`u${i}`), `tin nhắn ${i}`, T);
  eq(room.view(T).chatBubbles.length, 5, 'tối đa 5 bong bóng cùng lúc');
  eq(room.view(T).chatBubbles[0]?.text, 'tin nhắn 2', 'bong bóng cũ nhất bị đẩy ra');
  const room2 = new WcRoom(T, mulberry32(15));
  room2.chat(person('anhX'), 'đm con mèo này', T);
  const masked = room2.view(T).chatBubbles[0]?.text ?? '';
  ok(masked.includes('***') && !masked.includes('đm'), 'từ cấm bị che *** trong bong bóng');
  const room3 = new WcRoom(T, mulberry32(15));
  room3.chat(person('anhY'), 'a'.repeat(60), T);
  eq(room3.view(T).chatBubbles[0]?.text.length, 40, 'chat dài bị cắt ở 40 ký tự');
  eq(room.view(T + 6000).chatBubbles.length, 0, 'bong bóng tự tan sau 5s');
}

// ---------- 16. MC không lặp lại câu vừa nói ----------
{
  const room = new WcRoom(T, mulberry32(16));
  const a = room.follow(person('anhA'), T)[0]?.text;
  const b = room.follow(person('chiB'), T)[0]?.text;
  ok(a !== b, '2 câu chào follow liên tiếp không trùng nhau');
  const c = room.thank(person('anhA'), 'Hoa hồng')[0]?.text;
  const d = room.thank(person('anhA'), 'Hoa hồng')[0]?.text;
  ok(c !== d, '2 câu cảm ơn liên tiếp không trùng nhau');
}

// ---------- 17. Buff vẫn bật được khi Bug dỗi (phòng thủ), tim giả lập chạy ----------
{
  const room = new WcRoom(T, mulberry32(17));
  room.forceSulk(T);
  room.chat(person('anhA'), 'uống nước', T);
  eq(room.view(T).waterSec, 10, 'đang dỗi vẫn bật được buff NƯỚC');
  const room2 = new WcRoom(T, mulberry32(17));
  room2.simLikeBurst(600, T);
  eq(room2.view(T).phase, 'success', 'tim giả lập 600 ở cấp 1 là thắng luôn');
  const room3 = new WcRoom(T, mulberry32(17));
  room3.simRanBurst(T);
  eq(room3.view(T).combo, 5, 'RẶN giả lập x5: combo 5');
  const room4 = new WcRoom(T, mulberry32(17));
  room4.simTease(T);
  eq(room4.debugAnnoyance(), 36, 'chọc giả lập x3 = 36 quạu');
  room4.forceSulk(T);
  room4.simSorry(T);
  eq(room4.view(T).sulking, true, 'xin lỗi giả lập x3 cắt 4,5s: dỗi 6s còn 1,5s');
  eq(room4.view(T).sulkSec, 2, 'thời gian dỗi còn lại hiện 2s (làm tròn lên)');
}

if (failures) {
  console.log(`\n${failures} FAIL`);
  process.exit(1);
}
console.log('TẤT CẢ ĐẠT');
