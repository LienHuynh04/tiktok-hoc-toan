// Cấu hình Phòng Yoga Thiền. Mọi con số chỉnh ở đây, engine (yoga.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Phòng Yoga Thiền',
  poseSec: 24, // mỗi tư thế giữ 24 giây (nhịp thở chậm), đồng hồ bị giữ khi giọng đang đọc
  queueMax: 5, // lịch tư thế chờ tối đa
  reqCooldownMs: 12_000, // mỗi người gọi tư thế cách nhau ít nhất 12 giây
  likeGoal: 100, // đủ 100 tim -> mưa cánh hoa sen
  idleLineEveryMs: 60_000, // phòng trống: bao lâu nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
};
