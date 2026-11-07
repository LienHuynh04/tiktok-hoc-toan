// Cấu hình Trang Trí Tết — Nhà Của Chúng Ta. Mọi con số chỉnh ở đây, engine (decor.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Nhà Của Chúng Ta', // hiện trên sân khấu + trang điều khiển
  cooldownMs: 8_000, // mỗi người xem: tối thiểu 8 giây giữa 2 món được nhận treo
  queueMax: 8, // số món đang chờ treo tối đa (ngoài món đang treo)
  walkMs: 1_000, // bé An đi tới vị trí treo
  hangMs: 800, // thời gian treo + món hiện lên
  cheerMs: 650, // ăn mừng xong mới nhận món tiếp theo
  likeGoal: 100, // đủ 100 tim = pháo hoa + đèn sáng cả nhà
  idleLineEveryMs: 55_000, // phòng yên: bao lâu MC nhắc cách chơi 1 lần
  giftThanksCooldownMs: 20_000, // chống spam câu cảm ơn quà
  bigGiftCoins: 50, // quà từ mức này được cảm ơn trang trọng hơn
  chatterMaxWaitMs: 25_000, // câu phụ chờ tối đa rồi bỏ
  giftLineMaxWaitMs: 60_000, // câu cảm ơn quà được chờ lâu hơn
  maxCommentWords: 6, // bình luận dài hơn mức này không tính là xin treo đồ (tránh kéo chat thường vào game)
};
