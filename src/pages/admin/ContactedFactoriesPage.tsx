import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { useFactoryStatus } from '../../context/FactoryStatusContext';
import { Loader2, Mail, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export const ContactedFactoriesPage = () => {
    const { refreshStatuses } = useFactoryStatus();
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingFactory, setDeletingFactory] = useState<Factory | null>(null);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
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
                .select('id, name, email, city, country, industry, factory_status, is_contacted')
                .eq('is_contacted', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setFactories(data || []);
        } catch (err) {
            console.error('Error fetching factories:', err);
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

    const contactedFactories = factories;

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
                        <Mail className="text-blue-600" size={24} />
                        المصانع التي تم التواصل معها
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">قائمة بالمصانع التي هي الآن في مرحلة التواصل والمتابعة</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                        قيد التواصل: {contactedFactories.length}
                    </div>
                    {contactedFactories.length > 0 && (
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {contactedFactories.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">لا توجد مصانع قيد التواصل حالياً</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">اسم المصنع</th>
                                    <th className="px-8 py-4">الصناعة</th>
                                    <th className="px-8 py-4">البريد الإلكتروني</th>
                                    <th className="px-8 py-4">الموقع</th>
                                    <th className="px-8 py-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contactedFactories.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
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

            <ConfirmDialog
                isOpen={!!deletingFactory}
                onClose={() => setDeletingFactory(null)}
                onConfirm={handleDeleteFactory}
                title="حذف مصنع"
                message={`هل أنت متأكد من حذف "${deletingFactory?.name}"؟ سيتم حذفه نهائياً من قاعدة البيانات.`}
                confirmText="حذف نهائي"
            />

            <ConfirmDialog
                isOpen={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                onConfirm={handleDeleteAll}
                title="مسح كل المصانع التي تم التواصل معها"
                message="هل أنت متأكد من مسح جميع هذه المصانع؟ هذا الإجراء لا يمكن التراجع عنه. اكتب DELETE ALL للتأكيد."
                confirmKeyword="DELETE ALL"
                confirmText="مسح الكل"
                keywordValue={deleteAllConfirm}
                onKeywordChange={setDeleteAllConfirm}
            />
        </div>
    );
};
