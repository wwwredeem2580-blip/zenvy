'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { publicService } from '@/lib/api/public';
import { useAuth } from '@/lib/context/auth';
import { authService } from '@/lib/api/auth';
import {
  Search, ChevronDown, Menu, X, Globe,
  Wallet as WalletIcon, Users as UsersIcon,
  LayoutDashboard, Home, Calendar, Clock, MapPin,
  LogIn, UserPlus, Plus, HelpCircle, Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BDTIcon } from '../ui/Icons';
import { Logo } from '../shared/Logo';

interface EventFilters {
  category?: string;
  location?: string;
  search?: string;
}

const categoryOptions = [
  { value: 'concert', label: 'Concert' },
  { value: 'sports', label: 'Sports' },
  { value: 'conference', label: 'Conference' },
  { value: 'festival', label: 'Festival' },
  { value: 'theater', label: 'Theater' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'networking', label: 'Networking' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'other', label: 'Other' },
];

const tagFilters = ['All', 'Concerts', 'Sports & Outdoors', 'Conferences', 'Festivals', 'Workshops'];

export default function Events() {
  const router = useRouter();
  const { user } = useAuth();

  // Nav state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentPage] = useState(1);

  // Data state
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const allEventsData = await publicService.getEvents({ page: 1, limit: 1000 });
        if (allEventsData?.events) {
          const locs = [...new Set<string>(allEventsData.events.map((e: any) => e.venue?.address?.city).filter(Boolean))].sort();
          setAllLocations(locs);
        }
        const trending = await publicService.getTrendingEvents(10);
        setTrendingEvents(trending);
        const featured = await publicService.getFeaturedEvents(10);
        setFeaturedEvents(featured);
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch filtered events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params: any = { page: currentPage, limit: 100 };
        if (filters.category) params.category = filters.category;
        if (filters.location) params.location = filters.location;
        if (filters.search) params.search = filters.search;
        const data = await publicService.getEvents(params);
        setEvents(data?.events || []);
      } catch (err) {
        console.error('Failed to fetch events', err);
      }
    };
    fetchEvents();
  }, [filters, currentPage]);

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const handleSearch = () => handleFilterChange('search', searchQuery.trim());
  const handleSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth?tab=login');
  };

  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  const selectedCategory = filters.category
    ? categoryOptions.find(o => o.value === filters.category)?.label ?? 'Category'
    : 'Category';
  const selectedLocation = filters.location || 'Location';

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const avatarSeed = user?.email ?? 'default';
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? 'G';

  return (
    <div className="min-h-screen bg-white font-sans text-[#161616]">

      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-gray-200 sticky top-0 bg-white z-30">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-black z-50 relative"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="hidden md:flex items-center cursor-pointer"
          >
            <Logo variant="full" className="h-6 text-brand-600" strokeWidth="2" animated />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-[15px]">
            <button
              onClick={() => router.push('/')}
              className="hover:text-[#4d33de] transition-colors font-medium text-[#4d33de]"
            >
              Events
            </button>
            {user?.role === 'host' && (
              <>
                <button
                  onClick={() => router.push('/host/dashboard')}
                  className="hover:text-[#4d33de] transition-colors"
                >
                  Dashboard
                </button>
                {/* <button
                  onClick={() => router.push('/host/events')}
                  className="hover:text-[#4d33de] transition-colors"
                >
                  My Events
                </button> */}
              </>
            )}
            {user?.role === 'user' && (
              <button
                onClick={() => router.push('/wallet')}
                className="hover:text-[#4d33de] transition-colors"
              >
                Wallet
              </button>
            )}
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <a href="/contact" className="hover:text-[#4d33de] transition-colors">Contact Us</a>
            <a href="/about" className="hover:text-[#4d33de] transition-colors">About</a>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 relative flex-row-reverse md:flex-row">
          {/* Mobile Logo */}
          <div
            onClick={() => router.push('/')}
            className="md:hidden flex items-center cursor-pointer"
          >
            <Logo variant="full" className="h-6 text-brand-600" strokeWidth="2" animated />
          </div>

          {/* Auth buttons when not logged in */}
          {!user && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => router.push('/auth?tab=login')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[14px] text-gray-600 hover:text-[#4d33de] transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4d33de] text-white text-[14px] rounded-lg hover:bg-[#3d26c0] transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Get Started
              </button>
            </div>
          )}

          {/* Profile avatar */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full bg-[#7b1fa2] text-white flex items-center justify-center text-sm font-medium hover:opacity-90 transition-opacity overflow-hidden border-2 border-transparent hover:border-[#4d33de]"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-2 z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-[13px] font-medium text-[#161616] truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-[11px] text-gray-400 capitalize">{user.role}</p>
                      </div>
                      {user.role === 'host' && (
                        <>
                          <button
                            onClick={() => { router.push('/host/dashboard'); setIsProfileOpen(false); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[14px] text-[#161616] transition-colors flex items-center gap-3"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                          </button>
                          <button
                            onClick={() => { router.push('/host/events/create'); setIsProfileOpen(false); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[14px] text-[#161616] transition-colors flex items-center gap-3"
                          >
                            <Plus className="w-4 h-4 text-gray-400" /> Create Event
                          </button>
                          <button
                            onClick={() => { router.push('/host/profile'); setIsProfileOpen(false); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[14px] text-[#161616] transition-colors flex items-center gap-3"
                          >
                            <UsersIcon className="w-4 h-4 text-gray-400" /> Profile
                          </button>
                        </>
                      )}
                      {user.role === 'user' && (
                        <button
                          onClick={() => { router.push('/wallet'); setIsProfileOpen(false); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[14px] text-[#161616] transition-colors flex items-center gap-3"
                        >
                          <WalletIcon className="w-4 h-4 text-gray-400" /> Wallet
                        </button>
                      )}
                      <div className="h-px bg-gray-100 my-1 mx-4" />
                      <button
                        onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[14px] text-red-500 transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* ─── Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-40 md:hidden pt-20 px-6"
          >
            <nav className="flex flex-col gap-0 text-base font-medium">
              <button
                onClick={() => { router.push('/'); setIsMobileMenuOpen(false); }}
                className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3 text-left"
              >
                <Home className="w-5 h-5" /> Events
              </button>
              {user?.role === 'host' && (
                <>
                  <button
                    onClick={() => { router.push('/host/dashboard'); setIsMobileMenuOpen(false); }}
                    className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3 text-left"
                  >
                    <LayoutDashboard className="w-5 h-5" /> Dashboard
                  </button>
                  <button
                    onClick={() => { router.push('/host/events'); setIsMobileMenuOpen(false); }}
                    className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3 text-left"
                  >
                    <Calendar className="w-5 h-5" /> My Events
                  </button>
                </>
              )}
              {user?.role === 'user' && (
                <button
                  onClick={() => { router.push('/wallet'); setIsMobileMenuOpen(false); }}
                  className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3 text-left"
                >
                  <WalletIcon className="w-5 h-5" /> Wallet
                </button>
              )}
              {!user && (
                <>
                  <button
                    onClick={() => { router.push('/auth?tab=login'); setIsMobileMenuOpen(false); }}
                    className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3"
                  >
                    <LogIn className="w-5 h-5" /> Sign In
                  </button>
                  <button
                    onClick={() => { router.push('/onboarding'); setIsMobileMenuOpen(false); }}
                    className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3"
                  >
                    <UserPlus className="w-5 h-5" /> Get Started
                  </button>
                </>
              )}
              <a href="/about" className="hover:text-[#4d33de] transition-colors py-4 border-b border-gray-100 flex items-center gap-3">
                <HelpCircle className="w-5 h-5" /> About
              </a>
              <a href="/contact" className="hover:text-[#4d33de] transition-colors py-4 flex items-center gap-3">
                <HelpCircle className="w-5 h-5" /> Contact Us
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Hero ─── */}
      <section className="py-12 md:py-20 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-[44px] font-medium mb-8 md:mb-12 tracking-tight"
        >
          Pick from the Events You Love
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full max-w-[560px] mx-auto border-b border-black pb-2 flex items-center gap-3"
        >
          <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            className="w-full outline-none text-[17px] placeholder:text-gray-400 bg-transparent"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); handleFilterChange('search', ''); }} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </section>

      {/* ─── Filter Bar ─── */}
      <nav className="flex flex-col md:flex-row max-w-[1400px] mx-auto md:items-center justify-between px-4 md:px-10 2xl:px-0 py-4 border-b border-gray-200 text-[15px] gap-4 md:gap-0">
        <div className="flex items-center gap-6">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              className={`flex items-center gap-1 transition-colors ${filters.category ? 'text-[#4d33de] font-medium' : 'text-gray-600 hover:text-[#4d33de]'}`}
            >
              {selectedCategory}
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'category' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-2 z-50"
                  >
                    <button
                      onClick={() => { handleFilterChange('category', ''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] text-gray-500 transition-colors"
                    >
                      All Categories
                    </button>
                    {categoryOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { handleFilterChange('category', opt.value); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] transition-colors ${filters.category === opt.value ? 'text-[#4d33de] font-medium' : 'text-[#161616]'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
              className={`flex items-center gap-1 transition-colors ${filters.location ? 'text-[#4d33de] font-medium' : 'text-gray-600 hover:text-[#4d33de]'}`}
            >
              {selectedLocation}
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'location' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-2 z-50"
                  >
                    <button
                      onClick={() => { handleFilterChange('location', ''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] text-gray-500 transition-colors"
                    >
                      All Locations
                    </button>
                    {allLocations.map(loc => (
                      <button
                        key={loc}
                        onClick={() => { handleFilterChange('location', loc); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] transition-colors ${filters.location === loc ? 'text-[#4d33de] font-medium' : 'text-[#161616]'}`}
                      >
                        {loc}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right tag filters */}
        <div className="flex items-center gap-3 md:gap-5 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="hidden md:block w-px h-5 bg-gray-200" />
          {tagFilters.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-[14px] transition-colors ${selectedTag === tag ? 'text-[#4d33de] font-semibold' : 'text-gray-600 hover:text-[#4d33de]'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="bg-[#f4f5f6] px-4 md:px-10 py-8 md:py-10 min-h-screen">
        <div className="max-w-[1400px] mx-auto">

          {/* Heading + Sort */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
            <div>
              <div className="text-[12px] text-gray-400 mb-1">Zenvy Events /</div>
              <h2 className="text-2xl md:text-[28px] font-medium tracking-tight">
                {selectedTag === 'All' ? 'All Events' : selectedTag}
              </h2>
            </div>
            {activeFilters.length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="text-[13px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map(([key, value]) => {
                let label = String(value);
                if (key === 'category') label = categoryOptions.find(o => o.value === value)?.label ?? label;
                if (key === 'location') label = `${value}`;
                if (key === 'search') label = `"${value}"`;
                return (
                  <span key={key} className="flex items-center gap-1.5 px-3 py-1 bg-[#4d33de]/10 text-[#4d33de] rounded-full text-[13px]">
                    <Tag className="w-3 h-3" /> {label}
                    <button onClick={() => handleFilterChange(key as keyof EventFilters, '')} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Trending */}
          {/* {trendingEvents.length > 0 && activeFilters.length === 0 && (
            <section className="mb-12">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-slate-900 tracking-tight">🔥 Trending Now</h3>
                <p className="text-xs text-slate-400 font-light">Events everybody's talking about</p>
              </div>
              <div className="grid grid-flow-col auto-cols-[280px] gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {trendingEvents.map((event: any, i: number) => (
                  <EventCard key={event._id} event={event} index={i} router={router} badge="🔥 Trending" />
                ))}
              </div>
            </section>
          )} */}

          {/* Featured */}
          {/* {featuredEvents.length > 0 && activeFilters.length === 0 && (
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Logo className="w-5 text-brand-500" /> Featured
                  </h3>
                  <p className="text-xs text-slate-400 font-light">Handpicked by the Zenvy team</p>
                </div>
                <button className="text-[12px] text-slate-400 hover:text-slate-900 transition-colors">See all</button>
              </div>
              <div className="grid grid-flow-col auto-cols-[280px] gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {featuredEvents.map((event: any, i: number) => (
                  <EventCard key={event._id} event={event} index={i} router={router} badge="⭐ Featured" />
                ))}
              </div>
            </section>
          )} */}

          {/* All / Filtered Events Grid */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900 tracking-tight">Explore All</h3>
                <p className="text-xs text-slate-400 font-light">Choose what's best for you</p>
              </div>
              {user?.role === 'host' && (
                <button
                  onClick={() => router.push('/host/events/create')}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4d33de] text-white text-[13px] rounded-lg hover:bg-[#3d26c0] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Event
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 mx-[3vw] sm:grid-cols-2 md:grid-cols-2 lg:mx-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-12 mb-10">
              {events.length > 0 ? events.map((event: any, i: number) => (
                <EventCard key={event._id} event={event} index={i} router={router} />
              )) : (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <div className="text-4xl mb-3">🎭</div>
                  <p className="font-light">No events found</p>
                  {activeFilters.length > 0 && (
                    <button onClick={() => setFilters({})} className="mt-3 text-[#4d33de] text-sm hover:underline">Clear filters</button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* \u2500\u2500\u2500 Event Card \u2500\u2500\u2500 */
function EventCard({
  event, index, router, badge,
}: {
  event: any;
  index: number;
  router: ReturnType<typeof useRouter>;
  badge?: string;
}) {
  const minPrice = event.tickets?.length > 0
    ? Math.min(...event.tickets.map((t: any) => t.price?.amount ?? 0))
    : 0;
  const isFree = minPrice === 0;
  const startDate = new Date(event.schedule?.startDate);
  const endDate = new Date(event.schedule?.endDate);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  const addr = event.venue?.address;
  const locationParts = [addr?.street, addr?.city, addr?.country].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : event.venue?.name;

  const organizer = event.organizer?.name || event.host?.name || 'Zenvy';
  const category = event.category
    ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
    : null;

  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => router.push(`/events/${event.slug || event._id}`)}
      className="group cursor-pointer flex flex-col gap-3"
    >
      {/* Cover Image */}
      <div className="aspect-[1.6/1] relative overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        <img
          src={
            event.media?.coverImage?.url ||
            'https://fastly.picsum.photos/id/1084/536/354.jpg?grayscale&hmac=Ux7nzg19e1q35mlUVZjhCLxqkR30cC-CarVg-nlIf60'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        {/* Live badge */}
        {event.status === 'live' && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-800 border border-white/60 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
          </div>
        )}
        {/* Custom badge (trending/featured) */}
        {badge && (
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-700 border border-white/60 shadow-sm">
            {badge}
          </div>
        )}
        {/* Category pill bottom-left */}
        {category && (
          <div className="absolute bottom-3 left-3 z-10 bg-[#f0ebff] text-[#4d33de] text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col gap-1 px-2">
        <h3 className="text-[18px] font-semibold text-[#161616] leading-snug line-clamp-2 group-hover:text-[#4d33de] transition-colors duration-200">
          {event.title}
        </h3>

        <div className="flex items-start gap-1.5 text-[14px] text-gray-500 mt-0.5">
          <Calendar className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
          <span>
            {fmtDate(startDate)}{!sameDay && ` → ${fmtDate(endDate)}`}
            <span className="text-gray-400 ml-1">· {fmtTime(startDate)}–{fmtTime(endDate)}</span>
          </span>
        </div>

        {location && (
          <div className="flex items-center gap-1.5 text-[14px] text-gray-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[13px] font-bold text-[#161616]">
            {isFree ? (
              <span className="bg-[#d2f47c] text-[#161616] text-[11px] px-2.5 py-0.5 rounded-[4px] font-bold">Free</span>
            ) : (
              <span>From <BDTIcon className="inline text-[12px]" />{minPrice.toLocaleString()}</span>
            )}
          </span>
          <span className="text-[11px] text-gray-400">By {organizer}</span>
        </div>
      </div>
    </motion.div>
  );
}

