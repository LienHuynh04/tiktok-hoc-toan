// Cấu hình Hồ Cá Vui. Mọi con số chỉnh ở đây, engine (fishing.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Hồ Cá Vui',
  roundSec: 180, // mỗi vòng câu 3 phút: cá to nhất vòng được vương miện
  biteMinSec: 7, // cá cắn câu sau 7-18 giây (mỗi cần thủ một nhịp riêng)
  biteMaxSec: 18,
  likeGoal: 1000, // đủ 1000 tim -> 20 giây cá cắn câu liên tục (nhịp chờ giảm một nửa)
  rareGoal: 100, // đủ 100 cá hiếm -> mở hội 15 giây cắn câu liên tục
  spotlightSec: 5, // ống kính chúc mừng giữ 5 giây mỗi lần lên sóng
  spotlightMinKg: 10, // cá từ 10 kg (hoặc cá hiếm, hoặc phá kỷ lục vòng từ 5 kg) thì lên ống kính
  jerkCooldownMs: 6_000, // lệnh GIẬT: mỗi người 6 giây 1 lần
  baitCooldownMs: 25_000, // lệnh THẢ MỒI: mỗi người 25 giây 1 lần
  idleLineEveryMs: 60_000, // hồ trống: bao lâu mời gọi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  musicVolume: 0.9, // âm lượng nhạc nền hồ câu lúc mở trang (trang điều khiển chỉnh được 0-1)
};
