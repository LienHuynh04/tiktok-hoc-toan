import { sendControl } from '../live/page';
import type { RpsView } from './rps';

export function RpsControls({ view }: { view: RpsView | null; stageCount: number }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <h2 className="mb-2 font-semibold">🥊 Điều khiển sàn đấu oẳn tù xì</h2>
      <div className="mb-2 text-sm text-slate-300">
        {view ? (
          <>
            Vòng {view.session} · trận {view.matchNo}/{view.matchesPerSession} · {view.studentCount} khán giả ·{' '}
            {view.waiting.length} bạn ghế chờ · hàng chờ {view.queue.length} · cả nhà thắng {view.totals.studentWins} — chủ phòng thắng{' '}
            {view.totals.adminWins} · {view.totals.throws} lượt ném · chuông {view.bell.have}/{view.bell.goal}
          </>
        ) : (
          'Đang chờ trang stage…'
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => void sendControl('custom', 'demo_duel')}
          className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          ▶️ Đấu thử 1 lượt
        </button>
        {view?.musicOn ? (
          <button
            onClick={() => void sendControl('custom', 'music_off')}
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            🔇 Tắt nhạc sàn đấu
          </button>
        ) : (
          <button
            onClick={() => void sendControl('custom', 'music_on')}
            className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            🎵 Bật nhạc sàn đấu
          </button>
        )}
        <label className="flex items-center gap-2 rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-slate-200">
          🔊 Nhạc
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((view?.musicVolume ?? 0.9) * 100)}
            onChange={(e) => void sendControl('custom', `music_vol:${Number(e.target.value) / 100}`)}
            className="w-28 accent-sky-500"
          />
        </label>
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed text-slate-400">
        <p>
          <b className="text-slate-200">Cách chơi:</b> người xem gõ <b className="text-slate-200">“kéo” / “búa” / “bao”</b>{' '}
          là thách đấu chủ phòng (lượt ném đầu khóa sẵn đòn đó, giữ bí mật tới lúc mở), hoặc gõ <b className="text-slate-200">“chơi”</b>{' '}
          để xếp hàng. Mỗi trận <b className="text-slate-200">3 tim</b>: thắng 1 lượt ném thì chủ phòng mất 1 tim, hòa ném lại,
          từ lượt ném 7 là <b className="text-slate-200">đột tử</b> (thua 1 lượt là thua cả trận). Thắng trận được{' '}
          <b className="text-slate-200">1 sao</b>, <b className="text-slate-200">thua trận thì ra ghế chờ</b>: qua 3 trận nữa
          hoặc hết 60 giây thì được về. Đủ 300 tim thì chuông reo, cả ghế chờ được về ngay. Hết người thách đấu, chủ phòng
          gọi ngẫu nhiên 1 bạn lên đấu giao lưu — thua cũng không ra ghế chờ. Mỗi vòng 10 trận rồi tổng kết bảng vàng.
        </p>
        <p>
          <b className="text-slate-200">Luật đòn:</b> Búa đập Kéo · Kéo cắt Bao · Bao trùm Búa. Đòn của chủ phòng bốc ngẫu nhiên
          công bằng từng lượt, không ai biết trước.
        </p>
        <p>Quà chỉ được cảm ơn bằng giọng đọc — không đổi được sao hay lượt đấu, để sân chơi công bằng và đúng luật của kênh.</p>
        <p>
          <b className="text-slate-200">Nhạc & giọng đọc:</b> nhạc nền lớp học (soạn sẵn trong trang, không file ngoài) tự
          phát khi mở stage và tự nhỏ xuống lúc chủ phòng đọc. Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: bấm{' '}
          <b className="text-slate-200">Interact</b> một lần vào cửa sổ stage trong LIVE Studio lúc bắt đầu buổi là cả nhạc
          lẫn giọng đọc cùng lên.
        </p>
      </div>
    </section>
  );
}
