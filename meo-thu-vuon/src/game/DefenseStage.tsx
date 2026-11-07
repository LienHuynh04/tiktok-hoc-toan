import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DefenseState, StageView } from './useDefense';
import { GAME } from './config';
import { defPos } from './defenderArt';
import { ratPos } from './ratArt';
import './defense.css';

// Sân khấu 1080x1920: biển gỗ -> banner hậu vệ đang cầm -> sân vườn 5 làn x 6 ô -> bảng người hùng
const GRID_X = 132;
const CELL_W = 154;
const FIELD_TOP = 548;
const LANE_H = 178;
const centerX = (x: number) => GRID_X + (x + 0.5) * CELL_W;
const laneY = (lane: number) => FIELD_TOP + lane * LANE_H;

function useNow(step = 100) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(id);
  }, [step]);
  return now;
}

export function DefenseStage({ game }: { game: DefenseState }) {
  const now = useNow();
  const v = game.view;
  if (!v) {
    return (
      <div className="flex h-full items-center justify-center bg-[#79a83b] p-16 text-center text-[44px] font-bold text-white">
        Đang mở vườn…
      </div>
    );
  }
  const bossAlive = v.rats.some((r) => r.boss);
  const boomFresh = v.lastBoom && now - v.lastBoom.at < 650;
  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-b from-[#8ec9e8] via-[#a5d68f] to-[#79a83b] ${bossAlive ? 'boss-pulse' : ''}`}>
      <Header v={v} name={game.channelName} />
      <OfferBanner v={v} now={now} />
      <div key={boomFresh ? v.lastBoom!.at : 0} className={boomFresh ? 'field-shake' : ''}>
        <Field v={v} now={now} />
      </div>
      <HeroBoard v={v} />
      <HowTo />
      {now - v.sunRainAt < 2600 && <SunRain />}
      <GiftBanner gift={game.lastGift} now={now} />
      {v.phase === 'over' && <OverPanel v={v} />}
      {bossAlive && (
        <div className="pointer-events-none absolute left-1/2 top-[468px] z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#b91c1c]/90 px-5 py-1 text-[26px] font-extrabold text-white shadow-lg">
          👑 CHUỘT TRÙM ĐANG TRONG VƯỜN!
        </div>
      )}
    </div>
  );
}

