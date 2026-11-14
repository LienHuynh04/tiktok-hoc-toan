import { useMemo } from 'react';
import './arena.css';
import type { ArenaState } from './useArena';
import type { CatView } from './arena';

/** Cá SVG nhỏ cho mưa cá ăn mừng hạ boss (vẽ inline, không dùng file ngoài) */
function FishSvg({ size, flip }: { size: number; flip?: boolean }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 60 37" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M4 18 C16 4 34 2 46 12 L58 4 L55 18 L58 33 L45 25 C33 35 15 33 4 18 Z" fill="#5b9bd5" />
      <path d="M10 20 C20 10 36 9 45 15" stroke="#bcd9f2" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="15" r="3" fill="#173a52" />
    </svg>
  );
}

function hpColor(hp: number, max: number) {
  const pct = hp / max;
  return pct > 0.5 ? '#58b368' : pct > 0.25 ? '#f0a13c' : '#e0483e';
}

function CatBadge({ cat }: { cat: CatView }) {
  const ring = `hsl(${cat.hue} 68% 52%)`;
  const face = `hsl(${cat.hue} 82% 89%)`;
  const initial = (cat.nickname.trim()[0] ?? '?').toUpperCase();
  return (
    <div
      className="absolute z-20 flex w-[190px] flex-col items-center"
      style={{
        left: cat.x,
        top: cat.y,
        transform: 'translate(-50%, -50%)',
        transition: 'left 100ms linear, top 100ms linear',
        opacity: cat.ko ? 0.55 : 1,
        filter: cat.ko ? 'grayscale(0.7)' : cat.hitFlash ? 'brightness(1.55) saturate(0.5)' : undefined,
      }}
    >
      <div className="arena-cat-bob relative">
        {/* tai mèo */}
        <div className="absolute -top-[13px] left-[7px] h-[36px] w-[36px] rotate-[-14deg] rounded-[8px]" style={{ backgroundColor: ring }} />
        <div className="absolute -top-[13px] right-[7px] h-[36px] w-[36px] rotate-[14deg] rounded-[8px]" style={{ backgroundColor: ring }} />
        {/* mặt mèo: avatar hoặc chữ cái đầu */}
        <div
          className="relative flex h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-full shadow-lg"
          style={{ border: `7px solid ${ring}`, backgroundColor: cat.bot ? '#dfe5ea' : face }}
        >
          {cat.bot ? (
            <span className="text-[52px] leading-none">🤖</span>
          ) : cat.avatar ? (
            <img src={cat.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <span className="text-[46px] font-black" style={{ color: `hsl(${cat.hue} 55% 32%)` }}>
              {initial}
            </span>
          )}
        </div>
        {cat.crown && cat.alive && <div className="absolute -top-[38px] left-1/2 -translate-x-1/2 text-[38px] leading-none">👑</div>}
        {cat.ko && (
          <div className="absolute -top-[34px] left-1/2 -translate-x-1/2 text-[40px] leading-none">
            <span className="arena-spin-star">💫</span>
          </div>
        )}
        {cat.giftFx && cat.alive && (
          <>
            <span className="arena-heart text-[26px]" style={{ left: 2, top: 6 }}>💖</span>
            <span className="arena-heart text-[22px]" style={{ left: 78, top: 0, animationDelay: '0.4s' }}>💗</span>
            <span className="arena-heart text-[24px]" style={{ left: 42, top: -8, animationDelay: '0.8s' }}>💖</span>
          </>
        )}
      </div>
      {/* tên + máu + sức mạnh (tên đè lên mép dưới vòng tròn cho gọn, badge không tràn khỏi sàn) */}
      <div className="relative z-10 -mt-[16px] max-w-[186px] truncate rounded-full bg-white/90 px-[10px] py-[1px] text-[21px] font-extrabold leading-tight shadow">
        {cat.nickname}
      </div>
      <div className="mt-[3px] flex items-center gap-[6px]">
        <div className="relative h-[15px] w-[104px] overflow-hidden rounded-full bg-white/80 ring-1 ring-[#b89b6d]">
          <div className="h-full transition-all duration-200" style={{ width: `${(cat.hp / cat.maxHp) * 100}%`, backgroundColor: hpColor(cat.hp, cat.maxHp) }} />
        </div>
        <div className="rounded-full bg-[#4a3226] px-[8px] py-[0px] text-[19px] font-extrabold leading-tight text-[#ffd166]">⚔️{cat.power}</div>
      </div>
      {cat.bot && <div className="mt-[2px] rounded-full bg-[#5b6b7a] px-[8px] py-[0px] text-[16px] font-bold leading-tight text-white">🤖 BOT</div>}
      {cat.ko && <div className="mt-[2px] text-[19px] font-black leading-tight text-[#7b4fa6]">KO!</div>}
    </div>
  );
}

export function ArenaStage({ game }: { game: ArenaState }) {
  const v = game.view;
  const fish = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        delay: `${(i % 8) * 0.3}s`,
        size: 40 + ((i * 17) % 26),
        flip: i % 2 === 0,
      })),
    [],
  );
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: `${(i * 43) % 100}%`,
        delay: `${(i % 9) * 0.15}s`,
        color: ['#f27059', '#f7c948', '#5b9bd5', '#7bc47f', '#b79ced'][i % 5],
      })),
    [],
  );

  if (!v) {
    return (
      <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#f6f0e1] font-sans text-[#4a3226] select-none">
        <div className="flex h-full items-center justify-center text-[38px] font-bold">Đang mở đấu trường mèo… 🐱</div>
      </div>
    );
  }

  const giftFresh = game.lastGift && Date.now() - game.lastGift.at < 6000 ? game.lastGift : null;
  const celebrating = v.celebration !== null;

  return (
    <div className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#f6f0e1] font-sans text-[#4a3226] select-none">
      {/* ===== HUD trên ===== */}
      <div className="absolute inset-x-0 top-0 z-30 px-[26px] pt-[16px]">
        <div className="flex items-start gap-[16px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[12px]">
              <div className="rounded-2xl bg-[#4a3226] px-[14px] py-[5px] text-[36px]">🐱</div>
              <div className="truncate text-[40px] font-black leading-tight">ĐẤU TRƯỜNG MÈO</div>
            </div>
            <div className="mt-[2px] text-[23px] font-semibold text-[#8a6a52]">
              Vòng {v.round} · {v.aliveTotal} mèo trong sân ({v.aliveReal} mèo người thật) · trụ lại cuối cùng là thắng vòng
            </div>
            <div className="mt-[8px] rounded-[18px] bg-white/75 px-[16px] py-[9px] text-[22px] font-semibold leading-snug shadow ring-1 ring-[#e2d3b8]">
              💬 <b>Comment bất kỳ</b> là mèo của bạn vào sân · Chat càng nhiều mèo càng <b>mạnh</b> · ❤️ Thả tim <b>hồi máu cho mèo của bạn</b>
              <br />
              🎁 Quà chỉ để cảm ơn — <b>không</b> tăng máu hay sức mạnh · 🐱 Boss Bug Mập ghé sân mỗi ~3 phút
            </div>
            {giftFresh && (
              <div className="arena-pop mt-[8px] w-fit rounded-full bg-[#ffd9e8] px-[18px] py-[4px] text-[23px] font-extrabold shadow">
                🎁 {giftFresh.nickname} tặng {giftFresh.giftName} — cảm ơn bạn! 💖
              </div>
            )}
          </div>
          {/* Bảng xếp hạng cả buổi — góc phải trên */}
          <div className="w-[302px] shrink-0 rounded-[18px] bg-[#4a3226] px-[14px] py-[10px] text-[#f6f0e1] shadow-lg">
            <div className="text-[21px] font-black tracking-wide text-[#ffd166]">🏆 BẢNG ĐẤU TRƯỜNG</div>
            {v.board.length === 0 ? (
              <div className="mt-[4px] text-[19px] font-semibold text-[#d8c6a8]">Chưa có điểm — mèo thắng vòng, hạ gục, hạ boss sẽ lên bảng</div>
            ) : (
              <div className="mt-[4px] space-y-[3px]">
                {v.board.slice(0, 5).map((b, i) => (
                  <div key={b.username} className="flex items-center gap-[6px] text-[20px] font-bold leading-tight">
                    <span className="w-[26px] text-center">{i === 0 && b.wins > 0 ? '👑' : `${i + 1}.`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[18px] text-[#ffd166]">🏆{b.wins} ⚔️{b.kos} 🐱{b.bossKills}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-[5px] text-[16px] font-semibold text-[#d8c6a8]">🏆 thắng · ⚔️ hạ gục · 🐱 hạ boss</div>
          </div>
        </div>
      </div>

      {/* ===== Đấu trường: phòng khách nhà Sen (tranh màu nước của kênh) ===== */}
      <div
        className="absolute overflow-hidden rounded-[30px] shadow-xl ring-1 ring-[#d8c6a8]"
        style={{
          left: 36,
          top: 470,
          width: 1008,
          height: 1138,
          backgroundColor: '#e9dcbf',
          backgroundImage: 'url(/assets/room-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 62%',
        }}
      >
        <div className="absolute inset-0 bg-[#fff8ea]/10" />
      </div>

      {/* ===== Lớp mèo + boss + số sát thương (toạ độ sân khấu) ===== */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {v.cats.map((c) => (
          <CatBadge key={c.username} cat={c} />
        ))}

        {v.boss && (
          <div className="arena-boss-pulse absolute z-30 flex w-[380px] flex-col items-center" style={{ left: v.boss.x, top: v.boss.y }}>
            <div className="mb-[2px] w-[350px]">
              <div className="text-center text-[24px] font-black text-[#8f1d14]" style={{ textShadow: '0 2px 0 #fff, 0 0 10px rgba(255,255,255,.9)' }}>
                🐱 BOSS BUG MẬP · còn {v.boss.remainSec}s
              </div>
              <div className="relative mt-[2px] h-[24px] overflow-hidden rounded-full bg-white/85 ring-2 ring-[#b03a2e]">
                <div className="h-full bg-gradient-to-r from-[#e0483e] to-[#b03a2e] transition-all duration-200" style={{ width: `${(v.boss.hp / v.boss.maxHp) * 100}%` }} />
              </div>
              <div className="text-center text-[21px] font-extrabold text-[#8f1d14]" style={{ textShadow: '0 1px 0 #fff' }}>
                {v.boss.hp}/{v.boss.maxHp} HP
              </div>
            </div>
            <div className="relative flex h-[296px] w-[296px] items-center justify-center">
              <span className="text-[190px] leading-none">🐱</span>
              <img
                src="/assets/boss-bug.png"
                alt="Boss Bug Mập"
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(74,50,38,0.45)]"
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {v.effects.map((fx) => (
          <div
            key={fx.id}
            className="arena-fx absolute z-40 font-black"
            style={{
              left: fx.x,
              top: fx.y,
              fontSize: fx.kind === 'ko' ? 46 : fx.kind === 'pow' ? 30 : 36,
              color: fx.kind === 'dmg' ? '#d92b1f' : fx.kind === 'heal' ? '#2e9e4f' : fx.kind === 'ko' ? '#7b4fa6' : '#dd8500',
            }}
          >
            {fx.text}
          </div>
        ))}
      </div>

      {/* ===== Ăn mừng: hạ boss = mưa cá + confetti; thắng vòng = confetti ===== */}
      {celebrating && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {confetti.map((c, i) => (
            <span key={i} className="arena-confetti" style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color }} />
          ))}
          {v.celebration === 'bossdown' &&
            fish.map((f, i) => (
              <span key={i} className="arena-fish" style={{ left: f.left, animationDelay: f.delay }}>
                <FishSvg size={f.size} flip={f.flip} />
              </span>
            ))}
          <div className="absolute inset-x-0 top-[760px] flex justify-center">
            <div className="arena-pop rounded-[28px] bg-[#4a3226]/92 px-[34px] py-[20px] text-center shadow-2xl">
              <div className="text-[50px] font-black text-[#ffd166]">
                {v.celebration === 'bossdown' ? '🎉 HẠ BOSS BUG MẬP!' : `👑 ${v.lastWinner ?? 'Mèo vô địch'} THẮNG VÒNG ${v.round}!`}
              </div>
              <div className="mt-[3px] text-[29px] font-bold text-white">
                {v.celebration === 'bossdown' ? 'Mọi mèo sống sót +1 điểm thắng — mưa cá ăn mừng!' : 'Vương miện vòng này thuộc về mèo trụ lại cuối cùng!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Giờ nghỉ giữa vòng: bảng xếp hạng to ===== */}
      {v.phase === 'intermission' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2b1c10]/55">
          <div className="arena-pop w-[860px] rounded-[30px] bg-[#fdf8ec] px-[40px] py-[30px] shadow-2xl">
            <div className="text-center text-[46px] font-black">
              {v.lastWinner ? `👑 ${v.lastWinner} THẮNG VÒNG ${v.round}!` : `VÒNG ${v.round} HOÀ!`}
            </div>
            <div className="mt-[6px] text-center text-[27px] font-bold text-[#8a6a52]">
              Vòng mới sau {v.intermissionSec}s — comment sẵn để mèo của bạn vào sân ngay đầu vòng!
            </div>
            <div className="mt-[18px] space-y-[7px]">
              {v.board.length === 0 ? (
                <div className="text-center text-[26px] font-semibold text-[#8a6a52]">Chưa có điểm nào trong buổi</div>
              ) : (
                v.board.map((b, i) => (
                  <div key={b.username} className="flex items-center gap-[12px] rounded-[16px] bg-white px-[18px] py-[8px] text-[28px] font-extrabold shadow-sm ring-1 ring-[#e2d3b8]">
                    <span className="w-[44px] text-center">{i === 0 && b.wins > 0 ? '👑' : `${i + 1}`}</span>
                    <span className="min-w-0 flex-1 truncate">{b.nickname}</span>
                    <span className="whitespace-nowrap text-[24px] text-[#8a6a52]">🏆 {b.wins} thắng · ⚔️ {b.kos} hạ · 🐱 {b.bossKills} boss</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Chân trang ===== */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-[26px] pb-[20px]">
        <div className="rounded-[22px] bg-[#4a3226] px-[20px] py-[14px] text-[#f6f0e1] shadow-xl">
          <div className="flex flex-wrap items-center justify-center gap-[8px] text-[24px] font-extrabold">
            <span className="rounded-full bg-[#f7c948] px-[14px] py-[3px] text-[#4a3226]">💬 COMMENT = THẢ MÈO</span>
            <span className="rounded-full bg-[#ffd9e8] px-[14px] py-[3px] text-[#4a3226]">❤️ TIM = HỒI MÁU MÈO CỦA BẠN</span>
            <span className="rounded-full bg-[#bfe0f2] px-[14px] py-[3px] text-[#4a3226]">⚔️ CHAT NHIỀU = MÈO MẠNH</span>
          </div>
          <div className="mt-[8px] text-center text-[22px] font-semibold leading-snug text-[#e8dcc4]">
            Sức mạnh chỉ kiếm bằng chơi: chat +1 (tối đa +30/vòng), hạ mèo khác +2. Quà chỉ để cảm ơn, không mua được máu hay sức mạnh.
          </div>
          <div className="mt-[4px] text-center text-[20px] text-[#d8c6a8]">
            Đã thả {v.totals.spawns} lượt mèo cả buổi · Boss Bug Mập: 300 + 50×số mèo HP, 60 giây không hạ được là boss đập sân loại 3 mèo yếu nhất
          </div>
        </div>
      </div>
    </div>
  );
}
