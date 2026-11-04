# Lớp Toán

Game tương tác cho TikTok LIVE, chuyển thể từ [Lớp Học Chữ](https://github.com/workaipvlinh-byte/lop-hoc-chu). Màn hình vẫn là một lớp học 2D: cô giáo áo dài ra phép tính trên bảng đen, người xem gõ đáp án số vào bình luận. Ai đúng nhanh nhất được nhiều điểm nhất và được ngồi bàn đầu.

## Khác gì Lớp Học Chữ

- **100% câu hỏi là toán**, do game **tự sinh** lúc vào tiết nên không bao giờ hết câu, không cần file câu hỏi chữ (`src/game/cau-hoi/` đã bỏ). Sửa độ khó / thêm dạng toán: sửa `src/game/math.ts`.
- 6 cấp độ: **1** cộng trừ 1 chữ số · **2** cộng trừ 2 chữ số, nhân nhỏ · **3** nhân chia · **4** phép tính hai bước · **5** tìm số còn thiếu (`? + 7 = 15`) · **6** toán đố bằng lời, dãy số, chu vi hình.
- Mỗi tiết 20 câu khó dần, câu 20 là câu hỏi vàng nhân đôi điểm.
- Hết giờ chưa ai đúng: cô cho **thêm 10 giây** (không mở số như bản chữ, mở là lộ đáp án). Quà từ 30 xu lúc chưa ai đúng cũng cho thêm 10 giây, mỗi câu tối đa 1 lần.
- Sau giờ ra chơi, cả lớp **bình chọn dạng toán** của tiết sau (Cộng trừ / Nhân chia / Tính hai bước / Tìm số thiếu / Toán đố). Dạng thắng chiếm 5 câu trong tiết sau.
- Kiểm tra miệng giờ ra chơi cũng là **câu toán**.
- Nút **🚫 Bỏ câu này**: bỏ qua câu toán đang hỏi sang câu tiếp (câu tự sinh nên không ghi sổ cấm như bản chữ).
- Tính năng rủ "gõ số 1" / bình chọn vui lúc đang chờ trả lời **tắt trong Lớp Toán** vì gõ số dễ bị tính nhầm là đáp án.
- **Cổng riêng 3007** (Lớp Học Chữ dùng 3006) nên chạy hai game trên cùng một máy không đụng nhau.

## Giữ nguyên từ Lớp Học Chữ

- Chấm điểm theo giờ TikTok gắn lúc người xem gửi bình luận, nên phòng đông, bình luận tới lệch thứ tự vẫn xếp đúng ai nhanh nhất. Nhất 10 điểm, nhì 7, ba 5; chép đáp án trên khung chat chỉ được 1 điểm.
- Cô giáo nói bằng giọng Edge TTS tiếng Việt, vài trăm câu thoại để khen, trêu, cảm ơn quà. Đồng hồ dừng trong lúc cô đọc đề; câu chào, câu cảm ơn chỉ chen vào lúc đang chờ người xem trả lời.
- Tương tác: bình luận là có ghế (30 ghế trên 4 dãy bàn dài, hết ghế thì đứng ngoài cửa lớp, vẫn tính điểm), tặng quà thì học sinh lên bục tặng hoa cô, thả tim thì cả lớp vỗ tay, gõ "sinh nhật" thì có bánh kem, đi học nhiều ngày liền thì cô nhớ mặt.
- Giờ ra chơi sau mỗi tiết (oẳn tù tì, kiểm tra miệng, chọn phe, điểm danh, thả tim), lớp trưởng mỗi tiết, bảng học sinh xuất sắc trong ngày, bảng vàng tuần.
- Treo live cả ngày: rớt kết nối TikTok thì tự nối lại, server tắt thì file BAT tự bật lại. Sau buổi live có trang báo cáo câu khó, câu quá dễ.
- Trang điều khiển có nút giả lập (1 bạn trả lời, tặng quà, 1000 người cùng đoán...) để thử trước khi lên live.

## Cần có

- Máy Windows (file chạy sẵn là `BAT-LIVE.bat`; Mac/Linux xem phần cuối).
- [Node.js](https://nodejs.org/) bản 22 LTS (tối thiểu 20.19).
- Mạng internet: giọng đọc lấy từ Edge TTS.
- Tài khoản TikTok được phép LIVE và phần mềm [TikTok LIVE Studio](https://www.tiktok.com/studio/download).

## Cài đặt

1. Cài Node.js: tải bản **LTS** ở nodejs.org, bấm Next tới hết.
2. Lấy mã nguồn về máy (thư mục `lop-toan`).
3. Mở thư mục, bấm đúp **`BAT-LIVE.bat`**. Lần đầu máy tự cài thư viện, chờ 1–2 phút.
4. Cửa sổ đen hiện dòng `Server chạy ở http://localhost:3007`, khoảng 8 giây sau trình duyệt tự mở **trang điều khiển** `http://localhost:3007`. Để cửa sổ đen chạy suốt buổi live, đóng nó là tắt game.

## Lên live

1. Trong TikTok LIVE Studio bấm **Phát trực tiếp** (Go LIVE) trước.
2. Ở trang điều khiển, nhập username TikTok (không cần @) rồi bấm **Kết nối**. Báo "chưa LIVE" nghĩa là tài khoản chưa phát trực tiếp.
3. Trong LIVE Studio thêm nguồn **Link**:
   - Đường dẫn: `http://lvh.me:3007/?view=stage`
   - Khổ: **1080 × 1920** (màn hình dọc)

   LIVE Studio không nhận chữ `localhost`; `lvh.me` là tên miền trỏ về chính máy mình nên dùng được.
4. Chỉ trang `?view=stage` phát tiếng. Trang điều khiển im lặng, có khung xem trước, mở bao nhiêu tab cũng được. Đừng mở thêm trang stage ở chỗ khác kẻo hai giọng đọc đè nhau (trang điều khiển sẽ báo nếu bị vậy).

Dùng OBS cũng được: thêm nguồn **Browser**, cùng đường dẫn và khổ trên.

## Trang điều khiển

- **Tên lớp**: đổi chữ trên bảng hiệu (mặc định "Lớp Toán").
- **Giọng đọc trên stage**: gõ câu cho cô đọc ngay. Thêm `F: ` ở đầu câu để dùng giọng nữ.
- **Tốc độ giọng**: kéo thanh trượt, có tác dụng ngay khi đang live.
- **⏭ Qua phần tiếp / 🔄 Ván mới / 🚫 Bỏ câu này**: điều khiển lớp bằng tay. Bỏ câu toán là sang câu tiếp ngay, không ai được điểm.
- Các nút giả lập để thử khi chưa live.
- **📊 Báo cáo hôm nay** sau buổi live, hoặc mở thẳng `http://localhost:3007/bao-cao`.

## Thêm hoặc sửa dạng toán

Toàn bộ bộ sinh câu nằm ở `src/game/math.ts`, chia theo cấp 1–6. Mỗi câu sinh ra gồm:

- `show`: phần hiện to trên bảng (vd `36 + 47 = ?`, `? + 7 = 15`, `2, 5, 8, ?`).
- `clue`: lời cô đọc (toán đố cấp 6 là cả bài toán bằng chữ).
- `say` / `reveal`: cách cô công bố đáp án (mặc định "<phép tính> bằng <đáp án>").
- Đáp án luôn là **số nguyên dương**, người xem gõ số.

Thứ tự dạng câu trong 1 tiết nằm ở `GAME.roundPlan` trong `src/game/config.ts` (`math1`…`math6`), các dạng được bình chọn ở `GAME.mathTopics`. Lời thoại của cô nằm ở `src/game/loi-thoai.ts`, các con số (thời gian mỗi câu, điểm, giờ ra chơi...) ở `src/game/config.ts`.

Sửa xong **bắt buộc** chạy kiểm tra (bộ kiểm chứng tính lại đáp án độc lập từ biểu thức trên bảng):

```bash
npx tsx src/game/math.check.ts
npx tsx src/game/quiz.check.ts
```

## Tuỳ chỉnh khác

Tạo file `.env` cạnh `server.ts` nếu muốn đổi:

```text
PORT=3007
TTS_VOICE=vi-VN-NamMinhNeural
TTS_PITCH=+6%
```

`PORT` đổi ở đây thì nhớ sửa cả dòng `set PORT=3007` trong `BAT-LIVE.bat` và đường dẫn trong LIVE Studio.

Dữ liệu buổi live (bảng vàng tuần, chuyên cần, báo cáo) nằm ở thư mục `data/`. Xoá thư mục đó là làm lại từ đầu. Sổ này tách riêng với Lớp Học Chữ vì là thư mục khác.

## Mac / Linux

```bash
npm install
PORT=3007 LIVE_MODE=1 npm run dev
```

## Kiểm tra code

```bash
npx tsx src/game/math.check.ts
npx tsx src/game/quiz.check.ts
npm run lint
npm run build
```

## Lưu ý

- Kết nối TikTok dùng thư viện [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector). Thư viện này không phải của TikTok, các bạn tự cân nhắc khi dùng. Phòng quá đông thì TikTok có thể không gửi đủ 100% bình luận.
- Giọng đọc dùng Edge TTS qua thư viện `msedge-tts`, cần mạng; lỗi thì tự chuyển sang Google TTS.
- Không bao giờ đọc nguyên văn bình luận của người xem; tên và bình luận đi qua bộ lọc từ cấm (`src/live/bannedWords.ts`) trước khi hiện.
- Nguồn gốc: fork/chuyển thể từ Lớp Học Chữ của workaipvlinh-byte (MIT cho mã nguồn). Ảnh nhân vật và ảnh nền (`nhan-vat/`, `public/assets/`) thuộc về tác giả gốc; muốn dùng cho kênh của mình thì nên thay bằng ảnh riêng.

## Giấy phép

Mã nguồn dùng giấy phép [MIT](LICENSE). Ảnh nhân vật và ảnh nền thuộc về tác giả gốc.
