// Kiểm chứng engine Bug Đại Náo Nhà Sen — chạy: npm run check
// Tất định: rng vòng lặp cố định + đồng hồ bước tay.
import { BugRoom, parseCommand, type Person } from './bug';

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

// --- Phân tích lệnh (bỏ dấu, thường/hoa, dấu câu) ---
ok(parseCommand('đẩy') === 'DAY', 'parse: "đẩy" -> DAY');
ok(parseCommand('ĐẨY!!!') === 'DAY', 'parse: "ĐẨY!!!" -> DAY');
ok(parseCommand('giả ngủ') === 'GIA_NGU', 'parse: "giả ngủ" -> GIA_NGU');
ok(parseCommand('ăn vạ') === 'AN_VA', 'parse: "ăn vạ" -> AN_VA');
ok(parseCommand('đu') === 'DU', 'parse: "đu" -> DU');
ok(parseCommand('hello cả nhà') === null, 'parse: chat thường -> null');

/** Chạy 5 nhiệm vụ đầu để tới nhiệm vụ combo số 6 (đu đèn). Trả về mốc giờ hiện tại. */
function reachComboMission(r: BugRoom, now: number): number {
  const u = P('u1', 'Bạn Một');
  r.sendBugTo('table');
  r.chat(u, 'ĐẨY', now);
  r.sendBugTo('plant');
  r.chat(u, 'ĐẨY', now);
  r.sendBugTo('curtains');
  r.chat(u, 'LEO', now);
  r.sendBugTo('shelf');
  r.chat(u, 'ĐẨY', now);
  r.sendBugTo('floor');
  // chờ robot tới gần Bug (robot chạy 46px/s từ x=300, Bug ở x=540)
  for (let i = 0; i < 12 && Math.abs(r.view(now).bug.x - r.view(now).robot.x) >= 210; i++) {
    now += 200;
    r.tick(now);
  }
  r.chat(u, 'NHẢY', now);
  return now;
}

// --- Lệnh đúng ngữ cảnh: hoàn thành nhiệm vụ + ghi công người ra lệnh ---
{
  const r = new BugRoom(t0, rng);
  r.newSession(t0);
  r.sendBugTo('table');
  const says = r.chat(P('anhA', 'Anh A'), 'ĐẨY', t0);
  const v = r.view(t0);
  ok(v.missions[0].done === true, 'ĐẨY trên bàn: nhiệm vụ 1 hoàn thành');
  ok(v.missionIdx === 1, 'hoàn thành xong: chuyển nhiệm vụ 2');
  ok(v.credit?.nickname === 'Anh A', 'ghi công người ra lệnh quyết định (Anh A)');
  ok(v.totals.missions === 1, 'tổng nhiệm vụ đã phá = 1');
  ok(says.some((s) => s.main && s.text.startsWith('F:')), 'câu MC hoàn thành nhiệm vụ là giọng nữ (F:) và đọc tên người được ghi công');
  ok(says.some((s) => s.text.includes('Anh A')), 'câu MC nhắc tên người được ghi công');
}

// --- Lệnh sai ngữ cảnh: thất bại hề, không hoàn thành nhiệm vụ, không phạt ---
{
  const r = new BugRoom(t0, rng);
  r.newSession(t0); // Bug đang ở giữa sàn
  r.chat(P('u1'), 'ĐẨY', t0);
  let v = r.view(t0);
  ok(v.lastAction?.kind === 'fail', 'ĐẨY giữa sàn (không có đồ dễ vỡ): fail hề');
  ok(v.missions[0].done === false, 'fail: nhiệm vụ không hoàn thành');
  r.chat(P('u1'), 'ĐU', t0);
  v = r.view(t0);
  ok(v.lastAction?.kind === 'fail', 'ĐU khi chưa lên đèn: fail hề');
  ok(v.catches === 0 && v.li === 1, 'fail không bị phạt (không mất LÌ, không tính bị bắt)');
}

// --- Combo: cần đủ số lệnh khác người trong cửa sổ, ngưỡng theo độ đông ---
{
  const r0 = new BugRoom(t0, rng);
  ok(r0.comboNeed(t0) === 3, 'combo: phòng vắng cần 3 lệnh');
  r0.setSimViewers(20);
  ok(r0.comboNeed(t0) === 13, 'combo: giả lập 20 người -> cần 13 lệnh (3 + 20*0.5)');
  r0.setSimViewers(200);
  ok(r0.comboNeed(t0) === 30, 'combo: ngưỡng trần 30');

  const r = new BugRoom(t0, rng);
  r.newSession(t0);
  const now = reachComboMission(r, t0);
  ok(r.view(now).missionIdx === 5, 'đã tới nhiệm vụ 6 (đu đèn, combo)');
  r.sendBugTo('table');
  r.chat(P('u1', 'Bạn Một'), 'NHẢY', now); // lên đèn chùm
  ok(r.view(now).bug.zone === 'chandelier', 'NHẢY từ bàn: Bug lên đèn chùm');
  r.chat(P('u1', 'Bạn Một'), 'ĐU', now);
  let v = r.view(now);
  ok(v.combo?.need === 3 && v.combo?.have === 1, 'combo mở: cần 3, đã có 1');
  ok(v.missions[5].done === false, 'combo chưa đủ: nhiệm vụ chưa xong');
  r.chat(P('u1', 'Bạn Một'), 'ĐU', now); // cùng 1 người gõ lại: không tính thêm
  ok(r.view(now).combo?.have === 1, 'combo: 1 người gõ 2 lần chỉ tính 1');
  r.chat(P('u2', 'Bạn Hai'), 'ĐU', now);
  ok(r.view(now).missions[5].done === false, 'combo 2/3: vẫn chưa xong');
  const says = r.chat(P('u3', 'Bạn Ba'), 'ĐU', now);
  v = r.view(now);
  ok(v.missions[5].done === true, 'combo đủ 3/3 trong cửa sổ: nhiệm vụ hoàn thành');
  ok(v.credit?.nickname === 'Bạn Ba', 'combo: ghi công người gõ lệnh quyết định cuối');
  ok(says.some((s) => s.main), 'combo hoàn thành: có câu MC chính');

  // Cửa sổ hết hạn: combo tan, phải gõ lại
  const r2 = new BugRoom(t0, rng);
  r2.newSession(t0);
  const now2 = reachComboMission(r2, t0);
  r2.sendBugTo('table');
  r2.chat(P('u1'), 'NHẢY', now2);
  r2.chat(P('u1'), 'ĐU', now2);
  ok(r2.view(now2).combo !== null, 'combo đang mở trước khi hết giờ');
  r2.tick(now2 + 6000);
  ok(r2.view(now2 + 6000).combo === null, 'combo quá 5 giây chưa đủ: tan, gõ lại');
  ok(r2.view(now2 + 6000).missions[5].done === false, 'combo tan: nhiệm vụ chưa hoàn thành');
}

