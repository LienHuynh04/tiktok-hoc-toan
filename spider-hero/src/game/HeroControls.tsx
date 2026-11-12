import { sendControl, emitTest } from '../live/page';
import type { HeroView } from './hero';

const Btn = ({ onClick, children, color = 'bg-slate-700 hover:bg-slate-600' }: { onClick: () => void; children: React.ReactNode; color?: string }) => (
  <button onClick={onClick} className={`rounded-lg px-3 py-2 font-semibold text-white ${color}`}>
    {children}
  </button>
);

export function HeroControls({ view, stageCount }: { view: HeroView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const modeText = { run: 'đang chạy nóc nhà', swing: 'đang đu tơ', air: 'đang bay', hang: 'đang treo ngược ngắm phố' }[view.mode];
  const fakeLike = (n: number) =>
    emitTest('like', { username: 'ban-test', nickname: 'Bạn Test', likeCount: n, totalLikes: 0 });
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🕷️ Điều khiển Spider Hero</h2>
        <p className="leading-relaxed">
          Đã bay {(view.dist / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km · {modeText} · tốc độ{' '}
          {view.speedKmh} km/h · tổng tim {view.totalLikes.toLocaleString('vi-VN')} · quỹ tim {view.credit} ·{' '}
          {view.nextTier ? `mốc tiếp: ${view.nextTier.label} (${view.nextTier.cost} tim)` : 'đã mở mọi mốc'} · {stageCount}{' '}
          trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => sendControl('custom', 'demo_hero')} color="bg-rose-600 hover:bg-rose-500">
          🎬 Nạp 620 tim (xem Bão Tơ)
        </Btn>
        <Btn onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}>
          {view.musicOn ? '🔇 Tắt nhạc' : '🎵 Bật nhạc'}
        </Btn>
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

      <div>
        <p className="mb-2 font-semibold text-slate-100">Giả lập thả tim (chế độ TEST — dùng khi chưa live):</p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => fakeLike(1)}>❤️ +1</Btn>
          <Btn onClick={() => fakeLike(10)}>❤️ +10 (nhảy cao)</Btn>
          <Btn onClick={() => fakeLike(50)}>❤️ +50 (đu tốc độ)</Btn>
          <Btn onClick={() => fakeLike(100)}>❤️ +100 (lộn vòng)</Btn>
          <Btn onClick={() => fakeLike(200)}>❤️ +200 (mưa tơ)</Btn>
          <Btn onClick={() => fakeLike(500)} color="bg-indigo-600 hover:bg-indigo-500">❤️ +500 (BÃO TƠ)</Btn>
          <Btn onClick={() => fakeLike(1000)} color="bg-amber-600 hover:bg-amber-500">❤️ +1.000 (VỤ NỔ TƠ)</Btn>
          <Btn onClick={() => fakeLike(5000)} color="bg-rose-700 hover:bg-rose-600">❤️ +5.000 (SIÊU BÃO TƠ)</Btn>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn onClick={() => emitTest('gift', { username: 'ban-test', nickname: 'Bạn Test', giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>
            🌹 Tặng quà thử
          </Btn>
          <Btn onClick={() => emitTest('chat', { username: 'ban-test', nickname: 'Bạn Test', comment: 'hero bay đẹp quá', avatar: '' })}>
            💬 Bình luận thử
          </Btn>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> Hero tự bay liên tục — chạy trên nóc nhà, nhảy qua các toà, bắn tơ đu
          dây, lộn vòng giữa trời, không cần ai điều khiển. Người xem <b className="text-slate-100">thả tim</b> để tạo hiệu
          ứng: tim của cả phòng <b className="text-slate-100">cộng dồn vào quỹ chung</b>, engine tự rút quỹ theo bảng mốc —
          1 tim bắn 1 sợi tơ, 5 tim bắn 5 sợi, 10 nhảy cao, 20 bắn tơ hai tay, 50 đu dây tốc độ cao, 100 lộn vòng, 200 mưa
          tơ nhiều hướng, 500 Bão Tơ, 1.000 Vụ Nổ Tơ, 5.000 Siêu Bão Tơ. Hiệu ứng lớn được ưu tiên, hiệu ứng đang hồi
          chiêu hoặc không hợp trạng thái (nhảy cần đang chạy, lộn cần đang bay) sẽ chờ nhịp sau — không bao giờ cắt ngang
          giữa chừng.
        </p>
        <p className="mt-2">
          Quà tặng chỉ được cảm ơn, <b className="text-slate-100">không mua được hiệu ứng</b> — mọi hiệu ứng đều từ tim của
          cả phòng. Bảng mốc chỉnh trong <span className="font-mono text-slate-100">src/game/config.ts</span> (LIKE_TIERS).
          Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio.
        </p>
      </div>
    </div>
  );
}
