'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { publicService } from "@/lib/api/public";
import { Logo } from "../shared/Logo";
import { Search, X, ChevronDown, User, Wallet, Clock, Clock10, LogIn, Globe, CreditCard, Book, BookA, BookOpen, Ticket } from "lucide-react";

import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  HelpCircle,
  Plus,
  Menu,
} from 'lucide-react';
import { useAuth } from "@/lib/context/auth";
import { authService } from "@/lib/api/auth";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  let menuItems = [
    { icon: <Globe size={18} strokeWidth={1} />, label: 'Explore', path: '/events', active: pathname === '/events' },
    { icon: <ShoppingBag size={18} strokeWidth={1} />, label: 'Wallet', path: '/wallet', active: pathname === '/wallet', requireRole: 'user' },
    { icon: <LayoutDashboard size={18} strokeWidth={1} />, label: 'Dashboard', path: '/host/dashboard', active: pathname === '/host/dashboard', requireRole: 'host' },
    { icon: <Calendar size={18} strokeWidth={1} />, label: 'My Events', path: '/host/events', active: pathname === '/host/events', requireRole: 'host' },
    { icon: <Plus size={18} strokeWidth={1} />, label: 'Create Event', path: '/host/events/create', active: pathname === '/host/events/create', requireRole: 'host' },
    { icon: <ShoppingBag size={18} strokeWidth={1} />, label: 'Orders', path: '/host/orders', active: pathname === '/host/orders', requireRole: 'host' },
    // { icon: <CreditCard size={18} strokeWidth={1} />, label: 'Payout', path: '/host/payout', active: pathname === '/host/payout', requireRole: 'host' },
    { icon: <BarChart3 size={18} strokeWidth={1} />, label: 'Analytics', path: '/host/analytics', active: pathname === '/host/analytics', requireRole: 'host' },
    { icon: <User size={18} strokeWidth={1} />, label: 'Profile', path: '/host/profile', active: pathname === '/host/profile', requireRole: 'host' },
    { icon: <HelpCircle size={18} strokeWidth={1} />, label: 'About', path: '/about', active: pathname === '/about', },
    { icon: <BookOpen size={18} strokeWidth={1} />, label: 'Learn More', path: '/learn', active: pathname === '/learn' },
    { icon: <Calendar size={18} strokeWidth={1} />, label: 'Events', path: '/admin/events', active: pathname === '/admin/events', requireRole: 'admin' },
    { icon: <ShoppingBag size={18} strokeWidth={1} />, label: 'Orders', path: '/admin/orders', active: pathname === '/admin/orders', requireRole: 'admin' },
    { icon: <CreditCard size={18} strokeWidth={1} />, label: 'Payouts', path: '/admin/payouts', active: pathname === '/admin/payouts', requireRole: 'admin' },
    { icon: <MessageSquare size={18} strokeWidth={1} />, label: 'Conversations', path: '/admin/conversations', active: pathname === '/admin/conversations', requireRole: 'admin' },
    { icon: <Ticket size={18} strokeWidth={1} />, label: 'Tickets', path: '/admin/tickets', active: pathname === '/admin/tickets', requireRole: 'admin' },
  ];

  const filteredMenuItems = menuItems.filter((item) => !item.requireRole || item.requireRole === user?.role);

  const handleSignOut = async () => {
    await logout('/auth?tab=login');
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  }


  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-50 w-full">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-4">
          {user ? (
            <div 
              onClick={() => user?.role === 'host' ? router.push('/host/profile') : null} 
              className={cn(
                "w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200",
                user.role === 'host' ? "cursor-pointer hover:border-slate-400" : "cursor-default"
              )}
            >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth?tab=login')}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              <LogIn size={24} />
            </button>
          )}
          <div onClick={() => window.location.href = '/events'} className="flex cursor-pointer items-center">
            <Logo variant='full' />
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-1000 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 overflow-y-auto border-r border-slate-100 flex flex-col fixed h-full bg-white z-1000 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex items-center justify-between">
          <div onClick={() => window.location.href = '/events'} className="flex cursor-pointer items-center gap-3">
            <Logo variant='full' />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4">
          <div className="text-[10px] font-[500] text-slate-400 uppercase tracking-widest mb-4 px-4">Menu</div>
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
              <li key={item.label}>
                <button 
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-[400] transition-all ${
                    item.active ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {user && (
          <div className="p-4 border-t border-slate-50">
            <div className="text-[10px] font-[500] text-slate-400 uppercase tracking-widest mb-2 px-4">Options</div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-[500] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        )}
        {!user && (
          <div className="p-4 border-t border-slate-50">
            <div className="text-[10px] font-[500] text-slate-400 uppercase tracking-widest mb-2 px-4">Options</div>
            <button
              onClick={() => handleNavigate('/auth?tab=login')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-[500] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <LogIn size={18} />
              Log In
            </button>
            <button
              onClick={() => handleNavigate('/onboarding')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-[500] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <User size={18} />
              Register
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
