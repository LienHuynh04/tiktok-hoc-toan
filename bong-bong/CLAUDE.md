# CLAUDE.md — Bất biến của Bong Bóng Avatar (đừng phá khi sửa)

- **Cổng 3028** (HMR 24702). Stage: `http://lvh.me:3028/?view=stage` (1080×1920 dọc).
- **Vào phòng (member) hoặc comment** là có bong bóng: `server.ts` lấy URL avatar từ
  `data?.user?.avatarThumb?.urlList?.[0]` cho chat/gift/member/follow/share; **sự kiện like KHÔNG có
  avatar** (useBubbles truyền `avatar: ''`). Không có avatar → chữ cái đầu trên đĩa màu theo băm tên.
  Một người tối đa 1 bong bóng; tối đa 40 bong bóng sống.
- **Tim chỉ to bong bóng của CHÍNH người thả** (+3%/lượt, gộp nhịp 1,5s/bong bóng) và **chat của chính
  chủ** +1%/tin; cả hai dùng chung trần **×2,2** cỡ gốc (bán kính gốc 46px). Bong bóng to di chuyển
  chậm hơn (steering tỉ lệ nghịch √growth). Đây là luật nhà của game này — KHÔNG mở rộng sang game khác.
- **Luật nứt**: chỉ khi va chạm có tỉ lệ cỡ ≥ **1,35** VÀ tốc độ tương đối ≥ **70 px/s** thì bong bóng
  NHỎ hơn nứt 1 vết; mỗi cặp có cooldown 320ms; **3 vết = nổ**, người làm nổ +1 điểm nổ. Cỡ ngang nhau
  không bao giờ nứt (chỉ tia lấp lánh). Bong bóng **vàng** (15s, mỗi ~90s) không bị nứt và làm nổ tính
  điểm **đôi**. Bong bóng bị nổ: chủ của nó bị khoá hồi sinh **8 giây**, comment lại mới có bong bóng mới.
- **Bot 🤖 KHÔNG BAO GIỜ gây nứt** (chỉ bong bóng lớn hơn-không-phải-bot mới được gây nứt) và **không
  bao giờ thắng vòng**; bot rút khi bong bóng người thật ≥ 4. Vòng chỉ kết khi vòng đã có ≥3 người thật
  và còn ≤1 bong bóng người thật; người thắng +1 điểm thắng và giữ vương miện tới khi vòng sau kết thúc.
- **Sự kiện máy không gắn với quà**: gió quạt ~50s (thổi ngang 3s), chân Bug ~2–3 phút quệt bong bóng
  TO NHẤT đúng **2 vết nứt**. Quà CHỈ sinh 3 bong bóng tim trang trí + lời cảm ơn — không to, không
  chống nứt, không điểm. Văn bản phát sóng chỉ nêu luật trung tính, không kêu gọi thả tim/follow/tặng quà.
- **Engine thuần tất định** `src/game/bubbles.ts`: constructor `(now, rng)`, vật lý bước cố định 20ms,
  hàm `view()` là nguồn dữ liệu duy nhất cho stage. Sửa luật phải giữ `src/game/bubbles.check.ts` PASS
  (`npm run check`): sinh đúng 1 bong bóng/người · tim chỉ to của chủ + trần ×2,2 · trần chat · luật nứt
  (≥35% + tốc độ; ngang cỡ không nứt) · 3 vết → nổ + điểm + khoá 8s · vàng không nứt + điểm đôi · kết vòng
  ≤1 người thật, người thắng không phải bot · bot không gây nứt + rút ở 4 người thật · chân Bug đúng 2 vết.
  `debugPlace/debugSetVel/debugSetGrowth` là móc kiểm thử — không nối vào UI.
- **MC là giọng NỮ**: mọi câu engine sinh có tiền tố `F:` (xem `bubbles.ts` helper `say()`); nút đọc thử
  ở trang điều khiển cũng thêm `F:`. Đừng đổi sang `M:`.
- **Nhạc là bản GỐC riêng của game này** ("Bong Bóng Bay", C–G–Am–F, 126 BPM, trong
  `src/live/music.ts`) — không chép giai điệu game khác, không dùng file nhạc ngoài.
- **Khung giao diện = kính kem**: panel `rgba(252,247,238,0.88)` + blur + viền nâu ấm mỏng, chữ nâu đậm,
  điểm nhấn vàng — không dùng mảng tối (dark slab). Bong bóng vẽ bằng CSS (gradient kính + vành cầu vồng
  conic + bóng sáng + SVG vết nứt); avatar cắt tròn `padding: 9%` bên trong màng.
- **File nhị phân KHÔNG đẩy qua đường chữ**: `public/assets/bubble-bg.png` (nền phòng giếng trời) và
  `public/assets/bug.png` (sprite Bug cho sự kiện chân quệt) — chép tay trên Mac. Stage phải chạy được
  khi thiếu ảnh (nền gradient dự phòng + emoji 🐾 thay sprite).
- Khung dùng chung `src/live/` và `server.ts` sao từ arena-meo (bản khung mới nhất): sửa ở đây KHÔNG tự
  lan sang game khác. Cổng/HMR phải khớp giữa `server.ts`, `run.sh`, `BAT-LIVE.bat`, README này.
