import { ExerciseType, GradeLevel, Subject, Difficulty } from "../types";

export async function generateExercise(params: {
  grade: GradeLevel;
  subject: Subject;
  type: ExerciseType;
  difficulty: Difficulty;
  description: string;
  count: number;
}) {
  const { grade, subject, type, difficulty, description, count } = params;

  const systemInstruction = `คุณคือผู้ช่วยอัจฉริยะสำหรับคุณครูระดับประถมศึกษาในประเทศไทย 
หน้าที่ของคุณคือสร้างแบบฝึกหัดที่เน้นคุณภาพ อ้างอิงตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานและตัวชี้วัดของระดับชั้นนั้นๆ 
แบบฝึกหัดต้องมีความเหมาะสมกับช่วงวัยของระดับชั้น ${grade} สื่อความหมายชัดเจน และช่วยพัฒนาการเรียนรู้ได้อย่างแท้จริง

รูปแบบข้อมูลขาออก: ให้ส่งคืนในรูปแบบ JSON ที่มีโครงสร้างดังนี้:
{
  "title": "หัวข้อแบบฝึกหัด",
  "indicator": "ตัวชี้วัดที่เกี่ยวข้อง (ถ้ามี)",
  "instructions": "คำชี้แจงสำหรับนักเรียน",
  "items": [...] // รายการข้อสอบหรือกิจกรรมตามรูปแบบที่เลือก
}
`;

  const prompt = `สร้างแบบฝึกหัดสำหรับชั้น ${grade}
รายวิชา: ${subject}
รูปแบบ: ${type}
ระดับความยาก: ${difficulty}
จำนวน: ${count} ข้อ
รายละเอียดเนื้อหา: ${description}`;

  try {
    const response = await fetch("/api/generate-exercise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate exercise");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating exercise:", error);
    throw error;
  }
}
