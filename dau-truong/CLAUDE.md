# CLAUDE.md — Đấu Trường Sinh Tồn

Game TikTok LIVE trong repo `tiktok-hoc-toan`, cùng khung `src/live/` với các game khác.
Chủ kênh yêu cầu (2026-11-05): thêm game ĐỒ HOẠ ĐẸP, nhiều người tham gia cùng lúc, hợp pháp.
Format battle royale được chọn từ khảo sát Futrix/ScrollPlay/Livecade (mỗi người xem 1 nhân vật,
người sống sót cuối cùng thắng).

## Nguyên tắc không được phá

- **Đồng loạt:** tối đa 24 quái cùng trận, quái TỰ đánh — người chơi chỉ đổi thế. Không theo lượt.
- **Quà/tim không mua sức mạnh:** quà chỉ cảm ơn; tim chỉ nạp MƯA HỒI PHỤC chung cho mọi quái
  còn sống. Copy chỉ nêu luật trung tính, không kêu gọi quà.
- Giọng MC nam M: (useArena.ts giữ M: cho nút nói thử của Dashboard).
- Art tự chế: sheet quái nhí vẽ bằng AI trong monsterArt.ts (tách nền flood-fill từ tâm ô;
  quái xanh lá sống sót được nhờ key theo khoảng cách RGB tới xanh thuần). Không dùng art kênh khác.

## Cơ chế cốt lõi (arena.ts)

- Mô phỏng theo dt trong tick() (clamp 0,5s). Trong vòng lặp battle phải bỏ qua quái vừa chết
  cùng nhịp (guard !m.alive) — đã có, đừng gỡ.
- Xếp hạng: kill() gán place = tổng số quái - deathCount (chết trước hạng thấp). Hết giờ:
  xếp theo máu còn lại. Vô địch = place 1.
- Thế: săn (đuổi + đánh khi <7 đơn vị, đứng yên khi <6,5 để không lao xuyên), ăn (lang thang +
  hồi 2,5 máu/s sau 4s không giao tranh), trốn (chạy xa kẻ địch, bị dồn vào tâm khi sát vòng độc).
- Vòng độc: ringRadius nội suy tuyến tính 52 -> 12 trong ringShrinkSec; view ring phải khớp
  hình vẽ vòng an toàn trên sân khấu (ArenaStage clamp hiển thị tối đa 100%).
- Quái của mỗi người cố định theo artFor(username) % 9.

## Kiểm chứng

`npm run check` (arena.check.ts) · `npm run lint` · `npm run build`. Cổng 3016.
