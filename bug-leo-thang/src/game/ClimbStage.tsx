import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME, STAIR_PATH } from './config';
import type { ClimbState, StageView } from './useClimb';
import './climb.css';

// Vùng vẽ cầu thang trên sân khấu 1080x1920 (ảnh nền tỉ lệ 1152x2048 ~ 0.5625)
const AREA = { x: 140, y: 296, w: 800, h: 1422 };

// Độ dài tích lũy của đường leo (theo tỉ lệ ảnh) để nội suy vị trí theo bậc
const SEG_LEN: number[] = [];
let TOTAL_LEN = 0;
for (let i = 1; i < STAIR_PATH.length; i++) {
  const dx = STAIR_PATH[i].x - STAIR_PATH[i - 1].x;
  const dy = STAIR_PATH[i].y - STAIR_PATH[i - 1].y;
  const l = Math.hypot(dx, dy);
  SEG_LEN.push(l);
  TOTAL_LEN += l;
}

/** Vị trí trên đường leo tại tỉ lệ chặng (0..1) + hướng di chuyển ngang. */
function posAt(t: number): { fx: number; fy: number; dir: 1 | -1 } {
  const target = Math.min(1, Math.max(0, t)) * TOTAL_LEN;
  let acc = 0;
  for (let i = 0; i < SEG_LEN.length; i++) {
    const a = STAIR_PATH[i];
    const b = STAIR_PATH[i + 1];
    if (acc + SEG_LEN[i] >= target || i === SEG_LEN.length - 1) {
      const f = SEG_LEN[i] === 0 ? 0 : Math.min(1, Math.max(0, (target - acc) / SEG_LEN[i]));
      return { fx: a.x + (b.x - a.x) * f, fy: a.y + (b.y - a.y) * f, dir: b.x >= a.x ? 1 : -1 };
    }
    acc += SEG_LEN[i];
  }
  const last = STAIR_PATH[STAIR_PATH.length - 1];
  return { fx: last.x, fy: last.y, dir: 1 };
}

function pathPoints(fromStep: number, toStep: number): string {
  const pts: string[] = [];
  const step = 8;
  for (let s = fromStep; s <= toStep; s += step) {
    const p = posAt(s / GAME.goalSteps);
    pts.push(`${(p.fx * AREA.w).toFixed(1)},${(p.fy * AREA.h).toFixed(1)}`);
  }
  const end = posAt(toStep / GAME.goalSteps);
  pts.push(`${(end.fx * AREA.w).toFixed(1)},${(end.fy * AREA.h).toFixed(1)}`);
  return pts.join(' ');
}

function FishSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 24">
      <path d="M3 12 Q16 1 31 12 Q16 23 3 12 Z" fill={color} stroke="#8a5a12" strokeWidth="1.4" />
      <path d="M30 12 L39 5 L39 19 Z" fill={color} stroke="#8a5a12" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="1.8" fill="#5b3a06" />
    </svg>
  );
}

function YarnSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="climb-spin">
      <circle cx="50" cy="50" r="42" fill="#e8b4b8" stroke="#9c4a52" strokeWidth="4" />
      <path d="M14 40 Q50 22 86 42" fill="none" stroke="#9c4a52" strokeWidth="4" />
      <path d="M12 58 Q50 40 88 60" fill="none" stroke="#9c4a52" strokeWidth="4" />
      <path d="M22 78 Q50 58 78 80" fill="none" stroke="#9c4a52" strokeWidth="4" />
      <path d="M84 84 Q96 92 90 100" fill="none" stroke="#9c4a52" strokeWidth="4" />
    </svg>
  );
}

function SlipperSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 120 74">
      <path d="M6 52 Q10 22 62 16 Q112 12 114 40 Q115 62 84 64 L30 66 Q4 66 6 52 Z" fill="#7fb2d9" stroke="#3c6486" strokeWidth="4" />
      <path d="M34 30 Q60 8 88 28" fill="none" stroke="#3c6486" strokeWidth="9" />
      <circle cx="61" cy="17" r="6" fill="#f2c94c" stroke="#3c6486" strokeWidth="3" />
    </svg>
  );
}

