import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, PaymentRequest } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ArrowLeft, Upload, Wallet, Phone, DollarSign, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WalletRecharge() {
    const { profile } = useAuth();
    const [amount, setAmount] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const VODAFONE_CASH_NUMBER = '01011765924';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!screenshot || !amount || !senderPhone || !profile) {
            alert('برجاء ملء جميع البيانات');
            return;
        }

        setLoading(true);

        try {
            // Convert image to base64 for storage
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result as string;

                const paymentRequest: Omit<PaymentRequest, 'id'> = {
                    student_id: profile.id,
                    student_name: profile.full_name_arabic,
                    amount: parseFloat(amount),
                    sender_phone: senderPhone,
                    screenshot_url: base64Image,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                };

                await addDoc(collection(db, 'payment_requests'), paymentRequest);

                setSuccess(true);
                setAmount('');
                setSenderPhone('');
                setScreenshot(null);
                setScreenshotPreview('');

                setTimeout(() => {
                    window.history.back();
                }, 2000);
            };
            reader.readAsDataURL(screenshot);
        } catch (error) {
            console.error('Error submitting payment request:', error);
            alert('حدث خطأ أثناء إرسال الطلب');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center max-w-md"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3" dir="rtl">
                        تم إرسال الطلب بنجاح!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300" dir="rtl">
                        سيتم مراجعة طلبك وإضافة الرصيد خلال دقائق
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-6">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div dir="rtl">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">شحن المحفظة</h1>
                        <p className="text-slate-500 dark:text-slate-400">أضف رصيد لشراء الكورسات</p>
                    </div>
                </div>

                {/* Current Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 mb-8 text-white"
                >
                    <div className="flex items-center justify-between" dir="rtl">
                        <div>
                            <p className="text-blue-100 mb-2">رصيدك الحالي</p>
                            <p className="text-4xl font-black">{profile?.wallet_balance || 0} جنيه</p>
                        </div>
                        <Wallet className="w-16 h-16 text-blue-300" />
                    </div>
                </motion.div>

                {/* Payment Instructions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 border border-slate-200 dark:border-slate-700"
                >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6" dir="rtl">
                        خطوات الشحن
                    </h2>

                    <div className="space-y-4" dir="rtl">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                1
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white mb-1">حول المبلغ عبر فودافون كاش</p>
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-xl">
                                    <Phone className="w-5 h-5 text-red-600" />
                                    <span className="font-bold text-lg text-slate-900 dark:text-white font-english">{VODAFONE_CASH_NUMBER}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                2
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                                التقط صورة (سكرين شوت) لعملية التحويل
                            </p>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                3
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                                املأ البيانات أدناه وأرفق الصورة
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700"
                >
                    <div className="space-y-6" dir="rtl">

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                المبلغ المحول (جنيه)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="مثال: 100"
                                    required
                                    min="1"
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Sender Phone */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                رقم الموبايل المرسل منه
                            </label>
                            <div className="relative">
                                <Phone className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    value={senderPhone}
                                    onChange={(e) => setSenderPhone(e.target.value)}
                                    placeholder="01xxxxxxxxx"
                                    required
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Screenshot Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                صورة التحويل (سكرين شوت)
                            </label>

                            {!screenshotPreview ? (
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-600 dark:text-slate-300 font-bold mb-1">اضغط لرفع الصورة</p>
                                        <p className="text-sm text-slate-400">PNG, JPG حتى 10MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        required
                                    />
                                </label>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={screenshotPreview}
                                        alt="Screenshot preview"
                                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScreenshot(null);
                                            setScreenshotPreview('');
                                        }}
                                        className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>جاري الإرسال...</span>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5" />
                                    <span>إرسال الطلب</span>
                                </>
                            )}
                        </button>

                    </div>
                </motion.form>

            </div>
        </div>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
