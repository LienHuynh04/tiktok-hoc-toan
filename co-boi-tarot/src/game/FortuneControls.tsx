import { useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useFortune';
import { formatPoints } from './fortune';

// Nút riêng của Cô Bói Tarot ở trang điều khiển: điều khiển lượt xem, giả lập khách/điểm/quà, hàng chờ
const NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'Ngọc Ánh', 'Khánh Ly'];
const fake = (i: number) => ({ username: `khach${i}`, nickname: NAMES[i % NAMES.length], avatar: '' });

const QUESTIONS = [
  'Cô ơi, chuyện tình cảm sắp tới của em thế nào?',
  'Công việc của em tháng này có thuận lợi không cô?',
  'Em sắp thi rồi, kết quả có tốt không cô?',
  'Chuyện tiền bạc cuối năm của em ra sao cô ơi?',
  'Gia đình em sắp tới có chuyện gì vui không?',
  'HỎI: Em có nên đổi việc lúc này không cô?',
];

const PHASE_LABEL: Record<string, string> = {
  idle: 'Đang chờ khách',
  welcome: 'Khách vừa ngồi vào bàn',
  deal: 'Đang trải bài',
  flip: 'Đang lật bài',
  reading: 'Đang đọc bài',
  rest: 'Nghỉ giữa hai lượt',
};

export function FortuneControls({ view, stageCount = 0, musicOn = true }: { view: StageView | null; stageCount?: number; musicOn?: boolean }) {
  const [n, setN] = useState(0);
  const [qi, setQi] = useState(0);
  const next = () => {
    const i = n;
    setN(n + 1);
    return fake(i);
  };
  const askQuestion = () => {
    const who = next();
    const q = QUESTIONS[qi % QUESTIONS.length];
    setQi(qi + 1);
    emitTest('chat', { ...who, comment: q });
    return who;
  };
  const cur = view?.current;

  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Pha: <b>{PHASE_LABEL[view.phase] ?? view.phase}</b> · Đã xem: <b>{view.readings}</b> lượt · Hàng chờ: <b>{view.queueCount}</b> người
          </div>
          {cur ? (
            <div>
              Đang xem cho: <b className="text-amber-300">{cur.nickname}</b> · ⭐ {formatPoints(cur.points)} điểm · {cur.themeLabel} · Nhân vật:{' '}
              <b>{cur.guestChar ? `${cur.guestChar.id} (${cur.guestChar.gender === 'm' ? 'nam' : 'nữ'})` : 'chưa có'}</b>
              <div className="text-slate-300">Câu hỏi: {cur.question}</div>
            </div>
          ) : (
            <div>Chưa có khách nào đang ngồi ở bàn.</div>
          )}
          <div className="mt-1 text-slate-400">
            Nhân vật khách: khách ngồi vào bàn được bốc 1 trong 12 nhân vật (6 nam, 6 nữ). Khách đang ngồi gõ <b className="text-slate-200">NAM</b> hoặc{' '}
            <b className="text-slate-200">NỮ</b> là đổi ngay sang nhân vật đúng giới; người còn trong hàng chờ gõ trước cũng được, tới lượt sẽ bốc đúng giới đã chọn.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'skip')} disabled={!cur}>
          ⏭ Bỏ lượt này
        </Btn>
        <Btn onClick={() => sendControl('custom', 'next')} disabled={!cur && !view?.queueCount}>
          ⏩ Sang khách tiếp
        </Btn>
        <Btn onClick={() => sendControl('custom', 'endReading')} disabled={!cur}>
          ⏹ Kết thúc phần đọc
        </Btn>
        <Btn onClick={() => sendControl('custom', musicOn ? 'music_off' : 'music_on')}>{musicOn ? '🔇 Tắt nhạc' : '🎵 Bật nhạc'}</Btn>
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={askQuestion}>🔮 1 khách hỏi câu mới</Btn>
        <Btn
          onClick={() => {
            const who = askQuestion();
            setTimeout(() => emitTest('like', { ...who, likeCount: 100 }), 600);
          }}
        >
          ❤️ Khách mới + thả 100 tim
        </Btn>
        <Btn
          onClick={() => {
            const who = view?.queue[0] ?? cur;
            if (who) emitTest('like', { username: who.username, nickname: who.nickname, likeCount: 100 });
          }}
          disabled={!view?.queue.length && !cur}
        >
          ❤️ Người đầu hàng +100 tim
        </Btn>
        <Btn
          onClick={() => cur && emitTest('chat', { username: cur.username, nickname: cur.nickname, comment: 'NAM' })}
          disabled={!cur}
        >
          🚹 Khách đang ngồi gõ NAM
        </Btn>
        <Btn
          onClick={() => cur && emitTest('chat', { username: cur.username, nickname: cur.nickname, comment: 'NỮ' })}
          disabled={!cur}
        >
          🚺 Khách đang ngồi gõ NỮ
        </Btn>
        <Btn onClick={() => emitTest('gift', { ...next(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa hồng (+1 điểm)</Btn>
        <Btn onClick={() => emitTest('gift', { ...next(), giftName: 'Mũ kỳ diệu', giftId: 2, diamondCount: 99, repeatCount: 1 })}>🎁 Quà to (+99 điểm)</Btn>
        <Btn onClick={() => emitTest('follow', next())}>➕ Follow</Btn>
      </div>

      {view && view.queue.length > 0 && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm">
          <div className="mb-2 font-semibold">Hàng chờ theo điểm (cao lên trước)</div>
          <div className="space-y-1.5">
            {view.queue.map((q, i) => (
              <div key={q.username} className="flex items-center gap-2 rounded-lg bg-slate-900 px-2.5 py-1.5">
                <span className="w-6 font-extrabold text-amber-300">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  <b>{q.nickname}</b> <span className="text-amber-200">⭐{formatPoints(q.points)}</span>
                  <span className="block truncate text-xs text-slate-400">{q.question}</span>
                </span>
                <button
                  onClick={() => sendControl('custom', `remove:${q.username}`)}
                  className="rounded-md bg-rose-800 px-2 py-1 text-xs text-white hover:bg-rose-700"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Mẹo thử nhanh: bấm "1 khách hỏi câu mới" vài lần cho đông hàng chờ, rồi bấm "Người đầu hàng +100 tim" và "Tặng hoa hồng" để xem điểm đổi thứ tự. Muốn nghe giọng và nhạc, mở thêm trang stage (link ở thẻ Kết nối) và bấm Interact 1 lần vào cửa sổ stage trong LIVE Studio.
      </p>
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
