// Cấu hình Đại Chiến Boss. Mọi con số chỉnh ở đây, engine (boss.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đại Chiến Boss',
  questionSec: 12, // mỗi câu 12 giây: cả phòng gõ đáp án, ai đúng là đánh boss 1 đòn
  revealSec: 3, // hiện đáp án + tổng kết đòn sau mỗi câu
  downSec: 9, // ăn mừng khi boss gục + xướng tên MVP
  spawnSec: 4, // boss mới xuất hiện
  baseHp: 600, // máu boss cấp 1
  hpGrowth: 1.3, // mỗi cấp máu nhân thêm 1,3 lần
  hitDamage: 10, // sát thương cơ bản của 1 đòn trúng
  streakBonusCap: 10, // chuỗi trả lời đúng liên tiếp: +2/đòn, tối đa +10
  firstHitMult: 2, // đòn trúng ĐẦU TIÊN của mỗi câu được x2 (đòn chí mạng mở màn)
  enrageMult: 1.5, // boss còn dưới 1/3 máu (dạng cuồng nộ): mọi đòn x1,5
  rageGoal: 250, // đủ 250 tim -> MƯA SAO BĂNG dội boss (chỉ là nhịp chơi, không mua được gì)
  meteorPct: 0.05, // mưa sao băng trừ 5% máu tối đa của boss
  idleLineEveryMs: 60_000, // phòng yên ắng: bao lâu nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  musicVolume: 0.9, // âm lượng nhạc nền lúc mở trang (trang điều khiển chỉnh được 0-1)
};
