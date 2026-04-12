'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart2, Users, CheckCircle, Ticket,
  Image as ImageIcon, Megaphone, Settings,
  Calendar, MapPin, ArrowRight, Search, Filter,
  Download, Plus, X, Clock, Trash2, AlertTriangle,
  Mail, Tag, Link as LinkIcon, ArrowLeft, Loader2,
  Scan, Copy, Upload, Pencil, Camera, Eye, Sparkles, BarChart3, Pause, Play,
  Circle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth';
import { hostAnalyticsService, HostEventDetailsResponse } from '@/lib/api/host-analytics';
import { hostEventsService } from '@/lib/api/host';
import { scannerService } from '@/lib/api/scanner';
import { eventsService } from '@/lib/api/events';
import { useNotification } from '@/lib/context/notification';
import { BDTIcon } from '@/components/ui/Icons';
import { cleanText } from '@/lib/utils';

/* ─── Shared UI ─── */
const SidebarItem = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-colors border-l-2 ${isActive ? 'border-black text-black bg-gray-50' : 'border-transparent text-wix-text-muted hover:text-black hover:bg-gray-50'}`}
  >
    <Icon className="w-4 h-4" />{label}
  </button>
);

const SharpToggle = ({ checked, onChange }: any) => (
  <div
    className={`w-10 h-6 relative cursor-pointer border ${checked ? 'bg-black border-black' : 'bg-gray-200 border-gray-300'} transition-colors`}
    onClick={() => onChange(!checked)}
  >
    <div className={`w-4 h-4 bg-white absolute top-0.5 border border-gray-300 transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-5' : 'left-0.5'}`} />
  </div>
);

