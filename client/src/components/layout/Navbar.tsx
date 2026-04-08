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

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Explore', href: '/events' },
    { name: 'Dashboard', href: '/host/dashboard', role: 'host' },
    { name: 'Wallet', href: '/wallet', role: 'user' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  const activeLinkClass = "text-ink";
  const inactiveLinkClass = "text-ink/60 hover:text-ink";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-12 py-6 flex justify-between items-center ${scrolled || pathname !== '/' ? 'bg-bg/80 backdrop-blur-md border-b border-ink/5' : ''}`}>
        <div className="flex items-center gap-12">
          <button 
            onClick={() => router.push('/')}
            className="text-2xl font-serif tracking-tight font-semibold flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-bg rounded-sm rotate-45" />
            </div>
            Zenvy
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
                className="bg-ink text-bg px-6 py-2.5 rounded-full text-sm font-medium uppercase tracking-widest hover:bg-ink/90 transition-all"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center hover:bg-ink/5 transition-all overflow-hidden"
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

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-64 bg-white border border-ink/5 shadow-2xl py-4 z-50"
                  >
                    <div className="px-6 py-3 border-b border-ink/5 mb-2">
                      <p className="text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">{user.role}</p>
                    </div>
                    {user.role === 'host' && (
                      <button 
                        onClick={() => router.push('/host/dashboard')}
                        className="w-full px-6 py-3 text-left text-sm hover:bg-ink/5 transition-colors"
                      >
                        Dashboard
                      </button>
                    )}
                    {user.role === 'user' && (
                      <button 
                        onClick={() => router.push('/wallet')}
                        className="w-full px-6 py-3 text-left text-sm hover:bg-ink/5 transition-colors"
                      >
                        My Wallet
                      </button>
                    )}
                    <button 
                      onClick={() => router.push('/host/profile')}
                      className="w-full px-6 py-3 text-left text-sm hover:bg-ink/5 transition-colors"
                    >
                      Profile Settings
                    </button>
                    <div className="border-t border-ink/5 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full px-6 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
            className="fixed inset-0 bg-bg z-[60] p-12 flex flex-col justify-center gap-12"
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
                    className="text-left"
                  >
                    {link.name}
                  </button>
                );
              })}
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
