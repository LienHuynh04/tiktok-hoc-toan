import { emitTest, sendControl } from '../live/page';
import type { WcView } from './wc';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Anh'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach' };
};

export function WcControls({ view, stageCount }: { view: WcView | null; stageCount: number }) {
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🚽 Điều khiển Bug Đi WC</h2>
        <p className="leading-relaxed">
          Cấp táo bón {view.level} · Lượt {view.attempt} ·{' '}
          {view.phase === 'attempt' ? `đang rặn ${Math.floor(view.progressPct)}% (còn ${view.remainSec}s)` : view.phase === 'success' ? 'ĐANG ĂN MỪNG!' : 'nghỉ giữa lượt'} ·{' '}
          nhịp tim {view.likeRate}/giây · 😾 quạu {view.annoyance} · 🐱 mood <b className="text-slate-100">{view.mood}</b> · pose{' '}
          <b className="text-slate-100">{view.pose}</b>
          {view.sulking ? ` · ĐANG DỖI (còn ${view.sulkSec}s)` : ''}
          {view.waterSec > 0 ? ` · 💧 NƯỚC còn ${view.waterSec}s` : ''}
          {view.fiberSec > 0 ? ` · 🥬 XƠ còn ${view.fiberSec}s` : ''}
          {view.combo > 0 ? ` · 🔥 combo rặn ${view.combo} người` : ''} · đã thắng {view.totals.successes} lượt · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => sendControl('custom', 'force_success')} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
          🎉 Ép thành công
        </button>
        <button onClick={() => sendControl('custom', 'force_timeout')} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500">
          ⏰ Ép hết giờ
        </button>
        <button onClick={() => sendControl('custom', 'force_sulk')} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500">
          😾 Ép Bug dỗi
        </button>
        <button
          onClick={() => sendControl('custom', view.musicOn ? 'music_off' : 'music_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.musicOn ? '🔇 Tắt nhạc' : '🎵 Bật nhạc'}
        </button>
        <label className="flex items-center gap-2">
          <span>Âm lượng nhạc</span>
          <input type="range" min={0} max={1} step={0.05} defaultValue={view.musicVolume} onChange={(e) => sendControl('custom', `music_vol:${e.target.value}`)} className="w-28" />
        </label>
        <button
          onClick={() => sendControl('custom', view.catOn ? 'cat_off' : 'cat_on')}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          {view.catOn ? '🐱🔇 Tắt tiếng mèo' : '🐱🔊 Bật tiếng mèo'}
        </button>
        <label className="flex items-center gap-2">
          <span>Âm lượng tiếng mèo</span>
          <input type="range" min={0} max={1} step={0.05} defaultValue={view.catVolume} onChange={(e) => sendControl('custom', `cat_vol:${e.target.value}`)} className="w-28" />
        </label>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4">
        <div className="mb-2 font-semibold text-slate-100">🧪 Giả lập trong engine (chạy thẳng, không cần sự kiện live)</div>
        <div className="flex flex-wrap gap-1.5">
          {[100, 500].map((n) => (
            <button key={n} onClick={() => sendControl('custom', `sim_likes:${n}`)} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
              ❤️ Tim giả lập ×{n}
            </button>
          ))}
          <button onClick={() => sendControl('custom', 'sim_ran')} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            💪 RẶN giả lập ×5 người
          </button>
          <button onClick={() => sendControl('custom', 'buff_water')} className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600">
            💧 Bật buff NƯỚC
          </button>
          <button onClick={() => sendControl('custom', 'buff_fiber')} className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600">
            🥬 Bật buff RAU/XƠ
          </button>
          <button onClick={() => sendControl('custom', 'sim_tease')} className="rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">
            👉 Chọc giả lập ×3
          </button>
          <button onClick={() => sendControl('custom', 'sim_sorry')} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600">
            🙏 XIN LỖI giả lập ×3
          </button>
          <button onClick={() => sendControl('custom', 'force_sleepy')} className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600">
            😴 Ép Bug ngủ gật
          </button>
          <button onClick={() => sendControl('custom', 'force_max')} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">
            💪 Ép gồng tối đa
          </button>
          <button onClick={() => sendControl('custom', 'wake_bug')} className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600">
            ⏰ Đánh thức Bug
          </button>
          <button onClick={() => sendControl('custom', 'face_happy')} className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-500">
            😂 Ép mặt vui
          </button>
          <button onClick={() => sendControl('custom', 'face_surprised')} className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600">
            😲 Ép mặt ngạc nhiên
          </button>
        </div>
        <div className="mt-3 mb-2 font-semibold text-slate-100">📡 Giả lập sự kiện live (đi qua đúng đường sự kiện TikTok)</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'Bug cố lên nè' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 Chat thường “Bug cố lên nè” (xem bong bóng)
          </button>
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'RẶN' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 Chat RẶN
          </button>
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'cho Bug uống nước nè' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 Chat NƯỚC
          </button>
          <button onClick={() => emitTest('chat', { ...pick(), comment: 'chọc Bug chơi' })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            💬 Chat CHỌC
          </button>
          <button onClick={() => emitTest('like', { ...pick(), likeCount: 120 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ 1 người thả 120 tim
          </button>
          <button onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            🎁 Tặng hoa hồng (chỉ cảm ơn + giấy vệ sinh)
          </button>
          <button onClick={() => emitTest('follow', pick())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            ➕ Follow
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> Bug bị táo bón ngồi bồn cầu. <b className="text-slate-100">Mỗi lượt tim của cả phòng cộng chung</b> thành
          lực rặn (1 tim = 1 điểm, cấp 1 cần 600 điểm, mỗi cấp x1,35). Đầy 100% là RA: Bug nhảy sung sướng, người góp lực nhiều nhất lượt đó là{' '}
          <b className="text-slate-100">Người rặn chính / VUA RẶN 👑</b>. Quá 3 giây không tim, tiến độ <b className="text-slate-100">tụt 0,4%/giây</b> nhưng
          không qua mốc sàn 25/50/75% đã đạt. Quá 4 phút chưa ra: giữ 40% sang lượt sau.
        </p>
        <p className="mt-2">
          Chat (không dấu cũng được): <b className="text-slate-100">RẶN</b> +0,6% ngay + combo · <b className="text-slate-100">NƯỚC</b> lực tim x1,5 trong 10s ·{' '}
          <b className="text-slate-100">RAU/XƠ</b> chặn tụt 10s · <b className="text-slate-100">CỐ LÊN</b> +0,3%. Mọi chat đều hiện thành{' '}
          <b className="text-slate-100">bong bóng thoại cạnh Bug</b> (qua lọc từ cấm). <b className="text-slate-100">CHỌC</b> làm tăng độ quạu 😾: quạu đầy 100 là
          Bug <b className="text-slate-100">dỗi 6 giây</b> — ngừng rặn (tim vô hiệu) mà tiến độ vẫn tụt; chat <b className="text-slate-100">XIN LỖI</b> rút ngắn
          dỗi 1,5s/câu, hết dỗi Bug cộng +2% adrenaline.
        </p>
        <p className="mt-2">
          <b className="text-slate-100">Bug SỐNG (mood + bộ tư thế):</b> Bug có tâm trạng suy từ nhịp tim/độ quạu — focused (rặn thường), pumped (tim ≥8/giây),
          annoyed/furious (quạu 30+/80+), sulking (dỗi, sprite quay lưng thật), sleepy (20s không tim + không chat là gật gù ngủ gật, có Zzz + tiếng ngáy; tim/chat
          đầu tiên làm Bug giật mình tỉnh dậy), bliss (ăn mừng). Tư thế đổi theo mood: gồng tối đa khi tim dải cao / tiến độ ≥90% / combo RẶN ≥8; thắng thì ngồi
          phè phỡn 1,2s rồi mới nhảy. Kèm chuyển động vi mô: thở phồng xẹp, giật tai, chớp mắt, liếc đọc bong bóng chat mới nhất.
        </p>
        <p className="mt-2">
          <b className="text-slate-100">Khuôn mặt theo tương tác (giữ mặt rặn gốc làm nền):</b> quạu 30+ là Bug đổi sang <b className="text-slate-100">mặt liếc xéo
          deadpan</b> (furious 80+ thêm rung mạnh + tiếng xì), ngủ gật dùng <b className="text-slate-100">mặt buồn ngủ</b> tai rũ + bong bóng nước dãi (gật gù nhẹ
          hơn trước). Thêm 2 <b className="text-slate-100">face beat</b> ngắn theo sự kiện — thắng pose mood nhưng không bao giờ đè lúc dỗi/ăn mừng:{' '}
          <b className="text-slate-100">mặt vui toe toét</b> 1,2s khi có quà (kèm lời cảm ơn) và khi combo RẶN chạm 5 / 10 người; <b className="text-slate-100">mặt
          ngạc nhiên</b> mắt tròn miệng O 0,8s khi chạm mốc 25/50/75 (mốc 75 kèm Sen ló vào) và trong khoảnh khắc giật mình tỉnh dậy, sau đó về mặt rặn.
        </p>
        <p className="mt-2">
          <b className="text-slate-100">Quà chỉ được cảm ơn + giấy vệ sinh bay trang trí — không lực, không tiến độ, không buff.</b> MC là giọng nữ hài hước; Bug có
          tiếng mèo tổng hợp (gằn khi rặn, xì khi quạu, tru khi dỗi, grừ khi nhàn, ngáy khi ngủ gật). Nhạc/giọng/tiếng mèo chỉ phát sau khi bấm Interact 1 lần vào
          stage trong LIVE Studio.
        </p>
      </div>
    </div>
  );
}
