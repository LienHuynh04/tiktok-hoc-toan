// Kiểm chứng engine Oẳn Tù Xì (bản đấu TRẬN với chủ phòng) — chạy: npm run check
// Luật đòn, trận 3 tim, thắng trắng, thua trận -> ghế chờ (chuông thả), hòa không mất tim,
// đột tử từ lượt 7, đấu giao lưu thua không bị phạt, chống bắt nhầm đòn trong câu thường.
import { RpsRoom, judge, type Person } from './rps';

let fails = 0;
function ok(cond: boolean, label: string) {
  if (!cond) {
    fails++;
    console.error('SAI:', label);
  }
}

const t0 = 1_000_000;
const P = (username: string, nickname = username): Person => ({ username, nickname, spoken: nickname, avatar: '' });
const scripted = (seq: number[]) => {
  let i = 0;
  return () => seq[i++] ?? 0.5;
};

/** Chạy 1 lượt ném: (đã ở pha pick) -> hô -> mở đòn; dừng ở pha throw hoặc matchEnd */
function playThrow(r: RpsRoom, t: number): number {
  r.tick(t); // pick -> chant
  t += 2200;
  r.tick(t); // chant -> mở đòn
  return t;
}
/** Hết pha hiện kết quả lượt (3,2s) -> sang lượt ném kế */
function nextThrow(r: RpsRoom, t: number): number {
  t += 3200;
  r.tick(t);
  return t;
}

// ---------- luật đòn: đủ 9 cặp ----------
ok(judge('bua', 'keo') === 'win' && judge('keo', 'bao') === 'win' && judge('bao', 'bua') === 'win', 'vòng thắng: búa>kéo>bao>búa');
ok(judge('keo', 'bua') === 'lose' && judge('bao', 'keo') === 'lose' && judge('bua', 'bao') === 'lose', 'vòng thua ngược lại');
ok(judge('keo', 'keo') === 'draw' && judge('bua', 'bua') === 'draw' && judge('bao', 'bao') === 'draw', 'giống nhau thì hòa');

// ---------- thắng trắng 3-0: chủ phòng hết tim, người chơi +1 sao ----------
{
  // đòn chủ phòng theo lượt: bao (kéo cắt), kéo (búa đập), búa (bao trùm); xen kẽ rng cho câu trêu
  const r = new RpsRoom(t0, scripted([0.99, 0.1, 0.0, 0.2, 0.5, 0.3]));
  r.newSession(t0);
  const p1 = P('u1', 'An');
  r.chat({ ...p1, comment: 'kéo' }, t0);
  ok(r.view(t0).queue.length === 1, 'gõ kéo -> vào hàng chờ thách đấu');
  let t = t0 + 1600;
  r.tick(t); // mở trận, lượt 1 khóa sẵn đòn
  let v = r.view(t);
  ok(v.phase === 'pick' && v.duel?.hasPicked === true && v.duel?.playerHearts === 3 && v.duel?.hostHearts === 3, 'trận mở: mỗi bên 3 tim');
  t = playThrow(r, t + 1500);
  v = r.view(t);
  ok(v.phase === 'throw' && v.duel?.throwOutcome === 'win' && v.duel?.hostHearts === 2, 'lượt 1: kéo cắt bao, chủ phòng mất 1 tim');
  t = nextThrow(r, t);
  r.chat({ ...p1, comment: 'búa' }, t);
  t = playThrow(r, t);
  ok(r.view(t).duel?.hostHearts === 1, 'lượt 2: búa đập kéo, chủ phòng còn 1 tim');
  t = nextThrow(r, t);
  r.chat({ ...p1, comment: 'bao' }, t);
  t = playThrow(r, t);
  v = r.view(t);
  ok(v.phase === 'matchEnd' && v.duel?.matchOutcome === 'win' && v.duel?.playerHearts === 3, 'lượt 3: thắng trắng cả trận');
  ok(v.totals.studentWins === 1 && v.students[0]?.wins === 1, 'thắng trận được 1 sao');
  t += 5500;
  r.tick(t);
  ok(r.view(t).phase === 'idle' && r.view(t).waiting.length === 0, 'thắng trận thì không ai ra ghế chờ');
}

