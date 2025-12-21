import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Factory as FactoryIcon, ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';

export const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '0000') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('كلمة المرور غير صحيحة');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col overflow-hidden relative" dir="rtl">
            {/* Animated 3D-like Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-10">
                        <motion.div
                            whileHover={{ rotate: 10 }}
                            className="inline-flex items-center justify-center p-4 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/20 mb-6"
                        >
                            <Shield size={40} />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">بوابة الإدارة</h1>
                        <p className="text-blue-300/60 font-medium uppercase tracking-[0.2em] text-xs">ESTESNAA SECURE ACCESS</p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-black text-blue-200/50 mr-2 uppercase tracking-widest">
                                    <Lock size={14} /> كلمة المرور السرية
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-16 px-6 bg-white/[0.05] border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-white text-xl tracking-widest ltr placeholder:text-white/10"
                                    placeholder="••••"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl text-red-400 text-sm text-center font-bold"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                دخول آمن
                                <ArrowLeft size={20} />
                            </button>
                        </form>
                    </div>

                    <motion.button
                        onClick={() => navigate('/')}
                        whileHover={{ x: 5 }}
                        className="mt-8 flex items-center gap-2 text-blue-300/40 hover:text-blue-300 font-black text-xs mx-auto transition-colors uppercase tracking-widest"
                    >
                        الموقع العام
                        <FactoryIcon size={14} />
                    </motion.button>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};
