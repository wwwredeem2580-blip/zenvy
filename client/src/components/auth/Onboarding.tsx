'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { RoleCard } from '../ui/RoleCard';
import { Calendar, Ticket, ArrowRight, BotIcon, VideoIcon, ShoppingBag, ShoppingCart, ShoppingBasket, Building2, User, ChevronLeft } from 'lucide-react';

type OnboardingRole = 'host' | 'user';

interface OnboardingProps {
  onContinue: (role: OnboardingRole) => void;
  onLogin: () => void;
}

import { Logo } from '../shared/Logo';
import { useRouter } from 'next/navigation';

export const Onboarding: React.FC<OnboardingProps> = ({ onContinue, onLogin }) => {
  const router = useRouter();
  const [role, setRole] = useState<OnboardingRole>('host');

  // Added explicit Variants type to fix ease string assignment error
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.6 } }
  };

  // Added explicit Variants type to fix ease string assignment error
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col mt-9 lg:mt-0 lg:flex-row min-h-screen bg-white overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 z-10"
      >
        <div className="w-full max-w-[400px] space-y-4 sm:space-y-8">
          <motion.div variants={itemVariants} className="flex flex-col gap-6 mb-8 group cursor-pointer">
            <button
              onClick={() => router.push('/')} 
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors group font-[400]"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back To Landing Page
            </button>
            <Logo variant='full' className="text-neutral-950 max-w-[150px]" />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-[300] tracking-tight text-slate-950 lg:text-3xl">
              Start your journey
            </h1>
            <p className="text-slate-500 text-md sm:text-lg font-[300] leading-[1]">
              Experience events in a way you've never imagined. Choose your path to continue.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <RoleCard
              title="I am a Host"
              description="Organize hybrid events and grow your audience."
              icon={<Building2 size={24} />}
              selected={role === 'host'}
              onClick={() => setRole('host')}
            />
            <RoleCard
              title="I am a User"
              description="Discover and attend unique global experiences."
              icon={<User size={24} />}
              selected={role === 'user'}
              onClick={() => setRole('user')}
            />
          </motion.div>

          <motion.button
            variants={itemVariants}
            disabled={!role}
            onClick={() => role && onContinue(role)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-black text-white font-[500] py-3 sm:py-4 flex items-center justify-center gap-2 transition-all hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed border outline-none"
          >
            Get Started
            <ArrowRight size={20} />
          </motion.button>

          <motion.p variants={itemVariants} className="text-center text-slate-500 font-[400] text-sm">
            Already have an account? <button onClick={onLogin} className="text-wix-purple font-medium hover:underline transition-colors">Sign In</button>
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-wix-purple relative overflow-hidden items-center justify-center p-12"
      >
        {/* Sharp background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
        </div>

        <div className="w-full max-w-[500px] bg-white border border-wix-border-light shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] p-10 space-y-8 relative z-10">
          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 border border-wix-border-light" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-gray-100" />
                <div className="h-2 w-20 bg-gray-100" />
              </div>
            </div>
            <div className="h-10 w-10 bg-gray-100 border border-wix-border-light" />
          </div>

          <div className="space-y-4">
            <div className="h-12 w-4/5 bg-gray-100" />
            <div className="h-4 w-3/5 bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="aspect-video bg-gray-50 border border-wix-border-light flex items-center justify-center">
              <BotIcon className="text-gray-400" size={40} />
            </div>
            <div className="aspect-video bg-gray-50 border border-wix-border-light flex items-center justify-center">
              <Calendar className="text-gray-400" size={40} />
            </div>
          </div>

          <div className="p-8 bg-black text-white space-y-3 border-l-4 border-wix-purple shadow-[4px_4px_0_0_#e5e7eb]">
            <h3 className="font-[300] text-2xl tracking-tight leading-none text-white">Human-led, AI-powered</h3>
            <p className="text-white/80 leading-relaxed font-[300]">Built with Top-Notch precision. Every pixel optimized for your business success.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
