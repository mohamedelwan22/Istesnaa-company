import * as XLSX from 'xlsx';
import type { Factory } from '../types';

export interface ParseResult {
    data: Partial<Factory>[];
    errors: { row: number; reason: string; data: any }[];
    headers: string[];
    summary: {
        total: number;
        valid: number;
        invalid: number;
    };
}

const COLUMN_MAPS = {
    name: [
        'اسم المصنع', 'الأسم', 'Name', 'Factory Name',
        'اسم المنشأة الصناعية حسب الرخصة الصناعية',
        'اسم المنشأة الصناعية', 'اسم المنشأة', 'المنشأة',
        'جهة التصنيع', 'اسم الشركه', 'اسم الشركة'
    ],
    email: [
        'البريد الإلكتروني', 'الايميل', 'Email', 'E-mail',
        'بريد المدير العام', 'بريد المدير التنفيذي',
        'بريد ضابط الاتصال', 'بريد مدير المصنع',
        'بريد المدير المالي', 'بريد مدير الإنتاج', 'ايميل'
    ],
    phone: [
        'رقم الهاتف', 'تليفون', 'موبايل', 'Phone', 'Mobile',
        'جوال المدير العام', 'جوال المدير التنفيذي',
        'جوال ضابط الاتصال', 'جوال مدير المصنع',
        'جوال المدير المالي', 'جوال مدير الإنتاج', 'الهاتف'
    ],
    city: [
        'المدينة', 'المحافظة', 'City',
        'المنطقة', 'city', 'توزيع المناطق'
    ],
    industry: [
        'المجال الصناعي', 'التخصص', 'Industry',
        'القطاع', 'النشاط الصناعي الرئيسي حسب الرخصة',
        'النشاط غير الصناعي الرئيسي',
        'النشاط على المستوى الثاني', 'النشاط على المستوى الرابع',
        'النشاط', 'industry'
    ],
    materials: ['المواد', 'خامات', 'Materials', 'materials'],
    capabilities: ['قدرات التصنيع', 'Capabilities', 'capabilities', 'القدرات'],
    scale: [
        'حجم المصنع', 'Scale',
        'حجم المنشأة (كبير، متوسط، صغير)',
        'حجم المنشأة الصناعية', 'scale'
    ],
    notes: ['ملاحظات', 'Notes', 'notes']
};

export const parseFactoryExcel = (file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(15, rawData.length); i++) {
                    const row = rawData[i];
                    const rowText = row.join(' ').toLowerCase();
                    if (rowText.includes('اسم') || rowText.includes('منشأة') || rowText.includes('رخصة') || rowText.includes('name')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                let jsonData: any[];
                if (headerRowIndex >= 0) {
                    jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
                } else {
                    jsonData = XLSX.utils.sheet_to_json(sheet, { range: 0 }); // Try from top if no obvious header found
                }

                const result: ParseResult = {
                    data: [],
                    errors: [],
                    headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
                    summary: { total: jsonData.length, valid: 0, invalid: 0 }
                };

                result.data = jsonData.map((row: any, index: number) => {
                    const getValue = (keys: string[]) => {
                        const normalizedKeys = keys.map(k => k.trim().toLowerCase());
                        const rowKeys = Object.keys(row);
                        const foundKey = rowKeys.find(rk => normalizedKeys.includes(rk.trim().toLowerCase()));
                        return foundKey ? row[foundKey] : undefined;
                    };

                    const factory: Partial<Factory> = {
                        name: getValue(COLUMN_MAPS.name),
                        email: getValue(COLUMN_MAPS.email),
                        phone: getValue(COLUMN_MAPS.phone),
                        country: 'السعودية', // Default
                        city: getValue(COLUMN_MAPS.city),
                        industry: (getValue(COLUMN_MAPS.industry) || '').toString().split(/[,،\n]/).map((s: string) => s.trim()).filter(Boolean),
                        materials: (getValue(COLUMN_MAPS.materials) || '').toString().split(/[,،]/).map((s: string) => s.trim()).filter(Boolean),
                        capabilities: getValue(COLUMN_MAPS.capabilities),
                        scale: getValue(COLUMN_MAPS.scale),
                        notes: getValue(COLUMN_MAPS.notes),
                    };

                    // Validation log
                    if (!factory.name && !factory.email && !factory.phone) {
                        result.errors.push({
                            row: index + (headerRowIndex + 2),
                            reason: 'Missing critical data (Name, Email, or Phone)',
                            data: row
                        });
                        return null;
                    }

                    result.summary.valid++;
                    return factory;
                }).filter((f): f is Partial<Factory> => f !== null);

                result.summary.invalid = result.errors.length;
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
