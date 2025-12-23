import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, Course, Lecture, LectureProgress } from '../lib/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { BookOpen, Award, Calendar, ArrowLeft, Download, Star, Trophy, Target, PlayCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import FloatingLetters from '../components/FloatingLetters';
import ProfileImage from '../components/ProfileImage';

type CourseWithProgress = Course & {
    totalLectures: number;
    completedLectures: number;
};

export default function StudentProfile() {
    const { profile, signOut } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [completedCourses, setCompletedCourses] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            loadStats();
        }
    }, [profile]);

    async function loadStats() {
        try {
            const enrollmentsQ = query(
                collection(db, 'student_enrollments'),
                where('student_id', '==', profile?.id)
            );
            const enrollmentsSnap = await getDocs(enrollmentsQ);
            const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

            setTotalCourses(courseIds.length);

            if (courseIds.length > 0) {
                const coursesQ = query(collection(db, 'courses'), where(documentId(), 'in', courseIds));
                const coursesSnap = await getDocs(coursesQ);
                const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));

                // Load progress for each course
                const coursesWithProgress = await Promise.all(
                    coursesData.map(async (course) => {
                        const lecturesQ = query(collection(db, 'lectures'), where('course_id', '==', course.id));
                        const lecturesSnap = await getDocs(lecturesQ);
                        const lecturesData = lecturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
                        const lectureIds = lecturesData.map(l => l.id);

                        let completedCount = 0;
                        if (lectureIds.length > 0) {
                            const progressQ = query(
                                collection(db, 'lecture_progress'),
                                where('student_id', '==', profile?.id),
                                where('completed', '==', true)
                            );
                            const progressSnap = await getDocs(progressQ);
                            const progressData = progressSnap.docs
                                .map(doc => doc.data() as LectureProgress)
                                .filter(p => lectureIds.includes(p.lecture_id));

                            completedCount = progressData.length;
                        }

                        return {
                            ...course,
                            totalLectures: lecturesData.length,
                            completedLectures: completedCount
                        };
                    })
                );

                setEnrolledCourses(coursesWithProgress);
                setCompletedCourses(coursesWithProgress.filter(c => c.completedLectures === c.totalLectures && c.totalLectures > 0).length);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleCourseClick(courseId: string) {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
        // The course will be opened in the dashboard
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const achievements = [
        { icon: <Trophy className="w-6 h-6" />, title: 'طالب متميز', description: 'أكمل 5 كورسات', color: 'from-yellow-500 to-orange-500' },
        { icon: <Star className="w-6 h-6" />, title: 'نجم الشهر', description: 'الأكثر نشاطاً', color: 'from-purple-500 to-pink-500' },
        { icon: <Target className="w-6 h-6" />, title: 'هدف محقق', description: 'وصل للدرجة النهائية', color: 'from-green-500 to-emerald-500' },
    ];

    const progressPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 relative">
            <FloatingLetters />

            {/* Cover Section */}
            <div className="relative">
                <div className="h-72 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">رجوع</span>
                    </button>
                </div>

                {/* Profile Card */}
                <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-slate-700/50"
                    >
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar with Upload */}
                            <ProfileImage size="xl" showInfo={false} />

                            {/* Info */}
                            <div className="flex-1 text-center md:text-right" dir="rtl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                                            {profile?.full_name_arabic}
                                        </h1>
                                        <p className="text-lg text-slate-600 dark:text-slate-300">
                                            {profile?.grade?.replace(/_/g, ' ')} • طالب نشط
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            signOut().then(() => {
                                                window.location.href = '/';
                                            });
                                        }}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold transition-all border border-red-100 dark:border-red-900/30"
                                    >
                                        تسجيل الخروج
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-slate-700 dark:text-slate-300">
                                            انضم في {new Date(profile?.created_at || '').toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {totalCourses} كورس
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4">
                                <div className="text-center px-6 py-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl">
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalCourses}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">الكورسات</p>
                                </div>
                                <div className="text-center px-6 py-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-2xl">
                                    <p className="text-3xl font-black text-green-600 dark:text-green-400">{completedCourses}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">مكتمل</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3" dir="rtl">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">التقدم الإجمالي</span>
                                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"
                                ></motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Achievements */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-6 border border-white/50 dark:border-slate-700/50"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2" dir="rtl">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <span>الإنجازات</span>
                        </h2>

                        <div className="space-y-4">
                            {achievements.map((achievement, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r ${achievement.color}`}
                                >
                                    <div className="relative z-10 flex items-center gap-3" dir="rtl">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                                            {achievement.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white mb-1">{achievement.title}</p>
                                            <p className="text-sm text-white/80">{achievement.description}</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* My Courses */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-6 border border-white/50 dark:border-slate-700/50"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6" dir="rtl">
                            كورساتي ({enrolledCourses.length})
                        </h2>

                        {enrolledCourses.length === 0 ? (
                            <div className="text-center py-16">
                                <BookOpen className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-lg text-slate-500 dark:text-slate-400" dir="rtl">
                                    لم تشترك في أي كورس بعد
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {enrolledCourses.map((course, index) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                        onClick={() => handleCourseClick(course.id)}
                                        className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all cursor-pointer"
                                    >
                                        <div className="h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
                                            {course.thumbnail_url && (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1" dir="rtl">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3" dir="rtl">
                                                {course.description}
                                            </p>

                                            {/* Progress */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-xs mb-1" dir="rtl">
                                                    <span className="text-slate-600 dark:text-slate-300">التقدم</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {course.totalLectures > 0 ? Math.round((course.completedLectures / course.totalLectures) * 100) : 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${course.totalLectures > 0 ? (course.completedLectures / course.totalLectures) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                        <PlayCircle className="w-3 h-3" />
                                                        {course.totalLectures}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {course.completedLectures}
                                                    </span>
                                                </div>
                                                <span className="text-slate-400">{course.price} ج.م</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Certificates */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-3 glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-6 border border-white/50 dark:border-slate-700/50"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2" dir="rtl">
                            <Award className="w-6 h-6 text-yellow-500" />
                            <span>الشهادات ({completedCourses})</span>
                        </h2>

                        {completedCourses === 0 ? (
                            <div className="text-center py-16">
                                <Award className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-lg text-slate-500 dark:text-slate-400" dir="rtl">
                                    أكمل كورساتك للحصول على الشهادات
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-4">
                                {Array.from({ length: completedCourses }).map((_, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, rotateY: 90 }}
                                        animate={{ opacity: 1, rotateY: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                        className="relative group"
                                    >
                                        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/30 rounded-2xl p-6 border-2 border-yellow-300 dark:border-yellow-700 hover:shadow-2xl hover:scale-105 transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <Award className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                                                <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full font-bold">
                                                    معتمد ✓
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white mb-2 text-lg" dir="rtl">
                                                شهادة إتمام
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4" dir="rtl">
                                                كورس اللغة الإنجليزية {index + 1}
                                            </p>
                                            <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
                                                <Download className="w-4 h-4" />
                                                <span>تحميل الشهادة</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
