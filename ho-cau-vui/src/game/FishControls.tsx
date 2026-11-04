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
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed text-slate-400">
        <p>
          <b className="text-slate-200">Cách chơi:</b> người xem bình luận <b className="text-slate-200">“câu”</b> là xuống hồ
          (vào phòng/follow cũng có cần sẵn). Cá tự cắn câu mỗi 7–18 giây, giật được loài nào nặng bao nhiêu là may rủi công bằng.
          Vòng 3 phút: cá to nhất vòng nhận 👑. Đủ 100 cá hiếm hoặc 1000 tim thì cá cắn câu liên tục một lúc.
        </p>
        <p>
          <b className="text-slate-200">Loài cá:</b>{' '}
          {SPECIES.map((sp) => `${sp.name} ${sp.min}–${sp.max}kg`).join(' · ')}. Cá tầm và cá hô là cá hiếm, lên cá là đọc to cả hồ.
        </p>
        <p>Quà chỉ được cảm ơn bằng giọng đọc — không đổi được cá, để sân chơi công bằng và đúng luật của kênh.</p>
      </div>
    </section>
  );
}
