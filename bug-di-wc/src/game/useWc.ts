import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { music } from '../live/music';
import { catSounds } from '../live/catSounds';
import { containsBanned } from '../live/bannedWords';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { WcRoom, type Say, type WcView } from './wc';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

export type StageView = WcView;

/**
 * Trang stage chạy engine Bug Đi WC thật (lõi ở wc.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy, chỉ vẽ lại ảnh chụp đó nên xem trước khớp với live.
 * MC là giọng NỮ: mọi câu engine sinh đều có tiền tố "F:".
 * Tiếng mèo tổng hợp (catSounds) phát theo cue của engine + tiếng gằn/grừ theo nhịp tim.
 */
export function useWc() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<StageView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number }) | null>(null);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);

  const roomRef = useRef<WcRoom | null>(null);
  const quietSince = useRef(0);

  const [talk] = useState(() => ({
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
  }));

  // Câu chính (sự kiện lớn) đọc ưu tiên ngay; câu phụ chờ lúc MC rảnh.
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
  }
  function flushChatter(room: WcRoom, now: number) {
    chatter.current = chatter.current.filter((c) => c.until > now);
    if (voice.busy || !room.chatterWindow(now)) return;
    const i = Math.max(0, chatter.current.findIndex((c) => c.priority));
    const next = chatter.current.splice(i, 1)[0];
    if (next) voice.say(next.text);
  }
  function playCues(room: WcRoom) {
    for (const cue of room.drainCues()) catSounds.play(cue);
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
      playCues(room);
    },
    onGift: (e) => {
      const room = roomRef.current;
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      setLastGift({ ...e, nickname: p.nickname, at: Date.now() });
      // Quà: CHỈ hiệu ứng giấy vệ sinh bay + lời cảm ơn. Không lực, không tiến độ, không buff.
      room.giftFx(p.username, Date.now());
      if (talk.gifts.shouldThank(e.username, coins, chatter.current.filter((c) => c.priority).length)) say(room.thank(p, e.giftName));
    },
    onFollow: (e) => {
      const room = roomRef.current;
      if (room && talk.follows.first(e.username)) say(room.follow(person(e), Date.now()));
    },
    onMember: (e) => {
      const room = roomRef.current;
      if (!room) return;
      room.join(person(e), Date.now());
    },
    onLike: (e) => {
      const room = roomRef.current;
      if (!room) return;
      say(room.like(person({ nickname: e.nickname, username: e.username, avatar: '' }), e.likeCount || 1, Date.now()));
      playCues(room);
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
      if (c.action === 'custom' && c.text?.startsWith('sim_likes:')) {
        const n = Number(c.text.slice('sim_likes:'.length));
        if (Number.isFinite(n)) say(room.simLikeBurst(Math.max(1, Math.min(5000, Math.round(n))), Date.now()));
      }
      if (c.action === 'custom' && c.text === 'sim_ran') say(room.simRanBurst(Date.now()));
      if (c.action === 'custom' && c.text === 'buff_water') room.forceBuff('water', Date.now());
      if (c.action === 'custom' && c.text === 'buff_fiber') room.forceBuff('fiber', Date.now());
      if (c.action === 'custom' && c.text === 'force_success') say(room.forceSuccess(Date.now()));
      if (c.action === 'custom' && c.text === 'force_timeout') say(room.forceTimeout(Date.now()));
      if (c.action === 'custom' && c.text === 'sim_tease') say(room.simTease(Date.now()));
      if (c.action === 'custom' && c.text === 'force_sulk') say(room.forceSulk(Date.now()));
      if (c.action === 'custom' && c.text === 'sim_sorry') say(room.simSorry(Date.now()));
      if (c.action === 'custom' && (c.text === 'music_on' || c.text === 'music_off')) {
        room.musicOn = c.text === 'music_on';
        music.setEnabled(room.musicOn);
      }
      if (c.action === 'custom' && c.text?.startsWith('music_vol:')) {
        const v = Number(c.text.slice('music_vol:'.length));
        if (Number.isFinite(v)) {
          room.musicVolume = Math.min(1, Math.max(0, v));
          music.setVolume(room.musicVolume);
        }
      }
      if (c.action === 'custom' && (c.text === 'cat_on' || c.text === 'cat_off')) {
        room.catOn = c.text === 'cat_on';
        catSounds.setEnabled(room.catOn);
      }
      if (c.action === 'custom' && c.text?.startsWith('cat_vol:')) {
        const v = Number(c.text.slice('cat_vol:'.length));
        if (Number.isFinite(v)) {
          room.catVolume = Math.min(1, Math.max(0, v));
          catSounds.setVolume(room.catVolume);
        }
      }
      playCues(room);
    },
  });

  useEffect(() => {
    if (!IS_STAGE) return;
    if (MUTED) {
      voice.volume = 0;
      catSounds.setEnabled(false);
    }
    let stop = false;
    const room = new WcRoom(Date.now());
    roomRef.current = room;
    // Nạp trước ảnh chỉ dùng ở khoảnh khắc đặc biệt (thành công / mốc 75%) để không chớp emoji dự phòng
    for (const src of ['/assets/bug-relief.png', '/assets/sen.png']) {
      const pre = new Image();
      pre.src = src;
    }
    say(room.newSession(Date.now()));
    // Nhạc + tiếng mèo bật sẵn; 1 lần chạm/click đầu tiên trên stage mở khoá CẢ ba
    // (trình duyệt chặn tự phát tiếng trước tương tác) — watchdog thử lại liên tục.
    music.setVolume(room.musicVolume);
    music.setEnabled(room.musicOn);
    catSounds.setVolume(room.catVolume);
    catSounds.setEnabled(room.catOn && !MUTED);
    const unlock = () => {
      music.resume();
      voice.kick();
      catSounds.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('focus', unlock);
    document.addEventListener('visibilitychange', unlock);
    const watchdog = setInterval(unlock, 1500);
    let lastSent = 0;
    const timer = setInterval(() => {
      if (stop) return;
      const now = Date.now();
      say(room.tick(now));
      playCues(room);
      flushChatter(room, now);
      music.setDucked(voice.busy); // MC đang đọc thì nhạc tự nhỏ xuống
      const v = room.view(now);
      // Tiếng mèo liên tục: đang rặn có nhịp tim -> gằn theo nhịp; yên tĩnh lâu -> grừ nhàn
      if (v.phase === 'attempt' && !v.sulking && v.likeRate >= 3) {
        catSounds.stopPurr();
        quietSince.current = 0;
        catSounds.grunt(v.likeRate);
      } else if (v.phase === 'attempt' && !v.sulking && v.likeRate === 0) {
        if (!quietSince.current) quietSince.current = now;
        if (now - quietSince.current > 4000) catSounds.startPurr();
      } else {
        quietSince.current = 0;
        catSounds.stopPurr();
      }
      setView(v);
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
      catSounds.stopPurr();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view, lastGift, stageCount, channelName };
}

export type WcState = ReturnType<typeof useWc>;
