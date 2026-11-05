import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useBoss } from './game/useBoss';
import { BossStage } from './game/BossStage';
import { BossControls } from './game/BossControls';

export default function App() {
  const game = useBoss();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình đại chiến boss
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <BossStage game={game} />
        </StageFrame>
      </div>
    );
  }

  // Trang điều khiển: xem trước = ảnh chụp từ trang stage, im lặng
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      preview={
        <StageFrame maxHeight={window.innerHeight - 40}>
          <BossStage game={game} />
        </StageFrame>
      }
      extra={<BossControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
