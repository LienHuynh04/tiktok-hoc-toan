// =====================================================
//  CẤU HÌNH LỚP TOÁN: số liệu. Câu cô đọc nằm ở loi-thoai.ts, câu hỏi do math.ts tự sinh.
// =====================================================

export const GAME = {
  // Tên lớp mặc định (hiện trên bảng hiệu). Chủ kênh đổi ở ô "Tên lớp" trang điều khiển.
  defaultChannelName: 'Lớp Toán',

  // ---------- Một tiết học ----------
  questionsPerRound: 20,
  // LỚP TOÁN: cả 20 câu đều là toán tự sinh (math.ts), theo chương trình LỚP 1 ĐẾN LỚP 12:
  // token math<N> = câu thuộc lớp N; tiết đi từ lớp nhỏ lên lớp lớn rồi ôn trộn các lớp cuối.
  // Câu 20 là câu hỏi vàng nhân đôi điểm.
  // Tiết CHỦ ĐẠO CÂU KHÓ (chủ kênh chốt 2026-11-04: bản cũ quá dễ): chỉ lớp 7-12 + 4 câu
  // hình học khó (token 'geo', hình lớp 6+ và có hình vẽ). Lớp 1-6 chỉ còn gặp khi cả lớp
  // bình chọn khối Lớp 4-6 ở giờ ra chơi.
  // Tiết học CHỈ gồm toán cấp 3 (chủ kênh chốt 2026-11-04): lớp 10-12 + hình học khó.
  // Hình học giữ từ lớp 9 (lượng giác) vì hình học lớp 10 chỉ có vectơ, để 10 thuần sẽ lặp.
  roundPlan: [
    'math10', 'math11', 'geo', 'math12', 'math10',
    'math12', 'math11', 'geo', 'math10', 'math12',
    'math11', 'math12', 'geo', 'math12', 'math10',
    'math12', 'math11', 'geo', 'math12', 'math12',
  ] as const,
  // Các khối lớp cho tiết sau (sau giờ ra chơi): game TỰ CHỌN khối khó nhất (lớp cao nhất), không bình chọn. Khối được chọn chiếm
  // voteTopicQuestions câu trong tiết sau, rải cách 1 câu (xem pickRound trong quiz.ts).
  // 'Hình học' là chủ đề đặc biệt: bốc câu hình học mọi lớp (geo: true).
  mathTopics: [
    { label: 'Lớp 12', levels: [12] },
    { label: 'Lớp 11', levels: [11] },
    { label: 'Lớp 10', levels: [10] },
    { label: 'Hình học', levels: [], geo: true },
  ] as { label: string; levels: number[]; geo?: boolean }[],
  introSec: 8, // cô giới thiệu đầu tiết
  questionSec: 15, // thời gian trả lời (tăng độ khó 2026-11-04: giảm từ 20 xuống 15 giây)
  endAfterFirstSec: 0, // 0 = luôn đủ giờ cho cả lớp. Đặt vd 10: có người đúng thì 10 giây sau chốt luôn (hợp lúc phòng vắng)
  // Tự đổi nhịp: dưới 5 bạn đang chơi (bình luận trong 2 phút) thì có người đúng là 8 giây sau chốt câu
  smallRoomPlayers: 5,
  smallRoomEndAfterSec: 8,
  activeWindowMs: 120_000,
  // Lớp vắng: 5 phút không ai bình luận / tặng quà / thả tim thì tiết sau gắn nhãn "ôn bài" (câu toán vẫn tự sinh mới).
  // Có bạn vào lại thì từ câu kế tiếp đổi sang câu mới.
  emptyRoomMs: 5 * 60_000,
  timeGreetEvery: 4, // ngoài lúc đổi buổi, cứ chừng này tiết cô chào theo giờ một lần
  // Lấp khoảng im lặng lúc chờ trả lời: trong Lớp Toán phần này TẮT lúc đang hỏi (gõ số 1 / 1 chữ dễ lẫn với đáp án số), xem engageTick trong quiz.ts. Hằng số giữ cho tương thích:
  // rủ "ai yêu cô gõ số 1" -> kể chuyện vui / mẹo tiếng Anh -> hỏi bình chọn (miền Bắc gõ B...) -> kể chuyện
  engageEveryMs: 100_000,
  engageOrder: ['love', 'story', 'poll', 'sleep'] as const, // 'sleep': gọi 1 bạn ngủ gật dậy (không ai ngủ thì kể chuyện)
  loveWindowMs: 15_000, // đếm ai gõ trong chừng này rồi cảm ơn / đọc kết quả

  // ---------- Học sinh tương tác trên màn hình ----------
  walkMs: 6000, // tặng hoa: bạn nhỏ đi lên bục đưa hoa cho cô rồi về chỗ
  bubbleMs: 5000, // bong bóng chat trên đầu (không hiện câu trả lời, không hiện câu có từ cấm)
  sleepAfterMs: 5 * 60_000, // ngồi im chừng này thì ngủ gật 💤, thỉnh thoảng cô gọi dậy
  standChance: 0.3, // lúc trêu bạn trả lời sai: tỉ lệ cô phạt lên bục đứng (học sinh cá biệt)
  standSec: 45,
  bonusSec: 10, // hết giờ chưa ai đúng: thêm chừng này giây (câu toán không mở số)
  praiseEvery: 5, // cứ 5 câu cô dừng lại điểm danh bạn nhỏ giỏi, tặng quà top 3 (câu 5, 10, 15)
  praiseSec: 8, // đọc xong còn dừng chừng này giây để các bạn nhỏ chào cô, thả tim rồi mới ra câu tiếp
  giftChance: 0.4, // tỉ lệ cô thưởng quà cho bạn đúng đầu tiên / đúng 3 câu liền
  deskGifts: 4, // mỗi bàn bày tối đa chừng này món quà (mới nhất)
  warnLeftSec: 5, // còn chừng này giây thì cô nhắc "chuẩn bị hết giờ" (đồng hồ không dừng)
  revealSec: 8,
  resultsSec: 12,
  superFastSec: 4, // đúng trong 4 giây đầu: cô nghi "quay cóp"

  // ---------- Điểm ----------
  rankPoints: [10, 7, 5, 3, 3, 3, 3, 3, 3, 3], // nhất 10, nhì 7, ba 5, hạng 4–10 được 3 (câu hỏi vàng x2)
  latePoints: 1, // đúng sau hạng 10 (thường là chép đáp án trên khung chat)
  streakEvery: 3, // đúng 3 câu liền
  streakBonus: 5, // thưởng thêm
  requireDiacritics: true, // phải gõ đủ dấu mới tính đúng ("phan" không ăn "phấn"); dấu kiểu cũ/mới đều được
  keepHiddenLetters: 2, // gợi ý không bao giờ mở quá (số chữ - 2)
  roastChance: 0.6, // tỉ lệ cô cà khịa 1 bạn trả lời sai lúc hiện đáp án

  // ---------- Giờ ra chơi (sau mỗi tiết) ----------
  recessPlaySec: { rps: 20, callup: 15, pick: 20, roll: 12, heart: 30 },
  recessResultSec: 8,
  recessBoardSec: 10, // bảng "học sinh giỏi hôm nay"
  rpsPoints: 2, // oẳn tù tì thắng cô
  callUpPoints: 5, // kiểm tra miệng trả lời đúng
  rollPoints: 3, // điểm danh nhanh
  rollWinners: 10,
  heartTarget: 300, // thử thách thả tim trong 30 giây
  heartBoost: 5, // mỗi tim thật tính thành 5 tim (300 tim chỉ cần 60 tim thật) cho cả lớp dễ thắng; cũng áp cho vỗ tay

  // ---------- Sau giờ ra chơi: cả lớp chọn chủ đề tiết sau ----------
  voteSec: 15, // (không còn dùng: đã bỏ bình chọn, cô tự chọn dạng khó nhất)
  voteTopicQuestions: 5, // dạng toán thắng chiếm chừng này câu của tiết sau

  // ---------- Chuyên cần, sinh nhật ----------
  attendMilestones: [3, 5, 7, 10, 14, 21, 30], // đi học liền đủ chừng này ngày thì cô khen to + tặng quà
  birthdayCooldownMs: 60_000, // 2 lần chúc sinh nhật cách nhau ít nhất 1 phút (chống spam)
  birthdayBannerSec: 10,

  championsKept: 50, // nhớ lớp trưởng của chừng này tiết gần nhất (đếm ai làm lớp trưởng nhiều lần)

  seatActiveMs: 10 * 60_000, // cùng điểm: bạn im quá chừng này (thường đã rời live) nhường ghế cho bạn đang tương tác

  // ---------- Lớp ----------
  seats: 30, // 4 dãy bàn dài trên cùng (7, 7, 8, 8 bạn); dãy cuối nằm dưới giao diện TikTok nên để trống
  rowSeats: [7, 7, 8, 8], // số bạn mỗi dãy, cộng lại = seats (chủ kênh chốt 2026-11-04: bàn dài, các bạn nhỏ lại)
  standing: 60, // hết ghế: chen chúc đứng 2 bên ngoài cửa lớp hóng (30 mỗi bên), vẫn tính điểm
  joinKeywords: ['vaolop'],

  // ---------- Quà / tim ----------
  hintGiftCoins: 30, // quà từ 30 xu: cô cho cả lớp thêm bonusSec giây (khi chưa ai đúng; Lớp Toán không mở số)
  likesPerClap: 300, // đủ 300 tim: cả lớp vỗ tay
  clapSec: 5,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 99,

  // ---------- Nói chuyện ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,
  shareReminderEveryMs: 6 * 60_000,
  idleAfterSec: 75, // không ai comment chừng này giây thì cô nhắc
  // Nhịp giọng: câu chính (đề, đáp án, tổng kết) đọc theo chương trình, đồng hồ dừng trong lúc cô đọc.
  // Câu nói thêm (chào, cảm ơn, cà khịa) chỉ nói lúc đang chờ học sinh trả lời và còn hơn 5 giây.
  chatterMinLeftMs: 5000,
  chatterMaxWaitMs: 35_000, // câu chào chờ được qua 1 vòng câu hỏi, quá thì bỏ
  giftLineMaxWaitMs: 45_000, // cảm ơn quà chờ lâu hơn
  maxHoldMs: 25_000, // mỗi phần dừng đồng hồ tối đa chừng này (phòng giọng bị kẹt)
};
