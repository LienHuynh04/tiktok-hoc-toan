import { useState } from 'react';
import type { RpsState } from './useRps';
import { CHOICE_META, BEAT_PHRASE, type RpsView } from './rps';
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

/** Cô giáo vẽ bằng SVG đứng cạnh bảng; pha hô oẳn tù xì thì vung tay */
function Teacher({ pumping }: { pumping: boolean }) {
  return (
    <svg viewBox="0 0 200 340" className="h-full w-full">
      {/* váy áo */}
      <path d="M100 118 L58 300 Q100 316 142 300 Z" fill="#0e7490" />
      <path d="M100 118 L58 300 Q100 316 142 300 Z" fill="#155e75" opacity="0.35" />
      <rect x="52" y="292" width="96" height="10" rx="5" fill="#164e63" />
      {/* tay trái cầm thước */}
      <line x1="66" y1="140" x2="30" y2="215" stroke="#f2c49b" strokeWidth="13" strokeLinecap="round" />
      <line x1="30" y1="215" x2="14" y2="160" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
      {/* tay phải: vung lên khi hô */}
      <g className={pumping ? 'rps-arm-pump' : undefined}>
        <line x1="134" y1="140" x2="168" y2="196" stroke="#f2c49b" strokeWidth="13" strokeLinecap="round" />
        <circle cx="170" cy="200" r="11" fill="#f2c49b" />
      </g>
      {/* cổ + đầu */}
      <rect x="90" y="98" width="20" height="26" fill="#f2c49b" />
      <circle cx="100" cy="72" r="38" fill="#f2c49b" />
      {/* tóc búi */}
      <path d="M62 72 a38 38 0 0 1 76 0 l0 -8 a38 30 0 0 0 -76 0 Z" fill="#3f2d20" />
      <circle cx="100" cy="30" r="13" fill="#3f2d20" />
      {/* mắt + miệng cười */}
      <circle cx="86" cy="72" r="3.6" fill="#1f2937" />
      <circle cx="114" cy="72" r="3.6" fill="#1f2937" />
      <path d="M88 88 Q100 97 112 88" stroke="#b3543f" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="76" cy="84" r="5.5" fill="#f9a8a8" opacity="0.7" />
      <circle cx="124" cy="84" r="5.5" fill="#f9a8a8" opacity="0.7" />
      {/* cổ áo */}
      <path d="M84 120 L100 138 L116 120 L108 112 L92 112 Z" fill="#f8fafc" />
    </svg>
  );
}

function HandCircle({ emoji, cls, ring }: { emoji: string; cls?: string; ring: string }) {
  return (
    <div className={`flex h-[168px] w-[168px] items-center justify-center rounded-full border-[6px] bg-[#fdf6d8] shadow-inner ${ring}`}>
      <span className={`text-[96px] leading-none ${cls ?? ''}`}>{emoji}</span>
    </div>
  );
}

