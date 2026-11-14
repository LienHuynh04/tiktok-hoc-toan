# 🚽 Bug Đi WC — Game TikTok LIVE

Bug bị táo bón, ngồi bồn cầu gồng mãi chưa ra. **Cả phòng cùng "rặn" bằng tim:**
mỗi lượt tim cộng chung vào một THANH RẶN 0→100%. Đầy là RA — Bug nhảy sung
sướng xả bồn cầu, người góp lực nhiều nhất là **VUA RẶN 👑**. Quá 3 giây không
tim là tiến độ tụt dần (khóa sàn ở mốc 25/50/75%). Người xem còn **chọc mèo**
được: chọc nhiều là Bug quạu, quạu đầy là **dỗi** — ngừng rặn mà tiến độ vẫn
tụt, cả phòng phải gõ XIN LỖI dỗ dành.

## Chạy trên Mac

```bash
cd bug-di-wc
bash run.sh
```

- Trang điều khiển: http://localhost:3029
- Link cho TikTok LIVE Studio: **http://lvh.me:3029/?view=stage** (1080×1920 dọc)
- ⚠️ Nhạc nền, giọng MC và tiếng mèo chỉ phát sau **1 lần bấm Interact/click vào
  trang stage trong LIVE Studio** ở đầu buổi (luật chặn tự phát tiếng của trình
  duyệt — không có cách lách, bấm 1 lần là xong cả buổi).

## Cách chơi

- ❤️ **Tim = lực rặn chung**: 1 tim = 1 điểm lực. Cấp 1 cần 600 điểm, mỗi cấp
  táo bón nhu cầu ×1,35. Lượt tối đa 4 phút; hết giờ giữ lại 40% tiến độ.
- 💬 Chat (không dấu cũng nhận):
  - **RẶN**: +0,6% ngay, tính combo "N người đang rặn cùng" (5 giây trượt)
  - **NƯỚC**: lực tim ×1,5 trong 10 giây
  - **RAU** / **XƠ**: chặn tụt tiến độ 10 giây
  - **CỐ LÊN**: +0,3% ngay
  - **CHỌC**: +12 độ quạu 😾 (quạu 30+ Bug rung đuôi, 60+ càu nhàu, 80+ xì hơi,
    100 = dỗi 6 giây: ngừng rặn, tiến độ vẫn tụt)
  - **XIN LỖI**: mỗi câu rút 1,5 giây dỗi; hết dỗi Bug +2% adrenaline, quạu về 30
- 💬 Mọi tin chat đều hiện thành **bong bóng thoại cạnh Bug** (tối đa 5, đã lọc
  từ cấm, cắt 40 ký tự) — người xem thấy chính lời mình trên sân khấu.
- 🎉 Mốc 25/50/75%: bồn cầu rung, ống nước rung, Sen ló vào gõ cửa "Xong chưa đấy?!"
- 🎁 **Quà chỉ để cảm ơn**: giấy vệ sinh + tim bay trang trí. Quà KHÔNG cộng
  lực, không tăng tiến độ, không buff — ghi rõ trên sân khấu và trang điều khiển.

## Âm thanh

- MC: giọng **nữ** hài hước như host thật — mỗi sự kiện có ≥5 câu thoại bốc
  ngẫu nhiên, không lặp câu vừa nói.
- Tiếng mèo **tổng hợp bằng Web Audio** (không file ghi âm): meow, tiếng gằn khi
  rặn theo nhịp tim, xì khi quạu, tru dài khi dỗi, trill mừng khi thành công,
  grừ nhàn khi phòng yên. Bật/tắt + âm lượng ở trang điều khiển.
- Nhạc nền gốc "Rặn Đi Bug Ơi" (tuba oom-pah, C–F–G–C, 112 BPM) tổng hợp trong
  trang stage — không file nhạc ngoài, không bản quyền.

## File ảnh (nhị phân — KHÔNG đi theo GitHub dạng chữ, chép từ Mac)

Đặt trong `public/assets/`:

| File | Nội dung |
|---|---|
| `wc-bg.png` | Nền phòng tắm màu nước (góc phòng, sàn gỗ trống ở giữa) |
| `bug-wc.png` | Sprite Bug ngồi bồn cầu đang rặn (đã tách nền, kèm mồ hôi + đường rặn) |
| `bug-relief.png` | Sprite Bug nhảy (dùng lúc thành công) |
| `sen.png` | Sprite Sen (ló vào ở mốc 75%) |

Thiếu ảnh nào game vẫn chạy (nền gradient + emoji dự phòng), chỉ kém đẹp.

## Kiểm chứng

```bash
npm run check   # engine: toán lực, tụt + sàn mốc, buff, mốc, thắng/thua, dỗi, bong bóng chat
npm run lint    # tsc --noEmit
npm run build   # vite build
```

Ảnh kiểm chứng sân khấu ở `screenshots/` (giữa lượt ~55% + buff + combo, khoảnh
khắc thành công, bong bóng chat + độ quạu cao/banner dỗi).
