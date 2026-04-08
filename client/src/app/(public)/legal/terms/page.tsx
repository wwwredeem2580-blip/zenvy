'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, User, Calendar, Ticket, 
  AlertTriangle, FileText, ShieldAlert, Scale, RefreshCw, Mail 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'acceptance', label: 'Acceptance', icon: <CheckCircle2 size={16} /> },
  { id: 'account', label: 'Account', icon: <User size={16} /> },
  { id: 'hosting', label: 'Hosting Events', icon: <Calendar size={16} /> },
  { id: 'tickets', label: 'Ticket Purchases', icon: <Ticket size={16} /> },
  { id: 'prohibited', label: 'Prohibited Conduct', icon: <AlertTriangle size={16} /> },
  { id: 'ip', label: 'Intellectual Property', icon: <FileText size={16} /> },
  { id: 'liability', label: 'Liability', icon: <ShieldAlert size={16} /> },
  { id: 'law', label: 'Governing Law', icon: <Scale size={16} /> },
];

export default function TermsOfServicePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('acceptance');

  const handleLogin = () => router.push('/auth?tab=login');
  const handleGetStarted = () => router.push('/onboarding');
  
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
            Terms of Service
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-neutral-500 font-light text-sm"
          >
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-medium text-xs uppercase tracking-wider">Legal</span>
            <span>•</span>
            <span>Effective Date: February 9, 2026</span>
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
              Welcome to Zenvy. These Terms of Service constitute a legally binding agreement between you and Zenvy Inc. regarding your use of our platform.
            </p>
          </motion.div>

          <div id="acceptance" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <CheckCircle2 size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">1. Acceptance of Terms</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               By accessing or using Zenvy, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree, you are not authorized to use the Services.
             </p>
          </div>

          <div id="account" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <User size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">2. Account Registration</h2>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2.5 shrink-0" />
                  You must be at least 18 years old to register.
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2.5 shrink-0" />
                  You are responsible for maintaining the security of your account credentials.
                </li>
                <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2.5 shrink-0" />
                  We reserve the right to suspend accounts that violate our community standards.
                </li>
             </ul>
          </div>

          <div id="hosting" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                <Calendar size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">3. Hosting Events</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Hosts are the architects of the Zenvy ecosystem. As a host, you warrant that:
             </p>
             <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 mt-4 space-y-4">
                <p className="text-neutral-700 font-[350]">
                   You possess the legal right to organize the event.
                </p>
                <p className="text-neutral-700 font-[350]">
                   You will accurately represent the venue, schedule, and pricing.
                </p>
                <p className="text-neutral-700 font-[350]">
                   You will comply with all local laws regarding safety and capacity.
                </p>
             </div>
          </div>

          <div id="tickets" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <Ticket size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">4. Ticket Purchases</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy acts as the agent for the Event Organizer. When you purchase a ticket, you are entering into a contract with the Organizer.
             </p>
             <p className="text-neutral-500 font-light text-sm italic">
               *Refunds are subject to the specific policy set by the Organizer or our default 7-day guarantee for cancelled events.
             </p>
          </div>

          <div id="prohibited" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <AlertTriangle size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">5. Prohibited Conduct</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               We have zero tolerance for:
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Fraudulent Events', 'Scalping / Resale', 'Harassment', 'Illegal Content'].map((item) => (
                   <div key={item} className="px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100 font-medium text-sm">
                      {item}
                   </div>
                ))}
             </div>
          </div>

          <div id="ip" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-600 mb-6">
                <FileText size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">6. Intellectual Property</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               The Zenvy platform, including its code, design, and "Zenvy" trademark, is owned by Zenvy Inc. Content uploaded by Hosts remains their property, but they grant Zenvy a license to display it for the purpose of selling tickets.
             </p>
          </div>

          <div id="liability" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <ShieldAlert size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">7. Limitation of Liability</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy provides the platform "as is". We are not liable for the actions of Event Organizers or Attendees, including personal injury or property damage occurred at an event.
             </p>
          </div>

          <div id="law" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                <Scale size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">8. Governing Law</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               These Terms are governed by the laws of Bangladesh. Exclusive jurisdiction for any dispute resides in the courts of Dhaka.
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
