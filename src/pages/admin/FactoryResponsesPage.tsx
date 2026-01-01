import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { useFactoryStatus } from '../../context/FactoryStatusContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const FactoryResponsesPage = () => {
    const { } = useFactoryStatus();
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
                .select('id, name, email, city, country, factory_code, status')
                .in('status', ['approved', 'rejected']);

            if (error) throw error;
            setFactories(data || []);
        } catch (err) {
            console.error('Error fetching factories:', err);
        } finally {
            setLoading(false);
        }
    };

    const approvedFactories = factories.filter(f => f.status === 'approved');
    const rejectedFactories = factories.filter(f => f.status === 'rejected');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
            </div>
        );
    }

    const FactoryTable = ({ factories, type }: { factories: Factory[], type: 'approved' | 'rejected' }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className={`px-6 py-4 flex items-center gap-2 ${type === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                {type === 'approved' ? <CheckCircle className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
                <h3 className={`font-bold ${type === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                    {type === 'approved' ? 'المصانع الموافقة' : 'المصانع الرافضة'}
                </h3>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold">
                    {factories.length}
                </span>
            </div>
            {factories.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-medium">لا توجد مصانع في هذه القائمة</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">اسم المصنع</th>
                                <th className="px-8 py-4">البريد الإلكتروني</th>
                                <th className="px-8 py-4">المدينة / الدولة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {factories.map((f) => (
                                <tr key={f.id || f.factory_code} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 font-black text-gray-900">{f.name}</td>
                                    <td className="px-8 py-5 font-bold text-blue-600 text-sm">{f.email || '---'}</td>
                                    <td className="px-8 py-5 font-bold text-gray-500 text-sm">{f.city}, {f.country}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">ردود المصانع</h2>
                <p className="text-gray-500 text-sm mt-1">تتبع موافقات واعتذارات المصانع التي تم التواصل معها</p>
            </div>

            <FactoryTable factories={approvedFactories} type="approved" />
            <FactoryTable factories={rejectedFactories} type="rejected" />
        </div>
    );
};
