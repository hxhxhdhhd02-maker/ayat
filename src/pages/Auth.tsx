import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { GraduationCap, Phone, Lock, User, Sun, Moon } from 'lucide-react';
import FloatingLetters from '../components/FloatingLetters';
import { motion } from 'framer-motion';

const GRADES = [
  'اول_اعدادي',
  'تاني_اعدادي',
  'تالت_اعدادي',
  'اول_ثانوي',
  'تاني_ثانوي',
  'تالت_ثانوي'
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(phone, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('الرجاء إدخال الاسم');
        }
        await signUp(phone, password, fullName, grade);
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Auth error:', err);

      let errorMessage = 'حدث خطأ، الرجاء المحاولة مرة أخرى';

      if (err.code === 'auth/too-many-requests') {
        errorMessage = '⚠️ تم حظر الوصول مؤقتاً بسبب محاولات تسجيل دخول كثيرة. الرجاء المحاولة بعد قليل (15-60 دقيقة) أو إعادة تعيين كلمة المرور.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = 'رقم الموبايل أو كلمة المرور غير صحيحة';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'رقم الموبايل غير صحيح';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'هذا الرقم مسجل بالفعل. الرجاء تسجيل الدخول';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      <FloatingLetters />

      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-lg"
      >
        {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-slate-700" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 transform rotate-3"
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 font-english">Moallem</h1>
          <p className="text-slate-500 dark:text-slate-400">بوابتك للتفوق في اللغة الإنجليزية</p>
        </div>

        <div className="glass bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50 backdrop-blur-xl">
          <div className="flex gap-2 mb-6 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${isLogin
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${!isLogin
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الاسم بالعربي
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all dark:text-white dark:placeholder-slate-500"
                    placeholder="أدخل اسمك الكامل"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                رقم الموبايل
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all dark:text-white dark:placeholder-slate-500"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الصف الدراسي
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all dark:text-white"
                  required={!isLogin}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all dark:text-white dark:placeholder-slate-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحميل...' : isLogin ? 'دخول' : 'إنشاء حساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8 max-w-xs mx-auto">
          منصة تعليمية متخصصة في تدريس اللغة الإنجليزية للمراحل الإعدادية والثانوية
        </p>
      </motion.div>
    </div>
  );
}
