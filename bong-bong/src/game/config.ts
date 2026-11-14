// Cấu hình Bong Bóng Avatar. Mọi con số chỉnh ở đây, engine (bubbles.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Bong Bóng Avatar',

  // ----- Sân nổi (toạ độ pixel khung 1080x1920, khớp vùng sáng giữa của tranh nền) -----
  field: { x0: 36, x1: 1044, y0: 430, y1: 1690 },
  baseRadius: 46, // bán kính bong bóng gốc (px)
  maxBubbles: 40, // trần bong bóng cùng lúc trên sân
  floatTop: 540, // vùng độ cao nổi cá nhân của mỗi bong bóng
  floatBottom: 1420,

  // ----- Tăng kích thước: CHỈ bằng tim/chat của chính chủ, không mua được -----
  growthCap: 2.2, // trần hệ số to: x2,2 bán kính gốc
  likeGrow: 0.03, // mỗi lượt tim được nhận (đã gộp nhịp): +3% hệ số to
  likeBatchMs: 1500, // gộp lượt tim: giữ tim liên tục cũng chỉ lớn theo nhịp này
  chatGrow: 0.01, // mỗi tin chat tiếp của chính chủ: +1% hệ số to

  // ----- Đụng nhau / nứt / nổ -----
  crackRatio: 1.35, // bong bóng to hơn ít nhất 35% mới làm nứt được bong bóng nhỏ hơn
  crackSpeed: 70, // tốc độ tương đối tối thiểu (px/giây) để cú đụng đủ mạnh gây nứt
  cracksToPop: 3, // 3 vết nứt là nổ BỐP
  pairCooldownMs: 320, // 1 cặp bong bóng: tối thiểu chừng này ms mới tính cú đụng tiếp
  respawnLockMs: 8000, // nổ xong: 8 giây sau comment lại mới có bong bóng mới

  // ----- Bong bóng vàng -----
  goldenEveryMs: 90_000, // ~90 giây có 1 bong bóng vàng
  goldenMs: 15_000, // vàng trong 15 giây: không bị nứt, nổ người khác tính đôi

  // ----- Sự kiện máy (KHÔNG phải quà) -----
  fanEveryMs: 50_000, // ~50 giây 1 cơn gió quạt
  fanMs: 3_000, // gió thổi 3 giây
  fanWind: 300, // sức gió (px/giây cộng vào vận tốc ngang)
  pawFirstMs: 140_000, // chân Bug lần đầu sau ~2,3 phút
  pawEveryMs: 150_000, // sau đó mỗi ~2,5 phút
  pawShowMs: 1_400, // chân Bug hiện trên sân chừng này lâu

  // ----- Vòng đấu -----
  intermissionMs: 8_000, // nghỉ giữa vòng: hiện bảng 8 giây rồi tự mở vòng mới
  popShowMs: 1_500, // hiệu ứng nổ hiện chừng này lâu

  // ----- Bong bóng BOT (sưởi sân khi ít người thật) -----
  botFillTo: 6, // người thật đang nổi < 4: bot vào cho sân đủ chừng này bong bóng
  botRealThreshold: 4, // đủ chừng này người thật đang nổi: bot rút sạch
  botNames: ['Mướp 🤖', 'Bông 🤖', 'Xám 🤖', 'Đốm 🤖', 'Mun 🤖', 'Vàng 🤖', 'Tép 🤖'],

  // ----- Khác -----
  idleLineEveryMs: 80_000, // MC nhắc luật (câu trung tính) khi phòng im lặng
  chatterMaxWaitMs: 45_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.85,
};
