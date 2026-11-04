// Cấu hình game Tính Toán IQ Cao. Mọi con số chỉnh ở đây, engine (iq.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Tính Toán IQ Cao',
  questionSec: 15, // thời gian trả lời mỗi câu (đủ 3 bạn đúng là chốt câu sớm)
  revealSec: 7, // thời gian hiện đáp án + người nhanh nhất
  boardEvery: 5, // cứ 5 câu thì dừng 1 nhịp hiện bảng xếp hạng
  boardSec: 8, // thời gian hiện bảng xếp hạng giữa các chặng
  points: [100, 70, 50], // điểm cho 3 bạn trả lời đúng nhanh nhất
  latePoints: 20, // dự phòng: đúng ngoài top 3 (hiếm khi dùng vì đủ top 3 là chốt câu)
  streakAt: 3, // chuỗi đúng liên tiếp mỗi 3 câu được thưởng thêm
  streakBonus: 30,
  idleLineEveryMs: 45_000, // phòng trống: bao lâu MC nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
};
