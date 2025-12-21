import { useState } from 'react';
import {
    Search, PenTool, MapPin, CheckCircle,
    Loader2, Phone, Mail, Globe, Shield, Zap, Target,
    ArrowLeft, MessageSquare, Info, Star, Package, FileText
} from 'lucide-react';
import { findTopFactories } from '../services/MatchingService';
import { FeedbackService } from '../services/FeedbackService';
import { supabase } from '../lib/supabase';
import type { Invention } from '../types';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { DocumentModal } from '../components/DocumentModal';
import clsx from 'clsx';

// --- Components ---

const FloatingCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    // Standard Framer Motion 12 spring usage with MotionValue
    const xVal = useMotionValue(0);
    const yVal = useMotionValue(0);
    const x = useSpring(xVal, { stiffness: 100, damping: 30 });
    const y = useSpring(yVal, { stiffness: 100, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        xVal.set((e.clientX - centerX) / 15);
        yVal.set((e.clientY - centerY) / 15);
    };

    const handleMouseLeave = () => {
        xVal.set(0);
        yVal.set(0);
    };

    return (
        <motion.div
            style={{ x, y, perspective: "1000px" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const FeatureIcon = ({ icon: Icon, title, desc, delay = 0 }: { icon: any, title: string, desc: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        viewport={{ once: true }}
        className="flex flex-col items-center text-center p-6 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
            <Icon size={32} />
        </div>
        <h4 className="font-bold text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

const MovingBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
        {/* Soft Off-White Base */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#f0f4f8] via-background to-[#ffffff]" />

        {/* 3D Animated Orbs with Navy/Primary Tones */}
        <motion.div
            animate={{
                x: [0, 50, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px]"
        />
        <motion.div
            animate={{
                x: [0, -40, 0],
                y: [0, 60, 0],
                scale: [1.1, 1, 1.1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-900/5 rounded-full blur-[80px]"
        />
        <motion.div
            animate={{
                x: [0, 30, 0],
                y: [0, 40, 0],
                rotate: 180,
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px]"
        />

        {/* Subtle Noise/Texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-90 contrast-125" />

        {/* Delicate Perspective Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(10,31,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(10,31,68,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
);

export const Landing = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Partial<Invention>>({
        name: '',
        description: '',
        industry: 'electronics',
        type: 'prototype',
        materials: [],
        country: ''
    });

    const [materialInput, setMaterialInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [selectedFactoryForDocs, setSelectedFactoryForDocs] = useState<any>(null);

    const handleAddMaterial = () => {
        if (materialInput.trim() && !formData.materials?.includes(materialInput)) {
            setFormData(prev => ({ ...prev, materials: [...(prev.materials || []), materialInput] }));
            setMaterialInput('');
        }
    };

    const handleAnalyze = async () => {
        if (!formData.description || !formData.name) return;

        setIsAnalyzing(true);
        // Simulate "Processing" feel
        await new Promise(r => setTimeout(r, 2500));

        try {
            const matches = await findTopFactories(formData);

            // Persist the request to Supabase
            await supabase.from('inventions').insert([{
                name: formData.name,
                description: formData.description,
                industry: formData.industry,
                type: formData.type,
                materials: formData.materials,
                country: formData.country,
                analysis_result: matches
            }]);

            setResults(matches);
            // Scroll to results
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Analysis/Saving error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen font-sans selection:bg-primary selection:text-white overflow-x-hidden" dir="rtl">
            <MovingBackground />

            <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-gray-100 bg-white/70">
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 10 }}
                            className="w-12 h-12 bg-white rounded-xl shadow-lg shadow-primary/5 overflow-hidden flex items-center justify-center border border-gray-100"
                        >
                            <img src="/logo.png" alt="Estesnaa" className="w-full h-full object-cover" />
                        </motion.div>
                        <span className="text-2xl font-black text-primary tracking-tight">استصناع</span>
                    </div>

                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all font-bold text-sm"
                    >
                        <span>دخول الإدارة</span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <Shield size={14} />
                        </div>
                    </button>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24">
                <AnimatePresence mode="wait">
                    {!results ? (
                        <motion.div
                            key="input-form"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="container mx-auto px-6"
                        >
                            {/* Hero Section */}
                            <div className="max-w-3xl mx-auto text-center mb-16 space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-block px-4 py-1.5 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                >
                                    الجيل القادم من تكنولوجيا التصنيع
                                </motion.div>
                                <h1 className="text-5xl md:text-6xl font-black text-primary leading-[1.15]">
                                    حول فكرتك إلى <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-primary">واقع ملموس</span>
                                </h1>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-bold">
                                    نحن نربط المبدعين بأفضل المصانع العالمية باستخدام خوارزميات مطابقة ذكية لضمان أعلى جودة بأفضل سعر.
                                </p>
                            </div>

                            {/* Main Form Container */}
                            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                                {/* Form */}
                                <div className="lg:col-span-7 space-y-8">
                                    <FloatingCard className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden">
                                        <div className="relative z-10 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                        <PenTool size={14} /> اسم الاختراع
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name || ''}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full h-14 px-6 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700"
                                                        placeholder="مثال: ذراع آلي ذكي"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                        <Target size={14} /> نوع التصنيع
                                                    </label>
                                                    <select
                                                        value={formData.type || 'prototype'}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                        className="w-full h-14 px-6 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                                    >
                                                        <option value="prototype">نموذج أولي (Prototype)</option>
                                                        <option value="mass_production">إنتاج كمي (Mass Production)</option>
                                                        <option value="License">ترخيص (License)</option>
                                                        <option value="Sell Idea">بيع الفكرة (Sell Idea)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                    <Info size={14} /> وصف الفكرة
                                                </label>
                                                <textarea
                                                    value={formData.description || ''}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full p-6 bg-gray-50/50 border border-gray-200 rounded-[2rem] h-40 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700 resize-none"
                                                    placeholder="اشرح لنا كيف يعمل مشروعك، ما هي المشكلة التي يحلها؟"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                        <Zap size={14} /> القطاع الصناعي
                                                    </label>
                                                    <select
                                                        value={formData.industry || 'machinery'}
                                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                        className="w-full h-14 px-6 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                                    >
                                                        <option value="machinery">الآلات والمعدات الميكانيكية</option>
                                                        <option value="automotive">صناعة السيارات والمركبات</option>
                                                        <option value="electronics">الإلكترونيات والمعدات الكهربائية</option>
                                                        <option value="plastic">البلاستيك والمطاط (اللدائن)</option>
                                                        <option value="metal">المعادن وتشكيل الصلب</option>
                                                        <option value="textile">المنسوجات والأزياء</option>
                                                        <option value="food">الصناعات الغذائية والمشروبات</option>
                                                        <option value="aquaculture">الاستزراع المائي والسمكي</option>
                                                        <option value="general">تصنيع عام / أخرى</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                        <Globe size={14} /> الدولة المفضلة
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.country || ''}
                                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                        className="w-full h-14 px-6 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700"
                                                        placeholder="مصر، الصين، ألمانيا..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-sm font-black text-gray-400 mr-2 flex items-center gap-2">
                                                    <Package size={14} /> المواد الأساسية
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={materialInput}
                                                        onChange={(e) => setMaterialInput(e.target.value)}
                                                        className="flex-1 h-14 px-6 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700"
                                                        placeholder="أضف مادة... (مثل: معدن، سيليكون)"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                                                    />
                                                    <button
                                                        onClick={handleAddMaterial}
                                                        className="h-14 px-8 bg-gray-800 text-white rounded-2xl font-black hover:bg-gray-900 transition-colors shadow-lg shadow-gray-200"
                                                    >
                                                        إضافة
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 flex-wrap">
                                                    {formData.materials?.map((m, i) => (
                                                        <motion.span
                                                            key={i}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="bg-primary/5 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 group"
                                                        >
                                                            {m}
                                                            <button
                                                                onClick={() => setFormData({ ...formData, materials: formData.materials?.filter((_, idx) => idx !== i) })}
                                                                className="text-primary/40 hover:text-red-500 transition-colors text-lg"
                                                            >
                                                                ×
                                                            </button>
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAnalyze}
                                                disabled={isAnalyzing || !formData.name || !formData.description}
                                                className="w-full group h-20 bg-primary text-white rounded-[2rem] font-black text-xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300 flex justify-center items-center gap-4 disabled:opacity-50 disabled:translate-y-0"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="animate-spin" />
                                                        <span className="animate-pulse">جاري فحص طلبك...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        ابدأ التحليل الآن
                                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-[-4px] transition-transform">
                                                            <ArrowLeft size={20} />
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </FloatingCard>
                                </div>

                                {/* Features Column */}
                                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                    <FeatureIcon
                                        icon={Zap}
                                        title="تحليل فوري دقيق"
                                        desc="خوارزميتنا تقوم بمسح آلاف المصانع في أجزاء من الثانية للعثور على الملاءمة المثالية."
                                        delay={0.1}
                                    />
                                    <FeatureIcon
                                        icon={Shield}
                                        title="مصانع موثوقة"
                                        desc="نحن نتعامل فقط مع المصانع التي اجتازت معايير الجودة والاعتماد الدولية."
                                        delay={0.2}
                                    />
                                    <FeatureIcon
                                        icon={Globe}
                                        title="توسع عالمي"
                                        desc="وصول مباشر لمصانع في أكثر من 30 دولة حول العالم بمختلف التخصصات."
                                        delay={0.3}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="container mx-auto px-6 max-w-6xl"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                                <div className="space-y-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: 60 }}
                                        className="h-1 bg-primary rounded-full mb-4"
                                    />
                                    <h3 className="text-4xl font-black text-gray-900 leading-tight">
                                        تم العثور على <span className="text-primary italic">نتائج مذهلة</span> لك
                                    </h3>
                                    <p className="text-gray-500 font-bold">بناءً على معايير الاختراع: {formData.name}</p>
                                </div>
                                <button
                                    onClick={() => setResults(null)}
                                    className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/20"
                                >
                                    <ArrowLeft className="rotate-180" size={20} />
                                    إجراء بحث جديد
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {results.length > 0 ? (
                                    results.map((factory, index) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.15 }}
                                            key={factory.id}
                                            className="group bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-12 relative overflow-hidden hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2"
                                        >
                                            {/* Rank Badge */}
                                            <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
                                                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-primary/30">
                                                    <span className="text-[10px] uppercase font-black opacity-60">المركز</span>
                                                    <span className="text-2xl font-black">0{index + 1}</span>
                                                </div>
                                                <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 text-sm font-black flex items-center gap-2">
                                                    <Star size={14} className="fill-current" />
                                                    تطابق {factory.matchScore}%
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                                <div className="lg:col-span-7 space-y-8">
                                                    <div className="space-y-4">
                                                        <h4 className="text-4xl font-black text-gray-900 group-hover:text-primary transition-colors">
                                                            {factory.name || 'مصنع غير مسمى'}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-4 text-gray-500">
                                                            <span className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-sm font-bold">
                                                                <MapPin size={16} className="text-gray-400" /> {factory.country || 'غير محدد'} - {factory.city || 'غير محدد'}
                                                            </span>
                                                            <span className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-sm font-bold capitalize">
                                                                <PenTool size={16} className="text-gray-400" /> {factory.scale || 'تصنيع عام'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                                                        <div className="space-y-4">
                                                            <p className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                                                                <CheckCircle size={20} className="text-primary" /> تحليل الذكاء الاصطناعي للمطابقة
                                                            </p>
                                                            <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-1 h-full bg-primary" />
                                                                <p className="text-gray-700 font-bold leading-relaxed">
                                                                    {factory.explanation || `تم ترشيح ${factory.name} بناءً على توافق الملف التعاوني مع متطلبات مشروعك.`}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3">
                                                            {(factory.matchReason || []).map((r: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-primary font-black text-[10px] bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 uppercase tracking-wider">
                                                                    <Zap size={10} />
                                                                    {r}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="pt-4 border-t border-gray-200/50 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">مؤشر الاستقرار</span>
                                                                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(factory.stabilityIndex || 0.7) * 100}%` }}
                                                                        className={clsx(
                                                                            "h-full rounded-full transition-all duration-1000",
                                                                            (factory.stabilityIndex || 0.7) > 0.8 ? "bg-green-500" : "bg-primary"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                                <Shield size={10} /> VERIFIED
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="font-black text-gray-400 text-xs uppercase tracking-widest mr-2">التصنيفات والمواد</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(Array.isArray(factory.industry) ? factory.industry : []).map((ind: string, i: number) => (
                                                                <span key={i} className="px-5 py-2 bg-blue-50 text-primary rounded-xl text-xs font-black uppercase tracking-tight">
                                                                    {ind}
                                                                </span>
                                                            ))}
                                                            {(Array.isArray(factory.materials) ? factory.materials : []).map((m: string, i: number) => (
                                                                <span key={i} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black">
                                                                    {m}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-5">
                                                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 space-y-6">
                                                        <h5 className="font-black text-primary text-xl mb-4">بيانات التواصل المباشر</h5>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
                                                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                                                    <Phone size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-gray-400 font-black uppercase">رقم الهاتف</p>
                                                                    <p className="text-gray-800 font-black" dir="ltr">{factory.phone || 'غير مسجل'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
                                                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                                    <Mail size={24} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-[10px] text-gray-400 font-black uppercase">البريد الإلكتروني</p>
                                                                    <p className="text-gray-800 font-black truncate max-w-[200px]">{factory.email || 'غير مسجل'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 grid grid-cols-2 gap-4">
                                                            <button
                                                                className="flex items-center justify-center gap-2 h-14 bg-primary text-white rounded-2xl font-black hover:bg-blue-800 transition-colors shadow-lg shadow-primary/20"
                                                                onClick={() => {
                                                                    if (factory.phone && factory.id) {
                                                                        FeedbackService.logCommunication({ factoryId: factory.id, type: 'whatsapp' });
                                                                        const cleanPhone = factory.phone.toString().replace(/\D/g, '');
                                                                        window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                                    }
                                                                }}
                                                            >
                                                                <MessageSquare size={18} /> واتساب
                                                            </button>
                                                            <button
                                                                className="flex items-center justify-center gap-2 h-14 bg-white border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary/5 transition-all"
                                                                onClick={() => setSelectedFactoryForDocs(factory)}
                                                            >
                                                                <FileText size={18} /> المستندات
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Background Decor */}
                                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200"
                                    >
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                            <Search size={40} />
                                        </div>
                                        <h4 className="text-2xl font-black text-gray-800 mb-2">عذراً، لم نجد مصانع تطابق طلبك بدقة</h4>
                                        <p className="text-gray-500 font-bold mb-8">حاول تغيير الكلمات الوصفية أو اختيار قطاع صناعي مختلف لإعطاء المحرك فرصة أكبر.</p>
                                        <button
                                            onClick={() => setResults(null)}
                                            className="px-10 py-4 bg-gray-800 text-white rounded-2xl font-black hover:bg-black transition-all"
                                        >
                                            تعديل بيانات البحث
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <Footer />

            <DocumentModal
                isOpen={!!selectedFactoryForDocs}
                onClose={() => setSelectedFactoryForDocs(null)}
                factory={selectedFactoryForDocs || {}}
                invention={formData}
            />
        </div>
    );
};
