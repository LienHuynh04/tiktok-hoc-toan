# Trang Trí Tết — Nhà Của Chúng Ta

Mini game live TikTok: cả phòng cùng trang trí một ngôi nhà đón Tết.

## Cách chơi

- Người xem **bình luận tên một món đồ bất kỳ** -> bé An (cô bé áo dài đỏ) cầm món đồ đi treo/đặt lên nhà, kèm xướng tên người xin.
- **Gõ chữ gì hiện hình đó**: thư viện 47 món vẽ sẵn (đồ Tết, con vật, đồ ăn, đồ vật, bầu trời) — gõ "con chó" hiện con chó, "máy bay" hiện máy bay, gõ không dấu cũng khớp.
- Món chưa có hình sẵn: bé An làm một **tấm thẻ tên** ghi đúng chữ người chơi gõ và treo lên — không ai mất lượt.
- Mỗi người 1 món đang chờ tối đa, giãn cách 8 giây; hàng chờ tối đa 8 món, treo lần lượt: đi -> treo -> ăn mừng.
- **Follow** -> bé An treo tặng một bao lì xì lên cây mai.
- **Đủ 100 tim** -> pháo hoa mừng Tết, mốc tim tăng dần (100, 200, 300...).
- **Quà**: chỉ cảm ơn bằng giọng đọc + thông báo trên sân khấu, không đổi thứ tự hay điểm (luật chung của kênh).
- Bảng "Treo nhiều nhất" vinh danh top 3 người trang trí; dòng sự kiện hiện 3 món mới nhất kèm tên người treo.

## Chạy trên máy

```bash
bash run.sh
```

- Trang điều khiển: http://localhost:3022 (có nút giả lập xin đồ/tim/follow/quà để thử khi chưa live)
- Link cho TikTok LIVE Studio: http://lvh.me:3022/?view=stage (khung dọc 1080 x 1920)
- Đầu buổi live: vào LIVE Studio -> chuột phải vào nguồn sân khấu -> Interact -> chạm 1 lần vào sân khấu để mở tiếng + nhạc (luật trình duyệt, game nào cũng vậy).

## Thêm hình mới

Mở `src/game/assets.ts`, thêm 1 mục vào `ASSETS`: tên hiển thị, danh sách từ khoá (đã bỏ dấu), vùng treo (`mai/cua/cuaSo/tuong/cay/san/troi`) và hàm `draw()` trả về SVG vẽ quanh tâm (0,0), khung khoảng 120x130. Chạy `npm run check` để kiểm tra tự động.
