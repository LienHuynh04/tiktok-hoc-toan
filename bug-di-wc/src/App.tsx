import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useWc } from './game/useWc';
import { WcStage } from './game/WcStage';
import { WcControls } from './game/WcControls';

export default function App() {
  const game = useWc();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu Bug Đi WC
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <WcStage game={game} />
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
          <WcStage game={game} />
        </StageFrame>
      }
      extra={<WcControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
