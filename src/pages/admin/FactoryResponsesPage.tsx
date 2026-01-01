import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { useFactoryStatus } from '../../context/FactoryStatusContext';
import { Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export const FactoryResponsesPage = () => {
    const { refreshStatuses } = useFactoryStatus();
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingFactory, setDeletingFactory] = useState<Factory | null>(null);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [deleteAllType, setDeleteAllType] = useState<'approved' | 'rejected' | null>(null);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState('');

    useEffect(() => {
        fetchFactories();
    }, []);

    const fetchFactories = async () => {
        setLoading(true);
        try {
            // MANDATORY: BIGINT id and factory_status
            const { data, error } = await supabase
                .from('factories')
                .select('id, name, email, city, country, factory_status')
                .in('factory_status', ['approved', 'rejected']);

            if (error) throw error;
            setFactories(data || []);
        } catch (err) {
            console.error('Error fetching factory responses:', err);
        } finally {
            setLoading(false);
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
        if (deleteAllConfirm !== 'DELETE ALL' || !deleteAllType) return;
        try {
            const statusToDelete = deleteAllType;
            const idsToDelete = factories
                .filter(f => f.factory_status === statusToDelete)
                .map(f => f.id);

            if (idsToDelete.length === 0) return;

            const { error } = await supabase
                .from('factories')
                .delete()
                .in('id', idsToDelete);

            if (error) throw error;

            setFactories(prev => prev.filter(f => f.factory_status !== statusToDelete));
            setShowDeleteAllDialog(false);
            setDeleteAllConfirm('');
            setDeleteAllType(null);
            refreshStatuses();
        } catch (err) {
            console.error('Delete all error:', err);
        }
    };

    const approvedFactories = factories.filter(f => f.factory_status === 'approved');
    const rejectedFactories = factories.filter(f => f.factory_status === 'rejected');

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
            <div className={`px-6 py-4 flex items-center justify-between gap-2 ${type === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                    {type === 'approved' ? <CheckCircle className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
                    <h3 className={`font-bold ${type === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                        {type === 'approved' ? 'المصانع الموافقة' : 'المصانع الرافضة'}
                    </h3>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold">
                        {factories.length}
                    </span>
                </div>
                {factories.length > 0 && (
                    <button
                        onClick={() => {
                            setDeleteAllType(type);
                            setShowDeleteAllDialog(true);
                        }}
                        className="text-red-500 hover:text-red-700 bg-white/50 hover:bg-white px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                        <Trash2 size={14} />
                        مسح الكل
                    </button>
                )}
            </div>
            {factories.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-medium font-bold">لا توجد مصانع في هذه القائمة</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest text-right">
                            <tr>
                                <th className="px-8 py-4 text-right">#</th>
                                <th className="px-8 py-4 text-right">اسم المصنع</th>
                                <th className="px-8 py-4 text-right">البريد الإلكتروني</th>
                                <th className="px-8 py-4 text-right">المدينة / الدولة</th>
                                <th className="px-8 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {factories.map((f, idx) => (
                                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 text-gray-500 font-bold">{idx + 1}</td>
                                    <td className="px-8 py-5 font-black text-gray-900">{f.name}</td>
                                    <td className="px-8 py-5 font-bold text-blue-600 text-sm">{f.email || '---'}</td>
                                    <td className="px-8 py-5 font-bold text-gray-500 text-sm">{f.city}, {f.country}</td>
                                    <td className="px-8 py-5 text-center">
                                        <button
                                            onClick={() => setDeletingFactory(f)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all shadow-sm"
                                            title="حذف نهائي"
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

            <ConfirmDialog
                isOpen={!!deletingFactory}
                onClose={() => setDeletingFactory(null)}
                onConfirm={handleDeleteFactory}
                title="حذف مصنع نهائياً"
                message={`هل أنت متأكد من حذف "${deletingFactory?.name}"؟ سيتم حذفه من النظام بالكامل.`}
                confirmText="حذف نهائي"
            />

            <ConfirmDialog
                isOpen={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                onConfirm={handleDeleteAll}
                title={`مسح كل المصانع ${deleteAllType === 'approved' ? 'الموافقة' : 'الرافضة'}`}
                message="هل أنت متأكد من مسح جميع هذه المصانع نهائياً؟ هذا الإجراء لا يمكن التراجع عنه. اكتب DELETE ALL للتأكيد."
                confirmKeyword="DELETE ALL"
                confirmText="مسح الكل"
                keywordValue={deleteAllConfirm}
                onKeywordChange={setDeleteAllConfirm}
            />
        </div>
    );
};
