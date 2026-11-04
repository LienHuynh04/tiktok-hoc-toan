import { useEffect, useMemo, useState } from 'react';
import type { YogaState } from './useYoga';
import { YOGA_SHEET, posePos } from './poseArt';
import { POSES } from './poses';

const HUES = [0, 28, -22, 42, -38, 16, -48, 33, -12, 55];
const chipName = (label: string) => label.replace(' II', '').replace(' (Nhân Sư)', '');
import './yoga.css';

function Plant({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 100 150" className="h-full w-full" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <g fill="#2f6fb2">
        <path d="M50 78 C30 50 18 44 6 46 C16 62 30 74 50 78Z" />
        <path d="M50 78 C70 50 82 44 94 46 C84 62 70 74 50 78Z" />
        <path d="M50 80 C44 48 40 34 28 22 C44 26 52 48 50 80Z" />
        <path d="M50 80 C56 48 60 34 72 22 C56 26 48 48 50 80Z" />
        <path d="M50 82 C50 52 50 36 50 16 C60 34 58 56 50 82Z" />
      </g>
      <path d="M28 84 h44 l-5 52 a6 6 0 0 1 -6 5 H39 a6 6 0 0 1 -6 -5 Z" fill="#1e4e79" />
    </svg>
  );
}

export function YogaStage({ game }: { game: YogaState }) {
  const { view, channelName, lastGift } = game;
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setInhale((v) => !v), 4000);
    return () => clearInterval(t);
  }, []);

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
      <div className="flex h-full w-full items-center justify-center bg-[#dbeafe] text-[30px] font-semibold text-blue-900">
        🧘 Lớp yoga đang trải thảm…
      </div>
    );
  }

  const giftFresh = lastGift && Date.now() - lastGift.at < 4000;
  const progress = Math.min(100, Math.max(0, ((view.totalSec - view.remainSec) / view.totalSec) * 100));

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#c9def8_0%,#dbeafe_30%,#bfd9fb_58%,#a9c9f2_100%)] text-slate-800">
      {/* trần + đèn */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[86px] bg-[#b7d2f2]/80" />
      <div className="pointer-events-none absolute inset-x-0 top-[26px] flex justify-around">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[30px] w-[30px] rounded-full bg-white shadow-[0_0_24px_10px_rgba(255,255,255,0.75)]" />
        ))}
      </div>
      {/* cửa sổ sau lưng */}
      <div className="pointer-events-none absolute inset-x-8 top-[150px] flex justify-between">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[430px] w-[27%] rounded-t-[110px] bg-white/45 ring-4 ring-[#1e3a8a]/25" />
        ))}
      </div>
      {/* cây xanh hai bên */}
      <div className="pointer-events-none absolute bottom-[290px] left-1 h-[190px] w-[110px] opacity-90">
        <Plant />
      </div>
      <div className="pointer-events-none absolute bottom-[290px] right-1 h-[190px] w-[110px] opacity-90">
        <Plant flip />
      </div>

      {view.flowers &&
        petals.map((p) => (
          <span
            key={p.id}
            className="petal z-30"
            style={{ left: `${p.left}%`, fontSize: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
          >
            {p.emoji}
          </span>
        ))}

      {/* tiêu đề */}
      <header className="relative z-10 pt-[98px] text-center">
        <div className="text-[24px] font-medium tracking-wide text-blue-900/70">{channelName}</div>
        <h1 className="text-[43px] font-extrabold tracking-wide text-blue-950">🧘 PHÒNG YOGA THIỀN</h1>
        <div className="mt-1 text-[23px] text-blue-900/80">
          {view.musicOn ? '🎵 Nhạc thiền đang mở' : '🔇 Nhạc thiền đang tắt'} · 🧎 {view.matCount} bạn đang tập cùng lớp
        </div>
      </header>

      {giftFresh && (
        <div className="absolute right-5 top-[110px] z-20 rounded-full bg-white/90 px-4 py-2 text-[21px] font-semibold text-blue-900 shadow">
          🎁 {lastGift.nickname} tặng {lastGift.giftName}
        </div>
      )}

      {/* BẢNG NOTE: người xem nhìn là biết gõ gì */}
      <section className="relative z-10 mx-6 mt-2 rounded-2xl bg-white/85 px-4 py-2.5 text-center shadow backdrop-blur">
        <div className="text-[23px] font-extrabold tracking-wide text-blue-950">📝 MUỐN TẬP TƯ THẾ NÀO — GÕ TÊN TƯ THẾ NÀY NHÉ</div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
          {POSES.map((p) => (
            <span
              key={p.key}
              className={`rounded-full px-3 py-1 text-[20px] font-bold ${
                view.poseKey === p.key ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'
              }`}
            >
              {chipName(p.label).toUpperCase()}
            </span>
          ))}
        </div>
        <div className="mt-1.5 text-[19px] text-slate-600">
          Gõ có dấu hay không dấu đều được · Vào phòng là có thảm tập cùng lớp · Đủ 100 ❤️ thì mưa hoa sen
        </div>
      </section>

      {/* huấn luyện viên */}
      <main className="relative z-10 mx-auto mt-1 w-[94%] max-w-[790px]">
        <div
          className="yoga-breath aspect-[660/520] w-full drop-shadow-[0_16px_18px_rgba(30,58,138,0.30)]"
          role="img"
          aria-label={`Tư thế ${view.label}`}
          style={{ backgroundImage: `url(${YOGA_SHEET})`, backgroundSize: '300% 300%', backgroundPosition: posePos(view.cell) }}
        />
      </main>

      {/* thẻ tư thế + nhịp thở */}
      <section key={view.poseKey + String(view.byUser ?? '')} className="yoga-fade-up relative z-10 mx-6 rounded-3xl bg-white/85 px-6 py-4 text-center shadow-lg backdrop-blur">
        <div className="text-[45px] font-extrabold leading-tight text-blue-950">{view.label}</div>
        <div className="text-[25px] italic text-blue-700">{view.sanskrit}</div>
        <p className="mx-auto mt-1 max-w-[92%] text-[23px] leading-snug text-slate-600">{view.benefit}</p>
        <div className="mt-2 flex items-center justify-center gap-3 text-[21px]">
          <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-900">
            {view.byName ? `theo yêu cầu của ${view.byName}` : 'chuỗi tự tập của lớp'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">⏱ còn {view.remainSec}s</span>
        </div>
        <div className="mx-auto mt-3 h-[10px] w-[86%] overflow-hidden rounded-full bg-blue-100">
          <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div
            className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-4 border-blue-300 bg-blue-100/80 transition-transform duration-[4000ms] ease-in-out"
            style={{ transform: inhale ? 'scale(1.22)' : 'scale(0.92)' }}
          >
            <span className="text-[19px] font-bold text-blue-900">{inhale ? 'Hít vào…' : 'Thở ra…'}</span>
          </div>
          <div className="text-left text-[21px] leading-snug text-slate-500">
            Thở theo vòng tròn của lớp:
            <br />
            hít vào 4 giây · thở ra 4 giây
          </div>
        </div>
        {view.queue.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[20px]">
            <span className="font-semibold text-slate-500">Tiếp theo:</span>
            {view.queue.map((q, i) => (
              <span key={i} className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
                {q.label} · {q.byName}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* thảm của lớp */}
      <section className="relative z-10 mt-auto px-5 pb-3 pt-3">
        <div className="mb-2 text-center text-[21px] font-bold tracking-wide text-blue-950/80">CẢ LỚP TẬP CÙNG NHAU — ai vào phòng cũng có một thảm</div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => {
            const m = view.mats[i];
            if (!m) {
              return (
                <div key={i} className="flex items-center justify-center rounded-xl border-2 border-dashed border-white/60 text-[15px] text-white/80">
                  thảm trống
                </div>
              );
            }
            return (
              <div
                key={m.username}
                className={`rounded-xl p-1.5 ${m.active ? 'bg-amber-50 ring-4 ring-amber-300' : 'bg-white/75 ring-1 ring-blue-200'}`}
              >
                <div
                  className="aspect-[660/520] w-full"
                  role="img"
                  aria-label={`${m.nickname} đang tập ${view.label}`}
                  style={{
                    backgroundImage: `url(${YOGA_SHEET})`,
                    backgroundSize: '300% 300%',
                    backgroundPosition: posePos(view.cell),
                    filter: `hue-rotate(${HUES[i % HUES.length]}deg)`,
                  }}
                />
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-200 text-[12px] font-bold text-blue-900">
                      {m.nickname.slice(0, 1)}
                    </span>
                  )}
                  <span className="truncate text-[15px] font-medium text-slate-700">{m.nickname}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* chân trang */}
      <footer className="relative z-10 flex items-center justify-between gap-3 bg-blue-950/90 px-5 py-3 text-[20px] text-white">
        <span>
          🌸 {view.likes}/{view.likeGoal} tim → mưa hoa sen
        </span>
        <span>🧘 Đã tập {view.totalPoses} tư thế</span>
        <span className="max-w-[38%] truncate">
          🏆 {view.top.length ? view.top.map((t) => `${t.nickname} ×${t.count}`).join(' · ') : '—'}
        </span>
      </footer>
    </div>
  );
}
