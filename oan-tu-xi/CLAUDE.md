# Oẳn Tù Xì: ghi chú cho Claude

> Game dựng 2026-11-05 từ khung Hồ Cá Vui/Phòng Tarot (giữ ống nước: server, giọng đọc, SSE,
> snapshot, nhạc), thư mục `oan-tu-xi/` trong repo tiktok-hoc-toan, cổng **3013**. Chủ kênh yêu cầu:
> user đấu với admin, thua thì ra phòng chờ. Bản đầu làm UI lớp học (cô giáo), chủ kênh chê và
> yêu cầu đổi sang UI đối kháng 1-1 (2 nhân vật cầm bảng đòn, thanh tim 2 bên, hài hước,
> người chơi đấu với CHÍNH CHỦ PHÒNG) — bản hiện tại là bản đối kháng, đừng quay lại theme cô giáo.

- Luật bất biến: đòn của cô bốc ngẫu nhiên công bằng (rng inject được để check); quà chỉ cảm ơn,
  tim chỉ rung chuông thả phòng chờ (300 tim) — KHÔNG thứ gì đổi được sao/lượt đấu. Câu chữ trên sóng
  chỉ nêu luật chơi trung tính, không kêu gọi thả tim/follow/share.
- Bắt đòn trong bình luận (rps.ts pickFrom): đòn chỉ tính khi là TỪ ĐẦU TIÊN của câu hoặc cả câu
  ≤2 từ; riêng bạn đang đấu thì đòn ở bất cứ đâu trong câu cũng tính. Đừng nới lỏng: "ăn kẹo",
  "bao giờ" sẽ bị bắt nhầm. (Đánh đổi đã biết: câu bắt đầu bằng "bao giờ..." vẫn lọt — chấp nhận.)
- Phòng chờ có 3 đường về: hết 60 giây (waitingSec, tính từ lúc hết pha kết quả), qua đủ 3 TRẬN đấu
  (waitingMatches, trừ dần trong finishMatch), chuông 300 tim (like()). Hết vòng thì thả hết.
- Chủ phòng tự gọi (auto) là trận GIAO LƯU: thua trận không ra ghế chờ. Mọi lượt ném hết giờ
  chưa ra đòn đều bốc đòn ngẫu nhiên để trận đấu không bị treo (khác bản cô giáo cũ).
- Giọng là CHỦ PHÒNG M: (NamMinh) bình luận + trêu vui — useRps.ts nút nói thử của Dashboard để M:. Câu trêu nằm ở QUIPS_* trong rps.ts, nói thân thiện không cà khịa quá đà.
- Trận đấu: 3 tim/bên (matchHearts), thắng lượt = đối thủ -1 tim, hòa ném lại, lượt 7+ là đột tử (suddenDeathThrow). Sao chỉ tính theo TRẬN thắng. Ghế chờ chỉ áp cho người THÁCH ĐẤU thua trận; trận giao lưu (auto) thua không phạt — giữ nguyên tắc này.
- Nhạc ở src/live/music.ts (bản lớp học 104 BPM, khác hẳn bản hồ câu 72 BPM) — giữ API
  setEnabled/setVolume/setDucked/resume để hook dùng chung mẫu mở khóa với giọng.
- Kiểm chứng: npm run check (rps.check.ts có ca luật 9 cặp, thắng/thua/hòa, phòng chờ theo giờ +
  theo lượt nằm trong ca chuông, cô gọi không phạt, chống bắt nhầm "ăn kẹo") + lint + build + smoke
  cổng 3013 (trang chủ + /api/tts 200; trong sandbox Edge TTS bị proxy chặn SSL nên đi Google
  fallback, chậm ~18s — trên Mac của user chạy thẳng Edge, nhanh).
