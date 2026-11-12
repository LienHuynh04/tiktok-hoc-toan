# Spider Hero — TikTok LIVE Interactive Game

Game 3D tương tác cho TikTok LIVE: một siêu anh hùng **nguyên bản** (NGƯỜI QUE: que đen có khớp, đầu tròn mắt trắng lớn, khăn quàng đỏ bay theo tốc độ, giày đỏ, huy hiệu tia bạc — không dùng logo/thiết kế của thương hiệu nào) tự bay liên tục qua thành phố 3D: chạy trên nóc nhà, nhảy qua các toà, bắn tơ đu dây, lộn vòng giữa trời. Người xem điều khiển hiệu ứng bằng **thả tim**.

## Cách chơi — bảng mốc LIKE

Tim của mọi người xem **cộng dồn vào một quỹ chung**. Engine gom tim theo nhịp (batch ~90ms) rồi rút hiệu ứng **đắt nhất mà quỹ đủ trả**, tôn trọng cooldown từng hiệu ứng và trạng thái của Hero (nhảy cần đang chạy, lộn cần đang bay) — hiệu ứng mới không bao giờ cắt ngang animation đang chạy:

| Quỹ tim | Hiệu ứng |
|---|---|
| 1 | Bắn 1 sợi tơ |
| 5 | Bắn 5 sợi tơ liên tục |
| 10 | Nhảy cao |
| 20 | Bắn tơ hai tay |
| 50 | Đu dây tốc độ cao |
| 100 | Lộn vòng trên không |
| 200 | Mưa tơ nhiều hướng |
| 500 | **Bão Tơ** — tơ giăng khắp phố + tăng tốc |
| 1.000 | **Vụ Nổ Tơ** — vòng nổ + chớp sáng + rung màn hình |
| 5.000 | **Siêu Bão Tơ** |

Bảng mốc + cooldown chỉnh trong `src/game/config.ts` (`LIKE_TIERS`). Quà tặng chỉ được cảm ơn, không mua được hiệu ứng.

## Đồ hoạ & kỹ thuật

- Three.js: thành phố vô tận sinh bằng thuật toán tất định (toà kính nhiều biến thể, cần cẩu, công viên, sông + cầu dây văng), xe cộ chạy trên phố, mây trôi, nắng + bóng đổ thời gian thực, camera 3/4 bám sau lưng Hero.
- Hero dựng hoàn toàn bằng code (không file ngoài): khớp vai/khuỷu/gối animate theo trạng thái — chạy, bay, đu (tay bám tơ), lộn vòng theo vật lý.
- Vật lý tự chế: chạy nóc nhà → nhảy → đạn đạo → con lắc đu tơ (tự chọn điểm bám an toàn, có tầng chống quệt đất), MC giọng nam đọc sự kiện/cột mốc.
- Nhạc nền gốc soạn bằng Web Audio (vòng Dm–Bb–F–C, 136 BPM), tự nhỏ xuống khi MC đọc.
- Sự kiện LIVE đến từ TikTokLive connector ở server như mọi game trong repo; khi chưa live, trang điều khiển có **chế độ TEST**: nút giả lập tim theo từng mốc (+1/+10/+50/+100/+200/+500/+1.000/+5.000), tặng quà thử, bình luận thử. Không có kết nối TikTok giả nào được mô phỏng.

## Chạy

```bash
bash run.sh        # macOS: cài deps (lần đầu), mở server + trang điều khiển
```

- Trang điều khiển: http://localhost:3024
- Link cho TikTok LIVE Studio: http://lvh.me:3024/?view=stage (1080 × 1920)
- Khi mở stage lần đầu trong LIVE Studio: bấm Interact 1 lần vào cửa sổ stage để trình duyệt cho phép phát tiếng (nhạc + giọng MC).

## Kiểm chứng

```bash
npm run check   # hero.check: vật lý bay 180s + bộ rút mốc LIKE (ưu tiên/cooldown/trạng thái/batch)
npm run lint    # tsc --noEmit
npm run build
```
