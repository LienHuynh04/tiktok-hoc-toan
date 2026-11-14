import { useRef, useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { ClimbView } from './climb';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Anh'];
const toUser = (nickname: string) => ({
  nickname,
  username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach',
});

export function ClimbControls({ view, stageCount }: { view: ClimbView | null; stageCount: number }) {
  const [jumpTo, setJumpTo] = useState('950');
  const nameIdx = useRef(0);
  const nextFake = () => toUser(FAKE_NAMES[nameIdx.current++ % FAKE_NAMES.length]);

  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const top = view.top[0];
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🐾 Điều khiển Bug Leo 1000 Bậc</h2>
        <p className="leading-relaxed">
          Bug đang ở bậc <b className="text-slate-100">{view.steps}/{view.goalSteps}</b> · thắng <b className="text-slate-100">{view.wins}/{view.winsGoal}</b> · độ
          khó {view.difficulty} · vòng buổi {view.sessionArc}
          {view.inSlippery ? ' · đang ở bậc trơn' : ''}
          {view.nap ? ` · đang ngủ gật (${view.nap.leo}/${view.nap.need} LEO)` : ''}
          {view.hazard ? ` · chướng ngại ${view.hazard.kind === 'yarn' ? 'cuộn len' : 'dép'} ở bậc ${Math.round(view.hazard.atStep)}` : ''} ·{' '}
          {top ? `đang dẫn đầu đóng góp: ${top.nickname} (${top.steps} bậc)` : 'chưa có ai đóng góp'} · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => sendControl('custom', 'demo_leo')} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500">
          🎬 Chơi thử (demo)
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc' : '🎵 Bật nhạc'}
        </button>
        <label className="flex items-center gap-2">
          <span>Âm lượng nhạc</span>
          <input type="range" min={0} max={1} step={0.05} defaultValue={view.musicVolume} onChange={(e) => sendControl('custom', `music_vol:${e.target.value}`)} className="w-32" />
        </label>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4">
        <div className="mb-2 font-semibold text-slate-100">🧪 Giả lập người xem (mỗi nút = 1 sự kiện thật qua hệ thống live)</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => emitTest('like', { ...nextFake(), likeCount: 50 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ +50 tim
          </button>
          <button onClick={() => emitTest('like', { ...nextFake(), likeCount: 300 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ +300 tim
          </button>
          {(['LEO', 'NHẢY', 'ĐẨY'] as const).map((c) => (
            <button
              key={c}
              onClick={() => emitTest('chat', { ...nextFake(), comment: c })}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
            >
              💬 {c}
            </button>
          ))}
          <button onClick={() => emitTest('gift', { ...nextFake(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            🎁 Tặng hoa hồng (chỉ cảm ơn)
          </button>
          <button onClick={() => emitTest('follow', nextFake())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            ➕ Follow
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1">Chướng ngại / sự kiện máy:</span>
          <button onClick={() => sendControl('custom', 'force_hazard:yarn')} className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
            🧶 Thả cuộn len
          </button>
          <button onClick={() => sendControl('custom', 'force_hazard:slipper')} className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
            🩴 Thả dép của Sen
          </button>
          <button onClick={() => sendControl('custom', 'force_nap')} className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600">
            😴 Cho Bug ngủ gật
          </button>
          <span className="ml-3">Nhảy tới bậc:</span>
          <input
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-20 rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-white"
            placeholder="0–999"
          />
          <button
            onClick={() => jumpTo && sendControl('custom', `jump_step:${jumpTo}`)}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
          >
            ⏩ Nhảy
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> Bug tự leo +1 bậc mỗi 2 giây. <b className="text-slate-100">Tim</b> của cả phòng dồn thành năng
          lượng: 1 tim = +1 bậc. Chat <b className="text-slate-100">LEO</b> = +3 bậc (mỗi người cách nhau 5 giây),{' '}
          <b className="text-slate-100">NHẢY</b> = vọt +8 bậc nhưng 25% trượt chân tụt 5, <b className="text-slate-100">ĐẨY</b> = dọn cuộn len /
          dép đang lăn xuống chắn đường. Đủ <b className="text-slate-100">1000 bậc</b> là thắng 1 lượt: mưa cá, ghi công người đóng góp nhiều
          nhất, độ khó tăng. Thắng 10 lượt = <b className="text-slate-100">ĐỈNH GÁC MÁI</b>.
        </p>
        <p className="mt-2">
          Lực kéo xuống <b className="text-slate-100">chỉ do máy</b>: cuộn len (−10~25 bậc), dép của Sen (−15), đoạn bậc trơn 300–330 /
          620–650 / 880–910 (leo chậm một nửa), Bug ngủ gật (10 lệnh LEO gọi dậy).{' '}
          <b className="text-slate-100">Quà chỉ được cảm ơn + confetti, không cộng bậc, không mua sức mạnh hay lượt thắng.</b>
        </p>
        <p className="mt-2">
          Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio (trình duyệt bắt buộc có tương
          tác đầu tiên mới cho phát tiếng). MC là giọng nữ.
        </p>
      </div>
    </div>
  );
}
