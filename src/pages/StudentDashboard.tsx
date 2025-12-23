import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db, Course, StudentEnrollment, Lecture, LectureProgress } from '../lib/firebase';
import { collection, query, where, getDocs, documentId, addDoc, doc, updateDoc } from 'firebase/firestore';
import { BookOpen, PlayCircle, CheckCircle, Clock, ShoppingCart, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import FloatingLetters from '../components/FloatingLetters';
import NotificationBell from '../components/NotificationBell';
import WalletDropdown from '../components/WalletDropdown';
import ProfileImage from '../components/ProfileImage';

type CourseWithProgress = Course & {
  enrollment?: StudentEnrollment;
  totalLectures: number;
  completedLectures: number;
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [progress, setProgress] = useState<LectureProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadCourses();
      loadEnrolledCourses();
    }
  }, [profile]);

  // ... (keeping existing functions unchanged for brevity in this replacement block, but ensuring indentation)
  async function loadCourses() {
    try {
      const q = query(
        collection(db, 'courses'),
        where('grade', '==', profile?.grade)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));

      // Sort in memory instead of using orderBy to avoid composite index requirement
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const coursesWithProgress = data.map(course => ({
        ...course,
        totalLectures: 0,
        completedLectures: 0
      }));

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  async function loadEnrolledCourses() {
    try {
      const q = query(
        collection(db, 'student_enrollments'),
        where('student_id', '==', profile?.id)
      );
      const enrollmentsSnap = await getDocs(q);
      const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEnrollment));

      const courseIds = enrollments.map(e => e.course_id);

      if (courseIds.length === 0) {
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      const coursesQ = query(collection(db, 'courses'), where(documentId(), 'in', courseIds));
      const coursesSnap = await getDocs(coursesQ);
      const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));

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
            completedLectures: completedCount,
            enrollment: enrollments.find(e => e.course_id === course.id)
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      setLoading(false);
    }
  }

  async function loadLectures(courseId: string) {
    try {
      const q = query(
        collection(db, 'lectures'),
        where('course_id', '==', courseId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
      // Sort in memory instead of using orderBy to avoid composite index requirement
      data.sort((a, b) => a.order_index - b.order_index);
      setLectures(data);

      const progressQ = query(
        collection(db, 'lecture_progress'),
        where('student_id', '==', profile?.id)
      );
      const progressSnap = await getDocs(progressQ);
      const progressData = progressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LectureProgress));
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading lectures:', error);
    }
  }

  async function handlePurchaseCourse(course: Course) {
    if (!profile) return;

    if (profile.wallet_balance < course.price) {
      alert('عفواً، لا يوجد رصيد كافي في المحفظة. برجاء شحن المحفظة أولاً.');
      return;
    }

    if (!confirm(`هل تريد شراء كورس "${course.title}" بسعر ${course.price} جنيه؟`)) {
      return;
    }

    try {
      // Deduct from wallet
      const newBalance = profile.wallet_balance - course.price;
      await updateDoc(doc(db, 'profiles', profile.id), {
        wallet_balance: newBalance
      });

      // Create enrollment
      await addDoc(collection(db, 'student_enrollments'), {
        student_id: profile.id,
        course_id: course.id,
        activated_by: 'self_purchase',
        activated_at: new Date().toISOString(),
        expires_at: null
      });

      alert('تم شراء الكورس بنجاح! يمكنك الآن الوصول إلى جميع المحاضرات.');

      // Reload data
      window.location.reload();
    } catch (error) {
      console.error('Error purchasing course:', error);
      alert('حدث خطأ أثناء شراء الكورس');
    }
  }

  function handleVideoClick(lectureId: string) {
    window.history.pushState({}, '', `/video/${lectureId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  async function toggleLectureCompletion(lectureId: string, currentStatus: boolean) {
    if (!profile) return;

    try {
      const progressQ = query(
        collection(db, 'lecture_progress'),
        where('student_id', '==', profile.id),
        where('lecture_id', '==', lectureId)
      );
      const snapshot = await getDocs(progressQ);

      if (!snapshot.empty) {
        await updateDoc(doc(db, 'lecture_progress', snapshot.docs[0].id), {
          completed: !currentStatus,
          last_watched_at: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'lecture_progress'), {
          student_id: profile.id,
          lecture_id: lectureId,
          watched_seconds: 0,
          completed: true,
          last_watched_at: new Date().toISOString()
        });
      }

      if (selectedCourse) {
        loadLectures(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error toggling lecture completion:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'} relative`}>
      <FloatingLetters />

      {/* Simplified Header */}
      <header className="glass bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg sticky top-0 z-30 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/profile');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors"
                dir="rtl"
              >
                <ProfileImage size="md" showInfo={true} />
                <div className="text-right hidden sm:block">
                  <h1 className="text-lg font-black text-slate-800 dark:text-white">
                    {profile?.full_name_arabic}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.grade?.replace(/_/g, ' ')}</p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              {/* Notification Bell */}
              <NotificationBell studentId={profile?.id || ''} />

              {/* Wallet Dropdown */}
              <WalletDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {!selectedCourse ? (
          <div>
            {/* Enrolled Courses */}
            {enrolledCourses.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white" dir="rtl">
                    كورساتي
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 mr-2">({enrolledCourses.length})</span>
                  </h2>
                  <button
                    onClick={loadEnrolledCourses}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-colors shadow-lg hover:shadow-green-500/30 text-sm md:text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>تحديث</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setSelectedCourse(course);
                        loadLectures(course.id);
                      }}
                      className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border border-blue-200 dark:border-blue-900 cursor-pointer group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-slate-800">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-blue-400 dark:text-blue-600" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>مشترك</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2" dir="rtl">{course.title}</h3>

                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <PlayCircle className="w-4 h-4" />
                            {course.completedLectures} / {course.totalLectures} محاضرة
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${course.totalLectures > 0 ? (course.completedLectures / course.totalLectures) * 100 : 0}%` }}
                          ></div>
                        </div>

                        <button
                          className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 dark:group-hover:bg-blue-500"
                        >
                          <span>الدخول للكورس</span>
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white" dir="rtl">
                  الكورسات المتاحة
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400 mr-2">({courses.filter(c => !enrolledCourses.find(ec => ec.id === c.id)).length})</span>
                </h2>
                <button
                  onClick={() => {
                    loadCourses();
                    loadEnrolledCourses();
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-colors shadow-lg hover:shadow-blue-500/30 text-sm md:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>تحديث</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(c => !enrolledCourses.find(ec => ec.id === c.id))
                  .map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -5 }}
                      className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border border-white/50 dark:border-slate-700/50 group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl">
                          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{course.price} ج.م</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2" dir="rtl">{course.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 line-clamp-2" dir="rtl">{course.description}</p>

                        <button
                          onClick={() => handlePurchaseCourse(course)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>شراء الكورس</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Course Details */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors"
                >
                  ← العودة للكورسات
                </button>
                <button
                  onClick={() => selectedCourse && loadLectures(selectedCourse.id)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg hover:shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>تحديث المحاضرات</span>
                </button>
              </div>
              <div className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-8 border border-white/50 dark:border-slate-700/50">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2" dir="rtl">{selectedCourse.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4" dir="rtl">{selectedCourse.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    {lectures.length} محاضرة
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.round(lectures.reduce((acc, l) => acc + l.duration_seconds, 0) / 60)} دقيقة
                  </span>
                </div>
              </div>
            </div>

            {/* Lectures List */}
            <div className="space-y-4">
              {lectures.map((lecture, index) => {
                const lectureProgress = progress.find(p => p.lecture_id === lecture.id);
                const isCompleted = lectureProgress?.completed || false;

                return (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border-2 ${isCompleted
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400'
                        : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                        }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-black text-lg">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2" dir="rtl">{lecture.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4" dir="rtl">{lecture.description}</p>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleVideoClick(lecture.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm font-bold"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>مشاهدة</span>
                          </button>
                          {lecture.pdf_url && (
                            <a
                              href={lecture.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>PDF</span>
                            </a>
                          )}
                          <button
                            onClick={() => toggleLectureCompletion(lecture.id, isCompleted)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold ${isCompleted
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{isCompleted ? 'تم المشاهدة' : 'حدد كمشاهد'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
