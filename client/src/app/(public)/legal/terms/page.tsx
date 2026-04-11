'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, User, Ticket, 
  AlertTriangle, FileText, ShieldAlert, Scale, RefreshCw, Mail,
  ShoppingBag, Banknote, CalendarX, XCircle, Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'introduction', label: 'Introduction', icon: <FileText size={16} /> },
  { id: 'role', label: 'Platform Role', icon: <Ticket size={16} /> },
  { id: 'account', label: 'User Account', icon: <User size={16} /> },
  { id: 'purchase', label: 'Ticket Purchase', icon: <ShoppingBag size={16} /> },
  { id: 'pricing', label: 'Pricing & Fees', icon: <Banknote size={16} /> },
  { id: 'cancellation', label: 'Cancellation', icon: <CalendarX size={16} /> },
  { id: 'refund', label: 'Refund Policy', icon: <RefreshCw size={16} /> },
  { id: 'prohibited', label: 'Prohibited', icon: <AlertTriangle size={16} /> },
  { id: 'liability', label: 'Liability', icon: <ShieldAlert size={16} /> },
  { id: 'termination', label: 'Termination', icon: <XCircle size={16} /> },
  { id: 'law', label: 'Governing Law', icon: <Scale size={16} /> },
];

export default function TermsOfServicePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-0 font-sans selection:bg-brand-100 selection:text-brand-900">

      {/* Hero Header */}
      <div className="pt-12 pb-16 px-6 bg-radial-gradient from-brand-50/50 to-transparent">
        <div className="max-w-[1080px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
             <Button 
               variant="ghost" 
               onClick={() => router.back()} 
               className="pl-0 hover:bg-transparent hover:text-brand-600 text-neutral-400 font-light"
             >
               <ArrowLeft size={16} className="mr-2" /> Back
             </Button>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-[250] text-neutral-950 tracking-tighter mb-6"
          >
            Terms & Conditions
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-neutral-500 font-light text-sm"
          >
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-medium text-xs uppercase tracking-wider">Legal</span>
            <span>•</span>
            <span>Effective Date: April 12, 2026</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sticky Sidebar */}
        <div className="hidden lg:block lg:col-span-3 relative">
          <div className="sticky top-32 space-y-1">
             <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 pl-3">Sections</p>
             {sections.map((section) => (
               <button
                 key={section.id}
                 onClick={() => scrollTo(section.id)}
                 className={cn(
                   "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3",
                   activeSection === section.id 
                     ? "bg-brand-50 text-brand-700" 
                     : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                 )}
               >
                 {section.icon}
                 {section.label}
               </button>
             ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 lg:col-start-5 space-y-20">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="prose prose-neutral prose-lg max-w-none prose-headings:font-[300] prose-headings:tracking-tight prose-p:font-[300] prose-p:text-neutral-600 prose-li:font-[300] prose-li:text-neutral-600 prose-strong:font-medium prose-strong:text-neutral-900"
          >
            <p className="lead text-2xl font-[250] text-neutral-800 leading-relaxed">
              Welcome to Zenvy. By accessing or using our website/app, you agree to comply with these Terms & Conditions.
            </p>
          </motion.div>

          {/* Section 1: Introduction */}
          <div id="introduction" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-600 mb-6">
                <FileText size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">1. Introduction</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Welcome to Zenvy. By accessing or using our website/app, you agree to comply with these Terms & Conditions.
             </p>
          </div>

          {/* Section 2: Platform Role */}
          <div id="role" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Ticket size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">2. Platform Role</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                  Zenvy একটি ticketing marketplace/platform
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                  Zenvy নিজে কোনো event organize করে না (unless mentioned)
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                  Event-এর quality, safety, execution-এর জন্য Organizer দায়ী থাকবে
                </li>
             </ul>
          </div>

          {/* Section 3: User Account */}
          <div id="account" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <User size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">3. User Account</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2.5 shrink-0" />
                  User must provide accurate তথ্য
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2.5 shrink-0" />
                  Account misuse / fraud হলে Zenvy account suspend করতে পারবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2.5 shrink-0" />
                  User তার login credentials secure রাখবে
                </li>
             </ul>
          </div>

          {/* Section 4: Ticket Purchase */}
          <div id="purchase" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <ShoppingBag size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">4. Ticket Purchase</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                  Ticket purchase করলে তা final ধরা হবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                  Duplicate / resold ticket invalid হতে পারে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                  Event entry organizer-এর rules অনুযায়ী হবে
                </li>
             </ul>
          </div>

          {/* Section 5: Pricing & Fees */}
          <div id="pricing" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <Banknote size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">5. Pricing & Fees</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                  Ticket price organizer সেট করবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                  Zenvy service/convenience fee charge করতে পারে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                  এই fee সাধারণত non-refundable
                </li>
             </ul>
          </div>

          {/* Section 6: Event Cancellation / Changes */}
          <div id="cancellation" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                <CalendarX size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">6. Event Cancellation / Changes</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                  Event cancel/reschedule হলে organizer responsible
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                  Zenvy refund process facilitate করবে
                </li>
             </ul>
          </div>

          {/* Section 7: Refund Policy */}
          <div id="refund" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                <RefreshCw size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">7. Refund Policy</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               Refund applicable only if:
             </p>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 shrink-0" />
                  Event cancelled
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 shrink-0" />
                  Organizer approves refund
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 shrink-0" />
                  Refund processing time: 7–10 working days
                </li>
             </ul>
          </div>

          {/* Section 8: Prohibited Activities */}
          <div id="prohibited" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <AlertTriangle size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">8. Prohibited Activities</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               User নিচের কাজগুলো করতে পারবে না:
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Fake ticket sale', 'Fraudulent transactions', 'System abuse / hacking attempt'].map((item) => (
                   <div key={item} className="px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100 font-medium text-sm">
                      {item}
                   </div>
                ))}
             </div>
          </div>

          {/* Section 9: Limitation of Liability */}
          <div id="liability" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <ShieldAlert size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">9. Limitation of Liability</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2.5 shrink-0" />
                  Zenvy event quality, delay, injury, loss-এর জন্য দায়ী নয়
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2.5 shrink-0" />
                  Platform শুধুমাত্র intermediary হিসেবে কাজ করে
                </li>
             </ul>
          </div>

          {/* Section 10: Termination */}
          <div id="termination" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mb-6">
                <XCircle size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">10. Termination</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy যেকোনো সময় account suspend/terminate করতে পারবে
             </p>
          </div>

          {/* Section 11: Governing Law */}
          <div id="law" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                <Scale size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">11. Governing Law</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               এই agreement Bangladesh laws দ্বারা পরিচালিত হবে
             </p>
          </div>

          <div className="pt-12 border-t border-neutral-200">
             <div className="flex items-center gap-4 text-neutral-500 font-[300]">
                <Mail size={18} />
                <span>Contact Legal: <a href="mailto:legal@zenvy.com" className="text-brand-600 hover:underline">legal@zenvy.com</a></span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
