// Cấu hình Đua Thú Siêu Tốc. Mọi con số chỉnh ở đây, engine (race.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đua Thú Siêu Tốc',
  lobbySec: 18, // thời gian chờ ở vạch xuất phát cho mọi người vào đua
  trackM: 600, // đường đua dài 600m
  baseMin: 3.1, // tốc độ gốc của tay đua chậm nhất (m/giây)
  baseVar: 1.1, // tay đua nhanh nhất hơn tay đua chậm nhất ngần này
  boostMult: 1.85, // gõ đúng khẩu lệnh: tốc độ nhân 1,85 trong boostSec giây
  boostSec: 4,
  eventEverySec: 13, // cứ ~13 giây lại có 1 đợt khẩu lệnh tăng tốc
  eventWindowSec: 5, // mỗi đợt khẩu lệnh mở 5 giây
  tailwindGoal: 150, // đủ 150 tim -> GIÓ THUẬN: cả đoàn tăng tốc (nhịp chơi chung)
  tailwindSec: 10,
  tailwindMult: 1.25,
  finishSec: 10, // có người về nhất: chờ thêm 10 giây cho các bạn khác cán đích
  podiumSec: 9, // hiện bục vinh quang
  raceMaxSec: 240, // đua tối đa 4 phút, hết giờ xếp hạng theo quãng đường
  maxRacers: 40,
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};
