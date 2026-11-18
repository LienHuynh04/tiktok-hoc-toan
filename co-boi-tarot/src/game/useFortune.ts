import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned } from '../live/bannedWords';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { music } from '../live/music';
import { IS_STAGE, STAGE_ID } from '../live/page';
import { GAME } from './config';
import { FortuneRoom, type FortuneView, type Say } from './fortune';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

export type StageView = FortuneView;

/**
 * Trang stage chạy engine thật (fortune.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy, chỉ vẽ lại ảnh chụp đó nên xem trước khớp với live.
 */
export function useFortune() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<StageView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number; pointsAdded: number }) | null>(null);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);
  const [musicOn, setMusicOn] = useState(true);

  const roomRef = useRef<FortuneRoom | null>(null);
  const dirty = useRef(true);
  const musicOnRef = useRef(true);

  const [talk] = useState(() => ({
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
  }));

  // Câu chính đọc ngay (đồng hồ dừng trong lúc đọc). Câu nói thêm chờ lúc rảnh (phòng trống / nghỉ giữa lượt).
  const mainSpeaking = useRef(0);
  const chatter = useRef<{ text: string; priority: boolean; until: number }[]>([]);
  function say(lines: Say[]) {
    const now = Date.now();
    for (const l of lines) {
      if (l.main) {
        mainSpeaking.current++;
        voice.say(l.text, true, () => mainSpeaking.current--);
      } else {
        const ttl = l.ttl ?? (l.priority ? GAME.giftLineMaxWaitMs : GAME.chatterMaxWaitMs);
        chatter.current.push({ text: l.text, priority: !!l.priority, until: now + ttl });
      }
    }
    if (lines.length) dirty.current = true;
  }
  function flushChatter(room: FortuneRoom, now: number) {
    chatter.current = chatter.current.filter((c) => c.until > now);
    if (voice.busy || mainSpeaking.current > 0 || !room.chatterWindow(now)) return;
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
    onSpeaker: (d) => {
      setStageCount(d.count);
      // trang stage bị trang mới hơn thay chỗ: tắt nhạc luôn (giọng đã do useLiveEvents lo)
      if (IS_STAGE && !MUTED) music.setEnabled(d.id === STAGE_ID && musicOnRef.current);
    },
    onGameState: (s) => {
      if (!IS_STAGE) setView(s as StageView);
    },
    onChat: (e) => {
      const room = roomRef.current;
      if (!room) return;
      say(room.chat({ ...person(e), comment: e.comment, createTime: e.createTime ?? e.timestamp, safe: !containsBanned(e.comment) }, Date.now()));
    },
    onLike: (e) => {
      const room = roomRef.current;
      if (!room) return;
      room.addLikes(person({ nickname: e.nickname, username: e.username, avatar: '' }), e.likeCount, Date.now());
      dirty.current = true;
    },
    onGift: (e) => {
      const room = roomRef.current;
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      const added = room.addGiftPoints(p, coins, Date.now());
      setLastGift({ ...e, nickname: p.nickname, at: Date.now(), pointsAdded: added });
      dirty.current = true;
      if (talk.gifts.shouldThank(e.username, coins, chatter.current.filter((c) => c.priority).length)) say(room.thank(p, e.giftName, added));
    },
    onFollow: (e) => {
      const room = roomRef.current;
      if (room && talk.follows.first(e.username)) say(room.follow(person(e)));
    },
    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      const room = roomRef.current;
      if (!room) return;
      if (c.action === 'speak' && c.text) voice.say(`F: ${c.text}`, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        chatter.current = [];
        say(room.newSession(Date.now()));
      }
      if (c.action === 'custom' && c.text === 'skip') say(room.skip(Date.now()));
      if (c.action === 'custom' && c.text === 'next') say(room.skip(Date.now()));
      if (c.action === 'custom' && c.text === 'endReading') say(room.endReading(Date.now()));
      if (c.action === 'custom' && c.text?.startsWith('remove:')) {
        room.removeFromQueue(c.text.slice('remove:'.length));
        dirty.current = true;
      }
      if (c.action === 'custom' && (c.text === 'music_on' || c.text === 'music_off')) {
        setMusicOn(c.text === 'music_on');
        musicOnRef.current = c.text === 'music_on';
        music.setEnabled(c.text === 'music_on');
      }
      if (c.action === 'custom' && c.text?.startsWith('music_vol:')) {
        const v = Number(c.text.slice('music_vol:'.length));
        if (Number.isFinite(v)) music.setVolume(Math.min(1, Math.max(0, v)));
      }
    },
  });

  useEffect(() => {
    if (!IS_STAGE) return;
    if (MUTED) {
      voice.volume = 0;
      music.setEnabled(false);
    } else {
      music.setVolume(GAME.musicVolume);
      music.setEnabled(true);
    }
    let stop = false;
    const room = new FortuneRoom(Date.now());
    roomRef.current = room;
    say(room.newSession(Date.now()));
    let lastSent = 0;
    let lastTick = Date.now();
    const timer = setInterval(() => {
      if (stop) return;
      const now = Date.now();
      if (mainSpeaking.current > 0) {
        room.hold(now - lastTick);
        dirty.current = true;
      }
      lastTick = now;
      const lines = room.tick(now);
      // Lượt mẫu đang đọc mà khách thật vào hàng: bỏ các câu luận đang chờ (câu đang đọc thì
      // đọc nốt) để câu nhường bàn + lượt khách thật lên ngay sau đó, không chờ hết đoạn mẫu
      if (room.consumeDemoCut()) voice.dropQueued();
      say(lines);
      flushChatter(room, now);
      music.setDucked(voice.busy);
      if (!MUTED) music.resume(); // thử mở lại tiếng sau tương tác đầu tiên trong LIVE Studio
      if (!dirty.current && now - lastSent < 1000) return;
      dirty.current = false;
      setView(room.view(now));
      if (now - lastSent >= 400) {
        lastSent = now;
        fetch('/api/game/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room.view(now)) }).catch(() => {});
      }
    }, 200);
    return () => {
      stop = true;
      clearInterval(timer);
      music.setEnabled(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view, lastGift, stageCount, channelName, musicOn };
}

export type FortuneState = ReturnType<typeof useFortune>;
