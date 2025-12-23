import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, Profile } from '../lib/firebase';

export default function SetupAdmin() {
    const [status, setStatus] = useState<'checking' | 'creating' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('جاري التحقق من حساب المشرف...');

    useEffect(() => {
        setupAdminAccount();
    }, []);

    async function setupAdminAccount() {
        const phone = '01228495250';
        const password = 'y2081049';
        const email = `${phone}@platform.local`;

        try {
            setStatus('checking');
            setMessage('🔍 جاري التحقق من حساب المشرف...');

            // Try to create the account
            setStatus('creating');
            setMessage('📝 جاري إنشاء حساب المشرف...');

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const profileData: Profile = {
                    id: user.uid,
                    phone_number: phone,
                    full_name_arabic: 'د/ آيات نبيل',
                    grade: 'all',
                    role: 'teacher',
                    wallet_balance: 0,
                    created_at: new Date().toISOString()
                };

                await setDoc(doc(db, 'profiles', user.uid), profileData);

                setStatus('success');
                setMessage('✅ تم إنشاء حساب المشرف بنجاح!');

                // Sign out and redirect to teacher login
                await auth.signOut();

                setTimeout(() => {
                    window.location.href = '/teacher-login';
                }, 2000);

            } catch (createError: any) {
                if (createError.code === 'auth/email-already-in-use') {
                    // Account exists, that's fine
                    setStatus('success');
                    setMessage('✅ حساب المشرف موجود بالفعل!');

                    setTimeout(() => {
                        window.location.href = '/teacher-login';
                    }, 2000);
                } else {
                    throw createError;
                }
            }

        } catch (error: any) {
            console.error('Setup error:', error);
            setStatus('error');
            setMessage('❌ حدث خطأ: ' + error.message);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
                <div className="mb-6">
                    {status === 'checking' && (
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-800 mx-auto"></div>
                    )}
                    {status === 'creating' && (
                        <div className="animate-pulse">
                            <div className="text-6xl mb-4">📝</div>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="text-6xl mb-4 animate-bounce">✅</div>
                    )}
                    {status === 'error' && (
                        <div className="text-6xl mb-4">❌</div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-4" dir="rtl">
                    إعداد حساب المشرف
                </h1>

                <p className="text-lg text-slate-600 mb-6" dir="rtl">
                    {message}
                </p>

                {status === 'success' && (
                    <p className="text-sm text-slate-500" dir="rtl">
                        سيتم توجيهك إلى صفحة تسجيل الدخول...
                    </p>
                )}

                {status === 'error' && (
                    <button
                        onClick={setupAdminAccount}
                        className="bg-blue-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                )}
            </div>
        </div>
    );
}
