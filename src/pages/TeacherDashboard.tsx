import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { db, Course, Lecture, Profile, StudentEnrollment } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Search, Users, BookOpen, Video, FileText, LogOut, X, LayoutDashboard, Wallet, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentRequests from '../components/PaymentRequests';

type TabType = 'courses' | 'students' | 'payments';

export default function TeacherDashboard() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [studentProgress, setStudentProgress] = useState<Record<string, { totalLectures: number; completedLectures: number; unwatchedCount: number }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);



  useEffect(() => {
    if (profile?.role === 'teacher') {
      loadCourses();
      loadStudents();
    }
  }, [profile?.role]);

  // Loaders and handlers remain the same...
  async function loadCourses() {
    try {
      const q = query(collection(db, 'courses'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      // Sort in memory by created_at descending
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
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
    } catch (error) {
      console.error('Error loading lectures:', error);
    }
  }

  async function loadStudents() {
    try {
      const q = query(
        collection(db, 'profiles'),
        where('role', '==', 'student')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
      // Sort by created_at in memory instead
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setStudents(data);

      // Calculate progress for each student
      const progressData: Record<string, { totalLectures: number; completedLectures: number; unwatchedCount: number }> = {};

      for (const student of data) {
        // Get student enrollments
        const enrollmentsQ = query(
          collection(db, 'student_enrollments'),
          where('student_id', '==', student.id)
        );
        const enrollmentsSnap = await getDocs(enrollmentsQ);
        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

        if (courseIds.length === 0) {
          progressData[student.id] = { totalLectures: 0, completedLectures: 0, unwatchedCount: 0 };
          continue;
        }

        // Get all lectures for enrolled courses
        let totalLectures = 0;
        const allLectureIds: string[] = [];

        for (const courseId of courseIds) {
          const lecturesQ = query(
            collection(db, 'lectures'),
            where('course_id', '==', courseId)
          );
          const lecturesSnap = await getDocs(lecturesQ);
          totalLectures += lecturesSnap.docs.length;
          allLectureIds.push(...lecturesSnap.docs.map(doc => doc.id));
        }

        // Get completed lectures
        const progressQ = query(
          collection(db, 'lecture_progress'),
          where('student_id', '==', student.id),
          where('completed', '==', true)
        );
        const progressSnap = await getDocs(progressQ);
        const completedLectures = progressSnap.docs.length;

        progressData[student.id] = {
          totalLectures,
          completedLectures,
          unwatchedCount: totalLectures - completedLectures
        };
      }

      setStudentProgress(progressData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await addDoc(collection(db, 'courses'), {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        grade: formData.get('grade') as string,
        price: parseFloat(formData.get('price') as string),
        thumbnail_url: formData.get('thumbnail_url') as string,
        teacher_id: profile?.id,
        created_at: new Date().toISOString()
      });

      setShowCourseModal(false);
      loadCourses();
      form.reset();
      alert('✅ تم إنشاء الكورس بنجاح! الكورس الآن متاح للطلاب');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('حدث خطأ أثناء إنشاء الكورس');
    }
  }

  async function handleCreateLecture(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await addDoc(collection(db, 'lectures'), {
        course_id: selectedCourse?.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        youtube_url: formData.get('youtube_url') as string,
        pdf_url: formData.get('pdf_url') as string,
        order_index: lectures.length,
        duration_seconds: parseInt(formData.get('duration_seconds') as string) || 0,
        created_at: new Date().toISOString()
      });

      setShowLectureModal(false);
      if (selectedCourse) {
        loadLectures(selectedCourse.id);
      }
      form.reset();
      alert('✅ تم إضافة المحاضرة بنجاح! المحاضرة الآن متاحة للطلاب');
    } catch (error) {
      console.error('Error creating lecture:', error);
      alert('حدث خطأ أثناء إضافة المحاضرة');
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      loadCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('حدث خطأ أثناء حذف الكورس');
    }
  }

  async function handleDeleteLecture(lectureId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) return;

    try {
      await deleteDoc(doc(db, 'lectures', lectureId));
      if (selectedCourse) {
        loadLectures(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('حدث خطأ أثناء حذف المحاضرة');
    }
  }





  const filteredStudents = students.filter(s =>
    s.full_name_arabic.includes(searchTerm) ||
    s.phone_number.includes(searchTerm)
  );

  if (profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">هذه الصفحة متاحة للمدرسين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      <header className="glass bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg sticky top-0 z-30 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div dir="rtl" className="flex items-center justify-between md:block">
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                  لوحة التحكم
                </h1>
              </div>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 md:mr-10 text-right">{profile?.full_name_arabic}</p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-xl transition-all font-bold text-sm md:text-base"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl w-full md:w-fit mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'courses'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>الكورسات</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
          >
            <Users className="w-5 h-5" />
            <span>الطلاب</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
          >
            <Wallet className="w-5 h-5" />
            <span>طلبات الشحن</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {!selectedCourse ? (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white" dir="rtl">إدارة الكورسات ({courses.length})</h2>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={loadCourses}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden md:inline">تحديث</span>
                      </button>
                      <button
                        onClick={() => setShowCourseModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                      >
                        <Plus className="w-5 h-5" />
                        <span>كورس جديد</span>
                      </button>
                    </div>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                  >
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border border-white/50 dark:border-slate-700/50 group"
                      >
                        <div className="relative h-48 overflow-hidden">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-linear-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800"></div>
                          )}
                          <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-blue-600 dark:text-blue-400 font-bold shadow-sm">
                            {course.price} ج.م
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2" dir="rtl">{course.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-2 truncate" dir="rtl">{course.description}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-6 bg-blue-50 dark:bg-blue-900/30 w-fit px-3 py-1 rounded-lg">
                            {course.grade?.replace(/_/g, ' ')}
                          </p>

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                loadLectures(course.id);
                              }}
                              className="flex-1 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              <span>المحتوي</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors flex items-center gap-2 mb-2 md:mb-0"
                    >
                      ← العودة للكورسات
                    </button>
                    <div className="text-center w-full md:w-auto mb-4 md:mb-0">
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white" dir="rtl">{selectedCourse?.title}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">إدارة المحتوى ({lectures.length} محاضرة)</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                      <button
                        onClick={() => selectedCourse && loadLectures(selectedCourse.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden md:inline">تحديث</span>
                      </button>
                      <button
                        onClick={() => setShowLectureModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                      >
                        <Plus className="w-5 h-5" />
                        <span>محاضرة جديدة</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {lectures.map((lecture, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={lecture.id}
                        className="glass bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 md:p-6 border border-white/50 dark:border-slate-700/50"
                      >
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <div className="flex w-full md:w-auto justify-between md:justify-start items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
                              <span className="text-blue-600 dark:text-blue-400 font-black text-lg">{index + 1}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteLecture(lecture.id)}
                              className="flex md:hidden bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="flex-1 w-full">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2" dir="rtl">{lecture.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-4" dir="rtl">{lecture.description}</p>

                            <div className="flex flex-wrap gap-3">
                              <a
                                href={lecture.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-bold"
                              >
                                <Video className="w-4 h-4" />
                                <span>يوتيوب</span>
                              </a>
                              {lecture.pdf_url && (
                                <a
                                  href={lecture.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 md:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>PDF</span>
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLecture(lecture.id)}
                            className="hidden md:flex flex-shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white" dir="rtl">
                  الطلاب ({students.length})
                </h2>
                <button
                  onClick={loadStudents}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>تحديث</span>
                </button>
              </div>

              <div className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-6 mb-8 border border-white/50 dark:border-slate-700/50">
                <div className="relative">
                  <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن طالب بالاسم أو رقم الموبايل"
                    className="w-full pr-12 pl-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all dark:text-white dark:placeholder-slate-500"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="glass bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-6" dir="rtl">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            {student.full_name_arabic.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{student.full_name_arabic}</h3>
                            <span className="inline-block bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {student.grade?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span dir="ltr">{student.phone_number}</span>
                            <span className="text-xs text-slate-400 mr-auto">الطالب</span>
                          </div>
                          {student.parent_phone && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                              <Users className="w-4 h-4 text-green-500" />
                              <span dir="ltr">{student.parent_phone}</span>
                              <span className="text-xs text-slate-400 mr-auto">ولي الأمر</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Stats */}
                      {studentProgress[student.id] && studentProgress[student.id].totalLectures > 0 && (
                        <div className="flex flex-row md:flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-r border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pr-6 mt-2 md:mt-0">
                          <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                            <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-bold">تم مشاهدة</div>
                            <div className="text-lg font-black text-green-700 dark:text-green-300">
                              {studentProgress[student.id].completedLectures} <span className="text-xs text-green-500">/ {studentProgress[student.id].totalLectures}</span>
                            </div>
                          </div>

                          <div className={`flex-1 p-3 rounded-xl border text-center ${studentProgress[student.id].unwatchedCount > 0
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                            <div className={`text-xs mb-1 font-bold ${studentProgress[student.id].unwatchedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>لم يشاهد</div>
                            <div className={`text-lg font-black ${studentProgress[student.id].unwatchedCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
                              {studentProgress[student.id].unwatchedCount}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PaymentRequests />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {
        showCourseModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white" dir="rtl">كورس جديد</h3>
                <button onClick={() => setShowCourseModal(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4" dir="rtl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الكورس</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الصف الدراسي</label>
                    <select
                      name="grade"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                    >
                      <option value="اول_اعدادي">اول اعدادي</option>
                      <option value="تاني_اعدادي">تاني اعدادي</option>
                      <option value="تالت_اعدادي">تالت اعدادي</option>
                      <option value="اول_ثانوي">اول ثانوي</option>
                      <option value="تاني_ثانوي">تاني ثانوي</option>
                      <option value="تالت_ثانوي">تالت ثانوي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">السعر (جنيه)</label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رابط صورة الغلاف</label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30"
                >
                  إنشاء الكورس
                </button>
              </form>
            </motion.div>
          </div>
        )
      }

      {
        showLectureModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white" dir="rtl">محاضرة جديدة</h3>
                <button onClick={() => setShowLectureModal(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleCreateLecture} className="space-y-4" dir="rtl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان المحاضرة</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رابط اليوتيوب</label>
                  <input
                    type="url"
                    name="youtube_url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رابط ملف PDF</label>
                    <input
                      type="url"
                      name="pdf_url"
                      placeholder=" اختياري"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المدة (ثانية)</label>
                    <input
                      type="number"
                      name="duration_seconds"
                      min="0"
                      placeholder="مثال: 1800"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30"
                >
                  إضافة المحاضرة
                </button>
              </form>
            </motion.div>
          </div>
        )
      }


    </div >
  );
}
