import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type FactoryStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'certified';

interface FactoryStatusContextType {
    factoryStatuses: Record<number, FactoryStatus>;
    contactedCount: number;
    contactedIds: Set<number>;
    updateStatus: (factoryId: number, status: FactoryStatus, extra?: { is_contacted?: boolean }) => Promise<void>;
    getStatus: (factoryId: number) => FactoryStatus | undefined;
    isContacted: (factoryId: number) => boolean;
    refreshStatuses: () => Promise<void>;
}

const FactoryStatusContext = createContext<FactoryStatusContextType | undefined>(undefined);

export const FactoryStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [factoryStatuses, setFactoryStatuses] = useState<Record<number, FactoryStatus>>({});
    const [contactedCount, setContactedCount] = useState(0);
    const [contactedIds, setContactedIds] = useState<Set<number>>(new Set());

    const refreshStatuses = async () => {
        try {
            // Use ONLY BIGINT id and factory_status
            const { data, error } = await supabase
                .from('factories')
                .select('id, factory_status, is_contacted');

            if (error) throw error;

            const incomingStatuses: Record<number, FactoryStatus> = {};
            const incomingContacted = new Set<number>();
            data?.forEach(f => {
                if (f.id) {
                    incomingStatuses[f.id] = (f.factory_status as FactoryStatus) || 'pending';
                    if (f.is_contacted) incomingContacted.add(f.id);
                }
            });

            // Context is source of truth: Local state (prev) wins if not pending
            setFactoryStatuses(prev => {
                const next = { ...incomingStatuses, ...prev };
                Object.keys(prev).forEach(idKey => {
                    const id = Number(idKey);
                    if (prev[id] !== 'pending' && next[id] === 'pending') {
                        next[id] = prev[id];
                    }
                });
                return next;
            });

            setContactedIds(prev => {
                const next = new Set(incomingContacted);
                prev.forEach(id => next.add(id)); // Once true, always true
                setContactedCount(next.size);
                return next;
            });
        } catch (err) {
            console.error('Error refreshing statuses:', err);
        }
    };

    useEffect(() => {
        refreshStatuses();
    }, []);

    const updateStatus = async (factoryId: number, status: FactoryStatus, extra?: { is_contacted?: boolean }) => {
        try {
            // Optimistic update
            setFactoryStatuses(prev => ({ ...prev, [factoryId]: status }));

            const updates: any = { factory_status: status };

            // Canonical Model: is_contacted = true (only when pending or explicitly requested)
            // Once true, never false.
            if (status === 'contacted' || extra?.is_contacted) {
                updates.is_contacted = true;
                if (!contactedIds.has(factoryId)) {
                    setContactedCount(prev => prev + 1);
                    setContactedIds(prev => new Set(prev).add(factoryId));
                }
            }

            // Persist using ONLY BIGINT id
            const { error } = await supabase
                .from('factories')
                .update(updates)
                .eq('id', factoryId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating status:', err);
            refreshStatuses();
        }
    };

    const getStatus = (factoryId: number): FactoryStatus | undefined => {
        return factoryStatuses[factoryId];
    };

    const isContacted = (factoryId: number): boolean => {
        return contactedIds.has(factoryId);
    };

    return (
        <FactoryStatusContext.Provider value={{ factoryStatuses, contactedCount, contactedIds, updateStatus, getStatus, isContacted, refreshStatuses }}>
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
