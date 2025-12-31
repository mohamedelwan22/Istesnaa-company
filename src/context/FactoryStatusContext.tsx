import React, { createContext, useContext, useState, useEffect } from 'react';

export type FactoryStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'certified';

interface FactoryStatusContextType {
    factoryStatuses: Record<string, FactoryStatus>;
    updateStatus: (factoryId: string, status: FactoryStatus) => void;
    getStatus: (factoryId: string) => FactoryStatus;
}

const FactoryStatusContext = createContext<FactoryStatusContextType | undefined>(undefined);

const STORAGE_KEY = 'estesnaa_factory_statuses';

export const FactoryStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [factoryStatuses, setFactoryStatuses] = useState<Record<string, FactoryStatus>>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(factoryStatuses));
    }, [factoryStatuses]);

    const updateStatus = (factoryId: string, status: FactoryStatus) => {
        setFactoryStatuses(prev => ({
            ...prev,
            [factoryId]: status
        }));
    };

    const getStatus = (factoryId: string): FactoryStatus => {
        return factoryStatuses[factoryId] || 'pending';
    };

    return (
        <FactoryStatusContext.Provider value={{ factoryStatuses, updateStatus, getStatus }}>
            {children}
        </FactoryStatusContext.Provider>
    );
};

export const useFactoryStatus = () => {
    const context = useContext(FactoryStatusContext);
    if (!context) {
        throw new Error('useFactoryStatus must be used within a FactoryStatusProvider');
    }
    return context;
};
