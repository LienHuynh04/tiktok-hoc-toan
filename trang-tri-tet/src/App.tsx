import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useDecor } from './game/useDecor';
import { DecorStage } from './game/DecorStage';
import { DecorControls } from './game/DecorControls';

export default function App() {
  const game = useDecor();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu ngôi nhà
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <DecorStage game={game} />
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
          <DecorStage game={game} />
        </StageFrame>
      }
      extra={<DecorControls view={game.view} stageCount={game.stageCount} musicOn={game.musicOn} />}
    />
  );
}
