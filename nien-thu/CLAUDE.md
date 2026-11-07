# ĐỐT PHÁO ĐUỔI NIÊN THÚ — game Tết TikTok LIVE (bản gốc riêng)

Game cả phòng cùng đuổi 1 con Niên Thú (tích dân gian: Niên sợ tiếng pháo + màu đỏ),
xây trên khung của Đại Chiến Boss (cùng repo). Nhân vật/art/code là bản gốc riêng.

## Chạy
- `bash run.sh` (cổng 3018; LIVE Studio: http://lvh.me:3018/?view=stage, 1080x1920)

## Luật chơi
- Mỗi câu 12 giây: tính nhanh / gõ lại CÂU CHÚC TẾT / đếm đồ Tết (lì xì, đèn lồng, hoa đào, quất, pháo).
  Gõ đúng đáp án = châm 1 quả pháo vào Niên. Quả đầu câu x2, chuỗi đúng +2/quả (tối đa +10).
- Niên 3 hình dạng theo máu: Ngủ Đông (>2/3) -> Hung Hăng (>1/3) -> Cuồng Nộ (pháo x1,5).
  Máu cấp 1 = 600, mỗi cấp x1,3. Niên bỏ chạy -> pháo hoa + mưa lì xì, xướng tên người
  châm quả kết liễu + top 3 tay đốt pháo; Niên cấp cao hơn lại xuống núi.
- Tim: đủ 250 -> đốt DÂY PHÁO CẢ PHÒNG trừ 5% máu tối đa (nhịp chơi chung).
- QUÀ CHỈ CẢM ƠN: không mua được sát thương/điểm. Giọng MC nam (M:).

## Kỹ thuật
- Engine src/game/nian.ts (NianRoom); test: npm run check.
- Art Niên 3 dạng: sheet AI 3x1 key nền xanh trong nianArt.ts (nianPos(form)).
- Sân khấu Tết: câu đối "NIÊN THÚ SỢ PHÁO / CẢ LÀNG ĐÓN TẾT", đèn lồng, thanh dây pháo.
- Nút "Châm thử 1 quả pháo" ở trang điều khiển (demo_fight) để xem hiệu ứng/chụp hình.
