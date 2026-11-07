// Kiểm tra tự động cho Trang Trí Tết: khớp hình theo chữ gõ + engine treo đồ. Chạy: npm run check
import assert from 'node:assert/strict';
import { DecorRoom, type ChatIn } from './decor';
import { ASSETS, matchAsset } from './assets';
import { GAME } from './config';

const t0 = 1_000_000;
function chat(r: DecorRoom, i: number, comment: string, at: number, safe = true) {
  const e: ChatIn = { username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '', comment, safe };
  return r.chat(e, at);
}
// chạy hết 1 lượt treo (đi -> treo -> ăn mừng -> xong), trả về mốc thời gian mới
function serve(r: DecorRoom, at: number): number {
  r.tick(at);
  r.tick(at + GAME.walkMs + 1);
  r.tick(at + GAME.walkMs + GAME.hangMs + 2);
  r.tick(at + GAME.walkMs + GAME.hangMs + GAME.cheerMs + 3);
  return at + GAME.walkMs + GAME.hangMs + GAME.cheerMs + 4;
}

// ---------- khớp chữ -> hình ----------
assert.equal(matchAsset('con chó')?.id, 'con-cho', 'gõ con chó ra hình con chó');
assert.equal(matchAsset('treo con chó đi')?.id, 'con-cho', 'câu dài hơn vẫn khớp con chó');
assert.equal(matchAsset('Con Mèo')?.id, 'con-meo', 'không phân biệt hoa thường/dấu');
assert.equal(matchAsset('long den')?.id, 'long-den', 'gõ không dấu vẫn ra lồng đèn');
assert.equal(matchAsset('pháo')?.id, 'day-phao');
assert.equal(matchAsset('hong bao')?.id, 'bao-li-xi', 'hồng bao là lì xì, không phải hoa hồng');
assert.equal(matchAsset('trang trí')?.id, undefined, '"trang trí" không bị bắt nhầm thành mặt trăng');
assert.equal(matchAsset('xe tăng'), null, 'món lạ chưa có hình -> null để engine làm thẻ tên');
assert.ok(ASSETS.length >= 40, `thư viện phải nhiều hình (đang có ${ASSETS.length})`);
for (const a of ASSETS) {
  assert.ok(a.draw(0).length > 40 && a.draw(1).length > 40, `hình ${a.id} vẽ được mọi biến thể`);
  assert.ok(!a.draw(0).includes('undefined'), `hình ${a.id} không lỗi chuỗi`);
}

// ---------- treo 1 món: đi -> hiện hình -> xong ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  chat(r, 1, 'con chó', t0);
  r.tick(t0);
  assert.equal(r.view(t0).current?.name, 'Con chó', 'món đang treo là con chó');
  const now = serve(r, t0);
  const v = r.view(now);
  assert.equal(v.total, 1);
  assert.equal(v.placed[0].assetId, 'con-cho');
  assert.equal(v.placed[0].zone, 'san', 'con chó đứng ở sân');
  assert.equal(v.placed[0].byName, 'Bạn 1');
  assert.equal(v.top[0].count, 1);
  assert.equal(v.feed[0].name, 'Con chó');
  assert.equal(v.current, null, 'treo xong thì rảnh');
}

// ---------- món lạ -> thẻ tên ghi đúng chữ đã gõ ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  chat(r, 1, 'xe tăng', t0);
  const now = serve(r, t0);
  const v = r.view(now);
  assert.equal(v.total, 1);
  assert.equal(v.placed[0].assetId, 'tag');
  assert.equal(v.placed[0].label, 'xe tăng', 'thẻ ghi đúng chữ người chơi gõ');
}

// ---------- chat thường không bị kéo vào game ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  chat(r, 1, 'hay qua', t0);
  chat(r, 2, 'live hay quá mọi người ơi vào xem nè vui lắm luôn', t0);
  chat(r, 3, 'cho mình hỏi hôm nay live tới mấy giờ vậy bạn', t0);
  const now = serve(r, t0);
  assert.equal(r.view(now).total, 0, 'chat thường không thành đồ trang trí');
}

// ---------- giãn cách + mỗi người 1 món chờ ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  chat(r, 1, 'con chó', t0);
  chat(r, 1, 'con mèo', t0 + 100); // đang có món chờ -> bỏ qua
  let now = serve(r, t0);
  assert.equal(r.view(now).total, 1);
  chat(r, 1, 'con mèo', now); // vừa treo xong, còn trong 8 giây giãn cách -> bỏ qua
  now = serve(r, now);
  assert.equal(r.view(now).total, 1, 'chưa hết giãn cách thì chưa nhận món mới');
  chat(r, 1, 'con mèo', t0 + GAME.cooldownMs + 1000); // hết giãn cách -> nhận
  now = serve(r, t0 + GAME.cooldownMs + 1000);
  assert.equal(r.view(now).total, 2);
  assert.equal(r.view(now).placed[1].assetId, 'con-meo');
}

// ---------- nhiều người: đúng thứ tự ai gõ trước treo trước ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  chat(r, 1, 'lồng đèn', t0);
  chat(r, 2, 'bánh chưng', t0 + 10);
  chat(r, 3, 'máy bay', t0 + 20);
  let now = serve(r, t0);
  assert.equal(r.view(now).placed[0].assetId, 'long-den');
  now = serve(r, now);
  assert.equal(r.view(now).placed[1].assetId, 'banh-chung');
  now = serve(r, now);
  assert.equal(r.view(now).placed[2].assetId, 'may-bay');
}

// ---------- tim: đủ mốc thì pháo hoa ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  assert.deepEqual(r.like(60, t0), []);
  const lines = r.like(50, t0 + 1);
  assert.ok(lines.some((l) => l.text.includes('pháo hoa')), 'đủ 100 tim thì có câu pháo hoa');
  assert.equal(r.view(t0 + 1).fireworksAt, t0 + 1);
  assert.equal(r.view(t0 + 1).likeGoal, 200, 'mốc tiếp theo là 200');
}

// ---------- follow: tặng bao lì xì treo lên cây ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  r.follow({ username: 'u9', nickname: 'Bạn 9', spoken: 'Bạn 9', avatar: '' }, t0);
  const now = serve(r, t0);
  assert.equal(r.view(now).placed[0].assetId, 'bao-li-xi');
  assert.equal(r.view(now).placed[0].zone, 'cay');
}

// ---------- ô treo không trùng nhau, kín ô thì xếp chồng lệch nhẹ vẫn trong sân khấu ----------
{
  const r = new DecorRoom(t0);
  r.newSession(t0);
  let now = t0;
  for (let i = 0; i < 9; i++) {
    chat(r, 100 + i, 'lồng đèn', now);
    now = serve(r, now);
  }
  const v = r.view(now);
  assert.equal(v.total, 9, 'treo được 9 lồng đèn dù vùng mái chỉ có 7 ô');
  const keys = new Set(v.placed.slice(0, 7).map((p) => `${p.x},${p.y}`));
  assert.equal(keys.size, 7, '7 món đầu nằm 7 ô khác nhau trên mái');
  for (const p of v.placed) {
    assert.ok(p.x >= 40 && p.x <= 1040 && p.y >= 60 && p.y <= 1860, 'mọi món đều trong khung sân khấu');
  }
}

console.log('TRANG TRI TET CHECK: PASS');
