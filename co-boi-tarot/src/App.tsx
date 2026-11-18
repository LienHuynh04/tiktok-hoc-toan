import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useFortune } from './game/useFortune';
import { FortuneStage } from './game/FortuneStage';
import { FortuneControls } from './game/FortuneControls';

export default function App() {
  const game = useFortune();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình phòng bói
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <FortuneStage game={game} />
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
          <FortuneStage game={game} />
        </StageFrame>
      }
      extra={<FortuneControls view={game.view} stageCount={game.stageCount} musicOn={game.musicOn} />}
    />
  );
}
