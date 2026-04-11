'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ClipboardList, Calendar, Tag, Wallet, 
  Undo2, Ban, AlertCircle, BadgeAlert, Shield, LogOut, Mail 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'registration', label: 'Registration', icon: <ClipboardList size={16} /> },
  { id: 'responsibility', label: 'Responsibility', icon: <Calendar size={16} /> },
  { id: 'pricing', label: 'Pricing', icon: <Tag size={16} /> },
  { id: 'payments', label: 'Payments', icon: <Wallet size={16} /> },
  { id: 'refund', label: 'Refunds', icon: <Undo2 size={16} /> },
  { id: 'prohibited', label: 'Prohibited', icon: <Ban size={16} /> },
  { id: 'liability', label: 'Liability', icon: <AlertCircle size={16} /> },
  { id: 'cancellation', label: 'Penalty', icon: <BadgeAlert size={16} /> },
  { id: 'indemnification', label: 'Indemnity', icon: <Shield size={16} /> },
  { id: 'termination', label: 'Termination', icon: <LogOut size={16} /> },
];

export default function OrganizerAgreementPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('registration');

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
            Organizer Agreement
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
              This Organizer Agreement governs your relationship with Zenvy as an event organizer. By registering as an organizer, you agree to these terms.
            </p>
          </motion.div>

          {/* 1. Organizer Registration */}
          <div id="registration" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <ClipboardList size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">1. Organizer Registration</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                  Organizer-কে valid information দিতে হবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                  Business verification required হতে পারে
                </li>
             </ul>
          </div>

          {/* 2. Event Responsibility */}
          <div id="responsibility" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <Calendar size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">2. Event Responsibility</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               Organizer responsible for:
             </p>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Event execution
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Venue, safety, security
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Legal permissions
               </li>
             </ul>
          </div>

          {/* 3. Ticket & Pricing */}
          <div id="pricing" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <Tag size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">3. Ticket & Pricing</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                  Organizer ticket price সেট করবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                  Zenvy commission/fee charge করবে
                </li>
             </ul>
          </div>

          {/* 4. Payments & Settlement */}
          <div id="payments" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Wallet size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">4. Payments & Settlement</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-300 mt-2.5 shrink-0" />
                  Ticket sale amount organizer-কে transfer করা হবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-300 mt-2.5 shrink-0" />
                  Settlement timeline: 7–15 working days after event
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-300 mt-2.5 shrink-0" />
                  Fraud/chargeback হলে payment hold হতে পারে
                </li>
             </ul>
          </div>

          {/* 5. Refund Responsibility */}
          <div id="refund" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                <Undo2 size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">5. Refund Responsibility</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                  Refund policy organizer define করবে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                  Event cancel হলে refund provide করা organizer-এর দায়িত্ব
                </li>
             </ul>
          </div>

          {/* 6. Prohibited Events */}
          <div id="prohibited" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <Ban size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">6. Prohibited Events</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               Organizer create করতে পারবে না:
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Illegal events', 'Adult বা restricted content', 'Fraud/scam related events'].map((item) => (
                   <div key={item} className="px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100 font-medium text-sm">
                      {item}
                   </div>
                ))}
             </div>
          </div>

          {/* 7. Liability */}
          <div id="liability" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <AlertCircle size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">7. Liability</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2.5 shrink-0" />
                  Event-related injury/damage-এর জন্য organizer দায়ী
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2.5 shrink-0" />
                  Zenvy কোনো legal claim-এর জন্য দায়ী নয়
                </li>
             </ul>
          </div>

          {/* 8. Cancellation & Penalty */}
          <div id="cancellation" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800 mb-6">
                <BadgeAlert size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">8. Cancellation & Penalty</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 shrink-0" />
                  Last-minute cancel করলে penalty apply হতে পারে
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 shrink-0" />
                  Repeated violation হলে account suspend
                </li>
             </ul>
          </div>

          {/* 9. Indemnification */}
          <div id="indemnification" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <Shield size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">9. Indemnification</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Organizer Zenvy-কে legal claim থেকে protect করবে
             </p>
          </div>

          {/* 10. Termination */}
          <div id="termination" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mb-6">
                <LogOut size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">10. Termination</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy যেকোনো সময় organizer account suspend করতে পারবে
             </p>
          </div>

          <div className="pt-12 border-t border-neutral-200">
             <div className="flex items-center gap-4 text-neutral-500 font-[300]">
                <Mail size={18} />
                <span>Contact Organizer Support: <a href="mailto:organizers@zenvy.com" className="text-brand-600 hover:underline">organizers@zenvy.com</a></span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
