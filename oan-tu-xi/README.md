# Oẳn Tù Xì — game kéo búa bao TikTok LIVE: cả lớp đấu với cô giáo

Người xem gõ **"kéo" / "búa" / "bao"** là thách đấu cô giáo (admin) ngay trên bảng đen của lớp học. Thắng cô được sao, thua thì ra **phòng chờ** — đúng kiểu lớp học Việt Nam.

## Cách chơi

- **Thách đấu:** gõ `kéo`, `búa` hoặc `bao` → vào hàng chờ với đòn đã khóa sẵn (giữ bí mật tới lúc mở). Gõ `chơi` → xếp hàng, được gọi lên bảng thì có 10 giây ra đòn.
- **Cô tự gọi:** hết người thách đấu, cô gọi ngẫu nhiên 1 bạn đang ngồi lớp lên đấu thử. Bạn đó không ra đòn thì bỏ qua, không phạt.
- **Luật đòn:** Búa đập Kéo · Kéo cắt Bao · Bao trùm Búa. Đòn của cô bốc ngẫu nhiên công bằng, hô "Oẳn tù xì" lắc tay rồi mới mở.
- **Thắng:** +1 ⭐ (bảng Vua Oẳn Tù Xì tính tổng sao cả buổi). **Hòa:** đấu lại 1 lần, hòa nữa thì huề. **Thua:** ra phòng chờ — qua 3 lượt đấu của bạn khác hoặc hết 60 giây thì về lớp; đủ 300 tim chuông reo thì cả phòng chờ về lớp ngay.
- **Tiết học:** mỗi tiết 15 lượt đấu, hết tiết hiện Bảng Vàng + giải lao 10 giây rồi vào tiết mới.
- Vào phòng / bình luận / follow là có ghế ngồi trong lớp. Quà chỉ được cảm ơn bằng giọng đọc — không đổi được sao hay lượt đấu.

## Giao diện

Sân khấu dọc 1080×1920 kiểu Lớp Toán: bảng hiệu gỗ, thẻ ghi chú cách chơi ghim trên tường, bảng đen là sàn đấu (hai bàn tay đối đầu, hô oẳn tù xì có hiệu ứng lắc tay), cô giáo SVG đứng cạnh bảng, học sinh ngồi 2 dãy bàn với avatar + tên + sao, panel Phòng Chờ và bảng Vua Oẳn Tù Xì.

## Giọng đọc & nhạc

- Cô giáo nói bằng giọng nữ (F:) qua `/api/tts` (Edge TTS, lỗi thì Google): gọi lên bảng, công bố đòn thắng thua, tiễn ra phòng chờ, tổng kết tiết.
- Nhạc nền lớp học vui tươi soạn bằng Web Audio ngay trong trang (không file ngoài), bật mặc định, tự nhỏ xuống khi cô đọc; trang điều khiển có nút tắt và thanh âm lượng.
- Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: mở LIVE Studio, bấm **Interact** 1 lần vào cửa sổ stage là cả nhạc lẫn giọng cùng lên.

## Chạy

- macOS: `bash run.sh` · Windows: `BAT-LIVE.bat` — cổng **3013**, link LIVE Studio: `http://lvh.me:3013/?view=stage`
- Trang điều khiển (mở tự động): xem trước sân khấu, nút Đấu thử 1 lượt, tắt/bật nhạc, giả lập sự kiện để test.
- Kiểm chứng engine: `npm run check` (rps.check.ts) · `npm run lint` · `npm run build`

## Cấu trúc

- `src/game/rps.ts` — engine thuần (luật đòn, hàng chờ, phòng chờ, tiết học), chạy kiểm chứng độc lập được.
- `src/game/useRps.ts` — nối engine với sự kiện live + giọng đọc + nhạc.
- `src/game/RpsStage.tsx` / `RpsControls.tsx` — sân khấu lớp học + trang điều khiển.
- `src/game/config.ts` — mọi con số của game (thời gian chọn đòn, số lượt mỗi tiết, hạn phòng chờ...).
- `src/live/` — khung dùng chung với các game khác trong repo (server, SSE, giọng đọc, nhạc).
