import { useEffect, useState } from 'react';
import type { NianState } from './useNian';
import { GAME } from './config';
import { FORM_NAMES } from './nian';
import { nianPos } from './nianArt';
import './nian.css';

// Sân khấu Tết 1080x1920: nền đêm giao thừa đỏ sẫm, đèn lồng + câu đối hai bên,
// Niên Thú (art AI 3 hình dạng) ở giữa, pháo nổ theo từng đòn, dây pháo = thanh tim.
const FORM_LABEL_COLOR = ['#7dd3fc', '#fdba74', '#fca5a5'] as const;

const KIND_LABEL: Record<string, string> = { math: '🧮 Tính nhanh', type: '⌨️ Gõ lại câu chúc', count: '🔢 Đếm đồ Tết' };

export function NianStage({ game }: { game: NianState }) {
  const view = game.view;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#450a0a] text-3xl font-bold text-amber-200">
        Đang thắp đèn lồng đón Tết…
      </div>
    );
  }

  const { boss } = view;
  const hpPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const hpColor = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#f87171';
  const lastHitAt = view.lastHits[0]?.at ?? 0;
  const shaking = now - lastHitAt < 650;
  const giftFresh = game.lastGift && now - game.lastGift.at < 6000 ? game.lastGift : null;

  return (
    <div className="relative h-full w-full overflow-hidden text-white" style={{ background: 'linear-gradient(180deg,#450a0a 0%,#7f1d1d 34%,#991b1b 62%,#7f1d1d 100%)' }}>
      {/* đốm sáng nền như pháo hoa xa */}
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-amber-200/40" style={{ left: (i * 197) % 1040 + 16, top: (i * 331) % 1700 + 16, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, opacity: 0.2 + (i % 4) * 0.1 }} />
      ))}
      {/* đèn lồng hai góc */}
      <div className="nian-lantern absolute left-[26px] top-[10px] text-[76px]">🏮</div>
      <div className="nian-lantern absolute right-[26px] top-[10px] text-[76px]" style={{ animationDelay: '0.7s' }}>🏮</div>
      {/* câu đối dọc hai bên */}
      <Couplet side="left" text="NIÊN THÚ SỢ PHÁO" />
      <Couplet side="right" text="CẢ LÀNG ĐÓN TẾT" />

      {/* tiêu đề */}
      <div className="absolute left-1/2 top-[30px] flex w-[860px] -translate-x-1/2 items-center justify-between">
        <div className="rounded-2xl border-4 border-amber-300/90 bg-[#450a0a]/85 px-6 py-3 text-[38px] font-extrabold tracking-wide text-amber-200 shadow-xl">
          🧨 ĐỐT PHÁO ĐUỔI NIÊN
        </div>
        <div className="rounded-2xl bg-amber-500 px-6 py-3 text-[32px] font-extrabold text-[#450a0a] shadow-xl">NIÊN CẤP {boss.level}</div>
      </div>

      {/* bong bóng thoại của Niên */}
      <div className="absolute left-1/2 top-[142px] h-[92px] w-[880px] -translate-x-1/2">
        {boss.taunt && now - boss.tauntAt < 6000 && (
          <div key={boss.tauntAt} className="boss-bubble mx-auto w-fit max-w-[860px] rounded-3xl bg-amber-50 px-7 py-4 text-center text-[32px] font-bold text-red-900 shadow-xl">
            🐲 “{boss.taunt}”
          </div>
        )}
      </div>

      {/* Niên Thú + pháo nổ + số sát thương */}
      <div className="absolute left-1/2 top-[228px] -translate-x-1/2">
        <div className="mb-1 text-center text-[46px] font-extrabold tracking-wide text-amber-100" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.65)' }}>
          NIÊN THÚ · {FORM_NAMES[boss.form]}
        </div>
        <div className="relative mx-auto h-[470px] w-[620px]">
          {boss.form === 2 && <div className="boss-aura absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(248,113,113,0.5) 0%, transparent 70%)' }} />}
          <div className={`h-full w-full ${shaking ? 'boss-hit' : ''}`} style={{ ...nianPos(boss.form), backgroundRepeat: 'no-repeat', filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.45))' }} />
          {view.lastHits.map((h, i) => (
            <div key={`${h.at}-${h.username}`} className="pointer-events-none absolute" style={{ left: 130 + ((h.username.charCodeAt(0) * 41 + i * 67) % 340), top: 40 + (i % 3) * 52 }}>
              <span className="text-[40px]">💥</span>
              <span
                className="boss-dmg font-extrabold"
                style={{ fontSize: h.crit ? 62 : 42, color: h.crit ? '#facc15' : '#fecaca', textShadow: '0 3px 10px rgba(0,0,0,0.8)' }}
              >
                −{h.dmg}
              </span>
            </div>
          ))}
          {view.meteor && (
            <>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="nian-cracker pointer-events-none absolute text-[46px]" style={{ left: 30 + i * 68, top: 6 + (i % 3) * 30, animationDelay: `${i * 90}ms` }}>
                  🧨
                </div>
              ))}
              <div className="boss-pop pointer-events-none absolute left-1/2 top-[196px] -translate-x-1/2 whitespace-nowrap text-[54px] font-extrabold text-amber-300" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.85)' }}>
                🧨 DÂY PHÁO NỔ! −{view.meteor.dmg}
              </div>
            </>
          )}
        </div>
        <div className="mt-1 text-center text-[25px] font-bold" style={{ color: FORM_LABEL_COLOR[boss.form] }}>
          {boss.form === 0 ? 'Nó vừa ngủ dậy, còn ngáp…' : boss.form === 1 ? 'Nó bắt đầu sợ pháo rồi!' : 'CUỒNG NỘ — pháo của cả phòng nổ x1,5 cho nó chạy lẹ!'}
        </div>
      </div>

      {/* thanh máu */}
      <div className="absolute left-1/2 top-[1000px] w-[900px] -translate-x-1/2">
        <div className="relative h-[52px] overflow-hidden rounded-full border-4 border-amber-200/80 bg-[#450a0a]/85 shadow-xl">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${hpColor}, ${hpColor}cc)` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[29px] font-extrabold tracking-wide" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            ❤️ {boss.hp.toLocaleString('vi-VN')} / {boss.maxHp.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* thẻ câu hỏi / công bố / ăn mừng */}
      <div className="absolute left-1/2 top-[1092px] w-[940px] -translate-x-1/2">
        <div className="rounded-[28px] border-4 border-amber-300/60 bg-[#2a0603]/88 px-8 py-6 shadow-2xl" style={{ minHeight: 296 }}>
          {view.phase === 'fight' && view.question && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-red-700 px-5 py-1 text-[27px] font-extrabold">CÂU {view.question.no}</span>
                <span className="text-[29px] font-bold text-amber-200">{KIND_LABEL[view.question.kind]}</span>
                <span className="rounded-full bg-amber-500 px-5 py-1 text-[27px] font-extrabold text-[#450a0a]">⏱ {view.question.remainSec}s</span>
              </div>
              <div className="mb-4 h-[15px] overflow-hidden rounded-full bg-white/15">
                <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${(view.question.remainSec / GAME.questionSec) * 100}%` }} />
              </div>
              <div
                className={`text-center font-extrabold leading-snug ${view.question.kind === 'count' ? 'text-[52px] tracking-[6px]' : view.question.kind === 'type' ? 'text-[54px] tracking-[2px] text-amber-300' : 'text-[82px]'}`}
                style={{ textShadow: '0 4px 14px rgba(0,0,0,0.65)', wordBreak: 'break-word' }}
              >
                {view.question.text}
              </div>
              <div className="mt-3 text-center text-[27px] font-semibold text-red-100/85">Gõ đáp án đúng = châm 1 quả pháo 🧨 · quả đầu tiên nổ gấp đôi!</div>
            </>
          )}
          {view.phase === 'reveal' && view.reveal && (
            <div className="boss-pop flex h-[248px] flex-col items-center justify-center text-center">
              <div className="text-[33px] font-bold text-emerald-300">✅ Đáp án: {view.reveal.answerText}</div>
              <div className="mt-3 text-[42px] font-extrabold">
                {view.reveal.hitsCount > 0 ? (
                  <>
                    {view.reveal.hitsCount} bạn châm trúng · tổng {view.reveal.totalDmg} sát thương 💥
                  </>
                ) : (
                  <>Chưa bạn nào châm trúng câu này 😅</>
                )}
              </div>
              {view.reveal.bestHit && (
                <div className="mt-2 text-[29px] font-semibold text-amber-300">Quả pháo to nhất: {view.reveal.bestHit.nickname} — {view.reveal.bestHit.dmg} điểm</div>
              )}
            </div>
          )}
          {view.phase === 'spawn' && (
            <div className="boss-pop flex h-[248px] flex-col items-center justify-center text-center">
              <div className="text-[62px]">🧨</div>
              <div className="mt-1 text-[44px] font-extrabold">Niên Thú cấp {boss.level} xuống núi!</div>
              <div className="text-[29px] font-semibold text-red-100/85">{boss.maxHp.toLocaleString('vi-VN')} máu — cả phòng sẵn sàng pháo!</div>
            </div>
          )}
          {view.phase === 'down' && view.down && (
            <div className="relative flex h-[248px] flex-col items-center justify-center text-center">
              <Fireworks />
              <div className="text-[48px] font-extrabold text-amber-300">🎆 NIÊN THÚ BỎ CHẠY RỒI!</div>
              <div className="mt-1 text-[31px] font-bold">Quả pháo kết liễu: {view.down.killer}</div>
              <div className="mt-2 flex gap-3">
                {view.down.mvp.map((m, i) => (
                  <span key={i} className="rounded-full bg-white/12 px-5 py-2 text-[26px] font-bold">
                    {['🥇', '🥈', '🥉'][i]} {m.nickname} · {m.damage}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* đội đốt pháo */}
      <div className="absolute left-1/2 top-[1446px] w-[940px] -translate-x-1/2">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[29px] font-extrabold tracking-wide">🧨 ĐỘI ĐỐT PHÁO ({view.fighterCount} bạn)</span>
          <span className="text-[25px] font-semibold text-red-100/80">xếp theo sát thương lên Niên này</span>
        </div>
        {view.fighters.length === 0 ? (
          <div className="rounded-3xl bg-white/8 px-6 py-8 text-center text-[29px] font-semibold text-red-50">Chưa ai châm pháo — gõ đáp án đúng là bạn lên hình ngay!</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {view.fighters.map((f) => {
              const justHit = view.lastHits.some((h) => h.username === f.username && now - h.at < 1600);
              return (
                <div key={f.username} className={`flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 ${justHit ? 'boss-just-hit' : ''}`}>
                  {f.avatar ? (
                    <img src={f.avatar} alt="" className="h-[50px] w-[50px] shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-[25px] font-extrabold" style={{ background: `hsl(${f.hue} 70% 45%)` }}>
                      {f.nickname.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-[23px] font-bold leading-tight">{f.nickname}</div>
                    <div className="text-[21px] font-semibold leading-tight text-amber-300">
                      💥 {f.damage}
                      {f.streak >= 3 && <span className="text-orange-400"> 🔥{f.streak}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* dây pháo (thanh tim) */}
      <div className="absolute left-1/2 top-[1686px] w-[900px] -translate-x-1/2">
        <div className="mb-2 flex justify-between text-[25px] font-bold">
          <span>🧨 DÂY PHÁO CẢ PHÒNG — đủ {view.rage.goal} tim là đốt dây pháo dài</span>
          <span>
            {view.rage.have}/{view.rage.goal}
          </span>
        </div>
        <div className="relative h-[30px] overflow-hidden rounded-full border-2 border-amber-200/70 bg-[#450a0a]/85">
          <div className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 transition-all duration-500" style={{ width: `${(view.rage.have / view.rage.goal) * 100}%` }} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[17px]">{'🧨'.repeat(14)}</div>
        </div>
      </div>

      {/* chân trang */}
      <div className="absolute bottom-[24px] left-1/2 w-[940px] -translate-x-1/2">
        {giftFresh && (
          <div className="boss-pop mx-auto mb-3 w-fit rounded-full bg-pink-600/90 px-6 py-2 text-[27px] font-bold shadow-xl">
            🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn!
          </div>
        )}
        <div className="rounded-3xl border-4 border-amber-300/70 bg-[#450a0a]/90 px-6 py-4 text-center shadow-xl">
          <span className="text-[29px] font-extrabold text-amber-100">
            🏆 Đã đuổi {view.totals.bossesDown} Niên · 🧨 {view.totals.hits} quả pháo trúng · Niên càng cao cấp càng khỏe!
          </span>
        </div>
      </div>

      {/* mưa lì xì khi Niên bỏ chạy */}
      {view.phase === 'down' && <LixiRain />}
    </div>
  );
}

function Couplet({ side, text }: { side: 'left' | 'right'; text: string }) {
  return (
    <div
      className={`absolute top-[300px] z-10 flex w-[64px] flex-col items-center gap-1 rounded-b-[14px] border-x-[3px] border-b-[3px] border-amber-400/80 bg-[#b91c1c]/92 py-4 shadow-xl ${side === 'left' ? 'left-[18px]' : 'right-[18px]'}`}
    >
      {text.replace(/ /g, '').split('').map((ch, i) => (
        <span key={i} className="text-[30px] font-extrabold leading-none text-amber-200" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

function Fireworks() {
  const bursts = [
    { left: 60, top: -30, delay: '0s', color: '#facc15' },
    { left: 760, top: -44, delay: '0.25s', color: '#f87171' },
    { left: 400, top: -60, delay: '0.5s', color: '#4ade80' },
  ];
  return (
    <>
      {bursts.map((b, i) => (
        <div key={i} className="pointer-events-none absolute" style={{ left: b.left, top: b.top }}>
          {Array.from({ length: 8 }).map((_, k) => (
            <span
              key={k}
              className="nian-fw-dot"
              style={{ background: b.color, transform: `rotate(${k * 45}deg) translateY(-8px)`, animationDelay: b.delay }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function LixiRain() {
  const items = ['🧧', '🧧', '🌸', '🧧', '✨', '🧧', '🌸', '🧧'];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[120px] z-40 h-[900px]">
      {items.map((s, i) => (
        <span key={i} className="nian-lixi absolute text-[44px]" style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.22}s` }}>
          {s}
        </span>
      ))}
    </div>
  );
}
