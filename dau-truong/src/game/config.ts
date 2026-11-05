// Cấu hình Đấu Trường Sinh Tồn. Mọi con số chỉnh ở đây, engine (arena.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đấu Trường Sinh Tồn',
  lobbySec: 15, // chờ ở cổng đấu trường cho mọi người vào
  maxFighters: 24, // tối đa 24 quái nhí mỗi vòng (vào trước đấu trước, còn lại chờ vòng sau)
  battleMaxSec: 240, // 1 vòng tối đa 4 phút; hết giờ ai nhiều máu nhất thắng
  ringShrinkSec: 140, // vòng độc thu từ r=52 về r=12 trong 140 giây
  ringDps: 5, // đứng ngoài vòng độc: mất 5 máu/giây
  maxHp: 100,
  baseDps: 9, // sát thương/giây khi áp sát đối thủ (thế SĂN)
  moveSpeed: 7, // tốc độ di chuyển (đơn vị sân/giây); TRỐN nhanh hơn, ĂN chậm hơn
  fleeSpeed: 9.5,
  grazeSpeed: 5,
  regenPerSec: 2.5, // thế ĂN: hồi máu khi đứng ngoài giao tranh 4 giây
  healGoal: 120, // đủ 120 tim -> MƯA HỒI PHỤC: mọi quái còn sống +8 máu (nhịp chơi chung)
  healAmount: 8,
  podiumSec: 9,
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};
