import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useIQ';

// Nút riêng của game Tính Toán IQ Cao ở trang điều khiển + giả lập người chơi để thử khi chưa live
const NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'Ngọc Ánh', 'Khánh Ly'];
const fake = (i: number) => ({ username: `khach${i}`, nickname: NAMES[i % NAMES.length], avatar: '' });

export function IQControls({ view, stageCount = 0 }: { view: StageView | null; stageCount?: number }) {
  const [n, setN] = useState(0);
  const next = () => {
    const i = n;
    setN(n + 1);
    return fake(i);
  };
  const ans = view?.answer ?? '';
  const asking = view?.phase === 'ask';

  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Pha: <b>{view.phase === 'ask' ? `Đang hỏi (còn ${view.secLeft} giây)` : view.phase === 'reveal' ? 'Đang công bố đáp án' : view.phase === 'board' ? 'Đang hiện bảng xếp hạng' : 'Đang chờ'}</b> · Câu: <b>{view.round}</b> · Dạng: <b>{view.tag}</b> · Đáp án: <b className="text-amber-300">{ans}</b>
          </div>
          <div>
            Đã đúng câu này: <b>{view.correct.length}</b> bạn · Sai: <b>{view.wrongCount}</b> bạn · Tổng người chơi có điểm: <b>{view.totalPlayers}</b>
            {view.top[0] && (
              <>
                {' '}· Dẫn đầu: <b className="text-amber-300">{view.top[0].nickname}</b> ({view.top[0].score} điểm)
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'skip')} disabled={!view || view.phase === 'idle'}>
          ⏭ Qua câu này
        </Btn>
        <Btn onClick={() => ans && emitTest('chat', { ...next(), comment: ans })} disabled={!asking || !ans}>
          ✅ 1 bạn trả lời đúng
        </Btn>
        <Btn onClick={() => ans && emitTest('chat', { ...next(), comment: String(Number(ans) + 7 || 999) })} disabled={!asking || !ans}>
          ❌ 1 bạn trả lời sai
        </Btn>
        <Btn
          onClick={() => {
            if (!ans) return;
            const wrong = String(Number(ans) + 3 || 998);
            const seq: [number, string][] = [[0, wrong], [1, ans], [2, wrong], [3, ans], [4, ans]];
            seq.forEach(([k, comment], i) => setTimeout(() => emitTest('chat', { ...fake(n + k), comment }), i * 600));
            setN(n + 5);
          }}
          disabled={!asking || !ans}
        >
          👥 5 bạn trả lời (3 đúng, 2 sai)
        </Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(3), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(4), giftName: 'Mũ kỳ diệu', giftId: 2, diamondCount: 99, repeatCount: 1 })}>🎁 Quà to</Btn>
        <Btn onClick={() => emitTest('follow', fake(5))}>➕ Follow</Btn>
      </div>
      <p className="text-xs text-slate-500">Mẹo thử nhanh: bấm "5 bạn trả lời" để xem 3 bạn đúng nhanh nhất chốt câu và cộng điểm. Muốn nghe giọng MC, mở thêm trang stage (link ở thẻ Kết nối).</p>
    </div>
  );
}

function Btn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40">
      {children}
    </button>
  );
}
