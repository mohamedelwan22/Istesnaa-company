import { motion } from 'framer-motion';
import { Mail, Phone, Globe, Heart, MessageSquare, Send } from 'lucide-react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8 relative z-10 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03]">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:40px_40px]" />
            </div>

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex items-center justify-center">
                                <img src="/logo.png" alt="Estesnaa" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">استصناع</span>
                        </div>
                        <p className="text-gray-500 font-bold leading-relaxed max-w-sm">
                            المنصة الرائدة لربط المبدعين والمخترعين بأفضل المنشآت الصناعية. نحن نسعى لتمكين الابتكار العربي وتحويل الأفكار إلى منتجات عالمية بجودة استثنائية.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-primary/20 pb-2 inline-block">تواصل معنا</h4>
                        <div className="space-y-4">
                            <a href="mailto:contact@estesnaa.com" className="flex items-center gap-3 text-gray-500 hover:text-primary transition-colors font-bold group">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Mail size={16} />
                                </div>
                                <span>contact@estesnaa.com</span>
                            </a>
                            <a href="tel:+0569832511" className="flex items-center gap-3 text-gray-500 hover:text-primary transition-colors font-bold group">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Phone size={16} />
                                </div>
                                <span dir="ltr">+0569832511</span>
                            </a>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-primary/20 pb-2 inline-block">المنصة</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-500 font-bold">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                    <Globe size={16} />
                                </div>
                                <span>المملكة العربية السعودية</span>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <p className="text-xs font-black text-primary uppercase mb-1">حالة النظام</p>
                                <p className="text-[10px] text-primary/60 font-bold">كل الأنظمة تعمل بكفاءة عالية ✅</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400">
                    <div className="flex items-center gap-1">
                        <span>جميع الحقوق محفوظة © {currentYear} منصة استصناع</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>صنع بكل</span>
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <Heart className="text-red-500 fill-current" size={14} />
                        </motion.span>
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                            <span className="text-gray-900">المهندس / محمد علوان</span>
                            <div className="w-px h-3 bg-gray-200" />
                            <a href="tel:01159279716" className="hover:text-primary transition-colors ltr" dir="ltr">01159279716</a>
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://wa.me/201159279716"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                                    title="WhatsApp"
                                >
                                    <MessageSquare size={14} />
                                </a>
                                <a
                                    href="https://t.me/+201159279716"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 bg-blue-400 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                                    title="Telegram"
                                >
                                    <Send size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
