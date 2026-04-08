'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { publicService } from '@/lib/api/public';
import { orderService } from '@/lib/api/order';
import { useAuth } from '@/lib/context/auth';
import { useNotification } from '@/lib/context/notification';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckoutBKash } from './CheckoutBKash';
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
} from 'lucide-react';
import { BDTIcon } from '../ui/Icons';

const MAX_TICKETS_PER_ORDER = 5;
const PLATFORM_FEE = 0;

/* ─── SVG Icons ─── */
const ChipIcon = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="38" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 10H10V20H1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M39 10H30V20H39" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 1V30" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M25 1V30" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 15H25" stroke="currentColor" strokeWidth="1.5"/>
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

/* ─── Credit-Card Style Ticket ─── */
function TicketCardNew({
  ticket,
  quantity,
  onIncrement,
  onDecrement,
  eventDate,
}: {
  ticket: any;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  eventDate: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const price = ticket.price?.amount ?? ticket.price ?? 0;
  const tierName: string = ticket.tier || ticket.name || 'Standard';
  const benefits: string[] = ticket.benefits || ['Event access', 'Dedicated entrance'];

  const isVIP = true
  const isPremium = tierName.toLowerCase().includes('premium') || tierName.toLowerCase().includes('early');

  const frontBg = isVIP
    ? 'bg-[#1a1a1a] text-white'
    : isPremium
    ? 'bg-wix-purple text-white'
    : 'bg-white text-wix-text-dark border-2 border-black';

  const accentText = isVIP || isPremium ? 'text-gray-300' : 'text-wix-text-muted';

  // Generate a display code from ticket id
  const displayCode = (ticket._id || ticket.name || '0000')
    .replace(/[^a-zA-Z0-9]/g, '')
    .padEnd(16, '0')
    .toUpperCase()
    .match(/.{1,4}/g)
    ?.join(' ') ?? '•••• •••• •••• ••••';

  const sold = ticket.sold ?? 0;
  const reserved = ticket.reserved ?? 0;
  const totalQty = ticket.quantity ?? 999;
  const available = Math.max(0, totalQty - sold - reserved);
  const isSoldOut = available === 0;

  return (
    <div className="flex flex-col gap-5 items-center w-full max-w-[380px]">
      {/* 3D flip card */}
      <div
        className="perspective-1000 w-full aspect-[1.586/1] cursor-pointer"
        onClick={() => !isSoldOut && setIsFlipped(f => !f)}
        title="Click to flip and see benefits"
      >
        <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* FRONT */}
          <div className={`absolute inset-0 w-full h-full backface-hidden p-5 sm:p-6 flex flex-col justify-between ${frontBg} ${!isVIP && !isPremium ? '' : ''}`}>
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <span className="text-white text-[16px] font-black uppercase tracking-widest">Sold Out</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <ChipIcon />
                <div className="opacity-70"><ContactlessIcon /></div>
              </div>
              <div className="text-right flex flex-col items-end">
                <h3 className="text-[15px] font-black uppercase tracking-widest">{tierName}</h3>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${accentText}`}>Event Ticket</span>
              </div>
            </div>

            <div className={`text-[16px] sm:text-[20px] font-mono tracking-widest mt-auto mb-3 ${accentText}`}>
              Powered by Zenvy
            </div>

            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className={`text-[9px] uppercase tracking-widest ${accentText} mb-0.5`}>Valid for</span>
                <span className="text-[13px] font-mono font-bold tracking-wide uppercase">Admit One</span>
              </div>
              <div className="flex flex-col text-right">
                <span className={`text-[9px] uppercase tracking-widest ${accentText} mb-0.5`}>Price</span>
                <span className="text-[16px] font-bold font-mono">
                  {price === 0 ? 'FREE' : <><BDTIcon className="inline text-[13px]" />{price.toLocaleString()}</>}
                </span>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className={`absolute inset-0 w-full h-full backface-hidden border-2 border-black ${frontBg} flex flex-col rotate-y-180 overflow-hidden`}>
            <div className="px-5 py-4 flex flex-col flex-1">
              <div className="bg-gray-100 h-8 w-full flex items-center justify-end px-4 font-mono text-[11px] mb-4 text-gray-500">
                VALID: {eventDate}
              </div>
              <div className={`text-[10px] ${accentText} uppercase tracking-widest mb-2 border-b border-black pb-3`}>
                Included Benefits
              </div>
              <ul className={`flex flex-col gap-1.5 text-[12px] font-medium leading-snug ${accentText}`}>
                {benefits.slice(0, 5).map((b: string, i: number) => (
                  <li key={i}>• {b}</li>
                ))}
                {benefits.length > 5 && <li className={accentText}>• +{benefits.length - 5} more</li>}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Quantity controls */}
      {!isSoldOut && (
        <div className="flex items-center justify-between border-2 border-black w-[152px] bg-white h-[46px] overflow-hidden">
          <button
            onClick={onDecrement}
            className="w-12 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors text-xl font-medium"
          >
            −
          </button>
          <span className="font-mono text-[15px] font-bold">{quantity}</span>
          <button
            onClick={onIncrement}
            className="w-12 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors text-xl font-medium"
          >
            +
          </button>
        </div>
      )}
      {isSoldOut && (
        <span className="text-[12px] text-red-500 font-bold uppercase tracking-widest">Sold Out</span>
      )}
    </div>
  );
}

/* ─── Main EventDetails Component ─── */
export default function EventDetails() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const { user } = useAuth();
  const { showNotification } = useNotification();

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

  // Check payment success from URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('payment') === 'success') {
      setCheckoutStep('success');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Body scroll lock for modal
  useEffect(() => {
    document.body.style.overflow = selectedImage || checkoutStep === 'success' ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedImage, checkoutStep]);

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
          <div>
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
            <p className="text-[15px] text-wix-text-muted leading-relaxed">
              {event.tagline || event.description}
            </p>
          </div>

          {/* ─── Image Section ─── */}
          <div className="flex flex-col md:flex-row gap-3 h-[280px] sm:h-[420px] w-full">

            {/* Cover Image */}
            <div
              className="w-full md:w-3/4 h-full border border-ink/10 relative overflow-hidden group cursor-pointer bg-neutral-900 flex items-center justify-center shadow-sm"
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
                  <p className="text-[15px] text-wix-text-dark leading-relaxed">
                    {event.description}
                  </p>
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
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-[24px] font-semibold tracking-tight text-wix-text-dark">Select Tickets</h2>
              <p className="text-[14px] text-wix-text-muted mt-1">Flip the card to view benefits. Select your quantity below each ticket.</p>
            </div>

            {event.moderation?.sales?.paused && (
              <div className="p-4 bg-red-50 border border-red-200 text-[13px] text-red-600">
                Ticket sales are currently paused. Please check back later.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 justify-items-center">
              {(event.tickets || []).filter((t: any) => t.isVisible && t.isActive).map((ticket: any) => {
                const available = Math.max(0, (ticket.quantity || 0) - (ticket.sold || 0) - (ticket.reserved || 0));
                return (
                  <TicketCardNew
                    key={ticket._id || ticket.name}
                    ticket={ticket}
                    quantity={ticketQuantities[ticket._id || ticket.name] || 0}
                    onIncrement={() => handleIncrement(ticket._id || ticket.name, available)}
                    onDecrement={() => handleDecrement(ticket._id || ticket.name)}
                    eventDate={eventDateShort}
                  />
                );
              })}
            </div>

            {/* Order error */}
            {orderError && (
              <div className="p-4 bg-red-50 border border-red-200 text-[13px] text-red-600 max-w-md">
                {orderError}
              </div>
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

      {/* ─── Sticky Checkout Bar ─── */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-white border-t-2 border-black px-4 sm:px-8 py-4 z-50 transition-transform duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 ${totalItems > 0 ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-wix-text-muted">Selection</span>
            <span className="text-[20px] font-bold text-wix-text-dark">
              {totalItems} Ticket{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-10 w-px bg-wix-border-light hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-wix-text-muted">Total Due</span>
            <span className="text-[22px] font-mono font-bold text-wix-text-dark leading-none flex items-center gap-0.5">
              {grandTotal === 0 ? 'FREE' : <><BDTIcon className="text-[18px]" />{grandTotal.toLocaleString()}</>}
            </span>
          </div>
          {paymentProcessingFee > 0 && (
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-wix-text-muted">Incl. fees</span>
              <span className="text-[12px] text-wix-text-muted">
                <BDTIcon className="text-[11px]" />{paymentProcessingFee} processing
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleBookNow}
          disabled={creatingOrder}
          className="w-full sm:w-auto bg-black text-white px-10 py-4 text-[13px] font-black uppercase tracking-widest hover:bg-wix-purple transition-colors border-2 border-black hover:border-wix-purple disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {creatingOrder ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : grandTotal === 0 ? 'Get Free Tickets' : 'Proceed to Checkout'}
        </button>
      </div>

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

    </div>
  );
}
