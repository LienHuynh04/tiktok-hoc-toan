# Ghi chú cho Muse — Trang Trí Tết

- Nhân bản khung từ `auto-tarot/` (server.ts + src/live giữ nguyên ống nước). Cổng riêng **3022**, HMR 24692. Không sửa game khác.
- Lõi game: `src/game/decor.ts` (DecorRoom, hàm thuần theo now) + thư viện hình `src/game/assets.ts` (47 món SVG vẽ bằng code, khớp từ khoá bỏ dấu, cụm dài nhất thắng; từ đơn dễ gây nhiễu như "quá" chỉ khớp khi bình luận đúng 1 chữ qua EXACT_ONE_WORD).
- Luật bất biến: quà chỉ cảm ơn, không mua thứ tự/điểm/hiệu ứng chơi. Bình luận thường (chat xã giao, câu dài > 6 từ) không thành đồ: qua bộ lọc CHAT_STOP + REQUEST_HEADS trong decor.ts. Món lạ -> thẻ tên (assetId 'tag'), không từ chối người chơi.
- Vị trí ô treo SLOTS trong decor.ts phải khớp hình nhà trong DecorStage.tsx (nhà x 170–990, cửa giữa 580, cây mai trái y ~1280–1510, sân chỉ 1 hàng y ~1605–1635 vì panel dưới che từ ~1620).
- Kiểm chứng: `npm run check` (matcher + engine) + `npm run lint` + `npm run build`; sửa hình phải chụp lại sân khấu stage thật (localhost:3022/?view=stage) rồi mới báo xong.
