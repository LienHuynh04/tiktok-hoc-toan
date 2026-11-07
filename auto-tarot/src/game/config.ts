// Cấu hình Auto Tarot Live. Mọi con số chỉnh ở đây, engine (tarot.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Auto Tarot Live',
  topicSec: 30, // người chơi gõ TAROT mà chưa kèm chủ đề: có 30 giây để chọn chủ đề, quá hạn tự huỷ phiên
  pickSec: 5, // người đang được xem có 5 giây gõ 1/2/3 chọn lá (nhịp nhanh như Phòng Tarot, chủ kênh chốt 2026-11-07), quá hạn tự chọn lá giữa
  revealSec: 15, // thời gian lá bài + lời giải hiện trên sân khấu (giảm 22 → 15 theo ý chủ kênh 2026-11-07 cho nhịp nhanh; đồng hồ vẫn bị giữ khi giọng đang đọc nên không cắt ngang câu)
  queueMax: 8, // hàng chờ (đã có chủ đề) tối đa
  choosingMax: 6, // số người đang ở bước chọn chủ đề tối đa cùng lúc
  cooldownOthers: 2, // vừa xem xong phải nhường ít nhất 2 lượt của người khác mới được xem lại
  cooldownMs: 300_000, // hoặc chờ đủ 5 phút thì hết khoá lượt (điều kiện nào tới trước)
  reversedChance: 0.3, // tỉ lệ lá ra chiều ngược
  idleLineEveryMs: 50_000, // phòng trống: bao lâu chủ phòng nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  disclaimerEvery: 5, // cứ 5 lượt đọc thì nhắc lại 1 lần: chỉ mang tính giải trí
};
