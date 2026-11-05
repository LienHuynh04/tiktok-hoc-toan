# Đua Thú Siêu Tốc — game đua TikTok LIVE, mỗi người xem là 1 tay đua

Người xem bình luận bất cứ chữ gì là có ngay **1 bé thú đua mang tên mình** (mèo, thỏ, cáo, gấu trúc, chó hoặc gà — hình vẽ AI tự chế, hệ thống chọn theo tài khoản). Tất cả cùng đua trên 1 đường đua 600m, ai về đích trước là vô địch chặng.

## Cách chơi

- **Vào đua:** bình luận/follow/vào phòng là có thú ở vạch xuất phát. Đang giữa chặng vẫn vào đua tiếp được.
- **Khẩu lệnh tăng tốc:** cứ ~13 giây màn hình hiện 1 khẩu lệnh to (NHẢY / BỐC / VƯỢT / PHI / LAO / TĂNG TỐC) trong 5 giây — **gõ đúng khẩu lệnh là thú của mình bốc tốc** (×1,85 trong 4 giây). Mỗi đợt mỗi người bốc được 1 lần.
- **Gió thuận:** đủ 150 tim → cả đoàn đua tăng tốc 25% trong 10 giây (nhịp chơi chung của cả phòng).
- **Kết thúc chặng:** người đầu tiên cán đích mở đếm ngược 10 giây cho các bạn khác về đích (tối đa 4 phút/chặng), sau đó lên **bục vinh quang** top 3 và tính cúp vào bảng **Vua Tốc Độ** của cả buổi.
- Tốc độ gốc của mỗi thú ngẫu nhiên nhẹ theo chặng nên chặng nào cũng có bất ngờ; thắng thua do gõ khẩu lệnh nhanh + may mắn. Quà chỉ được cảm ơn, không mua được tốc độ.

## Đồ hoạ

- 6 bé thú vẽ bằng AI (sheet 3×2 tách nền, nhúng WebP trong `src/game/racerArt.ts`), chạy trên đường đua cỏ/đất có vạch đích caro, mây trôi, lửa bốc tốc.
- Sân khấu hiện tối đa 12 làn đua + bảng dẫn đầu trực tiếp; tối đa 40 tay đua/chặng.

## Giọng đọc & nhạc

MC nam (M:) qua `/api/tts`: hô xuất phát, đọc khẩu lệnh, hô gió thuận, công bố vô địch. Nhạc nền Web Audio bật mặc định, tự nhỏ khi MC đọc. Mở LIVE Studio nhớ bấm **Interact** 1 lần vào stage để mở tiếng.

## Chạy

- macOS: `bash run.sh` · Windows: `BAT-LIVE.bat` — cổng **3015**, link LIVE Studio: `http://lvh.me:3015/?view=stage`
- Trang điều khiển: xem trước sân khấu, nút Đua thử ngay, tắt/bật nhạc, giả lập sự kiện.
- Kiểm chứng: `npm run check` (race.check.ts) · `npm run lint` · `npm run build`

## Cấu trúc

- `src/game/race.ts` — engine thuần (mô phỏng đua theo dt, khẩu lệnh, gió thuận, bục vinh quang).
- `src/game/useRace.ts` — nối engine với sự kiện live + giọng + nhạc. `RaceStage.tsx` / `RaceControls.tsx` — sân khấu + điều khiển.
- `src/game/racerArt.ts` — sheet thú đua AI đã tách nền (base64). `src/game/config.ts` — mọi con số.
- `src/live/` — khung dùng chung trong repo.