/** Cầu thang vẽ dự phòng (chỉ thấy khi ảnh nền chưa tải được) */
function StairsFallback() {
  const pts = pathPoints(0, GAME.goalSteps);
  return (
    <svg width={AREA.w} height={AREA.h} viewBox={`0 0 ${AREA.w} ${AREA.h}`} style={{ position: 'absolute', inset: 0 }}>
      <rect width={AREA.w} height={AREA.h} fill="#efe3cb" />
      <polyline points={pts} fill="none" stroke="#b08954" strokeWidth="26" strokeLinejoin="round" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

const CONFETTI_COLORS = ['#e4572e', '#f2c94c', '#7fb069', '#7fb2d9', '#e8b4b8', '#9b5de5'];

/* ================= Bộ tư thế Bug (chỉ lớp trình diễn — engine không đổi) =================
   Một ảnh đứng yên nhìn như "tấm hình trượt"; đổi ảnh theo trạng thái thì mắt đọc thành
   chuyển động cơ thể. Kích thước mỗi tư thế chuẩn hoá theo "chiều dài thân" của tư thế đứng
   (baseW) để Bug không phình/thu đột ngột khi đổi ảnh. */
type Pose = 'stand' | 'climb' | 'jump' | 'run' | 'sleep';

const POSE_DEFS: Record<Pose, { src: string; wMul: number; aspect: number; noFlip?: boolean }> = {
  stand: { src: '/assets/bug.png', wMul: 1, aspect: 960 / 930 },
  climb: { src: '/assets/bug-climb.png', wMul: 1.14, aspect: 1418 / 1292 },
  jump: { src: '/assets/bug-jump.png', wMul: 1.52, aspect: 1042 / 1780 },
  run: { src: '/assets/bug-run.png', wMul: 1.58, aspect: 770 / 1403 },
  sleep: { src: '/assets/bug-sleep.png', wMul: 1.3, aspect: 982 / 1395, noFlip: true },
};

function poseBox(pose: Pose, baseW: number): { w: number; h: number } {
  const d = POSE_DEFS[pose];
  const w = Math.round(baseW * d.wMul);
  return { w, h: Math.round(w * d.aspect) };
}

/**
 * Máy trạng thái tư thế, suy từ view của engine (không sửa engine):
 * ngủ gật -> sleep · bị húc đang lăn -> jump (kèm vòng xoay sẵn có) · bậc vọt đột ngột
 * (NHẢY / bùng bậc) -> jump 500ms theo cung · xả tim nhanh >15 bậc/s -> run ·
 * bậc vừa tăng trong 700ms -> climb · còn lại -> stand.
 * Đổi tư thế bằng crossfade ~120ms: lớp mới fade-in phủ lên lớp cũ, lớp cũ gỡ sau 160ms.
 */
function useBugPose(view: StageView | null): { pose: Pose; prevPose: Pose | null; leapKey: number } {
  const [pose, setPose] = useState<Pose>('stand');
  const [prevPose, setPrevPose] = useState<Pose | null>(null);
  const [leapKey, setLeapKey] = useState(0);
  const r = useRef({
    samples: [] as { t: number; s: number }[],
    lastSteps: null as number | null,
    lastIncreaseAt: -Infinity,
    jumpUntil: 0,
    pose: 'stand' as Pose,
    prevPose: null as Pose | null,
    changedAt: 0,
  });
  const viewRef = useRef(view);
  viewRef.current = view;

  // Nạp trước mọi ảnh tư thế ngay khi stage mở để lần đổi ảnh đầu tiên không nhấp nháy.
  useEffect(() => {
    for (const p of Object.values(POSE_DEFS)) {
      const img = new Image();
      img.src = p.src;
    }
  }, []);

  // Ghi mẫu bậc mỗi lần view đổi; phát hiện cú vọt bậc (NHẢY +8) để bật tư thế nhảy.
  useEffect(() => {
    if (!view) return;
    const now = performance.now();
    const st = r.current;
    const s = view.progress * GAME.goalSteps;
    if (st.lastSteps !== null) {
      const d = s - st.lastSteps;
      if (d > 0.01) {
        st.lastIncreaseAt = now;
        if (d >= 6 && !view.nap && !view.bug.tumbling) {
          const oldest = st.samples[0];
          const rate = oldest && now > oldest.t ? (s - oldest.s) / ((now - oldest.t) / 1000) : 0;
          // Đang xả tim dồn dập (rate cao) thì nhường cho tư thế chạy, đừng nhảy liên tục.
          if (rate <= 15) {
            st.jumpUntil = now + 500;
            setLeapKey((k) => k + 1);
          }
        }
      }
    }
    st.lastSteps = s;
    st.samples.push({ t: now, s });
    while (st.samples.length > 2 && now - st.samples[0].t > 1100) st.samples.shift();
  }, [view]);

  // Đánh giá lại mỗi 50ms: các tư thế ngắn (nhảy 500ms, leo 700ms) hết hạn đúng lúc
  // dù view chỉ cập nhật 200–400ms/lần.
  useEffect(() => {
    const id = setInterval(() => {
      const v = viewRef.current;
      if (!v) return;
      const now = performance.now();
      const st = r.current;
      if (st.prevPose !== null && now - st.changedAt > 160) {
        st.prevPose = null;
        setPrevPose(null);
      }
      const samples = st.samples;
      let rate = 0;
      if (samples.length >= 2) {
        const a = samples[0];
        const b = samples[samples.length - 1];
        if (b.t > a.t && now - b.t < 350) rate = (b.s - a.s) / ((b.t - a.t) / 1000);
      }
      let next: Pose = 'stand';
      if (v.nap) next = 'sleep';
      else if (v.bug.tumbling) next = 'jump';
      else if (rate > 15) next = 'run';
      else if (now < st.jumpUntil) next = 'jump';
      else if (now - st.lastIncreaseAt < 700) next = 'climb';
      if (next !== st.pose) {
        st.prevPose = st.pose;
        st.pose = next;
        st.changedAt = now;
        setPrevPose(st.prevPose);
        setPose(next);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  return { pose, prevPose, leapKey };
}

export function ClimbStage({ game }: { game: ClimbState }) {
  const { view, lastGift } = game;
  const [bgOk, setBgOk] = useState(true);
  const { pose, prevPose, leapKey } = useBugPose(view);

  const giftConfetti = lastGift && Date.now() - lastGift.at < 2600 ? lastGift : null;

  const overlays = useMemo(() => {
    if (!view) return null;
    const bugPos = posAt(view.progress);
    const bugScale = 0.92 + 0.28 * view.progress;
    const bugW = Math.round(158 * bugScale);
    const bugH = Math.round(bugW * (960 / 930));
    const bugPx = { x: bugPos.fx * AREA.w, y: bugPos.fy * AREA.h };
    const hazPx = view.hazard ? (() => { const p = posAt(view.hazard.atStep / GAME.goalSteps); return { x: p.fx * AREA.w, y: p.fy * AREA.h }; })() : null;
    return { bugPos, bugW, bugH, bugPx, hazPx };
  }, [view]);

  if (!view || !overlays) {
    return (
      <div className="climb-stage">
        <div className="climb-waiting">
          <div className="climb-title-font" style={{ fontSize: 54 }}>BUG LEO 1000 BẬC</div>
          <div style={{ fontSize: 26, marginTop: 12 }}>Đang chờ trang stage chạy game…</div>
        </div>
      </div>
    );
  }

  const { bugPos, bugW, bugH, bugPx, hazPx } = overlays;
  const stepsText = view.steps.toLocaleString('vi-VN');

  return (
    <div className="climb-stage">
      {/* ---------- Đầu sân khấu: bộ đếm khổng lồ ---------- */}
      <div className="climb-header">
        <div className="climb-brand climb-title-font">BUG LEO 1000 BẬC</div>
        <div className="climb-counter">
          <span className="climb-counter-now">{stepsText}</span>
          <span className="climb-counter-goal"> / {GAME.goalSteps.toLocaleString('vi-VN')}</span>
        </div>
        <div className="climb-wins">
          <span>THẮNG {view.wins}/{view.winsGoal}</span>
          <span className="climb-wins-sub">độ khó {view.difficulty} · vòng {view.sessionArc}</span>
        </div>
        <div className="climb-progress">
          <div className="climb-progress-fill" style={{ width: `${Math.max(1.5, view.progress * 100)}%` }} />
        </div>
        <div className="climb-statusrow">
          {view.nap ? (
            <span className="climb-pill climb-pill-nap">
              Bug ngủ gật — gọi dậy: {view.nap.leo}/{view.nap.need} LEO (còn {view.nap.remainSec}s)
            </span>
          ) : view.inSlippery ? (
            <span className="climb-pill climb-pill-slip">Đang ở đoạn bậc trơn — leo chậm một nửa</span>
          ) : view.hazard ? (
            <span className="climb-pill climb-pill-haz">{view.hazard.kind === 'yarn' ? 'Cuộn len đang lăn xuống!' : 'Dép của Sen đang trượt xuống!'}</span>
          ) : (
            <span className="climb-pill climb-pill-calm">Bug đang leo lên gác mái</span>
          )}
        </div>
      </div>

      {/* ---------- Thanh trái: cách leo ---------- */}
      <div className="climb-rail climb-rail-left">
        <div className="climb-rail-title">CÁCH LEO</div>
        <div className="climb-rail-item"><b>TIM</b><span>+1 bậc</span></div>
        <div className="climb-rail-item"><b>LEO</b><span>+3 bậc</span></div>
        <div className="climb-rail-item"><b>NHẢY</b><span>+8 bậc, trượt −5</span></div>
        <div className="climb-rail-item"><b>ĐẨY</b><span>dọn len / dép chắn đường</span></div>
        <div className="climb-rail-item"><b>THẮNG</b><span>đủ 1000 bậc = ăn cá to</span></div>
      </div>

      {/* ---------- Thanh phải: chướng ngại (chỉ máy) ---------- */}
      <div className="climb-rail climb-rail-right">
        <div className="climb-rail-title">CẢN TRỞ</div>
        <div className="climb-rail-item"><b>CUỘN LEN</b><span>húc trúng: −10~25 bậc</span></div>
        <div className="climb-rail-item"><b>DÉP SEN</b><span>húc trúng: −15 bậc</span></div>
        <div className="climb-rail-item"><b>BẬC TRƠN</b><span>300–330 · 620–650 · 880–910: leo chậm một nửa</span></div>
        <div className="climb-rail-item"><b>NGỦ GẬT</b><span>đứng yên 5 giây, LEO gọi dậy</span></div>
      </div>

      {/* ---------- Cầu thang + Bug ---------- */}
      <div className="climb-area" style={{ left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.h }}>
        <StairsFallback />
        {bgOk && (
          <img
            src="/assets/stairs-bg.png"
            alt=""
            className="climb-bgimg"
            onError={() => setBgOk(false)}
            draggable={false}
          />
        )}
        <svg width={AREA.w} height={AREA.h} viewBox={`0 0 ${AREA.w} ${AREA.h}`} className="climb-pathsvg">
          {view.bands.map(([a, b], i) => (
            <polyline key={i} points={pathPoints(a, b)} fill="none" stroke="#6db9e8" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" opacity="0.45" />
          ))}
          <polyline points={pathPoints(0, GAME.goalSteps)} fill="none" stroke="#fff7e6" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" opacity="0.8" />
          <polyline points={pathPoints(0, view.steps)} fill="none" stroke="#f5a623" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        </svg>

        {/* Chướng ngại */}
        {view.hazard && hazPx && (
          <div className="climb-hazard" style={{ left: hazPx.x, top: hazPx.y }}>
            {view.hazard.kind === 'yarn' ? <YarnSvg size={92} /> : <SlipperSvg size={104} />}
          </div>
        )}

        {/* Bong bóng thoại truyện tranh */}
        {view.bubble && (
          <div className="climb-bubble" style={{ left: bugPx.x, top: bugPx.y - bugH - 30 }}>
            {view.bubble}
          </div>
        )}
        {view.nap && (
          <div className="climb-zzz" style={{ left: bugPx.x + bugW * 0.4, top: bugPx.y - bugH - 66 }}>
            Z z z
          </div>
        )}

        {/* Bug (ảnh thật của kênh) — bộ tư thế theo trạng thái, neo đáy-giữa trên đường leo,
            hai lớp ảnh crossfade ~120ms khi đổi tư thế để không "pop" hình */}
        {(() => {
          const curBox = poseBox(pose, bugW);
          const prevBox = prevPose ? poseBox(prevPose, bugW) : null;
          const flipOf = (p: Pose) => (POSE_DEFS[p].noFlip ? 1 : bugPos.dir);
          const layerAnim =
            pose === 'sleep'
              ? ' climb-anim-breathe'
              : pose === 'climb'
                ? ' climb-anim-step'
                : pose === 'run'
                  ? ' climb-anim-run'
                  : pose === 'stand' && view.bug.moving
                    ? ' climb-anim-bob'
                    : '';
          return (
            <div
              className={`climb-bug${view.bug.tumbling ? ' climb-bug-tumble' : ''}`}
              style={{ left: bugPx.x, top: bugPx.y, width: curBox.w, height: curBox.h }}
            >
              <div key={leapKey} className={`climb-bug-arc${pose === 'jump' && !view.bug.tumbling ? ' climb-bug-leap' : ''}`}>
                {prevPose && prevBox && (
                  <div className="climb-bug-layer" style={{ width: prevBox.w, height: prevBox.h }}>
                    <img src={POSE_DEFS[prevPose].src} alt="" draggable={false} style={{ transform: `scaleX(${flipOf(prevPose)})` }} />
                  </div>
                )}
                <div className={`climb-bug-layer${layerAnim}`} style={{ width: curBox.w, height: curBox.h }}>
                  <img
                    src={POSE_DEFS[pose].src}
                    alt="Bug"
                    draggable={false}
                    className="climb-img-in"
                    style={{ transform: `scaleX(${flipOf(pose)})` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Confetti khi có quà (chỉ cảm ơn, không cộng bậc) */}
        {giftConfetti && (
          <div className="climb-confetti" style={{ left: bugPx.x, top: bugPx.y - bugH }}>
            {CONFETTI_COLORS.concat(CONFETTI_COLORS).map((c, i) => (
              <span
                key={i}
                style={{
                  background: c,
                  left: `${(i % 6) * 22 - 55}px`,
                  animationDelay: `${(i % 5) * 0.12}s`,
                  transform: `rotate(${i * 37}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Mưa cá khi thắng ---------- */}
      {view.banner && (
        <>
          <div className="climb-fishrain">
            {Array.from({ length: 26 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 37.7) % 100}%`,
                  animationDuration: `${2.6 + ((i * 13) % 10) / 6}s`,
                  animationDelay: `${((i * 7) % 12) / 10}s`,
                }}
              >
                <FishSvg size={44 + ((i * 11) % 26)} color={i % 4 === 0 ? '#f2c94c' : '#e8a13a'} />
              </span>
            ))}
          </div>
          <div className={`climb-banner${view.banner.kind === 'grand' ? ' climb-banner-grand' : ''}`}>
            <div className="climb-banner-title climb-title-font">{view.banner.title}</div>
            <div className="climb-banner-sub">{view.banner.sub}</div>
          </div>
        </>
      )}

      {/* ---------- Chân sân khấu: đóng góp + sự kiện ---------- */}
      <div className="climb-footer">
        <div className="climb-top3">
          {view.top.length ? (
            <>
              <span className="climb-top3-label">Đóng góp nhiều nhất lượt này:</span>{' '}
              {view.top.map((t, i) => (
                <span key={i} className="climb-top3-item">
                  {i + 1}. {t.nickname} — {t.steps} bậc{i < view.top.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </>
          ) : (
            <span className="climb-top3-label">Đóng góp lượt này: chưa có dữ liệu</span>
          )}
        </div>
        {view.credit && (
          <div className="climb-credit">
            Lượt thắng trước: <b>{view.credit.nickname}</b> đóng góp nhiều nhất ({view.credit.steps} bậc)
          </div>
        )}
        <div className={`climb-event climb-event-${view.lastEvent?.kind ?? 'info'}`}>
          {view.lastEvent ? view.lastEvent.text : 'Bug đang ở chân cầu thang, sẵn sàng leo!'}
        </div>
        <div className="climb-totals">
          Cả buổi: {view.totals.likes.toLocaleString('vi-VN')} tim · {view.totals.wins} lượt thắng · bị húc {view.totals.tumbles} lần · dọn đường{' '}
          {view.totals.cleared} lần
        </div>
        <div className="climb-giftnote">Quà tặng chỉ để cảm ơn Bug — không cộng bậc, không mua sức mạnh.</div>
      </div>
    </div>
  );
}
