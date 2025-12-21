import { useState } from 'react';
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

    if (!isOpen) return null;

    const getContent = () => {
        switch (activeTab) {
            case 'report': return DocumentGenerator.generateInternalReport(factory, invention);
            case 'email': return DocumentGenerator.generateEmailDraft(factory, invention);
            case 'nda': return DocumentGenerator.generateNDA(factory, invention);
            case 'whatsapp': return DocumentGenerator.generateWhatsAppMessage(factory, invention);
            default: return '';
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([getContent()], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${activeTab}-${factory.name}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const tabs = [
        { id: 'report', label: 'تقرير داخلي', icon: FileText },
        { id: 'email', label: 'مسودة إيميل', icon: Mail },
        { id: 'nda', label: 'اتفاقية NDA', icon: ShieldCheck },
        { id: 'whatsapp', label: 'رسالة واتساب', icon: MessageSquare },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-primary/20 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-2xl font-black text-primary">توليد المستندات الذكية</h3>
                            <p className="text-gray-500 font-bold text-sm mt-1">توليد تلقائي للمحتوى بناءً على تحليل المطابقة لـ {factory.name}</p>
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
                                        <Icon size={20} />
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

                            <div className="flex-1 bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8 font-mono text-sm leading-relaxed text-gray-700 overflow-y-auto whitespace-pre-wrap selection:bg-primary selection:text-white">
                                {getContent()}
                            </div>

                            <p className="mt-4 text-[10px] text-gray-400 font-bold text-center">
                                ملاحظة: هذه المستندات مولدة آلياً، يرجى مراجعتها وتعديلها بما يتناسب مع احتياجاتك القانونية والرسمية.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
