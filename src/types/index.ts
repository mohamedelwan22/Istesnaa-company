export interface Factory {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    industry?: string[];
    materials?: string[];
    capabilities?: string;
    scale?: 'prototype' | 'mass_production' | string;
    notes?: string;
    created_at?: string;
    batch_id?: string;
    batch_name?: string;
    is_contacted?: boolean;
    factory_status?: 'pending' | 'contacted' | 'approved' | 'rejected' | 'certified';
}

export interface Invention {
    id: string;
    name: string;
    description: string;
    industry: string;
    type: 'prototype' | 'mass_production' | 'License' | 'Sell Idea';
    materials: string[];
    country?: string;
    analysis_result?: any;
    created_at: string;
}

export interface ContactLog {
    id?: string;
    factory_id: number;
    factory_name: string;
    email: string;
    industry: string;
    sent_at: string;
    status: 'Sent' | 'Failed' | 'Pending';
    error_reason?: string;
}
