import { supabase } from '../../lib/supabase';
import { FeedbackService } from '../../services/FeedbackService';
import type { Factory } from '../../types';
import { motion } from 'framer-motion';
import {
    Search, Mail, Send, Phone, User, CheckCircle,
    Loader2, BarChart3,
    MousePointer2, Clock, Eye, Trash2, X,
    FileText, Paperclip, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import type { ContactLog } from '../../types';

export const EmailsPage = () => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSimulation, setIsSimulation] = useState(false);
    const [simulationLog, setSimulationLog] = useState<{ recipients: number, subject: string, batchCount: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'factories' | 'campaigns' | 'contacted'>('factories');
    const [stats, setStats] = useState<{ total: number, byType: { whatsapp: number, email: number } } | null>(null);

    // New State for Bulk Email Flow
    const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
    const [emailTemplate, setEmailTemplate] = useState({
        subject: 'فرصة تصنيع وتوريد جديدة - منصة استصناع',
        body: `مرحباً {factory_name}،\n\nنود إفادتكم بوجود طلبات تصنيع جديدة في قطاع {industry} توافق تخصصاتكم...\n\nتحياتنا، فريق استصناع.`,
        attachments: [{ name: 'Project_Brief.pdf', size: '1.2MB' }] // Placeholder attachments
    });
    const [showPreview, setShowPreview] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    const [sendingQueue, setSendingQueue] = useState<Factory[]>([]);
    const [queueIndex, setQueueIndex] = useState(0);

    useEffect(() => {
        fetchFactories();
        loadStats();
        fetchContactLogs();
    }, []);

    const loadStats = async () => {
        const data = await FeedbackService.getGlobalStats();
        if (data) setStats(data);
    };

    const fetchContactLogs = async () => {
        const { data, error } = await supabase
            .from('contact_logs')
            .select('*')
            .order('sent_at', { ascending: false });

        if (!error && data) {
            setContactLogs(data);
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error fetching logs:', error);
            // Fallback for simulation/local if table doesn't exist
            const mockLogs: ContactLog[] = [
                { id: 'mock-01', factory_id: 'mock-1', factory_name: 'مصنع الأمل للبلاستيك', email: 'hope@factory.com', industry: 'البلاستيك', sent_at: new Date().toISOString(), status: 'Sent' },
                { id: 'mock-02', factory_id: 'mock-2', factory_name: 'شركة الصناعات المعدنية', email: 'metal@co.com', industry: 'المعادن', sent_at: new Date().toISOString(), status: 'Sent' }
            ];
            setContactLogs(mockLogs);
        }
    };


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

    const handleSendIndividual = async (factory: Factory) => {
        if (!factory.email) return;
        const subject = 'فرصة تصنيع جديدة - منصة استصناع';
        const body = `مرحباً ${factory.name}،\n\nنود التواصل معكم بخصوص فرصة تصنيع جديدة...\n\nشكراً لكم.`;

        if (isSimulation) {
            alert(`[محاكاة] سيتم إرسال إيميل إلى: ${factory.email}\nالعنوان: ${subject}\n\nالنظام يعمل بشكل سليم ✅`);
        } else {
            window.open(`mailto:${factory.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        }

        // Log the effort
        const newLog: ContactLog = {
            factory_id: factory.id || 'unknown',
            factory_name: factory.name || 'غير مسمى',
            email: factory.email || 'no-email',
            industry: factory.industry?.[0] || 'عام',
            sent_at: new Date().toISOString(),
            status: 'Sent'
        };

        const { data, error } = await supabase.from('contact_logs').insert([newLog]).select();
        if (!error && data && data[0]) {
            setContactLogs(prev => [data[0], ...prev]);
        } else {
            // Fallback if select fails or table doesn't exist (local simulation)
            setContactLogs(prev => [{ ...newLog, id: Math.random().toString() }, ...prev]);
        }
    };

    const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

    // Filter Logic
    const factoriesToEmail = factories
        .filter(f => f.email)
        .filter(f => selectedIndustry === 'all' || f.industry?.includes(selectedIndustry));

    const industries = Array.from(new Set(factories.flatMap(f => f.industry || []))).filter(Boolean);

    const tokenize = (text: string, factory: Factory) => {
        return text
            .replace(/{factory_name}/g, factory.name || 'عميلنا العزيز')
            .replace(/{industry}/g, factory.industry?.[0] || 'قطاعكم الصناعي');
    };

    const confirmSendBulk = async () => {
        const limit = 300;
        const targetList = factoriesToEmail.slice(0, limit);

        if (targetList.length === 0) return;

        setSendingQueue(targetList);
        setQueueIndex(0);
        setShowPreview(false);
        setIsDispatching(true);
        setSending(true);
        setProgress(0);
    };

    const processNextInQueue = async (skip = false) => {
        if (queueIndex >= sendingQueue.length) {
            handleFinishDispatch();
            return;
        }

        const factory = sendingQueue[queueIndex];

        if (!skip) {
            const tokenizedSubject = tokenize(emailTemplate.subject, factory);
            const tokenizedBody = tokenize(emailTemplate.body, factory);

            if (isSimulation) {
                console.log(`[Simulation] Sending to ${factory.email}: ${tokenizedSubject}`);
            } else {
                // Individualized Gmail Link
                const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${factory.email}&su=${encodeURIComponent(tokenizedSubject)}&body=${encodeURIComponent(tokenizedBody)}&from=partnerships@estesnaa.com`;
                window.open(gmailLink, '_blank');
            }

            // ONLY LOG IF NOT SKIPPED
            const newLog: ContactLog = {
                factory_id: factory.id || 'unknown',
                factory_name: factory.name || 'غير مسمى',
                email: factory.email || 'no-email',
                industry: factory.industry?.[0] || 'عام',
                sent_at: new Date().toISOString(),
                status: 'Sent'
            };

            // Save to Supabase
            const { data, error } = await supabase.from('contact_logs').insert([newLog]).select();
            if (!error && data && data[0]) {
                setContactLogs(prev => [data[0], ...prev]);
            } else {
                setContactLogs(prev => [{ ...newLog, id: Math.random().toString() }, ...prev]);
            }
        }

        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        setProgress(Math.round((nextIndex / sendingQueue.length) * 100));

        if (nextIndex >= sendingQueue.length) {
            handleFinishDispatch();
        }
    };

    const handleFinishDispatch = () => {
        setIsDispatching(false);
        setSending(false);
        setSendingQueue([]);
        setQueueIndex(0);
        if (isSimulation) {
            setSimulationLog({
                recipients: sendingQueue.length,
                subject: emailTemplate.subject,
                batchCount: sendingQueue.length
            });
        }
        alert('اكتملت عملية المعالجة بنجاح.');
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

        // Bypassing database call for mock/simulation records to avoid error alerts
        if (id.toString().startsWith('mock-') || id.toString().length < 5) {
            setContactLogs(prev => prev.filter(log => log.id !== id));
            return;
        }

        const { error } = await supabase.from('contact_logs').delete().eq('id', id);

        if (error) {
            console.error('Error deleting log:', error);
            alert('فشل الحذف من قاعدة البيانات. تأكد من وجود جدول contact_logs وصلاحيات الوصول.');
        } else {
            setContactLogs(prev => prev.filter(log => log.id !== id));
        }
    };

    const handleClearAllLogs = async () => {
        if (!confirm('هل أنت متأكد من مسح جميع السجلات؟')) return;
        // Delete all rows where id is not 0 (effectively everything)
        const { error } = await supabase.from('contact_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('Error clearing logs:', error);
            alert('فشل مسح السجلات من قاعدة البيانات.');
        } else {
            setContactLogs([]);
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

                <div className="flex items-center gap-4">
                    <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="h-14 px-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 outline-none focus:border-primary"
                    >
                        <option value="all">كل القطاعات ({factories.filter(f => f.email).length})</option>
                        {industries.map(ind => (
                            <option key={ind} value={ind}>{ind} ({factories.filter(f => f.email && f.industry?.includes(ind)).length})</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowPreview(true)}
                        disabled={sending || factoriesToEmail.length === 0}
                        className={clsx(
                            "h-14 px-8 rounded-2xl font-black flex items-center gap-3 shadow-lg transition-all duration-300",
                            sending ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                                isSimulation ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200" :
                                    "bg-primary text-white hover:bg-blue-800 shadow-primary/20 hover:-translate-y-1"
                        )}
                    >
                        {sending ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                        {sending ? `جاري الإرسال (${progress}%)...` : 'معاينة الحملة'}
                    </button>
                </div>
            </div>

            {/* Premium Preview Overlay */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-white w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                                        <Mail size={20} />
                                    </div>
                                    معاينة تفاصيل الحملة الإعلانية
                                </h2>
                                <p className="text-gray-500 font-bold mt-1">تأكد من مراجعة النص قبل البدء بالإرسال التسلسلي لـ {Math.min(factoriesToEmail.length, 300)} مصنع</p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-12 h-12 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center border border-gray-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Editor Side */}
                            <div className="flex-1 p-8 overflow-y-auto space-y-8 border-l border-gray-100">
                                {/* Fixed From */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <User size={14} /> المُرسل (البريد الرسمي)
                                    </label>
                                    <div className="h-14 px-6 bg-gray-100 border border-gray-200 rounded-2xl flex items-center font-bold text-gray-500">
                                        partnerships@estesnaa.com
                                        <span className="mr-auto text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md">موثق √</span>
                                    </div>
                                </div>

                                {/* Editable Subject */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> موضوع الرسالة
                                    </label>
                                    <input
                                        type="text"
                                        value={emailTemplate.subject}
                                        onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                                        className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="أدخل عنوان الرسالة هنا..."
                                    />
                                </div>

                                {/* Rich Text Placeholder Area */}
                                <div className="space-y-3 flex-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> محتوى الرسالة (Rich Editor)
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={emailTemplate.body}
                                            onChange={(e) => setEmailTemplate({ ...emailTemplate, body: e.target.value })}
                                            className="w-full h-80 p-8 bg-white border border-gray-200 rounded-[2rem] font-medium text-gray-700 leading-relaxed focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
                                        />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <div className="px-2 py-1 bg-gray-50 rounded border text-[10px] font-bold text-gray-400">Tokens: {'{factory_name}'}, {'{industry}'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Area */}
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Paperclip size={14} /> المرفقات (Attachments)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {emailTemplate.attachments.map((file, idx) => (
                                            <div key={idx} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4 group">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="font-bold text-sm text-gray-900 truncate">{file.name}</div>
                                                    <div className="text-[10px] text-gray-500">{file.size}</div>
                                                </div>
                                                <button
                                                    onClick={() => setEmailTemplate({
                                                        ...emailTemplate,
                                                        attachments: emailTemplate.attachments.filter((_, i) => i !== idx)
                                                    })}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button className="p-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-primary hover:text-primary transition-all">
                                            <Paperclip size={18} /> إضافة ملف جديد
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recipients & Rules Side */}
                            <div className="w-full lg:w-96 bg-gray-50/50 p-8 flex flex-col gap-8">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100">
                                    <h3 className="text-sm font-black text-gray-900 mb-4 tracking-wider uppercase">قواعد الإرسال الآمن</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={12} /></div>
                                            <p className="text-xs font-bold text-gray-600">إرسال تسلسلي (Individual) - كل مصنع يستلم نسخة خاصة به.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={12} /></div>
                                            <p className="text-xs font-bold text-gray-600">تخصيص كامل (Tokenization) لضمان عدم تصنيف الرسالة كبريد مزعج.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Clock size={12} /></div>
                                            <p className="text-xs font-bold text-gray-600">تأخير ذكي (3-6 ثوانٍ) بين كل رسالة لمحاكاة السلوك البشري.</p>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <h3 className="text-sm font-black text-gray-900 mb-4 tracking-wider uppercase">قائمة المستلمين ({Math.min(factoriesToEmail.length, 300)})</h3>
                                    <div className="flex-1 bg-white rounded-3xl border border-gray-100 overflow-y-auto divide-y divide-gray-50">
                                        {factoriesToEmail.slice(0, 300).map((f, i) => (
                                            <div key={i} className="p-4 flex items-center gap-3 group">
                                                <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-xs font-black text-gray-900 truncate">{f.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400">{f.email}</div>
                                                </div>
                                                {f.industry?.[0] && (
                                                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">القطاع: {f.industry[0]}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {isSimulation && (
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 text-orange-700">
                                            <AlertTriangle size={20} />
                                            <p className="text-xs font-bold italic">أنت تعمل حالياً في "وضع المحاكاة" - لن يتم فتح Gmail فعلياً.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={confirmSendBulk}
                                        className={clsx(
                                            "w-full h-16 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all",
                                            isSimulation ? "bg-orange-500 hover:bg-orange-600 shadow-orange-100" : "bg-primary hover:bg-blue-900 shadow-primary/20"
                                        )}
                                    >
                                        <Send size={24} />
                                        {isSimulation ? 'بدء محاكاة الإرسال الذكي' : 'تأكيد البدء بالإرسال الجماعي'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Interactive Dispatcher Overlay */}
            {isDispatching && sendingQueue.length > 0 && queueIndex < sendingQueue.length && (
                <div className="fixed inset-0 z-[110] bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-10 text-center space-y-6">
                            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={40} className="animate-pulse" />
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-gray-900">جاري إرسال الحملة الذكية</h2>
                                <p className="text-gray-500 font-bold mt-2">المصنع الحالي: {queueIndex + 1} من {sendingQueue.length}</p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-right">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="font-black text-xl text-gray-900">{sendingQueue[queueIndex]?.name}</div>
                                        <div className="text-sm font-bold text-gray-400">{sendingQueue[queueIndex]?.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">المجال الصناعي</div>
                                    <div className="inline-block bg-primary/5 text-primary px-4 py-1.5 rounded-full font-black text-xs">
                                        {sendingQueue[queueIndex]?.industry?.[0] || 'عام'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>جاري المعالجة</span>
                                    <span>{progress}% اكتمل</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => processNextInQueue(true)}
                                    className="h-16 rounded-2xl border-2 border-gray-100 text-gray-400 font-black hover:bg-gray-50 transition-all"
                                >
                                    تخطي هذا المصنع
                                </button>
                                <button
                                    onClick={() => processNextInQueue(false)}
                                    className="h-16 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-3"
                                >
                                    <Mail size={20} />
                                    فتح Gmail والتسجيل
                                </button>
                            </div>

                            <button
                                onClick={handleFinishDispatch}
                                className="text-sm font-bold text-red-400 hover:text-red-500 transition-colors pt-4"
                            >
                                إلغاء العملية بالكامل
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

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
                    قائمة المصانع المستهدفة
                    {activeTab === 'factories' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('contacted')}
                    className={clsx(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === 'contacted' ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    المصانع التي تم التواصل معها
                    {contactLogs.length > 0 && <span className="mr-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{contactLogs.length}</span>}
                    {activeTab === 'contacted' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={clsx(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === 'campaigns' ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    تحليلات الحملات
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
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="relative max-w-xl flex-1">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="بحث باسم المنشأة، الإيميل، أو المجال..."
                                    className="w-full h-14 pr-12 pl-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">عرض:</span>
                                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                                    <button className="px-4 py-2 bg-white shadow-sm rounded-lg text-xs font-black text-primary">الكل</button>
                                    <button className="px-4 py-2 hover:bg-white/50 rounded-lg text-xs font-bold text-gray-500">نشط</button>
                                </div>
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
                                                        <div className="text-xs font-bold text-gray-400">القطاع: {factory.industry?.[0] || 'مجال غير محدد'}</div>
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
                                                    إرسال فردي
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
                </>
            ) : activeTab === 'contacted' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">سجل التواصل مع المصانع</h3>
                                <p className="text-gray-500 font-bold text-sm">تتبع جميع العمليات التي تمت من خلال لوحة التحكم</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleClearAllLogs}
                                    className="h-12 px-6 bg-red-50 text-red-600 rounded-xl font-black text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    مسح الكل
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">اسم المصنع</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">البريد الإلكتروني</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">القطاع الصناعي</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">تاريخ الإرسال</th>
                                        <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">الحالة</th>
                                        <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {contactLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold">لا توجد سجلات تواصل حتى الآن</td>
                                        </tr>
                                    ) : contactLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6 font-black text-gray-900">{log.factory_name}</td>
                                            <td className="px-8 py-6 font-bold text-gray-500">{log.email}</td>
                                            <td className="px-8 py-6">
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">{log.industry}</span>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-400" dir="ltr">
                                                {new Date(log.sent_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle size={12} />
                                                    Sent
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => log.id && handleDeleteLog(log.id)}
                                                    className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
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
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">أفضل الممارسات</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600">استخدم الرموز التعبيرية بحذر في العناوين لزيادة نسبة الفتح.</div>
                                <div className="p-3 bg-white rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600">تأكد من صحة روابط التواصل في نص الرسالة.</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
