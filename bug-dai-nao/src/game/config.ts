// Cấu hình Bug Đại Náo Nhà Sen. Mọi con số chỉnh ở đây, engine (bug.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Bug Đại Náo Nhà Sen',

  // ----- Sân khấu / vùng trong phòng (toạ độ pixel khung 1080x1920) -----
  room: { x0: 30, x1: 1050, y0: 470, y1: 1560 },
  catchDist: 50, // Sen tới gần Bug chừng này (px) thì bắt được
  graceMs: 3000, // sau khi bị bắt / né thành công: chừng này ms Sen không bắt lại được
  senStunMs: 1600, // Sen choáng sau khi bị né / ăn vạ

  // ----- Sen AI -----
  senBaseSpeed: 52, // px/giây lúc mở buổi, phòng vắng
  senPerMinute: 3.2, // mỗi phút trôi qua Sen nhanh thêm chừng này (trần senTimeCap)
  senTimeCap: 42,
  senPerChatter: 2.4, // mỗi người đang hoạt động: Sen nhanh thêm chừng này (trần senChatterCap)
  senChatterCap: 48,
  chatterWindowMs: 120_000, // "đang hoạt động" = có chat trong chừng này ms gần đây

  // ----- Bug -----
  bugBaseSpeed: 215, // px/giây khi CHẠY (cấp mập 1)
  bugFatSlowPerStage: 0.07, // mỗi cấp mập: Bug chạy chậm đi 7%
  idleRoamMs: 6500, // không ai ra lệnh chừng này lâu -> Bug tự đi phá lặt vặt
  hangMs: 4200, // đu đèn được chừng này lâu rồi phải thả xuống bàn
  rideMs: 6000, // cưỡi robot được chừng này lâu

  // ----- Nhiệm vụ / combo -----
  comboWindowMs: 5000, // combo: đủ số lệnh trong cửa sổ này
  comboBase: 3, // combo tối thiểu khi phòng vắng
  comboPerChatters: 0.5, // ngưỡng combo = base + chatters * hệ số này (trần comboCap)
  comboCap: 30,

  // ----- Vote -----
  voteFirstMs: 100_000, // vote đầu tiên sau chừng này ms từ đầu buổi
  voteEveryMinMs: 120_000, // vote tiếp theo cách nhau 2–3 phút
  voteEveryVarMs: 60_000,
  voteMs: 10_000, // mỗi đợt vote kéo dài 10 giây

  // ----- Tim -> cân nặng (tiến trình CẢ BUỔI, không reset theo chương) -----
  kgStart: 3.2,
  kgMax: 9.0,
  kgPerLike: 0.002, // 1000 tim = +2kg
  // Mốc cân nặng bắt đầu các cấp mập 2..5 (cấp 1 là lúc bắt đầu)
  fatThresholds: [4.4, 5.6, 6.8, 8.0],
  fatNames: ['GẦY', 'HƠI TRÒN', 'MẬP', 'BỤNG BỰ', 'BOSS MẬP'],
  fatUnlocks: ['đẩy cốc', 'xô chậu cây', 'leo rèm', 'đu đèn · cưỡi robot', 'PHÁ CẢ SOFA!'],
  zoomiesGoal: 500, // đủ chừng này tim (cộng dồn riêng) -> Bug zoomies 1 đợt
  zoomiesMs: 6000,

  // ----- Lì -----
  liMax: 5,
  liStart: 1,

  // ----- Chương -----
  catchesToLose: 3, // Sen bắt đủ 3 lần trong 1 chương = Sen thắng chương đó

  // ----- Khác -----
  idleLineEveryMs: 75_000, // MC nhắc luật chơi (câu trung tính) khi phòng im lặng
  chatterMaxWaitMs: 45_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.85,
};
