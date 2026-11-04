// LỚP TOÁN: câu hỏi do math.ts TỰ SINH, không còn bộ câu hỏi chữ trong cau-hoi/.
// File này chỉ còn giữ kiểu Question + parseBank cho tương thích cũ (bank rỗng vẫn chạy được).
// Kiểm tra: npx tsx src/game/quiz.check.ts và npx tsx src/game/math.check.ts

export interface Question {
  id: string; // "tên-file:đáp án", dùng để nhớ câu đã hỏi
  clue: string;
  answer: string;
  acceptedAnswers?: string[];
  category: string;
  kind: string; // câu cô nói trước gợi ý, vd "Đây là một món ăn." (dòng "> ..." đầu file)
  difficulty: 'easy' | 'medium' | 'hard';
  /** câu toán (math.ts): phép tính hiện trên bảng, cách cô đọc, cấp độ; reveal = câu cô công bố đáp án nếu khác mẫu "<say> bằng <đáp án>" */
  math?: { show: string; say: string; level?: number; reveal?: string };
  /** câu có chỗ riêng trong tiết, theo đuôi tên file: "-meo" câu đố mẹo, "-su" câu lịch sử.
   *  Chỉ hỏi ở đúng vị trí đó trong GAME.roundPlan, không lẫn vào câu chữ thường */
  slot?: Slot;
}

const LEVEL = { '1': 'easy', '2': 'medium', '3': 'hard' } as const;

export const SLOTS = ['meo', 'su', 'anh'] as const;
export type Slot = (typeof SLOTS)[number];

/** Đọc các file câu hỏi. `errors` gom dòng sai cú pháp để script kiểm tra báo ra */
export function parseBank(files: Record<string, string>, errors: string[] = []): Question[] {
  const out: Question[] = [];
  for (const [path, text] of Object.entries(files)) {
    const file = path.split('/').pop()!.replace(/\.txt$/, '');
    let category = file;
    let kind = '';
    text.split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('#')) {
        if (category === file) category = line.slice(1).trim();
        return;
      }
      if (line.startsWith('>')) {
        kind = line.slice(1).trim();
        return;
      }
      const [answer, clue, level, alts] = line.split('|').map((s) => s.trim());
      const difficulty = LEVEL[level as keyof typeof LEVEL];
      if (!answer || !clue || !difficulty) {
        errors.push(`${file}:${i + 1} sai cú pháp: ${line}`);
        return;
      }
      out.push({
        id: `${file}:${answer}`,
        answer,
        clue,
        category,
        kind,
        difficulty,
        slot: SLOTS.find((s) => file.endsWith(`-${s}`)),
        acceptedAnswers: alts ? alts.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
    });
  }
  return out;
}
