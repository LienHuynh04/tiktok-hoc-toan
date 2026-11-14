import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { music } from '../live/music';
import { containsBanned } from '../live/bannedWords';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { BubblesRoom, type Say, type BubblesView } from './bubbles';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

export type StageView = BubblesView;

/**
 * Trang stage chạy engine Bong Bóng Avatar thật (lõi ở bubbles.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy, chỉ vẽ lại ảnh chụp đó nên xem trước khớp với live.
 * MC là giọng NỮ: mọi câu engine sinh đều có tiền tố "F:".
 */
export function useBubbles() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<StageView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number }) | null>(null);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);

  const roomRef = useRef<BubblesRoom | null>(null);
  const dirty = useRef(true);

  const [talk] = useState(() => ({
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
  }));

  // Câu chính (sự kiện lớn) đọc ưu tiên ngay; câu phụ (chào, cảm ơn) chờ lúc MC rảnh.
  const chatter = useRef<{ text: string; priority: boolean; until: number }[]>([]);
  function say(lines: Say[]) {
    const now = Date.now();
    for (const l of lines) {
      if (l.main) {
        voice.say(l.text, true);
      } else {
        const ttl = l.ttl ?? (l.priority ? GAME.giftLineMaxWaitMs : GAME.chatterMaxWaitMs);
        chatter.current.push({ text: l.text, priority: !!l.priority, until: now + ttl });
      }
    }
    if (lines.length) dirty.current = true;
  }
  function flushChatter(room: BubblesRoom, now: number) {
    chatter.current = chatter.current.filter((c) => c.until > now);
    if (voice.busy || !room.chatterWindow(now)) return;
    const i = Math.max(0, chatter.current.findIndex((c) => c.priority));
    const next = chatter.current.splice(i, 1)[0];
    if (next) voice.say(next.text);
  }

  const person = (e: { nickname: string; username: string; avatar: string }) => {
    const nickname = containsBanned(e.nickname) ? e.username : e.nickname;
    return { username: e.username, nickname, spoken: speakableName(nickname), avatar: e.avatar };
  };

  useLiveEvents({
    onStatus: setStatus,
    onSpeaker: (d) => setStageCount(d.count),
    onGameState: (s) => {
      if (!IS_STAGE) setView(s as StageView);
    },
    onChat: (e) => {
      const room = roomRef.current;
      if (!room) return;
      say(room.chat(person(e), e.comment, Date.now()));
    },
    onGift: (e) => {
      const room = roomRef.current;
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      setLastGift({ ...e, nickname: p.nickname, at: Date.now() });
      // Quà: CHỈ bong bóng tim trang trí bay lên + lời cảm ơn. Không to thêm, không chống nứt, không điểm.
      room.giftHearts(p.username, Date.now());
      if (talk.gifts.shouldThank(e.username, coins, chatter.current.filter((c) => c.priority).length)) say(room.thank(p, e.giftName));
    },
    onFollow: (e) => {
      const room = roomRef.current;
      if (room && talk.follows.first(e.username)) say(room.follow(person(e), Date.now()));
    },
    onMember: (e) => {
      const room = roomRef.current;
      if (!room) return;
      // Vào phòng là bong bóng của người đó nổi lên sân
      room.join(person(e), Date.now());
      dirty.current = true;
    },
    onLike: (e) => {
      const room = roomRef.current;
      if (!room) return;
      // Tim làm to bong bóng của CHÍNH người thả (engine tự gộp lượt + trần x2,2)
      say(room.like(person({ nickname: e.nickname, username: e.username, avatar: '' }), e.likeCount || 1, Date.now()));
    },
    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      const room = roomRef.current;
      if (!room) return;
      if (c.action === 'speak' && c.text) voice.say(`F: ${c.text}`, true); // MC nữ
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        chatter.current = [];
        say(room.newSession(Date.now()));
      }
      if (c.action === 'custom' && c.text === 'fan_now') say(room.triggerFan(Date.now()));
      if (c.action === 'custom' && c.text === 'paw_now') say(room.triggerPaw(Date.now()));
      if (c.action === 'custom' && c.text === 'golden_now') say(room.forceGolden(Date.now()));
      if (c.action === 'custom' && c.text === 'force_round_end') say(room.forceEndRound(Date.now()));
      if (c.action === 'custom' && c.text?.startsWith('sim_bubbles:')) {
        const n = Number(c.text.slice('sim_bubbles:'.length));
        if (Number.isFinite(n)) say(room.spawnSim(Math.max(1, Math.min(12, Math.round(n))), Date.now()));
      }
      if (c.action === 'custom' && c.text === 'sim_grow') say(room.simGrow(Date.now()));
      if (c.action === 'custom' && (c.text === 'music_on' || c.text === 'music_off')) {
        room.musicOn = c.text === 'music_on';
        music.setEnabled(room.musicOn);
        dirty.current = true;
      }
      if (c.action === 'custom' && c.text?.startsWith('music_vol:')) {
        const v = Number(c.text.slice('music_vol:'.length));
        if (Number.isFinite(v)) {
          room.musicVolume = Math.min(1, Math.max(0, v));
          music.setVolume(room.musicVolume);
          dirty.current = true;
        }
      }
    },
  });

  useEffect(() => {
    if (!IS_STAGE) return;
    if (MUTED) voice.volume = 0;
    let stop = false;
    const room = new BubblesRoom(Date.now());
    roomRef.current = room;
    say(room.newSession(Date.now()));
    // Nhạc nền bật sẵn; 1 lần chạm/click đầu tiên trên stage mở khoá CẢ nhạc lẫn giọng đọc
    // (trình duyệt chặn tự phát tiếng trước tương tác) — watchdog thử lại liên tục như các phòng khác.
    music.setVolume(room.musicVolume);
    music.setEnabled(room.musicOn);
    const unlock = () => {
      music.resume();
      voice.kick();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('focus', unlock);
    document.addEventListener('visibilitychange', unlock);
    const watchdog = setInterval(unlock, 1500);
    let lastSent = 0;
    // 100ms (thay vì 200ms như game theo lượt): bong bóng trôi liên tục cần ảnh chụp dày hơn cho mượt
    const timer = setInterval(() => {
      if (stop) return;
      const now = Date.now();
      say(room.tick(now));
      flushChatter(room, now);
      music.setDucked(voice.busy); // MC đang đọc thì nhạc tự nhỏ xuống
      dirty.current = true;
      setView(room.view(now));
      if (now - lastSent >= 400) {
        lastSent = now;
        fetch('/api/game/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room.view(now)) }).catch(() => {});
      }
    }, 100);
    return () => {
      stop = true;
      clearInterval(timer);
      clearInterval(watchdog);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('focus', unlock);
      document.removeEventListener('visibilitychange', unlock);
      music.setEnabled(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view, lastGift, stageCount, channelName };
}

export type BubblesState = ReturnType<typeof useBubbles>;
