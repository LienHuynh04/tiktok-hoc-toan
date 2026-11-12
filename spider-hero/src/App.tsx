import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useHero } from './game/useHero';
import { HeroStage } from './game/HeroStage';
import { HeroControls } from './game/HeroControls';

export default function App() {
  const game = useHero();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu 3D
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <HeroStage game={game} />
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
          <HeroStage game={game} />
        </StageFrame>
      }
      extra={<HeroControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
