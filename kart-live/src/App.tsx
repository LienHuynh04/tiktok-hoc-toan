import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useKart } from './game/useKart';
import { KartStage } from './game/KartStage';
import { KartControls } from './game/KartControls';

export default function App() {
  const game = useKart();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình đua kart 3D
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <KartStage game={game} />
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
          <KartStage game={game} />
        </StageFrame>
      }
      extra={<KartControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
