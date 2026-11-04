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
  luck: number; // điểm may mắn ở chế độ game Lá Bài May Mắn (lá ngược được một nửa)
  up: string; // lời giải chiều xuôi (đọc lên live)
  rev: string; // lời giải chiều ngược (đọc lên live)
}

export const CARDS: TarotCard[] = [
  {
    id: 'fool', numeral: '0', name: 'Kẻ Khờ', en: 'The Fool', symbol: '🌈', c1: '#f59e0b', c2: '#ef4444',
    luck: 50,
    keywords: 'khởi đầu, tự do, liều lĩnh',
    up: 'Một khởi đầu mới đang mở ra trước mắt bạn, nhẹ tênh và đầy háo hức. Lá bài khuyên cứ mạnh dạn bước bước đầu tiên, đừng chờ mọi thứ hoàn hảo rồi mới bắt đầu.',
    rev: 'Bạn đang hơi vội hoặc hơi liều so với tình hình thật. Lá bài nhắc chậm lại một nhịp, kiểm tra kỹ hành trang và đường đi trước khi nhảy vào việc mới.',
  },
  {
    id: 'magician', numeral: 'I', name: 'Nhà Ảo Thuật', en: 'The Magician', symbol: '🪄', c1: '#7c3aed', c2: '#db2777',
    luck: 80,
    keywords: 'khéo léo, chủ động, biến hoá',
    up: 'Bạn đang có đủ nguyên liệu trong tay rồi: kỹ năng, mối quan hệ và cả cơ hội. Việc còn lại là chủ động bắt tay làm, lá bài này rất hợp với người dám đứng ra dẫn dắt.',
    rev: 'Có vẻ bạn đang tự nghi ngờ tay nghề của mình, hoặc có ai đó nói hay hơn làm. Lá bài khuyên quay về kiểm chứng bằng việc thật, đừng để lời hứa đẹp làm mờ mắt.',
  },
  {
    id: 'priestess', numeral: 'II', name: 'Nữ Tư Tế', en: 'The High Priestess', symbol: '🌙', c1: '#1e3a8a', c2: '#0ea5e9',
    luck: 70,
    keywords: 'trực giác, bí mật, lắng nghe',
    up: 'Câu trả lời bạn tìm chưa nằm ở bên ngoài đâu, nó nằm ở cảm giác rất rõ trong lòng mà bạn đang cố lờ đi. Lá bài khuyên yên lặng quan sát thêm, chuyện chưa lộ hết.',
    rev: 'Bạn đang bỏ qua tiếng nói bên trong vì xung quanh quá ồn. Lá bài nhắc dành thời gian riêng cho mình, và cẩn thận với những chuyện mới nghe một nửa sự thật.',
  },
  {
    id: 'empress', numeral: 'III', name: 'Nữ Hoàng', en: 'The Empress', symbol: '🌸', c1: '#db2777', c2: '#f59e0b',
    luck: 90,
    keywords: 'đủ đầy, chăm sóc, sáng tạo',
    up: 'Thời kỳ dễ chịu và đủ đầy đang tới gần, công sức chăm chút bấy lâu bắt đầu ra hoa kết trái. Lá bài hợp với việc vun đắp: một mối quan hệ, một dự án, hay chính bản thân bạn.',
    rev: 'Bạn đang lo cho mọi người nhiều hơn lo cho mình, hoặc đang ôm đồm quá sức. Lá bài nhắc nạp lại năng lượng cho bản thân trước, cạn pin thì chăm ai cũng khó.',
  },
  {
    id: 'emperor', numeral: 'IV', name: 'Hoàng Đế', en: 'The Emperor', symbol: '👑', c1: '#991b1b', c2: '#b45309',
    luck: 75,
    keywords: 'kỷ luật, nền tảng, quyết đoán',
    up: 'Lúc này cần sự chắc chắn và kỷ luật hơn là cảm hứng. Lá bài khuyên lập kế hoạch rõ ràng, giữ nguyên tắc, xây nền cho vững rồi thành quả sẽ theo sau.',
    rev: 'Có thể bạn đang quá cứng nhắc, hoặc ngược lại, mọi thứ đang hơi lỏng lẻo thiếu người cầm trịch. Lá bài nhắc xem lại ranh giới và quy tắc của chính mình.',
  },
  {
    id: 'hierophant', numeral: 'V', name: 'Giáo Hoàng', en: 'The Hierophant', symbol: '🕯️', c1: '#92400e', c2: '#065f46',
    luck: 65,
    keywords: 'truyền thống, người dẫn đường, niềm tin',
    up: 'Một người đi trước giàu kinh nghiệm có thể chỉ cho bạn đường ngắn hơn. Lá bài khuyên học theo cách đã được kiểm chứng, và đừng ngại tìm một người thầy đúng nghĩa.',
    rev: 'Cách cũ đang bắt đầu chật chội với bạn. Lá bài gợi ý rằng đã đến lúc tự hỏi mình thật sự tin vào điều gì, thay vì chỉ làm theo thói quen của số đông.',
  },
  {
    id: 'lovers', numeral: 'VI', name: 'Đôi Tình Nhân', en: 'The Lovers', symbol: '💞', c1: '#e11d48', c2: '#f472b6',
    luck: 95,
    keywords: 'lựa chọn, gắn kết, đồng điệu',
    up: 'Một mối liên kết đẹp hoặc một lựa chọn quan trọng của trái tim đang ở trước mặt. Lá bài khuyên chọn theo giá trị thật của mình, khi lòng đã đồng điệu thì quyết định sẽ nhẹ nhàng.',
    rev: 'Hai phía đang hơi lệch nhịp, hoặc bạn đang đứng giữa hai lựa chọn mà bên nào cũng tiếc. Lá bài nhắc nói thẳng điều mình nghĩ, im lặng lâu ngày dễ sinh hiểu lầm.',
  },
  {
    id: 'chariot', numeral: 'VII', name: 'Cỗ Xe', en: 'The Chariot', symbol: '🐎', c1: '#0f766e', c2: '#1d4ed8',
    luck: 85,
    keywords: 'tiến lên, ý chí, chiến thắng',
    up: 'Đà tiến đang rất mạnh, cứ giữ chặt tay lái và hướng thẳng mục tiêu. Lá bài này hợp với thi thố, di chuyển và những việc cần dứt khoát, kết quả nghiêng về phía người quyết tâm.',
    rev: 'Bạn đang bị kéo về hai hướng cùng lúc nên xe cứ giậm chân tại chỗ. Lá bài khuyên chọn một hướng ưu tiên trước, sức dàn trải thì việc nào cũng dở dang.',
  },
  {
    id: 'strength', numeral: 'VIII', name: 'Sức Mạnh', en: 'Strength', symbol: '🦁', c1: '#d97706', c2: '#dc2626',
    luck: 85,
    keywords: 'kiên nhẫn, dịu dàng, bền bỉ',
    up: 'Sức mạnh thật lúc này không nằm ở sự hơn thua mà ở sự kiên nhẫn và dịu dàng đúng lúc. Lá bài khuyên mềm mỏng mà vững, bạn sẽ thuần phục được tình huống khó theo cách êm nhất.',
    rev: 'Bạn đang hơi đuối, hoặc đang nén cảm xúc quá lâu. Lá bài nhắc cho phép mình nghỉ và yếu đuối một chút, nạp lại sức rồi hãy gồng tiếp.',
  },
  {
    id: 'hermit', numeral: 'IX', name: 'Ẩn Sĩ', en: 'The Hermit', symbol: '🏮', c1: '#334155', c2: '#0f172a',
    luck: 55,
    keywords: 'tĩnh lặng, soi đường, một mình',
    up: 'Đây là lúc hợp để lùi lại một bước và tự soi đường cho mình. Lá bài khuyên ít ồn ào, nhiều suy ngẫm, đáp án sẽ tự sáng dần như ngọn đèn trong đêm.',
    rev: 'Bạn đang thu mình hơi lâu, hoặc ngược lại, sợ ở một mình nên cứ tìm việc lấp đầy. Lá bài nhắc cân bằng lại: tĩnh lặng để hiểu mình, nhưng đừng tự cô lập quá lâu.',
  },
  {
    id: 'wheel', numeral: 'X', name: 'Bánh Xe Số Phận', en: 'Wheel of Fortune', symbol: '🎡', c1: '#0891b2', c2: '#7c3aed',
    luck: 100,
    keywords: 'thay đổi, vận hội, chu kỳ',
    up: 'Bánh xe đang quay và chiều gió đang đổi theo hướng có lợi cho bạn. Lá bài khuyên chớp lấy thời cơ khi nó tới, vì vận hội thường gõ cửa rất khẽ và đi cũng nhanh.',
    rev: 'Một chu kỳ không như ý đang diễn ra, nhưng bánh xe thì không bao giờ đứng yên. Lá bài nhắc giữ vững tay chèo qua đoạn này, đổi chiều là chuyện sớm muộn.',
  },
  {
    id: 'justice', numeral: 'XI', name: 'Công Lý', en: 'Justice', symbol: '⚖️', c1: '#475569', c2: '#0ea5e9',
    luck: 70,
    keywords: 'công bằng, sự thật, trách nhiệm',
    up: 'Mọi việc đang được đặt lên bàn cân một cách công bằng. Lá bài khuyên nói thật, làm đúng giấy tờ và nguyên tắc, gieo gì thì gặt nấy trong giai đoạn này.',
    rev: 'Có chỗ đang chưa sòng phẳng, hoặc một quyết định cũ đang đòi được xem lại. Lá bài nhắc rà soát kỹ giấy tờ, lời nói và cam kết trước khi ký kết hay phán xét ai.',
  },
  {
    id: 'hanged', numeral: 'XII', name: 'Người Treo Ngược', en: 'The Hanged Man', symbol: '🙃', c1: '#0369a1', c2: '#65a30d',
    luck: 35,
    keywords: 'tạm dừng, góc nhìn mới, buông',
    up: 'Đôi khi đứng yên lại là bước đi khôn ngoan nhất. Lá bài khuyên thử nhìn chuyện đang bế tắc từ một góc hoàn toàn khác, đáp án thường nằm ở phía bạn chưa chịu nhìn.',
    rev: 'Bạn đang chờ đợi quá lâu cho một việc không còn tiến triển. Lá bài nhắc tự hỏi mình đang níu giữ điều gì, và liệu đã đến lúc buông tay để nhẹ người chưa.',
  },
  {
    id: 'death', numeral: 'XIII', name: 'Thần Chết', en: 'Death', symbol: '🥀', c1: '#111827', c2: '#4c1d95',
    luck: 30,
    keywords: 'kết thúc, chuyển hoá, tái sinh',
    up: 'Đừng sợ lá này, nó nói về một chương cũ sắp khép lại để chương mới tốt hơn được mở ra. Lá bài khuyên dọn dẹp dứt khoát những gì đã hết hạn, nhẹ người thì mới đi xa được.',
    rev: 'Bạn đang cố níu một chuyện đã đến lúc nên kết thúc, nên mọi thứ cứ trì trệ. Lá bài nhắc chấp nhận thay đổi từng chút một, chuyển hoá luôn cần thời gian.',
  },
  {
    id: 'temperance', numeral: 'XIV', name: 'Điều Độ', en: 'Temperance', symbol: '🌊', c1: '#0d9488', c2: '#2563eb',
    luck: 75,
    keywords: 'cân bằng, hoà hợp, từ tốn',
    up: 'Chìa khoá lúc này là chữ vừa: vừa làm vừa nghỉ, vừa cho vừa nhận. Lá bài khuyên pha trộn và điều tiết từ tốn, mọi thứ đang tự tìm về điểm cân bằng của nó.',
    rev: 'Có mặt nào đó trong đời sống của bạn đang lệch hẳn về một phía. Lá bài nhắc bớt lại cái đang thừa và bù vào chỗ đang thiếu, đừng để cảm xúc cực đoan dẫn đường.',
  },
  {
    id: 'devil', numeral: 'XV', name: 'Ác Quỷ', en: 'The Devil', symbol: '🔥', c1: '#7f1d1d', c2: '#111827',
    luck: 15,
    keywords: 'cám dỗ, lệ thuộc, ham muốn',
    up: 'Có một sức hút rất mạnh đang kéo bạn: một thói quen khó bỏ, một mối quan hệ, hay một món hời nghe quá ngon. Lá bài khuyên tỉnh táo nhìn cái giá thật đằng sau sự sung sướng trước mắt.',
    rev: 'Bạn đang dần thoát ra khỏi một vòng lặp không lành mạnh, và đó là tín hiệu rất tốt. Lá bài động viên đi tiếp con đường cai và cắt này, tự do đang gần hơn bạn nghĩ.',
  },
  {
    id: 'tower', numeral: 'XVI', name: 'Toà Tháp', en: 'The Tower', symbol: '⚡', c1: '#7c2d12', c2: '#991b1b',
    luck: 10,
    keywords: 'biến động, sự thật, đổ vỡ để xây lại',
    up: 'Một biến động bất ngờ có thể làm rung chuyển kế hoạch của bạn, nhưng nó thường phá cái vốn đã mục từ bên trong. Lá bài khuyên bình tĩnh ứng biến, sau cơn rung lắc là mặt đất sạch để xây lại cho chắc.',
    rev: 'Bạn đang cảm thấy nền của một việc gì đó không còn vững như trước. Lá bài nhắc chủ động gia cố và chuẩn bị phương án dự phòng ngay từ bây giờ, đừng chờ tới lúc rung mới chạy.',
  },
  {
    id: 'star', numeral: 'XVII', name: 'Ngôi Sao', en: 'The Star', symbol: '⭐', c1: '#155e75', c2: '#312e81',
    luck: 95,
    keywords: 'hy vọng, chữa lành, cảm hứng',
    up: 'Sau những ngày không dễ dàng, một vì sao hy vọng đang sáng lên cho bạn. Lá bài này rất lành: cứ giữ niềm tin và chăm lại những ước mơ của mình, đường dài đang mở dần ra.',
    rev: 'Niềm tin của bạn đang bị thử thách và cảm hứng thì hơi cạn. Lá bài nhắc đừng tự trách mình, hãy tìm lại những điều nhỏ bé làm mình vui, sao mờ rồi sẽ sáng lại.',
  },
  {
    id: 'moon', numeral: 'XVIII', name: 'Mặt Trăng', en: 'The Moon', symbol: '🌕', c1: '#312e81', c2: '#701a75',
    luck: 40,
    keywords: 'mơ hồ, cảm xúc, ẩn số',
    up: 'Mọi thứ lúc này hơi mờ như đi trong sương, chưa phải lúc kết luận vội. Lá bài khuyên lắng nghe cảm xúc và giấc mơ của mình, và chờ thêm thông tin trước khi quyết định lớn.',
    rev: 'Sương mù đang tan dần, những điều từng khó hiểu bắt đầu rõ mặt. Lá bài khuyên nhân lúc đầu óc sáng ra mà giải quyết nốt những nỗi lo âm ỉ trong lòng.',
  },
  {
    id: 'sun', numeral: 'XIX', name: 'Mặt Trời', en: 'The Sun', symbol: '☀️', c1: '#f97316', c2: '#facc15',
    luck: 100,
    keywords: 'niềm vui, rõ ràng, thành công',
    up: 'Đây là một trong những lá đẹp nhất bộ bài: nắng lên, chuyện sáng tỏ và niềm vui rất thật. Lá bài khuyên cứ tự tin toả sáng và chia niềm vui với mọi người xung quanh.',
    rev: 'Nắng đang bị mây che một chút nên bạn chưa thấy hết tín hiệu tốt quanh mình. Lá bài nhắc đừng vì vài ngày u ám mà quên mất bức tranh lớn vẫn đang rất sáng.',
  },
  {
    id: 'judgement', numeral: 'XX', name: 'Phán Xét', en: 'Judgement', symbol: '🔔', c1: '#1d4ed8', c2: '#9333ea',
    luck: 80,
    keywords: 'thức tỉnh, cơ hội thứ hai, gọi tên',
    up: 'Một tiếng gọi thức tỉnh đang tới: có thể là cơ hội thứ hai cho một việc tưởng đã khép, hoặc lúc bạn nhìn lại chặng đường đã qua một cách rất rõ. Lá bài khuyên trả lời tiếng gọi đó bằng sự thành thật.',
    rev: 'Bạn đang tự phán xét mình hơi nặng, hoặc đang chần chừ trước một quyết định đáng ra phải dứt khoát. Lá bài nhắc tha thứ cho lỗi cũ, của mình và của người, để còn đi tiếp.',
  },
  {
    id: 'world', numeral: 'XXI', name: 'Thế Giới', en: 'The World', symbol: '🌍', c1: '#047857', c2: '#0369a1',
    luck: 100,
    keywords: 'trọn vẹn, hoàn thành, viên mãn',
    up: 'Một vòng tròn đang khép lại rất đẹp: việc bạn theo đuổi bấy lâu đi tới đoạn trọn vẹn. Lá bài khuyên tận hưởng cảm giác hoàn thành này, rồi một hành trình mới lớn hơn sẽ lại mở ra.',
    rev: 'Chỉ còn một đoạn ngắn nữa thôi mà bạn cứ chần chừ chưa chịu về đích. Lá bài nhắc kiểm tra xem còn thiếu mảnh ghép nào, hoàn thiện nốt đi, cảm giác trọn vẹn đang chờ ngay phía trước.',
  },
];

