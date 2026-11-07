// Cấu hình Mèo Thủ Vườn. Mọi con số chỉnh ở đây, engine (defense.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Mèo Thủ Vườn',
  lanes: 5, // 5 làn chuột tiến vào
  cols: 6, // mỗi làn 6 ô trồng hậu vệ
  startSun: 150, // nắng khởi điểm của cả vườn
  skySunEverySec: 9, // trời tự thả nắng
  skySunValue: 25,
  sunCap: 999,
  offerEverySec: 6, // cứ 6 giây đổi "hậu vệ đang cầm" cho cả phòng trồng
  restSec: 12, // nghỉ giữa hai đợt chuột
  waveClearBonus: 50, // dọn sạch 1 đợt: thưởng nắng cho cả vườn
  likeGoal: 120, // đủ 120 tim -> MƯA NẮNG cho cả vườn (nhịp chơi chung)
  likeSun: 75,
  houseHp: 5, // nhà có 5 tim; chó gác mỗi làn cứu được 1 lần trước khi mất tim
  overSec: 15, // thua: hiện bảng tổng kết 15 giây rồi chơi ván mới
  followSun: 50, // follow mới: tặng cả vườn 50 nắng (mỗi người 1 lần)
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};
