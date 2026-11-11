// Cấu hình Đua Vịt. Mọi con số chỉnh ở đây, engine (race.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đua Vịt',
  lobbySec: 10, // thời gian chờ ở vạch xuất phát cho mọi người xuống hồ (nhịp nhanh: nhiều chặng/buổi)
  lobbyLikeGoal: 100, // ở sảnh chờ: đủ 100 tim -> xuất phát ngay dù chưa đủ 6 tay đua (chỉ cần >= 2)
  trackM: 200, // hồ bơi dài 200m (như bản gốc người chơi quen thuộc)
  baseMin: 3.4, // tốc độ gốc của tay đua chậm nhất (m/giây) -> chặng đua ~40-55 giây
  baseVar: 1.6, // tay đua nhanh nhất hơn tay đua chậm nhất ngần này
  boostMult: 1.85, // gõ đúng khẩu lệnh: tốc độ nhân 1,85 trong boostSec giây
  boostSec: 4,
  eventEverySec: 11, // cứ ~11 giây lại có 1 đợt khẩu lệnh tăng tốc
  eventWindowSec: 5, // mỗi đợt khẩu lệnh mở 5 giây
  tailwindGoal: 150, // đủ 150 tim -> SÓNG LỚN: cả đoàn tăng tốc (nhịp chơi chung)
  tailwindSec: 10,
  tailwindMult: 1.25,
  // NGOẠI LỆ riêng của Đua Vịt (chủ kênh chốt 2026-11-11, cùng kiểu ngoại lệ ở
  // Đua Xe Kart): người xem thả tim thì vịt của CHÍNH người đó bơi nhanh hơn.
  // Quà vẫn chỉ được cảm ơn, không mua tốc độ — ngoại lệ này chỉ dành cho tim.
  likeBoostStep: 0.1, // mỗi lượt thả tim: +10% tốc cho vịt của người thả
  likeBoostMaxPerEvent: 3, // 1 sự kiện tim tính tối đa 3 lượt (chạm dồn dập cũng có trần)
  likeBoostMax: 0.5, // trần tăng tốc cá nhân: +50%
  likeBoostSec: 4, // tăng tốc giữ 4 giây mỗi lượt, thả tiếp thì cộng dồn và gia hạn
  finishSec: 6, // có vịt về nhất: chờ thêm 6 giây cho các bạn khác cán đích
  podiumSec: 7, // hiện bục vinh quang
  raceMaxSec: 90, // đua tối đa 1 phút rưỡi, hết giờ xếp hạng theo quãng đường
  maxRacers: 60, // bao nhiêu người vào thì bấy nhiêu vịt trên hồ (sân khấu co giãn làn theo số vịt)
  attractField: 8, // hồ luôn sôi động: phòng ít người thật thì vịt demo (tên hài hước + dấu 🤖 trên thẻ) lấp hồ tới chừng này con
  attractRealMax: 4, // đủ chừng này tay đua thật trở lên thì vịt demo rút hết, hồ toàn người thật
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};
