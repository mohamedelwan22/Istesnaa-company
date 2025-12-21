import { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
    requireTextConfirmation?: boolean;
    confirmationText?: string;
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
    requireTextConfirmation = false,
    confirmationText = ''
}: ConfirmDialogProps) => {
    const [inputValue, setInputValue] = useState('');

    const handleConfirm = () => {
        if (requireTextConfirmation && inputValue !== confirmationText) {
            return;
        }
        onConfirm();
        setInputValue('');
    };

    const canConfirm = !requireTextConfirmation || inputValue === confirmationText;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" size={24} />
                    <p className="text-gray-700">{message}</p>
                </div>

                {requireTextConfirmation && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            اكتب "{confirmationText}" للتأكيد:
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder={confirmationText}
                        />
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
