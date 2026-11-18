/**
 * Bộ soạn lời giải (điểm nhấn của Cô Bói Tarot): từ câu hỏi của khách, đoán chủ đề,
 * rồi ghép 3 lá theo 3 vị trí thành một đoạn văn liền mạch 4 đến 6 câu để cô đọc.
 * Mọi mẫu câu đều có nhiều biến thể; hàm pick bên ngoài lo việc không lặp biến thể vừa dùng.
 * Lời giải chỉ mang tính giải trí, giọng gợi mở, không khẳng định, không hứa hẹn.
 */
import type { Card78 } from './cards78';
import { POSITIONS } from './config';
import { plain } from '../live/chatter';

export type ThemeKey = 'love' | 'work' | 'money' | 'study' | 'family' | 'general';

export const THEMES: Record<ThemeKey, { label: string; keys: string[] }> = {
  love: {
    label: 'Tình cảm',
    keys: [' tinh yeu ', ' tinh cam ', ' yeu ', ' crush ', ' nguoi yeu ', ' tinh duyen ', ' chia tay ', ' quay lai ', ' ket hon ', ' dam cuoi ', ' lay chong ', ' lay vo ', ' hen ho ', ' nguoi ay ', ' anh ay ', ' co ay ', ' doi phuong '],
  },
  work: {
    label: 'Công việc',
    keys: [' cong viec ', ' viec lam ', ' su nghiep ', ' phong van ', ' xin viec ', ' thang chuc ', ' tang luong ', ' sep ', ' dong nghiep ', ' nghi viec ', ' doi viec ', ' khoi nghiep '],
  },
  money: {
    label: 'Tiền bạc',
    keys: [' tien ', ' tien bac ', ' tai chinh ', ' kinh doanh ', ' lam an ', ' buon ban ', ' dau tu ', ' no ', ' tra no ', ' thu nhap ', ' ban hang ', ' mo tiem ', ' shop '],
  },
  study: {
    label: 'Học tập',
    keys: [' hoc ', ' hoc tap ', ' thi ', ' diem ', ' dau ', ' do ', ' tot nghiep ', ' dai hoc ', ' kiem tra ', ' bai thi ', ' ielts ', ' bang '],
  },
  family: {
    label: 'Gia đình',
    keys: [' gia dinh ', ' bo me ', ' cha me ', ' ba me ', ' con cai ', ' vo chong ', ' anh chi em ', ' nha minh ', ' ba noi ', ' ba ngoai ', ' ong ba '],
  },
  general: { label: 'Tổng quan', keys: [] },
};

const THEME_ORDER: ThemeKey[] = ['study', 'love', 'family', 'work', 'money'];

/** Đoán chủ đề từ câu hỏi gốc (so trên bản bỏ dấu) */
export function detectTheme(question: string): ThemeKey {
  const p = plain(question);
  for (const key of THEME_ORDER) {
    if (THEMES[key].keys.some((k) => p.includes(k))) return key;
  }
  return 'general';
}

export interface DrawnCard {
  card: Card78;
  reversed: boolean;
}

export type Picker = (key: string, arr: readonly string[]) => string;

