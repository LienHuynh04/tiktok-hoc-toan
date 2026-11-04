import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useIQ } from './game/useIQ';
import { IQStage } from './game/IQStage';
import { IQControls } from './game/IQControls';

export default function App() {
  const game = useIQ();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <IQStage game={game} />
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
          <IQStage game={game} />
        </StageFrame>
      }
      extra={<IQControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
