# Auto Tarot Live: ghi chú cho Claude

> Tạo 2026-11-07 theo thiết kế chủ kênh: thư mục mới `auto-tarot/` trong repo tiktok-hoc-toan,
> nhân bản khung Phòng Tarot (phong-tarot/) rồi thay lõi bằng MÁY TRẠNG THÁI TỪNG NGƯỜI CHƠI
> theo quy trình 3 bước. Phòng Tarot cũ giữ nguyên, không sửa.

## Luật bất biến

- Xem bài CHỈ mang tính giải trí: câu miễn trừ cố định trên sân khấu, giọng đọc nhắc ở lượt đầu và mỗi 5 lượt.
  Lời giải viết giọng gợi mở, không khẳng định sức khoẻ/tiền bạc, không hứa hẹn kết quả, không phán "chắc chắn".
- Quà/tim chỉ phản ứng (cảm ơn, hiệu ứng), KHÔNG bán lượt ưu tiên, không rút ngắn hàng chờ, không kêu gọi
  tặng quà/thả tim/follow bằng câu mệnh lệnh. Không thêm chế độ may rủi/điểm/cá cược cho tarot.
- Hình lá bài tự vẽ bằng CSS (biểu tượng + màu trong cards.ts), không dùng tranh bộ bài có sẵn, không file ảnh nhị phân.
- Câu đọc không dùng dấu gạch ngang dài (—, –). Mọi nhóm câu LINES trong tarot.ts có từ 2 câu trở lên.

## Thiết kế phiên (đừng phá vỡ)

- Máy trạng thái mỗi nickname: WAITING_TOPIC (30s chọn chủ đề, quá hạn huỷ) → WAITING_CARD (hàng chờ;
  người đầu hàng được gọi, 5s gõ 1/2/3, quá hạn tự chọn lá giữa) → READING (đọc lời giải) → COMPLETED.
- Chỉ phiên đang hoạt động (activeUser) mới chọn được lá; số 1/2/3 của người khác bị bỏ qua tuyệt đối.
- Vào hàng chờ: gõ thẳng chủ đề (comment ≤4 từ có từ khoá chủ đề) hoặc TAROT/xem bài + chủ đề; gõ TAROT
  một mình thì vào WAITING_TOPIC. Câu chat dài tình cờ chứa từ khoá (vd "yêu") KHÔNG tạo phiên.
- Chống chiếm lượt: sau COMPLETED, khoá tới khi có thêm ≥2 lượt của người khác HOẶC đủ 5 phút
  (GAME.cooldownOthers/cooldownMs), nhắc nhường lượt tối đa 1 lần mỗi đợt khoá.
- Lời giải: readingText trong cards.ts ghép mở đầu + khung xuôi/ngược + TOPIC_LINES[lá][chủ đề] + lời khuyên
  theo chủ đề; tổng 35–55 token (kiểm bằng tarot.check.ts trên toàn bộ 22 lá × 6 chủ đề × 2 chiều).
  Sửa nội dung phải chạy lại check để giữ độ dài đọc 15–20 giây.
- 6 chủ đề cố định: love (Tình yêu), ex (Người cũ), work (Công việc), money (Tài chính),
  future (Tương lai), universe (Thông điệp vũ trụ). detectTopic xét 'ex' TRƯỚC 'love' để "người cũ" không nhầm.
- Cổng 3021, HMR dev 24690. Giọng mọi Say bắt đầu "F: " (nữ HoaiMy); displayLines là bản bỏ tiền tố.
- Kiểm chứng: `npm run check` (tarot.check.ts), `npm run lint`, `npm run build`, smoke server PORT=3021.

- Mặt ngửa ưu tiên ảnh Rider–Waite thật ở `public/assets/cards/<id>.jpg` (cắt từ tấm ghép chủ kênh up, bản gốc ở `src/anh/`); onError → fallback mặt vẽ CSS. Lá ngược: xoay ảnh 180° + nhãn NGƯỢC. Stage preload cả 22 ảnh lúc mở.