// Câu mở đoạn theo chủ đề (gọi tên khách)
const OPENERS: Record<ThemeKey, ((n: string) => string)[]> = {
  love: [
    (n: string) => `Rồi, cô xem chuyện tình cảm cho ${n} đây. Ba lá này nói khá rõ về đường tình duyên của bạn trong thời gian tới.`,
    (n: string) => `Chuyện tình cảm của ${n} nhé, cô trải ba lá đây, mình cùng nghe xem các lá nhắn gì.`,
    (n: string) => `Cô vào việc luôn nhé ${n}, đường tình cảm của bạn đang có mấy tín hiệu đáng chú ý lắm.`,
  ],
  work: [
    (n: string) => `Rồi, cô xem đường công việc cho ${n} đây. Ba lá này chỉ khá rõ nhịp sự nghiệp của bạn sắp tới.`,
    (n: string) => `Chuyện công việc của ${n} nhé, cô trải ba lá đây, nghe kỹ đoạn cuối vì có lời khuyên rất thực tế.`,
    (n: string) => `Cô xem sự nghiệp cho ${n} đây. Các lá hôm nay nghiêng về chuyện hành động nhiều hơn là chờ đợi.`,
  ],
  money: [
    (n: string) => `Rồi, cô xem đường tiền bạc cho ${n} đây. Nhắc nhẹ là bài chỉ để tham khảo cho vui, quyết định tiền nong vẫn phải dựa trên con số thật nhé.`,
    (n: string) => `Chuyện tài chính của ${n} nhé, cô trải ba lá đây. Mình nghe để tham khảo nhịp thôi, đừng vội xuống tay theo bài.`,
    (n: string) => `Cô xem vận tiền bạc cho ${n} đây. Ba lá này nói nhiều về cách bạn đang giữ và dùng tiền.`,
  ],
  study: [
    (n: string) => `Rồi, cô xem đường học hành thi cử cho ${n} đây. Ba lá này nói khá rõ về nhịp ôn luyện của bạn.`,
    (n: string) => `Chuyện học tập của ${n} nhé, cô trải ba lá đây, đoạn cuối có lời khuyên ôn tập rất đáng nghe.`,
    (n: string) => `Cô xem chuyện thi cử cho ${n} đây. Các lá hôm nay đề cao sự đều đặn hơn là nước rút.`,
  ],
  family: [
    (n: string) => `Rồi, cô xem chuyện gia đình cho ${n} đây. Ba lá này nói về không khí trong nhà của bạn sắp tới.`,
    (n: string) => `Chuyện nhà của ${n} nhé, cô trải ba lá đây, nghe xem các lá nhắn gì về người thân của bạn.`,
    (n: string) => `Cô xem gia đạo cho ${n} đây. Các lá hôm nay rất ấm, thiên về sự sum họp và thấu hiểu.`,
  ],
  general: [
    (n: string) => `Rồi, cô trải ba lá xem tổng quan cho ${n} đây. Mình cùng nghe xem các lá nhắn gì về giai đoạn này của bạn.`,
    (n: string) => `Cô vào việc luôn nhé ${n}. Ba lá hôm nay chạm vào đúng chuyện bạn đang nghĩ trong đầu đấy.`,
    (n: string) => `Xem tổng quan cho ${n} nhé. Ba lá này xếp với nhau thành một câu chuyện khá liền mạch.`,
  ],
};

// Câu nối vào từng vị trí (trước khi nêu nghĩa lá)
const POSITION_LEADS: string[][] = [
  ['Lá thứ nhất, ở vị trí chuyện đang là gì,', 'Đầu tiên, lá nằm ở vị trí chuyện đang là gì,', 'Mở đầu là lá ở vị trí chuyện đang là gì,'],
  ['Lá thứ hai, ở vị trí điều đang cần,', 'Tiếp đến, lá ở vị trí điều đang cần,', 'Sang lá thứ hai, vị trí điều đang cần,'],
  ['Lá cuối cùng, ở vị trí nên làm gì,', 'Và lá chốt lại, vị trí nên làm gì,', 'Cuối cùng là lá ở vị trí nên làm gì,'],
];

// Câu khép đoạn (sau lời khuyên), có biến thể theo chủ đề
const CLOSERS: Record<ThemeKey, string[]> = {
  love: [
    'Tình cảm là chuyện của hai phía, bài chỉ gợi ý nhịp thôi, còn lại cứ để trái tim và thời gian trả lời nhé.',
    'Cô chúc bạn đường tình duyên sắp tới nhẹ nhàng và rõ ràng hơn, nghe bài cho vui rồi sống thật với cảm xúc của mình nhé.',
  ],
  work: [
    'Công việc suy cho cùng vẫn thắng bằng tay nghề và sự đều đặn, bài chỉ là gợi ý thêm cho bạn tham khảo thôi.',
    'Cô chúc bạn chặng đường sự nghiệp sắp tới hanh thông, cứ làm chắc từng việc nhỏ nhé.',
  ],
  money: [
    'Nhắc lại lần nữa cho chắc, bài tarot ngắm cho vui thôi, chuyện tiền bạc thật vẫn nên dựa trên con số và kế hoạch rõ ràng nhé.',
    'Cô chúc bạn túi tiền sắp tới rủng rỉnh theo cách bền vững nhất, chi tiêu gì cũng cứ từ tốn nhé.',
  ],
  study: [
    'Bài chỉ gợi ý nhịp học thôi, kết quả thật vẫn nằm ở những buổi ôn đều đặn của bạn, cố lên nhé.',
    'Cô chúc bạn thi cử sắp tới thật bình tĩnh và may mắn, học chắc thì vào phòng thi sẽ nhẹ đầu thôi.',
  ],
  family: [
    'Gia đình là nơi để về, bài hôm nay cũng chỉ mong nhà bạn thêm êm ấm và thấu hiểu nhau hơn.',
    'Cô chúc nhà bạn sắp tới nhiều tiếng cười, có chuyện gì cũng ngồi lại nói với nhau nhẹ nhàng nhé.',
  ],
  general: [
    'Và đó là lời nhắn của ba lá hôm nay, nghe để tham khảo cho vui, còn đường đi vẫn do chính bạn chọn mỗi ngày nhé.',
    'Cô chúc bạn giai đoạn tới thật nhẹ nhàng, mọi việc hanh thông theo cách riêng của nó.',
  ],
};

