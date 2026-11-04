# Phòng Yoga Thiền: ghi chú cho Claude

> Game dựng 2026-11-04 từ khung Phòng Tarot (chỉ giữ ống nước: server, giọng đọc, SSE, snapshot),
> thay toàn bộ lõi game. Nằm trong repo tiktok-hoc-toan, thư mục `yoga-thien/`, cổng **3011**.

- Engine: `src/game/yoga.ts` (YogaRoom) — tư thế hiện tại + lịch chờ (tối đa 5) + thảm lớp + điểm gọi bài.
  Người xem gõ tên tư thế (không dấu, khớp cụm từ liên tiếp — `findPose` trong `poses.ts`): lớp đang tự tập thì
  vào thẳng, đang bận thì xếp lịch; mỗi người gọi cách nhau ≥12s. Không ai gọi thì tự chảy theo FLOW,
  kết vòng ở Thư Giãn rồi quay lại Hoa Sen. Mỗi tư thế 24s, giữa thế có 1 câu nhắc thở (chatter).
- Tư thế & độ đúng: `poses.ts` có đủ tên Việt + Sanskrit + guide + benefit. Ô ảnh số 4 là biến thể
  **Nhân Sư** (chống khuỷu tay) của Rắn Hổ Mang — đã đặt đúng tên "Rắn Hổ Mang (Nhân Sư) /
  Salamba Bhujangasana", đừng đổi lại thành Bhujangasana.
- Hình: bộ ảnh AI 3x3 tách nền, WebP nhúng base64 trong `poseArt.ts` (ô 660×520, neo đáy),
  sân khấu hiện 1 ô bằng background-size 300% + `posePos(cell)`. Ảnh gốc ở ~/workspace/yoga-art.
- Nhạc thiền: `src/live/music.ts` — Web Audio thuần (pad Cmaj7/Am7/Fmaj7/G6 + chuông ngũ cung),
  KHÔNG file nhạc ngoài. Hook useYoga bật nhạc mặc định, watchdog 1.5s gọi music.resume() +
  mở khoá theo pointerdown/focus/visibilitychange. Luật autoplay của trình duyệt vẫn cần 1 chạm
  đầu tiên trong LIVE Studio (Interact) — đừng hứa hẹn cách lách.
- Giọng đọc: nữ (tiền tố F:) qua /api/tts như các game khác; chỉ phát ở trang stage.
- Quà/tim chỉ phản ứng (cảm ơn + mưa hoa sen ở 100 tim), không kêu gọi, không đổi lịch tập.
- Sân khấu: bố cục theo đúng trang Lớp Toán (chủ kênh chốt 2026-11-04) — biển gỗ tên phòng trên cùng, tờ note ghim 📌 ghi 9 lệnh ở góc trái, bảng lớn khung gỗ chữ phấn ở giữa (tên tư thế + Sanskrit + guide + benefit + vòng thở + hàng chờ), cô giáo đứng cạnh bảng bên trái, học viên 2 hàng thảm phía dưới (hàng trước lớn hơn), biển gỗ chân trang (tim/tổng tư thế/bạn đồng hành). Đừng quay lại bố cục flex cũ.
- Kiểm chứng: `npm run check` (yoga.check.ts) + lint + build + smoke server cổng 3011.
