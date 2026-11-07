import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useDefense';

// Nút riêng của Mèo Thủ Vườn ở trang điều khiển
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
const TEN = ['Lan Anh', 'Minh Tuấn', 'Thu Trang', 'Quốc Bảo', 'Ngọc Hân', 'Gia Huy', 'Khánh Linh', 'Hải Yến', 'Đức Anh', 'Bảo Ngọc'];
const fake = (i: number) => ({ username: `hs${i}`, nickname: `${HO[i % HO.length]} ${TEN[i % TEN.length]}`, avatar: '' });
const rnd = () => Math.floor(Math.random() * 50);

export function DefenseControls({ view, stageCount = 0 }: { view: StageView | null; stageCount?: number }) {
  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Đợt <b>{view.wave}</b> · {view.phase === 'rest' ? 'đang nghỉ/trồng' : view.phase === 'wave' ? 'đang đánh chuột' : 'thua, chờ ván mới'} · ⭐ <b className="text-amber-300">{view.sun}</b> · nhà ❤️ {view.houseHp} · chuột còn {view.ratsLeft}
          </div>
          <div>
            Đang cầm: <b>{view.offer.name}</b> ({view.offer.cost}⭐) · hậu vệ trên sân: {view.defenders.length} · người trồng: {view.planters}
          </div>
          {view.top[0] && (
            <div>
              Người hùng: <b className="text-emerald-300">{view.top[0].nickname}</b> ({view.top[0].dmg} sát thương, hạ {view.top[0].kills})
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'demo_defense')}>🎬 Demo: trồng sẵn + thả chuột</Btn>
        {[1, 2, 3, 4, 5].map((n) => (
          <Btn key={n} onClick={() => emitTest('chat', { ...fake(rnd()), comment: String(n) })}>
            🌱 Trồng làn {n}
          </Btn>
        ))}
        <Btn onClick={() => emitTest('like', { ...fake(5), likeCount: 120 })}>❤️ 120 tim (mưa nắng)</Btn>
        <Btn onClick={() => emitTest('follow', { ...fake(rnd()) })}>➕ 1 follow (+50⭐)</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(3), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa hồng</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(4), giftName: 'Mũ', giftId: 2, diamondCount: 99, repeatCount: 1 })}>🎁 Quà to</Btn>
      </div>
      <p className="text-xs leading-5 text-slate-400">
        Cách chơi: game tự đổi "hậu vệ đang cầm" mỗi 6 giây. Người xem gõ <b>số làn 1–5</b> là trồng hậu vệ đó bằng bể nắng chung của cả phòng. Đủ 120 tim = mưa nắng +75⭐. Quà chỉ được cảm ơn.
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
