// Cấu hình Spider Hero. Mọi con số chỉnh ở đây, engine (hero.ts) chỉ đọc.
import type { FxKind } from './hero';

export const GAME = {
  defaultChannelName: 'Spider Hero',
  gravity: 22, // m/s² — nặng hơn thực một chút cho nhịp bay nhanh, dứt khoát
  runSpeed: 11.5, // tốc độ chạy trên nóc nhà (m/s)
  jumpVel: 8.0, // nhảy khỏi nóc nhà
  releaseAngle: 0.62, // đu tới góc này (rad từ phương thẳng đứng) là buông tơ bay tiếp
  minWebLen: 16,
  maxWebLen: 52,
  anchorMinAhead: 16,
  anchorMaxAhead: 60,
  cruiseMin: 11, // buông tơ mà chậm hơn mức này thì được đẩy thêm cho khỏi rơi nhịp
  milestoneM: 500, // mỗi 500m MC chúc mừng một lần
  hangEveryMs: 45_000, // tối thiểu giữa hai lần treo ngược trình diễn
  hangMs: 2_200, // mỗi lần treo ngược kéo dài 2,2 giây
  hangMinAnchorY: 28, // chỉ treo khi điểm bám đủ cao, tránh đụng nóc nhà bên dưới
  hangLen: 4.6, // sợi tơ treo ngắn dưới điểm bám (m)
  quizFirstMs: 18_000, // câu đố đầu tiên sau khi mở phiên
  quizEveryMs: 40_000, // nhịp ra câu đố tính nhanh
  quizMs: 12_000, // thời gian trả lời mỗi câu
  quizFirstReward: 50, // tim cộng quỹ cho người đúng đầu tiên (+ tăng tốc)
  quizExtraReward: 20, // tim cộng quỹ cho mỗi người đúng tiếp theo trong giờ
  idleLineEveryMs: 60_000,
  chatterMaxWaitMs: 60_000,
  giftLineMaxWaitMs: 30_000,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 50,
  musicVolume: 0.9,
};

/**
 * BẢNG MỐC LIKE — trái tim của game (chỉnh sửa thoải mái ở đây):
 * Tim từ mọi người xem CỘNG DỒN vào một quỹ chung. Cứ mỗi nhịp, engine rút
 * hiệu ứng ĐẮT NHẤT mà quỹ đủ trả, hiệu ứng đang "hồi chiêu" (cooldown) thì bỏ
 * qua, hiệu ứng không hợp trạng thái (nhảy cần đang chạy, lộn cần đang bay)
 * cũng bỏ qua — nên hiệu ứng mới không bao giờ cắt ngang giữa chừng một
 * animation quan trọng. Tim lẻ còn lại luôn đủ cho bắn tơ đơn.
 */
export const LIKE_TIERS: { cost: number; fx: FxKind; cooldownMs: number; label: string }[] = [
  { cost: 1, fx: 'web1', cooldownMs: 150, label: 'Bắn 1 sợi tơ' },
  { cost: 5, fx: 'web5', cooldownMs: 1500, label: 'Bắn 5 sợi tơ' },
  { cost: 10, fx: 'jump', cooldownMs: 4000, label: 'Nhảy cao' },
  { cost: 20, fx: 'webDual', cooldownMs: 3000, label: 'Bắn tơ hai tay' },
  { cost: 50, fx: 'speed', cooldownMs: 9000, label: 'Đu dây tốc độ cao' },
  { cost: 100, fx: 'flip', cooldownMs: 7000, label: 'Lộn vòng trên không' },
  { cost: 200, fx: 'barrage', cooldownMs: 12000, label: 'Mưa tơ nhiều hướng' },
  { cost: 500, fx: 'storm', cooldownMs: 30000, label: 'Bão Tơ' },
  { cost: 1000, fx: 'explosion', cooldownMs: 60000, label: 'Vụ Nổ Tơ' },
  { cost: 5000, fx: 'mega', cooldownMs: 120000, label: 'Siêu Bão Tơ' },
];
