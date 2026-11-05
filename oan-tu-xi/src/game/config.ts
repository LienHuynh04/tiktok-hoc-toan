// Cấu hình Oẳn Tù Xì. Mọi con số chỉnh ở đây, engine (rps.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Oẳn Tù Xì',
  matchHearts: 3, // mỗi trận 3 tim: thắng 1 lượt ném thì đối thủ mất 1 tim, hết tim là thua trận
  pickWindowSec: 8, // mỗi lượt ném có 8 giây để ra đòn (gõ kéo/búa/bao)
  lockedPickDelayMs: 1500, // lượt đầu đã chọn sẵn đòn lúc thách đấu thì chờ 1,5 giây là hô luôn
  chantMs: 2200, // pha hô "Oẳn tù xì" lắc tay trước khi mở đòn
  throwSec: 3.2, // hiện kết quả 1 lượt ném
  matchEndSec: 5.5, // hiện kết quả cả trận (ăn mừng / ra ghế chờ)
  betweenMatchesMs: 1500, // nghỉ 1,5 giây giữa hai trận
  suddenDeathThrow: 7, // từ lượt ném thứ 7: ai thua lượt là thua cả trận luôn (đột tử)
  matchesPerSession: 10, // mỗi vòng 10 trận rồi tổng kết + giải lao
  breakSec: 10, // giải lao giữa hai vòng
  waitingSec: 60, // thua trận thì ra ghế chờ: tối đa 60 giây...
  waitingMatches: 3, // ...hoặc qua 3 trận đấu nữa thì được về (cái nào đến trước)
  likeBellGoal: 300, // đủ 300 tim -> chuông reo: cả ghế chờ được về ngay (chỉ là nhịp chơi, không tính sao)
  idleLineEveryMs: 60_000, // phòng yên ắng: bao lâu nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  musicVolume: 0.9, // âm lượng nhạc nền lúc mở trang (trang điều khiển chỉnh được 0-1)
};
