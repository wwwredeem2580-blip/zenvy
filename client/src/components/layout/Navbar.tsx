'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  User, 
  ChevronDown 
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth';
import { authService } from '@/lib/api/auth';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Explore', href: '/events' },
    { name: 'Dashboard', href: '/host/dashboard', role: 'host' },
    { name: 'Create Event', href: '/host/events/create', role: 'host' },
    { name: 'Wallet', href: '/wallet', role: 'user' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const activeLinkClass = "text-ink";
  const inactiveLinkClass = "text-ink/60 hover:text-ink";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[5000] transition-all duration-500 px-6 md:px-12 py-6 flex justify-between items-center ${scrolled || pathname !== '/' ? 'bg-bg/80 backdrop-blur-md border-b border-ink/5' : ''}`}>
        <div className="flex items-center gap-12">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center"
          >
            <Logo variant="full" className="h-7 w-auto text-ink" animated />
          </button>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
            {navLinks.map((link) => {
              if (link.role && user?.role !== link.role) return null;
              const isActive = pathname === link.href;
              return (
                <button 
                  key={link.name}
                  onClick={() => router.push(link.href)}
                  className={`transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <button 
                onClick={() => router.push('/auth?tab=login')}
                className="hidden md:flex items-center gap-2 text-sm font-medium uppercase tracking-widest hover:text-ink/60 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/onboarding')}
                className="bg-ink text-bg px-6 py-2.5 rounded-full text-[8px] sm:text-[13px] font-medium uppercase tracking-widest hover:bg-ink/90 transition-all"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogout}
                className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
              >
                Sign Out
              </button>
              
              <button 
                onClick={() => user.role === 'host' ? router.push('/host/profile') : null}
                className={cn(
                  "w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center transition-all overflow-hidden",
                  user.role === 'host' ? "hover:scale-105 hover:border-ink/30 cursor-pointer" : "cursor-default"
                )}
              >
                {user.email ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-bg z-[5001] p-12 flex flex-col justify-center gap-12"
          >
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-8 right-8 p-2"
            >
              <X size={32} />
            </button>
            <div className="flex flex-col gap-8 text-5xl font-serif">
              {navLinks.map((link) => {
                if (link.role && user?.role !== link.role) return null;
                return (
                  <button 
                    key={link.name}
                    onClick={() => router.push(link.href)}
                    className="text-left text-3xl md:text-5xl"
                  >
                    {link.name}
                  </button>
                );
              })}
              {user && (
                <button 
                  onClick={handleLogout}
                  className="text-left font-sans text-2xl uppercase tracking-[0.2em] text-red-500 mt-4"
                >
                  Sign Out
                </button>
              )}
              {!user && (
                <button onClick={() => router.push('/auth?tab=login')} className="text-left font-sans text-2xl uppercase tracking-[0.2em] opacity-40">Sign In</button>
              )}
            </div>
            <div className="mt-auto flex gap-6 opacity-40">
              {/* Social icons placeholder */}
              <div className="w-6 h-6 bg-ink rounded-full" />
              <div className="w-6 h-6 bg-ink rounded-full" />
              <div className="w-6 h-6 bg-ink rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
