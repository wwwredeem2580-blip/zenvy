import { apiClient } from './client';

export interface ScannerSession {
  _id: string;
  eventId: string;
  eventTitle?: string;
  sessionStatus: 'active' | 'closed';
  maxDevices: number;
  activeDeviceCount: number;
  expiresAt: string;
  createdAt: string;
  pairingOTP?: {
    code: string;
    expiresAt: Date;
    used: boolean;
  };
}

export interface ScannerDevice {
  _id: string;
  deviceName: string;
  totalScans: number;
  lastSeen: string;
  isOnline: boolean;
  createdAt: string;
  status?: 'active' | 'disabled';
  revokedAt?: string;
}

export interface ScanStats {
  total: number;
  success: number;
  duplicate: number;
  invalid: number;
  expired: number;
  cancelled: number;
  refunded: number;
}

export interface SessionDetailsResponse {
  session: ScannerSession;
  devices: ScannerDevice[];
  stats: ScanStats;
}

export interface CreateSessionResponse {
  success: boolean;
  session: ScannerSession;
  scannerUrl: string;
  accessToken: string;
}

class ScannerService {
  /**
   * Create a new scanner session for an event
   */
  async createSession(eventId: string, maxDevices: number = 5): Promise<CreateSessionResponse> {
    return await apiClient.post('/api/scanner/session/create', { eventId, maxDevices });
  }

  /**
   * Get active scanner session for an event
   */
  async getActiveSessionByEvent(eventId: string): Promise<SessionDetailsResponse & { scannerUrl?: string } | null> {
    return await apiClient.get(`/api/scanner/session/event/${eventId}`);
  }

  /**
   * Get session details with devices and stats
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
    return await apiClient.get(`/api/scanner/session/${sessionId}`);
  }

  /**
   * Join a scanner session (device registration)
   */
  async joinSession(accessToken: string, deviceName: string): Promise<{
    success: boolean;
    device: {
      _id: string;
      deviceName: string;
      totalScans: number;
      createdAt: string;
    };
    session: {
      _id: string;
      eventId: string;
      eventTitle: string;
      eventDate: string;
      expiresAt: string;
    };
  }> {
    return await apiClient.post('/api/scanner/session/join', {
      accessToken,
      deviceName,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    });
  }

  /**
   * Verify a ticket scan
   */
  async verifyTicket(qrData: string, accessToken: string, deviceId: string): Promise<{
    valid: boolean;
    reason?: string;
    message: string;
    ticket?: {
      ticketNumber: string;
      ticketType: string;
      eventTitle: string;
      checkedInAt: Date;
      wristbandColor: string;
    };
    checkedInAt?: Date;
  }> {
    return await apiClient.post('/api/scanner/verify', {
      qrData,
      accessToken,
      deviceId
    });
  }

  /**
   * Get tickets for offline caching
   */
  async getTicketsForCache(sessionId: string, deviceId: string): Promise<{
    tickets: Array<{
      ticketId: string;
      ticketNumber: string;
      ticketType: string;
      status: string;
      holderName?: string;
      eventId: string;
      qrHash: string; // QR code hash for offline lookup
    }>;
    eventId: string;
    cachedAt: Date;
  }> {
    return await apiClient.get(`/api/scanner/tickets/${sessionId}?deviceId=${deviceId}`);
  }

  /**
   * Generate OTP for device pairing
   */
  async generateOTP(sessionId: string): Promise<{
    success: boolean;
    otp: string;
    expiresAt: Date;
    validFor: number;
  }> {
    return await apiClient.post(`/api/scanner/session/${sessionId}/generate-otp`, {});
  }

  /**
   * Verify OTP before joining session
   */
  async verifyOTP(accessToken: string, otpCode: string): Promise<{
    success: boolean;
    message: string;
    sessionId: string;
    eventId: string;
  }> {
    return await apiClient.post('/api/scanner/session/verify-otp', {
      accessToken,
      otpCode
    });
  }

  /**
   * Check if device can rejoin without OTP
   */
  async checkDeviceCanRejoin(accessToken: string): Promise<{
    canSkipOTP: boolean;
    message: string;
    device?: {
      deviceId: string;
      deviceName: string;
      totalScans: number;
    };
  }> {
    return await apiClient.post('/api/scanner/session/check-device', {
      accessToken
    });
  }

