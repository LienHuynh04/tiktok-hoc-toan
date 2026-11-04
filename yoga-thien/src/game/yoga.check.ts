// Kiểm chứng engine yoga + nhận diện tư thế: npx tsx src/game/yoga.check.ts
import { YogaRoom } from './yoga';
import { findPose } from './poses';

let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fails++;
    console.error('SAI:', msg);
  }
};

// --- nhận diện tư thế từ bình luận (không cần dấu) ---
ok(findPose('cho em tập cái cây')?.key === 'cay', 'cái cây');
ok(findPose('HOA SEN')?.key === 'sen', 'hoa sen');
ok(findPose('mình muốn ngồi thiền')?.key === 'sen', 'thiền -> hoa sen');
ok(findPose('chiến binh 2 đi chị')?.key === 'chienbinh', 'chiến binh 2');
ok(findPose('tập chó úp mặt đi')?.key === 'choup', 'chó úp mặt');
ok(findPose('rán hổ mang')?.key === 'nhansu', 'rắn hổ mang (có dấu)');
ok(findPose('nhân sư')?.key === 'nhansu', 'nhân sư');
ok(findPose('em bé')?.key === 'embe', 'em bé');
ok(findPose('cây cầu')?.key === 'cau', 'cây cầu');
ok(findPose('tam giác')?.key === 'tamgiac', 'tam giác');
ok(findPose('thư giãn thôi cả lớp')?.key === 'thugian', 'thư giãn');
ok(findPose('live hay quá') === null, 'câu thường không ra tư thế');
ok(findPose('càng tập càng khoẻ') === null, '"càng" không bị nhận nhầm là cây/cầu');

// --- engine ---
const t0 = 1_000_000;
const room = new YogaRoom(t0);
room.newSession(t0);
const p1 = { username: 'u1', nickname: 'An', spoken: 'An', avatar: '' };
const p2 = { username: 'u2', nickname: 'Bình', spoken: 'Bình', avatar: '' };

let v = room.view(t0);
ok(v.poseKey === 'sen' && v.auto && v.musicOn, 'mở lớp ở Hoa Sen, nhạc bật sẵn');

// lớp đang tự tập -> yêu cầu đầu tiên vào thẳng
room.chat({ ...p1, comment: 'tập cái cây đi' }, t0 + 1000);
v = room.view(t0 + 1000);
ok(v.poseKey === 'cay' && v.byName === 'An' && v.totalPoses === 1, 'yêu cầu đầu vào thẳng Cái Cây');
ok(v.mats.length === 1, 'người gọi được nhận thảm');

// yêu cầu thứ hai vào hàng chờ
room.chat({ ...p2, comment: 'chiến binh' }, t0 + 2000);
v = room.view(t0 + 2000);
ok(v.queue.length === 1 && v.queue[0].label === 'Chiến Binh II', 'yêu cầu 2 vào hàng chờ');

// cùng 1 người gọi dồn trong 12s -> bỏ qua
room.chat({ ...p2, comment: 'tam giác' }, t0 + 3000);
v = room.view(t0 + 3000);
ok(v.queue.length === 1, 'chống spam 12s');

// hết giờ tư thế -> sang hàng chờ
const end = t0 + 1000 + 24_000;
room.tick(end + 10);
v = room.view(end + 10);
ok(v.poseKey === 'chienbinh' && v.byName === 'Bình', 'hết giờ sang tư thế chờ');

// hết giờ, hàng chờ rỗng -> tự chảy FLOW: sau chienbinh là tamgiac
room.tick(end + 10 + 24_000);
v = room.view(end + 10 + 24_000);
ok(v.poseKey === 'tamgiac' && v.auto, 'tự chảy sang Tam Giác');

// tim đủ 100 -> mưa hoa
room.like(99, end);
ok(!room.view(end).flowers, '99 tim chưa mưa hoa');
room.like(1, end);
ok(room.view(end).flowers, '100 tim -> mưa hoa sen');

// follow nhận thảm + chủ phòng vào thẳng tư thế + skip vòng FLOW
room.follow(p2);
ok(room.view(end).matCount === 2, 'follow nhận thảm');
room.forcePose('thugian', end);
ok(room.view(end).poseKey === 'thugian', 'chủ phòng vào thẳng Thư Giãn');
room.skip(end);
ok(room.view(end).poseKey === 'sen', 'skip ở cuối FLOW quay về Hoa Sen');

if (fails) {
  console.error(`yoga.check: ${fails} lỗi`);
  process.exit(1);
}
console.log('yoga.check: tất cả đều đúng');