// --- Vote: đa số thắng, Bug làm theo ---
{
  const r = new BugRoom(t0, rng);
  r.newSession(t0);
  r.forceVote(t0);
  const v0 = r.view(t0);
  ok(v0.vote !== null && v0.vote.aWord === 'REM' && v0.vote.bWord === 'HOP', 'vote mở: RÈM vs HỘP');
  r.chat(P('u1'), 'RÈM', t0);
  r.chat(P('u2'), 'rem đi', t0);
  r.chat(P('u3'), 'HỘP', t0);
  r.chat(P('u1'), 'HỘP', t0); // đổi ý: phiếu đầu đã tính, bỏ qua
  const v1 = r.view(t0);
  ok(v1.vote?.a === 2 && v1.vote?.b === 1, 'vote: RÈM 2 — HỘP 1 (mỗi người 1 phiếu)');
  r.tick(t0 + 10_500);
  const v2 = r.view(t0 + 10_500);
  ok(v2.totals.votes === 1, 'vote chốt: tính 1 đợt vote');
  ok(v2.bug.zone === 'curtainTop', 'vote: phía thắng (RÈM) -> Bug leo lên đỉnh rèm');
  ok(v2.vote === null, 'vote chốt xong: đóng bảng vote');
}

// --- Bắt: còn LÌ thì tốn LÌ để thoát trước, hết LÌ mới tính bị bắt ---
{
  const r = new BugRoom(t0, rng);
  r.newSession(t0);
  ok(r.view(t0).li === 1, 'mở buổi: Bug có 1 LÌ');
  r.sendBugTo('floor');
  r.sendSenTo(540, 1400); // Sen đứng ngay chỗ Bug
  r.tick(t0 + 200);
  let v = r.view(t0 + 200);
  ok(v.li === 0, 'bị chụp lần 1: tốn 1 LÌ');
  ok(v.catches === 0, 'bị chụp lần 1: chưa tính bị bắt (LÌ cứu)');
  ok(v.totals.dodges === 1, 'bị chụp lần 1: tính 1 lần né thoát');
  const bugPos = r.view(t0 + 200).bug;
  r.sendSenTo(bugPos.x, bugPos.y);
  r.tick(t0 + 4400); // qua thời gian ân hạn sau né (3s) + choáng của Sen
  v = r.view(t0 + 4400);
  ok(v.catches === 1, 'bị chụp lần 2 (hết LÌ): tính bị bắt');
  ok(v.sen.state === 'holdBug', 'bị bắt: Sen ôm Bug (cảnh xin lỗi)');
  ok(v.totals.catches === 1, 'tổng số lần bị bắt = 1');
}

// --- Tim: tăng cân, qua mốc cấp mập; zoomies theo mốc tim riêng ---
{
  const r = new BugRoom(t0, rng);
  r.newSession(t0);
  r.like(P('u1'), 200, t0);
  let v = r.view(t0);
  ok(Math.abs(v.kg - 3.6) < 0.001 && v.fatStage === 1, 'tim: 200 tim -> 3,6 kg, vẫn cấp 1');
  const says = r.like(P('u1'), 450, t0);
  v = r.view(t0);
  ok(Math.abs(v.kg - 4.5) < 0.001 && v.fatStage === 2, 'tim: tổng 650 tim -> 4,5 kg, lên cấp 2');
  ok(v.totals.levelups === 1, 'tim: tính 1 lần lên cấp');
  ok(says.some((s) => s.main && s.text.startsWith('F:')), 'lên cấp: MC nữ đọc câu ăn mừng');

  const r2 = new BugRoom(t0, rng);
  r2.like(P('u1'), 500, t0);
  ok(r2.view(t0).zoomies === true, 'tim: đủ 500 tim -> Bug zoomies');
}

// --- Tốc độ Sen tăng theo số người chơi + thời gian ---
{
  const r = new BugRoom(t0, rng);
  const s0 = r.view(t0).senSpeed;
  ok(s0 === 52, 'Sen: tốc độ gốc 52 lúc mở buổi, phòng vắng');
  r.setSimViewers(20);
  ok(r.view(t0).senSpeed > s0, 'Sen: nhiều người chơi -> Sen nhanh hơn');
  r.setSimViewers(0);
  ok(r.view(t0 + 20 * 60_000).senSpeed > s0, 'Sen: càng về cuối buổi Sen càng nhanh');
}

if (fails) {
  console.error(`\n❌ ${fails} kiểm chứng THẤT BẠI`);
  process.exit(1);
}
console.log('✅ Tất cả kiểm chứng Bug Đại Náo Nhà Sen đều PASS');
