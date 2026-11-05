# Đại Chiến Boss — game TikTok LIVE cả phòng cùng đánh boss

Một con boss chung cho cả phòng: màn hình liên tục hiện **câu hỏi nhanh**, người xem **gõ đáp án đúng là nhân vật của mình đánh boss 1 đòn**. Không chờ lượt, không hàng chờ — ai vào phòng cũng chơi được ngay trong vài giây. Boss gục thì cả phòng cùng thắng, boss cấp cao hơn xuất hiện.

## Cách chơi

- **Vào chơi:** bình luận bất cứ lúc nào là có mặt trong đội. Đang có câu hỏi thì gõ đáp án là ra đòn ngay.
- **3 loại câu hỏi** (xoay vòng, mỗi câu 12 giây): 🧮 Tính nhanh (cộng/trừ/nhân/chia) · ⌨️ Gõ lại đúng cụm từ trên màn hình (không cần dấu) · 🔢 Đếm nhanh số hình.
- **Sát thương:** đòn cơ bản 10 điểm. Đòn trúng **đầu tiên** của mỗi câu nhân đôi. Trả lời đúng liên tiếp nhiều câu được cộng dồn tối đa +10/đòn; gõ sai làm mất chuỗi. Boss còn dưới 1/3 máu sẽ hóa **cuồng nộ**: mọi đòn nhân 1,5 lần cho nhanh kết thúc.
- **Boss:** 5 con boss tự chế đổi luân phiên (Robot Hám Ăn, Quái Vật Bánh Kem, Rồng Phun Khói Bếp...), máu tăng 1,3 lần mỗi cấp, đổi dạng ở mốc 2/3 và 1/3 máu kèm câu thoại trêu cả phòng.
- **Ăn mừng:** boss gục → xướng tên người tung **đòn kết liễu** và **top 3 bạn đánh khỏe nhất** (MVP), pháo giấy, rồi boss cấp tiếp theo xuất hiện.
- **Thanh Nộ:** đủ 250 tim → **Mưa Sao Băng** trừ 5% máu tối đa của boss. Tim và quà không mua được sát thương — quà chỉ được MC cảm ơn, ai cũng mạnh như nhau, hơn nhau ở gõ nhanh và đúng.

## Giọng đọc & nhạc

- MC nam (M:) qua `/api/tts` (Edge TTS, lỗi thì Google): đọc từng câu hỏi, công bố đáp án + tổng sát thương sau mỗi câu, hô mưa sao băng và ăn mừng khi boss gục.
- Nhạc nền soạn bằng Web Audio ngay trong trang, bật mặc định, tự nhỏ xuống khi MC đọc.
- Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: mở LIVE Studio, bấm **Interact** 1 lần vào cửa sổ stage là cả nhạc lẫn giọng cùng lên.

## Chạy

- macOS: `bash run.sh` · Windows: `BAT-LIVE.bat` — cổng **3014**, link LIVE Studio: `http://lvh.me:3014/?view=stage`
- Trang điều khiển (mở tự động): xem trước sân khấu, nút Đánh thử 1 đòn, tắt/bật nhạc, giả lập sự kiện để test.
- Kiểm chứng engine: `npm run check` (boss.check.ts) · `npm run lint` · `npm run build`

## Cấu trúc

- `src/game/boss.ts` — engine thuần (sinh câu hỏi, tính sát thương, cấp boss, mưa sao băng), kiểm chứng độc lập được.
- `src/game/useBoss.ts` — nối engine với sự kiện live + giọng đọc + nhạc.
- `src/game/BossStage.tsx` / `BossControls.tsx` — sân khấu đấu boss + trang điều khiển.
- `src/game/config.ts` — mọi con số của game (máu boss, sát thương, mốc tim...).
- `src/live/` — khung dùng chung với các game khác trong repo (server, SSE, giọng đọc, nhạc).
