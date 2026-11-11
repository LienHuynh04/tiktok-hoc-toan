// Cấu hình Đua Vịt. Mọi con số chỉnh ở đây, engine (race.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đua Vịt',
  lobbySec: 15, // thời gian chờ ở vạch xuất phát cho mọi người xuống hồ
  lobbyLikeGoal: 100, // ở sảnh chờ: đủ 100 tim -> xuất phát ngay dù chưa đủ 6 tay đua (chỉ cần >= 2)
  trackM: 200, // hồ bơi dài 200m (như bản gốc người chơi quen thuộc)
  baseMin: 2.5, // tốc độ gốc của tay đua chậm nhất (m/giây) -> chặng đua ~60-80 giây
  baseVar: 1.2, // tay đua nhanh nhất hơn tay đua chậm nhất ngần này
  boostMult: 1.85, // gõ đúng khẩu lệnh: tốc độ nhân 1,85 trong boostSec giây
  boostSec: 4,
  eventEverySec: 13, // cứ ~13 giây lại có 1 đợt khẩu lệnh tăng tốc
  eventWindowSec: 5, // mỗi đợt khẩu lệnh mở 5 giây
  tailwindGoal: 150, // đủ 150 tim -> SÓNG LỚN: cả đoàn tăng tốc (nhịp chơi chung)
  tailwindSec: 10,
  tailwindMult: 1.25,
  finishSec: 10, // có vịt về nhất: chờ thêm 10 giây cho các bạn khác cán đích
  podiumSec: 9, // hiện bục vinh quang
  raceMaxSec: 150, // đua tối đa 2 phút rưỡi, hết giờ xếp hạng theo quãng đường
  maxRacers: 60, // bao nhiêu người vào thì bấy nhiêu vịt trên hồ (sân khấu co giãn làn theo số vịt)
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};
