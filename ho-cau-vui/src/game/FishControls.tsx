import { sendControl } from '../live/page';
import type { FishView } from './fishing';
import { SPECIES } from './fishing';

export function FishControls({ view }: { view: FishView | null; stageCount: number }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <h2 className="mb-2 font-semibold">🎣 Điều khiển hồ câu</h2>
      <div className="mb-2 text-sm text-slate-300">
        {view ? (
          <>
            {view.anglerCount} cần thủ · đã câu {view.totalFish} con ({view.totalKg} kg) · cá hiếm {view.rareCount}/{view.rareGoal} ·
            tim {view.likeMeter}/{view.likeGoal}
            {view.golden ? ' · ĐANG CẮN LIÊN TỤC' : ''} · vòng còn {view.roundRemainSec}s
            {view.roundBest ? ` · to nhất vòng: ${view.roundBest.fish} ${view.roundBest.w} kg (${view.roundBest.nickname})` : ''}
          </>
        ) : (
          'Đang chờ trang stage…'
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => void sendControl('custom', 'next_round')}
          className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          ⏭ Kết thúc vòng, trao vương miện
        </button>
        <button
          onClick={() => void sendControl('custom', 'demo_spot')}
          className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
        >
          🎬 Xem thử cảnh chúc mừng
        </button>
        {view?.musicOn ? (
          <button
            onClick={() => void sendControl('custom', 'music_off')}
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            🔇 Tắt nhạc hồ câu
          </button>
        ) : (
          <button
            onClick={() => void sendControl('custom', 'music_on')}
            className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            🎵 Bật nhạc hồ câu
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
          <b className="text-slate-200">Cách chơi:</b> người xem bình luận <b className="text-slate-200">“câu”</b> là xuống hồ
          (vào phòng/follow cũng có cần sẵn). Cá tự cắn câu mỗi 7–18 giây, giật được loài nào nặng bao nhiêu là may rủi công bằng.
          Gõ <b className="text-slate-200">“giật”</b> để giật cần: cá sắp cắn thì lên luôn, chưa cắn thì 40% vớ được cá, 60% hụt
          (nguội 6 giây). Gõ <b className="text-slate-200">“thả mồi”</b> để dụ cá: lần cắn tới đến trong 1–3 giây (nguội 25 giây).
          Ai câu được cá cũng được ống kính tại chỗ focus vào + popup hiện tên cá ngay trên đầu; cá hiếm/to/kỷ lục thì lên cảnh chúc mừng toàn màn hình.
          Vòng 3 phút: cá to nhất vòng nhận 👑. Ai giật được cá hiếm, cá từ 10 kg, hoặc phá kỷ lục vòng (từ 5 kg) thì ống kính chuyển hẳn qua bạn đó 5 giây kèm giọng chúc mừng — cá nhỏ vẫn hiện banner như thường để khỏi gián đoạn liên tục. Đủ 100 cá hiếm hoặc 1000 tim thì cá cắn câu liên tục một lúc.
        </p>
        <p>
          <b className="text-slate-200">Loài cá:</b>{' '}
          {SPECIES.map((sp) => `${sp.name} ${sp.min}–${sp.max}kg`).join(' · ')}. Cá tầm và cá hô là cá hiếm, lên cá là đọc to cả hồ.
        </p>
        <p>Quà chỉ được cảm ơn bằng giọng đọc — không đổi được cá, để sân chơi công bằng và đúng luật của kênh.</p>
        <p>
          <b className="text-slate-200">Nhạc & giọng đọc:</b> nhạc nền hồ câu (soạn sẵn trong trang, không file ngoài) tự phát
          khi mở stage và tự nhỏ xuống lúc MC đọc. Trình duyệt chỉ cho phát tiếng sau tương tác đầu tiên: bấm{' '}
          <b className="text-slate-200">Interact</b> một lần vào cửa sổ stage trong LIVE Studio lúc bắt đầu buổi là cả nhạc
          lẫn giọng đọc cùng lên.
        </p>
      </div>
    </section>
  );
}
