import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useNian } from './game/useNian';
import { NianStage } from './game/NianStage';
import { NianControls } from './game/NianControls';

export default function App() {
  const game = useNian();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình đại chiến boss
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <NianStage game={game} />
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
          <NianStage game={game} />
        </StageFrame>
      }
      extra={<NianControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
