import type { IQState } from './useIQ';
import type { IQView } from './iq';
import './iq.css';

const MEDALS = ['🥇', '🥈', '🥉'];
type TopRow = IQView['top'][number];
type CorrectRow = IQView['correct'][number];

/**
 * Sân khấu Tính Toán IQ Cao theo phong cách LỚP HỌC (như Lớp Toán):
 * bảng đen viết phấn ở giữa, cô giáo đứng cạnh bảng, học sinh là chính người chơi
 * (avatar + tên ngồi vào bàn, điểm hiện trên mặt bàn, trả lời đúng thì giơ tay).
 * Toàn bộ vẽ bằng CSS/SVG, không cần file ảnh.
 */
export function IQStage({ game }: { game: IQState }) {
  const v = game.view;
  const timerPct = v && v.phase === 'ask' ? Math.max(0, Math.min(100, (v.secLeft / v.questionSec) * 100)) : 0;
  const correctByName = new Map((v?.correct ?? []).map((c) => [c.nickname, c]));
  const seats: (TopRow | null)[] = [...(v?.top ?? [])];
  while (seats.length < 10) seats.push(null);

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden" style={{ background: 'linear-gradient(180deg, #f6e7c8 0%, #f3dfba 58%, #a9743f 58.2%, #96622f 100%)' }}>
      {/* sàn gỗ: vân ngang */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] opacity-25" style={{ background: 'repeating-linear-gradient(180deg, transparent 0 46px, rgba(60,32,8,.55) 46px 50px)' }} />
      {/* cửa sổ + đồng hồ trang trí trên tường */}
      <div className="absolute left-[36px] top-[120px] h-[150px] w-[170px] rounded-xl bg-[#bfe6f5] ring-8 ring-[#b07d4f]">
        <div className="absolute inset-y-0 left-1/2 w-[6px] bg-[#b07d4f]" />
        <div className="absolute inset-x-0 top-1/2 h-[6px] bg-[#b07d4f]" />
        <div className="absolute left-[18px] top-[14px] text-[44px]">☀️</div>
      </div>
      <div className="absolute right-[40px] top-[118px] flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white text-[52px] ring-8 ring-[#b07d4f]">🕐</div>

      {/* Bảng tên lớp bằng gỗ */}
      <div className="absolute inset-x-0 top-[30px] text-center">
        <div className="mx-auto w-fit rounded-2xl px-10 py-2 shadow-lg" style={{ background: 'linear-gradient(180deg, #c98d54, #a9743f)', border: '4px solid #7c4f24' }}>
          <span className="font-['Dancing_Script'] text-[76px] leading-none text-[#fff7d6]" style={{ textShadow: '0 3px 0 rgba(90,50,10,.45)' }}>
            {game.channelName}
          </span>
        </div>
        <div className="mt-2 text-[26px] font-bold uppercase tracking-[0.3em] text-[#7c4f24]">✦ Lớp tính nhẩm đua tốc độ ✦</div>
      </div>

      {/* Thông báo quà */}
      {game.lastGift && Date.now() - game.lastGift.at < 6000 && (
        <div key={game.lastGift.at} className="iq-toast absolute inset-x-[120px] top-[238px] z-40 rounded-2xl bg-[#7c3aed]/90 px-6 py-3 text-center text-[29px] font-semibold text-white ring-2 ring-amber-200/60">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
        </div>
      )}

      {!v && <div className="absolute inset-0 flex items-center justify-center text-[34px] font-semibold text-[#7c4f24]">Đang mở lớp…</div>}

      {v && (
        <>
          {/* Cô giáo đứng cạnh bảng */}
          <Teacher celebrating={v.phase === 'reveal' || v.phase === 'board'} />

          {/* Bảng đen */}
          <div className="absolute left-[238px] right-[36px] top-[300px] h-[660px] rounded-[18px] p-[14px] shadow-2xl" style={{ background: 'linear-gradient(180deg, #c98d54, #a9743f)' }}>
            <div className="relative h-full w-full overflow-hidden rounded-[10px] px-7 py-5" style={{ background: 'radial-gradient(900px 500px at 50% 0%, #2e6b52 0%, #1e4d3a 55%, #173d2e 100%)' }}>
              {v.phase === 'board' ? (
                <BoardContent v={v} />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#ffd84a] px-4 py-1 text-[27px] font-extrabold text-[#7a2e0e]">Câu {v.round}</span>
                    <span className="rounded-full border-2 border-[#f4f1e6]/70 px-4 py-1 text-[26px] font-bold text-[#f4f1e6]">{v.tag}</span>
                    {v.phase === 'ask' ? (
                      <span className={`rounded-full px-4 py-1 text-[28px] font-extrabold ${v.secLeft <= 5 ? 'iq-urgent bg-red-600 text-white' : 'bg-white/15 text-white'}`}>⏱ {v.secLeft}s</span>
                    ) : (
                      <span className="rounded-full bg-emerald-500 px-4 py-1 text-[27px] font-extrabold text-white">Đáp án</span>
                    )}
                  </div>
                  {v.phase === 'ask' && (
                    <div className="mt-3 h-[13px] overflow-hidden rounded-full bg-black/30">
                      <div className={`h-full rounded-full ${v.secLeft <= 5 ? 'bg-red-400' : 'bg-[#ffd84a]'}`} style={{ width: `${timerPct}%`, transition: 'width 0.3s linear' }} />
                    </div>
                  )}

                  {/* Đề viết phấn */}
                  <div className="mt-5 text-center">
                    {v.prompt.split('\n').map((line, i) => (
                      <div key={i} className="text-[74px] font-extrabold leading-[1.18] tracking-tight text-[#ffe680]" style={{ textShadow: '0 3px 0 rgba(0,0,0,.35)' }}>
                        {line}
                      </div>
                    ))}
                    {v.phase === 'ask' && <div className="mt-2 text-[27px] text-[#d9f2e2]/85">Cả lớp gõ đáp án vào bình luận, nhanh tay lên nào!</div>}
                  </div>

                  {v.phase === 'reveal' ? (
                    <div className="iq-pop mx-auto mt-5 max-w-[700px] rounded-2xl bg-black/35 px-6 py-4 text-center ring-1 ring-emerald-300/50">
                      <span className="text-[30px] font-semibold text-emerald-200">Đáp án đúng: </span>
                      <span className="text-[64px] font-extrabold leading-none text-white">{v.answer}</span>
                      {v.explain && <div className="mt-2 text-[26px] leading-snug text-emerald-100/90">{v.explain}</div>}
                    </div>
                  ) : (
                    <div className="mt-5">
                      {v.correct.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-2.5">
                          {v.correct.map((c, i) => (
                            <div key={i} className="iq-pop flex items-center gap-2 rounded-full bg-emerald-600/90 py-1.5 pl-2.5 pr-4 ring-1 ring-emerald-200/60" style={{ animationDelay: `${i * 0.08}s` }}>
                              <span className="text-[26px]">{MEDALS[c.rank - 1] ?? '✅'}</span>
                              <span className="max-w-[260px] truncate text-[26px] font-bold text-white">{c.nickname}</span>
                              <span className="text-[25px] font-extrabold text-[#ffd84a]">+{c.points}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-[27px] text-[#d9f2e2]/60">Chưa bạn nào trả lời đúng, cố lên cả lớp ơi…</div>
                      )}
                      {v.wrongCount > 0 && <div className="mt-3 text-center text-[24px] text-[#f4f1e6]/50">{v.wrongCount} bạn trả lời sai (mất chuỗi đúng liên tiếp)</div>}
                    </div>
                  )}
                  {/* phấn + khăn lau bảng trang trí */}
                  <div className="absolute bottom-3 right-5 flex gap-2 opacity-80">
                    <div className="h-[10px] w-[52px] rounded bg-white" />
                    <div className="h-[10px] w-[52px] rounded bg-[#ffd84a]" />
                    <div className="h-[16px] w-[64px] rounded bg-[#8a5a2b]" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Học sinh: 2 dãy bàn, bạn điểm cao ngồi bàn đầu */}
          <div className="absolute inset-x-[36px] top-[1030px]">
            {[0, 1].map((row) => (
              <div key={row} className="mb-[74px] flex justify-between">
                {seats.slice(row * 5, row * 5 + 5).map((s, i) => (
                  <Student key={i} s={s} correct={s ? correctByName.get(s.nickname) : undefined} isTop1={!!s && v.top[0]?.nickname === s.nickname} />
                ))}
              </div>
            ))}
          </div>

          {/* Chân trang */}
          <div className="absolute inset-x-0 bottom-[26px] flex items-end justify-between px-[44px]">
            <div className="rounded-full bg-black/35 px-5 py-1.5 text-[25px] font-semibold text-white">👥 {v.totalPlayers} bạn đã ghi điểm trong buổi</div>
            <div className="rounded-full bg-black/35 px-5 py-1.5 text-[24px] text-white/85">Game tính nhẩm giải trí, điểm chỉ tính trong buổi live</div>
          </div>
        </>
      )}
    </div>
  );
}

function BoardContent({ v }: { v: IQView }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-center text-[52px] font-extrabold text-[#ffd84a]">🏆 Bảng vàng của lớp</div>
      <div className="mt-1 text-center text-[26px] text-[#d9f2e2]/85">
        Sau {v.round} câu · {v.totalPlayers} bạn đã ghi điểm · Câu tiếp theo sau {v.secLeft} giây
      </div>
      <div className="mx-auto mt-4 w-full max-w-[680px] space-y-2">
        {v.top.map((t, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-2 ${i === 0 ? 'bg-[#ffd84a]/20 ring-1 ring-[#ffd84a]/70' : 'bg-white/8'}`}>
            <span className="w-[46px] text-[28px]">{MEDALS[i] ?? <span className="font-extrabold text-[#ffe680]">{i + 1}</span>}</span>
            {t.avatar ? <img src={t.avatar} alt="" className="h-[46px] w-[46px] rounded-full" /> : <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#2e6b52] text-[22px]">🧠</div>}
            <span className="min-w-0 flex-1 truncate text-[28px] font-bold text-white">{t.nickname}</span>
            <span className="text-[24px] text-[#d9f2e2]/70">{t.correct} câu đúng</span>
            <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-[26px] font-extrabold text-white">{t.score}</span>
          </div>
        ))}
        {v.top.length === 0 && <div className="py-8 text-center text-[28px] text-[#d9f2e2]/70">Chưa có điểm nào, câu tiếp theo bắt đầu ngay đây.</div>}
      </div>
    </div>
  );
}

function Student({ s, correct, isTop1 }: { s: TopRow | null; correct?: CorrectRow; isTop1: boolean }) {
  if (!s) {
    return (
      <div className="flex w-[186px] flex-col items-center opacity-45">
        <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-4 border-dashed border-[#7c4f24]/60 bg-[#f6e7c8] text-[34px] text-[#7c4f24]">?</div>
        <div className="mt-1.5 rounded-full bg-[#7c4f24]/50 px-3 py-0.5 text-[21px] font-semibold text-white">Ghế trống</div>
        <Desk score={null} />
      </div>
    );
  }
  return (
    <div className="relative flex w-[186px] flex-col items-center">
      {correct && <div className="iq-floatup absolute -top-[44px] z-10 text-[34px] font-extrabold text-emerald-700">+{correct.points}</div>}
      {isTop1 && <div className="absolute -top-[30px] left-[6px] z-10 text-[36px]">👑</div>}
      {correct && <div className="iq-wave absolute -top-[26px] right-[2px] z-10 text-[38px]">🙋</div>}
      {s.avatar ? (
        <img src={s.avatar} alt="" className={`h-[92px] w-[92px] rounded-full object-cover ${correct ? 'ring-4 ring-emerald-500' : 'ring-4 ring-white/70'}`} />
      ) : (
        <div className={`flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#2e6b52] text-[38px] font-extrabold text-white ${correct ? 'ring-4 ring-emerald-500' : 'ring-4 ring-white/70'}`}>
          {s.nickname.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="mt-1.5 max-w-[180px] truncate rounded-full bg-[#173d2e]/85 px-3 py-0.5 text-[22px] font-bold text-white">{s.nickname}</div>
      <Desk score={s.score} streak={s.streak} />
    </div>
  );
}

function Desk({ score, streak }: { score: number | null; streak?: number }) {
  return (
    <div className="relative mt-2 h-[92px] w-[184px]">
      <div className="absolute inset-x-0 top-0 h-[26px] rounded-t-lg" style={{ background: 'linear-gradient(180deg, #d9a05f, #b57e42)' }} />
      <div className="absolute inset-x-[6px] bottom-0 top-[22px] rounded-b-lg" style={{ background: 'linear-gradient(180deg, #a9743f, #8a5a2b)' }}>
        {score !== null && (
          <div className="flex h-full items-center justify-center gap-2">
            <span className="rounded-full bg-black/30 px-3 py-0.5 text-[24px] font-extrabold text-[#ffd84a]">{score} điểm</span>
            {streak !== undefined && streak >= 2 && <span className="rounded-full bg-red-600/85 px-2.5 py-0.5 text-[21px] font-bold text-white">🔥{streak}</span>}
          </div>
        )}
      </div>
      <div className="absolute left-[16px] top-[6px] h-[10px] w-[44px] rounded bg-[#e23b3b]" />
      <div className="absolute right-[16px] top-[6px] h-[10px] w-[36px] rounded bg-[#3b82e2]" />
    </div>
  );
}

/** Cô giáo vẽ bằng SVG: đứng cạnh bảng, pha công bố đáp án thì giơ tay chúc mừng */
function Teacher({ celebrating }: { celebrating: boolean }) {
  return (
    <div className="iq-bob absolute left-[16px] top-[420px] z-10 w-[210px]">
      <svg viewBox="0 0 210 540" className="w-full">
        {/* thước chỉ bảng */}
        <line x1={150} y1={215} x2={218} y2={150} stroke="#8a5a2b" strokeWidth={7} strokeLinecap="round" />
        {/* tóc búi + đầu */}
        <circle cx={105} cy={52} r={26} fill="#3a2a1a" />
        <circle cx={105} cy={104} r={46} fill="#ffd9b3" />
        <path d="M59 104 a46 46 0 0 1 92 0 l0 -14 a46 40 0 0 0 -92 0 z" fill="#3a2a1a" />
        <circle cx={88} cy={108} r={5} fill="#26221f" />
        <circle cx={122} cy={108} r={5} fill="#26221f" />
        <path d="M92 128 q13 10 26 0" stroke="#c2603e" strokeWidth={5} fill="none" strokeLinecap="round" />
        <circle cx={72} cy={122} r={7} fill="#ffb59e" opacity={0.8} />
        <circle cx={138} cy={122} r={7} fill="#ffb59e" opacity={0.8} />
        {/* thân: váy liền teal */}
        <path d="M105 150 L66 210 L56 400 L154 400 L144 210 Z" fill="#0f766e" />
        <path d="M56 400 L154 400 L164 452 L46 452 Z" fill="#0b5a54" />
        {/* tay phải cầm thước (giơ lên khi chúc mừng) */}
        <g style={{ transform: celebrating ? 'rotate(-24deg)' : 'rotate(0deg)', transformOrigin: '140px 205px', transition: 'transform .5s' }}>
          <path d="M140 205 L168 248" stroke="#ffd9b3" strokeWidth={17} strokeLinecap="round" />
        </g>
        {/* tay trái */}
        <path d="M70 208 L44 268" stroke="#ffd9b3" strokeWidth={17} strokeLinecap="round" />
        {/* chân + giày */}
        <rect x={80} y={452} width={16} height={52} fill="#ffd9b3" />
        <rect x={114} y={452} width={16} height={52} fill="#ffd9b3" />
        <path d="M72 504 h30 q6 14 -6 14 h-24 z" fill="#7c2d12" />
        <path d="M108 504 h30 q6 14 -6 14 h-24 z" fill="#7c2d12" />
        {/* sách cầm trước ngực */}
        <rect x={58} y={238} width={52} height={66} rx={5} fill="#e23b3b" transform="rotate(-8 84 271)" />
        <rect x={64} y={244} width={40} height={8} rx={3} fill="#ffd84a" transform="rotate(-8 84 271)" />
      </svg>
      <div className="mx-auto -mt-1 w-fit rounded-full bg-[#173d2e]/85 px-4 py-1 text-[23px] font-bold text-white">Cô giáo</div>
    </div>
  );
}
