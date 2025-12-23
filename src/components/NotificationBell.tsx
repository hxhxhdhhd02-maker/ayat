import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Notification = {
    id: string;
    student_id: string;
    type: 'wallet_credited' | 'course_enrolled' | 'general';
    title: string;
    message: string;
    amount?: number;
    read: boolean;
    created_at: string;
};

export default function NotificationBell({ studentId }: { studentId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [studentId]);

    async function loadNotifications() {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('student_id', '==', studentId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            // Sort in memory instead of using orderBy to avoid composite index requirement
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(notificationId: string) {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(n =>
                    updateDoc(doc(db, 'notifications', n.id), { read: true })
                )
            );
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute left-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white" dir="rtl">
                                        الإشعارات
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            تحديد الكل كمقروء
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400" dir="rtl">
                                            لا توجد إشعارات
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3" dir="rtl">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'wallet_credited'
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-blue-100 dark:bg-blue-900/30'
                                                        }`}>
                                                        {notification.type === 'wallet_credited' ? (
                                                            <span className="text-xl">💰</span>
                                                        ) : (
                                                            <span className="text-xl">📚</span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white mb-1">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                                            {notification.message}
                                                        </p>
                                                        {notification.amount && (
                                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                                                + {notification.amount} جنيه
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                            {new Date(notification.created_at).toLocaleString('ar-EG')}
                                                        </p>
                                                    </div>

                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="flex-shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                                                        >
                                                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
