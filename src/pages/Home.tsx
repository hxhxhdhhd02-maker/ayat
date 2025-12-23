import { motion } from 'framer-motion';
import FloatingLetters from '../components/FloatingLetters';
import { ArrowRight, Star, Shield, Users, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen relative overflow-hidden ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
            <FloatingLetters />

            {/* Navigation */}
            <nav className="fixed w-full z-40 glass bg-white/50 dark:bg-slate-800/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl font-english">
                            M
                        </div>
                        <span className="font-bold text-xl text-slate-800 dark:text-white">Moallem</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                        >
                            تسجيل الدخول
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-24">
                <div className="max-w-7xl mx-auto px-6 py-12">

                    {/* Full Width Teacher Section */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">

                        {/* Teacher Image - Full Height */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-600 dark:border-blue-500">
                                <img
                                    src="/teacher.png"
                                    alt="مستر ايات نبيل"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute bottom-8 right-8 text-white text-right" dir="rtl">
                                    <h2 className="text-4xl font-black mb-2">Dr/ ايات نبيل</h2>
                                    <p className="text-xl text-blue-300 font-bold mb-1">خبيره اللغة الإنجليزية</p>
                                    <p className="text-white/90">معلمة معتمدة • +10 سنوات خبرة</p>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative z-10 order-1 lg:order-2"
                            dir="rtl"
                        >
                            <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-6">
                                ✨ منصة تعليمية متطورة
                            </span>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                                ابداً رحلة التفوق في
                                <span className="text-blue-600 dark:text-blue-400 relative inline-block mr-4">
                                    اللغة الإنجليزية
                                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-400 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                                    </svg>
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                تجربة تعليمية فريدة تجمع بين التكنولوجيا الحديثة وأساليب التدريس المبتكرة.
                                دروس تفاعلية، متابعة مستمرة، ومحتوى يضمن لك الدرجة النهائية.
                            </p>

                            <div className="flex flex-wrap gap-4 mb-8">
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3 group"
                                >
                                    <span>ابدأ الآن مجاناً</span>
                                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                </button>
                                <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all">
                                    تعرف علينا
                                </button>
                            </div>

                            <div className="flex items-center gap-8 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <span>+1000 طالب</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span>4.9 تقييم</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    <span>محتوى معتمد</span>
                                </div>
                            </div>
                        </motion.div>

                    </div>

                </div>
            </main>

        </div>
    );
}
