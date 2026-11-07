/**
 * Bộ bài Ẩn Chính (Major Arcana) 22 lá: tên, biểu tượng, màu và lời giải tiếng Việt tự viết.
 * Hình lá bài do sân khấu tự vẽ bằng code (biểu tượng + màu riêng từng lá), không dùng ảnh có sẵn.
 * Lời giải chỉ mang tính giải trí: giọng điệu gợi mở, không khẳng định chuyện sức khoẻ hay tiền bạc.
 */
export interface TarotCard {
  id: string;
  numeral: string; // số La Mã trên lá
  name: string; // tên tiếng Việt
  en: string; // tên tiếng Anh gốc
  symbol: string; // biểu tượng vẽ trên mặt bài
  c1: string; // màu nền 1 (gradient)
  c2: string; // màu nền 2 (gradient)
  keywords: string; // 3 từ khoá, hiện trên mặt bài
  up: string; // lời giải chiều xuôi (đọc lên live)
  rev: string; // lời giải chiều ngược (đọc lên live)
}

export const CARDS: TarotCard[] = [
  {
    id: 'fool', numeral: '0', name: 'Kẻ Khờ', en: 'The Fool', symbol: '🌈', c1: '#f59e0b', c2: '#ef4444',
    keywords: 'khởi đầu, tự do, liều lĩnh',
    up: 'Một khởi đầu mới đang mở ra trước mắt bạn, nhẹ tênh và đầy háo hức. Lá bài khuyên cứ mạnh dạn bước bước đầu tiên, đừng chờ mọi thứ hoàn hảo rồi mới bắt đầu.',
    rev: 'Bạn đang hơi vội hoặc hơi liều so với tình hình thật. Lá bài nhắc chậm lại một nhịp, kiểm tra kỹ hành trang và đường đi trước khi nhảy vào việc mới.',
  },
  {
    id: 'magician', numeral: 'I', name: 'Nhà Ảo Thuật', en: 'The Magician', symbol: '🪄', c1: '#7c3aed', c2: '#db2777',
    keywords: 'khéo léo, chủ động, biến hoá',
    up: 'Bạn đang có đủ nguyên liệu trong tay rồi: kỹ năng, mối quan hệ và cả cơ hội. Việc còn lại là chủ động bắt tay làm, lá bài này rất hợp với người dám đứng ra dẫn dắt.',
    rev: 'Có vẻ bạn đang tự nghi ngờ tay nghề của mình, hoặc có ai đó nói hay hơn làm. Lá bài khuyên quay về kiểm chứng bằng việc thật, đừng để lời hứa đẹp làm mờ mắt.',
  },
  {
    id: 'priestess', numeral: 'II', name: 'Nữ Tư Tế', en: 'The High Priestess', symbol: '🌙', c1: '#1e3a8a', c2: '#0ea5e9',
    keywords: 'trực giác, bí mật, lắng nghe',
    up: 'Câu trả lời bạn tìm chưa nằm ở bên ngoài đâu, nó nằm ở cảm giác rất rõ trong lòng mà bạn đang cố lờ đi. Lá bài khuyên yên lặng quan sát thêm, chuyện chưa lộ hết.',
    rev: 'Bạn đang bỏ qua tiếng nói bên trong vì xung quanh quá ồn. Lá bài nhắc dành thời gian riêng cho mình, và cẩn thận với những chuyện mới nghe một nửa sự thật.',
  },
  {
    id: 'empress', numeral: 'III', name: 'Nữ Hoàng', en: 'The Empress', symbol: '🌸', c1: '#db2777', c2: '#f59e0b',
    keywords: 'đủ đầy, chăm sóc, sáng tạo',
    up: 'Thời kỳ dễ chịu và đủ đầy đang tới gần, công sức chăm chút bấy lâu bắt đầu ra hoa kết trái. Lá bài hợp với việc vun đắp: một mối quan hệ, một dự án, hay chính bản thân bạn.',
    rev: 'Bạn đang lo cho mọi người nhiều hơn lo cho mình, hoặc đang ôm đồm quá sức. Lá bài nhắc nạp lại năng lượng cho bản thân trước, cạn pin thì chăm ai cũng khó.',
  },
  {
    id: 'emperor', numeral: 'IV', name: 'Hoàng Đế', en: 'The Emperor', symbol: '👑', c1: '#991b1b', c2: '#b45309',
    keywords: 'kỷ luật, nền tảng, quyết đoán',
    up: 'Lúc này cần sự chắc chắn và kỷ luật hơn là cảm hứng. Lá bài khuyên lập kế hoạch rõ ràng, giữ nguyên tắc, xây nền cho vững rồi thành quả sẽ theo sau.',
    rev: 'Có thể bạn đang quá cứng nhắc, hoặc ngược lại, mọi thứ đang hơi lỏng lẻo thiếu người cầm trịch. Lá bài nhắc xem lại ranh giới và quy tắc của chính mình.',
  },
  {
    id: 'hierophant', numeral: 'V', name: 'Giáo Hoàng', en: 'The Hierophant', symbol: '🕯️', c1: '#92400e', c2: '#065f46',
    keywords: 'truyền thống, người dẫn đường, niềm tin',
    up: 'Một người đi trước giàu kinh nghiệm có thể chỉ cho bạn đường ngắn hơn. Lá bài khuyên học theo cách đã được kiểm chứng, và đừng ngại tìm một người thầy đúng nghĩa.',
    rev: 'Cách cũ đang bắt đầu chật chội với bạn. Lá bài gợi ý rằng đã đến lúc tự hỏi mình thật sự tin vào điều gì, thay vì chỉ làm theo thói quen của số đông.',
  },
  {
    id: 'lovers', numeral: 'VI', name: 'Đôi Tình Nhân', en: 'The Lovers', symbol: '💞', c1: '#e11d48', c2: '#f472b6',
    keywords: 'lựa chọn, gắn kết, đồng điệu',
    up: 'Một mối liên kết đẹp hoặc một lựa chọn quan trọng của trái tim đang ở trước mặt. Lá bài khuyên chọn theo giá trị thật của mình, khi lòng đã đồng điệu thì quyết định sẽ nhẹ nhàng.',
    rev: 'Hai phía đang hơi lệch nhịp, hoặc bạn đang đứng giữa hai lựa chọn mà bên nào cũng tiếc. Lá bài nhắc nói thẳng điều mình nghĩ, im lặng lâu ngày dễ sinh hiểu lầm.',
  },
  {
    id: 'chariot', numeral: 'VII', name: 'Cỗ Xe', en: 'The Chariot', symbol: '🐎', c1: '#0f766e', c2: '#1d4ed8',
    keywords: 'tiến lên, ý chí, chiến thắng',
    up: 'Đà tiến đang rất mạnh, cứ giữ chặt tay lái và hướng thẳng mục tiêu. Lá bài này hợp với thi thố, di chuyển và những việc cần dứt khoát, kết quả nghiêng về phía người quyết tâm.',
    rev: 'Bạn đang bị kéo về hai hướng cùng lúc nên xe cứ giậm chân tại chỗ. Lá bài khuyên chọn một hướng ưu tiên trước, sức dàn trải thì việc nào cũng dở dang.',
  },
  {
    id: 'strength', numeral: 'VIII', name: 'Sức Mạnh', en: 'Strength', symbol: '🦁', c1: '#d97706', c2: '#dc2626',
    keywords: 'kiên nhẫn, dịu dàng, bền bỉ',
    up: 'Sức mạnh thật lúc này không nằm ở sự hơn thua mà ở sự kiên nhẫn và dịu dàng đúng lúc. Lá bài khuyên mềm mỏng mà vững, bạn sẽ thuần phục được tình huống khó theo cách êm nhất.',
    rev: 'Bạn đang hơi đuối, hoặc đang nén cảm xúc quá lâu. Lá bài nhắc cho phép mình nghỉ và yếu đuối một chút, nạp lại sức rồi hãy gồng tiếp.',
  },
  {
    id: 'hermit', numeral: 'IX', name: 'Ẩn Sĩ', en: 'The Hermit', symbol: '🏮', c1: '#334155', c2: '#0f172a',
    keywords: 'tĩnh lặng, soi đường, một mình',
    up: 'Đây là lúc hợp để lùi lại một bước và tự soi đường cho mình. Lá bài khuyên ít ồn ào, nhiều suy ngẫm, đáp án sẽ tự sáng dần như ngọn đèn trong đêm.',
    rev: 'Bạn đang thu mình hơi lâu, hoặc ngược lại, sợ ở một mình nên cứ tìm việc lấp đầy. Lá bài nhắc cân bằng lại: tĩnh lặng để hiểu mình, nhưng đừng tự cô lập quá lâu.',
  },
  {
    id: 'wheel', numeral: 'X', name: 'Bánh Xe Số Phận', en: 'Wheel of Fortune', symbol: '🎡', c1: '#0891b2', c2: '#7c3aed',
    keywords: 'thay đổi, vận hội, chu kỳ',
    up: 'Bánh xe đang quay và chiều gió đang đổi theo hướng có lợi cho bạn. Lá bài khuyên chớp lấy thời cơ khi nó tới, vì vận hội thường gõ cửa rất khẽ và đi cũng nhanh.',
    rev: 'Một chu kỳ không như ý đang diễn ra, nhưng bánh xe thì không bao giờ đứng yên. Lá bài nhắc giữ vững tay chèo qua đoạn này, đổi chiều là chuyện sớm muộn.',
  },
  {
    id: 'justice', numeral: 'XI', name: 'Công Lý', en: 'Justice', symbol: '⚖️', c1: '#475569', c2: '#0ea5e9',
    keywords: 'công bằng, sự thật, trách nhiệm',
    up: 'Mọi việc đang được đặt lên bàn cân một cách công bằng. Lá bài khuyên nói thật, làm đúng giấy tờ và nguyên tắc, gieo gì thì gặt nấy trong giai đoạn này.',
    rev: 'Có chỗ đang chưa sòng phẳng, hoặc một quyết định cũ đang đòi được xem lại. Lá bài nhắc rà soát kỹ giấy tờ, lời nói và cam kết trước khi ký kết hay phán xét ai.',
  },
  {
    id: 'hanged', numeral: 'XII', name: 'Người Treo Ngược', en: 'The Hanged Man', symbol: '🙃', c1: '#0369a1', c2: '#65a30d',
    keywords: 'tạm dừng, góc nhìn mới, buông',
    up: 'Đôi khi đứng yên lại là bước đi khôn ngoan nhất. Lá bài khuyên thử nhìn chuyện đang bế tắc từ một góc hoàn toàn khác, đáp án thường nằm ở phía bạn chưa chịu nhìn.',
    rev: 'Bạn đang chờ đợi quá lâu cho một việc không còn tiến triển. Lá bài nhắc tự hỏi mình đang níu giữ điều gì, và liệu đã đến lúc buông tay để nhẹ người chưa.',
  },
  {
    id: 'death', numeral: 'XIII', name: 'Thần Chết', en: 'Death', symbol: '🥀', c1: '#111827', c2: '#4c1d95',
    keywords: 'kết thúc, chuyển hoá, tái sinh',
    up: 'Đừng sợ lá này, nó nói về một chương cũ sắp khép lại để chương mới tốt hơn được mở ra. Lá bài khuyên dọn dẹp dứt khoát những gì đã hết hạn, nhẹ người thì mới đi xa được.',
    rev: 'Bạn đang cố níu một chuyện đã đến lúc nên kết thúc, nên mọi thứ cứ trì trệ. Lá bài nhắc chấp nhận thay đổi từng chút một, chuyển hoá luôn cần thời gian.',
  },
  {
    id: 'temperance', numeral: 'XIV', name: 'Điều Độ', en: 'Temperance', symbol: '🌊', c1: '#0d9488', c2: '#2563eb',
    keywords: 'cân bằng, hoà hợp, từ tốn',
    up: 'Chìa khoá lúc này là chữ vừa: vừa làm vừa nghỉ, vừa cho vừa nhận. Lá bài khuyên pha trộn và điều tiết từ tốn, mọi thứ đang tự tìm về điểm cân bằng của nó.',
    rev: 'Có mặt nào đó trong đời sống của bạn đang lệch hẳn về một phía. Lá bài nhắc bớt lại cái đang thừa và bù vào chỗ đang thiếu, đừng để cảm xúc cực đoan dẫn đường.',
  },
  {
    id: 'devil', numeral: 'XV', name: 'Ác Quỷ', en: 'The Devil', symbol: '🔥', c1: '#7f1d1d', c2: '#111827',
    keywords: 'cám dỗ, lệ thuộc, ham muốn',
    up: 'Có một sức hút rất mạnh đang kéo bạn: một thói quen khó bỏ, một mối quan hệ, hay một món hời nghe quá ngon. Lá bài khuyên tỉnh táo nhìn cái giá thật đằng sau sự sung sướng trước mắt.',
    rev: 'Bạn đang dần thoát ra khỏi một vòng lặp không lành mạnh, và đó là tín hiệu rất tốt. Lá bài động viên đi tiếp con đường cai và cắt này, tự do đang gần hơn bạn nghĩ.',
  },
  {
    id: 'tower', numeral: 'XVI', name: 'Toà Tháp', en: 'The Tower', symbol: '⚡', c1: '#7c2d12', c2: '#991b1b',
    keywords: 'biến động, sự thật, đổ vỡ để xây lại',
    up: 'Một biến động bất ngờ có thể làm rung chuyển kế hoạch của bạn, nhưng nó thường phá cái vốn đã mục từ bên trong. Lá bài khuyên bình tĩnh ứng biến, sau cơn rung lắc là mặt đất sạch để xây lại cho chắc.',
    rev: 'Bạn đang cảm thấy nền của một việc gì đó không còn vững như trước. Lá bài nhắc chủ động gia cố và chuẩn bị phương án dự phòng ngay từ bây giờ, đừng chờ tới lúc rung mới chạy.',
  },
  {
    id: 'star', numeral: 'XVII', name: 'Ngôi Sao', en: 'The Star', symbol: '⭐', c1: '#155e75', c2: '#312e81',
    keywords: 'hy vọng, chữa lành, cảm hứng',
    up: 'Sau những ngày không dễ dàng, một vì sao hy vọng đang sáng lên cho bạn. Lá bài này rất lành: cứ giữ niềm tin và chăm lại những ước mơ của mình, đường dài đang mở dần ra.',
    rev: 'Niềm tin của bạn đang bị thử thách và cảm hứng thì hơi cạn. Lá bài nhắc đừng tự trách mình, hãy tìm lại những điều nhỏ bé làm mình vui, sao mờ rồi sẽ sáng lại.',
  },
  {
    id: 'moon', numeral: 'XVIII', name: 'Mặt Trăng', en: 'The Moon', symbol: '🌕', c1: '#312e81', c2: '#701a75',
    keywords: 'mơ hồ, cảm xúc, ẩn số',
    up: 'Mọi thứ lúc này hơi mờ như đi trong sương, chưa phải lúc kết luận vội. Lá bài khuyên lắng nghe cảm xúc và giấc mơ của mình, và chờ thêm thông tin trước khi quyết định lớn.',
    rev: 'Sương mù đang tan dần, những điều từng khó hiểu bắt đầu rõ mặt. Lá bài khuyên nhân lúc đầu óc sáng ra mà giải quyết nốt những nỗi lo âm ỉ trong lòng.',
  },
  {
    id: 'sun', numeral: 'XIX', name: 'Mặt Trời', en: 'The Sun', symbol: '☀️', c1: '#f97316', c2: '#facc15',
    keywords: 'niềm vui, rõ ràng, thành công',
    up: 'Đây là một trong những lá đẹp nhất bộ bài: nắng lên, chuyện sáng tỏ và niềm vui rất thật. Lá bài khuyên cứ tự tin toả sáng và chia niềm vui với mọi người xung quanh.',
    rev: 'Nắng đang bị mây che một chút nên bạn chưa thấy hết tín hiệu tốt quanh mình. Lá bài nhắc đừng vì vài ngày u ám mà quên mất bức tranh lớn vẫn đang rất sáng.',
  },
  {
    id: 'judgement', numeral: 'XX', name: 'Phán Xét', en: 'Judgement', symbol: '🔔', c1: '#1d4ed8', c2: '#9333ea',
    keywords: 'thức tỉnh, cơ hội thứ hai, gọi tên',
    up: 'Một tiếng gọi thức tỉnh đang tới: có thể là cơ hội thứ hai cho một việc tưởng đã khép, hoặc lúc bạn nhìn lại chặng đường đã qua một cách rất rõ. Lá bài khuyên trả lời tiếng gọi đó bằng sự thành thật.',
    rev: 'Bạn đang tự phán xét mình hơi nặng, hoặc đang chần chừ trước một quyết định đáng ra phải dứt khoát. Lá bài nhắc tha thứ cho lỗi cũ, của mình và của người, để còn đi tiếp.',
  },
  {
    id: 'world', numeral: 'XXI', name: 'Thế Giới', en: 'The World', symbol: '🌍', c1: '#047857', c2: '#0369a1',
    keywords: 'trọn vẹn, hoàn thành, viên mãn',
    up: 'Một vòng tròn đang khép lại rất đẹp: việc bạn theo đuổi bấy lâu đi tới đoạn trọn vẹn. Lá bài khuyên tận hưởng cảm giác hoàn thành này, rồi một hành trình mới lớn hơn sẽ lại mở ra.',
    rev: 'Chỉ còn một đoạn ngắn nữa thôi mà bạn cứ chần chừ chưa chịu về đích. Lá bài nhắc kiểm tra xem còn thiếu mảnh ghép nào, hoàn thiện nốt đi, cảm giác trọn vẹn đang chờ ngay phía trước.',
  },
];

