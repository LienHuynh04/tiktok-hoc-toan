import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useYoga } from './game/useYoga';
import { YogaStage } from './game/YogaStage';
import { YogaControls } from './game/YogaControls';

export default function App() {
  const game = useYoga();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình phòng yoga
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <YogaStage game={game} />
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
          <YogaStage game={game} />
        </StageFrame>
      }
      extra={<YogaControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