export interface ReadingInput {
  guestName: string; // tên đã an toàn để đọc
  theme: ThemeKey;
  drawn: DrawnCard[]; // đúng 3 lá theo thứ tự vị trí
}

/**
 * Ghép đoạn lời giải hoàn chỉnh. Trả về mảng câu: câu[0] là mở đoạn, 3 câu giữa là 3 lá,
 * câu áp chót là lời khuyên, câu cuối là khép đoạn. Ghép bằng dấu cách là thành đoạn văn.
 */
export function composeReading(input: ReadingInput, pickFn: (key: string, arr: readonly ((n: string) => string)[], name: string) => string, pick: Picker): string[] {
  const { theme, drawn } = input;
  const sentences: string[] = [];
  sentences.push(pickFn(`open-${theme}`, OPENERS[theme], input.guestName));
  drawn.forEach((d, i) => {
    const lead = pick(`lead-${i}`, POSITION_LEADS[i]);
    const dir = d.reversed ? 'chiều ngược' : 'chiều xuôi';
    const meaning = d.reversed ? d.card.rev : d.card.up;
    sentences.push(`${lead} là lá ${d.card.name} ${dir}. ${meaning}`);
  });
  const third = drawn[2];
  const tip = third.reversed ? third.card.tipRev : third.card.tipUp;
  const adviceLead = pick('advice-lead', [
    'Lời khuyên cụ thể nhất mà các lá dành cho bạn là:',
    'Nếu cô được chốt lại một lời khuyên duy nhất từ trải bài này, thì đó là:',
    'Điều bạn nên làm ngay sau buổi xem này là:',
  ]);
  sentences.push(`${adviceLead} ${tip}.`);
  sentences.push(pick(`close-${theme}`, CLOSERS[theme]));
  return sentences;
}

/** Nhận diện comment là câu hỏi xin xem bài (dùng bản gốc, chưa bỏ dấu) */
export function extractQuestion(comment: string): string | null {
  const raw = comment.trim();
  if (raw.length < 4) return null;
  const p = plain(raw);
  // tiền tố "HỎI:" hoặc "HOI " ở đầu
  const prefix = /^\s*h[ỏo]i\s*[:：]\s*/i.exec(raw);
  if (prefix) {
    const q = raw.slice(prefix[0].length).trim();
    return q.length >= 3 ? q : 'Xem tổng quan cho mình nhé cô';
  }
  if (p.startsWith(' hoi co ') || p.startsWith(' hoi thay ') || p.startsWith(' cho hoi ') || p.startsWith(' cho minh hoi ') || p.startsWith(' cho em hoi ')) return raw;
  if (raw.includes('?') || raw.includes('？')) return raw;
  if ([' xem giup ', ' xem dum ', ' xem cho ', ' giai dap ', ' tu van '].some((k) => p.includes(k))) return raw;
  // gọi "cô ơi" kèm 1 từ để hỏi mới tính là câu hỏi (tránh câu khen "live hay quá cô ơi")
  if (
    (p.includes(' co oi ') || p.startsWith(' co oi ')) &&
    [' sao ', ' nao ', ' khong ', ' gi ', ' chua ', ' the nao ', ' ra sao ', ' bao gio ', ' khi nao '].some((k) => p.includes(k))
  )
    return raw;
  return null;
}

export { POSITIONS };
