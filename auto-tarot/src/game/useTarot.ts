import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned } from '../live/bannedWords';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { TarotRoom, type Say, type TarotView } from './tarot';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

export type StageView = TarotView;

/**
 * Trang stage chạy engine tarot thật (lõi ở tarot.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy, chỉ vẽ lại ảnh chụp đó nên xem trước khớp với live.
 */
// Bảng vinh danh quà: CHỈ ghi nhận + hiển thị, tuyệt đối không đổi thứ tự lượt xem (luật nhà)
export interface GiftHonour {
  top: { nickname: string; coins: number; gifts: number }[];
  recent: { nickname: string; giftName: string }[];
  totalCoins: number;
}

export function useTarot() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<StageView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number }) | null>(null);
  const [honour, setHonour] = useState<GiftHonour>({ top: [], recent: [], totalCoins: 0 });
  const honourMap = useRef(new Map<string, { nickname: string; coins: number; gifts: number }>());
  const honourTotal = useRef(0);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);

  const roomRef = useRef<TarotRoom | null>(null);
  const dirty = useRef(true);

  const [talk] = useState(() => ({
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
  }));

  // Câu chính đọc ngay (đồng hồ dừng trong lúc đọc). Câu nói thêm (chào hàng chờ, cảm ơn) chờ lúc rảnh.
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
    dirty.current = true;
  }
  function flushChatter(room: TarotRoom, now: number) {
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
    onSpeaker: (d) => setStageCount(d.count),
    onGameState: (s) => {
      if (!IS_STAGE) setView(s as StageView);
    },
    onChat: (e) => {
      const room = roomRef.current;
      if (!room) return;
      say(room.chat({ ...person(e), comment: e.comment, createTime: e.createTime ?? e.timestamp, safe: !containsBanned(e.comment) }, Date.now()));
    },
    onGift: (e) => {
      const room = roomRef.current;
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      setLastGift({ ...e, nickname: p.nickname, at: Date.now() });
      // Vinh danh: cộng dồn theo người tặng, hiện top 3 + quà mới nhất (không đụng hàng chờ)
      const rec = honourMap.current.get(e.username) ?? { nickname: p.nickname, coins: 0, gifts: 0 };
      rec.nickname = p.nickname;
      rec.coins += coins;
      rec.gifts += 1;
      honourMap.current.set(e.username, rec);
      honourTotal.current += coins;
      setHonour({
        top: [...honourMap.current.values()].sort((a, b) => b.coins - a.coins).slice(0, 3),
        recent: [{ nickname: p.nickname, giftName: e.giftName }],
        totalCoins: honourTotal.current,
      });
      if (talk.gifts.shouldThank(e.username, coins, chatter.current.filter((c) => c.priority).length)) say(room.thank(p, e.giftName));
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
    },
  });

  useEffect(() => {
    if (!IS_STAGE) return;
    if (MUTED) voice.volume = 0;
    let stop = false;
    const room = new TarotRoom(Date.now());
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
      say(room.tick(now));
      flushChatter(room, now);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view, lastGift, stageCount, channelName, honour };
}

export type TarotState = ReturnType<typeof useTarot>;
