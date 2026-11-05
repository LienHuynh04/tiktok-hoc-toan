import { useEffect, useState } from 'react';
import type { RaceState } from './useRace';
import { RACER_SHEET, RACER_NAMES, racerPos } from './racerArt';
import './race.css';

function Sprite({ art, size = 132 }: { art: number; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 0.75,
        backgroundImage: `url(${RACER_SHEET})`,
        backgroundSize: '300% 200%',
        backgroundPosition: racerPos(art),
        backgroundRepeat: 'no-repeat',
        filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
      }}
    />
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export function RaceStage({ game }: { game: RaceState }) {
  const view = game.view;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (!view) {
    return <div className="flex h-full w-full items-center justify-center bg-sky-950 text-3xl font-bold text-white">Đang dựng đường đua…</div>;
  }

  const shown = view.racers.slice(0, 12);
  const extra = view.racerCount - shown.length;
  const giftFresh = game.lastGift && now - game.lastGift.at < 6000 ? game.lastGift : null;
  const leaders = [...view.racers].sort((a, b) => b.distPct - a.distPct).slice(0, 5);

  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: 'linear-gradient(180deg,#38bdf8 0%,#7dd3fc 30%,#bae6fd 52%,#fef9c3 100%)' }}>
      {/* mây trôi */}
      <div className="race-cloud absolute top-[70px] text-[64px] opacity-80">☁️</div>
      <div className="race-cloud absolute top-[150px] text-[44px] opacity-60" style={{ animationDelay: '-22s' }}>☁️</div>
      <div className="absolute right-[60px] top-[46px] text-[76px]">🌤️</div>

      {/* tiêu đề */}
      <div className="absolute left-1/2 top-[30px] flex w-[980px] -translate-x-1/2 items-center justify-between">
        <div className="rounded-2xl border-4 border-white/80 bg-rose-600/95 px-6 py-3 text-[40px] font-extrabold tracking-wide shadow-xl">🏁 ĐUA THÚ SIÊU TỐC</div>
        <div className="rounded-2xl bg-slate-900/85 px-6 py-3 text-[32px] font-extrabold shadow-xl">
          {view.phase === 'lobby' ? `Xuất phát sau ${view.phaseRemainSec}s` : `Chặng ${view.raceNo}`}
        </div>
      </div>

      {/* banner khẩu lệnh / trạng thái */}
      <div className="absolute left-1/2 top-[138px] flex h-[150px] w-[980px] -translate-x-1/2 items-center justify-center">
        {view.event ? (
          <div className="race-pop rounded-[28px] border-4 border-amber-300 bg-slate-900/90 px-10 py-4 text-center shadow-2xl">
            <span className="text-[30px] font-bold text-amber-200">GÕ NGAY: </span>
            <span className="race-word inline-block text-[64px] font-extrabold text-amber-300">{view.event.word}</span>
            <span className="ml-4 rounded-full bg-rose-500 px-4 py-1 text-[28px] font-extrabold">{view.event.remainSec}s</span>
          </div>
        ) : view.tailwind.active ? (
          <div className="race-pop rounded-[28px] bg-sky-600/90 px-10 py-5 text-[44px] font-extrabold shadow-2xl">💨 GIÓ THUẬN — CẢ ĐOÀN TĂNG TỐC {view.tailwind.remainSec}s!</div>
        ) : view.phase === 'lobby' ? (
          <div className="rounded-[28px] bg-white/85 px-10 py-5 text-center text-[36px] font-extrabold text-slate-800 shadow-xl">
            Bình luận bất cứ chữ gì là có thú đua mang tên bạn! 🐱
          </div>
        ) : view.phase === 'podium' ? (
          <div className="rounded-[28px] bg-amber-400/95 px-10 py-5 text-[42px] font-extrabold text-amber-950 shadow-2xl">🏆 BỤC VINH QUANG CHẶNG {view.raceNo}</div>
        ) : (
          <div className="rounded-[28px] bg-slate-900/60 px-8 py-4 text-[32px] font-bold shadow-lg">Chờ khẩu lệnh tăng tốc tiếp theo… 👀</div>
        )}
      </div>

      {/* đường đua */}
      <div className="absolute left-1/2 top-[312px] w-[1000px] -translate-x-1/2">
        <div className="relative rounded-[26px] border-4 border-white/50 bg-gradient-to-b from-lime-500/90 to-green-600/90 px-3 py-3 shadow-2xl">
          <div className="pointer-events-none absolute bottom-3 right-[86px] top-3 w-[10px] rounded bg-[repeating-linear-gradient(180deg,#fff_0_22px,#111_22px_44px)] opacity-90" />
          {shown.length === 0 && <div className="py-16 text-center text-[34px] font-bold text-white/90">Chưa có tay đua nào — bình luận để là người đầu tiên!</div>}
          {shown.map((r, i) => (
            <div key={r.username} className="relative mb-2 h-[96px] overflow-hidden rounded-2xl" style={{ background: i % 2 ? 'rgba(120,53,15,0.55)' : 'rgba(146,64,14,0.55)' }}>
              <div className="absolute left-2 right-2 top-1/2 border-t-4 border-dashed border-white/35" />
              <div className="absolute bottom-1 left-2 rounded bg-black/45 px-2 text-[21px] font-bold">#{i + 1}</div>
              <div
                className="absolute top-[2px] transition-all duration-300 ease-linear"
                style={{ left: `calc(${Math.min(92, r.distPct * 0.92)}% - 6px)` }}
              >
                <div className={`relative ${r.boosting ? 'race-bob' : ''}`}>
                  {r.boosting && <div className="race-flame absolute -left-[38px] top-[30px] text-[38px]">🔥</div>}
                  <Sprite art={r.art} size={118} />
                  <div className="absolute -top-[24px] left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-slate-900/85 py-[2px] pl-[3px] pr-3 text-[21px] font-bold shadow">
                    {r.avatar ? (
                      <img src={r.avatar} alt="" className="h-[24px] w-[24px] rounded-full object-cover" />
                    ) : (
                      <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-indigo-500 text-[15px]">{r.nickname.slice(0, 1).toUpperCase()}</span>
                    )}
                    {r.nickname}
                    {r.place > 0 && <span>{MEDAL[r.place - 1] ?? '🏁'}</span>}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-1 right-[100px] rounded bg-black/45 px-2 text-[21px] font-bold">{Math.round(r.distPct)}%</div>
            </div>
          ))}
          {extra > 0 && <div className="pt-1 text-center text-[26px] font-bold text-white/95">… và {extra} tay đua nữa đang bám đuổi phía sau!</div>}
        </div>
      </div>

      {/* bảng dẫn đầu + gió thuận */}
      <div className="absolute left-1/2 top-[1580px] flex w-[980px] -translate-x-1/2 gap-4">
        <div className="flex-1 rounded-3xl bg-slate-900/85 px-6 py-4 shadow-xl">
          <div className="mb-2 text-[27px] font-extrabold">🔥 ĐANG DẪN ĐẦU</div>
          {leaders.length === 0 ? (
            <div className="text-[25px] text-slate-300">Chưa có ai…</div>
          ) : (
            leaders.map((r, i) => (
              <div key={r.username} className="flex items-center justify-between py-[3px] text-[26px] font-semibold">
                <span className="truncate">
                  {MEDAL[i] ?? `${i + 1}.`} {r.nickname} <span className="text-slate-400">({RACER_NAMES[r.art]})</span>
                </span>
                <span className="text-amber-300">{Math.round(r.distPct)}%</span>
              </div>
            ))
          )}
        </div>
        <div className="w-[330px] rounded-3xl bg-slate-900/85 px-6 py-4 shadow-xl">
          <div className="mb-2 text-[27px] font-extrabold">💨 GIÓ THUẬN</div>
          <div className="text-[25px] font-semibold text-slate-200">
            {view.tailwind.meter}/{view.tailwind.goal} tim
          </div>
          <div className="mt-2 h-[24px] overflow-hidden rounded-full bg-slate-700">
            <div className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-500" style={{ width: `${(view.tailwind.meter / view.tailwind.goal) * 100}%` }} />
          </div>
          <div className="mt-2 text-[23px] text-slate-300">Đủ tim là cả đoàn cùng tăng tốc {10} giây</div>
        </div>
      </div>

      {/* chân trang */}
      <div className="absolute bottom-[24px] left-1/2 w-[980px] -translate-x-1/2">
        {giftFresh && (
          <div className="race-pop mx-auto mb-3 w-fit rounded-full bg-pink-600/90 px-6 py-2 text-[27px] font-bold shadow-xl">🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn!</div>
        )}
        <div className="rounded-3xl border-4 border-white/60 bg-slate-900/90 px-6 py-4 text-center text-[29px] font-extrabold shadow-xl">
          {view.top[0] ? <>👑 Vua Tốc Độ: {view.top[0].nickname} — {view.top[0].totalWins} lần vô địch · </> : null}Đã đua {view.totals.races} chặng · {view.racerCount} tay đua
        </div>
      </div>

      {/* bục vinh quang */}
      {view.phase === 'podium' && view.podium && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60">
          <div className="race-pop w-[900px] rounded-[32px] border-4 border-amber-300 bg-slate-900/95 px-8 py-8 text-center shadow-2xl">
            <div className="mb-5 text-[52px] font-extrabold text-amber-300">🏆 BỤC VINH QUANG</div>
            <div className="flex items-end justify-center gap-6">
              {[1, 0, 2].map((idx) => {
                const t = view.podium!.top[idx];
                if (!t) return <div key={idx} className="w-[240px]" />;
                const h = idx === 0 ? 190 : idx === 1 ? 140 : 105;
                return (
                  <div key={idx} className="flex w-[240px] flex-col items-center">
                    <div className="text-[44px]">{MEDAL[idx]}</div>
                    <Sprite art={t.art} size={idx === 0 ? 190 : 150} />
                    <div className="mt-1 max-w-[230px] truncate text-[28px] font-extrabold">{t.nickname}</div>
                    <div className="mt-2 flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-amber-400 to-amber-600 pt-2 text-[30px] font-extrabold text-amber-950" style={{ height: h }}>
                      {idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-[28px] font-semibold text-slate-300">Chặng mới sắp xuất phát — bình luận để giữ chỗ đua!</div>
          </div>
        </div>
      )}
    </div>
  );
}
