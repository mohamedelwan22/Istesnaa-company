import { useEffect, useState } from 'react';
import { Search, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useFactoryStatus } from '../../context/FactoryStatusContext';

export const CompatibleFactoriesPage = () => {
    const { refreshStatuses, updateStatus } = useFactoryStatus();
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [unapprovingFactory, setUnapprovingFactory] = useState<Factory | null>(null);
    const [deletingFactory, setDeletingFactory] = useState<Factory | null>(null);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState('');

    useEffect(() => {
        fetchApprovedFactories();
    }, []);

    const fetchApprovedFactories = async () => {
        setLoading(true);
        try {
            // MANDATORY: BIGINT id and factory_status
            const { data, error } = await supabase
                .from('factories')
                .select('*')
                .eq('factory_status', 'approved')
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
            await updateStatus(unapprovingFactory.id, 'contacted');
            setFactories(prev => prev.filter(f => f.id !== unapprovingFactory.id));
            setUnapprovingFactory(null);
        } catch (err) {
            console.error('Unapprove error:', err);
        }
    };

    const handleDeleteFactory = async () => {
        if (!deletingFactory) return;

        try {
            const { error } = await supabase
                .from('factories')
                .delete()
                .eq('id', deletingFactory.id);

            if (error) throw error;

            setFactories(prev => prev.filter(f => f.id !== deletingFactory.id));
            setDeletingFactory(null);
            refreshStatuses();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleDeleteAll = async () => {
        if (deleteAllConfirm !== 'DELETE ALL') return;
        try {
            const idsToDelete = factories.map(f => f.id);
            if (idsToDelete.length === 0) return;

            const { error } = await supabase
                .from('factories')
                .delete()
                .in('id', idsToDelete);

            if (error) throw error;
            setFactories([]);
            setShowDeleteAllDialog(false);
            setDeleteAllConfirm('');
            refreshStatuses();
        } catch (err) {
            console.error('Delete all error:', err);
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
                <div className="flex items-center gap-4">
                    <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-green-700 font-bold">
                        العدد: {factories.length}
                    </div>
                    {factories.length > 0 && (
                        <button
                            onClick={() => setShowDeleteAllDialog(true)}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            مسح الكل
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="بحث في المصانع المعتمدة..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            {loading ? (
                <div className="text-center py-12">جاري التحميل...</div>
            ) : filteredFactories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 font-bold">لا توجد مصانع معتمدة حالياً.</p>
                    <p className="text-sm text-gray-400 mt-2">قم باعتماد المصانع من صفحة "إدارة المصانع" أولاً.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-green-50 text-gray-700">
                            <tr>
                                <th className="p-4 w-16 text-xs font-black uppercase tracking-widest text-right">#</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-right">اسم المصنع</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-right">المجال</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-right">الدولة</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredFactories.map((factory, index) => (
                                <tr key={factory.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-500 font-medium">{index + 1}</td>
                                    <td className="p-4 font-bold text-gray-800">{factory.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{Array.isArray(factory.industry) ? factory.industry.join(', ') : '---'}</td>
                                    <td className="p-4 text-sm text-gray-600 font-medium">{factory.country}</td>
                                    <td className="p-4 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setUnapprovingFactory(factory)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-yellow-200 text-yellow-600 rounded-lg hover:bg-yellow-50 text-xs font-bold transition-colors"
                                            title="إلغاء الاعتماد (البقاء في النظام)"
                                        >
                                            <XCircle size={14} />
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={() => setDeletingFactory(factory)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-bold transition-colors"
                                            title="حذف نهائي من النظام"
                                        >
                                            <Trash2 size={14} />
                                            حذف
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

            <ConfirmDialog
                isOpen={!!deletingFactory}
                onClose={() => setDeletingFactory(null)}
                onConfirm={handleDeleteFactory}
                title="حذف مصنع نهائياً"
                message={`هل أنت متأكد من حذف "${deletingFactory?.name}"؟ سيتم حذفه من النظام بالكامل ولا يمكن استرجاعه.`}
                confirmText="حذف نهائي"
            />

            <ConfirmDialog
                isOpen={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                onConfirm={handleDeleteAll}
                title="مسح كل المصانع المتوافقة"
                message="هل أنت متأكد من مسح جميع المصانع المتوافقة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه. اكتب DELETE ALL للتأكيد."
                confirmKeyword="DELETE ALL"
                confirmText="مسح الكل"
                keywordValue={deleteAllConfirm}
                onKeywordChange={setDeleteAllConfirm}
            />
        </div>
    );
};
