# Ghi chú cho Muse — Đua Vịt

- Nhân bản khung + engine từ `dua-thu/` (server.ts + src/live giữ nguyên ống nước; engine race.ts sửa lời thoại + khẩu lệnh bơi + artFor %10 màu). Cổng riêng **3023**, HMR 24694. Không sửa game khác.
- Khác dua-thu: đường bơi 200m (config trackM), vịt vẽ SVG bằng code trong `src/game/duckArt.ts` (10 màu) — KHÔNG dùng ảnh base64 như racerArt của dua-thu. "Gió thuận" đổi tên hiển thị thành "Sóng lớn" (biến nội bộ vẫn là tailwind).
- Luật: quà chỉ cảm ơn, không mua tốc độ. Tim tạo hiệu ứng chung cả đoàn (sóng lớn, xuất phát sớm ở sảnh) VÀ từ 2026-11-11 có ngoại lệ tim-cá nhân riêng của dua-vit do chủ kênh chốt: vịt của chính người thả tim bơi nhanh hơn (+10%/lượt, trần +50%, 4 giây/lượt — xem likeBoost* trong config.ts), cùng kiểu ngoại lệ ở kart-live. Không mở rộng ngoại lệ này sang game khác nếu chủ kênh chưa chốt.
- Đồng hồ chặng tạm dừng khi MC đang đọc câu chính (cơ chế hold của khung) — đừng "sửa" chuyện này.
- Kiểm chứng: `npm run check` + `npm run lint` + `npm run build`; sửa hình phải chụp sân khấu giữa chặng đua thật (localhost:3023/?view=stage, chờ vịt dẫn đầu qua ~50m) rồi mới báo xong.
