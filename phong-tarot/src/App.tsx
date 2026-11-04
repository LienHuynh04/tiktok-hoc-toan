import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useTarot } from './game/useTarot';
import { TarotStage } from './game/TarotStage';
import { TarotControls } from './game/TarotControls';

export default function App() {
  const game = useTarot();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình phòng tarot
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <TarotStage game={game} />
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
          <TarotStage game={game} />
        </StageFrame>
      }
      extra={<TarotControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
