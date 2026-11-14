// Engine Bug Đi WC: Bug bị táo bón ngồi bồn cầu, CẢ PHÒNG cùng "rặn" bằng tim.
// Tim của cả phòng cộng chung vào 1 THANH RẶN 0→100% cho mỗi lượt (góp chung,
// không phải tim cá nhân): mỗi tim = 1 điểm lực, nhu cầu tăng theo "Cấp táo bón".
// Quá 3 giây không có tim là tiến độ TỤT 0,4%/giây — nhưng không tụt qua mốc sàn
// 25/50/75% đã đạt trong lượt. Comment: RẶN = +0,6% ngay + combo, NƯỚC = buff lực
// tim x1,5 (10s), RAU/XƠ = chặn tụt (10s), CỐ LÊN = +0,3%. Chat nào cũng hiện
// thành BONG BÓNG THOẠI cạnh Bug (đã lọc từ cấm + cắt 40 chữ, tối đa 5 cái).
// CHỌC = chọc mèo: độ quạu +12, quạu 100 là Bug DỖI 6s — ngừng rặn (tim/chat rặn
// vô hiệu) mà tiến độ VẪN TỤT; cả phòng gõ XIN LỖI dỗ (mỗi câu −1,5s dỗi).
// QUÀ CHỈ ĐƯỢC CẢM ƠN + giấy vệ sinh bay trang trí — không điểm, không lực,
// không buff. MC là host hài hước: mọi sự kiện có pool ≥5 câu, bốc ngẫu nhiên,
// không lặp lại câu vừa nói. Hàm thuần + đồng hồ/rng tiêm vào: test tất định.

import { GAME } from './config';
import { plain } from '../live/chatter';
import { maskBanned } from '../live/bannedWords';

export interface Say {
  text: string;
  main?: boolean;
  priority?: boolean;
  ttl?: number;
}

export interface Person {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
}

/** Tín hiệu tiếng mèo tổng hợp: stage nghe và phát qua module catSounds */
export type CatCue = 'meow' | 'meowBig' | 'sadMeow' | 'hiss' | 'yowl' | 'chirp';

const F = (s: string) => `F: ${s}`;

// ================= POOL LỜI MC (host hài hước, mỗi sự kiện ≥5 câu) =================
// {name} = tên người xem · {gift} = tên quà · {top} = người rặn chính · {power} = điểm lực · {level}/{carry} = số

