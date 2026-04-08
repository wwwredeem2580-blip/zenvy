'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';
import { Logo } from '../shared/Logo';
import { useRouter } from 'next/navigation';

const Contact: React.FC = () => {
  const router = useRouter();

  const handleLogin = () => router.push('/auth?tab=login');
  const handleGetStarted = () => router.push('/onboarding');
  const handleExplore = () => router.push('/events');

  return (
    <div className="min-h-screen bg-neutral-0 font-sans selection:bg-brand-100 selection:text-brand-900">

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(103,61,230,0.04)_0%,_transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1080px] mx-auto text-center relative z-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-brand-600 text-[10px] font-bold uppercase tracking-widest"
          >
            <MessageSquare size={12} />
            Contact Us
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-light text-neutral-950 tracking-tighter leading-[1.1]"
          >
            We'd love to <br />
            <span className="text-brand-600 italic">hear from you.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-[300] text-neutral-600 max-w-[600px] mx-auto leading-relaxed"
          >
            Whether you have a question about features, pricing, or just want to say hello, our team is ready to answer all your questions.
          </motion.p>
        </div>
      </section>

      {/* Contact Cards Grid */}
      <section className="py-12 px-6">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               {
                 icon: <Mail size={24} />,
                 title: "Email Support",
                 desc: "support@zenvy.com.bd",
                 label: "Drop us a line"
               },
               {
                 icon: <MapPin size={24} />,
                 title: "Office Address",
                 desc: "Muhammudia R/A, House No-1, Akhalia, Sylhet.",
                 label: "Visit our HQ"
               },
               {
                 icon: <ShieldCheck size={24} />,
                 title: "Legal Information",
                 desc: "Trade License No: 1230049893",
                 label: "The fine print"
               }
             ].map((item, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 viewport={{ once: true }}
                 whileHover={{ y: -5 }}
                 className="p-8 rounded-[2rem] border border-brand-200 bg-white shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group"
               >
                 <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                   {item.icon}
                 </div>
                 <span className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">{item.label}</span>
                 <h3 className="text-xl font-medium text-neutral-900 mb-3">{item.title}</h3>
                 <p className="text-neutral-500 font-light leading-relaxed text-sm max-w-[250px]">
                   {item.desc}
                 </p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-neutral-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-1 space-y-8">
            <Logo variant="icon" className="w-16 h-16 text-white mx-auto opacity-90" />
            
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
              Ready to experience <br /> the <span className="text-brand-400 italic">new standard?</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button 
                onClick={handleExplore} 
                className="h-14 px-8 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-base"
              >
                Explore Events
              </Button>
              <Button 
                onClick={handleGetStarted} 
                variant="outline"
                className="h-14 px-8 rounded-xl border-neutral-800 text-white hover:bg-neutral-900 hover:text-white text-base"
              >
                Become a Host
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;