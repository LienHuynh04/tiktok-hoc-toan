# Hồ Cá Vui — game câu cá TikTok LIVE cho cả phòng cùng câu

Người xem bình luận **"câu"** là xuống hồ: mỗi người một cần thủ chibi đội nón lá đứng quanh hồ, cá tự cắn câu, giật được cá gì nặng bao nhiêu ký là lên bảng xếp hạng ngay.

## Cách chơi

- **Xuống hồ:** bình luận "câu" (vào phòng live/follow cũng được cấp cần sẵn). Gõ lại "câu" là quăng cần lại, cá sắp cắn nhanh hơn.
- **Giật cá:** mỗi cần thủ cá cắn sau 7–18 giây, loài và cân nặng quay may rủi công bằng (cân nặng thiên về đầu nhẹ, cá càng hiếm càng khó). Ai câu được cá, ống kính tại chỗ **focus vào cần thủ đó** (phóng to + vòng sáng + gợn sóng) kèm **popup** "🐠 tên cá · cân nặng" ngay trên đầu.
- **Lệnh gõ thêm:** `GIẬT` — giật cần: cá sắp cắn thì lên luôn, chưa cắn thì 40% vớ được cá / 60% hụt (nguội 6s, có hiệu ứng rung cần + popup "Hụt rồi!"). `THẢ MỒI` — dụ cá bu lại, lần cắn tới đến trong 1–3 giây (nguội 25s, hiệu ứng lấp lánh).
- **Ống kính chúc mừng:** cá hiếm, cá từ 10 kg, hoặc phá kỷ lục vòng (từ 5 kg) thì sân khấu chuyển hẳn sang cảnh cận chúc mừng 5 giây, giọng đọc (nam) hô to chúc mừng.
- **Vòng câu 3 phút:** con cá to nhất vòng cho chủ nhân nhận 👑 vương miện vòng sau. Bảng xếp hạng tính tổng kg cả buổi.
- **Cá hiếm:** cá tầm + cá hô; hồ đếm đủ 100 con hiếm thì mở hội 15 giây cá cắn liên tục.
- **Tim:** đủ 1000 tim → 20 giây cá cắn câu liên tục (nhịp chờ giảm một nửa).
- **Quà:** chỉ được cảm ơn bằng giọng đọc, **không** đổi được cá — công bằng cho mọi cần thủ và đúng luật kênh.

## Loài cá trong hồ

| Loài | Cân nặng | Hạng |
| --- | --- | --- |
| Cá rô phi | 0,3–2 kg | thường |
| Cá diêu hồng | 0,8–3,5 kg | thường |
| Cá trê | 1–5 kg | thường |
| Cá chép | 2–7 kg | khá |
| Cá lóc | 2–8 kg | khá |
| Cá trắm cỏ | 4–12 kg | to |
| Cá tra | 6–18 kg | to |
| Cá mè hoa | 8–25 kg | to |
| Cá tầm | 15–40 kg | hiếm ⭐ |
| Cá hô | 30–80 kg | siêu hiếm 🌟 |

## Chạy trên Mac

```bash
cd ho-cau-vui
bash run.sh
```

- Trang điều khiển: http://localhost:3012
- Link cho TikTok LIVE Studio: http://lvh.me:3012/?view=stage (1080×1920), cổng **3012**.

## Kiểm chứng

```bash
npm run check   # fishing.check.ts: quay loài/cân nặng + mô phỏng 10 phút câu
npm run build
```
