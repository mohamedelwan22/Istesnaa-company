import { useEffect, useState } from 'react';
import {
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Loader2,
    Table,
    AlertTriangle,
    ArrowRight,
    Trash2,
    Database
} from 'lucide-react';
import { parseFactoryExcel, type ParseResult } from '../../lib/excelParser';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const UploadPage = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [batchName, setBatchName] = useState('');
    const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const { error } = await supabase.from('factories').select('*', { count: 'exact', head: true });
            if (error) {
                setStatus({ type: 'error', message: 'فشل الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'فشل الاتصال: يبدو أن هناك مشكلة في الإنترنت أو إضافة تمنع الاتصال.' });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await handlePreview(file);
        }
    };

    const handlePreview = async (file: File) => {
        setIsProcessing(true);
        setStatus(null);
        try {
            const result = await parseFactoryExcel(file);
            setParsedResult(result);
            if (result.data.length === 0) {
                setStatus({ type: 'error', message: 'لم يتم العثور على بيانات صالحة في الملف.' });
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: `خطأ في قراءة الملف: ${error.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCommit = async () => {
        if (!parsedResult || parsedResult.data.length === 0) return;

        setIsProcessing(true);
        setUploadProgress(0);
        setStatus({ type: 'info', message: 'جاري حفظ البيانات في قاعدة البيانات...' });

        try {
            const batchId = crypto.randomUUID();
            const finalBatchName = batchName.trim() || `رفع ${new Date().toLocaleDateString('ar-SA')}`;

            const dataToInsert = parsedResult.data.map(factory => ({
                ...factory,
                batch_id: batchId,
                batch_name: finalBatchName
            }));

            const CHUNK_SIZE = 200;
            for (let i = 0; i < dataToInsert.length; i += CHUNK_SIZE) {
                const chunk = dataToInsert.slice(i, i + CHUNK_SIZE);
                const { error } = await supabase.from('factories').insert(chunk);
                if (error) throw error;

                const currentProgress = Math.round(((i + chunk.length) / dataToInsert.length) * 100);
                setUploadProgress(currentProgress);
            }

            setStatus({
                type: 'success',
                message: `تم رفع ${dataToInsert.length} مصنع بنجاح في المجموعة "${finalBatchName}"!`
            });
            setParsedResult(null);
            setBatchName('');

        } catch (error: any) {
            console.error('Commit Error:', error);
            setStatus({ type: 'error', message: `فشل الحفظ: ${error.message}` });
        } finally {
            setIsProcessing(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">رفع البيانات الذكي</h1>
                    <p className="text-gray-500 font-bold mt-1">تجهيز، معاينة، واعتماد بيانات المصانع الجديدة</p>
                </div>
                {parsedResult && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setParsedResult(null)}
                            className="px-6 h-12 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            إلغاء
                        </button>
                        <button
                            onClick={handleCommit}
                            disabled={isProcessing}
                            className="px-8 h-12 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                            اعتماد وحفظ البيانات
                        </button>
                    </div>
                )}
            </div>

            {!parsedResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center"
                        >
                            <div className="max-w-md mx-auto">
                                <label className="flex flex-col items-center justify-center cursor-pointer border-4 border-dashed border-gray-100 rounded-[2rem] p-12 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all mb-6">
                                        <FileSpreadsheet size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 mb-2">اختر ملف البيانات</h3>
                                    <p className="text-gray-500 font-bold mb-6">يرجى رفع ملف بصيغة Excel (XLSX, XLS)</p>

                                    <div className="px-8 py-3 bg-white border-2 border-gray-200 rounded-xl font-black text-gray-700 group-hover:border-primary group-hover:text-primary transition-all">
                                        تصفح الملفات
                                    </div>

                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={isProcessing}
                                    />
                                </label>
                            </div>
                        </motion.div>

                        <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 flex gap-6">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-blue-900 mb-1">نظام الربط الآلي (Auto-Mapping)</h4>
                                <p className="text-blue-700 font-bold text-sm leading-relaxed">
                                    النظام سيقوم تلقائياً بالتعرف على الأعمدة مثل (اسم المصنع، الإيميل، الهاتف، المدينة) حتى لو كانت المسميات مختلفة. سيتم عرض النتائج لك للمراجعة قبل الحفظ الفعلي.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Table size={20} className="text-primary" />
                                إعدادات المجموعة
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 mr-1">اسم الدفعة</label>
                                    <input
                                        type="text"
                                        value={batchName}
                                        onChange={(e) => setBatchName(e.target.value)}
                                        placeholder="مثال: مصانع المنطقة الوسطى"
                                        className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase mb-1">إجمالي الصفوف</p>
                                <p className="text-3xl font-black text-gray-900">{parsedResult.summary.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                                <FileSpreadsheet size={24} />
                            </div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-green-600 uppercase mb-1">بيانات جاهزة</p>
                                <p className="text-3xl font-black text-green-900">{parsedResult.summary.valid}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-orange-600 uppercase mb-1">صفوف مرفوضة</p>
                                <p className="text-3xl font-black text-orange-900">{parsedResult.summary.invalid}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Data Preview Table */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-black text-gray-900">معاينة البيانات المستخرجة</h3>
                            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black">أول 10 مصانع</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">اسم المنشأة</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">البريد</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">الهاتف</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">المدينة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {parsedResult.data.slice(0, 10).map((f, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{f.name || '---'}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600 text-sm">{f.email || '---'}</td>
                                            <td className="px-6 py-4 font-bold text-gray-600 text-sm" dir="ltr">{f.phone || '---'}</td>
                                            <td className="px-6 py-4 font-bold text-gray-500">{f.city || '---'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Error Logs */}
                    {parsedResult.errors.length > 0 && (
                        <div className="bg-red-50 rounded-[2rem] border border-red-100 p-8">
                            <h4 className="font-black text-red-900 mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} />
                                تقرير الصفوف المرفوضة
                            </h4>
                            <div className="space-y-3">
                                {parsedResult.errors.slice(0, 5).map((err, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-red-100">
                                        <span className="text-red-700 font-bold text-sm">صف {err.row}: {err.reason}</span>
                                        <ArrowRight size={14} className="text-red-300" />
                                    </div>
                                ))}
                                {parsedResult.errors.length > 5 && (
                                    <p className="text-red-400 text-xs font-bold text-center mt-2">... وهناك {parsedResult.errors.length - 5} أخطاء أخرى</p>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {status && (
                <div className={clsx(
                    "p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-bottom duration-500",
                    status.type === 'success' ? 'bg-green-600 text-white' :
                        status.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                )}>
                    {status.type === 'success' ? <CheckCircle size={24} /> : status.type === 'error' ? <AlertCircle size={24} /> : <Loader2 size={24} className="animate-spin" />}
                    <div>
                        <p className="font-black">{status.message}</p>
                        {isProcessing && uploadProgress > 0 && (
                            <div className="mt-2 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-white h-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
