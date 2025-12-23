import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Plus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletDropdown() {
    const { profile } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg"
            >
                <Wallet className="w-6 h-6 text-white" />
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
                            className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                        >
                            {/* Header with Balance */}
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-green-100">رصيد المحفظة</p>
                                    <TrendingUp className="w-5 h-5 text-green-200" />
                                </div>
                                <p className="text-4xl font-black mb-1">{profile?.wallet_balance || 0}</p>
                                <p className="text-green-100 text-sm">جنيه مصري</p>
                            </div>

                            {/* Actions */}
                            <div className="p-4 space-y-3">
                                <button
                                    onClick={() => {
                                        window.history.pushState({}, '', '/wallet-recharge');
                                        window.dispatchEvent(new PopStateEvent('popstate'));
                                        setShowDropdown(false);
                                    }}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>شحن المحفظة</span>
                                </button>

                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4" dir="rtl">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white mb-1">
                                                كيف تشحن محفظتك؟
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                حول المبلغ عبر فودافون كاش ثم ارفع صورة التحويل
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2" dir="rtl">
                                        آخر نشاط
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm" dir="rtl">
                                            <span className="text-slate-600 dark:text-slate-300">شراء كورس</span>
                                            <span className="text-red-600 dark:text-red-400 font-bold">-150 ج.م</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm" dir="rtl">
                                            <span className="text-slate-600 dark:text-slate-300">شحن محفظة</span>
                                            <span className="text-green-600 dark:text-green-400 font-bold">+200 ج.م</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
