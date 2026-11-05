// Kiểm chứng engine Oẳn Tù Xì bằng node:assert — chạy: npm run check
// Luật đòn, thách đấu, thua -> phòng chờ (về theo lượt / theo giờ / theo chuông), hòa đấu lại,
// cô tự gọi (không ra đòn thì không phạt), chống bắt nhầm đòn trong câu thường.
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
const p1 = P('u1', 'An');
const scripted = (seq: number[]) => {
  let i = 0;
  return () => seq[i++] ?? 0.5;
};

// ---------- luật đòn: đủ 9 cặp ----------
ok(judge('bua', 'keo') === 'win' && judge('keo', 'bao') === 'win' && judge('bao', 'bua') === 'win', 'vòng thắng: búa>kéo>bao>búa');
ok(judge('keo', 'bua') === 'lose' && judge('bao', 'keo') === 'lose' && judge('bua', 'bao') === 'lose', 'vòng thua ngược lại');
ok(judge('keo', 'keo') === 'draw' && judge('bua', 'bua') === 'draw' && judge('bao', 'bao') === 'draw', 'giống nhau thì hòa');

// ---------- thách đấu thắng cô ----------
{
  const r = new RpsRoom(t0, scripted([0.99])); // đòn cô: 0.99 -> 'bao'
  r.newSession(t0);
  r.chat({ ...p1, comment: 'kéo' }, t0);
  ok(r.view(t0).queue.length === 1, 'gõ kéo -> vào hàng chờ thách đấu');
  r.tick(t0 + 1600);
  let v = r.view(t0 + 1600);
  ok(v.phase === 'pick' && v.duel?.hasPicked === true, 'lên bảng với đòn đã khóa sẵn');
  r.tick(t0 + 3200);
  ok(r.view(t0 + 3200).phase === 'chant', 'hết giờ chọn -> pha hô');
  r.tick(t0 + 5600);
  v = r.view(t0 + 5600);
  ok(v.phase === 'result' && v.duel?.outcome === 'win' && v.duel?.pick === 'keo' && v.duel?.adminPick === 'bao', 'kéo cắt bao -> thắng');
  ok(v.totals.studentWins === 1 && v.students[0]?.wins === 1, 'thắng cô được 1 sao');
  r.tick(t0 + 10_600);
  ok(r.view(t0 + 10_600).phase === 'idle', 'hết pha kết quả -> chờ lượt mới');
  r.newSession(t0 + 20_000);
  ok(r.view(t0 + 20_000).students[0]?.wins === 0, 'tiết mới: sao trong tiết về 0');
}

// ---------- thua -> phòng chờ, hết giờ thì về ----------
{
  const r = new RpsRoom(t0, scripted([0.99])); // cô ra 'bao', trùm búa
  r.newSession(t0);
  const p2 = P('u2', 'Bình');
  r.chat({ ...p2, comment: 'búa' }, t0);
  r.tick(t0 + 1600);
  r.tick(t0 + 3200);
  r.tick(t0 + 5600); // thua ở đây
  let v = r.view(t0 + 5600);
  ok(v.duel?.outcome === 'lose' && v.totals.adminWins === 1, 'búa thua bao -> cô thắng');
  r.tick(t0 + 10_600); // hết pha kết quả
  v = r.view(t0 + 10_600);
  ok(v.waiting.length === 1 && v.waiting[0].nickname === 'Bình', 'thua -> vào phòng chờ');
  ok(v.students.every((s) => s.nickname !== 'Bình'), 'phòng chờ thì không còn ngồi trong lớp');
  r.tick(t0 + 5600 + 5000 + 60_001); // qua 60 giây chờ
  v = r.view(t0 + 5600 + 5000 + 60_001);
  ok(v.waiting.length === 0, 'hết 60 giây -> tự về lớp');
}

// ---------- hòa -> đấu lại -> lại hòa: không ai đi phòng chờ ----------
{
  const r = new RpsRoom(t0, scripted([0.99, 0.99]));
  r.newSession(t0);
  const p3 = P('u3', 'Chi');
  r.chat({ ...p3, comment: 'bao' }, t0);
  r.tick(t0 + 1600);
  r.tick(t0 + 3200);
  r.tick(t0 + 5600); // hòa lần 1
  let v = r.view(t0 + 5600);
  ok(v.phase === 'pick' && v.duel?.rematch === true, 'hòa -> đấu lại ngay');
  r.chat({ ...p3, comment: 'bao' }, t0 + 5700);
  r.tick(t0 + 5800); // có đòn -> hô luôn
  r.tick(t0 + 8200); // mở đòn: lại hòa
  v = r.view(t0 + 8200);
  ok(v.phase === 'result' && v.duel?.outcome === 'draw' && v.totals.draws === 1, 'hòa lần 2 -> tính hòa, hết lượt');
  ok(v.waiting.length === 0, 'hòa thì không ai ra phòng chờ');
}

// ---------- cô tự gọi: ra đòn trong câu dài vẫn tính; không ra đòn thì không phạt ----------
{
  const r = new RpsRoom(t0, scripted([0.5, 0.5, 0.5]));
  r.newSession(t0);
  const p4 = P('u4', 'Dũng');
  r.join(p4, t0);
  r.tick(t0 + 1600);
  let v = r.view(t0 + 1600);
  ok(v.duel?.auto === true && v.duel?.nickname === 'Dũng', 'hết người thách đấu -> cô gọi 1 bạn lên');
  r.chat({ ...p4, comment: 'ừm mình chọn búa đây' }, t0 + 2000);
  ok(r.view(t0 + 2000).duel?.hasPicked === true, 'đang đấu thì đòn ở giữa câu dài vẫn tính');
  r.tick(t0 + 2100); // hô (cô bốc 0.5 -> búa, hòa)
  r.tick(t0 + 4500); // hòa -> đấu lại
  v = r.view(t0 + 4500);
  ok(v.phase === 'pick' && v.duel?.rematch === true, 'cô gọi mà hòa -> vẫn đấu lại');
  r.tick(t0 + 4500 + 8000); // đấu lại mà không ra đòn -> bỏ qua
  v = r.view(t0 + 12_500);
  ok(v.duel === null && v.totals.duels === 0 && v.waiting.length === 0, 'không ra đòn lại -> bỏ qua, không phạt, không tính lượt');
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

// ---------- chuông 300 tim thả phòng chờ ----------
{
  const r = new RpsRoom(t0, scripted([0.99]));
  r.newSession(t0);
  const p5 = P('u5', 'Khang');
  r.chat({ ...p5, comment: 'búa' }, t0);
  r.tick(t0 + 1600);
  r.tick(t0 + 3200);
  r.tick(t0 + 5600);
  r.tick(t0 + 10_600);
  ok(r.view(t0 + 10_600).waiting.length === 1, 'có 1 bạn đang phòng chờ trước khi rung chuông');
  const lines = r.like(300, t0 + 11_000);
  ok(r.view(t0 + 11_000).waiting.length === 0 && lines.some((l) => l.text.includes('Chuông reo')), 'đủ 300 tim -> chuông reo, phòng chờ về hết');
}

if (fails) {
  console.error(`rps.check: ${fails} ca SAI`);
  process.exit(1);
}
console.log('rps.check: tất cả đều đúng');
