'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  // Floating animation variants for the background shapes
  const floatVariants = {
    initial: { y: 0, x: 0 },
    animate: {
      y: [0, -15, 0],
      x: [0, 10, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const floatVariantsReverse = {
    initial: { y: 0, x: 0 },
    animate: {
      y: [0, 15, 0],
      x: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="min-h-screen mt-32 lg:mt-0 bg-wix-gray-bg flex items-center justify-center relative overflow-hidden font-sans selection:bg-wix-purple/20 selection:text-wix-purple px-4">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <motion.div 
          initial="initial"
          animate="animate"
          className="absolute -top-[10%] -left-[5%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-wix-purple/5 backdrop-blur-3xl border border-wix-purple/10"
          style={{ transform: 'rotate(-15deg)' }}
        />
        <motion.div 
          initial="initial"
          animate="animate"
          className="absolute -bottom-[10%] -right-[5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] bg-black/5 backdrop-blur-3xl border border-black/5"
          style={{ transform: 'rotate(25deg)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[740px] bg-white border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          
          {/* Left/Top Content Area */}
          <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-wix-purple/10 flex items-center justify-center border border-wix-purple/20">
                  <Compass className="w-5 h-5 text-wix-purple" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-wix-purple">Error 404</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-medium text-wix-text-dark tracking-tight leading-[1.1] mb-6">
                Seems like<br />
                <span className="text-gray-400">you're lost</span>
              </h1>
              
              <p className="text-[15px] text-gray-500 mb-10 leading-relaxed font-light">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 bg-white text-wix-text-dark text-[13px] font-semibold hover:border-wix-text-dark hover:bg-gray-50 transition-all group"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-wix-text-dark transition-colors" />
                  Go Back
                </button>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-wix-text-dark text-white text-[13px] font-semibold border border-wix-text-dark hover:bg-wix-purple hover:border-wix-purple transition-all group"
                >
                  <Home className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  Hompage
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right/Bottom Glitch Graphic Area */}
          <div className="w-full md:w-[280px] bg-[#f8f8f8] flex items-center justify-center p-8 relative overflow-hidden min-h-[250px] md:min-h-full">
            <motion.div 
              className="absolute inset-0 bg-[#f8f8f8]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                backgroundSize: '100% 4px'
              }}
            />
            
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
                className="relative"
              >
                {/* 404 Text */}
                <span className="text-[100px] md:text-[120px] font-black text-gray-200 leading-none tracking-tighter select-none">
                  404
                </span>
                
                {/* Animated Glitch Layers */}
                <motion.span 
                  animate={{ 
                    x: [-2, 2, -1, 3, -2],
                    opacity: [0, 0.8, 0, 0.5, 0]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-[100px] md:text-[120px] font-black text-wix-purple/50 leading-none tracking-tighter absolute top-0 left-[2px] select-none mix-blend-multiply"
                >
                  404
                </motion.span>
                <motion.span 
                  animate={{ 
                    x: [2, -2, 1, -3, 2],
                    opacity: [0, 0.8, 0, 0.5, 0]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
                  className="text-[100px] md:text-[120px] font-black text-blue-500/50 leading-none tracking-tighter absolute top-0 -left-[2px] select-none mix-blend-multiply"
                >
                  404
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center mt-2"
              >
                <div className="bg-wix-text-dark text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                  Page Not Found
                </div>
              </motion.div>
            </div>
            
            {/* Subtle decorative crosses */}
            <div className="absolute top-4 left-4 text-gray-300 text-[10px]">+</div>
            <div className="absolute top-4 right-4 text-gray-300 text-[10px]">+</div>
            <div className="absolute bottom-4 left-4 text-gray-300 text-[10px]">+</div>
            <div className="absolute bottom-4 right-4 text-gray-300 text-[10px]">+</div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
