import { ScannerSession } from '../../database/scanner/scannerSession';
import { ScannerDevice } from '../../database/scanner/scannerDevice';
import { ScanLog } from '../../database/scanner/scanLog';
import { Event } from '../../database/event/event';
import { Ticket } from '../../database/ticket/ticket';
import CustomError from '../../utils/CustomError';
import { isValidObjectId } from '../../utils/isValidObjectId';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Get active scanner session for an event
 */
export const getActiveSessionByEventService = async (eventId: string, hostId: string) => {
  if (!isValidObjectId(eventId)) {
    throw new CustomError('Invalid event ID', 400);
  }

  // Find active session for this event
  const session = await ScannerSession.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
    sessionStatus: 'active'
  });

  if (!session) {
    return null; // No active session
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Get active devices
  const devices = await ScannerDevice.find({ sessionId: session._id })
    .sort({ createdAt: -1 });

  // Get scan statistics
  const scanStats = await ScanLog.aggregate([
    { $match: { sessionId: session._id } },
    {
      $group: {
        _id: '$scanResult',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    success: 0,
    duplicate: 0,
    invalid: 0,
    expired: 0,
    cancelled: 0,
    refunded: 0
  };

  scanStats.forEach((stat: any) => {
    stats[stat._id as keyof typeof stats] = stat.count;
    stats.total += stat.count;
  });

  // Generate scanner URL
  // Generate scanner URL
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://scanner.zenvy.com.bd' 
    : `${process.env.CLIENT_URL || 'http://localhost:3000'}/scanner`;

  const scannerUrl = `${baseUrl}?token=${session.accessToken}`;

  return {
    session: {
      _id: session._id,
      eventId: session.eventId,
      sessionStatus: session.sessionStatus,
      maxDevices: session.maxDevices,
      activeDeviceCount: session.activeDeviceCount,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt
    },
    devices: devices.map(d => ({
      _id: d._id,
      deviceName: d.deviceName,
      totalScans: d.totalScans,
      lastSeen: d.lastSeen,
      isOnline: d.isOnline,
      createdAt: d.createdAt
    })),
    stats,
    scannerUrl
  };
};

/**
 * Get all tickets for offline caching
 */
export const getTicketsForOfflineCacheService = async (sessionId: string, deviceId: string) => {
  console.log('📥 Ticket cache request received:', { sessionId, deviceId });
  
  if (!isValidObjectId(sessionId)) {
    console.error('❌ Invalid session ID:', sessionId);
    throw new CustomError('Invalid session ID', 400);
  }

  // Find session
  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    console.error('❌ Session not found:', sessionId);
    throw new CustomError('Session not found', 404);
  }

  console.log('✅ Session found:', { 
    sessionId: session._id, 
    eventId: session.eventId,
    status: session.sessionStatus 
  });

  if (session.sessionStatus !== 'active') {
    console.error('❌ Session is not active:', session.sessionStatus);
    throw new CustomError('Session is not active', 400);
  }

  // Verify device belongs to this session
  const device = await ScannerDevice.findOne({
    _id: new mongoose.Types.ObjectId(deviceId),
    sessionId: session._id
  });

  if (!device) {
    console.error('❌ Device not authorized:', { deviceId, sessionId });
    throw new CustomError('Device not authorized for this session', 403);
  }

  console.log('✅ Device authorized:', { 
    deviceId: device._id, 
    deviceName: device.deviceName 
  });

  // Get all valid tickets for this event
  console.log('🔍 Fetching tickets for event:', session.eventId);
  const tickets = await Ticket.find({
    eventId: session.eventId,
    status: { $in: ['valid', 'cancelled', 'refunded'] } // Include all for proper offline validation
  })
    .select('ticketNumber ticketType status holderName qrCode')
    .lean(); // Performance optimization

  console.log(`✅ Found ${tickets.length} tickets for caching`);
  
  if (tickets.length > 0) {
    console.log('Sample tickets:', tickets.slice(0, 2).map(t => ({
      ticketNumber: t.ticketNumber,
      ticketType: t.ticketType,
      status: t.status,
      hasQrCode: !!t.qrCode,
      qrCodePreview: t.qrCode?.substring(0, 16) + '...'
    })));
  }

  const result = {
    tickets: tickets.map(t => ({
      ticketId: t._id.toString(),
      ticketNumber: t.ticketNumber,
      ticketType: t.ticketType,
      status: t.status,
      holderName: t.holderName,
      eventId: session.eventId.toString(),
      qrHash: t.qrCode // QR code hash for offline lookup
    })),
    eventId: session.eventId.toString(),
    cachedAt: new Date()
  };

  console.log('📤 Sending cache response:', { 
    ticketCount: result.tickets.length,
    eventId: result.eventId 
  });

  return result;
};

/**
 * Generate OTP for device pairing
 */
export const generatePairingOTPService = async (sessionId: string, hostId: string) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  if (session.sessionStatus !== 'active') {
    throw new CustomError('Session is not active', 400);
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  session.pairingOTP = {
    code: otpCode,
    expiresAt: otpExpiresAt,
    used: false
  };

  await session.save();

  return {
    success: true,
    otp: otpCode,
    expiresAt: otpExpiresAt,
    validFor: 300 // seconds
  };
};

/**
 * Verify OTP for device pairing
 */
export const verifyPairingOTPService = async (accessToken: string, otpCode: string) => {
  // Find session by access token
  const session = await ScannerSession.findOne({ accessToken });
  if (!session) {
    throw new CustomError('Invalid session', 404);
  }

  if (session.sessionStatus !== 'active') {
    throw new CustomError('Session is not active', 400);
  }

  // Check if OTP exists
  if (!session.pairingOTP || !session.pairingOTP.code) {
    throw new CustomError('No OTP generated for this session', 400);
  }

  // Check if OTP is already used
  if (session.pairingOTP.used) {
    throw new CustomError('OTP has already been used', 400);
  }

  // Check if OTP is expired
  if (new Date() > session.pairingOTP.expiresAt) {
    throw new CustomError('OTP has expired', 400);
  }

  // Verify OTP code
  if (session.pairingOTP.code !== otpCode) {
    throw new CustomError('Invalid OTP code', 400);
  }

  // Mark OTP as used
  session.pairingOTP.used = true;
  await session.save();

  return {
    success: true,
    message: 'OTP verified successfully',
    sessionId: session._id.toString(),
    eventId: session.eventId.toString()
  };
};

/**
 * Check if a device can rejoin without OTP
 */
export const checkDeviceCanRejoinService = async (accessToken: string, userAgent: string) => {
  console.log('🔍 Checking device rejoin eligibility:', { userAgent: userAgent.substring(0, 50) + '...' });
  
  // Find session by access token
  const session = await ScannerSession.findOne({ accessToken });
  if (!session) {
    console.log('❌ Session not found');
    throw new CustomError('Invalid session', 404);
  }

  if (session.sessionStatus !== 'active') {
    console.log('❌ Session is not active:', session.sessionStatus);
    throw new CustomError('Session is not active', 400);
  }

  console.log('✅ Session found:', { sessionId: session._id, status: session.sessionStatus });

  // Check if a device with this userAgent exists in this session
  const existingDevice = await ScannerDevice.findOne({
    sessionId: session._id,
    userAgent: userAgent
  });

  if (!existingDevice) {
    console.log('❌ No existing device found for this userAgent');
    return {
      canSkipOTP: false,
      message: 'New device - OTP required'
    };
  }

  // Check if device is disabled
  if (existingDevice.status === 'disabled') {
    console.log('❌ Device is disabled:', existingDevice._id);
    return {
      canSkipOTP: false,
      message: 'Device disabled - OTP required'
    };
  }

  console.log('✅ Existing device found:', { 
    deviceId: existingDevice._id, 
    deviceName: existingDevice.deviceName,
    status: existingDevice.status
  });

  return {
    canSkipOTP: true,
    message: 'Welcome back!',
    device: {
      deviceId: existingDevice._id.toString(),
      deviceName: existingDevice.deviceName,
      totalScans: existingDevice.totalScans
    }
  };
};

/**
 * Disable a device
 */
export const disableDeviceService = async (deviceId: string, sessionId: string, hostId: string) => {
  if (!isValidObjectId(deviceId) || !isValidObjectId(sessionId)) {
    throw new CustomError('Invalid device or session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  const device = await ScannerDevice.findOne({
    _id: new mongoose.Types.ObjectId(deviceId),
    sessionId: session._id
  });

  if (!device) {
    throw new CustomError('Device not found', 404);
  }

  device.status = 'disabled';
  await device.save();

  // Decrement active device count
  session.activeDeviceCount = Math.max(0, session.activeDeviceCount - 1);
  await session.save();

  return {
    success: true,
    message: 'Device disabled successfully'
  };
};

/**
 * Re-enable a disabled device
 */
export const enableDeviceService = async (deviceId: string, sessionId: string, hostId: string) => {
  if (!isValidObjectId(deviceId) || !isValidObjectId(sessionId)) {
    throw new CustomError('Invalid device or session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  const device = await ScannerDevice.findOne({
    _id: new mongoose.Types.ObjectId(deviceId),
    sessionId: session._id
  });

  if (!device) {
    throw new CustomError('Device not found', 404);
  }

  device.status = 'active';
  device.revokedAt = undefined;
  await device.save();

  // Increment active device count
  session.activeDeviceCount += 1;
  await session.save();

  return {
    success: true,
    message: 'Device re-enabled successfully'
  };
};

/**
 * Force logout a device (revoke access)
 */
export const forceLogoutDeviceService = async (deviceId: string, sessionId: string, hostId: string) => {
  if (!isValidObjectId(deviceId) || !isValidObjectId(sessionId)) {
    throw new CustomError('Invalid device or session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  const device = await ScannerDevice.findOne({
    _id: new mongoose.Types.ObjectId(deviceId),
    sessionId: session._id
  });

  if (!device) {
    throw new CustomError('Device not found', 404);
  }

  device.status = 'disabled';
  device.revokedAt = new Date();
  await device.save();

  // Decrement active device count
  session.activeDeviceCount = Math.max(0, session.activeDeviceCount - 1);
  await session.save();

  return {
    success: true,
    message: 'Device logged out successfully'
  };
};

/**
 * Update device status (battery, gate, last scan)
 */
export const updateDeviceStatusService = async (
  deviceId: string,
  updates: { battery?: number; gate?: string; lastScanAt?: Date }
) => {
  if (!isValidObjectId(deviceId)) {
    throw new CustomError('Invalid device ID', 400);
  }

  const device = await ScannerDevice.findById(deviceId);
  if (!device) {
    throw new CustomError('Device not found', 404);
  }

  if (updates.battery !== undefined) {
    device.battery = updates.battery;
  }
  if (updates.gate !== undefined) {
    device.gate = updates.gate;
  }
  if (updates.lastScanAt !== undefined) {
    device.lastScanAt = updates.lastScanAt;
  }

  await device.save();

  return {
    success: true,
    message: 'Device status updated'
  };
};

/**
 * Create a new scanner session for an event
 */
export const createScannerSessionService = async (
  eventId: string,
  hostId: string,
  maxDevices: number = 5
) => {
  if (!isValidObjectId(eventId)) {
    throw new CustomError('Invalid event ID', 400);
  }

  if (!isValidObjectId(hostId)) {
    throw new CustomError('Invalid host ID', 400);
  }

  // Verify event exists and belongs to host
  const event = await Event.findById(eventId);
  if (!event) {
    throw new CustomError('Event not found', 404);
  }

  if (event.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized: You do not own this event', 403);
  }

  // Check if active session already exists
  const existingSession = await ScannerSession.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
    sessionStatus: 'active'
  });

  if (existingSession) {
    throw new CustomError('An active scanner session already exists for this event', 400);
  }

  // Calculate expiry time (event end + 3 hours)
  const eventEndDate = event.schedule?.endDate || event.schedule?.startDate;
  if (!eventEndDate) {
    throw new CustomError('Event must have a schedule with end date', 400);
  }

  const expiresAt = new Date(eventEndDate);
  expiresAt.setHours(expiresAt.getHours() + 3);

  // Generate session access token (JWT)
  const accessToken = jwt.sign(
    {
      sessionId: new mongoose.Types.ObjectId().toString(),
      eventId,
      hostId,
      type: 'scanner_session'
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token valid for 7 days or until session closes
  );

  // Create session
  const session = new ScannerSession({
    eventId: new mongoose.Types.ObjectId(eventId),
    hostId: new mongoose.Types.ObjectId(hostId),
    accessToken,
    maxDevices,
    expiresAt
  });

  await session.save();

  // Generate scanner access URL
  // Generate scanner access URL
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://scanner.zenvy.com.bd' 
    : `${process.env.CLIENT_URL || 'http://localhost:3000'}/scanner`;
    
  const scannerUrl = `${baseUrl}?token=${accessToken}`;

  return {
    success: true,
    session: {
      _id: session._id,
      eventId: session.eventId,
      eventTitle: event.title,
      sessionStatus: session.sessionStatus,
      maxDevices: session.maxDevices,
      activeDeviceCount: session.activeDeviceCount,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt
    },
    scannerUrl,
    accessToken
  };
};

/**
 * Join a scanner session (device registration)
 */
export const joinScannerSessionService = async (
  accessToken: string,
  deviceName: string,
  userAgent: string
) => {
  // Verify token
  let decoded: any;
  try {
    decoded = jwt.verify(accessToken, JWT_SECRET);
  } catch (error) {
    throw new CustomError('Invalid or expired access token', 401);
  }

  if (decoded.type !== 'scanner_session') {
    throw new CustomError('Invalid token type', 401);
  }

  // Find session
  const session = await ScannerSession.findOne({ accessToken });
  if (!session) {
    throw new CustomError('Scanner session not found', 404);
  }

  // Check if session is active
  if (!session.isActive()) {
    throw new CustomError('Scanner session is no longer active', 403);
  }

  // Check device limit
  if (!session.canAddDevice()) {
    throw new CustomError(`Maximum device limit (${session.maxDevices}) reached`, 403);
  }

  // Check if device already exists (by name and userAgent)
  let device = await ScannerDevice.findOne({
    sessionId: session._id,
    deviceName,
    userAgent
  });

  if (device) {
    // Device rejoining - update last seen
    await device.updateActivity();
  } else {
    // New device - create it
    device = new ScannerDevice({
      sessionId: session._id,
      deviceName,
      userAgent
    });
    await device.save();

    // Increment active device count
    session.activeDeviceCount += 1;
    await session.save();
  }

  // Get event details
  const event = await Event.findById(session.eventId);

  return {
    success: true,
    device: {
      _id: device._id,
      deviceName: device.deviceName,
      totalScans: device.totalScans,
      createdAt: device.createdAt
    },
    session: {
      _id: session._id,
      eventId: session.eventId,
      eventTitle: event?.title,
      eventDate: event?.schedule?.startDate,
      expiresAt: session.expiresAt
    }
  };
};

/**
 * Verify a ticket (scan)
 */
export const verifyTicketScanService = async (
  qrData: string,
  accessToken: string,
  deviceId: string
) => {
  // Verify session token
  let decoded: any;
  try {
    decoded = jwt.verify(accessToken, JWT_SECRET);
  } catch (error) {
    throw new CustomError('Invalid or expired access token', 401);
  }

  // Find session
  const session = await ScannerSession.findOne({ accessToken });
  if (!session || !session.isActive()) {
    throw new CustomError('Scanner session is not active', 403);
  }

  // Verify device belongs to session
  if (!isValidObjectId(deviceId)) {
    throw new CustomError('Invalid device ID', 400);
  }

  const device = await ScannerDevice.findOne({
    _id: new mongoose.Types.ObjectId(deviceId),
    sessionId: session._id
  });

  if (!device) {
    throw new CustomError('Device not found in this session', 404);
  }

  // Check if device is disabled or revoked
  if (device.status === 'disabled') {
    throw new CustomError('This device has been disabled. Please contact the event host.', 403);
  }

  if (device.revokedAt) {
    throw new CustomError('This device access has been revoked. Please contact the event host.', 403);
  }

  // Update device activity
  await device.updateActivity();

  // Find ticket by QR code (do NOT use .lean() - we need .save() to persist check-in)
  const ticket = await Ticket.findOne({ qrCode: qrData })
    .select('_id ticketNumber eventId userId status checkInStatus checkedInAt validUntil ticketType ticketVariantId eventTitle');
  if (!ticket) {
    // Log failed scan
    await new ScanLog({
      ticketId: null,
      eventId: session.eventId,
      sessionId: session._id,
      deviceId: device._id,
      scanResult: 'invalid',
      offlineScanned: false
    }).save();

    return {
      valid: false,
      reason: 'INVALID_QR',
      message: 'Ticket not found'
    };
  }

  // Verify ticket belongs to this event
  if (ticket.eventId.toString() !== session.eventId.toString()) {
    await new ScanLog({
      ticketId: ticket._id,
      eventId: session.eventId,
      sessionId: session._id,
      deviceId: device._id,
      scanResult: 'invalid',
      offlineScanned: false,
      ticketNumber: ticket.ticketNumber,
      deviceName: device.deviceName
    }).save();

    return {
      valid: false,
      reason: 'WRONG_EVENT',
      message: 'This ticket is for a different event'
    };
  }

  // Check ticket status
  if (ticket.status !== 'valid') {
    const scanResult = ticket.status === 'cancelled' ? 'cancelled' :
                       ticket.status === 'refunded' ? 'refunded' : 'invalid';

    await new ScanLog({
      ticketId: ticket._id,
      eventId: session.eventId,
      sessionId: session._id,
      deviceId: device._id,
      scanResult,
      offlineScanned: false,
      ticketNumber: ticket.ticketNumber,
      deviceName: device.deviceName
    }).save();

    return {
      valid: false,
      reason: 'TICKET_' + ticket.status.toUpperCase(),
      message: `Ticket is ${ticket.status}`
    };
  }

  // Check if already checked in
  if (ticket.checkInStatus === 'checked_in') {
    await new ScanLog({
      ticketId: ticket._id,
      eventId: session.eventId,
      sessionId: session._id,
      deviceId: device._id,
      scanResult: 'duplicate',
      offlineScanned: false,
      ticketNumber: ticket.ticketNumber,
      deviceName: device.deviceName
    }).save();

    return {
      valid: false,
      reason: 'ALREADY_CHECKED_IN',
      message: 'Ticket already used',
      checkedInAt: ticket.checkedInAt
    };
  }

  // Check if expired
  if (ticket.validUntil && new Date() > new Date(ticket.validUntil)) {
    await new ScanLog({
      ticketId: ticket._id,
      eventId: session.eventId,
      sessionId: session._id,
      deviceId: device._id,
      scanResult: 'expired',
      offlineScanned: false,
      ticketNumber: ticket.ticketNumber,
      deviceName: device.deviceName
    }).save();

    return {
      valid: false,
      reason: 'TICKET_EXPIRED',
      message: 'Ticket has expired'
    };
  }

  // All checks passed - mark ticket as checked in
  ticket.checkInStatus = 'checked_in';
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = device._id as any;
  ticket.status = 'used';
  await ticket.save();

  // Get wristband color from event's ticket variant
  let wristbandColor = '#4f46e5'; // Default color
  try {
    const event = await Event.findById(session.eventId);
    if (event && event.tickets) {
      const ticketVariant = event.tickets.find(
        (t: any) => t._id.toString() === ticket.ticketVariantId.toString()
      );
      if (ticketVariant && ticketVariant.wristbandColor) {
        wristbandColor = ticketVariant.wristbandColor;
      }
    }
  } catch (error) {
    console.error('Error fetching wristband color:', error);
    // Continue with default color
  }

  // Log successful scan
  await new ScanLog({
    ticketId: ticket._id,
    eventId: session.eventId,
    sessionId: session._id,
    deviceId: device._id,
    scanResult: 'success',
    offlineScanned: false,
    ticketNumber: ticket.ticketNumber,
    deviceName: device.deviceName
  }).save();

  // Update device activity and scan count
  await device.incrementScans();

  return {
    valid: true,
    message: 'Ticket verified successfully',
    ticket: {
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      eventTitle: ticket.eventTitle,
      checkedInAt: ticket.checkedInAt,
      wristbandColor: wristbandColor
    }
  };
};

/**
 * Get session details with active devices
 */
export const getSessionDetailsService = async (sessionId: string, hostId: string) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Get active devices
  const devices = await ScannerDevice.find({ sessionId: session._id })
    .sort({ createdAt: -1 });

  // Get scan statistics
  const scanStats = await ScanLog.aggregate([
    { $match: { sessionId: session._id } },
    {
      $group: {
        _id: '$scanResult',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    success: 0,
    duplicate: 0,
    invalid: 0,
    expired: 0,
    cancelled: 0,
    refunded: 0
  };

  scanStats.forEach((stat: any) => {
    stats[stat._id as keyof typeof stats] = stat.count;
    stats.total += stat.count;
  });

  return {
    session: {
      _id: session._id,
      eventId: session.eventId,
      sessionStatus: session.sessionStatus,
      maxDevices: session.maxDevices,
      activeDeviceCount: session.activeDeviceCount,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      pairingOTP: session.pairingOTP // Include OTP status for auto-refresh
    },
    devices: devices.map(d => ({
      _id: d._id,
      deviceName: d.deviceName,
      totalScans: d.totalScans,
      lastSeen: d.lastSeen,
      isOnline: d.isOnline,
      createdAt: d.createdAt,
      status: d.status,
      revokedAt: d.revokedAt
    })),
    stats
  };
};

/**
 * Close a scanner session
 */
export const closeScannerSessionService = async (sessionId: string, hostId: string) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  // Verify ownership
  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  await session.close();

  return {
    success: true,
    message: 'Scanner session closed successfully'
  };
};

/**
 * EMERGENCY MANUAL VERIFICATION
 * Lookup ticket by ID for manual verification
 * Returns minimal data only (no sensitive info)
 */
export const lookupTicketByIdService = async (
  ticketId: string,
  sessionId: string,
  hostId: string
) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  // Verify session exists and belongs to host
  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Find ticket by ticket number (not MongoDB ID)
  const ticket = await Ticket.findOne({ ticketNumber: ticketId });
  
  if (!ticket) {
    return {
      found: false,
      message: 'Ticket not found'
    };
  }

  // Verify ticket belongs to this event
  if (ticket.eventId.toString() !== session.eventId.toString()) {
    return {
      found: false,
      message: 'This ticket is for a different event'
    };
  }

  // Get wristband color from event's ticket variant
  let wristbandColor = '#4f46e5';
  try {
    const event = await Event.findById(session.eventId);
    if (event && event.tickets) {
      const ticketVariant = event.tickets.find(
        (t: any) => t._id.toString() === ticket.ticketVariantId.toString()
      );
      if (ticketVariant && ticketVariant.wristbandColor) {
        wristbandColor = ticketVariant.wristbandColor;
      }
    }
  } catch (error) {
    console.error('Error fetching wristband color:', error);
  }

  // Get check-in history for this ticket
  const checkInHistory = await ScanLog.find({
    ticketId: ticket._id,
    scanResult: 'success'
  })
    .sort({ scanTimestamp: -1 })
    .limit(10)
    .populate('manualVerifiedBy', 'name email')
    .lean();

  // Return minimal verification payload
  return {
    found: true,
    ticket: {
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      holderName: 'Registered User', // Don't expose actual name for privacy
      wristbandColor: wristbandColor,
      status: ticket.status,
      checkInStatus: ticket.checkInStatus,
      isCheckedIn: ticket.checkInStatus === 'checked_in',
      checkedInAt: ticket.checkedInAt,
      isExpired: new Date() > ticket.validUntil,
      checkInHistory: checkInHistory.map(log => ({
        timestamp: log.scanTimestamp,
        isManual: log.isManualOverride,
        deviceName: log.deviceName,
        verifiedBy: log.manualVerifiedBy ? (log.manualVerifiedBy as any).name : null
      }))
    }
  };
};

/**
 * Manual check-in with full audit trail
 */
export const manualCheckInService = async (
  ticketId: string,
  sessionId: string,
  hostId: string,
  notes?: string,
  ipAddress?: string
) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  // Verify session
  const session = await ScannerSession.findById(sessionId);
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  if (session.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Find ticket
  const ticket = await Ticket.findOne({ ticketNumber: ticketId.toUpperCase() });
  
  if (!ticket) {
    throw new CustomError('Ticket not found', 404);
  }

  // Verify ticket belongs to this event
  if (ticket.eventId.toString() !== session.eventId.toString()) {
    throw new CustomError('This ticket is for a different event', 400);
  }

  // Check if already checked in
  if (ticket.checkInStatus === 'checked_in') {
    throw new CustomError('Ticket already checked in', 400);
  }

  // Check ticket status
  if (ticket.status !== 'valid') {
    const statusMessage = ticket.status === 'cancelled' ? 'Ticket has been cancelled' :
                         ticket.status === 'refunded' ? 'Ticket has been refunded' :
                         'Ticket is not valid';
    throw new CustomError(statusMessage, 400);
  }

  // Check if expired
  if (new Date() > ticket.validUntil) {
    throw new CustomError('Ticket has expired', 400);
  }

  // Mark ticket as checked in
  ticket.checkInStatus = 'checked_in';
  ticket.checkedInAt = new Date();
  ticket.status = 'used';
  await ticket.save();

  // Create scan log with manual override flag
  await new ScanLog({
    ticketId: ticket._id,
    eventId: session.eventId,
    sessionId: session._id,
    deviceId: session._id, // Use session ID as placeholder for manual check-ins
    scanResult: 'success',
    offlineScanned: false,
    ticketNumber: ticket.ticketNumber,
    deviceName: 'Manual Override',
    isManualOverride: true,
    manualVerifiedBy: new mongoose.Types.ObjectId(hostId),
    manualVerificationNotes: notes || 'Emergency manual check-in',
    manualVerificationIP: ipAddress
  }).save();

  return {
    success: true,
    message: 'Ticket checked in successfully',
    ticket: {
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      checkedInAt: ticket.checkedInAt
    }
  };
};

/**
 * Search tickets by partial ticket number for autocomplete
 */
export const searchTicketsService = async (
  sessionId: string,
  query: string,
  hostId: string
) => {
  if (!isValidObjectId(sessionId)) {
    throw new CustomError('Invalid session ID', 400);
  }

  if (!query || query.length < 2) {
    throw new CustomError('Search query must be at least 2 characters', 400);
  }

  // Sanitize query - alphanumeric and hyphens only
  const sanitizedQuery = query.replace(/[^a-zA-Z0-9-]/g, '');
  if (!sanitizedQuery) {
    throw new CustomError('Invalid search query', 400);
  }

  // Find session and verify ownership
  const session = await ScannerSession.findById(sessionId).populate('eventId');
  if (!session) {
    throw new CustomError('Session not found', 404);
  }

  const event = await Event.findById(session.eventId);
  if (!event) {
    throw new CustomError('Event not found', 404);
  }

  if (event.hostId.toString() !== hostId) {
    throw new CustomError('Unauthorized - not event host', 403);
  }

  // Search tickets by partial match (case-insensitive)
  // Include 'used' so already-checked-in tickets appear in manual lookup
  const tickets = await Ticket.find({
    eventId: session.eventId,
    status: { $in: ['valid', 'used', 'cancelled', 'refunded'] },
    ticketNumber: { $regex: sanitizedQuery, $options: 'i' }
  })
    .limit(10) // Max 10 results
    .select('ticketNumber ticketType holderName status checkInStatus checkedInAt')
    .sort({ ticketNumber: 1 })
    .lean();

  return {
    tickets: tickets.map(t => ({
      ticketId: t._id.toString(),
      ticketNumber: t.ticketNumber,
      ticketType: t.ticketType,
      holderName: t.holderName || 'Guest',
      status: t.status,
      checkInStatus: t.checkInStatus,
      checkedInAt: t.checkedInAt
    })),
    query: sanitizedQuery,
    count: tickets.length
  };
};
