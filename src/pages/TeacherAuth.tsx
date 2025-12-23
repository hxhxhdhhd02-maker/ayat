import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Phone, Lock } from 'lucide-react';

export default function TeacherAuth() {
  // بيانات المعلم المحفوظة
  const TEACHER_PHONE = '01228495250';
  const TEACHER_PASSWORD = 'y2081049';

  const [phone, setPhone] = useState(TEACHER_PHONE);
  const [password, setPassword] = useState(TEACHER_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  // تسجيل دخول تلقائي عند تحميل الصفحة
  useEffect(() => {
    const autoLogin = async () => {
      setLoading(true);
      try {
        await signIn(TEACHER_PHONE, TEACHER_PASSWORD);
        // سيتم التوجيه تلقائياً إلى لوحة التحكم
      } catch (err: any) {
        console.error('Auto-login failed:', err);
        // إذا فشل التسجيل التلقائي، سيظهر النموذج للمستخدم
        setLoading(false);
      }
    };

    autoLogin();
  }, [signIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(phone, password);
    } catch (err: any) {
      console.error('Teacher auth error:', err);

      // Handle specific Firebase errors
      let errorMessage = 'حدث خطأ، الرجاء المحاولة مرة أخرى';

      if (err.code === 'auth/too-many-requests') {
        errorMessage = '⚠️ تم حظر الوصول مؤقتاً بسبب محاولات تسجيل دخول كثيرة. الرجاء المحاولة بعد قليل (15-60 دقيقة) أو إعادة تعيين كلمة المرور.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = 'رقم الموبايل أو كلمة المرور غير صحيحة';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'رقم الموبايل غير صحيح';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
            <GraduationCap className="w-12 h-12 text-blue-800" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">لوحة تحكم المدرسة</h1>
          <p className="text-blue-200">الأستاذة آيات نبيل</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رقم الموبايل
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحميل...' : 'دخول'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-blue-200 hover:text-white transition-colors"
          >
            العودة لتسجيل دخول الطلاب
          </a>
        </div>
      </div>
    </div>
  );
}
