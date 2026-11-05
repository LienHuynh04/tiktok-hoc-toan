# Đấu Trường Sinh Tồn — game battle royale TikTok LIVE bằng quái nhí

Mỗi người xem là **1 quái nhí** (hình vẽ AI tự chế, 9 mẫu) trong 1 đấu trường tròn tối đa 24 quái. Quái tự di chuyển và tự đánh nhau; chủ nhân điều khiển bằng cách đổi **thế** cho quái. Vòng độc thu hẹp dần — quái cuối cùng còn sống là vô địch vòng.

## Cách chơi

- **Vào trận:** bình luận/follow/vào phòng là đăng ký; cổng mở 15 giây rồi trận bắt đầu (vào sau thì chờ vòng kế).
- **Đổi thế bằng bình luận:** gõ **"săn"** — lao vào đánh đối thủ gần nhất · gõ **"ăn"** — né đánh nhau, đứng yên được hồi máu · gõ **"trốn"** — chạy xa kẻ địch (nhanh hơn nhưng không đánh).
- **Vòng độc:** vòng an toàn thu từ r=52 về r=12 trong 140 giây; đứng ngoài vòng mất 5 máu/giây. Hết 4 phút chưa phân thắng bại thì ai nhiều máu nhất thắng.
- **Mưa hồi phục:** đủ 120 tim → mọi quái còn sống +8 máu (nhịp chơi chung của cả phòng).
- **Vinh danh:** cuối vòng hiện cúp vô địch + top 3 (theo thứ hạng, kèm số lần hạ đối thủ), tính vào bảng **Vua Sinh Tồn** cả buổi. Có tin "vừa hạ" chạy trực tiếp và MC hô khi chỉ còn 2 quái.
- Quà chỉ được cảm ơn, không làm quái mạnh hơn — thắng thua do thế đánh và may mắn.

## Đồ hoạ

- 9 quái nhí vẽ bằng AI (sheet 3×3 tách nền, nhúng WebP trong `src/game/monsterArt.ts`), sân đấu tròn 2 lớp: vùng độc tím phát sáng và vòng an toàn xanh lá thu hẹp theo thời gian thực, thanh máu + biểu tượng thế trên đầu từng quái.

## Giọng đọc & nhạc

MC nam (M:) qua `/api/tts`: hô mở vòng, cảnh báo vòng độc thu nửa, hô 2 quái cuối, công bố vô địch. Nhạc nền Web Audio bật mặc định, tự nhỏ khi MC đọc. Mở LIVE Studio nhớ bấm **Interact** 1 lần vào stage để mở tiếng.

## Chạy

- macOS: `bash run.sh` · Windows: `BAT-LIVE.bat` — cổng **3016**, link LIVE Studio: `http://lvh.me:3016/?view=stage`
- Trang điều khiển: xem trước sân khấu, nút Mở trận thử ngay, tắt/bật nhạc, giả lập sự kiện.
- Kiểm chứng: `npm run check` (arena.check.ts) · `npm run lint` · `npm run build`

## Cấu trúc

- `src/game/arena.ts` — engine thuần (mô phỏng hỗn chiến theo dt, vòng độc, thế đánh, xếp hạng).
- `src/game/useArena.ts` — nối engine với sự kiện live + giọng + nhạc. `ArenaStage.tsx` / `ArenaControls.tsx` — sân khấu + điều khiển.
- `src/game/monsterArt.ts` — sheet quái nhí AI đã tách nền (base64). `src/game/config.ts` — mọi con số.
- `src/live/` — khung dùng chung trong repo.