const WELCOME_MAIN = [
  'Chào cả nhà! Tin nóng hơn cả nồi lẩu: Bug bị TÁO BÓN, đang ngồi bồn cầu gồng từ nãy đến giờ mà chưa ra được!',
  'Cả nhà ơi vào mà xem! Bug nhà ta đang có một cuộc hẹn quan trọng với cái bồn cầu, mà đối tác thì... chưa chịu ra!',
  'Mở màn bằng một drama nhà vệ sinh: Bug ăn nhiều quá, giờ ngồi trong kia phồng má gồng, mặt đỏ như quả cà chua!',
  'Chào mừng cả nhà đến với chương trình "Ngồi Cùng Bug"! Nhân vật chính đang ở trong kia, gồng hết sức bình sinh!',
  'Tin chấn động xóm: Bug bị táo bón cấp độ báo động! Sen thì đứng ngoài lo, còn Bug thì đang đàm phán căng thẳng với bồn cầu!',
];
const WELCOME_HOW = [
  'Luật chơi siêu đơn giản: mỗi lượt tim của cả phòng cộng chung thành lực rặn. Đầy thanh một trăm phần trăm là Bug thăng hoa! Chat chữ Rặn cộng lực ngay, Nước tăng lực tim, Rau giữ tiến độ. Và đừng chọc Bug nhiều quá, nó dỗi là cả phòng mệt đấy!',
  'Cách chơi nè: tim của ai cũng tính hết, gộp chung đẩy thanh rặn lên. Chat Rặn là phụ một tay, Nước là tăng lực, Rau là chống tụt. Nhớ nha: chọc mèo vui thôi, chọc quá tay nó quay mặt đi dỗi, lúc đó gõ Xin lỗi mà dỗ!',
  'Nghe kỹ luật nè cả nhà: thả tim là rặn, tim càng nhiều Bug rặn càng mạnh. Chat thêm được Rặn, Nước, Rau để hỗ trợ. Quà thì chỉ để cảm ơn thôi. Và tuyệt đối đừng chọc Bug đến mức dỗi, nó dỗi là ngồi im thin thít luôn!',
  'Tóm tắt cho người mới: cả phòng là một đội rặn thuê cho Bug. Tim = lực, Rặn = thêm lực, Nước = x1,5 lực, Rau = không tụt. Đầy một trăm phần trăm là vỡ òa! Chọc mèo thì vui nhưng liệu hồn, nó có thanh đo độ quạu hẳn hoi!',
  'Luật chơi một câu: cứ thả tim là Bug nhích thêm một tí. Hỗ trợ bằng chat Rặn, Nước, Rau. Chọc Bug thì được điểm vui, chọc tới nó dỗi thì cả phòng phải gõ Xin lỗi xin xỏ. Bắt đầu rặn thôi!',
];
const FOLLOW_LINES = [
  'Chào {name} mới ghé phòng! Vào đúng lúc lắm, Bug đang cần tuyển thêm người rặn thuê trong kia kìa!',
  'A, {name} tới rồi! Thêm một chiến sĩ rặn, Bug trong kia nghe tin mừng rơi nước mắt!',
  'Chào {name}! Phòng mình đang có chiến dịch giải cứu Bug khỏi nhà vệ sinh, bạn tới là thêm một phần lực đấy!',
  '{name} ơi, vào phòng là có việc ngay: Bug đang gồng trong kia, cần cả làng chung sức đây!',
  'Xin chào {name}! Ngồi xuống, xắn tay áo lên, chuẩn bị rặn cùng cả phòng vì một tương lai nhẹ bụng cho Bug!',
];
const THANK_LINES = [
  'Cảm ơn {name} đã tặng {gift}! Bug trong kia xúc động lắm, gửi tặng bạn một tràng giấy vệ sinh bay làm kỷ niệm!',
  '{name} tặng {gift} kìa! Quà chỉ để cảm ơn thôi nha, nhưng tình cảm này thì Bug ghi sổ vàng, cảm động muốn... ra luôn!',
  'Ồ {name} hào phóng quá, {gift} luôn! Bug nhờ MC gửi lời cảm ơn, kèm hiệu ứng giấy vệ sinh bay rợp trời!',
  'Cảm ơn {name} nhiều nhiều! {gift} làm phòng sáng hẳn lên, Bug trong kia cũng thấy ấm lòng... và ấm cả bụng!',
  '{name} ơi nhận lấy lời cảm ơn từ MC và một cơn mưa giấy vệ sinh trang trí! Quà không giúp rặn nhanh hơn, nhưng giúp Bug vui hơn thật!',
];
const CHEER_LOW = [
  'Tim đang chảy đều như nước nhỏ giọt, Bug trong kia gồng má, gật gù: được, cứ thế này là ổn!',
  'Nhịp tim đều đều thế này là Bug thích nè, nhích từng tí một, chắc tay như đóng đinh!',
  'Cả phòng giữ nhịp giỏi quá, Bug đang vào guồng, mặt mũi tập trung cao độ như thi đại học!',
  'Tim về đều, Bug gật đầu lia lịa. Chậm mà chắc, táo bón là phải kiên nhẫn cả nhà ạ!',
  'Lực rặn đang ấm dần lên rồi! Bug hít một hơi thật sâu, chuẩn bị tăng tốc đây!',
];
const CHEER_MID = [
  'Ôi tim bay nhanh hẳn lên rồi! Bồn cầu bắt đầu rung nhè nhẹ, Bug phồng má như thổi bóng bay!',
  'Lực lên trông thấy luôn! Bug gồng đến nỗi hai tai cũng rung theo nhịp tim của cả phòng!',
  'Đấy đấy, nhịp này mới gọi là rặn chứ! Bug nghiêng người, dồn lực, mồ hôi bắt đầu lăn rồi!',
  'Tim dồn dập quá, Bug trong kia như đang tập gym cường độ cao, cơ bụng sáu múi sắp lộ!',
  'Cả phòng vào form rồi! Bug gằn giọng "hự hự" theo từng đợt tim, nghe mà thương!',
];
const CHEER_HIGH = [
  'BÃO TIM! Bug rung như máy massage, mồ hôi văng tung toé, ống nước cũng phải nhún nhảy theo!',
  'Khủng khiếp! Lực rặn này thì núi cũng phải nhích! Bug đỏ mặt tía tai, quyết chiến đến cùng!',
  'Tim bay như mưa rào tháng bảy! Bug đang ở trạng thái siêu rặn, cả nhà vệ sinh rung chuyển!',
  'Đỉnh nóc kịch trần! Bug gồng đến nỗi Sen tưởng động đất, chạy ra xem có chuyện gì!',
  'Lực này mà không ra thì thôi đấy! Bug đang cháy hết mình, cả phòng đúng là đội rặn quốc dân!',
];
const IDLE_LINES = [
  'Bug vẫn ngồi trong kia đấy... MC nghe rõ tiếng thở dài của một chú mèo đang đàm phán với số phận.',
  'Phòng im lặng quá, Bug trong kia khẽ hỏi: ủa, cả nhà đi đâu hết rồi, còn ai thương con không?',
  'Tranh thủ lúc yên tĩnh MC nhắc: tim là lực rặn chung, quá ba giây không tim là thanh rặn tụt dần đấy nha.',
  'Bug đang ngồi thiền trong nhà vệ sinh... à nhầm, ngồi rặn. Ai đi ngang thả cho Bug ít tim lấy động lực đi!',
  'Im ắng thế này Bug buồn ngủ mất. Kể chuyện cười cũng được, thả tim cũng được, miễn đừng bỏ Bug một mình!',
];
const MILE25 = [
  'Hai lăm phần trăm! Bồn cầu chính thức rung chuyển, Bug gồng đến run cả hai chân sau!',
  'Qua mốc hai lăm rồi cả nhà! Bug vừa làm một tiếng "hự" rất chi là quyết tâm!',
  'Hai lăm phần trăm, sàn an toàn đã khóa! Từ giờ tiến độ không tụt xuống dưới mốc này nữa đâu. Bug vẫn đang phồng má như thổi kèn!',
  'Mốc một phần tư hoàn thành! Nghe nói trong kia Bug vừa lẩm bẩm: mới khởi động thôi, chờ đấy!',
  'Được hai lăm phần trăm rồi! Cái bồn cầu kêu cọt kẹt như muốn xin tha, mà Bug thì chưa tha đâu!',
];
const MILE50 = [
  'NỬA ĐƯỜNG! Ống nước rung bần bật, Bug phát ra tiếng "Ực..." nghe vừa thương vừa buồn cười!',
  'Năm mươi phần trăm! Bug dồn hết sức bình sinh, mặt mũi nhăn như quả táo tàu phơi nắng!',
  'Qua nửa rồi cả nhà ơi! Trong kia đang là trận chiến thế kỷ giữa một chú mèo và... chính cái bụng của nó!',
  'Mốc năm mươi: chính thức không tụt lại được nữa! Bug gồng đến nỗi vòng cổ hoa cũng muốn méo!',
  'Một nửa chặng đường! Bug vừa thở hắt ra một cái rõ to, MC tưởng sấm đánh giữa trời quang!',
];
const MILE75 = [
  'Bảy lăm phần trăm! Sen đứng ngoài gõ cửa rầm rầm: "Xong chưa đấy?!" — Sắp rồi Sen ơi, cố lên cả nhà!',
  'Ba phần tư rồi! Sen sốt ruột đi qua đi lại ngoài cửa, còn Bug trong kia thì đang ở phút bù giờ nghẹt thở!',
  'Mốc bảy lăm! Nghe tiếng Sen hỏi vọng vào: "Có cần gọi cấp cứu không?" — Không cần, chỉ cần thêm tim thôi!',
  'Sắp về đích! Sen gõ cửa hỏi thăm, Bug trong kia thều thào: một... chút... nữa... thôi...!',
  'Bảy lăm phần trăm, hồi hộp hơn phim hành động! Sen ngoài cửa, cả phòng ngoài này, ai cũng nín thở chờ Bug!',
];
const WATER_LINES = [
  '{name} cho Bug uống nước kìa! Nước vào là trơn tru, lực tim tăng gấp rưỡi trong mười giây, tranh thủ rặn mạnh lên!',
  'Tuyệt chiêu nước lọc của {name}! Bug tu một hơi, bụng kêu ọc ọc sung sướng, lực tim nhân một phẩy năm đây!',
  '{name} mở buff Nước! Nghe đồn uống nước vào là mọi chuyện đều... trôi chảy hơn. Mười giây vàng, cả nhà dồn lực!',
  'Nước tới rồi! Cảm ơn {name}. Bug uống xong lấy hơi sẵn sàng, mười giây tới tim nào cũng đáng giá gấp rưỡi!',
  '{name} dùng chiêu "uống nước đi con" kinh điển! Hiệu lực mười giây, lực tim x1,5, đừng lãng phí cả nhà ơi!',
];
const FIBER_LINES = [
  '{name} đút rau cho Bug! Chất xơ vào cuộc, tiến độ được khóa chặt mười giây không tụt, yên tâm rặn tiếp!',
  'Rau xanh thần thánh từ {name}! Bug nhai rau ráu, bụng gật gù đồng ý, mười giây tới tiến độ bất khả xâm phạm!',
  '{name} triệu hồi chất xơ! Mười giây vàng: thanh rặn đứng yên như tượng dù tim có ngắt quãng. Rặn tiếp nào!',
  'Ăn rau vào là khác ngay! {name} vừa cho Bug nạp chất xơ, mười giây không lo tụt tiến độ đâu cả nhà!',
  'Buff Rau của {name} đã bật! Bug vừa nhai rau vừa rặn, combo hai trong một, tiến độ an toàn mười giây!',
];
const SUCCESS_LINES = [
  'RA RỒI CẢ NHÀ ƠI! Một cục vàng óng ánh xuất hiện, Bug nhẹ nhõm như thoát nợ! Người rặn chính: {top} với {power} điểm lực! Cấp táo bón lên cấp {level}, lượt sau khó hơn nha!',
  'THÀNH CÔNG RỒI! Bug bước ra như nhà vô địch, bụng nhẹ tênh, mặt rạng rỡ! Vinh danh {top}, góp {power} điểm lực, đúng là tay rặn số một! Cấp {level} đang chờ ở lượt sau!',
  'VỠ ÒA! Sau bao phen gồng má, Bug đã chiến thắng cái bụng của chính mình! {top} là người hùng của lượt với {power} điểm lực. Lên cấp {level} thôi, khó hơn nhưng vui hơn!',
  'Xong rồi xong rồi! Bug nhảy cẫng lên sung sướng, Sen suýt khóc vì mừng! Cảm ơn {top} — {power} điểm lực, rặn chính hiệu! Cấp táo bón {level} tiếp theo sẽ căng hơn đấy!',
  'KẾT QUẢ ĐẸP NHƯ MƠ: RA! Bug nhẹ cả người, cả phòng nhẹ cả tim! {top} giữ ngôi người rặn chính với {power} điểm lực. Chuẩn bị lượt cấp {level} nào cả nhà!',
];
const TIMEOUT_LINES = [
  'Hết giờ rồi... Bug ngồi đến tê cả hai chân, bước ra lảo đảo như say nắng. Giữ lại được {carry} phần trăm cho lượt sau, không uổng công đâu!',
  'Chuông hết lượt vang lên mà vẫn chưa ra... Bug ôm bụng thở dài: hẹn kỳ sau quyết chiến! {carry} phần trăm tiến độ được bảo lưu cho lượt tới.',
  'Thua keo này ta bày keo khác! Bug ngồi mỏi quá phải ra nghỉ, nhưng {carry} phần trăm công sức không mất đi đâu cả, lượt sau tiếp nối luôn!',
  'Hết bốn phút! Cái bụng này cứng đầu thật. Bug rút lui chiến thuật, mang theo {carry} phần trăm tiến độ làm vốn cho lượt sau!',
  'Chưa ra được cả nhà ạ... Bug đi ra với dáng vẻ của một chiến binh bại trận nhưng không bỏ cuộc. {carry} phần trăm đã giữ lại, lượt sau phục thù!',
];
const NEW_ATTEMPT_LINES = [
  'Lượt rặn mới, cấp táo bón {level}! Bụng Bug lại đầy ắp sau bữa ăn Sen nấu, vòng hai bắt đầu!',
  'Tiếp tục nào, cấp {level} rồi đấy! Bug hít sâu, ngồi vào vị trí, biểu cảm nghiêm túc như vận động viên Olympic!',
  'Lượt mới cấp {level}: độ khó tăng, độ quyết tâm cũng tăng! Bug đã sẵn sàng, cả phòng sẵn sàng chưa?',
  'Cấp táo bón {level} chính thức khởi động! Nghe nói càng lên cấp Bug càng lì, nhưng cả phòng mình còn lì hơn!',
  'Vòng rặn tiếp theo, cấp {level}! Bug vừa ăn thêm bát cơm Sen nấu nên... thôi, cả nhà hiểu rồi đấy. Rặn thôi!',
];
const TEASE_MC_LINES = [
  'Ơ kìa, {name} vừa chọc Bug! Bug đang bận việc trọng đại mà cứ chọc, coi chừng nó quạu thật đấy!',
  '{name} chọc mèo nữa rồi! Thanh độ quạu đang leo thang, Bug mà dỗi là cả phòng phải dỗ mệt nghỉ!',
  'Ai lại chọc một chú mèo đang... bận thế kia! {name} nhé, Bug nhớ mặt rồi đấy, nó ghi sổ rồi!',
  '{name} vừa chọc Bug xong! Bug liếc một cái sắc như dao, độ quạu tăng vùn vụt!',
  'Chọc nữa đi {name}, chọc đến nó dỗi quay mặt đi thì đừng hỏi sao thanh rặn tụt không phanh!',
];
const SULK_START_LINES = [
  'THÔI RỒI! Bug QUẠU THẬT, quay mặt đi dỗi rồi! Nó ngừng rặn luôn, mà tiến độ thì vẫn tụt mới đau! Cả phòng gõ Xin lỗi dỗ nó đi!',
  'Bug dỗi rồi cả nhà ơi! Chọc cho lắm vào! Giờ nó ngồi quay lưng, không rặn nữa đâu. Nhanh nhanh gõ Xin lỗi xin xỏ đi, mỗi câu là nó nguôi một tí!',
  'Chính thức: Bug tuyên bố đình công vì bị chọc quá nhiều! Tiến độ vẫn tụt đều đều kìa, gõ Xin lỗi dỗ nó quay lại mau!',
  'Mặt Bug giờ còn khó ở hơn cả thứ Hai đầu tuần! Nó dỗi, nó ngừng rặn, nó mặc kệ tiến độ tụt. Chỉ có Xin lỗi mới cứu được tình hình này!',
  'Đấy, chọc quá tay chưa! Bug dỗi kín, quay mặt vào tường. Cả phòng chịu trách nhiệm dỗ nó bằng câu Xin lỗi ngay và luôn!',
];
const SULK_END_LINES = [
  'Bug nguôi rồi! Nó quay lại, hất mặt "Hứ!" một cái rõ kêu, rồi lao vào rặn tiếp với adrenaline cộng hai phần trăm! Đấy, dỗ đúng cách là thế!',
  'Hết dỗi! Bug làm vẻ mặt kiêu kỳ, lẩm bẩm tha cho lần này, rồi rặn tiếp sung hơn trước. Adrenaline cộng hai phần trăm vì... tức mà có động lực!',
  'Cả phòng dỗ thành công! Bug quay lại rồi, tuy còn hậm hực nhưng đã chịu rặn tiếp, còn được cộng hai phần trăm sức hờn dỗi hóa thành lực!',
  'Bug hết dỗi rồi nha! Nó nói câu này MC dịch hộ: "Lần sau đừng chọc nữa đấy!" Rồi nó rặn tiếp, cộng hai phần trăm cho máu!',
  'Nguôi ngoai! Bug quay mặt lại, đuôi còn vẫy vẫy giận dỗi nhưng chân đã vào vị trí rặn. Hai phần trăm adrenaline đã cộng, tiếp tục nào!',
];
const APOLOGY_LINES = [
  'Một câu Xin lỗi đã tới! Bug hơi nguôi rồi, tai nó vừa động đậy kìa!',
  'Xin lỗi nữa đi cả nhà, mặt Bug đang giãn ra dần rồi, hiệu nghiệm lắm!',
  'Bug nghe thấy lời xin lỗi rồi, nó giả vờ không quan tâm nhưng đuôi hết vẫy giận rồi kìa!',
];
const GRUMBLE_BUG = [
  'Grừ… đừng chọc nữa! 😾',
  'Tui đang bận rặn đây! 💢',
  'Ai chọc nữa là tui dỗi á! 😤',
  'Má phồng hết rồi nè, để yên coi! 😾',
  'Đi vệ sinh cũng không yên với mấy người! 💢',
  'Chọc hoài, tui nhớ mặt hết rồi đó! 😾',
];
// Bug gật gù ngủ gật (bong bóng thoại của chính Bug, không phải lời MC)
const SLEEPY_BUG = [
  'Zzz… buồn ngủ quá… 😴',
  'Hửm… mơ thấy cá nướng… 💤',
  'Ngủ tí thôi… ai rặn giùm đi… 😪',
  'Mắt díu lại rồi nè… Zzz 💤',
  'Gật gù… gật gù… sắp gục… 😴',
];
// Tim/chat đầu tiên đánh thức Bug khỏi cơn gật gù
const WAKE_BUG = [
  'Hả?! Đang rặn đây, đang rặn đây! 😳',
  'Giật cả mình! Ai gọi tui đó?! 😱',
  'Ơ ơ… chưa ngủ, tui chưa ngủ nha! 😳',
  'Dậy rồi dậy rồi! Rặn tiếp nè! 💪',
  'Hả? Có tim hả? Vào vị trí, rặn tiếp! 😤',
];
// NGOẠI LỆ USER DUYỆT RIÊNG CHO GAME NÀY (2026-11-14): câu xin follow dưới đây được phép
// dùng trong Bug Đi WC (ghi chú xoay vòng ở chân sân khấu + MC đọc thưa trong giờ nghỉ giữa lượt).
// Các game khác vẫn giữ luật không-CTA trên bề mặt phát sóng. GIỮ NGUYÊN VĂN, không viết lại.
export const FOLLOW_NOTE = 'hãy cho tôi 1 follow để ủng hộ ra clip và game về mèo nha';
// Câu PREMISE của game (user chốt 2026-11-14, GIỮ NGUYÊN VĂN): MC đọc đầu tiên khi mở buổi,
// đồng thời là banner "thông báo khẩn" trên đầu sân khấu — người mới vào hiểu ngay câu chuyện.
export const PREMISE_LINE = "Thông báo khẩn: Bug đang tắc 'đầu ra'! Cần đội cứu hộ bằng tim ngay!";
// MC nói 1 câu trong giờ nghỉ giữa lượt (mỗi giờ nghỉ tối đa 1 câu) — câu follow nằm thưa trong pool (1/6)
const INTERMISSION_LINES = [
  'Nghỉ xả hơi mười giây! Bug đang rửa chân tay, vuốt lại bộ lông cho đẹp, chuẩn bị vào lượt rặn mới hoành tráng hơn!',
  'Giải lao giữa hiệp! Sen tranh thủ dọn dẹp, còn MC thì tranh thủ uống ngụm nước, tí nữa gào cổ vũ tiếp!',
  'Mười giây nạp năng lượng! Cả phòng thả lỏng ngón tay đi, tí nữa rặn tiếp là phải sung gấp đôi mới được!',
  'Bug đang xoa bụng làm nóng người trong kia. Lượt sau khó hơn một cấp, cả phòng giữ vững phong độ nha!',
  'Khoảng lặng trước cơn bão rặn! Ai chưa kịp uống nước thì uống đi, tí nữa là gồng hết công suất đấy!',
  FOLLOW_NOTE,
];
// Bug đang hăng (nhịp tim cao): tự cổ vũ chính mình
const PUMPED_BUG = [
  'Hự hự! Sắp ra rồi, tui cảm thấy rồi! 💪',
  'Rặn tới bến luôn nè! 🔥',
  'Đừng dừng tim, tui đang đà này! 😤',
  'Cả phòng mạnh quá, tui gồng theo muốn ná thở! 💪',
  'Một chút nữa thôi… một chút nữa…! 🔥',
];

