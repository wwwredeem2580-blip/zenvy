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
  Music, Mic2, Headphones, Users, Presentation,
  PartyPopper, GlassWater, Sparkles, Star, Speaker,
  MessageSquare, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BDTIcon } from '../ui/Icons';
import PaymentStatusModal from './PaymentStatusModal';

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
  const { user, logout } = useAuth();

  // Nav state removed as it is now global in layout

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
    await logout('/auth?tab=login');
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
    <div className="min-h-screen mt-20 font-sans text-[#161616]">

      {/* Hero Section */}
      <section className="pt-20 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-sm font-medium uppercase tracking-[0.3em] text-ink/40 mb-6 block">
              Redefining Experiences
            </span>
            <h1 className="font-bengali leading-[1.1] tracking-tight mb-8 text-ink">
              <span className="text-2xl md:text-5xl block mb-2 font-bold">আপনার শহরের ইভেন্ট এখন,</span>
              <span className="text-3xl md:text-6xl font-light block">আপনার হাতের মুঠোয়।</span>
            </h1>
            <p className="text-base md:text-lg text-ink-muted max-w-[730px] leading-relaxed mb-10 font-bengali">
              জেনভি বাংলাদেশের সেরা ইভেন্ট প্ল্যাটফর্ম। আর্ট শো থেকে শুরু করে বড় টেক সামিট—সবকিছুই আপনার হাতের নাগালে।
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
                <input 
                  type="text" 
                  placeholder="Search events, artists, venues..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                  className="w-full bg-white border border-ink/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-ink/20 transition-all text-sm font-sans"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-ink text-bg px-8 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:gap-4 transition-all group shrink-0"
              >
                Find Events <ArrowRight size={18} className="transition-all" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative aspect-video hidden md:block overflow-hidden"
          >
            <div className="absolute inset-0">
              {[
                { Icon: Music, color: 'text-blue-400', size: 32 },
                { Icon: Mic2, color: 'text-purple-400', size: 28 },
                { Icon: Headphones, color: 'text-indigo-400', size: 30 },
                { Icon: Users, color: 'text-emerald-400', size: 34 },
                { Icon: Presentation, color: 'text-amber-400', size: 32 },
                { Icon: Globe, color: 'text-cyan-400', size: 26 },
                { Icon: PartyPopper, color: 'text-pink-400', size: 36 },
                { Icon: GlassWater, color: 'text-orange-400', size: 24 },
                { Icon: Sparkles, color: 'text-yellow-400', size: 30 },
                { Icon: Star, color: 'text-rose-400', size: 28 },
                { Icon: Speaker, color: 'text-violet-400', size: 32 },
                { Icon: MessageSquare, color: 'text-teal-400', size: 26 },
              ].map((item, i) => (
                <FloatingIcon key={i} item={item} i={i} />
              ))}
            </div>
          </motion.div>
        </div>
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
                  className="flex whitespace-nowrap items-center gap-1.5 px-4 py-1.5 bg-[#4d33de] text-white text-[10px] sm:text-[13px] rounded-lg hover:bg-[#3d26c0] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Event
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 mx-[3vw] sm:grid-cols-2 md:grid-cols-2 lg:mx-0 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-12 mb-10">
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

      {/* ─── Payment Status Modal (PayStation callback) ─── */}
      <PaymentStatusModal />
    </div>
  );
}

function FloatingIcon({ item, i }: { item: any; i: number }) {
  return (
    <motion.div
      className={`absolute ${item.color} opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-pointer`}
      initial={{ 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 300 + 50,
        scale: 0,
        rotate: Math.random() * 360
      }}
      animate={{ 
        x: [
          Math.random() * 400 + 50, 
          Math.random() * 400 + 50, 
          Math.random() * 400 + 50,
          Math.random() * 400 + 50
        ],
        y: [
          Math.random() * 300 + 50, 
          Math.random() * 300 + 50, 
          Math.random() * 300 + 50,
          Math.random() * 300 + 50
        ],
        scale: [0, 1, 1.1, 1],
        rotate: [0, 90, 180, 360],
      }}
      transition={{ 
        duration: 15 + Math.random() * 10,
        repeat: Infinity,
        ease: "linear",
        delay: i * 0.5,
        scale: {
          duration: 2,
          times: [0, 0.2, 0.5, 1],
          ease: "easeOut"
        }
      }}
      whileHover={{ 
        scale: 1.5, 
        rotate: 0,
        opacity: 1,
        transition: { duration: 0.3 }
      }}
      onClick={() => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.volume = 0.1;
        audio.play().catch(() => {});
      }}
    >
      <item.Icon size={item.size} strokeWidth={1.5} />
    </motion.div>
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

