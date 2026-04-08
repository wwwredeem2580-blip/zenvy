'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Globe2, 
  Ticket, 
  FileCheck, 
  RefreshCcw, 
  Zap, 
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface LearnLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { href: '/learn/how-zenvy-protects-buyers', label: 'Buyer Protection', icon: ShieldCheck },
  { href: '/learn/verified-event-platform-bangladesh', label: 'Verified Platform', icon: Globe2 },
  { href: '/learn/safe-ticket-booking', label: 'Safe Booking', icon: Ticket },
  { href: '/learn/organizer-guidelines', label: 'Organizer Guidelines', icon: FileCheck },
  { href: '/learn/refund-policy-explained', label: 'Refund Policy', icon: RefreshCcw },
  { href: '/learn/how-to-host-event', label: 'How to Host', icon: Zap },
  { href: '/learn/host-guide', label: 'Host Operational Guide', icon: FileCheck },
];

export const LearnLayout: React.FC<LearnLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => router.push('/auth?tab=login');
  const handleGetStarted = () => router.push('/onboarding');

  return (
    <div className="bg-neutral-0 font-sans selection:bg-brand-100 selection:text-brand-900">
      
      <div className="w-full px-4 py-4 md:px-6 md:py-6 flex flex-col lg:flex-row gap-2 relative">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 mb-6 sticky top-24 z-20">
             <span className="text-sm font-medium text-neutral-600">Documentation Menu</span>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-neutral-600 hover:text-brand-600 transition-colors">
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
             </button>
        </div>

        {/* Sidebar Navigation */}
        <aside className={`
            fixed inset-0 z-30 mt-16 lg:z-0 lg:static bg-white/95 backdrop-blur-xl lg:bg-transparent
            lg:w-64 flex-shrink-0 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full overflow-y-auto p-6 lg:p-0 lg:sticky lg:top-32 space-y-8">
             <div className="lg:hidden flex justify-end mb-4">
                 <button onClick={() => setIsSidebarOpen(false)}><X size={24} className="text-neutral-400" /></button>
             </div>

             <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-4 mb-4">Learn Zenvy</p>
                <nav className="space-y-1">
                  {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                            isActive 
                            ? 'bg-brand-50 text-brand-600 border border-brand-100' 
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-600'
                        }`}
                      >
                        <link.icon size={16} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-brand-600' : 'text-neutral-400 group-hover:text-brand-500'}`} />
                        {link.label}
                        {isActive && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                      </Link>
                    );
                  })}
                </nav>
             </div>
             <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100/50 space-y-3">
                 <p className="text-xs font-semibold text-brand-900">Need more help?</p>
                 <p className="text-[11px] text-neutral-500 leading-relaxed">Contact our support team for specialized assistance with your events.</p>
                 <button className="text-[10px] font-bold uppercase tracking-widest text-brand-600 hover:underline">Contact Support</button>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:px-10 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {children}
        </main>
      </div>
    </div>
  );
};
