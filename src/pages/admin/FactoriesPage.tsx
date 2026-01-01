import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { FactoryFormModal } from '../../components/FactoryFormModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
    Search, Trash2, Edit, Plus, Trash, ChevronDown, ChevronUp,
    Loader2, MessageSquare, Check, X, Star
} from 'lucide-react';
import { useFactoryStatus } from '../../context/FactoryStatusContext';

export const FactoriesPage = () => {
    const { getStatus, updateStatus } = useFactoryStatus();
    const [batches, setBatches] = useState<{ id: string, name: string, count: number, loadedFactories?: Factory[] }[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [visibleBatchCount, setVisibleBatchCount] = useState(10);
    const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState('');
    const [deletingFactory, setDeletingFactory] = useState<Factory | null>(null);
    const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
    const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);

    useEffect(() => {
        fetchBatchMetadata();
    }, []);

    const fetchBatchMetadata = async () => {
        setLoadingBatches(true);
        try {
            // Fetch batch info for all factories (selective columns only)
            const { data, error } = await supabase
                .from('factories')
                .select('batch_id, batch_name');

            if (error) throw error;

            if (data) {
                // Group by batch_id
                const counts: Record<string, { name: string, count: number }> = {};
                data.forEach(f => {
                    const id = f.batch_id || 'no-batch';
                    if (!counts[id]) {
                        counts[id] = { name: f.batch_name || 'مصانع بدون مجموعة', count: 0 };
                    }
                    counts[id].count++;
                });

                const batchList = Object.entries(counts).map(([id, info]) => ({
                    id,
                    name: info.name,
                    count: info.count
                }));

                setBatches(batchList);
            }
        } catch (err) {
            console.error('Error fetching batches:', err);
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchFactoriesInBatch = async (batchId: string) => {
        if (batches.find(b => b.id === batchId)?.loadedFactories) return;

        setLoadingBatchId(batchId);
        try {
            const columns = 'id, name, email, industry, city, country, batch_id, batch_name, approved, factory_code, status, created_at';

            let query = supabase
                .from('factories')
                .select(columns);

            if (batchId === 'no-batch') {
                query = query.is('batch_id', null);
            } else {
                query = query.eq('batch_id', batchId);
            }

            let { data, error } = await query.order('name', { ascending: true });

            if (error && error.code === '42703') {
                // Column 'status' doesn't exist, retry without it
                const fallbackColumns = 'id, name, email, industry, city, country, batch_id, batch_name, approved, factory_code, created_at';
                let fallbackQuery = supabase.from('factories').select(fallbackColumns);
                if (batchId === 'no-batch') {
                    fallbackQuery = fallbackQuery.is('batch_id', null);
                } else {
                    fallbackQuery = fallbackQuery.eq('batch_id', batchId);
                }
                const fallbackResult = await fallbackQuery.order('name', { ascending: true });
                data = fallbackResult.data as any; // Cast to avoid strict status requirement
                error = fallbackResult.error;
            }

            if (error) throw error;

            setBatches(prev => prev.map(b =>
                b.id === batchId ? { ...b, loadedFactories: (data as any) || [] } : b
            ));
        } catch (err) {
            console.error('Error fetching factories for batch:', err);
        } finally {
            setLoadingBatchId(null);
        }
    };

    const toggleBatchExpand = async (batchId: string) => {
        setExpandedBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchId)) {
                next.delete(batchId);
            } else {
                next.add(batchId);
            }
            return next;
        });

        const batch = batches.find(b => b.id === batchId);
        if (batch && !batch.loadedFactories) {
            await fetchFactoriesInBatch(batchId);
        }
    };

    // CRUD Operations
    const handleDeleteFactory = async () => {
        if (!deletingFactory) return;

        try {
            let query = supabase.from('factories').delete();
            if (deletingFactory.id) query = query.eq('id', deletingFactory.id);
            else if (deletingFactory.factory_code) query = query.eq('factory_code', deletingFactory.factory_code);
            else return;

            const { error } = await query;
            if (error) throw error;

            setBatches(prev => prev.map(b => ({
                ...b,
                count: b.id === (deletingFactory.batch_id || 'no-batch') ? b.count - 1 : b.count,
                loadedFactories: b.loadedFactories?.filter(f =>
                    f.id !== deletingFactory.id && f.factory_code !== deletingFactory.factory_code
                )
            })));
            setDeletingFactory(null);
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleDeleteBatch = async () => {
        if (!deletingBatchId) return;

        try {
            let query = supabase.from('factories').delete();
            if (deletingBatchId === 'no-batch') {
                query = query.is('batch_id', null);
            } else {
                query = query.eq('batch_id', deletingBatchId);
            }

            const { error } = await query;
            if (error) throw error;

            setBatches(prev => prev.filter(b => b.id !== deletingBatchId));
            setDeletingBatchId(null);
        } catch (err) {
            console.error('Delete batch error:', err);
        }
    };

    const handleDeleteAll = async () => {
        if (deleteAllConfirm !== 'DELETE ALL') return;
        try {
            const { error } = await supabase
                .from('factories')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

            if (error) throw error;
            setBatches([]);
            setShowDeleteAllDialog(false);
            setDeleteAllConfirm('');
        } catch (err) {
            console.error('Delete all error:', err);
        }
    };

    const filteredBatches = batches.filter(b =>
        (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.loadedFactories?.some(f => (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const visibleBatches = filteredBatches.slice(0, visibleBatchCount);
    const hasMore = visibleBatches.length < filteredBatches.length;

    const batchOptions = batches.filter(b => b.id !== 'no-batch').map(b => ({ id: b.id, name: b.name }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">إدارة المصانع</h2>
                    <div className="flex gap-4 text-sm mt-1">
                        <p className="text-gray-600">
                            إجمالي المجموعات: <span className="font-semibold text-blue-600">{batches.length}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    <Plus size={20} />
                    إضافة مصنع يدوياً
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="بحث عن مجموعة أو مصنع محمل..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowDeleteAllDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold"
                    >
                        <Trash size={18} />
                        مسح جميع البيانات
                    </button>
                </div>
            </div>

            {loadingBatches ? (
                <div className="text-center py-12 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-gray-500 font-bold">جاري تحميل المجموعات...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {visibleBatches.map((batch) => {
                        const isExpanded = expandedBatches.has(batch.id);
                        const isLoadingFactories = loadingBatchId === batch.id;

                        return (
                            <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                                <div
                                    className="bg-gray-50/50 px-8 py-5 flex justify-between items-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                                    onClick={() => toggleBatchExpand(batch.id)}
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{batch.name}</h3>
                                        <p className="text-sm font-bold text-gray-500 mt-0.5">{batch.count} مصنع في هذه المجموعة</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setDeletingBatchId(batch.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="حذف المجموعة"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary font-black text-sm border-r pr-6 border-gray-200">
                                            {isExpanded ? 'إخفاء' : 'عرض المصانع'}
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {isLoadingFactories ? (
                                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-primary/50" size={24} />
                                                <p className="text-gray-400 font-bold text-sm">جاري تحميل القائمة...</p>
                                            </div>
                                        ) : batch.loadedFactories ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-right">
                                                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-8 py-4">اسم المصنع</th>
                                                            <th className="px-8 py-4">الحالة</th>
                                                            <th className="px-8 py-4">البريد الإلكتروني</th>
                                                            <th className="px-8 py-4 text-center">الإجراءات</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {batch.loadedFactories.map((factory) => (
                                                            <tr key={factory.id} className="hover:bg-gray-50/50 transition-colors group">
                                                                <td className="px-8 py-5 font-black text-gray-900">
                                                                    {factory.name}
                                                                </td>
                                                                <td className="px-8 py-5">
                                                                    {(() => {
                                                                        const status = factory.status || getStatus(factory.id || factory.factory_code || '');
                                                                        switch (status) {
                                                                            case 'contacted': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">قيد التواصل</span>;
                                                                            case 'approved': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">موافق ✅</span>;
                                                                            case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">رافض ❌</span>;
                                                                            case 'certified': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold">معتمد ⭐</span>;
                                                                            default: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">قيد الانتظار</span>;
                                                                        }
                                                                    })()}
                                                                </td>
                                                                <td className="px-8 py-5 font-bold text-blue-600 text-sm">{factory.email || '---'}</td>
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {(() => {
                                                                            const id = factory.id || factory.factory_code || '';
                                                                            const status = factory.status || getStatus(id);
                                                                            if (status === 'pending') {
                                                                                return (
                                                                                    <button
                                                                                        onClick={() => updateStatus(id, 'contacted')}
                                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                                                        title="قيد التواصل"
                                                                                    >
                                                                                        <MessageSquare size={14} />
                                                                                        قيد التواصل
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            if (status === 'contacted') {
                                                                                return (
                                                                                    <div className="flex gap-1">
                                                                                        <button
                                                                                            onClick={() => updateStatus(id, 'approved')}
                                                                                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                                                                                            title="موافق"
                                                                                        >
                                                                                            <Check size={16} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => updateStatus(id, 'rejected')}
                                                                                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                                                                                            title="رافض"
                                                                                        >
                                                                                            <X size={16} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => updateStatus(id, 'certified')}
                                                                                            className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all"
                                                                                            title="اعتماد"
                                                                                        >
                                                                                            <Star size={16} />
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            if (status === 'approved' || status === 'rejected') {
                                                                                return (
                                                                                    <button
                                                                                        onClick={() => updateStatus(id, 'certified')}
                                                                                        className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all"
                                                                                        title="اعتماد"
                                                                                    >
                                                                                        <Star size={16} />
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                        <button
                                                                            onClick={() => setEditingFactory(factory)}
                                                                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeletingFactory(factory)}
                                                                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {hasMore && (
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => setVisibleBatchCount(prev => prev + 5)}
                                className="h-14 px-10 bg-white border-2 border-primary/20 text-primary rounded-2xl font-black hover:bg-primary hover:text-white hover:border-primary transition-all shadow-lg shadow-primary/5 flex items-center gap-3"
                            >
                                <Plus size={20} />
                                تحميل المزيد من المجموعات
                            </button>
                        </div>
                    )}
                </div>
            )}

            <FactoryFormModal
                isOpen={showFormModal || !!editingFactory}
                onClose={() => { setShowFormModal(false); setEditingFactory(null); }}
                onSuccess={() => fetchBatchMetadata()}
                factory={editingFactory}
                batches={batchOptions}
            />

            <ConfirmDialog
                isOpen={!!deletingFactory}
                onClose={() => setDeletingFactory(null)}
                onConfirm={handleDeleteFactory}
                title="حذف مصنع"
                message={`هل أنت متأكد من حذف "${deletingFactory?.name}"؟`}
                confirmText="حذف نهائي"
            />

            <ConfirmDialog
                isOpen={!!deletingBatchId}
                onClose={() => setDeletingBatchId(null)}
                onConfirm={handleDeleteBatch}
                title="حذف مجموعة بالكامل"
                message="سيتم حذف جميع المصانع المرتبطة بهذه المجموعة بشكل نهائي."
                confirmText="حذف المجموعة"
            />

            <ConfirmDialog
                isOpen={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                onConfirm={handleDeleteAll}
                title="تطهير قاعدة البيانات"
                message="هذا الإجراء سيحذف جميع المصانع بلا استثناء. لا يمكن التراجع!"
                confirmText="حذف الكل"
                requireTextConfirmation
                confirmationText="DELETE ALL"
            />
        </div>
    );
};
