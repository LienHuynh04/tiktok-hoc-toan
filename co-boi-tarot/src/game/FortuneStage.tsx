import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { FortuneState } from './useFortune';
import { formatPoints, type FortuneView } from './fortune';
import { DISCLAIMER_STAGE, POINTS_NOTE } from './config';
import './fortune.css';

type CardV = NonNullable<FortuneView['current']>['cards'][number];
type Pose = 'idle' | 'deal' | 'read' | 'happy';
const POSES: Pose[] = ['idle', 'deal', 'read', 'happy'];

// Sao nền cố định (không đổi giữa các lần vẽ)
function useStars() {
  return useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: (i * 149.3) % 1080,
        top: (i * 311.7) % 1920,
        size: 2 + ((i * 7) % 3),
        delay: (i % 9) * 0.4,
      })),
    [],
  );
}

// Dòng nhắc nhỏ xoay vòng ở chân cảnh phòng bói
const HINTS = [
  'Gõ NAM / NỮ để đổi nhân vật đang ngồi',
  'Gõ câu hỏi lên chat để vào hàng chờ',
  'Điểm cao lên trước · 100 tim = 1 điểm',
];

// Hash nhỏ từ id nhân vật khách: mỗi nhân vật một nhịp thở/pha riêng (không ai giống ai)
function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// Chớp mắt cho cô bói: bóp nhẹ scaleY trong 120ms, lặp sau mỗi 3-6 giây ngẫu nhiên
function useBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let alive = true;
    let t1 = 0;
    let t2 = 0;
    const loop = () => {
      t1 = window.setTimeout(() => {
        if (!alive) return;
        setBlinking(true);
        t2 = window.setTimeout(() => {
          if (alive) setBlinking(false);
        }, 120);
        loop();
      }, 2800 + Math.random() * 3200);
    };
    loop();
    return () => {
      alive = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return blinking;
}

// Bụi sáng trôi trong ánh cửa sổ (vị trí/chu kỳ cố định theo hạt, lệch pha nhau)
function useDust() {
  return useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        left: 45 + ((i * 37) % 13),
        top: 8 + ((i * 53) % 46),
        size: 3 + ((i * 5) % 3),
        dur: 8 + ((i * 29) % 7),
        delay: -((i * 41) % 9),
      })),
    [],
  );
}

