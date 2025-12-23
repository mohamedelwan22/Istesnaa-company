import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Loader2,
    ShieldAlert,
    Copy,
    ArrowLeftRight,
    Search
} from 'lucide-react';
import { DeduplicationService, type DuplicateGroup } from '../../services/DeduplicationService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const DeduplicationPage = () => {
    const [groups, setGroups] = useState<DuplicateGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        loadDuplicates();
    }, []);

    const loadDuplicates = async () => {
        setLoading(true);
        setProgress({ current: 0, total: 0 });
        try {
            const data = await DeduplicationService.findDuplicates((current, total) => {
                setProgress({ current, total });
            });
            setGroups(data);
        } catch (error) {
            console.error('Error loading duplicates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async (groupId: string, primaryId: string, suspectIds: string[]) => {
        if (!confirm('هل أنت متأكد من دمج هذه السجلات؟ سيتم حذف السجلات المتكررة والإبقاء على السجل الرئيسي فقط.')) return;

        setIsProcessing(groupId);
        try {
            await DeduplicationService.mergeRecords(primaryId, suspectIds);
            setGroups(groups.filter(g => g.primary.id !== primaryId));
            setStatus({ type: 'success', message: 'تم دمج السجلات بنجاح وتنظيف قاعدة البيانات.' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error: any) {
            setStatus({ type: 'error', message: `فشل الدمج: ${error.message}` });
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">كشف التكرار والتعارض</h1>
                    <p className="text-gray-500 font-bold">تحليل قاعدة البيانات للبحث عن سجلات متكررة أو متشابهة للمصانع</p>
                </div>

                <button
                    onClick={loadDuplicates}
                    disabled={loading}
                    className="h-12 px-6 bg-white border-2 border-gray-200 rounded-xl font-black text-gray-700 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    إعادة فحص البيانات
                </button>
            </div>

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "p-4 rounded-2xl flex items-center gap-3 border",
                        status.type === 'success' ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
                    )}
                >
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-black text-sm">{status.message}</span>
                </motion.div>
            )}

            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center relative overflow-hidden">
                        <Loader2 className="animate-spin mx-auto text-primary mb-6" size={48} />
                        <h3 className="text-xl font-black text-gray-800">جاري فحص السجلات...</h3>
                        <p className="text-gray-500 font-bold mt-2">نقوم بمقارنة الأسماء، الإيميلات، وأرقام الهواتف بدقة</p>

                        {progress.total > 0 && (
                            <div className="mt-8 max-w-xs mx-auto">
                                <div className="flex justify-between text-[10px] font-black text-primary uppercase mb-2">
                                    <span>تقدم الفحص</span>
                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-2">معالجة {progress.current} من {progress.total} مصنع</p>
                            </div>
                        )}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-green-50 p-20 rounded-[3rem] border border-green-100 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-green-900">قاعدة البيانات نظيفة تماماً!</h3>
                        <p className="text-green-700 font-bold mt-2">لا توجد سجلات متكررة أو مشتبه بها حالياً.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {groups.map((group, index) => (
                            <motion.div
                                key={group.primary?.id || index}
                                layout
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-8 bg-gray-50/50 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-sm text-primary border border-gray-100">
                                                <Copy size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-black text-gray-900">{group.primary.name}</h3>
                                                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-wider">السجل الرئيسي</span>
                                                </div>
                                                <p className="text-gray-500 font-bold text-sm mt-1">{group.primary?.email || 'بدون بريد'} • {group.primary?.city || 'مدينة غير محددة'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => group.primary.id && handleMerge(group.primary.id, group.primary.id, group.suspects.map(s => s.factory.id || ''))}
                                            disabled={isProcessing === group.primary.id}
                                            className="h-12 px-8 bg-primary text-white rounded-xl font-black flex items-center gap-3 shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing === group.primary.id ? <Loader2 className="animate-spin" size={18} /> : <ArrowLeftRight size={18} />}
                                            دمج وتنظيف {group.suspects.length} تكرارات
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">سجلات مشتبه بها للتكرار</p>
                                    {group.suspects.map((suspect) => (
                                        <div
                                            key={suspect.factory.id}
                                            className="flex flex-col md:flex-row items-center justify-between p-5 bg-orange-50/30 rounded-2xl border border-orange-100/50 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                                    <ShieldAlert size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900">{suspect.factory?.name || 'مصنع غير مسمى'}</div>
                                                    <div className="text-xs font-bold text-orange-600 flex items-center gap-2 mt-0.5">
                                                        {suspect.reason} • ثقة {suspect.score}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left text-sm font-bold text-gray-400 mt-4 md:mt-0">
                                                ID: {suspect.factory?.id ? String(suspect.factory.id).slice(0, 8) : 'N/A'}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex gap-6">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={28} />
                </div>
                <div>
                    <div>
                        <h4 className="text-lg font-black text-blue-900 mb-1">كيف يعمل محرك كشف التكرار؟</h4>
                        <p className="text-blue-700 font-bold text-sm leading-relaxed mb-2">
                            يستخدم النظام خوارزميات ذكية (Levenshtein) لمقارنة الأسماء والبيانات.
                        </p>
                        <ul className="text-blue-700/80 text-xs font-bold space-y-1 list-disc list-inside">
                            <li>دمج السجلات يمنع تشتت تقييمات المصانع عبر سجلات متعددة.</li>
                            <li>يساعد في الحصول على إحصائيات دقيقة حول عدد المصانع في كل قطاع.</li>
                            <li>عند الدمج، يتم الحفاظ على السجل الأقدم كمرجع رئيسي.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
