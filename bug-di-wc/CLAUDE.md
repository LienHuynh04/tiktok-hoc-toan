# CLAUDE.md — Bất biến của Bug Đi WC (đừng phá khi sửa)

- **Cổng 3029** (HMR 24706). Stage: `http://lvh.me:3029/?view=stage` (1080×1920 dọc).
- **Kiến trúc phòng**: phòng game sống trong TRANG STAGE (như arena-meo/bong-bong);
  trang điều khiển chỉ điều khiển từ xa qua `/api/control` + nhận snapshot
  `/api/game/state` (stage POST mỗi 400ms). Chưa mở stage thì panel hiện "Đang chờ
  trang stage" — đúng thiết kế, không phải lỗi. Tick stage 100ms.
- **Engine thuần tất định** `src/game/wc.ts`: constructor `(now, rng)`, không
  `Date.now()`/timer trong engine. Sửa engine phải giữ `src/game/wc.check.ts` PASS
  (`npm run check`). `debugSetProgressPct/debugProgressPct/debugNeed/debugAnnoyance`
  là móc kiểm chứng, giữ nguyên.
- **Lực rặn là của CẢ PHÒNG**: tim cộng vào 1 thanh chung (khác mẫu "tim cá nhân"
  của Đua Vịt/Đấu Trường — đừng lẫn). 1 tim = 1 điểm; nhu cầu cấp n =
  `round(600 × 1,35^(n−1))`. Buff NƯỚC chỉ nhân phần lực từ TIM (không nhân burst chat).
- **Tụt tiến độ**: chỉ khi >3s không tim (theo `lastLikeAt` THẬT — tim lúc Bug dỗi
  không cập nhật mốc này, đó là chủ đích để dỗi vẫn tụt) và hết buff xơ; tốc độ
  0,4%/s; sàn = mốc cao nhất đã đạt trong lượt (25/50/75). Hết giờ 240s → mang
  40% tiến độ sang lượt sau, mốc sàn tính lại từ phần mang sang.
- **Dỗi (sulk)**: quạu 100 → dỗi tối đa 6s. Đang dỗi: `like()` chỉ ghi nhịp hiển
  thị (không lực/không ghi công/không cập nhật lastLikeAt), lệnh RẶN/CỐ LÊN vô
  hiệu; buff NƯỚC/RAU vẫn bật được. XIN LỖI −1,5s/câu. Hết dỗi (hết giờ hoặc dỗ
  xong): +2% tiến độ, quạu về đúng 30 (trong `tick`, bước nguôi quạu chạy TRƯỚC
  `endSulk` để không bị trừ tiếp cùng tick). Quạu tự nguôi 2/s khi không dỗi;
  xì (hiss) chỉ bắn lại sau khi quạu xuống dưới 50.
- **QUÀ = CHỈ CẢM ƠN**: `giftFx()` chỉ bật giấy vệ sinh bay 5s; `thank()` chỉ sinh
  lời cảm ơn. Cấm nối quà vào lực/tiến độ/buff/quạu dưới mọi hình thức. Chữ trên
  stage/HUD/README phải luôn ghi rõ điều này.
- **MC giọng NỮ + host hài**: mọi câu engine sinh có tiền tố `F:` và bốc từ pool
  ≥5 câu bằng `pick()` (không lặp câu vừa bốc trong cùng pool). Thêm sự kiện mới
  phải thêm pool ≥5 câu, không hardcode 1 câu. Văn phong trung tính trên bề mặt
  phát sóng: không kêu gọi thả tim/follow/share/tặng quà dạng mệnh lệnh.
- **NGOẠI LỆ CTA — CHỈ GAME NÀY (user duyệt 2026-11-14, sau khi được báo rõ là
  xung đột luật không-CTA)**: câu `hãy cho tôi 1 follow để ủng hộ ra clip và game
  về mèo nha` (hằng số `FOLLOW_NOTE` trong wc.ts, GIỮ NGUYÊN VĂN) được phép ở
  đúng 2 chỗ: (1) ghi chú xoay vòng chân sân khấu (~6s mỗi ~24s, pill ấm), (2)
  pool MC giờ nghỉ giữa lượt `INTERMISSION_LINES` (MC nói đúng 1 câu/giờ nghỉ,
  câu follow chiếm 1/6 pool nên xuất hiện thưa, tối đa 1 lần/giờ nghỉ). KHÔNG
  thêm CTA nào khác, KHÔNG mang ngoại lệ này sang game khác.
- **Câu PREMISE (user chốt 2026-11-14, GIỮ NGUYÊN VĂN)**: `Thông báo khẩn: Bug
  đang tắc 'đầu ra'! Cần đội cứu hộ bằng tim ngay!` (hằng số `PREMISE_LINE`
  trong wc.ts) ở đúng 2 chỗ: (1) MC nói ĐẦU TIÊN khi mở buổi (`newSession` —
  trước câu chào và luật chơi, dạng câu chính `main`), (2) banner đỏ "🚨 thông
  báo khẩn" dưới hàng tiêu đề sân khấu, chỉ hiện khi `phase === 'attempt'`.
