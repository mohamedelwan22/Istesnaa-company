import type { Factory, Invention } from '../types';

export const DocumentGenerator = {
    generateInternalReport(factory: Factory, invention: Partial<Invention>) {
        return `
تقرير تحليل الملاءمة الصناعية
----------------------------
التاريخ: ${new Date().toLocaleDateString('ar-EG')}
اسم الاختراع: ${invention.name}
المصنع المرشح: ${factory.name}

1. نظرة عامة على المشروع:
${invention.description}

2. أسباب الترشيح:
- التوافق مع القطاع الصناعي: ${Array.isArray(factory.industry) ? factory.industry.join(', ') : factory.industry}
- الموقع الجغرافي: ${factory.country} - ${factory.city}
- نوع الإنتاج المطلوب: ${invention.type === 'prototype' ? 'نموذج أولي' : 'إنتاج كمي'}

3. الكفاءة التشغيلية للمصنع:
- القدرات التقنية: ${factory.capabilities || 'متعددة التخصصات'}
- حجم العمليات: ${factory.scale || 'متوسط إلى كبير'}

4. التوصية الفنية:
بناءً على المعايير المقدمة، يعتبر ${factory.name} من أفضل الخيارات المتاحة لتنفيذ ${invention.name} نظراً لخبرتهم في ${factory.industry?.[0] || 'المجالات المشابهة'}.
        `.trim();
    },

    generateEmailDraft(factory: Factory, invention: Partial<Invention>) {
        return `
الموضوع: استعلام عن إمكانية تصنيع - ${invention.name}

السادة في ${factory.name} المحترمين،

نتواصل معكم لبحث إمكانية التعاون في تصنيع مشروعنا الجديد "${invention.name}". 

لقد وقع اختيارنا على مصنعكم الموقر بناءً على سمعتكم وخبرتكم في قطاع ${Array.isArray(factory.industry) ? factory.industry[0] : factory.industry}.

المشروع عبارة عن:
${invention.description}

نود الاستفسار عن:
1. إمكانية تنفيذ ${invention.type === 'prototype' ? 'نموذج أولي (Prototype)' : 'إنتاج كميات (Mass Production)'}.
2. التكلفة التقديرية والمخطط الزمني الأولي.
3. المتطلبات الفنية المطلوبة من طرفنا للبدء.

مرفق مع هذا الإيميل ملفات أولية (إذا وجدت). نتطلع لسماع ردكم في أقرب وقت لترتيب اجتماع أو مكالمة فنية.

مع خالص التحية والتقدير،
فريق عمل ${invention.name}
        `.trim();
    },

    generateNDA(factory: Factory, invention: Partial<Invention>) {
        const currentDate = new Date().toLocaleDateString('ar-EG');
        return `
اتفاقية صون السرية (NDA)
--------------------------
هذه الاتفاقية مبرمة في تاريخ ${currentDate} بين كل من:

الطرف الأول (المبتكر): صاحب مشروع "${invention.name}"
الطرف الثاني (المنشأة): ${factory.name}

الغرض:
يرغب الطرف الأول في عرض تفاصيل فنية وتقنية خاصة بـ "${invention.name}" على الطرف الثاني لغرض دراسة إمكانية التصنيع.

الالتزامات:
1. يلتزم الطرف الثاني بالحفاظ على سرية كافة المعلومات التي يتلقاها من الطرف الأول.
2. عدم استخدام هذه المعلومات لأي غرض غير غرض الدراسة والتنفيذ المتفق عليه.
3. عدم الإفصاح عن المعلومات لأي طرف ثالث دون موافقة كتابية مسبقة.

مدة السرية: تظل هذه الاتفافية سارية المفعول لمدة (3) سنوات من تاريخ التوقيع.

توقيع الطرف الأول: ....................
توقيع الطرف الثاني: ....................
        `.trim();
    },

    generateWhatsAppMessage(factory: Factory, invention: Partial<Invention>) {
        return `
السلام عليكم ورحمة الله وبركاته،
معك فريق تطوير مشروع "${invention.name}". 

كنا حابين نستفسر من مصنعكم الموقر (${factory.name}) عن إمكانية التعاون في تصنيع ${invention.type === 'prototype' ? 'نموذج أولي' : 'كميات'} للمشروع. 

هل نقدر نرسل لكم تفاصيل المشروع لمراجعتها من طرف القسم الفني عندكم؟

شكراً لكم.
        `.trim();
    }
};
