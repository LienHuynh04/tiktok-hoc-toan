// Kiểm chứng engine Spider Hero — chạy: npm run check
// 1) Vật lý bay liên tục 180 giây: không rơi xuống đường, đủ cả 3 trạng thái
//    chạy nóc nhà / đu tơ / bay, quãng đường tăng đều.
// 2) Quỹ LIKE rút theo mốc: ưu tiên mốc đắt nhất, tôn trọng cooldown,
//    tôn trọng trạng thái (nhảy cần đang chạy, lộn cần đang bay), gom batch.
import { HeroRoom, type Person } from './hero';

let fails = 0;
function ok(cond: boolean, label: string) {
  if (!cond) {
    fails++;
    console.error('SAI:', label);
  }
}

const t0 = 1_000_000;
const P = (username: string): Person => ({ username, nickname: username, spoken: username, avatar: '' });
const mode = (r: HeroRoom) => (r as unknown as { mode: string }).mode;
const credit = (r: HeroRoom) => (r as unknown as { credit: number }).credit;

// ---------- 1) bay bền 180 giây ----------
{
  const r = new HeroRoom(t0);
  r.newSession(t0);
  let now = t0;
  const modes = new Set<string>();
  let minY = Infinity;
  for (let i = 0; i < 1800; i++) {
    now += 100;
    r.tick(now);
    modes.add(mode(r));
    minY = Math.min(minY, r.scene(now).hero.y);
  }
  const v = r.view(now);
  ok(v.dist > 2200, `bay 180s được > 2,2km (thực tế ${v.dist}m)`);
  ok(minY >= 5, `không bao giờ rơi sát đường (thấp nhất ${minY.toFixed(1)}m)`);
  ok(modes.has('run') && modes.has('swing') && modes.has('air'), `đủ 3 trạng thái chạy/đu/bay (có: ${[...modes].join(', ')})`);
}

// ---------- 2) mốc LIKE ----------
{
  const r = new HeroRoom(t0);
  r.newSession(t0);
  let now = t0;
  const fx = () => r.fxSince(0).map((f) => f.fx);

  r.like(P('a'), 1, now);
  ok(fx().includes('web1'), 'like: 1 tim -> bắn 1 sợi tơ');
  ok(credit(r) === 0, 'like: quỹ trừ đúng 1 tim');

  // gom batch: 2 lượt tim trong 90ms chỉ rút hiệu ứng 1 nhịp
  now += 50;
  r.like(P('a'), 1, now);
  ok(credit(r) === 1, 'like: tim đến dồn dập được gom lại, chưa rút ngay');
  now += 200;
  r.tick(now);
  ok(credit(r) === 0, 'like: nhịp tick kế tiếp rút nốt tim đã gom');

  // ưu tiên mốc đắt nhất: nạp 500 -> Bão Tơ nổ trước, không bị tim lẻ ăn hết quỹ
  now += 200;
  r.like(P('a'), 500, now);
  ok(fx().filter((f) => f === 'storm').length === 1, 'like: 500 tim -> Bão Tơ');
  ok(r.view(now).totals.storms === 1, 'like: tổng bão tơ = 1');

  // cooldown: nạp thêm 500 ngay sau đó -> Bão Tơ không nổ lại, mốc nhỏ hơn được rút
  now += 200;
  const before = fx().length;
  r.like(P('a'), 500, now);
  const after = fx().slice(before);
  ok(!after.includes('storm'), 'cooldown: Bão Tơ đang hồi chiêu, không nổ lại ngay');
  ok(after.includes('barrage'), 'cooldown: quỹ chuyển sang Mưa Tơ 200');
  ok(r.view(now).totals.storms === 1, 'cooldown: tổng bão tơ vẫn = 1');

  // nhảy chỉ khi đang chạy; lộn chỉ khi đang bay
  const r2 = new HeroRoom(t0);
  r2.newSession(t0);
  let n2 = t0;
  ok(mode(r2) === 'run', 'trạng thái: mở màn đang chạy nóc nhà');
  n2 += 200;
  r2.like(P('b'), 10, n2);
  ok(r2.view(n2).totals.jumps === 1 && mode(r2) === 'air', 'mốc 10: đang chạy -> nhảy cao thật');
  n2 += 200;
  r2.like(P('b'), 10, n2);
  ok(r2.view(n2).totals.jumps === 1, 'mốc 10: đang bay -> không nhảy tiếp (chờ trạng thái hợp)');
  n2 += 200;
  r2.like(P('b'), 100, n2);
  ok(r2.fxSince(0).some((f) => f.fx === 'flip'), 'mốc 100: đang bay -> lộn vòng');
  ok(r2.view(n2).totals.flips >= 1, 'mốc 100: tổng lộn vòng >= 1');

  // mốc cao nhất
  const r3 = new HeroRoom(t0);
  r3.newSession(t0);
  r3.like(P('c'), 5000, t0);
  ok(r3.fxSince(0).some((f) => f.fx === 'mega'), 'like: 5000 tim -> Siêu Bão Tơ');
  ok(credit(r3) === 0, 'like: Siêu Bão Tơ rút đúng 5000 tim');

  // câu đố tính nhanh: mở theo nhịp tick, bình luận đúng -> tăng tốc + ghi tên
  const r4 = new HeroRoom(t0);
  r4.newSession(t0);
  let n4 = t0;
  let q4 = r4.view(n4).quiz;
  for (let i = 0; i < 80 && !q4; i++) {
    n4 += 500;
    r4.tick(n4);
    q4 = r4.view(n4).quiz;
  }
  ok(!!q4, 'đố: câu đố tự mở sau giờ hẹn');
  if (q4) {
    const wrong = r4.chat({ p: P('do-thu'), comment: String(q4.answer + 9) }, n4);
    ok(wrong.length === 0 && r4.view(n4).quiz?.solvedBy === null, 'đố: trả lời sai -> không thưởng, không phạt');
    r4.chat({ p: P('do-thu'), comment: `đáp án là ${q4.answer} nè` }, n4);
    const v4 = r4.view(n4);
    ok(v4.quiz?.solvedBy === P('do-thu').nickname, 'đố: ghi tên người trả lời đúng đầu tiên');
    ok(v4.scene.burst, 'đố: trả lời đúng -> Hero tăng tốc (burst)');
    const creditBefore = v4.credit;
    r4.chat({ p: P('do-thu'), comment: String(q4.answer) }, n4);
    ok(r4.view(n4).credit === creditBefore, 'đố: cùng một người không được thưởng 2 lần trong 1 câu');
    r4.chat({ p: P('nguoi-khac'), comment: String(q4.answer) }, n4);
    ok(r4.view(n4).credit >= creditBefore, 'đố: người thứ hai trả lời đúng vẫn được cộng quỹ');
  }
}

if (fails) {
  console.error(`hero.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('hero.check: tất cả đều đúng');
