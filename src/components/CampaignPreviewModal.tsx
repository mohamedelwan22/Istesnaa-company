import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Mail, Users, FileText, Paperclip,
    Trash2, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';
import type { Factory } from '../types';
import clsx from 'clsx';

interface CampaignPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFactories: Factory[];
    emailSubject: string;
    emailBody: string;
    onConfirmSend: (mode: 'bulk' | 'sequential') => void;
    onRemoveRecipient: (id: number) => void;
    onSubjectChange: (val: string) => void;
    onBodyChange: (val: string) => void;
}

type Tab = 'message' | 'recipients' | 'attachments';

export const CampaignPreviewModal = ({
    isOpen,
    onClose,
    selectedFactories,
    emailSubject,
    emailBody,
    onConfirmSend,
    onRemoveRecipient,
    onSubjectChange,
    onBodyChange
}: CampaignPreviewModalProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('message');
    const [isSequential, setIsSequential] = useState(false);

    // Mock attachments for UI (since mailto doesn't support them real-time without hosting)
    const [attachments, setAttachments] = useState<File[]>([]);

    const validFactories = selectedFactories.filter(f => f.email);
    const recipientCount = validFactories.length;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden border border-gray-100">
                            {/* Header */}
                            <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">إعداد الحملة</h2>
                                        <p className="text-gray-500 text-sm font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            جاهز للإطلاق عبر Outlook
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Sidebar (Tabs) */}
                                <div className="w-64 bg-gray-50/50 border-l border-gray-100 p-4 flex flex-col gap-2 shrink-0">
                                    <button
                                        onClick={() => setActiveTab('message')}
                                        className={clsx(
                                            "flex items-center gap-3 p-4 rounded-xl font-bold text-right transition-all",
                                            activeTab === 'message' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <FileText size={18} />
                                        محتوى الرسالة
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('recipients')}
                                        className={clsx(
                                            "flex items-center gap-3 p-4 rounded-xl font-bold text-right transition-all",
                                            activeTab === 'recipients' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <Users size={18} />
                                        المستلمين
                                        <span className="mr-auto bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">
                                            {recipientCount}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('attachments')}
                                        className={clsx(
                                            "flex items-center gap-3 p-4 rounded-xl font-bold text-right transition-all",
                                            activeTab === 'attachments' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <Paperclip size={18} />
                                        المرفقات
                                        {attachments.length > 0 && (
                                            <span className="mr-auto bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full">
                                                {attachments.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-8 overflow-y-auto">
                                    {activeTab === 'message' && (
                                        <div className="space-y-6 max-w-3xl mx-auto">
                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-gray-700">الموضوع (Subject)</label>
                                                <input
                                                    type="text"
                                                    value={emailSubject}
                                                    onChange={e => onSubjectChange(e.target.value)}
                                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="عنوان الرسالة..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-gray-700">نص الرسالة (Body)</label>
                                                <textarea
                                                    value={emailBody}
                                                    onChange={e => onBodyChange(e.target.value)}
                                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                                                    placeholder="محتوى الرسالة..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'recipients' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-black text-gray-900 text-lg">قائمة المستلمين ({recipientCount})</h3>
                                                <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1 rounded-full">
                                                    سيتم الإرسال إليهم جميعاً
                                                </span>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                {validFactories.map((f, i) => (
                                                    <div key={f.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800">{f.name}</p>
                                                                <p className="text-xs text-gray-400 font-mono">{f.email}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveRecipient(f.id!)}
                                                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                            title="إزالة من القائمة"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {validFactories.length === 0 && (
                                                    <div className="p-12 text-center text-gray-400">
                                                        لا يوجد مستلمين
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'attachments' && (
                                        <div className="space-y-6 text-center py-10">
                                            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 hover:bg-gray-50 transition-colors cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                                        <Paperclip size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-800 text-lg">اضغط لرفع ملفات</p>
                                                        <p className="text-gray-400 text-sm mt-1">أو اسحب الملفات هنا</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {attachments.length > 0 && (
                                                <div className="space-y-2 text-right">
                                                    <h4 className="font-bold text-gray-700 text-sm mb-2">الملفات المرفقة:</h4>
                                                    {attachments.map((file, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <FileText size={20} className="text-gray-400" />
                                                                <span className="font-bold text-gray-700 text-sm">{file.name}</span>
                                                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeAttachment(i)}
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-xl mt-4">
                                                        <AlertTriangle size={16} />
                                                        سيتم فتح Outlook، يرجى التأكد من إرفاق الملفات يدوياً إذا لم تظهر.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-6 shrink-0">
                                {/* Send Mode Toggle */}
                                <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl border border-gray-200 cursor-pointer" onClick={() => setIsSequential(!isSequential)}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-800">وضع الإرسال</span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            {isSequential ? 'تتابعي (واحد تلو الآخر)' : 'جماعي (Bulk BCC)'}
                                        </span>
                                    </div>
                                    {isSequential ? (
                                        <ToggleRight size={36} className="text-primary" />
                                    ) : (
                                        <ToggleLeft size={36} className="text-gray-300" />
                                    )}
                                </div>

                                <div className="flex gap-3 flex-1 justify-end">
                                    <button
                                        onClick={onClose}
                                        className="h-14 px-8 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={() => onConfirmSend(isSequential ? 'sequential' : 'bulk')}
                                        disabled={recipientCount === 0}
                                        className="h-14 px-8 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        <Send size={20} />
                                        {isSequential ? `بدء الإرسال (${recipientCount})` : `إرسال جماعي (${recipientCount})`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
