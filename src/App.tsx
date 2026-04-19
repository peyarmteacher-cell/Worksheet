/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Beaker, 
  Globe, 
  Languages, 
  Palette as PaletteIcon, 
  HeartPulse, 
  Briefcase,
  FileText,
  Printer,
  Save,
  Rocket,
  PlusCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GradeLevel, Subject, ExerciseType, Difficulty, Exercise } from './types';
import { generateExercise } from './services/geminiService';

export default function App() {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('ป.1');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('ภาษาไทย');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('ปรนัย (Multiple Choice)');
  const [difficulty, setDifficulty] = useState<Difficulty>('ปานกลาง');
  const [itemCount, setItemCount] = useState<number>(5);
  const [description, setDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('kruai_exercises');
    if (saved) {
      setRecentExercises(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    if (!currentExercise) return;
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      title: currentExercise.title || 'ไม่มีชื่อหัวข้อ',
      grade: selectedGrade,
      subject: selectedSubject,
      type: exerciseType,
      difficulty,
      content: JSON.stringify(currentExercise),
      indicator: currentExercise.indicator,
      description,
      createdAt: Date.now(),
    };

    const updated = [newExercise, ...recentExercises].slice(0, 10);
    setRecentExercises(updated);
    localStorage.setItem('kruai_exercises', JSON.stringify(updated));
    alert('บันทึกสำเร็จ!');
  };

  const handleLoad = (ex: Exercise) => {
    setCurrentExercise(JSON.parse(ex.content));
    setSelectedGrade(ex.grade);
    setSelectedSubject(ex.subject);
    setExerciseType(ex.type);
    setDifficulty(ex.difficulty);
    setDescription(ex.description);
  };

  const handleReset = () => {
    setCurrentExercise(null);
    setDescription('');
  };

  const grades: GradeLevel[] = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
  const subjects: { name: Subject; icon: any }[] = [
    { name: 'ภาษาไทย', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'คณิตศาสตร์', icon: <Calculator className="w-5 h-5" /> },
    { name: 'วิทยาศาสตร์', icon: <Beaker className="w-5 h-5" /> },
    { name: 'ภาษาอังกฤษ', icon: <Languages className="w-5 h-5" /> },
    { name: 'สังคมศึกษา', icon: <Globe className="w-5 h-5" /> },
    { name: 'ศิลปะ', icon: <PaletteIcon className="w-5 h-5" /> },
    { name: 'สุขศึกษา', icon: <HeartPulse className="w-5 h-5" /> },
    { name: 'การงานอาชีพ', icon: <Briefcase className="w-5 h-5" /> },
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('โปรดระบุรายละเอียดเนื้อหาหรือตัวชี้วัด');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateExercise({
        grade: selectedGrade,
        subject: selectedSubject,
        type: exerciseType,
        difficulty,
        description,
        count: itemCount
      });
      setCurrentExercise(result);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการสร้างแบบฝึกหัด โปรดลองอีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-sm">
            <Rocket className="w-6 h-6 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-primary">KruAI Studio</h1>
        </div>

        <div className="mb-6">
          <p className="text-xs uppercase font-bold text-gray tracking-wider mb-3">ระดับชั้น</p>
          <div className="grid grid-cols-2 gap-2">
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`btn-level ${selectedGrade === grade ? 'active' : ''}`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex-1 overflow-y-auto pr-2">
          <p className="text-xs uppercase font-bold text-gray tracking-wider mb-3">รายวิชา</p>
          <div className="flex flex-col gap-1">
            {subjects.map((subj) => (
              <div
                key={subj.name}
                onClick={() => setSelectedSubject(subj.name)}
                className={`subject-item ${selectedSubject === subj.name ? 'active' : ''}`}
              >
                {subj.icon}
                <span>{subj.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-xs uppercase font-bold text-gray tracking-wider mb-3">คลังแบบฝึกหัด</p>
          <div className="flex flex-col gap-3">
            {recentExercises.length > 0 ? (
               recentExercises.map((ex, i) => (
                 <div 
                   key={i} 
                   onClick={() => handleLoad(ex)}
                   className="text-sm p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                 >
                   <p className="font-semibold text-gray-800 truncate">{ex.title}</p>
                   <p className="text-[10px] text-gray-400">สร้างเมื่อ {new Date(ex.createdAt).toLocaleDateString('th-TH')}</p>
                 </div>
               ))
            ) : (
              <p className="text-xs text-gray-400 italic">ยังไม่มีการบันทึก</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">สร้างแบบฝึกหัดใหม่</h2>
            <p className="text-gray-400 text-sm">ออกแบบสื่อการสอนคุณภาพสูงด้วยพลังของ AI Studio</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-800">{selectedGrade} | {selectedSubject}</p>
              <p className="text-[10px] text-gray-400">หลักสูตรแกนกลาง พ.ศ. 2551</p>
            </div>
          </div>
        </header>

        <section className="card flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 block">รูปแบบแบบฝึกหัด</label>
              <select 
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              >
                <option>การจับคู่ (Matching)</option>
                <option>ปรนัย (Multiple Choice)</option>
                <option>อัตนัย (Writing)</option>
                <option>เติมคำในช่องว่าง (Fill-in-the-blanks)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 block">จำนวนข้อ</label>
              <input 
                type="number" 
                min="1" 
                max="20"
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 block">ระดับความยาก</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              >
                <option>ง่าย</option>
                <option>ปานกลาง</option>
                <option>ท้าทาย</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 block">รายละเอียดเนื้อหา / ตัวชี้วัดที่ต้องการเน้น</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เรื่องการสะกดคำในมาตราแม่กน นักเรียน ป.1 เน้นคำที่มี 2 พยางค์ พร้อมอธิบายความหมายสั้นๆ"
              className="w-full h-24 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all resize-none"
            />
            {currentExercise?.indicator && (
              <div className="indicator-badge">📍 {currentExercise.indicator}</div>
            )}
          </div>

          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 relative overflow-y-auto">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20"
                >
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-bold text-primary">AI กำลังประมวลผลตามหลักสูตร...</p>
                </motion.div>
              ) : null}

              {currentExercise ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 print:block"
                  id="print-area"
                >
                  <div className="text-center pb-6 border-b-2 border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{currentExercise.title}</h3>
                    <p className="text-sm text-gray-500">{selectedGrade} | รายวิชา {selectedSubject}</p>
                    <p className="text-sm mt-3 font-semibold bg-primary/10 text-primary py-1 px-4 inline-block rounded-full">
                      คำชี้แจง: {currentExercise.instructions}
                    </p>
                  </div>

                  <div className="space-y-8">
                    {currentExercise.items?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <p className="font-bold text-lg">{idx + 1}. {item.question || item.prompt}</p>
                        
                        {exerciseType === 'ปรนัย (Multiple Choice)' && item.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                            {['ก', 'ข', 'ค', 'ง'].map((label, oIdx) => (
                              <div key={oIdx} className="flex gap-2">
                                <span className="font-bold">{label}.</span>
                                <span>{item.options[oIdx] || item.options[label]}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {exerciseType === 'เติมคำในช่องว่าง (Fill-in-the-blanks)' && (
                          <div className="h-8 border-b-2 border-gray-300 w-1/2 ml-4"></div>
                        )}

                        {exerciseType === 'การจับคู่ (Matching)' && (
                           <div className="flex justify-between items-center px-10">
                              <span className="p-2 border rounded">........................</span>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                              <span className="p-2 border rounded">{item.match || '......'}</span>
                           </div>
                        )}

                        {exerciseType === 'อัตนัย (Writing)' && (
                          <div className="space-y-2 pl-4">
                            <div className="h-6 border-b border-gray-200 w-full"></div>
                            <div className="h-6 border-b border-gray-200 w-full"></div>
                            <div className="h-6 border-b border-gray-200 w-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-dashed border-gray-300 hidden print:block text-xs text-center text-gray-400">
                    สร้างโดยระบบ KruAI Studio - สนับสนุนโรงเรียนบ้านดอน
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center space-y-4">
                  <div className="text-6xl">✨</div>
                  <div>
                    <p className="font-bold">พร้อมสร้างแบบฝึกหัดแล้ว</p>
                    <p className="text-xs max-w-xs">AI จะประมวลผลข้อสอบอ้างอิงจากหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานและตัวชี้วัดที่เหมาะสม</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={handleReset} className="btn btn-outline">
              <PlusCircle className="w-5 h-5" />
              <span>เริ่มใหม่</span>
            </button>
            <div className="flex gap-3">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary"
              >
                <Rocket className="w-5 h-5" />
                <span>{isGenerating ? 'กำลังสร้าง...' : 'เริ่มสร้างด้วย AI'}</span>
              </button>
            </div>
          </div>
        </section>

        <section className="flex gap-3 justify-end">
          <button onClick={handleSave} className="btn btn-secondary">
            <Save className="w-5 h-5" />
            <span>บันทึกลงคลัง</span>
          </button>
          <button onClick={handlePrint} className="btn btn-accent">
            <Printer className="w-5 h-5" />
            <span>พิมพ์ (PDF)</span>
          </button>
        </section>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          .sidebar, .btn, label, select, input, textarea, header, .flex-1.bg-gray-50 button {
            display: none !important;
          }
          .layout-container {
            display: block;
            background: white;
            padding: 0;
          }
          .main-content {
            padding: 0;
            display: block;
          }
          .card {
            border: none;
            box-shadow: none;
            padding: 0;
            display: block;
          }
          #print-area {
            display: block !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
