'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { publicService } from '@/lib/api/public';
import { orderService } from '@/lib/api/order';
import { useAuth } from '@/lib/context/auth';
import { useNotification } from '@/lib/context/notification';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckoutBKash } from './CheckoutBKash';
import PaymentStatusModal from './PaymentStatusModal';
import { cleanText } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  ChevronRight,
  Ticket,
  Eye,
} from 'lucide-react';
import { BDTIcon } from '../ui/Icons';

const MAX_TICKETS_PER_ORDER = 5;
const PLATFORM_FEE = 0;

/* ─── Premium Ticket Icons ─── */
const TicketPerforation = () => (
  <div className="absolute top-0 right-0 h-full w-[2px] hidden sm:flex flex-col items-center justify-between py-1">
    <div className="w-6 h-6 rounded-full bg-white border border-black/5 absolute -top-3 -right-3 z-10" />
    <div className="h-full border-r-[1.5px] border-dotted border-current opacity-20" />
    <div className="w-6 h-6 rounded-full bg-white border border-black/5 absolute -bottom-3 -right-3 z-10" />
  </div>
);

const ChipIcon = ({ className }: { className?: string }) => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="1" y="1" width="38" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 10H10V20H1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M39 10H30V20H39" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 1V30" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M25 1V30" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 15H25" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const BarcodeIcon = ({ className }: { className?: string }) => (
  <svg width="40" height="150" viewBox="0 0 40 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 0V150M12 0V150M18 0V150M22 0V150M30 0V150M35 0V150M10 0V150M25 0V150M38 0V150" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ContactlessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 5.5a10 10 0 0 1 0 13"/>
    <path d="M12.5 7.5a6 6 0 0 1 0 9"/>
    <path d="M16.5 9.5a2 2 0 0 1 0 5"/>
  </svg>
);

