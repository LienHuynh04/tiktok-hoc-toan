import { useMemo, useState } from 'react';
import './decor.css';
import type { DecorState } from './useDecor';
import { ASSETS, tagSvg } from './assets';
import type { PlacedItem } from './decor';

function itemSvg(p: { assetId: string; label?: string; uid: number }): string {
  if (p.assetId === 'tag') return tagSvg(p.label ?? '');
  const a = ASSETS.find((x) => x.id === p.assetId);
  return a ? a.draw(p.uid % 3) : '';
}

export function DecorStage({ game }: { game: DecorState }) {
  const v = game.view;
  const petals = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: `${(i * 173) % 100}%`,
        size: 7 + ((i * 29) % 8),
        delay: `${(i % 11) * 1.3}s`,
        dur: `${9 + (i % 5) * 2.4}s`,
        pink: i % 3 === 0,
      })),
    [],
  );
  const fireworks = v && v.fireworksAt > 0 && Date.now() - v.fireworksAt < 4500;
  const cur = v?.current ?? null;
  const anX = cur ? Math.max(95, Math.min(985, cur.x)) : 580;

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#1d1440] font-sans text-white select-none">
      {/* Trời chiều ấm + hoa rơi */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a1a5e] via-[#6d2a5e] to-[#c65a3a]" />
      {petals.map((p, i) => (
        <div
          key={i}
          className="decor-petal absolute rounded-full"
          style={{ left: p.left, width: p.size, height: p.size * 0.72, background: p.pink ? '#ffb3c1' : '#ffd34d', animationDelay: p.delay, animationDuration: p.dur }}
        />
      ))}

      <HouseSvg />

      {/* Đồ đã treo */}
      {v?.placed.map((p) => (
        <Placed key={p.uid} p={p} />
      ))}

      {/* Tia sáng ở vị trí đang treo */}
      {cur && cur.phase === 'hang' && (
        <div className="pointer-events-none absolute z-30" style={{ left: cur.x, top: cur.y }}>
          <span className="decor-spark absolute -left-[52px] -top-[30px] text-[44px]">✨</span>
          <span className="decor-spark absolute left-[16px] -top-[52px] text-[36px]" style={{ animationDelay: '0.25s' }}>✨</span>
          <span className="decor-spark absolute -left-[8px] top-[14px] text-[30px]" style={{ animationDelay: '0.5s' }}>⭐</span>
        </div>
      )}

      {/* Bé An */}
      <div className="absolute z-40 transition-all duration-[950ms] ease-in-out" style={{ left: anX, bottom: 218, transform: 'translateX(-50%)' }}>
        {cur && (
          <div className="absolute -top-[86px] left-1/2 w-[340px] -translate-x-1/2 rounded-2xl bg-white px-4 py-2 text-center text-[25px] font-semibold text-rose-900 shadow-lg">
            {cur.phase === 'cheer' ? 'Xong rồi, đẹp chưa cả nhà! 🎉' : `Đang treo ${cur.name} cho ${cur.nickname} nè…`}
            <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-white" />
          </div>
        )}
        <div className={cur?.phase === 'walk' ? 'decor-bob' : cur?.phase === 'cheer' ? 'decor-cheer' : 'decor-idle'}>
          <AnSvg pose={cur ? (cur.phase === 'cheer' ? 'cheer' : 'hold') : 'idle'} />
        </div>
        {cur && cur.phase !== 'cheer' && (
          <div className="absolute -top-[64px] left-1/2 -translate-x-1/2">
            <svg viewBox="-60 -65 120 130" className="h-[92px] w-[86px] overflow-visible">
              <g dangerouslySetInnerHTML={{ __html: itemSvg({ assetId: cur.assetId, label: cur.label, uid: 0 }) }} />
            </svg>
          </div>
        )}
      </div>

      {/* Tiêu đề */}
      <div className="absolute inset-x-0 top-[30px] z-20 text-center">
        <div className="font-display text-[64px] font-bold leading-none text-amber-300 drop-shadow-[0_4px_0_rgba(120,20,20,0.9)]">Trang Trí Tết</div>
        <div className="mt-1 text-[30px] font-semibold tracking-wide text-rose-100">🏠 Nhà Của Chúng Ta 🏮</div>
      </div>

      {/* Đếm đồ + tim */}
      <div className="absolute right-[26px] top-[24px] z-20 w-[238px] space-y-2">
        <div className="rounded-2xl bg-black/45 px-4 py-2 text-[26px] font-bold ring-1 ring-amber-200/40">🧧 Đã treo: {v?.total ?? 0} món</div>
        <div className="rounded-2xl bg-black/45 px-4 py-2 ring-1 ring-rose-200/40">
          <div className="text-[24px] font-bold text-rose-200">❤️ {v?.likes ?? 0}/{v?.likeGoal ?? 100} tim</div>
          <div className="mt-1 h-[12px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300 transition-all duration-500" style={{ width: `${Math.min(100, ((v?.likes ?? 0) % 100) || (v && v.likes > 0 ? 100 : 0))}%` }} />
          </div>
        </div>
        {v && v.top.length > 0 && (
          <div className="rounded-2xl bg-black/45 px-4 py-2 text-[23px] leading-snug ring-1 ring-white/20">
            <div className="font-bold text-amber-200">🌟 Treo nhiều nhất</div>
            {v.top.map((t, i) => (
              <div key={i} className="truncate text-white/85">
                {['🥇', '🥈', '🥉'][i]} {t.nickname} · {t.count}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thông báo quà */}
      {game.lastGift && Date.now() - game.lastGift.at < 6000 && (
        <div key={game.lastGift.at} className="decor-toast absolute inset-x-[150px] top-[196px] z-30 rounded-2xl bg-fuchsia-700/85 px-6 py-3 text-center text-[29px] font-semibold ring-1 ring-amber-200/50">
          🎁 {game.lastGift.nickname} vừa tặng {game.lastGift.giftName}
          {game.lastGift.repeatCount > 1 ? ` ×${game.lastGift.repeatCount}` : ''}
        </div>
      )}

      {/* Pháo hoa khi đủ 100 tim */}
      {fireworks && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div className="absolute inset-x-0 top-[300px] text-center text-[52px] font-extrabold text-amber-300 drop-shadow-[0_3px_0_rgba(120,20,20,0.9)]">✨ Đủ 100 tim — pháo hoa mừng Tết! ✨</div>
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="decor-spark absolute text-[40px]"
              style={{ left: `${(i * 53) % 92 + 3}%`, top: `${(i * 37) % 40 + 6}%`, animationDelay: `${(i % 6) * 0.3}s` }}
            >
              {['⭐', '✨', '🌟', '💛'][i % 4]}
            </span>
          ))}
        </div>
      )}

      {/* Dòng sự kiện + hàng chờ + hướng dẫn */}
      <div className="absolute inset-x-[36px] bottom-[26px] z-20 space-y-2.5">
        {v && v.feed.length > 0 && (
          <div className="rounded-2xl bg-black/40 px-5 py-2 text-[25px] text-amber-100/90 ring-1 ring-white/12">
            {v.feed.map((f, i) => (
              <div key={i} className="truncate">
                🧧 <b>{f.nickname}</b> vừa treo {f.name}
              </div>
            ))}
          </div>
        )}
        {v && v.queue.length > 0 && (
          <div className="truncate rounded-2xl bg-indigo-900/55 px-5 py-2 text-[25px] text-indigo-100 ring-1 ring-indigo-300/30">
            ⏳ Đang chờ treo: {v.queue.map((q) => `${q.name} (${q.nickname})`).join(' · ')}
          </div>
        )}
        <div className="rounded-2xl bg-black/50 px-5 py-3 text-center text-[27px] font-medium text-white/90 ring-1 ring-amber-200/25">
          💬 Gõ tên món đồ vào bình luận — bé An treo lên nhà ngay: lồng đèn · con chó · bánh chưng · máy bay · hoa mai…
        </div>
      </div>

      {!v && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 text-[34px]">Đang mở cửa nhà… 🏠</div>}
    </div>
  );
}

