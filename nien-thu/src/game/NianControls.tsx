import { sendControl } from '../live/page';
import type { NianView } from './nian';

export function NianControls({ view, stageCount }: { view: NianView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🧨 Điều khiển Đốt Pháo Đuổi Niên</h2>
        <p className="leading-relaxed">
          Niên Thú cấp {view.boss.level} · máu {view.boss.hp}/{view.boss.maxHp} · {view.fighterCount} bạn trong đội · đã đuổi{' '}
          {view.totals.bossesDown} Niên · {view.totals.hits} quả pháo trúng · dây pháo {view.rage.have}/{view.rage.goal} ·{' '}
          {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => sendControl('custom', 'demo_fight')}
          className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
        >
          💥 Châm thử 1 quả pháo
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc Tết' : '🎵 Bật nhạc Tết'}
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
          <b className="text-slate-100">Cách chơi:</b> màn hình hiện câu hỏi (tính nhanh / gõ lại câu chúc Tết / đếm đồ Tết),
          người xem <b className="text-slate-100">gõ đáp án đúng là châm 1 quả pháo nổ vào Niên Thú</b> — cả phòng châm cùng
          lúc, không cần chờ lượt. Quả pháo đầu tiên của mỗi câu nổ gấp đôi, trả lời đúng liên tiếp được cộng thêm sát thương,
          Niên dưới 1/3 máu hóa cuồng nộ thì pháo nhân 1,5 lần. Niên bỏ chạy thì pháo hoa ăn mừng và xướng tên người châm quả
          kết liễu + top 3 tay đốt pháo, rồi Niên cấp cao hơn lại xuống núi. Đủ <b className="text-slate-100">250 tim</b> thì
          cả phòng đốt dây pháo dài, trừ 5% máu Niên.
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
