# Cô Bói Tarot: ghi chú cho Claude

> Game dựng ngày 2026-11-18 từ khung Phòng Tarot (~/workspace/lop-toan/phong-tarot) theo format
> phòng bói livestream mà chủ kênh gửi mẫu: khách hỏi câu tự do, ngồi vào bàn, trải 3 lá lật
> từng lá theo vị trí, cô đọc đoạn luận liền mạch. Chỉ giữ phần ống nước (server, giọng đọc,
> SSE) từ Phòng Tarot; lõi game, hình ảnh và lời giải đều làm mới cho game này.

## NGOẠI LỆ ĐIỂM — chỉ riêng game này (chủ kênh chốt 2026-11-18)

- Hàng chờ của Cô Bói Tarot xếp THEO ĐIỂM: điểm LẺ = điểm quà (xu, 1 xu = 1 điểm, bông hồng
  = 1 điểm) + số tim đã tính / 100; hiện 1 chữ số thập phân, cắt xuống (formatPoints: 0.99
  hiện "0.9"). Điểm cao lên trước, bằng điểm thì ai vào trước ở trước.
- Tim và quà CHỈ tính từ lúc người đó vào hàng chờ hoặc đang ngồi xem ("tim tính từ lúc em
  vào hàng" như bảng mẫu): thả tim/tặng quà trước khi vào hàng thì không cộng, không tính bù.
- Khi một người trong hàng chờ tăng hạng nhờ điểm của chính họ, sân khấu hiện toast "số cũ →
  số mới" (tối đa 2, 4.2 giây, mỗi người cách nhau ít nhất 3 giây mới báo lại — RankJump trong
  fortune.ts). Khách đang ngồi không có toast nhảy hạng.
- Đây là ngoại lệ chủ kênh TỰ CHỌN riêng cho game này, ghi đè luật "quà/tim không mua thứ tự"
  đang áp dụng cho Phòng Tarot và các game khác. KHÔNG được mang cơ chế này sang game khác
  nếu chủ kênh chưa chốt riêng cho game đó.

## Luật bất biến

- Xem bài CHỈ mang tính giải trí: dòng miễn trừ cố định ở chân sân khấu ("Chỉ để giải trí ·
  Không phải bói toán thật · Không thu phí · Đừng tin để quyết định việc quan trọng"), giọng
  đọc nhắc lại ở lượt đầu và mỗi 5 lượt. Lời giải trong cards78.ts viết giọng gợi mở, không
  khẳng định chuyện sức khoẻ/tiền bạc, không hứa hẹn kết quả.
- Hình lá bài: bộ Rider-Waite-Smith bản 1909 (phạm vi công cộng), tải từ Wikimedia Commons
  (bộ "RWS Tarot 1910"), để ở public/assets/cards/. Không thay bằng bộ bài hiện đại có bản quyền.
- Cô bói và phòng bói là tranh TỰ TẠO cho game này (art-raw/ là bản gốc, public/assets/ là bản
  đã tách nền bằng flood-fill). Mặt úp của lá bài tự vẽ bằng CSS (trăng sao tím vàng).
- Câu đọc không dùng dấu gạch ngang dài (—, –). Mọi nhóm câu LINES trong fortune.ts và mẫu câu
  trong reading.ts đều có từ 2 biến thể trở lên, bốc không lặp biến thể vừa dùng.

## Kiến trúc nhanh

- Engine thuần thời gian: `FortuneRoom` (src/game/fortune.ts), pha idle → welcome (khách ngồi,
  đọc lại câu hỏi) → deal (3 lá úp hiện dần) → flip (lật từng lá, mỗi lá 1 câu đọc ngắn) →
  reading (đoạn luận 6 câu: mở + 3 lá + lời khuyên + khép) → rest → khách tiếp theo.
  Đồng hồ pha bị giữ (hold) khi giọng đang đọc câu chính, giống Phòng Tarot.
- Điểm nằm trong engine: addLikes/addGiftPoints chỉ cộng khi người đó đang ở hàng chờ/đang
  ngồi (isActiveMember), điểm lẻ tính đúng theo tổng tim (không gộp chờ đủ 100). Hàng chờ
  sort lại sau mỗi lần điểm đổi; bằng điểm thì theo số thứ tự vào (seq). Sân khấu: panel hàng
  chờ bên trái hiện top 4 + "+N người nữa", panel phải "Muốn lên trước?" giải thích cách tính
  điểm, bảng tên "✦ tên ✦ · đang ngồi trước bàn bài" phía trên ghế khách (view.nameplate).
- Câu hỏi: extractQuestion trong reading.ts (có "?", tiền tố "HỎI:", "xem giúp/xem cho...",
  hoặc gọi "cô ơi" kèm từ để hỏi). Người đã ở trong hàng chờ hỏi lại thì CẬP NHẬT câu hỏi,
  giữ nguyên vị trí và điểm. Chủ đề đoán bằng detectTheme (6 chủ đề).
- Rút 3 lá khác nhau từ đủ 78 lá, mỗi lá 25% chiều ngược (GAME.reversedChance). rand bơm từ
  ngoài để test xác định.
- Giọng: mọi Say bắt đầu "F: " (nữ HoaiMy). Nhạc nền gốc Web Audio (src/live/music.ts),
  duck khi giọng bận; cần 1 lần Interact trong LIVE Studio để mở khoá tiếng, không hứa lách.
- Cổng 3030, HMR dev 24688 (tránh đụng Phòng Tarot 3008/24686, Lớp Toán 3007/24684).
- Kiểm chứng: `npm run check` (fortune.check.ts), `npm run lint`, `npm run build`,
  smoke server PORT=3030 rồi chụp màn hình stage (?view=stage&mute=1) để nhìn tận mắt.

## Nhân vật khách (thêm 2026-11-18)

- Khách ngồi vào bàn hiện thành NHÂN VẬT chibi ngồi ghế (không chỉ đĩa avatar): pool 12 nhân
  vật tự vẽ (6 nam m1..m6, 6 nữ f1..f6) ở public/assets/guests/, quay lưng 3/4 hướng về cô.
  Bốc ngẫu nhiên lúc khách ngồi, tránh trùng nhân vật của khách liền trước; khách có avatar
  TikTok thì hiện huy hiệu avatar nhỏ cạnh tên ở chân ghế để vẫn rõ danh tính.
- TikTok không cho biết giới tính tin cậy được nên mặc định bốc cả pool. Khách đang ngồi gõ
  đúng 1 chữ NAM hoặc NỮ (bỏ dấu cũng được, parseGenderCommand trong src/game/guests.ts) thì
  đổi ngay sang nhân vật đúng giới, cô xác nhận bằng 1 câu nói thêm. Người còn trong hàng chờ
  gõ trước thì ghi genderPref, tới lượt bốc đúng giới.
- Ảnh gốc ở art-raw/guests/, tách nền bằng tools/tach-nen-khach.py (flood-fill viền như bộ cô bói).
