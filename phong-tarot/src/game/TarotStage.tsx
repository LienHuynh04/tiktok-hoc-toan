import { useMemo } from 'react';
import type { TarotState } from './useTarot';
import type { TarotView } from './tarot';
import type { LuckyView } from './lucky';
import './tarot.css';

type CardV = TarotView['current'] extends infer C ? (C extends { cards: (infer K)[] } ? K : never) : never;

// Sao nền cố định (không đổi giữa các lần vẽ)
function useStars() {
  return useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: (i * 137.5) % 1080,
        top: (i * 289.7) % 1920,
        size: 2 + ((i * 7) % 3),
        delay: (i % 9) * 0.4,
      })),
    [],
  );
}

export function TarotStage({ game }: { game: TarotState }) {
  const v = game.view;
  const stars = useStars();
  const cur = v?.current ?? null;

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden text-white" style={{ background: 'radial-gradient(1200px 800px at 50% -10%, #4c1d95 0%, transparent 60%), radial-gradient(1000px 700px at 85% 110%, #701a75 0%, transparent 55%), linear-gradient(180deg, #0b0620 0%, #1e1b4b 45%, #0b0620 100%)' }}>
      {stars.map((s, i) => (
        <div key={i} className="tarot-star absolute rounded-full bg-amber-100" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}
      <div className="absolute left-1/2 top-[330px] text-[300px] opacity-[0.07]" style={{ transform: 'translateX(-50%)' }}>🌙</div>

      {/* Đầu trang: tên phòng + lưu ý giải trí */}
      <div className="absolute inset-x-0 top-[46px] text-center">
        <div className="font-['Dancing_Script'] text-[92px] leading-none text-amber-300" style={{ textShadow: '0 4px 30px rgba(250,204,21,.45)' }}>
          {game.channelName}
        </div>
        <div className="mt-2 text-[30px] font-semibold uppercase tracking-[0.35em] text-fuchsia-200/90">✦ Xem bài Ẩn Chính ✦</div>
        <div className="mx-auto mt-4 w-fit rounded-full bg-white/10 px-5 py-1.5 text-[24px] text-amber-100/90 ring-1 ring-amber-200/30">
          Chỉ mang tính giải trí, tham khảo cho vui
        </div>
      </div>

      {/* Thông báo quà */}
      {game.lastGift && Date.now() - game.lastGift.at < 6000 && (
        <div key={game.lastGift.at} className="tarot-toast absolute inset-x-[90px] top-[300px] z-30 rounded-2xl bg-fuchsia-700/85 px-6 py-3 text-center text-[30px] font-semibold ring-1 ring-amber-200/50">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
        </div>
      )}

      {!v && <div className="absolute inset-0 flex items-center justify-center text-[34px] text-fuchsia-100/70">Đang mở phòng…</div>}

      {v && (
        <>
          {v.mode === 'lucky' && v.lucky ? (
            <LuckySection lucky={v.lucky} disclaimer={v.disclaimer} />
          ) : (
            <>
          {/* Người đang được xem */}
          <div className="absolute inset-x-[70px] top-[300px] z-20">
            {cur ? (
              <div className="flex items-center gap-4 rounded-3xl bg-white/8 px-6 py-4 ring-1 ring-white/15 backdrop-blur-sm">
                {cur.avatar ? <img src={cur.avatar} alt="" className="h-[76px] w-[76px] rounded-full ring-2 ring-amber-300/70" /> : <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-fuchsia-800 text-[36px]">🔮</div>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[38px] font-bold leading-tight">{cur.nickname}</div>
                  <div className="text-[27px] text-fuchsia-200">Chủ đề: {cur.topic}</div>
                </div>
                {v.phase === 'offer' && (
                  <div className="text-center">
                    <div className="text-[54px] font-extrabold leading-none text-amber-300">{cur.secLeft}</div>
                    <div className="text-[22px] text-white/70">giây chọn lá</div>
                  </div>
                )}
                {v.phase === 'reveal' && <div className="rounded-full bg-amber-400/90 px-4 py-1.5 text-[25px] font-bold text-indigo-950">Đang đọc bài</div>}
              </div>
            ) : (
              <div className="rounded-3xl bg-white/8 px-6 py-5 text-center text-[32px] text-fuchsia-100/90 ring-1 ring-white/15">
                Đang chờ bạn đầu tiên vào hàng chờ 🔮
              </div>
            )}
          </div>

          {/* 3 lá bài */}
          {cur && (
            <div className="absolute inset-x-0 top-[520px] flex items-start justify-center gap-[36px]">
              {cur.cards.map((c, i) => (
                <CardSlot key={i} c={c} index={i} phase={v.phase} picked={cur.picked} />
              ))}
            </div>
          )}
          {!cur && (
            <div className="absolute inset-x-[110px] top-[560px] rounded-[28px] bg-white/6 px-10 py-10 text-center ring-1 ring-white/12">
              <div className="text-[120px] leading-none">🌙</div>
              <div className="mt-4 text-[36px] font-semibold leading-snug text-amber-100">
                Gõ <span className="text-amber-300">TAROT</span> kèm chủ đề để vào hàng chờ
              </div>
              <div className="mt-3 text-[29px] leading-relaxed text-fuchsia-100/85">
                Ví dụ: TAROT tình yêu · TAROT công việc · TAROT tài chính
                <br />
                Tới lượt, bạn chọn 1 trong 3 lá úp bằng số 1, 2 hoặc 3
              </div>
            </div>
          )}

          {/* Lời giải hiện chữ */}
          {v.displayLines.length > 0 && (
            <div className="absolute inset-x-[70px] top-[1180px] rounded-3xl bg-black/45 px-8 py-6 ring-1 ring-amber-200/25 backdrop-blur-sm">
              {v.displayLines.slice(-3).map((l, i, arr) => (
                <p key={i} className={`text-[31px] leading-relaxed ${i === arr.length - 1 ? 'font-semibold text-amber-100' : 'text-white/75'}`}>
                  {l}
                </p>
              ))}
            </div>
          )}

          {/* Hàng chờ + thống kê */}
          <div className="absolute inset-x-[70px] bottom-[64px]">
            <div className="mb-3 flex items-end justify-between">
              <div className="text-[30px] font-bold text-fuchsia-100">Hàng chờ ({v.queue.length})</div>
              <div className="text-[26px] text-white/60">Đã xem trong buổi: {v.readings} lượt</div>
            </div>
            {v.queue.length === 0 ? (
              <div className="rounded-2xl bg-white/6 px-6 py-4 text-[28px] text-white/65 ring-1 ring-white/10">Chưa có ai trong hàng chờ. Gõ TAROT kèm chủ đề để bắt đầu.</div>
            ) : (
              <div className="space-y-2">
                {v.queue.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/8 px-5 py-2.5 ring-1 ring-white/12">
                    <span className="w-[44px] text-[28px] font-extrabold text-amber-300">{i + 1}</span>
                    {q.avatar ? <img src={q.avatar} alt="" className="h-[52px] w-[52px] rounded-full" /> : <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-fuchsia-800 text-[24px]">✦</div>}
                    <span className="min-w-0 flex-1 truncate text-[30px] font-semibold">{q.nickname}</span>
                    <span className="rounded-full bg-indigo-600/70 px-3.5 py-1 text-[24px]">{q.topic}</span>
                  </div>
                ))}
                {v.queue.length > 5 && <div className="text-[25px] text-white/55">… và {v.queue.length - 5} bạn nữa</div>}
              </div>
            )}
            <div className="mt-5 text-center text-[24px] text-white/45">{v.disclaimer}</div>
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

type LuckyCardV = LuckyView['cards'][number];

function LuckySection({ lucky, disclaimer }: { lucky: LuckyView; disclaimer: string }) {
  const L = lucky;
  const phaseLabel = L.phase === 'pick' ? 'Cả phòng đang chọn lá' : L.phase === 'reveal' ? 'Đang lật bài' : 'Chờ vòng mới';
  return (
    <>
      {/* Thanh thông tin vòng chơi */}
      <div className="absolute inset-x-[70px] top-[300px] z-20">
        <div className="flex items-center gap-4 rounded-3xl bg-white/8 px-6 py-4 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-700/80 text-[38px]">🍀</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[38px] font-bold leading-tight">Lá Bài May Mắn · Vòng {Math.max(1, L.round)}</div>
            <div className="text-[27px] text-emerald-200">
              {phaseLabel} · {L.players} bạn đã chọn lá
            </div>
          </div>
          {L.phase === 'pick' && (
            <div className="text-center">
              <div className="text-[54px] font-extrabold leading-none text-amber-300">{L.secLeft}</div>
              <div className="text-[22px] text-white/70">giây chọn lá</div>
            </div>
          )}
          {L.phase === 'reveal' && <div className="rounded-full bg-amber-400/90 px-4 py-1.5 text-[25px] font-bold text-indigo-950">Lật bài!</div>}
          {L.phase === 'wait' && (
            <div className="text-center">
              <div className="text-[54px] font-extrabold leading-none text-emerald-300">{L.secLeft}</div>
              <div className="text-[22px] text-white/70">giây nghỉ</div>
            </div>
          )}
        </div>
      </div>

      {/* 3 lá của vòng (pha nghỉ: nhường chỗ cho bảng xếp hạng) */}
      {L.phase !== 'wait' ? (
        <>
          <div className="absolute inset-x-0 top-[520px] flex items-start justify-center gap-[36px]">
            {L.cards.map((c, i) => (
              <LuckyCardSlot key={i} c={c} index={i} />
            ))}
          </div>
          <div className="absolute inset-x-[70px] top-[1030px] text-center">
            {L.phase === 'pick' ? (
              <div className="text-[34px] font-semibold text-amber-100">
                Gõ <span className="text-amber-300">1</span> · <span className="text-amber-300">2</span> · <span className="text-amber-300">3</span> để chọn lá của bạn, đổi ý gõ lại số khác
              </div>
            ) : (
              <div className="text-[34px] font-semibold text-amber-100">Lá xuôi được trọn điểm · lá ngược được một nửa điểm</div>
            )}
          </div>
        </>
      ) : (
        <div className="absolute inset-x-[110px] top-[560px] rounded-[28px] bg-white/6 px-10 py-10 text-center ring-1 ring-white/12">
          <div className="text-[120px] leading-none">🏆</div>
          <div className="mt-4 text-[36px] font-semibold leading-snug text-amber-100">Vòng {L.round + 1} bắt đầu sau {L.secLeft} giây</div>
          <div className="mt-3 text-[29px] leading-relaxed text-fuchsia-100/85">Chuẩn bị gõ 1, 2 hoặc 3 để chọn lá may mắn của bạn nhé</div>
        </div>
      )}

      {/* Bảng xếp hạng Top May Mắn */}
      <div className="absolute inset-x-[70px] bottom-[64px]">
        <div className="mb-3 flex items-end justify-between">
          <div className="text-[30px] font-bold text-fuchsia-100">🏆 Top May Mắn</div>
          <div className="text-[26px] text-white/60">{L.totalPlayers} bạn đã có điểm · đã chơi {L.round} vòng</div>
        </div>
        {L.top.length === 0 ? (
          <div className="rounded-2xl bg-white/6 px-6 py-4 text-[28px] text-white/65 ring-1 ring-white/10">Chưa có điểm nào. Vòng đầu tiên đang chờ cả phòng chọn lá.</div>
        ) : (
          <div className="space-y-2">
            {L.top.slice(0, 5).map((t, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-2xl px-5 py-2.5 ring-1 ${i === 0 ? 'bg-amber-400/20 ring-amber-200/50' : 'bg-white/8 ring-white/12'}`}>
                <span className="w-[44px] text-[28px] font-extrabold text-amber-300">{i + 1}</span>
                {t.avatar ? <img src={t.avatar} alt="" className="h-[52px] w-[52px] rounded-full" /> : <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-800 text-[24px]">🍀</div>}
                <span className="min-w-0 flex-1 truncate text-[30px] font-semibold">{t.nickname}</span>
                <span className="text-[24px] text-white/55">lá cao nhất {t.best}</span>
                <span className="rounded-full bg-emerald-600/80 px-3.5 py-1 text-[26px] font-bold">{t.total} điểm</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 text-center text-[24px] text-white/45">{disclaimer}</div>
      </div>
    </>
  );
}

function LuckyCardSlot({ c, index }: { c: LuckyCardV; index: number }) {
  return (
    <div className="w-[290px]">
      <div className={`tcard h-[440px] w-[290px] ${c.faceUp ? 'flipped' : 'tcard-float'}`} style={{ animationDelay: `${index * 0.5}s` }}>
        <div className="tcard-inner">
          {/* Mặt úp */}
          <div className="tcard-face tcard-back flex flex-col items-center justify-center">
            <div className="text-[110px] leading-none">🌙</div>
            <div className="mt-2 text-[44px] text-amber-200">✦ ✦ ✦</div>
            <div className="mt-6 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-amber-300/90 text-[40px] font-extrabold text-indigo-950">{index + 1}</div>
            <div className="mt-3 rounded-full bg-black/40 px-4 py-1 text-[25px] font-semibold text-emerald-200">{c.count} bạn đã chọn</div>
          </div>
          {/* Mặt ngửa */}
          <div className="tcard-face tcard-backface tcard-front flex flex-col items-center px-4 py-5 text-center" style={{ background: `linear-gradient(165deg, ${c.c1}, ${c.c2})` }}>
            <div className="text-[26px] font-bold tracking-[0.25em] text-amber-200">{c.numeral}</div>
            <div className="mt-3 text-[104px] leading-none" style={c.reversed ? { transform: 'rotate(180deg)' } : undefined}>
              {c.symbol}
            </div>
            <div className="mt-3 text-[33px] font-extrabold leading-tight">{c.name}</div>
            <div className="text-[22px] italic text-white/75">{c.en}</div>
            <div className="mt-auto w-full">
              <div className="rounded-xl bg-black/45 px-3 py-2 text-[27px] font-extrabold text-amber-300">+{c.points} điểm · {c.count} bạn</div>
              <div className="mt-2 text-[20px] leading-snug text-white/85">{c.keywords}</div>
            </div>
            {c.reversed && <div className="absolute right-3 top-3 rotate-6 rounded-md bg-red-600 px-2.5 py-0.5 text-[21px] font-extrabold tracking-wider">NGƯỢC</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardSlot({ c, index, phase, picked }: { c: CardV; index: number; phase: TarotView['phase']; picked: number }) {
  const isPicked = phase === 'reveal' && picked === index;
  const dimmed = phase === 'reveal' && picked !== index;
  return (
    <div className={`w-[290px] transition-all duration-700 ${dimmed ? 'scale-[0.82] opacity-35' : ''} ${isPicked ? 'z-10 scale-[1.22]' : ''}`}>
      <div className={`tcard h-[440px] w-[290px] ${isPicked ? 'flipped' : ''} ${phase === 'offer' ? 'tcard-float' : ''}`} style={{ animationDelay: `${index * 0.5}s` }}>
        <div className={`tcard-inner ${isPicked ? 'tcard-picked' : ''}`}>
          {/* Mặt úp */}
          <div className="tcard-face tcard-back flex flex-col items-center justify-center">
            <div className="text-[110px] leading-none">🌙</div>
            <div className="mt-2 text-[44px] text-amber-200">✦ ✦ ✦</div>
            <div className="mt-6 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-amber-300/90 text-[40px] font-extrabold text-indigo-950">{index + 1}</div>
            <div className="mt-3 text-[24px] text-fuchsia-100/80">Gõ {index + 1} để chọn lá này</div>
          </div>
          {/* Mặt ngửa */}
          <div className="tcard-face tcard-backface tcard-front flex flex-col items-center px-4 py-5 text-center" style={{ background: `linear-gradient(165deg, ${c.c1}, ${c.c2})` }}>
            <div className="text-[26px] font-bold tracking-[0.25em] text-amber-200">{c.numeral}</div>
            <div className="mt-3 text-[104px] leading-none" style={c.reversed ? { transform: 'rotate(180deg)' } : undefined}>
              {c.symbol}
            </div>
            <div className="mt-3 text-[33px] font-extrabold leading-tight">{c.name}</div>
            <div className="text-[22px] italic text-white/75">{c.en}</div>
            <div className="mt-auto text-[21px] leading-snug text-white/85">{c.keywords}</div>
            {c.reversed && <div className="absolute right-3 top-3 rotate-6 rounded-md bg-red-600 px-2.5 py-0.5 text-[21px] font-extrabold tracking-wider">NGƯỢC</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
