import { emitTest, sendControl } from '../live/page';
import type { ArenaView } from './arena';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Anh'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach' };
};

export function ArenaControls({ view, stageCount }: { view: ArenaView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const ownerCat = view.cats.find((c) => !c.bot && c.alive);
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🐱 Điều khiển Đấu Trường Mèo</h2>
        <p className="leading-relaxed">
          Vòng {view.round} · {view.phase === 'battle' ? 'đang đấu' : `nghỉ giữa vòng (còn ${view.intermissionSec}s)`} ·{' '}
          {view.aliveTotal} mèo trong sân ({view.aliveReal} người thật) · đã thả {view.totals.spawns} lượt mèo cả buổi
          {view.boss ? ` · 🐱 BOSS: ${view.boss.hp}/${view.boss.maxHp} HP (còn ${view.boss.remainSec}s)` : ''} · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => sendControl('custom', 'boss_now')} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500">
          🐱 Gọi Boss Bug Mập
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
        <div className="mb-2 font-semibold text-slate-100">🧪 Giả lập mèo đấu (chạy thẳng trong engine, không cần sự kiện live)</div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 5, 12].map((n) => (
            <button
              key={n}
              onClick={() => sendControl('custom', `sim_cats:${n}`)}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              🐱 Thả {n} mèo giả lập
            </button>
          ))}
          <button onClick={() => sendControl('custom', 'sim_power')} className="rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">
            💬 Chat giả lập (+5 sức mạnh cho 1 mèo)
          </button>
          <button onClick={() => sendControl('custom', 'sim_heal')} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ Tim giả lập (hồi máu mèo yếu nhất)
          </button>
        </div>
        <div className="mt-3 mb-2 font-semibold text-slate-100">📡 Giả lập sự kiện live (đi qua đúng đường sự kiện TikTok)</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'cho mèo mình vào sân!' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 1 người lạ comment (thả mèo mới)
          </button>
          <button
            onClick={() => ownerCat && emitTest('like', { username: ownerCat.username, nickname: ownerCat.nickname, likeCount: 1 })}
            disabled={!ownerCat}
            className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600 disabled:opacity-40"
          >
            ❤️ Chủ mèo {ownerCat ? `“${ownerCat.nickname}”` : '…'} thả tim (hồi +2 HP mèo của họ)
          </button>
          <button onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            🎁 Tặng hoa hồng (chỉ cảm ơn + trái tim)
          </button>
          <button onClick={() => emitTest('follow', pick())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            ➕ Follow
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> người xem <b className="text-slate-100">comment bất kỳ</b> là mèo của họ (badge avatar + tai mèo)
          xuất hiện trong phòng khách nhà Sen, tự nảy và đấu với mèo khác khi va chạm. Kẻ mạnh hơn gây sát thương{' '}
          <b className="text-slate-100">4 + chênh lệch sức mạnh</b>; 0 HP là bị loại, vòng sau comment lại để vào sân.
        </p>
        <p className="mt-2">
          Sức mạnh <b className="text-slate-100">chỉ kiếm bằng chơi</b>: mỗi tin chat của chính chủ +1 (tối đa +30/vòng), hạ 1 mèo +2. Người xem{' '}
          <b className="text-slate-100">thả tim thì mèo của chính họ được +2 HP</b> (gộp lượt theo nhịp 2 giây, trần 100 — đúng mẫu tim cá nhân của Đua Vịt).{' '}
          <b className="text-slate-100">Quà chỉ được cảm ơn + trái tim bay quanh mèo người tặng — không HP, không sức mạnh, không sát thương, không bảo vệ.</b>
        </p>
        <p className="mt-2">
          Mỗi ~3 phút (hoặc nút “Gọi Boss”) <b className="text-slate-100">Boss Bug Mập</b> vào sân: máu = 300 + 50 × số mèo đang sống. Hạ được boss thì mọi
          mèo sống sót +1 điểm thắng; quá 60 giây boss đập sân loại 3 mèo yếu nhất. Còn tối đa 1 mèo người thật (khi vòng đã có ≥3 mèo người thật) là kết
          vòng: người thắng +1 điểm, đội vương miện vòng sau, nghỉ 10 giây hiện bảng xếp hạng rồi tự mở vòng mới. Ít người thật thì mèo BOT 🤖 vào sưởi sân
          và rút khi đủ 4 người thật; bot không bao giờ thắng vòng.
        </p>
        <p className="mt-2">
          Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio. MC là giọng nữ.
        </p>
      </div>
    </div>
  );
}
