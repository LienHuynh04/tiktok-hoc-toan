import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useDecor';

// Nút riêng của Trang Trí Tết ở trang điều khiển: giả lập người xem xin treo đồ để thử khi chưa live
const NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'Ngọc Ánh', 'Khánh Ly'];
const fake = (i: number) => ({ username: `khach${i}`, nickname: NAMES[i % NAMES.length], avatar: '' });

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-600 active:scale-95">
      {children}
    </button>
  );
}

export function DecorControls({ view, stageCount = 0, musicOn = true }: { view: StageView | null; stageCount?: number; musicOn?: boolean }) {
  const [n, setN] = useState(0);
  const next = () => {
    const i = n;
    setN(n + 1);
    return fake(i);
  };
  const chat = (comment: string) => emitTest('chat', { ...next(), comment });

  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Đã treo: <b className="text-amber-300">{view.total}</b> món · Tim: <b>{view.likes}</b>/{view.likeGoal} · Hàng chờ: <b>{view.queue.length}</b> món
          </div>
          {view.current ? (
            <div>
              Bé An đang treo: <b className="text-amber-300">{view.current.name}</b> cho <b>{view.current.nickname}</b> ({view.current.phase === 'walk' ? 'đang đi' : view.current.phase === 'hang' ? 'đang treo' : 'ăn mừng'})
            </div>
          ) : (
            <div>Chưa có món nào đang treo.</div>
          )}
          {view.top.length > 0 && <div>🌟 Treo nhiều nhất: {view.top.map((t) => `${t.nickname} (${t.count})`).join(' · ')}</div>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => chat('lồng đèn')}>🏮 Xin lồng đèn</Btn>
        <Btn onClick={() => chat('con chó')}>🐶 Xin con chó</Btn>
        <Btn onClick={() => chat('con mèo')}>🐱 Xin con mèo</Btn>
        <Btn onClick={() => chat('bánh chưng')}>🎋 Xin bánh chưng</Btn>
        <Btn onClick={() => chat('máy bay')}>✈️ Xin máy bay</Btn>
        <Btn onClick={() => chat('xe tăng')}>🏷️ Xin món lạ (thẻ tên)</Btn>
        <Btn
          onClick={() => {
            for (let i = 0; i < 4; i++) setTimeout(() => emitTest('chat', { ...fake(n + i), comment: ['hoa mai', 'bao lì xì', 'con gà', 'cầu vồng'][i % 4] }), i * 900);
            setN(n + 4);
          }}
        >
          👥 4 bạn xin đồ liền
        </Btn>
        <Btn onClick={() => emitTest('like', { ...next(), likeCount: 50, totalLikes: 0 })}>❤️ +50 tim</Btn>
        <Btn onClick={() => emitTest('follow', next())}>➕ Follow (tặng lì xì)</Btn>
        <Btn onClick={() => emitTest('gift', { ...next(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa</Btn>
        <Btn onClick={() => sendControl('custom', 'music')}>{musicOn ? '🔊 Nhạc: đang bật' : '🔇 Nhạc: đang tắt'}</Btn>
      </div>
      <p className="text-xs text-slate-500">
        Mẹo thử nhanh: bấm vài nút xin đồ, mở thêm trang stage (link ở thẻ Kết nối) để nghe giọng + nhạc. Trên sân khấu LIVE Studio nhớ Interact 1 chạm đầu buổi để có tiếng.
      </p>
    </div>
  );
}
