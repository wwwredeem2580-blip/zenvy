'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, FileText, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'collection', label: 'Info Collection', icon: <Eye size={16} /> },
  { id: 'usage', label: 'How We Use It', icon: <FileText size={16} /> },
  { id: 'sharing', label: 'Sharing & Disclosure', icon: <Server size={16} /> },
  { id: 'retention', label: 'Data Retention', icon: <Database size={16} /> },
  { id: 'rights', label: 'Your Rights', icon: <Shield size={16} /> },
  { id: 'security', label: 'Security', icon: <Lock size={16} /> },
];

import { Database } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('collection');

  const handleLogin = () => router.push('/auth?tab=login');
  const handleGetStarted = () => router.push('/onboarding');
  
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
            <span>Last Updated: February 9, 2026</span>
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
              At Zenvy, we believe privacy is a fundamental right, not a feature setting. This document outlines exactly what we collect, why we collect it, and how we protect the data that powers your experience.
            </p>
          </motion.div>

          <div id="collection" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Eye size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">1. Information We Collect</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               We collect information to provide a seamless ticketing experience. This includes data you explicitly provide and data we collect automatically.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <h3 className="font-medium text-neutral-900 mb-2">You Provide</h3>
                  <ul className="space-y-2 text-sm text-neutral-600 font-[300]">
                    <li>• Account credentials (Name, Email)</li>
                    <li>• Billing & Payment Details</li>
                    <li>• Host Verification Documents (NID, Passport)</li>
                    <li>• Event details and media</li>
                  </ul>
               </div>
               <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <h3 className="font-medium text-neutral-900 mb-2">We Collect</h3>
                  <ul className="space-y-2 text-sm text-neutral-600 font-[300]">
                    <li>• Device and browser information</li>
                    <li>• Usage patterns and interaction data</li>
                    <li>• IP address and location data</li>
                    <li>• Transaction history</li>
                  </ul>
               </div>
             </div>
          </div>

          <div id="usage" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <FileText size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">2. How We Use Your Information</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               Data isn't just stored; it's used to power the platform's core mechanics. We strictly use your data for:
             </p>
             <ul className="space-y-4 mt-4">
               {[
                 "Processing secure transactions and payouts.",
                 "Verifying host identity to prevent fraud.",
                 "Delivering digital tickets and QR codes.",
                 "Communicating important event updates or cancellations.",
                 "Preventing platform abuse and ensuring safety."
               ].map((item, i) => (
                 <li key={i} className="flex items-start gap-3 text-neutral-600 font-[300]">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
                   {item}
                 </li>
               ))}
             </ul>
          </div>

          <div id="sharing" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Server size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">3. Sharing & Disclosure</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               We are not a data broker. We do not sell your personal information. We only share data when necessary for the service to function.
             </p>
             <div className="space-y-6 mt-6">
                <div className="flex gap-4">
                   <div className="w-1 bg-brand-200 rounded-full" />
                   <div>
                      <h4 className="font-medium text-neutral-900">With Event Organizers</h4>
                      <p className="text-sm text-neutral-600 font-[300] mt-1">When you buy a ticket, the organizer receives your name and email to manage the guest list. They do not receive your payment info.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="w-1 bg-brand-200 rounded-full" />
                   <div>
                      <h4 className="font-medium text-neutral-900">Service Providers</h4>
                      <p className="text-sm text-neutral-600 font-[300] mt-1">Trusted partners who handle specific functions like Payment Processing (SSL Commerz, Stripe) and Email Delivery.</p>
                   </div>
                </div>
             </div>
          </div>

          <div id="retention" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <Database size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">4. Data Retention</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               We retain personal data only as long as necessary.
             </p>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               For active accounts, we allow you to edit or delete data at any time. For legal and audit purposes, transaction records may be kept for a longer period as required by tax laws in Bangladesh.
             </p>
          </div>

          <div id="rights" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <Shield size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">5. Your Rights</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {['Access', 'Rectification', 'Erasure', 'Portability'].map((right) => (
                  <div key={right} className="px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-700 font-[350]">
                     {right}
                  </div>
                ))}
             </div>
             <p className="text-neutral-600 font-[300] mt-4">
               You can exercise these rights directly from your Account Settings or by contacting us.
             </p>
          </div>

          <div id="security" className="scroll-mt-32 space-y-6">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                <Lock size={24} />
             </div>
             <h2 className="text-3xl font-[300] tracking-tight text-neutral-950">6. Security</h2>
             <p className="text-neutral-600 font-[300] leading-relaxed">
               We employ industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Sensitive payout details are handled by compliant payment processors and never hit our servers directly.
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
