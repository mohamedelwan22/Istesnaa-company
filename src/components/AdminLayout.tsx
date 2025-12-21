import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, Users, LogOut, History, Mail, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';
import { Footer } from './Footer';

export const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin/dashboard' },
        { icon: History, label: 'سجل التحليلات', path: '/admin/dashboard/inventions' },
        { icon: Upload, label: 'رفع الملفات', path: '/admin/dashboard/upload' },
        { icon: Users, label: 'إدارة المصانع', path: '/admin/dashboard/factories' },
        { icon: Mail, label: 'إدارة الإيميلات', path: '/admin/dashboard/emails' },
        { icon: ShieldAlert, label: 'تكرار البيانات', path: '/admin/dashboard/deduplication' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white fixed h-full shadow-xl z-10">
                <Link to="/" className="block p-6 border-b border-blue-900 transition-colors hover:bg-white/5 group">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                            <img src="/logo.png" alt="Estesnaa" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold">استصناع</h1>
                        <p className="text-blue-300 text-[10px] uppercase tracking-widest font-black">لوحة الإدارة</p>
                    </div>
                </Link>

                <nav className="p-4 space-y-2">
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
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-blue-900">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-red-300 hover:text-red-100 w-full px-4 py-2 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>تسجيل خروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8 flex flex-col">
                <div className="flex-1">
                    <Outlet />
                </div>
                <div className="mt-20">
                    <Footer />
                </div>
            </main>
        </div>
    );
};
