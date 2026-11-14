# CLAUDE.md — Bất biến của Bug Đi WC (đừng phá khi sửa)

- **Cổng 3029** (HMR 24706). Stage: `http://lvh.me:3029/?view=stage` (1080×1920 dọc).
- **Kiến trúc phòng**: phòng game sống trong TRANG STAGE (như arena-meo/bong-bong);
  trang điều khiển chỉ điều khiển từ xa qua `/api/control` + nhận snapshot
  `/api/game/state` (stage POST mỗi 400ms). Chưa mở stage thì panel hiện "Đang chờ
  trang stage" — đúng thiết kế, không phải lỗi. Tick stage 100ms.
- **Engine thuần tất định** `src/game/wc.ts`: constructor `(now, rng)`, không
  `Date.now()`/timer trong engine. Sửa engine phải giữ `src/game/wc.check.ts` PASS
  (`npm run check`). `debugSetProgressPct/debugProgressPct/debugNeed/debugAnnoyance`
  là móc kiểm chứng, giữ nguyên.
- **Lực rặn là của CẢ PHÒNG**: tim cộng vào 1 thanh chung (khác mẫu "tim cá nhân"
  của Đua Vịt/Đấu Trường — đừng lẫn). 1 tim = 1 điểm; nhu cầu cấp n =
  `round(600 × 1,35^(n−1))`. Buff NƯỚC chỉ nhân phần lực từ TIM (không nhân burst chat).
- **Tụt tiến độ**: chỉ khi >3s không tim (theo `lastLikeAt` THẬT — tim lúc Bug dỗi
  không cập nhật mốc này, đó là chủ đích để dỗi vẫn tụt) và hết buff xơ; tốc độ
  0,4%/s; sàn = mốc cao nhất đã đạt trong lượt (25/50/75). Hết giờ 240s → mang
  40% tiến độ sang lượt sau, mốc sàn tính lại từ phần mang sang.
- **Dỗi (sulk)**: quạu 100 → dỗi tối đa 6s. Đang dỗi: `like()` chỉ ghi nhịp hiển
  thị (không lực/không ghi công/không cập nhật lastLikeAt), lệnh RẶN/CỐ LÊN vô
  hiệu; buff NƯỚC/RAU vẫn bật được. XIN LỖI −1,5s/câu. Hết dỗi (hết giờ hoặc dỗ
  xong): +2% tiến độ, quạu về đúng 30 (trong `tick`, bước nguôi quạu chạy TRƯỚC
  `endSulk` để không bị trừ tiếp cùng tick). Quạu tự nguôi 2/s khi không dỗi;
  xì (hiss) chỉ bắn lại sau khi quạu xuống dưới 50.
- **QUÀ = CHỈ CẢM ƠN**: `giftFx()` chỉ bật giấy vệ sinh bay 5s; `thank()` chỉ sinh
  lời cảm ơn. Cấm nối quà vào lực/tiến độ/buff/quạu dưới mọi hình thức. Chữ trên
  stage/HUD/README phải luôn ghi rõ điều này.
- **MC giọng NỮ + host hài**: mọi câu engine sinh có tiền tố `F:` và bốc từ pool
  ≥5 câu bằng `pick()` (không lặp câu vừa bốc trong cùng pool). Thêm sự kiện mới
  phải thêm pool ≥5 câu, không hardcode 1 câu. Văn phong trung tính trên bề mặt
  phát sóng: không kêu gọi thả tim/follow/share/tặng quà dạng mệnh lệnh.
- **Tiếng mèo** (`src/live/catSounds.ts`): tổng hợp Web Audio, KHÔNG file mẫu.
  Engine chỉ phát tín hiệu qua `drainCues()` ('meow' | 'meowBig' | 'sadMeow' |
  'hiss' | 'yowl' | 'chirp'); tiếng gằn/grừ liên tục do hook lái theo likeRate.
  Đừng gọi Web Audio từ engine (engine phải thuần để test).
- **Bong bóng chat**: mọi chat lên sân khấu qua `addBubble()` — bắt buộc qua
  `maskBanned()` + cắt 40 ký tự + trần 5 cái + sống 5s. Đừng render chat thô ở
  bất kỳ chỗ nào khác trên stage.
- **Nhạc gốc riêng**: `src/live/music.ts` bản "Rặn Đi Bug Ơi" C–F–G–C 112 BPM
  tuba oom-pah — không dùng lại giai điệu game khác. Nhạc/giọng/tiếng mèo chỉ
  phát sau tương tác đầu tiên (luật trình duyệt); không hứa cách lách.
- **Vỏ sân khấu**: glass kem "storybook glass" (`.glass-panel`/`.glass-pill` trong
  `wc.css`) — KHÔNG mảng tối (dark slab) trong chrome sân khấu.
- **Ảnh nhị phân** `public/assets/wc-bg.png`, `bug-wc.png`, `bug-relief.png`,
  `sen.png` KHÔNG đi qua đường đẩy chữ GitHub — phải chép/push từ Mac (gói zip).
  Stage phải vẫn chạy khi thiếu ảnh (nền gradient + emoji 🐱 dự phòng) — đừng bỏ
  lớp dự phòng khi sửa stage.
