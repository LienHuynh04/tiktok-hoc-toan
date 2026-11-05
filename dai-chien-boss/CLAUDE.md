# CLAUDE.md — Đại Chiến Boss

Game TikTok LIVE trong repo `tiktok-hoc-toan`, cùng khung `src/live/` với các game khác.
Chủ kênh yêu cầu (2026-11-05): game mới tối ưu cho (1) vào chơi cực dễ, (2) NHIỀU người chơi
CÙNG LÚC, (3) vui để người xem tự nguyện tặng quà, (4) hoàn toàn hợp pháp. Thiết kế được chốt:
cả phòng cùng đánh 1 boss bằng cách gõ đáp án đúng.

## Nguyên tắc không được phá

- **Đồng loạt, không theo lượt:** mọi câu hỏi đều mở cho cả phòng cùng trả lời; không hàng chờ,
  không "1 người chơi cả phòng xem". Đây là lý do game tồn tại — đừng thêm cơ chế chờ lượt.
- **Quà/tim không mua được lợi thế:** quà chỉ được cảm ơn (thank), tim chỉ nạp thanh Nộ chung
  (mưa sao băng là nhịp chơi chung của cả phòng, không phải lợi thế cá nhân). Không solicitation
  trong câu đọc/sân khấu: chỉ nêu luật và bộ đếm trung tính.
- **Đáp án không được lộ trong view khi đang fight:** BossView.question chỉ chứa text câu hỏi;
  đáp án chỉ xuất hiện ở pha reveal (reveal.answerText). Trang điều khiển đọc cùng snapshot
  nên lộ đáp án là người xem gian lận được.
- Giọng là MC nam M: — useBoss.ts nút nói thử của Dashboard giữ M:.
- Nhân vật/boss tự chế (BOSS_ROSTER trong boss.ts, robot SVG trong BossStage.tsx), không sao
  chép nhân vật hay tài sản của kênh khác; trang igl.futrixapi.com chỉ tham khảo THỂ LOẠI.

## Cơ chế cốt lõi (boss.ts)

- Câu hỏi xoay vòng math → type → count (kindIdx), 12s/câu, sinh bằng rng tiêm được để test.
  Math: đáp án luôn nguyên (chia không hết thì đổi thành nhân). Type: so khớp qua plain()
  (không dấu). Count/math: lấy số đầu tiên trong bình luận.
- 1 đòn/người/câu (roundHits). Đòn đầu câu x2 (crit). Chuỗi: +2/đòn theo streak, cap +10;
  gõ sai dạng "thử trả lời" (có số / cụm ≥4 ký tự đã plain) thì streak về 0; không trả lời
  thì streak giữ nguyên qua câu.
- Boss: hpForLevel = 600 × 1.3^(cấp-1); form 0/1/2 theo mốc 2/3, 1/3 máu; form 2 mọi đòn x1,5.
- Mưa sao băng (like đủ 250): trừ 5% maxHp, CÓ THỂ kết liễu boss — like() phải gọi bossDown
  khi hp về 0, nếu không game kẹt ở reveal (đã từng suýt dính).
- bossDown: MVP tính theo damage lên CON BOSS VỪA GỤC (damage reset mỗi spawnBoss), khác
  totalDamage cả buổi.
- hold(ms) dời phaseEndsAt khi MC đang đọc câu chính — giữ nhịp này, đừng bỏ.

## Kiểm chứng

`npm run check` (boss.check.ts: máu theo cấp, đòn đầu x2, chuỗi + reset, gục → cấp 2,
sao băng kết liễu) · `npm run lint` · `npm run build`. Cổng 3014, run.sh / BAT-LIVE.bat.
