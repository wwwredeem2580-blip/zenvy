'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff, 
  LogOut,
  History,
  Settings,
  CloudOff
} from 'lucide-react';
import { scannerService } from '@/lib/api/scanner';
import { scannerDB } from '@/lib/db/scanner-db';
import type { CachedTicket, QueuedScan } from '@/lib/db/scanner-db';
import { useNotification } from '@/lib/context/notification';

interface ScanResult {
  id: string;
  timestamp: Date;
  ticketNumber?: string;
  result: 'success' | 'duplicate' | 'invalid' | 'expired' | 'cancelled';
  message: string;
  offline: boolean;
  wristbandColor?: string;
}

interface SessionData {
  accessToken: string;
  deviceId: string;
  deviceName: string;
  sessionId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  expiresAt: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ success: 0, failed: 0, total: 0 });
  const [showResultModal, setShowResultModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Sync lock to prevent concurrent syncs
  const { showNotification } = useNotification();
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerInitialized = useRef(false);
  const [dbInitialized, setDbInitialized] = useState(false); // Changed from ref to state

  // Initialize IndexedDB and load session
  useEffect(() => {
    const initDB = async () => {
      try {
        await scannerDB.init();
        setDbInitialized(true); // Changed from ref to state setter
        console.log('IndexedDB initialized');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();
  }, []);

  // Load session from localStorage
  useEffect(() => {
    const sessionData = localStorage.getItem('scanner_session');
    if (!sessionData) {
      const isScannerSubdomain = window.location.hostname === 'scanner.zenvy.com.bd';
      router.push(isScannerSubdomain ? '/' : '/scanner');
      return;
    }
    
    try {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
    } catch (error) {
      console.error('Failed to parse session:', error);
      const isScannerSubdomain = window.location.hostname === 'scanner.zenvy.com.bd';
      router.push(isScannerSubdomain ? '/' : '/scanner');
    }
  }, [router]);

  // Cache tickets when session is loaded
  useEffect(() => {
    if (!session || !dbInitialized) {
      console.log('⏸️ Caching skipped:', { 
        hasSession: !!session, 
        dbInitialized: dbInitialized 
      });
      return;
    }

    const cacheTickets = async () => {
      try {
        setIsCaching(true);
        console.log('🔄 Starting ticket caching process...');
        console.log('Session data:', { 
          sessionId: session.sessionId, 
          deviceId: session.deviceId,
          eventId: session.eventId,
          eventTitle: session.eventTitle
        });
        
        console.log('📡 Calling API: /api/scanner/tickets/' + session.sessionId);
        const response = await scannerService.getTicketsForCache(session.sessionId, session.deviceId);
        console.log('📦 API Response received:', { 
          ticketCount: response.tickets?.length || 0,
          eventId: response.eventId,
          cachedAt: response.cachedAt
        });
        
        const { tickets } = response;
        
        if (!tickets || tickets.length === 0) {
          console.warn('⚠️ No tickets returned from server');
          showNotification('error', 'No Tickets', 'No tickets found for this event');
          return;
        }
        
        console.log(`✅ Fetched ${tickets.length} tickets from server for caching`);
        
        const cachedTickets: CachedTicket[] = tickets.map(t => ({
          ...t,
          status: t.status as 'valid' | 'cancelled' | 'refunded',
          qrHash: t.qrHash,
          cachedAt: Date.now()
        }));

        console.log('💾 Storing tickets in IndexedDB...');
        await scannerDB.cacheTickets(cachedTickets);
        console.log(`✅ Successfully cached ${tickets.length} tickets in IndexedDB`);
        console.log('Sample cached tickets:', tickets.slice(0, 2).map(t => ({
          ticketNumber: t.ticketNumber,
          qrHash: t.qrHash?.substring(0, 16) + '...',
          status: t.status
        })));
        
        showNotification('success', 'Cache Ready', `${tickets.length} tickets cached for offline use`);
      } catch (error: any) {
        console.error('❌ Failed to cache tickets - Full error:', error);
        console.error('Error details:', {
          message: error?.message,
          status: error?.status,
          response: error?.response?.data,
          stack: error?.stack
        });
        showNotification('error', 'Caching Failed', error?.message || 'Could not cache tickets for offline use');
      } finally {
        setIsCaching(false);
      }
    };

    cacheTickets();
  }, [session, dbInitialized]); // Removed isOnline dependency - cache regardless of connection

  // Check for pending syncs
  useEffect(() => {
    if (!dbInitialized) return;

    const checkPendingSyncs = async () => {
      try {
        const unsynced = await scannerDB.getUnsyncedScans();
        setPendingSyncs(unsynced.length);
      } catch (error) {
        console.error('Failed to check pending syncs:', error);
      }
    };

    checkPendingSyncs();
    const interval = setInterval(checkPendingSyncs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitor online status
  useEffect(() => {
    // Set initial state from navigator.onLine
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (!isOnline || !dbInitialized || pendingSyncs === 0 || isSyncing) return;

    const syncOfflineScans = async () => {
      // Prevent concurrent syncs
      if (isSyncing) {
        console.log('⏸️ Sync already in progress, skipping...');
        return;
      }

      setIsSyncing(true);

      try {
        // Validate session before syncing
        if (!session || !session.accessToken) {
          console.error('❌ No valid session, cannot sync');
          setIsSyncing(false);
          return;
        }

        // Check if session is still valid (not expired)
        const sessionExpiry = new Date(session.expiresAt);
        if (sessionExpiry < new Date()) {
          console.error('❌ Session expired, cannot sync offline scans');
          showNotification('error', 'Session Expired', 'Please rejoin the scanner session to sync offline scans');
          setIsSyncing(false);
          return;
        }

        console.log(`🔄 Syncing ${pendingSyncs} offline scans...`);
        const unsyncedScans = await scannerDB.getUnsyncedScans();

        if (unsyncedScans.length === 0) {
          setPendingSyncs(0);
          setIsSyncing(false);
          return;
        }

        const MAX_RETRIES = 3;
        let syncedCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;
        
        try {
          // Batch all queued scans into one API call using the dedicated sync endpoint
          const scansPayload = unsyncedScans.map(s => ({
            ticketId: s.ticketId || '',
            qrData: s.qrData,
            scanTimestamp: new Date(s.scannedAt).toISOString(),
            localScanId: s.id
          }));

          const syncResult = await scannerService.syncOfflineScans(
            session.accessToken,
            session.deviceId,
            scansPayload
          );

          syncedCount = syncResult.synced || 0;
          duplicateCount = syncResult.conflicts || 0;
          failedCount = syncResult.rejected || 0;

          // Mark all as synced / failed based on result
          for (const scanId of (syncResult.results?.accepted || [])) {
            await scannerDB.markScanAsSynced(scanId);
          }
          for (const item of (syncResult.results?.conflicts || [])) {
            await scannerDB.markScanAsSynced(item.localScanId); // duplicate = treat as synced
          }
          for (const item of (syncResult.results?.rejected || [])) {
            await scannerDB.incrementRetryCount(item.localScanId);
          }
        } catch (error: any) {
          console.error('❌ Batch sync failed:', error);
          failedCount = unsyncedScans.length;
        }

        console.log(`✅ Sync complete: ${syncedCount} synced, ${duplicateCount} duplicates, ${failedCount} failed`);
        
        // Clean up synced scans
        await scannerDB.clearSyncedScans();
        
        // Update pending count
        const remaining = await scannerDB.getUnsyncedScans();
        setPendingSyncs(remaining.length);

        if (failedCount > 0) {
          showNotification('error', 'Sync Incomplete', `${failedCount} scan(s) failed after ${MAX_RETRIES} attempts`);
        }
      } catch (error) {
        console.error('❌ Auto-sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Delay sync slightly to ensure connection is stable
    const timeoutId = setTimeout(syncOfflineScans, 2000);
    return () => clearTimeout(timeoutId);
  }, [isOnline, pendingSyncs, isSyncing, session]);

  // Define scan callbacks with useCallback to prevent re-renders
  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (!session || isPaused) return;

    // Pause scanner immediately to prevent multiple scans
    setIsPaused(true);
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.pause(true);
      } catch (err) {
        console.log('Pause error:', err);
      }
    }

    // Vibrate on scan
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    let result: ScanResult;

    try {
      if (isOnline) {
        // ONLINE: Try to verify with server
        try {
          const response = await scannerService.verifyTicket(
            decodedText,
            session.accessToken,
            session.deviceId
          );

          result = {
            id: Date.now().toString(),
            timestamp: new Date(),
            ticketNumber: response.ticket?.ticketNumber,
            result: response.valid ? 'success' : 
                    response.reason === 'ALREADY_CHECKED_IN' ? 'duplicate' :
                    response.reason === 'TICKET_EXPIRED' ? 'expired' :
                    response.reason?.includes('CANCELLED') ? 'cancelled' : 'invalid',
            message: response.message,
            offline: false,
            wristbandColor: response.ticket?.wristbandColor
          };

          // Mark as scanned in local DB for offline duplicate detection (use ticket number as ID)
          if (response.valid && response.ticket?.ticketNumber) {
            await scannerDB.markTicketAsScanned(response.ticket.ticketNumber, false);
          }
        } catch (apiError: any) {
          // Network error - fallback to offline mode
          console.warn('API call failed, falling back to offline mode:', apiError);
          
          // NOTE: Do NOT call setIsOnline(false) here - that would permanently lock
          // the device in offline mode. The window online/offline events manage real
          // connectivity state. We just use offline verification for this single scan.
          
          // Use offline verification
          const ticket = await scannerDB.getTicketByQRHash(decodedText);

          if (!ticket) {
            result = {
              id: Date.now().toString(),
              timestamp: new Date(),
              result: 'invalid',
              message: 'Network error - Ticket not found in offline cache',
              offline: true
            };
          } else {
            // Check if already scanned
            const alreadyScanned = await scannerDB.isTicketScanned(ticket.ticketId);

            if (alreadyScanned) {
              result = {
                id: Date.now().toString(),
                timestamp: new Date(),
                ticketNumber: ticket.ticketNumber,
                result: 'duplicate',
                message: 'Ticket already checked in (offline)',
                offline: true
              };
            } else if (ticket.status === 'cancelled') {
              result = {
                id: Date.now().toString(),
                timestamp: new Date(),
                ticketNumber: ticket.ticketNumber,
                result: 'cancelled',
                message: 'Ticket has been cancelled',
                offline: true
              };
            } else if (ticket.status === 'refunded') {
              result = {
                id: Date.now().toString(),
                timestamp: new Date(),
                ticketNumber: ticket.ticketNumber,
                result: 'invalid',
                message: 'Ticket has been refunded',
                offline: true
              };
            } else {
              // Valid ticket
              result = {
                id: Date.now().toString(),
                timestamp: new Date(),
                ticketNumber: ticket.ticketNumber,
                result: 'success',
                message: `Valid ${ticket.ticketType} ticket (offline - network error)`,
                offline: true
              };

              // Mark as scanned
              await scannerDB.markTicketAsScanned(ticket.ticketId, true);

              // Add to sync queue
              const queuedScan: QueuedScan = {
                id: Date.now().toString(),
                qrData: decodedText,
                ticketId: ticket.ticketId,
                scannedAt: Date.now(),
                deviceId: session.deviceId,
                accessToken: session.accessToken,
                result: 'success',
                message: result.message,
                ticketNumber: ticket.ticketNumber,
                synced: false
              };
              await scannerDB.addToScanQueue(queuedScan);
              setPendingSyncs(prev => prev + 1);
            }
          }
        }
      } else {
        // OFFLINE: Verify with cached data
        const ticket = await scannerDB.getTicketByQRHash(decodedText);

        if (!ticket) {
          result = {
            id: Date.now().toString(),
            timestamp: new Date(),
            result: 'invalid',
            message: 'Ticket not found in offline cache',
            offline: true
          };
        } else {
          // Check if already scanned
          const alreadyScanned = await scannerDB.isTicketScanned(ticket.ticketId);

          if (alreadyScanned) {
            result = {
              id: Date.now().toString(),
              timestamp: new Date(),
              ticketNumber: ticket.ticketNumber,
              result: 'duplicate',
              message: 'Ticket already checked in (offline)',
              offline: true
            };
          } else if (ticket.status === 'cancelled') {
            result = {
              id: Date.now().toString(),
              timestamp: new Date(),
              ticketNumber: ticket.ticketNumber,
              result: 'cancelled',
              message: 'Ticket has been cancelled',
              offline: true
            };
          } else if (ticket.status === 'refunded') {
            result = {
              id: Date.now().toString(),
              timestamp: new Date(),
              ticketNumber: ticket.ticketNumber,
              result: 'invalid',
              message: 'Ticket has been refunded',
              offline: true
            };
          } else {
            // Valid ticket
            result = {
              id: Date.now().toString(),
              timestamp: new Date(),
              ticketNumber: ticket.ticketNumber,
              result: 'success',
              message: `Valid ${ticket.ticketType} ticket (offline)`,
              offline: true
            };

            // Mark as scanned
            await scannerDB.markTicketAsScanned(ticket.ticketId, true);

            // Add to sync queue
            const queuedScan: QueuedScan = {
              id: Date.now().toString(),
              qrData: decodedText,
              ticketId: ticket.ticketId,
              scannedAt: Date.now(),
              deviceId: session.deviceId,
              accessToken: session.accessToken,
              result: 'success',
              message: result.message,
              ticketNumber: ticket.ticketNumber,
              synced: false
            };
            await scannerDB.addToScanQueue(queuedScan);
            setPendingSyncs(prev => prev + 1);
          }
        }
      }

      setLastScan(result);
      setScanHistory(prev => [result, ...prev].slice(0, 50));
      
      if (result.result === 'success') {
        setStats(prev => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }));
        playSuccessSound();
      } else {
        setStats(prev => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }));
        playErrorSound();
      }

      // Show modal
      setShowResultModal(true);
    } catch (error: any) {
      if(error.status === 403){
        showNotification('error', 'Scan failed', error?.response?.data?.message || 'Your device has been disabled. Please contact host.');
        return;
      }
      console.error('Scan error:', error);
      result = {
        id: Date.now().toString(),
        timestamp: new Date(),
        result: 'invalid',
        message: 'Failed to verify ticket',
        offline: !isOnline
      };
      setLastScan(result);
      setScanHistory(prev => [result, ...prev].slice(0, 50));
      setStats(prev => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }));
      playErrorSound();
      
      // Show modal
      setShowResultModal(true);
    }
  }, [session, isPaused, isOnline]);

  const onScanFailure = useCallback((error: string) => {
    // Silent - scanning continuously
  }, []);

  const playSuccessSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    audio.play().catch(() => {});
  };

  const handleScanAgain = async () => {
    setShowResultModal(false);
    setLastScan(null);
    setIsPaused(false);
    
    // Resume scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.resume();
      } catch (err) {
        console.log('Resume error:', err);
      }
    }
  };

  // Initialize QR scanner
  useEffect(() => {
    if (!session || scannerInitialized.current) return;

    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
        
        scannerInitialized.current = true;
        setScanning(true);
      } catch (error) {
        console.error('Scanner init error:', error);
        alert('Failed to start camera. Please allow camera access.');
      }
    };

    initScanner();

    return () => {
      if (html5QrCodeRef.current && scannerInitialized.current) {
        html5QrCodeRef.current.stop()
          .then(() => {
            scannerInitialized.current = false;
            html5QrCodeRef.current = null;
          })
          .catch((err) => {
            console.log('Scanner already stopped:', err);
            scannerInitialized.current = false;
            html5QrCodeRef.current = null;
          });
      }
    };
  }, [session]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? You will need to rejoin the session.')) {
      localStorage.removeItem('scanner_session');
      if (html5QrCodeRef.current && scannerInitialized.current) {
        html5QrCodeRef.current.stop()
          .then(() => {
            scannerInitialized.current = false;
            html5QrCodeRef.current = null;
            const isScannerSubdomain = window.location.hostname === 'scanner.zenvy.com.bd';
            router.push(isScannerSubdomain ? '/' : '/scanner');
          })
          .catch(() => {
            scannerInitialized.current = false;
            html5QrCodeRef.current = null;
            const isScannerSubdomain = window.location.hostname === 'scanner.zenvy.com.bd';
            router.push(isScannerSubdomain ? '/' : '/scanner');
          });
      } else {
        const isScannerSubdomain = window.location.hostname === 'scanner.zenvy.com.bd';
        router.push(isScannerSubdomain ? '/' : '/scanner');
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[768px] mx-auto bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="p-6 pb-0">
        <div className="flex items-center flex-col items-start sm:flex-row sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-[400] tracking-tight text-slate-900">{session.eventTitle}</h1>
            <p className="text-sm text-slate-400 font-[300] mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              {session.deviceName}
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-start">
            {/* Online/Offline Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-[400] ${
              isOnline ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-700'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Pending Syncs Indicator */}
            {pendingSyncs > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-[400] bg-amber-50 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {pendingSyncs} pending
              </div>
            )}

            {/* Caching Indicator */}
            {isCaching && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-[400] bg-blue-50 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Caching...
              </div>
            )}

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 p-1 bg-brand-50 rounded-[24px]">
          <div className="grid grid-cols-3 gap-1">
            <div className="text-center py-4 rounded-[20px] bg-white m-1">
              <div className="text-2xl font-[500] text-emerald-500">{stats.success}</div>
              <div className="text-xs text-slate-400 font-[400] mt-1">Valid</div>
            </div>
            <div className="text-center py-4 rounded-[20px] bg-white m-1">
              <div className="text-2xl font-[500] text-rose-500">{stats.failed}</div>
              <div className="text-xs text-slate-400 font-[400] mt-1">Invalid</div>
            </div>
            <div className="text-center py-4 rounded-[20px] bg-white m-1">
              <div className="text-2xl font-[500] text-brand-500">{stats.total}</div>
              <div className="text-xs text-slate-400 font-[400] mt-1">Total Scans</div>
            </div>
          </div>
        </div>
      </header>

      {/* Scanner View */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 relative">
        <div className="relative w-full max-w-[600px] overflow-hidden rounded-[32px] bg-slate-100">
          <div 
            id="qr-reader" 
            className="overflow-hidden"
            style={{ minHeight: '400px'}}
          ></div>
          
          {/* Minimal Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border border-white/30 rounded-[32px] relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neutral-600 rounded-tl-[12px]"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neutral-600 rounded-tr-[12px]"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neutral-600 rounded-bl-[12px]"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neutral-600 rounded-br-[12px]"></div>
            </div>
            
            {/* Status Pill */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
               <div className="bg-white/10 text-neutral-600 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-[400]">
                  {isPaused ? 'Processing...' : 'Scanning active'}
               </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400 mt-6 font-[300] text-center max-w-[768px] mx-auto">
          Align the QR code within the frame to verify the ticket instantly.
        </p>
      </div>

      {/* Result Modal - Themed as requested */}
      {showResultModal && lastScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-lg">
           <div className={`w-full max-w-[400px] rounded-[32px] p-8 relative overflow-hidden ${
             lastScan.result === 'success' ? 'bg-brand-50' : 'bg-rose-50'
           }`}>
              {/* Background Blobs */}
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50 ${
                lastScan.result === 'success' ? 'bg-indigo-500/20' : 'bg-rose-500/20'
              }`} />
              <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none opacity-50 ${
                lastScan.result === 'success' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
              }`} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
                  lastScan.result === 'success' 
                    ? 'bg-white text-brand-600 shadow-sm' 
                    : 'bg-white text-rose-500 shadow-sm'
                }`}>
                  {lastScan.result === 'success' ? (
                    <CheckCircle className="w-10 h-10" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="w-10 h-10" strokeWidth={1.5} />
                  )}
                </div>

                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-4 ${
                   lastScan.result === 'success' 
                   ? 'bg-brand-100 text-brand-700' 
                   : 'bg-rose-100 text-rose-700'
                }`}>
                  {lastScan.result === 'success' ? 'VERIFIED' : 'ACTION REQUIRED'}
                </span>

                <h2 className="text-2xl text-slate-800 font-[400] mb-2">
                   {lastScan.result === 'success' ? 'Ticket Valid' : 'Invalid Ticket'}
                </h2>
                
                <p className="text-slate-500 text-sm font-[300] mb-8 leading-relaxed max-w-[260px]">
                  {lastScan.message}
                </p>

                {lastScan.wristbandColor && lastScan.result === 'success' && (
                  <div className="mb-6 w-full">
                    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-white/50 rounded-xl border border-white/50">
                      <span className="text-xs text-slate-400">Wristband</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: lastScan.wristbandColor }}
                        />
                        <span className="text-sm font-mono text-slate-600">{lastScan.wristbandColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {lastScan.ticketNumber && (
                   <div className="mb-8 w-full">
                     <div className="flex items-center justify-between px-4 py-3 bg-white/50 rounded-xl border border-white/50">
                        <span className="text-xs text-slate-400">Ticket No.</span>
                        <span className="text-sm font-mono text-slate-600">{lastScan.ticketNumber}</span>
                     </div>
                   </div>
                )}

                <button 
                  onClick={handleScanAgain}
                  className={`w-full py-4 text-white font-[500] rounded-xl text-md flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    lastScan.result === 'success' 
                      ? 'bg-brand-500 focus:ring-brand-500' 
                      : 'bg-rose-500 focus:ring-rose-500'
                  }`}
                >
                  Scan Next Ticket
                </button>
              </div>
           </div>
        </div>
      )}

      {/* History Sidebar */}
      {showHistory && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/5 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white z-50 p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-[400] text-slate-900">Scan History</h2>
              <button 
                onClick={() => setShowHistory(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {scanHistory.length === 0 ? (
                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <History className="w-8 h-8" strokeWidth={1.5} />
                   </div>
                   <p className="text-slate-400 text-sm">No scans recorded yet</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 rounded-[20px] bg-slate-50 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      scan.result === 'success' ? 'bg-brand-100 text-brand-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {scan.result === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-[500] truncate ${
                        scan.result === 'success' ? 'text-slate-900' : 'text-rose-600'
                      }`}>
                        {scan.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 font-mono">
                          {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {scan.ticketNumber && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-xs text-slate-500 font-mono truncate">
                              #{scan.ticketNumber.slice(-6)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