const QuickActionButton = ({ icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-3 w-full p-4 border border-wix-border-light bg-white hover:border-black transition-colors text-left group">
    <Icon className="w-5 h-5 text-wix-text-muted group-hover:text-black transition-colors" />
    <span className="text-[14px] font-medium text-wix-text-dark">{label}</span>
    <ArrowRight className="ml-auto w-4 h-4 text-wix-text-muted opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
  </button>
);

/* ─── Tabs ─── */
const QuickActions = ({ ev, onRefetch, setActiveTab }: { ev: any; onRefetch: () => Promise<void>; setActiveTab: (t: string) => void }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleToggleSales = async () => {
    if (!ev?._id) return;
    try {
      setLoading(true);
      const res = await eventsService.toggleSalesPause(ev._id);
      showNotification('success', 'Status Updated', res.message);
      await onRefetch();
    } catch (err: any) {
      showNotification('error', 'Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const salesPaused = ev?.moderation?.sales?.paused ?? false;
  const canToggleSales = ev?.status === 'published' || ev?.status === 'live';

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Export CSV from Attendees tab', done: false, action: () => setActiveTab('Attendees') },
    { id: 2, text: 'Activate scanner session', done: false, action: () => setActiveTab('Checkin') },
    { id: 3, text: 'Be prepared for manual check-in', done: false, action: () => setActiveTab('Checkin') },
    { id: 4, text: 'Make sure to add scanner devices', done: false, action: () => setActiveTab('Checkin') },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-wix-text-muted mb-6">Status & Sales</h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-ink/10">
            <span className="text-[11px] font-black uppercase tracking-wider text-wix-text-muted">Live Status</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 ${
              ev?.status === 'live' ? 'border-emerald-500 text-emerald-600' :
              ev?.status === 'published' ? 'border-wix-purple text-wix-purple' :
              'border-ink text-ink'
            }`}>
              {ev?.status || 'Draft'}
            </span>
          </div>

          <button
            onClick={handleToggleSales}
            disabled={!canToggleSales || loading}
            className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] border-2 flex items-center justify-center gap-3 transition-all active:translate-y-0.5 ${
              salesPaused 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100' 
                : 'bg-white text-ink border-ink hover:bg-ink hover:text-white'
            } disabled:opacity-40`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : salesPaused ? <Play size={14} /> : <Pause size={14} />}
            {salesPaused ? 'Resume Sales' : 'Pause Ticket Sales'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-wix-text-muted">To-Do List</h3>
          <span className="text-[11px] font-black uppercase tracking-widest text-ink">{doneCount}/{tasks.length} DONE</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {tasks.map(t => (
            <div 
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className="bg-gray-50/50 border border-gray-100 rounded-[20px] p-5 flex items-center gap-4 cursor-pointer group hover:bg-white hover:border-gray-200 transition-all active:scale-[0.98]"
            >
              <div 
                className={`transition-colors ${t.done ? 'text-emerald-500' : 'text-gray-300'}`}
              >
                {t.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <span className={`text-[14px] font-medium flex-1 transition-all ${t.done ? 'text-gray-400 line-through' : 'text-ink'}`}>
                {t.text}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  t.action();
                }}
                className="text-gray-400 group-hover:text-ink transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Tabs ─── */
const OverviewTab = ({ setActiveTab, data, onEdit, onRefetch }: { setActiveTab: (t: string) => void; data: HostEventDetailsResponse | null; onEdit: () => void; onRefetch: () => Promise<void> }) => {
  const ev = data?.event;
  const an = data?.analytics;
  const soldPct = an?.ticketsSoldPercentage ?? 0;
  
  const [descExpanded, setDescExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const [descOverflows, setDescOverflows] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 max-w-[1280px] gap-8 animate-in fade-in duration-300">
      <div className="xl:col-span-2 flex flex-col gap-8">
        {/* Cover Image Spotlight */}
        <div className="relative aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden group">
          <img 
            src={ev?.media?.coverImage?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} 
            className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700" 
            alt="Event Spotlight" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>



        <div className="bg-white border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:items-center sm:justify-between mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-wix-text-dark">Event Details</h2>
            <button 
              onClick={onEdit}
              className="text-ink border-2 border-ink px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-ink hover:text-white transition-all flex items-center gap-2"
            >
              <Pencil size={14} /> Edit Event
            </button>
          </div>
          <div className="mb-8">
             <div className="text-[10px] font-black uppercase tracking-widest text-wix-text-muted mb-2">Tagline:</div>
             <p className="text-[18px] font-bold text-ink leading-tight mb-6">{ev?.tagline ? cleanText(ev.tagline) : 'No tagline set for this event yet.'}</p>
             <div className="text-[10px] font-black uppercase tracking-widest text-wix-text-muted mb-2">Description:</div>
             <div className="flex flex-col gap-3">
               <div
                 ref={(el) => {
                   (descRef as any).current = el;
                   if (el) setDescOverflows(el.scrollHeight > 200);
                 }}
                 className={`text-[14px] text-wix-text-muted leading-relaxed whitespace-pre-line break-words overflow-hidden transition-all duration-500 ${descExpanded ? '' : 'max-h-[200px]'}`}
               >
                 {ev?.description ? cleanText(ev.description) : 'No detailed description provided.'}
               </div>
               {descOverflows && (
                 <button
                   onClick={() => setDescExpanded(v => !v)}
                   className="self-start text-[11px] font-bold uppercase tracking-widest text-ink hover:text-wix-purple transition-colors"
                 >
                   {descExpanded ? 'See Less ↑' : 'See More ↓'}
                 </button>
               )}
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 pt-6 border-t border-ink/5">
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Operational Date</div>
              <div className="text-[14px] font-bold text-ink flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {ev?.schedule?.startDate ? new Date(ev.schedule.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Venue & HQ</div>
              <div className="text-[14px] font-bold text-ink flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {ev?.venue?.name || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickActions ev={ev} onRefetch={onRefetch} setActiveTab={setActiveTab} />
    </div>
  );
};

const AttendeesTab = ({ data }: { data: HostEventDetailsResponse | null }) => {
  const { id: eventId } = useParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!eventId) return;
      try {
        setOrdersLoading(true);
        const res = await hostAnalyticsService.getHostOrders(1, 100, { eventId: eventId as string });
        setOrders(res.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [eventId]);

  const filtered = orders.filter(o =>
    !search ||
    o.buyerEmail?.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = showAll ? filtered : filtered.slice(0, 10);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1280px] duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-[20px] font-medium text-wix-text-dark">Attendee List</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or order..." className="w-full md:w-[250px] border border-wix-border-light pl-9 pr-4 py-2 text-[13px] outline-none focus:border-black transition-colors" />
          </div>
          <button className="border border-wix-border-light p-2 hover:border-black transition-colors bg-white"><Filter className="w-4 h-4" /></button>
          <button className="flex items-center gap-2 border border-wix-border-light px-4 py-2 text-[13px] font-medium hover:border-black transition-colors bg-white"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </div>

      <div className="bg-white border border-wix-border-light overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-black text-[12px] uppercase tracking-wider text-gray-500 bg-gray-50">
              <th className="py-4 pl-6 font-semibold">Buyer</th>
              <th className="py-4 font-semibold">Tickets</th>
              <th className="py-4 font-semibold">Order #</th>
              <th className="py-4 font-semibold">Date</th>
              <th className="py-4 font-semibold">Total</th>
              <th className="py-4 font-semibold">Status</th>
              <th className="py-4 pr-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-wix-purple" /></td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-[14px] text-wix-text-muted">No orders for this event yet</td></tr>
            ) : displayed.map((o: any) => (
              <tr key={o.orderNumber} className="border-b border-wix-border-light hover:bg-gray-50 transition-colors group">
                <td className="py-4 pl-6">
                  <div className="font-semibold text-[14px]">{o.buyerEmail?.split('@')[0] || '—'}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{o.buyerEmail}</div>
                </td>
                <td className="py-4 text-[14px] font-medium">{o.ticketCount}</td>
                <td className="py-4 text-[14px] font-mono">#{o.orderNumber}</td>
                <td className="py-4 text-[14px] text-gray-500">
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="py-4 text-[14px] font-mono">{o.total?.toLocaleString()} BDT</td>
                <td className="py-4">
                  <span className={`text-[11px] font-bold px-2 py-1 uppercase tracking-widest border ${
                    o.status === 'completed' || o.status === 'confirmed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : o.status === 'pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>{o.status}</span>
                </td>
                <td className="py-4 pr-6 text-right">
                  <button className="text-[13px] font-medium text-black border border-transparent px-3 py-1.5 hover:border-black transition-colors opacity-0 group-hover:opacity-100">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more / less footer */}
      {filtered.length > 10 && (
        <div className="flex justify-between items-center pt-4 border-t border-wix-border-light">
          <span className="text-[12px] text-wix-text-muted">
            {showAll ? filtered.length : Math.min(filtered.length, 10)} of {filtered.length} orders
          </span>
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-[13px] font-bold text-wix-text-dark border-b border-wix-text-dark pb-0.5 hover:text-wix-purple hover:border-wix-purple transition-colors"
          >
            {showAll ? 'Show less ↑' : `View all ${filtered.length} orders ↓`}
          </button>
        </div>
      )}
    </div>
  );
};


const CheckinTab = ({ data }: { data: HostEventDetailsResponse | null }) => {
  const stats = data?.analytics?.checkInStats;
  const checkedIn = stats?.checkedIn ?? 0;
  const total = stats?.total ?? 0;
  const remaining = total - checkedIn;
  const eventId = data?.event?._id;

  // ── Scanner session state ──
  const [session, setSession] = useState<any>(null);
  const [scannerUrl, setScannerUrl] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);

  // ── OTP modal state ──
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [otpCountdown, setOtpCountdown] = useState('');

  // ── Manual check-in state ──
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const manualDropdownRef = useRef<HTMLDivElement | null>(null);

  const { showNotification } = useNotification();

  // Debounced autocomplete search for manual check-in
  useEffect(() => {
    if (manualQuery.length < 2 || !session?.session?._id) {
      setManualResults([]);
      setShowManualDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setManualLoading(true);
      try {
        const res = await scannerService.searchTickets(session.session._id, manualQuery);
        setManualResults(res.tickets);
        setShowManualDropdown(true);
      } catch { setManualResults([]); setShowManualDropdown(false); }
      finally { setManualLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [manualQuery, session?.session?._id]);

  // Load existing session on mount
  useEffect(() => {
    if (!eventId) { setSessionLoading(false); return; }
    (async () => {
      try {
        setSessionLoading(true);
        const existing = await scannerService.getActiveSessionByEvent(eventId);
        if (existing) {
          setSession(existing);
          if ((existing as any).scannerUrl) setScannerUrl((existing as any).scannerUrl);
        }
      } catch { /* no active session */ } finally { setSessionLoading(false); }
    })();
  }, [eventId]);

  // Auto-refresh every 3s while session is active
  useEffect(() => {
    if (!session?.session?._id) return;
    const iv = setInterval(async () => {
      try {
        const fresh = await scannerService.getSessionDetails(session.session._id);
        setSession(fresh);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(iv);
  }, [session?.session?._id]);

  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiry) return;
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.floor((otpExpiry.getTime() - Date.now()) / 1000));
      const m = String(Math.floor(diff / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setOtpCountdown(`${m}:${s}`);
      if (diff === 0) { clearInterval(iv); setShowOtpModal(false); }
    }, 1000);
    return () => clearInterval(iv);
  }, [otpExpiry]);

  const handleCreateSession = async () => {
    if (!eventId) return;
    try {
      setCreating(true);
      const result = await scannerService.createSession(eventId);
      setScannerUrl(result.scannerUrl);
      const details = await scannerService.getSessionDetails(result.session._id);
      setSession(details);
      showNotification('success', 'Session Created', 'Share the scanner link with your staff');
    } catch (err: any) {
      showNotification('error', 'Failed', err.message);
    } finally { setCreating(false); }
  };

  const handleCloseSession = async () => {
    if (!session?.session?._id) return;
    if (!confirm('Close this scanner session? All devices will lose access.')) return;
    try {
      setClosing(true);
      await scannerService.closeSession(session.session._id);
      const fresh = await scannerService.getSessionDetails(session.session._id);
      setSession(fresh);
      showNotification('success', 'Session Closed', 'Scanner session has been closed');
    } catch (err: any) {
      showNotification('error', 'Failed', err.message);
    } finally { setClosing(false); }
  };

  const handleAddDevice = async () => {
    if (!session?.session?._id) return;
    try {
      const res = await scannerService.generateOTP(session.session._id);
      setOtp(res.otp);
      setOtpExpiry(new Date(res.expiresAt));
      setShowOtpModal(true);
    } catch (err: any) {
      showNotification('error', 'Failed to generate OTP', err.message);
    }
  };

  const handleDisableDevice = async (deviceId: string) => {
    if (!session?.session?._id) return;
    try {
      await scannerService.disableDevice(deviceId, session.session._id);
      const fresh = await scannerService.getSessionDetails(session.session._id);
      setSession(fresh);
      showNotification('success', 'Device Disabled', 'Device access has been revoked');
    } catch (err: any) {
      showNotification('error', 'Failed', err.message);
    }
  };

  const handleEnableDevice = async (deviceId: string) => {
    if (!session?.session?._id) return;
    try {
      await scannerService.enableDevice(deviceId, session.session._id);
      const fresh = await scannerService.getSessionDetails(session.session._id);
      setSession(fresh);
      showNotification('success', 'Device Enabled', 'Device usage restored');
    } catch (err: any) {
      showNotification('error', 'Failed', err.message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(scannerUrl);
    showNotification('success', 'Copied!', 'Scanner link copied to clipboard');
  };

  const isSessionActive = session?.session?.sessionStatus === 'active';
  const devices: any[] = session?.devices ?? [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1280px] pb-[30vh] duration-300">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-black p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[36px] font-bold leading-none mb-1">{checkedIn}</div>
          <div className="text-[13px] uppercase tracking-wider text-gray-500 font-semibold">Checked In</div>
        </div>
        <div className="bg-white border border-wix-border-light p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[36px] font-bold leading-none mb-1">{remaining}</div>
          <div className="text-[13px] uppercase tracking-wider text-gray-500 font-semibold">Remaining</div>
        </div>
        <div className="bg-gray-50 border border-wix-border-light p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[36px] font-bold leading-none mb-1">{total}</div>
          <div className="text-[13px] uppercase tracking-wider text-gray-500 font-semibold">Total Tickets</div>
        </div>
      </div>

      {/* Scanner Session */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[20px] font-bold text-black">Scanner Session Management</h2>

        {sessionLoading ? (
          <div className="border border-wix-border-light bg-white p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-wix-purple" />
          </div>
        ) : !isSessionActive ? (
          <div className="border border-black bg-white p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center border border-gray-300 mb-4">
              <Scan className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-[18px] font-medium text-black mb-2">Scanner Session is Inactive</h3>
            <p className="text-[14px] text-wix-text-muted max-w-[480px] mb-8">Activate a session to generate a shareable scanner link and authorize devices to scan tickets for this event.</p>
            <button
              onClick={handleCreateSession}
              disabled={creating || !eventId}
              className="bg-black text-white px-8 py-4 text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {creating ? 'Activating...' : 'Activate Session'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Active Session Link */}
            <div className="border border-black bg-white p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-green-600 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active Session
                  </div>
                  <h3 className="text-[18px] font-medium text-black">Scanner Link</h3>
                  <p className="text-[13px] text-gray-500 mt-1">Share this link with your staff to open the scanner web-app.</p>
                </div>
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="border border-black px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-600 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-2"
                >
                  {closing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Close Session
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input readOnly value={scannerUrl} className="flex-1 border border-black bg-gray-50 p-3 text-[14px] font-mono text-gray-600 outline-none select-all" />
                <button onClick={copyLink} className="bg-black text-white px-6 py-3 text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>

            {/* Connected Devices */}
            <div className="border border-black bg-white">
              <div className="p-6 border-b border-black flex justify-between items-center bg-gray-50">
                <h3 className="text-[16px] font-bold text-black">Connected Devices ({devices.length}/{session?.session?.maxDevices ?? 5})</h3>
                <button onClick={handleAddDevice} className="border border-black bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Device
                </button>
              </div>
              <div className="flex flex-col">
                {devices.length === 0 ? (
                  <div className="p-8 text-center text-[14px] text-gray-500">No devices connected yet. Click "Add Device" to generate an OTP.</div>
                ) : devices.map((device: any, idx: number) => (
                  <div key={device._id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 ${idx !== devices.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <div className="text-[14px] font-bold text-black">{device.deviceName}</div>
                        <div className="text-[12px] text-gray-500">{device.isOnline ? 'Online' : 'Offline'} · {device.status === 'disabled' ? 'Disabled' : 'Active'}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <div className="text-right">
                        <div className="text-[18px] font-mono font-medium text-black">{device.totalScans}</div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Scans</div>
                      </div>
                      <div className="flex gap-2">
                        {device.status === 'disabled' ? (
                          <button onClick={() => handleEnableDevice(device._id)} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-black text-black bg-white hover:bg-black hover:text-white transition-colors">
                            Enable
                          </button>
                        ) : (
                          <button onClick={() => handleDisableDevice(device._id)} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
                            Disable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-black p-8 max-w-[400px] w-full relative">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"><X className="w-5 h-5" /></button>
            <h3 className="text-[20px] font-bold text-black text-center mb-2">Authorize Device</h3>
            <p className="text-[14px] text-gray-500 text-center mb-8 px-4">Enter this OTP on the scanner device to securely connect it to this session.</p>
            <div className="border border-black bg-gray-50 p-6 flex justify-center mb-4">
              <div className="text-[48px] font-mono font-bold tracking-[0.2em] text-black leading-none">
                {otp ? `${otp.slice(0, 3)} ${otp.slice(3)}` : '— —'}
              </div>
            </div>
            <div className="text-[12px] text-center text-gray-400 font-medium">
              OTP valid for {otpCountdown || '—'}
            </div>
          </div>
        </div>
      )}

      {/* Manual Check-in */}
      <div className="bg-white border border-wix-border-light">
        <div className="p-6 border-b border-wix-border-light flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-[16px] font-bold text-black">Manual Check-in</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">Look up a ticket by number and check in the attendee manually.</p>
          </div>
          {verificationResult && (
            <button
              onClick={() => { setVerificationResult(null); setManualQuery(''); }}
              className="text-[12px] font-bold text-gray-500 border border-gray-300 px-3 py-1.5 hover:border-black hover:text-black transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        <div className="p-6">
          {!session?.session?._id && (
            <div className="mb-4 p-3 border border-amber-200 bg-amber-50 text-amber-700 text-[13px] font-medium">
              ⚠ No active scanner session. Activate a session above to enable check-in.
            </div>
          )}

          {!verificationResult ? (
            <div className="relative" ref={manualDropdownRef}>
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={manualQuery}
                onChange={e => setManualQuery(e.target.value.toUpperCase())}
                placeholder="Type ticket number (e.g. A1B2)..."
                disabled={!session?.session?._id}
                className="w-full border border-wix-border-light pl-9 pr-10 py-2 text-[13px] outline-none focus:border-black transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {manualLoading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-gray-400" />}

              {showManualDropdown && manualResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black z-50 max-h-[280px] overflow-y-auto">
                  {manualResults.map((t: any) => (
                    <button
                      key={t.ticketId}
                      onClick={async () => {
                        setShowManualDropdown(false);
                        setManualQuery('');
                        if (!session?.session?._id) return;
                        try {
                          const res = await scannerService.lookupTicket(t.ticketNumber, session.session._id);
                          if (res.found) setVerificationResult(res.ticket);
                          else showNotification('error', 'Not Found', res.message || 'Ticket not found');
                        } catch (err: any) { showNotification('error', 'Lookup Failed', err.message); }
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b last:border-0 text-left transition-colors"
                    >
                      <div>
                        <div className="font-mono text-[13px] font-bold text-black">{t.ticketNumber}</div>
                        <div className="text-[12px] text-gray-500 mt-0.5">{t.holderName} · {t.ticketType}</div>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                        t.checkInStatus === 'checked_in' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>{t.checkInStatus === 'checked_in' ? 'Checked In' : 'Pending'}</span>
                    </button>
                  ))}
                </div>
              )}

              {showManualDropdown && manualResults.length === 0 && manualQuery.length >= 2 && !manualLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-wix-border-light p-4 z-50 text-center text-[13px] text-gray-500">
                  No tickets found matching &quot;{manualQuery}&quot;
                </div>
              )}
            </div>
          ) : (
            // Verification Result Card
            <div className="border border-wix-border-light">
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[15px] font-bold text-black">{verificationResult.ticketNumber}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                      verificationResult.isCheckedIn ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}>{verificationResult.isCheckedIn ? 'Already Checked In' : 'Not Checked In'}</span>
                  </div>
                  <div className="text-[13px] text-gray-700">
                    {verificationResult.holderName && <span className="font-semibold">{verificationResult.holderName}</span>}
                    {verificationResult.holderName && <span className="text-gray-400 mx-1.5">·</span>}
                    <span>{verificationResult.ticketType}</span>
                  </div>
                  {verificationResult.isCheckedIn && verificationResult.checkedInAt && (
                    <div className="text-[12px] text-gray-400">
                      Checked in at {new Date(verificationResult.checkedInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {!verificationResult.isCheckedIn && (
                  <button
                    onClick={async () => {
                      if (!session?.session?._id) return;
                      try {
                        setCheckingIn(true);
                        await scannerService.manualCheckIn(verificationResult.ticketNumber, session.session._id);
                        showNotification('success', 'Checked In!', `${verificationResult.ticketNumber} has been checked in`);
                        // Refresh result
                        const res = await scannerService.lookupTicket(verificationResult.ticketNumber, session.session._id);
                        if (res.found) setVerificationResult(res.ticket);
                      } catch (err: any) {
                        showNotification('error', 'Check-in Failed', err.message);
                      } finally { setCheckingIn(false); }
                    }}
                    disabled={checkingIn}
                    className="bg-black text-white px-6 py-3 text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    {checkingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                    {checkingIn ? 'Checking in...' : 'Confirm Check-in'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


/* ─── Advanced Ticket Side Panel ─── */
const TicketSidePanel = ({
  isOpen, onClose, editingTicket, editingIndex, data, onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  editingTicket: any;
  editingIndex: number | null;
  data: HostEventDetailsResponse | null;
  onUpdate: (d: HostEventDetailsResponse) => void;
}) => {
  const { showNotification } = useNotification();
  const colorPresets = ['#4a2bed', '#161616', '#116d42', '#c5221f', '#f27d26', '#ffd33d'];
  const [form, setForm] = useState({ name: '', price: '', quantity: '', description: '', wristbandColor: '#4a2bed', isVisible: true, limitPerOrder: false });
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (editingTicket) {
      setForm({ name: editingTicket.name || '', price: String(editingTicket.price ?? ''), quantity: String(editingTicket.quantity ?? ''), description: editingTicket.description || '', wristbandColor: editingTicket.wristbandColor || '#4a2bed', isVisible: editingTicket.isVisible ?? true, limitPerOrder: editingTicket.limitPerOrder ?? false });
      setBenefits(editingTicket.benefits || []);
    } else {
      setForm({ name: '', price: '', quantity: '', description: '', wristbandColor: '#4a2bed', isVisible: true, limitPerOrder: false });
      setBenefits([]);
    }
    setNewBenefit('');
  }, [isOpen, editingTicket]);

  const addBenefit = () => { if (newBenefit.trim()) { setBenefits(p => [...p, newBenefit.trim()]); setNewBenefit(''); } };

  const handleSave = () => {
    if (!form.name.trim()) { showNotification('error', 'Required', 'Ticket name is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { showNotification('error', 'Required', 'Valid price is required'); return; }
    if (!data?.event) return;
    const ticketData = { name: form.name.trim(), price: Number(form.price), quantity: Number(form.quantity) || 0, wristbandColor: form.wristbandColor, benefits, isVisible: form.isVisible, limitPerOrder: form.limitPerOrder };
    if (editingIndex !== null) {
      const existing = data.event.tickets[editingIndex];
      const committed = (existing.sold || 0) + (existing.reserved || 0);
      if ((['published', 'live'].includes(data.event.status)) && committed > 0 && ticketData.price < existing.price.amount) {
        if (!confirm(`Price reduction will trigger refunds to ${committed} buyers (BDT ${(existing.price.amount - ticketData.price) * committed}). Continue?`)) return;
      }
      const updated = data.event.tickets.map((t, i) => i === editingIndex ? { ...t, name: ticketData.name, price: { amount: ticketData.price, currency: 'BDT' }, quantity: ticketData.quantity, wristbandColor: ticketData.wristbandColor, benefits: ticketData.benefits, isVisible: ticketData.isVisible, isActive: true } : t);
      onUpdate({ ...data, event: { ...data.event, tickets: updated } });
      showNotification('success', 'Updated', 'Ticket updated');
    } else {
      const totalAllocated = data.event.tickets.reduce((s, t) => s + t.quantity, 0);
      const capacity = data.event.venue?.capacity || 0;
      if (capacity > 0 && totalAllocated + ticketData.quantity > capacity) { showNotification('error', 'Capacity Exceeded', `Would exceed venue capacity (${capacity})`); return; }
      const newTicket = { name: ticketData.name, tier: 'general', price: { amount: ticketData.price, currency: 'BDT' }, quantity: ticketData.quantity, limits: { minPerOrder: 1, maxPerOrder: ticketData.limitPerOrder ? 5 : 10 }, sold: 0, reserved: 0, wristbandColor: ticketData.wristbandColor, benefits: ticketData.benefits, isVisible: ticketData.isVisible, isActive: true };
      onUpdate({ ...data, event: { ...data.event, tickets: [...data.event.tickets, newTicket] } });
      showNotification('success', 'Created', 'New ticket added');
    }
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[6000] flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-[450px] max-w-full h-full bg-white border-l border-black flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-5 border-b border-black flex justify-between items-center bg-gray-50">
          <h2 className="text-[18px] font-medium">{editingIndex !== null ? 'Edit Ticket' : 'Create New Ticket'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] uppercase tracking-wider text-gray-600 font-semibold">Ticket Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} type="text" placeholder="e.g. Early Bird" className="w-full border border-wix-border-light p-3 text-[14px] focus:border-black outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-wider text-gray-600 font-semibold">Price (BDT) <span className="text-red-500">*</span></label>
              <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} type="number" placeholder="0" min="0" className="w-full border border-wix-border-light p-3 text-[14px] focus:border-black outline-none transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-wider text-gray-600 font-semibold">Capacity</label>
              <input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} type="number" placeholder="Unlimited" min="0" className="w-full border border-wix-border-light p-3 text-[14px] focus:border-black outline-none transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[12px] uppercase tracking-wider text-gray-600 font-semibold">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Tell attendees what's included..." className="w-full border border-wix-border-light p-3 text-[14px] focus:border-black outline-none transition-colors resize-none" />
          </div>
          <div className="border-t border-wix-border-light pt-6">
            <h3 className="text-[14px] font-bold uppercase tracking-widest text-black mb-4">Ticket Configuration</h3>
            <div className="mb-6">
              <label className="text-[12px] font-bold uppercase tracking-widest text-wix-text-muted mb-2 block">Wristband / Badge Color <span className="font-normal normal-case text-gray-400 ml-1">(Internal Metadata)</span></label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPresets.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, wristbandColor: c }))} className={`w-8 h-8 border transition-all ${form.wristbandColor === c ? 'border-black ring-2 ring-black ring-offset-2' : 'border-gray-300 hover:border-black'}`} style={{ backgroundColor: c }} title={c} />
                ))}
                <div className="w-px h-8 bg-gray-300 mx-1" />
                <div className="relative group">
                  <input type="color" value={form.wristbandColor} onChange={e => setForm(p => ({ ...p, wristbandColor: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-8 h-8 border border-gray-300 group-hover:border-black flex items-center justify-center transition-colors" style={{ backgroundColor: form.wristbandColor }}>
                    <span className="text-white mix-blend-difference opacity-50"><Plus className="w-4 h-4" /></span>
                  </div>
                </div>
                <span className="ml-2 text-[13px] font-mono text-gray-500 uppercase">{form.wristbandColor}</span>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-widest text-wix-text-muted mb-2 block">Ticket Benefits</label>
              <div className="flex gap-2 mb-3">
                <input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBenefit()} type="text" placeholder="e.g. Backstage Access" className="flex-1 border border-black p-2 text-[13px] focus:outline-none" />
                <button onClick={addBenefit} className="bg-black text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800">Add</button>
              </div>
              <ul className="flex flex-col gap-2">
                {benefits.length === 0 && <li className="text-[13px] text-gray-500 italic">No benefits added.</li>}
                {benefits.map((b, i) => (
                  <li key={i} className="flex justify-between items-center p-3 border border-gray-200 bg-gray-50">
                    <span className="text-[13px] text-black">{b}</span>
                    <button onClick={() => setBenefits(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-wix-border-light pt-6 flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-gray-800">Advanced Options</h3>
            <div className="border border-wix-border-light p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[14px] text-wix-text-dark">Ticket Visibility</div>
                <div className="text-[12px] text-wix-text-muted mt-1">Show on public event page</div>
              </div>
              <SharpToggle checked={form.isVisible} onChange={(v: boolean) => setForm(p => ({ ...p, isVisible: v }))} />
            </div>
            <div className="border border-wix-border-light p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[14px] text-wix-text-dark">Limit Per Order</div>
                <div className="text-[12px] text-wix-text-muted mt-1">Restrict to max 5 tickets per user</div>
              </div>
              <SharpToggle checked={form.limitPerOrder} onChange={(v: boolean) => setForm(p => ({ ...p, limitPerOrder: v }))} />
            </div>
          </div>
        </div>
        <div className="border-t border-black p-6 shrink-0 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 border border-black px-4 py-3 text-[13px] font-bold tracking-widest uppercase hover:bg-gray-100 transition-colors text-black">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-black text-white px-4 py-3 text-[13px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors border border-black">
            {editingIndex !== null ? 'Update Ticket' : 'Save Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Tickets Tab ─── */
const TicketsTab = ({ data, onUpdate, onRefetch }: { data: HostEventDetailsResponse | null; onUpdate: (d: HostEventDetailsResponse) => void; onRefetch: () => Promise<void> }) => {
  const { showNotification } = useNotification();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [initialTickets, setInitialTickets] = useState<any[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const tickets = data?.event?.tickets ?? [];

  useEffect(() => {
    if (data?.event?.tickets !== undefined && initialTickets === null) setInitialTickets(JSON.parse(JSON.stringify(data.event.tickets)));
  }, [data?.event?.tickets, initialTickets]);

  useEffect(() => {
    if (!data?.event?.tickets || initialTickets === null) { setHasChanges(false); return; }
    setHasChanges(JSON.stringify(data.event.tickets) !== JSON.stringify(initialTickets));
  }, [data?.event?.tickets, initialTickets]);

  const handleSave = async () => {
    if (!data?.event || !hasChanges) return;
    try {
      setSaving(true);
      const result = await eventsService.updateEventByStatus(data.event._id, data.event.status, { tickets: data.event.tickets });
      if (result.warnings?.length) result.warnings.forEach((w: string) => showNotification('info', 'Notice', w));
      if (result.refundsRequired?.length) { const total = result.refundsRequired.reduce((s: number, r: any) => s + (r.refundAmount || 0), 0); showNotification('info', 'Refunds', `BDT ${total} in refunds deducted from next payout.`); }
      showNotification('success', 'Saved', result.message || 'Tickets updated successfully');
      setInitialTickets(null); await onRefetch(); setHasChanges(false);
    } catch (err: any) { showNotification('error', 'Save Failed', err?.response?.data?.message || err?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (idx: number) => {
    if (!data?.event) return;
    const t = data.event.tickets[idx];
    if (['published', 'live'].includes(data.event.status) && (t.sold || 0) > 0) { showNotification('error', 'Cannot Delete', `This ticket has ${t.sold} sales.`); return; }
    onUpdate({ ...data, event: { ...data.event, tickets: data.event.tickets.filter((_, i) => i !== idx) } });
    showNotification('success', 'Deleted', 'Ticket removed');
  };

  const totalAllocated = tickets.reduce((s, t) => s + t.quantity, 0);
  const capacity = data?.event?.venue?.capacity || 0;
  const pctCapacity = capacity > 0 ? Math.min((totalAllocated / capacity) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1280px] duration-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-wix-text-dark">Tickets &amp; Pricing</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage ticket tiers, capacity, and pricing rules.</p>
        </div>
        <button onClick={() => { setEditingIndex(null); setPanelOpen(true); }} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[13px] sm:text-[14px] font-medium hover:bg-gray-800 transition-colors border border-black self-start shrink-0">
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </div>
      {capacity > 0 && (
        <div className="bg-white border border-wix-border-light p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold text-wix-text-dark">Venue Capacity</span>
            <span className="text-[13px] font-mono">{totalAllocated} / {capacity} ({Math.round(pctCapacity)}%)</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 border border-gray-200">
            <div className={`h-full transition-all duration-500 ${pctCapacity >= 100 ? 'bg-red-500' : 'bg-black'}`} style={{ width: `${pctCapacity}%` }} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {tickets.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-wix-text-muted border border-dashed border-wix-border-light">No tickets created yet</div>
        ) : tickets.map((t, i) => {
          const pct = t.quantity > 0 ? Math.round((t.sold / t.quantity) * 100) : 0;
          const isSoldOut = t.sold >= t.quantity && t.quantity > 0;
          return (
            <div key={i} className="bg-white border border-wix-border-light p-4 sm:p-6 flex flex-col gap-4 hover:border-black transition-colors">
              {/* Top row: name + badge + price */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-wix-text-dark truncate">{t.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border shrink-0 ${isSoldOut ? 'bg-gray-100 text-gray-500 border-gray-300' : t.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{isSoldOut ? 'Sold Out' : t.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="text-[13px] text-gray-500">{t.sold} / {t.quantity} sold</div>
                  {(t.benefits?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {t.benefits!.slice(0, 3).map((b: string, bi: number) => <span key={bi} className="text-[11px] text-gray-500 border border-gray-200 px-1.5 py-0.5">{b}</span>)}
                      {t.benefits!.length > 3 && <span className="text-[11px] text-gray-400">+{t.benefits!.length - 3} more</span>}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[16px] sm:text-[18px] font-mono font-medium text-black">{t.price.amount.toLocaleString()} <span className="text-[12px] font-normal">{t.price.currency}</span></div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 border border-gray-200">
                <div className={`h-full ${isSoldOut ? 'bg-gray-400' : 'bg-black'}`} style={{ width: `${pct}%` }} />
              </div>
              {/* Bottom row: always-visible action buttons */}
              <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
                <button onClick={() => { setEditingIndex(i); setPanelOpen(true); }} className="text-[13px] text-black font-medium border-b border-black pb-0.5 hover:text-wix-purple hover:border-wix-purple transition-colors">Edit</button>
                <button onClick={() => handleDelete(i)} className="text-[13px] text-red-500 font-medium border-b border-red-400 pb-0.5 hover:text-red-700 hover:border-red-700 transition-colors">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-wix-border-light p-4 flex justify-between items-center">
        <div className="text-[12px]">
          {hasChanges ? <span className="flex items-center gap-2 text-amber-600"><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />Unsaved changes</span>
           : <span className="flex items-center gap-2 text-green-600"><div className="w-2 h-2 bg-green-500 rounded-full" />All changes saved</span>}
        </div>
        <button onClick={handleSave} disabled={!hasChanges || saving}
          className="bg-black text-white px-6 py-2.5 text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-black"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <TicketSidePanel isOpen={panelOpen} onClose={() => { setPanelOpen(false); setEditingIndex(null); }}
        editingIndex={editingIndex}
        editingTicket={editingIndex !== null && tickets[editingIndex] ? { name: tickets[editingIndex].name, price: tickets[editingIndex].price.amount, quantity: tickets[editingIndex].quantity, wristbandColor: tickets[editingIndex].wristbandColor, benefits: tickets[editingIndex].benefits, isVisible: tickets[editingIndex].isVisible } : null}
        data={data} onUpdate={onUpdate}
      />
    </div>
  );
};


const GalleryTab = ({ data, onUpdate }: { data: HostEventDetailsResponse | null; onUpdate: (d: HostEventDetailsResponse) => void }) => {
  const { showNotification } = useNotification();
  const [gallery, setGallery] = useState<any[]>(data?.event?.media?.gallery ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync gallery when data changes (e.g. on first load)
  useEffect(() => {
    setGallery(data?.event?.media?.gallery ?? []);
  }, [data?.event?._id]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { mediaService } = await import('@/lib/api/media');
      const ImageKit = (await import('imagekit-javascript')).default;
      const auth = await mediaService.getImageKitAuth();
      const imagekit = new ImageKit({ publicKey: auth.publicKey, urlEndpoint: auth.urlEndpoint });
      const uploadResponse: any = await new Promise((resolve, reject) => {
        imagekit.upload({
          file,
          fileName: `event_gallery_${Date.now()}_${file.name}`,
          folder: '/zenvy/event_gallery',
          useUniqueFileName: true,
          tags: ['event_gallery'],
          signature: auth.signature,
          expire: auth.expire,
          token: auth.token,
        }, (err: any, result: any) => { if (err) reject(new Error(err.message)); else resolve(result); });
      });
      await mediaService.trackImageKitUpload({
        fileId: uploadResponse.fileId,
        url: uploadResponse.url,
        filename: uploadResponse.name,
        type: 'event_gallery',
        status: 'permanent',
      });
      setGallery(prev => [...prev, { url: uploadResponse.url, caption: '', thumbnailUrl: uploadResponse.url, order: prev.length + 1 }]);
      showNotification('success', 'Uploaded', 'Image added to gallery. Click Save to persist.');
    } catch (err: any) {
      showNotification('error', 'Upload Failed', err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!data?.event) return;
    setSaving(true);
    try {
      const result = await eventsService.updateEventByStatus(
        data.event._id,
        data.event.status,
        { media: { ...data.event.media, gallery } }
      );
      showNotification('success', 'Gallery Saved', result.message || 'Gallery updated successfully.');
      onUpdate({ ...data, event: { ...data.event, media: { ...data.event.media, gallery } } });
    } catch (err: any) {
      showNotification('error', 'Save Failed', err?.response?.data?.message || err?.message || 'Failed to save gallery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1280px] duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-medium text-wix-text-dark">Event Gallery</h2>
          <p className="text-[13px] text-gray-500 mt-1">Upload and manage promotional and recap photos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelected} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 sm:px-5 sm:py-2.5 text-[13px] sm:text-[14px] font-medium hover:bg-gray-50 transition-colors border border-wix-border-light disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Media'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[13px] sm:text-[14px] font-medium hover:bg-gray-800 transition-colors border border-black disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Gallery'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Upload tile */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-wix-border-light bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black transition-colors cursor-pointer group"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
          ) : (
            <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[13px] font-medium">{uploading ? 'Uploading...' : 'Click to Upload'}</span>
        </div>
        {/* Gallery images */}
        {gallery.map((img, i) => (
          <div key={i} className="aspect-square relative group border border-wix-border-light overflow-hidden">
            <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => handleRemove(i)}
                className="p-3 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {gallery.length === 0 && !uploading && (
        <p className="text-[13px] text-gray-400 text-center py-8">No gallery images yet. Upload photos to get started.</p>
      )}
    </div>
  );
};


const MarketingTab = () => {
  const tools = [
    { icon: Mail, title: 'Email Campaigns', desc: 'Send announcements and reminders to your attendees list.', btn: 'Create Email' },
    { icon: Tag, title: 'Discount Codes', desc: 'Create promo codes to boost sales or reward loyal customers.', btn: 'New Promo Code' },
    { icon: LinkIcon, title: 'Tracking Links', desc: 'Generate unique links to see which channels drive the most sales.', btn: 'Create Link' },
  ];
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-[20px] font-medium text-wix-text-dark">Marketing Tools</h2>
        <p className="text-[13px] text-gray-500 mt-1">Boost attendance and track campaign performance.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool, i) => (
          <div key={i} className="bg-white border border-wix-border-light p-6 flex flex-col justify-between hover:border-black transition-colors">
            <div>
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <tool.icon className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-[16px] font-semibold text-wix-text-dark mb-2">{tool.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-6">{tool.desc}</p>
            </div>
            <button className="w-full border border-black bg-white text-black py-2.5 text-[13px] font-semibold hover:bg-gray-50 transition-colors">{tool.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const RestrictedTimePicker = ({ originalTime, label, value, onChange }: { originalTime: string; label: string; value?: string; onChange?: (v: string) => void }) => {
  const options = useMemo(() => {
    const [h] = originalTime.split(':').map(Number);
    const opts: { value: string; label: string }[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      for (const mins of ['00', '30']) {
        const hour = h + offset;
        if (hour < 0 || hour > 23) continue;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const dh = hour % 12 || 12;
        opts.push({ value: `${String(hour).padStart(2, '0')}:${mins}`, label: `${dh}:${mins} ${ampm}` });
      }
    }
    return opts;
  }, [originalTime]);
  const [val, setVal] = useState(originalTime);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] uppercase tracking-wider text-gray-500 font-semibold flex justify-between">
        {label}<span className="text-gray-400 text-[10px] lowercase">(max ±2h)</span>
      </label>
      <div className="relative">
        <Clock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
        <select value={value || val} onChange={e => { setVal(e.target.value); onChange?.(e.target.value); }} className="w-full border border-gray-200 pl-9 pr-4 py-2 text-[14px] outline-none focus:border-black transition-colors appearance-none bg-white cursor-pointer">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
};

/* ─── Consolidated Edit Modal ─── */
const EditDetailsModal = ({ isOpen, onClose, data, onRefetch }: { isOpen: boolean; onClose: () => void; data: HostEventDetailsResponse | null; onRefetch: () => Promise<void> }) => {
  const ev = data?.event;
  const { showNotification } = useNotification();
  const [tagline, setTagline] = useState(ev?.tagline || '');
  const [description, setDescription] = useState(ev?.description || '');
  const [coverUrl, setCoverUrl] = useState(ev?.media?.coverImage?.url || '');
  const [gallery, setGallery] = useState<any[]>(ev?.media?.gallery ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'cover' | 'gallery' | null>(null);
  
  // ─── Schedule state ───
  const isApproved = ev?.status === 'approved';
  const scheduleModified = ev?.schedule?.scheduleModified ?? false;
  const canEditSchedule = isApproved && !scheduleModified;
  const [startDate, setStartDate] = useState(ev?.schedule?.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(ev?.schedule?.endDate?.slice(0, 10) || '');
  const originalStartTime = ev?.schedule?.startDate ? new Date(ev.schedule.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '09:00';
  const originalEndTime = ev?.schedule?.endDate ? new Date(ev.schedule.endDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '18:00';
  const [startTime, setStartTime] = useState(originalStartTime);
  const [endTime, setEndTime] = useState(originalEndTime);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ev) {
      setTagline(ev.tagline || '');
      setDescription(ev.description || '');
      setCoverUrl(ev.media?.coverImage?.url || '');
      setGallery(ev.media?.gallery ?? []);
      setStartDate(ev.schedule?.startDate?.slice(0, 10) || '');
      setEndDate(ev.schedule?.endDate?.slice(0, 10) || '');
    }
  }, [ev?._id, isOpen]);

  const handleUpload = async (file: File, type: 'cover' | 'gallery') => {
    setUploading(type);
    try {
      const { mediaService } = await import('@/lib/api/media');
      const ImageKit = (await import('imagekit-javascript')).default;
      const auth = await mediaService.getImageKitAuth();
      const imagekit = new ImageKit({ publicKey: auth.publicKey, urlEndpoint: auth.urlEndpoint });
      
      const res: any = await new Promise((resolve, reject) => {
        imagekit.upload({
          file,
          fileName: `event_${type}_${Date.now()}_${file.name}`,
          folder: type === 'cover' ? '/zenvy/event_covers' : '/zenvy/event_gallery',
          useUniqueFileName: true,
          signature: auth.signature,
          expire: auth.expire,
          token: auth.token,
        }, (err, result) => err ? reject(err) : resolve(result));
      });

      if (type === 'cover') {
        setCoverUrl(res.url);
      } else {
        setGallery(prev => [...prev, { url: res.url, caption: '', order: prev.length + 1 }]);
      }
      showNotification('success', 'Uploaded', `${type === 'cover' ? 'Cover image' : 'Photo'} updated.`);
    } catch (err: any) {
      showNotification('error', 'Upload Failed', err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!ev?._id) return;

    if (canEditSchedule) {
      const origStart = new Date(ev.schedule!.startDate);
      const origEnd = new Date(ev.schedule!.endDate);
      const newStart = new Date(`${startDate}T${startTime}`);
      const newEnd = new Date(`${endDate}T${endTime}`);
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (Math.abs(newStart.getTime() - origStart.getTime()) > TWO_HOURS || Math.abs(newEnd.getTime() - origEnd.getTime()) > TWO_HOURS) {
        showNotification('error', 'Invalid Change', 'Schedule can only be modified by ±2 hours from the original time.');
        return;
      }
      if (!window.confirm('⚠️ Schedule change can only be done ONCE. All attendees will be notified. Confirm?')) return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        tagline,
        description,
        media: {
          ...ev.media,
          coverImage: { url: coverUrl },
          gallery
        }
      };

      if (canEditSchedule) {
        updateData.schedule = { 
          ...ev.schedule, 
          startDate: new Date(`${startDate}T${startTime}`).toISOString(), 
          endDate: new Date(`${endDate}T${endTime}`).toISOString(), 
          scheduleModified: true 
        };
      }

      await eventsService.updateEventByStatus(ev._id, ev.status, updateData);
      showNotification('success', 'Changes Saved', 'Event details have been perfectly synchronized.');
      await onRefetch();
      onClose();
    } catch (err: any) {
      showNotification('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 w-full max-w-[900px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-[20px] font-black uppercase tracking-[0.2em] text-ink">Edit Event Spotlight</h2>
            <p className="text-[12px] text-wix-text-muted mt-1 uppercase tracking-widest font-bold">Synchronize covers, descriptions & narratives</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink hover:text-white transition-all"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-10">
          {/* Cover Management */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-wix-text-muted">Part 1: Visual Identity</h3>
            <div className="relative aspect-[21/9] bg-gray-50 border-2 border-dashed border-ink/20 group overflow-hidden">
               {coverUrl ? (
                 <>
                   <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
                   <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-4">
                      <button onClick={() => coverInputRef.current?.click()} className="bg-white text-ink px-6 py-2.5 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-colors">
                        <Camera size={14} /> Change
                      </button>
                      <button onClick={() => setCoverUrl('')} className="bg-red-500 text-white px-6 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Remove</button>
                   </div>
                 </>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-ink/20 group-hover:text-ink transition-colors cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                    <Camera size={48} />
                    <span className="text-[12px] font-black uppercase tracking-[0.2em]">Upload Cover (21:9 Recommended)</span>
                 </div>
               )}
               {uploading === 'cover' && <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /><span className="text-[12px] font-black uppercase">Propagating...</span></div>}
               <input ref={coverInputRef} type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Tagline */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-wix-text-muted">Tagline</label>
              <input 
                type="text" 
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="The hook that catches attention..." 
                className="w-full border border-gray-200 p-4 text-[15px] font-bold outline-none focus:bg-gray-50 transition-colors"
              />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-wix-text-muted">Description</label>
              <textarea 
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="The full story of the event..." 
                className="w-full border border-gray-200 p-4 text-[14px] outline-none focus:bg-gray-50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Schedule (Conditional) */}
          {isApproved && (
            <div className="flex flex-col gap-4 border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-wix-text-muted">Part 2: Event Schedule</h3>
                {scheduleModified && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1">Already Modified</span>}
              </div>
              <div className={`p-6 bg-gray-50 border border-gray-200 ${!canEditSchedule ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-200 p-2.5 text-[14px] focus:border-black outline-none transition-colors font-mono" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-wix-text-muted">End Date</label>
                    <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-200 p-2.5 text-[14px] focus:border-black outline-none transition-colors font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <RestrictedTimePicker label="Start Time" originalTime={originalStartTime} value={startTime} onChange={setStartTime} />
                  <RestrictedTimePicker label="End Time" originalTime={originalEndTime} value={endTime} onChange={setEndTime} />
                </div>
              </div>
            </div>
          )}

          {/* Gallery Snapshot */}
          {/* <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-wix-text-muted">{isApproved ? 'Part 3' : 'Part 2'}: Gallery Archive</h3>
               <button onClick={() => galleryInputRef.current?.click()} className="text-[11px] font-black uppercase tracking-widest text-wix-purple hover:underline flex items-center gap-1">
                 <Plus size={14} /> Add Media
               </button>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {gallery.map((img, i) => (
                  <div key={i} className="relative w-32 h-32 shrink-0 border border-gray-200 group overflow-hidden">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => setGallery(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                ))}
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-32 h-32 bg-gray-50 border-2 border-dashed border-ink/20 flex flex-col items-center justify-center text-ink/20 hover:text-ink hover:border-ink transition-all cursor-pointer"
                >
                  {uploading === 'gallery' ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                </div>
                <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" onChange={e => {
                  if (e.target.files?.[0]) handleUpload(e.target.files[0], 'gallery');
                  e.target.value = '';
                }} />
             </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4 justify-end">
           <button onClick={onClose} className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] border border-gray-200 hover:bg-white transition-all">Cancel</button>
           <button 
             onClick={handleSave}
             disabled={saving}
             className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] bg-ink text-white border border-gray-200 hover:bg-black transition-all flex items-center gap-2"
           >
             {saving && <Loader2 size={14} className="animate-spin" />}
             Commit Changes
           </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Tickets Tab ─── */


/* ─── Mobile Tab Strip ─── */
const MobileTabStrip = ({ activeKey, onSelect, tabs }: { activeKey: string; onSelect: (k: string) => void; tabs: { key: string; icon: any; label?: string }[] }) => {
  return (
    <div className="md:hidden flex overflow-x-auto bg-white border-b border-wix-border-light sticky top-0 z-20 px-4 py-3 gap-2">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onSelect(t.key)} className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium whitespace-nowrap border transition-colors ${activeKey === t.key ? 'bg-black text-white border-black' : 'bg-white text-wix-text-muted border-wix-border-light hover:border-black'}`}>
          <t.icon className="w-3.5 h-3.5" />{t.label || t.key}
        </button>
      ))}
    </div>
  );
};

/* ─── Main ─── */
export default function ManageEvent() {
  const [data, setData] = useState<HostEventDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState('Overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const router = useRouter();
  const { id } = useParams();
  const { showNotification } = useNotification();

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const d = await hostAnalyticsService.getEventAnalytics(id as string);
      setData(d);
      if (d.event.status === 'draft') {
        showNotification('info', 'Event Not Submitted', 'Event management is only available after submitting for approval.');
        router.push('/host/events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishEvent = async () => {
    if (!id) return;
    try {
      setPublishing(true);
      await hostEventsService.publishEvent(id as string);
      showNotification('success', 'Event Published', 'Your event is now live and visible to the public.');
      await fetchEventData();
    } catch (err: any) {
      showNotification('error', 'Publish Failed', err.message || 'Failed to publish event. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => { if (id) fetchEventData(); }, [id]);

  const ev = data?.event;
  const statusBadge = ev?.status ? (
    <span className={`text-[10px] font-black px-2.5 py-1 border uppercase tracking-widest ${
      ev.status === 'live' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
      ev.status === 'published' ? 'border-wix-purple text-wix-purple bg-wix-purple/5' :
      ev.status === 'pending_approval' ? 'border-amber-400 text-amber-600 bg-amber-50' :
      'border-gray-300 text-gray-500 bg-gray-50'
    }`}>{ev.status.replace('_', ' ')}</span>
  ) : null;

  const ALL_TABS = ['Overview', 'Attendees', 'Checkin', 'Tickets', 'Gallery', 'Marketing', 'Settings'];
  const RESTRICTED_TABS = ['Tickets', 'Settings'];
  const visibleTabs = useMemo(() => {
    const s = ev?.status;
    if (s === 'pending_approval' || s === 'approved') return RESTRICTED_TABS;
    return ALL_TABS;
  }, [ev?.status]);

  const sidebarTabs = [
    { key: 'Overview', icon: BarChart2, label: 'Overview' },
    { key: 'Attendees', icon: Users, label: 'Attendees' },
    { key: 'Checkin', icon: CheckCircle, label: 'Check-in' },
    { key: 'Tickets', icon: Ticket, label: 'Tickets & Pricing' },
  ].filter(t => visibleTabs.includes(t.key));

  return (
    <div className="min-h-screen mt-20 bg-wix-gray-bg text-wix-text-dark font-sans flex flex-col">
      <MobileTabStrip activeKey={activeKey} onSelect={setActiveKey} tabs={sidebarTabs} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 border-r border-wix-border-light bg-white hidden md:flex flex-col py-6 min-h-screen">
          <div className="px-6 mb-2">
            <button onClick={() => router.push('/host/dashboard')} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-wix-text-muted hover:text-wix-text-dark transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-0.5">Managing Event</div>
            <div className="text-[13px] font-semibold text-wix-text-dark leading-tight truncate" title={ev?.title}>
              {loading ? '...' : (ev?.title || 'Event')}
            </div>
          </div>
          <nav className="mt-5 flex flex-col">
            {sidebarTabs.map(t => (
              <SidebarItem key={t.key} icon={t.icon} label={t.label} isActive={activeKey === t.key} onClick={() => setActiveKey(t.key)} />
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Header */}
          <div className="px-4 sm:px-8 py-5 sm:py-7 border-b border-wix-border-light bg-white">
            <div className="text-[12px] text-wix-text-muted font-medium flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
              <span onClick={() => router.push('/host/dashboard')} className="hover:text-wix-text-dark cursor-pointer transition-colors">Dashboard</span>
              <span>/</span>
              <span onClick={() => router.push('/host/events')} className="hover:text-wix-text-dark cursor-pointer transition-colors">Events</span>
              <span>/</span>
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-[22px] sm:text-[28px] font-medium tracking-tight text-wix-text-dark leading-none">{loading ? 'Loading...' : (ev?.title || 'Event')}</h1>
                  {statusBadge}
                </div>
                {(ev?.schedule?.startDate || ev?.venue?.name) && (
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px] sm:text-[13px] text-wix-text-muted mt-2 sm:mt-3">
                    {ev?.schedule?.startDate && <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(ev.schedule.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    {ev?.venue?.name && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{ev.venue.name}{ev.venue.address?.city ? `, ${ev.venue.address.city}` : ''}</div>}
                  </div>
                )}
              </div>
              {!loading && ev && (
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => window.open(`/events/${ev._id || id}`, '_blank')} className="border border-wix-text-dark bg-white text-wix-text-dark px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">Preview</button>
                  {ev.status === 'approved' && ev.schedule?.startDate && new Date(ev.schedule.startDate) > new Date() && (
                    <button
                      onClick={handlePublishEvent}
                      disabled={publishing}
                      className="bg-wix-text-dark text-white px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest hover:bg-wix-purple transition-colors border border-wix-text-dark hover:border-wix-purple disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                      {publishing ? 'Publishing...' : 'Publish Event'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-0 sm:px-8 py-8 sm:py-10">
            {loading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-wix-purple" /></div>
            ) : error ? (
              <div className="flex flex-col items-center py-24 gap-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={fetchEventData} className="text-[13px] text-wix-purple hover:underline">Try Again</button>
              </div>
            ) : (
              <div key={activeKey}>
                {activeKey === 'Overview' && <OverviewTab setActiveTab={setActiveKey} data={data} onEdit={() => setShowEditModal(true)} onRefetch={fetchEventData} />}
                {activeKey === 'Attendees' && <AttendeesTab data={data} />}
                {activeKey === 'Checkin' && <CheckinTab data={data} />}
                {activeKey === 'Tickets' && <TicketsTab data={data} onUpdate={setData} onRefetch={fetchEventData} />}
                {activeKey === 'Gallery' && <GalleryTab data={data} onUpdate={setData} />}
                {activeKey === 'Marketing' && <MarketingTab />}
                {activeKey === 'Settings' && <SettingsTab data={data} onUpdate={setData} onRefetch={fetchEventData} />}
              </div>
            )}
          </div>
        </main>
      </div>

      <EditDetailsModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        data={data} 
        onRefetch={fetchEventData} 
      />
    </div>
  );
}
