# Lớp Toán: ghi chú cho Claude

> File này mô tả RIÊNG game này. Game chuyển thể từ Lớp Học Chữ
> (https://github.com/workaipvlinh-byte/lop-hoc-chu) ngày 2026-11-04 theo yêu cầu chủ kênh:
> clone source về rồi đổi thành Lớp Toán. Khung lớp học giữ nguyên, môn học đổi hẳn sang toán.

## Ý tưởng

Lớp học 2D cho TikTok LIVE. Cô giáo áo dài ra phép tính trên bảng đen, người xem gõ đáp án số vào bình luận. Ai đúng nhanh nhất được nhiều điểm nhất, điểm cao ngồi bàn đầu.

## Luật chơi

- Comment bất kỳ là vào lớp (có tên trên đầu học sinh). Gõ `vào lớp` thì cô chào.
- Từ 2026-11-07 game là LỚP HỌC ĐA MÔN (chủ kênh chốt): mỗi tiết 20 câu theo `GAME.roundPlan` (config.ts) = 7 `math` + 2 `geo` + 11 câu chữ (token `easy`/`medium`/`hard`) bốc từ ngân hàng `src/game/cau-hoi/*.txt` gồm 6 môn: Tiếng Anh, Ngữ Văn, Địa Lí, Đoán Chữ, Nối Từ, Câu Đố (mỗi môn 30 câu, định dạng parseBank `đáp án|gợi ý|mức|đáp án phụ`). pickOne tự tránh lặp môn liền nhau, tối đa ~2 câu/môn/tiết; bảng hiện nhãn môn qua `view.category` (GameStage đã có sẵn). Phần toán giữ nguyên: lớp của câu toán bốc theo TỈ LỆ (rollQuestionBand: 20% KHÓ / 50% lớp 1-9 / 30% lớp 10-12), hình học minGrade 9 có `math.fig`, cô tự chọn dạng Lớp 12 rải 5 câu/tiết cho phần toán. Mỗi câu 15 giây; hết giờ chưa ai đúng: thêm 10 giây (pha bonus). Tên lớp mặc định đổi thành "Lớp Học". Chấm câu chữ: phải gõ ĐỦ DẤU (requireDiacritics) và đúng độ dài mới tính là một lượt trả lời (isAttempt) — đáp án ngân hàng luôn ngắn 1-3 từ.
- Cô đọc: "Câu 3. Câu toán nhẩm. 36 cộng 47 bằng mấy?" (toán đố / hình học: cô đọc cả bài toán bằng lời, bảng hiện đề + phép tính tóm tắt).
- Sau mỗi tiết là giờ ra chơi 1 phút, bốc 1 trong 5 trò (không lặp trò vừa chơi): oẳn tù tì (+2), kiểm tra miệng bằng CÂU TOÁN gọi 1 bạn đang ngồi (+5), chọn phe (vui, không điểm), điểm danh "có mặt" (10 bạn đầu +3), thả tim 300 trong 30 giây (+1 cả lớp). Xong trò thì hiện "Học sinh giỏi hôm nay".
- Sau giờ ra chơi: cả lớp bình chọn DẠNG TOÁN tiết sau (gõ 1 hoặc 2, 15 giây). Dạng thắng (`GAME.mathTopics`) chiếm 5 câu của tiết sau, rải cách 1 câu trong `pickRound`.
- Xếp hạng 3 tầng: điểm tiết (xếp ghế, xoá mỗi tiết) · điểm buổi (👑 lớp trưởng, ⭐ lớp phó) · bảng vàng tuần (lưu file `data/so-lop.json`, tự xoá khi sang tuần mới).
- Comment dài đúng bằng đáp án (không tính khoảng trắng) mới tính là trả lời; nói chuyện thường không bị tính sai. Mỗi người chỉ tính lần trả lời đầu tiên của câu đó. Đáp án là số nên không xét dấu tiếng Việt.
- Điểm theo thứ tự đúng, xếp theo giờ TikTok gắn lúc gửi (`createTime`), không theo lúc bot nhận: 10 / 7 / 5 / hạng 4–10 được 3 / sau đó 1. Đúng 3 câu liền +5.
- Quà: luôn là "tặng hoa cô" (cô cầm hoa, cảm ơn). Quà từ 30 xu lúc chưa ai đúng: cô cho thêm 10 giây (mỗi câu tối đa 1 lần, chống combo cộng giờ vô hạn). Quà không cộng điểm.
- Ý muốn của người xem (bảng trong LIVE Studio, chủ kênh tự bật): Hoa hồng 1 xu = "Tham gia vào lớp học" (cô chào mừng vào lớp), Cử chỉ thả tim 5 xu = "Lên bàn đầu" (ngồi ghế đầu + huy hiệu ⭐ BÀN ĐẦU + cả lớp vỗ tay, chỉ trong 1 tiết), Cỏ bốn lá 10 xu = "Lên Bảng May Mắn" (ghim tên góc dưới phải sân khấu, tối đa 6 tên, giữ cả buổi). Nhận diện bằng `wishKind(tên quà, giá 1 món)` trong quiz.ts, khớp tên Anh/Việt. Cả 3 chỉ VINH DANH: không điểm, không gợi ý, không miễn phạt. Trang điều khiển có 3 nút thử phát quà giả đúng tên/giá này. Sân khấu tự vẽ thanh Ý MUỐN nằm ngang dưới đáy (3 món + giá + số lần đã thực hiện `wishCounts`, đếm trong engine) vì panel gốc của TikTok nằm góc trên phải ngoài tầm kiểm soát; Bảng May Mắn dời lên trên thanh này (bottom 112px) để không chồng.
- 300 tim: cả lớp vỗ tay.

## Khác bản chữ (điểm dễ làm sai khi sửa code)

- KHÔNG còn bộ câu hỏi chữ: `src/game/cau-hoi/` đã xoá, `bank.ts` trả bank rỗng. Đừng thêm lại file .txt; thêm dạng toán thì sửa `math.ts`.
- Câu toán tự sinh nên KHÔNG ghi sổ lớp (`usedLog` luôn rỗng), không có khái niệm hỏi lại / ôn câu cũ. Tiết "ôn bài" lúc lớp vắng chỉ là nhãn + lời cô, câu vẫn sinh mới.
- Nút "Bỏ câu này" với câu toán = bỏ qua sang câu tiếp, không ghi `banLog`. Trang báo cáo mục câu đã bỏ luôn trống là đúng.
- `engageTick` (rủ gõ số 1, bình chọn vui, kể chuyện lúc chờ) KHÔNG chạy lúc đang hỏi vì mọi câu đều là toán, gõ số / 1 chữ dễ lẫn đáp án. Đây là chủ đích, không phải bug.
- Cổng riêng **3007** (bản chữ 3006), kênh HMR dev 24684 (bản chữ 24682). Link LIVE Studio: http://lvh.me:3007/?view=stage.

## File

- `src/game/quiz.ts`: lõi game (pha, chấm điểm, chỗ ngồi). Test: `npx tsx src/game/quiz.check.ts`.
- `src/game/math.ts`: bộ sinh câu toán Lớp 1-12 + Hình học. Bất biến: `math.show` luôn là biểu thức tính ra đáp án, hoặc phương trình / dãy số chứa `?` thay đáp án vào thì đúng — để `npx tsx src/game/math.check.ts` kiểm chứng ĐỘC LẬP bằng máy tính riêng (7.800 câu mẫu). Sửa math.ts là PHẢI chạy lại cả hai file check + `npm run lint` + `npm run build`.
- `src/game/loi-thoai.ts`: toàn bộ lời cô (bốc kiểu xáo bài nên ít lặp). Nhóm riêng của toán: `mathIntro`, `mathBonus`, `mathReveal`, `mathNobody`, `mathWrong`, `mathGiftHint`. Luật cứng từ bản chữ: mỗi nhóm ít nhất 2 câu, không trùng câu, KHÔNG dùng gạch ngang dài (—, –) trong lời thoại (quiz.check bắt lỗi).
- `src/game/config.ts`: số liệu + `roundPlan` + `mathTopics`.
- `src/game/sfx.ts`: hiệu ứng âm thanh tự tạo. Bỏ file mp3 cùng tên vào `public/assets/sfx/` là dùng file thay.
- Trang báo cáo sau buổi live: http://localhost:3007/bao-cao (nút 📊 ở trang điều khiển). File `data/bao-cao/<ngày>.json`. Ở Lớp Toán, danh sách câu khó / quá dễ tính trên MỌI câu (bản chữ từng lọc bỏ "Toán nhẩm", bản này đã bỏ bộ lọc đó trong server.ts).
- Chạy thử không đụng sổ lớp thật: đặt biến `DATA_DIR` sang thư mục khác.
- `src/game/GameStage.tsx`: màn hình. Toạ độ bàn đo trên ảnh nền gốc 941x1672 (`ROWS`). Bảng hiện đề chữ nhỏ cho các dạng Toán đố / Dãy số / Hình học / Tìm số thiếu (người xem đọc được đề, không chỉ nghe giọng).
- `src/game/GameControls.tsx`: nút thử ở trang điều khiển, có "1000 người cùng đoán" để đo bot nhận đủ comment không.
- `tools/tach-nen.py`: tách nền xám ảnh trong `nhan-vat/` ra `public/assets/nv/`. Thay ảnh thì chạy lại.
- Trang stage chạy game thật và gửi ảnh chụp trạng thái lên `/api/game/state`; trang điều khiển chỉ vẽ lại ảnh chụp đó.
- `?view=stage&mute=1`: xem stage không phát tiếng (để thử).

## Quyết định / ghi chú giữ từ bản chữ

- 20 giây mỗi câu, luôn chạy đủ giờ ở phòng đông (`endAfterFirstSec: 0`); phòng dưới 5 bạn đang chơi thì có người đúng là 8 giây sau chốt câu.
- Tên lớp đổi được ở ô "Tên lớp" trang điều khiển (mặc định "Lớp Học", trước 2026-11-07 là "Lớp Toán").
- Cô gọi học sinh là "bạn nhỏ" / "các bạn nhỏ", không dùng em, con, mấy đứa.
- Đọc đề xong cô hô "bắt đầu" (nhóm `go`), hô xong mới hiện phép tính và đếm giờ. Còn 5 giây cô nhắc "chuẩn bị hết giờ" (không dừng đồng hồ).
- Cứ 5 câu (sau câu 5, 10, 15) cô dừng lại điểm danh 3 bạn nhỏ điểm cao nhất, tặng quà, chờ thêm 8 giây rồi mới ra câu tiếp.
- Quà cô thưởng bay từ tay cô xuống bàn bạn nhỏ, tối đa 4 món/bàn, xoá khi sang tiết mới.
- Chuyên cần, sinh nhật, bảng "Học sinh xuất sắc hôm nay", chào theo giờ, treo live tự nối lại: giữ nguyên như bản chữ.
- Học sinh ngồi ghế QUAY LƯNG ra khán giả, mặt nhìn cô giáo; tóc vẽ bằng SVG ở `src/game/Hair.tsx`, kiểu tóc cố định theo tên tài khoản.
- 30 ghế bàn dài (4 dãy 7, 7, 8, 8); hết ghế thì đứng ngoài cửa lớp, vẫn tính điểm.
- Giọng Edge bị chặn (lỗi 429) khi gọi dồn: server cho Edge đọc từng câu một, bị chặn thì chờ thử lại, vẫn lỗi thì Google đúng ngôn ngữ.
- Sửa tính năng thì cập nhật README theo.
