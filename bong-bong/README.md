# 🫧 Bong Bóng Avatar — TikTok LIVE game

Người xem **vào phòng hoặc comment bất kỳ** là có một **bong bóng xà phòng mang avatar TikTok của chính họ** nổi lên sân. Bong bóng tự trôi, tự **đụng vào nhau liên tục**. Thả tim làm bong bóng của chính mình to dần; bong bóng to hơn làm **nứt** bong bóng nhỏ hơn khi đụng mạnh — 3 vết nứt là **nổ BỐP!** Người trụ lại cuối vòng là **Vua Bong Bóng**.

## Chạy trên Mac (máy của chủ phòng)

```bash
cd bong-bong
bash run.sh
```

- Trang điều khiển: http://localhost:3028
- Link cho TikTok LIVE Studio: **http://lvh.me:3028/?view=stage** (1080×1920 dọc)

Muốn nghe tiếng/nhạc: bấm **Interact** 1 lần vào cửa sổ stage trong TikTok LIVE Studio (trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng — nhạc và giọng MC đều chờ cú bấm này, không có cách lách). MC là **giọng nữ**.

## Cách chơi

- **Vào phòng / comment** → bong bóng của bạn xuất hiện ở đáy sân và nổi lên (avatar TikTok bên trong; không có avatar thì hiện chữ cái đầu trên đĩa màu theo tên).
- **Thả tim** → bong bóng **của chính bạn** to thêm **+3%** mỗi lượt (engine tự gộp nhịp 1,5 giây); **chat** +1% mỗi tin. Trần **×2,2** cỡ gốc — ai cũng chỉ to bằng tương tác của chính mình.
- **Đụng nhau**: bong bóng to hơn ít nhất **35%** + cú đụng đủ mạnh → bong bóng nhỏ hơn **nứt 1 vết** (hiện đường nứt trên màng). **3 vết nứt → nổ BỐP**: vòng sáng + giọt văng + chữ "BỐP!", người làm nổ **+1 điểm nổ**; chủ bong bóng nổ chờ **8 giây** rồi comment lại để có bong bóng mới. Cỡ ngang nhau thì chỉ nảy ra kèm tia lấp lánh.
- **Bong bóng vàng**: mỗi ~90 giây, 1 bong bóng người thật ngẫu nhiên hoá vàng 15 giây — **không ai làm nứt được**, và nó làm nổ bong bóng khác thì tính **điểm đôi**.
- **Sự kiện máy** (không liên quan tới quà): ~50 giây một cơn **gió quạt** thổi cả đàn bong bóng sang một phía 3 giây; ~2–3 phút **chân Bug** (sprite Bug thật của kênh) trượt vào quệt bong bóng **to nhất** → nứt liền **2 vết**.
- **Vòng chơi**: còn tối đa 1 bong bóng người thật (khi vòng đã có ≥3 người thật) là kết vòng — người trụ lại là **Vua Bong Bóng** (+1 điểm thắng, đội vương miện tới hết vòng sau), confetti, MC đọc tên. Nghỉ 8 giây hiện bảng xếp hạng cả buổi (nhiều điểm nổ nhất / nhiều lần thắng nhất / bong bóng to nhất), rồi tự mở vòng mới.
- **Bong bóng BOT 🤖**: khi ít hơn 4 bong bóng người thật, bot (chữ cái, cỡ vừa) vào sưởi sân và rút dần khi đủ 4 người thật. Bot bị nổ được nhưng **không bao giờ gây nứt trước** và **không bao giờ thắng vòng**.
- **Quà: CHỈ để cảm ơn** — 3 bong bóng tim trang trí bay lên rồi tan. Quà **không** làm bong bóng to thêm, **không** chống nứt, **không** cho điểm. Mọi con số trong game chỉ đến từ tim, chat và va chạm của chính người chơi.

## Trang điều khiển (http://localhost:3028)

- Xem trước sân khấu + trạng thái kết nối + đổi tên kênh + MC đọc thử + độ nhanh giọng đọc.
- **Điều khiển Bong Bóng Avatar** có nút test: thổi gió quạt ngay, chân Bug quệt bong bóng to nhất, bật bong bóng vàng, kết thúc vòng ngay, bật/tắt nhạc + âm lượng; thả 1/5/12 bong bóng giả lập (chạy thẳng trong engine), tim giả lập cho bong bóng giả lập to nhất; giả lập sự kiện live: người lạ vào phòng, comment (có bong bóng mới), chủ bong bóng thả tim (+3%), tặng quà (chỉ cảm ơn + bong bóng tim), follow.
- Nút "Buổi mới từ đầu" xoá hết bong bóng, điểm và vòng.

## File nhị phân (Mac chép tay — không đẩy qua đường chữ)

Hai ảnh PNG trong `public/assets/` là **file nhị phân**, không đi qua được đường push chữ của Muse:

- `public/assets/bubble-bg.png` — nền phòng màu nước có giếng trời (tranh vẽ riêng cho game).
- `public/assets/bug.png` — sprite Bug thật của kênh, dùng cho sự kiện chân Bug quệt.

Trên Mac: giải nén gói ảnh đi kèm vào đúng thư mục `bong-bong/public/assets/` (hoặc `git add` từ máy Mac sau khi nhận file). Thiếu ảnh thì stage vẫn chạy: nền tự rơi về gradient sáng, chân Bug hiện emoji 🐾 thay thế.

## Kỹ thuật

- Engine thuần tất định `src/game/bubbles.ts` (vật lý bước cố định 20ms: nổi cá nhân + bobbing, trôi ngang, nảy tường mềm, va chạm đàn hồi theo khối lượng ∝ r²; tiêm `now`/`rng`) + `bubbles.check.ts` kiểm chứng luật (`npm run check`).
- Trang stage chạy engine và đăng ảnh chụp trạng thái lên server mỗi 400ms; trang điều khiển chỉ vẽ lại ảnh chụp đó. Khung `src/live/` dùng chung với các game khác trong repo (server, SSE, TikTok connector, TTS `M:`/`F:`, nhạc Web Audio). MC nữ: mọi câu đọc đều có tiền tố `F:`.
- Nhạc nền là bản gốc "Bong Bóng Bay" soạn bằng Web Audio trong `src/live/music.ts` (C–G–Am–F, 126 BPM, pluck mềm + tiếng blip bong bóng làm nhịp) — không dùng file nhạc ngoài.
- Cổng **3028** (HMR 24702).