function Header({ v, name }: { v: StageView; name: string }) {
  return (
    <div className="absolute left-1/2 top-[14px] z-30 w-[640px] -translate-x-1/2 rounded-[26px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 text-center shadow-[0_8px_0_#5b3512]">
      <div className="truncate text-[44px] font-extrabold leading-none tracking-wide text-[#7a2e0e]">{name.toUpperCase()}</div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[27px] font-bold text-[#6b4a22]">
        <span>⭐ {v.sun}</span>
        <span>🌊 Đợt {Math.max(1, v.wave)}</span>
        <span>{'❤️'.repeat(Math.max(0, v.houseHp))}{'🖤'.repeat(Math.max(0, GAME.houseHp - v.houseHp))}</span>
        <span>🐀 còn {v.ratsLeft}</span>
      </div>
    </div>
  );
}

function OfferBanner({ v, now }: { v: StageView; now: number }) {
  const left = Math.max(0, (v.offer.endsAt - now) / 1000);
  const pct = Math.min(100, (left / GAME.offerEverySec) * 100);
  return (
    <div className="absolute left-1/2 top-[196px] z-30 flex w-[880px] -translate-x-1/2 items-center gap-4 rounded-[22px] border-[4px] border-[#33691e] bg-[#f1f8e9]/95 px-5 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
      <div className="h-[104px] w-[104px] shrink-0" style={{ ...defPos(v.offer.art), backgroundRepeat: 'no-repeat' }} />
      <div className="min-w-0 flex-1">
        <div className="text-[24px] font-bold uppercase tracking-wide text-[#558b2f]">Đang cầm · {v.offer.cost}⭐</div>
        <div className="truncate text-[40px] font-extrabold leading-tight text-[#2e4d14]">{v.offer.name}</div>
        <div className="text-[24px] font-semibold text-[#5d7a36]">{v.offer.desc} — gõ số làn để trồng!</div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex h-[64px] w-[52px] items-center justify-center rounded-[12px] bg-[#33691e] text-[34px] font-extrabold text-white shadow">
            {n}
          </div>
        ))}
      </div>
      <div className="absolute bottom-[6px] left-[16px] right-[16px] h-[6px] overflow-hidden rounded-full bg-[#c5e1a5]">
        <div className="h-full bg-[#7cb342] transition-[width] duration-150" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({ v, now }: { v: StageView; now: number }) {
  return (
    <div className="absolute left-0 right-0 top-0 z-10">
      {/* nhà + chó gác ở mép trái */}
      <div className="absolute text-[64px]" style={{ left: 18, top: FIELD_TOP - 92 }}>
        🏠
      </div>
      {Array.from({ length: GAME.lanes }, (_, lane) => (
        <div key={lane}>
          <div
            className={`absolute rounded-[10px] border-2 ${lane % 2 ? 'border-[#00000010] bg-[#8fbf4d]/55' : 'border-[#00000010] bg-[#a4cc63]/55'}`}
            style={{ left: GRID_X - 8, top: laneY(lane) + 6, width: CELL_W * GAME.cols + 16, height: LANE_H - 12 }}
          />
          <div className="absolute flex w-[110px] flex-col items-center" style={{ left: 8, top: laneY(lane) + 42 }}>
            <span className={`text-[52px] ${v.dogs[lane] ? '' : 'opacity-25 grayscale'}`}>🐕</span>
            <span className="rounded-full bg-black/45 px-2 text-[19px] font-bold text-white">Làn {lane + 1}</span>
          </div>
          {/* vạch chia ô */}
          {Array.from({ length: GAME.cols - 1 }, (_, c) => (
            <div key={c} className="absolute w-[3px] bg-white/25" style={{ left: GRID_X + (c + 1) * CELL_W, top: laneY(lane) + 12, height: LANE_H - 24 }} />
          ))}
        </div>
      ))}

      {/* hậu vệ */}
      {v.defenders.map((d, i) => (
        <div key={`d${i}`} className="pop-in absolute" style={{ left: centerX(d.col) - 62, top: laneY(d.lane) + 16, width: 124, height: 124 }}>
          <div className="def-sway h-full w-full" style={{ ...defPos(d.art), backgroundRepeat: 'no-repeat' }} />
          {d.hpPct < 0.999 && (
            <div className="absolute -top-[10px] left-[8px] right-[8px] h-[9px] rounded-full bg-black/40">
              <div className="h-full rounded-full bg-[#8bc34a]" style={{ width: `${d.hpPct * 100}%` }} />
            </div>
          )}
          <div className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2 py-0 text-[17px] font-semibold text-white">
            {d.nickname}
          </div>
        </div>
      ))}

      {/* chuột */}
      {v.rats.map((r) => {
        const w = r.boss ? 215 : 122;
        return (
          <div key={r.id} className="absolute" style={{ left: centerX(r.x) - w / 2, top: laneY(r.lane) + (r.boss ? -6 : 26), width: w, height: w }}>
            <div className={`rat-bob h-full w-full ${r.slowed ? 'hue-rotate-[140deg] saturate-[.6]' : ''}`} style={{ ...ratPos(r.art), backgroundRepeat: 'no-repeat' }} />
            <div className="absolute -top-[12px] left-[10px] right-[10px] h-[10px] rounded-full bg-black/45">
              <div className={`h-full rounded-full ${r.boss ? 'bg-[#ef4444]' : 'bg-[#fbbf24]'}`} style={{ width: `${r.hpPct * 100}%` }} />
            </div>
            {r.slowed && <div className="absolute -right-[6px] top-[6px] text-[26px]">❄️</div>}
          </div>
        );
      })}

      {/* đạn */}
      {v.projs.map((p, i) => (
        <div key={`p${i}`} className="absolute z-20" style={{ left: centerX(p.x) - 14, top: laneY(p.lane) + 62 }}>
          {p.kind === 'yarn' && <div className="text-[28px] leading-none">🧶</div>}
          {p.kind === 'thorn' && <div className="h-[20px] w-[20px] rotate-45 rounded-[4px] bg-[#558b2f] shadow" />}
          {p.kind === 'ice' && <div className="text-[26px] leading-none">❄️</div>}
        </div>
      ))}

      {/* vụ nổ nấm bom */}
      {v.lastBoom && now - v.lastBoom.at < 650 && (
        <div className="pointer-events-none absolute z-30 text-[150px]" style={{ left: centerX(v.lastBoom.col) - 75, top: laneY(v.lastBoom.lane) - 10 }}>
          💥
        </div>
      )}

      {/* đang nghỉ giữa đợt */}
      {v.phase === 'rest' && (
        <div className="absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#33691e]/85 px-6 py-2 text-[30px] font-extrabold text-white shadow-lg" style={{ top: FIELD_TOP - 64 }}>
          {v.wave === 0 ? '🌱 Chuẩn bị! Đợt 1 sắp tới…' : `✅ Xong đợt ${v.wave}! Đợt ${v.wave + 1} sau ${Math.max(0, Math.ceil((v.phaseEndsAt - now) / 1000))}s — trồng thêm hậu vệ!`}
        </div>
      )}
    </div>
  );
}

function HeroBoard({ v }: { v: StageView }) {
  return (
    <div className="absolute bottom-[104px] left-1/2 z-30 w-[900px] -translate-x-1/2 rounded-[18px] border-[3px] border-[#7a4a1d] bg-[#3b2410]/88 px-5 py-2.5 text-[#ffe9b8] shadow-lg">
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-[22px] font-extrabold uppercase tracking-wide text-[#ffe680]">🏆 Người hùng</span>
        {v.top.length === 0 && <span className="text-[21px]">Chưa ai lập công — trồng hậu vệ bắn chuột là lên bảng!</span>}
        {v.top.map((x, i) => (
          <span key={i} className="min-w-0 flex-1 truncate text-[21px] font-semibold">
            {['🥇', '🥈', '🥉', '4.', '5.'][i]} {x.nickname} · {x.dmg}đ
          </span>
        ))}
      </div>
    </div>
  );
}

function HowTo() {
  return (
    <div className="absolute bottom-[16px] left-1/2 z-30 w-[1024px] -translate-x-1/2 rounded-[18px] border-[3px] border-[#33691e] bg-[#f1f8e9]/92 px-5 py-2.5 text-center shadow-lg">
      <div className="text-[23px] font-bold leading-snug text-[#2e4d14]">
        Gõ <b className="text-[#b91c1c]">1 – 5</b> trồng hậu vệ đang cầm vào làn đó · Nắng là của <b>cả phòng</b> · Đủ <b>120 ❤️</b> = mưa nắng +75⭐ · Quà chỉ để cảm ơn 💚
      </div>
    </div>
  );
}

function SunRain() {
  const drops = ['⭐', '✨', '⭐', '🌟', '⭐', '✨', '⭐', '🌟', '⭐', '✨'];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[430px] z-40 h-[760px]">
      {drops.map((s, i) => (
        <span
          key={i}
          className="absolute text-[40px]"
          style={{ left: `${6 + i * 9.5}%`, animation: `sparkle-fall ${1.5 + (i % 4) * 0.3}s ease-in ${i * 0.14}s both` }}
        >
          {s}
        </span>
      ))}
      <div className="absolute left-1/2 top-[240px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#f59e0b]/92 px-6 py-2 text-[34px] font-extrabold text-white shadow-xl">⭐ MƯA NẮNG +75 ⭐</div>
    </div>
  );
}

function GiftBanner({ gift, now }: { gift: DefenseState['lastGift']; now: number }) {
  const show = gift && now - gift.at < 4000;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={gift.at}
          initial={{ opacity: 0, y: -24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-[24px] top-[470px] z-50 max-w-[560px] rounded-[24px] bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-2.5 text-[27px] font-bold text-white shadow-xl"
        >
          🎁 <span className="inline-block max-w-[280px] truncate align-bottom">{gift.nickname}</span> tặng {gift.repeatCount > 1 ? `${gift.repeatCount} × ` : ''}
          {gift.giftName}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverPanel({ v }: { v: StageView }) {
  const mvp = v.top[0];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55">
      <div className="w-[760px] rounded-[30px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-8 py-8 text-center shadow-2xl">
        <div className="text-[58px] font-extrabold leading-tight text-[#7a2e0e]">🐀 CHUỘT KHOẮNG SẠCH NHÀ!</div>
        <div className="mt-3 text-[30px] font-semibold text-[#6b4a22]">
          Cả phòng đã giữ vườn qua <b>{v.wave}</b> đợt chuột.
        </div>
        {mvp && (
          <div className="mt-4 text-[32px] font-bold text-[#2e4d14]">
            🏆 Người hùng của ván: {mvp.nickname} — {mvp.dmg} sát thương, hạ {mvp.kills} chuột
          </div>
        )}
        <div className="mt-5 text-[26px] text-[#6b4a22]">Ván mới bắt đầu sau ít giây… trồng Hoa Đèn sớm để vườn giàu nắng nha!</div>
      </div>
    </div>
  );
}
