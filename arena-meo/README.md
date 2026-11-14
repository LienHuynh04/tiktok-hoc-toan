# 🐱 Đấu Trường Mèo — TikTok LIVE game

Mèo của **từng người xem** đấu nhau trong phòng khách nhà Sen. Comment bất kỳ là mèo của bạn
xuất hiện (badge avatar + tai mèo), tự nảy khắp sàn và **tự đấu khi va chạm**. Không sảnh chờ,
không lượt đợi: vào phòng là có mèo trong sân.

## Chạy trên Mac

```bash
cd arena-meo
bash run.sh
```

- Trang điều khiển: http://localhost:3027
- Link cho TikTok LIVE Studio: **http://lvh.me:3027/?view=stage** (1080×1920 dọc)
- Lần đầu chạy sẽ tự `npm install`. Đóng cửa sổ Terminal là tắt.
- **Âm thanh**: trình duyệt chỉ cho phát tiếng sau 1 tương tác đầu tiên — mở stage xong bấm
  **Interact 1 lần** vào cửa sổ stage trong LIVE Studio là nhạc + giọng MC chạy (trang đã có
  watchdog tự thử lại, nhưng 1 cú Interact là chắc chắn nhất). Không có cách nào bỏ qua bước
  này — đó là luật của trình duyệt, không phải lỗi game.

## Cách chơi

- **Comment bất kỳ** → mèo của bạn vào sân: vòng tròn tai mèo chứa avatar TikTok của bạn
  (không có avatar thì là chữ cái đầu của tên), màu vòng tính từ tên người dùng; dưới badge là
  tên, thanh máu và số sức mạnh.
- Mèo **tự nảy và tự đấu**: khi 2 mèo chạm nhau, mèo mạnh hơn gây sát thương
  **4 + chênh lệch sức mạnh** (tối thiểu 2). Máu 100; về 0 là bị loại (KO), vòng sau comment
  lại để vào sân tiếp.
- **Sức mạnh chỉ kiếm bằng chơi**: mỗi tin chat của chính bạn **+1** (tối đa +30 mỗi vòng),
  hạ được 1 mèo **+2**.
- **Thả tim = hồi máu cho mèo của CHÍNH bạn**: +2 HP mỗi lượt (tim được gộp theo nhịp 2 giây,
  trần 100) — đúng mẫu "tim cá nhân" của Đua Vịt. Không có mèo trong sân thì tim không hồi ai.
- **Boss Bug Mập**: mỗi ~3 phút (hoặc nút ở trang điều khiển) boss mèo khổng lồ vào sân, máu
  = **300 + 50 × số mèo đang sống**. Cả phòng xông vào đánh boss (boss quệt lại rất đau).
  Hạ được boss → mọi mèo sống sót **+1 điểm thắng** + mưa cá ăn mừng. Quá 60 giây → boss
  **đập sân**: 3 mèo yếu nhất bị loại, boss về ngủ.
- **Vòng đấu**: còn tối đa 1 mèo người thật (và vòng đã có ≥3 mèo người thật vào sân) là kết
  vòng — mèo thắng +1 điểm, đội vương miện vòng sau. Nghỉ 10 giây hiện bảng xếp hạng to rồi
  tự mở vòng mới. Bảng cả buổi (thắng / hạ gục / hạ boss) luôn ở góc phải trên.
- **Mèo BOT 🤖**: khi ít hơn 4 mèo người thật đang sống, bot vào sưởi sân cho nhộn và **rút
  hết khi đủ 4 người thật**. Bot không bao giờ thắng vòng.
- **Quà**: chỉ được **cảm ơn** + trái tim bay quanh mèo của người tặng. Quà **không** cho máu,
  sức mạnh, sát thương hay bảo vệ — công bằng tuyệt đối, ghi rõ ngay trên sân khấu.

## Trang điều khiển (http://localhost:3027)

Ngoài các nút khung chung (kết nối live, MC đọc câu, tốc độ giọng, buổi mới), mục
**Điều khiển Đấu Trường Mèo** có nút test:

- 🐱 **Gọi Boss Bug Mập** ngay · 🏁 **Kết thúc vòng ngay** · 🎵 tắt/bật + âm lượng nhạc
- 🧪 **Thả 1/5/12 mèo giả lập**, **Chat giả lập** (+5 sức mạnh cho 1 mèo), **Tim giả lập**
  (hồi máu cho mèo giả lập yếu nhất) — chạy thẳng trong engine
- 📡 Giả lập sự kiện live đúng đường TikTok: người lạ comment (thả mèo), chủ mèo thả tim
  (hồi +2 HP), tặng hoa hồng, follow

## Kiểm chứng

```bash
npm run check   # engine: thả mèo, trần sức mạnh chat, tim hồi đúng mèo, công thức va chạm, KO, máu boss, đập sân, kết vòng, bot rút
npm run lint    # tsc --noEmit
npm run build   # vite build
```

Ảnh kiểm chứng sân khấu ở `screenshots/` (trận đấu 8 mèo, sự kiện boss, trang điều khiển).

## File nhị phân (KHÔNG đi qua đường đẩy chữ lên GitHub)

Hai ảnh sau là file nhị phân — khi đẩy repo bằng kênh text, phải **tự chép/push từ Mac**:

- `public/assets/room-bg.png` — tranh màu nước phòng khách trống (nền đấu trường)
- `public/assets/boss-bug.png` — sprite Bug thật tách nền (Boss Bug Mập)

Thiếu ảnh nền thì sân tự rơi về nền kem phẳng; thiếu sprite boss thì boss hiện emoji 🐱 thay thế.

## Nhạc & giọng

- Nhạc nền **gốc tự soạn** trong trang (Web Audio): "Mèo Đấu Sàn" — Dm–F–C–G, 128 BPM,
  marimba nảy + bass pizzicato. Không file nhạc ngoài, không dính bản quyền.
- MC **giọng nữ** (mọi câu engine sinh có tiền tố `F:`), đọc qua `/api/tts` trên trang stage.
