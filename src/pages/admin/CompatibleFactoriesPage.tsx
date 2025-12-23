import { useEffect, useState } from 'react';
import { Search, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export const CompatibleFactoriesPage = () => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [unapprovingFactory, setUnapprovingFactory] = useState<Factory | null>(null);

    useEffect(() => {
        fetchApprovedFactories();
    }, []);

    const fetchApprovedFactories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('factories')
                .select('*')
                .eq('approved', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setFactories(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnapproveFactory = async () => {
        if (!unapprovingFactory) return;

        try {
            const { error } = await supabase
                .from('factories')
                .update({ approved: false })
                .eq(unapprovingFactory.id ? 'id' : 'factory_code', unapprovingFactory.id || unapprovingFactory.factory_code);

            if (error) {
                alert('حدث خطأ: ' + error.message);
            } else {
                setFactories(prev => prev.filter(f =>
                    (f.id && f.id !== unapprovingFactory.id) ||
                    (f.factory_code && f.factory_code !== unapprovingFactory.factory_code)
                ));
                setUnapprovingFactory(null);
            }
        } catch (err) {
            console.error('Unapprove error:', err);
        }
    };

    const filteredFactories = factories.filter(f =>
        (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.industry || []).some(i => (i || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CheckCircle className="text-green-600" />
                        المصانع المتوافقة (المعتمدة)
                    </h2>
                    <p className="text-gray-600 mt-1">
                        قائمة المصانع المعتمدة التي سيتم إجراء التحليل عليها فقط.
                    </p>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-green-700 font-bold">
                    العدد: {factories.length}
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="بحث في المصانع المعتمدة..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            {loading ? (
                <div className="text-center py-12">جاري التحميل...</div>
            ) : filteredFactories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">لا توجد مصانع معتمدة حالياً.</p>
                    <p className="text-sm text-gray-400 mt-2">قم باعتماد المصانع من صفحة "إدارة المصانع" أولاً.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-green-50 text-gray-700">
                            <tr>
                                <th className="p-4 w-16">#</th>
                                <th className="p-4">اسم المصنع</th>
                                <th className="p-4">المجال</th>
                                <th className="p-4">الدولة</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredFactories.map((factory, index) => (
                                <tr key={factory.id || index} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-500 font-medium">{index + 1}</td>
                                    <td className="p-4 font-bold text-gray-800">{factory.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{factory.industry?.join(', ')}</td>
                                    <td className="p-4 text-sm text-gray-600">{factory.country}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setUnapprovingFactory(factory)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-bold transition-colors"
                                            title="إلغاء الاعتماد (إزالة من القائمة)"
                                        >
                                            <XCircle size={14} />
                                            إلغاء الاعتماد
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!unapprovingFactory}
                onClose={() => setUnapprovingFactory(null)}
                onConfirm={handleUnapproveFactory}
                title="إلغاء اعتماد المصنع"
                message={`هل أنت متأكد من إلغاء اعتماد "${unapprovingFactory?.name}"؟ سيتم إزالته من قائمة التحليل ولكنه سيبقى في قاعدة البيانات.`}
                confirmText="إلغاء الاعتماد"
            />
        </div>
    );
};
