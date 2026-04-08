'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  Users, 
  Heart, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Logo } from '../shared/Logo';
import { useRouter } from 'next/navigation';

const About: React.FC = () => {
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
            <Globe size={12} />
            Our Mission
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-light text-neutral-950 tracking-tighter leading-[1.1]"
          >
            Building the digital <br />
            <span className="text-brand-600 italic">trust layer</span> for events.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-[300] text-neutral-600 max-w-[1080px] mx-auto leading-relaxed"
          >
            Zenvy isn't just a ticketing platform. It's the infrastructure for the next generation of safe, verified, and high-fidelity live experiences in Bangladesh.
          </motion.p>
        </div>
      </section>

      {/* The Problem / Solution Narrative */}
      <section className="py-12 px-6 bg-neutral-50/50">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-light text-neutral-950 tracking-tight">
              Moving from <span className="font-normal italic text-neutral-400">Chaos</span> to <span className="font-medium text-brand-600">Structure</span>.
            </h2>
            <div className="space-y-4 text-neutral-600 font-light leading-relaxed">
              <p>
                For too long, the event industry in Bangladesh has been polarized. On one side, unchecked "open" platforms where scams run rampant. On the other, "gatekept" platforms that stifle creativity.
              </p>
              <p>
                We asked a simple question: <strong className="font-medium text-neutral-900">Can we build a platform that is open to everyone, yet safer than a bank?</strong>
              </p>
              <p>
                The answer is Zenvy. A hybrid system where anyone can draft an event, but only verified humans can publish. Where payouts are automated, but disputes are mediated.
              </p>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleExplore} variant="brand-outline" className="rounded-xl h-12 px-6">
                See Our Standard
              </Button>
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="relative"
          >
            <div className="aspect-square rounded-[3rem] bg-brand-600 overflow-hidden relative shadow-2xl p-10 flex flex-col justify-between group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="relative z-1 text-white space-y-2">
                    <ShieldCheck size={48} className="mb-4" />
                    <h3 className="text-2xl font-light text-white">Verified Identity</h3>
                    <p className="opacity-80 font-light text-sm leading-relaxed">Every host on Zenvy has provided government ID and venue verifications. We know exactly who they are.</p>
                </div>

                <div className="relative z-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-8">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">1</div>
                        <div className="h-0.5 flex-1 bg-white/20"></div>
                        <div className="w-10 h-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold shadow-lg">2</div>
                        <div className="h-0.5 flex-1 bg-white/20"></div>
                         <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">3</div>
                     </div>
                     <p className="text-white text-xs font-medium text-center uppercase tracking-widest">Multi-Stage Verification</p>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values Grid */}
      <section className="py-24 px-6">
        <div className="max-w-[1080px] mx-auto space-y-16">
          <div className="text-center max-w-[800px] mx-auto space-y-4">
            <h2 className="text-3xl font-light text-neutral-950 tracking-tight">Why we built this.</h2>
            <p className="text-neutral-500 font-light">
              We are a team of engineers, designers, and event organizers who were tired of the "good enough" standard. We built the platform we wanted to use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               {
                 icon: <Zap size={24} />,
                 title: "Speed with Safety",
                 desc: "We believe verification shouldn't be a bottleneck. Our systems are designed to verify valid hosts in hours, not weeks."
               },
               {
                 icon: <Heart size={24} />,
                 title: "Human-Centric Design",
                 desc: "Software should feel like a premium product. We obsess over every interaction, animation, and pixel."
               },
               {
                 icon: <TrendingUp size={24} />,
                 title: "Economic Fairness",
                 desc: "We protect attendees from price gouging and ensure hosts get paid faster than any other platform."
               }
             ].map((item, i) => (
               <motion.div 
                 key={i}
                 whileHover={{ y: -5 }}
                 className="p-8 rounded-[2rem] border border-brand-200 bg-white shadow-sm hover:shadow-xl transition-all"
               >
                 <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                   {item.icon}
                 </div>
                 <h3 className="text-xl font-medium text-neutral-900 mb-3">{item.title}</h3>
                 <p className="text-neutral-500 font-light leading-relaxed text-sm">
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

export default About;