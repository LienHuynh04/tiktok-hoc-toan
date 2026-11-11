# Đua Vịt — Đường Đua 200m

Game live TikTok: mỗi người xem là một tay đua vịt, cả phòng đua cùng lúc trong hồ bơi 200m.

## Cách chơi

- **Bình luận bất cứ chữ gì** là có ngay 1 bé vịt đua mang tên mình (màu vịt cố định theo tài khoản, 10 màu). Vào giữa chặng vẫn được đua tiếp.
- Chặng đua tự chạy liên tục: chờ xuất phát 15 giây -> đua 200m (khoảng 60–80 giây) -> bục vinh quang -> chặng mới. Vào phòng lúc nào cũng sắp có chặng để đua.
- **Khẩu lệnh tăng tốc**: cứ ~13 giây màn hình hiện 1 khẩu lệnh to (BƠI / QUẠT / ĐẠP / LẶN / VỊT / TĂNG TỐC). Ai gõ đúng trong 5 giây, vịt của người đó bốc tốc x1,85 trong 4 giây.
- **Xuất phát sớm bằng tim**: ở sảnh chờ, cả phòng thả đủ 100 tim -> chặng đua xuất phát ngay dù chưa đủ 6 tay đua (chỉ cần tối thiểu 2). Thanh tim hiện ngay trong banner sảnh chờ.
- **Sóng lớn**: cả phòng thả đủ 150 tim -> sóng đẩy cả đoàn tăng tốc 25% trong 10 giây (nhịp chung, không ai được lợi riêng).
- Vịt về nhất mở thêm 10 giây cho các bạn khác cán đích; hết giờ thì xếp hạng theo quãng đường. Bảng **Vua Vịt** ghi số lần vô địch cả buổi.
- **Quà**: chỉ cảm ơn bằng giọng đọc + thông báo, không mua được tốc độ (luật chung của kênh).
- Bao nhiêu người vào thì bấy nhiêu vịt trên hồ (tối đa 60): sân khấu tự co chiều cao làn để mọi vịt đều hiện kín màn hình, đông quá thì thẻ tên nằm cố định ở đầu làn.

## Chạy trên máy

```bash
bash run.sh
```

- Trang điều khiển: http://localhost:3023 (có nút giả lập: thêm vịt, đua thử, thả tim, tặng quà)
- Link cho TikTok LIVE Studio: http://lvh.me:3023/?view=stage (khung dọc 1080 x 1920)
- Đầu buổi live: vào LIVE Studio -> chuột phải vào nguồn sân khấu -> Interact -> chạm 1 lần vào sân khấu để mở tiếng + nhạc.
