# Phòng Tarot

Game tương tác cho TikTok LIVE dựng từ khung của Lớp Toán: người xem vào hàng chờ xem bài tarot (bộ Ẩn Chính 22 lá), chọn 1 trong 3 lá úp, chủ phòng (giọng đọc AI tiếng Việt) lật bài và đọc lời giải. Sân khấu dọc 1080×1920 cho TikTok LIVE Studio.

## Cách chơi trên live

1. Người xem gõ `TAROT` kèm chủ đề: `TAROT tình yêu`, `TAROT công việc`, `TAROT tài chính` (không kèm gì thì xem tổng quan) → vào hàng chờ, tên hiện trên sân khấu.
2. Tới lượt: 3 lá bài úp hiện ra, người đó gõ `1`, `2` hoặc `3` trong 5 giây để chọn lá (hết giờ hệ thống tự chọn lá giữa). Một số lá ra chiều ngược, lời giải khác hẳn.
3. Lá được chọn lật mở, giọng đọc đọc: tên lá, lời giải theo chiều xuôi/ngược và câu chốt theo chủ đề. Xem bài tại phòng chỉ mang tính giải trí.
4. Tim/quà chỉ tạo hiệu ứng và lời cảm ơn, không đổi thứ tự hàng chờ.

## Chạy trên Mac

```bash
bash run.sh
```

Lần đầu tự cài thư viện (cần Node.js). Trang điều khiển: http://localhost:3008 · Link cho LIVE Studio: http://lvh.me:3008/?view=stage (1080×1920) · Cổng riêng **3008** (Lớp Toán 3007, Lớp Học Chữ 3006). Trên Windows: chạy `BAT-LIVE.bat`.

Ở trang điều khiển: kết nối username TikTok đang live, chỉnh tốc độ giọng, đặt tên phòng, bấm giả lập người xem (xin xem bài, chọn lá, tặng quà) để thử khi chưa live.

## Cấu trúc

- `server.ts`: máy chủ chung (kết nối TikTok, giọng đọc Edge TTS + Google dự phòng, SSE). Ít khi phải sửa.
- `src/game/cards.ts`: 22 lá Ẩn Chính (tên, biểu tượng, màu, lời giải xuôi/ngược tự viết) + câu chốt theo 4 chủ đề.
- `src/game/tarot.ts`: lõi phòng (hàng chờ, rút 3 lá, chọn lá, đọc bài, tự chọn khi hết giờ, bỏ lượt).
- `src/game/TarotStage.tsx`: sân khấu, lá bài vẽ hoàn toàn bằng CSS (không cần file ảnh).
- `src/game/TarotControls.tsx`: nút điều khiển + giả lập ở trang điều khiển.
- `src/live/`: hạ tầng live dùng chung (giọng đọc, sự kiện SSE, chống từ cấm).

## Kiểm tra

```bash
npm run check   # kiểm thử lõi tarot (hàng chờ, chọn lá, hết giờ, bỏ lượt, dữ liệu bài)
npm run lint    # kiểm tra TypeScript
npm run build   # đóng gói thử
```
