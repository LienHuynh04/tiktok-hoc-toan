# Tính Toán IQ Cao

Game tương tác cho TikTok LIVE dựng cùng khung với Lớp Toán / Phòng Tarot: sân chơi **tính nhẩm đua tốc độ** — MC đọc câu hỏi, cả phòng gõ đáp án vào bình luận, 3 bạn đúng nhanh nhất ghi điểm, cộng dồn lên bảng xếp hạng cả buổi. Sân khấu dọc 1080×1920 cho TikTok LIVE Studio.

## Cách chơi trên live

1. Câu hỏi hiện to trên sân khấu + MC đọc đề. Có 7 dạng: **Tính nhanh** (chuỗi phép tính), **Dãy số** (cấp số, dãy bình phương, Fibonacci, đan xen), **Tìm số thiếu**, **Luỹ thừa**, **Căn bậc hai**, **So sánh nhanh** (số nào lớn hơn, gõ 1 hoặc 2), **Phần trăm / Phân số** của một số.
2. Mọi người gõ đáp án vào bình luận trong 15 giây. Đủ 3 bạn đúng là chốt câu sớm: nhanh nhất 100 điểm, nhì 70, ba 50.
3. Trả lời sai làm mất **chuỗi đúng liên tiếp**; đúng liên tiếp mỗi 3 câu được thưởng thêm 30 điểm.
4. Cứ 5 câu, game dừng 8 giây hiện **bảng xếp hạng** chặng. Điểm chỉ tính trong buổi live, mang tính giải trí.
5. Tim/quà chỉ tạo hiệu ứng và lời cảm ơn, không ảnh hưởng điểm số.

## Chạy trên Mac

```bash
bash run.sh
```

Lần đầu tự cài thư viện (cần Node.js). Trang điều khiển: http://localhost:3009 · Link cho LIVE Studio: http://lvh.me:3009/?view=stage (1080×1920) · Cổng riêng **3009** (Tarot 3008, Lớp Toán 3007, Lớp Học Chữ 3006). Trên Windows: chạy `BAT-LIVE.bat`.

Ở trang điều khiển: kết nối username TikTok đang live, chỉnh tốc độ giọng, đặt tên phòng, bấm giả lập người chơi (trả lời đúng/sai, tặng quà) để thử khi chưa live.

## Cấu trúc

- `server.ts`: máy chủ chung (kết nối TikTok, giọng đọc Edge TTS + Google dự phòng, SSE). Ít khi phải sửa.
- `src/game/iq.ts`: lõi game (bộ sinh 7 dạng câu hỏi tự sinh không giới hạn, chấm điểm theo tốc độ, chuỗi đúng, bảng xếp hạng).
- `src/game/IQStage.tsx` + `iq.css`: sân khấu.
- `src/game/IQControls.tsx`: nút điều khiển + giả lập ở trang điều khiển.
- `src/live/`: hạ tầng live dùng chung (giọng đọc, sự kiện SSE, chống từ cấm).

## Kiểm chứng

```bash
npm run check   # kiểm thử bộ sinh câu hỏi (tính lại độc lập) + luật chấm điểm + vòng đời câu hỏi
npm run lint    # kiểm tra kiểu TypeScript
npm run build   # đóng gói bản chạy
```
