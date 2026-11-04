# Phòng Tarot: ghi chú cho Claude

> Game dựng ngày 2026-11-04 từ khung Lớp Toán (~/workspace/lop-toan, bản thân nó chuyển thể từ
> Lớp Học Chữ của workaipvlinh-byte) theo yêu cầu chủ kênh: làm BẢN RIÊNG xem tarot, không gộp vào Lớp Toán
> vì khán giả lớp toán là học sinh. Chỉ giữ phần ống nước (server, giọng đọc, SSE), thay toàn bộ lõi game.

## Luật bất biến

- Xem bài CHỈ mang tính giải trí: câu miễn trừ hiện cố định trên sân khấu, giọng đọc nhắc lại ở lượt đầu và mỗi 5 lượt.
  Lời giải trong cards.ts viết giọng gợi mở, không khẳng định chuyện sức khoẻ/tiền bạc, không hứa hẹn kết quả.
- Quà/tim chỉ phản ứng (cảm ơn, hiệu ứng), KHÔNG bán lượt ưu tiên, không kêu gọi tặng quà/thả tim/follow bằng câu mệnh lệnh.
- Hình lá bài tự vẽ bằng CSS (biểu tượng + màu trong cards.ts), không dùng tranh bộ bài có sẵn, không có file ảnh nhị phân.
- Câu đọc không dùng dấu gạch ngang dài (—, –). Mọi nhóm câu LINES trong tarot.ts có từ 2 câu trở lên.

## Kiến trúc nhanh

- Engine thuần thời gian: `TarotRoom` (src/game/tarot.ts), pha idle → offer (5s chọn lá) → reveal (đọc bài).
  Đồng hồ pha bị giữ (hold) khi giọng đang đọc câu chính, giống Lớp Toán.
- Hàng chờ tối đa 8 (GAME.queueMax), mỗi người 1 chỗ; chỉ người đang được xem mới chọn được lá bằng 1/2/3.
  Hết giờ chọn: tự chọn lá giữa (picked=1, auto=true). Bỏ lượt: control custom 'skip'.
- Rút 3 lá khác nhau từ 22 lá Ẩn Chính, mỗi lá 30% chiều ngược (GAME.reversedChance). rand bơm từ ngoài để test xác định.
- Giọng: mọi Say bắt đầu "F: " (nữ HoaiMy). displayLines là bản bỏ tiền tố để hiện chữ trên sân khấu.
- Cổng 3008, HMR dev 24686 (tránh đụng Lớp Toán 3007/24684, Lớp Học Chữ 3006/24682, Bug Live 3000).
- Kiểm chứng: `npm run check` (tarot.check.ts), `npm run lint`, `npm run build`, smoke server PORT=3008.
