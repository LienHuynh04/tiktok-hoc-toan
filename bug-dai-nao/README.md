# 🐱 Bug Đại Náo Nhà Sen — TikTok LIVE game

Cả phòng chat **cùng lái MỘT con mèo Bug** phá nhà, đấu với **Sen (AI)** đuổi bắt liên tục.
Không sảnh chờ, không lượt đợi: vào phòng là chơi ngay. Tiến trình tính **cả buổi live**,
không reset theo chương.

## Cách chơi

- **Gõ lệnh 1 từ trong chat** để lái Bug (không cần dấu): `CHẠY` `NHẢY` `ĐẨY` `LEO` `ĐU` `NÉ` `GIẢ NGỦ` `ĂN VẠ`.
- Lệnh **theo ngữ cảnh**: chỉ ăn khi Bug ở đúng chỗ (ĐẨY cạnh đồ dễ vỡ, LEO ở rèm, ĐU trên đèn chùm…).
  Gõ sai lúc thì Bug diễn trò hề — **không phạt gì cả**.
- **Danh sách phá**: 10 nhiệm vụ/vòng danh sách hiện trên HUD. Phá xong 1 món là tích ✓,
  hiện tên người gõ lệnh quyết định, nối nhiệm vụ tiếp theo ngay.
- **Chiêu lớn cần combo**: đu đèn / phá sofa cần nhiều người gõ cùng lệnh trong 5 giây
  (số người cần tăng theo lượng người đang chat, tối thiểu 3, tối đa 30).
- **Vote ngã rẽ**: mỗi ~2–3 phút Bug gặp 2 lựa chọn (vd LEO RÈM hay CHUI HỘP) — phòng vote 10 giây, đa số thắng.
- **Sen AI** đuổi theo Bug không ngừng; tốc độ Sen tăng theo thời gian buổi live và theo số người đang chat.
  Bắt trúng: còn **độ LÌ** thì Bug né đẹp (trừ 1 LÌ), hết LÌ thì bị bắt. Bị bắt 3 lần = Sen thắng chương;
  phá hết danh sách trước = phòng thắng chương. Chương mới mở ngay, **tiến trình giữ nguyên**.
- **Độ mập (trục nền cả buổi)**: tim của cả phòng dồn chung nuôi Bug từ 3,2 kg → 9,0 kg qua 5 cấp.
  Lên cấp = mưa cá + rung màn hình theo cân nặng + MC loan báo. Mập lên thì phá khoẻ hơn
  (combo nhẹ yêu cầu hơn) nhưng chạy chậm hơn. Mỗi 500 tim dồn chung, Bug lên cơn **ZOOMIES** chạy khắp nhà, Sen bắt không kịp.
- **Quà tặng**: chỉ để cảm ơn bằng icon tim/confetti — **không cộng điểm, không tăng tốc,
  không mua được sức mạnh hay miễn bắt**. Luật này ghi rõ ngay trên HUD.

Giọng MC là **giọng nữ** (tiền tố `F:` của framework). Nhạc nền là bản nhạc **tự sáng tác riêng**
cho game này (hợp âm C–G–Am–F, 116 BPM, marimba + pizzicato), tổng hợp ngay trong trang.

## Hình ảnh: tranh thật + bộ tư thế (từ 2026-11-14)

Sân khấu dùng **ảnh thật của kênh** thay cho hình vẽ SVG phẳng (SVG cũ giữ làm dự phòng):

- **Nền**: tranh màu nước phòng khách (`public/assets/room-bg.png`) phủ toàn sân khấu —
  kệ sách trái, đèn chùm giữa trên, bàn + cốc giữa, sofa dưới trái, chậu cây, rèm hồng phải,
  hộp carton, robot hút bụi đều là vật trong tranh.
- **Warp toạ độ** (`src/game/stageArt.ts`): engine vẫn chạy ở toạ độ phòng cũ; lớp trình diễn
  nội suy Shepard qua 11 điểm neo zone (đo trên tranh) để Bug đứng đúng lên từng vật.
  Sen luôn được kẹp chân xuống đường sàn của tranh (người thì đứng trên sàn, chỉ mèo mới leo trèo).
  Nhiệm vụ hiện tại có **vòng sáng vàng nhấp nháy** ở vật mục tiêu trong tranh.
- **Bug — máy tư thế** theo trạng thái engine: chạy/di chuyển = `bug-run` · leo rèm/kệ = `bug-climb` ·
  đu đèn chùm = `bug-hang` (bám đúng tâm đèn, lắc ±3°) · nhảy/né = `bug-jump` · giả ngủ = `bug-sleep` ·
  ăn vạ = sprite đứng lật nghiêng · còn lại = `bug-sprite` đứng. Đổi tư thế mờ chéo ~150ms;
  kích thước vẫn phình theo cấp mập như cũ. Chui hộp: lớp `box-front.png` (cắt từ chính tranh)
  phủ lên để Bug chìm vào trong hộp thật.
- **Sen**: đuổi = `sen-run`, đứng/choáng/chờ = `sen-sprite`.
- **Dự phòng**: file ảnh nào lỗi tải (404) thì nhân vật đó tự rơi về hình SVG cũ (`src/game/art.ts`);
  mất cả tranh nền thì cả phòng quay về bản SVG cũ — game không bao giờ gãy vì thiếu ảnh.

> ⚠️ **File nhị phân KHÔNG đi qua đường push chữ GitHub.** Các file trong `public/assets/`
> (room-bg.png, box-front.png, bug-*.png, sen-*.png — tổng ~11 MB) phải **chép/đẩy từ máy Mac**
> giống tiền lệ bug-2d-kit: khi pull code về Mac mà thiếu ảnh, tự chép từ thư mục
> `game-mockups/sprites/` + `arena-meo/public/assets/room-bg.png` (bản gốc) vào
> `bug-dai-nao/public/assets/`, riêng `box-front.png` là ảnh cắt từ room-bg (paint px 612,1750–852,1872).

## Chạy trên Mac

```bash
cd bug-dai-nao
bash run.sh
```

- Trang điều khiển: http://localhost:3025/
- Link cho LIVE Studio (stage 1080×1920): **http://lvh.me:3025/?view=stage**
- Lần đầu mở stage trong LIVE Studio phải **bấm Interact 1 lần** trong cửa sổ nguồn
  để trình duyệt mở khoá nhạc và giọng đọc — đây là luật autoplay của trình duyệt,
  không có cách lách; sau cú bấm đó nhạc/giọng tự chạy cả buổi.

## Panel TEST (trang điều khiển)

- Giả lập từng lệnh như chat thật, giả lập tim (+120 / lên cấp / ZOOMIES), quà, follow.
- Giả lập số người xem (0/5/15/30) để test độ khó Sen + ngưỡng combo.
- Nút mở vote ngay, nút demo phá 1 nhiệm vụ, bật/tắt nhạc + âm lượng.

## Kiểm chứng (dev)

```bash
npm run check   # kiểm chứng engine thuần: lệnh đúng/sai ngữ cảnh, combo, vote, né LÌ, lên cân, tốc độ Sen
npm run lint    # tsc --noEmit
npm run build   # vite build
```

Ảnh chụp stage kiểm chứng nằm trong thư mục `screenshots/`.
