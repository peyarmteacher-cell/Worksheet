import { ExerciseType, GradeLevel, Subject, Difficulty } from "../types";

const getHeaders = () => {
  const token = localStorage.getItem('kruai_token');
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

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
  "items": [...] 
}
`;

  const prompt = `สร้างแบบฝึกหัดสำหรับชั้น ${grade}
รายวิชา: ${subject}
รูปแบบ: ${type}
ระดับความยาก: ${difficulty}
จำนวน: ${count} ข้อ
รายละเอียดเนื้อหา: ${description}`;

  const response = await fetch("/api/generate-exercise", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ prompt, systemInstruction }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate exercise");
  }

  return await response.json();
}

export async function fetchExercises() {
  const response = await fetch("/api/exercises", {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch exercises");
  return await response.json();
}

export async function saveExercise(exercise: any) {
  const response = await fetch("/api/exercises", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(exercise),
  });
  if (!response.ok) throw new Error("Failed to save exercise");
  return await response.json();
}

export async function deleteExercise(id: number) {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete exercise");
  return await response.json();
}