export type TopicKey = 'love' | 'ex' | 'work' | 'money' | 'future' | 'universe';

export const TOPICS: Record<TopicKey, { label: string; short: string; keys: string[]; advice: string[] }> = {
  love: {
    label: 'Tình yêu', short: 'tình yêu',
    keys: [' tinh yeu ', ' tinh cam ', ' yeu ', ' crush ', ' nguoi yeu ', ' tinh duyen ', ' hen ho '],
    advice: [
      'thành thật với cảm xúc của mình trước nhé.',
      'chậm mà chắc, tình cảm bền nhờ những điều nhỏ mỗi ngày.',
    ],
  },
  ex: {
    label: 'Người cũ', short: 'người cũ',
    keys: [' nguoi cu ', ' nguoi yeu cu ', ' tinh cu ', ' nyc '],
    advice: [
      'trân trọng bài học cũ, để hiện tại được yên.',
      'đừng để phút yếu lòng xoá hết đường đã chữa lành.',
    ],
  },
  work: {
    label: 'Công việc', short: 'công việc',
    keys: [' cong viec ', ' viec lam ', ' su nghiep ', ' phong van ', ' thi cu ', ' hoc tap ', ' hoc hanh '],
    advice: [
      'lo phần mình kiểm soát được, kết quả sẽ tự lên tiếng.',
      'làm chắc việc nhỏ, giữ quan hệ tốt với đồng đội.',
    ],
  },
  money: {
    label: 'Tài chính', short: 'tài chính',
    keys: [' tai chinh ', ' tien ', ' tien bac ', ' kinh doanh ', ' lam an ', ' buon ban ', ' dau tu '],
    advice: [
      'tiền vào ra phải có kế hoạch, đừng quyết lúc nóng vội.',
      'giữ khoản dự phòng, cảnh giác lời mời nghe quá hời.',
    ],
  },
  future: {
    label: 'Tương lai', short: 'tương lai',
    keys: [' tuong lai ', ' sap toi ', ' van menh ', ' thoi gian toi '],
    advice: [
      'đi từng bước rõ ràng, tương lai xây từ nhịp hôm nay.',
      'linh hoạt trước thay đổi, đừng mất điều cốt lõi của mình.',
    ],
  },
  universe: {
    label: 'Thông điệp vũ trụ', short: 'vũ trụ',
    keys: [' vu tru ', ' thong diep '],
    advice: [
      'xem đây là gợi ý nhỏ, đường đi vẫn do bạn chọn.',
      'tin cảm nhận của mình thêm chút, bạn hiểu mình hơn tưởng.',
    ],
  },
};

