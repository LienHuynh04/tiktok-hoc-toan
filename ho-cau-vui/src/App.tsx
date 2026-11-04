import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useFishing } from './game/useFishing';
import { FishStage } from './game/FishStage';
import { FishControls } from './game/FishControls';

export default function App() {
  const game = useFishing();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình hồ câu
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <FishStage game={game} />
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
          <FishStage game={game} />
        </StageFrame>
      }
      extra={<FishControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
