# Cô Bói Tarot

Game tương tác cho TikTok LIVE: phòng bói bài với cô bói hoạt hình, dùng **bộ bài thật Rider-Waite-Smith đủ 78 lá** (bản 1909, phạm vi công cộng). Người xem gõ câu hỏi tự do lên chat để vào hàng chờ **xếp theo điểm**, tới lượt được ngồi vào bàn, xem cô trải 3 lá lật từng lá và nghe đoạn luận giải ghép riêng cho câu hỏi của mình. Sân khấu dọc 1080×1920 cho TikTok LIVE Studio.

## Cách chơi trên live

1. Người xem gõ **câu hỏi** lên chat (có dấu `?`, hoặc bắt đầu bằng `HỎI:`), ví dụ: "Cô ơi, chuyện tình cảm sắp tới của em thế nào?" → vào hàng chờ, hiện tên + điểm.
2. **Điểm quyết định thứ tự** (điểm cao lên trước, bằng điểm thì ai vào trước ở trước):
   - Mỗi **100 tim** người đó thả = **+1 điểm** (cộng dồn, lẻ giữ lại).
   - **Quà tính theo xu**: 1 xu = 1 điểm (bông hồng 1 xu = 1 điểm).
3. Tới lượt: khách ngồi vào ghế cạnh bàn bói, câu hỏi hiện nguyên văn ở đầu sân khấu. Cô trải **3 lá úp** rồi **lật từng lá** theo 3 vị trí: *Chuyện đang là gì · Điều đang cần · Nên làm gì*. Lá có thể ra chiều ngược (25%).
4. Cô đọc **đoạn luận giải** ghép từ chủ đề câu hỏi (tình cảm / công việc / tiền bạc / học tập / gia đình / tổng quan) + nghĩa 3 lá + một lời khuyên cụ thể; đoạn chữ hiện ở panel dưới sân khấu và tự cuộn trong lúc cô đọc.
5. Xem bài tại phòng chỉ mang tính giải trí: dòng miễn trừ hiện cố định ở chân sân khấu.

## Chạy trên Mac

```bash
bash run.sh
```

Lần đầu tự cài thư viện (cần Node.js). Trang điều khiển: http://localhost:3030 · Link cho LIVE Studio: http://lvh.me:3030/?view=stage (1080×1920) · Cổng riêng **3030** (Phòng Tarot 3008, Lớp Toán 3007). Trên Windows: chạy `BAT-LIVE.bat`.

Ở trang điều khiển: kết nối username TikTok đang live, chỉnh tốc độ giọng, đặt tên phòng, điều khiển lượt xem (bỏ lượt, sang khách tiếp, kết thúc phần đọc), xoá người khỏi hàng chờ, và bấm giả lập (khách hỏi, thả 100 tim, tặng hoa hồng) để thử khi chưa live.

**Âm thanh:** nhạc nền và giọng đọc chỉ phát sau khi bạn **bấm Interact 1 lần** vào cửa sổ stage trong LIVE Studio lúc mở buổi (luật của trình duyệt, không có cách lách). Nhạc là bản gốc soạn bằng Web Audio trong `src/live/music.ts`, tự nhỏ xuống khi cô đang đọc.

## Cấu trúc

- `server.ts`: máy chủ chung (kết nối TikTok, giọng đọc Edge TTS + Google dự phòng, SSE). Ít khi phải sửa.
- `src/game/cards78.ts`: đủ 78 lá (tên Việt, từ khoá, nghĩa xuôi/ngược và lời khuyên tự viết).
- `public/assets/cards/`: ảnh 78 lá Rider-Waite-Smith 1909 tải từ Wikimedia Commons (phạm vi công cộng).
- `public/assets/teller-*.png` + `room-bg.jpg`: cô bói (4 tư thế) và phòng bói, tranh tự tạo cho game này.
- `src/game/reading.ts`: đoán chủ đề câu hỏi + bộ ghép đoạn luận giải.
- `src/game/fortune.ts`: lõi phòng (điểm, hàng chờ theo điểm, trải/lật bài, nhịp lượt xem).
- `src/game/FortuneStage.tsx`: sân khấu (phòng bói, ghế khách, bài thật, panel lời giải, hàng chờ).
- `src/game/FortuneControls.tsx`: điều khiển + giả lập ở trang điều khiển.
- `src/live/`: hạ tầng live dùng chung (giọng đọc, sự kiện SSE, nhạc nền, chống từ cấm).

## Kiểm tra

```bash
npm run check   # kiểm thử lõi (điểm, thứ tự hàng chờ, rút bài, bộ soạn lời giải 78 lá x 6 chủ đề)
npm run lint    # kiểm tra TypeScript
npm run build   # đóng gói thử
```
