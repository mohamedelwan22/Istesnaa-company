export interface Factory {
    id?: string;
    factory_code?: string;
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
    approved?: boolean;
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
