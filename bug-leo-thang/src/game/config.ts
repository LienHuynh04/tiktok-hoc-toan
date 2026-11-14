// Cấu hình Bug Leo 1000 Bậc. Mọi con số chỉnh ở đây, engine (climb.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Bug Leo 1000 Bậc',

  // ----- Mục tiêu buổi -----
  goalSteps: 1000, // leo đủ chừng này bậc = 1 lượt thắng (WIN)
  winsGoal: 10, // thắng đủ 10 lượt = ĐỈNH GÁC MÁI, bắt đầu vòng buổi mới

  // ----- Leo -----
  autoStepMs: 2000, // Bug tự leo +1 bậc mỗi 2 giây
  likeDrainPerSec: 60, // năng lượng tim xả ra tối đa chừng này bậc/giây (leo thành từng đợt)
  leoSteps: 3, // lệnh LEO: +3 bậc
  leoCooldownMs: 5000, // mỗi người gõ LEO cách nhau tối thiểu 5 giây
  leapSteps: 8, // lệnh NHẢY: vọt +8 bậc...
  leapSlipChance: 0.25, // ...nhưng 25% trượt chân
  leapSlipSteps: 5, // trượt: tụt 5 bậc

  // ----- Chướng ngại (chỉ máy tạo ra, quà KHÔNG tạo chướng ngại / không cộng bậc) -----
  dayClearRange: 70, // ĐẨY dọn được chướng ngại còn cách Bug chừng này bậc phía trước
  hazardFirstMs: 40_000, // chướng ngại đầu tiên sau chừng này từ đầu buổi
  hazardMinMs: 35_000, // chướng ngại cách nhau 35–70 giây (độ khó cao thì dày hơn)
  hazardMaxMs: 70_000,
  hazardSpeed: 16, // chướng ngại lăn xuống chừng này bậc/giây
  hazardSpawnAhead: 90, // xuất hiện cách Bug chừng này bậc phía trên
  yarnMin: 10, // cuộn len húc trúng: tụt 10–25 bậc
  yarnMax: 25,
  slipperDamage: 15, // dép của Sen: tụt đúng 15 bậc
  tumbleMs: 1600, // Bug lăn lộn chừng này lâu sau khi bị húc

  // ----- Ngủ gật -----
  napFirstMs: 110_000, // giấc ngủ gật đầu tiên
  napEveryMinMs: 100_000, // sau đó cứ ~100–140 giây lại buồn ngủ
  napEveryVarMs: 40_000,
  napMs: 5000, // ngủ gật 5 giây (tự dậy nếu cả phòng không gọi)
  napWakeLeo: 10, // đủ 10 lệnh LEO là Bug tỉnh ngay

  // ----- Bậc trơn -----
  slipperyBands: [
    [300, 330],
    [620, 650],
    [880, 910],
  ] as [number, number][],
  bandWidenPerDifficulty: 5, // mỗi độ khó tăng: mỗi dải trơn rộng thêm chừng này bậc mỗi phía

  // ----- Khác -----
  idleLineEveryMs: 90_000, // MC nhắc luật (câu trung tính) khi phòng im lặng
  chatterMaxWaitMs: 45_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.85,
};

// Đường leo trên ảnh nền (toạ độ theo tỉ lệ 0–1 của ảnh stairs-bg.png):
// sàn -> cầu thang thảm đỏ lên trái -> chiếu nghỉ trái -> cầu thang gỗ lên phải ->
// chiếu nghỉ phải -> cầu thang trên lên trái -> chiếu nghỉ đỉnh -> cửa gác mái.
export const STAIR_PATH: { x: number; y: number }[] = [
  { x: 0.775, y: 0.94 }, // sàn nhà, điểm xuất phát
  { x: 0.74, y: 0.912 }, // các bậc thảm đỏ (đo lại theo tranh sau khi chụp kiểm tra)
  { x: 0.655, y: 0.845 },
  { x: 0.565, y: 0.775 },
  { x: 0.485, y: 0.71 },
  { x: 0.42, y: 0.655 },
  { x: 0.365, y: 0.62 },
  { x: 0.315, y: 0.625 }, // chiếu nghỉ trái (cạnh chậu cây)
  { x: 0.4, y: 0.615 }, // chân cầu thang gỗ giữa
  { x: 0.47, y: 0.585 },
  { x: 0.54, y: 0.535 },
  { x: 0.6, y: 0.49 },
  { x: 0.66, y: 0.445 },
  { x: 0.72, y: 0.4 },
  { x: 0.775, y: 0.365 },
  { x: 0.815, y: 0.345 }, // chiếu nghỉ phải (cạnh chậu cây nhỏ)
  { x: 0.68, y: 0.3 }, // cầu thang trên
  { x: 0.55, y: 0.265 },
  { x: 0.43, y: 0.23 },
  { x: 0.315, y: 0.2 }, // chiếu nghỉ đỉnh
  { x: 0.5, y: 0.175 }, // cửa gác mái: con cá to (bậc 1000)
];
