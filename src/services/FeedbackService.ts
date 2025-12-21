import { supabase } from '../lib/supabase';

export interface CommunicationLog {
    id: string;
    factory_id: string;
    type: 'whatsapp' | 'email' | 'call';
    invention_id?: string;
    status: 'sent' | 'failed';
    created_at: string;
}

export const FeedbackService = {
    /**
     * Logs a communication attempt with a factory
     */
    async logCommunication(data: {
        factoryId: string;
        type: 'whatsapp' | 'email' | 'call';
        inventionId?: string;
    }): Promise<void> {
        try {
            await supabase.from('communication_logs').insert([{
                factory_id: data.factoryId,
                type: data.type,
                invention_id: data.inventionId,
                status: 'sent'
            }]);
        } catch (error) {
            console.error('Error logging communication:', error);
            // We don't throw here to avoid breaking the user flow if the table doesn't exist
        }
    },

    /**
     * Gets factory performance metrics
     */
    async getFactoryPerformance(factoryId: string) {
        const { data, count } = await supabase
            .from('communication_logs')
            .select('*', { count: 'exact' })
            .eq('factory_id', factoryId);

        return {
            totalInteractions: count || 0,
            logs: data || []
        };
    },

    /**
     * Gets global communication stats
     */
    async getGlobalStats() {
        const { data, error } = await supabase
            .from('communication_logs')
            .select('*');

        if (error) return null;

        return {
            total: data.length,
            byType: {
                whatsapp: data.filter(l => l.type === 'whatsapp').length,
                email: data.filter(l => l.type === 'email').length,
            }
        };
    }
};
