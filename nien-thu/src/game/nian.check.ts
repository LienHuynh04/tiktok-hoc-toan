// Kiểm chứng engine Đại Chiến Boss — chạy: npm run check
// Cả phòng cùng đánh: đòn đầu x2, 1 đòn/người/câu, sai reset chuỗi, boss gục lên cấp,
// dây pháo kết liễu được boss, nhạc mặc định bật.
import { NianRoom, hpForLevel, type Person } from './nian';

let fails = 0;
function ok(cond: boolean, label: string) {
  if (!cond) {
    fails++;
    console.error('SAI:', label);
  }
}

const t0 = 1_000_000;
const P = (username: string, nickname = username): Person => ({ username, nickname, spoken: nickname, avatar: '' });
// rng lặp đều để sinh câu hỏi ổn định; đáp án đọc từ chính câu hỏi hiện trên sân khấu
const cyc = (seq: number[]) => {
  let i = 0;
  return () => seq[i++ % seq.length];
};
const rng = cyc([0.13, 0.57, 0.91, 0.34, 0.78, 0.22, 0.66, 0.45]);

/** Đáp án đúng của câu đang hiện, suy từ nội dung câu hỏi như người chơi nhìn thấy */
function correctAnswer(r: NianRoom, now: number): string {
  const q = r.view(now).question;
  if (!q) throw new Error('không có câu hỏi');
  if (q.kind === 'type') return q.text;
  if (q.kind === 'count') return String([...q.text].length);
  const m = q.text.match(/(\d+) (.) (\d+)/)!;
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (m[2] === '+') return String(a + b);
  if (m[2] === '−') return String(a - b);
  if (m[2] === '×') return String(a * b);
  return String(a / b);
}

// ---------- máu theo cấp ----------
ok(hpForLevel(1) === 600 && hpForLevel(2) === 780 && hpForLevel(3) === 1014, 'máu boss: 600 / 780 / 1014 theo cấp');

// ---------- luồng đánh cơ bản ----------
{
  const r = new NianRoom(t0, rng);
  r.newSession(t0);
  let now = t0;
  ok(r.view(now).phase === 'spawn', 'mở màn ở pha xuất hiện');
  now += 4000;
  r.tick(now);
  let v = r.view(now);
  ok(v.phase === 'fight' && v.question?.kind === 'math', 'sau 4s: vào đánh, câu đầu là tính nhanh');
  ok(v.musicOn === true && Math.abs(v.musicVolume - 0.9) < 1e-9, 'nhạc bật mặc định, âm lượng 0.9');

  const A = P('a', 'An');
  const B = P('b', 'Bình');
  const ans = correctAnswer(r, now);
  r.chat({ ...A, comment: ans }, now);
  v = r.view(now);
  ok(v.boss.hp === 580, 'đòn đầu tiên của câu: (10+0) x2 = 20 sát thương');
  r.chat({ ...B, comment: ans }, now);
  ok(r.view(now).boss.hp === 570, 'đòn thứ hai: 10 sát thương');
  r.chat({ ...A, comment: ans }, now);
  ok(r.view(now).boss.hp === 570, 'cùng 1 người đánh 2 lần trong 1 câu: không tính thêm');

  now += 12000;
  r.tick(now);
  v = r.view(now);
  ok(v.phase === 'reveal' && v.reveal?.hitsCount === 2 && v.reveal?.totalDmg === 30, 'hết giờ -> công bố: 2 đòn, 30 sát thương');
  now += 3000;
  r.tick(now);
  v = r.view(now);
  ok(v.phase === 'fight' && v.question?.kind === 'type', 'câu 2 là gõ lại cụm từ');
  r.chat({ ...A, comment: correctAnswer(r, now) }, now);
  ok(r.view(now).boss.hp === 546, 'chuỗi 2 của An: (10+2) x2 = 24 sát thương');

  now += 12000;
  r.tick(now);
  now += 3000;
  r.tick(now);
  v = r.view(now);
  ok(v.question?.kind === 'count', 'câu 3 là đếm nhanh');
  r.chat({ ...A, comment: '999' }, now); // đáp án sai (số đếm tối đa 15)
  r.chat({ ...B, comment: correctAnswer(r, now) }, now);
  ok(r.view(now).boss.hp === 522, 'Bình đòn đầu câu 3: chuỗi 2 nên (10+2) x2 = 24 sát thương; An gõ sai bị reset chuỗi');

  now += 12000;
  r.tick(now);
  now += 3000;
  r.tick(now);
  r.chat({ ...A, comment: correctAnswer(r, now) }, now);
  ok(r.view(now).boss.hp === 502, 'An sau khi reset chuỗi: đòn đầu (10+0) x2 = 20, không còn +2 chuỗi');
}

// ---------- hạ boss -> lên cấp, xướng MVP ----------
{
  const r = new NianRoom(t0, rng);
  r.newSession(t0);
  let now = t0 + 4000;
  r.tick(now);
  const team = Array.from({ length: 10 }, (_, i) => P('u' + i, 'Bạn' + i));
  let guard = 0;
  while (r.view(now).phase !== 'down' && guard++ < 60) {
    const ph = r.view(now).phase;
    if (ph === 'fight') {
      const ans = correctAnswer(r, now);
      for (const p of team) r.chat({ ...p, comment: ans }, now);
      if (r.view(now).phase === 'down') break; // vừa kết liễu trong loạt đòn này
      now += 12000;
      r.tick(now);
    } else if (ph === 'reveal') {
      now += 3000;
      r.tick(now);
    } else {
      now += 4000;
      r.tick(now);
    }
  }
  const v = r.view(now);
  ok(v.phase === 'down' && v.down?.level === 1 && v.down.mvp.length === 3 && v.down.killer.length > 0, 'boss gục: có người kết liễu + top 3 MVP');
  ok(v.totals.bossesDown === 1, 'đếm số boss đã hạ = 1');
  now += 9000;
  r.tick(now);
  const v2 = r.view(now);
  ok(v2.phase === 'spawn' && v2.boss.level === 2 && v2.boss.maxHp === 780 && v2.boss.hp === 780, 'boss cấp 2 xuất hiện với 780 máu');
}

// ---------- dây pháo: nạp tim + kết liễu ----------
{
  const r = new NianRoom(t0, rng);
  r.newSession(t0);
  let now = t0 + 4000;
  r.tick(now);
  const lines = r.like(250, now);
  let v = r.view(now);
  ok(v.boss.hp === 570 && v.rage.have === 0, 'đủ 250 tim: dây pháo trừ 5% máu (30), thanh nộ về 0');
  ok(lines.some((l) => l.text.includes('Dây pháo cả phòng')), 'có câu đọc dây pháo');

  // dội thêm tới khi boss còn <= 30 máu rồi kết liễu bằng sao băng
  let guard = 0;
  while (r.view(now).boss.hp > 30 && guard++ < 20) {
    r.like(250, now);
  }
  r.like(250, now); // phát dây pháo kết liễu khi boss còn đúng 30 máu
  ok(r.view(now).phase === 'down' && r.view(now).down?.killer === 'Dây Pháo Cả Phòng', 'dây pháo kết liễu: boss gục, ghi công cả phòng');
}

if (fails) {
  console.error(`boss.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('boss.check: tất cả đều đúng');
