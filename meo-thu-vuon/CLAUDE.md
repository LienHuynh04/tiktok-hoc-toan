# MÈO THỦ VƯỜN — game thủ làn TikTok LIVE (bản gốc riêng)

Thể loại thủ nhà theo làn (cùng thể loại với các game tower-defense theo làn nổi tiếng)
nhưng NHÂN VẬT + LUẬT + CODE là bản gốc riêng: mèo/cây trong vườn chống đàn chuột.
Không dùng tài sản/hình ảnh/tên của game khác.

## Chạy
- `bash run.sh` (cổng 3017; LIVE Studio: http://lvh.me:3017/?view=stage, 1080x1920)

## Luật chơi
- Cả phòng dùng CHUNG 1 bể nắng ⭐ (trời thả +25/9s, Hoa Đèn Lồng +25/7s/cây).
- Game tự xoay "hậu vệ đang cầm" mỗi 6 giây (vòng quay OFFER_SEQ trong defense.ts).
  Người xem gõ số làn 1-5 (đứng riêng trong bình luận) -> trồng hậu vệ đó vào ô trống
  đầu tiên của làn, trừ nắng chung. Cây mang tên người trồng; sát thương tính cho chủ cây.
- 6 hậu vệ: Mèo Bắn Len 100 · Hoa Đèn Lồng 50 (sinh nắng) · Xương Rồng Gai 125 ·
  Chậu Đá 50 (tường 420 máu) · Nấm Bom 150 (nổ 3x3 sau 0,8s) · Mèo Băng 150 (làm chậm).
- 6 chuột: Xám · Nón Sắt (trâu) · Thể Thao (nhanh) · Ôm Phô Mai · Ba Lô (chết rơi +25⭐) ·
  Trùm Răng Sắt (đợt 5, 10, 15...). Máu chuột x(1 + 0,12 x (đợt-1)).
- Chuột tới nhà: chó gác của làn đó đuổi sạch cả làn (mỗi làn 1 lần/ván), hết chó thì
  nhà mất 1 tim (5 tim). Hết tim -> tổng kết 15s -> ván mới. Dọn sạch đợt: +50⭐.
- Tim: đủ 120 -> MƯA NẮNG +75⭐ cho cả vườn (nhịp chung). Follow mới: +50⭐ cả vườn (1 lần/người).
- QUÀ CHỈ CẢM ƠN: không bán nắng/hậu vệ/sát thương. Giọng MC nam (M:).

## Kỹ thuật
- Engine thuần mô phỏng theo dt trong src/game/defense.ts (DefenseRoom); test: npm run check.
- Art AI 2 sheet 3x2 key nền xanh trong defenderArt.ts / ratArt.ts (số thứ tự khớp DEF_INFO/RAT_INFO.art).
- Trang stage chạy engine + POST /api/game/state mỗi 200ms; trang điều khiển vẽ lại + nút test.
- Nút "🎬 Demo" ở trang điều khiển: trồng sẵn 7 cây + thả 5 chuột giữa sân để xem/chụp hình.
