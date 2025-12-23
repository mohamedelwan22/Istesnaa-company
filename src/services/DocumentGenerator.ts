import type { Factory, Invention } from '../types';

export const DocumentGenerator = {
    generateInternalReport(factory: Factory, invention: Partial<Invention>) {
        const ind = factory.industry ? (Array.isArray(factory.industry) ? factory.industry.join(', ') : factory.industry) : 'غير محدد';
        return `
تقرير تحليل الملاءمة الصناعية
----------------------------
التاريخ: ${new Date().toLocaleDateString('ar-EG')}
اسم الاختراع: ${invention.name || 'غير محدد'}
المصنع المرشح: ${factory.name || 'غير محدد'}

1. نظرة عامة على المشروع:
${invention.description || 'لا يوجد وصف'}

2. أسباب الترشيح:
- التوافق مع القطاع الصناعي: ${ind}
- الموقع الجغرافي: ${factory.country || 'غير محدد'} - ${factory.city || ''}
- نوع الإنتاج المطلوب: ${invention.type === 'prototype' ? 'نموذج أولي' : 'إنتاج كمي'}

3. الكفاءة التشغيلية للمصنع:
- القدرات التقنية: ${factory.capabilities || 'متعددة التخصصات'}
- حجم العمليات: ${factory.scale || 'متوسط إلى كبير'}

4. التوصية الفنية:
بناءً على المعايير المقدمة، يعتبر ${factory.name || 'المصنع'} من أفضل الخيارات المتاحة لتنفيذ ${invention.name || 'المشروع'} نظراً لخبرتهم في ${Array.isArray(factory.industry) ? (factory.industry[0] || 'المجال') : (factory.industry || 'المجال')}.
        `.trim();
    },

    generateEmailDraft(factory: Factory, invention: Partial<Invention>) {
        return `
الموضوع: استعلام عن إمكانية تصنيع - ${invention.name || 'مشروع جديد'}

السادة في ${factory.name || 'المصنع'} المحترمين،

نتواصل معكم لبحث إمكانية التعاون في تصنيع مشروعنا الجديد "${invention.name || '...'}" . 

لقد وقع اختيارنا على مصنعكم الموقر بناءً على سمعتكم وخبرتكم في قطاع ${Array.isArray(factory.industry) ? (factory.industry[0] || 'الصناعي') : (factory.industry || 'الصناعي')}.

المشروع عبارة عن:
${invention.description || 'تفاصيل المشروع...'}

نود الاستفسار عن:
1. إمكانية تنفيذ ${invention.type === 'prototype' ? 'نموذج أولي (Prototype)' : 'إنتاج كميات (Mass Production)'}.
2. التكلفة التقديرية والمخطط الزمني الأولي.
3. المتطلبات الفنية المطلوبة من طرفنا للبدء.

مرفق مع هذا الإيميل ملفات أولية (إذا وجدت). نتطلع لسماع ردكم في أقرب وقت لترتيب اجتماع أو مكالمة فنية.

مع خالص التحية والتقدير،
فريق عمل ${invention.name || 'المشروع'}
        `.trim();
    },

    generateNDAStage1(factory: Factory, invention: Partial<Invention>) {
        return `
الموضوع: استكشاف فرص تعاون مبدئي - اتفاقية سرية (NDA)

السادة في ${factory.name || 'المصنع'} المحترمين،

نحن بصدد تطوير ابتكار صناعي جديد في مجال قد يتقاطع مع خطوط إنتاجكم الحالية. حرصاً منا على حماية حقوق الملكية الفكرية ومصالح الطرفين، نود توقيع اتفاقية عدم إفصاح (NDA) تمهيداً لمشاركة تفاصيل المشروع معكم.

الملخص العام (بدون تفاصيل فنية):
- المجال: ${invention.industry || 'عام'}
- نوع التعاون المطلوب: ${invention.type === 'prototype' ? 'تصنيع نموذج أولي' : 'إنتاج تجاري'}

يرجى تأكيد اهتمامكم المبدئي لنرسل لكم مسودة الاتفاقية للتوقيع.

مع التقدير،
فريق التطوير
        `.trim();
    },

    generateNDAStage2(factory: Factory, invention: Partial<Invention>) {
        const currentDate = new Date().toLocaleDateString('ar-EG');
        return `
اتفاقية عدم إفصاح (NDA) وتفاصيل المشروع
----------------------------------------
تاريخ التفعيل: ${currentDate}

الطرف الأول (المكشوف، صاحب الابتكار): مشروع "${invention.name || '...'}"
الطرف الثاني (المتلقي): ${factory.name || '...'}

بناءً على تواصلنا السابق، وبموجب موافقتكم على مبدأ السرية، إليكم التفاصيل التقنية للمشروع لغرض الدراسة الفنية فقط:

1. وصف الاختراع:
${invention.description || ''}

2. المواد المقترحة:
${(invention.materials || []).join('، ') || 'غير محدد'}

3. النطاق الجغرافي المستهدف:
${invention.country || 'غير محدد'}

يلتزم الطرف الثاني بعدم استغلال هذه المعلومات تجارياً أو مشاركتها مع طرف ثالث دون إذن كتابي صريح.

توقيع الطرف الأول: ____________________
توقيع الطرف الثاني: ____________________
        `.trim();
    },

    generateWhatsAppMessage(factory: Factory, invention: Partial<Invention>) {
        return `
السلام عليكم ورحمة الله وبركاته،
معك فريق تطوير مشروع "${invention.name || '...'}". 

كنا حابين نستفسر من مصنعكم الموقر (${factory.name || '...'}) عن إمكانية التعاون في تصنيع ${invention.type === 'prototype' ? 'نموذج أولي' : 'كميات'} للمشروع. 

هل نقدر نرسل لكم تفاصيل المشروع لمراجعتها من طرف القسم الفني عندكم؟

شكراً لكم.
        `.trim();
    }
};
