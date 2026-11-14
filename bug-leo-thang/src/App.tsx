import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useClimb } from './game/useClimb';
import { ClimbStage } from './game/ClimbStage';
import { ClimbControls } from './game/ClimbControls';

export default function App() {
  const game = useClimb();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu cầu thang
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <ClimbStage game={game} />
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
          <ClimbStage game={game} />
        </StageFrame>
      }
      extra={<ClimbControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
