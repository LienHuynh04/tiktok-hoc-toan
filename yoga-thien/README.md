# Phòng Yoga Thiền — game TikTok LIVE tập yoga & thiền cùng khán giả

Cả lớp yoga trên sóng live: huấn luyện viên đứng lớp, người xem **gõ tên tư thế là cả lớp tập theo tư thế đó**, kèm **nhạc thiền** êm dịu dễ ngủ.

## Cách chơi

- Người xem bình luận tên tư thế (không cần dấu): **HOA SEN · CÂY · CHIẾN BINH · CHÓ ÚP · RẮN · EM BÉ · CẦU · TAM GIÁC · THƯ GIÃN**. Lớp đang tự tập thì vào thẳng tư thế được gọi; đang tập theo yêu cầu thì xếp vào lịch chờ (tối đa 5).
- Mỗi tư thế giữ **24 giây**: giọng cô giáo đọc cách vào thế + lợi ích, giữa tư thế nhắc nhịp thở. Trên sân khấu có vòng tròn nhịp thở 4 giây hít vào — 4 giây thở ra để cả lớp thở theo.
- Ai bình luận/follow cũng được nhận **một tấm thảm** trong lớp (hiện avatar + tên dưới sân khấu); người gọi được nhiều tư thế nhất lên bảng "Bạn đồng hành".
- Không ai gọi bài: lớp tự chảy theo chuỗi nhẹ nhàng Hoa Sen → Cái Cây → Chiến Binh II → Tam Giác → Chó Úp Mặt → Nhân Sư → Cây Cầu → Em Bé → Thư Giãn.
- **100 tim = mưa cánh hoa sen**. Quà chỉ được cảm ơn, không đổi được lịch tập (không kêu gọi quà).

## 9 tư thế (tên Việt + Sanskrit chuẩn)

| Lệnh gõ | Tư thế | Sanskrit | Lợi ích |
| --- | --- | --- | --- |
| HOA SEN / THIỀN | Hoa Sen | Padmasana | Thiền định, hơi thở sâu |
| CÂY | Cái Cây | Vrksasana | Thăng bằng, tập trung |
| CHIẾN BINH | Chiến Binh II | Virabhadrasana II | Chân vai khoẻ, mở ngực |
| CHÓ ÚP | Chó Úp Mặt | Adho Mukha Svanasana | Kéo giãn cột sống |
| RẮN / NHÂN SƯ | Rắn Hổ Mang (Nhân Sư) | Salamba Bhujangasana | Êm lưng dưới, mở ngực |
| EM BÉ | Em Bé | Balasana | Nghỉ ngơi, thả lỏng lưng |
| CẦU | Cây Cầu | Setu Bandhasana | Săn mông đùi, êm lưng |
| TAM GIÁC | Tam Giác | Trikonasana | Kéo giãn eo sườn |
| THƯ GIÃN | Thư Giãn | Savasana | Phục hồi, dễ ngủ |

Hình huấn luyện viên là bộ ảnh minh hoạ phẳng vẽ bằng AI (9 tư thế trong 1 lưới 3x3, đã tách nền, nhúng base64 trong `src/game/poseArt.ts`) nên repo toàn file chữ. Ô "Rắn Hổ Mang" trong ảnh là biến thể Nhân Sư (chống khuỷu tay) nên game đặt đúng tên này.

## Nhạc thiền

Nhạc được **soạn trực tiếp bằng Web Audio** trong trang stage (`src/live/music.ts`): đệm hợp âm Cmaj7 – Am7 – Fmaj7 – G6 chồng lớp + tiếng chuông điểm theo thang ngũ cung, âm lượng rất nhỏ. Không dùng file nhạc ngoài → không lo bản quyền. Bật/tắt ở trang điều khiển.

Lưu ý: trình duyệt bắt buộc có **1 lần chạm đầu tiên** mới cho phát tiếng (cả giọng đọc lẫn nhạc). Vào live mà chưa nghe gì: bấm **Interact** trong TikTok LIVE Studio rồi nhấp 1 cái vào khung sân khấu — sau đó nhạc và giọng tự chạy, máy cũng tự thử mở lại liên tục.

## Chạy trên Mac

```bash
cd yoga-thien
bash run.sh
```

- Trang điều khiển: http://localhost:3011
- Link cho TikTok LIVE Studio: http://lvh.me:3011/?view=stage (1080×1920), cổng **3011**.

## Kiểm chứng

```bash
npm run check   # yoga.check.ts: nhận diện tư thế + luồng engine
npm run build
```
