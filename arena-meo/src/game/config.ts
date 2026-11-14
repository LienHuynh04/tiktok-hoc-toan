// Cấu hình Đấu Trường Mèo. Mọi con số chỉnh ở đây, engine (arena.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Đấu Trường Mèo',

  // ----- Đấu trường (toạ độ pixel khung 1080x1920) -----
  arena: { x0: 36, x1: 1044, y0: 470, y1: 1608 },
  catRadius: 54, // bán kính badge mèo (va chạm)
  bossRadius: 148, // bán kính Boss Bug Mập
  maxCats: 24, // trần mèo trong sân cùng lúc (thừa thì chờ vòng sau)
  catSpeedMin: 110, // px/giây, tốc độ nảy ban đầu
  catSpeedMax: 205,
  bossSpeed: 88, // boss to nên đi chậm, nhưng đè ai nấy mệt

  // ----- Sức mạnh: CHỈ kiếm bằng chơi, không mua được -----
  basePower: 10, // sức mạnh gốc của mọi mèo lúc vào sân
  chatPowerCap: 30, // mỗi tin chat của chính chủ: +1 sức mạnh, tối đa +30 mỗi vòng
  koPowerBonus: 2, // hạ được 1 mèo: +2 sức mạnh (cộng dồn trong vòng)
  hpMax: 100,

  // ----- Va chạm / chiến đấu -----
  hitCooldownMs: 350, // 1 cặp mèo chạm nhau: tối đa chừng này ms mới tính đòn tiếp
  bossHitCooldownMs: 450, // 1 mèo chạm boss: nhịp tính đòn riêng
  bossPower: 30, // sức mạnh của boss khi tính đòn nó đánh lại mèo

  // ----- Tim: hồi máu cho mèo của CHÍNH người thả tim -----
  likeHeal: 2, // mỗi lượt tim được nhận: +2 HP cho mèo của chính người đó
  likeHealCooldownMs: 2000, // gộp lượt (batching): giữ tim liên tục cũng chỉ hồi theo nhịp này

  // ----- Boss Bug Mập -----
  bossHpBase: 300,
  bossHpPerCat: 50, // máu boss = 300 + 50 x số mèo đang sống lúc boss vào
  bossFirstMs: 170_000, // boss đầu tiên sau ~3 phút từ đầu buổi
  bossEveryMs: 180_000, // boss tiếp theo cách ~3 phút sau khi boss trước rời sân
  bossDurationMs: 60_000, // quá 60 giây chưa hạ được: boss đập sân, 3 mèo yếu nhất bị loại

  // ----- Vòng đấu -----
  intermissionMs: 10_000, // nghỉ giữa vòng: hiện bảng xếp hạng to 10 giây rồi tự mở vòng mới
  koShowMs: 1_600, // mèo bị hạ hiện xoáy sao chừng này lâu rồi mới tan hẳn

  // ----- Mèo BOT (sưởi sân khi ít người thật) -----
  botFillTo: 4, // người thật đang sống < 4: bot vào đủ chừng này mèo cho sân luôn nhộn
  botNames: ['Mướp 🤖', 'Bông 🤖', 'Xám 🤖', 'Đốm 🤖', 'Mun 🤖', 'Vàng 🤖'],

  // ----- Khác -----
  idleLineEveryMs: 80_000, // MC nhắc luật (câu trung tính) khi phòng im lặng
  chatterMaxWaitMs: 45_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  giftFxMs: 4_000, // trái tim bay quanh mèo của người tặng sau khi có quà
  musicVolume: 0.85,
};