const TOPIC_ORDER: TopicKey[] = ['ex', 'universe', 'love', 'work', 'money', 'future'];

/** Tìm chủ đề trong comment đã bỏ dấu dạng " tinh yeu " — không thấy thì trả null (người chơi chưa chọn chủ đề) */
export function detectTopic(paddedPlain: string): TopicKey | null {
  for (const key of TOPIC_ORDER) {
    if (TOPICS[key].keys.some((k) => paddedPlain.includes(k))) return key;
  }
  return null;
}

export const TOPIC_LINES: Record<string, Record<TopicKey, string>> = {
 "fool": {
  "love": "Một cảm xúc mới mẻ, trong trẻo đang gõ cửa trái tim bạn. Cứ mở lòng tự nhiên, đừng tính toán nhiều ở bước đầu.",
  "ex": "Với người cũ, lá này nói về một trang hoàn toàn mới, không phải quay lại chương cũ. Bạn đã nhẹ lòng hơn trước nhiều rồi.",
  "work": "Một hướng đi mới trong công việc đang mở ra, có thể là việc lạ chưa từng làm. Lá này hợp với người dám thử, học nhanh.",
  "money": "Về tiền bạc, lúc này hợp để bắt đầu một khoản nhỏ mới như tích luỹ hay thử kênh phụ. Đi từng bước nhỏ, quan sát kỹ.",
  "future": "Giai đoạn tới mang màu sắc bắt đầu lại: nhẹ nhõm, tò mò, nhiều bất ngờ nhỏ. Đừng mang theo nỗi sợ của chặng cũ.",
  "universe": "Vũ trụ nhắn bạn hãy tin vào bước đi đầu tiên của mình. Không cần thấy hết con đường, thấy rõ bước trước mặt là đủ."
 },
 "magician": {
  "love": "Bạn có sức hút và sự chủ động rõ rệt trong tình cảm lúc này. Một cử chỉ rõ ràng hiệu quả hơn nhiều lời đoán già non.",
  "ex": "Với người cũ, lá này hỏi bạn đang chủ động hay bị kỷ niệm dẫn đi. Đáp án nằm ở việc bạn thật sự muốn gì cho mình.",
  "work": "Kỹ năng và nguồn lực bạn cần đều đã có sẵn trong tay. Rất hợp để đứng ra nhận việc, trình bày ý tưởng, mở dự án riêng.",
  "money": "Tài chính của bạn phụ thuộc nhiều vào sự chủ động: thêm kỹ năng, thêm đầu việc. Lá này không hợp với việc ngồi chờ may mắn.",
  "future": "Thời gian tới là sân khấu của sự chủ động. Ai dám bắt đầu trước sẽ thấy đường hiện ra rõ hơn người chỉ đứng quan sát.",
  "universe": "Vũ trụ nhắc bạn rằng công cụ đã đủ, chỉ thiếu cái bắt tay làm thật. Một hành động nhỏ hôm nay hơn mười dự định để mai."
 },
 "priestess": {
  "love": "Trong tình cảm, có điều chưa được nói thành lời giữa hai người. Lá này khuyên bạn lắng nghe cảm giác của mình, nó đang chỉ đúng hướng đấy.",
  "ex": "Chuyện người cũ vẫn còn một lớp chưa rõ: có thể là điều bạn chưa biết, hoặc điều bạn biết mà chưa dám thừa nhận với chính mình.",
  "work": "Ở công việc, chưa phải lúc nói hết những gì bạn biết. Quan sát thêm, giữ lại một phần, chờ thời điểm rõ ràng hơn để lên tiếng.",
  "money": "Về tiền, lá này khuyên tin vào cảm giác bất an nếu có. Khoản nào nghe chưa rõ ràng thì chậm lại, tìm hiểu kỹ rồi quyết.",
  "future": "Giai đoạn tới thiên về bên trong: hiểu mình nhiều hơn đạt được bên ngoài. Sự tĩnh lặng lúc này là bước chuẩn bị đáng giá.",
  "universe": "Vũ trụ nhắn bạn đừng vội tìm câu trả lời ở bên ngoài. Yên lặng một chút, câu trả lời bạn cần đã nằm sẵn bên trong từ lâu."
 },
 "empress": {
  "love": "Chuyện tình cảm đang ở vùng ấm áp, dễ nảy nở. Sự chăm sóc nhỏ mà đều đặn sẽ làm mối liên kết này sâu hơn bạn nghĩ.",
  "ex": "Với người cũ, lá này nói bạn đang học cách chăm sóc chính mình trước. Đó là dấu hiệu bạn đã lớn lên sau chuyện cũ.",
  "work": "Công việc của bạn hợp với hướng vun trồng dài hạn: xây đội, chăm khách, nuôi dự án. Thành quả đến chậm mà chắc, đừng sốt ruột giữa chừng.",
  "money": "Tài chính dễ chịu hơn nhờ những gì bạn đã vun đắp trước đó. Lúc này hợp nuôi khoản đang có hơn là đổi hướng liên tục.",
  "future": "Thời gian tới mang năng lượng đủ đầy và sáng tạo. Những gì bạn chăm chút bằng cả tấm lòng sẽ dần ra hoa, theo nhịp riêng của nó.",
  "universe": "Vũ trụ nhắc bạn rằng bạn xứng đáng được nhận, không chỉ luôn là người cho đi. Hãy cho phép mình nghỉ ngơi và tận hưởng một chút."
 },
 "emperor": {
  "love": "Trong tình cảm, lá này đề cao sự rõ ràng và cam kết. Quan hệ muốn bền cần nguyên tắc chung mà cả hai cùng tôn trọng.",
  "ex": "Với người cũ, bài học lớn nhất là ranh giới. Hãy giữ vững nguyên tắc của mình, đừng vì phút yếu lòng mà xoá hết.",
  "work": "Công việc lúc này cần kỷ luật và kế hoạch rõ ràng hơn cảm hứng. Ai giữ nhịp đều, nguyên tắc vững sẽ đi xa nhất.",
  "money": "Về tiền bạc, lá này hợp với lập ngân sách, chia khoản rõ ràng, giữ kỷ luật chi tiêu. Nền vững bắt đầu từ quy tắc nhỏ.",
  "future": "Giai đoạn tới đòi hỏi bạn xây nền: thói quen, nguyên tắc và thứ tự ưu tiên. Nền càng chắc, những bước lớn phía sau càng ít chông chênh.",
  "universe": "Vũ trụ nhắn rằng tự do thật sự đến từ kỷ luật đúng chỗ. Bạn đặt được trật tự cho đời mình thì tâm trí cũng nhẹ theo."
 },
 "hierophant": {
  "love": "Chuyện tình cảm hợp với hướng nghiêm túc, rõ ràng danh phận. Lời khuyên từ người lớn từng trải cũng đáng nghe lúc này.",
  "ex": "Với người cũ, lá này nhắc tới bài học và giá trị bạn rút ra được. Có chuyện khép lại để bạn sống đúng niềm tin hơn.",
  "work": "Ở công việc, đi theo quy trình đã kiểm chứng an toàn hơn tự chế đường tắt. Tìm được người thầy đúng nghĩa là món quà lớn.",
  "money": "Về tài chính, lá này hợp với kênh truyền thống, minh bạch, giấy tờ rõ ràng. Nghe số đông không sai, miễn bạn hiểu mình làm gì.",
  "future": "Thời gian tới, một người đi trước hoặc cộng đồng đúng gu sẽ ảnh hưởng tốt tới bạn. Đừng ngại học lại điều cơ bản nhất.",
  "universe": "Vũ trụ gửi bạn một người dẫn đường, có thể là thầy, là sách hay một câu nói đúng lúc. Việc của bạn là chịu mở lòng ra đón."
 },
 "lovers": {
  "love": "Một lựa chọn của trái tim đang ở ngay trước mặt bạn. Hãy chọn theo sự đồng điệu thật, đừng chọn vì sợ cô đơn hay nể nang.",
  "ex": "Với người cũ, lá này nói về ngã rẽ: giữ trong lòng như kỷ niệm đẹp, hay để nó tiếp tục ảnh hưởng hiện tại của bạn.",
  "work": "Công việc đặt bạn trước hai hướng đều có cái hay riêng. Hãy chọn hướng hợp giá trị dài hạn, không chỉ hợp ví tiền trước mắt.",
  "money": "Về tiền, có quyết định cần cân giữa ham muốn và nhu cầu thật. Hãy chọn phương án khiến bạn yên lòng nhất khi nghĩ lâu dài.",
  "future": "Giai đoạn tới nổi bật là những lựa chọn quan trọng. Tin vui là bạn không chọn trong mù mờ, lòng bạn đã nghiêng về một phía.",
  "universe": "Vũ trụ nhắc bạn rằng chọn cũng là một cách yêu thương bản thân. Đứng mãi giữa ngã ba đường mới là điều làm bạn mệt nhất."
 },
 "chariot": {
  "love": "Trong tình cảm, lá này mang năng lượng tiến tới rõ rệt. Đã chắc lòng thì cứ bước lên, chần chừ mới là thứ làm mất cơ hội.",
  "ex": "Với người cũ, lá này nói bạn đang lấy lại tay lái đời mình. Cứ hướng về phía trước, đừng ngoái lại quá khứ quá nhiều lần.",
  "work": "Công việc đang vào nhịp tăng tốc, rất hợp để chốt mục tiêu, lao về đích. Giữ tay lái vững, đừng để việc lẻ tẻ làm phân tâm.",
  "money": "Tài chính hợp với người có mục tiêu rõ và kỷ luật theo đuổi. Kế hoạch tiết kiệm hay trả nợ cụ thể sẽ chạy nhanh hơn tưởng.",
  "future": "Thời gian tới là chặng tăng tốc: nhiều việc dồn dập nhưng đầy năng lượng. Bạn càng rõ đích đến, chặng này càng ít tốn sức vô ích.",
  "universe": "Vũ trụ nhắn rằng động lực của bạn đang lên cao. Đừng phanh lại vì lời bàn ra, cứ giữ hướng đã chọn và đi cho tới nơi."
 },
 "strength": {
  "love": "Chuyện tình cảm cần kiên nhẫn và mềm mỏng hơn là tranh thắng thua. Người biết lắng nghe lúc này có sức hút hơn người nói hay.",
  "ex": "Với người cũ, sức mạnh của bạn nằm ở sự bình thản. Không cần chứng minh gì với ai, cứ sống tốt phần mình là đủ.",
  "work": "Ở công việc, lá này hợp xử lý chuyện khó bằng sự điềm tĩnh. Áp lực càng cao, người giữ nhịp thở đều càng được tin tưởng.",
  "money": "Về tiền bạc, đây là bài học bền bỉ: khoản nhỏ đều đặn thắng khoản lớn thất thường. Đừng nóng vội chạy theo nhịp người khác.",
  "future": "Giai đoạn tới thử thách lòng kiên nhẫn của bạn ở vài thời điểm. Tin vui là bạn mạnh hơn mình nghĩ, nhất là khi không tự làm khó mình.",
  "universe": "Vũ trụ nhắc bạn rằng mạnh mẽ không phải là gồng lên. Đôi khi dịu dàng với chính mình mới là sức mạnh khó làm nhất."
 },
 "hermit": {
  "love": "Trong tình cảm, bạn có thể đang cần một khoảng lặng cho riêng mình. Xa nhau một chút để hiểu lòng mình không phải là dấu hiệu xấu đâu.",
  "ex": "Với người cũ, lá này là khoảng lặng cần thiết để nhìn lại bài học. Bạn không trốn tránh, chỉ đang gom sáng rõ cho chặng sau.",
  "work": "Công việc lúc này hợp làm độc lập, nghiên cứu sâu, hoàn thiện tay nghề trong im lặng. Ánh đèn sân khấu sẽ tới sau, đừng vội.",
  "money": "Về tiền, đây là lúc ngồi xuống rà soát toàn bộ các khoản một mình, thật kỹ. Chi tiết nhỏ phát hiện bây giờ đỡ tốn kém về sau.",
  "future": "Thời gian tới thiên về hướng nội: ít ồn ào, nhiều suy ngẫm. Đây là kiểu giai đoạn nhìn thì chậm mà thật ra đang chín muồi bên trong.",
  "universe": "Vũ trụ tặng bạn một ngọn đèn nhỏ cho riêng mình. Cứ đi chậm trong tĩnh lặng một thời gian, đường sẽ tự hiện ra dưới chân."
 },
 "wheel": {
  "love": "Chuyện tình cảm đang ở khúc quanh thú vị: cuộc gặp bất ngờ hoặc biến chuyển không tính trước. Cứ để mọi thứ xoay theo nhịp tự nhiên.",
  "ex": "Với người cũ, bánh xe đã quay qua chương của họ rồi. Một vòng mới đang mở cho bạn, đừng cố giữ vòng cũ đứng yên lại làm gì.",
  "work": "Công việc sắp có biến chuyển: người mới, việc mới hoặc cơ hội đến bất ngờ. Ai linh hoạt, sẵn sàng sẽ nắm nhịp này tốt nhất.",
  "money": "Tài chính đang ở chu kỳ lên xuống tự nhiên, đừng hoảng vì dao động ngắn hạn. Quan trọng là bạn còn giữ quân bài dự phòng không.",
  "future": "Giai đoạn tới nhiều thay đổi và khó đoán, nhưng phần lớn theo hướng mở ra cơ hội. Giữ tâm thế linh hoạt là chìa khoá của chặng này.",
  "universe": "Vũ trụ nhắc bạn rằng không có trạng thái nào đứng yên mãi. Đang khó thì sẽ qua, đang thuận thì hãy biết trân trọng và tích luỹ."
 },
 "justice": {
  "love": "Trong tình cảm, lá này đề cao thẳng thắn và công bằng giữa hai người. Điều chưa rõ ràng thì nên nói ra, đoán mò chỉ mệt thêm.",
  "ex": "Với người cũ, đây là lúc nhìn lại mọi chuyện thật công tâm: phần nào của họ, phần nào của bạn. Nhìn rõ rồi lòng sẽ nhẹ.",
  "work": "Công việc lúc này gắn với giấy tờ, cam kết, đánh giá công tâm. Cứ làm đúng phần việc, giữ chứng cứ rõ ràng, bạn sẽ đứng vững.",
  "money": "Về tiền bạc, lá này nhắc cân lại thu chi và những khoản cam kết chung. Chia rõ từ đầu là cách giữ cả tiền lẫn tình cảm.",
  "future": "Thời gian tới, những gì bạn gieo sẽ dần có kết quả tương xứng. Sống ngay thẳng, rõ ràng là khoản đầu tư ít rủi ro nhất.",
  "universe": "Vũ trụ nhắn rằng sự thật luôn có sức nặng riêng của nó. Bạn cứ đứng về phía rõ ràng, thời gian sẽ tự làm phần việc còn lại."
 },
 "hanged": {
  "love": "Chuyện tình cảm đang ở đoạn tạm dừng, chờ đợi, chưa ngã ngũ. Thay vì ép tiến độ, thử nhìn mối quan hệ từ phía đối phương xem sao.",
  "ex": "Với người cũ, có thể bạn mắc kẹt ở một câu hỏi chưa có lời đáp. Buông nhu cầu hiểu hết đôi khi là cách thoát nhanh nhất.",
  "work": "Công việc có đoạn phải chờ: chờ duyệt, chờ người, chờ thời điểm. Đừng phí khoảng chờ, nó hợp để nhìn lại toàn cảnh, sửa chiến lược.",
  "money": "Về tiền, lá này khuyên tạm hoãn các quyết định lớn. Khoản đang treo chưa hẳn xấu, miễn bạn không chốt vội lúc thiếu thông tin.",
  "future": "Giai đoạn tới có một khoảng dừng bất đắc dĩ, nhưng chính khoảng dừng này giúp bạn đổi góc nhìn. Sau nó, nhiều chuyện sẽ sáng rõ hơn hẳn.",
  "universe": "Vũ trụ cho bạn một khoảng lặng giữa chừng không phải để phạt bạn. Đổi góc nhìn đi, đáp án nằm ở hướng bạn chưa từng thử ngó sang."
 },
 "death": {
  "love": "Một chương cũ trong đời sống tình cảm đang khép lại để nhường chỗ cho điều hợp hơn. Buông đúng lúc cũng là một cách yêu thương chính mình.",
  "ex": "Lá này nói rõ về người cũ: chương đó đã xong vai trò của nó rồi. Còn lại là bạn có cho mình bước hẳn sang trang mới không.",
  "work": "Công việc có thể sắp kết một giai đoạn: xong dự án, đổi vai trò, rời môi trường hết duyên. Sau cái kết này là khoảng trống để lớn lên.",
  "money": "Về tiền bạc, một thói quen chi tiêu hay nguồn thu cũ đang đến lúc chấm dứt. Đau ngắn hạn một chút để cơ cấu lại khoẻ hơn.",
  "future": "Thời gian tới nổi bật là sự chuyển giao: bỏ lại thứ đã cũ để đón thứ hợp hơn. Đừng sợ khoảng trống giữa hai chặng, nó ngắn thôi.",
  "universe": "Vũ trụ nhắn bạn đừng níu những gì đã hết hạn. Tay còn bận giữ quá khứ thì không còn chỗ để đón điều mới đang tới gần."
 },
 "temperance": {
  "love": "Chuyện tình cảm hợp nhịp chậm rãi, cân bằng: cho và nhận đều tay. Sự hoà hợp đến từ những điều tiết rất nhỏ mỗi ngày.",
  "ex": "Với người cũ, lá này nói về quá trình chữa lành đang diễn ra đúng nhịp. Không cần nhanh, chỉ cần không quay lại làm đau mình.",
  "work": "Công việc lúc này cần phối hợp nhịp nhàng hơn là bứt phá. Pha đúng liều giữa tốc độ và chất lượng sẽ giúp bạn đi xa.",
  "money": "Về tài chính, chìa khoá là điều độ: chi trong khả năng, để dành đều, không cực đoan phía nào. Nhịp đều mới giữ được tiền.",
  "future": "Giai đoạn tới êm và ổn định, ít biến động lớn. Kiểu thời gian này hợp để phục hồi năng lượng, sắp xếp lại cuộc sống gọn gàng.",
  "universe": "Vũ trụ nhắc bạn rằng cân bằng không phải đứng yên. Nó là nghệ thuật điều chỉnh từng chút một, và bạn đang làm điều đó khá tốt rồi."
 },
 "devil": {
  "love": "Trong tình cảm, lá này hỏi có thói quen nào làm bạn mệt mà chưa dứt được không: ghen, kiểm soát, hay lệ thuộc một mối quan hệ chưa lành.",
  "ex": "Với người cũ, đây là lá ràng buộc chưa dứt hẳn: vẫn bị kéo lại bởi thói quen, kỷ niệm. Nhận ra được là đã gỡ một nửa.",
  "work": "Ở công việc, cẩn thận những thứ nghe hấp dẫn mà cái giá phải trả không nhỏ. Đừng để tham vọng đẩy bạn qua ranh giới của mình.",
  "money": "Về tiền bạc, lá này cảnh báo nhẹ về chi tiêu theo cảm xúc, mua vì đua theo người khác. Vui một lúc mà áy náy dài thì không đáng.",
  "future": "Thời gian tới, thử thách của bạn là một cám dỗ quen thuộc quay lại gõ cửa. Nhớ lý do từng muốn thay đổi là đứng vững được.",
  "universe": "Vũ trụ chỉ cho bạn sợi dây đang buộc mình: có thể là một thói quen xấu. Tin vui là sợi dây này bạn tự cởi được."
 },
 "tower": {
  "love": "Chuyện tình cảm có thể sắp có một sự thật được nói ra, làm thay đổi cục diện. Hơi sốc lúc đầu, nhưng rõ ràng hơn mơ hồ kéo dài.",
  "ex": "Với người cũ, có thể một điều về chuyện cũ sẽ sáng tỏ hoàn toàn, giúp bạn đóng hẳn cánh cửa này. Sự thật đến muộn vẫn là quà.",
  "work": "Công việc có khả năng biến động bất ngờ: đổi kế hoạch, đổi người phụ trách. Bình tĩnh xử lý từng việc, đừng hoảng theo đám đông.",
  "money": "Về tài chính, lá này nhắc kiểm tra lại những khoản tưởng chắc chắn nhất. Có sẵn phương án dự phòng thì biến cố nhẹ đi một nửa.",
  "future": "Giai đoạn tới có biến chuyển hơi mạnh tay của cuộc sống. Nó dỡ bỏ thứ vốn không còn vững, phía sau là đất trống để xây lại.",
  "universe": "Vũ trụ đôi khi phải lắc mạnh một cái để bạn chịu rời chỗ cũ. Đừng sợ đổ vỡ, hãy xem mình được giải thoát khỏi điều gì."
 },
 "star": {
  "love": "Sau những ngày chưa vui, chuyện tình cảm đang ấm dần lại với nhiều tín hiệu dễ thương. Cứ là chính mình, sức hút sẽ tự tới.",
  "ex": "Với người cũ, lá này là dấu hiệu bạn đang hồi phục thật: nhắc chuyện cũ mà lòng không còn nhói như trước. Cứ giữ nhịp này.",
  "work": "Công việc đang có ngôi sao dẫn đường: mục tiêu xa nhưng rõ, hoặc quý nhân xuất hiện đúng lúc. Cứ kiên trì, đường đang sáng dần.",
  "money": "Tài chính sau giai đoạn căng sẽ dần dễ thở hơn, miễn bạn giữ kỷ luật như đã hứa với mình. Đừng thấy sáng mà buông lỏng ngay.",
  "future": "Thời gian tới là chặng hồi phục, nuôi lại hy vọng. Những dự định từng tưởng xa vời bắt đầu có hình hài rõ hơn, cứ đi tiếp.",
  "universe": "Vũ trụ gửi bạn một lời khẳng định nhẹ: bạn đang đi đúng hướng rồi. Đừng so mình với ai, nhịp của bạn là dành riêng cho bạn."
 },
 "moon": {
  "love": "Trong tình cảm, mọi thứ đang hơi mập mờ: nói một đằng, cảm xúc một nẻo. Đừng vội kết luận khi chưa đủ thông tin, chờ sương tan thêm.",
  "ex": "Với người cũ, cảm xúc thỉnh thoảng trồi lên về đêm là chuyện rất thường. Nó là dư âm thôi, không phải dấu hiệu bạn nên quay lại đâu.",
  "work": "Ở công việc, có việc chưa rõ ràng như vẻ ngoài: thông tin thiếu, ý đồ chưa lộ. Cứ hỏi lại cho chắc, đừng suy đoán lấp chỗ trống.",
  "money": "Về tiền bạc, lá này khuyên tránh quyết định khi đang mơ hồ hay mệt mỏi. Con số chưa rõ thì chưa chốt, nhất là lời rủ rê ban đêm.",
  "future": "Giai đoạn tới cảm xúc lên xuống hơi thất thường, trực giác mạnh mà cũng dễ lo xa. Ngủ đủ, chậm lại sẽ giúp bạn phân biệt thật giả.",
  "universe": "Vũ trụ nhắc bạn rằng không phải cái gì chưa rõ cũng là nguy hiểm. Có những đáp án cần bóng tối yên tĩnh mới chịu hiện hình."
 },
 "sun": {
  "love": "Chuyện tình cảm đang ở vùng sáng rõ, vui vẻ: thành thật, thoải mái, không phải đoán ý nhau. Một lời nói thẳng sẽ làm mọi thứ ấm hơn.",
  "ex": "Với người cũ, ánh sáng lá này giúp bạn nhìn chuyện cũ nhẹ nhàng và dứt khoát. Bạn của hiện tại đã vui, rõ ràng hơn nhiều rồi.",
  "work": "Công việc đang có vận sáng: thành quả dễ được nhìn thấy, ý tưởng dễ được công nhận. Mạnh dạn trình bày đi, lúc này hợp bước ra ánh sáng.",
  "money": "Tài chính có dấu hiệu khả quan, minh bạch hơn. Nỗ lực kiếm tiền chân chính đang dần cho trái ngọt, cứ giữ cách làm rõ ràng này.",
  "future": "Thời gian tới là chặng sáng nhất bộ bài: năng lượng tốt, tinh thần tốt, việc gì cũng thấy đường đi. Tận hưởng mà vẫn giữ nhịp đều.",
  "universe": "Vũ trụ mỉm cười với bạn giai đoạn này. Điều bạn cần làm chỉ là đừng tự làm khó mình, niềm vui đôi khi đơn giản hơn tưởng."
 },
 "judgement": {
  "love": "Chuyện tình cảm đang tới lúc cần quyết định rõ ràng: tiến thêm một bước hay dừng lại cho nhẹ lòng. Hãy nghe tiếng gọi thật trong lòng.",
  "ex": "Với người cũ, đây là lúc tổng kết: bạn học được gì, muốn mang theo gì vào mối quan hệ sau. Khép sổ cũ để mở lòng đúng cách.",
  "work": "Công việc có cột mốc đánh giá quan trọng đang tới. Những gì bạn làm bấy lâu sẽ được nhìn nhận tổng thể, cứ chuẩn bị phần mình chỉn chu.",
  "money": "Về tiền bạc, đến lúc ngồi xuống phán xét lại toàn bộ cách dùng tiền thời gian qua. Nhận ra chỗ chưa ổn là bước đầu cơ cấu mới.",
  "future": "Giai đoạn tới mang tính bước ngoặt: một quyết định lớn sẽ phân định rõ trước và sau. Bạn đã chuẩn bị cho nó lâu hơn bạn tưởng đấy.",
  "universe": "Vũ trụ đang gọi bạn bước lên một phiên bản rõ ràng hơn của chính mình. Nghe thấy tiếng gọi rồi thì đừng giả vờ như chưa nghe."
 },
 "world": {
  "love": "Chuyện tình cảm đang ở trạng thái trọn vẹn, hoà hợp dễ chịu. Dù đang có đôi hay một mình, bạn đều ở đúng nhịp của mình.",
  "ex": "Với người cũ, vòng tròn đã khép hẳn rồi: không còn nợ nần cảm xúc gì nữa. Đây là dấu hiệu sạch nhất để bắt đầu chương mới.",
  "work": "Công việc sắp hoàn thành một vòng lớn: dự án về đích, mục tiêu đạt được. Nhớ ăn mừng một chút rồi mới tính chặng tiếp theo.",
  "money": "Tài chính đang ở trạng thái cân đối, đủ đầy theo khả năng của bạn. Duy trì nhịp này lâu dài quan trọng hơn một lần bứt phá.",
  "future": "Thời gian tới là chặng thu hoạch và khép vòng đẹp. Những mảnh ghép rời rạc bấy lâu bắt đầu khớp lại thành một bức tranh rõ nghĩa.",
  "universe": "Vũ trụ chúc mừng bạn đã đi trọn một vòng học hỏi. Mang theo tất cả bài học đó, vòng sau sẽ bắt đầu ở tầm cao hơn."
 }
};