  /**
   * Disable a device
   */
  async disableDevice(deviceId: string, sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiClient.put(`/api/scanner/device/${deviceId}/disable`, { sessionId });
  }

  /**
   * Re-enable a disabled device
   */
  async enableDevice(deviceId: string, sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiClient.put(`/api/scanner/device/${deviceId}/enable`, { sessionId });
  }

  /**
   * Force logout a device
   */
  async forceLogoutDevice(deviceId: string, sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiClient.post(`/api/scanner/device/${deviceId}/logout`, { sessionId });
  }

  /**
   * Update device status (battery, gate, last scan)
   */
  async updateDeviceStatus(deviceId: string, updates: {
    battery?: number;
    gate?: string;
    lastScanAt?: Date;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiClient.put(`/api/scanner/device/${deviceId}/status`, updates);
  }

  /**
   * Sync offline scans to server (batched)
   */
  async syncOfflineScans(
    accessToken: string,
    deviceId: string,
    scans: Array<{
      ticketId: string;
      qrData: string;
      scanTimestamp: string;
      localScanId: string;
    }>
  ): Promise<{
    success: boolean;
    synced: number;
    rejected: number;
    conflicts: number;
    results: {
      accepted: string[];
      rejected: { localScanId: string; reason: string }[];
      conflicts: { localScanId: string; reason: string }[];
    };
  }> {
    return await apiClient.post('/api/scanner/sync', {
      accessToken,
      deviceId,
      scans
    });
  }

  /**
   * Close a scanner session
   */
  async closeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/api/scanner/session/${sessionId}/close`, {});
  }

  /**
   * Emergency manual verification - lookup ticket by ID
   */
  async lookupTicket(ticketId: string, sessionId: string): Promise<{
    found: boolean;
    message?: string;
    ticket?: {
      ticketNumber: string;
      ticketType: string;
      holderName: string;
      wristbandColor: string;
      status: string;
      checkInStatus: string;
      isCheckedIn: boolean;
      checkedInAt?: Date;
      isExpired: boolean;
      checkInHistory: Array<{
        timestamp: Date;
        isManual: boolean;
        deviceName: string;
        verifiedBy: string | null;
      }>;
    };
  }> {
    return await apiClient.post(`/api/scanner/session/${sessionId}/lookup-ticket`, { ticketId });
  }

  /**
   * Emergency manual check-in with audit trail
   */
  async manualCheckIn(ticketId: string, sessionId: string, notes?: string): Promise<{
    success: boolean;
    message: string;
    ticket: {
      ticketNumber: string;
      ticketType: string;
      checkedInAt: Date;
    };
  }> {
    return await apiClient.post(`/api/scanner/session/${sessionId}/manual-checkin`, { ticketId, notes });
  }

  /**
   * Search tickets by partial ticket number for autocomplete
   */
  async searchTickets(sessionId: string, query: string): Promise<{
    tickets: Array<{
      ticketId: string;
      ticketNumber: string;
      ticketType: string;
      holderName: string;
      status: string;
      checkInStatus: string;
      checkedInAt?: Date;
    }>;
    query: string;
    count: number;
  }> {
    return await apiClient.get(`/api/scanner/session/${sessionId}/search-tickets?query=${encodeURIComponent(query)}`);
  }

  /**
   * Download ticket sheet PDF for an event
   */
  async downloadTicketSheet(eventId: string): Promise<{
    blob: Blob;
    ticketCount: number;
    generatedAt: Date;
  }> {
    const response = await fetch(
      `${process.env.NODE_ENV === 
          'development' ? 
          `${process.env.NEXT_PUBLIC_API_URL}/scanner/event/${eventId}/ticket-sheet` : 
          `${process.env.NEXT_PUBLIC_API_URL}/api/scanner/event/${eventId}/ticket-sheet`}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/pdf'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to generate PDF' }));
      throw new Error(error.message || 'Failed to generate PDF');
    }

    // Get metadata from headers
    const ticketCount = parseInt(response.headers.get('X-Ticket-Count') || '0');
    const generatedAtStr = response.headers.get('X-Generated-At');
    const generatedAt = generatedAtStr ? new Date(generatedAtStr) : new Date();

    // Get PDF blob
    const blob = await response.blob();

    return {
      blob,
      ticketCount,
      generatedAt
    };
  }
}

export const scannerService = new ScannerService();