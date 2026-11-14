/**
 * Kho tên giả lập cho khách test/demo (nút giả lập ở trang điều khiển, "100 người cùng đoán"...).
 *
 * Trước đây khách giả mang username hs0, hs1... và nickname lặp theo vòng + thêm số:
 * hiện lên sân khấu / cô đọc là thấy ngay bot. Nay bốc NGẪU NHIÊN từ kho tên kiểu
 * username TikTok thường gặp dưới đây, không lặp trong cùng một buổi (hết kho thì
 * bốc lại kèm biến thể số kín đáo, vẫn không trùng và không thành dãy số thứ tự).
 *
 * Chủ kênh muốn thêm/bớt tên thì sửa FAKE_NAME_POOL trong file này.
 * Tên phải: chữ thường ASCII (có dấu chấm được), cô đọc được qua speakableName,
 * không chứa từ cấm (containsBanned) — kiểm chứng ở fakeNames.check.ts.
 */
export const FAKE_NAME_POOL = [
  'moonlily', 'luvv.mii', 'cloudynite', 'milkyway', 'peachy.zip',
  'lilacdream', 'softbunni', 'starluv', 'blancelle', 'velvetmoon',
  'notyourbae', 'ghostmode', 'nox.exe', 'lowkeyvibe', 'deadinsidee',
  'sleepyr', 'voidboy', 'offline404', 'chaosluv', 'zerofilter',
  'babymochi', 'bunniepop', 'honeybloom', 'chocomilkk', 'meowmeowx',
  'strawberry.zip', 'cutiepiee', 'bubblegumluv', 'kittencloud', 'pinkyboo',
  'darklune', 'midnightx', 'lostinvoid', 'crybaby.exe', 'blackvelvet',
  'silentkiller', 'luvnobody', 'lunavoid', 'cursedangel', 'fallenstar',
  'zynora', 'avyx', 'luvqi', 'kairu', 'nyxie',
  'elowyn', 'veyra', 'azumi', 'xovii', 'rynelle',
];

export interface FakeNameSource {
  /** Bốc 1 tên chưa từng được bốc trong nguồn này. */
  next(): string;
}

/**
 * Nguồn bốc tên: xáo kho rồi bốc dần (thứ tự ngẫu nhiên, không lặp).
 * Hết kho thì xáo lại và thêm hậu tố 2 số ngẫu nhiên (kiểu username TikTok hay có),
 * vẫn đảm bảo không trùng tên đã bốc và không lộ dãy thứ tự giữa các bạn.
 */
export function createFakeNameSource(pool: string[] = FAKE_NAME_POOL, rng: () => number = Math.random): FakeNameSource {
  const used = new Set<string>();
  let deck: string[] = [];
  const drawBase = (): string => {
    if (!deck.length) {
      deck = [...pool];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck.pop()!;
  };
  const variation = (base: string): string => {
    for (let k = 0; k < 100; k++) {
      const cand = `${base}${10 + Math.floor(rng() * 90)}`;
      if (!used.has(cand)) return cand;
    }
    let n = 100;
    while (used.has(`${base}${n}`)) n++;
    return `${base}${n}`;
  };
  return {
    next() {
      let name = drawBase();
      if (used.has(name)) name = variation(name);
      used.add(name);
      return name;
    },
  };
}

// Nguồn dùng chung cho cả buổi (trang điều khiển mở bao lâu thì giữ bấy lâu):
// mọi khách giả lập trong buổi đều khác tên nhau.
const sessionSource = createFakeNameSource();

export function nextFakeName(): string {
  return sessionSource.next();
}

/** 1 khách giả lập mới: username = nickname = tên bốc từ kho (sân khấu hiện username, cô đọc username). */
export function fakeIdentity(): { username: string; nickname: string; avatar: string } {
  const name = nextFakeName();
  return { username: name, nickname: name, avatar: '' };
}
