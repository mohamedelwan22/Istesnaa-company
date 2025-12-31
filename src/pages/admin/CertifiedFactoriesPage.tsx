import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { useFactoryStatus } from '../../context/FactoryStatusContext';
import { Loader2, Star } from 'lucide-react';

export const CertifiedFactoriesPage = () => {
    const { factoryStatuses } = useFactoryStatus();
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFactories();
    }, []);

    const fetchFactories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('factories')
                .select('id, name, email, city, country, factory_code, industry');

            if (error) throw error;
            setFactories(data || []);
        } catch (err) {
            console.error('Error fetching factories:', err);
        } finally {
            setLoading(false);
        }
    };

    const certifiedFactories = factories.filter(f => factoryStatuses[f.id || f.factory_code || ''] === 'certified');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Star className="text-yellow-500 fill-yellow-500" size={24} />
                        المصانع المعتمدة
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">قائمة المصانع التي تم اعتمادها رسمياً من قِبل الإدارة</p>
                </div>
                <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-sm font-bold border border-yellow-100">
                    إجمالي المعتمد: {certifiedFactories.length}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {certifiedFactories.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">لا توجد مصانع معتمدة حتى الآن</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">اسم المصنع</th>
                                    <th className="px-8 py-4">الصناعة</th>
                                    <th className="px-8 py-4">البريد الإلكتروني</th>
                                    <th className="px-8 py-4">الموقع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {certifiedFactories.map((f) => (
                                    <tr key={f.id || f.factory_code} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-gray-900">{f.name}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(f.industry) ? f.industry.map((ind, i) => (
                                                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                                        {ind}
                                                    </span>
                                                )) : '---'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-blue-600 text-sm">{f.email || '---'}</td>
                                        <td className="px-8 py-5 font-bold text-gray-500 text-sm">{f.city}, {f.country}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
