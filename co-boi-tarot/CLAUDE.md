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
  đọc lại câu hỏi) → deal (3 lá úp hiện dần) → flip (lật từng lá) →
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

## Chống tĩnh + khách mẫu (thêm 2026-11-18)

- Phòng trống (không khách ngồi, hàng chờ rỗng, pha idle): sân khấu tự diễn vòng 4 động tác
  LỚN mỗi ~9.5 giây (xào bài, xoè quạt bài, vẫy chào + tia sáng, xem quả cầu + vòng rune
  xoay) bằng tư thế sẵn có + phần tử CSS, kèm ambient luôn chạy (sao băng ngẫu nhiên 18-35s,
  rune bay lên, tia lửa quanh nến). Có khách ngồi là dừng ngay. Câu nhắc cách chơi lúc vắng:
  pool LINES.idle 6 câu, mỗi ~55 giây, chỉ đọc khi giọng rảnh và không có khách ngồi.
- Khách mẫu: trống liên tục 40 giây (GAME.demoAfterMs) thì 1 khách mẫu ngồi vào (username
  'khach-mau', nhãn "✦ Khách mẫu ✦ / lượt xem thử" trên sân khấu), hỏi 1 câu trong
  DEMO_QUESTIONS, chạy ĐỦ vòng xem như khách thật nhưng: không điểm, không vào hàng chờ,
  không tính vào số lượt đã xem. Khách thật gõ câu hỏi vào hàng là lượt mẫu NHƯỜNG: lật nốt
  các lá với nhịp rút gọn (demoFlipStepMs), phần đọc rút còn câu mở + câu nhường; nếu đang
  giữa pha đọc thì bỏ các câu luận đang chờ (voice.dropQueued, câu đang đọc thì đọc nốt).
- Lật bài: lá nhấc lên scale 1.07 + xoay 3D + vệt sáng, chạm bàn bung tia lửa, lá ngược
  chớp đỏ; tiếng vút/thụp tổng hợp Web Audio trong src/game/sfx.ts (chỉ trang stage).
- Tốc độ giọng mặc định 1.32 (tăng 20% từ 1.10, chủ kênh chốt 2026-11-18); giữa các câu
  không có khoảng lặng cấu hình riêng: câu chính được tạo giọng sẵn lúc xếp hàng nên nối
  nhau gần như liền mạch.
- Nhịp lượt xem đã siết (chủ kênh chốt 2026-11-18, "trải bài nhanh hơn, còn nhiều người
  đợi"): cắt ~40% thời gian chết giữa các bước, tổng sàn 1 vòng 38.35s -> 23.1s (welcome
  5->3s, trải bài 950->600ms/lá + đuôi 500->300ms, lật 2800->1700ms/lá + đuôi 600->400ms,
  sàn pha đọc 16->10s, nghỉ 5->2.5s; đuôi pha nằm ở GAME.dealTailMs/flipTailMs). Các con số
  này chỉ là SÀN: đồng hồ pha bị giữ khi giọng đọc câu chính nên không cắt ngang câu nói,
  và nội dung đoạn luận không đổi.

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

## Live bằng điện thoại qua Wi-Fi (thêm 2026-11-19)

- Bối cảnh: quyền LIVE Studio của kênh bị đình chỉ (xác minh thất bại 14/11, phải chờ ~15/12
  mới đăng ký lại được) nên chủ kênh live tạm bằng app TikTok trên điện thoại, phát màn hình
  trang stage. Server vì vậy nghe ở 0.0.0.0 và in thêm dòng "Link cho điện thoại (cùng
  Wi-Fi): http://<IP-LAN>:3030/?view=stage" lúc khởi động. Điện thoại phải cùng Wi-Fi với máy
  Mac; mở link đó trong trình duyệt điện thoại rồi bật phát màn hình trong app TikTok.
- Mô hình bảo mật (server.ts): API vẫn không có đăng nhập, dựa vào 2 lớp. (1) Cổng Host/Origin:
  chỉ nhận localhost / 127.0.0.1 / lvh.me, IP dạng số thuộc dải LAN riêng (10/8, 172.16/12,
  192.168/16), hoặc IP của chính card mạng của máy; TÊN MIỀN công cộng vẫn bị 403 nên chống
  DNS rebinding còn nguyên.
  (2) Tách quyền theo nguồn: từ LAN (không phải loopback) chỉ xem được sân khấu (trang stage,
  /assets, SSE /api/tiktok/events, /api/tts, POST /api/game/state do stage tự báo), còn các
  lệnh điều khiển POST /api/control, /api/tiktok/connect, /api/tiktok/disconnect,
  /api/test/emit chỉ nhận từ loopback. Hệ quả: trang điều khiển phải mở bằng localhost/lvh.me
  trên máy Mac, mở bằng IP LAN là các nút điều khiển bị 403.
- Vite: allowedHosts để `true` trong vite.config.ts (IP LAN thay đổi theo DHCP, không liệt kê
  cứng được) — an toàn vì middleware hostOk của Express chạy trước Vite và là cổng thật.
- Phạm vi tin cậy: chỉ mạng Wi-Fi nhà. Không port-forward ra internet, không dùng link này
  trên Wi-Fi công cộng. Cách live chính chủ vẫn là LIVE Studio qua lvh.me như cũ, không đổi.

