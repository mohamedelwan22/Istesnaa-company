import { Routes, Route, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { UploadPage, FactoriesPage, InventionsPage, EmailsPage, DeduplicationPage } from './admin';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Factory as FactoryIcon, Lightbulb, TrendingUp, History, Package, MapPin, Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        factories: 0,
        inventions: 0,
        recentInventions: [] as any[],
        batches: [] as any[],
        industries: [] as { name: string, count: number }[],
        cities: [] as { name: string, count: number }[],
        topMatched: [] as { name: string, count: number }[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Get total factories
            const { count: factoryCount } = await supabase
                .from('factories')
                .select('*', { count: 'exact', head: true });

            // Get total inventions
            const { count: inventionCount } = await supabase
                .from('inventions')
                .select('*', { count: 'exact', head: true });

            // Get recent analysis requests
            const { data: recent } = await supabase
                .from('inventions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 3. Get all factory metadata for charts (paginate through 4k+ records)
            let allFactories: any[] = [];
            let fFrom = 0;
            let fTo = 999;
            let fHasMore = true;

            while (fHasMore) {
                const { data, error: fErr } = await supabase
                    .from('factories')
                    .select('batch_name, industry, city')
                    .range(fFrom, fTo);

                if (fErr) break;
                if (data && data.length > 0) {
                    allFactories = [...allFactories, ...data];
                    if (data.length < 1000) fHasMore = false;
                    else { fFrom += 1000; fTo += 1000; }
                } else fHasMore = false;
            }

            // Compute Batches
            const batchCounts = allFactories.reduce((acc: any, curr: any) => {
                const name = curr.batch_name || 'غير مصنف';
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});

            const sortedBatches = Object.entries(batchCounts)
                .map(([name, count]) => ({ name, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4);

            // Compute Industries
            const indCounts = allFactories.reduce((acc: any, curr: any) => {
                if (Array.isArray(curr.industry)) {
                    curr.industry.forEach((ind: string) => {
                        acc[ind] = (acc[ind] || 0) + 1;
                    });
                }
                return acc;
            }, {});

            const sortedIndustries = Object.entries(indCounts)
                .map(([name, count]) => ({ name, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Compute Cities
            const cityCounts = allFactories.reduce((acc: any, curr: any) => {
                const name = curr.city || 'غير محدد';
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});

            const sortedCities = Object.entries(cityCounts)
                .map(([name, count]) => ({ name, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Get Top Matched Factories from Invention history
            const { data: matchedData } = await supabase.from('inventions').select('analysis_result');
            const matchCounts: Record<string, number> = {};

            (matchedData || []).forEach(row => {
                if (Array.isArray(row.analysis_result)) {
                    row.analysis_result.forEach((f: any) => {
                        if (f.name) {
                            matchCounts[f.name] = (matchCounts[f.name] || 0) + 1;
                        }
                    });
                }
            });

            const sortedTopMatched = Object.entries(matchCounts)
                .map(([name, count]) => ({ name, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setStats({
                factories: factoryCount || 0,
                inventions: inventionCount || 0,
                recentInventions: recent || [],
                batches: sortedBatches,
                industries: sortedIndustries,
                cities: sortedCities,
                topMatched: sortedTopMatched
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">نظرة عامة على العمليات</h2>
                <button
                    onClick={fetchStats}
                    className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition shadow-sm"
                >
                    تحديث البيانات
                </button>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                            <FactoryIcon size={32} />
                        </div>
                        <h3 className="text-blue-100 text-lg font-medium">إجمالي المصانع المسجلة</h3>
                        <p className="text-5xl font-extrabold mt-2 tracking-tight">
                            {stats.factories.toLocaleString()}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
                            <TrendingUp size={16} />
                            <span>نمو مستمر في قاعدة البيانات</span>
                        </div>
                    </div>
                    <FactoryIcon className="absolute -bottom-10 -right-10 text-white/10 w-48 h-48 group-hover:rotate-12 transition-transform duration-500" />
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-br from-purple-600 to-pink-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                            <Lightbulb size={32} />
                        </div>
                        <h3 className="text-purple-100 text-lg font-medium">طلبات التحليل المكتملة</h3>
                        <p className="text-5xl font-extrabold mt-2 tracking-tight">
                            {stats.inventions.toLocaleString()}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-purple-100 text-sm">
                            <TrendingUp size={16} />
                            <span>تفاعل مرتفع مع محرك البحث</span>
                        </div>
                    </div>
                    <Lightbulb className="absolute -bottom-10 -right-10 text-white/10 w-48 h-48 group-hover:-rotate-12 transition-transform duration-500" />
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <History className="text-blue-600" size={22} />
                            <h3 className="font-bold text-gray-800">أحدث عمليات التحليل</h3>
                        </div>
                        <button
                            onClick={() => navigate('/admin/dashboard/inventions')}
                            className="text-sm text-blue-600 hover:underline font-medium"
                        >
                            عرض الكل
                        </button>
                    </div>
                    <div className="p-6">
                        {stats.recentInventions.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentInventions.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-blue-100 hover:bg-blue-50/30 transition shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                {inv.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{inv.name}</h4>
                                                <p className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleString('ar-SA')}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                                            {inv.industry}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">لا توجد عمليات تحليل حتى الآن</div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                            <Package className="text-purple-600" size={22} />
                            <h3 className="font-bold text-gray-800">توزيع المصانع (المجموعات)</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {stats.batches.map((batch, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 truncate max-w-[150px]">{batch.name}</span>
                                        <span className="font-bold text-blue-600">{batch.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(batch.count / stats.factories) * 100}%` }}
                                            className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                            <TrendingUp className="text-green-600" size={22} />
                            <h3 className="font-bold text-gray-800">أقوى الصناعات المسجلة</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {stats.industries.map((ind, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-transparent hover:border-green-200 transition">
                                    <span className="text-sm font-medium text-gray-700 truncate mr-2">{ind.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">({ind.count})</span>
                                        <div className="w-12 bg-green-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-green-600 h-full"
                                                style={{ width: `${(ind.count / stats.factories) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                            <MapPin className="text-orange-600" size={22} />
                            <h3 className="font-bold text-gray-800">توزيع المصانع حسب المدن</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {stats.cities.map((city, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="text-xs font-bold text-gray-400 w-24 truncate text-left">{city.name}</div>
                                        <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(city.count / stats.factories) * 100}%` }}
                                                className="h-full bg-orange-500"
                                            />
                                        </div>
                                        <div className="text-xs font-bold text-orange-600">{city.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                            <Star className="text-yellow-500" size={22} />
                            <h3 className="font-bold text-gray-800">أكثر المصانع ترشيحاً</h3>
                        </div>
                        <div className="p-6">
                            {stats.topMatched.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.topMatched.map((f, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                    #{idx + 1}
                                                </div>
                                                <span className="text-sm text-gray-700 truncate max-w-[140px]">{f.name}</span>
                                            </div>
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {f.count} ترشيح
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">لا توجد بيانات كافية</div>
                            )}
                        </div>
                    </div>

                    {/* Quick Link Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg text-white">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Search size={18} />
                            بحث سريـع
                        </h4>
                        <p className="text-xs text-gray-400 mb-4">انتقل بسرعة لإدارة أي مصنع بالاسم</p>
                        <button
                            onClick={() => navigate('/admin/dashboard/factories')}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition font-medium border border-white/5"
                        >
                            فتح صفحة البحث
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard = () => {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="factories" element={<FactoriesPage />} />
                <Route path="inventions" element={<InventionsPage />} />
                <Route path="emails" element={<EmailsPage />} />
                <Route path="deduplication" element={<DeduplicationPage />} />
            </Route>
        </Routes>
    );
};
