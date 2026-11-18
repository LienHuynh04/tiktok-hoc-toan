// Cấu hình Cô Bói Tarot. Mọi con số chỉnh ở đây, engine (fortune.ts) chỉ đọc.
export const GAME = {
  defaultChannelName: 'Cô Bói Tarot',
  // ----- Điểm và hàng chờ (cơ chế riêng của game này, chủ kênh chốt 2026-11-18) -----
  likesPerPoint: 100, // 100 tim của 1 người = +1 điểm cho người đó (điểm lẻ: tính đúng số tim / 100, hiện 1 chữ số thập phân)
  queueMax: 40, // hàng chờ tối đa
  queueTopN: 4, // panel hàng chờ trên sân khấu: hiện top 4 + dòng "+N người nữa"
  rankToastMs: 4200, // toast nhảy hạng hiện trên sân khấu ngần này (khớp animation fortune-rank-toast)
  rankToastMinIntervalMs: 3000, // mỗi người: hai lần báo nhảy hạng cách nhau ít nhất ngần này (chống spam khi bão tim)
  questionMaxChars: 140, // câu hỏi hiện trên sân khấu: cắt ở ngần này ký tự
  // ----- Nhịp một lượt xem -----
  // Đã siết nhịp 2026-11-18 (chủ kênh: trải bài nhanh hơn, còn nhiều người đợi): cắt ~40% thời gian
  // CHẾT giữa các bước. Đây chỉ là thời gian SÀN của từng pha: đồng hồ pha bị giữ (hold) trong lúc
  // giọng đang đọc câu chính nên cắt sàn không bao giờ cắt ngang câu nói; pha đọc trên live vẫn dài
  // bằng đúng thời lượng giọng đọc đoạn luận ở tốc độ 1.32.
  welcomeSec: 3, // khách ngồi vào ghế, cô chào và đọc lại câu hỏi
  dealStepMs: 600, // mỗi lá úp xuất hiện cách nhau ngần này
  dealTailMs: 300, // đuôi pha trải bài sau khi lá úp thứ 3 hiện (trước đây để cứng 500 trong engine)
  flipStepMs: 1700, // mỗi lá lật cách nhau ngần này (vẫn đủ hồi hộp: lật 0.95s + ~0.75s chờ)
  flipTailMs: 400, // đuôi pha lật sau lá thứ 3 (trước đây để cứng 600 trong engine)
  readingSec: 10, // sàn của pha đọc: bài luận hiện chữ sau khi lật xong (đồng hồ bị giữ khi giọng đang đọc)
  restSec: 2.5, // nghỉ giữa hai lượt
  reversedChance: 0.25, // tỉ lệ lá ra chiều ngược
  // ----- Chống tĩnh lúc phòng vắng + khách mẫu (chủ kênh chốt 2026-11-18) -----
  idleActCycleMs: 9500, // sân khấu: chu kỳ 1 động tác biểu diễn của cô lúc vắng (động tác ~5.5s + nghỉ)
  idleActOnMs: 5500, // sân khấu: phần đầu mỗi chu kỳ là lúc động tác đang diễn
  demoAfterMs: 40_000, // phòng trống liên tục ngần này (không khách ngồi, hàng chờ rỗng) thì khách mẫu ngồi vào xem thử
  demoFlipStepMs: 700, // khách mẫu đang nhường bàn cho khách thật: nhịp lật các lá còn lại rút xuống ngần này
  demoRestSec: 2, // khách mẫu nhường bàn / khép lượt mẫu: nghỉ ngắn rồi mời khách thật
  // ----- Giọng nói thêm -----
  idleLineEveryMs: 55_000, // phòng trống: bao lâu cô nhắc cách chơi 1 lần
  chatterMaxWaitMs: 60_000, // câu nói thêm chờ quá lâu thì bỏ
  giftLineMaxWaitMs: 30_000, // câu cảm ơn quà chờ tối đa
  giftThanksCooldownMs: 30_000, // cùng 1 người tặng liên tục: cảm ơn 1 lần mỗi 30 giây
  bigGiftCoins: 50, // quà từ mức này luôn được cảm ơn ngay
  disclaimerEvery: 5, // cứ 5 lượt đọc thì nhắc lại 1 lần: chỉ mang tính giải trí
  // ----- Nhạc nền -----
  musicVolume: 0.8,
};

export const POSITIONS = ['Chuyện đang là gì', 'Điều đang cần', 'Nên làm gì'] as const;

export const DISCLAIMER_STAGE =
  'Chỉ để giải trí · Không phải bói toán thật · Không thu phí · Đừng tin để quyết định việc quan trọng';
export const POINTS_NOTE = '100 tim = 1 điểm · 1 🌹 = 1 điểm · Điểm cao lên trước';
