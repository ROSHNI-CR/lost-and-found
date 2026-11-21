import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, User as UserIcon, BookOpen, Hash, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const HITK_DEPARTMENTS = [
    { code: 'CSE', name: 'Computer Science & Engineering (CSE)' },
    { code: 'IT', name: 'Information Technology (IT)' },
    { code: 'ECE', name: 'Electronics & Communication Engg. (ECE)' },
    { code: 'EE', name: 'Electrical Engineering (EE)' },
    { code: 'AEIE', name: 'Applied Electronics & Instrumentation (AEIE)' },
    { code: 'ME', name: 'Mechanical Engineering (ME)' },
    { code: 'CE', name: 'Civil Engineering (CE)' },
    { code: 'ChE', name: 'Chemical Engineering (ChE)' },
    { code: 'BT', name: 'Biotechnology (BT)' },
    { code: 'CSBS', name: 'Computer Science & Business Systems (CSBS)' },
    { code: 'CSE-AI&ML', name: 'CSE (Artificial Intelligence & Machine Learning)' },
    { code: 'CSE-DS', name: 'CSE (Data Science)' },
    { code: 'CSE-IoT', name: 'CSE (IoT & Cyber Security)' },
    { code: 'MCA', name: 'Master of Computer Applications (MCA)' },
    { code: 'MBA', name: 'Master of Business Administration (MBA)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        department,
        student_id: studentId || undefined
      });
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        <div className="text-center space-y-2">
          <img
            src="/hitk_logo.png"
            alt="HITK Logo"
            className="w-14 h-14 object-contain mx-auto rounded-xl p-1 bg-white border border-slate-200 shadow-md"
          />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create HITK Account
          </h2>
          <p className="text-xs text-slate-500">
            Heritage Institute of Technology Smart Lost & Found Network
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Email Address (@heritageit.edu.in) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name.dept26@heritageit.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Official HITK student or faculty email preferred</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password (min 6 characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HITK Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {HITK_DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Roll / College ID
              </label>
              <input
                type="text"
                placeholder="12623001001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="student">Student / Campus Member</option>
              <option value="admin">Campus Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-full text-sm font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#4338ca] hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};
