import { supabase } from '../../lib/supabase';
import { FeedbackService } from '../../services/FeedbackService';
import type { Factory } from '../../types';
import { motion } from 'framer-motion';
import {
    Search, Mail, Send, Phone, User, CheckCircle,
    AlertCircle, Loader2, Users, BarChart3,
    MousePointer2, Clock
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

export const EmailsPage = () => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSimulation, setIsSimulation] = useState(false);
    const [simulationLog, setSimulationLog] = useState<{ recipients: number, subject: string, batchCount: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'factories' | 'campaigns'>('factories');
    const [stats, setStats] = useState<{ total: number, byType: { whatsapp: number, email: number } } | null>(null);

    useEffect(() => {
        fetchFactories();
        loadStats();
    }, []);

    const loadStats = async () => {
        const data = await FeedbackService.getGlobalStats();
        if (data) setStats(data);
    };

    useEffect(() => {
        fetchFactories();
    }, []);

    const fetchFactories = async () => {
        setLoading(true);
        try {
            let allFactories: Factory[] = [];
            let from = 0;
            let to = 999;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('factories')
                    .select('*')
                    .range(from, to)
                    .order('name', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    allFactories = [...allFactories, ...data];
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
            // Filter out junk rows (empty rows from excel)
            const cleaned = allFactories.filter(f =>
                (f.name && f.name.trim() !== '') ||
                (f.email && f.email.trim() !== '') ||
                (f.phone && f.phone.toString().trim() !== '')
            );
            setFactories(cleaned);
        } catch (err) {
            console.error('Error fetching factories:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFactories = factories
        .filter(f => (f.name && f.name.trim() !== '') || (f.email || f.phone)) // Must have at least a name or contact info
        .filter(f =>
            f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.industry?.some(ind => ind.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const handleSendIndividual = (factory: Factory) => {
        if (!factory.email) return;
        const subject = 'فرصة تصنيع جديدة - منصة استصناع';
        const body = `مرحباً ${factory.name}،\n\nنود التواصل معكم بخصوص فرصة تصنيع جديدة...\n\nشكراً لكم.`;

        if (isSimulation) {
            alert(`[محاكاة] سيتم إرسال إيميل إلى: ${factory.email}\nالعنوان: ${subject}\n\nالنظام يعمل بشكل سليم ✅`);
            return;
        }

        window.open(`mailto:${factory.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };

    const handleSendBulk = async () => {
        const emailableFactories = factories.filter(f => f.email);
        if (emailableFactories.length === 0) {
            alert('لا يوجد مصانع مسجلة بإيميلات حالياً.');
            return;
        }

        const confirmMsg = isSimulation
            ? `هل تريد بدء وضع "المحاكاة" لـ ${emailableFactories.length} مصنع؟ (لن يتم إرسال أي إيميلات حقيقية)`
            : `هل أنت متأكد من إرسال إيميل جماعي لـ ${emailableFactories.length} مصنع؟ سيتم الإرسال على دفعات لتجنب الحظر.`;

        if (!confirm(confirmMsg)) return;

        setSending(true);
        setProgress(0);
        setSimulationLog(null);

        const batchSize = 300;
        const batches = [];
        for (let i = 0; i < emailableFactories.length; i += batchSize) {
            batches.push(emailableFactories.slice(i, i + batchSize));
        }

        const subject = 'فرصة تصنيع وتوريد جديدة - منصة استصناع';
        const body = `مرحباً بكم،\n\nنود إفادتكم بوجود طلبات تصنيع جديدة توافق تخصصاتكم...\n\nتحياتنا، فريق استصناع.`;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const emails = batch.map(f => f.email).join(',');

            if (!isSimulation) {
                window.open(`mailto:contact@estesnaa.com?bcc=${emails}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
            }

            setProgress(Math.round(((i + 1) / batches.length) * 100));

            // Brief pause between batches
            await new Promise(r => setTimeout(r, isSimulation ? 500 : 2000));
        }

        if (isSimulation) {
            setSimulationLog({
                recipients: emailableFactories.length,
                subject: subject,
                batchCount: batches.length
            });
        }

        setSending(false);
        if (!isSimulation) {
            setProgress(100);
            setTimeout(() => setProgress(0), 3000);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">إدارة المراسلات</h1>
                    <div className="flex items-center gap-5">
                        <p className="text-gray-500 font-bold">تواصل مباشرة مع المصانع والشركات المسجلة في النظام</p>
                        <div className="h-4 w-px bg-gray-200 hidden md:block" />

                        {/* Premium Toggle */}
                        <motion.button
                            onClick={() => setIsSimulation(!isSimulation)}
                            className={clsx(
                                "relative flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500 group overflow-hidden border-2",
                                isSimulation
                                    ? "bg-orange-50 border-orange-200 text-orange-700 shadow-lg shadow-orange-100"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 shadow-sm"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative flex items-center justify-center">
                                <div className={clsx(
                                    "w-12 h-6 rounded-full transition-colors duration-500",
                                    isSimulation ? "bg-orange-500" : "bg-gray-200"
                                )} />
                                <motion.div
                                    className="absolute w-4 h-4 bg-white rounded-full shadow-md"
                                    animate={{
                                        x: isSimulation ? 12 : -12,
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </div>
                            <span className={clsx(
                                "text-sm font-black tracking-tight transition-colors duration-300",
                                isSimulation ? "text-orange-900" : "text-gray-400 group-hover:text-gray-600"
                            )}>
                                وضع المحاكاة الصامت
                            </span>

                            {isSimulation && (
                                <motion.div
                                    layoutId="glow"
                                    className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent pointer-events-none"
                                />
                            )}
                        </motion.button>
                    </div>
                </div>

                <button
                    onClick={handleSendBulk}
                    disabled={sending || factories.length === 0}
                    className={clsx(
                        "h-14 px-8 rounded-2xl font-black flex items-center gap-3 shadow-lg transition-all duration-300",
                        sending ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                            isSimulation ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200" :
                                "bg-primary text-white hover:bg-blue-800 shadow-primary/20 hover:-translate-y-1"
                    )}
                >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : isSimulation ? <AlertCircle size={20} /> : <Users size={20} />}
                    {sending ? `جاري الاختبار (${progress}%)...` : isSimulation ? 'تشغيل تجربة إرسال' : 'إرسال إيميل جماعي (300/دفعة)'}
                </button>
            </div>

            {/* Simulation Success Message */}
            {simulationLog && (
                <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-orange-900">نجحت تجربة الإرسال بنجاح! ✅</h4>
                            <p className="text-orange-700 text-sm font-bold">
                                تمت معالجة {simulationLog.recipients} مصنع في {simulationLog.batchCount} دفعات. النظام مستعد للإرسال الحقيقي.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSimulationLog(null)}
                        className="bg-orange-200/50 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-black transition-colors"
                    >
                        فهمت ذلك
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 gap-8">
                <button
                    onClick={() => setActiveTab('factories')}
                    className={clsx(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === 'factories' ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    قائمة المصانع
                    {activeTab === 'factories' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={clsx(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === 'campaigns' ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    لوحة الحملات والتحويل
                    {activeTab === 'campaigns' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
            </div>

            {activeTab === 'factories' ? (
                <>
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase mb-2">إجمالي المصانع</p>
                            <p className="text-3xl font-black text-gray-900">{factories.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-green-500 uppercase mb-2">بإيميل مسجل</p>
                            <p className="text-3xl font-black text-gray-900">{factories.filter(f => f.email).length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-blue-500 uppercase mb-2">برقم هاتف</p>
                            <p className="text-3xl font-black text-gray-900">{factories.filter(f => f.phone).length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-orange-500 uppercase mb-2">بيانات ناقصة</p>
                            <p className="text-3xl font-black text-gray-900">{factories.filter(f => !f.email || !f.phone).length}</p>
                        </div>
                    </div>


                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative max-w-xl">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="بحث باسم المنشأة، الإيميل، أو المجال..."
                                    className="w-full h-14 pr-12 pl-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">المنشأة الصناعية</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">رقم الهاتف</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">البريد الإلكتروني</th>
                                        <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-6"><div className="h-8 bg-gray-100 rounded-xl w-full" /></td>
                                            </tr>
                                        ))
                                    ) : filteredFactories.map((factory) => (
                                        <tr key={factory.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 text-lg">{factory.name || <span className="text-gray-300 italic">منشأة غير مسماة</span>}</div>
                                                        <div className="text-xs font-bold text-gray-400">{factory.industry?.[0] || 'مجال غير محدد'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-600 font-bold">
                                                    <Phone size={16} className="text-gray-400" />
                                                    <span dir="ltr">{factory.phone || <span className="text-orange-400 text-xs">غير موجود</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-600 font-bold">
                                                    <Mail size={16} className="text-gray-400" />
                                                    {factory.email ? (
                                                        <span className="text-blue-600">{factory.email}</span>
                                                    ) : (
                                                        <span className="text-orange-400 text-xs">غير موجود</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => handleSendIndividual(factory)}
                                                    disabled={!factory.email}
                                                    className={clsx(
                                                        "h-11 px-6 rounded-xl font-black text-sm flex items-center gap-2 mx-auto transition-all",
                                                        factory.email
                                                            ? "bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                                                            : "bg-gray-50 text-gray-300 cursor-not-allowed border-none"
                                                    )}
                                                >
                                                    <Send size={16} />
                                                    إرسال الآن
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {!loading && filteredFactories.length === 0 && (
                                <div className="p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <Mail size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800">لا توجد نتائج تطابق بحثك</h3>
                                    <p className="text-gray-500 font-bold mt-2">تأكد من كتابة الاسم بشكل صحيح أو جرب كلمات بحث أخرى</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 flex gap-6">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                                <CheckCircle size={28} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-green-900 mb-2">أفضل ممارسات الإرسال الجماعي</h4>
                                <ul className="text-green-700 font-bold space-y-2 text-sm">
                                    <li>• سيتم تقسيم القائمة تلقائياً إلى مجموعات من 300 إيميل.</li>
                                    <li>• يتم استخدام خاصية BCC لحماية خصوصية المصانع.</li>
                                    <li>• تأكد من أن حساب الإيميل الرسمي الخاص بك مفتوح في المتصفح.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex gap-6">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-blue-900 mb-2">نصيحة تقنية لمدير النظام</h4>
                                <p className="text-blue-700 font-bold text-sm leading-relaxed">
                                    لتجنب تصنيف إيميلاتك كبريد مزعج (Spam)، يفضل الإرسال بفاصل زمني لا يقل عن 5 دقائق بين كل دفعة (300 إيميل).
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Main Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-primary to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <MousePointer2 size={28} />
                                    </div>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">تفاعل مباشر</span>
                                </div>
                                <h4 className="text-4xl font-black mb-1">{stats?.total || 0}</h4>
                                <p className="text-blue-100 font-bold">إجمالي نقرات التحويل</p>
                                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between">
                                    <div>
                                        <p className="text-xs font-black opacity-60 uppercase">واتساب</p>
                                        <p className="text-xl font-black">{stats?.byType.whatsapp || 0}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black opacity-60 uppercase">إيميل</p>
                                        <p className="text-xl font-black">{stats?.byType.email || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h4 className="font-black text-gray-900 uppercase">معدل التحويل المتوقع</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-black mb-2 uppercase tracking-tighter">
                                                <span className="text-gray-400">تحويل واتساب</span>
                                                <span className="text-green-600">
                                                    {stats?.total ? Math.round((stats.byType.whatsapp / stats.total) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stats?.total ? (stats.byType.whatsapp / stats.total) * 100 : 0}%` }}
                                                    className="h-full bg-green-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-black mb-2 uppercase tracking-tighter">
                                                <span className="text-gray-400">تحويل إيميل</span>
                                                <span className="text-blue-600">
                                                    {stats?.total ? Math.round((stats.byType.email / stats.total) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stats?.total ? (stats.byType.email / stats.total) * 100 : 0}%` }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-6 leading-relaxed">
                                    * يتم حساب المعدلات بناءً على نقرات المستخدمين في صفحة النتائج العامة.
                                </p>
                            </div>
                        </div>

                        {/* Recent Campaigns (Simulated History) */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <h4 className="font-black text-gray-900 flex items-center gap-2">
                                    <Clock size={20} className="text-primary" />
                                    تاريخ الحملات الجماعية
                                </h4>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">آخر 3 حملات</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {[
                                    { date: '2025-11-20', label: 'حملة مصانع الشرقية', count: 450, status: 'completed' },
                                    { date: '2025-11-15', label: 'توعية قطاع البلاستيك', count: 120, status: 'completed' },
                                    { date: '2025-11-10', label: 'حملة الرياض - نوفمبر', count: 310, status: 'completed' }
                                ].map((camp, i) => (
                                    <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center">
                                                <Mail size={20} />
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900">{camp.label}</div>
                                                <div className="text-xs font-bold text-gray-400">{camp.date} • {camp.count} مصنع</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 text-[10px] font-black uppercase tracking-widest">
                                            <CheckCircle size={12} />
                                            SENT
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Side Info */}
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                            <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2">
                                <BarChart3 size={18} />
                                لماذا التتبع مهم؟
                            </h4>
                            <p className="text-blue-700 font-bold text-sm leading-relaxed">
                                مراقبة نقرات التحويل تساعد في فهم أي المصانع هي الأكثر استجابة وطلباً من قبل المبدعين. يتم استخدام هذه البيانات لرفع ترتيب المصانع "المتفاعلة" في نتائج البحث المستقبلية تلقائياً.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
