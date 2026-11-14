# Bug Leo 1000 Bậc — TikTok LIVE game

Cả phòng cùng đẩy Bug (mèo của kênh) leo cầu thang xoắn lên gác mái, nơi có con cá to đang chờ.
Số bậc hiện tại **X / 1000** và **Thắng n / 10** hiển thị thật to trên sân khấu.

## Cách chạy (Mac)

```bash
cd bug-leo-thang
bash run.sh
```

- Trang điều khiển: `http://localhost:3026`
- Trang stage cho TikTok LIVE Studio: `http://lvh.me:3026/?view=stage` (khung 1080×1920)

**Lưu ý tiếng:** nhạc và giọng MC tự bật khi mở stage, nhưng trình duyệt bắt buộc phải có
**1 lần bấm Interact** vào cửa sổ stage trong LIVE Studio thì mới phát tiếng được — không có
cách nào vòng qua quy tắc này của trình duyệt. Sau cú bấm đó, nhạc tự vang và MC đọc bình thường.

## Cách chơi

- Bug **tự leo +1 bậc mỗi 2 giây** — buổi live tự chạy kể cả lúc phòng vắng.
- **Tim** của cả phòng dồn thành năng lượng leo: 1 tim = +1 bậc, xả thành từng đợt.
- Chat **`LEO`** = +3 bậc (mỗi người được gõ 1 lần mỗi 5 giây).
- Chat **`NHẢY`** = vọt +8 bậc, nhưng 25% trượt chân tụt 5 bậc.
- Chat **`ĐẨY`** = dọn cuộn len / dép đang lăn xuống chắn đường.
- Lực kéo xuống **chỉ do máy**: cuộn len lăn (húc trúng −10~25 bậc), dép của Sen (−15 bậc),
  các đoạn **bậc trơn 300–330 · 620–650 · 880–910** (leo chậm một nửa, đoạn trơn rộng dần
  theo độ khó), Bug **ngủ gật** ~2 phút/lần (đứng yên, 10 lệnh `LEO` gọi dậy).
- Đủ **1000 bậc = thắng 1 lượt**: mưa cá vàng, MC nữ xướng tên người đóng góp nhiều nhất
  lượt đó, bậc về 0 và **độ khó +1** (chướng ngại dày hơn, bậc trơn rộng hơn).
- **Thắng 10 lượt = banner ĐỈNH GÁC MÁI**, sau đó thắng về 0 và bắt đầu vòng buổi mới.
- MC là **giọng nữ**. Nhạc nền là bản nhạc gốc soạn bằng Web Audio trong code (C–Am–F–G,
  124 BPM, tiếng gảy dây), không dùng file nhạc ngoài.

## Quà tặng

Quà **chỉ** được cảm ơn bằng lời + confetti tại chỗ Bug. Quà **không** cộng bậc, **không**
mua sức mạnh, **không** ảnh hưởng lượt thắng — luật này ghi rõ ngay trên sân khấu.

## Bộ tư thế của Bug (hoạt họa theo trạng thái)

Bug không còn là một tấm hình trượt: sân khấu đổi ảnh theo trạng thái (máy tư thế
`useBugPose` trong `ClimbStage.tsx`, chỉ ở lớp trình diễn — engine không đổi):

| Trạng thái | Ảnh | Khi nào |
|---|---|---|
| Đứng | `bug.png` | đứng yên / nhún nhẹ khi vừa được đẩy |
| Leo | `bug-climb.png` | bậc vừa tăng trong 700ms — người vươn chéo, lật theo hướng chặng, nhún bước nhanh |
| Nhảy | `bug-jump.png` | lệnh `NHẢY` thành công / bậc vọt đột ngột (~500ms, bay theo cung); bị len/dép húc cũng dùng ảnh này kèm vòng xoay lăn |
| Chạy | `bug-run.png` | xả năng lượng tim nhanh (>15 bậc/giây) |
| Ngủ | `bug-sleep.png` | ngủ gật — cuộn tròn, thở nhẹ (phình 1↔1,03 trong ~2,4s), không nhún |

Đổi tư thế bằng crossfade ~120ms (hai lớp ảnh chồng nhau) nên không "pop" hình; mọi ảnh
tư thế được nạp trước khi stage mở. Kích thước từng tư thế được chuẩn hoá theo chiều dài
thân của tư thế đứng và neo đáy–giữa trên đường leo, nên Bug không phình/thu đột ngột.

## File nhị phân (ảnh) — KHÔNG đi qua được đường push chữ

Các file ảnh dưới đây là file nhị phân; đường đẩy code dạng chữ của Muse **không mang
theo được**. Khi chuyển repo sang máy khác phải **copy / đẩy các file này từ máy Mac**:

- `public/assets/stairs-bg.png` — nền cầu thang vẽ màu nước (4 chặng, cửa gác mái có cá to)
- `public/assets/bug.png` — sprite Bug tư thế đứng (ảnh thật của kênh: mèo xám, vòng cổ hoa xanh)
- `public/assets/bug-climb.png` — Bug tư thế leo (vươn người chéo lên bậc trên)
- `public/assets/bug-jump.png` — Bug tư thế nhảy vọt ngang
- `public/assets/bug-run.png` — Bug tư thế chạy phi nước đại
- `public/assets/bug-sleep.png` — Bug cuộn tròn ngủ

Nếu thiếu ảnh nền, sân khấu vẫn hiện cầu thang vẽ dự phòng; nếu thiếu sprite Bug thì Bug
không hiện hình (thiếu một ảnh tư thế thì riêng trạng thái đó trống hình) — kiểm tra các
file này trước khi live.

## Kiểm chứng

```bash
npm run check   # kiểm chứng engine leo thang (bậc, cooldown, trượt, húc, trơn, ngủ, thắng)
npm run lint    # tsc --noEmit
npm run build   # vite build
```
