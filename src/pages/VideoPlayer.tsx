import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, Lecture } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { ArrowLeft, FileText, Settings } from 'lucide-react';

export default function VideoPlayer() {
  const { profile } = useAuth();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('default');
  const playerRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lectureId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (lectureId) {
      loadLecture(lectureId);
    }
  }, [lectureId]);

  useEffect(() => {
    if (lecture && profile) {
      startProgressTracking();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [lecture, profile]);

  async function loadLecture(id: string) {
    try {
      const docRef = doc(db, 'lectures', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLecture({ id: docSnap.id, ...docSnap.data() } as Lecture);
      }
    } catch (error) {
      console.error('Error loading lecture:', error);
    } finally {
      setLoading(false);
    }
  }

  function startProgressTracking() {
    progressIntervalRef.current = setInterval(() => {
      updateProgress();
    }, 10000);
  }

  async function updateProgress() {
    if (!lecture || !profile) return;

    try {
      const currentTime = getCurrentVideoTime();

      const q = query(
        collection(db, 'lecture_progress'),
        where('student_id', '==', profile.id),
        where('lecture_id', '==', lecture.id)
      );

      const snapshot = await getDocs(q);
      const existingDoc = !snapshot.empty ? snapshot.docs[0] : null;

      const existingData = existingDoc ? existingDoc.data() : null;
      const watchedSeconds = Math.max(existingData?.watched_seconds || 0, currentTime);
      const completed = lecture.duration_seconds > 0 && watchedSeconds >= lecture.duration_seconds * 0.9;

      if (existingDoc) {
        await updateDoc(doc(db, 'lecture_progress', existingDoc.id), {
          watched_seconds: watchedSeconds,
          completed: completed,
          last_watched_at: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'lecture_progress'), {
          student_id: profile.id,
          lecture_id: lecture.id,
          watched_seconds: watchedSeconds,
          completed: completed,
          last_watched_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  function getCurrentVideoTime(): number {
    return 0; // Implementation depends on player API
  }

  function getYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  function getEmbedUrl(url: string): string {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return url;

    const params = new URLSearchParams({
      autoplay: '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-800 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">المحاضرة غير موجودة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black">
          <div className="aspect-video w-full bg-gray-900 relative">
            <iframe
              ref={playerRef}
              src={getEmbedUrl(lecture.youtube_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>

            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-black/80 hover:bg-black text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm text-white rounded-lg p-4 min-w-[250px]">
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2" dir="rtl">سرعة التشغيل</h4>
                    <div className="space-y-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setPlaybackRate(rate);
                          }}
                          className={`w-full text-right px-3 py-2 rounded transition-colors ${playbackRate === rate
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-white/10'
                            }`}
                        >
                          {rate === 1 ? 'عادي' : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2" dir="rtl">الجودة</h4>
                    <div className="space-y-2">
                      {['auto', '144p', '240p', '360p', '480p', '720p', '1080p'].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`w-full text-right px-3 py-2 rounded transition-colors ${quality === q
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-white/10'
                            }`}
                        >
                          {q === 'auto' ? 'تلقائي' : q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1" dir="rtl">
              <h1 className="text-2xl font-bold mb-2">{lecture.title}</h1>
              {lecture.description && (
                <p className="text-gray-300 leading-relaxed">{lecture.description}</p>
              )}
            </div>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors ml-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>رجوع</span>
            </button>
          </div>

          {lecture.pdf_url && (
            <div className="bg-white/5 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3" dir="rtl">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">ملف المحاضرة</h3>
                    <p className="text-sm text-gray-400">ملف PDF للمراجعة</p>
                  </div>
                </div>
                <a
                  href={lecture.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  تحميل
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 text-white p-6">
          <div className="text-sm text-gray-400" dir="rtl">
            <p>نصائح للمشاهدة:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>يمكنك التحكم في سرعة الفيديو من إعدادات المشغل</li>
              <li>اضغط على أيقونة الإعدادات لتغيير جودة الفيديو</li>
              <li>يتم حفظ تقدمك تلقائياً كل 10 ثوان</li>
              <li>لتحميل ملف PDF، اضغط على زر التحميل أعلاه</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
