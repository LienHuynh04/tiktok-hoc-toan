# Auto Tarot Live

Game tarot TỰ ĐỘNG cho TikTok LIVE, phát triển từ Phòng Tarot trong cùng repo: mỗi người xem có một **phiên chơi riêng** chạy theo quy trình 3 bước, hệ thống tự điều phối lần lượt, chủ kênh không cần bấm điều khiển. Sân khấu dọc 1080×1920 cho TikTok LIVE Studio / OBS.

## Ảnh lá bài

Mặt ngửa dùng **ảnh bộ Rider–Waite cổ điển** (bộ bài cộng đồng tarot dùng phổ biến nhất) tại `public/assets/cards/<mã lá>.jpg` — bản scan 720×1200 của bộ gốc 1909 (Pam-A) do Steve P. phục chế, lấy từ repo mixvlad/TarotCards (SOURCES.md ghi rõ: tranh hết bản quyền — public domain); `back.jpg` là hoạ tiết lưng bài cổ điển của chính bộ này. Thiếu file nào, sân khấu tự dùng mặt bài vẽ CSS cho lá đó. Muốn đổi ảnh: chép đè file cùng tên vào đúng thư mục, không cần sửa code.

## Quy trình 3 bước cho từng người chơi

1. **Chọn chủ đề**: người xem gõ thẳng một chủ đề: `tình yêu`, `người cũ`, `công việc`, `tài chính`, `tương lai`, `thông điệp vũ trụ` → vào hàng chờ ngay. Gõ `TAROT` hoặc `xem bài` trước cũng được, hệ thống nhắc chọn chủ đề (có 30 giây, quá hạn phiên tự huỷ).
2. **Chọn lá bài**: tới lượt, sân khấu bày 3 lá úp, chỉ đúng người đó gõ `1`, `2` hoặc `3` trong 5 giây để chọn (người khác gõ số không ảnh hưởng; hết giờ hệ thống tự chọn lá giữa).
3. **Giải bài**: giọng nữ chủ phòng đọc lời giải ghép riêng cho người đó: tên người chơi, chủ đề, tên lá (xuôi/ngược), ý nghĩa lá theo đúng chủ đề đã chọn và lời khuyên — tổng 35–55 từ, đọc khoảng 15–20 giây. Một số lá ra chiều ngược (30%), lời giải đổi sắc thái.

## Quản lý người chơi (máy trạng thái từng người)

Mỗi nickname một phiên riêng: `WAITING_TOPIC → WAITING_CARD → READING → COMPLETED`. Nhiều người ở các bước khác nhau cùng lúc nhưng kết quả xử lý lần lượt, không nhầm chủ đề giữa người chơi. Xem xong, người chơi gõ lại chủ đề là **vào hàng chờ lại như người mới**: phòng vắng thì được xem tiếp ngay, phòng có người thì xếp hàng chờ tới lượt như bình thường. Xong một người, hệ thống tự gọi người tiếp theo.

Sân khấu hiển thị: người đang chơi + chủ đề, 3 lá úp và lá được chọn, nội dung lời giải, danh sách hàng chờ, người đang chọn chủ đề, và lượt vừa xem xong. Trang điều khiển hiện trạng thái phiên của từng người theo thời gian thực.

Xem bài chỉ mang tính giải trí. Tim/quà chỉ tạo lời cảm ơn và hiệu ứng, **không** mua lượt, không đổi thứ tự hàng chờ.

## Chạy trên Mac

```bash
bash run.sh
```

Trang điều khiển: http://localhost:3021 · Link cho LIVE Studio: http://lvh.me:3021/?view=stage (1080×1920) · Cổng riêng **3021** (Phòng Tarot 3008, Lớp Toán 3007). Windows: `BAT-LIVE.bat`.

Âm thanh (giọng đọc + hiệu ứng) chỉ phát ở trang stage; khi đưa vào LIVE Studio cần bấm **Interact 1 lần** vào sân khấu lúc bắt đầu buổi để trình duyệt cho phép phát tiếng.

## Cấu trúc

- `server.ts`: máy chủ chung (kết nối TikTok, giọng đọc Edge TTS + Google dự phòng, SSE).
- `src/game/cards.ts`: 22 lá Ẩn Chính vẽ bằng CSS (không file ảnh) + **132 lời giải theo 6 chủ đề** tự viết + bộ ghép lời giải `readingText` giữ độ dài 35–55 từ.
- `src/game/tarot.ts`: engine phiên người chơi (máy trạng thái, hàng chờ, timeout).
- `src/game/TarotStage.tsx` / `TarotControls.tsx`: sân khấu và trang điều khiển (có nút giả lập đủ các bước để thử khi chưa live).
- `src/live/`: hạ tầng live dùng chung (giọng đọc, sự kiện SSE, chống từ cấm).
- Kiểm chứng: `npm run check` (máy trạng thái, không nhầm phiên, độ dài lời giải), `npm run lint`, `npm run build`.