// ================= ENGINE =================

/** Tâm trạng của Bug — suy từ tín hiệu sẵn có (nhịp tim, độ quạu, dỗi, im lặng, phase) */
export type BugMood = 'focused' | 'pumped' | 'annoyed' | 'furious' | 'sulking' | 'sleepy' | 'bliss';
/**
 * Tư thế sprite của Bug trên sân khấu (stage map sang file ảnh, crossfade 120ms).
 * Ngoài các pose theo mood còn 2 FACE BEAT theo sự kiện (faceHappy/faceSurprised):
 * beat đang chạy thắng pose mood — trừ lúc dỗi (sulk) và ăn mừng (relief*) luôn thắng beat.
 */
export type BugPose =
  | 'strain'
  | 'maxstrain'
  | 'sulk'
  | 'reliefJump'
  | 'reliefSit'
  | 'faceHappy'
  | 'faceSurprised'
  | 'faceAnnoyed'
  | 'faceSleepy';

export interface BoardRow {
  username: string;
  nickname: string;
  power: number; // tổng lực đã góp cả buổi
  king: boolean; // đang giữ danh hiệu VUA RẶN
}

export interface WcView {
  phase: 'attempt' | 'success' | 'intermission';
  level: number;
  attempt: number;
  progressPct: number;
  likeRate: number;
  decaying: boolean;
  remainSec: number;
  waterSec: number;
  fiberSec: number;
  combo: number;
  milestonesHit: number[];
  wobble: boolean;
  pipes: boolean;
  senPeek: boolean;
  popups: { id: number; nickname: string }[];
  chatBubbles: { id: number; nickname: string; text: string }[];
  annoyance: number; // 0..100
  sulking: boolean;
  sulkSec: number;
  mood: BugMood; // tâm trạng hiện tại của Bug (lớp "thái độ")
  pose: BugPose; // tư thế sprite stage cần hiện
  strainActive: boolean; // đang gồng thật (stage mới rung; ngủ gật/dỗi thì đứng yên)
  bugBubble: string | null; // bong bóng thoại của chính Bug (càu nhàu / "Hứ! 😤")
  giftFx: boolean;
  topNow: { nickname: string; power: number } | null;
  successTop: string | null;
  board: BoardRow[];
  totals: { attempts: number; successes: number };
  musicOn: boolean;
  musicVolume: number;
  catOn: boolean;
  catVolume: number;
}

