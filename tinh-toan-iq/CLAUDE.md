# Tính Toán IQ Cao — ghi chú cho Muse

Game TikTok LIVE tính nhẩm đua tốc độ, chung khung kỹ thuật với Lớp Toán / Phòng Tarot (cùng repo tiktok-hoc-toan), cổng riêng **3009**.

- Engine thuần thời gian: `IQGame` (src/game/iq.ts), pha idle → ask (15s, đủ 3 đúng là chốt sớm) → reveal (7s) → board (8s, sau mỗi 5 câu) → ask...
- Câu hỏi TỰ SINH ở `makeQuestion` (7 dạng, đáp án luôn là số nguyên không âm dạng chuỗi; riêng So sánh nhanh đáp án là "1"/"2"). Bất biến để iq.check.ts kiểm chứng độc lập được: prompt luôn chứa đủ dữ kiện để tính lại đáp án (biểu thức / dãy số / hai vế so sánh).
- Điểm: đúng nhanh nhất 100, nhì 70, ba 50; sai mất chuỗi; chuỗi đúng mỗi 3 câu +30. Người đã đúng không trả lời lại cùng câu; sai trước rồi đúng trong cùng câu thì chuỗi tính là 1.
- MC giọng nam: mọi câu đọc bắt đầu "M: " (xem live/voice.ts). Câu chính (main) làm đồng hồ đứng lại trong lúc đọc (hold), giữ nguyên cơ chế của khung.
- Quà/tim chỉ cảm ơn, KHÔNG ảnh hưởng điểm (tránh cơ chế đổi quà lấy lợi thế trong game).
- Sân khấu chỉ hiện đáp án ở pha reveal; `view.answer` luôn có sẵn cho trang điều khiển giả lập — đừng "sửa" thành ẩn.
- Sửa iq.ts là PHẢI chạy `npm run check` + `npm run lint` + `npm run build`.
