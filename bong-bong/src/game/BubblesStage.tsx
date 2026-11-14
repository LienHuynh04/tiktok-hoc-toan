import { useMemo, type CSSProperties } from 'react';
import './bubbles.css';
import type { BubblesState } from './useBubbles';
import type { BubbleView } from './bubbles';

/** Khung "kính kem" dùng chung cả sân khấu (phong cách nhà mới, như Đại Náo) */
const GLASS: CSSProperties = {
  backgroundColor: 'rgba(252,247,238,0.88)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  border: '1.5px solid rgba(122,84,50,0.35)',
  boxShadow: '0 6px 18px rgba(91,58,30,0.18)',
  color: '#5b3a1e',
};

// 3 mẫu vết nứt (SVG 100x100): càng nhiều vết càng lan vào sâu
const CRACK_PATHS = [
  'M50 2 L46 18 L54 30 L47 44',
  'M98 38 L82 44 L74 34 L62 46',
  'M8 66 L24 60 L32 72 L46 64',
];

function BubbleBall({ b }: { b: BubbleView }) {
  const d = b.radius * 2;
  const initial = (b.nickname.trim()[0] ?? '?').toUpperCase();
  const scale = 1 + 0.04 * b.wob;
  return (
    <div
      className="absolute z-20 flex flex-col items-center"
      style={{
        left: b.x,
        top: b.y,
        width: d,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: 'left 100ms linear, top 100ms linear',
      }}
    >
      <div className="relative" style={{ width: d, height: d }}>
        {/* vành cầu vồng mỏng của màng xà phòng */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 210deg, rgba(255,105,180,0.30), rgba(255,205,60,0.30), rgba(90,220,150,0.30), rgba(80,170,255,0.30), rgba(180,120,255,0.30), rgba(255,105,180,0.30))',
            WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))',
            maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))',
          }}
        />
        {/* thân bong bóng: kính xà phòng + avatar bên trong */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{
            background:
              'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.28) 36%, rgba(173,216,255,0.16) 62%, rgba(255,182,213,0.20) 84%, rgba(255,255,255,0.45) 100%)',
            border: b.golden ? '3px solid rgba(240,180,30,0.95)' : '2px solid rgba(255,255,255,0.85)',
            boxShadow: b.golden
              ? '0 0 34px 8px rgba(245,197,66,0.55), inset 0 0 22px rgba(255,235,160,0.65)'
              : '0 8px 20px rgba(80,110,150,0.20), inset 0 0 18px rgba(255,255,255,0.5)',
          }}
        >
          {b.bot ? (
            <div className="absolute flex items-center justify-center rounded-full bg-[#dfe5ea]/80" style={{ inset: '9%' }}>
              <span style={{ fontSize: d * 0.42, lineHeight: 1 }}>🤖</span>
            </div>
          ) : b.avatar ? (
            <img
              src={b.avatar}
              alt=""
              className="absolute h-full w-full rounded-full object-cover"
              style={{ inset: 0, padding: '9%', boxSizing: 'border-box', opacity: 0.94 }}
              draggable={false}
            />
          ) : (
            <div
              className="absolute flex items-center justify-center rounded-full"
              style={{ inset: '9%', backgroundColor: `hsl(${b.hue} 82% 86%)` }}
            >
              <span className="font-black" style={{ fontSize: d * 0.4, color: `hsl(${b.hue} 55% 32%)` }}>
                {initial}
              </span>
            </div>
          )}
          {/* vết bóng sáng của màng xà phòng */}
          <div
            className="pointer-events-none absolute rounded-full bg-white/80"
            style={{ left: '16%', top: '9%', width: '36%', height: '20%', transform: 'rotate(-24deg)', filter: 'blur(1.5px)' }}
          />
          <div className="pointer-events-none absolute rounded-full bg-white/50" style={{ right: '14%', bottom: '12%', width: '13%', height: '9%', filter: 'blur(1px)' }} />
          {/* vết nứt */}
          {b.cracks > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
              {CRACK_PATHS.slice(0, b.cracks).map((p, i) => (
                <path key={i} d={p} fill="none" stroke="rgba(96,64,32,0.6)" strokeWidth="2.2" strokeLinecap="round" />
              ))}
            </svg>
          )}
        </div>
        {b.crown && (
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -d * 0.3, fontSize: d * 0.34, lineHeight: 1 }}>
            👑
          </div>
        )}
        {b.golden && (
          <div className="absolute" style={{ right: -6, top: -8, fontSize: 30, lineHeight: 1 }}>
            ✨
          </div>
        )}
        {b.bot && (
          <div className="absolute rounded-full px-[7px] text-[15px] font-bold leading-tight text-white" style={{ right: -4, bottom: 2, backgroundColor: 'rgba(91,107,122,0.9)' }}>
            🤖 BOT
          </div>
        )}
      </div>
      {/* tên + hệ số to */}
      <div
        className="relative z-10 flex max-w-[230px] items-center gap-[6px] rounded-full px-[11px] py-[1px] text-[20px] font-extrabold leading-tight shadow"
        style={{ ...GLASS, marginTop: -12 }}
      >
        <span className="truncate">{b.nickname}</span>
        {b.growth > 1.05 && <span className="whitespace-nowrap text-[17px] text-[#b8860b]">×{b.growth.toFixed(2).replace(/0$/, '')}</span>}
        {b.cracks > 0 && <span className="whitespace-nowrap text-[16px] text-[#b03a2e]">✸{b.cracks}</span>}
      </div>
    </div>
  );
}

