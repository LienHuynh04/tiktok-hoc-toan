# Oẳn Tù Xì: ghi chú cho Claude

> Game dựng 2026-11-05 từ khung Hồ Cá Vui/Phòng Tarot (giữ ống nước: server, giọng đọc, SSE,
> snapshot, nhạc), thư mục `oan-tu-xi/` trong repo tiktok-hoc-toan, cổng **3013**. Chủ kênh yêu cầu:
> user đấu với admin, thua thì ra phòng chờ, UI kiểu lớp học của Lớp Toán.

- Luật bất biến: đòn của cô bốc ngẫu nhiên công bằng (rng inject được để check); quà chỉ cảm ơn,
  tim chỉ rung chuông thả phòng chờ (300 tim) — KHÔNG thứ gì đổi được sao/lượt đấu. Câu chữ trên sóng
  chỉ nêu luật chơi trung tính, không kêu gọi thả tim/follow/share.
- Bắt đòn trong bình luận (rps.ts pickFrom): đòn chỉ tính khi là TỪ ĐẦU TIÊN của câu hoặc cả câu
  ≤2 từ; riêng bạn đang đấu thì đòn ở bất cứ đâu trong câu cũng tính. Đừng nới lỏng: "ăn kẹo",
  "bao giờ" sẽ bị bắt nhầm. (Đánh đổi đã biết: câu bắt đầu bằng "bao giờ..." vẫn lọt — chấp nhận.)
- Phòng chờ có 3 đường về: hết 60 giây (waitingSec, tính từ lúc hết pha kết quả), qua đủ 3 lượt đấu
  (waitingDuels, trừ dần trong resolveDuel), chuông 300 tim (like()). Hết tiết thì thả hết.
- Cô tự gọi (auto) KHÔNG bao giờ phạt: không ra đòn (kể cả lượt đấu lại sau hòa) thì hủy lượt,
  không tính totals. Người thách đấu chủ động hết giờ không ra đòn thì bốc đòn ngẫu nhiên.
- Hòa: đấu lại đúng 1 lần (duel.rematch), hòa lần 2 thì tính draw, không ai đi phòng chờ.
- Giọng là cô giáo F: (HoaiMy) — useRps.ts nút nói thử của Dashboard cũng phải để F:, đừng để M:.
- Nhạc ở src/live/music.ts (bản lớp học 104 BPM, khác hẳn bản hồ câu 72 BPM) — giữ API
  setEnabled/setVolume/setDucked/resume để hook dùng chung mẫu mở khóa với giọng.
- Kiểm chứng: npm run check (rps.check.ts có ca luật 9 cặp, thắng/thua/hòa, phòng chờ theo giờ +
  theo lượt nằm trong ca chuông, cô gọi không phạt, chống bắt nhầm "ăn kẹo") + lint + build + smoke
  cổng 3013 (trang chủ + /api/tts 200; trong sandbox Edge TTS bị proxy chặn SSL nên đi Google
  fallback, chậm ~18s — trên Mac của user chạy thẳng Edge, nhanh).
