import { parseBank } from './questions';

// LỚP TOÁN: không còn bộ câu hỏi chữ. Câu hỏi do math.ts tự sinh nên bank luôn rỗng;
// file này giữ lại để Classroom / useGame khỏi phải đổi khắp nơi (bank rỗng vẫn chạy đúng).
const files = import.meta.glob('./cau-hoi/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const QUESTIONS = parseBank(files);
