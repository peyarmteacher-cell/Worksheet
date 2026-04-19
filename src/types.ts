export type GradeLevel = 'ป.1' | 'ป.2' | 'ป.3' | 'ป.4' | 'ป.5' | 'ป.6';

export type Subject = 'ภาษาไทย' | 'คณิตศาสตร์' | 'วิทยาศาสตร์' | 'ภาษาอังกฤษ' | 'สังคมศึกษา' | 'ศิลปะ' | 'สุขศึกษา' | 'การงานอาชีพ';

export type ExerciseType = 'การจับคู่ (Matching)' | 'ปรนัย (Multiple Choice)' | 'อัตนัย (Writing)' | 'เติมคำในช่องว่าง (Fill-in-the-blanks)';

export type Difficulty = 'ง่าย' | 'ปานกลาง' | 'ท้าทาย';

export interface Exercise {
  id?: string;
  title: string;
  grade: GradeLevel;
  subject: Subject;
  type: ExerciseType;
  difficulty: Difficulty;
  content: string; // Markdown or structured text
  indicator?: string;
  description: string;
  createdAt: number;
}
