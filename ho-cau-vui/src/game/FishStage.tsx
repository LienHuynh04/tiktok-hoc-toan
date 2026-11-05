import { useMemo } from 'react';
import type { FishingState } from './useFishing';
import type { FishView } from './fishing';
import { SPECIES } from './fishing';
import './fish.css';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function AnglerFigure({ hue, flip, caught }: { hue: number; flip: boolean; caught: boolean }) {
  const hand: [number, number] = flip ? [40, 74] : [80, 74];
  const bob: [number, number] = flip ? [8, 108] : [112, 108];
  return (
    <svg viewBox="0 0 120 130" className={`h-full w-full ${caught ? 'catch-pop' : 'angler-bob'}`}>
      <line x1={hand[0]} y1={hand[1]} x2={bob[0]} y2={bob[1]} stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={bob[0]} cy={bob[1]} r="5.5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
      <rect x="47" y="104" width="10" height="18" rx="3" fill="#334155" />
      <rect x="63" y="104" width="10" height="18" rx="3" fill="#334155" />
      <rect x="44" y="60" width="32" height="48" rx="11" fill={`hsl(${hue} 55% 48%)`} />
      <circle cx="60" cy="45" r="15" fill="#f2c49b" />
      <polygon points="20,37 100,37 60,8" fill="#e8cf8f" />
      <ellipse cx="60" cy="38" rx="41" ry="6" fill="#dfc078" />
    </svg>
  );
}

