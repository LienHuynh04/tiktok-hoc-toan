import { sendControl } from '../live/page';
import type { BossView } from './boss';

export function BossControls({ view, stageCount }: { view: BossView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">⚔️ Điều khiển Đại Chiến Boss</h2>
        <p className="leading-relaxed">
          Boss <b className="text-slate-100">{view.boss.name}</b> cấp {view.boss.level} · máu {view.boss.hp}/{view.boss.maxHp} ·{' '}
          {view.fighterCount} bạn trong đội · đã hạ {view.totals.bossesDown} boss · {view.totals.hits} đòn trúng · thanh nộ{' '}
          {view.rage.have}/{view.rage.goal} · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => sendControl('custom', 'demo_fight')}
          className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
        >
          💥 Đánh thử 1 đòn
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc sàn đấu' : '🎵 Bật nhạc sàn đấu'}
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
          <b className="text-slate-100">Cách chơi:</b> màn hình hiện câu hỏi (tính nhanh / gõ lại cụm từ / đếm nhanh), người xem{' '}
          <b className="text-slate-100">gõ đáp án đúng là đánh boss 1 đòn</b> — cả phòng đánh cùng lúc, không cần chờ lượt. Đòn
          trúng đầu tiên của mỗi câu nhân đôi, trả lời đúng liên tiếp được cộng thêm sát thương, boss dưới 1/3 máu hóa cuồng nộ
          thì đòn nhân 1,5 lần. Boss gục thì xướng tên người tung đòn kết liễu và top 3 bạn đánh khỏe nhất, rồi boss cấp cao
          hơn xuất hiện. Đủ <b className="text-slate-100">250 tim</b> thì mưa sao băng dội boss mất 5% máu.
        </p>
        <p className="mt-2">
          Quà tặng chỉ được cảm ơn, <b className="text-slate-100">không đổi được sát thương hay điểm</b> — ai cũng mạnh như
          nhau, hơn nhau ở gõ nhanh và đúng. Nhạc nền tự phát khi mở stage và tự nhỏ xuống lúc MC đọc; nếu chưa nghe tiếng, bấm
          Interact 1 lần vào cửa sổ stage trong LIVE Studio.
        </p>
      </div>
    </div>
  );
}
