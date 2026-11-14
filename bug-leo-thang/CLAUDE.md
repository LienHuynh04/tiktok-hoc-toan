# Bug Leo 1000 Bậc — bất biến khi sửa

- **Cổng 3026**, stage: `http://lvh.me:3026/?view=stage`. Sân khấu chuẩn 1080×1920 (StageFrame co giãn).
- **Lõi game ở `src/game/climb.ts`** (thuần, bơm `now`/`rng` vào; kiểm chứng ở `climb.check.ts`
  chạy bằng `npm run check`). Mọi con số cơ chế nằm ở `src/game/config.ts` — sửa số ở đó,
  đừng rải số trong component.
- **Đường leo `STAIR_PATH`** trong config khớp với nền `public/assets/stairs-bg.png`:
  sàn → chặng thảm đỏ lên trái → chặng gỗ lên phải → chặng trên lên trái → cửa gác mái.
  Đổi ảnh nền thì phải chỉnh lại đường leo và tự chụp lại sân khấu kiểm tra Bug đi đúng bậc.
- **Tham gia bằng tim + chat, KHÔNG bằng quà.** Quà chỉ cảm ơn + confetti: không cộng bậc,
  không sức mạnh, không ảnh hưởng thắng. Lực kéo xuống chỉ từ sự kiện máy (len/dép/bậc
  trơn/ngủ gật) — tuyệt đối không gắn trừ bậc vào quà.
- **MC giọng NỮ**: mọi câu engine sinh có tiền tố `F:`. Văn phong trung tính, không hô hào
  xin tim/follow/share/quà trên các bề mặt phát sóng.
- **Nhạc gốc** ở `src/live/music.ts` ("Bug Leo Cầu Thang", C–Am–F–G 124 BPM, pluck) —
  không dùng lại giai điệu Đua Vịt (132 BPM) hay Bug Đại Náo (116 BPM), không nhạc có bản quyền.
- **Ảnh thật của kênh**: Bug có BỘ TƯ THẾ tách nền (mèo xám trơn + vòng cổ hoa xanh;
  không vẽ lại bằng code): `bug.png` (đứng), `bug-climb.png` (leo), `bug-jump.png` (nhảy —
  kiêm lúc lăn khi bị húc), `bug-run.png` (chạy), `bug-sleep.png` (ngủ). Máy tư thế
  `useBugPose` nằm trong `ClimbStage.tsx`, CHỈ lớp trình diễn (suy từ view: nap/tumbling/
  delta bậc/tốc độ leo), crossfade ~120ms, neo đáy–giữa trên đường leo; engine `climb.ts`
  không biết gì về tư thế — đừng gắn logic tư thế vào engine. Cả 6 file ảnh (5 sprite +
  nền) là nhị phân — khi đẩy code dạng chữ phải nhắc người dùng copy/đẩy từ Mac.
- Sự kiện giả lập qua `/api/test/emit`: like dùng dạng `{ type:'like', data:{ likeCount:N } }`
  (dạng phẳng `{count}` bị tính là 1). Kiểm chứng giao diện bằng **ảnh chụp sân khấu**,
  không kết luận chỉ bằng HTTP 200.
