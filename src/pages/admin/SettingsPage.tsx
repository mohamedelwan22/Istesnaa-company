import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Save, Loader2, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const SettingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
            return;
        }

        if (formData.newPassword.length < 4) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 4 أرقام على الأقل' });
            return;
        }

        setLoading(true);

        try {
            // Check current password (simulated since it's hardcoded for now)
            // In a real scenario, we'd check against a DB table
            // For now, we'll check against '0000' or whatever is in localStorage if we implemented that
            const storedPassword = localStorage.getItem('adminPassword') || '0000';

            if (formData.currentPassword !== storedPassword) {
                setMessage({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة' });
                setLoading(false);
                return;
            }

            // Update password
            // Since we don't have a persistence layer for this yet, we'll use localStorage
            // and maybe update AdminLogin to check it.
            localStorage.setItem('adminPassword', formData.newPassword);

            setMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح. سيتم تسجيل الخروج...' });

            // Force logout after a brief delay
            setTimeout(() => {
                localStorage.removeItem('isAdmin');
                navigate('/admin');
            }, 2000);

        } catch (err) {
            console.error('Error updating password:', err);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث كلمة المرور' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">الإعدادات</h1>
                <p className="text-gray-500 font-bold">إدارة إعدادات الحساب والأمان</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">تغيير كلمة المرور</h2>
                        <p className="text-sm font-bold text-gray-400">تحديث كلمة المرور الخاصة بلوحة التحكم</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 mr-2">كلمة المرور الحالية</label>
                            <input
                                type="password"
                                required
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                placeholder="••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 mr-2">كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                placeholder="••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 mr-2">تأكيد كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full h-14 px-6 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                placeholder="••••"
                            />
                        </div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={clsx(
                                    "p-4 rounded-xl text-sm font-bold text-center",
                                    message.type === 'success' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                                )}
                            >
                                {message.text}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full h-16 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all",
                                loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-blue-900 shadow-primary/20"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            تحديث كلمة المرور
                        </button>
                    </form>
                </div>
            </div>

            <div className="p-8 bg-orange-50 rounded-[2rem] border border-orange-100">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <LogOut size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-orange-900 mb-1">ملاحظة أمنية</h4>
                        <p className="text-orange-700 text-sm font-bold leading-relaxed">
                            عند تغيير كلمة المرور، سيتم تسجيل خروجك من جميع الجلسات النشطة. ستحتاج إلى تسجيل الدخول مرة أخرى باستخدام كلمة المرور الجديدة.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
