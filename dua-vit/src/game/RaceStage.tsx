import { useMemo } from 'react';
import './race.css';
import type { RaceState } from './useRace';
import { GAME } from './config';
import { duckSvg, DUCK_COLORS } from './duckArt';

const MAX_ROWS = 13;
const fmt = (n: number) => n.toFixed(1).replace('.', ',');

export function RaceStage({ game }: { game: RaceState }) {
  const v = game.view;
  const bubbles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 137) % 100}%`,
        size: 8 + ((i * 31) % 16),
        delay: `${(i % 9) * 1.7}s`,
        dur: `${8 + (i % 5) * 2.2}s`,
      })),
    [],
  );
  const shown = (v?.racers ?? []).slice(0, MAX_ROWS);
  const hidden = (v?.racerCount ?? 0) - shown.length;
  const leader = v?.racers[0];
  const leaderM = leader ? (leader.distPct / 100) * GAME.trackM : 0;
  const remainM = Math.max(0, GAME.trackM - leaderM);

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#0b5fa5] font-sans text-white select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-[#35a3e8] via-[#1a86d8] to-[#0b5fa5]" />
      {bubbles.map((b, i) => (
        <div key={i} className="duck-bubble absolute rounded-full border-2 border-white/50" style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.dur }} />
      ))}

      {/* Thanh thông tin kiểu bảng điện tử hồ bơi */}
      <div className="absolute inset-x-0 top-0 z-20 bg-[#0a4d8f]/95 px-[28px] pb-[14px] pt-[20px] shadow-lg">
        <div className="flex items-center gap-[16px]">
          <div className="rounded-2xl bg-white/15 px-[18px] py-[8px] text-[40px]">🏆</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[40px] font-extrabold leading-tight">Đua Vịt · Chặng {v?.raceNo || 1}</div>
            <div className="text-[23px] text-sky-200">{v?.racerCount ?? 0} vịt đua · đường bơi {GAME.trackM}m</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-semibold tracking-wider text-sky-300">DẪN ĐẦU</div>
            <div className="max-w-[210px] truncate text-[30px] font-extrabold">{leader ? leader.nickname : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-semibold tracking-wider text-sky-300">CÒN LẠI</div>
            <div className="text-[30px] font-extrabold">{v && v.phase !== 'lobby' ? `${fmt(remainM)} m` : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-semibold tracking-wider text-sky-300">{v?.phase === 'lobby' ? 'XUẤT PHÁT SAU' : 'THỜI GIAN'}</div>
            <div className="text-[30px] font-extrabold">{v ? `${v.phaseRemainSec}s` : '—'}</div>
          </div>
        </div>
        <div className="relative mt-[12px] h-[34px] overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 transition-all duration-300" style={{ width: `${leader?.distPct ?? 0}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[22px] font-extrabold drop-shadow">
            {v && v.phase !== 'lobby' ? `${fmt(leaderM)} / ${GAME.trackM} m` : 'Đang chờ các tay đua xuống hồ…'}
          </div>
        </div>
      </div>

      {/* Banner pha chơi */}
      <div className="absolute inset-x-[60px] top-[212px] z-20 flex justify-center">
        {v?.phase === 'lobby' ? (
          <div className="race-pop rounded-[26px] bg-white/90 px-8 py-4 text-center text-[34px] font-extrabold text-slate-800 shadow-xl">
            Bình luận bất cứ chữ gì là có vịt đua mang tên bạn! 🦆
            <div className="text-[26px] font-bold text-sky-700">Xuất phát sau {v.phaseRemainSec}s · đã có {v.racerCount} vịt</div>
          </div>
        ) : v?.phase === 'podium' ? (
          <div className="race-pop rounded-[26px] bg-amber-400/95 px-8 py-4 text-center text-[38px] font-extrabold text-amber-950 shadow-2xl">🏆 BỤC VINH QUANG CHẶNG {v.raceNo}</div>
        ) : v?.event ? (
          <div className="race-word rounded-[26px] bg-rose-600/95 px-10 py-4 text-center shadow-2xl ring-4 ring-white/60">
            <span className="text-[44px] font-extrabold">📣 GÕ NGAY: {v.event.word}!</span>
            <span className="ml-3 text-[30px] font-bold text-rose-200">còn {v.event.remainSec}s</span>
          </div>
        ) : v?.tailwind.active ? (
          <div className="race-pop rounded-[26px] bg-cyan-500/90 px-8 py-4 text-center text-[36px] font-extrabold shadow-xl">🌊 SÓNG LỚN! Cả đoàn tăng tốc · còn {v.tailwind.remainSec}s</div>
        ) : (
          <div className="rounded-[26px] bg-slate-900/55 px-8 py-3 text-[29px] font-bold shadow-lg">Chờ khẩu lệnh tăng tốc tiếp theo… 👀</div>
        )}
      </div>

      {/* Hồ bơi */}
      <div className="absolute inset-x-[24px] top-[330px] z-10">
        <div className="relative overflow-hidden rounded-[26px] border-4 border-white/50 bg-gradient-to-b from-[#4db2f0]/80 to-[#1273c4]/85 pt-[24px] shadow-2xl">
          {/* vạch đích caro + nhãn ĐÍCH */}
          <div className="pointer-events-none absolute bottom-0 right-[52px] top-0 z-10 w-[16px] opacity-95" style={{ background: 'repeating-conic-gradient(#fff 0% 25%, #d92b2b 0% 50%) 0 0/16px 16px' }} />
          <div className="pointer-events-none absolute bottom-[10px] right-[6px] z-10 rounded bg-rose-600 px-1 py-2 text-[19px] font-extrabold [writing-mode:vertical-rl]">ĐÍCH</div>
          {/* mốc 50/100/150m */}
          {[25, 50, 75].map((pct) => (
            <div key={pct} className="pointer-events-none absolute bottom-0 top-0 z-0 border-l-[3px] border-dashed border-white/40" style={{ left: `calc(${pct * 0.9}% + 8px)` }} />
          ))}
          {shown.length === 0 && <div className="py-[120px] text-center text-[34px] font-bold text-white/90">Chưa có vịt nào xuống hồ — bình luận để là người đầu tiên! 🦆</div>}
          {shown.map((r, i) => (
            <div key={r.username} className="relative h-[92px]" style={{ background: i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,40,90,0.10)' }}>
              {/* phao phân làn đỏ-trắng-xanh */}
              <div className="absolute inset-x-0 bottom-0 h-[7px] opacity-80" style={{ background: 'repeating-linear-gradient(90deg,#e63950 0 16px,#ffffff 16px 32px,#2e9e5b 32px 48px,#ffffff 48px 64px)' }} />
              <div className="absolute bottom-[10px] left-[10px] z-10 rounded bg-black/45 px-2 text-[21px] font-bold">#{i + 1}</div>
              <div className="absolute top-[6px] z-10 transition-all duration-300 ease-linear" style={{ left: `calc(${Math.min(90, r.distPct * 0.9)}% - 6px)` }}>
                <div className="relative">
                  <div className={`absolute -top-[25px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-[10px] py-[1px] text-[20px] font-bold shadow ${r.place === 1 ? 'bg-amber-400 text-amber-950' : 'bg-slate-900/70 text-white'}`}>
                    {r.nickname}
                    {r.wins > 0 ? ` · 👑${r.wins}` : ''}
                  </div>
                  <div className={r.boosting ? 'race-bob' : 'duck-swim'}>
                    <svg viewBox="-70 -45 140 95" className="h-[76px] w-[112px] overflow-visible drop-shadow-[0_3px_4px_rgba(0,30,60,0.4)]">
                      <g dangerouslySetInnerHTML={{ __html: duckSvg(r.art, r.boosting) }} />
                    </svg>
                  </div>
                  {r.boosting && <div className="absolute -left-[38px] top-[22px] text-[26px]">💨</div>}
                  {r.place > 0 && (
                    <div className="race-pop absolute -right-[30px] -top-[16px] rounded-full bg-amber-400 px-2 py-[1px] text-[22px] font-extrabold text-amber-950 shadow">
                      {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : `#${r.place}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="relative flex justify-between px-[14px] py-[6px] text-[21px] font-bold text-sky-100">
            <span>0m</span>
            <span className="ml-[16%]">50m</span>
            <span>100m</span>
            <span className="mr-[12%]">150m</span>
          </div>
        </div>
        {hidden > 0 && <div className="mt-2 text-center text-[24px] font-semibold text-sky-100">…và {hidden} vịt nữa đang bơi ở các làn dưới 🏊</div>}
      </div>

      {/* Bục vinh quang */}
      {v?.phase === 'podium' && v.podium && (
        <div className="absolute inset-x-[90px] top-[400px] z-30 rounded-[30px] bg-slate-900/85 p-8 shadow-2xl ring-2 ring-amber-300/60 backdrop-blur">
          <div className="flex items-end justify-center gap-[36px]">
            {[v.podium.top[1], v.podium.top[0], v.podium.top[2]].map((t, i) =>
              t ? (
                <div key={i} className="w-[240px] text-center">
                  <svg viewBox="-70 -45 140 95" className="mx-auto h-[110px] w-[160px] overflow-visible">
                    <g dangerouslySetInnerHTML={{ __html: duckSvg(t.art) }} />
                  </svg>
                  <div className={`mx-auto mt-1 flex items-center justify-center rounded-t-2xl font-extrabold ${t.place === 1 ? 'h-[120px] bg-amber-400 text-[44px] text-amber-950' : t.place === 2 ? 'h-[88px] bg-slate-300 text-[36px] text-slate-800' : 'h-[64px] bg-orange-300 text-[32px] text-orange-950'}`}>
                    {t.place}
                  </div>
                  <div className="mt-2 truncate text-[26px] font-bold">{t.nickname}</div>
                  <div className="text-[21px] text-sky-300">{DUCK_COLORS[t.art % DUCK_COLORS.length].label}</div>
                </div>
              ) : (
                <div key={i} className="w-[240px]" />
              ),
            )}
          </div>
        </div>
      )}

      {/* Thông báo quà */}
      {game.lastGift && Date.now() - game.lastGift.at < 6000 && (
        <div key={game.lastGift.at} className="race-pop absolute inset-x-[150px] top-[1090px] z-30 rounded-2xl bg-fuchsia-700/85 px-6 py-3 text-center text-[29px] font-semibold ring-1 ring-amber-200/50">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
        </div>
      )}

      {/* Bảng Vua Vịt + thanh sóng lớn + hướng dẫn */}
      <div className="absolute inset-x-[36px] bottom-[26px] z-20 space-y-2.5">
        {v && v.top.length > 0 && (
          <div className="truncate rounded-2xl bg-black/40 px-5 py-2 text-[25px] text-amber-100/90 ring-1 ring-white/12">
            👑 <b>Vua Vịt buổi live:</b> {v.top.map((t) => `${t.nickname} (${t.totalWins}🏆)`).join(' · ')}
          </div>
        )}
        <div className="rounded-2xl bg-black/45 px-5 py-2.5 ring-1 ring-cyan-200/30">
          <div className="flex justify-between text-[24px] font-bold text-cyan-100">
            <span>🌊 Sóng lớn (cả phòng cùng đẩy)</span>
            <span>{v?.tailwind.meter ?? 0}/{v?.tailwind.goal ?? GAME.tailwindGoal} tim</span>
          </div>
          <div className="mt-1 h-[13px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 transition-all duration-500" style={{ width: `${((v?.tailwind.meter ?? 0) / (v?.tailwind.goal ?? GAME.tailwindGoal)) * 100}%` }} />
          </div>
        </div>
        <div className="rounded-2xl bg-black/50 px-5 py-3 text-center text-[27px] font-medium text-white/90 ring-1 ring-amber-200/25">
          💬 Bình luận là có vịt đua · thấy khẩu lệnh to thì gõ đúng chữ đó để vịt bốc tốc · đủ 150 tim cả phòng là có sóng lớn
        </div>
      </div>

      {!v && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 text-[34px]">Đang mở hồ bơi… 🦆</div>}
    </div>
  );
}
