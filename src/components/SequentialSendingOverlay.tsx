import { motion, AnimatePresence } from 'framer-motion';
import { Send, SkipForward, X, Mail } from 'lucide-react';
import type { Factory } from '../types';

interface SequentialSendingOverlayProps {
    isOpen: boolean;
    currentIndex: number;
    totalCount: number;
    currentFactory: Factory | null;
    onSend: () => void;
    onSkip: () => void;
    onCancel: () => void;
}

export const SequentialSendingOverlay = ({
    isOpen,
    currentIndex,
    totalCount,
    currentFactory,
    onSend,
    onSkip,
    onCancel
}: SequentialSendingOverlayProps) => {
    if (!currentFactory) return null;

    const progress = ((currentIndex + 1) / totalCount) * 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black">جاري الإرسال التتابعي</h2>
                                <p className="text-gray-400 text-sm font-bold mt-1">
                                    المصنع {currentIndex + 1} من {totalCount}
                                </p>
                            </div>
                            <button
                                onClick={onCancel}
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-100 w-full">
                            <motion.div
                                className="h-full bg-green-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-100">
                                <Mail size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">{currentFactory.name}</h3>
                                <p className="text-gray-500 font-mono text-sm bg-gray-100 py-1 px-3 rounded-full inline-block">
                                    {currentFactory.email}
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs font-bold text-yellow-800">
                                عند الضغط على "إرسال"، سيتم فتح Outlook وتحديث حالة المصنع تلقائياً إلى "قيد التواصل"
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={onSkip}
                                    className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <SkipForward size={20} />
                                    تخطي
                                </button>
                                <button
                                    onClick={onSend}
                                    className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={20} />
                                    فتح Outlook وإرسال
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
