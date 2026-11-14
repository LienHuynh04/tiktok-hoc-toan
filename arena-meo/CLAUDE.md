# CLAUDE.md — Bất biến của Đấu Trường Mèo (đừng phá khi sửa)

- **Cổng 3027** (HMR 24698). Stage: `http://lvh.me:3027/?view=stage` (1080×1920 dọc).
- **Kiến trúc phòng**: phòng game sống trong TRANG STAGE (như bug-dai-nao/dua-vit); trang
  điều khiển chỉ điều khiển từ xa qua `/api/control` + nhận snapshot `/api/game/state`
  (stage POST mỗi 400ms). Chưa mở stage thì panel hiện "Đang chờ trang stage" — đúng thiết
  kế, không phải lỗi. Tick stage 100ms (thay vì 200ms) vì mèo nảy liên tục cần snapshot dày.
- **Engine thuần tất định** `src/game/arena.ts`: constructor `(now, rng)`, vật lý bước cố
  định 20ms trong `tick(now)`, không `Date.now()`/timer trong engine. Sửa engine phải giữ
  `src/game/arena.check.ts` PASS (`npm run check`). `debugPlace/debugSetHp/debugStop` là
  móc kiểm chứng, giữ nguyên.
- **Sức mạnh CHỈ kiếm bằng chơi**: chat của chính chủ +1 (trần +30/vòng, tin comment đầu
  tiên thả mèo KHÔNG tính), hạ 1 mèo +2. Không đường nào khác cộng sức mạnh.
- **Tim hồi đúng mèo của người thả**: `like()` chỉ hồi cho mèo của chính username đó, +2 HP,
  gộp lượt theo `likeHealCooldownMs` (2s), trần 100; không có mèo thì không hồi ai. Đây là
  mẫu tim cá nhân của Đua Vịt — KHÔNG mở rộng thành tim hồi cả phòng hay hồi bằng quà.
- **QUÀ = CHỈ CẢM ƠN**: `giftFx()` chỉ bật trái tim bay quanh mèo người tặng trong 4s;
  `thank()` chỉ sinh lời cảm ơn. Cấm nối quà vào HP/sức mạnh/sát thương/bảo vệ dưới mọi hình
  thức. Chữ trên stage/HUD/README phải luôn ghi rõ điều này.
- **Công thức va chạm**: kẻ mạnh hơn gây `max(2, 4 + chênh sức mạnh)`; ngang sức thì cả hai
  cùng mất 4. Boss dùng cùng công thức với `bossPower = 30` cho cả hai chiều (mèo yếu đánh
  boss chỉ 2 HP/đòn là CÓ CHỦ ĐÍCH — cả phòng hợp sức mới hạ được).
- **Boss**: máu = 300 + 50 × mèo đang sống lúc vào sân; hạn 60s; hết giờ đập sân loại đúng
  3 mèo yếu nhất (tính cả bot); hạ boss thì mọi mèo NGƯỜI THẬT sống sót +1 thắng, đòn kết
  liễu (chỉ tính người thật) +1 "hạ boss". Đang có boss thì vòng KHÔNG kết thúc.
- **Kết vòng**: chỉ khi vòng đã có ≥3 mèo người thật vào sân VÀ còn ≤1 mèo người thật sống.
  Bot không bao giờ thắng: hết mèo người thật mà còn bot = vòng HOÀ. Người thắng đội vương
  miện ở vòng sau (`lastWinner`).
- **Bot sưởi sân**: người thật sống <4 thì bot vào đủ 4 mèo tổng; người thật sống ≥4 thì bot
  rút sạch. Bot có cờ `bot` + nhãn 🤖 BOT trên badge, không vào bảng điểm.
- **MC giọng NỮ**: mọi câu engine sinh có tiền tố `F:`; câu chính (thắng vòng, boss đến/gục/
  đập sân) là `main`, câu phụ qua hàng chatter có TTL. Văn phong trung tính: không kêu gọi
  thả tim/follow/share/tặng quà dạng mệnh lệnh trên bề mặt phát sóng.
- **Nhạc gốc riêng**: `src/live/music.ts` bản "Mèo Đấu Sàn" Dm–F–C–G 128 BPM — không dùng
  lại giai điệu game khác. Nhạc/giọng chỉ phát sau tương tác đầu tiên (luật trình duyệt);
  không hứa cách lách.
- **Ảnh nhị phân** `public/assets/room-bg.png` + `public/assets/boss-bug.png` KHÔNG đi qua
  đường đẩy chữ GitHub — phải chép/push từ Mac. Stage phải vẫn chạy đẹp khi thiếu 2 ảnh này
  (nền kem dự phòng có sẵn trong code bằng backgroundColor + boss có emoji 🐱 dự phòng sau
  thẻ img) — sửa stage đừng bỏ lớp dự phòng này.
- **Màu vòng badge** từ `hashHue(username)` (FNV-1a + trộn) — đừng quay về băm *31 thường:
  tên gần giống nhau sẽ ra màu gần giống nhau, nhìn như trùng mèo.
