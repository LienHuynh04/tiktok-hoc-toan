# CLAUDE.md — Bất biến của Bug Đại Náo Nhà Sen (đừng phá khi sửa)

- **Cổng 3025.** Stage: `http://lvh.me:3025/?view=stage` (1080×1920 dọc).
- **Kiến trúc phòng**: phòng game sống trong TRANG STAGE (như dua-vit); trang điều khiển
  chỉ điều khiển từ xa qua `/api/control` + nhận snapshot `/api/game/state`. Chưa mở stage
  thì panel hiện "Đang chờ trang stage" — đúng thiết kế, không phải lỗi.
- **Engine thuần tất định** `src/game/bug.ts`: constructor `(now, rng)`, mọi thời gian qua
  tham số `now`, không `Date.now()`/timer trong engine. Sửa engine phải giữ
  `src/game/bug.check.ts` PASS (`npm run check`).
- **Lệnh theo ngữ cảnh**: lệnh chỉ thành công khi Bug ở đúng zone/trạng thái của nhiệm vụ/lệnh.
  Lệnh sai ngữ cảnh = fail hài (anim + dòng chữ vui), TUYỆT ĐỐI không phạt điểm/mất lượt.
- **Công thức scale** (đổi là đổi cân bằng game):
  - Combo chiêu lớn: `need = clamp(3 + floor(chatters/2), 3, 30) - (cấp mập - 1)`, tối thiểu 2;
    mỗi người chỉ tính 1 lần trong cửa sổ 5 giây.
  - Tốc độ Sen = `52 + min(42, phút*3.2) + min(48, chatters*2.4)`. Bug bị bắt: trừ LÌ trước,
    hết LÌ mới tính 1 lần bắt; 3 lần bắt = Sen thắng chương.
- **Tiến trình cả buổi KHÔNG reset theo chương**: cân nặng/cấp mập/LÌ/tổng tích luỹ giữ nguyên;
  thua chương vẫn GIỮ dấu ✓ nhiệm vụ đã phá (chỉ khi phá hết 10 món danh sách mới xáo lại).
- **Quà = danh dự thuần tuý**: cảm ơn + tim/confetti. Không điểm, không tốc độ, không sức mạnh,
  không miễn bắt. Copy trên sóng không bao giờ dùng câu mệnh lệnh xin like/follow/share/quà.
- **MC giọng NỮ**: mọi dòng MC qua tiền tố `F:` (framework TTS M:/F:). Nhạc: `src/live/music.ts`
  là bản GỐC sáng tác cho game này (C–G–Am–F, 116 BPM) — không dùng lại nhạc Đua Vịt hay game khác.
- **Hình khoá cứng**: Bug xám TRƠN một màu, không sọc, vòng cổ hoa xanh dương, ngực/chân trắng,
  mắt vàng. Sen tomboy: tóc ngắn nâu sẫm rối, pijama xanh nhạt, mũ ngủ tím.
- **Hình ảnh sân khấu (từ 2026-11-14)**: dùng ẢNH THẬT của kênh — nền tranh màu nước
  `public/assets/room-bg.png` + bộ sprite tư thế Bug/Sen trong `public/assets/`; ánh xạ tư thế và
  warp toạ độ engine -> tranh nằm ở `src/game/stageArt.ts` (chỉ lớp trình diễn, CẤM sửa engine
  để "khớp tranh"). Sen luôn kẹp chân xuống đường sàn tranh (y >= 1558) và Bug bị bắt thì đứng
  cạnh chân Sen — đừng bỏ 2 kẹp này, bỏ là Sen/Bug lơ lửng trước kệ sách như bản nháp.
  SVG trong `src/game/art.ts` là ĐƯỜNG DỰ PHÒNG khi file ảnh lỗi tải — đừng xoá.
  Nhân vật render ở lớp phủ toạ độ sân khấu (BugStage), KHÔNG nhét vào khung `overflow-hidden`.
  Ảnh là file NHỊ PHÂN: không qua được đường push chữ — chép/đẩy từ Mac (xem README).
- **Hình thức test emit** (POST /api/test/emit): like = `{type:'like', data:{likeCount:N}}`
  (để phẳng `{count:N}` chỉ tính 1 tim); chat = `{type:'chat', data:{comment:'ĐẨY'}}`.
  Lệnh điều khiển riêng: `/api/control {action:'custom', text:'demo_nao' | 'force_vote' | 'sim_viewers:N'}`.
- Sau khi sửa CSS/art phải **chụp lại stage headless và TỰ ĐỌC ảnh** (screenshots/), không
  kiểm chứng hình ảnh bằng HTTP status.
