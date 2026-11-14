import { useMemo, useState } from 'react';
import './wc.css';
import type { WcState } from './useWc';

/** Cục vàng hoạt hình (xoáy ốc vàng + lấp lánh) — SVG inline, dễ thương, không tả thực */
function GoldenSwirl({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <path
        d="M50 92 C28 92 16 82 16 70 C16 60 26 55 33 57 C27 50 30 40 40 39 C36 31 43 22 52 24 C50 15 60 8 68 13 C77 18 76 28 70 32 C79 33 84 41 81 49 C88 53 88 63 82 68 C88 76 82 86 72 87 C70 93 60 92 50 92 Z"
        fill="#f2b33d"
        stroke="#c07f13"
        strokeWidth="3"
      />
      <path d="M30 68 C38 60 48 58 56 62 M40 44 C48 38 58 38 64 43" stroke="#ffe1a1" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M22 26 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#fff3c4" />
      <path d="M80 62 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 Z" fill="#fff3c4" />
    </svg>
  );
}

/** Cầu vồng SVG cho khoảnh khắc thành công */
function RainbowArc({ width }: { width: number }) {
  return (
    <svg width={width} height={width / 2} viewBox="0 0 200 100">
      <path d="M10 100 A90 90 0 0 1 190 100" stroke="#f27059" strokeWidth="11" fill="none" />
      <path d="M24 100 A76 76 0 0 1 176 100" stroke="#f7c948" strokeWidth="11" fill="none" />
      <path d="M38 100 A62 62 0 0 1 162 100" stroke="#7bc47f" strokeWidth="11" fill="none" />
      <path d="M52 100 A48 48 0 0 1 148 100" stroke="#5b9bd5" strokeWidth="11" fill="none" />
    </svg>
  );
}