export function FortuneStage({ game }: { game: FortuneState }) {
  const v = game.view;
  const stars = useStars();
  const cur = v?.current ?? null;
  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 6000;
  const pose: Pose = giftFresh ? 'happy' : (cur?.pose ?? 'idle');
  const [bgOk, setBgOk] = useState(true);
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHintIdx((i) => (i + 1) % HINTS.length), 6000);
    return () => clearInterval(id);
  }, []);

  // ----- Lớp chuyển động mượt (micro-motion): xem fortune.css -----
  const blinking = useBlink();
  const dust = useDust();
  // Tab bị ẩn: dừng mọi animation trong sân khấu cho nhẹ máy
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    on();
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  // Cô chú ý về phía nào: khách vừa ngồi / đang đọc bài -> phía khách; trải + lật bài -> phía bài
  const attn: 'guest' | 'cards' | 'none' =
    giftFresh || v?.phase === 'welcome' || v?.phase === 'reading' ? 'guest' : v?.phase === 'deal' || v?.phase === 'flip' ? 'cards' : 'none';
  // Khách nảy mừng nhỏ mỗi khi 1 lá của mình được lật
  const [guestBounce, setGuestBounce] = useState(false);
  const prevFlip = useRef<{ user: string; flipped: number } | null>(null);
  const curUser = cur?.username ?? null;
  const curFlipped = cur?.flipped ?? 0;
  useEffect(() => {
    const prev = prevFlip.current;
    prevFlip.current = curUser ? { user: curUser, flipped: curFlipped } : null;
    if (curUser && prev && prev.user === curUser && curFlipped > prev.flipped) {
      setGuestBounce(true);
      const t = window.setTimeout(() => setGuestBounce(false), 340);
      return () => window.clearTimeout(t);
    }
  }, [curUser, curFlipped]);
  // Nhịp thở/nghiêng đầu của khách: bơm theo id nhân vật để mỗi người một nhịp
  const gSeed = cur?.guestChar ? seedOf(cur.guestChar.id) : 0;
  const guestBreatheStyle: CSSProperties = {
    animationDuration: `${3.4 + (gSeed % 5) * 0.22}s`,
    animationDelay: `${-((gSeed * 0.7) % 3.4)}s`,
  };
  const guestTiltStyle: CSSProperties = {
    animationDuration: `${9 + (gSeed % 5) * 0.9}s`,
    animationDelay: `${-((gSeed * 1.3) % 9)}s`,
    ['--tilt-deg' as string]: gSeed % 2 ? '1.5deg' : '-1.5deg',
  };

  return (
    <div
      className={`relative h-[1920px] w-[1080px] overflow-hidden text-white${hidden ? ' fortune-paused' : ''}`}
      style={{ background: 'radial-gradient(1200px 800px at 50% -10%, #4c1d95 0%, transparent 60%), radial-gradient(1000px 700px at 85% 110%, #701a75 0%, transparent 55%), linear-gradient(180deg, #0b0620 0%, #1e1b4b 45%, #0b0620 100%)' }}
    >
      {stars.map((s, i) => (
        <div key={i} className="fortune-star absolute rounded-full bg-amber-100" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}

      {/* Đầu trang: tên phòng */}
      <div className="absolute inset-x-0 top-[30px] text-center">
        <div className="font-['Dancing_Script'] text-[88px] leading-none text-amber-300" style={{ textShadow: '0 4px 30px rgba(250,204,21,.45)' }}>
          {game.channelName}
        </div>
        <div className="mt-1.5 text-[28px] font-semibold uppercase tracking-[0.35em] text-fuchsia-200/90">✦ Cô Bói Tarot ✦</div>
      </div>

      {/* Thông báo quà */}
      {giftFresh && game.lastGift && (
        <div key={game.lastGift.at} className="fortune-toast absolute inset-x-[90px] top-[186px] z-40 rounded-2xl bg-fuchsia-700/85 px-6 py-2.5 text-center text-[28px] font-semibold ring-1 ring-amber-200/50">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
          {game.lastGift.pointsAdded > 0 ? ` · +${game.lastGift.pointsAdded} điểm` : ''}
        </div>
      )}

      {!v && <div className="absolute inset-0 flex items-center justify-center text-[34px] text-fuchsia-100/70">Cô đang mở phòng…</div>}

      {v && (
        <>
          {/* Banner câu hỏi / khách đang ngồi */}
          <div className="absolute inset-x-[64px] top-[210px] z-20">
            {cur ? (
              <div className="rounded-3xl bg-white/8 px-6 py-3.5 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {cur.avatar ? (
                    <img src={cur.avatar} alt="" className="h-[58px] w-[58px] rounded-full ring-2 ring-amber-300/70" />
                  ) : (
                    <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-fuchsia-800 text-[28px]">🔮</div>
                  )}
                  <div className="min-w-0 flex-1 truncate text-[32px] font-bold leading-tight">{cur.nickname}</div>
                  <div className="rounded-full bg-indigo-600/80 px-3.5 py-1 text-[23px] font-semibold">{cur.themeLabel}</div>
                  <div className="rounded-full bg-amber-400/90 px-3.5 py-1 text-[23px] font-bold text-indigo-950">⭐ {formatPoints(cur.points)} điểm</div>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[29px] leading-snug text-amber-100">
                  <span className="font-bold text-amber-300">Câu hỏi: </span>
                  {cur.question}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/8 px-6 py-4 text-center ring-1 ring-white/15">
                <div className="text-[31px] font-semibold text-amber-100">
                  Gõ <span className="text-amber-300">câu hỏi của bạn</span> lên chat để vào hàng chờ
                </div>
                <div className="mt-0.5 text-[26px] text-fuchsia-100/85">Ví dụ: Cô ơi, chuyện tình cảm sắp tới của em thế nào?</div>
              </div>
            )}
          </div>

          {/* Cảnh phòng bói: nền phòng + cô bói + ghế khách */}
          <div className="absolute inset-x-[40px] top-[380px] h-[452px] overflow-hidden rounded-[28px] ring-1 ring-amber-200/25" style={{ backgroundColor: '#241243' }}>
            {bgOk && <img src="/assets/room-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setBgOk(false)} />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,6,32,0) 55%, rgba(11,6,32,0.45) 100%)' }} />
            {/* Ánh nến lập loè tại đúng vị trí 3 cụm nến trong tranh nền + bụi sáng trôi ở khung cửa sổ */}
            <div className="fortune-candle" style={{ left: 10, top: 317, width: 130, height: 130, animationDuration: '1.15s' }} />
            <div className="fortune-candle" style={{ left: 900, top: 305, width: 120, height: 120, animationDuration: '1.45s', animationDelay: '-0.5s' }} />
            <div className="fortune-candle" style={{ left: 617, top: 249, width: 96, height: 96, animationDuration: '1.7s', animationDelay: '-1.1s' }} />
            {dust.map((d, i) => (
              <div
                key={i}
                className="fortune-dust"
                style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
              />
            ))}
            {/* Cô bói: 4 tư thế xếp chồng, hiện 1. Các lớp bọc chuyển động lồng nhau:
                chú ý (theo pha) -> lay áo/tóc -> nhịp thở (+ hào quang quả cầu) -> chớp mắt -> settle khi đổi tư thế */}
            <div className="absolute bottom-[-8px] left-[36px] h-[430px] w-[404px]">
              <div className={`fortune-attn fortune-attn-${attn} h-full w-full`}>
                <div className="fortune-sway h-full w-full">
                  <div className="fortune-breathe relative h-full w-full">
                    <div className="fortune-ball-glow" />
                    <div className="fortune-blinkwrap h-full w-full" style={{ transform: blinking ? 'scaleY(0.995)' : 'scaleY(1)' }}>
                      <div key={pose} className="fortune-pose-settle relative h-full w-full">
                        {POSES.map((p) => (
                          <img
                            key={p}
                            src={`/assets/teller-${p}.png`}
                            alt=""
                            className="fortune-pose absolute inset-0 h-full w-full object-contain object-bottom"
                            style={{ opacity: pose === p ? 1 : 0 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Ghế khách: nhân vật chibi ngồi quay lưng 3/4 về phía cô, huy hiệu avatar + tên ở chân ghế */}
            {cur && cur.guestChar ? (
              <div className="absolute bottom-[4px] right-[2px] flex w-[408px] flex-col items-center">
                {/* Lớp chuyển động của khách: nảy khi lá của mình lật -> thỉnh thoảng nghiêng đầu -> thở/lay vai (nhịp riêng theo nhân vật) */}
                <div className={`w-full${guestBounce ? ' fortune-guest-bounce' : ''}`}>
                  <div className="fortune-guest-tilt w-full" style={guestTiltStyle}>
                    <div className="fortune-guest-breathe w-full" style={guestBreatheStyle}>
                      <img
                        key={cur.guestChar.id}
                        src={cur.guestChar.img}
                        alt=""
                        className="fortune-guest-in h-[336px] w-full object-contain object-bottom"
                        style={{ filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.45))' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="relative z-10 -mt-[38px] flex max-w-[408px] items-center gap-2">
                  {cur.avatar ? (
                    <img src={cur.avatar} alt="" className="h-[46px] w-[46px] flex-none rounded-full object-cover ring-2 ring-amber-300/80" />
                  ) : (
                    <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-fuchsia-900 text-[22px] ring-2 ring-amber-300/80">🙂</div>
                  )}
                  <div className="min-w-0 truncate rounded-full bg-black/60 px-4 py-1 text-[26px] font-bold ring-1 ring-amber-200/40">{cur.nickname}</div>
                  <div className="flex-none rounded-full bg-amber-400/90 px-3 py-0.5 text-[21px] font-bold text-indigo-950">⭐ {formatPoints(cur.points)}</div>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-[26px] right-[52px] flex w-[300px] flex-col items-center">
                {cur ? (
                  <>
                    <div className="rounded-full p-[5px]" style={{ background: 'linear-gradient(160deg, #facc15, #b45309)' }}>
                      {cur.avatar ? (
                        <img src={cur.avatar} alt="" className="h-[148px] w-[148px] rounded-full object-cover" />
                      ) : (
                        <div className="flex h-[148px] w-[148px] items-center justify-center rounded-full bg-fuchsia-900 text-[64px]">🙂</div>
                      )}
                    </div>
                    <div className="mt-2 max-w-[300px] truncate rounded-full bg-black/55 px-5 py-1.5 text-[27px] font-bold ring-1 ring-amber-200/40">{cur.nickname}</div>
                    <div className="mt-1 rounded-full bg-amber-400/90 px-3.5 py-0.5 text-[22px] font-bold text-indigo-950">⭐ {formatPoints(cur.points)} điểm</div>
                  </>
                ) : (
                  <>
                    <div className="flex h-[158px] w-[158px] items-center justify-center rounded-full bg-black/35 text-[64px] ring-2 ring-dashed ring-amber-200/40">🪑</div>
                    <div className="mt-2 rounded-full bg-black/55 px-5 py-1.5 text-[25px] text-white/80 ring-1 ring-white/20">Ghế đang trống</div>
                  </>
                )}
              </div>
            )}
            <div className="absolute left-[26px] top-[18px] rounded-full bg-black/45 px-4 py-1 text-[23px] font-semibold text-amber-100 ring-1 ring-amber-200/30">
              {v.phase === 'idle' && 'Cô đang chờ khách'}
              {v.phase === 'welcome' && 'Cô đang nghe câu hỏi'}
              {v.phase === 'deal' && 'Cô đang trải bài'}
              {v.phase === 'flip' && 'Đang lật từng lá'}
              {v.phase === 'reading' && 'Cô đang đọc bài'}
              {v.phase === 'rest' && 'Nghỉ giữa hai lượt'}
            </div>
            {/* Bảng tên khách đang ngồi: biển tím viền vàng phía trên ghế khách */}
            {cur && v.nameplate && (
              <div
                key={cur.username}
                className="fortune-guest-in absolute right-[16px] top-[12px] z-20 w-[404px] rounded-2xl px-5 py-2 text-center ring-1 ring-amber-300/60"
                style={{ background: 'linear-gradient(160deg, rgba(76,29,149,0.93), rgba(49,10,101,0.95))', boxShadow: '0 10px 26px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(250,204,21,0.22)' }}
              >
                <div className="truncate text-[31px] font-extrabold leading-tight text-amber-200">✦ {v.nameplate.nickname} ✦</div>
                <div className="text-[22px] leading-tight text-fuchsia-100/85">đang ngồi trước bàn bài</div>
              </div>
            )}
            {/* Toast nhảy hạng: xếp tối đa 2, ở đáy giữa cảnh (không đè panel lời giải) */}
            {v.rankJumps.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-[56px] z-30 flex flex-col items-center gap-2">
                {v.rankJumps.map((j) => (
                  <div
                    key={j.id}
                    className="fortune-rank-toast flex items-center gap-3 rounded-2xl px-4 py-2 ring-1 ring-amber-300/55"
                    style={{ background: 'linear-gradient(160deg, rgba(42,22,80,0.95), rgba(30,10,60,0.95))', boxShadow: '0 10px 26px rgba(0,0,0,0.5)' }}
                  >
                    {j.avatar ? (
                      <img src={j.avatar} alt="" className="h-[54px] w-[54px] flex-none rounded-full object-cover ring-2 ring-amber-300/70" />
                    ) : (
                      <div className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-full bg-fuchsia-800 text-[26px] ring-2 ring-amber-300/70">🔮</div>
                    )}
                    <div className="leading-tight">
                      <div className="max-w-[420px] truncate text-[26px] font-bold">
                        {j.nickname} <span className="text-amber-300">số {j.from} → số {j.to}</span>
                      </div>
                      <div className="text-[21px] text-white/75">
                        ❤️ {j.likes} · 🌹 {j.gifts} · ⭐ {formatPoints(j.points)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Dòng nhắc xoay vòng: dải nhỏ 1 dòng ở đáy cảnh, né huy hiệu khách bên phải */}
            <div key={hintIdx} className="fortune-guest-in absolute bottom-[8px] left-[200px] w-[400px] truncate rounded-full bg-black/45 px-4 py-1 text-center text-[19px] leading-snug text-amber-100/85 ring-1 ring-white/10">
              {HINTS[hintIdx]}
            </div>
          </div>

          {/* Hàng panel: hàng chờ (trái) + bảng giải thích điểm (phải) */}
          <div className="absolute inset-x-[40px] top-[848px] flex gap-4">
            {/* Hàng chờ theo điểm: top 4 + số còn lại */}
            <div
              className="h-[272px] w-[496px] flex-none rounded-[24px] px-5 py-3.5 ring-1 ring-amber-200/35"
              style={{ background: 'linear-gradient(165deg, rgba(46,16,101,0.88), rgba(24,8,54,0.92))', boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.14), 0 12px 30px rgba(0,0,0,0.35)' }}
            >
              <div className="flex items-end justify-between">
                <div className="text-[27px] font-extrabold text-amber-200">Hàng chờ · {v.queueCount} người</div>
                <div className="text-[20px] text-white/55">Đã xem: {v.readings} lượt</div>
              </div>
              {v.queueTop4.length === 0 ? (
                <div className="mt-3 text-[25px] text-white/60">Chưa có ai trong hàng chờ.</div>
              ) : (
                <div className="mt-1.5 space-y-[5px]">
                  {v.queueTop4.map((q, i) => (
                    <div key={q.username} className="flex items-center gap-2.5">
                      <span className="w-[30px] flex-none text-[24px] font-extrabold text-amber-300">{i + 1}.</span>
                      {q.avatar ? (
                        <img src={q.avatar} alt="" className="h-[34px] w-[34px] flex-none rounded-full object-cover" />
                      ) : (
                        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-fuchsia-800 text-[17px]">✦</div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[24px] font-semibold">{q.nickname}</span>
                      <span className="flex-none text-[23px] font-bold text-amber-200">{formatPoints(q.points)}</span>
                    </div>
                  ))}
                  {v.queueMore > 0 && <div className="text-[22px] text-fuchsia-100/75">+{v.queueMore} người nữa</div>}
                </div>
              )}
            </div>
            {/* Bảng giải thích: muốn lên trước thì làm sao */}
            <div
              className="h-[272px] flex-1 rounded-[24px] px-5 py-3.5 ring-1 ring-amber-200/35"
              style={{ background: 'linear-gradient(165deg, rgba(46,16,101,0.88), rgba(24,8,54,0.92))', boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.14), 0 12px 30px rgba(0,0,0,0.35)' }}
            >
              <div className="text-[29px] font-extrabold text-amber-200">Muốn lên trước?</div>
              <div className="mt-2 space-y-1.5 leading-snug">
                <div className="text-[27px] font-semibold">❤️ 100 tim = 1 điểm</div>
                <div className="text-[27px] font-semibold">🌹 1 bông hồng = 1 điểm</div>
                <div className="text-[24px] text-fuchsia-100/85">Tim tính từ lúc em vào hàng</div>
                <div className="text-[24px] text-fuchsia-100/85">Không thả vẫn được bói, điểm cao bói trước nha</div>
              </div>
            </div>
          </div>

          {/* 3 lá bài trên bàn */}
          <div className="absolute inset-x-0 top-[1136px]">
            <div className="flex items-start justify-center gap-[30px]">
              {cur ? (
                cur.cards.map((c, i) => <CardSlot key={i} c={c} index={i} dealt={cur.dealt > i} />)
              ) : (
                [0, 1, 2].map((i) => (
                  <div key={i} className="w-[272px]">
                    <div className="mb-2 text-center text-[24px] font-semibold text-white/45">{['Chuyện đang là gì', 'Điều đang cần', 'Nên làm gì'][i]}</div>
                    <div className="flex h-[380px] w-[272px] items-center justify-center rounded-[20px] border-2 border-dashed border-white/20 text-[54px] text-white/25">✦</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel lời giải */}
          <div className="absolute inset-x-[64px] top-[1640px] h-[188px] overflow-hidden rounded-3xl bg-black/45 px-7 py-5 ring-1 ring-amber-200/25 backdrop-blur-sm">
            {v.readingText ? (
              <div key={v.readingText} className={v.readingText.length > 380 ? 'fortune-reading-scroll' : ''}>
                <p className="text-[29px] leading-[1.5] text-amber-50">{v.readingText}</p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-[29px] leading-relaxed text-fuchsia-100/85">
                  {cur
                    ? v.phase === 'flip'
                      ? 'Các lá đang mở dần, cô sắp đọc bài đây…'
                      : 'Cô đang trải bài, lời giải sẽ hiện ở đây…'
                    : 'Lời giải của cô sẽ hiện ở đây. Gõ câu hỏi của bạn lên chat để vào hàng chờ nhé.'}
                </p>
              </div>
            )}
          </div>

          {/* Chân trang: cách tính điểm + miễn trừ */}
          <div className="absolute inset-x-0 bottom-[16px] text-center">
            <div className="text-[25px] font-semibold text-amber-200/90">{POINTS_NOTE}</div>
            <div className="mt-0.5 text-[22px] text-white/50">{DISCLAIMER_STAGE}</div>
          </div>
        </>
      )}
    </div>
  );
}

function CardSlot({ c, index, dealt }: { c: CardV; index: number; dealt: boolean }) {
  return (
    <div className="w-[272px]">
      <div className={`mb-2 text-center text-[24px] font-bold ${c.faceUp ? 'text-amber-300' : 'text-fuchsia-100/75'}`}>{c.position}</div>
      <div className={`relative h-[380px] w-[272px] ${dealt ? 'fortune-dealt' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.12}s` }}>
        <div className={`fcard h-full w-full ${c.faceUp ? 'flipped' : ''}`}>
          <div className="fcard-inner">
            {/* Mặt úp: hoạ tiết trăng sao tím vàng (bản gốc của phòng) */}
            <div className="fcard-face fcard-back flex flex-col items-center justify-center">
              <div className="text-[96px] leading-none">🌙</div>
              <div className="mt-2 text-[38px] text-amber-200">✦ ✦ ✦</div>
              <div className="mt-5 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-amber-300/90 text-[34px] font-extrabold text-indigo-950">{index + 1}</div>
            </div>
            {/* Mặt ngửa: ảnh lá bài thật Rider-Waite-Smith 1909 */}
            <div className="fcard-face fcard-backface overflow-hidden bg-[#f5edd8]">
              <img src={c.img} alt={c.en} className="h-full w-full object-cover" style={c.reversed ? { transform: 'rotate(180deg)' } : undefined} />
              {c.reversed && <div className="absolute right-2.5 top-2.5 rotate-6 rounded-md bg-red-600 px-2 py-0.5 text-[20px] font-extrabold tracking-wider text-white">NGƯỢC</div>}
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-2 text-center transition-opacity duration-500 ${c.faceUp ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-[26px] font-extrabold leading-tight text-amber-100">
          {c.name}
          {c.reversed ? ' (ngược)' : ''}
        </div>
        <div className="text-[20px] italic leading-tight text-white/60">{c.keywords}</div>
      </div>
    </div>
  );
}
