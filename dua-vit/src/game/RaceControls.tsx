import { sendControl } from '../live/page';
import type { RaceView } from './race';

export function RaceControls({ view, stageCount }: { view: RaceView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const phaseText = { lobby: 'đang chờ xuất phát', race: 'đang đua', finish: 'đang chờ cán đích', podium: 'bục vinh quang' }[view.phase];
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🦆 Điều khiển Đua Vịt</h2>
        <p className="leading-relaxed">
          Chặng {Math.max(1, view.raceNo)} · {phaseText} · {view.racerCount} tay đua ·{' '}
          {view.event ? `khẩu lệnh "${view.event.word}" còn ${view.event.remainSec}s · ` : ''}gió thuận {view.tailwind.meter}/{view.tailwind.goal} ·{' '}
          {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => sendControl('custom', 'demo_race')}
          className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
        >
          🏎️ Đua thử ngay
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc đường đua' : '🎵 Bật nhạc đường đua'}
        </button>
        <label className="flex items-center gap-2">
          <span>Âm lượng nhạc</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            defaultValue={view.musicVolume}
            onChange={(e) => sendControl('custom', `music_vol:${e.target.value}`)}
            className="w-32"
          />
        </label>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> người xem bình luận bất cứ chữ gì là có ngay 1 bé vịt đua mang tên mình
          (mèo, thỏ, cáo, gấu trúc, chó hoặc gà — hệ thống tự chọn theo tài khoản). Cứ ~13 giây màn hình hiện 1{' '}
          <b className="text-slate-100">khẩu lệnh</b> (BƠI, QUẠT, ĐẠP...), ai gõ đúng trong 5 giây thì vịt của mình{' '}
          <b className="text-slate-100">bốc tốc 4 giây</b>. Đủ 150 tim thì <b className="text-slate-100">gió thuận</b> thổi cả
          đoàn tăng tốc 10 giây. Ai về đích trước là vô địch chặng, được lên bục vinh quang và tính vào bảng Vua Tốc Độ.
        </p>
        <p className="mt-2">
          Quà tặng chỉ được cảm ơn, <b className="text-slate-100">không mua được tốc độ</b> — thắng thua do gõ nhanh và may
          mắn của từng chặng. Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE
          Studio.
        </p>
      </div>
    </div>
  );
}
