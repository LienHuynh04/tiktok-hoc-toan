import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useBubbles } from './game/useBubbles';
import { BubblesStage } from './game/BubblesStage';
import { BubblesControls } from './game/BubblesControls';

export default function App() {
  const game = useBubbles();

  // Trang cho TikTok LIVE Studio: chỉ có sân bong bóng avatar
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <BubblesStage game={game} />
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
          <BubblesStage game={game} />
        </StageFrame>
      }
      extra={<BubblesControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
