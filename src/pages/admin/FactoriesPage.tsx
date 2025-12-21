import { useEffect, useState } from 'react';
import { Search, Trash2, Edit, Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Factory } from '../../types';
import { FactoryFormModal } from '../../components/FactoryFormModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export const FactoriesPage = () => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
    const [deletingFactory, setDeletingFactory] = useState<Factory | null>(null);
    const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchFactories();
    }, []);

    const fetchFactories = async () => {
        console.log('fetchFactories called');
        setLoading(true);
        try {
            let allData: Factory[] = [];
            let from = 0;
            let to = 999;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('factories')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < 1000) {
                        hasMore = false;
                    } else {
                        from += 1000;
                        to += 1000;
                    }
                } else {
                    hasMore = false;
                }
            }

            console.log('Total factories fetched:', allData.length);
            setFactories(allData);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFactories = factories.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.industry?.some(i => i?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        f.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group factories by batch
    const factoriesByBatch = filteredFactories.reduce((acc, factory) => {
        const batchKey = factory.batch_id || 'no-batch';
        if (!acc[batchKey]) {
            acc[batchKey] = {
                id: factory.batch_id || '',
                name: factory.batch_name || 'مصانع بدون مجموعة',
                factories: []
            };
        }
        acc[batchKey].factories.push(factory);
        return acc;
    }, {} as Record<string, { id: string; name: string; factories: Factory[] }>);

    const batches = Object.values(factoriesByBatch);
    const batchOptions = batches.filter(b => b.id).map(b => ({ id: b.id, name: b.name }));

    const toggleBatchExpand = (batchId: string) => {
        setExpandedBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchId)) {
                next.delete(batchId);
            } else {
                next.add(batchId);
            }
            return next;
        });
    };

    // CRUD Operations
    const handleDeleteFactory = async () => {
        if (!deletingFactory) return;

        console.log('Deleting factory:', deletingFactory.id || deletingFactory.factory_code);
        try {
            let query = supabase.from('factories').delete();

            if (deletingFactory.id) {
                query = query.eq('id', deletingFactory.id);
            } else if (deletingFactory.factory_code) {
                query = query.eq('factory_code', deletingFactory.factory_code);
            } else {
                return;
            }

            const { error } = await query;

            if (error) {
                console.error('Delete error:', error);
                alert('حدث خطأ أثناء الحذف: ' + error.message);
            } else {
                console.log('Delete successful, updating local state');
                // Optimistic update: use specific IDs and string conversion to be safe
                setFactories(prev => {
                    const next = prev.filter(f => {
                        const isMatch = (deletingFactory.id && String(f.id) === String(deletingFactory.id)) ||
                            (deletingFactory.factory_code && f.factory_code === deletingFactory.factory_code);
                        return !isMatch;
                    });
                    console.log(`State updated: ${prev.length} -> ${next.length}`);
                    return next;
                });
                setDeletingFactory(null);
            }
        } catch (err) {
            console.error('Delete exception:', err);
        }
    };

    const handleDeleteBatch = async () => {
        if (!deletingBatchId) return;

        try {
            const { error } = await supabase
                .from('factories')
                .delete()
                .eq('batch_id', deletingBatchId);

            if (error) {
                console.error('Delete batch error:', error);
                alert('حدث خطأ أثناء حذف المجموعة: ' + error.message);
            } else {
                console.log('Delete batch successful, updating local state');
                // Optimistic update
                setFactories(prev => {
                    const next = prev.filter(f => String(f.batch_id) !== String(deletingBatchId));
                    console.log(`Batch state updated: ${prev.length} -> ${next.length}`);
                    return next;
                });
                setDeletingBatchId(null);
            }
        } catch (err) {
            console.error('Delete batch exception:', err);
            alert('حدث خطأ أثناء حذف المجموعة');
        }
    };

    const handleDeleteAll = async () => {
        try {
            // Delete using factory_code which exists for all rows
            const { error } = await supabase
                .from('factories')
                .delete()
                .not('factory_code', 'is', null);

            if (error) {
                console.error('Delete all error:', error);
                alert('حدث خطأ أثناء حذف جميع البيانات: ' + error.message);
                await fetchFactories();
            } else {
                console.log('Delete all successful, clearing local state');
                setFactories([]); // Clear local state immediately
                setShowDeleteAllDialog(false);
            }
        } catch (err) {
            console.error('Delete all exception:', err);
            alert('حدث خطأ أثناء حذف جميع البيانات');
        }
    };

    const deletingBatch = batches.find(b => b.id === deletingBatchId);

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">إدارة المصانع</h2>
                    <div className="flex gap-4 text-sm mt-1">
                        <p className="text-gray-600">
                            الإجمالي: <span className="font-semibold text-blue-600">{factories.length}</span>
                        </p>
                        {searchTerm && (
                            <p className="text-gray-600 border-r pr-4 border-gray-300">
                                نتائج البحث: <span className="font-semibold text-green-600">{filteredFactories.length}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        <Plus size={20} />
                        إضافة مصنع يدوياً
                    </button>
                </div>
            </div>

            {/* Search and Batch Actions */}
            <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="بحث عن مصنع..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>

                {batchOptions.length > 0 && (
                    <select
                        onChange={(e) => e.target.value && setDeletingBatchId(e.target.value)}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        value=""
                    >
                        <option value="">مسح مجموعة...</option>
                        {batchOptions.map(batch => (
                            <option key={batch.id} value={batch.id}>{batch.name}</option>
                        ))}
                    </select>
                )}

                <button
                    onClick={() => setShowDeleteAllDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    <Trash size={18} />
                    مسح الكل
                </button>
            </div>

            {/* Factories List */}
            {loading ? (
                <div className="text-center py-12">جاري التحميل...</div>
            ) : (
                <div className="space-y-6">
                    {batches.map((batch, batchIndex) => {
                        const isExpanded = expandedBatches.has(batch.id || 'no-batch');
                        return (
                            <div key={batchIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Batch Header */}
                                <div
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                                    onClick={() => toggleBatchExpand(batch.id || 'no-batch')}
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{batch.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{batch.factories.length} مصنع</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <span className="text-sm font-medium">{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>

                                {/* Factories Table */}
                                {isExpanded && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right">
                                            <thead className="bg-gray-50 text-gray-700">
                                                <tr>
                                                    <th className="p-4 w-16">#</th>
                                                    <th className="p-4 text-right">اسم المصنع</th>
                                                    <th className="p-4 text-right">المجال</th>
                                                    <th className="p-4 text-right">الدولة</th>
                                                    <th className="p-4 text-right">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {batch.factories.map((factory, index) => (
                                                    <tr key={factory.id || factory.factory_code || `factory-${batchIndex}-${index}`} className="hover:bg-gray-50">
                                                        <td className="p-4 text-gray-500 font-medium">{index + 1}</td>
                                                        <td className="p-4 font-medium">{factory.name}</td>
                                                        <td className="p-4 text-sm text-gray-600">{factory.industry?.join(', ')}</td>
                                                        <td className="p-4 text-sm text-gray-600">{factory.country}</td>
                                                        <td className="p-4 flex gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingFactory(factory);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="تعديل"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingFactory(factory);
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                                title="حذف"
                                                            >
                                                                <Trash2 size={18} />
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
                    })}

                    {batches.length === 0 && (
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
                            لا توجد مصانع مطابقة
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <FactoryFormModal
                isOpen={showAddModal || !!editingFactory}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingFactory(null);
                }}
                onSuccess={(savedFactory) => {
                    setFactories(prev => {
                        // Check if it's an edit or a new factory
                        const exists = prev.some(f =>
                            (savedFactory.id && String(f.id) === String(savedFactory.id)) ||
                            (savedFactory.factory_code && f.factory_code === savedFactory.factory_code)
                        );

                        if (exists) {
                            // Update in place to preserve order
                            console.log('Updating factory in state:', savedFactory.name);
                            return prev.map(f => {
                                const isMatch = (savedFactory.id && String(f.id) === String(savedFactory.id)) ||
                                    (savedFactory.factory_code && f.factory_code === savedFactory.factory_code);
                                return isMatch ? savedFactory : f;
                            });
                        } else {
                            // Add to top for new factory
                            console.log('Adding new factory to state:', savedFactory.name);
                            return [savedFactory, ...prev];
                        }
                    });

                    setShowAddModal(false);
                    setEditingFactory(null);
                }}
                factory={editingFactory}
                batches={batchOptions}
            />

            <ConfirmDialog
                isOpen={!!deletingFactory}
                onClose={() => setDeletingFactory(null)}
                onConfirm={handleDeleteFactory}
                title="حذف المصنع"
                message={`هل أنت متأكد من حذف "${deletingFactory?.name}"؟`}
                confirmText="حذف"
            />

            <ConfirmDialog
                isOpen={!!deletingBatchId}
                onClose={() => setDeletingBatchId(null)}
                onConfirm={handleDeleteBatch}
                title="حذف المجموعة"
                message={`هل أنت متأكد من حذف جميع المصانع في "${deletingBatch?.name}"؟ سيتم حذف ${deletingBatch?.factories.length} مصنع.`}
                confirmText="حذف المجموعة"
            />

            <ConfirmDialog
                isOpen={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                onConfirm={handleDeleteAll}
                title="⚠️ حذف جميع البيانات"
                message="هذا الإجراء سيحذف جميع المصانع بشكل نهائي ولا يمكن التراجع عنه!"
                confirmText="حذف الكل"
                requireTextConfirmation
                confirmationText="DELETE ALL"
            />
        </div>
    );
};
