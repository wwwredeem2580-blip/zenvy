'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Shield, Lock, Eye, FileText, Server, 
  Database, Settings, Fingerprint, Share2, UserCheck, 
  History, Link, FileEdit, Mail 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'collection', label: 'Collection', icon: <Database size={16} /> },
  { id: 'usage', label: 'Usage', icon: <Settings size={16} /> },
  { id: 'cookies', label: 'Cookies', icon: <Fingerprint size={16} /> },
  { id: 'sharing', label: 'Sharing', icon: <Share2 size={16} /> },
  { id: 'security', label: 'Security', icon: <Lock size={16} /> },
  { id: 'rights', label: 'Rights', icon: <UserCheck size={16} /> },
  { id: 'retention', label: 'Retention', icon: <History size={16} /> },
  { id: 'third-party', label: 'Third-party', icon: <Link size={16} /> },
  { id: 'changes', label: 'Changes', icon: <FileEdit size={16} /> },
];

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('collection');

  // Smooth scroll handler
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  // Scroll spy to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header
      
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
            Privacy Policy
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-neutral-500 font-light text-sm"
          >
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-medium text-xs uppercase tracking-wider">Legal</span>
            <span>•</span>
            <span>Last Updated: April 12, 2026</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sticky Sidebar Navigation */}
        <div className="hidden lg:block lg:col-span-3 relative">
          <div className="sticky top-32 space-y-1">
             <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 pl-3">Contents</p>
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
              At Zenvy, we believe privacy is a fundamental right. This document outlines exactly what we collect, why we collect it, and how we protect your data.
            </p>
          </motion.div>

          {/* 1. Information We Collect */}
          <div id="collection" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Database size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">1. Information We Collect</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               আমরা collect করি:
             </p>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                 Name, phone number, email
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                 Location data
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2.5 shrink-0" />
                 Payment info (processed via third-party যেমন bKash, Nagad, SSLCommerz)
               </li>
             </ul>
          </div>

          {/* 2. How We Use Data */}
          <div id="usage" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <Settings size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">2. How We Use Data</h2>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Ticket processing
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Customer support
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Marketing & notifications
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2.5 shrink-0" />
                 Fraud prevention
               </li>
             </ul>
          </div>

          {/* 3. Cookies & Tracking */}
          <div id="cookies" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Fingerprint size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">3. Cookies & Tracking</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy cookies এবং tracking tools (Google Analytics, Firebase) ব্যবহার করে user experience improve করার জন্য
             </p>
          </div>

          {/* 4. Data Sharing */}
          <div id="sharing" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                <Share2 size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">4. Data Sharing</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               আমরা data share করতে পারি:
             </p>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2.5 shrink-0" />
                 Event organizers-এর সাথে (ticket validation-এর জন্য)
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2.5 shrink-0" />
                 Payment gateway providers
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2.5 shrink-0" />
                 Legal requirement হলে authorities-এর সাথে
               </li>
             </ul>
          </div>

          {/* 5. Data Security */}
          <div id="security" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                <Lock size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">5. Data Security</h2>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                 SSL encryption ব্যবহার করা হয়
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2.5 shrink-0" />
                 User data secure রাখার জন্য industry-standard practices follow করা হয়
               </li>
             </ul>
          </div>

          {/* 6. User Rights */}
          <div id="rights" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <UserCheck size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">6. User Rights</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed mb-4">
               User চাইলে:
             </p>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2.5 shrink-0" />
                 নিজের data access করতে পারবে
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2.5 shrink-0" />
                 Account delete করতে পারবে
               </li>
             </ul>
          </div>

          {/* 7. Data Retention */}
          <div id="retention" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <History size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">7. Data Retention</h2>
             <ul className="space-y-4">
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                 প্রয়োজন অনুযায়ী data retain করা হয়
               </li>
               <li className="flex items-start gap-3 text-neutral-600 font-[300]">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-2.5 shrink-0" />
                 Legal compliance অনুযায়ী data সংরক্ষণ করা হয়
               </li>
             </ul>
          </div>

          {/* 8. Third-party Services */}
          <div id="third-party" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Link size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">8. Third-party Services</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Zenvy third-party services ব্যবহার করে (Google, Firebase, Payment Gateway)
             </p>
          </div>

          {/* 9. Changes */}
          <div id="changes" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-800 mb-6">
                <FileEdit size={24} />
             </div>
             <h2 className="text-xl md:text-2xl font-[400] tracking-tight text-neutral-950">9. Changes</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Policy যেকোনো সময় update হতে পারে
             </p>
          </div>

          <div className="pt-12 border-t border-neutral-200">
            <p className="text-neutral-500 font-[300]">
              Questions? Contact our Data Protection Officer at <a href="mailto:privacy@zenvy.com" className="text-brand-600 hover:underline">privacy@zenvy.com</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
