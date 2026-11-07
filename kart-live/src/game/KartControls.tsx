import { sendControl } from '../live/page';
import type { KartView } from './kart';

export function KartControls({ view, stageCount }: { view: KartView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const phaseText = { lobby: 'đang chờ xuất phát', countdown: 'đang đếm ngược', race: 'đang đua', podium: 'bục vinh quang' }[view.phase];
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🏎️ Điều khiển Đua Xe Kart Live</h2>
        <p className="leading-relaxed">
          Chặng {Math.max(1, view.raceNo)} · {phaseText} · {view.racerCount} tay đua · {view.totalLikes} tim đã thả ·{' '}
          {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => sendControl('custom', 'demo_race')}
          className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
        >
          🏎️ Đua thử ngay (7 bot)
        </button>
        <button
          onClick={() => sendControl('custom', 'start_race')}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
        >
          🚦 Xuất phát ngay
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
          <b className="text-slate-100">Cách chơi:</b> người xem bình luận bất cứ chữ gì là nhận ngay 1 chiếc kart 3D mang
          tên mình (vào giữa chặng cũng được). Lái bằng bình luận: <b className="text-slate-100">TRÁI / PHẢI</b> đổi làn
          né thùng dầu và vũng nhớt, cán <b className="text-slate-100">đệm phát sáng</b> để nạp nitro. Thanh nitro đầy
          thì chọn 1 kỹ năng: <b className="text-slate-100">NITRO</b> bốc tốc, <b className="text-slate-100">ĐẠN</b> làm
          chậm xe ngay trước mặt, <b className="text-slate-100">KHIÊN</b> chặn 1 đòn.
        </p>
        <p className="mt-2">
          <b className="text-slate-100">Tim &amp; quà (theo đặc tả):</b> thả tim là xe của người thả tăng tốc nhẹ + nạp
          nitro; quà nhỏ bốc tốc 2,5s; quà từ 30 xu bốc tốc 4s + làm chậm xe ngay phía trước; quà VIP từ 100 xu kích
          hoạt SIÊU TỐC x1,6 trong 5s + đầy nitro. Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần
          vào cửa sổ stage trong LIVE Studio.
        </p>
      </div>
    </div>
  );
}