interface Contributor {
  nickname: string;
  spoken: string;
  attemptPower: number;
  sessionPower: number;
}

const SIM_PEOPLE: Person[] = ['Mèo Mun', 'Bé Bơ', 'Tí Nị', 'Miu Miu', 'Bánh Bao', 'Cá Viên', 'Sữa Chua', 'Mochi'].map(
  (nickname, i) => ({ username: `sim${i + 1}`, nickname, spoken: nickname, avatar: '' }),
);

export class WcRoom {
  musicOn = true;
  musicVolume = GAME.musicVolume;
  catOn = true;
  catVolume = 0.9;

  private phase: 'attempt' | 'success' | 'intermission' = 'attempt';
  private level = 1;
  private attempt = 1;
  private progress = 0;
  private attemptStartedAt: number;
  private phaseEndsAt = 0;
  private phaseStartedAt: number; // mốc vào phase hiện tại (nhịp reliefSit -> reliefJump khi thắng)
  private lastTickAt: number;
  private lastLikeAt = -Infinity;
  private lastActivityAt: number; // tim HOẶC chat gần nhất (đồng hồ "phòng còn người" cho ngủ gật)
  private sleepyFlag = false; // đã vào trạng thái gật gù (tick theo dõi chuyển trạng thái)
  private intermSayAt = 0; // mốc MC nói câu giờ nghỉ giữa lượt (0 = đã nói/không hẹn)
  private lastPumpedBubbleAt = -Infinity;
  private lastSleepyBubbleAt = -Infinity;
  private likeEvents: { at: number; count: number }[] = [];
  private waterUntil = 0;
  private fiberUntil = 0;
  private milestonesHit = new Set<number>();
  private ranUsers = new Map<string, number>();
  private contributors = new Map<string, Contributor>();
  private kingUsername: string | null = null;
  private successTopName: string | null = null;
  private totals = { attempts: 0, successes: 0 };
  private giftFxUntil = 0;
  private popups: { id: number; nickname: string; until: number }[] = [];
  private popupId = 0;
  private lastPopupAt = -Infinity;
  private chatBubbles: { id: number; nickname: string; text: string; until: number }[] = [];
  private bubbleId = 0;
  private annoyance = 0;
  private sulkUntil = 0;
  private faceBeat: { pose: 'faceHappy' | 'faceSurprised'; until: number } | null = null; // khuôn mặt phản ứng theo sự kiện
  private hissArmed = true;
  private bugBubble: { text: string; until: number } | null = null;
  private lastTeaseSayAt = -Infinity;
  private lastCheerAt = -Infinity;
  private lastIdleAt: number;
  private cheatFxUntil = { wobble: 0, pipes: 0, sen: 0 };
  private pendingSays: Say[] = [];
  private cues: CatCue[] = [];
  private lastLineIdx = new Map<readonly string[], number>();

