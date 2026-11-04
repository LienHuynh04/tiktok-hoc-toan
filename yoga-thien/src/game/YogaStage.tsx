import { useEffect, useMemo, useState } from 'react';
import type { YogaState } from './useYoga';
import type { YogaView } from './yoga';
import { YOGA_SHEET, posePos } from './poseArt';
import { POSES } from './poses';
import './yoga.css';

// Sân khấu dựng theo đúng bố cục trang Lớp Toán: biển gỗ treo trên cùng, bảng lớn ở giữa
// (chữ phấn), cô giáo đứng cạnh bảng, học sinh xếp 2 hàng phía dưới, biển gỗ chân trang.

const HUES = [0, 28, -22, 42, -38, 16, -48, 33, -12, 55];
const chipName = (label: string) => label.replace(' II', '').replace(' (Nhân Sư)', '');

export function YogaStage({ game }: { game: YogaState }) {
  const { view, channelName, lastGift } = game;
  const petals = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 2 + Math.random() * 94,
        size: 22 + Math.random() * 20,
        dur: 3.4 + Math.random() * 2.2,
        delay: Math.random() * 1.4,
        emoji: i % 3 === 0 ? '🌸' : '🪷',
      })),
    [view?.flowers],
  );

  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#dcebfb] text-[30px] font-semibold text-blue-900">
        🧘 Lớp yoga đang trải thảm…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,#d9e9fb_0%,#cfe4fb_52%,#a9cdf3_52.2%,#8fbcec_100%)] text-slate-800">
      {view.flowers &&
        petals.map((p) => (
          <span
            key={p.id}
            className="petal z-40"
            style={{ left: `${p.left}%`, fontSize: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
          >
            {p.emoji}
          </span>
        ))}
      <Header v={view} name={channelName} />
      <NoteCard v={view} />
      <Board v={view} />
      <Teacher v={view} />
      <Students v={view} />
      <BottomPlaque v={view} />
      {lastGift && Date.now() - lastGift.at < 4000 && (
        <div className="absolute right-[16px] top-[648px] z-30 max-w-[380px] truncate rounded-full bg-white/90 px-4 py-2 text-[21px] font-semibold text-blue-900 shadow">
          🎁 {lastGift.nickname} tặng {lastGift.giftName}
        </div>
      )}
    </div>
  );
}

// ---------- Biển gỗ trên cùng (như Header của Lớp Toán) ----------
function Header({ v, name }: { v: YogaView; name: string }) {
  return (
    <div className="absolute left-1/2 top-[14px] z-20 flex w-[540px] -translate-x-1/2 flex-col items-center rounded-[28px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 shadow-[0_8px_0_#5b3512]">
      <div
        className="max-w-full truncate font-extrabold uppercase leading-none tracking-wide text-[#7a2e0e]"
        style={{ fontSize: name.length > 14 ? 34 : 42 }}
      >
        {name}
      </div>
      <div className="mt-1 text-[24px] font-semibold text-[#6b4a22]">
        Buổi tập thư giãn · {v.matCount} bạn trên thảm · {v.musicOn ? '🎵 nhạc thiền' : '🔇 tắt nhạc'}
      </div>
    </div>
  );
}