// ---------- thua trận -> ghế chờ; chuông 300 tim thả về ----------
{
  const r = new RpsRoom(t0, scripted([0.99, 0.1, 0.99, 0.2, 0.99, 0.3])); // chủ phòng toàn ra bao trùm búa
  r.newSession(t0);
  const p2 = P('u2', 'Bình');
  r.chat({ ...p2, comment: 'búa' }, t0);
  let t = t0 + 1600;
  r.tick(t);
  t = playThrow(r, t + 1500);
  ok(r.view(t).duel?.playerHearts === 2, 'lượt 1 thua: mất 1 tim');
  t = nextThrow(r, t);
  r.chat({ ...p2, comment: 'búa' }, t);
  t = playThrow(r, t);
  t = nextThrow(r, t);
  r.chat({ ...p2, comment: 'búa' }, t);
  t = playThrow(r, t);
  let v = r.view(t);
  ok(v.phase === 'matchEnd' && v.duel?.matchOutcome === 'lose' && v.totals.adminWins === 1, 'thua 0-3: chủ phòng thắng trận');
  t += 5500;
  r.tick(t);
  v = r.view(t);
  ok(v.waiting.length === 1 && v.waiting[0].nickname === 'Bình', 'thua trận -> ra ghế chờ');
  ok(v.students.every((s) => s.nickname !== 'Bình'), 'ghế chờ thì không còn ở sảnh');
  const lines = r.like(300, t);
  ok(r.view(t).waiting.length === 0 && lines.some((l) => l.text.includes('Chuông reo')), 'đủ 300 tim -> chuông reo, ghế chờ về hết');
}

// ---------- hòa không mất tim; tới lượt 7 là đột tử ----------
{
  // lượt: 1 hòa (bao-bao), 2 hòa (bao-bao), 3 thắng (kéo-bao), 4 thua (kéo-búa), 5 thắng (búa-kéo), 6 thua (búa-bao), 7 đột tử thua (kéo-búa)
  const admins = [0.99, 0.99, 0.99, 0.5, 0.0, 0.99, 0.5];
  const seq: number[] = [];
  for (const a of admins) seq.push(a, 0.1);
  const r = new RpsRoom(t0, scripted(seq));
  r.newSession(t0);
  const p3 = P('u3', 'Chi');
  const picks = ['bao', 'bao', 'kéo', 'kéo', 'búa', 'búa', 'kéo'];
  r.chat({ ...p3, comment: picks[0] }, t0);
  let t = t0 + 1600;
  r.tick(t);
  t = playThrow(r, t + 1500);
  let v = r.view(t);
  ok(v.duel?.throwOutcome === 'draw' && v.duel?.playerHearts === 3 && v.duel?.hostHearts === 3, 'hòa: không bên nào mất tim');
  for (let i = 1; i < picks.length; i++) {
    t = nextThrow(r, t);
    r.chat({ ...p3, comment: picks[i] }, t);
    if (i === 6) ok(r.view(t).duel?.suddenDeath === true, 'lượt ném 7: đột tử');
    t = playThrow(r, t);
    if (i < 6) ok(r.view(t).phase === 'throw', `lượt ${i + 1}: trận còn tiếp tục`);
  }
  v = r.view(t);
  ok(v.phase === 'matchEnd' && v.duel?.matchOutcome === 'lose', 'đột tử: thua lượt 7 là thua cả trận dù còn 1 tim');
  ok(v.totals.throws === 7 && v.totals.draws === 2, 'đếm lượt ném + lượt hòa đúng');
}

// ---------- đấu giao lưu (chủ phòng gọi): thua trận KHÔNG ra ghế chờ ----------
{
  const seq = [0.5]; // bốc người lên đấu
  for (let i = 0; i < 3; i++) seq.push(0.0, 0.5, 0.1); // mỗi lượt: đòn bốc ngẫu nhiên = kéo, chủ phòng = búa -> thua
  const r = new RpsRoom(t0, scripted(seq));
  r.newSession(t0);
  const p4 = P('u4', 'Dũng');
  r.join(p4, t0);
  let t = t0 + 1600;
  r.tick(t);
  ok(r.view(t).duel?.auto === true && r.view(t).duel?.nickname === 'Dũng', 'hết người thách đấu -> gọi 1 bạn lên giao lưu');
  for (let i = 0; i < 3; i++) {
    t += 8000;
    t = playThrow(r, t); // hết giờ không ra đòn: bốc kéo, gặp búa
    if (i < 2) t = nextThrow(r, t);
  }
  const v = r.view(t);
  ok(v.phase === 'matchEnd' && v.duel?.matchOutcome === 'lose' && v.totals.adminWins === 1, 'giao lưu thua 0-3 vẫn tính trận cho chủ phòng');
  t += 5500;
  r.tick(t);
  ok(r.view(t).waiting.length === 0, 'giao lưu thua -> KHÔNG ra ghế chờ');
}

// ---------- chống bắt nhầm đòn + nhạc mặc định ----------
{
  const r = new RpsRoom(t0, scripted([]));
  r.newSession(t0);
  const p6 = P('u6', 'Hà');
  r.chat({ ...p6, comment: 'ăn kẹo ngon quá' }, t0);
  ok(r.view(t0).queue.length === 0, '"ăn kẹo" không bị bắt nhầm thành đòn kéo');
  r.chat({ ...p6, comment: 'chơi' }, t0);
  ok(r.view(t0).queue.length === 1, 'gõ chơi -> xếp hàng không khóa đòn');
  const v = r.view(t0);
  ok(v.musicOn === true && Math.abs(v.musicVolume - 0.9) < 1e-9, 'nhạc bật mặc định, âm lượng 0.9');
}

if (fails) {
  console.error(`rps.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('rps.check: tất cả đều đúng');
