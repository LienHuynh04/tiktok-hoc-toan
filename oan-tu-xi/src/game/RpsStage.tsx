import { useState, type ReactNode } from 'react';
import type { RpsState } from './useRps';
import { CHOICE_META, BEAT_PHRASE, type Choice, type RpsView } from './rps';
import './rps.css';

function Avatar({ src, name, hue, size }: { src: string; name: string; hue: number; size: number }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return <img src={src} onError={() => setErr(true)} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: `hsl(${hue} 60% 45%)`, fontSize: size * 0.42 }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  );
}

/** Người chơi: bạn nhỏ áo màu theo từng người, tay giơ bảng đòn về phía giữa */
function PlayerFigure({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 220 400" className="h-full w-full">
      <rect x="76" y="262" width="26" height="98" rx="9" fill="#2563eb" />
      <rect x="118" y="262" width="26" height="98" rx="9" fill="#1d4ed8" />
      <rect x="68" y="356" width="40" height="16" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="112" y="356" width="40" height="16" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M64 150 Q110 128 156 150 L150 268 Q110 280 70 268 Z" fill={`hsl(${hue} 62% 48%)`} />
      <line x1="70" y1="168" x2="38" y2="238" stroke="#f2c49b" strokeWidth="15" strokeLinecap="round" />
      <circle cx="36" cy="244" r="10" fill="#f2c49b" />
      <line x1="150" y1="168" x2="196" y2="112" stroke="#f2c49b" strokeWidth="15" strokeLinecap="round" />
      <circle cx="198" cy="108" r="10" fill="#f2c49b" />
      <circle cx="110" cy="82" r="46" fill="#f2c49b" />
      <path d="M64 82 a46 46 0 0 1 92 0 l0 -10 a46 36 0 0 0 -92 0 Z" fill="#6b4226" />
      <circle cx="126" cy="80" r="4.2" fill="#1f2937" />
      <circle cx="148" cy="80" r="4.2" fill="#1f2937" />
      <path d="M126 100 Q138 108 149 99" stroke="#b3543f" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="152" cy="94" r="6" fill="#f9a8a8" opacity="0.75" />
    </svg>
  );
}

