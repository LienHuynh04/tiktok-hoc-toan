// Cấu hình Bug Đi WC. Mọi con số chỉnh ở đây, engine (wc.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Bug Đi WC',

  // ----- Lượt rặn (attempt) -----
  baseNeed: 600, // điểm lực cần cho cấp 1: 1 tim = 1 điểm, ~10 tim/giây là ~60 giây xong
  needScalePerLevel: 1.35, // mỗi cấp táo bón: nhu cầu lực x1,35
  attemptLimitMs: 240_000, // quá 4 phút chưa ra: hết lượt, giữ lại 40% tiến độ
  timeoutCarryRatio: 0.4,
  successBeatMs: 2_500, // khoảnh khắc chiến thắng (Bug nhảy sung sướng)
  intermissionMs: 10_000, // nghỉ giữa lượt: hiện bảng cả buổi 10 giây

  // ----- Tụt tiến độ (áp lực giữ nhịp tim) -----
  decayGraceMs: 3_000, // quá 3 giây không ai thả tim mới bắt đầu tụt
  decayPctPerSec: 0.4, // tụt 0,4% mỗi giây (theo % của nhu cầu lượt), không qua mốc sàn
  milestones: [25, 50, 75], // mốc %: qua mốc là có gag + sàn giữ tiến độ

  // ----- Comment (không dấu cũng nhận) -----
  ranBurstPct: 0.6, // chat "RẶN": +0,6% ngay
  coLenPct: 0.3, // chat "CỐ LÊN": +0,3% ngay
  comboWindowMs: 5_000, // đếm "N người đang rặn cùng": người khác nhau trong 5 giây trượt

  // ----- Buff -----
  waterMs: 10_000, // "NƯỚC": lực tim x1,5 trong 10 giây
  waterMult: 1.5,
  fiberMs: 10_000, // "RAU"/"XƠ": không tụt tiến độ trong 10 giây

  // ----- Chọc mèo / dỗi -----
  teaseAdd: 12, // chat "CHỌC": +12 độ quạu
  sulkMs: 6_000, // quạu 100: Bug dỗi tối đa 6 giây (ngừng rặn, tiến độ vẫn tụt)
  sorryCutMs: 1_500, // mỗi "XIN LỖI": dỗi ngắn đi 1,5 giây
  sulkEndBonusPct: 2, // hết dỗi: adrenaline +2% ngay
  sulkEndAnnoyance: 30, // hết dỗi độ quạu về 30
  annoyDecayPerSec: 2, // không ai chọc: quạu tự nguôi 2/giây
  teaseSayCooldownMs: 6_000, // MC trêu vụ chọc mèo: tối đa 1 câu mỗi chừng này

  // ----- Bong bóng chat trên sân khấu -----
  bubbleMs: 5_000, // bong bóng chat sống 5 giây rồi tan
  bubbleCap: 5, // tối đa 5 bong bóng cùng lúc
  bubbleMaxChars: 40, // cắt chữ chat ở 40 ký tự

  // ----- Hiển thị / nhịp tim -----
  likeRateWindowMs: 3_000, // cửa sổ trượt tính "tim/giây" (3 giây)
  popupSampleMs: 700, // tối đa 1 popup "RẶN!" ghi công người thả tim mỗi chừng này

  // ----- MC -----
  cheerCooldownMs: 18_000, // câu cổ vũ theo nhịp tim: tối đa 1 câu mỗi chừng này
  idleLineEveryMs: 80_000,
  chatterMaxWaitMs: 45_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  giftFxMs: 5_000, // giấy vệ sinh + tim bay khi có quà (hình ảnh thuần tuý)
  musicVolume: 0.85,
};
