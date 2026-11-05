import { sendControl } from '../live/page';
import type { ArenaView } from './arena';

export function ArenaControls({ view, stageCount }: { view: ArenaView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const phaseText = { lobby: 'đang mở cổng chờ vào trận', battle: 'đang hỗn chiến', podium: 'đang trao cúp' }[view.phase];
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">👹 Điều khiển Đấu Trường Sinh Tồn</h2>
        <p className="leading-relaxed">
          Vòng {Math.max(1, view.round)} · {phaseText} · {view.poolCount} bạn đã đăng ký · {view.aliveCount}/{view.entrantCount}{' '}
          quái còn sống · vòng độc r={view.ring.r} · mưa hồi phục {view.heal.have}/{view.heal.goal} · {stageCount} trang stage
          đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => sendControl('custom', 'demo_battle')}
          className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
        >
          ⚔️ Mở trận thử ngay
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc đấu trường' : '🎵 Bật nhạc đấu trường'}
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
          <b className="text-slate-100">Cách chơi:</b> người xem bình luận bất cứ chữ gì là có 1 quái nhí vào đấu trường (tối
          đa 24 quái mỗi vòng). Quái tự di chuyển và tự đánh nhau; chủ nhân đổi thế cho quái bằng cách gõ{' '}
          <b className="text-slate-100">"săn"</b> (lao vào đánh), <b className="text-slate-100">"ăn"</b> (né đánh nhau, hồi
          máu) hoặc <b className="text-slate-100">"trốn"</b> (chạy xa kẻ địch). Vòng độc thu hẹp dần, đứng ngoài vòng mất máu.
          Đủ 120 tim thì mưa hồi phục +8 máu cho mọi quái còn sống. Quái cuối cùng còn sống là vô địch vòng.
        </p>
        <p className="mt-2">
          Quà tặng chỉ được cảm ơn, <b className="text-slate-100">không làm quái mạnh hơn</b> — thắng thua do thế đánh và may
          mắn. Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio.
        </p>
      </div>
    </div>
  );
}