// ---------- Tờ note ghim trên tường (như Motto của Lớp Toán): biết gõ gì ----------
function NoteCard({ v }: { v: YogaView }) {
  return (
    <div className="absolute left-[14px] top-[158px] z-20 w-[338px] -rotate-2 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-3 pb-2.5 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[30px]">📌</div>
      <div className="text-center text-[21px] font-extrabold">MUỐN TẬP TƯ THẾ NÀO?</div>
      <div className="mb-1.5 text-center text-[19px] font-semibold text-[#6b4a22]">Gõ tên tư thế này nhé 👇</div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {POSES.map((p) => (
          <span
            key={p.key}
            className={`rounded-full px-2.5 py-0.5 text-[18px] font-bold ${
              v.poseKey === p.key ? 'bg-amber-400 text-amber-950' : 'bg-[#2f6fb2] text-white'
            }`}
          >
            {chipName(p.label).toUpperCase()}
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-center text-[16px] leading-snug text-[#6b4a22]">
        Có dấu hay không dấu đều được · Vào phòng là có thảm · Đủ 100 ❤️ thì mưa hoa sen
      </div>
    </div>
  );
}

// ---------- Bảng lớn giữa phòng (như bảng đen Lớp Toán, chữ phấn) ----------
function Board({ v }: { v: YogaView }) {
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setInhale((x) => !x), 4000);
    return () => clearInterval(t);
  }, []);
  const progress = Math.min(100, Math.max(0, ((v.totalSec - v.remainSec) / v.totalSec) * 100));
  return (
    <div className="yoga-chalk absolute left-[372px] top-[150px] z-10 h-[478px] w-[694px] rounded-[18px] border-[10px] border-[#7a4a1d] bg-[linear-gradient(160deg,#1f5f74,#17475a_70%)] text-[#f4f1e6] shadow-[0_10px_0_rgba(91,53,18,0.55)]">
      <div key={v.poseKey + String(v.byUser ?? '')} className="yoga-fade-up flex h-full flex-col px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[24px] tracking-widest text-[#bfe3ff]">TƯ THẾ HIỆN TẠI</span>
          <span className="rounded-full border-2 border-white/40 px-3 py-0.5 text-[24px]">⏱ còn {v.remainSec}s</span>
        </div>
        <div className="mt-1 text-[60px] font-bold leading-tight text-[#ffe680]">{v.label}</div>
        <div className="text-[28px] italic text-[#bfe3ff]">{v.sanskrit}</div>
        <p className="mt-2 text-[26px] leading-snug text-white/95">{v.guide}</p>
        <p className="mt-1 text-[23px] leading-snug text-white/70">✦ {v.benefit}</p>
        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-4">
            <div
              className="flex h-[86px] w-[86px] flex-none items-center justify-center rounded-full border-[3px] border-[#bfe3ff]/70 bg-white/10 transition-transform duration-[4000ms] ease-in-out"
              style={{ transform: inhale ? 'scale(1.18)' : 'scale(0.92)' }}
            >
              <span className="text-center text-[17px] font-bold leading-tight text-white">{inhale ? 'Hít vào…' : 'Thở ra…'}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[23px]">
                {v.byName ? (
                  <>
                    Theo yêu cầu của <b className="text-[#ffe680]">{v.byName}</b>
                  </>
                ) : (
                  'Chuỗi tự tập của lớp'
                )}
              </div>
              <div className="mt-1.5 h-[12px] w-[380px] overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#ffd84a] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {v.queue.length > 0 && (
                <div className="mt-2 truncate text-[21px] text-white/85">
                  Tiếp theo: {v.queue.map((q) => `${q.label} (${q.byName})`).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Cô giáo đứng cạnh bảng (như Teacher của Lớp Toán) ----------
function Teacher({ v }: { v: YogaView }) {
  return (
    <div className="absolute left-[10px] top-[548px] z-20 w-[440px]">
      <div className="absolute bottom-[10px] left-[6%] h-[30px] w-[88%] rounded-[50%] bg-white/50" />
      <div
        className="yoga-breath relative aspect-[660/520] w-full drop-shadow-[0_14px_14px_rgba(30,58,138,0.30)]"
        role="img"
        aria-label={`Cô giáo đang tập tư thế ${v.label}`}
        style={{ backgroundImage: `url(${YOGA_SHEET})`, backgroundSize: '300% 300%', backgroundPosition: posePos(v.cell) }}
      />
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-1 text-[23px] font-bold text-blue-700 shadow">
        🧘 Cô giáo
      </div>
    </div>
  );
}

// ---------- Học viên: 2 hàng thảm như 2 dãy bàn của Lớp Toán ----------
function Students({ v }: { v: YogaView }) {
  const rows: { top: number; w: number; left0: number; gap: number }[] = [
    { top: 1000, w: 196, left0: 34, gap: 8 },
    { top: 1408, w: 216, left0: 24, gap: 6 },
  ];
  return (
    <>
      {rows.map((r, ri) =>
        Array.from({ length: 5 }, (_, ci) => {
          const i = ri * 5 + ci;
          const m = v.mats[i];
          const x = r.left0 + ci * (r.w + r.gap);
          if (!m) {
            return (
              <div
                key={`empty-${i}`}
                className="absolute flex items-center justify-center rounded-[16px] border-[3px] border-dashed border-white/60 text-[17px] text-white/85"
                style={{ left: x, top: r.top, width: r.w, height: r.w * 0.79 + 44 }}
              >
                thảm trống
              </div>
            );
          }
          return (
            <div key={m.username} className="absolute" style={{ left: x, top: r.top, width: r.w, zIndex: 10 + ri }}>
              <div className={`rounded-[16px] p-1.5 ${m.active ? 'bg-amber-50 ring-4 ring-amber-300' : 'bg-white/70 ring-1 ring-blue-200'}`}>
                <div
                  className="aspect-[660/520] w-full"
                  role="img"
                  aria-label={`${m.nickname} đang tập ${v.label}`}
                  style={{
                    backgroundImage: `url(${YOGA_SHEET})`,
                    backgroundSize: '300% 300%',
                    backgroundPosition: posePos(v.cell),
                    filter: `hue-rotate(${HUES[i % HUES.length]}deg)`,
                  }}
                />
              </div>
              <div className="mx-auto mt-1.5 flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white/90 px-3 py-0.5 text-[19px] font-semibold text-[#3b2a14] shadow">
                {m.avatar ? (
                  <img src={m.avatar} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-200 text-[12px] font-bold text-blue-900">
                    {m.nickname.slice(0, 1)}
                  </span>
                )}
                <span className="truncate">{m.nickname}</span>
                {m.count > 0 && <b className="text-[#c2410c]">×{m.count}</b>}
              </div>
            </div>
          );
        }),
      )}
    </>
  );
}

// ---------- Biển gỗ chân trang: tim + tổng tư thế + bạn đồng hành ----------
function BottomPlaque({ v }: { v: YogaView }) {
  return (
    <div className="absolute bottom-[16px] left-1/2 z-20 flex w-[94%] -translate-x-1/2 items-center justify-between gap-3 rounded-[22px] border-[4px] border-[#7a4a1d] bg-[#f6e3b4] px-5 py-2.5 text-[21px] font-semibold text-[#6b4a22] shadow-[0_6px_0_#5b3512]">
      <span>
        🌸 {v.likes}/{v.likeGoal} tim → mưa hoa sen
      </span>
      <span>🧘 Đã tập {v.totalPoses} tư thế</span>
      <span className="max-w-[36%] truncate">🏆 {v.top.length ? v.top.map((t) => `${t.nickname} ×${t.count}`).join(' · ') : '—'}</span>
    </div>
  );
}