function Board({ view }: { view: RpsView }) {
  const d = view.duel;
  if (view.phase === 'break') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-10 text-center">
        <div className="text-[44px] font-black text-[#ffe680]">🏆 BẢNG VÀNG TIẾT {view.session}</div>
        <div className="mt-6 space-y-3">
          {view.sessionTop.length ? (
            view.sessionTop.map((t, i) => (
              <div key={i} className="text-[36px] font-bold text-white">
                {['🥇', '🥈', '🥉'][i]} {t.nickname} — {t.wins} ⭐
              </div>
            ))
          ) : (
            <div className="text-[30px] text-emerald-100/80">Tiết này chưa có bạn nào thắng cô</div>
          )}
        </div>
        <div className="mt-8 text-[28px] text-emerald-100/90">☕ Đang giải lao… vào tiết mới sau {view.phaseRemainSec} giây</div>
      </div>
    );
  }
  if (!d) {
    const lr = view.lastResult;
    return (
      <div className="flex h-full flex-col items-center justify-center px-10 text-center">
        <div className="text-[40px] font-black text-[#ffe680]">SẴN SÀNG LƯỢT MỚI</div>
        {lr ? (
          <div className="mt-5 text-[30px] leading-snug text-white">
            Lượt trước: <b>{lr.nickname}</b>{' '}
            <span className={lr.outcome === 'win' ? 'text-lime-300' : lr.outcome === 'lose' ? 'text-rose-300' : 'text-amber-300'}>
              {lr.outcome === 'win' ? 'THẮNG 🎉' : lr.outcome === 'lose' ? 'THUA 😢' : 'HÒA 🤝'}
            </span>
            <div className="mt-2 text-[44px]">
              {CHOICE_META[lr.pick].emoji} <span className="text-[26px] text-emerald-100/70">đấu với</span> {CHOICE_META[lr.adminPick].emoji}
            </div>
          </div>
        ) : (
          <div className="mt-5 text-[28px] text-emerald-100/85">Cô đang chờ bạn đầu tiên thách đấu…</div>
        )}
        <div className="mt-7 max-w-[600px] text-[25px] leading-snug text-emerald-100/75">
          {view.queue.length
            ? `Hàng chờ thách đấu: ${view.queue.map((q) => q.nickname).join(' · ')}`
            : 'Chưa có ai thách đấu — cô sẽ gọi ngẫu nhiên 1 bạn lên bảng'}
        </div>
      </div>
    );
  }
  const chantWord = view.phaseRemainSec >= 3 ? 'OẲN!' : view.phaseRemainSec === 2 ? 'TÙ!' : 'XÌ!';
  return (
    <div className="flex h-full flex-col px-8 py-6">
      <div className="flex items-start justify-between">
        <div className="flex w-[240px] flex-col items-center gap-2 text-center">
          <Avatar src={d.avatar} name={d.nickname} hue={d.hue} size={64} />
          <div className="max-w-[240px] truncate text-[26px] font-bold text-white">{d.nickname}</div>
        </div>
        <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#eab308] text-[24px] font-black text-[#713f12] shadow">VS</div>
        <div className="flex w-[240px] flex-col items-center gap-2 text-center">
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#f6e3b4] text-[36px]">👩‍🏫</div>
          <div className="text-[26px] font-bold text-white">CÔ GIÁO</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-4">
        {view.phase === 'pick' && (
          <>
            <HandCircle emoji={d.hasPicked ? '🤫' : '❓'} cls={d.hasPicked ? '' : 'rps-pulse-soft'} ring="border-sky-300" />
            <div className="w-[190px] text-center">
              {d.rematch && <div className="mb-1 text-[26px] font-black text-amber-300">ĐẤU LẠI!</div>}
              <div className="text-[27px] font-bold leading-snug text-white">
                {d.hasPicked ? 'Đã chọn đòn!' : `${d.nickname} ra đòn đi…`}
              </div>
              <div className="mt-1 text-[30px] font-black text-[#ffe680]">{view.phaseRemainSec}s</div>
            </div>
            <HandCircle emoji="✊" cls="rps-pump-slow" ring="border-rose-300" />
          </>
        )}
        {view.phase === 'chant' && (
          <>
            <HandCircle emoji="✊" cls="rps-pump" ring="border-sky-300" />
            <div className="w-[190px] text-center text-[52px] font-black tracking-wide text-[#ffe680]">{chantWord}</div>
            <HandCircle emoji="✊" cls="rps-pump" ring="border-rose-300" />
          </>
        )}
        {view.phase === 'result' && d.pick && d.adminPick && (
          <>
            <div className="relative">
              <HandCircle emoji={CHOICE_META[d.pick].emoji} cls="rps-pop" ring={d.outcome === 'win' ? 'border-lime-300' : 'border-sky-300'} />
              {d.outcome === 'win' && <div className="rps-float-up absolute -top-3 right-0 text-[40px]">⭐+1</div>}
            </div>
            <div className="w-[210px] text-center">
              <div
                className={`rounded-2xl px-3 py-2 text-[30px] font-black shadow ${
                  d.outcome === 'win'
                    ? 'bg-lime-400 text-lime-950'
                    : d.outcome === 'lose'
                      ? 'bg-rose-400 text-rose-950'
                      : 'bg-amber-300 text-amber-950'
                }`}
              >
                {d.outcome === 'win' ? '🎉 THẮNG!' : d.outcome === 'lose' ? '😢 THUA!' : '🤝 HÒA!'}
              </div>
              <div className="mt-2 text-[23px] font-semibold leading-snug text-emerald-50">
                {d.outcome === 'draw'
                  ? 'Giống nhau nên hòa!'
                  : BEAT_PHRASE[d.outcome === 'win' ? `${d.pick}-${d.adminPick}` : `${d.adminPick}-${d.pick}`]}
                {d.outcome === 'lose' && <div className="text-rose-200">→ ra phòng chờ</div>}
              </div>
            </div>
            <HandCircle emoji={CHOICE_META[d.adminPick].emoji} cls="rps-pop" ring={d.outcome === 'lose' ? 'border-lime-300' : 'border-rose-300'} />
          </>
        )}
      </div>

      <div className="mt-auto text-center text-[23px] text-emerald-100/70">
        {view.phase === 'pick' && 'Đòn của cô giữ bí mật tới lúc hô xong 🤫'}
        {view.phase === 'chant' && 'Oẳn tù xì, ra cái gì, ra cái này!'}
        {view.phase === 'result' && `${CHOICE_META[d.pick ?? 'bua'].name} đấu với ${CHOICE_META[d.adminPick ?? 'bua'].name}`}
      </div>
    </div>
  );
}