- **Bug SỐNG (mood + pose + vi mô)**: engine suy `mood` (focused/pumped/annoyed/
  furious/sulking/sleepy/bliss) và `pose` từ tín hiệu sẵn có — thứ tự ưu tiên ở
  `moodAt()`/`poseAt()`, đừng đổi ngưỡng bừa (config `GAME.pumpedRate/maxCombo/
  maxProgressPct/sleepyAfterMs/reliefSitMs`). **Mặt rặn gốc `bug-wc.png` là nền**
  (user chốt giữ mặt này); các mặt khác là phản ứng theo tương tác: quạu 30–79 và
  80–99 (furious thêm rung + cue xì) dùng **mặt quạu liếc xéo** `faceAnnoyed`;
  ngủ gật dùng **mặt buồn ngủ** `faceSleepy` (thay pose doze cũ — gật gù ở stage
  đã giảm biên độ cho nhẹ). **FACE BEAT** (`faceBeat` trong engine, config
  `faceBeatHappyMs/faceBeatSurprisedMs/faceHappyCombo`): beat đang chạy THẮNG
  pose mood nhưng KHÔNG bao giờ đè pose dỗi (sulk) hay ăn mừng (relief*) — thứ
  tự phân giải nằm ở `poseAt()`, đừng sắp xếp lại. Mặt VUI `faceHappy` 1,2s:
  có quà (trong `giftFx`, chỉ biểu cảm — quà vẫn vô hiệu gameplay) + combo RẶN
  chạm 5/10 người khác nhau. Mặt NGẠC NHIÊN `faceSurprised` 0,8s: chạm mốc
  25/50/75 (mốc 75 = lúc Sen ló vào) + khoảnh khắc TỈNH DẬY trong
  `wakeIfSleepy()` (xong beat tự về mặt rặn). Ngủ gật: lượt đang chạy + 20s
  không tim/chat + nhịp tim <0,5 → sleepy; tim/chat đầu tiên = tỉnh dậy (mặt
  ngạc nhiên + bong bóng WAKE_BUG + cue meowBig). Dỗi dùng sprite QUAY LƯNG
  `bug-wc-sulk.png` — cấm quay lại trò lật ngang scaleX(-1). Chuyển động vi mô
  (thở/giật tai/chớp/lếc chat/gật gù/lắc thân) là lớp TRÌNH DIỄN ở stage
  (`useMicroMotion` + class wc-breathe/wc-rock/wc-nod/wc-zzz trong wc.css),
  engine không biết; đổi pose crossfade 120ms.
- **Tiếng mèo + tiếng "bẹt/tủm"** (`src/live/catSounds.ts`): tổng hợp Web
  Audio, KHÔNG file mẫu. Engine chỉ phát tín hiệu qua `drainCues()` ('meow' |
  'meowBig' | 'sadMeow' | 'hiss' | 'yowl' | 'chirp' | 'fart' | 'fartBig' |
  'fartTiny' | 'plop' | 'successPlop'); tiếng gằn/grừ liên tục do hook lái
  theo likeRate, tiếng NGÁY do hook lái khi mood = sleepy (khi đó phải tắt
  purr). Đừng gọi Web Audio từ engine (engine phải thuần để test). Luật cue
  "bẹt/tủm" (config `strainFart*`/`fakePlopChance`): fart rặn chỉ khi đang
  rặn thật + nhịp tim ≥5/s (hoặc tiến độ ≥90%), hẹn rng cách nhau 6–14s;
  `fartBig` mỗi lần chạm mốc; `plop` GIẢ ở mốc 75 tối đa 1 lần/lượt (rng
  50%); `fartTiny` khi dỗi bắt đầu; `successPlop` khi thắng (chuỗi hẹn giờ
  nằm trong catSounds, khớp nhịp cục vàng rơi ~1,6s).
- **Bong bóng chat**: mọi chat lên sân khấu qua `addBubble()` — bắt buộc qua
  `maskBanned()` + cắt 40 ký tự + trần 5 cái + sống 5s. Đừng render chat thô ở
  bất kỳ chỗ nào khác trên stage.
- **Nhạc gốc riêng**: `src/live/music.ts` bản "Rặn Đi Bug Ơi" C–F–G–C 112 BPM
  tuba oom-pah — không dùng lại giai điệu game khác. Nhạc/giọng/tiếng mèo chỉ
  phát sau tương tác đầu tiên (luật trình duyệt); không hứa cách lách.
- **Vỏ sân khấu**: glass kem "storybook glass" (`.glass-panel`/`.glass-pill` trong
  `wc.css`) — KHÔNG mảng tối (dark slab) trong chrome sân khấu.
- **Ảnh nhị phân** (11 file) `public/assets/wc-bg.png`, `bug-wc.png`,
  `bug-wc-max.png`, `bug-wc-sulk.png`, `bug-wc-relief-sit.png`, `bug-relief.png`,
  `sen.png`, `bug-wc-face-happy.png`, `bug-wc-face-surprised.png`,
  `bug-wc-face-annoyed.png`, `bug-wc-face-sleepy.png` KHÔNG đi qua đường đẩy chữ
  GitHub — phải chép/push từ Mac (gói zip).
  Stage phải vẫn chạy khi thiếu ảnh (nền gradient + emoji 🐱 dự phòng; pose thiếu
  ảnh thì lùi về pose strain) — đừng bỏ lớp dự phòng khi sửa stage.
