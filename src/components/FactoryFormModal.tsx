import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import type { Factory } from '../types';

interface FactoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (factory: Factory) => void;
    factory?: Factory | null;
    batches: { id: string; name: string }[];
}

export const FactoryFormModal = ({ isOpen, onClose, onSuccess, factory, batches }: FactoryFormModalProps) => {
    const [formData, setFormData] = useState<Partial<Factory>>({
        name: '',
        email: '',
        phone: '',
        country: 'السعودية',
        city: '',
        industry: [],
        materials: [],
        capabilities: '',
        scale: '',
        notes: '',
        batch_id: '',
        batch_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Update form data when factory prop changes
    useEffect(() => {
        if (factory) {
            setFormData(factory);
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                country: 'السعودية',
                city: '',
                industry: [],
                materials: [],
                capabilities: '',
                scale: '',
                notes: '',
                batch_id: '',
                batch_name: ''
            });
        }
    }, [factory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Clean data: remove fields that shouldn't be updated manually or are identifiers
            const { id, created_at, ...updateData } = formData;

            // Determine if it's an update or insert
            const isUpdate = !!factory?.id || !!factory?.factory_code;
            let savedFactory: Factory;

            if (isUpdate) {
                // Update existing record
                let query = supabase.from('factories').update(updateData);

                if (factory?.id) {
                    query = query.eq('id', factory.id);
                } else if (factory?.factory_code) {
                    query = query.eq('factory_code', factory.factory_code);
                }

                const { data, error: updateError } = await query.select().single();
                if (updateError) throw updateError;
                savedFactory = data;
            } else {
                // Insert new factory
                // Generate a factory_code if missing
                const insertData = {
                    ...formData,
                    factory_code: formData.factory_code || crypto.randomUUID()
                };

                const { data, error: insertError } = await supabase
                    .from('factories')
                    .insert([insertData])
                    .select()
                    .single();

                if (insertError) throw insertError;
                savedFactory = data;
            }

            onSuccess(savedFactory);
            onClose();
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    const handleIndustryChange = (value: string) => {
        const industries = value.split(',').map(s => s.trim()).filter(Boolean);
        setFormData({ ...formData, industry: industries });
    };

    const handleMaterialsChange = (value: string) => {
        const materials = value.split(',').map(s => s.trim()).filter(Boolean);
        setFormData({ ...formData, materials });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={factory ? 'تعديل المصنع' : 'إضافة مصنع جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            اسم المصنع *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            رقم الهاتف
                        </label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الدولة
                        </label>
                        <input
                            type="text"
                            value={formData.country || ''}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المدينة
                        </label>
                        <input
                            type="text"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المجال الصناعي (افصل بفاصلة)
                        </label>
                        <input
                            type="text"
                            value={formData.industry?.join(', ') || ''}
                            onChange={(e) => handleIndustryChange(e.target.value)}
                            placeholder="مثال: صناعة الأغذية, صناعة المعادن"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المواد (افصل بفاصلة)
                        </label>
                        <input
                            type="text"
                            value={formData.materials?.join(', ') || ''}
                            onChange={(e) => handleMaterialsChange(e.target.value)}
                            placeholder="مثال: حديد, ألمنيوم"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المجموعة
                        </label>
                        <select
                            value={formData.batch_id || ''}
                            onChange={(e) => {
                                const selectedBatch = batches.find(b => b.id === e.target.value);
                                setFormData({
                                    ...formData,
                                    batch_id: e.target.value,
                                    batch_name: selectedBatch?.name || ''
                                });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">بدون مجموعة</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            حجم المصنع
                        </label>
                        <input
                            type="text"
                            value={formData.scale || ''}
                            onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                            placeholder="مثال: كبير, متوسط, صغير"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            القدرات
                        </label>
                        <textarea
                            value={formData.capabilities || ''}
                            onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ملاحظات
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        disabled={loading}
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
