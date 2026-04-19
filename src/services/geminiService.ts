import { GoogleGenAI } from "@google/genai";
import { ExerciseType, GradeLevel, Subject, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
แบบฝึกหัดต้องมีความเหมาะสมกับช่วงวัยของนักเรียน สื่อความหมายชัดเจน และช่วยพัฒนาการเรียนรู้ได้อย่างแท้จริง

รูปแบบข้อมูลขาออก: ให้ส่งคืนในรูปแบบ JSON ที่มีโครงสร้างดังนี้:
{
  "title": "หัวข้อแบบฝึกหัด",
  "indicator": "ตัวชี้วัดที่เกี่ยวข้อง (ถ้ามี)",
  "instructions": "คำชี้แจงสำหรับนักเรียน",
  "items": [...] // รายการข้อสอบหรือกิจกรรมตามรูปแบบที่เลือก
}

คำแนะนำเพิ่มเติมตามรูปแบบ:
- การจับคู่: ให้มีคู่รายการที่สัมพันธ์กัน
- ปรนัย: ให้มีโจทย์ ตัวเลือก (ก, ข, ค, ง) และเฉลย
- อัตนัย: ให้มีโจทย์และแนวทางคำตอบ
- เติมคำ: ให้มีประโยคหรือข้อความที่มีช่องว่างและคำที่ควรเติม
`;

  const prompt = `สร้างแบบฝึกหัดสำหรับชั้น ${grade}
รายวิชา: ${subject}
รูปแบบ: ${type}
ระดับความยาก: ${difficulty}
จำนวน: ${count} ข้อ
รายละเอียดเพิ่มเติมหรือเนื้อหาที่ต้องการ: ${description}

โปรดสร้างแบบฝึกหัดที่เป็นภาษาไทยทั้งหมด และจัดรูปแบบให้สวยงามสแกนอ่านง่าย`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating exercise:", error);
    throw error;
  }
}
