import { useEffect, useState } from 'react';
import type { BossState } from './useBoss';
import { GAME } from './config';
import './boss.css';

const FORM_STYLE = [
  { body: '#2dd4bf', dark: '#0f766e', label: 'Dạng thường', glow: 'rgba(45,212,191,0.35)' },
  { body: '#fb923c', dark: '#c2410c', label: 'Đang nổi giận', glow: 'rgba(251,146,60,0.45)' },
  { body: '#ef4444', dark: '#991b1b', label: 'CUỒNG NỘ — đòn x1,5', glow: 'rgba(239,68,68,0.55)' },
] as const;

const KIND_LABEL: Record<string, string> = { math: '🧮 Tính nhanh', type: '⌨️ Gõ lại cụm từ', count: '🔢 Đếm nhanh' };

function BossFigure({ form, shaking }: { form: 0 | 1 | 2; shaking: boolean }) {
  const c = FORM_STYLE[form];
  return (
    <div className={`relative mx-auto h-[500px] w-[560px] ${shaking ? 'boss-hit' : ''}`}>
      {form === 2 && <div className="boss-aura absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }} />}
      <svg viewBox="0 0 560 500" className="relative h-full w-full drop-shadow-2xl">
        {/* ăng-ten */}
        <line x1="280" y1="30" x2="280" y2="86" stroke={c.dark} strokeWidth="12" strokeLinecap="round" />
        <circle cx="280" cy="26" r="18" fill={form === 2 ? '#facc15' : '#f8fafc'} stroke={c.dark} strokeWidth="6" />
        {/* tay */}
        <path d="M70 300 Q20 250 44 190" fill="none" stroke={c.dark} strokeWidth="34" strokeLinecap="round" />
        <path d="M490 300 Q540 250 516 190" fill="none" stroke={c.dark} strokeWidth="34" strokeLinecap="round" />
        <circle cx="46" cy="182" r="30" fill={c.body} stroke={c.dark} strokeWidth="7" />
        <circle cx="514" cy="182" r="30" fill={c.body} stroke={c.dark} strokeWidth="7" />
        {/* thân */}
        <rect x="150" y="270" width="260" height="190" rx="46" fill={c.body} stroke={c.dark} strokeWidth="8" />
        <circle cx="280" cy="365" r="42" fill="#fef9c3" stroke={c.dark} strokeWidth="7" />
        <circle cx="280" cy="365" r="20" fill={form === 2 ? '#ef4444' : '#38bdf8'} className={form === 2 ? 'boss-aura' : undefined} />
        {/* đầu */}
        <rect x="110" y="80" width="340" height="215" rx="58" fill={c.body} stroke={c.dark} strokeWidth="8" />
        <rect x="140" y="112" width="280" height="120" rx="40" fill="#0f172a" />
        {form === 0 && (
          <>
            <circle cx="225" cy="166" r="17" fill="#7dd3fc" />
            <circle cx="335" cy="166" r="17" fill="#7dd3fc" />
            <path d="M245 202 Q280 224 315 202" fill="none" stroke="#7dd3fc" strokeWidth="8" strokeLinecap="round" />
          </>
        )}
        {form === 1 && (
          <>
            <path d="M196 138 L252 158" stroke="#fda4af" strokeWidth="10" strokeLinecap="round" />
            <path d="M364 138 L308 158" stroke="#fda4af" strokeWidth="10" strokeLinecap="round" />
            <circle cx="225" cy="176" r="14" fill="#fda4af" />
            <circle cx="335" cy="176" r="14" fill="#fda4af" />
            <path d="M248 214 L312 214" stroke="#fda4af" strokeWidth="8" strokeLinecap="round" />
          </>
        )}
        {form === 2 && (
          <>
            <path d="M202 140 L248 190 M248 140 L202 190" stroke="#f87171" strokeWidth="11" strokeLinecap="round" />
            <path d="M312 140 L358 190 M358 140 L312 190" stroke="#f87171" strokeWidth="11" strokeLinecap="round" />
            <path d="M238 216 L262 202 L286 216 L310 202 L322 214" fill="none" stroke="#f87171" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* tai nghe */}
        <rect x="88" y="150" width="26" height="80" rx="12" fill={c.dark} />
        <rect x="446" y="150" width="26" height="80" rx="12" fill={c.dark} />
      </svg>
    </div>
  );
}

const CONFETTI = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#e879f9', '#fb923c'];

export function BossStage({ game }: { game: BossState }) {
  const view = game.view;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#171233] text-3xl font-bold text-white">
        Đang dựng sàn đấu boss…
      </div>
    );
  }

  const { boss } = view;
  const fs = FORM_STYLE[boss.form];
  const hpPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const hpColor = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#f87171';
  const lastHitAt = view.lastHits[0]?.at ?? 0;
  const shaking = now - lastHitAt < 650;
  const giftFresh = game.lastGift && now - game.lastGift.at < 6000 ? game.lastGift : null;

  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: 'linear-gradient(180deg,#1e1b4b 0%,#312e81 42%,#4c1d95 78%,#581c87 100%)' }}>
      {/* sao nền */}
      {Array.from({ length: 26 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white/50" style={{ left: (i * 173) % 1040 + 20, top: (i * 389) % 1750 + 20, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, opacity: 0.25 + (i % 4) * 0.12 }} />
      ))}

      {/* tiêu đề */}
      <div className="absolute left-1/2 top-[34px] flex w-[980px] -translate-x-1/2 items-center justify-between">
        <div className="rounded-2xl border-4 border-amber-300/80 bg-[#1e1b4b]/85 px-6 py-3 text-[40px] font-extrabold tracking-wide shadow-xl">
          ⚔️ ĐẠI CHIẾN BOSS
        </div>
        <div className="rounded-2xl bg-rose-600 px-6 py-3 text-[34px] font-extrabold shadow-xl">BOSS CẤP {boss.level}</div>
      </div>

      {/* bong bóng thoại của boss */}
      <div className="absolute left-1/2 top-[150px] h-[92px] w-[900px] -translate-x-1/2">
        {boss.taunt && now - boss.tauntAt < 6000 && (
          <div key={boss.tauntAt} className="boss-bubble mx-auto w-fit max-w-[880px] rounded-3xl bg-white px-7 py-4 text-center text-[33px] font-bold text-slate-800 shadow-xl">
            {boss.emoji} “{boss.taunt}”
          </div>
        )}
      </div>

      {/* boss + số sát thương bay */}
      <div className="absolute left-1/2 top-[238px] -translate-x-1/2">
        <div className="mb-1 text-center text-[44px] font-extrabold tracking-wide" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.6)' }}>
          {boss.emoji} {boss.name}
        </div>
        <div className="mb-2 text-center text-[27px] font-bold" style={{ color: fs.body }}>
          {fs.label}
        </div>
        <div className="relative">
          <BossFigure form={boss.form} shaking={shaking} />
          {view.lastHits.map((h, i) => (
            <div
              key={`${h.at}-${h.username}`}
              className="boss-dmg pointer-events-none absolute font-extrabold"
              style={{
                left: 150 + ((h.username.charCodeAt(0) * 37 + i * 61) % 300),
                top: 60 + (i % 3) * 46,
                fontSize: h.crit ? 64 : 44,
                color: h.crit ? '#facc15' : '#fda4af',
                textShadow: '0 3px 10px rgba(0,0,0,0.75)',
              }}
            >
              −{h.dmg}
            </div>
          ))}
          {view.meteor && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="boss-star pointer-events-none absolute text-[52px]" style={{ left: 40 + i * 62, top: -30 - (i % 3) * 26, animationDelay: `${i * 70}ms` }}>
                  ☄️
                </div>
              ))}
              <div className="boss-pop pointer-events-none absolute left-1/2 top-[210px] -translate-x-1/2 whitespace-nowrap text-[58px] font-extrabold text-amber-300" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}>
                MƯA SAO BĂNG −{view.meteor.dmg}
              </div>
            </>
          )}
        </div>
      </div>

      {/* thanh máu */}
      <div className="absolute left-1/2 top-[1006px] w-[940px] -translate-x-1/2">
        <div className="relative h-[54px] overflow-hidden rounded-full border-4 border-white/70 bg-slate-900/80 shadow-xl">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${hpColor}, ${hpColor}cc)` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[30px] font-extrabold tracking-wide" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            ❤️ {boss.hp.toLocaleString('vi-VN')} / {boss.maxHp.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* thẻ câu hỏi / công bố / ăn mừng */}
      <div className="absolute left-1/2 top-[1100px] w-[980px] -translate-x-1/2">
        <div className="rounded-[28px] border-4 border-indigo-300/50 bg-slate-900/85 px-8 py-6 shadow-2xl" style={{ minHeight: 300 }}>
          {view.phase === 'fight' && view.question && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-indigo-500 px-5 py-1 text-[28px] font-extrabold">CÂU {view.question.no}</span>
                <span className="text-[30px] font-bold text-indigo-200">{KIND_LABEL[view.question.kind]}</span>
                <span className="rounded-full bg-rose-500 px-5 py-1 text-[28px] font-extrabold">⏱ {view.question.remainSec}s</span>
              </div>
              <div className="mb-4 h-[16px] overflow-hidden rounded-full bg-slate-700">
                <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${(view.question.remainSec / GAME.questionSec) * 100}%` }} />
              </div>
              <div
                className={`text-center font-extrabold leading-snug ${view.question.kind === 'count' ? 'text-[54px] tracking-[6px]' : view.question.kind === 'type' ? 'text-[56px] tracking-[3px] text-amber-300' : 'text-[84px]'}`}
                style={{ textShadow: '0 4px 14px rgba(0,0,0,0.6)', wordBreak: 'break-word' }}
              >
                {view.question.text}
              </div>
              <div className="mt-3 text-center text-[28px] font-semibold text-slate-300">Gõ đáp án đúng = đánh boss 1 đòn · đòn đầu tiên nhân đôi!</div>
            </>
          )}
          {view.phase === 'reveal' && view.reveal && (
            <div className="boss-pop flex h-[252px] flex-col items-center justify-center text-center">
              <div className="text-[34px] font-bold text-emerald-300">✅ Đáp án: {view.reveal.answerText}</div>
              <div className="mt-3 text-[44px] font-extrabold">
                {view.reveal.hitsCount > 0 ? (
                  <>
                    {view.reveal.hitsCount} bạn đánh trúng · tổng {view.reveal.totalDmg} sát thương 💥
                  </>
                ) : (
                  <>Chưa bạn nào đánh trúng câu này 😅</>
                )}
              </div>
              {view.reveal.bestHit && (
                <div className="mt-2 text-[30px] font-semibold text-amber-300">Đòn mạnh nhất: {view.reveal.bestHit.nickname} — {view.reveal.bestHit.dmg} điểm</div>
              )}
            </div>
          )}
          {view.phase === 'spawn' && (
            <div className="boss-pop flex h-[252px] flex-col items-center justify-center text-center">
              <div className="text-[64px]">{boss.emoji}</div>
              <div className="mt-1 text-[46px] font-extrabold">
                {boss.name} cấp {boss.level} xuất hiện!
              </div>
              <div className="text-[30px] font-semibold text-slate-300">{boss.maxHp.toLocaleString('vi-VN')} máu — cả phòng sẵn sàng!</div>
            </div>
          )}
          {view.phase === 'down' && view.down && (
            <div className="relative flex h-[252px] flex-col items-center justify-center text-center">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="boss-confetti pointer-events-none absolute h-[16px] w-[10px] rounded-sm" style={{ left: 30 + i * 66, top: -8, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 5) * 130}ms` }} />
              ))}
              <div className="text-[50px] font-extrabold text-amber-300">🏆 BOSS GỤC RỒI!</div>
              <div className="mt-1 text-[32px] font-bold">Đòn kết liễu: {view.down.killer}</div>
              <div className="mt-2 flex gap-3">
                {view.down.mvp.map((m, i) => (
                  <span key={i} className="rounded-full bg-white/12 px-5 py-2 text-[27px] font-bold">
                    {['🥇', '🥈', '🥉'][i]} {m.nickname} · {m.damage}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* đội đánh boss */}
      <div className="absolute left-1/2 top-[1452px] w-[980px] -translate-x-1/2">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[30px] font-extrabold tracking-wide">🛡️ ĐỘI ĐÁNH BOSS ({view.fighterCount} bạn)</span>
          <span className="text-[26px] font-semibold text-indigo-200">xếp theo sát thương lên boss này</span>
        </div>
        {view.fighters.length === 0 ? (
          <div className="rounded-3xl bg-white/8 px-6 py-8 text-center text-[30px] font-semibold text-indigo-100">Chưa ai ra đòn — gõ đáp án đúng là bạn lên hình ngay!</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {view.fighters.map((f) => {
              const justHit = view.lastHits.some((h) => h.username === f.username && now - h.at < 1600);
              return (
                <div key={f.username} className={`flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 ${justHit ? 'boss-just-hit' : ''}`}>
                  {f.avatar ? (
                    <img src={f.avatar} alt="" className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[26px] font-extrabold" style={{ background: `hsl(${f.hue} 70% 45%)` }}>
                      {f.nickname.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-[24px] font-bold leading-tight">{f.nickname}</div>
                    <div className="text-[22px] font-semibold leading-tight text-amber-300">
                      ⚔️ {f.damage}
                      {f.streak >= 3 && <span className="text-orange-400"> 🔥{f.streak}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* thanh nộ */}
      <div className="absolute left-1/2 top-[1692px] w-[940px] -translate-x-1/2">
        <div className="mb-2 flex justify-between text-[26px] font-bold">
          <span>⚡ THANH NỘ — đủ {view.rage.goal} tim là MƯA SAO BĂNG</span>
          <span>
            {view.rage.have}/{view.rage.goal}
          </span>
        </div>
        <div className="h-[30px] overflow-hidden rounded-full border-2 border-amber-200/60 bg-slate-900/80">
          <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500" style={{ width: `${(view.rage.have / view.rage.goal) * 100}%` }} />
        </div>
      </div>

      {/* chân trang */}
      <div className="absolute bottom-[26px] left-1/2 w-[980px] -translate-x-1/2">
        {giftFresh && (
          <div className="boss-pop mx-auto mb-3 w-fit rounded-full bg-pink-600/90 px-6 py-2 text-[28px] font-bold shadow-xl">
            🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn!
          </div>
        )}
        <div className="rounded-3xl border-4 border-amber-300/70 bg-[#1e1b4b]/90 px-6 py-4 text-center shadow-xl">
          <span className="text-[30px] font-extrabold">
            🏆 Đã hạ {view.totals.bossesDown} boss · 🎯 {view.totals.hits} đòn trúng · Boss càng cao cấp càng khỏe!
          </span>
        </div>
      </div>
    </div>
  );
}
