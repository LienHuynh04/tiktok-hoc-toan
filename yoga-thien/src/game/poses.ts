// Danh mục 9 tư thế yoga của lớp: tên Việt + tên Sanskrit chuẩn, câu lệnh người xem gõ,
// lời hướng dẫn vào thế và lợi ích đọc cho cả lớp. Ô ảnh (cell) khớp lưới 3x3 trong poseArt.ts.
// Độ đúng của tư thế được đối chiếu theo ảnh vẽ: ô 4 là biến thể Nhân Sư của Rắn Hổ Mang
// (chống khuỷu tay — Salamba Bhujangasana) nên đặt đúng tên này, không gọi là Rắn Hổ Mang đầy đủ.

export interface Pose {
  key: string;
  cell: number;
  label: string;
  sanskrit: string;
  cmds: string[]; // dạng không dấu, viết hoa; khớp theo cụm từ liên tiếp
  guide: string; // cách vào thế, đọc khi bắt đầu
  benefit: string; // lợi ích, đọc nối tiếp
}

export const POSES: Pose[] = [
  {
    key: 'sen', cell: 0, label: 'Hoa Sen', sanskrit: 'Padmasana',
    cmds: ['HOA SEN', 'NGOI THIEN', 'THIEN', 'SEN'],
    guide: 'Ngồi xếp bằng, lưng thật thẳng, hai tay đặt nhẹ lên gối, nhắm mắt lại.',
    benefit: 'tâm trí lắng xuống, hơi thở sâu và đều — tư thế thiền định kinh điển',
  },
  {
    key: 'cay', cell: 1, label: 'Cái Cây', sanskrit: 'Vrksasana',
    cmds: ['CAI CAY', 'CAY'],
    guide: 'Đứng vững một chân, bàn chân còn lại áp vào đùi trong, chắp tay đưa cao qua đầu, mắt nhìn một điểm cố định.',
    benefit: 'thăng bằng tốt hơn, đôi chân khoẻ và tâm trí tập trung',
  },
  {
    key: 'chienbinh', cell: 2, label: 'Chiến Binh II', sanskrit: 'Virabhadrasana II',
    cmds: ['CHIEN BINH 2', 'CHIEN BINH'],
    guide: 'Bước chân trước khuỵu gối vuông góc, chân sau duỗi thẳng, hai tay dang ngang vai, mắt nhìn theo tay trước.',
    benefit: 'chân và vai khoẻ, lồng ngực mở rộng, người đầy năng lượng',
  },
  {
    key: 'choup', cell: 3, label: 'Chó Úp Mặt', sanskrit: 'Adho Mukha Svanasana',
    cmds: ['CHO UP MAT', 'CHO UP', 'CHO CUI', 'CHO'],
    guide: 'Chống hai tay và hai chân xuống thảm, đẩy hông lên cao thành hình chữ V ngược, gót chân hướng xuống sàn.',
    benefit: 'cột sống được kéo giãn, vai và gân kheo mềm ra',
  },
  {
    key: 'nhansu', cell: 4, label: 'Rắn Hổ Mang (Nhân Sư)', sanskrit: 'Salamba Bhujangasana',
    cmds: ['RAN HO MANG', 'NHAN SU', 'RAN'],
    guide: 'Nằm sấp, chống hai khuỷu tay ngay dưới vai, nhẹ nhàng nâng ngực lên, cổ giữ dài và thả lỏng vai.',
    benefit: 'lưng dưới dễ chịu, ngực mở — rất hợp cho người ngồi nhiều',
  },
  {
    key: 'embe', cell: 5, label: 'Em Bé', sanskrit: 'Balasana',
    cmds: ['EM BE'],
    guide: 'Quỳ gối, ngồi lên gót chân rồi gập người về trước, trán chạm thảm, hai tay duỗi dài phía trước.',
    benefit: 'toàn thân được nghỉ, lưng và hông thả lỏng hoàn toàn',
  },
  {
    key: 'cau', cell: 6, label: 'Cây Cầu', sanskrit: 'Setu Bandhasana',
    cmds: ['CAY CAU', 'CAU'],
    guide: 'Nằm ngửa, co gối, bàn chân đặt chắc trên thảm rồi từ từ nâng hông lên cao.',
    benefit: 'mông và đùi sau săn chắc, lưng được thư giãn nhẹ nhàng',
  },
  {
    key: 'tamgiac', cell: 7, label: 'Tam Giác', sanskrit: 'Trikonasana',
    cmds: ['TAM GIAC'],
    guide: 'Đứng dang chân rộng, nghiêng người sang một bên, một tay chạm ống chân, tay còn lại vươn thẳng lên trời.',
    benefit: 'eo và sườn được kéo giãn, đôi chân thêm dẻo dai',
  },
  {
    key: 'thugian', cell: 8, label: 'Thư Giãn', sanskrit: 'Savasana',
    cmds: ['THU GIAN', 'NAM THU GIAN', 'SAVASANA'],
    guide: 'Nằm ngửa thả lỏng toàn thân, tay chân buông tự nhiên, nhắm mắt và thở thật nhẹ.',
    benefit: 'cơ thể phục hồi hoàn toàn — tư thế ru giấc ngủ ngon nhất buổi',
  },
];

export const POSE_BY_KEY: Record<string, Pose> = Object.fromEntries(POSES.map((p) => [p.key, p]));

/** Chuỗi buổi tập nhẹ nhàng khi không ai gọi bài: thiền -> đứng -> sàn -> thư giãn sâu */
export const FLOW = ['sen', 'cay', 'chienbinh', 'tamgiac', 'choup', 'nhansu', 'cau', 'embe', 'thugian'];

const plain = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CMDS: { pose: Pose; tokens: string[] }[] = POSES.flatMap((pose) =>
  pose.cmds.map((c) => ({ pose, tokens: c.split(' ') })),
).sort((a, b) => b.tokens.length - a.tokens.length);

/** Gõ đúng tên tư thế (không cần dấu) thì nhận ra, ví dụ "cho em tập cái cây" -> Cái Cây */
export function findPose(comment: string): Pose | null {
  const tokens = plain(comment).split(' ').filter(Boolean);
  for (const { pose, tokens: cmd } of CMDS) {
    for (let i = 0; i + cmd.length <= tokens.length; i++) {
      if (cmd.every((t, j) => tokens[i + j] === t)) return pose;
    }
  }
  return null;
}
