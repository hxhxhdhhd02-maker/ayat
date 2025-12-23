import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, Course } from '../lib/firebase';
import { collection, query, where, getDocs, documentId, doc, updateDoc } from 'firebase/firestore';
import { User, Camera, Phone, GraduationCap, BookOpen, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileImageProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showInfo?: boolean;
}

export default function ProfileImage({ size = 'md', showInfo = true }: ProfileImageProps) {
    const { profile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [uploading, setUploading] = useState(false);

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    };

    async function loadCourses() {
        try {
            const enrollmentsQ = query(
                collection(db, 'student_enrollments'),
                where('student_id', '==', profile?.id)
            );
            const enrollmentsSnap = await getDocs(enrollmentsQ);
            const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

            if (courseIds.length > 0) {
                const coursesQ = query(collection(db, 'courses'), where(documentId(), 'in', courseIds));
                const coursesSnap = await getDocs(coursesQ);
                const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
                setEnrolledCourses(coursesData);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                await updateDoc(doc(db, 'profiles', profile.id), {
                    profile_image: base64String
                });
                window.location.reload();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('حدث خطأ أثناء رفع الصورة');
        } finally {
            setUploading(false);
        }
    }

    function handleClick() {
        if (showInfo) {
            loadCourses();
            setShowModal(true);
        }
    }

    return (
        <>
            <div className="relative group">
                <button
                    onClick={handleClick}
                    className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 hover:scale-105 transition-transform cursor-pointer`}
                >
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {profile?.profile_image ? (
                            <img src={profile.profile_image} alt={profile.full_name_arabic} className="w-full h-full object-cover" />
                        ) : (
                            <User className={`${size === 'xl' ? 'w-16 h-16' : size === 'lg' ? 'w-12 h-12' : 'w-6 h-6'} text-slate-400 dark:text-slate-600`} />
                        )}
                    </div>
                </button>

                {/* Upload Button */}
                {size === 'xl' && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl cursor-pointer shadow-lg transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            {/* Info Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 left-4 z-10 p-2 bg-white/10 hover:bg-white/20 dark:bg-slate-700/50 dark:hover:bg-slate-700 backdrop-blur-md rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-white dark:text-slate-300" />
                            </button>

                            {/* Header with Gradient */}
                            <div className="relative h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

                                {/* Profile Image */}
                                <div className="absolute -bottom-16 right-1/2 transform translate-x-1/2">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 shadow-2xl">
                                            <div className="w-full h-full rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {profile?.profile_image ? (
                                                    <img src={profile.profile_image} alt={profile.full_name_arabic} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload Button */}
                                        <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl cursor-pointer shadow-lg transition-colors">
                                            <Upload className="w-5 h-5" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-20 p-8">
                                {/* Name */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                                        {profile?.full_name_arabic}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400">طالب نشط</p>
                                </div>

                                {/* Info Cards */}
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    {/* Phone */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl p-4"
                                        dir="rtl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center">
                                                <Phone className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">رقم الهاتف</p>
                                                <p className="font-black text-slate-900 dark:text-white font-english">{profile?.phone_number}</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Grade */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-2xl p-4"
                                        dir="rtl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center">
                                                <GraduationCap className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">الصف الدراسي</p>
                                                <p className="font-black text-slate-900 dark:text-white">{profile?.grade?.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Courses */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 rounded-2xl p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4" dir="rtl">
                                        <div className="w-12 h-12 bg-green-600 dark:bg-green-500 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">الكورسات المشترك فيها</p>
                                            <p className="font-black text-2xl text-slate-900 dark:text-white">{enrolledCourses.length}</p>
                                        </div>
                                    </div>

                                    {enrolledCourses.length > 0 && (
                                        <div className="space-y-2">
                                            {enrolledCourses.map((course, index) => (
                                                <motion.div
                                                    key={course.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + index * 0.1 }}
                                                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between"
                                                    dir="rtl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span className="font-bold text-slate-900 dark:text-white">{course.title}</span>
                                                    </div>
                                                    <span className="text-xs px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full font-bold">
                                                        {course.price} ج.م
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {enrolledCourses.length === 0 && (
                                        <p className="text-center text-slate-500 dark:text-slate-400 py-4" dir="rtl">
                                            لم تشترك في أي كورس بعد
                                        </p>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
