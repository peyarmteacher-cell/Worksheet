import React, { useState } from 'react';
import { User, Rocket, Lock, Fingerprint, UserPlus, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
  onRegisterSuccess: () => void;
}

export function Auth({ onLogin, onRegisterSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [position, setPosition] = useState('ครู คศ. 1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const positions = [
    'ครูอัตราจ้าง',
    'พนักงานราชการครู',
    'ครู',
    'ครู คศ. 1',
    'ครู คศ. 2',
    'ครู คศ. 3',
    'ครู คศ. 4'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'api/auth/login' : 'api/auth/register';
    const body = isLogin 
      ? { national_id: nationalId, password }
      : { national_id: nationalId, full_name: fullName, password, school, position };

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      if (isLogin) {
        onLogin(data.token, data.user);
      } else {
        alert(data.message || 'สมัครสมาชิกสำเร็จ! โปรดรอการอนุมัติจากผู้ดูแลระบบ');
        onRegisterSuccess();
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F7FF] to-[#E1F0FF] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <Rocket className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-primary">KruAI Studio</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isLogin ? 'เข้าสู่ระบบเพื่อสร้างแบบฝึกหัด' : 'ลงทะเบียนผู้ใช้งานใหม่'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" /> หมายเลขประจำตัวประชาชน
            </label>
            <input
              type="text"
              required
              maxLength={13}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              placeholder="XXXXXXXXXXXXX"
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4" /> ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
                  placeholder="ชื่อของคุณครู"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> โรงเรียน
                </label>
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
                  placeholder="ชื่อโรงเรียนของคุณครู"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <Rocket className="w-4 h-4" /> ตำแหน่ง
                </label>
                <select
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
                >
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <Lock className="w-4 h-4" /> รหัสผ่าน
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              placeholder={isLogin ? "******" : "ตั้งรหัสผ่าน 6 ตัวขึ้นไป"}
            />
          </div>

          {error && (
            <p className="text-sm text-danger font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-4 justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'เข้าสู่ระบบ'
            ) : (
              'ลงทะเบียน'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-2 mx-auto cursor-pointer"
          >
            {isLogin ? (
              <>
                <UserPlus className="w-4 h-4" /> ยังไม่มีบัญชี? สมัครสมาชิกที่นี่
              </>
            ) : (
              <>
                <User className="w-4 h-4" /> มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ChangePassword({ onComplete }: { onComplete: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kruai_token')}`
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!resp.ok) throw new Error('เกิดข้อผิดพลาด');
      alert('เปลี่ยนรหัสผ่านสำเร็จ!');
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">เป็นการเข้าสู่ระบบครั้งแรก โปรดตั้งรหัสผ่านที่ต้องการเพื่อความปลอดภัย</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="รหัสผ่านใหม่"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
          />
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none"
          />
          {error && <p className="text-danger text-center font-bold text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );
}
