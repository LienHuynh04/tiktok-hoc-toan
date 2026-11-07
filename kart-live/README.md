# Đua Xe Kart Live — game đua xe 3D cho TikTok LIVE, mỗi người xem là 1 tay đua

Người xem bình luận bất cứ chữ gì là nhận ngay **1 chiếc kart 3D mang tên mình** (màu xe chọn theo tài khoản). Tất cả cùng đua trên đường đua ven biển–sa mạc dài **1200m** dựng bằng Three.js: cát, biển, cọ, nhà bãi biển, hải đăng, cổng xuất phát/về đích. Ai cán đích trước là vô địch chặng, được lên bục vinh quang và tính điểm vào bảng **Vua Đường Đua**.

## Cách chơi

- **Nhận xe:** bình luận / follow / vào phòng là có xe. Đang giữa chặng vẫn vào đua được (xuất phát sau đoàn cuối 25m). Tối đa 24 xe một chặng.
- **Lái bằng bình luận:** gõ **TRÁI** / **PHẢI** để đổi làn (khóa nhịp 900ms), né **thùng dầu** và **vũng nhớt** (đâm phải là chậm còn nửa tốc độ 2 giây, có khiên thì khiên đỡ), cán **đệm phát sáng** để bốc tốc nhẹ + nạp nitro. Né chướng ngại thành công cũng được cộng nitro.
- **Thanh nitro:** tự đầy dần khi lái + cán đệm + né đẹp + thả tim. Đầy thanh (100) thì chọn 1 kỹ năng, tốn trọn thanh:
  - **NITRO** — bốc tốc x1,45 trong 3 giây.
  - **ĐẠN** — làm chậm xe ngay phía trước (trong 45m) còn x0,55 trong 1,6 giây; khiên của đối thủ đỡ được.
  - **KHIÊN** — dựng khiên 6 giây, chặn 1 đòn (đạn hoặc chướng ngại).
- **Thả tim (theo đặc tả):** xe của **người thả** tăng tốc nhẹ (x1,15 trong 1 giây) và được nạp nitro (0,8 điểm/tim, ~125 tim là đầy thanh).
- **Tặng quà (theo đặc tả):** quà nhỏ (<30 xu) — xe người tặng **bốc tốc 2,5 giây**; quà từ 30 xu — **bốc tốc 4 giây + làm chậm xe ngay phía trước**; quà VIP (từ 100 xu) — **SIÊU TỐC x1,6 trong 5 giây + nạp đầy nitro** + hào quang vinh danh quanh xe. Mọi quà đều lên bảng **Người Ủng Hộ**.
- Cân bằng: xe tụt sau đoàn đầu trên 80m được cộng dần tối đa +9% tốc độ (cao su kéo đoàn) nên cuộc đua luôn sát nút; hệ số tăng tốc lấy mức cao nhất, không cộng dồn.

## Chạy game

```bash
bash run.sh        # cổng 3019 — trang điều khiển tự mở ở http://localhost:3019
```

- **Trang stage cho TikTok LIVE Studio:** `http://lvh.me:3019/?view=stage` (khung 1080×1920).
- Mở live xong bấm **Interact 1 lần** vào cửa sổ stage trong LIVE Studio để mở khóa nhạc + giọng MC (trình duyệt chặn tự phát tiếng trước tương tác đầu tiên).
- Trang điều khiển có nút **Đua thử ngay (7 bot)** và **Xuất phát ngay** để kiểm tra không cần live thật, kèm giả lập sự kiện (bình luận/tim/quà) ở panel test của Dashboard.

## Công nghệ

- **Engine:** `src/game/kart.ts` — phòng đua thuần TypeScript (trạng thái + luật chơi), kiểm chứng bằng `npm run check`.
- **Cảnh 3D:** `src/game/kartScene.ts` — Three.js, xe/cảnh dựng từ hình học cơ bản + texture vẽ trên canvas (không tài nguyên ngoài, repo chỉ đẩy file chữ), vị trí xe nội suy từ engine để chuyển động mượt.
- **Khung live chung:** `src/live/` — kết nối TikTokLive, giọng MC tổng hợp (Edge TTS, `M:` = nam), nhạc đường đua 132 BPM soạn bằng Web Audio, trang điều khiển + ảnh chụp trạng thái cho xem trước.
- Lệnh: `npm run dev` (chạy server), `npm run build`, `npm run lint`, `npm run check`.
