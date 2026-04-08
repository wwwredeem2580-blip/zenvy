'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService, Ticket } from '@/lib/api/ticket';
import { pdfService } from '@/lib/api/pdf';
import { useAuth } from '@/lib/context/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  FileText,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { QRModal } from './QRModal';
import { BDTIcon } from '../ui/Icons';

/* ─── Premium QR Icon SVG ─── */
const PremiumQRIcon = ({ className }: { className?: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="0" y="0" width="12" height="12" fill="currentColor" />
    <rect x="28" y="0" width="12" height="12" fill="currentColor" />
    <rect x="0" y="28" width="12" height="12" fill="currentColor" />
    <rect x="16" y="0" width="8" height="4" fill="currentColor" />
    <rect x="28" y="16" width="4" height="8" fill="currentColor" />
    <rect x="16" y="28" width="8" height="4" fill="currentColor" />
    <rect x="0" y="16" width="4" height="8" fill="currentColor" />
    <rect x="16" y="16" width="8" height="8" fill="currentColor" />
    <rect x="28" y="28" width="4" height="4" fill="currentColor" />
    <rect x="36" y="36" width="4" height="4" fill="currentColor" />
  </svg>
);

/* ─── Aesthetic Barcode SVG ─── */
const BarcodeIcon = ({ className }: { className?: string }) => (
  <svg width="40" height="150" viewBox="0 0 40 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 0V150M12 0V150M18 0V150M22 0V150M30 0V150M35 0V150M10 0V150M25 0V150M38 0V150" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

/* ─── Single flippable ticket card ─── */
function FlippableTicket({
  ticket,
  eventTitle,
  isFlipped,
  onFlip,
  style,
  zIndex,
}: {
  ticket: Ticket;
  eventTitle: string;
  isFlipped: boolean;
  onFlip: () => void;
  style: React.CSSProperties;
  zIndex: number;
}) {
  const tierName: string = ticket.ticketTheme?.tier || ticket.ticketTheme?.name || ticket.ticketType || 'Standard';

  const isVIP = tierName.toLowerCase().includes('vip');
  const isPremium =
    tierName.toLowerCase().includes('premium') || tierName.toLowerCase().includes('early');

  const bgGradient = isVIP
    ? 'bg-neutral-900 border-2 border-[#D4AF37] text-white'
    : isPremium
    ? 'bg-neutral-900 border-2 border-slate-300 text-white'
    : 'bg-white text-wix-text-dark border border-neutral-200';

  const metallicAccent = isVIP
    ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-transparent bg-clip-text'
    : isPremium
    ? 'bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 text-transparent bg-clip-text'
    : '';

  const stubBg = isVIP
    ? 'bg-gradient-to-b from-neutral-800 to-neutral-900'
    : isPremium
    ? 'bg-gradient-to-b from-neutral-800 to-neutral-900'
    : 'bg-neutral-50';

  const accentText = isVIP || isPremium ? 'text-gray-300' : 'text-wix-text-muted';

  const eventDate = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA';
  const eventTime = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : 'TBA';

  const displayCode = (ticket.ticketNumber || ticket._id || '0000')
    .replace(/[^a-zA-Z0-9]/g, '')
    .padEnd(16, '0')
    .toUpperCase()
    .match(/.{1,4}/g)
    ?.join(' ') ?? '•••• •••• •••• ••••';

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-pointer preserve-3d transition-all duration-700 ease-in-out"
      style={{
        ...style,
        zIndex,
        transform: `${(style.transform as string) || ''} ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
      }}
      onClick={onFlip}
    >
      {/* ─ FRONT ─ */}
      <div
        className={`absolute inset-0 w-full h-full backface-hidden flex flex-row overflow-hidden ${bgGradient} rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]`}
      >
        {/* Main Body (Left) */}
        <div className="flex-[2.5] flex flex-col justify-between p-4 sm:p-8 relative">
          {/* Authentic Die-cut Perforation Divider */}
          <div className="absolute top-0 right-0 h-full w-[2px] flex flex-col items-center justify-between py-1">
             <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-wix-gray-bg border border-black/5 absolute -top-2 sm:-top-3 -right-2 sm:-right-3 z-10" />
             <div className="h-full border-r-[1.5px] border-dotted border-current opacity-20" />
             <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-wix-gray-bg border border-black/5 absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 z-10" />
          </div>

          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.4em] mb-1 ${(isVIP || isPremium) ? metallicAccent : 'text-wix-purple'}`}>
                {isVIP ? 'Exclusive Access' : isPremium ? 'Premium Entry' : 'General Access'}
              </span>
              <h3 className={`text-[16px] sm:text-[24px] font-bold leading-tight line-clamp-1 tracking-tight ${(isVIP || isPremium) ? 'text-white' : 'text-wix-text-dark'}`}>
                {eventTitle}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <span className={`text-[6px] sm:text-[8px] font-bold uppercase tracking-[0.2em] ${accentText}`}>Date</span>
              <span className="text-[10px] sm:text-[12px] font-mono font-bold">{eventDate}</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <span className={`text-[6px] sm:text-[8px] font-bold uppercase tracking-[0.2em] ${accentText}`}>Time</span>
              <span className="text-[10px] sm:text-[12px] font-mono font-bold">{eventTime}</span>
            </div>
          </div>

          <div className={`text-[8px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.3em] opacity-80 ${accentText}`}>
             {displayCode}
          </div>
        </div>

        {/* Stub (Right) */}
        <div className={`w-[30%] sm:w-[28%] flex flex-col justify-between items-center p-3 sm:p-6 ${stubBg} relative shrink-0`}>
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />

          <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] transform rotate-90 origin-center translate-y-2 opacity-30 whitespace-nowrap">
             Ticket Stub
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5 z-10">
             {/* Premium QR Icon instead of real image for speed & aesthetics */}
             <div className="p-1 sm:p-1.5 bg-white shadow-inner mb-1 sm:mb-2 rounded-[2px] overflow-hidden">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white flex items-center justify-center">
                   <PremiumQRIcon className={`w-full h-full ${(isVIP || isPremium) ? 'text-neutral-900' : 'text-neutral-900'}`} />
                </div>
             </div>
             <div className={`text-[10px] sm:text-[13px] font-black uppercase tracking-wider ${(isVIP || isPremium) ? metallicAccent : 'text-wix-text-dark'}`}>{tierName}</div>
          </div>
        </div>

        <div className={`absolute bottom-1.5 sm:bottom-2 left-4 sm:left-6 text-[6px] sm:text-[7px] font-bold uppercase tracking-[0.2em] ${accentText} opacity-60`}>
          Zenvy Digital Pass
        </div>
      </div>

      {/* ─ BACK ─ */}
      <div
        className={`absolute inset-0 w-full h-full backface-hidden flex flex-row rotate-y-180 overflow-hidden ${bgGradient} rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]`}
      >
        <div className="flex-[2.5] p-5 sm:p-8 flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 h-full w-[2px] flex flex-col items-center justify-between py-1">
             <div className="w-6 h-6 rounded-full bg-wix-gray-bg border border-black/5 absolute -top-3 -right-3 z-10" />
             <div className="h-full border-r-[1.5px] border-dotted border-current opacity-20" />
             <div className="w-6 h-6 rounded-full bg-wix-gray-bg border border-black/5 absolute -bottom-3 -right-3 z-10" />
          </div>

          <div>
             <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] mb-4 sm:mb-6 border-b border-current/10 pb-2 sm:pb-3 ${accentText}`}>Exclusive Benefits</div>
             {ticket.ticketTheme?.benefits && ticket.ticketTheme.benefits.length > 0 ? (
                <ul className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3">
                  {ticket.ticketTheme.benefits.slice(0, 6).map((b: string, i: number) => (
                    <li key={i} className={`text-[9px] sm:text-[11px] ${accentText} flex items-center gap-2 sm:gap-2.5 font-medium`}>
                      <span className="w-1 sm:w-1.5 h-[1px] sm:h-[1.5px] bg-current opacity-40 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
             ) : (
                <p className={`text-[10px] sm:text-[11px] ${accentText} font-medium tracking-wide`}>This pass grants full entry access and all standard event amenities.</p>
             )}
          </div>

          <div className="mt-auto flex gap-4 sm:gap-8 items-center pt-4 sm:pt-6 border-t border-current/10">
             <div className={`flex items-center gap-2 text-[9px] sm:text-[10px] font-bold ${accentText}`}>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" /> {eventDate}
             </div>
             <div className={`flex items-center gap-2 text-[9px] sm:text-[10px] font-bold ${accentText}`}>
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" /> {ticket.eventVenue?.split(',')[0] || 'Venue'}
             </div>
          </div>
        </div>

        <div className={`w-[30%] sm:w-[28%] flex flex-col justify-center items-center p-3 sm:p-6 ${stubBg} relative shrink-0`}>
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
           <div className={`text-[8px] sm:text-[9px] font-black tracking-[0.4em] transform -rotate-90 origin-center whitespace-nowrap mb-8 sm:mb-12 opacity-30 ${accentText}`}>SECURE ACCESS</div>
           <div className="p-2 bg-white shadow-2xl rounded-sm z-10">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-neutral-900 flex items-center justify-center overflow-hidden">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 border-[1.5px] border-white/20 border-dashed animate-spin-slow rotate-45" />
              </div>
           </div>
           <p className={`text-[6px] sm:text-[7px] font-bold text-center mt-3 sm:mt-4 leading-tight opacity-40 uppercase tracking-[0.2em] ${accentText}`}>Verified</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Card Stack for one event group ─── */
function TicketStack({
  tickets,
  eventTitle,
  onRevealQR,
  onDownloadQR,
  onDownloadPDF,
  downloadingPDF,
}: {
  tickets: Ticket[];
  eventTitle: string;
  onRevealQR: (ticket: Ticket) => void;
  onDownloadQR: (ticket: Ticket) => void;
  onDownloadPDF: (ticketId: string) => void;
  downloadingPDF: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePrev = () => { if (currentIndex > 0) { setIsFlipped(false); setCurrentIndex(p => p - 1); } };
  const handleNext = () => { if (currentIndex < tickets.length - 1) { setIsFlipped(false); setCurrentIndex(p => p + 1); } };
  const activeTicket = tickets[currentIndex];

  return (
    <div className="flex flex-col items-center w-full bg-wix-gray-bg border-t border-wix-border-light p-3 sm:p-10 relative">
      <div className="absolute top-4 left-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">
        Ticket {currentIndex + 1} of {tickets.length}
      </div>

      {/* Stack + Arrows (Desktop) */}
      <div className="flex items-center justify-center w-full gap-8 my-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`hidden sm:flex p-3 border border-black rounded-full transition-colors shrink-0 ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-black hover:text-white bg-white text-black'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Stack wrapper */}
        <div className="w-full max-w-[580px] aspect-[1.8/1] sm:aspect-[2.3/1] perspective-1000 relative self-center">
          {tickets.map((ticket, index) => {
            const offset = index - currentIndex;
            if (offset < 0 || offset > 2) return null;

            const translateY = offset * -14;
            const scale = 1 - offset * 0.05;
            const opacity = offset === 0 ? 1 : 1 - offset * 0.3;

            return (
              <FlippableTicket
                key={ticket._id}
                ticket={ticket}
                eventTitle={eventTitle}
                isFlipped={offset === 0 ? isFlipped : false}
                onFlip={() => offset === 0 && setIsFlipped(f => !f)}
                zIndex={50 - offset}
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  pointerEvents: offset === 0 ? 'auto' : 'none',
                }}
              />
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === tickets.length - 1}
          className={`hidden sm:flex p-3 border border-black rounded-full transition-colors shrink-0 ${currentIndex === tickets.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-black hover:text-white bg-white text-black'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Row (Mobile only) */}
      <div className="flex sm:hidden items-center justify-center gap-6 mb-8 mt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-3 border border-black rounded-full transition-colors ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white text-black'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === tickets.length - 1}
          className={`p-3 border border-black rounded-full transition-colors ${currentIndex === tickets.length - 1 ? 'opacity-20 cursor-not-allowed' : 'bg-white text-black'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        <button
          onClick={() => setIsFlipped(f => !f)}
          className="bg-white text-wix-text-dark px-5 py-2.5 font-semibold text-[13px] hover:bg-wix-text-dark hover:text-white transition-colors border-2 border-wix-text-dark"
        >
          Flip
        </button>
        <button
          onClick={() => onRevealQR(activeTicket)}
          className="bg-white text-wix-text-dark px-5 py-2.5 font-semibold text-[13px] hover:bg-wix-text-dark hover:text-white transition-colors border-2 border-wix-text-dark flex items-center gap-2"
        >
          <Eye className="w-4 h-4" /> QR Code
        </button>
        <button
          onClick={() => onDownloadPDF(activeTicket._id)}
          disabled={downloadingPDF === activeTicket._id}
          className="bg-white text-wix-text-dark px-5 py-2.5 font-semibold text-[13px] hover:bg-wix-text-dark hover:text-white transition-colors border-2 border-wix-text-dark flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadingPDF === activeTicket._id ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
          ) : (
            <><FileText className="w-4 h-4" /> PDF</>
          )}
        </button>
      </div>

      {/* Indicator dots */}
      {tickets.length > 1 && (
        <div className="flex gap-2 mt-7">
          {tickets.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setIsFlipped(false); setCurrentIndex(idx); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-wix-text-dark' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Event group accordion row ─── */
function EventAccordion({
  eventGroup,
  isOpen,
  onToggle,
  onRevealQR,
  onDownloadQR,
  onDownloadPDF,
  onDownloadAll,
  downloadingPDF,
  downloadingBulk,
}: any) {
  const eventDate = new Date(eventGroup.eventDate);
  const fmtDate = eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const daysLeft = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="border border-wix-border-light bg-white mb-3 transition-all">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors gap-4 sm:gap-6"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Event cover thumb */}
          <div className="w-14 h-14 shrink-0 bg-gray-100 border border-wix-border-light overflow-hidden">
            {eventGroup.eventCoverImage ? (
              <img
                src={eventGroup.eventCoverImage}
                alt={eventGroup.eventTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-wix-text-muted">
                <Calendar className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-tight text-wix-text-dark line-clamp-1">
              {eventGroup.eventTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-wix-text-muted">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmtDate}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtTime}</span>
              {eventGroup.eventVenue && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {eventGroup.eventVenue}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                  daysLeft > 0
                    ? 'border-wix-purple text-wix-purple'
                    : daysLeft === 0
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today' : 'Passed'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-wix-text-muted border border-wix-border-light px-2 py-0.5">
                {eventGroup.tickets.length} Ticket{eventGroup.tickets.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {/* Bulk download */}
          <button
            onClick={e => { e.stopPropagation(); onDownloadAll(eventGroup.tickets.map((t: any) => t._id)); }}
            disabled={!!downloadingBulk}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 border border-wix-border-light text-[12px] font-semibold text-wix-text-muted hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloadingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadIcon className="w-3.5 h-3.5" />}
            All PDFs
          </button>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-wix-text-dark" />
          </div>
        </div>
      </div>

      {/* Expanded ticket stack */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <TicketStack
              tickets={eventGroup.tickets}
              eventTitle={eventGroup.eventTitle}
              onRevealQR={onRevealQR}
              onDownloadQR={onDownloadQR}
              onDownloadPDF={onDownloadPDF}
              downloadingPDF={downloadingPDF}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Wallet Page ─── */
export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [downloadingBulk, setDownloadingBulk] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketService.getUserTickets();
        setTickets(data);
        // Auto-open first event group
        if (data.length > 0) setOpenEventId(data[0].eventId);
      } catch (err: any) {
        setError(err.message || 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Group by event
  const eventGroups = Object.values(
    tickets.reduce((acc, ticket) => {
      const eid = ticket.eventId;
      if (!acc[eid]) {
        acc[eid] = {
          eventId: eid,
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventVenue: ticket.eventVenue,
          venueAddress: ticket.venueAddress,
          eventCoverImage: ticket.eventCoverImage || null,
          tickets: [],
        };
      }
      acc[eid].tickets.push(ticket);
      return acc;
    }, {} as Record<string, any>)
  );

  const handleDownloadQR = async (ticket: Ticket) => {
    try {
      const res = await fetch(ticket.qrCodeUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticket.ticketNumber}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('QR download failed', e);
    }
  };

  const handleDownloadPDF = async (ticketId: string) => {
    if (downloadingPDF) return;
    try {
      setDownloadingPDF(ticketId);
      await pdfService.downloadTicketPDF(ticketId);
    } catch (e) {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleDownloadAll = async (ticketIds: string[]) => {
    if (downloadingBulk) return;
    try {
      setDownloadingBulk(ticketIds[0]);
      await pdfService.downloadBulkTicketPDFs(ticketIds);
    } catch (e) {
      alert('Failed to download PDFs. Please try again.');
    } finally {
      setDownloadingBulk(null);
    }
  };

  return (
    <div className="min-h-screen bg-wix-gray-bg text-wix-text-dark font-sans">
      <main className="max-w-[920px] mx-auto w-full px-2 sm:px-6 py-8 sm:py-12 flex flex-col">

        {/* Back nav */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest hover:text-wix-purple transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        {/* Page header */}
        <div className="mb-8 border-b border-wix-border-light pb-6">
          <h1 className="text-[28px] sm:text-[36px] font-medium tracking-tight text-wix-text-dark leading-tight mb-2">
            My Wallet
          </h1>
          <p className="text-[14px] sm:text-[15px] text-wix-text-muted">
            All your secure entries and digital invitations in one place.
          </p>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-wix-purple" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[13px] text-wix-purple hover:underline">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && eventGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-5xl mb-2">🎫</div>
            <p className="text-[16px] font-medium text-wix-text-dark">No tickets yet</p>
            <p className="text-[14px] text-wix-text-muted">Browse events and book your first ticket.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 bg-black text-white px-8 py-3 text-[13px] font-black uppercase tracking-widest hover:bg-wix-purple transition-colors border-2 border-black"
            >
              Browse Events
            </button>
          </div>
        )}

        {!loading && !error && eventGroups.length > 0 && (
          <div className="flex flex-col">
            {eventGroups.map((group: any) => (
              <EventAccordion
                key={group.eventId}
                eventGroup={group}
                isOpen={openEventId === group.eventId}
                onToggle={() => setOpenEventId(openEventId === group.eventId ? null : group.eventId)}
                onRevealQR={setSelectedTicket}
                onDownloadQR={handleDownloadQR}
                onDownloadPDF={handleDownloadPDF}
                onDownloadAll={handleDownloadAll}
                downloadingPDF={downloadingPDF}
                downloadingBulk={downloadingBulk}
              />
            ))}
          </div>
        )}
      </main>

      {/* QR Modal */}
      {selectedTicket && (
        <QRModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          qrCodeUrl={selectedTicket.qrCodeUrl}
          ticketNumber={selectedTicket.ticketNumber}
          eventTitle={selectedTicket.eventTitle}
          ticketType={selectedTicket.ticketType}
          onDownload={() => handleDownloadQR(selectedTicket)}
        />
      )}
    </div>
  );
}
