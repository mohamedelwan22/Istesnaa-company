import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type FactoryStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'certified';

interface FactoryStatusContextType {
    factoryStatuses: Record<string, FactoryStatus>;
    updateStatus: (factoryId: string, status: FactoryStatus) => Promise<void>;
    getStatus: (factoryId: string) => FactoryStatus;
    refreshStatuses: () => Promise<void>;
}

const FactoryStatusContext = createContext<FactoryStatusContextType | undefined>(undefined);

export const FactoryStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [factoryStatuses, setFactoryStatuses] = useState<Record<string, FactoryStatus>>({});

    const refreshStatuses = async () => {
        try {
            const { data, error } = await supabase
                .from('factories')
                .select('id, factory_code, status');

            if (error) {
                if (error.code === '42703') {
                    console.warn('Status column does not exist yet. Please run the SQL migration.');
                    return;
                }
                throw error;
            }

            const statuses: Record<string, FactoryStatus> = {};
            data?.forEach(f => {
                const id = f.id || f.factory_code;
                if (id) {
                    statuses[id] = (f.status as FactoryStatus) || 'pending';
                }
            });
            setFactoryStatuses(statuses);
        } catch (err) {
            console.error('Error refreshing statuses:', err);
        }
    };

    useEffect(() => {
        refreshStatuses();
    }, []);

    const updateStatus = async (factoryId: string, status: FactoryStatus) => {
        try {
            // First update local state for immediate UI feedback
            setFactoryStatuses(prev => ({
                ...prev,
                [factoryId]: status
            }));

            // Then persist to database
            // We check both id (UUID) and factory_code to be safe, depending on what was passed
            let query = supabase.from('factories').update({ status });

            if (factoryId.includes('-')) {
                // Likely a UUID
                query = query.eq('id', factoryId);
            } else {
                // Likely a factory_code
                query = query.eq('factory_code', factoryId);
            }

            const { error } = await query;
            if (error) throw error;
        } catch (err) {
            console.error('Error updating status:', err);
            // Revert local state on error
            refreshStatuses();
        }
    };

    const getStatus = (factoryId: string): FactoryStatus => {
        return factoryStatuses[factoryId] || 'pending';
    };

    return (
        <FactoryStatusContext.Provider value={{ factoryStatuses, updateStatus, getStatus, refreshStatuses }}>
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
