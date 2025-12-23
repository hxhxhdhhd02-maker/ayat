import { useEffect, useState } from 'react';
import { db, PaymentRequest } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, Clock, DollarSign, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentRequests() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        try {
            const q = query(
                collection(db, 'payment_requests'),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
            setRequests(data);
        } catch (error) {
            console.error('Error loading payment requests:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(request: PaymentRequest) {
        if (!confirm(`هل تريد قبول طلب الشحن بمبلغ ${request.amount} جنيه للطالب ${request.student_name}؟`)) {
            return;
        }

        try {
            // Update payment request status
            await updateDoc(doc(db, 'payment_requests', request.id), {
                status: 'approved',
                processed_at: new Date().toISOString(),
                processed_by: profile?.id
            });

            // Get student profile and update wallet
            const studentDoc = await getDocs(
                query(collection(db, 'profiles'), where('__name__', '==', request.student_id))
            );

            if (!studentDoc.empty) {
                const studentData = studentDoc.docs[0].data();
                const currentBalance = studentData.wallet_balance || 0;
                const newBalance = currentBalance + request.amount;

                await updateDoc(doc(db, 'profiles', request.student_id), {
                    wallet_balance: newBalance
                });

                // Create notification for student
                await addDoc(collection(db, 'notifications'), {
                    student_id: request.student_id,
                    type: 'wallet_credited',
                    title: 'تم شحن محفظتك بنجاح! 🎉',
                    message: `تم إضافة ${request.amount} جنيه إلى محفظتك. رصيدك الحالي: ${newBalance} جنيه`,
                    amount: request.amount,
                    read: false,
                    created_at: new Date().toISOString()
                });

                alert(`تم قبول الطلب وإضافة ${request.amount} جنيه للمحفظة بنجاح!`);
                loadRequests();
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('حدث خطأ أثناء قبول الطلب');
        }
    }

    async function handleReject(request: PaymentRequest) {
        if (!confirm(`هل تريد رفض طلب الشحن للطالب ${request.student_name}؟`)) {
            return;
        }

        try {
            await updateDoc(doc(db, 'payment_requests', request.id), {
                status: 'rejected',
                processed_at: new Date().toISOString(),
                processed_by: profile?.id
            });

            alert('تم رفض الطلب');
            loadRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('حدث خطأ أثناء رفض الطلب');
        }
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Pending Requests */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-orange-500" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white" dir="rtl">
                        طلبات الشحن المعلقة ({pendingRequests.length})
                    </h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="glass bg-white/60 dark:bg-slate-800/60 rounded-3xl p-12 text-center border border-white/50 dark:border-slate-700/50">
                        <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400" dir="rtl">
                            لا توجد طلبات معلقة حالياً
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingRequests.map((request) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-900/30 hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                    {/* Screenshot Preview */}
                                    <div
                                        className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setSelectedImage(request.screenshot_url)}
                                    >
                                        <img
                                            src={request.screenshot_url}
                                            alt="Screenshot"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Request Details */}
                                    <div className="flex-1 w-full">
                                        <div className="grid grid-cols-2 gap-4 mb-4" dir="rtl">
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-blue-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">اسم الطالب</p>
                                                    <p className="font-bold text-slate-800 dark:text-white">{request.student_name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">المبلغ</p>
                                                    <p className="font-black text-2xl text-green-600 dark:text-green-400">{request.amount} ج.م</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Phone className="w-5 h-5 text-purple-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">رقم المرسل</p>
                                                    <p className="font-bold text-slate-800 dark:text-white font-english">{request.sender_phone}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-orange-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">التاريخ</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {new Date(request.created_at).toLocaleDateString('ar-EG')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleApprove(request)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                <span>قبول وإضافة للمحفظة</span>
                                            </button>
                                            <button
                                                onClick={() => handleReject(request)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                <span>رفض</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6" dir="rtl">
                        الطلبات المعالجة
                    </h2>

                    <div className="grid gap-3">
                        {processedRequests.map((request) => (
                            <div
                                key={request.id}
                                className={`glass bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-white/50 dark:border-slate-700/50 ${request.status === 'approved' ? 'opacity-60' : 'opacity-40'
                                    }`}
                            >
                                <div className="flex items-center justify-between" dir="rtl">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${request.status === 'approved'
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-red-100 dark:bg-red-900/30'
                                            }`}>
                                            {request.status === 'approved' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{request.student_name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {request.amount} ج.م • {new Date(request.created_at).toLocaleDateString('ar-EG')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-lg font-bold text-sm ${request.status === 'approved'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                        {request.status === 'approved' ? 'تم القبول' : 'تم الرفض'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-4xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Screenshot full view"
                            className="w-full h-auto rounded-2xl shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                            إغلاق
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
