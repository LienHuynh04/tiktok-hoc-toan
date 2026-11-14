import { useEffect, useMemo, useState } from 'react';
import './bug.css';
import type { BugState } from './useBug';
import { GAME } from './config';
import { bugSvg, senSvg } from './art';
import { MISSION_TEMPLATE, type ZoneId } from './bug';
import { ART, BOX_FRONT_RECT, PAINT_ANCHORS, SEN_SIZE, BUG_POSE_SIZE, resolveBugArtPose, toStage } from './stageArt';

const fmtKg = (n: number) => n.toFixed(1).replace('.', ',');

/** Ảnh tư thế có chuyển cảnh mờ chéo ~150ms khi đổi pose (tránh "giật" hình). */
function PoseImg({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  const [cur, setCur] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);
  useEffect(() => {
    if (src === cur) return;
    setPrev(cur);
    setCur(src);
    const t = setTimeout(() => setPrev(null), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return (
    <div className="relative h-full w-full">
      {prev && <img key={`p:${prev}`} src={prev} alt="" draggable={false} className="bug-pose-out absolute inset-0 h-full w-full" />}
      <img key={cur} src={cur} alt={alt} draggable={false} className="absolute inset-0 h-full w-full" onError={onError} />
    </div>
  );
}

export function BugStage({ game }: { game: BugState }) {
  const v = game.view;
  const fish = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 71) % 100}%`,
        delay: `${(i % 7) * 0.28}s`,
        size: 34 + ((i * 13) % 22),
      })),
    [],
  );
  const confetti = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: `${(i * 47) % 100}%`,
        delay: `${(i % 9) * 0.16}s`,
        color: ['#f27059', '#f7c948', '#5b9bd5', '#7bc47f', '#b79ced'][i % 5],
        rot: (i * 37) % 180,
      })),
    [],
  );

  // --- Tải trước asset ảnh thật; file nào lỗi thì ghi nhớ để rơi về hình SVG cũ ---
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const markFailed = (k: string) =>
    setFailed((prev) => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  useEffect(() => {
    const entries: [string, string][] = [
      ['room', ART.room],
      ['boxFront', ART.boxFront],
      ...Object.entries(ART.bug).map(([p, s]): [string, string] => [`bug:${p}`, s]),
      ...Object.entries(ART.sen).map(([p, s]): [string, string] => [`sen:${p}`, s]),
    ];
    for (const [k, src] of entries) {
      const im = new Image();
      im.onerror = () => markFailed(k);
      im.src = src;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!v) {
    return (
      <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#f6f0e1] font-sans text-[#4a3226] select-none">
        <div className="flex h-full items-center justify-center text-[38px] font-bold">Đang dựng nhà cho Bug… 🐱</div>
      </div>
    );
  }

  const kgPct = Math.min(100, Math.max(0, ((v.kg - GAME.kgStart) / (GAME.kgMax - GAME.kgStart)) * 100));
  const banner = v.banner;
  const shakePx = banner?.kind === 'levelup' ? 5 + v.fatStage * 2 : 0;
  const shakeStyle = shakePx ? ({ animation: `bugShake 0.5s ease-in-out infinite`, ['--shakePx' as string]: `${shakePx}px` } as React.CSSProperties) : undefined;
  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 6000 ? game.lastGift : null;

  const useRealRoom = !failed.has('room');
  // Zone của nhiệm vụ hiện tại (để vẽ vòng sáng trên vật trong tranh)
  const missionZone: ZoneId | null = v.vote ? null : (MISSION_TEMPLATE.find((m) => m.label === v.missionLabel)?.zone ?? null);

  // ===== Lớp nhân vật BẢN ẢNH THẬT (toạ độ đã warp theo tranh) =====
  const realCharacters = (() => {
    const bugArt = resolveBugArtPose(v);
    const bugSrcKey = bugArt === 'flop' ? 'stand' : bugArt;
    const senChase = v.sen.state === 'chase';
    // Sen là người đứng trên SÀN: warp xong kẹp chân Sen xuống đường sàn của tranh
    // (engine bay theo Bug trên mặt phẳng phẳng, nhưng trong tranh Sen không thể lơ lửng trước kệ/sofa).
    const senRaw = toStage(v.sen.x, v.sen.y);
    const senPos = { x: senRaw.x, y: Math.max(senRaw.y, 1558) };
    const bugPos = toStage(v.bug.x, v.bug.y);
    if (v.bug.zone === 'robot') bugPos.y -= 16; // đứng trên mặt robot
    if (v.bug.pose === 'hide') bugPos.y += 95; // chui hộp: chìm xuống, chỉ nhô đầu
    if (v.bug.pose === 'caught') {
      // Sen tóm được: Bug đứng ngay cạnh chân Sen trên sàn (không lơ lửng theo toạ độ engine)
      bugPos.x = senPos.x + 82;
      bugPos.y = senPos.y;
    }
    const k = v.bug.scale / 0.9;
    const bSize = { w: BUG_POSE_SIZE[bugArt].w * k, h: BUG_POSE_SIZE[bugArt].h * k };
    const sSize = senChase ? SEN_SIZE.run : SEN_SIZE.stand;
    const robotPos = toStage(v.robot.x, 1400);
    const ring = missionZone ? PAINT_ANCHORS[missionZone] : null;

    return (
      <>
        {/* vòng sáng ở vật mục tiêu của nhiệm vụ */}
        {ring && (
          <div
            className="bug-ring pointer-events-none absolute z-[15] rounded-[50%] border-[5px] border-[#f7c948]"
            style={{ left: ring.x, top: ring.y - 4, width: 210, height: 58, transform: 'translate(-50%, -50%)', boxShadow: '0 0 26px 6px rgba(247,201,72,0.55), inset 0 0 18px rgba(247,201,72,0.5)' }}
          />
        )}

        {/* robot hút bụi (đĩa chạy trên sàn) */}
        <div className="absolute z-10 transition-all duration-200 ease-linear" style={{ left: robotPos.x, top: robotPos.y + 2, transform: 'translateX(-50%)' }}>
          <div className="h-[54px] w-[176px] rounded-[50%] bg-gradient-to-b from-[#cfd8de] to-[#8d99a3] shadow-lg ring-2 ring-[#6e7a83]" />
          <div className="mx-auto -mt-[44px] h-[16px] w-[16px] rounded-full bg-[#f27059]" />
        </div>

        {/* Sen */}
        {!failed.has(senChase ? 'sen:run' : 'sen:stand') ? (
          <div
            className="absolute z-20 transition-all duration-200 ease-linear"
            style={{ left: senPos.x, top: senPos.y, width: sSize.w, height: sSize.h, transform: 'translate(-50%, -100%)' }}
          >
            <div className={senChase ? 'bug-bob h-full w-full' : 'h-full w-full'} style={{ transform: `scaleX(${v.sen.facing})` }}>
              <PoseImg src={senChase ? ART.sen.run : ART.sen.stand} alt="Sen" onError={() => markFailed(senChase ? 'sen:run' : 'sen:stand')} />
            </div>
          </div>
        ) : (
          <svg
            viewBox="-95 -425 190 440"
            className={`absolute z-20 transition-all duration-200 ease-linear ${senChase ? 'bug-bob' : ''}`}
            style={{ left: senPos.x, top: senPos.y, transform: `translate(-50%, -100%) scaleX(${v.sen.facing})`, width: 160 }}
            dangerouslySetInnerHTML={{ __html: senSvg(v.sen.state) }}
          />
        )}
        {v.sen.state === 'stunned' && <div className="bug-spin-star absolute z-30 text-[44px]" style={{ left: senPos.x + 52, top: senPos.y - 398 }}>💫</div>}
        {v.sen.state === 'fooled' && <div className="bug-pop absolute z-30 text-[44px]" style={{ left: senPos.x + 52, top: senPos.y - 388 }}>❓</div>}

        {/* Bug */}
        {!failed.has(`bug:${bugSrcKey}`) ? (
          <div
            className="absolute z-30 transition-all duration-200 ease-linear"
            style={{ left: bugPos.x, top: bugPos.y, width: bSize.w, height: bSize.h, transform: 'translate(-50%, -100%)' }}
          >
            <div
              className={`h-full w-full ${bugArt === 'hang' ? 'bug-sway-soft' : ''} ${bugArt === 'run' || bugArt === 'jump' ? 'bug-bob' : ''} ${v.zoomies ? 'bug-zoomies' : ''}`}
              style={{
                transform: `scaleX(${v.bug.facing})`,
                transformOrigin: bugArt === 'hang' ? '40% 0%' : bugArt === 'flop' ? '50% 82%' : undefined,
                rotate: bugArt === 'flop' ? '82deg' : undefined,
              }}
            >
              <PoseImg src={ART.bug[bugSrcKey]} alt="Bug" onError={() => markFailed(`bug:${bugSrcKey}`)} />
            </div>
          </div>
        ) : (
          <svg
            viewBox="-170 -275 340 290"
            className={`absolute z-30 transition-all duration-200 ease-linear ${v.bug.pose === 'swing' ? 'bug-sway' : ''} ${v.bug.pose === 'run' || v.bug.pose === 'dodge' ? 'bug-bob' : ''} ${v.zoomies ? 'bug-zoomies' : ''}`}
            style={{ left: bugPos.x, top: bugPos.y, width: 250 * v.bug.scale, transform: `translate(-50%, -100%) scaleX(${v.bug.facing})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: bugSvg(v.fatStage, v.bug.pose) }}
          />
        )}
        {bugArt === 'sleep' && <div className="bug-pop absolute z-30 text-[40px]" style={{ left: bugPos.x + bSize.w * 0.3, top: bugPos.y - bSize.h - 10 }}>💤</div>}

        {/* mặt trước hộp carton phủ lên Bug khi Bug ở trong hộp */}
        {v.bug.zone === 'box' && !failed.has('boxFront') && (
          <img
            src={ART.boxFront}
            alt=""
            draggable={false}
            className="absolute z-40"
            style={{ left: BOX_FRONT_RECT.left, top: BOX_FRONT_RECT.top, width: BOX_FRONT_RECT.width, height: BOX_FRONT_RECT.height }}
            onError={() => markFailed('boxFront')}
          />
        )}
      </>
    );
  })();

  // ===== Lớp phòng + nhân vật BẢN SVG CŨ (chỉ dùng khi mất file tranh) =====
  const bugY = v.bug.zone === 'robot' ? 1424 : v.bug.y;
  const legacyRoomAndChars = (
    <>
      <div
        className="absolute inset-x-[18px] top-[438px] z-10 h-[1152px] overflow-hidden rounded-[30px] shadow-xl ring-1 ring-[#d8c6a8]"
        style={shakeStyle}
      >
        <div className="absolute inset-0" style={{ backgroundColor: '#f3e2c7', backgroundImage: 'linear-gradient(to bottom, #f7e8d0 0%, #f3ddba 62%, #d9b98c 62.2%, #c9a26e 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[430px] opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 118px, #8a6a52 118px 122px)' }} />
        <div className="absolute right-[16px] top-[10px] h-[560px] w-[190px] rounded-b-[18px] bg-[#bfe0f2] ring-4 ring-[#c9a26e]">
          <div className="absolute inset-y-0 left-1/2 w-[5px] bg-[#c9a26e]" />
          <div className="absolute inset-x-0 top-1/2 h-[5px] bg-[#c9a26e]" />
        </div>
        <div className="absolute right-[6px] top-[2px] h-[800px] w-[64px] rounded-b-[26px] bg-gradient-to-b from-[#c95d7b] to-[#a8435f] opacity-95" />
        <div className="absolute right-[150px] top-[2px] h-[800px] w-[52px] rounded-b-[26px] bg-gradient-to-b from-[#c95d7b] to-[#a8435f] opacity-95" />
        <div className="absolute left-[22px] top-[30px] h-[470px] w-[290px] rounded-[10px] bg-[#a97a4f] shadow">
          {[86, 262, 438].map((yy) => (
            <div key={yy} className="absolute inset-x-[10px] h-[14px] rounded bg-[#8a5f36]" style={{ top: yy }} />
          ))}
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={`${row}-${i}`}
                className="absolute w-[30px] rounded-t-[4px]"
                style={{
                  left: 26 + i * 52,
                  top: 30 + row * 176 + (row === 1 && v.missions[3]?.done ? 40 : 0),
                  height: 56,
                  backgroundColor: ['#c95d7b', '#5b9bd5', '#7bc47f', '#f7c948', '#b79ced'][(row * 5 + i) % 5],
                  transform: row === 1 && v.missions[3]?.done ? 'rotate(38deg)' : undefined,
                }}
              />
            )),
          )}
        </div>
        <div className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 ${v.bug.zone === 'chandelier' ? 'bug-sway' : ''}`} style={{ transformOrigin: 'top center' }}>
          <div className="mx-auto h-[52px] w-[6px] bg-[#8a6a52]" />
          <div className="flex items-end gap-[10px]">
            {[-1, 0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-[26px] w-[16px] rounded-t-full bg-[#ffe9a8] shadow-[0_0_18px_6px_rgba(255,220,130,0.8)]" />
                <div className="h-[10px] w-[34px] rounded bg-[#b08a4f]" />
              </div>
            ))}
          </div>
          <div className="mx-auto h-[14px] w-[120px] rounded-b-[20px] bg-[#b08a4f]" />
        </div>
        <div className="absolute left-[482px] top-[575px]">
          <div className="relative h-[26px] w-[428px] rounded-[8px] bg-[#a97a4f] shadow" />
          <div className="absolute left-[16px] top-[26px] h-[210px] w-[22px] bg-[#8a5f36]" />
          <div className="absolute right-[16px] top-[26px] h-[210px] w-[22px] bg-[#8a5f36]" />
          <div className={`absolute -top-[34px] left-[286px] text-[40px] ${v.missions[0]?.done ? 'rotate-[100deg] translate-y-[16px]' : ''}`}>☕</div>
          <div className={`absolute -top-[52px] left-[66px] text-[46px] ${v.missions[6]?.done ? 'rotate-[80deg] translate-y-[20px]' : ''}`}>🌷</div>
        </div>
        <div className="absolute left-[42px] top-[742px]">
          <div className="h-[150px] w-[448px] rounded-t-[36px] bg-[#7fa8c9]" />
          <div className="relative -mt-[64px] h-[120px] w-[448px] rounded-[28px] bg-[#93b8d6] shadow" />
          <div className="mx-auto h-[26px] w-[380px] rounded-b-[16px] bg-[#6d96b8]" />
          {v.missions[9]?.done && <div className="absolute -top-[10px] left-[180px] rotate-[-14deg] text-[44px]">💥</div>}
        </div>
        <div className={`absolute left-[432px] top-[852px] text-center ${v.missions[1]?.done ? 'rotate-[24deg]' : ''}`}>
          <div className="text-[88px] leading-none">🪴</div>
        </div>
        <div className={`absolute left-[872px] top-[902px] text-[76px] leading-none ${v.missions[7]?.done ? 'rotate-[96deg]' : ''}`}>🗑️</div>
        <div className="absolute left-[728px] top-[922px]">
          <div className="h-[86px] w-[186px] rounded-[8px] bg-[#d9a05f] shadow ring-2 ring-[#b98343]" />
          <div className="mx-auto -mt-[100px] h-[18px] w-[150px] rounded bg-[#c28d49]" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20" style={shakeStyle}>
        <div className="absolute z-10 transition-all duration-200 ease-linear" style={{ left: v.robot.x, top: 1422, transform: 'translateX(-50%)' }}>
          <div className="h-[54px] w-[176px] rounded-[50%] bg-gradient-to-b from-[#cfd8de] to-[#8d99a3] shadow-lg ring-2 ring-[#6e7a83]" />
          <div className="mx-auto -mt-[44px] h-[16px] w-[16px] rounded-full bg-[#f27059]" />
        </div>
        <svg
          viewBox="-95 -425 190 440"
          className={`absolute z-20 transition-all duration-200 ease-linear ${v.sen.state === 'chase' ? 'bug-bob' : ''}`}
          style={{ left: v.sen.x, top: v.sen.y, transform: `translate(-50%, -100%) scaleX(${v.sen.facing})`, width: 160 }}
          dangerouslySetInnerHTML={{ __html: senSvg(v.sen.state) }}
        />
        {v.sen.state === 'stunned' && <div className="bug-spin-star absolute z-30 text-[44px]" style={{ left: v.sen.x + 44, top: v.sen.y - 400 }}>💫</div>}
        {v.sen.state === 'fooled' && <div className="bug-pop absolute z-30 text-[44px]" style={{ left: v.sen.x + 44, top: v.sen.y - 390 }}>❓</div>}
        <svg
          viewBox="-170 -275 340 290"
          className={`absolute z-30 transition-all duration-200 ease-linear ${v.bug.pose === 'swing' ? 'bug-sway' : ''} ${v.bug.pose === 'run' || v.bug.pose === 'dodge' ? 'bug-bob' : ''} ${v.zoomies ? 'bug-zoomies' : ''}`}
          style={{ left: v.bug.x, top: bugY, width: 250 * v.bug.scale, transform: `translate(-50%, -100%) scaleX(${v.bug.facing})`, transformOrigin: 'top center' }}
          dangerouslySetInnerHTML={{ __html: bugSvg(v.fatStage, v.bug.pose) }}
        />
      </div>
    </>
  );

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#f6f0e1] font-sans text-[#4a3226] select-none">
      {/* ===== Phòng khách: tranh thật (hoặc phòng SVG cũ khi mất file tranh) ===== */}
      {useRealRoom ? (
        <div className="absolute inset-0 z-10" style={shakeStyle}>
          <img src={ART.room} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" onError={() => markFailed('room')} />
          <div className="pointer-events-none absolute inset-0">{realCharacters}</div>
        </div>
      ) : (
        legacyRoomAndChars
      )}

      {/* ===== HUD trên ===== */}
      <div className="absolute inset-x-0 top-0 z-30 px-[26px] pt-[18px]">
        <div className="flex items-center gap-[14px]">
          <div className="rounded-2xl bg-[#4a3226] px-[16px] py-[6px] text-[38px]">🐱</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[39px] font-extrabold leading-tight">BUG ĐẠI NÁO NHÀ SEN</div>
            <div className="text-[23px] font-semibold text-[#8a6a52]">Chương {v.chapter} · cả phòng cùng lái Bug, Sen máy đuổi bắt</div>
          </div>
          <div className="text-center">
            <div className="text-[19px] font-bold tracking-wide text-[#8a6a52]">SEN ĐÃ BẮT</div>
            <div className="text-[30px] leading-none">
              {Array.from({ length: v.catchesGoal }, (_, i) => (
                <span key={i} className={i < v.catches ? '' : 'opacity-25'}>🥅</span>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[19px] font-bold tracking-wide text-[#8a6a52]">ĐỘ LÌ</div>
            <div className="text-[27px] leading-none">
              {Array.from({ length: v.liMax }, (_, i) => (
                <span key={i} className={i < v.li ? '' : 'opacity-25'}>🐾</span>
              ))}
            </div>
          </div>
        </div>

        {/* Thanh cân nặng — tiến trình cả buổi */}
        <div className="mt-[10px] flex items-center gap-[12px]">
          <div className="whitespace-nowrap text-[25px] font-extrabold">
            ⚖️ {fmtKg(v.kg)} kg · Cấp {v.fatStage}: {v.fatName}
          </div>
          <div className="relative h-[26px] flex-1 overflow-hidden rounded-full bg-white/70 ring-2 ring-[#d8c6a8]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#f7c948] via-[#f79d3c] to-[#f27059] transition-all duration-500" style={{ width: `${kgPct}%` }} />
          </div>
          <div className="whitespace-nowrap text-[21px] font-semibold text-[#8a6a52]">
            {v.fatNextKg ? `cấp sau: ${fmtKg(v.fatNextKg)} kg` : 'MAX CẤP!'}
          </div>
        </div>

        {/* Nhiệm vụ hiện tại + danh sách phá */}
        <div className="mt-[10px] rounded-[22px] bg-white/75 px-[18px] py-[10px] shadow ring-1 ring-[#e2d3b8]">
          {v.vote ? (
            <div>
              <div className="text-center text-[30px] font-extrabold text-[#7b4fa6]">🗳️ VOTE — còn {v.vote.remainSec}s · gõ {v.vote.aWord} hoặc {v.vote.bWord}!</div>
              <div className="mt-[6px] space-y-[5px]">
                {[
                  { label: v.vote.aLabel, n: v.vote.a, word: v.vote.aWord, color: '#5b9bd5' },
                  { label: v.vote.bLabel, n: v.vote.b, word: v.vote.bWord, color: '#f27059' },
                ].map((o) => (
                  <div key={o.word} className="flex items-center gap-[10px]">
                    <div className="w-[300px] truncate text-[24px] font-bold">{o.label} ({o.word})</div>
                    <div className="relative h-[24px] flex-1 overflow-hidden rounded-full bg-[#e8dcc4]">
                      <div className="h-full transition-all duration-300" style={{ width: `${Math.min(100, o.n * 12)}%`, backgroundColor: o.color }} />
                    </div>
                    <div className="w-[52px] text-right text-[24px] font-extrabold">{o.n}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-[12px]">
                <div className="min-w-0 flex-1 truncate text-[30px] font-extrabold">
                  🎯 Nhiệm vụ {Math.min(v.missionIdx + 1, 10)}/10: {v.missionLabel}
                </div>
                <div className="flex gap-[5px]">
                  {v.missions.map((m, i) => (
                    <span
                      key={i}
                      className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-[19px] font-extrabold ${
                        m.done ? 'bg-[#7bc47f] text-white' : i === v.missionIdx ? 'bug-pulse bg-[#f79d3c] text-white' : 'bg-[#e8dcc4] text-[#8a6a52]'
                      }`}
                    >
                      {m.done ? '✓' : i + 1}
                    </span>
                  ))}
                </div>
              </div>
              {v.combo ? (
                <div className="mt-[7px] flex items-center gap-[10px]">
                  <div className="whitespace-nowrap text-[24px] font-extrabold text-[#d35450]">🔥 COMBO {v.combo.have}/{v.combo.need} · còn {v.combo.remainSec}s</div>
                  <div className="relative h-[22px] flex-1 overflow-hidden rounded-full bg-[#e8dcc4]">
                    <div className="h-full bg-gradient-to-r from-[#f27059] to-[#d35450] transition-all duration-200" style={{ width: `${(v.combo.have / v.combo.need) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <div className="mt-[2px] truncate text-[23px] font-semibold text-[#8a6a52]">{v.hint}</div>
              )}
            </>
          )}
        </div>

        {v.credit && (
          <div className="bug-pop mx-auto mt-[8px] w-fit rounded-full bg-[#f7c948] px-[20px] py-[5px] text-[25px] font-extrabold shadow">
            ⭐ {v.credit.nickname} — lệnh quyết định: {v.credit.label}!
          </div>
        )}
        {giftFresh && (
          <div className="bug-pop mx-auto mt-[8px] w-fit rounded-full bg-[#ffd9e8] px-[20px] py-[5px] text-[25px] font-extrabold shadow">
            🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn! 💖
          </div>
        )}
      </div>

      {/* Banner sự kiện */}
      {banner && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          {banner.kind === 'levelup' &&
            fish.map((f, i) => (
              <span key={i} className="bug-fish" style={{ left: f.left, animationDelay: f.delay, fontSize: f.size }}>🐟</span>
            ))}
          {(banner.kind === 'mission' || banner.kind === 'chapterwin') &&
            confetti.map((c, i) => (
              <span key={i} className="bug-confetti" style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color, transform: `rotate(${c.rot}deg)` }} />
            ))}
          <div className="bug-pop rounded-[30px] bg-[#4a3226]/92 px-[36px] py-[22px] text-center shadow-2xl">
            <div className="text-[52px] font-extrabold text-[#ffd166]">{banner.title}</div>
            <div className="mt-[4px] max-w-[860px] text-[30px] font-bold text-white">{banner.sub}</div>
          </div>
        </div>
      )}

      {/* ===== Chân trang: kết quả lệnh + hướng dẫn ===== */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-[26px] pb-[20px]">
        <div className="mb-[10px] flex h-[54px] items-center justify-center">
          {v.lastAction && (
            <div
              className={`bug-pop rounded-full px-[22px] py-[8px] text-[27px] font-bold shadow ${
                v.lastAction.kind === 'ok' ? 'bg-[#dff2d8] text-[#2e6b2e]' : v.lastAction.kind === 'fail' ? 'bg-[#ffe3d3] text-[#9c4a1f]' : 'bg-white/85 text-[#6b5138]'
              }`}
            >
              {v.lastAction.kind === 'ok' ? '✅ ' : v.lastAction.kind === 'fail' ? '😹 ' : '🐾 '}
              {v.lastAction.text}
            </div>
          )}
        </div>
        <div className="rounded-[22px] bg-[#4a3226] px-[20px] py-[14px] text-[#f6f0e1] shadow-xl">
          <div className="flex flex-wrap items-center justify-center gap-[8px] text-[25px] font-extrabold">
            {['ĐẨY', 'LEO', 'ĐU', 'NHẢY', 'CHẠY', 'NÉ', 'GIẢ NGỦ', 'ĂN VẠ'].map((c) => (
              <span key={c} className="rounded-full bg-[#f7c948] px-[14px] py-[3px] text-[#4a3226]">{c}</span>
            ))}
          </div>
          <div className="mt-[8px] text-center text-[23px] font-semibold leading-snug">
            Gõ lệnh đúng lúc Bug ở đúng chỗ: ĐẨY cạnh đồ dễ vỡ · LEO ở rèm · ĐU trên đèn chùm · NÉ / GIẢ NGỦ / ĂN VẠ khi Sen tới gần
          </div>
          <div className="mt-[5px] text-center text-[21px] text-[#d8c6a8]">
            👥 {v.chatters} người đang lái · Sen tốc độ {v.senSpeed} · Đã phá {v.totals.missions} nhiệm vụ · Né được {v.totals.dodges} lần · Quà chỉ để cảm ơn, không mua được sức mạnh
          </div>
        </div>
      </div>
    </div>
  );
}
