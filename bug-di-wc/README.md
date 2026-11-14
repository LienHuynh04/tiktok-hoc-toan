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

## 🐱 Bug SỐNG — tâm trạng, bộ tư thế, chuyển động vi mô

Bug không còn là một tấm hình rung rung nữa: nó có **tâm trạng (mood)** suy từ
diễn biến phòng, **bộ 9 tư thế** đổi qua lại (crossfade 120ms) và một lớp
**chuyển động vi mô** chạy liên tục (thở phồng xẹp, giật tai/đuôi ngẫu nhiên,
chớp mắt, liếc sang đọc bong bóng chat mới nhất).

| Mood | Khi nào | Tư thế |
|---|---|---|
| focused | rặn bình thường | `bug-wc.png` (rặn) |
| pumped | nhịp tim ≥ 8/giây | gồng tối đa + lắc thân |
| annoyed / furious | độ quạu 30–79 / 80–99 | `bug-wc-face-annoyed.png` — **mặt liếc xéo deadpan** (furious thêm rung mạnh + tiếng xì) |
| sulking | quạu 100, đang dỗi | `bug-wc-sulk.png` — **quay lưng thật**, dấu 💢 và hơi xì vẽ sẵn trong hình |
| sleepy | lượt đang chạy mà 20 giây không tim + không chat | `bug-wc-face-sleepy.png` — **mặt buồn ngủ** tai rũ, bong bóng nước dãi, gật gù nhẹ + chữ Z bay, tiếng **ngáy**; tim/chat đầu tiên làm Bug **giật mình tỉnh dậy** |
| bliss | thắng / nghỉ giữa lượt | thắng: ngồi phè phỡn `bug-wc-relief-sit.png` 1,2 giây đầu rồi mới nhảy `bug-relief.png`; giờ nghỉ: ngồi phè phỡn |

Tư thế **gồng tối đa** `bug-wc-max.png` (má phồng to, gân trán, bệ xí cong) bật
khi: nhịp tim dải cao nhất, **hoặc** tiến độ ≥ 90%, **hoặc** combo RẶN ≥ 8 người
cùng lúc. Đang ngủ gật/dỗi thì Bug đứng yên (hết rung), thở chậm và nông.

**Khuôn mặt theo tương tác** (giữ **mặt rặn gốc** làm nền — các mặt khác chỉ là
phản ứng ngắn theo sự kiện của người xem):

- **Mặt vui toe toét** `bug-wc-face-happy.png` (beat 1,2 giây): khi có **quà**
  (kèm lời cảm ơn — quà vẫn không tác dụng gameplay) và khi **combo RẶN chạm
  5 / 10 người** khác nhau.
- **Mặt ngạc nhiên** `bug-wc-face-surprised.png` mắt tròn miệng O, hai chân giơ
  lên, vệt sao bên cạnh (beat 0,8 giây): khi **chạm mốc 25/50/75%** (mốc 75 cũng
  là lúc Sen ló vào) và trong **khoảnh khắc giật mình tỉnh dậy** — sau đó Bug về
  lại mặt rặn (bong bóng "Hả?! Đang rặn đây…" + meow lớn vẫn giữ).
- Face beat thắng pose theo mood, nhưng **không bao giờ đè** lúc Bug đang dỗi
  hay đang ăn mừng.

Ghi chú chân sân khấu xoay vòng ~6 giây/ghi chú (~24 giây/vòng) — trong đó có
câu xin follow mà chủ kênh duyệt riêng cho game này (2026-11-14); MC cũng đọc
câu đó thưa trong giờ nghỉ giữa lượt (tối đa 1 lần mỗi giờ nghỉ). Đây là ngoại
lệ duy nhất của game này so với luật không kêu gọi trên sóng.

## Âm thanh

- MC: giọng **nữ** hài hước như host thật — mỗi sự kiện có ≥5 câu thoại bốc
  ngẫu nhiên, không lặp câu vừa nói. Giờ nghỉ giữa lượt MC nói 1 câu trong pool
  nghỉ (có câu follow ở tần suất thưa).
- Tiếng mèo **tổng hợp bằng Web Audio** (không file ghi âm): meow, tiếng gằn khi
  rặn theo nhịp tim, xì khi quạu, tru dài khi dỗi, trill mừng khi thành công,
  grừ nhàn khi phòng yên, **ngáy khò khò khi Bug ngủ gật**. Bật/tắt + âm lượng
  ở trang điều khiển.
- Nhạc nền gốc "Rặn Đi Bug Ơi" (tuba oom-pah, C–F–G–C, 112 BPM) tổng hợp trong
  trang stage — không file nhạc ngoài, không bản quyền.

## File ảnh (nhị phân — KHÔNG đi theo GitHub dạng chữ, chép từ Mac)

Đặt trong `public/assets/`:

| File | Nội dung |
|---|---|
| `wc-bg.png` | Nền phòng tắm màu nước (góc phòng, sàn gỗ trống ở giữa) |
| `bug-wc.png` | Sprite Bug ngồi bồn cầu đang rặn (đã tách nền, kèm mồ hôi + đường rặn) |
| `bug-wc-max.png` | Sprite Bug GỒNG TỐI ĐA (má phồng, gân trán, bệ xí cong — đã tách nền) |
| `bug-wc-sulk.png` | Sprite Bug DỖI quay lưng thật (dấu 💢 + hơi xì vẽ sẵn — đã tách nền) |
| `bug-wc-relief-sit.png` | Sprite Bug ngồi phè phỡn xoa bụng + giơ ngón cái (đã tách nền, kèm sao lấp lánh) |
| `bug-relief.png` | Sprite Bug nhảy (dùng lúc thành công, sau 1,2s ngồi phè phỡn) |
| `sen.png` | Sprite Sen (ló vào ở mốc 75%) |
| `bug-wc-face-happy.png` | Mặt VUI toe toét (beat khi có quà / combo RẶN 5 và 10 người — đã tách nền) |
| `bug-wc-face-surprised.png` | Mặt NGẠC NHIÊN mắt tròn miệng O + vệt sao (beat khi chạm mốc / tỉnh dậy — đã tách nền) |
| `bug-wc-face-annoyed.png` | Mặt QUẠU liếc xéo deadpan (mood quạu 30+ — đã tách nền) |
| `bug-wc-face-sleepy.png` | Mặt BUỒN NGỦ tai rũ + bong bóng nước dãi (mood ngủ gật — đã tách nền) |

Thiếu ảnh nào game vẫn chạy (nền gradient + emoji dự phòng; thiếu ảnh pose thì
tự lùi về pose rặn thường), chỉ kém đẹp.

## Kiểm chứng

```bash
npm run check   # engine: toán lực, tụt + sàn mốc, buff, mốc, thắng/thua, dỗi, bong bóng chat
npm run lint    # tsc --noEmit
npm run build   # vite build
```

Ảnh kiểm chứng sân khấu ở `screenshots/` (giữa lượt ~55% + buff + combo, khoảnh
khắc thành công, bong bóng chat + độ quạu cao/banner dỗi, gồng tối đa, dỗi quay
lưng, ngủ gật + Zzz, giật mình tỉnh dậy, nhịp thắng ngồi phè phỡn → nhảy, mặt
quạu liếc xéo, mặt vui toe toét, mặt ngạc nhiên).
