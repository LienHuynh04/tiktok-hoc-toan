import { sendControl } from '../live/page';
import type { YogaView } from './yoga';
import { POSES } from './poses';

function Btn({
  children,
  onClick,
  tone = 'ghost',
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'ghost' | 'primary' | 'danger';
}) {
  const cls =
    tone === 'primary'
      ? 'bg-sky-600 text-white hover:bg-sky-500'
      : tone === 'danger'
        ? 'bg-rose-900/60 text-rose-200 hover:bg-rose-800/60'
        : 'bg-slate-800 text-slate-200 hover:bg-slate-700';
  return (
    <button onClick={onClick} className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${cls}`}>
      {children}
    </button>
  );
}

export function YogaControls({ view }: { view: YogaView | null; stageCount: number }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <h2 className="mb-2 font-semibold">🧘 Điều khiển lớp yoga</h2>

      <div className="mb-2 text-sm text-slate-300">
        {view ? (
          <>
            Đang tập: <b className="text-white">{view.label}</b> ({view.sanskrit}) · còn {view.remainSec}s ·{' '}
            {view.byName ? `theo yêu cầu của ${view.byName}` : 'chuỗi tự tập'} · {view.matCount} bạn trên thảm · đã tập{' '}
            {view.totalPoses} tư thế theo yêu cầu
          </>
        ) : (
          'Đang chờ trang stage…'
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Btn tone="primary" onClick={() => void sendControl('custom', 'skip')}>
          ⏭ Chuyển tư thế
        </Btn>
        {view?.musicOn ? (
          <Btn onClick={() => void sendControl('custom', 'music_off')}>🔇 Tắt nhạc thiền</Btn>
        ) : (
          <Btn onClick={() => void sendControl('custom', 'music_on')}>🎵 Bật nhạc thiền</Btn>
        )}
      </div>

      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Vào thẳng tư thế</div>
      <div className="flex flex-wrap gap-1.5">
        {POSES.map((p) => (
          <Btn key={p.key} onClick={() => void sendControl('custom', `pose:${p.key}`)}>
            {p.label}
          </Btn>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-400">
        <p>
          <b className="text-slate-200">Người xem gõ tên tư thế</b> (không cần dấu) là cả lớp tập theo:{' '}
          {POSES.map((p) => p.cmds[p.cmds.length - 1]).join(' · ')}. Ai bình luận cũng được nhận một tấm thảm trong lớp; không ai
          gọi bài thì lớp tự chảy theo chuỗi nhẹ nhàng và kết ở Thư Giãn.
        </p>
        <p>
          <b className="text-slate-200">Nhạc thiền</b> được soạn trực tiếp bằng Web Audio (đệm hợp âm êm + chuông ngũ cung, rất
          nhỏ, dễ ngủ) — không dùng nhạc ngoài nên không lo bản quyền. Trình duyệt bắt buộc có 1 lần chạm đầu tiên mới cho phát
          tiếng: nếu vào live mà chưa nghe nhạc, bấm nút <b className="text-slate-200">Interact</b> trong LIVE Studio rồi nhấp 1
          cái vào khung sân khấu, nhạc sẽ tự lên và các lần sau tự chạy.
        </p>
        <p>Tim đủ 100 thì mưa cánh hoa sen; quà chỉ được cảm ơn, không đổi được lịch tập.</p>
      </div>
    </section>
  );
}