/** Chủ phòng: mũ đỏ đội ngược, kính râm, dây chuyền vàng — ngầu mà hài */
function HostFigure() {
  return (
    <svg viewBox="0 0 220 400" className="h-full w-full">
      <rect x="76" y="262" width="26" height="98" rx="9" fill="#374151" />
      <rect x="118" y="262" width="26" height="98" rx="9" fill="#1f2937" />
      <rect x="68" y="356" width="40" height="16" rx="7" fill="#dc2626" />
      <rect x="112" y="356" width="40" height="16" rx="7" fill="#b91c1c" />
      <path d="M64 150 Q110 128 156 150 L150 268 Q110 280 70 268 Z" fill="#111827" />
      <path d="M86 158 Q110 182 134 158" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="1 10" />
      <line x1="150" y1="168" x2="182" y2="238" stroke="#eab892" strokeWidth="15" strokeLinecap="round" />
      <circle cx="184" cy="244" r="10" fill="#eab892" />
      <line x1="70" y1="168" x2="24" y2="112" stroke="#eab892" strokeWidth="15" strokeLinecap="round" />
      <circle cx="22" cy="108" r="10" fill="#eab892" />
      <circle cx="110" cy="82" r="46" fill="#eab892" />
      <path d="M62 66 a48 40 0 0 1 96 0 l0 6 -96 0 Z" fill="#dc2626" />
      <rect x="30" y="52" width="52" height="13" rx="6" fill="#b91c1c" transform="rotate(-8 56 58)" />
      <rect x="66" y="70" width="88" height="24" rx="11" fill="#0f172a" />
      <rect x="74" y="75" width="26" height="7" rx="3.5" fill="#e2e8f0" opacity="0.55" />
      <path d="M84 108 Q110 118 136 108" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Bảng đòn cầm tay: que + vòng tròn chứa bàn tay */
function Sign({ emoji, cls, ring, dim }: { emoji: string; cls?: string; ring: string; dim?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${dim ? 'opacity-80' : ''}`}>
      <div className={`flex h-[178px] w-[178px] items-center justify-center rounded-full border-[7px] bg-[#fffdf4] shadow-xl ${ring}`}>
        <span className={`text-[100px] leading-none ${cls ?? ''}`}>{emoji}</span>
      </div>
      <div className="h-[86px] w-[13px] rounded-b-lg bg-gradient-to-b from-sky-400 to-sky-600 shadow" />
    </div>
  );
}

function HeartsBar({
  name,
  avatar,
  hearts,
  max,
  fillCls,
  align,
}: {
  name: string;
  avatar: ReactNode;
  hearts: number;
  max: number;
  fillCls: string;
  align: 'left' | 'right';
}) {
  return (
    <div className={`w-[492px] ${align === 'right' ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {avatar}
        <div className="max-w-[380px] truncate text-[30px] font-black text-[#5b3a14]">{name}</div>
      </div>
      <div className="mt-2 h-[30px] overflow-hidden rounded-full border-[3px] border-[#5b3a14]/50 bg-slate-800/60">
        <div className={`h-full rounded-full transition-all duration-700 ${fillCls}`} style={{ width: `${(hearts / max) * 100}%` }} />
      </div>
      <div className={`mt-1 text-[26px] tracking-[2px] ${align === 'right' ? 'text-right' : ''}`}>
        {Array.from({ length: max }, (_, i) => (i < hearts ? '❤️' : '🖤')).join(' ')}
      </div>
    </div>
  );
}

function moodBadge(view: RpsView, side: 'player' | 'host'): string | null {
  const d = view.duel;
  if (!d || (view.phase !== 'throw' && view.phase !== 'matchEnd')) return null;
  const o = view.phase === 'matchEnd' ? (d.matchOutcome === 'win' ? 'win' : 'lose') : d.throwOutcome;
  if (!o || o === 'draw') return o === 'draw' ? '😐' : null;
  const playerWon = o === 'win';
  return side === 'player' ? (playerWon ? '😆' : '😵') : playerWon ? '😱' : '😎';
}

export function RpsStage({ game }: { game: RpsState }) {
  const view = game.view;
  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 5000 ? game.lastGift : null;
  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#ffe9d2] text-[34px] font-bold text-[#7a4a1d]">
        Sàn đấu oẳn tù xì đang mở…
      </div>
    );
  }
  const d = view.duel;
  const reveal = view.phase === 'throw' || view.phase === 'matchEnd';
  const chantWord = view.phaseRemainSec >= 3 ? 'OẲN!' : view.phaseRemainSec === 2 ? 'TÙ!' : 'XÌ!';
  const playerSign = !d
    ? '✊'
    : view.phase === 'pick'
      ? d.hasPicked
        ? '🤫'
        : '❓'
      : view.phase === 'chant'
        ? '✊'
        : CHOICE_META[d.pick ?? 'bua'].emoji;
  const hostSign = !d ? '✊' : view.phase === 'pick' || view.phase === 'chant' ? '✊' : CHOICE_META[d.adminPick ?? 'bua'].emoji;
  const playerMood = moodBadge(view, 'player');
  const hostMood = moodBadge(view, 'host');
  const playerLostThrow = reveal && d?.throwOutcome === 'lose';
  const hostLostThrow = reveal && d?.throwOutcome === 'win';
  const top1 = view.top[0];

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(#ffe9d2 0%, #ffdcae 72%, #d99e5f 72.2%, #c68b45 100%)' }}>
      {/* ghế sofa làm nền sàn đấu */}
      <div className="absolute left-[90px] top-[600px] h-[430px] w-[900px] rounded-[60px] bg-[#a78bca] shadow-inner">
        <div className="absolute left-[36px] top-[26px] h-[190px] w-[400px] rounded-[40px] bg-[#b79fdd]" />
        <div className="absolute right-[36px] top-[26px] h-[190px] w-[400px] rounded-[40px] bg-[#b79fdd]" />
        <div className="absolute bottom-[24px] left-[36px] h-[130px] w-[400px] rounded-[32px] bg-[#9d7fc4]" />
        <div className="absolute bottom-[24px] right-[36px] h-[130px] w-[400px] rounded-[32px] bg-[#9d7fc4]" />
      </div>

      {/* tiêu đề */}
      <div className="absolute left-1/2 top-[20px] w-[860px] -translate-x-1/2 rounded-3xl border-[6px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-2.5 text-center shadow-lg">
        <div className="text-[50px] font-black leading-none text-[#7a4a1d]">
          🥊 OẲN TÙ XÌ <span className="align-middle text-[28px]">{view.musicOn ? '🎵' : '🔇'}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="rounded-full bg-[#7a4a1d] px-4 py-0.5 text-[22px] font-bold text-amber-50">
            Đấu với chủ phòng · Vòng {view.session} · Trận {Math.min(view.matchNo + (d ? 1 : 0), view.matchesPerSession)}/{view.matchesPerSession}
          </span>
          {d?.suddenDeath && view.phase !== 'matchEnd' && (
            <span className="rounded-full bg-rose-600 px-4 py-0.5 text-[22px] font-bold text-white">⚡ ĐỘT TỬ</span>
          )}
        </div>
      </div>

      {/* thanh tim hai bên */}
      <div className="absolute left-[36px] top-[168px]">
        <HeartsBar
          name={d ? d.nickname : 'NGƯỜI CHƠI'}
          avatar={
            d ? (
              <Avatar src={d.avatar} name={d.nickname} hue={d.hue} size={72} />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-400 text-[36px]">🧑</div>
            )
          }
          hearts={d ? d.playerHearts : view.duel?.maxHearts ?? 3}
          max={3}
          fillCls="bg-gradient-to-r from-sky-500 to-cyan-400"
          align="left"
        />
      </div>
      <div className="absolute right-[36px] top-[168px]">
        <HeartsBar
          name="CHỦ PHÒNG"
          avatar={<div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-900 text-[40px] ring-4 ring-rose-400">🕶️</div>}
          hearts={d ? d.hostHearts : 3}
          max={3}
          fillCls="bg-gradient-to-r from-pink-500 to-rose-400"
          align="right"
        />
      </div>
      <div className="absolute left-1/2 top-[212px] flex h-[64px] w-[64px] -translate-x-1/2 items-center justify-center rounded-full bg-[#eab308] text-[24px] font-black text-[#713f12] shadow-lg">
        VS
      </div>

      {/* bong bóng thoại của chủ phòng */}
      {d?.taunt && reveal && (
        <div className="rps-bubble absolute right-[120px] top-[392px] z-20 max-w-[430px] rounded-3xl bg-white px-5 py-3 text-[25px] font-bold leading-snug text-slate-800 shadow-xl">
          {d.taunt.text}
          <div className="absolute -bottom-[10px] right-[60px] h-[22px] w-[22px] rotate-45 bg-white" />
        </div>
      )}
      {view.phase === 'chant' && (
        <div className="absolute left-1/2 top-[400px] z-20 -translate-x-1/2 text-[88px] font-black tracking-wide text-[#7a4a1d] drop-shadow-[0_4px_0_rgba(255,255,255,0.65)]">
          {chantWord}
        </div>
      )}
      {view.phase === 'pick' && d && (
        <div className="absolute left-1/2 top-[418px] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-6 py-2 text-[27px] font-bold text-white shadow">
          {d.hasPicked ? `🤫 ${d.nickname} đã khóa đòn!` : `⏳ ${d.nickname} ơi, gõ đòn đi! còn ${view.phaseRemainSec}s`}
          {d.throwNo > 1 && <span className="text-amber-300"> · Lượt ném {d.throwNo}</span>}
        </div>
      )}
      {!d && view.phase === 'idle' && (
        <div className="absolute left-1/2 top-[418px] z-20 w-[760px] -translate-x-1/2 text-center">
          <div className="inline-block rounded-3xl bg-white px-6 py-3 text-[28px] font-bold text-slate-800 shadow-xl">
            Ai thách đấu chủ phòng không? Gõ <span className="text-rose-600">KÉO · BÚA · BAO</span> là vào trận! 😎
          </div>
          {view.lastResult && (
            <div className="mt-3 text-[24px] font-semibold text-[#7a4a1d]">
              Trận trước: {view.lastResult.nickname} {view.lastResult.outcome === 'win' ? 'thắng chủ phòng 🎉' : 'thua, đang ở ghế chờ 🪑'}
            </div>
          )}
        </div>
      )}

      {/* nhân vật + bảng đòn */}
      <div className={`absolute left-[64px] top-[560px] h-[520px] w-[290px] ${playerLostThrow ? 'rps-wobble' : ''} ${view.phase === 'chant' ? 'rps-bob' : ''}`}>
        <PlayerFigure hue={d?.hue ?? 210} />
        {playerMood && <div className="absolute -top-4 right-2 text-[52px]">{playerMood}</div>}
      </div>
      <div className={`absolute right-[64px] top-[560px] h-[520px] w-[290px] ${hostLostThrow ? 'rps-wobble' : ''} ${view.phase === 'chant' ? 'rps-bob' : ''}`}>
        <HostFigure />
        {hostMood && <div className="absolute -top-4 left-2 text-[52px]">{hostMood}</div>}
      </div>
      <div className="absolute left-[352px] top-[520px] z-10">
        <Sign
          emoji={playerSign}
          cls={view.phase === 'chant' ? 'rps-pump' : reveal ? 'rps-pop' : view.phase === 'pick' && !d?.hasPicked ? 'rps-pulse-soft' : undefined}
          ring={hostLostThrow ? 'border-lime-400' : 'border-sky-400'}
        />
      </div>
      <div className="absolute right-[352px] top-[520px] z-10">
        <Sign
          emoji={hostSign}
          cls={view.phase === 'chant' ? 'rps-pump' : reveal ? 'rps-pop' : undefined}
          ring={playerLostThrow ? 'border-lime-400' : 'border-rose-400'}
        />
      </div>

      {/* câu kết lượt ném / dấu đóng trận */}
      {reveal && d && view.phase === 'throw' && (
        <div className="absolute left-1/2 top-[1010px] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-6 py-2 text-[28px] font-black text-white shadow">
          {d.throwOutcome === 'draw'
            ? '🤝 HÒA! Ném lại'
            : `${BEAT_PHRASE[d.throwOutcome === 'win' ? `${d.pick}-${d.adminPick}` : `${d.adminPick}-${d.pick}`]}! ${d.throwOutcome === 'win' ? 'Chủ phòng' : d.nickname} mất 1 tim 💔`}
        </div>
      )}
      {view.phase === 'matchEnd' && d && (
        <div
          className={`rps-stamp absolute left-1/2 top-[960px] z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border-[6px] px-8 py-3 text-[44px] font-black shadow-2xl ${
            d.matchOutcome === 'win' ? 'border-lime-500 bg-lime-400 text-lime-950' : 'border-rose-500 bg-rose-500 text-white'
          }`}
        >
          {d.matchOutcome === 'win' ? `🏆 ${d.nickname} THẮNG TRẬN!` : '💥 K.O.! RA GHẾ CHỜ'}
        </div>
      )}

      {/* thanh chọn đòn */}
      <div className="absolute left-1/2 top-[1152px] w-[900px] -translate-x-1/2 rounded-3xl border-[5px] border-[#7a4a1d] bg-[#a97a44] px-6 py-3 shadow-lg">
        <div className="flex items-center justify-around">
          {(Object.keys(CHOICE_META) as Choice[]).map((c) => {
            const isPlayer = reveal && d?.pick === c;
            const isHost = reveal && d?.adminPick === c;
            return (
              <div
                key={c}
                className={`flex items-center gap-3 rounded-2xl px-5 py-2 ${view.phase === 'pick' ? 'rps-pulse-soft bg-[#f6e3b4]' : 'bg-[#f6e3b4]/85'} ${
                  isPlayer ? 'ring-4 ring-sky-400' : ''
                } ${isHost ? 'ring-4 ring-rose-400' : ''}`}
              >
                <span className="text-[52px] leading-none">{CHOICE_META[c].emoji}</span>
                <span className="text-[26px] font-black text-[#7a4a1d]">{CHOICE_META[c].name.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 text-center text-[21px] font-bold text-amber-100">
          {view.phase === 'pick' ? '👆 Gõ đòn của bạn: KÉO · BÚA · BAO' : 'Búa đập Kéo · Kéo cắt Bao · Bao trùm Búa'}
        </div>
      </div>

      {/* khán giả + hàng chờ */}
      <div className="absolute left-[40px] right-[40px] top-[1392px]">
        <div className="text-[23px] font-black text-[#7a4a1d]">
          👀 KHÁN GIẢ ({view.studentCount}){view.queue.length ? ` · Hàng chờ thách đấu: ${view.queue.map((q) => q.nickname).join(' · ')}` : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {view.students.slice(0, 10).map((s) => (
            <div
              key={s.username}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 shadow ${s.dueling ? 'bg-amber-300 ring-2 ring-amber-500' : 'bg-white/85'}`}
            >
              <Avatar src={s.avatar} name={s.nickname} hue={s.hue} size={38} />
              <span className="max-w-[150px] truncate text-[19px] font-bold text-slate-700">
                {s.dueling ? '⚔️ ' : ''}
                {s.nickname}
              </span>
              <span className="text-[18px] font-semibold text-slate-500">⭐{s.wins}</span>
            </div>
          ))}
          {!view.students.length && <div className="text-[21px] text-[#7a4a1d]/70">Chưa có ai vào xem — phòng đang trống</div>}
        </div>
      </div>

      {/* ghế chờ */}
      <div className="absolute left-[40px] right-[40px] top-[1596px] rounded-2xl border-[5px] border-slate-500 bg-slate-700/95 px-6 py-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-[27px] font-black text-slate-100">🪑 GHẾ CHỜ ({view.waiting.length})</div>
          <div className="rounded-full bg-slate-600 px-4 py-1 text-[19px] font-bold text-slate-200">
            🔔 {view.bell.have}/{view.bell.goal} tim → chuông reo, cả ghế chờ được về
          </div>
        </div>
        {view.waiting.length ? (
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {view.waiting.map((w) => (
              <div key={w.username} className="flex items-center gap-2 rounded-full bg-slate-600 py-1 pl-1 pr-4">
                <Avatar src={w.avatar} name={w.nickname} hue={w.hue} size={38} />
                <span className="max-w-[160px] truncate text-[19px] font-bold text-slate-100">{w.nickname}</span>
                <span className="text-[18px] text-slate-300">
                  ⏳ {w.remainSec}s · còn {w.matchesLeft} trận
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1.5 text-[21px] text-slate-300">Ghế chờ đang trống — ai thua trận mới ra đây ngồi uống nước 😄</div>
        )}
      </div>

      {/* bảng dưới cùng */}
      <div className="absolute bottom-[20px] left-1/2 w-[920px] -translate-x-1/2 rounded-2xl border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-2.5 text-center shadow-lg">
        <div className="text-[24px] font-bold text-[#7a4a1d]">
          {top1 ? (
            <>
              👑 Vua Oẳn Tù Xì: <b>{top1.nickname}</b> ({top1.totalWins} ⭐) · Đã đấu {view.totals.matches} trận · {view.totals.throws} lượt ném
            </>
          ) : (
            <>Thắng chủ phòng một trận là lên bảng Vua Oẳn Tù Xì! Đã đấu {view.totals.matches} trận</>
          )}
        </div>
      </div>

      {/* bảng vàng khi giải lao */}
      {view.phase === 'break' && (
        <div className="absolute left-1/2 top-[560px] z-30 w-[720px] -translate-x-1/2 rounded-[28px] border-[8px] border-[#8a5a2b] px-8 py-7 text-center shadow-2xl" style={{ background: 'linear-gradient(160deg, #276048, #1d4a36)' }}>
          <div className="text-[42px] font-black text-[#ffe680]">🏆 BẢNG VÀNG VÒNG {view.session}</div>
          <div className="mt-4 space-y-2.5">
            {view.sessionTop.length ? (
              view.sessionTop.map((t, i) => (
                <div key={i} className="text-[33px] font-bold text-white">
                  {['🥇', '🥈', '🥉'][i]} {t.nickname} — {t.wins} ⭐
                </div>
              ))
            ) : (
              <div className="text-[28px] text-emerald-100/80">Vòng này chưa có bạn nào thắng chủ phòng</div>
            )}
          </div>
          <div className="mt-5 text-[26px] text-emerald-100/90">☕ Giải lao… vòng mới sau {view.phaseRemainSec} giây</div>
        </div>
      )}

      {/* băng quà */}
      {giftFresh && (
        <div className="absolute left-1/2 top-[330px] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-6 py-2 text-[25px] font-black text-white shadow-lg">
          🎁 {giftFresh.nickname} tặng {giftFresh.giftName}!
        </div>
      )}
    </div>
  );
}
