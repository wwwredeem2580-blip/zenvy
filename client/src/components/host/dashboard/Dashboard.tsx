'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  Calendar,
  Search,
  Plus,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Trash2,
  ChevronDown,
  Menu, X, Globe,
  Wallet as WalletIcon, Users as UsersIcon,
  LayoutDashboard, Home, LogIn, UserPlus,
  TrendingUp, TrendingDown,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth';
import { authService } from '@/lib/api/auth';
import { Logo } from '@/components/shared/Logo';
import { useRouter } from 'next/navigation';
import { hostAnalyticsService, DashboardMetrics, HostOrder } from '@/lib/api/host-analytics';
import { hostEventsService } from '@/lib/api/host';
import { eventsService } from '@/lib/api/events';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { TOTAL_ITEMS } from '@/app/(public)/learn/host-guide/content';
import { BDTIcon } from '@/components/ui/Icons';

interface DashboardProps {
  onLogout: () => void;
}

/* ─── Sparkline ─── */
const Sparkline = ({
  data, color = '#161616', width = 80, height = 24,
}: { data: number[]; color?: string; width?: number; height?: number }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 -4 ${width} ${height + 8}`} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ─── KPI Card ─── */
const KPICard = ({ title, value, change, isPositive, data, color, prefix }: any) => (
  <div className="bg-white border-r border-b border-wix-border-light p-4 sm:p-6 flex flex-col justify-between hover:bg-gray-50 transition-colors min-w-0">
    <div>
      <h3 className="text-[10px] sm:text-[11px] text-wix-text-muted font-black uppercase tracking-widest mb-2 sm:mb-3 truncate">{title}</h3>
      <div className="flex items-end justify-between gap-1 sm:gap-2">
        <span className="text-[18px] sm:text-[24px] font-medium tracking-tight leading-none text-wix-text-dark min-w-0 truncate">
          {prefix && <span className="text-[11px] sm:text-[13px] mr-0.5 font-normal text-wix-text-muted">{prefix}</span>}
          {value}
        </span>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-bold mb-1 shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {change}%
          </div>
        )}
      </div>
    </div>
    {data && (
      <div className="mt-3 sm:mt-5 flex justify-between items-end">
        <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider hidden sm:block">vs last period</span>
        <Sparkline data={data} color={color} />
      </div>
    )}
  </div>
);

/* ─── Stacked Bar Chart ─── */
const RevenueBarChart = ({ events }: { events: any[] }) => {
  if (!events.length) return (
    <div className="text-[13px] text-wix-text-muted text-center py-10">No event data yet</div>
  );

  const bars = events.slice(0, 4).map(e => ({
    name: e.title || 'Event',
    revenue: e.revenue || 0,
  }));
  const maxRev = Math.max(...bars.map(b => b.revenue), 1);

  return (
    <div className="flex flex-col gap-5 w-full mt-2">
      {bars.map((item, i) => {
        const pct = (item.revenue / maxRev) * 100;
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-wix-text-dark truncate max-w-[60%]">{item.name}</span>
              <span className="font-semibold font-mono"><BDTIcon className="inline text-[12px]"/>{item.revenue?.toLocaleString()}</span>
            </div>
            <div className="w-full h-5 bg-gray-50 border border-wix-border-light flex overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className="bg-wix-text-dark hover:bg-wix-purple transition-colors cursor-pointer"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Conversion Funnel ─── */
const FunnelChart = ({ metrics }: { metrics: DashboardMetrics | null }) => {
  const pageViews = metrics?.overview?.totalOrders ? metrics.overview.totalOrders * 9 : 45200;
  const checkouts = metrics?.overview?.totalOrders ? metrics.overview.totalOrders * 2 : 12450;
  const purchases = metrics?.overview?.totalOrders ?? 4890;

  const steps = [
    { label: 'Est. Page Views', value: pageViews, color: 'bg-wix-text-dark', width: '100%' },
    { label: 'Checkout Started', value: checkouts, color: 'bg-gray-700', width: '70%' },
    { label: 'Completed Orders', value: purchases, color: 'bg-wix-purple', width: '44%' },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2 pt-2">
      {steps.map((step, i) => (
        <div className="flex flex-col items-center w-full" key={i}>
          <div
            className={`min-w-fit h-10 sm:h-11 flex items-center justify-between px-3 sm:px-5 text-white hover:opacity-90 transition-opacity cursor-pointer ${step.color}`}
            style={{ width: step.width }}
          >
            <span className="text-[10px] sm:text-[12px] font-medium tracking-wide truncate mr-2 sm:mr-4">{step.label}</span>
            <span className="font-mono text-[10px] sm:text-[13px] font-bold shrink-0">{step.value.toLocaleString()}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="text-[11px] font-bold text-gray-400 my-1">
              ↓ {Math.round((steps[i + 1].value / step.value) * 100)}% rate
            </div>
          )}
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-wix-border-light w-full flex justify-between px-3">
        <span className="text-[12px] text-gray-500 font-medium">Overall Conversion</span>
        <span className="text-[13px] font-bold text-emerald-600">
          {((purchases / pageViews) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

/* ─── Status priority sort ─── */
const STATUS_ORDER: Record<string, number> = {
  approved: 0,
  live: 1,
  published: 2,
  pending_approval: 3,
  draft: 4,
  ended: 5,
  cancelled: 6,
};

const STATUS_BADGE: Record<string, string> = {
  live: 'border-emerald-500 text-emerald-600',
  published: 'border-wix-purple text-wix-purple',
  approved: 'border-green-500 text-green-600',
  pending_approval: 'border-amber-500 text-amber-600',
  draft: 'border-gray-400 text-gray-500',
  ended: 'border-gray-300 text-gray-400',
  cancelled: 'border-red-400 text-red-500',
};

/* ─── Event Performance Table ─── */
const EventTable = ({ events, loading, router, onDelete }: { events: any[]; loading: boolean; router: any; onDelete: (eventId: string) => void }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[700px]">
      <thead>
        <tr className="border-b-2 border-wix-text-dark text-[11px] uppercase tracking-wider text-wix-text-muted">
          <th className="pb-4 pl-3 font-black w-2/5">Event</th>
          <th className="pb-4 font-black">Capacity &amp; Sales</th>
          <th className="pb-4 font-black">Revenue</th>
          <th className="pb-4 font-black">Status</th>
          <th className="pb-4 pr-3 font-black text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-wix-purple" /></td></tr>
        ) : events.length === 0 ? (
          <tr><td colSpan={5} className="py-12 text-center text-[14px] text-wix-text-muted">No events found</td></tr>
        ) : (
          events.map((event: any, i: number) => {
            const sold = event.ticketsSoldPercentage ?? 0;
            const isDraft = event.status === 'draft';
            return (
              <tr key={event.eventId || i} className="border-b border-wix-border-light hover:bg-gray-50 transition-colors group">
                <td className="py-4 pl-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={event.coverImage || 'https://fastly.picsum.photos/id/1084/536/354.jpg?grayscale&hmac=Ux7nzg19e1q35mlUVZjhCLxqkR30cC-CarVg-nlIf60'}
                      className="w-10 h-10 object-cover shrink-0 border border-wix-border-light"
                      alt=""
                    />
                    <div>
                      <span className="font-semibold text-[14px] text-wix-text-dark line-clamp-1 max-w-[180px] block">{event.title}</span>
                      <span className="text-[11px] text-wix-text-muted">
                        {new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6">
                  <div className="flex flex-col gap-1.5 max-w-[180px]">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium">{sold}% filled</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100">
                      <div className="h-full bg-wix-text-dark" style={{ width: `${sold}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className="font-mono text-[14px] font-medium flex items-center gap-0.5">
                    <BDTIcon className="text-[12px]" />{event.revenue?.toLocaleString()}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border ${STATUS_BADGE[event.status] || 'border-gray-300 text-gray-500'}`}>
                    {event.status === 'pending_approval' ? 'pending' : event.status}
                  </span>
                </td>
                <td className="py-4 pr-3 text-right">
                  <div className="flex items-center justify-end gap-2 transition-opacity">
                    {isDraft && (
                      <button
                        onClick={() => onDelete(event.eventId)}
                        className="text-[12px] font-bold uppercase tracking-widest text-red-600 border border-red-300 px-3 py-1.5 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() =>
                        isDraft
                          ? router.push(`/host/events/create?draftId=${event.eventId}`)
                          : router.push(`/host/events/manage/${event.eventId}`)
                      }
                      className="text-[12px] font-bold uppercase tracking-widest text-wix-text-dark border border-wix-border-light px-3 py-1.5 hover:border-wix-text-dark transition-colors"
                    >
                      {isDraft ? 'Edit Draft' : 'Manage'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

/* ─── Main Dashboard ─── */
export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<HostOrder[]>([]);
  const [allOrders, setAllOrders] = useState<HostOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'orders'>('overview');

  const avatarSeed = user?.email ?? 'default';

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth?tab=login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, eventsData, ordersData, guideData, profileData] = await Promise.all([
          hostAnalyticsService.getDashboardMetrics(),
          hostEventsService.getHostEvents({ limit: 50, page: 1, filters: {} }),
          hostAnalyticsService.getHostOrders(1, 5),
          apiClient.get<any>('/api/host/guide').catch(() => ({ completedItems: [] })),
          hostEventsService.getProfile().catch(() => null),
        ]);
        setMetrics(metricsData);
        setEvents(eventsData.events || []);
        setRecentOrders(ordersData.orders || []);
        
        // Only show the profile completion note if the profile is actually incomplete
        if (profileData && !profileData.profileComplete) {
          setShowNote(true);
        }
        
        if ((guideData.completedItems?.length || 0) < TOTAL_ITEMS) setShowGuide(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter + sort events
  const activeEvents = events.filter(e => e.status !== 'cancelled');
  const searchedEvents = activeEvents.filter(e =>
    (!searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || e.status === statusFilter)
  );
  // Sort by status priority
  const sortedEvents = [...searchedEvents].sort((a, b) =>
    (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );
  const filteredEvents = showAllEvents ? sortedEvents : sortedEvents.slice(0, 5);

  // Delete a draft event
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Delete this draft event? This cannot be undone.')) return;
    try {
      await eventsService.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.eventId !== eventId));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete event');
    }
  };

  // Expand Recent Sales in-place
  const handleToggleAllOrders = async () => {
    if (!showAllOrders && allOrders.length === 0) {
      setLoadingAllOrders(true);
      try {
        const result = await hostAnalyticsService.getHostOrders(1, 100);
        setAllOrders(result.orders || []);
      } catch (_) {}
      setLoadingAllOrders(false);
    }
    setShowAllOrders(v => !v);
  };

  // Build KPI cards from real metrics
  const kpiCards = metrics ? [
    {
      title: 'Total Revenue',
      value: metrics.overview?.totalRevenue?.toLocaleString() ?? '—',
      prefix: 'BDT',
      change: 12.4,
      isPositive: true,
      data: [10, 15, 13, 22, 25, metrics.overview?.totalRevenue ? Math.min(metrics.overview.totalRevenue / 1000, 30) : 20],
      color: '#116d42',
    },
    {
      title: 'This Month',
      value: metrics.revenueByPeriod?.thisMonth?.toLocaleString() ?? '—',
      prefix: 'BDT',
      change: 8.2,
      isPositive: true,
      data: [5, 8, 12, 10, 15, metrics.revenueByPeriod?.thisMonth ? Math.min(metrics.revenueByPeriod.thisMonth / 500, 20) : 15],
      color: '#116d42',
    },
    {
      title: 'Total Orders',
      value: metrics.overview?.totalOrders?.toLocaleString() ?? '—',
      change: 4.1,
      isPositive: true,
      data: [30, 35, 38, 40, 42, metrics.overview?.totalOrders ? Math.min(metrics.overview.totalOrders / 10, 50) : 45],
      color: '#116d42',
    },
    {
      title: 'Tickets Sold',
      value: metrics.overview?.totalTicketsSold?.toLocaleString() ?? '—',
      change: 6.8,
      isPositive: true,
      data: [50, 60, 70, 80, 90, metrics.overview?.totalTicketsSold ? Math.min(metrics.overview.totalTicketsSold / 10, 100) : 95],
      color: '#116d42',
    },
    {
      title: "Today's Revenue",
      value: metrics.recentActivity?.revenueToday?.toLocaleString() ?? '—',
      prefix: 'BDT',
      change: 2.1,
      isPositive: metrics.recentActivity?.revenueToday > 0,
      data: [5, 3, 8, 6, 9, metrics.recentActivity?.revenueToday ? Math.min(metrics.recentActivity.revenueToday / 100, 12) : 4],
      color: '#161616',
    },
    {
      title: 'Active Events',
      value: events.filter(e => e.status === 'live' || e.status === 'published').length.toString(),
      data: [4, 4, 5, 5, 6, events.length],
      color: '#161616',
    },
  ] : [];

  return (
    <div className="min-h-screen mt-24 bg-wix-gray-bg text-wix-text-dark font-sans">

      <main className="max-w-[1400px] mx-auto w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 border-b border-wix-border-light pb-4 sm:pb-6">
          <div>
            <h1 className="text-[32px] sm:text-[40px] font-medium tracking-tight text-wix-text-dark leading-none mb-2">
              Dashboard
            </h1>
            <p className="text-wix-text-muted font-light">Manage your events and track performance.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/host/events/create')}
              className="bg-wix-text-dark text-white px-6 py-3 rounded-none text-[10px] sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
            >
              <Plus size={18} /> New Event
            </button>
            <button
              onClick={() => router.push('/host/profile')}
              className="bg-white border border-wix-border-light text-wix-text-dark px-6 py-3 rounded-none text-[10px] sm:text-sm font-bold uppercase tracking-widest hover:border-wix-text-dark transition-all"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 sm:gap-8 border-b border-wix-border-light mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Events' },
            { id: 'orders', label: 'Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'orders' && allOrders.length === 0) handleToggleAllOrders();
              }}
              className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-wix-text-dark' : 'text-wix-text-muted/60 hover:text-wix-text-dark'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-wix-text-dark" />
              )}
            </button>
          ))}
        </div>

        <section className="min-h-[400px]">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Alert */}
              {showNote && (
                <div className="bg-wix-purple/5 border border-wix-purple/20 p-4 mb-12 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-wix-purple uppercase tracking-widest text-[11px]">Note:</span>
                    <span className="text-wix-text-dark/80">
                      You Must Complete Your <Link href="/host/profile" className="text-wix-purple underline cursor-pointer font-medium">Profile</Link> before creating an event. Just verify your phone number and add a payment method to your profile.
                    </span>
                  </div>
                  <button onClick={() => setShowNote(false)} className="text-wix-text-muted hover:text-wix-text-dark p-1">
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 border border-wix-border-light rounded-none overflow-hidden mb-12 bg-white">
                {[
                  { label: 'Total Revenue', value: metrics?.overview?.totalRevenue ? `BDT ${metrics.overview.totalRevenue.toLocaleString()}` : '—', change: '+12.4%', up: true, trend: [20, 40, 30, 50, 40, 60] },
                  { label: 'This Month', value: metrics?.revenueByPeriod?.thisMonth ? `BDT ${metrics.revenueByPeriod.thisMonth.toLocaleString()}` : '—', change: '+8.2%', up: true, trend: [10, 20, 15, 30, 25, 35] },
                  { label: 'Total Orders', value: metrics?.overview?.totalOrders?.toLocaleString() ?? '—', change: '+4.1%', up: true, trend: [30, 35, 40, 38, 45, 50] },
                  { label: 'Tickets Sold', value: metrics?.overview?.totalTicketsSold?.toLocaleString() ?? '—', change: '+6.8%', up: true, trend: [40, 45, 42, 50, 55, 60] },
                  { label: "Today\'s Revenue", value: metrics?.recentActivity?.revenueToday ? `BDT ${metrics.recentActivity.revenueToday.toLocaleString()}` : '—', change: '+2.1%', up: (metrics?.recentActivity?.revenueToday ?? 0) >= 0, trend: [20, 15, 25, 20, 30, 25] },
                  { label: 'Active Events', value: events.filter(e => e.status === 'live' || e.status === 'published').length.toString(), change: '', up: true, trend: [5, 5, 5, 6, 6, 6] },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-4 sm:p-6 border-r border-b border-wix-border-light last:border-r-0 lg:even:border-r lg:[&:nth-child(3)]:border-r">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-wix-text-muted mb-2 sm:mb-4">{stat.label}</div>
                    <div className="flex items-end justify-between gap-2 mb-2 sm:mb-4">
                      <div className="text-lg sm:text-2xl font-semibold tracking-tight text-wix-text-dark">{stat.value}</div>
                      {stat.change && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {stat.change}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-wix-text-muted/40 mb-3">vs last period</div>
                    <div className="h-8 w-full opacity-60">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path
                          d={`M ${stat.trend.map((v, idx) => `${(idx * 100) / (stat.trend.length - 1)} ${40 - v}`).join(' L ')}`}
                          fill="none"
                          stroke={stat.up ? "#10b981" : "#f43f5e"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 w-full min-w-0">
                {/* Revenue by Event */}
                <div className="bg-white border border-wix-border-light p-4 sm:p-6 lg:p-8 w-full overflow-hidden">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-[18px] sm:text-[20px] font-semibold text-wix-text-dark mb-1 tracking-tight truncate">Revenue by Event</h2>
                    <p className="text-[10px] sm:text-[11px] text-wix-text-muted uppercase tracking-widest font-medium truncate">Top performing events this period</p>
                  </div>
                  <RevenueBarChart events={events} />
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white border border-wix-border-light p-4 flex flex-col items-center w-full overflow-hidden sm:p-6 lg:p-8">
                  <div className="mb-4 sm:mb-6 text-center lg:text-left w-full">
                    <h2 className="text-[18px] sm:text-[20px] font-semibold text-wix-text-dark mb-1 tracking-tight truncate">Conversion Funnel</h2>
                    <p className="text-[10px] sm:text-[11px] text-wix-text-muted uppercase tracking-widest font-medium truncate">Page view → purchase (active)</p>
                  </div>
                  <div className="w-full overflow-hidden">
                    <FunnelChart metrics={metrics} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white border-y sm:border border-wix-border-light overflow-hidden p-4 sm:p-8"
            >
              {/* Events Tab Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-[24px] font-semibold text-wix-text-dark mb-1 tracking-tight">Event Performance</h2>
                  <p className="text-[14px] text-wix-text-muted">Live and published events with real-time metrics.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full md:w-48 bg-white border border-wix-border-light px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest appearance-none focus:outline-none focus:border-wix-text-dark transition-colors cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="ended">Ended</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                  <div className="relative flex-1 md:flex-none">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full md:w-64 bg-white border border-wix-border-light px-10 py-2.5 text-[13px] focus:outline-none focus:border-wix-text-dark transition-colors"
                    />
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  </div>
                </div>
              </div>

              <EventTable
                events={sortedEvents}
                loading={loading}
                router={router}
                onDelete={handleDeleteEvent}
              />

              <div className="mt-8 pt-6 border-t border-wix-border-light flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-widest text-wix-text-muted font-bold">
                  Showing {sortedEvents.length} events
                </span>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white border-y sm:border border-wix-border-light overflow-hidden p-4 sm:p-8"
            >
              {/* Orders Tab Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-[24px] font-semibold text-wix-text-dark mb-1 tracking-tight">Recent Orders</h2>
                  <p className="text-[14px] text-wix-text-muted">Manage and track all ticket purchases across your events.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <input
                      type="text"
                      placeholder="Search orders..."
                      className="w-full md:w-64 bg-white border border-wix-border-light px-10 py-2.5 text-[13px] focus:outline-none focus:border-wix-text-dark transition-colors"
                    />
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b-2 border-wix-text-dark text-[11px] uppercase tracking-[0.2em] font-bold text-wix-text-muted">
                      <th className="px-3 py-6">Order #</th>
                      <th className="px-3 py-6">Event Title</th>
                      <th className="px-3 py-6">Price</th>
                      <th className="px-3 py-6">Date</th>
                      <th className="px-3 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wix-border-light">
                    {loadingAllOrders ? (
                      <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-wix-purple" /></td></tr>
                    ) : allOrders.length === 0 && recentOrders.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-wix-text-muted text-[14px]">No orders found yet</td></tr>
                    ) : (
                      (allOrders.length > 0 ? allOrders : recentOrders).map((order) => (
                        <tr key={order.orderNumber} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-3 py-6">
                            <div className="text-[14px] font-bold text-wix-text-dark">{order.orderNumber}</div>
                          </td>
                          <td className="px-3 py-6">
                            <div className="text-[14px] font-medium text-wix-text-dark truncate max-w-[300px]">{order.eventTitle}</div>
                          </td>
                          <td className="px-3 py-6">
                            <div className="text-[14px] font-semibold text-wix-text-dark flex items-center gap-0.5">
                              <BDTIcon className="text-[12px]" />{order.total?.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-6">
                            <div className="text-[11px] uppercase tracking-widest text-wix-text-muted font-medium">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-3 py-6 text-right">
                            <button className="p-2 hover:bg-white border border-transparent hover:border-wix-border-light transition-all">
                              <ChevronRightIcon size={16} className="text-wix-text-muted" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="mt-8 pt-6 border-t border-wix-border-light flex justify-between items-center">
                <div className="text-[11px] uppercase tracking-widest text-wix-text-muted font-bold">
                  {allOrders.length || recentOrders.length} orders total
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};
