import type { IQState } from './useIQ';
import './iq.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export function IQStage({ game }: { game: IQState }) {
  const v = game.view;
  const timerPct = v && v.phase === 'ask' ? Math.max(0, Math.min(100, (v.secLeft / v.questionSec) * 100)) : 0;

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden text-white" style={{ background: 'radial-gradient(1100px 750px at 50% -10%, #155e75 0%, transparent 60%), radial-gradient(900px 700px at 90% 110%, #4c1d95 0%, transparent 55%), linear-gradient(180deg, #020617 0%, #0f172a 45%, #020617 100%)' }}>
      <div className="absolute left-1/2 top-[560px] text-[320px] opacity-[0.05]" style={{ transform: 'translateX(-50%)' }}>🧠</div>

      {/* Đầu trang */}
      <div className="absolute inset-x-0 top-[46px] text-center">
        <div className="font-['Dancing_Script'] text-[92px] leading-none text-cyan-300" style={{ textShadow: '0 4px 30px rgba(34,211,238,.45)' }}>
          {game.channelName}
        </div>
        <div className="mt-2 text-[30px] font-semibold uppercase tracking-[0.35em] text-violet-200/90">✦ Tính nhẩm đua tốc độ ✦</div>
        <div className="mx-auto mt-4 w-fit rounded-full bg-white/10 px-5 py-1.5 text-[24px] text-cyan-100/90 ring-1 ring-cyan-200/30">
          Gõ đáp án vào bình luận · 3 bạn đúng nhanh nhất có điểm
        </div>
      </div>

      {/* Thông báo quà */}
      {game.lastGift && Date.now() - game.lastGift.at < 6000 && (
        <div key={game.lastGift.at} className="iq-toast absolute inset-x-[90px] top-[300px] z-30 rounded-2xl bg-violet-700/85 px-6 py-3 text-center text-[30px] font-semibold ring-1 ring-cyan-200/50">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
        </div>
      )}

      {!v && <div className="absolute inset-0 flex items-center justify-center text-[34px] text-cyan-100/70">Đang mở sân chơi…</div>}

      {v && v.phase === 'board' ? (
        /* Chặng bảng xếp hạng */
        <div className="absolute inset-x-[80px] top-[330px]">
          <div className="text-center text-[64px] font-extrabold text-amber-300">🏆 Bảng xếp hạng</div>
          <div className="mt-2 text-center text-[30px] text-white/70">Sau {v.round} câu · {v.totalPlayers} bạn đã ghi điểm</div>
          <div className="mt-8 space-y-3">
            {v.top.map((t, i) => (
              <div key={i} className={`flex items-center gap-4 rounded-3xl px-6 py-4 ring-1 ${i === 0 ? 'bg-amber-400/20 ring-amber-200/60' : 'bg-white/8 ring-white/12'}`}>
                <span className="w-[56px] text-[36px]">{MEDALS[i] ?? `${i + 1}`}</span>
                {t.avatar ? <img src={t.avatar} alt="" className="h-[64px] w-[64px] rounded-full" /> : <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-cyan-800 text-[30px]">🧠</div>}
                <span className="min-w-0 flex-1 truncate text-[36px] font-bold">{t.nickname}</span>
                <span className="text-[26px] text-white/60">{t.correct} câu đúng</span>
                <span className="rounded-full bg-emerald-600/85 px-4 py-1.5 text-[30px] font-extrabold">{t.score}</span>
              </div>
            ))}
            {v.top.length === 0 && <div className="rounded-3xl bg-white/6 px-6 py-8 text-center text-[30px] text-white/65 ring-1 ring-white/10">Chưa có điểm nào, câu tiếp theo bắt đầu ngay đây.</div>}
          </div>
          <div className="mt-8 text-center text-[30px] text-cyan-200">Câu tiếp theo sau {v.secLeft} giây, chuẩn bị nhanh tay nhé!</div>
        </div>
      ) : v ? (
        <>
          {/* Thanh câu + đồng hồ */}
          <div className="absolute inset-x-[70px] top-[316px]">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-cyan-600/80 px-5 py-2 text-[30px] font-bold">Câu {v.round}</div>
              <div className="rounded-full bg-violet-600/80 px-5 py-2 text-[30px] font-bold">{v.tag}</div>
              {v.phase === 'ask' && (
                <div className={`rounded-full px-5 py-2 text-[30px] font-extrabold ${v.secLeft <= 5 ? 'iq-urgent bg-red-600' : 'bg-white/12'}`}>⏱ {v.secLeft}s</div>
              )}
              {v.phase === 'reveal' && <div className="rounded-full bg-emerald-600 px-5 py-2 text-[30px] font-bold">Đáp án</div>}
            </div>
            {v.phase === 'ask' && (
              <div className="mt-4 h-[16px] overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${v.secLeft <= 5 ? 'bg-red-500' : 'bg-cyan-400'}`} style={{ width: `${timerPct}%`, transition: 'width 0.3s linear' }} />
              </div>
            )}
          </div>

          {/* Đề bài */}
          <div className="absolute inset-x-[60px] top-[470px] text-center">
            {v.prompt.split('\n').map((line, i) => (
              <div key={i} className="text-[104px] font-extrabold leading-[1.15] tracking-tight text-white" style={{ textShadow: '0 6px 34px rgba(34,211,238,.35)' }}>
                {line}
              </div>
            ))}
            {v.phase === 'ask' && <div className="mt-4 text-[30px] text-cyan-100/80">Ai đúng và nhanh nhất? Gõ đáp án ngay vào bình luận</div>}
          </div>

          {/* Công bố đáp án */}
          {v.phase === 'reveal' && (
            <div className="iq-pop iq-glow absolute inset-x-[90px] top-[800px] rounded-[28px] bg-emerald-900/80 px-8 py-6 text-center ring-1 ring-emerald-300/50 backdrop-blur-sm">
              <div className="text-[40px] font-semibold text-emerald-200">Đáp án đúng</div>
              <div className="text-[110px] font-extrabold leading-none text-white">{v.answer}</div>
              {v.explain && <div className="mt-3 text-[29px] leading-relaxed text-emerald-100/90">{v.explain}</div>}
            </div>
          )}

          {/* Ai đã trả lời đúng */}
          {v.phase === 'ask' && (
            <div className="absolute inset-x-[70px] top-[830px]">
              {v.correct.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {v.correct.map((c, i) => (
                    <div key={i} className="iq-pop flex items-center gap-2.5 rounded-full bg-emerald-600/85 py-2 pl-3 pr-5 ring-1 ring-emerald-200/50" style={{ animationDelay: `${i * 0.08}s` }}>
                      <span className="text-[30px]">{MEDALS[c.rank - 1] ?? '✅'}</span>
                      {c.avatar ? <img src={c.avatar} alt="" className="h-[44px] w-[44px] rounded-full" /> : null}
                      <span className="max-w-[300px] truncate text-[29px] font-bold">{c.nickname}</span>
                      <span className="text-[27px] font-extrabold text-amber-300">+{c.points}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[30px] text-white/55">Chưa bạn nào trả lời đúng… nhanh tay lên!</div>
              )}
              {v.wrongCount > 0 && <div className="mt-4 text-center text-[26px] text-white/45">{v.wrongCount} bạn trả lời sai (mất chuỗi đúng liên tiếp)</div>}
            </div>
          )}

          {/* Bảng xếp hạng rút gọn */}
          <div className="absolute inset-x-[70px] bottom-[64px]">
            <div className="mb-3 flex items-end justify-between">
              <div className="text-[30px] font-bold text-cyan-100">🏆 Top điểm cao</div>
              <div className="text-[26px] text-white/60">{v.totalPlayers} bạn đã ghi điểm</div>
            </div>
            {v.top.length === 0 ? (
              <div className="rounded-2xl bg-white/6 px-6 py-4 text-[28px] text-white/65 ring-1 ring-white/10">Chưa có điểm nào. Trả lời đúng và nhanh để lên bảng nhé.</div>
            ) : (
              <div className="space-y-2">
                {v.top.slice(0, 5).map((t, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-2xl px-5 py-2.5 ring-1 ${i === 0 ? 'bg-amber-400/20 ring-amber-200/50' : 'bg-white/8 ring-white/12'}`}>
                    <span className="w-[44px] text-[28px] font-extrabold text-amber-300">{i + 1}</span>
                    {t.avatar ? <img src={t.avatar} alt="" className="h-[52px] w-[52px] rounded-full" /> : <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cyan-800 text-[24px]">🧠</div>}
                    <span className="min-w-0 flex-1 truncate text-[30px] font-semibold">{t.nickname}</span>
                    {t.streak >= 2 && <span className="rounded-full bg-red-600/80 px-3 py-1 text-[23px] font-bold">🔥 chuỗi {t.streak}</span>}
                    <span className="text-[24px] text-white/55">{t.correct} đúng</span>
                    <span className="rounded-full bg-emerald-600/80 px-3.5 py-1 text-[26px] font-bold">{t.score} điểm</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 text-center text-[24px] text-white/45">Game tính nhẩm giải trí, điểm số chỉ tính trong buổi live cho vui.</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