  constructor(
    now: number,
    private rng: () => number = Math.random,
  ) {
    this.attemptStartedAt = now;
    this.phaseStartedAt = now;
    this.lastTickAt = now;
    this.lastIdleAt = now;
    this.lastActivityAt = now;
  }

  // ---------- Tiện ích ----------
  private need(): number {
    return Math.round(GAME.baseNeed * Math.pow(GAME.needScalePerLevel, this.level - 1));
  }
  private pct(): number {
    return (this.progress / this.need()) * 100;
  }
  private say(s: Say) {
    this.pendingSays.push(s);
  }
  private drainSays(): Say[] {
    const out = this.pendingSays;
    this.pendingSays = [];
    return out;
  }
  /** Stage gọi sau mỗi tick/sự kiện để lấy tín hiệu tiếng mèo */
  drainCues(): CatCue[] {
    const out = this.cues;
    this.cues = [];
    return out;
  }
  /** Bốc 1 câu trong pool, không lặp lại câu vừa bốc (khi pool có >1 câu) */
  private pick(pool: readonly string[], vars: Record<string, string | number> = {}): string {
    let i = Math.floor(this.rng() * pool.length);
    if (pool.length > 1 && i === this.lastLineIdx.get(pool)) i = (i + 1) % pool.length;
    this.lastLineIdx.set(pool, i);
    let s = pool[i];
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return F(s);
  }
  /** Bốc 1 câu thoại CỦA BUG (bong bóng trên sân khấu), không lặp câu đang hiện */
  private pickBug(pool: readonly string[]): string {
    let line = pool[Math.floor(this.rng() * pool.length)];
    if (pool.length > 1 && line === this.bugBubble?.text) {
      line = pool[(pool.indexOf(line) + 1) % pool.length];
    }
    return line;
  }
  /** Đang gật gù? Lượt đang chạy, không dỗi, phòng im (không tim + không chat) đủ lâu và nhịp tim ~0 */
  private sleepyAt(now: number): boolean {
    return (
      this.phase === 'attempt' &&
      !this.sulking(now) &&
      now - this.lastActivityAt >= GAME.sleepyAfterMs &&
      this.likeRateAt(now) < 0.5
    );
  }
  /** Tâm trạng suy từ tín hiệu sẵn có. Thứ tự ưu tiên: bliss > sulking > sleepy > furious > annoyed > pumped > focused */
  private moodAt(now: number): BugMood {
    if (this.phase !== 'attempt') return 'bliss';
    if (this.sulking(now)) return 'sulking';
    if (this.sleepyAt(now)) return 'sleepy';
    if (this.annoyance >= 80) return 'furious';
    if (this.annoyance >= 30) return 'annoyed';
    if (this.likeRateAt(now) >= GAME.pumpedRate) return 'pumped';
    return 'focused';
  }
  /** Bật 1 face beat (khuôn mặt phản ứng theo sự kiện); beat tự hết hạn theo ms */
  private setFaceBeat(pose: 'faceHappy' | 'faceSurprised', ms: number, now: number) {
    this.faceBeat = { pose, until: now + ms };
  }
  /**
   * Tư thế sprite suy từ mood/phase. Thứ tự phân giải (cao -> thấp):
   * ăn mừng (reliefSit/reliefJump) > dỗi (sulk) > FACE BEAT đang chạy > mặt buồn ngủ
   * (sleepy) > mặt quạu (annoyed/furious) > gồng tối đa > rặn thường.
   * Mặt rặn gốc `strain` vẫn là nền của mọi lúc rặn bình thường.
   */
  private poseAt(now: number): BugPose {
    if (this.phase === 'success') {
      return now - this.phaseStartedAt < GAME.reliefSitMs ? 'reliefSit' : 'reliefJump';
    }
    if (this.phase === 'intermission') return 'reliefSit';
    if (this.sulking(now)) return 'sulk';
    if (this.faceBeat && now < this.faceBeat.until) return this.faceBeat.pose;
    if (this.sleepyAt(now)) return 'faceSleepy';
    if (this.annoyance >= 30) return 'faceAnnoyed';
    if (this.likeRateAt(now) >= GAME.pumpedRate || this.pct() >= GAME.maxProgressPct || this.comboAt(now) >= GAME.maxCombo) {
      return 'maxstrain';
    }
    return 'strain';
  }
  /** Tim/chat đầu tiên khi Bug đang gật gù: giật mình tỉnh dậy (mặt ngạc nhiên + bong bóng + tiếng meow lớn) */
  private wakeIfSleepy(now: number): boolean {
    if (!this.sleepyAt(now)) return false;
    this.sleepyFlag = false;
    this.setFaceBeat('faceSurprised', GAME.faceBeatSurprisedMs, now); // mặt NGẠC NHIÊN trong khoảnh khắc tỉnh dậy, rồi về mặt rặn
    this.bugBubble = { text: this.pickBug(WAKE_BUG), until: now + 3000 };
    this.cues.push('meowBig');
    return true;
  }
  private contrib(p: Person): Contributor {
    let c = this.contributors.get(p.username);
    if (!c) {
      c = { nickname: p.nickname, spoken: p.spoken, attemptPower: 0, sessionPower: 0 };
      this.contributors.set(p.username, c);
    }
    c.nickname = p.nickname;
    c.spoken = p.spoken;
    return c;
  }
  private topAttempt(): { username: string; c: Contributor } | null {
    let best: { username: string; c: Contributor } | null = null;
    for (const [username, c] of this.contributors) {
      if (c.attemptPower > 0 && (!best || c.attemptPower > best.c.attemptPower)) best = { username, c };
    }
    return best;
  }
  private likeRateAt(now: number): number {
    const from = now - GAME.likeRateWindowMs;
    let sum = 0;
    for (const e of this.likeEvents) if (e.at > from && e.at <= now) sum += e.count;
    return sum / (GAME.likeRateWindowMs / 1000);
  }
  private comboAt(now: number): number {
    let n = 0;
    for (const at of this.ranUsers.values()) if (now - at <= GAME.comboWindowMs) n++;
    return n;
  }
  private sulking(now: number): boolean {
    return now < this.sulkUntil;
  }
  private addBubble(p: Person, raw: string, now: number) {
    const text = maskBanned(raw).replace(/\s+/g, ' ').trim().slice(0, GAME.bubbleMaxChars);
    if (!text) return;
    this.chatBubbles.push({ id: ++this.bubbleId, nickname: p.nickname, text, until: now + GAME.bubbleMs });
    while (this.chatBubbles.length > GAME.bubbleCap) this.chatBubbles.shift();
  }

  // ---------- Buổi / chào / cảm ơn ----------
  newSession(now: number): Say[] {
    const fresh = new WcRoom(now, this.rng);
    fresh.musicOn = this.musicOn;
    fresh.musicVolume = this.musicVolume;
    fresh.catOn = this.catOn;
    fresh.catVolume = this.catVolume;
    Object.assign(this, fresh);
    return [
      { text: F(PREMISE_LINE), main: true },
      { text: this.pick(WELCOME_MAIN), main: true },
      { text: this.pick(WELCOME_HOW) },
    ];
  }

