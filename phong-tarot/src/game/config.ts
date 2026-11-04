// Cấu hình Phòng Tarot. Mọi con số chỉnh ở đây, engine (tarot.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Phòng Tarot',
  pickSec: 20, // thời gian người xem chọn 1 trong 3 lá úp
  revealSec: 18, // thời gian lá bài hiện trên sân khấu sau khi đọc xong (đồng hồ bị giữ khi giọng đang đọc)
  queueMax: 8, // hàng chờ tối đa
  reversedChance: 0.3, // tỉ lệ lá ra chiều ngược
  idleLineEveryMs: 50_000, // phòng trống: bao lâu chủ phòng nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  disclaimerEvery: 5, // cứ 5 lượt đọc thì nhắc lại 1 lần: chỉ mang tính giải trí
  // Chế độ game Lá Bài May Mắn (cả phòng cùng chơi)
  luckyPickSec: 15, // thời gian cả phòng chọn lá mỗi vòng
  luckyRevealSec: 12, // thời gian lật cả 3 lá + công bố điểm mỗi vòng
  luckyWaitSec: 6, // nghỉ giữa hai vòng (hiện bảng xếp hạng)
};
