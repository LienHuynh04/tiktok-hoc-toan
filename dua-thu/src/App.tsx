import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useRace } from './game/useRace';
import { RaceStage } from './game/RaceStage';
import { RaceControls } from './game/RaceControls';

export default function App() {
  const game = useRace();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình đua thú
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <RaceStage game={game} />
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
          <RaceStage game={game} />
        </StageFrame>
      }
      extra={<RaceControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