function Placed({ p }: { p: PlacedItem }) {
  const [err] = useState(false);
  if (err) return null;
  return (
    <div className="decor-pop absolute z-10" style={{ left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${p.s}) rotate(${p.rot}deg)` }} title={`${p.name} — ${p.byName} treo`}>
      <svg viewBox="-60 -65 120 130" className="h-[182px] w-[168px] overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.35)]">
        <g dangerouslySetInnerHTML={{ __html: itemSvg(p) }} />
      </svg>
    </div>
  );
}

// Ngôi nhà vẽ bằng SVG (gốc): mái ngói, tường kem, cửa gỗ, 2 cửa sổ sáng đèn, cây mai trái, hàng rào + chậu cúc
function HouseSvg() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      {/* sân + lối đi */}
      <rect x="0" y="1450" width="1080" height="470" fill="#a8573c" />
      <path d="M0 1450 h1080 M0 1560 h1080 M0 1675 h1080" stroke="#8f4630" strokeWidth="3" opacity="0.5" />
      <path d="M470 1450 h140 l26 340 h-192z" fill="#c98d6e" />
      {/* thân nhà */}
      <rect x="170" y="520" width="820" height="930" fill="#f7e8c9" />
      <rect x="170" y="520" width="820" height="930" fill="none" stroke="#d9b878" strokeWidth="4" />
      {/* mái ngói */}
      <path d="M120 520 L580 300 L1040 520z" fill="#c0453a" />
      <path d="M120 520 L580 300 L1040 520 L990 520 L580 342 L170 520z" fill="#a33327" />
      <path d="M205 505 L580 330 M330 445 L580 330 M455 392 L580 330 M685 392 L580 330 M810 445 L580 330 M935 505 L580 330" stroke="#8f2a20" strokeWidth="5" opacity="0.6" />
      <rect x="120" y="512" width="920" height="26" rx="8" fill="#8a5a2b" />
      {/* cửa chính */}
      <rect x="478" y="793" width="204" height="657" rx="10" fill="#7c4a21" />
      <rect x="492" y="807" width="178" height="300" rx="8" fill="#a9743a" />
      <rect x="505" y="820" width="70" height="270" rx="6" fill="#ffd98a" opacity="0.9" />
      <rect x="587" y="820" width="70" height="270" rx="6" fill="#ffd98a" opacity="0.9" />
      <rect x="492" y="1120" width="178" height="316" rx="8" fill="#8a5a2b" />
      <circle cx="566" cy="1130" r="8" fill="#f5b921" />
      <circle cx="596" cy="1130" r="8" fill="#f5b921" />
      {/* cửa sổ */}
      {[330, 830].map((cx) => (
        <g key={cx}>
          <rect x={cx - 78} y="652" width="156" height="316" rx="10" fill="#7c4a21" />
          <rect x={cx - 64} y="666" width="128" height="240" rx="6" fill="#ffca7a" />
          <path d={`M${cx} 666 v240 M${cx - 64} 786 h128`} stroke="#7c4a21" strokeWidth="7" />
          <path d={`M${cx - 70} 920 h140 l-8 34 h-124z`} fill="#c1502e" />
          <circle cx={cx - 30} cy="918" r="13" fill="#f77fa1" />
          <circle cx={cx + 4} cy="910" r="15" fill="#e63950" />
          <circle cx={cx + 36} cy="918" r="12" fill="#f77fa1" />
        </g>
      ))}
      {/* chậu cúc hai bên cửa */}
      {[428, 732].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 30} 1408 h60 l-7 36 h-46z`} fill="#c1502e" />
          <circle cx={cx - 18} cy="1396" r="14" fill="#ffd34d" />
          <circle cx={cx + 2} cy="1386" r="16" fill="#ffd34d" />
          <circle cx={cx + 20} cy="1398" r="13" fill="#ffd34d" />
          <circle cx={cx} cy="1400" r="6" fill="#e8930c" />
        </g>
      ))}
      {/* cây mai trước sân (trái) */}
      <path d="M105 1585 q-6 -120 4 -230 M107 1420 q-40 -30 -58 -78 M108 1390 q38 -36 44 -84" stroke="#6b4423" strokeWidth="13" fill="none" strokeLinecap="round" />
      {[
        [52, 1330], [150, 1300], [86, 1246], [168, 1386], [36, 1420], [128, 1452], [66, 1520], [140, 1506],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={13 + (i % 3) * 3} fill="#ffd34d" />
          <circle cx={x} cy={y} r="4.4" fill="#ffb703" />
        </g>
      ))}
      {/* hàng rào phải + đèn đá */}
      <path d="M880 1560 h180 M880 1610 h180 M896 1520 v130 M960 1520 v130 M1024 1520 v130" stroke="#8a5a2b" strokeWidth="9" strokeLinecap="round" />
      <rect x="806" y="1478" width="52" height="66" rx="8" fill="#9a938a" />
      <rect x="798" y="1462" width="68" height="18" rx="6" fill="#7c766e" />
      <rect x="820" y="1492" width="24" height="26" fill="#ffd98a" />
      {/* thảm đỏ trước cửa */}
      <path d="M505 1450 h150 l14 120 h-178z" fill="#c02727" opacity="0.85" />
    </svg>
  );
}

