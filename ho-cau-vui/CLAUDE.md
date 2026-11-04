# Hồ Cá Vui: ghi chú cho Claude

> Game dựng 2026-11-04 từ khung Phòng Tarot (giữ ống nước: server, giọng đọc, SSE, snapshot),
> thư mục `ho-cau-vui/` trong repo tiktok-hoc-toan, cổng **3012**. Chủ kênh gửi ảnh chụp game
> "Hồ Câu Cá" của kênh khác và xin làm "y hệt" — đã làm game CÙNG THỂ LOẠI nhưng bản gốc riêng
> (tên, hình vẽ, loài cá, con số đều tự soạn), KHÔNG sao chép tài sản/bố cục nhận diện của họ.

- Engine `src/game/fishing.ts` (FishingRoom, RNG tiêm được để kiểm chứng): bình luận "câu" ->
  xuống hồ + quăng cần; cá cắn sau 7–18s/người; loài quay theo trọng số (SPECIES), cân nặng
  pow(rng,1.6) thiên nhẹ. Vòng 180s, cá to nhất vòng -> crownUser. Cá hiếm (tầm, hô) đếm tới 100
  -> golden 15s; tim 1000 -> golden 20s (biteDelay giảm nửa).
- LUẬT NHÀ (không phá): quà CHỈ cảm ơn, tuyệt đối không gắn quà/tim vào hạng cá hay tỉ lệ ra cá
  to — bản tham chiếu có bảng "tặng quà ra cá to" nhưng đó là pay-to-fish, trái quy tắc kênh
  và rủi ro chính sách TikTok. Tim chỉ đổi NHỊP cắn (như trống hội ở Kéo Co), không đổi loài cá.
- Giọng đọc: nam (tiền tố M:), chỉ phát ở trang stage; câu main cho cá hiếm/cá ≥15kg/hết vòng.
- Sân khấu: cần thủ SVG chibi tự vẽ (nón lá + áo đổi hue theo người) đứng quanh hồ ellipse,
  phao đỏ theo hướng vào tâm hồ; banner giật cá vàng ở đáy hồ; tối đa hiện 14 cần thủ.
- Kiểm chứng: `npm run check` (fishing.check.ts, RNG hạt giống cố định, mô phỏng 600 tick) + lint + build.