## 2 gói nâng cấp: nhạc kịch tính + hiệu ứng sân khấu (thêm 2026-11-19)

### Gói 1 — Nhạc hộp nhạc + nhạc hiệu lật bài
- src/live/music.ts viết lại: bản "Hộp Nhạc Đêm Trăng" TỰ SOẠN bằng Web Audio (không file
  ngoài): giai điệu hộp nhạc (sine + hài âm ~4× tần số, tắt nhanh) chạy vòng 64 bước × 0.5s
  trên vòng hợp âm Am–F–C–G, đệm pad như cũ. Chế độ theo pha (music.setMode, useFortune gọi
  mỗi vòng lặp): idle = thưa (chỉ nốt ở bước chia hết cho 4, pad lùi nhẹ); active (có khách /
  trải / lật) = đủ giai điệu + nhịp trầm rất khẽ ở đầu/giữa ô nhịp; reading = thưa lại
  và vẫn duck xuống 0.3 khi giọng cô đang đọc (setDucked như cũ).
- src/game/sfx.ts thêm accent theo lá, phát đúng lúc lá chạm bàn (~0.8s sau khi lật, lá 3
  chậm thì ~1.15s): lá xuôi = arpeggio chuông sáng 3 nốt; lá ngược = chuông trầm tối A2/E3;
  lá Ẩn Chính (isMajor trong cards78.ts, id 'major-*', đúng 22 lá) = nhạc hiệu vàng (chùm
  chuông 5 nốt + vệt sáng cao + cồng mềm). Toast nhảy hạng có tiếng sparkle 2 nốt nhỏ.

### Gói 2 — Hiệu ứng lật bài + sân khấu không chết + layout mới
- Lá Ẩn Chính lật: vụ nổ ánh sáng vàng + vòng sáng lan tại lá (CSS fortune-major-burst/ring),
  quầng sáng vàng toàn màn hình (fortune-screen-glow), khách bay hạt tim/sao vàng
  (fortune-guest-fx). Lá ngược: vignette tím sâu toàn màn hình (fortune-screen-vignette) +
  hạt tím trầm ở khách. Lá 3 lật CHẬM kiểu slow-motion 1.4s (fortune-card-slow) + tia sáng
  từ quả cầu pha lê chiếu về phía bàn (fortune-ball-rays). Mọi hiệu ứng chạy 1 lần theo mốc
  lật (flipFx trong FortuneStage), không lặp.
- Lúc chưa có lá nào trên bàn (chờ khách hoặc khách vừa ngồi chưa trải): thay 3 ô trống đứt
  nét bằng "bàn thờ bộ bài" (DeckAltar): bộ bài úp lơ lửng lên xuống, vòng rune xoay 26s,
  hạt sáng trôi, nhãn đổi theo có khách ngồi hay chưa. Ô lời giải lúc chờ có chữ teaser đập
  sáng nhẹ (fortune-teaser) thay cho hộp đen tĩnh.
- Layout 1080×1920: cảnh phòng to hơn (top 368, cao 504), 2 panel thông tin thu gọn (top
  884, cao 240), hàng lá top 1140 (3 lá, mỗi lá 264px), panel lời
  giải top 1672 cao 166. ĐÃ BỎ dòng điểm vàng ở chân trang (trùng luật điểm ở panel phải,
  giữ nguyên văn panel phải); chân trang chỉ còn dòng miễn trừ. POINTS_NOTE trong config.ts
  giữ làm hằng tham chiếu, sân khấu không hiển thị nữa.

### Gói 3 — ĐÃ GỠ BỎ (2026-11-19)
- Gói 3 "cả phòng tham gia" (đoán lá cuối qua chat + thanh năng lượng phòng/lá ẩn thứ 4 + báo vị trí/thời gian chờ khi vào hàng) từng được làm cùng đợt này, nhưng chủ kênh chốt GỠ BỎ ngay trong ngày 2026-11-19: lượt xem phải nhanh cho người xem, không thêm bước chờ/đoán giữa các lá. Code, test và tài liệu của gói này đã xoá sạch; đừng tự thêm lại nếu chủ kênh chưa chốt lại.

## Sân khấu trên iPad/Safari (thêm 2026-11-19)
- index.html có meta apple-mobile-web-app-capable + mobile-web-app-capable +
  apple-mobile-web-app-status-bar-style=black-translucent: chủ kênh "Thêm vào Màn hình
  chính" trên iPad là mở stage như app độc lập, không thanh Safari che sân khấu.
- Nút toàn màn hình ⛶ ở góc trên-trái sân khấu (chỉ trang stage thật, không hiện ở bản xem
  trước của trang điều khiển): nhỏ, mờ, tự nhạt xuống 0.18 sau 3.5 giây, chạm là hiện lại;
  bấm để requestFullscreen/exitFullscreen. iPhone Safari không hỗ trợ fullscreen theo phần
  tử thì bấm không có tác dụng phụ (đường chính vẫn là mở từ Màn hình chính).
- Sân khấu co giãn contain-fit theo khung 1080×1920 (StageFrame lấy min tỉ lệ ngang/dọc)
  nên viewport lạ (tablet còn thanh trình duyệt) vẫn trọn khung, không thanh cuộn, không
  cắt disclaimer: đã kiểm chứng ở 768×1024, 820×1050, 834×1112.
