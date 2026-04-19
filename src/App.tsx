/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  LogOut,
  Trash2,
  Settings,
  ShieldCheck,
  User as UserIcon,
  ExternalLink,
  Check,
  X,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GradeLevel, Subject, ExerciseType, Difficulty, Exercise, User } from './types';
import { generateExercise, fetchExercises, saveExercise, deleteExercise } from './services/geminiService';
import { Auth, ChangePassword } from './components/Auth';

function ProfileSettings({ user, onUpdate }: { user: User, onUpdate: (data: any) => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [school, setSchool] = useState(user.school || '');
  const [position, setPosition] = useState(user.position || 'ครู คศ. 1');
  const [apiKey, setApiKey] = useState(user.api_key || '');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const positions = ['ครูอัตราจ้าง', 'พนักงานราชการครู', 'ครู', 'ครู คศ. 1', 'ครู คศ. 2', 'ครู คศ. 3', 'ครู คศ. 4'];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kruai_token')}`
        },
        body: JSON.stringify({ full_name: fullName, school, position, api_key: apiKey })
      });
      if (resp.ok) {
        alert('อัปเดตข้อมูลสำเร็จ');
        onUpdate({ full_name: fullName, school, position, api_key: apiKey });
      }
    } catch { alert('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <form onSubmit={handleUpdate} className="card lg:col-span-2 space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" /> ข้อมูลส่วนตัว
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">ชื่อ-นามสกุล</label>
            <input 
              value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">โรงเรียน</label>
            <input 
              value={school} onChange={e => setSchool(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase">ตำแหน่ง</label>
            <select 
              value={position} onChange={e => setPosition(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
            >
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-accent" /> ตั้งค่า AI ส่วนตัว (Google Gemini)
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">API KEY ของคุณ</label>
            <input 
              type="password"
              placeholder="วาง API KEY ที่นี่..."
              value={apiKey} onChange={e => setApiKey(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
            />
            <p className="text-[10px] text-gray-500 leading-relaxed">
              * หากไม่ระบุ ระบบจะใช้ API ส่วนกลาง (หากมีโควต้าเหลือ)
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" /> วิธีรับ API KEY ฟรีจาก Google AI Studio
            </a>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </form>

      <div className="space-y-6">
        <div className="card space-y-4">
           <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-danger" /> ความปลอดภัย
          </h3>
          <p className="text-sm text-gray-500">จัดการรหัสผ่านเข้าใช้งานร่วมกับบัญชีของคุณ</p>
          <button 
            onClick={() => setIsChangingPass(!isChangingPass)}
            className="btn btn-outline w-full justify-center"
          >
            {isChangingPass ? 'ยกเลิก' : 'เปลี่ยนรหัสผ่านใหม่'}
          </button>
          
          {isChangingPass && (
            <div className="pt-4 border-t border-gray-50">
              <ChangePassword onComplete={() => { setIsChangingPass(false); alert('เปลี่ยนรหัสผ่านสำเร็จ'); }} />
            </div>
          )}
        </div>

        <div className="card bg-primary/5 border-none shadow-none space-y-3">
          <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4" /> ข้อแนะนำ
          </h4>
          <ul className="text-xs text-primary/70 space-y-2 list-disc pl-4">
            <li>การใช้ API KEY ส่วนตัวจะช่วยให้สร้างแบบฝึกหัดได้เร็วขึ้น</li>
            <li>ข้อมูลโรงเรียนและตำแหน่งจะปรากฏในแบบฝึกหัดที่ท่านสร้าง</li>
            <li>ดูแลรักษา API KEY ของท่านเป็นความลับเสมอ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'change-password' | 'app'>('login');
  const [appView, setAppView] = useState<'generator' | 'admin' | 'profile'>('generator');
  
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('ป.1');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('ภาษาไทย');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('ปรนัย (Multiple Choice)');
  const [difficulty, setDifficulty] = useState<Difficulty>('ปานกลาง');
  const [itemCount, setItemCount] = useState<number>(5);
  const [description, setDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

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
        if (user.national_id === 'admin') loadPendingUsers();
      }
    }
  }, []);

  const loadPendingUsers = async () => {
    try {
      const resp = await fetch('/api/admin/pending-users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kruai_token')}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setPendingUsers(data);
      }
    } catch (error) { console.error(error); }
  };

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
    setAppView('generator');
  };

  const handleApprove = async (userId: number, approve: boolean) => {
    try {
      const resp = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kruai_token')}`
        },
        body: JSON.stringify({ userId, approve })
      });
      if (resp.ok) {
        alert(approve ? 'อนุมัติผู้ใช้เรียบร้อย' : 'ปฏิเสธผู้ใช้เรียบร้อย');
        loadPendingUsers();
      }
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
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

  const renderAppView = () => {
    if (appView === 'admin') {
      return (
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-xl font-bold">จัดการคำขอเข้าใช้งาน</h3>
                <p className="text-sm text-gray-500">อนุมัติคุณครูที่รอการเข้าใช้งานระบบ</p>
              </div>
           </div>
           
           <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase">คุณครู</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase">โรงเรียน/ตำแหน่ง</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase">สมัครเมื่อ</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingUsers.length > 0 ? pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{user.full_name}</div>
                          <div className="text-xs text-gray-400">ID: {user.national_id}</div>
                        </td>
                        <td className="px-6 py-4 text-nowrap">
                          <div className="text-sm font-medium text-gray-700">{user.school}</div>
                          <div className="text-xs text-primary">{user.position}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(user.created_at || Date.now()).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(user.id, true)}
                              className="p-2 bg-success/10 text-success rounded-lg hover:bg-success hover:text-white transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApprove(user.id, false)}
                              className="p-2 bg-danger/10 text-danger rounded-lg hover:bg-danger hover:text-white transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                          ไม่พบรายการที่รอการอนุมัติ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      );
    }

    if (appView === 'profile') {
      return <ProfileSettings user={currentUser!} onUpdate={(updated) => setCurrentUser({...currentUser!, ...updated})} />;
    }

    return (
      <div className="flex flex-col gap-6 h-full">
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
                    ครูผู้สอน: {currentUser?.full_name} | โรงเรียน: {currentUser?.school} | ตำแหน่ง: {currentUser?.position}
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
      </div>
    );
  };

  if (authView === 'login') return <Auth onLogin={handleLogin} onRegisterSuccess={() => {}} />;
  if (authView === 'change-password') return <ChangePassword onComplete={() => setAuthView('app')} />;

  return (
    <div className="layout-container">
      <aside className="sidebar flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-sm">
            <Rocket className="w-6 h-6 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">KruAI</h1>
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <div
            onClick={() => setAppView('generator')}
            className={`subject-item ${appView === 'generator' ? 'active shadow-sm' : ''}`}
          >
            <Rocket className="w-5 h-5" />
            <span className="font-bold">สร้างแบบฝึกหัด</span>
          </div>
          
          <div
            onClick={() => setAppView('profile')}
            className={`subject-item ${appView === 'profile' ? 'active shadow-sm' : ''}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-bold">ข้อมูลของฉัน & AI</span>
          </div>

          {currentUser?.national_id === 'admin' && (
            <div
              onClick={() => setAppView('admin')}
              className={`subject-item ${appView === 'admin' ? 'active shadow-sm' : ''} relative`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold">จัดการคำขออนุมัติ</span>
              {pendingUsers.length > 0 && (
                <span className="absolute right-2 top-2 w-5 h-5 bg-danger text-white text-[10px] flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                  {pendingUsers.length}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] uppercase font-bold text-nowrap text-gray-400 tracking-widest mb-3 opacity-60">ระดับชั้น</p>
          <div className="grid grid-cols-2 gap-2 mb-6 text-nowrap">
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => { setSelectedGrade(grade); setAppView('generator'); }}
                className={`btn-level text-[10px] py-1.5 ${selectedGrade === grade ? 'active' : ''}`}
              >
                {grade}
              </button>
            ))}
          </div>

          <p className="text-[10px] uppercase font-bold text-nowrap text-gray-400 tracking-widest mb-3 opacity-60">รายวิชา</p>
          <div className="flex flex-col gap-1 mb-6 text-nowrap">
            {subjects.map((subj) => (
              <div
                key={subj.name}
                onClick={() => { setSelectedSubject(subj.name); setAppView('generator'); }}
                className={`subject-item text-xs p-2 ${selectedSubject === subj.name ? 'active' : ''}`}
              >
                <div className="w-5">{subj.icon}</div>
                <span>{subj.name}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] uppercase font-bold text-nowrap text-gray-400 tracking-widest mb-3 opacity-60">แบบฝึกหัดของฉัน</p>
          <div className="space-y-2 text-nowrap">
            {recentExercises.length > 0 ? recentExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleLoad(ex)}
                className="p-3 bg-white/50 hover:bg-white rounded-xl border border-gray-100 cursor-pointer group transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-700 truncate flex-1">{ex.title}</p>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(Number(ex.id)); }} className="opacity-0 group-hover:opacity-100 p-1 text-danger hover:bg-danger/10 rounded-md transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="bg-primary/10 text-primary px-1.5 rounded uppercase">{ex.grade}</span>
                  <span className="bg-gray-100 px-1.5 rounded truncate">{ex.subject}</span>
                </div>
              </div>
            )) : <p className="text-xs text-center text-gray-300 py-10 italic">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-danger hover:bg-danger/5 rounded-xl transition-all font-bold">
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
               {appView === 'admin' ? 'จัดการผู้ใช้งาน' : appView === 'profile' ? 'การตั้งค่าส่วนตัว' : 'สร้างแบบฝึกหัดอัจฉริยะ'}
            </h2>
            <p className="text-gray-400 text-sm font-medium">
               {appView === 'generator' ? `กำลังสร้าง: ${selectedGrade} | ${selectedSubject}` : `คุณครู: ${currentUser?.full_name}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setAppView('profile')}
              className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-primary transition-all group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-800 line-clamp-1">{currentUser?.school || 'ยังไม่ระบุโรงเรียน'}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{currentUser?.position}</p>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={appView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderAppView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; margin: 0; padding: 0; font-family: "Sarabun", "Inter", sans-serif; }
          .sidebar, .btn, label, select, input, textarea, header, .indicator-badge { display: none !important; }
          .layout-container, .main-content, .card { display: block; padding: 0; border: none !important; background: transparent !important; box-shadow: none !important; }
          .flex-1.bg-gray-50 { background: transparent !important; border: none; padding: 0; overflow: visible; }
          #print-area { 
            width: 210mm;
            min-height: 297mm;
            padding: 2.5cm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            display: block !important;
            border: none !important;
            background: white !important;
          }
          .animate-spin, .animate-bounce { display: none !important; }
        }
      `}</style>
    </div>
  );
}
