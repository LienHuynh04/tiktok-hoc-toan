import { emitTest, sendControl } from '../live/page';
import type { BubblesView } from './bubbles';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Anh'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach' };
};

export function BubblesControls({ view, stageCount }: { view: BubblesView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const ownerBubble = view.bubbles.find((b) => !b.bot);
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🫧 Điều khiển Bong Bóng Avatar</h2>
        <p className="leading-relaxed">
          Vòng {view.round} · {view.phase === 'battle' ? 'đang nổi' : `nghỉ giữa vòng (còn ${view.intermissionSec}s)`} ·{' '}
          {view.aliveTotal} bong bóng trên sân ({view.aliveReal} người thật) · đã nổ {view.totals.pops} lần cả buổi
          {view.goldenName ? ` · ✨ bong bóng vàng: ${view.goldenName}` : ''}
          {view.gustDir !== null ? ' · 🌀 đang có gió quạt' : ''} · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => sendControl('custom', 'fan_now')} className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500">
          🌀 Thổi gió quạt ngay
        </button>
        <button onClick={() => sendControl('custom', 'paw_now')} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500">
          🐾 Chân Bug quệt bong bóng to nhất
        </button>
        <button onClick={() => sendControl('custom', 'golden_now')} className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-400">
          ✨ Bật bong bóng vàng
        </button>
        <button onClick={() => sendControl('custom', 'force_round_end')} className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500">
          🏁 Kết thúc vòng ngay
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc' : '🎵 Bật nhạc'}
        </button>
        <label className="flex items-center gap-2">
          <span>Âm lượng nhạc</span>
          <input type="range" min={0} max={1} step={0.05} defaultValue={view.musicVolume} onChange={(e) => sendControl('custom', `music_vol:${e.target.value}`)} className="w-32" />
        </label>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4">
        <div className="mb-2 font-semibold text-slate-100">🧪 Giả lập bong bóng (chạy thẳng trong engine, không cần sự kiện live)</div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 5, 12].map((n) => (
            <button
              key={n}
              onClick={() => sendControl('custom', `sim_bubbles:${n}`)}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              🫧 Thả {n} bong bóng giả lập
            </button>
          ))}
          <button onClick={() => sendControl('custom', 'sim_grow')} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ Tim giả lập (bong bóng giả lập to nhất +36%)
          </button>
        </div>
        <div className="mt-3 mb-2 font-semibold text-slate-100">📡 Giả lập sự kiện live (đi qua đúng đường sự kiện TikTok)</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => emitTest('member', pick())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            👋 1 người lạ vào phòng (có bong bóng ngay)
          </button>
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'cho mình một bong bóng!' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 1 người lạ comment (có bong bóng mới)
          </button>
          <button
            onClick={() => ownerBubble && emitTest('like', { username: ownerBubble.username, nickname: ownerBubble.nickname, likeCount: 1 })}
            disabled={!ownerBubble}
            className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600 disabled:opacity-40"
          >
            ❤️ Chủ bong bóng {ownerBubble ? `“${ownerBubble.nickname}”` : '…'} thả tim (bong bóng của họ +3%)
          </button>
          <button onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            🎁 Tặng hoa hồng (chỉ cảm ơn + bong bóng tim)
          </button>
          <button onClick={() => emitTest('follow', pick())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            ➕ Follow
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> người xem <b className="text-slate-100">vào phòng hoặc comment bất kỳ</b> là có một bong
          bóng xà phòng mang <b className="text-slate-100">avatar TikTok của chính họ</b> nổi lên sân (không có avatar thì hiện chữ cái đầu trên
          đĩa màu). Bong bóng tự trôi, tự đụng vào nhau liên tục.
        </p>
        <p className="mt-2">
          Bong bóng <b className="text-slate-100">chỉ to bằng tương tác của chính chủ</b>: thả tim +3% mỗi lượt (gộp nhịp 1,5 giây), chat +1% mỗi
          tin, trần <b className="text-slate-100">×2,2</b>. Đụng nhau: nếu một bong bóng to hơn ít nhất <b className="text-slate-100">35%</b> và
          cú đụng đủ mạnh thì bong bóng nhỏ hơn <b className="text-slate-100">nứt 1 vết</b>; 3 vết là <b className="text-slate-100">nổ BỐP</b>,
          người làm nổ +1 điểm "nổ" (đang vàng thì +2). Bong bóng nổ thì 8 giây sau chủ của nó comment lại để có bong bóng mới.
        </p>
        <p className="mt-2">
          Sự kiện máy: ~50 giây có <b className="text-slate-100">gió quạt</b> thổi cả đàn bong bóng 3 giây; ~2–3 phút <b className="text-slate-100">chân
          Bug</b> quệt bong bóng to nhất (nứt liền 2 vết); ~90 giây có 1 <b className="text-slate-100">bong bóng vàng</b> 15 giây (không bị nứt, làm nổ
          tính đôi). Còn tối đa 1 bong bóng người thật (khi vòng đã có ≥3 người thật) là kết vòng: người trụ lại là{' '}
          <b className="text-slate-100">Vua Bong Bóng</b> +1 điểm thắng, nghỉ 8 giây hiện bảng rồi tự mở vòng mới. Ít người thật thì bong bóng BOT 🤖
          vào sưởi sân và rút khi đủ 4 người thật; bot không bao giờ gây nứt và không bao giờ thắng vòng.{' '}
          <b className="text-slate-100">Quà chỉ được cảm ơn + bong bóng tim trang trí bay lên — không to thêm, không chống nứt, không điểm.</b>
        </p>
        <p className="mt-2">
          Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio. MC là giọng nữ.
        </p>
      </div>
    </div>
  );
}
