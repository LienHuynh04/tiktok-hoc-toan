import { useEffect, useRef, useState } from 'react';
import type { KartState } from './useKart';
import { KART_COLORS } from './kart';
import { KartScene3D } from './kartScene';
import './kart.css';

const MEDAL = ['🥇', '🥈', '🥉'];
const hex = (i: number) => `#${(KART_COLORS[i] ?? 0x94a3b8).toString(16).padStart(6, '0')}`;

export function KartStage({ game }: { game: KartState }) {
  const view = game.view;
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<KartScene3D | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;
    const scene = new KartScene3D(mountRef.current);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setView(view);
  }, [view]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (!view) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-sky-400">
        <div ref={mountRef} className="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">Đang dựng đường đua…</div>
      </div>
    );
  }

  const giftFresh = game.lastGift && now - game.lastGift.at < 6000 ? game.lastGift : null;
  const giftCoins = giftFresh ? giftFresh.diamondCount * giftFresh.repeatCount : 0;
  const sorted = [...view.racers].sort((a, b) => (a.place || 99) - (b.place || 99) || b.dist - a.dist);
  const raceClock = view.phase === 'race' ? Math.max(0, view.trackM - view.leaderDist) : 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-400 text-white">
      <div ref={mountRef} className="absolute inset-0" />


      {/* tiêu đề + trạng thái chặng */}
      <div className="absolute left-[26px] top-[24px] flex items-start gap-3">
        <div className="rounded-2xl border-4 border-white/80 bg-rose-600/95 px-5 py-2 text-[34px] font-extrabold tracking-wide shadow-xl">
          🏎️ ĐUA XE KART
        </div>
      </div>
      <div className="absolute right-[26px] top-[24px] rounded-2xl bg-slate-900/85 px-5 py-2 text-right text-[28px] font-extrabold shadow-xl">
        {view.phase === 'lobby' && `Xuất phát sau ${view.phaseRemainSec}s`}
        {view.phase === 'countdown' && 'SẮN SÀNG…'}
        {view.phase === 'race' && `🏁 còn ${Math.round(raceClock)}m`}
        {view.phase === 'podium' && `Chặng ${view.raceNo} kết thúc`}
        <div className="text-[20px] font-bold text-sky-300">
          Chặng {Math.max(1, view.raceNo)} · {view.racerCount} tay đua
        </div>
      </div>

      {/* bảng xếp hạng trực tiếp */}
      {(view.phase === 'race' || view.phase === 'podium') && (
        <div className="absolute left-[26px] top-[118px] w-[330px] space-y-[6px]">
          {sorted.slice(0, 6).map((r, i) => (
            <div
              key={r.username}
              className={`flex items-center gap-2 rounded-xl px-3 py-[5px] text-[24px] font-bold shadow ${i === 0 ? 'bg-amber-400/95 text-slate-900' : 'bg-slate-900/70'}`}
            >
              <span className="w-[34px] text-center">{r.finished ? MEDAL[r.place - 1] ?? r.place : i + 1}</span>
              <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white/70" style={{ background: hex(r.color) }} />
              <span className="min-w-0 flex-1 truncate">{r.nickname}</span>
              {r.boosting && <span>🔥</span>}
              {r.shielded && <span>🛡️</span>}
              {r.slowed && <span>💫</span>}
              <span className="text-[20px] opacity-85">{r.finished ? 'ĐÍCH' : `${Math.round(r.dist)}m`}</span>
            </div>
          ))}
          {view.racerCount > 6 && <div className="pl-2 text-[20px] font-bold text-white/85">… và {view.racerCount - 6} tay đua nữa</div>}
        </div>
      )}

      {/* bản đồ đường đua thu nhỏ */}
      {(view.phase === 'race' || view.phase === 'countdown') && (
        <div className="absolute right-[30px] top-[150px] flex h-[560px] w-[54px] flex-col items-center">
          <div className="text-[24px]">🏁</div>
          <div className="relative w-[10px] flex-1 rounded-full bg-slate-900/45">
            {view.racers.map((r) => (
              <div
                key={r.username}
                className="absolute left-1/2 h-[20px] w-[20px] -translate-x-1/2 rounded-full border-2 border-white"
                style={{ background: hex(r.color), bottom: `calc(${(r.dist / view.trackM) * 100}% - 10px)` }}
              />
            ))}
          </div>
          <div className="text-[20px] font-bold">Vạch xuất phát</div>
        </div>
      )}

      {/* banner sự kiện */}
      {view.lastEvent && (
        <div key={view.lastEvent.at} className="kart-banner absolute left-1/2 top-[128px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/90 px-7 py-3 text-[30px] font-extrabold shadow-2xl">
          {view.lastEvent.text}
        </div>
      )}

      {/* banner quà — chỉ vinh danh */}
      {giftFresh && (
        <div
          className={`kart-pop absolute left-1/2 top-[210px] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-7 py-3 text-[28px] font-extrabold text-amber-950 shadow-2xl ${giftCoins >= 100 ? 'kart-vip' : ''}`}
        >
          🎁 {giftFresh.nickname} tặng {giftFresh.giftName}
          {giftCoins >= 100 ? ' — SIÊU TỐC VIP!' : giftCoins >= 30 ? ' — bốc tốc + chơi xấu xe trước!' : ' — bốc tốc!'}
        </div>
      )}

      {/* sảnh chờ */}
      {view.phase === 'lobby' && (
        <div className="absolute left-1/2 top-[300px] w-[900px] -translate-x-1/2 rounded-[28px] bg-slate-900/80 px-8 py-6 text-center shadow-2xl backdrop-blur-sm">
          <div className="text-[44px] font-extrabold text-amber-300">🏁 SẮP XUẤT PHÁT — {view.phaseRemainSec}s</div>
          <div className="mt-2 text-[30px] leading-snug">
            Bình luận <b className="text-sky-300">bất cứ chữ gì</b> là nhận ngay 1 chiếc kart mang tên mình!
          </div>
          <div className="mt-1 text-[26px] text-white/85">Vào giữa chặng vẫn đua được · Đua hoàn toàn miễn phí</div>
          {view.racerCount > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {view.racers.slice(0, 14).map((r) => (
                <span key={r.username} className="rounded-full bg-white/12 px-4 py-1 text-[24px] font-bold" style={{ border: `3px solid ${hex(r.color)}` }}>
                  {r.nickname}
                </span>
              ))}
              {view.racerCount > 14 && <span className="px-2 py-1 text-[24px]">+{view.racerCount - 14}</span>}
            </div>
          )}
        </div>
      )}

      {/* đếm ngược */}
      {view.phase === 'countdown' && (
        <div key={view.countdown} className="kart-count absolute left-1/2 top-[560px] -translate-x-1/2 text-[220px] font-black text-amber-300 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
          {view.countdown}
        </div>
      )}

      {/* bục vinh quang */}
      {view.phase === 'podium' && view.podium && (
        <div className="kart-pop absolute left-1/2 top-[330px] w-[880px] -translate-x-1/2 rounded-[28px] bg-slate-900/85 px-8 py-6 text-center shadow-2xl">
          <div className="text-[46px] font-extrabold text-amber-300">🏆 BỤC VINH QUANG — CHẶNG {view.raceNo}</div>
          <div className="mt-4 space-y-3">
            {view.podium.top.map((p) => (
              <div key={p.place} className="flex items-center justify-center gap-4 text-[36px] font-extrabold">
                <span className="text-[44px]">{MEDAL[p.place - 1]}</span>
                <span className="h-[26px] w-[26px] rounded-full border-[3px] border-white/80" style={{ background: hex(p.color) }} />
                <span>{p.nickname}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[26px] text-white/85">Chặng mới sắp bắt đầu — bình luận là nhận xe ngay!</div>
        </div>
      )}

      {/* thanh tim: nạp cho xe của người thả */}
      <div className="absolute bottom-[238px] left-[26px] w-[405px] rounded-2xl bg-slate-900/75 px-4 py-3 shadow-xl">
        <div className="flex items-center justify-between text-[25px] font-extrabold">
          <span>❤️ THẢ TIM = XE BẠN TĂNG TỐC</span>
        </div>
        <div className="mt-1 text-[21px] leading-snug text-white/85">
          Tim nạp nitro + tăng tốc nhẹ cho xe của người thả · Đã nhận <b className="text-pink-300">{view.totalLikes}</b> tim
        </div>
        <div className="mt-1 text-[21px] leading-snug text-white/85">
          🎁 Quà nhỏ: bốc tốc · Quà lớn: bốc tốc + chậm xe trước · 👑 VIP: SIÊU TỐC
        </div>
      </div>

      {/* bảng Vua Đường Đua + Người Ủng Hộ */}
      <div className="absolute bottom-[238px] right-[26px] flex gap-3">
        {view.top.length > 0 && (
          <div className="w-[292px] rounded-2xl bg-slate-900/75 px-4 py-3 shadow-xl">
            <div className="text-[24px] font-extrabold text-amber-300">🏆 VUA ĐƯỜNG ĐUA</div>
            {view.top.slice(0, 4).map((t, i) => (
              <div key={i} className="mt-1 flex items-center justify-between text-[22px] font-bold">
                <span className="min-w-0 flex-1 truncate">
                  {i + 1}. {t.nickname}
                </span>
                <span className="text-amber-200">{t.points}đ</span>
              </div>
            ))}
          </div>
        )}
        {view.supporters.length > 0 && (
          <div className="w-[292px] rounded-2xl bg-slate-900/75 px-4 py-3 shadow-xl">
            <div className="text-[24px] font-extrabold text-pink-300">💝 NGƯỜI ỦNG HỘ</div>
            {view.supporters.slice(0, 4).map((s, i) => (
              <div key={i} className="mt-1 flex items-center justify-between text-[22px] font-bold">
                <span className="min-w-0 flex-1 truncate">
                  {i + 1}. {s.nickname}
                </span>
                <span className="text-pink-200">{s.coins} xu</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* thanh hướng dẫn lái */}
      <div className="absolute bottom-[150px] left-1/2 w-[1010px] -translate-x-1/2 rounded-2xl bg-slate-900/80 px-5 py-3 text-center text-[25px] font-bold leading-snug shadow-xl">
        🕹️ Gõ <span className="text-sky-300">TRÁI / PHẢI</span> đổi làn · cán đệm nạp nitro · đầy thanh: <span className="text-amber-300">NITRO</span> bốc tốc ·{' '}
        <span className="text-rose-300">ĐẠN</span> chậm xe trước · <span className="text-emerald-300">KHIÊN</span> phòng thủ
      </div>

      {/* tên kênh */}
      <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/60 px-6 py-2 text-[24px] font-bold text-white/90">
        {game.channelName} · Chặng {Math.max(1, view.raceNo)} · Đã đua {view.totals.races} chặng
      </div>
    </div>
  );
}
