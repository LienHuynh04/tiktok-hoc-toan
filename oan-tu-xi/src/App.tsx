import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useRps } from './game/useRps';
import { RpsStage } from './game/RpsStage';
import { RpsControls } from './game/RpsControls';

export default function App() {
  const game = useRps();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình lớp học oẳn tù xì
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <RpsStage game={game} />
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
          <RpsStage game={game} />
        </StageFrame>
      }
      extra={<RpsControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
