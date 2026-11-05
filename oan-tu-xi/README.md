# Oẳn Tù Xì — game kéo búa bao TikTok LIVE: người xem đấu với chủ phòng

Người xem gõ **"kéo" / "búa" / "bao"** là thách đấu **chủ phòng (admin)** trên sàn đấu 1 chọi 1 kiểu game đối kháng: hai nhân vật cầm bảng đòn đối mặt nhau, mỗi bên **3 tim**, thua trận thì ra **ghế chờ**. Phong cách vui nhộn, chủ phòng liên tục trêu đùa qua giọng đọc.

## Cách chơi

- **Thách đấu:** gõ `kéo`, `búa` hoặc `bao` → vào hàng chờ, lượt ném đầu khóa sẵn đòn đó (bí mật tới lúc mở). Gõ `chơi` → xếp hàng, vào trận thì mỗi lượt ném có 8 giây ra đòn.
- **Trận đấu:** mỗi bên 3 tim. Thắng 1 lượt ném → đối thủ mất 1 tim. Hòa → ném lại. Từ lượt ném thứ 7 là **đột tử**: thua 1 lượt là thua cả trận. Hết tim = thua trận.
- **Thắng trận:** +1 ⭐ (bảng Vua Oẳn Tù Xì tính tổng sao cả buổi). **Thua trận:** ra **ghế chờ** — qua 3 trận nữa, hoặc hết 60 giây, hoặc đủ 300 tim chuông reo, hoặc hết vòng thì được về.
- **Đấu giao lưu:** hết người thách đấu, chủ phòng gọi ngẫu nhiên 1 bạn lên đấu — thua trận giao lưu KHÔNG ra ghế chờ.
- **Luật đòn:** Búa đập Kéo · Kéo cắt Bao · Bao trùm Búa. Đòn của chủ phòng bốc ngẫu nhiên công bằng.
- **Vòng đấu:** mỗi vòng 10 trận, hết vòng hiện Bảng Vàng + giải lao 10 giây.
- Vào phòng / bình luận / follow là có mặt trong hàng khán giả. Quà chỉ được cảm ơn bằng giọng đọc — không đổi được sao hay tim.

## Giao diện

Sân khấu dọc 1080×1920 phong cách game đối kháng vui nhộn (lấy cảm hứng thể loại, nhân vật tự vẽ): thanh tim xanh/hồng hai bên với avatar, hai nhân vật hoạt hình cầm bảng đòn đối đầu trên ghế sofa, hô "Oẳn! Tù! Xì!" lắc bảng, mở đòn có hiệu ứng nảy + nhân vật thua choáng váng 😵, bong bóng thoại trêu đùa của chủ phòng, con dấu "K.O.!" khi hết trận, thanh chọn đòn KÉO/BÚA/BAO dưới sàn, hàng khán giả và panel Ghế Chờ.

## Giọng đọc & nhạc

- Chủ phòng bình luận bằng giọng nam (M:) qua `/api/tts` (Edge TTS, lỗi thì Google): gọi trận, công bố từng lượt ném kèm câu trêu vui, tổng kết vòng.
- Nhạc nền vui tươi soạn bằng Web Audio ngay trong trang (không file ngoài), bật mặc định, tự nhỏ xuống khi chủ phòng đọc; trang điều khiển có nút tắt và thanh âm lượng.
- Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: mở LIVE Studio, bấm **Interact** 1 lần vào cửa sổ stage là cả nhạc lẫn giọng cùng lên.

## Chạy

- macOS: `bash run.sh` · Windows: `BAT-LIVE.bat` — cổng **3013**, link LIVE Studio: `http://lvh.me:3013/?view=stage`
- Trang điều khiển (mở tự động): xem trước sân khấu, nút Đấu thử 1 lượt, tắt/bật nhạc, giả lập sự kiện để test.
- Kiểm chứng engine: `npm run check` (rps.check.ts) · `npm run lint` · `npm run build`

## Cấu trúc

- `src/game/rps.ts` — engine thuần (luật đòn, trận 3 tim, đột tử, ghế chờ, vòng đấu), kiểm chứng độc lập được.
- `src/game/useRps.ts` — nối engine với sự kiện live + giọng đọc + nhạc.
- `src/game/RpsStage.tsx` / `RpsControls.tsx` — sân khấu đối kháng + trang điều khiển.
- `src/game/config.ts` — mọi con số của game (số tim, lượt đột tử, hạn ghế chờ...).
- `src/live/` — khung dùng chung với các game khác trong repo (server, SSE, giọng đọc, nhạc).
