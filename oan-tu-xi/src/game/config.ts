// Cấu hình Oẳn Tù Xì. Mọi con số chỉnh ở đây, engine (rps.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Oẳn Tù Xì',
  pickWindowSec: 10, // bạn được gọi lên bảng có 10 giây để ra đòn (gõ kéo/búa/bao)
  rematchWindowSec: 8, // hòa thì đấu lại: 8 giây ra đòn mới
  lockedPickDelayMs: 1500, // đã chọn sẵn đòn lúc thách đấu thì chờ 1,5 giây là hô luôn
  chantMs: 2400, // pha hô "Oẳn tù xì" lắc tay trước khi mở đòn
  resultSec: 5, // hiện kết quả 5 giây mỗi lượt
  betweenDuelsMs: 1500, // nghỉ 1,5 giây giữa hai lượt đấu
  duelsPerSession: 15, // mỗi tiết 15 lượt đấu rồi tổng kết + giải lao
  breakSec: 10, // giải lao giữa hai tiết
  waitingSec: 60, // thua thì ra phòng chờ: tối đa 60 giây...
  waitingDuels: 3, // ...hoặc qua 3 lượt đấu của bạn khác thì được về lớp (cái nào đến trước)
  likeBellGoal: 300, // đủ 300 tim -> chuông reo: cả phòng chờ được về lớp (chỉ là nhịp chơi, không tính sao)
  idleLineEveryMs: 60_000, // lớp yên ắng: bao lâu cô nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  musicVolume: 0.9, // âm lượng nhạc nền lúc mở trang (trang điều khiển chỉnh được 0-1)
};
