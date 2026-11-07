import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useTarot';

// Nút riêng của Auto Tarot Live ở trang điều khiển: bỏ lượt + giả lập người xem để thử khi chưa live
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
            Pha: <b>{view.phase === 'idle' ? 'Đang chờ' : view.phase === 'offer' ? 'Đang chờ chọn lá' : 'Đang đọc bài'}</b> · Đã xem: <b>{view.readings}</b> lượt · Hàng chờ: <b>{view.queue.length}</b> bạn
          </div>
          {cur ? (
            <div>
              Đang xem cho: <b className="text-amber-300">{cur.nickname}</b> · {cur.topic} · trạng thái <b>{cur.state}</b>
              {view.phase === 'offer' && (
                <>
                  {' '}· còn <b>{cur.secLeft}</b> giây chọn lá
                </>
              )}
            </div>
          ) : (
            <div>Chưa có ai đang được xem.</div>
          )}
          {view.sessions.length > 0 && (
            <div className="mt-1 border-t border-white/10 pt-1">
              {view.sessions.map((s, i) => (
                <div key={i}>
                  👤 <b>{s.nickname}</b>: {s.state}
                  {s.topic ? ` · ${s.topic}` : ''}
                  {s.secLeft > 0 ? ` · còn ${s.secLeft}s` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'skip')} disabled={!cur}>
          ⏭ Bỏ lượt này
        </Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'tình yêu' })}>💌 1 bạn gõ thẳng "tình yêu"</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'người cũ' })}>💔 1 bạn xem người cũ</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'tarot công việc' })}>💼 1 bạn TAROT công việc</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'thông điệp vũ trụ' })}>🌌 1 bạn xin thông điệp vũ trụ</Btn>
        <Btn onClick={() => emitTest('chat', { ...next(), comment: 'TAROT' })}>🔮 1 bạn gõ TAROT (chưa chọn chủ đề)</Btn>
        {[1, 2, 3].map((d) => (
          <Btn key={d} onClick={() => cur && emitTest('chat', { username: cur.username, nickname: cur.nickname, comment: String(d) })} disabled={!cur || view?.phase !== 'offer'}>
            🃏 Người đang xem chọn lá {d}
          </Btn>
        ))}
        <Btn
          onClick={() => {
            for (let i = 0; i < 4; i++) setTimeout(() => emitTest('chat', { ...fake(n + i), comment: ['tình yêu', 'công việc', 'người cũ', 'tương lai'][i % 4] }), i * 700);
            setN(n + 4);
          }}
        >
          👥 4 bạn vào hàng chờ
        </Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(3), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(6), giftName: 'Finger Heart', giftId: 3, diamondCount: 5, repeatCount: 1 })}>🫰 Thả tim (ý muốn)</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(7), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 10 })}>🌹×10 Lên Bảng Sao (ý muốn)</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(8), giftName: 'Cỏ bốn lá', giftId: 4, diamondCount: 10, repeatCount: 1 })}>🍀 Cỏ bốn lá (ý muốn)</Btn>
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
