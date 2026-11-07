import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useDefense } from './game/useDefense';
import { DefenseStage } from './game/DefenseStage';
import { DefenseControls } from './game/DefenseControls';

export default function App() {
  const game = useDefense();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình thủ vườn
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <DefenseStage game={game} />
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
          <DefenseStage game={game} />
        </StageFrame>
      }
      extra={<DefenseControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