  join(_p: Person, _now: number): Say[] {
    return [];
  }

  follow(p: Person, _now: number): Say[] {
    return [{ text: this.pick(FOLLOW_LINES, { name: p.spoken }) }];
  }

  thank(p: Person, giftName: string): Say[] {
    // Quà CHỈ được cảm ơn: không lực, không tiến độ, không buff.
    return [{ text: this.pick(THANK_LINES, { name: p.spoken, gift: giftName }), priority: true }];
  }

  /** Giấy vệ sinh + tim bay khi có quà (hình ảnh thuần tuý, không tác dụng gameplay) */
  giftFx(_username: string, now: number) {
    this.giftFxUntil = now + GAME.giftFxMs;
    // Face beat MẶT VUI kèm lời cảm ơn (chỉ là biểu cảm, quà vẫn không tác dụng gameplay).
    // Đang dỗi/ngoài lượt thì không bật — beat cũng không bao giờ đè pose dỗi.
    if (this.phase === 'attempt' && !this.sulking(now)) {
      this.setFaceBeat('faceHappy', GAME.faceBeatHappyMs, now);
    }
  }

  chatterWindow(_now: number): boolean {
    return true;
  }

  // ---------- Tim: lực rặn CHUNG của cả phòng ----------
  like(p: Person, count: number, now: number): Say[] {
    if (count <= 0 || this.phase !== 'attempt') return [];
    this.wakeIfSleepy(now); // tim đầu tiên sau cơn gật gù: Bug giật mình tỉnh dậy
    this.lastActivityAt = now;
    this.likeEvents.push({ at: now, count }); // nhịp tim vẫn hiển thị kể cả khi Bug dỗi
    if (this.sulking(now)) return []; // đang dỗi: tim không thành lực, mốc tụt vẫn chạy vì lastLikeAt đứng yên
    const mult = now < this.waterUntil ? GAME.waterMult : 1;
    const gain = count * mult;
    this.progress += gain;
    this.lastLikeAt = now;
    const c = this.contrib(p);
    c.attemptPower += gain;
    c.sessionPower += gain;
    if (now - this.lastPopupAt >= GAME.popupSampleMs) {
      this.lastPopupAt = now;
      this.popups.push({ id: ++this.popupId, nickname: p.nickname, until: now + 1600 });
      if (this.popups.length > 6) this.popups.shift();
    }
    this.checkMilestones(now);
    if (this.pct() >= 100) this.succeed(now);
    return this.drainSays();
  }

  // ---------- Chat: RẶN / NƯỚC / RAU / XƠ / CỐ LÊN / CHỌC / XIN LỖI ----------
  chat(p: Person, comment: string, now: number): Say[] {
    // Mọi chat đều lên sân khấu thành bong bóng thoại (đã lọc + cắt), kể cả chat thường
    this.addBubble(p, comment, now);
    if (this.phase !== 'attempt') return this.drainSays();
    this.wakeIfSleepy(now); // chat đầu tiên sau cơn gật gù cũng đánh thức Bug
    this.lastActivityAt = now;
    const t = plain(comment);
    const c = this.contrib(p);

    // XIN LỖI: dỗ Bug khi đang dỗi
    if (t.includes(' xin loi ')) {
      if (this.sulking(now)) {
        this.sulkUntil = Math.max(now, this.sulkUntil - GAME.sorryCutMs);
        if (this.rng() < 0.3) this.say({ text: this.pick(APOLOGY_LINES) });
        if (!this.sulking(now)) this.endSulk(now);
      }
      return this.drainSays();
    }

    // CHỌC: chọc mèo (câu nào chứa "chọc" cũng tính)
    if (t.includes(' choc ')) {
      this.tease(p, now);
      return this.drainSays();
    }

    // Đang dỗi: Bug không rặn, lệnh rặn vô hiệu (buff phòng thủ vẫn bấm được)
    const sulk = this.sulking(now);
    if (!sulk) {
      if (t.includes(' ran ')) {
        const gain = (GAME.ranBurstPct / 100) * this.need();
        this.progress += gain;
        c.attemptPower += gain;
        c.sessionPower += gain;
        this.ranUsers.set(p.username, now);
        // Combo RẶN chạm mốc 5 / 10 người khác nhau: Bug cười toe toét (face beat mặt vui)
        if (GAME.faceHappyCombo.includes(this.comboAt(now))) {
          this.setFaceBeat('faceHappy', GAME.faceBeatHappyMs, now);
        }
        this.popups.push({ id: ++this.popupId, nickname: p.nickname, until: now + 1600 });
        if (this.popups.length > 6) this.popups.shift();
      }
      if (t.includes(' co len ')) {
        const gain = (GAME.coLenPct / 100) * this.need();
        this.progress += gain;
        c.attemptPower += gain;
        c.sessionPower += gain;
      }
    }
    if (t.includes(' nuoc ')) {
      const fresh = now >= this.waterUntil;
      this.waterUntil = now + GAME.waterMs;
      if (fresh) {
        this.cues.push('meow');
        this.say({ text: this.pick(WATER_LINES, { name: p.spoken }) });
      }
    }
    if (t.includes(' rau ') || t.includes(' xo ')) {
      const fresh = now >= this.fiberUntil;
      this.fiberUntil = now + GAME.fiberMs;
      if (fresh) {
        this.cues.push('meow');
        this.say({ text: this.pick(FIBER_LINES, { name: p.spoken }) });
      }
    }
    this.checkMilestones(now);
    if (this.pct() >= 100) this.succeed(now);
    return this.drainSays();
  }

  // ---------- Chọc mèo / dỗi ----------
  private tease(p: Person, now: number) {
    if (this.sulking(now)) return; // đang dỗi rồi, chọc thêm cũng vậy thôi
    this.annoyance = Math.min(100, this.annoyance + GAME.teaseAdd);
    if (now - this.lastTeaseSayAt >= GAME.teaseSayCooldownMs) {
      this.lastTeaseSayAt = now;
      this.say({ text: this.pick(TEASE_MC_LINES, { name: p.spoken }) });
    }
    if (this.annoyance >= 60) {
      let line = GRUMBLE_BUG[Math.floor(this.rng() * GRUMBLE_BUG.length)];
      if (line === this.bugBubble?.text && GRUMBLE_BUG.length > 1) {
        line = GRUMBLE_BUG[(GRUMBLE_BUG.indexOf(line) + 1) % GRUMBLE_BUG.length];
      }
      this.bugBubble = { text: line, until: now + 3500 };
    }
    if (this.annoyance >= 80 && this.hissArmed) {
      this.hissArmed = false;
      this.cues.push('hiss');
    }
    if (this.annoyance >= 100) {
      this.sulkUntil = now + GAME.sulkMs;
      this.cues.push('yowl');
      this.say({ text: this.pick(SULK_START_LINES), main: true });
    }
  }

  private endSulk(now: number) {
    this.sulkUntil = 0;
    this.annoyance = GAME.sulkEndAnnoyance;
    this.hissArmed = true;
    this.progress += (GAME.sulkEndBonusPct / 100) * this.need();
    this.bugBubble = { text: 'Hứ! 😤', until: now + 3000 };
    this.cues.push('meow');
    this.say({ text: this.pick(SULK_END_LINES), main: true });
    this.checkMilestones(now);
    if (this.pct() >= 100) this.succeed(now);
  }