/* ─── Minimal Styled Map ─── */
const MinimalMap = ({ venue, coordinates }: { venue?: string; coordinates?: number[] }) => {
  const handleOpenMaps = () => {
    if (coordinates?.length === 2) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`, '_blank');
    }
  };

  return (
    <div
      className="w-full h-[220px] bg-[#f0f0f0] relative overflow-hidden flex items-center justify-center border border-wix-border-light group cursor-pointer"
      onClick={handleOpenMaps}
    >
      <svg className="absolute inset-0 w-full h-full opacity-40 transition-transform duration-700 group-hover:scale-105" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161616" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        <path d="M -50 150 Q 150 150 200 50 T 500 100" fill="none" stroke="#161616" strokeWidth="6" />
        <path d="M 150 -50 L 150 300" fill="none" stroke="#161616" strokeWidth="4" />
        <path d="M 350 -50 L 300 300" fill="none" stroke="#161616" strokeWidth="3" />
      </svg>
      <div className="z-10 bg-black text-white p-2.5 rounded-full absolute shadow-md" style={{ top: '40%', left: '42%' }}>
        <MapPin className="w-5 h-5" />
      </div>
      {venue && (
        <div
          className="z-10 absolute bg-white border border-black px-4 py-2 text-[11px] font-bold tracking-widest uppercase shadow-sm whitespace-nowrap"
          style={{ top: '55%', left: '42%', transform: 'translateX(-20%)' }}
        >
          {venue}
        </div>
      )}
      <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 uppercase tracking-widest">
        Click for directions
      </div>
    </div>
  );
};


/* ─── Selectable Premium Ticket card ─── */
const SelectableTicketCard = ({ 
  ticket, 
  qty, 
  available, 
  onIncrement, 
  onDecrement,
  eventDate,
  eventTime,
  eventVenue
}: { 
  ticket: any; 
  qty: number; 
  available: number; 
  onIncrement: () => void; 
  onDecrement: () => void;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const tierName = ticket.tier || ticket.name || 'Standard';
  const price = ticket.price?.amount ?? ticket.price ?? 0;
  const isSoldOut = available === 0;

  const isVIP = tierName.toLowerCase().includes('vip');
  const isPremium = tierName.toLowerCase().includes('premium') || tierName.toLowerCase().includes('early');

  // Theming based on ticket tier
  const bgTheme = qty > 0 
    ? 'bg-ink border-ink text-bg shadow-[0_20px_40px_rgba(0,0,0,0.3)]' 
    : isVIP 
      ? 'bg-neutral-950 border-[#D4AF37] border-2 text-white' 
      : isPremium 
        ? 'bg-neutral-900 border-slate-300 border-2 text-white' 
        : 'bg-white border-neutral-200 text-ink';

  const metallicAccent = isVIP 
    ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-transparent bg-clip-text' 
    : isPremium 
      ? 'bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 text-transparent bg-clip-text' 
      : '';

  return (
    <div className="w-full perspective-1000 h-[250px] sm:h-[180px]">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full preserve-3d"
      >
        {/* --- FRONT SIDE --- */}
        <div className={`absolute inset-0 w-full h-full backface-hidden flex flex-col sm:flex-row shadow-lg overflow-hidden transition-all duration-500 ${bgTheme}`}>
          {/* Main Context Area */}
          <div className="flex-1 p-6 relative flex flex-col justify-between h-full">
            <TicketPerforation />
            
            <div className="flex flex-col gap-1">
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${qty > 0 ? 'text-white/40' : isVIP || isPremium ? metallicAccent : 'text-wix-purple'}`}>
                {isVIP ? 'Exclusive Pass' : isPremium ? 'Premium Entry' : 'Verified Access'}
              </span>
              <h4 className="text-[20px] font-serif tracking-tight leading-none">{tierName}</h4>
            </div>

            {/* <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex flex-col gap-1">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 ${qty > 0 ? 'text-white/60' : 'text-ink/60'}`}>Date</span>
                <span className={`text-[14px] font-wix font-normal leading-none ${qty > 0 ? 'text-bg' : 'text-ink'}`}>{eventDate}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 ${qty > 0 ? 'text-white/60' : 'text-ink/60'}`}>Time</span>
                <span className={`text-[14px] font-wix font-normal leading-none ${qty > 0 ? 'text-bg' : 'text-ink'}`}>{eventTime}</span>
              </div>
            </div> */}

            <div className={`text-[12px] font-wix tracking-widest uppercase pt-3 border-t mt-4 flex justify-between items-center ${qty > 0 ? 'border-white/10' : 'border-black/10'}`}>
              <div className={`text-[10px] flex items-center justify-between w-full font-bold ${qty > 0 ? 'text-bg' : 'text-ink'}`}>
                <div>Price/Ticket</div>
                <div>{price === 0 ? 'FREE' : <>
                <span className='font-mono text-[12px]'>৳</span>
                <span className='text-[20px]'>{price.toLocaleString()}</span>
                </>}
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${qty > 0 ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              <Eye size={16} className="opacity-40" />
            </button>
          </div>

          {/* Stacking Stub Area (Controls) */}
          <div className={`sm:w-[32%] p-5 sm:p-0 flex items-center justify-center relative shrink-0 ${qty > 0 ? 'bg-white/5' : 'bg-neutral-50/50'}`}>
            {/* Aesthetic Grain texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] hidden sm:block" />
            
            <div className="flex flex-col items-center gap-4 w-full px-4">
              {isSoldOut ? (
                <div className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] bg-neutral-100 text-neutral-400 text-center border border-neutral-200">
                  Sold Out
                </div>
              ) : qty > 0 ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onDecrement}
                      className={`w-10 h-10 border flex items-center justify-center transition-all ${qty > 0 ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}
                    >
                      <Minus size={14} />
                    </button>
                    <div className="flex-1 text-center font-serif text-xl">{qty}</div>
                    <button 
                      onClick={onIncrement}
                      className={`w-10 h-10 border flex items-center justify-center transition-all ${qty > 0 ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-[9px] font-bold text-center uppercase tracking-widest opacity-40">Qty Selected</div>
                </div>
              ) : (
                <button 
                  onClick={onIncrement}
                  className={`w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isVIP || isPremium ? (isVIP ? 'bg-[#D4AF37] text-white' : 'bg-slate-400 text-white') : 'bg-ink text-bg'
                  }`}
                >
                  <Ticket size={14} /> Add Ticket
                </button>
              )}
            </div>
            
            {/* Visual Stub Label (Desktop only) */}
            <div className={`absolute bottom-4 right-1/2 translate-x-1/2 text-[8px] font-black uppercase tracking-[0.4em] opacity-20 hidden sm:block ${qty > 0 ? 'text-white' : 'text-black'}`}>
               Controls
            </div>
          </div>
        </div>

        {/* --- BACK SIDE (BENEFITS) --- */}
        <div className={`absolute inset-0 w-full h-full backface-hidden flex flex-col rotate-y-180 shadow-lg overflow-hidden transition-all duration-500 ${bgTheme}`}>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-current/20 pb-1">Benefits</span>
                <button 
                  onClick={() => setIsFlipped(false)}
                  className={`p-1 hover:bg-black/5 rounded-full ${qty > 0 ? 'text-white' : 'text-ink'}`}
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="space-y-2">
                {(ticket.benefits || ['Event access', 'Standard entry']).slice(0, 4).map((b: string, i: number) => (
                  <li key={i} className="text-[11px] font-medium opacity-80 flex items-center gap-2 uppercase tracking-wide">
                    <div className={`w-1 h-1 rounded-full ${qty > 0 ? 'bg-white' : 'bg-ink'} opacity-30`} /> {b}
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-[10px] leading-tight opacity-50 italic">
              {ticket.description || "Digital invitation. Terms and conditions apply."}
            </p>
          </div>
          <div className={`h-12 border-t flex items-center justify-center ${qty > 0 ? 'border-white/10 bg-white/5' : 'border-black/5 bg-neutral-50'}`}>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-40">Flip to select</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function EventDetails() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [showScrollButton, setShowScrollButton] = useState(false);


  // Core state
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'checkout' | 'success'>('selection');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Gallery modal
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Gallery scroll ref
  const galleryRef = useRef<HTMLDivElement>(null);
  const scrollGallery = (dir: 'up' | 'down') => {
    galleryRef.current?.scrollBy({ top: dir === 'up' ? -140 : 140, behavior: 'smooth' });
  };

  // Description expand/collapse
  const [descExpanded, setDescExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const [descOverflows, setDescOverflows] = useState(false);

  // Fetch event
  useEffect(() => {
    if (!eventId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await publicService.getEventDetails(eventId);
        setEvent(data);
        const init: Record<string, number> = {};
        data?.tickets?.forEach((t: any) => { init[t._id || t.name] = 0; });
        setTicketQuantities(init);
      } catch (e) {
        console.error('Failed to fetch event', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  // Payment status is now handled by <PaymentStatusModal /> which reads
  // the ?payment= URL param and cleans up the URL itself.

  // Body scroll lock for modal
  useEffect(() => {
    document.body.style.overflow = selectedImage || checkoutStep === 'success' ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedImage, checkoutStep]);

  // Scroll listener for floating "Buy Tickets" button
  useEffect(() => {
    const handleScroll = () => {
      const ticketsSection = document.getElementById('tickets-section');
      if (ticketsSection) {
        const rect = ticketsSection.getBoundingClientRect();
        // Show button if tickets section is not yet fully in view and user has started scrolling
        setShowScrollButton(window.scrollY > 400 && rect.top > window.innerHeight - 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent browser-back loop: push a history entry when success modal opens
  // so pressing Back dismisses the modal instead of re-triggering it.
  useEffect(() => {
    if (checkoutStep !== 'success') return;
    window.history.pushState({ successModal: true }, '');
    const handlePopState = () => setCheckoutStep('selection');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkoutStep]);

  // Ticket helpers
  const getTotalTickets = () => Object.values(ticketQuantities).reduce((s, q) => s + q, 0);

  const handleIncrement = (id: string, max: number) => {
    setTicketQuantities(prev => {
      const cur = prev[id] || 0;
      if (getTotalTickets() >= MAX_TICKETS_PER_ORDER || cur >= max) return prev;
      return { ...prev, [id]: cur + 1 };
    });
  };

  const handleDecrement = (id: string) => {
    setTicketQuantities(prev => {
      const cur = prev[id] || 0;
      if (cur <= 0) return prev;
      return { ...prev, [id]: cur - 1 };
    });
  };

  // Price calculation
  const totalAmount = event?.tickets?.reduce((sum: number, t: any) => {
    return sum + ((t.price?.amount ?? 0) * (ticketQuantities[t._id || t.name] || 0));
  }, 0) ?? 0;

  const paymentProcessingFee = Math.ceil(totalAmount * 0.015);
  const grandTotal = totalAmount + paymentProcessingFee;
  const totalItems = getTotalTickets();

  // Book now
  const handleBookNow = async () => {
    if (!user) {
      showNotification('error', 'Login required', 'Please login to book tickets');
      router.push('/auth?tab=login');
      return;
    }
    if (totalItems === 0) { setOrderError('Please select at least one ticket'); return; }

    try {
      setCreatingOrder(true);
      setOrderError(null);

      const orderTickets = event.tickets
        .filter((t: any) => (ticketQuantities[t._id || t.name] || 0) > 0)
        .map((t: any) => ({
          ticketVariantId: t._id,
          variantName: t.tier || t.name,
          quantity: ticketQuantities[t._id || t.name],
          pricePerTicket: t.price?.amount || 0,
        }));

      const paymentMethod = grandTotal === 0 ? 'free' : 'bkash';
      const orderResponse = await orderService.createOrder({
        eventId: event._id,
        tickets: orderTickets,
        paymentMethod,
      });

      if (orderResponse.isFree) {
        setCheckoutStep('success');
      } else if (orderResponse.paymentUrl) {
        router.push(orderResponse.paymentUrl);
      } else {
        throw new Error('Invalid order response');
      }
    } catch (err: any) {
      setOrderError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Build gallery items from real event or fallback patterns
  const galleryPatterns = ['gallery-pattern-1', 'gallery-pattern-2', 'gallery-pattern-3', 'gallery-pattern-4'];
  const galleryLabels = ['Stage A', 'Lounge', 'Workshop', 'VIP Area', 'Exterior'];

  const coverImageUrl = event?.media?.coverImage?.url;
  const galleryImages = event?.media?.gallery?.length > 0
    ? event.media.gallery
    : null;

  const startDate = event?.schedule?.startDate ? new Date(event.schedule.startDate) : null;
  const endDate = event?.schedule?.endDate ? new Date(event.schedule.endDate) : null;

  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const dateStr = startDate
    ? endDate && fmtDate(startDate) !== fmtDate(endDate)
      ? `${fmtDate(startDate)} – ${fmtDate(endDate)}`
      : fmtDate(startDate)
    : 'TBA';

  const timeStr = startDate && endDate
    ? `${fmtTime(startDate)} – ${fmtTime(endDate)}`
    : 'TBA';

  const eventDateShort = startDate
    ? startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA';

  return (
    <div className="min-h-screen bg-wix-gray-bg text-wix-text-dark font-sans">

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-wix-purple" />
        </div>
      )}

      {/* ─── Not found ─── */}
      {!loading && !event && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-wix-text-muted">Event not found</p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest hover:text-wix-purple transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>
        </div>
      )}

      {/* ─── Main Content ─── */}
      {!loading && event && (
        <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-10 pb-36">

          {/* Breadcrumb / Back */}
          <div>
            <button
              onClick={() => user?.role === 'host' ? router.back() : router.push('/')}
              className="inline-flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase text-wix-text-dark hover:text-wix-purple transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </button>
          </div>

          {/* Title & Tagline */}
          <div className='mt-6'>
            <div className="flex items-center gap-2 mb-3">
              {event.status === 'live' && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest border border-emerald-500 text-emerald-600 px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
              {event.category && (
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-text-muted border border-wix-border-light px-2.5 py-1">
                  {event.category}
                </span>
              )}
            </div>
            <h1 className="text-[32px] sm:text-[42px] font-medium tracking-tight text-wix-text-dark leading-none mb-3">
              {event.title}
            </h1>
            <p className="text-[15px] text-wix-text-muted leading-relaxed whitespace-pre-wrap">
              {cleanText(event.tagline || event.description)}
            </p>
          </div>

          {/* ─── Image Section ─── */}
          <div className="flex flex-col md:flex-row gap-3 h-[280px] sm:h-[420px] w-full">

            {/* Cover Image */}
            <div
              className="w-full md:w-3/4 h-full relative overflow-hidden group cursor-pointer bg-neutral-900 flex items-center justify-center shadow-sm"
              onClick={() => setSelectedImage({ url: coverImageUrl, label: event.title })}
            >
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="cover-pattern absolute inset-0" />
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
              {/* Expand hint */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </div>
            </div>

            {/* Gallery Stack */}
            <div className="hidden md:flex w-1/4 h-full relative flex-col bg-white overflow-hidden border border-ink/5 group">
              <button
                className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                onClick={() => scrollGallery('up')}
              >
                <ChevronUp className="w-4 h-4 text-ink" />
              </button>

              <div ref={galleryRef} className="flex-1 overflow-y-auto pt-9 pb-9 flex flex-col">
                {/* Real gallery images or pattern fallbacks */}
                {galleryImages && galleryImages.length > 0
                  ? galleryImages.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-full min-h-[110px] border-b border-ink/5 relative cursor-pointer group/thumb overflow-hidden"
                      onClick={() => setSelectedImage({ url: img.url, label: img.caption || `Gallery ${idx + 1}` })}
                    >
                      <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-ink/20 group-hover/thumb:bg-transparent transition-all duration-300" />
                    </div>
                  ))
                  : (
                    /* No gallery images state */
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center select-none">
                      <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        No Gallery<br />Images
                      </p>
                    </div>
                  )
                }
              </div>

              <button
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                onClick={() => scrollGallery('down')}
              >
                <ChevronDown className="w-4 h-4 text-ink" />
              </button>
            </div>
          </div>

          {/* ─── Details Grid ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 border-b border-wix-border-light pb-14">

            {/* Left: Meta + Map */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted mb-1">Date</div>
                    <div className="text-[16px] font-medium text-wix-text-dark">{dateStr}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0"><Clock className="w-5 h-5" /></div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted mb-1">Time</div>
                    <div className="text-[16px] font-medium text-wix-text-dark">{timeStr}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted mb-1">Venue</div>
                    <div className="text-[16px] font-medium text-wix-text-dark">{event.venue?.name || 'TBA'}</div>
                    {event.venue?.address && (
                      <div className="text-[14px] text-wix-text-muted mt-0.5">
                        {[event.venue.address.street, event.venue.address.city, event.venue.address.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {event.organizer && (
                      <div className="mt-3 pt-3 border-t border-wix-border-light">
                        <div className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted mb-1">Organizer</div>
                        <div className="text-[14px] font-medium">{event.organizer?.companyName || event.organizer?.name}</div>
                        {event.organizer?.companyEmail && (
                          <div className="text-[13px] text-wix-purple mt-0.5">{event.organizer.companyEmail}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* <MinimalMap
                venue={event.venue?.address?.city}
                coordinates={event.venue?.coordinates?.coordinates}
              /> */}
            </div>

            {/* Right: About & Host Profile */}
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-10 pt-1">
              <div className="flex flex-col gap-5">
                <h3 className="text-[22px] font-semibold tracking-tight">About This Event</h3>
                {(event.description || event.tagline) && (
                  <div className="flex flex-col gap-3">
                    <div
                      ref={(el) => {
                        (descRef as any).current = el;
                        if (el) setDescOverflows(el.scrollHeight > 200);
                      }}
                      className={`text-[15px] text-wix-text-dark leading-relaxed whitespace-pre-wrap break-words overflow-hidden transition-all duration-500 ${descExpanded ? '' : 'max-h-[200px]'}`}
                    >
                      {cleanText(event.description)}
                    </div>
                    {descOverflows && (
                      <button
                        onClick={() => setDescExpanded(v => !v)}
                        className="self-start text-[13px] font-bold uppercase tracking-widest border-b border-wix-text-dark pb-0.5 hover:opacity-60 transition-opacity"
                      >
                        {descExpanded ? 'See Less ↑' : 'See More ↓'}
                      </button>
                    )}
                  </div>
                )}
                {event.highlights?.length > 0 && (
                  <ul className="flex flex-col gap-2 mt-2">
                    {event.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-wix-text-muted">
                        <span className="text-wix-purple mt-1">•</span> {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Host Profile Section */}
              {/* {(event.host || event.organizer) && (() => {
                const hostData = event.host || event.organizer;
                const hostId = event.hostId;
                const hostName = hostData.name || hostData.companyName || 'Event Organizer';
                
                return (
                  <div className="flex flex-col gap-4 pt-8 border-t border-wix-border-light">
                    <h3 className="text-[20px] font-semibold tracking-tight">Hosted By</h3>
                    <div 
                      className="flex items-center gap-5 bg-white border border-wix-border-light p-5 hover:border-wix-text-dark transition-colors cursor-pointer group shadow-sm hover:shadow"
                      onClick={() => router.push(`/profile/host/${hostId}`)}
                    >
                      <div className="w-16 h-16 bg-[#f0f0f0] flex items-center justify-center shrink-0 border border-wix-border-light overflow-hidden">
                        <img 
                          src={hostData.profile?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostData.email || hostName}`} 
                          alt={hostName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <h4 className="text-[16px] font-bold text-wix-text-dark group-hover:text-wix-purple transition-colors truncate max-w-[200px] sm:max-w-full">{hostName}</h4>
                        <p className="text-[13px] text-wix-text-muted mt-0.5">Verified Organizer</p>
                      </div>
                      <div className="text-[12px] font-bold uppercase tracking-widest text-wix-text-dark border-b border-wix-text-dark pb-0.5 group-hover:text-wix-purple group-hover:border-wix-purple transition-colors shrink-0 hidden sm:block">
                        View Profile
                      </div>
                    </div>
                  </div>
                );
              })()} */}
            </div>
          </div>

          {/* ─── Tickets Section ─── */}
          <div id="tickets-section" className="pt-20 border-t border-ink/5">
            {event.status === 'ended' ? (
              <div className="bg-neutral-50 border border-ink/5 flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-black/5">
                  <Calendar size={24} className="text-ink/40" />
                </div>
                <h2 className="text-3xl font-serif tracking-tight mb-3">Event Concluded</h2>
                <p className="text-ink-muted max-w-[720px] mx-auto text-[15px] leading-relaxed">
                  Thank you to everyone who attended! Tickets for this past event are no longer available.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-serif mb-12">Select Your Experience</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
              {(event.tickets || [])
                .filter((t: any) => t.isVisible && t.isActive)
                .map((ticket: any) => {
                  const ticketId = ticket._id || ticket.name;
                  const qty = ticketQuantities[ticketId] || 0;
                  const available = Math.max(0, (ticket.quantity || 0) - (ticket.sold || 0) - (ticket.reserved || 0));

                  return (
                    <SelectableTicketCard
                      key={ticketId}
                      ticket={ticket}
                      qty={qty}
                      available={available}
                      onIncrement={() => handleIncrement(ticketId, available)}
                      onDecrement={() => handleDecrement(ticketId)}
                      eventDate={new Date(event.schedule.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      eventTime={new Date(event.schedule.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      eventVenue={event.venue?.name || 'TBA'}
                    />
                  );
                })}
            </div>

            {/* Total & Action */}
            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Total Amount</span>
                <span className="text-4xl font-serif">
                   ৳{grandTotal.toLocaleString()}
                </span>
                {totalItems > 0 && (
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <span className="text-sm uppercase tracking-widest opacity-80">Subtotal: ৳{totalAmount.toLocaleString()}</span>
                    {paymentProcessingFee > 0 && (
                      <span className="text-[12px] uppercase tracking-widest text-ink/80">1.5% Processing Fee: ৳{paymentProcessingFee.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={handleBookNow}
                disabled={totalItems === 0 || creatingOrder}
                className="px-12 py-6 bg-indigo-600 text-bg font-bold uppercase tracking-[0.4em] text-xs disabled:opacity-20 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 hidden md:flex"
              >
                {creatingOrder ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                {creatingOrder ? 'Processing...' : 'Confirm Purchase'}
              </button>
              <p className="text-[10px] text-ink-muted uppercase tracking-[0.2em] font-bold hidden md:block">
                Secure checkout powered by Zenvy Pay
              </p>
            </div>
            
            {/* Mobile Sticky Checkout Bar */}
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-ink/10 p-4 md:hidden shadow-[0_-20px_40px_rgba(0,0,0,0.08)] pb-[calc(1rem+env(safe-area-inset-bottom))]"
                >
                  <div className="flex items-center justify-between max-w-[450px] mx-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-ink/60 font-bold">Total ({totalItems})</span>
                      <span className="text-2xl font-serif leading-none mt-1 text-ink">৳{grandTotal.toLocaleString()}</span>
                      {paymentProcessingFee > 0 && (
                        <span className="text-[12px] text-ink/80 mt-1 whitespace-nowrap">Incl. ৳{paymentProcessingFee.toLocaleString()} fee</span>
                      )}
                    </div>
                    <button 
                      onClick={handleBookNow}
                      disabled={creatingOrder}
                      className="px-6 py-4 bg-indigo-600 text-bg font-bold uppercase tracking-[0.1em] text-[11px] disabled:opacity-50 hover:bg-indigo-700 transition-all flex items-center gap-2 rounded-2xl"
                    >
                      {creatingOrder ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                      {creatingOrder ? 'Processing...' : 'Purchase Now'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {orderError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-[13px] text-red-600 text-center mx-auto max-w-md">
                {orderError}
              </div>
            )}
              </>
            )}
          </div>

        </main>
      )}

      {/* ─── Image Modal ─── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-neutral-950/98 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-all z-10 p-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-6xl h-[60vh] sm:h-[80vh] flex items-center justify-center overflow-hidden cursor-default ${!selectedImage.url ? selectedImage.pattern || 'cover-pattern' : ''}`}
              onClick={e => e.stopPropagation()}
            >
              {selectedImage.url ? (
                <img src={selectedImage.url} alt={selectedImage.label} className="w-full h-full object-contain" />
              ) : (
                <h2 className="text-white font-light text-5xl sm:text-8xl tracking-widest px-8 py-5">
                  {selectedImage.label}
                </h2>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Success Modal ─── */}
      <AnimatePresence>
        {checkoutStep === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-[440px] bg-white border-2 border-black p-10 text-center space-y-8"
            >
              <div className="w-20 h-20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle2 size={44} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[24px] font-semibold text-wix-text-dark tracking-tight">You're In!</h3>
                <p className="text-[14px] text-wix-text-muted leading-relaxed">
                  Your ticket is confirmed. Check your email or visit your wallet for the details.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    // Replace the modal history entry so pressing back from
                    // wallet doesn't loop back into the success modal.
                    window.history.replaceState(null, '');
                    router.push('/wallet');
                  }}
                  className="w-full bg-black text-white py-3.5 text-[13px] font-black uppercase tracking-widest hover:bg-wix-purple transition-colors border-2 border-black"
                >
                  View My Wallet
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-3.5 text-[13px] font-bold uppercase tracking-widest border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  Back to Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ─── CheckoutBKash modal ─── */}
      <AnimatePresence>
        {checkoutStep === 'checkout' && (
          <CheckoutBKash
            amount={grandTotal}
            eventName={event?.title || 'Event'}
            tierName={`${totalItems} Ticket(s)`}
            onClose={() => setCheckoutStep('selection')}
            onSuccess={() => setCheckoutStep('success')}
          />
        )}
      </AnimatePresence>

      {/* ─── Float Scroll Button ─── */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] bg-ink text-bg px-8 py-4 rounded-full flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-bg/10 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16, 1, 0.3, 1]" />
            <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em]">Buy Tickets Now</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="relative z-10"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Payment Status Modal (PayStation callback) ─── */}
      <PaymentStatusModal eventId={eventId} />

    </div>
  );
}