export type TopicKey = 'love' | 'work' | 'money' | 'general';

export const TOPICS: Record<TopicKey, { label: string; keys: string[]; close: string[] }> = {
  love: {
    label: 'Tình yêu',
    keys: [' tinh yeu ', ' tinh cam ', ' yeu ', ' crush ', ' nguoi yeu ', ' tinh duyen '],
    close: [
      'Về chuyện tình cảm, lá bài nhắn bạn cứ thành thật với cảm xúc của mình trước, rồi mọi tín hiệu từ phía bên kia sẽ dễ đọc hơn nhiều.',
      'Riêng đường tình duyên, lời nhắn của lá này là đừng nóng vội. Tình cảm bền thường lớn lên từ những điều rất nhỏ và đều đặn mỗi ngày.',
      'Với chuyện yêu đương, lá bài khuyên bạn lắng nghe bằng cả trái tim lẫn lý trí. Cái nào chỉ đẹp ở lời nói thì cứ từ từ quan sát thêm.',
    ],
  },
  work: {
    label: 'Công việc',
    keys: [' cong viec ', ' viec lam ', ' su nghiep ', ' phong van ', ' thi cu ', ' hoc tap '],
    close: [
      'Về công việc, lá bài nhắn bạn tập trung vào việc mình kiểm soát được: tay nghề, thái độ và sự đều đặn. Phần còn lại cứ để thời gian trả lời.',
      'Riêng chuyện sự nghiệp, lời nhắn là hãy để kết quả lên tiếng thay cho lời giải thích. Cứ làm chắc từng việc nhỏ, cơ hội lớn sẽ tự tìm tới.',
      'Với đường công việc, lá bài khuyên bạn giữ quan hệ tốt với đồng đội xung quanh. Đi một mình thì nhanh, nhưng đi cùng nhau mới đi được xa.',
    ],
  },
  money: {
    label: 'Tài chính',
    keys: [' tai chinh ', ' tien ', ' tien bac ', ' kinh doanh ', ' lam an ', ' buon ban ', ' dau tu '],
    close: [
      'Về tài chính, lá bài chỉ nhắn một câu cho vui thôi nhé: tiền vào tiền ra nên có kế hoạch rõ ràng, và đừng quyết định chuyện tiền nong lúc đang nóng vội.',
      'Riêng chuyện tiền bạc, lời nhắn của lá là giữ nhịp chi tiêu đều và chừa một khoản dự phòng. Bài tarot ngắm cho vui, quyết định tài chính vẫn nên dựa trên con số thật.',
      'Với đường tài chính, lá bài khuyên bạn cẩn thận với những lời mời nghe quá hời. Cái gì rõ ràng minh bạch thì mới đáng để xuống tay.',
    ],
  },
  general: {
    label: 'Tổng quan',
    keys: [],
    close: [
      'Tổng kết lại, lá bài hôm nay gửi bạn một lời nhắn nhẹ nhàng như vậy. Nghe để tham khảo cho vui, còn đường đi vẫn do chính bạn chọn mỗi ngày.',
      'Chốt lại phần xem hôm nay, điều đáng nhớ nhất của lá này là thông điệp cân bằng. Bạn cứ mang nó theo như một gợi ý nhỏ cho những ngày tới.',
      'Và đó là lời nhắn tổng quan dành cho bạn hôm nay. Mình chúc bạn một ngày thật nhẹ nhàng, mọi việc hanh thông theo cách riêng của nó.',
    ],
  },
};

/** Đoán chủ đề từ comment đã bỏ dấu dạng " tarot tinh yeu " (xem plain() trong live/chatter.ts) */
export function detectTopic(paddedPlain: string): TopicKey {
  for (const key of ['love', 'work', 'money'] as TopicKey[]) {
    if (TOPICS[key].keys.some((k) => paddedPlain.includes(k))) return key;
  }
  return 'general';
}

export const DISCLAIMER = 'Mình nhắc nhẹ cả phòng, xem tarot ở đây chỉ mang tính giải trí và tham khảo cho vui thôi nhé.';
