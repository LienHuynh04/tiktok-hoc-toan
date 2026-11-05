import { useEffect, useState } from 'react';
import type { ArenaState } from './useArena';
import { MONSTER_SHEET, monsterPos } from './monsterArt';
import './arena.css';

const FIELD = 980; // cạnh sân đấu (px), tọa độ engine 0-100
const STANCE_META = {
  san: { icon: '⚔️', label: 'Săn' },
  an: { icon: '🍖', label: 'Ăn' },
  tron: { icon: '💨', label: 'Trốn' },
} as const;

function Sprite({ art, size }: { art: number; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${MONSTER_SHEET})`,
        backgroundSize: '300% 300%',
        backgroundPosition: monsterPos(art),
        backgroundRepeat: 'no-repeat',
        filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.4))',
      }}
    />
  );
}

export function ArenaStage({ game }: { game: ArenaState }) {
  const view = game.view;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (!view) {
    return <div className="flex h-full w-full items-center justify-center bg-[#14532d] text-3xl font-bold text-white">Đang dựng đấu trường…</div>;
  }

  const giftFresh = game.lastGift && now - game.lastGift.at < 6000 ? game.lastGift : null;
  const ringPct = (view.ring.r / 100) * 2; // đường kính vòng an toàn theo % cạnh sân (r là bán kính trên thang 100, sân 100x100)
  const aliveList = view.monsters.filter((m) => m.alive);

  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: 'linear-gradient(180deg,#052e16 0%,#14532d 45%,#166534 100%)' }}>
      {/* tiêu đề */}
      <div className="absolute left-1/2 top-[28px] flex w-[980px] -translate-x-1/2 items-center justify-between">
        <div className="rounded-2xl border-4 border-lime-300/80 bg-green-950/90 px-6 py-3 text-[38px] font-extrabold tracking-wide shadow-xl">👹 ĐẤU TRƯỜNG SINH TỒN</div>
        <div className="rounded-2xl bg-rose-600 px-6 py-3 text-[30px] font-extrabold shadow-xl">
          {view.phase === 'lobby' ? `Mở cổng sau ${view.phaseRemainSec}s` : view.phase === 'battle' ? `Vòng ${view.round} · còn ${view.aliveCount} quái` : `Vòng ${view.round} kết thúc`}
        </div>
      </div>

      {/* sân đấu */}
      <div className="absolute left-1/2 top-[140px] -translate-x-1/2" style={{ width: FIELD, height: FIELD }}>
        <div className="arena-poison absolute inset-0 rounded-[36px] border-4 border-purple-400/70 shadow-2xl" style={{ background: 'radial-gradient(circle at 50% 45%, #3b0764 0%, #2e1065 70%, #1e1b4b 100%)' }} />
        {/* vòng an toàn */}
        <div
          className="absolute rounded-full border-4 border-lime-300 shadow-[0_0_50px_rgba(163,230,53,0.45)] transition-all duration-500"
          style={{
            width: `${Math.min(100, ringPct * 100)}%`,
            height: `${Math.min(100, ringPct * 100)}%`,
            left: `${50 - Math.min(100, ringPct * 100) / 2}%`,
            top: `${50 - Math.min(100, ringPct * 100) / 2}%`,
            background: 'radial-gradient(circle at 50% 40%, #86efac 0%, #4ade80 55%, #22c55e 100%)',
          }}
        />
        {/* quái nhí */}
        {view.monsters.map((m) => {
          if (!m.alive) return null;
          const low = m.hp <= 30;
          return (
            <div key={m.username} className="absolute transition-all duration-300 ease-linear" style={{ left: `calc(${m.x}% - 40px)`, top: `calc(${m.y}% - 52px)`, width: 80 }}>
              <div className="relative mx-auto w-fit">
                <div className="arena-bob">
                  <Sprite art={m.art} size={72} />
                </div>
                <div className="absolute -right-3 -top-2 rounded-full bg-slate-900/85 px-[5px] text-[17px]">{STANCE_META[m.stance].icon}</div>
              </div>
              <div className="mx-auto mt-[1px] h-[9px] w-[64px] overflow-hidden rounded-full bg-slate-900/70">
                <div className="h-full transition-all duration-300" style={{ width: `${(m.hp / m.maxHp) * 100}%`, background: low ? '#f87171' : '#4ade80' }} />
              </div>
              <div className="mx-auto mt-[2px] w-fit max-w-[110px] truncate rounded-full bg-slate-900/85 px-2 py-[1px] text-center text-[16px] font-bold leading-tight">
                {m.nickname}
                {m.kills > 0 ? ` ·${m.kills}⚔️` : ''}
              </div>
            </div>
          );
        })}
        {view.phase === 'lobby' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex gap-2">
              {[0, 4, 8, 2, 6].map((a) => (
                <div key={a} className="arena-bob" style={{ animationDelay: `${a * 90}ms` }}>
                  <Sprite art={a} size={92} />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl bg-slate-950/80 px-8 py-4 text-center shadow-xl">
              <div className="text-[38px] font-extrabold">Cổng đấu trường sắp mở!</div>
              <div className="mt-1 text-[28px] font-semibold text-lime-200">Đã có {view.poolCount} bạn đăng ký — bình luận bất cứ chữ gì là vào trận!</div>
            </div>
          </div>
        )}
      </div>

      {/* tin hạ đối thủ */}
      <div className="absolute left-1/2 top-[1150px] flex h-[52px] w-[980px] -translate-x-1/2 items-center justify-center gap-2">
        {view.killFeed
          .filter((k) => now - k.at < 9000)
          .slice(0, 2)
          .map((k, i) => (
            <span key={`${k.at}-${i}`} className="arena-pop rounded-full bg-rose-700/90 px-5 py-2 text-[25px] font-bold shadow-lg">
              💥 {k.killer} vừa hạ {k.victim}!
            </span>
          ))}
      </div>

      {/* hướng dẫn thế đánh + mưa hồi phục */}
      <div className="absolute left-1/2 top-[1230px] flex w-[980px] -translate-x-1/2 gap-4">
        <div className="flex flex-1 gap-3">
          {(['san', 'an', 'tron'] as const).map((s) => (
            <div key={s} className="flex-1 rounded-3xl bg-slate-900/85 px-4 py-4 text-center shadow-xl">
              <div className="text-[40px]">{STANCE_META[s].icon}</div>
              <div className="text-[27px] font-extrabold">Gõ “{STANCE_META[s].label}”</div>
              <div className="text-[22px] leading-snug text-slate-300">{s === 'san' ? 'Lao vào đánh đối thủ gần nhất' : s === 'an' ? 'Né đánh nhau, từ từ hồi máu' : 'Chạy xa kẻ địch, né vòng độc'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 top-[1470px] w-[980px] -translate-x-1/2 rounded-3xl bg-slate-900/85 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between text-[26px] font-bold">
          <span>🌧️ MƯA HỒI PHỤC — đủ {view.heal.goal} tim là mọi quái +8 máu</span>
          <span>
            {view.heal.have}/{view.heal.goal}
          </span>
        </div>
        <div className="mt-2 h-[24px] overflow-hidden rounded-full bg-slate-700">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500" style={{ width: `${(view.heal.have / view.heal.goal) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[25px] font-semibold text-slate-200">
          <span>🏟️ {view.entrantCount} quái trong trận · {aliveList.length} còn sống</span>
          <span>{view.top[0] ? `👑 Vua Sinh Tồn: ${view.top[0].nickname} (${view.top[0].totalWins} vòng)` : 'Chưa có vua sinh tồn'}</span>
        </div>
      </div>

      {/* chân trang */}
      <div className="absolute bottom-[24px] left-1/2 w-[980px] -translate-x-1/2">
        {giftFresh && (
          <div className="arena-pop mx-auto mb-3 w-fit rounded-full bg-pink-600/90 px-6 py-2 text-[27px] font-bold shadow-xl">🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn!</div>
        )}
        <div className="rounded-3xl border-4 border-lime-300/60 bg-green-950/90 px-6 py-4 text-center text-[28px] font-extrabold shadow-xl">
          Đã đấu {view.totals.rounds} vòng · Quái của ai sống sót cuối cùng là vô địch! 🏆
        </div>
      </div>

      {/* bục vinh quang */}
      {view.phase === 'podium' && view.podium?.winner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60">
          <div className="arena-pop w-[880px] rounded-[32px] border-4 border-amber-300 bg-slate-900/95 px-8 py-8 text-center shadow-2xl">
            <div className="text-[50px] font-extrabold text-amber-300">🏆 VÔ ĐỊCH SINH TỒN</div>
            <div className="mt-3 flex justify-center">
              <Sprite art={view.podium.winner.art} size={230} />
            </div>
            <div className="mt-2 text-[44px] font-extrabold">{view.podium.winner.nickname}</div>
            <div className="mt-4 flex justify-center gap-3">
              {view.podium.top.map((t) => (
                <span key={t.place} className="rounded-full bg-white/12 px-5 py-2 text-[26px] font-bold">
                  {['🥇', '🥈', '🥉'][t.place - 1] ?? ''} {t.nickname} · hạ {t.kills}
                </span>
              ))}
            </div>
            <div className="mt-4 text-[27px] font-semibold text-slate-300">Vòng mới sắp mở cổng — bình luận để vào trận!</div>
          </div>
        </div>
      )}
    </div>
  );
}
