// Cấu hình Đua Xe Kart Live. Mọi con số chỉnh ở đây, engine (kart.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đua Xe Kart Live',
  baseSpeed: 25, // tốc độ gốc m/s (~90 km/h hiển thị)
  speedVar: 0.05, // mỗi tay đua ±5% tốc độ gốc (cố định theo tên)
  rubberBand: 0.09, // tụt sau người dẫn đầu >80m: tối đa +9% cho đoàn đua luôn sát nút
  nitroPassive: 2.4, // thanh nitro tự đầy 2,4 điểm/giây khi lái
  padNitro: 25, // cán đệm tăng tốc: +25 nitro
  dodgeNitro: 12, // né chướng ngại thành công: +12 nitro
  skillCost: 100, // kỹ năng tốn TRỌN thanh nitro: NITRO / ĐẠN / KHIÊN chọn 1
  boostMult: 1.45, // NITRO: x1,45 tốc độ
  boostSec: 3,
  padMult: 1.3, // đệm tăng tốc: x1,3
  padSec: 1.2,
  slowMult: 0.5, // đâm chướng ngại: còn nửa tốc độ
  slowSec: 2,
  shotSlowMult: 0.55, // trúng đạn của xe sau
  shotSlowSec: 1.6,
  shotRangeM: 45, // đạn chỉ tới được xe ngay phía trước trong 45m
  shieldSec: 6, // khiên tồn tại 6 giây, chặn 1 đòn
  // ——— ĐUA VÔ HẠN + ĐIỂM (user chốt 2026-11-07): không còn chặng/đích ———
  // Đường đua chạy mãi, người xem vào lúc nào cũng có xe và đua ngay.
  pointEveryM: 100, // cứ chạy được 100m là +pointValue điểm
  pointValue: 1,
  checkpointM: 1000, // mỗi 1000m là 1 cột mốc
  checkpointBonus: [10, 7, 5, 3, 2, 1], // qua cột mốc: thưởng theo HẠNG tại thời điểm qua (hạng 7+ được 1)
  spawnBehindMedianM: 30, // xe mới xuất phát sau tay đua giữa đoàn 30m (gần camera, vào nhịp ngay)
  spawnShieldSec: 3, // xe mới có khiên 3 giây cho quen đường
  idleRetireSec: 600, // 10 phút không tương tác: xe rời đường đua, nhường chỗ cho người mới
  // Tương tác theo ĐẶC TẢ user chốt 2026-11-07 (ngoại lệ riêng của game này):
  // tim và quà tác động thẳng vào xe của người gửi.
  likeNitroPerLike: 0.8, // mỗi tim nạp 0,8 nitro cho xe của người thả (~125 tim = đầy thanh)
  cheerMult: 1.15, // thả tim: xe tăng tốc nhẹ x1,15 trong cheerMs
  cheerMs: 1000,
  giftSmallSec: 2.5, // quà nhỏ (<30 xu): bốc tốc 2,5 giây
  giftBigCoins: 30, // quà từ 30 xu: bốc tốc lâu hơn + làm chậm xe ngay phía trước
  giftBigSec: 4,
  vipBoostMult: 1.6, // quà VIP (>=100 xu): SIÊU TỐC x1,6
  vipBoostSec: 5, // ... trong 5 giây + nạp đầy nitro
  maxRacers: 24,
  laneCooldownMs: 900, // đổi làn liên tục cũng phải có nhịp
  idleLineEveryMs: 75_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  vipGiftCoins: 100, // quà từ 100 xu: SIÊU TỐC + vinh danh VIP
  auraSec: 20, // hào quang vinh danh quanh xe của người tặng
  startNitro: 30, // xuất phát có sẵn 30 nitro
  musicVolume: 0.9,
};