// Bé An: cô bé áo dài đỏ (vẽ gốc), 3 tư thế: idle / hold (cầm đồ) / cheer (giơ tay)
function AnSvg({ pose }: { pose: 'idle' | 'hold' | 'cheer' }) {
  return (
    <svg viewBox="0 0 200 270" className="h-[248px] w-[184px] overflow-visible drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]">
      {/* chân + giày */}
      <path d="M84 196 h13 v52 h-13z M104 196 h13 v52 h-13z" fill="#fdfdf8" />
      <ellipse cx="90" cy="252" rx="13" ry="6" fill="#c02727" />
      <ellipse cx="112" cy="252" rx="13" ry="6" fill="#c02727" />
      {/* áo dài */}
      <path d="M100 74 c-26 0 -38 12 -40 30 l-7 96 c0 8 10 12 18 8 l10 -34 v40 c0 7 8 10 13 6 l6 -8 l6 8 c5 4 13 1 13 -6 v-40 l10 34 c8 4 18 0 18 -8 l-7 -96 c-2 -18 -14 -30 -40 -30z" fill="#d92b2b" />
      <path d="M100 74 c-26 0 -38 12 -40 30 l-2 24 h144 l-2 -24 c-2 -18 -14 -30 -40 -30z" fill="#c02727" opacity="0.55" />
      <path d="M88 76 q12 10 24 0 l-4 14 h-16z" fill="#f5b921" />
      {/* tay theo tư thế */}
      {pose === 'idle' && (
        <>
          <path d="M62 104 q-14 30 -8 58" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M138 104 q14 30 8 58" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="53" cy="164" r="7" fill="#ffd9b3" />
          <circle cx="147" cy="164" r="7" fill="#ffd9b3" />
        </>
      )}
      {pose === 'hold' && (
        <>
          <path d="M62 104 q-6 34 16 48" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M138 104 q6 34 -16 48" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="80" cy="154" r="7" fill="#ffd9b3" />
          <circle cx="120" cy="154" r="7" fill="#ffd9b3" />
        </>
      )}
      {pose === 'cheer' && (
        <>
          <path d="M62 100 q-22 -18 -24 -44" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M138 100 q22 -18 24 -44" stroke="#d92b2b" strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="37" cy="52" r="7.4" fill="#ffd9b3" />
          <circle cx="163" cy="52" r="7.4" fill="#ffd9b3" />
        </>
      )}
      {/* đầu */}
      <circle cx="100" cy="46" r="31" fill="#ffd9b3" />
      <path d="M69 44 a31 31 0 0 1 62 0 l0 -6 a31 22 0 0 0 -62 0z" fill="#3a2a20" />
      <circle cx="100" cy="12" r="11" fill="#3a2a20" />
      <path d="M78 22 q22 -13 44 0" stroke="#d92b2b" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="13" r="4.4" fill="#f5b921" />
      {pose === 'cheer' ? (
        <>
          <path d="M84 44 q5 -6 10 0 M106 44 q5 -6 10 0" stroke="#4a2f1d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="58" rx="6" ry="7.4" fill="#8a3b2e" />
        </>
      ) : (
        <>
          <circle cx="89" cy="46" r="3.4" fill="#26221f" />
          <circle cx="111" cy="46" r="3.4" fill="#26221f" />
          <path d="M93 57 q7 6 14 0" stroke="#b3543f" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="76" cy="55" r="5.4" fill="#f7a8b8" opacity="0.8" />
      <circle cx="124" cy="55" r="5.4" fill="#f7a8b8" opacity="0.8" />
    </svg>
  );
}
