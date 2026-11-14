// Kiểm tra kho tên giả lập: npx tsx src/live/fakeNames.check.ts
// Khách test/demo phải mang tên như username TikTok thường: bốc từ FAKE_NAME_POOL,
// ngẫu nhiên, không lặp trong buổi, không còn mẫu hs0/hs1 lộ bot.
import assert from 'node:assert/strict';
import { FAKE_NAME_POOL, createFakeNameSource, fakeIdentity } from './fakeNames';
import { containsBanned } from './bannedWords';
import { speakableName } from './names';

// RNG tất định để lần chạy nào cũng như nhau
const lcg = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

// ---------- kho tên ----------
assert.equal(FAKE_NAME_POOL.length, 50, 'kho phải có đúng 50 tên chủ kênh đưa');
assert.equal(new Set(FAKE_NAME_POOL).size, 50, 'kho không được trùng tên');
for (const n of FAKE_NAME_POOL) {
  assert.match(n, /^[a-z0-9.]+$/, `tên phải là username ASCII chữ thường: ${n}`);
  assert.ok(!/^hs/i.test(n), `tên không được kiểu hs-số: ${n}`);
  assert.ok(!containsBanned(n), `tên không được dính từ cấm (sân khấu sẽ hiện "bạn"): ${n}`);
  assert.notEqual(speakableName(n), 'bạn', `cô phải đọc được tên: ${n}`);
}

// ---------- bốc trong 1 buổi: đủ kho thì không lặp, thứ tự ngẫu nhiên ----------
const src = createFakeNameSource(FAKE_NAME_POOL, lcg(42));
const first50 = Array.from({ length: 50 }, () => src.next());
assert.equal(new Set(first50).size, 50, '50 lần bốc đầu không được lặp tên');
assert.deepEqual([...first50].sort(), [...FAKE_NAME_POOL].sort(), '50 lần bốc đầu phải là cả kho, mỗi tên 1 lần');
assert.ok(first50.some((n, i) => n !== FAKE_NAME_POOL[i]), 'thứ tự bốc phải xáo trộn, không theo thứ tự kho');

// ---------- hết kho: bốc tiếp vẫn không trùng, biến thể kín đáo, không thành dãy ----------
const more = Array.from({ length: 80 }, () => src.next());
const all = [...first50, ...more];
assert.equal(new Set(all).size, all.length, 'bốc quá kho vẫn không được trùng tên');
for (const n of more) {
  // biến thể = 1 tên trong kho + hậu tố 2-3 số (kiểm theo tiền tố vì có tên kho tự kết thúc bằng số, vd offline404)
  assert.ok(
    FAKE_NAME_POOL.some((b) => n.startsWith(b) && /^\d{2,3}$/.test(n.slice(b.length))),
    `biến thể phải là tên kho + số: ${n}`,
  );
  assert.ok(!/^hs/i.test(n));
}

// ---------- danh tính giả lập: username = nickname (sân khấu + cô đọc đều dùng username) ----------
const id = fakeIdentity();
assert.equal(id.username, id.nickname);
assert.equal(id.avatar, '');
assert.ok(FAKE_NAME_POOL.includes(id.username) || /^([a-z0-9.]+)\d{2,3}$/.test(id.username));

console.log('fakeNames.check: tất cả đều đúng');
