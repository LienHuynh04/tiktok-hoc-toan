import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { BugView } from './bug';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Anh'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach' };
};

const COMMANDS = ['CHẠY', 'NHẢY', 'ĐẨY', 'LEO', 'ĐU', 'NÉ', 'GIẢ NGỦ', 'ĂN VẠ'];

export function BugControls({ view, stageCount }: { view: BugView | null; stageCount: number }) {
  const [simN, setSimN] = useState(0);
  if (!view) {
    return <p className="text-sm text-slate-400">Đang chờ trang stage chạy game… (mở link stage hoặc đợi vài giây)</p>;
  }
  const applySim = (n: number) => {
    setSimN(n);
    void sendControl('custom', `sim_viewers:${n}`);
  };
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h2 className="mb-2 font-semibold text-slate-100">🐱 Điều khiển Bug Đại Náo Nhà Sen</h2>
        <p className="leading-relaxed">
          Chương {view.chapter} · nhiệm vụ {Math.min(view.missionIdx + 1, 10)}/10: <b className="text-slate-100">{view.missionLabel}</b> · Bug{' '}
          {view.kg.toFixed(1).replace('.', ',')} kg (cấp {view.fatStage} {view.fatName}) · LÌ {view.li}/{view.liMax} · Sen đã bắt {view.catches}/{view.catchesGoal} ·{' '}
          {view.chatters} người đang lái · tốc độ Sen {view.senSpeed} · {stageCount} trang stage đang mở
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => sendControl('custom', 'demo_nao')} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500">
          🎬 Chơi thử (demo)
        </button>
        <button onClick={() => sendControl('custom', 'force_vote')} className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500">
          🗳️ Mở vote ngay
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
        <div className="mb-2 font-semibold text-slate-100">🧪 Giả lập lệnh chat (mỗi nút = 1 người xem gõ)</div>
        <div className="flex flex-wrap gap-1.5">
          {COMMANDS.map((c) => (
            <button
              key={c}
              onClick={() => emitTest('chat', { ...pick(), comment: c })}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => emitTest('like', { ...pick(), likeCount: 120 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ +120 tim
          </button>
          <button onClick={() => emitTest('like', { ...pick(), likeCount: 650 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ +650 tim (lên cấp mập)
          </button>
          <button onClick={() => emitTest('like', { ...pick(), likeCount: 500 })} className="rounded-lg bg-pink-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600">
            ❤️ +500 tim (zoomies)
          </button>
          <button onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
            🎁 Tặng hoa hồng
          </button>
          <button onClick={() => emitTest('follow', pick())} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600">
            ➕ Follow
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span>👥 Giả lập số người đang chơi (để test Sen tăng tốc + ngưỡng combo):</span>
          {[0, 5, 15, 30].map((n) => (
            <button
              key={n}
              onClick={() => applySim(n)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${simN === n ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {n === 0 ? 'Tắt giả lập' : `${n} người`}
            </button>
          ))}
          <span className="text-xs text-slate-400">đang giả lập: {view.simViewers} · thực tế nhận diện: {view.chatters}</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4 leading-relaxed">
        <p>
          <b className="text-slate-100">Cách chơi:</b> cả phòng cùng lái MỘT con Bug bằng lệnh 1–2 chữ trong chat:{' '}
          <b className="text-slate-100">CHẠY, NHẢY, ĐẨY, LEO, ĐU, NÉ, GIẢ NGỦ, ĂN VẠ</b> (không cần gõ dấu). Lệnh chỉ có tác dụng{' '}
          <b className="text-slate-100">đúng ngữ cảnh</b>: ĐẨY khi Bug ở cạnh bàn/kệ/chậu cây/thùng rác/sofa, LEO ở rèm, ĐU khi Bug đã nhảy lên đèn chùm
          (đang ở trên bàn thì gõ NHẢY), NÉ/GIẢ NGỦ/ĂN VẠ khi Sen tới gần. Sai chỗ thì Bug làm trò hề, không bị phạt.
        </p>
        <p className="mt-2">
          Hoàn thành <b className="text-slate-100">danh sách phá 10 nhiệm vụ</b> trước khi Sen bắt đủ 3 lần là cả phòng thắng chương. Nhiệm vụ lớn
          (đu đèn, phá sofa) cần <b className="text-slate-100">combo</b>: nhiều người gõ cùng 1 lệnh trong 5 giây, số người cần thiết tăng theo độ đông của phòng.
          Cứ 2–3 phút có 1 đợt <b className="text-slate-100">vote</b> 10 giây chọn đường đi cho Bug. Tim cả phòng nuôi Bug béo dần 3,2 → 9,0 kg qua 5 cấp
          (giữ nguyên cả buổi, không reset theo chương): béo thì phá khỏe hơn nhưng chạy chậm hơn. Bị Sen chụp trúng mà còn <b className="text-slate-100">LÌ</b>{' '}
          thì tốn 1 LÌ để tuột thoát. <b className="text-slate-100">Quà chỉ được cảm ơn, không mua được điểm/tốc độ/sức mạnh.</b>
        </p>
        <p className="mt-2">
          Nhạc tự phát khi mở stage; nếu chưa nghe tiếng, bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio. MC là giọng nữ.
        </p>
      </div>
    </div>
  );
}
