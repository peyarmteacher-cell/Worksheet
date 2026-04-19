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
  ChevronRight,
  LogOut,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GradeLevel, Subject, ExerciseType, Difficulty, Exercise, User } from './types';
import { generateExercise, fetchExercises, saveExercise, deleteExercise } from './services/geminiService';
import { Auth, ChangePassword } from './components/Auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'change-password' | 'app'>('login');
  
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
    const token = localStorage.getItem('kruai_token');
    const savedUser = localStorage.getItem('kruai_user');
    if (token && savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.needs_password_change) {
        setAuthView('change-password');
      } else {
        setAuthView('app');
        loadRecentExercises();
      }
    }
  }, []);

  const loadRecentExercises = async () => {
    try {
      const data = await fetchExercises();
      setRecentExercises(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('kruai_token', token);
    localStorage.setItem('kruai_user', JSON.stringify(user));
    setCurrentUser(user);
    if (user.needs_password_change) {
      setAuthView('change-password');
    } else {
      setAuthView('app');
      loadRecentExercises();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kruai_token');
    localStorage.removeItem('kruai_user');
    setCurrentUser(null);
    setAuthView('login');
  };

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
    } catch (error: any) {
      if (error.message === "Unauthorized") handleLogout();
      else alert('เกิดข้อผิดพลาดในการสร้างแบบฝึกหัด โปรดลองอีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!currentExercise) return;
    
    try {
      await saveExercise({
        title: currentExercise.title || 'ไม่มีชื่อหัวข้อ',
        grade: selectedGrade,
        subject: selectedSubject,
        type: exerciseType,
        difficulty,
        content: currentExercise,
        indicator: currentExercise.indicator,
        description,
      });
      alert('บันทึกลงฐานข้อมูลสำเร็จ!');
      loadRecentExercises();
    } catch (error) {
      alert('บันทึกผิดพลาด');
    }
  };

  const handleLoad = (ex: Exercise) => {
    const content = typeof ex.content === 'string' ? JSON.parse(ex.content) : ex.content;
    setCurrentExercise(content);
    setSelectedGrade(ex.grade);
    setSelectedSubject(ex.subject);
    setExerciseType(ex.type);
    setDifficulty(ex.difficulty);
    setDescription(ex.description);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบแบบฝึกหัดนี้ใช่หรือไม่?')) return;
    try {
      await deleteExercise(id);
      loadRecentExercises();
    } catch (error) {
      alert('ลบผิดพลาด');
    }
  };

  if (authView === 'login') return <Auth onLogin={handleLogin} onRegisterSuccess={() => {}} />;
  if (authView === 'change-password') return <ChangePassword onComplete={() => setAuthView('app')} />;

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

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-sm">
            <Rocket className="w-6 h-6 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-primary">KruAI</h1>
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

        <div className="pt-6 border-t border-gray-100 mb-4">
          <p className="text-xs uppercase font-bold text-gray tracking-wider mb-3">แบบฝึกหัดของฉัน</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {recentExercises.length > 0 ? (
               recentExercises.map((ex, i) => (
                 <div key={i} className="group flex items-center gap-1">
                   <div 
                    onClick={() => handleLoad(ex)}
                    className="flex-1 text-[11px] p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors truncate"
                   >
                     <p className="font-bold text-gray-700 truncate">{ex.title}</p>
                     <p className="text-[9px] text-gray-400">{ex.grade} | {new Date(ex.created_at).toLocaleDateString('th-TH')}</p>
                   </div>
                   <button 
                    onClick={() => handleDelete(Number(ex.id))}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-danger transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))
            ) : (
              <p className="text-[10px] text-gray-400 italic">ยังไม่มีข้อมูลในฐานข้อมูล</p>
            )}
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-gray-400 hover:text-danger transition-colors border-t border-gray-50"
        >
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Smart Worksheet Builder</h2>
            <p className="text-gray-400 text-sm">ยินดีต้อนรับคุณครู {currentUser?.full_name}</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="px-2">
              <p className="text-xs font-bold text-gray-800">{selectedGrade} | {selectedSubject}</p>
              <p className="text-[10px] text-gray-400">ID: {currentUser?.national_id}</p>
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
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
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
                min="1" max="20"
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 block">ระดับความยาก</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
              >
                <option>ง่าย</option>
                <option>ปานกลาง</option>
                <option>ท้าทาย</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 block">คำอธิบายเนื้อหา / ตัวชี้วัด</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เรื่องภูมิศาสตร์ประเทศไทย ทรัพยากรธรรมชาติ ป.3"
              className="w-full h-24 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all resize-none"
            />
            {currentExercise?.indicator && (
              <div className="indicator-badge">📍 ตัวชี้วัด: {currentExercise.indicator}</div>
            )}
          </div>

          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 relative overflow-y-auto">
            <AnimatePresence mode="wait">
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20"
                >
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-bold text-primary">AI กำลังคัดเลือกเนื้อหาตามหลักสูตร...</p>
                </motion.div>
              )}

              {currentExercise ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-white p-[2cm] shadow-xl w-full max-w-[21cm] mx-auto print:shadow-none print:p-0 print:m-0" id="print-area">
                  <div className="text-center pb-8 border-b-2 border-black">
                    <h3 className="text-3xl font-bold mb-2">{currentExercise.title}</h3>
                    <div className="flex justify-between text-base font-bold mt-4">
                      <span>ชื่อ...........................................................................</span>
                      <span>ชั้น.................. เลขที่..................</span>
                    </div>
                    <p className="text-sm mt-6 text-left border-2 border-black p-2 inline-block w-full">
                      <strong>คำชี้แจง:</strong> {currentExercise.instructions}
                    </p>
                  </div>

                  <div className="space-y-10">
                    {currentExercise.items?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <p className="font-bold text-xl">{idx + 1}. {item.question || item.prompt}</p>
                        
                        {exerciseType === 'ปรนัย (Multiple Choice)' && item.options && (
                          <div className="grid grid-cols-2 gap-y-4 gap-x-12 pl-6">
                            {(Array.isArray(item.options) ? item.options : Object.values(item.options)).map((opt: any, oIdx: number) => (
                              <div key={oIdx} className="flex gap-2">
                                <span className="font-bold">{['ก.', 'ข.', 'ค.', 'ง.'][oIdx]}</span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {exerciseType === 'เติมคำในช่องว่าง (Fill-in-the-blanks)' && (
                          <div className="h-10 border-b-2 border-black w-2/3 ml-6"></div>
                        )}

                        {exerciseType === 'การจับคู่ (Matching)' && (
                           <div className="flex justify-between items-center px-16">
                              <span className="p-3 border-2 border-black min-w-[100px] text-center">........................</span>
                              <div className="h-[1px] bg-black w-20"></div>
                              <span className="p-3 border-2 border-black min-w-[200px] font-bold text-center">{item.match || '......'}</span>
                           </div>
                        )}

                        {exerciseType === 'อัตนัย (Writing)' && (
                          <div className="space-y-3 pl-6">
                            <div className="h-8 border-b border-black/30 w-full"></div>
                            <div className="h-8 border-b border-black/30 w-full"></div>
                            <div className="h-8 border-b border-black/30 w-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 pt-10 border-t border-black hidden print:block text-xs text-center font-bold">
                    ครูผู้สอน: {currentUser?.full_name} | โรงเรียนของท่าน
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center space-y-4">
                  <FileText className="w-16 h-16 opacity-10" />
                  <p className="font-bold">ใส่รายละเอียดและกดปุ่มด้านล่างเพื่อเริ่มสร้าง</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => { setCurrentExercise(null); setDescription(''); }} className="btn btn-outline">
              <PlusCircle className="w-5 h-5" /> <span>ล้างค่า</span>
            </button>
            <button onClick={handleGenerate} disabled={isGenerating} className="btn btn-primary">
              <Rocket className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
              <span>{isGenerating ? 'กำลังสร้างแบบฝึกหัด...' : 'สร้างแบบฝึกหัดด้วย AI'}</span>
            </button>
          </div>
        </section>

        <section className="flex gap-4 justify-end">
          <button onClick={handleSaveToDB} disabled={!currentExercise} className="btn btn-secondary">
            <Save className="w-5 h-5" /> <span>บันทึกลงฐานข้อมูล MySQL</span>
          </button>
          <button onClick={() => window.print()} disabled={!currentExercise} className="btn btn-accent">
            <Printer className="w-5 h-5" /> <span>พิมพ์กระดาษ A4</span>
          </button>
        </section>
      </main>

      {/* A4 Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; margin: 0; padding: 0; font-family: "Sarabun", sans-serif; }
          .sidebar, .btn, label, select, input, textarea, header, .indicator-badge { display: none !important; }
          .layout-container, .main-content, .card { display: block; padding: 0; border: none; background: transparent; }
          .flex-1.bg-gray-50 { background: transparent; border: none; padding: 0; overflow: visible; }
          #print-area { 
            width: 210mm;
            min-height: 297mm;
            padding: 2.5cm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            display: block !important;
            border: none !important;
          }
          .animate-spin, .animate-bounce { display: none !important; }
        }
      `}</style>
    </div>
  );
}
