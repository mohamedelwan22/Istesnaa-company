import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Copy, Check, FileText, Mail,
    ShieldCheck, MessageSquare, Download
} from 'lucide-react';
import { DocumentGenerator } from '../services/DocumentGenerator';
import type { Factory, Invention } from '../types';
import clsx from 'clsx';

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    factory: Factory;
    invention: Partial<Invention>;
}

export const DocumentModal = ({ isOpen, onClose, factory, invention }: DocumentModalProps) => {
    const [activeTab, setActiveTab] = useState<'report' | 'email' | 'nda' | 'whatsapp'>('report');
    const [copied, setCopied] = useState(false);



    const [ndaStage, setNdaStage] = useState<1 | 2>(1);
    const [emailContent, setEmailContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    // Reset states on open/tab change
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setSentSuccess(false);
                setIsSending(false);
                setNdaStage(1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Update email content when factory changes or tab opens initially
    useEffect(() => {
        if (isOpen && activeTab === 'email' && !emailContent) {
            try {
                setEmailContent(DocumentGenerator.generateEmailDraft(factory, invention));
            } catch (e) {
                console.error("Error generating email draft", e);
                setEmailContent("فشل في توليد المسودة.");
            }
        }
    }, [isOpen, activeTab, factory, invention, emailContent]);

    const getContent = () => {
        if (!factory) return '';
        try {
            switch (activeTab) {
                case 'report': return DocumentGenerator.generateInternalReport(factory, invention);
                case 'email': return emailContent || DocumentGenerator.generateEmailDraft(factory, invention);
                case 'nda':
                    return ndaStage === 1
                        ? DocumentGenerator.generateNDAStage1(factory, invention)
                        : DocumentGenerator.generateNDAStage2(factory, invention);
                case 'whatsapp': return DocumentGenerator.generateWhatsAppMessage(factory, invention);
                default: return '';
            }
        } catch (err) {
            console.error("Error generating document content:", err);
            return "حدث خطأ أثناء توليد المستند. يرجى التأكد من اكتمال بيانات المصنع.";
        }
    };

    const handleSendSimulation = () => {
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => setSentSuccess(false), 3000);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const content = getContent();
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Document</title></head>
            <body style='font-family: Arial, sans-serif; direction: rtl; text-align: right;'>
            ${content.replace(/\n/g, '<br/>')}
            </body></html>
        `;

        const element = document.createElement("a");
        const file = new Blob([htmlContent], { type: 'application/msword' });
        element.href = URL.createObjectURL(file);
        element.download = `${activeTab}-${factory.name || 'document'}.doc`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const tabs = [
        { id: 'report', label: 'تقرير داخلي', icon: FileText },
        { id: 'email', label: 'مسودة إيميل', icon: Mail },
        { id: 'nda', label: 'اتفاقية NDA', icon: ShieldCheck },
        { id: 'whatsapp', label: 'رسالة واتساب', icon: MessageSquare },
    ];

    if (!isOpen) return null;
    if (!factory) return null; // Safe guard

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" dir="rtl">
                    <motion.div
                        key="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-primary/20 backdrop-blur-md"
                    />

                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-primary">توليد المستندات الذكية</h3>
                                <p className="text-gray-500 font-bold text-sm mt-1">توليد تلقائي للمحتوى بناءً على تحليل المطابقة لـ {factory.name || 'المصنع'}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Sidebar Tabs */}
                            <div className="w-full md:w-64 bg-gray-50/30 p-4 border-l border-gray-50 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={clsx(
                                                "flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all shrink-0 md:shrink",
                                                isActive
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-[-4px]"
                                                    : "text-gray-500 hover:bg-white hover:text-primary"
                                            )}
                                        >
                                            {Icon && <Icon size={20} />}
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-8 flex flex-col bg-white overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        معاينة المستند
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownload}
                                            className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-primary/5 hover:text-primary transition-all border border-gray-100 group"
                                            title="تحميل كملف نصي"
                                        >
                                            <Download size={20} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className={clsx(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all",
                                                copied
                                                    ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                                    : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-900"
                                            )}
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'nda' && (
                                    <div className="mb-4 flex gap-3">
                                        <button
                                            onClick={() => setNdaStage(1)}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-xs font-black border transition-all",
                                                ndaStage === 1 ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200 hover:border-primary"
                                            )}
                                        >
                                            المرحلة 1: خطاب نوايا (مبدئي)
                                        </button>
                                        <button
                                            onClick={() => setNdaStage(2)}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-xs font-black border transition-all",
                                                ndaStage === 2 ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200 hover:border-primary"
                                            )}
                                        >
                                            المرحلة 2: اتفاقية تفصيلية (NDA)
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'email' ? (
                                    <div className="flex-1 flex flex-col gap-4 relative">
                                        <textarea
                                            value={emailContent}
                                            onChange={(e) => setEmailContent(e.target.value)}
                                            className="flex-1 w-full bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8 font-mono text-sm leading-relaxed text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                            placeholder="اكتب نص الإيميل هنا..."
                                        />

                                        <AnimatePresence>
                                            {sentSuccess && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem]"
                                                >
                                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                                        <Check size={32} />
                                                    </div>
                                                    <h4 className="text-xl font-black text-gray-800">تم الإرسال بنجاح!</h4>
                                                    <p className="text-gray-500 font-bold mt-2">تم إرسال الإيميل إلى {factory.name}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex gap-2">
                                                {/* Dummy Attachment UI */}
                                                <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 flex items-center gap-2">
                                                    <FileText size={12} /> invention_details.pdf
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSendSimulation}
                                                disabled={isSending || sentSuccess}
                                                className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isSending ? 'جاري الإرسال...' : 'إرسال الآن'}
                                                {!isSending && <Mail size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8 font-mono text-sm leading-relaxed text-gray-700 overflow-y-auto whitespace-pre-wrap selection:bg-primary selection:text-white">
                                        {getContent()}
                                    </div>
                                )}

                                <p className="mt-4 text-[10px] text-gray-400 font-bold text-center">
                                    ملاحظة: هذه المستندات مولدة آلياً، يرجى مراجعتها وتعديلها بما يتناسب مع احتياجاتك القانونية والرسمية.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
