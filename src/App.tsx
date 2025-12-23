import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import TeacherAuth from './pages/TeacherAuth';
import SetupAdmin from './pages/SetupAdmin';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import VideoPlayer from './pages/VideoPlayer';
import Home from './pages/Home';
import WalletRecharge from './pages/WalletRecharge';
import StudentProfile from './pages/StudentProfile';

function App() {
  const { user, profile, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Make admin creation function available in console
    // To create admin account, open browser console and run: createAdminAccount()
    import('./seedAdmin').then(module => {
      (window as any).createAdminAccount = module.createAdminAccount;
      console.log('💡 لإنشاء حساب المشرف، اكتب في الكونسول: createAdminAccount()');
    });

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Routing Logic
  const renderContent = () => {
    if (currentPath === '/' || currentPath === '') return <Home />;

    // Setup admin route (no auth required)
    if (currentPath === '/setup-admin') return <SetupAdmin />;

    if (!user || !profile) {
      if (currentPath === '/login') return <Auth />;
      if (currentPath === '/teacher-login') return <TeacherAuth />;
      // Redirect to home if trying to access restricted pages without auth
      if (currentPath === '/') return <Home />;
      // Default valid authorized entry is handled below, so for unauthorized user:
      return <Home />;
    }

    if (currentPath === '/dashboard') {
      return profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
    }

    if (currentPath === '/wallet-recharge') {
      return profile.role === 'student' ? <WalletRecharge /> : <StudentDashboard />;
    }

    if (currentPath === '/profile') {
      return profile.role === 'student' ? <StudentProfile /> : <StudentDashboard />;
    }

    if (currentPath.startsWith('/video/')) {
      return <VideoPlayer />;
    }

    // Default fallback for logged in users
    return profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
  };

  return renderContent();
}

export default App;