export function RpsStage({ game }: { game: RpsState }) {
  const view = game.view;
  const channelName = game.channelName;
  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 5000 ? game.lastGift : null;
  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f3dfba] text-[34px] font-bold text-[#7a4a1d]">
        Lớp oẳn tù xì đang mở cửa…
      </div>
    );
  }
  const rows = [view.students.slice(0, 5), view.students.slice(5, 10)];
  const top1 = view.top[0];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(#f8ecd2 0%, #f3dfba 58%, #c99e67 58.2%, #b8894f 100%)' }}>
      {/* tiêu đề lớp */}
      <div className="absolute left-1/2 top-[22px] w-[880px] -translate-x-1/2 rounded-3xl border-[6px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 text-center shadow-lg">
        <div className="text-[52px] font-black leading-none text-[#7a4a1d]">
          ✊ OẲN TÙ XÌ ✋ <span className="align-middle text-[30px]">{view.musicOn ? '🎵' : '🔇'}</span>
        </div>
        <div className="mt-1 text-[25px] font-semibold text-[#96682e]">{channelName}</div>
        <div className="mx-auto mt-2 w-fit rounded-full bg-[#7a4a1d] px-5 py-1 text-[23px] font-bold text-amber-50">
          Tiết {view.session} · Lượt {Math.min(view.duelNo + (view.duel ? 1 : 0), view.duelsPerSession)}/{view.duelsPerSession} · Lớp thắng{' '}
          {view.totals.studentWins} — Cô thắng {view.totals.adminWins} · Hòa {view.totals.draws}
        </div>
      </div>

      {/* thẻ ghi chú cách chơi */}
      <div className="absolute left-[16px] top-[228px] w-[302px] -rotate-2 rounded-xl bg-[#fffdf4] px-4 py-3 shadow-md">
        <div className="text-center text-[22px]">📌</div>
        <div className="text-[22px] font-black text-slate-700">CÁCH CHƠI</div>
        <div className="mt-1 space-y-1 text-[20px] leading-snug text-slate-600">
          <div>
            Gõ <b className="text-slate-800">KÉO · BÚA · BAO</b> để đấu với cô
          </div>
          <div>
            Thắng <b className="text-slate-800">+1 ⭐</b> · Hòa đấu lại
          </div>
          <div>
            Thua → <b className="text-slate-800">🚪 phòng chờ</b> một lúc
          </div>
        </div>
        <div className="mt-2 border-t border-dashed border-slate-300 pt-2 text-center text-[21px] font-bold text-slate-700">✊ Búa &gt; ✌️ Kéo &gt; ✋ Bao &gt; ✊ Búa</div>
      </div>

      {/* bảng đen = sàn đấu */}
      <div className="absolute left-[338px] top-[216px] h-[648px] w-[718px] rounded-[22px] border-[14px] border-[#8a5a2b] shadow-xl" style={{ background: 'linear-gradient(160deg, #276048, #1d4a36)' }}>
        <Board view={view} />
      </div>

      {/* cô giáo đứng cạnh bảng */}
      <div className="absolute left-[52px] top-[520px] h-[400px] w-[235px]">
        <Teacher pumping={view.phase === 'chant'} />
        <div className="mx-auto -mt-2 w-fit rounded-full border-2 border-[#7a4a1d] bg-[#f6e3b4] px-4 py-0.5 text-[21px] font-black text-[#7a4a1d]">👩‍🏫 Cô giáo</div>
      </div>

      {/* top sao cả buổi */}
      <div className="absolute left-[16px] top-[958px] w-[302px] rounded-xl bg-[#fffdf4]/95 px-4 py-3 shadow-md">
        <div className="text-[21px] font-black text-slate-700">⭐ VUA OẲN TÙ XÌ</div>
        {view.top.length ? (
          <div className="mt-1 space-y-1">
            {view.top.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[20px] text-slate-600">
                <span className="max-w-[210px] truncate">
                  {['👑', '🥈', '🥉'][i]} {t.nickname}
                </span>
                <b className="text-slate-800">{t.totalWins} ⭐</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[19px] text-slate-500">Chưa có sao nào — thắng cô là có!</div>
        )}
      </div>

      {/* học sinh trong lớp */}
      <div className="absolute left-[340px] top-[892px] text-[24px] font-black text-[#7a4a1d]">👨‍🎓 HỌC SINH TRONG LỚP ({view.studentCount})</div>
      {rows.map((row, ri) => (
        <div key={ri} className="absolute left-[340px] flex gap-[14px]" style={{ top: ri === 0 ? 936 : 1176 }}>
          {Array.from({ length: 5 }, (_, i) => {
            const s = row[i];
            if (!s) {
              return (
                <div key={i} className="w-[128px] opacity-45">
                  <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-dashed border-[#7a4a1d]/50 text-[24px]">🪑</div>
                  <div className="mt-1 rounded-md bg-[#a97a44] px-1 py-1 text-center text-[15px] font-semibold text-amber-50/80">Ghế trống</div>
                </div>
              );
            }
            return (
              <div key={s.username} className={`w-[128px] ${s.dueling ? 'rps-bob' : ''}`}>
                <div className={`mx-auto w-fit rounded-full ${s.dueling ? 'ring-4 ring-amber-400' : ''}`}>
                  <Avatar src={s.avatar} name={s.nickname} hue={s.hue} size={62} />
                </div>
                <div className="mt-1 rounded-md bg-[#8a5a2b] px-1 py-1 text-center shadow">
                  <div className="truncate text-[16px] font-bold leading-tight text-amber-50">{s.nickname}</div>
                  <div className="text-[15px] font-semibold leading-tight text-amber-200">
                    ⭐{s.wins}
                    {s.streak >= 2 ? ` · 🔥${s.streak}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* phòng chờ */}
      <div className="absolute left-[40px] right-[40px] top-[1452px] rounded-2xl border-[5px] border-slate-500 bg-slate-700/95 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-[28px] font-black text-slate-100">🚪 PHÒNG CHỜ ({view.waiting.length})</div>
          <div className="rounded-full bg-slate-600 px-4 py-1 text-[20px] font-bold text-slate-200">
            🔔 {view.bell.have}/{view.bell.goal} tim → chuông reo, cả phòng chờ về lớp
          </div>
        </div>
        {view.waiting.length ? (
          <div className="mt-3 flex flex-wrap gap-3">
            {view.waiting.map((w) => (
              <div key={w.username} className="flex items-center gap-2 rounded-full bg-slate-600 py-1 pl-1 pr-4">
                <Avatar src={w.avatar} name={w.nickname} hue={w.hue} size={40} />
                <span className="max-w-[170px] truncate text-[20px] font-bold text-slate-100">{w.nickname}</span>
                <span className="text-[19px] text-slate-300">
                  ⏳ {w.remainSec}s · còn {w.duelsLeft} lượt
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-[22px] text-slate-300">Không có ai — cả lớp đang ngoan 😄 Ai thua cô mới phải ra đây ngồi.</div>
        )}
      </div>

      {/* bảng gỗ dưới cùng */}
      <div className="absolute bottom-[22px] left-1/2 w-[920px] -translate-x-1/2 rounded-2xl border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 text-center shadow-lg">
        <div className="text-[25px] font-bold text-[#7a4a1d]">
          {top1 ? (
            <>
              👑 Đang dẫn đầu: <b>{top1.nickname}</b> với {top1.totalWins} ⭐ · Đã đấu {view.totals.duels} lượt
            </>
          ) : (
            <>Đã đấu {view.totals.duels} lượt · Thắng cô một lượt là lên bảng vàng!</>
          )}
        </div>
      </div>

      {/* băng quà */}
      {giftFresh && (
        <div className="absolute left-1/2 top-[180px] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-6 py-2 text-[26px] font-black text-white shadow-lg">
          🎁 {giftFresh.nickname} tặng {giftFresh.giftName}!
        </div>
      )}
    </div>
  );
}