// Khung chiều xuôi/ngược: bọc quanh lời giải theo chủ đề để đủ ý mà vẫn ngắn
const FRAMES: Record<'up' | 'rev', string[]> = {
  up: [
    'Chiều xuôi, năng lượng đang thông suốt.',
    'Chiều xuôi, dòng năng lượng đang mở.',
  ],
  rev: [
    'Chiều ngược, mọi thứ chậm lại một nhịp.',
    'Chiều ngược, hãy nhìn thêm mặt còn khuất.',
  ],
};

export const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Lời giải hoàn chỉnh cho 1 lượt: mở đầu (tên + chủ đề + lá) + khung chiều + ý nghĩa theo chủ đề + lời khuyên.
 * Ghép sao cho tổng 35–55 từ (đọc khoảng 15–20 giây): quá dài thì tự bỏ câu khung.
 */
export function readingText(card: TarotCard, reversed: boolean, topic: TopicKey, spokenName: string, variant: number): string[] {
  const t = TOPICS[topic];
  const intro = `Bạn ${spokenName}, lá ${card.name} về ${t.short}:`;
  const frame = FRAMES[reversed ? 'rev' : 'up'][variant % 2];
  const line = TOPIC_LINES[card.id][topic];
  const advice = t.advice[variant % t.advice.length];
  const parts = [intro, frame, line, advice];
  if (countWords(parts.join(' ')) > 50) parts.splice(1, 1);
  return parts;
}

export const DISCLAIMER = 'Mình nhắc nhẹ cả phòng, xem tarot ở đây chỉ mang tính giải trí và tham khảo cho vui thôi nhé.';
