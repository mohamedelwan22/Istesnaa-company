import { supabase } from '../lib/supabase';
import type { Factory, Invention } from '../types';

interface MatchResult extends Factory {
    matchScore: number;
    matchReason: string[];
    explanation: string;
    stabilityIndex: number; // 0 to 1, how stable this rank is
}

/**
 * Signal patterns for manufacturing processes and materials
 */
const SIGNALS = {
    materials: {
        'بلاستيك': ['بلاستيك', 'بوليمر', 'plastic', 'بولي', 'لدائن'],
        'حديد': ['حديد', 'صلب', 'ستيل', 'steel', 'iron', 'معادن'],
        'ألمنيوم': ['ألمنيوم', 'ألومنيوم', 'aluminum'],
        'خشب': ['خشب', 'wood', 'نجارة'],
        'قماش': ['قماش', 'نسيج', 'textile', 'ملابس'],
        'كهرباء': ['كهرباء', 'electrical', 'إلكترونيات', 'electronics', 'سلك', 'كابل'],
    },
    processes: {
        'cnc': ['cnc', 'سي ان سي', 'خرط', 'فريزة'],
        'حقن': ['حقن', 'قوالب', 'injection'],
        'لحام': ['لحام', 'welding'],
        'تجميع': ['تجميع', 'تركيب', 'assembly'],
        'طباعة': ['طباعة', 'printing', 'ثلاثية'],
    }
};

/**
 * Maps UI technical names to Arabic database keywords
 */
const INDUSTRY_MAP: Record<string, string[]> = {
    'electronics': ['كهرباء', 'إلكترونيات', 'معدات كهربائية'],
    'plastic': ['بلاستيك', 'مطاط', 'لدائن', 'بوليمر'],
    'metal': ['معادن', 'حديد', 'صلب', 'ألمنيوم'],
    'textile': ['منسوجات', 'قماش', 'ملابس'],
    'food': ['غذائية', 'أغذية', 'مشروبات'],
    'machinery': ['آلات', 'معدات', 'ميكانيكا'],
    'automotive': ['سيارات', 'مركبات'],
    'aquaculture': ['استزراع', 'مائي', 'أسماك']
};

const extractSignals = (text: string) => {
    const found: string[] = [];
    const lowText = text.toLowerCase();

    Object.entries(SIGNALS.materials).forEach(([key, variants]) => {
        if (variants.some(v => lowText.includes(v))) found.push(`مادة: ${key}`);
    });

    Object.entries(SIGNALS.processes).forEach(([key, variants]) => {
        if (variants.some(v => lowText.includes(v))) found.push(`عملية: ${key}`);
    });

    return found;
};

export const findTopFactories = async (invention: Partial<Invention>): Promise<MatchResult[]> => {
    let allFactories: Factory[] = [];
    let from = 0;
    let to = 999;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase.from('factories').select('*').range(from, to);
        if (error) break;
        if (data && data.length > 0) {
            allFactories = [...allFactories, ...data];
            if (data.length < 1000) hasMore = false;
            else { from += 1000; to += 1000; }
        } else hasMore = false;
    }

    if (allFactories.length === 0) return [];

    const inventionSignals = extractSignals((invention.description || '') + ' ' + (invention.name || ''));
    const inventionIndustry = (invention.industry || '').toLowerCase();
    const mappedKeywords = INDUSTRY_MAP[inventionIndustry] || [];

    // 1. Scoring Logic with Weights
    const calculateScore = (factory: Factory, weights = { industry: 40, keywords: 40, type: 10, country: 10 }) => {
        let score = 0;
        const reasons: string[] = [];

        const factoryIndustries = (Array.isArray(factory.industry) ? factory.industry : [factory.industry])
            .filter((i): i is string => typeof i === 'string');
        const factoryMetadata = ((factory.capabilities || '') + ' ' + (factory.notes || '') + ' ' + (factory.name || '') + ' ' + factoryIndustries.join(' ')).toLowerCase();

        // Industry Match (Improved with Mapping)
        const hasIndustryMatch = factoryIndustries.some(ind => {
            const lowInd = (ind || '').toLowerCase();
            return mappedKeywords.some(k => lowInd.includes(k)) || lowInd.includes(inventionIndustry);
        });

        if (hasIndustryMatch) {
            score += weights.industry;
            reasons.push('تطابق في القطاع الصناعي');
        }

        // Signal/Keyword Match
        const factorySignals = extractSignals(factoryMetadata);
        const commonSignals = inventionSignals.filter(s => factorySignals.includes(s));

        // Also check raw mapped keywords in metadata even if signals didn't catch them
        const extraKeywordsFound = mappedKeywords.filter(k => factoryMetadata.includes(k));

        if (commonSignals.length > 0 || extraKeywordsFound.length > 0) {
            const matchCount = commonSignals.length + extraKeywordsFound.length;
            const keywordScore = Math.min(weights.keywords, matchCount * 15);
            score += keywordScore;
            if (commonSignals.length > 0) reasons.push(`توافق تقني (${commonSignals.join(', ')})`);
            else reasons.push('توافق في الكلمات المفتاحية');
        }

        // Scale/Type Match
        if (factory.scale && invention.type && (
            factory.scale.toLowerCase().includes(invention.type.toLowerCase()) ||
            invention.type.toLowerCase().includes(factory.scale.toLowerCase())
        )) {
            score += weights.type;
            reasons.push('تناسب حجم الإنتاج');
        }

        // Location Match
        if (invention.country && factory.country && (
            factory.country.toLowerCase().includes(invention.country.toLowerCase()) ||
            invention.country.toLowerCase().includes(factory.country.toLowerCase())
        )) {
            score += weights.country;
            reasons.push('تواجد جغرافيا مفضل');
        }

        return { score, reasons };
    };

    // 2. Main Run
    const scored = allFactories.map(factory => {
        const { score, reasons } = calculateScore(factory);

        // --- Sensitivity Analysis (Stability Index) ---
        const variations = [
            { industry: 50, keywords: 30, type: 10, country: 10 },
            { industry: 20, keywords: 60, type: 10, country: 10 }
        ];

        let stableCount = 0;
        variations.forEach(v => {
            const vScore = calculateScore(factory, v).score;
            if (Math.abs(vScore - score) < 20) stableCount++;
        });

        const stabilityIndex = stableCount / variations.length;

        const explanation = reasons.length > 0
            ? `تم اختيار ${factory.name} بناءً على ${reasons.join(' و')}.`
            : `تم ترشيح هذا المصنع بناءً على توافق المجال العام مع متطلباتك.`;

        // Normalize industry and materials for safe UI rendering
        const normalizeArray = (val: any): string[] => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
            return [];
        };

        return {
            ...factory,
            industry: normalizeArray(factory.industry),
            materials: normalizeArray(factory.materials),
            matchScore: Math.min(score, 100),
            matchReason: reasons,
            explanation,
            stabilityIndex
        };
    });

    // 3. Filtering and Sorting
    let filtered = scored.filter(f => f.matchScore >= 15);

    // If no good matches, be more lenient
    if (filtered.length === 0) {
        filtered = scored.filter(f => f.matchScore >= 5).slice(0, 3);
    }

    return filtered
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
};
