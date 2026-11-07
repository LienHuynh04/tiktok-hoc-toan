# CLAUDE.md — Đua Thú Siêu Tốc

Game TikTok LIVE trong repo `tiktok-hoc-toan`, cùng khung `src/live/` với các game khác.
Chủ kênh yêu cầu (2026-11-05): thêm game ĐỒ HOẠ ĐẸP, nhiều người tham gia cùng lúc, hợp pháp.
Format đua được chọn từ khảo sát Futrix/ScrollPlay/Livecade/Tream (mỗi người xem 1 tay đua).

## Nguyên tắc không được phá

- **Đồng loạt:** mọi tay đua chạy cùng lúc; vào giữa chặng vẫn đua tiếp được. Không hàng chờ lượt.
- **Quà/tim không mua tốc độ:** quà chỉ cảm ơn; tim chỉ nạp GIÓ THUẬN chung cho CẢ đoàn
  (không phải lợi thế cá nhân). Copy trên sân khấu/giọng đọc chỉ nêu luật trung tính.
- Giọng MC nam M: (useRace.ts giữ M: cho nút nói thử của Dashboard).
- Art tự chế: sheet thú đua vẽ bằng AI trong racerArt.ts (đã tách nền bằng flood-fill từ tâm ô,
  giữ thành phần liên thông chính — đuôi cáo từng suýt lọt sang ô thỏ). Không dùng art kênh khác.

## Cơ chế cốt lõi (race.ts)

- Mô phỏng theo dt trong tick() (dt clamp 0,5s); hook gọi tick mỗi 200ms và hold() khi MC đọc
  câu chính — hold dời cả lastTickAt lẫn boostUntil/event/tailwind để không bị "ăn gian" thời gian.
- Tốc độ gốc mỗi chặng bốc lại ngẫu nhiên (baseMin + rng*baseVar) — đừng lưu tốc độ cố định theo
  người, chặng nào cũng phải có bất ngờ.
- Khẩu lệnh: event mở 5s, mỗi người dùng 1 lần/đợt (usedBy), khớp plain() cả câu hoặc token đầu.
- Về nhất -> pha finish đếm ngược 10s; hết giờ chặng (raceMaxSec) xếp hạng theo dist trong toPodium.
- Thú của mỗi người cố định theo artFor(username) % 6 — đổi thuật toán là đổi thú của khách quen.

## Kiểm chứng

`npm run check` (race.check.ts) · `npm run lint` · `npm run build`. Cổng 3015.
