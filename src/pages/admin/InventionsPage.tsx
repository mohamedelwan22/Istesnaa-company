import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { History, Search, ArrowRight, Lightbulb, MapPin, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface InventionRequest {
    id: string;
    name: string;
    description: string;
    industry: string;
    type: string;
    materials: string[];
    country?: string;
    analysis_result: any[];
    created_at: string;
}

export const InventionsPage = () => {
    const [inventions, setInventions] = useState<InventionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvention, setSelectedInvention] = useState<InventionRequest | null>(null);

    useEffect(() => {
        fetchInventions();
    }, []);

    const fetchInventions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInventions(data || []);
        } catch (err) {
            console.error('Error fetching inventions:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredInventions = inventions.filter(inv =>
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <History className="text-primary" />
                        سجل طلبات التحليل
                    </h2>
                    <p className="text-gray-500 mt-1">عرض ومتابعة الاختراعات التي قام المستخدمون بتحليلها</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="بحث في الطلبات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            {loading ? (
                <div className="text-center py-20">جاري تحميل السجل...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInventions.map((inv, index) => (
                        <motion.div
                            key={inv.id || index}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                        {inv.industry}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(inv.created_at).toLocaleDateString('ar-SA')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-800">{inv.name}</h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{inv.description}</p>
                            </div>

                            <button
                                onClick={() => setSelectedInvention(inv)}
                                className="w-full bg-gray-50 text-primary py-2 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                عرض التفاصيل والنتائج
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    ))}

                    {filteredInventions.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            لا توجد نتائج تطابق بحثك.
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedInvention && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-primary p-6 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Lightbulb size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedInvention.name}</h3>
                                        <p className="text-blue-100 text-sm">تفاصيل طلب التحليل والنتائج المقترحة</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedInvention(null)}
                                    className="text-white/80 hover:text-white text-3xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto space-y-8 text-right" dir="rtl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">بيانات الاختراع</h4>
                                        <div className="space-y-3">
                                            <p className="text-gray-600"><span className="font-bold ml-2">الصناعة:</span> {selectedInvention.industry}</p>
                                            <p className="text-gray-600"><span className="font-bold ml-2">النوع:</span> {selectedInvention.type === 'prototype' ? 'نموذج أولي' : 'إنتاج كمي'}</p>
                                            <p className="text-gray-600"><span className="font-bold ml-2">الدولة المستهدفة:</span> {selectedInvention.country || 'غير محدد'}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="font-bold text-gray-600 ml-2">المواد:</span>
                                                {selectedInvention.materials.map((m, i) => (
                                                    <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">{m}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <span className="font-bold text-gray-800 block mb-2">الوصف:</span>
                                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed italic">
                                                "{selectedInvention.description}"
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">المصانع المرشحة</h4>
                                        <div className="space-y-4">
                                            {selectedInvention.analysis_result?.map((factory: any, idx: number) => (
                                                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center font-black">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-gray-900 text-lg">{factory?.name || 'مصنع غير مسمى'}</h5>
                                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                                    <MapPin size={12} /> {factory?.city || 'غير محدد'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-2xl font-black text-primary">{factory?.matchScore || 0}%</div>
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ثقة المطابقة</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                                        <p className="text-sm font-bold text-blue-900 leading-relaxed">
                                                            {factory?.explanation || (
                                                                <>
                                                                    <CheckCircle size={14} className="inline ml-1" />
                                                                    {(factory?.matchReason || []).join(' و')}
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">مؤشر الاستقرار</span>
                                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(factory?.stabilityIndex || 0.5) * 100}%` }}
                                                                    className={clsx(
                                                                        "h-full rounded-full",
                                                                        (factory?.stabilityIndex || 0.5) > 0.7 ? "bg-green-500" : "bg-orange-500"
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/5 rounded-lg border border-primary/10 tracking-widest uppercase">
                                                            VERIFIED MATCH
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-gray-50 border-t flex justify-end">
                                <button
                                    onClick={() => setSelectedInvention(null)}
                                    className="bg-white border border-gray-300 px-6 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