export function BubblesStage({ game }: { game: BubblesState }) {
  const v = game.view;
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: `${(i * 43) % 100}%`,
        delay: `${(i % 9) * 0.15}s`,
        color: ['#f27059', '#f7c948', '#5b9bd5', '#7bc47f', '#b79ced'][i % 5],
      })),
    [],
  );

  if (!v) {
    return (
      <div className="relative h-[1920px] w-[1080px] overflow-hidden font-sans select-none" style={{ background: 'linear-gradient(180deg, #dceefb 0%, #f6f0e1 55%, #efe3cb 100%)', color: '#5b3a1e' }}>
        <div className="flex h-full items-center justify-center text-[38px] font-bold">Đang thổi bong bóng… 🫧</div>
      </div>
    );
  }

  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 6000 ? game.lastGift : null;

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden font-sans select-none" style={{ background: 'linear-gradient(180deg, #dceefb 0%, #f6f0e1 55%, #efe3cb 100%)', color: '#5b3a1e' }}>
      {/* ===== Nền: phòng màu nước có giếng trời (tranh của kênh) ===== */}
      <img
        src="/assets/bubble-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* ===== HUD trên: tiêu đề + bảng điểm (kính kem) ===== */}
      <div className="absolute inset-x-0 top-0 z-30 px-[26px] pt-[16px]">
        <div className="flex items-start gap-[16px]">
          <div className="min-w-0 flex-1">
            <div className="flex w-fit items-center gap-[12px] rounded-[22px] px-[18px] py-[8px]" style={GLASS}>
              <span className="text-[36px] leading-none">🫧</span>
              <div>
                <div className="text-[38px] font-black leading-none">BONG BÓNG AVATAR</div>
                <div className="mt-[3px] text-[21px] font-semibold" style={{ color: '#8a6a52' }}>
                  Vòng {v.round} · {v.aliveTotal} bong bóng trên sân ({v.aliveReal} người thật) · đã nổ {v.totals.pops} lần cả buổi
                </div>
              </div>
            </div>
            {v.goldenName && (
              <div className="bb-pop mt-[10px] w-fit rounded-full px-[18px] py-[5px] text-[23px] font-extrabold shadow" style={{ backgroundColor: 'rgba(255,232,150,0.92)', border: '1.5px solid rgba(190,140,20,0.6)', color: '#7a5200' }}>
                ✨ Bong bóng vàng: {v.goldenName} — không ai làm nứt được!
              </div>
            )}
            {v.gustDir !== null && (
              <div className="bb-pop mt-[10px] w-fit rounded-full px-[18px] py-[5px] text-[23px] font-extrabold shadow" style={{ ...GLASS }}>
                🌀 GIÓ QUẠT! {v.gustDir > 0 ? 'Thổi sang phải ⮕' : '⬅ Thổi sang trái'}
              </div>
            )}
            {giftFresh && (
              <div className="bb-pop mt-[10px] w-fit rounded-full px-[18px] py-[5px] text-[23px] font-extrabold shadow" style={{ backgroundColor: 'rgba(255,217,232,0.92)', border: '1.5px solid rgba(190,90,130,0.45)', color: '#8a2f52' }}>
                🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn! 💗
              </div>
            )}
          </div>
          {/* Bảng xếp hạng cả buổi — kính kem, góc phải trên */}
          <div className="w-[308px] shrink-0 rounded-[22px] px-[16px] py-[11px]" style={GLASS}>
            <div className="text-[21px] font-black tracking-wide" style={{ color: '#b8860b' }}>
              🏆 BẢNG BONG BÓNG
            </div>
            {v.board.length === 0 ? (
              <div className="mt-[4px] text-[19px] font-semibold" style={{ color: '#8a6a52' }}>
                Chưa có điểm — làm nổ bong bóng, thắng vòng sẽ lên bảng
              </div>
            ) : (
              <div className="mt-[4px] space-y-[3px]">
                {v.board.slice(0, 5).map((b, i) => (
                  <div key={b.username} className="flex items-center gap-[6px] text-[20px] font-bold leading-tight">
                    <span className="w-[26px] text-center">{i === 0 && (b.pops > 0 || b.wins > 0) ? '👑' : `${i + 1}.`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[18px]" style={{ color: '#8a6a52' }}>
                      💥{b.pops} 👑{b.wins} ×{b.biggest}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-[5px] text-[16px] font-semibold" style={{ color: '#8a6a52' }}>
              💥 lần nổ · 👑 thắng vòng · × cỡ to nhất
            </div>
          </div>
        </div>
      </div>

      {/* ===== Lớp bong bóng + chân Bug + hiệu ứng ===== */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {v.bubbles.map((b) => (
          <BubbleBall key={b.username} b={b} />
        ))}

        {/* Bong bóng tim trang trí khi có quà */}
        {v.hearts.map((h) => (
          <div key={h.id} className="bb-heart absolute flex items-center justify-center rounded-full" style={{ left: h.x, top: h.y, width: 52, height: 52 }}>
            <span className="text-[26px] leading-none">💗</span>
          </div>
        ))}

        {/* Chân Bug quệt bong bóng to nhất */}
        {v.paw && (
          <div
            className={`absolute z-30 ${v.paw.side === 'left' ? 'bb-paw-left' : 'bb-paw-right'}`}
            style={{ left: v.paw.x, top: v.paw.y + 30, width: 340, height: 340, transform: 'translate(-50%, -50%)' }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[150px] leading-none">🐾</span>
            <img
              src="/assets/bug.png"
              alt="Bug"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(74,50,38,0.45)]"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Hiệu ứng chữ + nổ */}
        {v.effects.map((fx) => {
          if (fx.kind === 'pop') {
            return (
              <div key={fx.id} className="absolute z-40" style={{ left: fx.x, top: fx.y, width: 0, height: 0 }}>
                <div className="bb-burst" style={{ width: fx.size, height: fx.size }} />
                {Array.from({ length: 8 }, (_, k) => {
                  const ang = (k * Math.PI) / 4;
                  return (
                    <span
                      key={k}
                      className="bb-drop"
                      style={{ left: Math.cos(ang) * fx.size * 0.62, top: Math.sin(ang) * fx.size * 0.62, animationDelay: `${k * 0.02}s` }}
                    />
                  );
                })}
                <div className="bb-comic">BỐP!</div>
              </div>
            );
          }
          return (
            <div
              key={fx.id}
              className="bb-fx absolute z-40 font-black"
              style={{
                left: fx.x,
                top: fx.y,
                fontSize: fx.kind === 'crack' ? 30 : 26,
                color: fx.kind === 'crack' ? '#b03a2e' : fx.kind === 'grow' ? '#b8860b' : '#e8a13c',
              }}
            >
              {fx.text}
            </div>
          );
        })}
      </div>

      {/* ===== Ăn mừng thắng vòng: confetti ===== */}
      {v.celebration === 'roundwin' && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {confetti.map((c, i) => (
            <span key={i} className="bb-confetti" style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color }} />
          ))}
          <div className="absolute inset-x-0 top-[760px] flex justify-center">
            <div className="bb-pop rounded-[26px] px-[34px] py-[20px] text-center" style={GLASS}>
              <div className="text-[50px] font-black" style={{ color: '#b8860b' }}>
                👑 {v.lastWinner ?? 'Vua Bong Bóng'} — VUA BONG BÓNG VÒNG {v.round}!
              </div>
              <div className="mt-[3px] text-[28px] font-bold">Bong bóng trụ lại cuối cùng, nguyên vẹn tới phút chót!</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Giờ nghỉ giữa vòng: bảng xếp hạng to (kính kem) ===== */}
      {v.phase === 'intermission' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(64,44,20,0.35)' }}>
          <div className="bb-pop w-[860px] rounded-[26px] px-[40px] py-[30px]" style={GLASS}>
            <div className="text-center text-[46px] font-black">
              {v.lastWinner ? `👑 ${v.lastWinner} — VUA BONG BÓNG VÒNG ${v.round}!` : `VÒNG ${v.round} HOÀ!`}
            </div>
            <div className="mt-[6px] text-center text-[27px] font-bold" style={{ color: '#8a6a52' }}>
              Vòng mới sau {v.intermissionSec}s — vào phòng hoặc comment sẵn để bong bóng của bạn nổi lên ngay đầu vòng!
            </div>
            <div className="mt-[18px] space-y-[7px]">
              {v.board.length === 0 ? (
                <div className="text-center text-[26px] font-semibold" style={{ color: '#8a6a52' }}>
                  Chưa có điểm nào trong buổi
                </div>
              ) : (
                v.board.map((b, i) => (
                  <div
                    key={b.username}
                    className="flex items-center gap-[12px] rounded-[16px] px-[18px] py-[8px] text-[28px] font-extrabold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.75)', border: '1px solid rgba(122,84,50,0.25)' }}
                  >
                    <span className="w-[44px] text-center">{i === 0 && (b.pops > 0 || b.wins > 0) ? '👑' : `${i + 1}`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[24px]" style={{ color: '#8a6a52' }}>
                      💥 {b.pops} nổ · 👑 {b.wins} thắng · ×{b.biggest} to nhất
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Chân trang: luật chơi (kính kem) ===== */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-[26px] pb-[20px]">
        <div className="rounded-[22px] px-[20px] py-[14px]" style={GLASS}>
          <div className="flex flex-wrap items-center justify-center gap-[8px] text-[23px] font-extrabold">
            <span className="rounded-full px-[14px] py-[3px]" style={{ backgroundColor: '#f7c948', color: '#5b3a1e' }}>
              👋 VÀO PHÒNG / 💬 COMMENT = CÓ BONG BÓNG
            </span>
            <span className="rounded-full px-[14px] py-[3px]" style={{ backgroundColor: '#ffd9e8', color: '#5b3a1e' }}>
              ❤️ TIM = BONG BÓNG CỦA BẠN TO DẦN
            </span>
            <span className="rounded-full px-[14px] py-[3px]" style={{ backgroundColor: '#bfe0f2', color: '#5b3a1e' }}>
              💥 ĐỤNG NHAU: TO HƠN LÀM NỨT NHỎ HƠN
            </span>
          </div>
          <div className="mt-[8px] text-center text-[21px] font-semibold leading-snug" style={{ color: '#7a5a3e' }}>
            Bong bóng chỉ to bằng tim và chat của chính chủ (tối đa ×2,2). Ba vết nứt là nổ BỐP — bong bóng vàng không ai làm nứt được. Quà chỉ để
            cảm ơn: bong bóng tim bay trang trí, không to thêm, không chống nứt.
          </div>
        </div>
      </div>
    </div>
  );
}
