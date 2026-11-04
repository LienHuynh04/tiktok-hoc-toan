import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useTarot';

// Nút riêng của Phòng Tarot ở trang điều khiển: bỏ lượt + giả lập người xem để thử khi chưa live
const NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'Ngọc Ánh', 'Khánh Ly'];
const fake = (i: number) => ({ username: `khach${i}`, nickname: NAMES[i % NAMES.length], avatar: '' });

export function TarotControls({ view, stageCount = 0 }: { view: StageView | null; stageCount?: number }) {
  const [n, setN] = useState(0);
  const next = () => {
    const i = n;
    setN(n + 1);
    return fake(i);
  };
  const cur = view?.current;

  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Chế độ: <b className="text-amber-300">{view.mode === 'lucky' ? '🍀 Game Lá Bài May Mắn' : '🔮 Xem riêng theo hàng chờ'}</b>
          </div>
          {view.mode === 'lucky' && view.lucky ? (
            <div>
              Vòng: <b>{view.lucky.round}</b> · Pha: <b>{view.lucky.phase === 'pick' ? `Đang chọn lá (còn ${view.lucky.secLeft} giây)` : view.lucky.phase === 'reveal' ? 'Đang lật bài' : 'Đang nghỉ giữa vòng'}</b> · Đã chọn vòng này: <b>{view.lucky.players}</b> bạn
              {view.lucky.top[0] && (
                <>
                  {' '}· Dẫn đầu: <b className="text-amber-300">{view.lucky.top[0].nickname}</b> ({view.lucky.top[0].total} điểm)
                </>
              )}
            </div>
          ) : (
            <div>
              Pha: <b>{view.phase === 'idle' ? 'Đang chờ' : view.phase === 'offer' ? 'Đang chờ chọn lá' : 'Đang đọc bài'}</b> · Đã xem: <b>{view.readings}</b> lượt · Hàng chờ: <b>{view.queue.length}</b> bạn
            </div>
          )}
          {cur ? (
            <div>
              Đang xem cho: <b className="text-amber-300">{cur.nickname}</b> · {cur.topic}
              {view.phase === 'offer' && (
                <>
                  {' '}· còn <b>{cur.secLeft}</b> giây chọn lá
                </>
              )}
            </div>
          ) : (
            <div>Chưa có ai đang được xem.</div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'mode-reading')} disabled={view?.mode !== 'lucky'}>
          🔮 Chế độ xem riêng
        </Btn>
        <Btn onClick={() => sendControl('custom', 'mode-lucky')} disabled={view?.mode === 'lucky'}>
          🍀 Game Lá Bài May Mắn
        </Btn>
        <Btn onClick={() => sendControl('custom', 'skip')} disabled={!cur && view?.mode !== 'lucky'}>
          ⏭ {view?.mode === 'lucky' ? 'Qua pha ngay' : 'Bỏ lượt này'}
        </Btn>
        <Btn
          onClick={() => {
            for (let i = 0; i < 6; i++) setTimeout(() => emitTest('chat', { ...fake(n + i), comment: String(1 + ((n + i) % 3)) }), i * 500);
            setN(n + 6);
          }}
          disabled={view?.mode !== 'lucky' || view?.lucky?.phase !== 'pick'}
        >
          🎲 6 bạn chọn lá (game)
        </Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'TAROT tình yêu' })}>💌 1 bạn xin xem tình yêu</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'tarot công việc' })}>💼 1 bạn xin xem công việc</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'TAROT tài chính' })}>💰 1 bạn xin xem tài chính</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'TAROT' })}>🔮 1 bạn xin xem tổng quan</Btn>
        {[1, 2, 3].map((d) => (
          <Btn key={d} onClick={() => cur && emitTest('chat', { username: cur.username, nickname: cur.nickname, comment: String(d) })} disabled={!cur || view?.phase !== 'offer'}>
            🃏 Người đang xem chọn lá {d}
          </Btn>
        ))}
        <Btn
          onClick={() => {
            for (let i = 0; i < 4; i++) setTimeout(() => emitTest('chat', { ...fake(n + i), comment: ['TAROT tình yêu', 'tarot công việc', 'TAROT tài chính', 'TAROT'][i % 4] }), i * 700);
            setN(n + 4);
          }}
        >
          👥 4 bạn vào hàng chờ
        </Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(3), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(4), giftName: 'Mũ kỳ diệu', giftId: 2, diamondCount: 99, repeatCount: 1 })}>🎁 Quà to</Btn>
        <Btn onClick={() => emitTest('follow', fake(5))}>➕ Follow</Btn>
      </div>
      <p className="text-xs text-slate-500">Mẹo thử nhanh: bấm "1 bạn xin xem tình yêu" rồi bấm "Người đang xem chọn lá 2". Muốn nghe giọng, mở thêm trang stage (link ở thẻ Kết nối) và để thẻ duyệt này im lặng.</p>
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