  /** Trang điều khiển: chọc giả lập x3 / ép dỗi / xin lỗi giả lập x3 */
  simTease(now: number): Say[] {
    for (const p of SIM_PEOPLE.slice(0, 3)) this.chat(p, 'CHỌC', now);
    return this.drainSays();
  }
  forceSulk(now: number): Say[] {
    if (this.phase === 'attempt' && !this.sulking(now)) {
      this.annoyance = 100;
      this.sulkUntil = now + GAME.sulkMs;
      this.cues.push('yowl');
      this.say({ text: this.pick(SULK_START_LINES), main: true });
    }
    return this.drainSays();
  }
  simSorry(now: number): Say[] {
    for (const p of SIM_PEOPLE.slice(0, 3)) this.chat(p, 'XIN LỖI', now);
    return this.drainSays();
  }

  // ---------- Mốc + thắng/thua ----------
  private checkMilestones(now: number) {
    const pct = this.pct();
    for (const m of GAME.milestones) {
      if (pct >= m && !this.milestonesHit.has(m)) {
        this.milestonesHit.add(m);
        this.cues.push('meowBig');
        // Face beat MẶT NGẠC NHIÊN mỗi lần chạm mốc (ở mốc 75 cũng là lúc Sen ló vào gõ cửa)
        this.setFaceBeat('faceSurprised', GAME.faceBeatSurprisedMs, now);
        if (m === 25) {
          this.cheatFxUntil.wobble = now + 3000;
          this.say({ text: this.pick(MILE25), main: true });
        } else if (m === 50) {
          this.cheatFxUntil.pipes = now + 3000;
          this.say({ text: this.pick(MILE50), main: true });
        } else if (m === 75) {
          this.cheatFxUntil.sen = now + 6000;
          this.say({ text: this.pick(MILE75), main: true });
        }
      }
    }
  }

  private succeed(now: number) {
    if (this.phase !== 'attempt') return;
    this.progress = this.need();
    this.phase = 'success';
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + GAME.successBeatMs;
    this.totals.successes++;
    const top = this.topAttempt();
    this.successTopName = top ? top.c.nickname : null;
    if (top) this.kingUsername = top.username;
    this.cues.push('chirp');
    this.say({
      text: this.pick(SUCCESS_LINES, {
        top: top ? top.c.spoken : 'cả phòng',
        power: top ? Math.round(top.c.attemptPower) : 0,
        level: this.level + 1,
      }),
      main: true,
    });
  }

  private timeoutAttempt(now: number) {
    const carryPct = this.pct() * GAME.timeoutCarryRatio;
    this.totals.attempts++;
    this.cues.push('sadMeow');
    this.say({ text: this.pick(TIMEOUT_LINES, { carry: Math.round(carryPct) }), main: true });
    this.startAttempt(now, carryPct);
  }

  private startAttempt(now: number, carryPct = 0) {
    this.phase = 'attempt';
    this.phaseStartedAt = now;
    this.attempt++;
    this.attemptStartedAt = now;
    this.lastActivityAt = now; // lượt mới: đồng hồ ngủ gật tính lại từ đầu
    this.sleepyFlag = false;
    this.progress = (carryPct / 100) * this.need();
    this.milestonesHit = new Set(GAME.milestones.filter((m) => m <= carryPct));
    this.ranUsers.clear();
    this.likeEvents = [];
    this.faceBeat = null; // lượt mới: hết hạn mọi face beat của lượt cũ
    this.lastLikeAt = -Infinity;
    this.waterUntil = 0;
    this.fiberUntil = 0;
    this.sulkUntil = 0;
    for (const c of this.contributors.values()) c.attemptPower = 0;
  }

  /** Trang điều khiển bấm "ép thành công" (test) */
  forceSuccess(now: number): Say[] {
    if (this.phase === 'attempt') {
      this.progress = this.need();
      this.succeed(now);
    }
    return this.drainSays();
  }

  /** Trang điều khiển bấm "ép hết giờ" (test) */
  forceTimeout(now: number): Say[] {
    if (this.phase === 'attempt') this.timeoutAttempt(now);
    return this.drainSays();
  }

  /** Trang điều khiển: bật buff ngay (test) */
  forceBuff(kind: 'water' | 'fiber', now: number): Say[] {
    if (kind === 'water') this.waterUntil = now + GAME.waterMs;
    else this.fiberUntil = now + GAME.fiberMs;
    return [];
  }

  /** Trang điều khiển: ép Bug ngủ gật ngay (test) — lùi đồng hồ hoạt động quá ngưỡng 20s */
  forceSleepy(now: number): Say[] {
    if (this.phase === 'attempt' && !this.sulking(now)) {
      this.likeEvents = [];
      this.lastActivityAt = now - GAME.sleepyAfterMs;
    }
    return [];
  }

  /** Trang điều khiển: ép khoảnh khắc gồng tối đa (test) — đẩy tiến độ qua ngưỡng về đích 90% */
  forceMaxstrain(now: number): Say[] {
    if (this.phase === 'attempt') {
      const target = ((GAME.maxProgressPct + 2) / 100) * this.need();
      if (this.progress < target) this.progress = target;
      this.lastActivityAt = now;
      this.checkMilestones(now);
    }
    return this.drainSays();
  }

  /** Trang điều khiển: đánh thức Bug (test) — chạy đúng đường tỉnh dậy như tim/chat thật */
  wakeBug(now: number): Say[] {
    if (this.wakeIfSleepy(now)) this.lastActivityAt = now;
    return this.drainSays();
  }

  /** Trang điều khiển: ép 1 face beat (test) — poseAt vẫn giữ luật: beat không đè dỗi/ăn mừng */
  forceFace(kind: 'happy' | 'surprised', now: number): Say[] {
    if (kind === 'happy') this.setFaceBeat('faceHappy', GAME.faceBeatHappyMs, now);
    else this.setFaceBeat('faceSurprised', GAME.faceBeatSurprisedMs, now);
    return [];
  }

  /** Tim giả lập: rải tổng số tim cho các bạn giả lập (test từ trang điều khiển) */
  simLikeBurst(total: number, now: number): Say[] {
    const per = Math.floor(total / SIM_PEOPLE.length);
    let rest = total - per * SIM_PEOPLE.length;
    for (const p of SIM_PEOPLE) {
      const n = per + (rest-- > 0 ? 1 : 0);
      if (n > 0) this.like(p, n, now);
    }
    return this.drainSays();
  }

  /** RẶN giả lập: 5 bạn giả lập cùng chat RẶN (test combo) */
  simRanBurst(now: number): Say[] {
    for (const p of SIM_PEOPLE.slice(0, 5)) this.chat(p, 'RẶN', now);
    return this.drainSays();
  }

