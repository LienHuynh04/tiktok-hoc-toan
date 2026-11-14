import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useArena } from './game/useArena';
import { ArenaStage } from './game/ArenaStage';
import { ArenaControls } from './game/ArenaControls';

export default function App() {
  const game = useArena();

  // Trang cho TikTok LIVE Studio: chỉ có đấu trường mèo
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <ArenaStage game={game} />
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
          <ArenaStage game={game} />
        </StageFrame>
      }
      extra={<ArenaControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