/** Đường rặn lượn sóng quanh đầu Bug */
function StrainWaves({ flip }: { flip?: boolean }) {
  return (
    <svg width="90" height="150" viewBox="0 0 90 150" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M20 10 q14 16 0 32 q-14 16 0 32 q14 16 0 32 q-14 16 0 30" stroke="#b08968" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M58 22 q12 14 0 28 q-12 14 0 28 q12 14 0 28" stroke="#b08968" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

const SWEAT_POS = [
  { left: 66, top: 96 },
  { left: 512, top: 66 },
  { left: 118, top: 26 },
  { left: 470, top: 150 },
];
const TP_POS = [
  { left: '12%', delay: '0s' },
  { left: '30%', delay: '0.5s' },
  { left: '58%', delay: '0.25s' },
  { left: '76%', delay: '0.8s' },
  { left: '45%', delay: '1.1s' },
];

export function WcStage({ game }: { game: WcState }) {
  const v = game.view;
  // Emoji dự phòng CHỈ hiện khi ảnh sprite chưa tải xong hoặc lỗi — ảnh tải xong là ẩn hẳn
  // (sprite nền trong suốt, để emoji nằm dưới sẽ lòi viền vàng quanh nhân vật)
  const [bugOk, setBugOk] = useState(false);
  const [reliefOk, setReliefOk] = useState(false);
  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 9) * 0.14}s`,
        color: ['#f27059', '#f7c948', '#5b9bd5', '#7bc47f', '#b79ced'][i % 5],
      })),
    [],
  );

  if (!v) {
    return (
      <div
        className="relative flex h-[1920px] w-[1080px] items-center justify-center overflow-hidden font-sans select-none"
        style={{ background: 'linear-gradient(180deg, #dcefe8 0%, #f6f0e1 60%, #e8d9bd 100%)', color: '#5b3a1e' }}
      >
        <div className="text-[38px] font-bold">Bug đang vào nhà vệ sinh… 🚽</div>
      </div>
    );
  }

  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 6000 ? game.lastGift : null;
  const rate = v.likeRate;
  const shakeCls = v.phase !== 'attempt' || v.sulking ? '' : rate >= 8 ? 'wc-shake-lg' : rate >= 3 ? 'wc-shake-md' : rate >= 0.8 ? 'wc-shake-sm' : '';
  const sweatCount = rate >= 8 ? 4 : rate >= 3 ? 2 : 0;
  const annoyColor = v.annoyance >= 80 ? '#d92b1f' : v.annoyance >= 50 ? '#e2703a' : '#f0a13c';
  const success = v.phase === 'success';

  return (
    <div
      className="relative h-[1920px] w-[1080px] overflow-hidden font-sans select-none"
      style={{ background: 'linear-gradient(180deg, #dcefe8 0%, #f6f0e1 55%, #e8d9bd 100%)', color: '#5b3a1e' }}
    >
      {/* ===== Cảnh: nền WC + Bug (rung cả cảnh ở gag ống nước) ===== */}
      <div className={`absolute inset-0 ${v.pipes ? 'wc-pipes' : ''}`}>
        <img
          src="/assets/wc-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Bug ngồi bồn cầu (hoặc nhảy sung sướng khi thành công) */}
        <div className="absolute" style={{ left: success ? 300 : 230, bottom: success ? 400 : 296, width: success ? 480 : 620 }}>
          <div className={`${v.wobble ? 'wc-wobble' : ''}`}>
            <div className={`relative ${success ? 'wc-bounce' : shakeCls}`} style={{ height: success ? 480 : 687 }}>
              {!success && (
                <>
                  {!bugOk && <div className="absolute inset-0 flex items-center justify-center text-[230px]">🐱</div>}
                  <img
                    src="/assets/bug-wc.png"
                    alt="Bug đang rặn"
                    className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(91,58,30,0.35)]"
                    draggable={false}
                    onLoad={() => setBugOk(true)}
                    style={v.sulking ? { transform: 'scaleX(-1)', filter: 'brightness(0.92) saturate(0.8)' } : undefined}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* mồ hôi + đường rặn theo nhịp tim */}
                  {SWEAT_POS.slice(0, sweatCount).map((p, i) => (
                    <span key={i} className="wc-sweat absolute text-[44px]" style={{ left: p.left, top: p.top, animationDelay: `${i * 0.22}s` }}>
                      💧
                    </span>
                  ))}
                  {rate >= 5 && (
                    <>
                      <div className="wc-wave absolute" style={{ left: 8, top: 60 }}>
                        <StrainWaves />
                      </div>
                      <div className="wc-wave absolute" style={{ right: 8, top: 60, animationDelay: '0.3s' }}>
                        <StrainWaves flip />
                      </div>
                    </>
                  )}
                  {v.sulking && <div className="wc-anger absolute text-[92px]" style={{ right: 30, top: -30 }}>💢</div>}
                </>
              )}
              {success && (
                <>
                  {!reliefOk && <div className="absolute inset-0 flex items-center justify-center text-[230px]">🐱</div>}
                  <img
                    src="/assets/bug-relief.png"
                    alt="Bug nhẹ nhõm"
                    className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(91,58,30,0.35)]"
                    draggable={false}
                    onLoad={() => setReliefOk(true)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </>
              )}
            </div>
          </div>
          {/* Bong bóng thoại của chính Bug */}
          {!success && v.bugBubble && (
            <div className="wc-pop absolute z-30" style={{ left: 268, top: -118 }}>
              <div className="relative rounded-[26px] bg-white px-[22px] py-[10px] text-[30px] font-extrabold whitespace-nowrap text-[#8f1d14] shadow-lg ring-2 ring-[#e2703a]">
                {v.bugBubble}
                <div className="absolute h-[22px] w-[22px] rotate-45 bg-white ring-r ring-b" style={{ left: 44, bottom: -11, borderRight: '2px solid #e2703a', borderBottom: '2px solid #e2703a' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Viền pulse khi bão tim */}
      {v.phase === 'attempt' && rate >= 10 && <div className="wc-edge-pulse pointer-events-none absolute inset-0 z-20" />}

      {/* ===== Sen ló vào ở mốc 75% ===== */}
      {v.senPeek && !success && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 overflow-hidden" style={{ width: 360 }}>
          <div className="wc-peek absolute" style={{ right: 0, bottom: 620, width: 330 }}>
            <img
              src="/assets/sen.png"
              alt="Sen"
              className="w-full object-contain drop-shadow-[0_10px_14px_rgba(91,58,30,0.4)]"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="wc-pop glass-pill absolute px-[20px] py-[8px] text-[27px] font-extrabold" style={{ right: 150, bottom: 1130 }}>
            Sen: Xong chưa đấy?! 😤
          </div>
        </div>
      )}

      {/* ===== Bong bóng chat của người xem (bên trái Bug) ===== */}
      <div className="pointer-events-none absolute z-20 flex w-[430px] flex-col gap-[10px]" style={{ left: 26, bottom: 800 }}>
        {v.chatBubbles.map((b) => (
          <div key={b.id} className="wc-bubble w-fit max-w-[430px] rounded-[24px] rounded-bl-[6px] bg-white/92 px-[18px] py-[9px] shadow-lg ring-1 ring-[#d8c6a8]">
            <span className="mr-[8px] text-[23px] font-black text-[#b8860b]">{b.nickname}</span>
            <span className="text-[25px] font-semibold break-words text-[#5b3a1e]">{b.text}</span>
          </div>
        ))}
      </div>

      {/* ===== Popup RẶN! ghi công người thả tim ===== */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {v.popups.map((p) => (
          <div
            key={p.id}
            className="wc-popup absolute font-black whitespace-nowrap"
            style={{ left: 470 + ((p.id * 53) % 200) - 60, top: 800 - ((p.id * 29) % 110), fontSize: 34, color: '#dd8500', textShadow: '0 2px 0 #fff, 0 0 12px rgba(255,255,255,.95)' }}
          >
            RẶN! 💪 {p.nickname}
          </div>
        ))}
      </div>

      {/* ===== Giấy vệ sinh bay khi có quà ===== */}
      {v.giftFx && (
        <div className="pointer-events-none absolute inset-x-0 z-20" style={{ bottom: 420, height: 200 }}>
          {TP_POS.map((p, i) => (
            <span key={i} className="wc-tp text-[52px]" style={{ left: p.left, bottom: 0, animationDelay: p.delay }}>
              {i % 2 === 0 ? '🧻' : '💖'}
            </span>
          ))}
        </div>
      )}

      {/* ===== HUD trên ===== */}
      <div className="absolute inset-x-0 top-0 z-30 px-[26px] pt-[16px]">
        <div className="flex items-start gap-[16px]">
          <div className="glass-panel min-w-0 flex-1 px-[20px] py-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="rounded-2xl px-[13px] py-[4px] text-[36px]" style={{ background: 'linear-gradient(135deg,#f7c948,#f0a13c)' }}>
                🚽
              </div>
              <div className="wc-display truncate text-[42px] font-black leading-tight">BUG ĐI WC</div>
            </div>
            <div className="mt-[2px] text-[23px] font-semibold text-[#96714e]">
              Cấp táo bón {v.level} · Lượt rặn {v.attempt}
              {v.phase === 'attempt' && <> · ⏱ còn {v.remainSec}s</>}
              {v.topNow && <> · 💪 Rặn chính: <b className="text-[#5b3a1e]">{v.topNow.nickname}</b> ({v.topNow.power})</>}
            </div>
            {giftFresh && (
              <div className="wc-pop mt-[6px] w-fit rounded-full bg-[#ffd9e8] px-[16px] py-[3px] text-[22px] font-extrabold shadow">
                🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn! 🧻
              </div>
            )}
          </div>
          {/* Bảng cả buổi */}
          <div className="glass-panel w-[302px] shrink-0 px-[16px] py-[11px]">
            <div className="text-[21px] font-black tracking-wide text-[#b8860b]">🏆 BẢNG RẶN THUÊ</div>
            {v.board.length === 0 ? (
              <div className="mt-[3px] text-[19px] font-semibold text-[#96714e]">Chưa ai góp lực — thả tim/chat là lên bảng</div>
            ) : (
              <div className="mt-[3px] space-y-[3px]">
                {v.board.slice(0, 5).map((b, i) => (
                  <div key={b.username} className="flex items-center gap-[6px] text-[20px] font-bold leading-tight">
                    <span className="w-[28px] text-center">{b.king ? '👑' : `${i + 1}.`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[18px] text-[#b8860b]">💪{b.power}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-[4px] text-[16px] font-semibold text-[#96714e]">👑 = VUA RẶN · 💪 tổng lực cả buổi</div>
          </div>
        </div>

        {/* THANH RẶN */}
        <div className="glass-panel mt-[14px] px-[22px] py-[14px]">
          <div className="flex items-end justify-between">
            <div className="wc-display text-[30px] font-black tracking-wide">THANH RẶN</div>
            <div className="flex items-center gap-[14px]">
              {v.decaying && <span className="text-[24px] font-black text-[#d92b1f]">▼ ĐANG TỤT!</span>}
              <span className="text-[24px] font-bold text-[#96714e]">❤️ {v.likeRate}/giây</span>
              <span className="wc-display text-[46px] font-black leading-none text-[#b8860b]">{Math.floor(v.progressPct)}%</span>
            </div>
          </div>
          <div className="relative mt-[8px] h-[48px] overflow-hidden rounded-full bg-white/70 ring-2 ring-[#d8c6a8]">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${v.progressPct}%`, background: 'linear-gradient(90deg,#7bc47f,#a5d66a,#f7c948)' }}
            />
            {GAME_MARKS.map((m) => (
              <div key={m} className="absolute top-0 h-full w-[3px] bg-[#5b3a1e]/45" style={{ left: `${m}%` }} />
            ))}
          </div>
          <div className="relative mt-[3px] h-[22px] text-[18px] font-bold text-[#96714e]">
            {GAME_MARKS.map((m) => (
              <span key={m} className="absolute -translate-x-1/2" style={{ left: `${m}%` }}>
                {m}%{v.milestonesHit.includes(m) ? ' ✓' : ''}
              </span>
            ))}
            <span className="absolute right-0">Đích: RA! 🎉</span>
          </div>
        </div>

        {/* Buff + combo + độ quạu */}
        <div className="mt-[12px] flex flex-wrap items-center gap-[10px]">
          {v.waterSec > 0 && <span className="glass-pill px-[16px] py-[5px] text-[23px] font-extrabold text-[#2b6cb0]">💧 NƯỚC: lực tim ×1,5 · còn {v.waterSec}s</span>}
          {v.fiberSec > 0 && <span className="glass-pill px-[16px] py-[5px] text-[23px] font-extrabold text-[#2e7d32]">🥬 CHẤT XƠ: không tụt · còn {v.fiberSec}s</span>}
          {v.combo > 0 && <span className="glass-pill px-[16px] py-[5px] text-[23px] font-extrabold text-[#dd8500]">🔥 {v.combo} người đang rặn cùng</span>}
          <span className={`glass-pill flex items-center gap-[10px] px-[16px] py-[5px] text-[23px] font-extrabold ${v.annoyance >= 80 && !v.sulking ? 'wc-annoy-hot' : ''}`}>
            😾 ĐỘ QUẠU
            <span className="relative h-[16px] w-[128px] overflow-hidden rounded-full bg-white/70 ring-1 ring-[#d8c6a8]">
              <span className="absolute inset-y-0 left-0 rounded-full transition-all duration-300" style={{ width: `${v.annoyance}%`, backgroundColor: annoyColor }} />
            </span>
            {v.annoyance}
          </span>
        </div>

        {/* Banner dỗi */}
        {v.sulking && (
          <div className="wc-pop mx-auto mt-[14px] w-fit rounded-[22px] px-[28px] py-[12px] text-center shadow-2xl" style={{ background: 'rgba(255,235,225,0.95)', border: '2.5px solid #d92b1f' }}>
            <div className="wc-display text-[36px] font-black text-[#b03a2e]">😾 BUG DỖI RỒI! (còn {v.sulkSec}s)</div>
            <div className="text-[25px] font-bold text-[#5b3a1e]">Bug ngừng rặn mà tiến độ vẫn tụt — cả phòng gõ <b>XIN LỖI</b> dỗ Bug đi!</div>
          </div>
        )}
      </div>

      {/* ===== Thành công! ===== */}
      {success && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {confetti.map((c, i) => (
            <span key={i} className="wc-confetti" style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color }} />
          ))}
          <div className="absolute" style={{ left: 190, top: 520 }}>
            <RainbowArc width={700} />
          </div>
          <div className="wc-drop absolute" style={{ left: 472, top: 1080 }}>
            <GoldenSwirl size={136} />
          </div>
          <div className="wc-spin absolute" style={{ left: 452, top: 1230 }}>
            <svg width="176" height="176" viewBox="0 0 100 100">
              <path d="M50 12 a38 38 0 1 1 -26 11" stroke="#7fc4de" strokeWidth="9" fill="none" strokeLinecap="round" />
              <path d="M14 12 L26 24 L36 10 Z" fill="#7fc4de" />
            </svg>
          </div>
          <div className="wc-pop absolute inset-x-0 flex justify-center" style={{ top: 660 }}>
            <div className="rounded-[28px] px-[36px] py-[18px] text-center shadow-2xl" style={{ background: 'rgba(252,247,238,0.94)', border: '2.5px solid #d9941c' }}>
              <div className="wc-display text-[56px] font-black text-[#b8860b]">🎉 RA RỒI!</div>
              <div className="mt-[2px] text-[29px] font-bold text-[#5b3a1e]">
                Bug nhẹ nhõm cả người!{v.successTop ? <> Người rặn chính: <b>{v.successTop}</b> 👑</> : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Nghỉ giữa lượt: bảng cả buổi ===== */}
      {v.phase === 'intermission' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2b1c10]/45">
          <div className="wc-pop glass-panel w-[860px] px-[40px] py-[30px]">
            <div className="text-center text-[46px] font-black">
              {v.successTop ? `👑 ${v.successTop} LÀ VUA RẶN!` : '🏆 BẢNG RẶN THUÊ CẢ BUỔI'}
            </div>
            <div className="mt-[5px] text-center text-[27px] font-bold text-[#96714e]">Bug đang rửa chân tay… lượt rặn mới sắp bắt đầu!</div>
            <div className="mt-[16px] space-y-[7px]">
              {v.board.length === 0 ? (
                <div className="text-center text-[26px] font-semibold text-[#96714e]">Chưa có điểm nào trong buổi</div>
              ) : (
                v.board.map((b, i) => (
                  <div key={b.username} className="flex items-center gap-[12px] rounded-[16px] bg-white/85 px-[18px] py-[8px] text-[28px] font-extrabold shadow-sm ring-1 ring-[#e2d3b8]">
                    <span className="w-[46px] text-center">{b.king ? '👑' : `${i + 1}`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[24px] text-[#96714e]">💪 {b.power} lực</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Chân trang: luật chơi (mô tả trung tính) ===== */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-[26px] pb-[18px]">
        <div className="glass-panel px-[22px] py-[13px]">
          <div className="text-center text-[23px] font-bold leading-snug">
            ❤️ Tim của cả phòng cộng chung thành lực rặn · 💬 <b>RẶN</b> +0,6% · <b>NƯỚC</b> tăng lực tim · <b>RAU</b> chống tụt · <b>CHỌC</b> là Bug quạu, quạu đầy là dỗi — dỗ bằng <b>XIN LỖI</b>
          </div>
          <div className="mt-[4px] text-center text-[21px] font-semibold text-[#96714e]">
            🎁 Quà chỉ để cảm ơn: giấy vệ sinh bay trang trí, không cộng lực · Đã thắng {v.totals.successes}/{v.totals.attempts + (v.phase === 'attempt' ? 1 : 0)} lượt · Quá 3 giây không tim là tiến độ tụt (không qua mốc 25/50/75 đã đạt)
          </div>
        </div>
      </div>
    </div>
  );
}

const GAME_MARKS = [25, 50, 75];
