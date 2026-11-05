import { sendControl } from '../live/page';
import type { RpsView } from './rps';

export function RpsControls({ view }: { view: RpsView | null; stageCount: number }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <h2 className="mb-2 font-semibold">✊ Điều khiển lớp oẳn tù xì</h2>
      <div className="mb-2 text-sm text-slate-300">
        {view ? (
          <>
            Tiết {view.session} · lượt {view.duelNo}/{view.duelsPerSession} · {view.studentCount} bạn trong lớp ·{' '}
            {view.waiting.length} bạn phòng chờ · hàng chờ {view.queue.length} · lớp thắng {view.totals.studentWins} — cô thắng{' '}
            {view.totals.adminWins} · hòa {view.totals.draws} · chuông {view.bell.have}/{view.bell.goal}
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
            🔇 Tắt nhạc lớp học
          </button>
        ) : (
          <button
            onClick={() => void sendControl('custom', 'music_on')}
            className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            🎵 Bật nhạc lớp học
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
          là thách đấu cô giáo ngay bằng đòn đó (đòn giữ bí mật tới lúc mở), hoặc gõ <b className="text-slate-200">“chơi”</b>{' '}
          để xếp hàng rồi ra đòn trong 10 giây khi được gọi lên bảng. Hết người thách đấu, cô tự gọi ngẫu nhiên 1 bạn đang
          ngồi lớp lên đấu thử — bạn đó không ra đòn thì bỏ qua, không phạt. Thắng cô được <b className="text-slate-200">1 sao</b>,
          hòa thì đấu lại 1 lần, <b className="text-slate-200">thua thì ra phòng chờ</b>: qua 3 lượt đấu hoặc hết 60 giây thì
          được về lớp. Đủ 300 tim thì chuông reo, cả phòng chờ được về lớp ngay. Mỗi tiết 15 lượt rồi tổng kết bảng vàng.
        </p>
        <p>
          <b className="text-slate-200">Luật đòn:</b> Búa đập Kéo · Kéo cắt Bao · Bao trùm Búa. Đòn của cô bốc ngẫu nhiên
          công bằng từng lượt, không ai biết trước.
        </p>
        <p>Quà chỉ được cảm ơn bằng giọng đọc — không đổi được sao hay lượt đấu, để sân chơi công bằng và đúng luật của kênh.</p>
        <p>
          <b className="text-slate-200">Nhạc & giọng đọc:</b> nhạc nền lớp học (soạn sẵn trong trang, không file ngoài) tự
          phát khi mở stage và tự nhỏ xuống lúc cô đọc. Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: bấm{' '}
          <b className="text-slate-200">Interact</b> một lần vào cửa sổ stage trong LIVE Studio lúc bắt đầu buổi là cả nhạc
          lẫn giọng đọc cùng lên.
        </p>
      </div>
    </section>
  );
}
