import { supabase } from '../lib/supabase';
import type { Factory } from '../types';

export interface DuplicateGroup {
    primary: Factory;
    suspects: { factory: Factory; score: number; reason: string }[];
}

/**
 * Simple Levenshtein distance for fuzzy string comparison
 */
function levenshtein(a: string, b: string): number {
    const tmp: number[][] = [];
    for (let i = 0; i <= a.length; i++) tmp[i] = [i];
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,
                tmp[i][j - 1] + 1,
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return tmp[a.length][b.length];
}

function calculateSimilarity(a: string, b: string): number {
    const al = a.toLowerCase().trim();
    const bl = b.toLowerCase().trim();
    if (al === bl) return 100;
    const distance = levenshtein(al, bl);
    const maxLength = Math.max(al.length, bl.length);
    return Math.round((1 - distance / maxLength) * 100);
}

export const DeduplicationService = {
    /**
     * Finds suspected duplicates in the database.
     * Optimized with chunked processing to prevent blocking the main thread.
     */
    async findDuplicates(onProgress?: (processed: number, total: number) => void): Promise<DuplicateGroup[]> {
        const { data: factories, error } = await supabase
            .from('factories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!factories || factories.length === 0) return [];

        const groups: DuplicateGroup[] = [];
        const processedIds = new Set<string>();
        const total = factories.length;

        // Process in chunks to keep UI responsive
        const CHUNK_SIZE = 20;

        for (let i = 0; i < total; i++) {
            // Yield to main thread every few iterations
            if (i % CHUNK_SIZE === 0 && i > 0) {
                if (onProgress) onProgress(i, total);
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const f1 = factories[i];
            if (processedIds.has(f1.id)) continue;

            const suspects: { factory: Factory; score: number; reason: string }[] = [];

            for (let j = i + 1; j < total; j++) {
                const f2 = factories[j];
                if (processedIds.has(f2.id)) continue;

                // Pre-filtering: skip if they are in different cities and have no emails/phones to compare
                const hasContactInfo = (f1?.email && f2?.email) || (f1?.phone && f2?.phone);
                const cityMatch = f1?.city && f2?.city && f1.city.trim() === f2.city.trim();

                if (!hasContactInfo && !cityMatch) continue;

                let reason = '';
                let score = 0;

                // 1. Exact Email
                if (f1?.email && f2?.email && f1.email.trim().toLowerCase() === f2.email.trim().toLowerCase()) {
                    score = 100;
                    reason = 'بريد إلكتروني مطابق';
                }
                // 2. Exact Phone
                else if (f1?.phone && f2?.phone) {
                    const p1 = f1.phone.toString().replace(/\D/g, '');
                    const p2 = f2.phone.toString().replace(/\D/g, '');
                    if (p1 === p2 && p1.length > 5) {
                        score = 95;
                        reason = 'رقم هاتف مطابق';
                    }
                }
                // 3. Fuzzy Name + City
                else if (f1?.name && f2?.name && cityMatch) {
                    const nameSimilarity = calculateSimilarity(f1.name, f2.name);
                    if (nameSimilarity > 85) {
                        score = nameSimilarity;
                        reason = `تشابه كبير في الاسم (${nameSimilarity}%) مع تطابق المدينة`;
                    }
                }

                if (score >= 80) {
                    suspects.push({ factory: f2, score, reason });
                    processedIds.add(f2.id);
                }
            }

            if (suspects.length > 0) {
                groups.push({ primary: f1, suspects });
                processedIds.add(f1.id);
            }
        }

        if (onProgress) onProgress(total, total);
        return groups;
    },

    /**
     * Merges suspects into a primary factory record
     */
    async mergeRecords(_primaryId: string, suspectIds: string[]): Promise<void> {
        // In a real production scenario, we might want to consolidate related data (analysis requests, etc.)
        // For now, we delete the redundant records.
        const { error } = await supabase
            .from('factories')
            .delete()
            .in('id', suspectIds);

        if (error) throw error;
    }
};
