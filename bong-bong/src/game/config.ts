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

  // ----- VỠ LẠ: hồ người vỡ + hấp thụ + vỡ hiếm -----
  absorbRate: 0.3, // người làm nổ nhận 30% phần to vượt mức gốc (growth-1) của nạn nhân, vẫn trần x2,2
  rareChance: 0.1, // 10% lần nổ của người thật là VỠ HIẾM (điểm x2 cho người làm nổ)
  poolCap: 10, // hồ người vỡ hiện tối đa chừng này avatar (mới nhất trước)
  poolY: 1548, // tâm hàng avatar trong hồ (ngay trên panel luật ở chân trang, chừa chỗ cho thẻ tên)
  fallSpeed: 120, // tốc độ rơi dù (px/giây)
  spinMs: 700, // avatar bị văng ra xoay chóng mặt chừng này lâu rồi mới mở dù
  bugFaceMs: 2_000, // biến thể vỡ hiếm: avatar hoá mặt Bug cười 2 giây trước khi mở dù

  // ----- GÂY CẤN: vòng gió thu hẹp -----
  ringGraceMs: 40_000, // đầu vòng yên bình chừng này, sau đó vòng gió mới xuất hiện
  ringStepMs: 20_000, // mỗi chừng này lâu vòng thu hẹp 1 nấc
  ringStartR: 640, // bán kính vòng khi mới xuất hiện (px, tâm = tâm sân)
  ringMinR: 243, // bán kính nhỏ nhất (~45% bề ngang sân)
  ringShrink: 0.82, // mỗi nấc nhân bán kính với hệ số này
  ringCrackMs: 2_500, // ở ngoài vòng liên tục chừng này lâu = nứt 1 vết

  // ----- GÂY CẤN: bom chuyền -----
  bombFirstMs: 55_000, // quả bom đầu tiên của vòng xuất hiện sau chừng này
  bombEveryMinMs: 45_000, // bom tiếp theo: 45–70 giây sau quả trước
  bombEveryMaxMs: 70_000,
  bombMs: 10_000, // đếm ngược 10 giây
  bombTransferCdMs: 3_000, // bom vừa chuyền: giữ ít nhất 3 giây mới chuyền tiếp

  // ----- GÂY CẤN: mục tiêu to nhất -----
  bountyMinGrowth: 1.05, // phải to hơn mức gốc chừng này mới đáng làm mục tiêu
  bountyReevalMs: 15_000, // mục tiêu được chấm lại mỗi chừng này lâu (hoặc ngay khi mục tiêu cũ nổ)

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