function SpotlightOverlay({ spot }: { spot: NonNullable<FishView['spotlight']> }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: 3 + Math.random() * 92,
        size: 20 + Math.random() * 16,
        dur: 2.2 + Math.random() * 1.4,
        delay: Math.random() * 0.7,
        emoji: ['🎊', '✨', '⭐', '🎉'][i % 4],
      })),
    [spot.at],
  );
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#06182e]/96 px-8 text-center">
      {confetti.map((c) => (
        <span
          key={c.id}
          className="confetti"
          style={{ left: `${c.left}%`, fontSize: c.size, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          {c.emoji}
        </span>
      ))}
      <div className="spot-in flex flex-col items-center">
        <div className="rounded-full bg-amber-400 px-5 py-1.5 text-[24px] font-extrabold tracking-wide text-amber-950 shadow">
          ✨ TÂM ĐIỂM HỒ CÂU ✨
        </div>
        <div className="mt-4 h-[400px] w-[360px]">
          <AnglerFigure hue={spot.hue} flip={false} caught />
        </div>
        <div style={{ fontSize: Math.min(118, 52 + spot.w * 1.7) }} className="leading-none">
          🐠
        </div>
        <div className="mt-1 text-[28px] font-bold tracking-[0.3em] text-sky-300">🎉 CHÚC MỪNG 🎉</div>
        <div className="mt-1 flex max-w-full items-center gap-3">
          {spot.avatar ? (
            <img src={spot.avatar} alt="" className="h-14 w-14 flex-none rounded-full object-cover ring-2 ring-amber-300" />
          ) : (
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-sky-700 text-[26px] font-bold">
              {spot.nickname.slice(0, 1)}
            </span>
          )}
          <span className="truncate text-[46px] font-extrabold">{spot.nickname}</span>
        </div>
        <div className="text-[40px] font-extrabold text-amber-300">
          {spot.fish} · {spot.w} kg
        </div>
        <div className="mt-2 flex items-center gap-2 text-[22px]">
          <span className="rounded-full bg-white/10 px-3.5 py-1 font-semibold ring-1 ring-white/25">{spot.tier}</span>
          {spot.isRoundBest && (
            <span className="rounded-full bg-amber-400/20 px-3.5 py-1 font-bold text-amber-300 ring-1 ring-amber-300/50">
              👑 Con to nhất vòng!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FishStage({ game }: { game: FishingState }) {
  const { view, channelName } = game;
  const pondFish = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: 18 + ((i * 13) % 60),
        top: 30 + ((i * 17) % 42),
        size: 26 + ((i * 7) % 16),
        dur: 7 + i * 1.7,
        emoji: i % 2 ? '🐠' : '🐟',
        opacity: 0.5 + (i % 3) * 0.18,
      })),
    [],
  );

  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b2440] text-[30px] font-semibold text-sky-200">
        🎣 Hồ đang đổ nước…
      </div>
    );
  }

  const catchFresh = view.lastCatch && Date.now() - view.lastCatch.at < 5000;
  const joinFresh = view.lastJoin && Date.now() - view.lastJoin.at < 4000;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#081c33_0%,#0d2f52_46%,#0a2a47_100%)] text-white">
      {/* tiêu đề + note */}
      <header className="pt-5 text-center">
        <div className="text-[22px] font-medium tracking-wide text-sky-300/80">{channelName}</div>
        <h1 className="text-[56px] font-extrabold leading-none tracking-wide">
          🎣 HỒ CÁ <span className="text-amber-400">VUI</span>
        </h1>
        <div className="mx-auto mt-2.5 w-fit rounded-full border border-sky-300/40 bg-sky-950/70 px-5 py-1.5 text-[23px]">
          Comment <b className="text-amber-300">“câu”</b> xuống hồ · <b className="text-amber-300">“giật”</b> giật cần ·{' '}
          <b className="text-amber-300">“thả mồi”</b> dụ cá bu lại
        </div>
      </header>

      {/* thanh trạng thái */}
      <div className="mx-4 mt-3.5 flex items-stretch gap-2.5 text-[20px]">
        <div className="flex-1 rounded-2xl bg-white/8 px-3.5 py-2 ring-1 ring-white/12">
          <div className="flex justify-between font-semibold">
            <span>⭐ Cá hiếm {view.rareCount}/{view.rareGoal}</span>
            <span className="text-sky-300">mở hội khi đủ</span>
          </div>
          <div className="mt-1.5 h-[9px] overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(view.rareCount / view.rareGoal) * 100}%` }} />
          </div>
        </div>
        <div className="flex-1 rounded-2xl bg-white/8 px-3.5 py-2 ring-1 ring-white/12">
          <div className="flex justify-between font-semibold">
            <span>❤️ {view.likeMeter}/{view.likeGoal} tim</span>
            <span className="text-sky-300">{view.golden ? 'ĐANG CẮN LIÊN TỤC!' : 'cá cắn liên tục'}</span>
          </div>
          <div className="mt-1.5 h-[9px] overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${(view.likeMeter / view.likeGoal) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white/8 px-4 ring-1 ring-white/12">
          <span className="text-[24px] font-bold">⏱ {mmss(view.roundRemainSec)}</span>
        </div>
      </div>
      {view.roundBest && (
        <div className="mx-4 mt-2 text-center text-[21px] text-amber-200">
          👑 Cá to nhất vòng: <b>{view.roundBest.fish} {view.roundBest.w} kg</b> — {view.roundBest.nickname}
        </div>
      )}

      {/* 2 bảng: xếp hạng + loài cá */}
      <div className="mx-4 mt-3 flex gap-2.5">
        <section className="flex-1 rounded-3xl bg-[#0e3054]/90 p-3.5 ring-1 ring-white/12">
          <h2 className="mb-2 text-[23px] font-bold text-amber-300">🏆 Bảng xếp hạng</h2>
          {view.top.length === 0 && <div className="py-3 text-[20px] text-sky-200/70">Chưa ai giật được cá…</div>}
          {view.top.map((t, i) => (
            <div key={i} className="flex items-center gap-2 py-[3px] text-[21px]">
              <span className="w-7 text-center">{MEDALS[i]}</span>
              {t.avatar ? (
                <img src={t.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-[15px] font-bold">{t.nickname.slice(0, 1)}</span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{t.nickname}</span>
              <b className="text-amber-300">{t.totalKg} kg</b>
            </div>
          ))}
          <div className="mt-1.5 text-[16px] text-sky-300/70">Top 5 · Tổng kg câu được</div>
        </section>
        <section className="flex-1 rounded-3xl bg-[#0e3054]/90 p-3.5 ring-1 ring-white/12">
          <h2 className="mb-2 text-[23px] font-bold text-sky-300">🐠 Cá trong hồ</h2>
          {SPECIES.map((sp) => (
            <div key={sp.name} className="flex items-center gap-2 py-[1.5px] text-[19px]">
              <span className="h-3 w-3 flex-none rounded-full" style={{ background: sp.color }} />
              <span className="min-w-0 flex-1 truncate">{sp.name}</span>
              <span className="text-sky-200/80">
                {sp.min}–{sp.max} kg
              </span>
              <span className={sp.rare ? 'font-bold text-amber-300' : 'text-sky-300/70'}>{sp.tier.replace('Cá ', '')}</span>
            </div>
          ))}
        </section>
      </div>

      {/* hồ + cần thủ */}
      <div className="relative mx-2 mb-2 mt-2 flex-1">
        <div className="absolute left-1/2 top-[52%] h-[76%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,#3d7dc4_0%,#2563a8_45%,#17456f_100%)] shadow-[inset_0_10px_40px_rgba(255,255,255,0.15)] ring-4 ring-[#5b3a1a]/60" />
        <span className="absolute left-[16%] top-[38%] text-[34px] opacity-80">🪷</span>
        <span className="absolute left-[74%] top-[58%] text-[30px] opacity-80">🌿</span>
        <span className="absolute left-[58%] top-[30%] text-[26px] opacity-70">🪷</span>
        {pondFish.map((f) => (
          <span
            key={f.id}
            className="fish-swim absolute"
            style={{ left: `${f.left}%`, top: `${f.top}%`, fontSize: f.size, opacity: f.opacity, animationDuration: `${f.dur}s` }}
          >
            {f.emoji}
          </span>
        ))}

        {joinFresh && (
          <div className="banner-up absolute left-1/2 top-[16%] z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-sky-950/85 px-4 py-1.5 text-[22px] font-semibold ring-1 ring-sky-300/40">
            🎣 {view.lastJoin!.nickname} đã xuống hồ câu!
          </div>
        )}

        {view.anglers.map((a, i) => {
          const ang = (i / Math.max(1, view.anglers.length)) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + 46.5 * Math.cos(ang);
          const y = 52 + 41 * Math.sin(ang);
          const popFresh = a.popup && Date.now() - a.popup.at < 4000;
          const jerkFresh = a.act?.kind === 'jerk' && Date.now() - a.act.at < 1000;
          const baitFresh = a.act?.kind === 'bait' && Date.now() - a.act.at < 2500;
          return (
            <div key={a.username} className="absolute z-20 w-[106px]" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-90%)' }}>
              {a.crown && <div className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 text-[30px]">👑</div>}
              {a.justCaught && (
                <>
                  <div className="focus-ring pointer-events-none absolute left-1/2 top-[46%] z-0 h-[128px] w-[128px] rounded-full border-[5px] border-amber-300" />
                  <div className="ripple pointer-events-none absolute bottom-[16px] left-1/2 z-0 h-[26px] w-[74px] rounded-[50%] border-[3px] border-sky-100/90" />
                </>
              )}
              <div className={`relative z-10 h-[118px] transition-transform duration-300 ${a.justCaught ? 'scale-125' : ''} ${jerkFresh ? 'jerk-shake' : ''}`}>
                <AnglerFigure hue={a.hue} flip={x < 50} caught={a.justCaught} />
              </div>
              {baitFresh && (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[19px]">
                  <span className="sparkle inline-block">✨</span>
                  <span className="sparkle inline-block" style={{ animationDelay: '0.35s' }}>✨</span>
                </div>
              )}
              {popFresh && (
                <div
                  className={`absolute -top-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-2xl px-3 py-1.5 text-[17px] font-extrabold shadow-lg ${
                    a.popup!.kind === 'catch'
                      ? 'bg-amber-400 text-amber-950'
                      : a.popup!.kind === 'miss'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-sky-400 text-sky-950'
                  }`}
                >
                  {a.popup!.kind === 'catch' ? `🐠 ${a.popup!.fish} · ${a.popup!.w} kg!` : a.popup!.kind === 'miss' ? '💨 Hụt rồi!' : '✨ Đã thả mồi…'}
                  <div
                    className={`absolute -bottom-[6px] left-1/2 h-[13px] w-[13px] -translate-x-1/2 rotate-45 ${
                      a.popup!.kind === 'catch' ? 'bg-amber-400' : a.popup!.kind === 'miss' ? 'bg-slate-200' : 'bg-sky-400'
                    }`}
                  />
                </div>
              )}
              <div className="mx-auto -mt-1 flex w-fit max-w-[150px] items-center gap-1 rounded-full bg-slate-950/80 py-0.5 pl-0.5 pr-2.5 ring-1 ring-white/25">
                {a.avatar ? (
                  <img src={a.avatar} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-700 text-[12px] font-bold">{a.nickname.slice(0, 1)}</span>
                )}
                <span className="truncate text-[15px] font-semibold">{a.nickname}</span>
                {a.totalKg > 0 && <span className="flex-none text-[13px] font-bold text-amber-300">{a.totalKg}kg</span>}
              </div>
              {a.justCaught && <div className="absolute -top-3 right-0 text-[26px]">❗</div>}
            </div>
          );
        })}
        {view.anglerCount > view.anglers.length && (
          <div className="absolute bottom-[6%] left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-[18px]">
            và {view.anglerCount - view.anglers.length} cần thủ khác quanh hồ…
          </div>
        )}

        {catchFresh && (
          <div
            key={view.lastCatch!.at}
            className="banner-up absolute bottom-[3%] left-1/2 z-30 w-[74%] -translate-x-1/2 rounded-3xl bg-[linear-gradient(180deg,#fde68a,#f59e0b)] px-5 py-3 text-center text-amber-950 shadow-xl"
          >
            <div className="text-[21px] font-semibold">🎉 {view.lastCatch!.nickname} giật được</div>
            <div className="text-[34px] font-extrabold leading-tight">
              🐠 {view.lastCatch!.fish} · {view.lastCatch!.w} kg
            </div>
            <div className="text-[19px]">
              {view.lastCatch!.tier} · +{view.lastCatch!.w} kg vào bảng xếp hạng
            </div>
          </div>
        )}
      </div>

      {view.spotlight && <SpotlightOverlay spot={view.spotlight} />}

      {/* chân trang */}
      <footer className="flex items-center justify-between bg-[#07182c] px-5 py-2.5 text-[20px] text-sky-200">
        <span>🐟 Đã câu {view.totalFish} con · tổng {view.totalKg} kg</span>
        <span>🎣 {view.anglerCount} cần thủ đang câu</span>
        <span className="max-w-[34%] truncate">🏆 {view.top[0] ? `${view.top[0].nickname} · ${view.top[0].totalKg} kg` : '—'}</span>
      </footer>
    </div>
  );
}