  // ---------- Tick ----------
  tick(now: number): Say[] {
    const dt = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;

    // Độ quạu tự nguôi (trừ lúc đang dỗi: giữ nguyên 100)
    if (!this.sulking(now) && this.annoyance > 0 && dt > 0) {
      this.annoyance = Math.max(0, this.annoyance - (GAME.annoyDecayPerSec * dt) / 1000);
      if (this.annoyance < 50) this.hissArmed = true;
    }
    // Hết dỗi (hết giờ hoặc dỗ xong đã xử lý ở chat): về trạng thái thường + bonus.
    // Chạy SAU bước nguôi quạu ở trên để mức quạu chốt = sulkEndAnnoyance, không bị trừ tiếp trong cùng tick.
    if (this.phase === 'attempt' && this.sulkUntil > 0 && now >= this.sulkUntil) {
      this.endSulk(now);
    }

    if (this.phase === 'success') {
      if (now >= this.phaseEndsAt) {
        this.phase = 'intermission';
        this.phaseStartedAt = now;
        this.phaseEndsAt = now + GAME.intermissionMs;
        this.intermSayAt = now + GAME.intermissionLineDelayMs; // hẹn 1 câu MC giữa giờ nghỉ
      }
      return this.drainSays();
    }
    if (this.phase === 'intermission') {
      // MC nói ĐÚNG 1 câu pool nghỉ mỗi giờ nghỉ (câu follow xuất hiện thưa 1/6, tối đa 1 lần/giờ nghỉ)
      if (this.intermSayAt > 0 && now >= this.intermSayAt) {
        this.intermSayAt = 0;
        this.say({ text: this.pick(INTERMISSION_LINES) });
      }
      if (now >= this.phaseEndsAt) {
        this.level++;
        this.totals.attempts++;
        this.successTopName = null;
        this.startAttempt(now, 0);
        this.say({ text: this.pick(NEW_ATTEMPT_LINES, { level: this.level }), main: true });
      }
      return this.drainSays();
    }

    // phase attempt: tụt tiến độ khi im tim (kể cả lúc Bug dỗi — đó là cái đau của dỗi)
    if (dt > 0 && now - this.lastLikeAt > GAME.decayGraceMs && now >= this.fiberUntil && this.progress > 0) {
      const floorPct = this.milestonesHit.size ? Math.max(...this.milestonesHit) : 0;
      const floor = (floorPct / 100) * this.need();
      const decay = (GAME.decayPctPerSec / 100) * this.need() * (dt / 1000);
      this.progress = Math.max(floor, this.progress - decay);
    }

    // hết giờ lượt
    if (now - this.attemptStartedAt >= GAME.attemptLimitMs) {
      this.timeoutAttempt(now);
      return this.drainSays();
    }

    // dọn cửa sổ tim + popup/bong bóng cũ
    const from = now - GAME.likeRateWindowMs;
    if (this.likeEvents.length && this.likeEvents[0].at <= from) {
      this.likeEvents = this.likeEvents.filter((e) => e.at > from);
    }
    this.popups = this.popups.filter((p) => p.until > now);
    this.chatBubbles = this.chatBubbles.filter((b) => b.until > now);
    if (this.bugBubble && this.bugBubble.until <= now) this.bugBubble = null;

    // Bug "sống": bong bóng thoại theo tâm trạng (ngủ gật "Zzz" / đang hăng tự cổ vũ).
    // Không đè lên bong bóng đang hiện (càu nhàu, "Hứ!", giật mình tỉnh dậy...).
    const moodNow = this.moodAt(now);
    if (moodNow === 'sleepy') {
      this.sleepyFlag = true;
      if ((!this.bugBubble || this.bugBubble.until <= now) && now - this.lastSleepyBubbleAt >= GAME.sleepyBubbleEveryMs) {
        this.lastSleepyBubbleAt = now;
        this.bugBubble = { text: this.pickBug(SLEEPY_BUG), until: now + 4000 };
      }
    } else {
      this.sleepyFlag = false;
      if (moodNow === 'pumped' && (!this.bugBubble || this.bugBubble.until <= now) && now - this.lastPumpedBubbleAt >= GAME.pumpedBubbleEveryMs) {
        this.lastPumpedBubbleAt = now;
        this.bugBubble = { text: this.pickBug(PUMPED_BUG), until: now + 3000 };
      }
    }

    // MC cổ vũ theo nhịp tim (throttle)
    const rate = this.likeRateAt(now);
    if (rate >= 2 && now - this.lastCheerAt >= GAME.cheerCooldownMs && !this.sulking(now)) {
      this.lastCheerAt = now;
      const pool = rate >= 10 ? CHEER_HIGH : rate >= 5 ? CHEER_MID : CHEER_LOW;
      this.say({ text: this.pick(pool) });
    }
    // MC nhắc luật khi phòng im
    if (now - this.lastIdleAt >= GAME.idleLineEveryMs && now - this.lastLikeAt > 20_000) {
      this.lastIdleAt = now;
      this.say({ text: this.pick(IDLE_LINES) });
    }
    return this.drainSays();
  }

  // ---------- Ảnh chụp cho stage/điều khiển ----------
  view(now: number): WcView {
    const rate = this.likeRateAt(now);
    const sulk = this.sulking(now);
    const decaying =
      this.phase === 'attempt' && this.progress > 0 && now - this.lastLikeAt > GAME.decayGraceMs && now >= this.fiberUntil;
    const board: BoardRow[] = [...this.contributors.entries()]
      .map(([username, c]) => ({ username, nickname: c.nickname, power: Math.round(c.sessionPower), king: username === this.kingUsername }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 8);
    const top = this.topAttempt();
    return {
      phase: this.phase,
      level: this.level,
      attempt: this.attempt,
      progressPct: Math.round(this.pct() * 10) / 10,
      likeRate: Math.round(rate * 10) / 10,
      decaying,
      remainSec: this.phase === 'attempt' ? Math.max(0, Math.ceil((GAME.attemptLimitMs - (now - this.attemptStartedAt)) / 1000)) : 0,
      waterSec: Math.max(0, Math.ceil((this.waterUntil - now) / 1000)),
      fiberSec: Math.max(0, Math.ceil((this.fiberUntil - now) / 1000)),
      combo: this.comboAt(now),
      milestonesHit: [...this.milestonesHit].sort((a, b) => a - b),
      wobble: now < this.cheatFxUntil.wobble,
      pipes: now < this.cheatFxUntil.pipes,
      senPeek: now < this.cheatFxUntil.sen,
      popups: this.popups.map((p) => ({ id: p.id, nickname: p.nickname })),
      chatBubbles: this.chatBubbles.filter((b) => b.until > now).map((b) => ({ id: b.id, nickname: b.nickname, text: b.text })),
      annoyance: Math.round(this.annoyance),
      sulking: sulk,
      sulkSec: sulk ? Math.ceil((this.sulkUntil - now) / 1000) : 0,
      mood: this.moodAt(now),
      pose: this.poseAt(now),
      strainActive: this.phase === 'attempt' && !sulk && !this.sleepyAt(now),
      bugBubble: this.bugBubble && this.bugBubble.until > now ? this.bugBubble.text : null,
      giftFx: now < this.giftFxUntil,
      topNow: top ? { nickname: top.c.nickname, power: Math.round(top.c.attemptPower) } : null,
      successTop: this.successTopName,
      board,
      totals: { ...this.totals },
      musicOn: this.musicOn,
      musicVolume: this.musicVolume,
      catOn: this.catOn,
      catVolume: this.catVolume,
    };
  }

  // ---------- Móc kiểm chứng (wc.check.ts dùng) ----------
  debugSetProgressPct(pct: number, now: number) {
    this.progress = (pct / 100) * this.need();
    for (const m of GAME.milestones) if (m <= pct) this.milestonesHit.add(m);
    this.lastLikeAt = now;
  }
  debugProgressPct(): number {
    return this.pct();
  }
  debugNeed(): number {
    return this.need();
  }
  debugAnnoyance(): number {
    return this.annoyance;
  }
}
