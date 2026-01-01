import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, Users, LogOut, History, Mail, ShieldAlert, Menu, X, CheckCircle, Settings, MessageSquare, Star } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Footer } from './Footer';
import { AnimatePresence, motion } from 'framer-motion';

import { useFactoryStatus } from '../context/FactoryStatusContext';

export const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            navigate('/admin');
        }
    }, [navigate]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/');
    };

    const { contactedCount } = useFactoryStatus();

    const navItems = [
        { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin/dashboard' },
        { icon: History, label: 'سجل التحليلات', path: '/admin/dashboard/inventions' },
        { icon: Upload, label: 'رفع الملفات', path: '/admin/dashboard/upload' },
        { icon: Users, label: 'إدارة المصانع', path: '/admin/dashboard/factories' },
        { icon: Mail, label: 'مصانع تم التواصل معها', path: '/admin/dashboard/contacted', badge: contactedCount },
        { icon: MessageSquare, label: 'ردود المصانع', path: '/admin/dashboard/responses' },
        { icon: Star, label: 'المصانع المعتمدة', path: '/admin/dashboard/certified' },
        { icon: CheckCircle, label: 'المصانع المتوافقة', path: '/admin/dashboard/approved' },
        { icon: Mail, label: 'إدارة الإيميلات', path: '/admin/dashboard/emails' },
        { icon: ShieldAlert, label: 'تكرار البيانات', path: '/admin/dashboard/deduplication' },
        { icon: Settings, label: 'الإعدادات', path: '/admin/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Estesnaa" className="w-8 h-8 rounded-lg bg-white" />
                    <h1 className="text-xl font-bold">استصناع</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </header>

            {/* Backdrop for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={clsx(
                    "w-64 bg-primary text-white fixed top-0 h-full shadow-xl z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:right-0",
                    isSidebarOpen ? "translate-x-0 right-0" : "translate-x-full right-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-blue-900 flex justify-between items-start">
                        <Link to="/" className="flex flex-col items-center gap-2 w-full group">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                                <img src="/logo.png" alt="Estesnaa" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">استصناع</h1>
                                <p className="text-blue-300 text-[10px] uppercase tracking-widest font-black">لوحة الإدارة</p>
                            </div>
                        </Link>
                        {/* Close button for Mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg absolute top-4 left-4"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-white/10 text-white font-bold shadow-sm"
                                            : "text-blue-100 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Icon size={20} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge ? (
                                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Footer */}
                    <div className="p-4 border-t border-blue-900">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 text-red-300 hover:text-red-100 w-full px-4 py-2 transition-colors rounded-lg hover:bg-red-500/10"
                        >
                            <LogOut size={20} />
                            <span>تسجيل خروج</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:mr-64 flex flex-col min-h-screen transition-all duration-300">
                <div className="flex-1 p-4 md:p-8">
                    <Outlet />
                </div>
                <div className="mt-auto">
                    <Footer />
                </div>
            </main>
        </div>
    );
};
