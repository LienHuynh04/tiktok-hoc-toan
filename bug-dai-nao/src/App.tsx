import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useBug } from './game/useBug';
import { BugStage } from './game/BugStage';
import { BugControls } from './game/BugControls';

export default function App() {
  const game = useBug();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu nhà Sen
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <BugStage game={game} />
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
          <BugStage game={game} />
        </StageFrame>
      }
      extra={<BugControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
