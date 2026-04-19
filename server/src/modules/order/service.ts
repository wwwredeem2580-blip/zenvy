import mongoose from 'mongoose';
import { Order } from '../../database/order/order';
import { User } from '../../database/auth/auth';
import { Event } from '../../database/event/event';
import { Payment } from '../../database/payment/payment';
import CustomError from '../../utils/CustomError';
import { initiatePaystationPayment, verifyPaystationTransaction } from '../../utils/order/paystation';
import { completeOrder } from '../../utils/order/completeOrder';
import { generateOrderNumber } from '../../utils/order/generateOrderNumber';
import { calculatePricing } from '../../utils/order/calculatePricing';
import { updateEventMetrics } from '../../utils/order/updateEventMetrics';
import { createTicket } from '../../utils/order/ticket';
import { handlePaymentFailure } from '../../utils/order/payment';
import { invalidatePDFCache } from '../../lib/redis';

const FREE_TICKET_LIMITS = {
  maxPerUser: 2,
  maxPerUserTotal: 5,
};

const GENERAL_TICKET_LIMITS = {
  maxPerEvent: 100,
  maxPerTier: 50
};

async function validateTicketLimits(userId: string, eventId: string, requestedTickets: any[]) {
  // Get all active orders for this user and event
  const existingOrders = await Order.find({
    userId,
    eventId,
    status: { $in: ['confirmed', 'pending'] }
  })
    .select('tickets')
    .lean(); // Performance optimization

  // Calculate total tickets bought for this event
  const currentTotalTickets = existingOrders.reduce((sum, order) => {
    return sum + order.tickets.reduce((tSum: number, t: any) => tSum + t.quantity, 0);
  }, 0);

  const requestedTotal = requestedTickets.reduce((sum: number, t: any) => sum + t.quantity, 0);

  if (currentTotalTickets + requestedTotal > GENERAL_TICKET_LIMITS.maxPerEvent) {
    throw new CustomError(
      `You can only purchase a maximum of ${GENERAL_TICKET_LIMITS.maxPerEvent} tickets per event. You have already booked ${currentTotalTickets}.`,
      400
    );
  }

  // Calculate limits per tier
  for (const requestedTicket of requestedTickets) {
    const currentTierCount = existingOrders.reduce((sum, order) => {
      const tierTickets = order.tickets.filter((t: any) => t.ticketVariantId.toString() === requestedTicket.ticketVariantId);
      return sum + tierTickets.reduce((tSum: number, t: any) => tSum + t.quantity, 0);
    }, 0);

    if (currentTierCount + requestedTicket.quantity > GENERAL_TICKET_LIMITS.maxPerTier) {
      throw new CustomError(
        `You can only purchase a maximum of ${GENERAL_TICKET_LIMITS.maxPerTier} tickets for "${requestedTicket.variantName}". You have already booked ${currentTierCount}.`,
        400
      );
    }
  }
}



// Create new order
export const createOrderService = async (data: any) => {
  // Validate event exists and is available for purchase
  const event = await Event.findById(data.eventId);
  if (!event) {
    throw new CustomError('Event not found', 404);
  }

  if (!(event.status === 'published' || event.status === 'live')) {
    throw new CustomError('Event is not available for purchase', 400);
  }

  // Check if event has ended
  if (event.schedule && event.schedule.endDate < new Date()) {
    throw new CustomError('Event has already ended', 400);
  }
  
  if (event.moderation.sales.paused) {
    throw new CustomError('Event sales are paused. Please come back later', 400);
  }

  if(event.moderation.visibility === 'unlisted') {
    throw new CustomError('Event is unlisted from our platform as we are ensuring its validity, please wait for it to be listed', 400);
  }

  // Validate aggregate ticket limits
  await validateTicketLimits(data.userId, data.eventId, data.tickets);

  // Validate ticket variants and check availability
  for (const ticketReq of data.tickets) {
    const ticketVariant = event.tickets?.find((t: any) => t._id?.toString() === ticketReq.ticketVariantId);
    if (!ticketVariant) {
      throw new CustomError(`Ticket variant "${ticketReq.variantName}" not found`, 400);
    }

    // Check if ticket variant is active
    if (!ticketVariant.isActive) {
      throw new CustomError(`Ticket variant "${ticketReq.variantName}" is not for sale`, 400);
    }

    // Check available quantity
    const availableQuantity = ticketVariant.quantity - ticketVariant.sold;
    if (ticketReq.quantity > availableQuantity) {
      throw new CustomError(
        `Only ${availableQuantity} tickets available for "${ticketReq.variantName}"`,
        400
      );
    }

    // Validate price matches
    if (ticketVariant.price?.amount !== ticketReq.pricePerTicket) {
      throw new CustomError(`Price mismatch for "${ticketReq.variantName}"`, 400);
    }
  }

  // Check venue capacity
  const requestedTotal = data.tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0);
  const currentTotalSold = event.tickets?.reduce((sum: number, ticket: any) => sum + ticket.sold, 0) || 0;
  const venueCapacity = event.venue?.capacity || 0;

  if (currentTotalSold + requestedTotal > venueCapacity) {
    throw new CustomError('Not enough venue capacity for requested tickets', 400);
  }
  
  const ticketsWithSubtotal = data.tickets.map((ticket: any) => ({
    ticketVariantId: ticket.ticketVariantId,
    variantName: ticket.variantName,
    quantity: ticket.quantity,
    pricePerTicket: ticket.pricePerTicket,
    subtotal: ticket.quantity * ticket.pricePerTicket
  }));

  // Calculate overall pricing
  const total = ticketsWithSubtotal.reduce((sum: number, ticket: any) => sum + ticket.subtotal, 0);
  const pricing = calculatePricing(total, data.paymentMethod);
  
  // *** FREE TICKET LOGIC ***
  if (pricing.subtotal === 0) {
      await validateFreeTicketBooking(data.userId, data.eventId, requestedTotal);
      
      const order = await Order.create({
        userId: data.userId,
        eventId: data.eventId,
        tickets: ticketsWithSubtotal,
        orderNumber: generateOrderNumber(),
        pricing,
        paymentMethod: 'free', // Force 'free' method
        buyerEmail: data.buyerEmail,
        buyerPhone: data?.buyerPhone || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: 'confirmed', // INSTANT CONFIRMATION
        paymentStatus: 'succeeded',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Never expire really
      });
      
      // Reserve Inventory
      for (const item of ticketsWithSubtotal) {
          // ... (simplified reservation for free tickets - or reuse standard logic if strict locking needed)
          await Event.updateOne(
              { _id: data.eventId, "tickets._id": item.ticketVariantId },
              { $inc: { "tickets.$.reserved": item.quantity } }
          );
      }
      
      // Queue ticket generation (non-blocking)
      const { addTicketGenerationJob } = await import('../../workers/ticketGeneration.queue');
      await addTicketGenerationJob({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tickets: order.tickets,
      });
      
      // Invalidate PDF cache (new tickets added)
      await invalidatePDFCache(data.eventId);
      
      return {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          subtotal: 0,
          paymentStatus: 'succeeded',
          isFree: true
      };
  }

  // Set expiration (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const order = await Order.create({
    userId: data.userId,
    eventId: data.eventId,
    tickets: ticketsWithSubtotal,
    orderNumber: generateOrderNumber(),
    pricing,
    paymentMethod: data.paymentMethod,
    buyerEmail: data.buyerEmail,
    buyerPhone: data?.buyerPhone || null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    status: 'pending',
    paymentStatus: 'pending',
    expiresAt
  });

  // 3. RESERVE INVENTORY (prevents overselling with atomic check)
  for (const item of ticketsWithSubtotal) {
    const event = await Event.findOne(
      { _id: data.eventId },
      { "tickets.$": 1 }
    ).where("tickets._id").equals(item.ticketVariantId);

    if (!event) {
      throw new Error("Event or ticket variant not found");
    }

    const variant = event.tickets[0];
    const available = variant.quantity - variant.sold - (variant.reserved || 0);

    if (available < item.quantity) {
      throw new Error(`Only ${available} tickets available`);
    }

    // 2. Then, update with optimistic locking
    const result = await Event.updateOne(
      {
        _id: data.eventId,
        "tickets._id": item.ticketVariantId,
        "tickets.sold": variant.sold,  // Optimistic lock: only update if sold count unchanged
        "tickets.reserved": variant.reserved || 0
      },
      {
        $inc: { "tickets.$.reserved": item.quantity }
      }
    );

    if (result.modifiedCount === 0) {
      // Someone else bought tickets between our read and update
      throw new Error("Tickets just sold out, please try again");
    }
  }

  // Fetch buyer's profile details (required by PayStation)
  const buyerProfile = await User.findById(data.userId)
    .select('firstName lastName email phoneNumber')
    .lean() as any;

  if (!buyerProfile) {
    throw new CustomError('User not found', 404);
  }

  const custName = [buyerProfile.firstName, buyerProfile.lastName].filter(Boolean).join(' ') || 'Customer';
  const custPhone = buyerProfile.phoneNumber || '01700000000';
  const custEmail = buyerProfile.email || data.buyerEmail;

  const callbackUrl = `${process.env.SERVER_URL!}/order/callback`;

  const payment: any = await initiatePaystationPayment({
    invoice_number: order.orderNumber,       // Unique per-order, used to look up on callback
    payment_amount: pricing.subtotal,
    cust_name: custName,
    cust_phone: custPhone,
    cust_email: custEmail,
    cust_address: 'Not Provided',
    callback_url: callbackUrl,
    reference: order.orderNumber,
    checkout_items: data.eventId,
  });

  if (payment?.status_code !== '200' || !payment?.payment_url) {
    order.paymentStatus = 'failed';
    await order.save();

    // Release reserved inventory on initiation failure
    for (const item of ticketsWithSubtotal) {
      await Event.updateOne(
        { _id: data.eventId, 'tickets._id': item.ticketVariantId },
        { $inc: { 'tickets.$.reserved': -item.quantity } }
      );
    }

    throw new CustomError(payment?.message || 'Payment initiation failed', 400);
  }

  // Use orderNumber as the canonical payment identifier (= invoice_number sent to PayStation)
  await Payment.create({
    orderId: order._id,
    userId: data.userId,
    paymentId: order.orderNumber,
    amount: pricing.subtotal,
    currency: 'BDT',
    paymentMethod: 'bkash',  // PayStation processes via bKash/MFS
    status: 'pending',
    createdAt: new Date()
  });

  order.paymentId = order.orderNumber;
  await order.save();

  return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    subtotal: pricing.subtotal,
    expiresAt: order.expiresAt,
    paymentId: order.orderNumber,
    paymentUrl: payment.payment_url   // Official PayStation hosted checkout URL
  };
};


// Handle PayStation callback (called when PayStation redirects buyer back)
export const handlePaystationCallbackService = async (
  invoice_number: string,   // = orderNumber we sent as invoice_number
  gateway_status: string,   // 'Successful' | 'Failed' | 'Canceled'
): Promise<{ success: boolean; message: string; orderId: any; eventId?: string }> => {
  // 1. FIND ORDER BY INVOICE NUMBER (orderNumber was used as invoice_number)
  const order = await Order.findOne({ orderNumber: invoice_number });
  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // 2. IDEMPOTENCY CHECK
  if (order.status === 'confirmed') {
    return {
      success: true,
      message: 'Payment already processed',
      orderId: order._id,
      eventId: order.eventId?.toString()
    };
  }

  // 3. CHECK ORDER EXPIRY (with 10-minute grace period for callback latency)
  const gracePeriod = 10 * 60 * 1000; // 10 minutes in ms
  if (order.expiresAt.getTime() + gracePeriod < Date.now()) {
    throw new CustomError('Order has expired', 400);
  }

  // 4. FIND OR RECREATE PAYMENT RECORD
  let payment = await Payment.findOne({ paymentId: invoice_number });
  if (!payment) {
    payment = await Payment.create({
      paymentId: invoice_number,
      orderId: order._id,
      userId: order.userId,
      amount: order.pricing?.subtotal,
      currency: 'BDT',
      status: 'pending',
      paymentMethod: 'bkash',
      createdAt: new Date()
    });
  }

  // 5. SHORT-CIRCUIT ON FAILED/CANCELLED (before wasting a verification call)
  if (gateway_status !== 'Successful') {
    await handlePaymentFailure(order, payment, {
      statusCode: gateway_status,
      statusMessage: `Payment ${gateway_status} by gateway`
    });
    return {
      success: false,
      message: `Payment ${gateway_status}`,
      orderId: order._id,
      eventId: order.eventId?.toString()
    };
  }

  // 6. VERIFY WITH PAYSTATION API (critical — prevents callback status spoofing)
  const verification = await verifyPaystationTransaction(invoice_number);

  const trxStatus = verification.data?.trx_status?.toLowerCase();
  // PayStation may return 'success' or 'successful' — accept both
  const isVerified = trxStatus === 'success' || trxStatus === 'successful';
  if (verification.status_code !== '200' || !isVerified) {
    console.warn(`[PAYSTATION] Verification failed for invoice ${invoice_number}: ${verification.message}`);
    await handlePaymentFailure(order, payment, {
      statusCode: verification.status_code,
      statusMessage: verification.message || 'Payment verification failed'
    });
    return {
      success: false,
      message: 'Payment verification failed',
      orderId: order._id,
      eventId: order.eventId?.toString()
    };
  }

  // 7. AMOUNT VALIDATION — security check
  const verifiedAmount = parseFloat(verification.data?.payment_amount || '0');
  if (verifiedAmount !== order.pricing?.subtotal) {
    console.error(
      `[SECURITY_AUDIT] AMOUNT MISMATCH DETECTED: 
       - Order ID: ${order._id}
       - Order Number: ${order.orderNumber}
       - Expected Amount: ${order.pricing?.subtotal} BDT
       - Gateway Verified Amount: ${verifiedAmount} BDT
       - Transaction ID: ${verification.data?.trx_id}
       - User ID: ${order.userId}
       - Timestamp: ${new Date().toISOString()}`
    );
    await Payment.updateOne(
      { paymentId: invoice_number },
      {
        status: 'suspicious',
        suspiciousAt: new Date(),
        suspiciousReason: 'amount_mismatch',
        receivedAmount: verifiedAmount,
        expectedAmount: order.pricing?.subtotal
      }
    );
    throw new CustomError('Payment amount validation failed', 400);
  }

  // 8. ATOMIC PAYMENT UPDATE (idempotent)
  const paymentUpdate = await Payment.findOneAndUpdate(
    { paymentId: invoice_number, status: { $ne: 'succeeded' } },
    {
      status: 'succeeded',
      succeededAt: new Date(),
      transactionId: verification.data?.trx_id,
      webhookReceived: true,
      webhookReceivedAt: new Date()
    },
    { new: true }
  );

  if (!paymentUpdate) {
    return {
      success: true,
      message: 'Payment already processed',
      orderId: order._id,
      eventId: order.eventId?.toString()
    };
  }

  console.log(
    `[PAYMENT_SUCCESS] Order: ${order._id}, TrxId: ${verification.data?.trx_id}, Amount: ${verifiedAmount} BDT`
  );

  // 9. UPDATE ORDER STATUS
  if (order.status !== 'confirmed') {
    order.status = 'confirmed';
    order.paymentStatus = 'succeeded';
    order.confirmedAt = new Date();
    order.paidAt = new Date();
    await order.save();
  }

  // 10. MOVE INVENTORY: RESERVED → SOLD
  for (const item of order.tickets) {
    const eventDoc = await Event.findOne(
      { _id: order.eventId, 'tickets._id': item.ticketVariantId },
      { 'tickets.$': 1 }
    );

    const currentReserved = eventDoc?.tickets[0]?.reserved || 0;
    const newReserved = Math.max(0, currentReserved - item.quantity);

    await Event.updateOne(
      { _id: order.eventId, 'tickets._id': item.ticketVariantId },
      {
        $set: { 'tickets.$.reserved': newReserved },
        $inc: { 'tickets.$.sold': item.quantity }
      }
    );
  }

  // 11. QUEUE TICKET GENERATION (non-blocking)
  try {
    const { addTicketGenerationJob } = await import('../../workers/ticketGeneration.queue');
    await addTicketGenerationJob({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tickets: order.tickets,
    });
    console.log(`[TICKET_QUEUE] Queued ticket generation for order: ${order._id}`);
  } catch (err) {
    console.error('[CRITICAL] Failed to queue ticket generation:', err);
    order.requiresManualReview = true;
    order.manualReviewReason = 'ticket_queue_failed';
    await order.save();
  }

  return {
    success: true,
    message: 'Payment succeeded. Tickets are being generated.',
    orderId: order._id,
    eventId: order.eventId?.toString()
  };
};

// Get single order
export const getOrderService = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, userId })
    .populate('eventId', '_id title schedule.venue schedule.startDate media')
    .populate('ticketIds')
    .select('-__v');

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  return order;
};




async function validateFreeTicketBooking(userId: string, eventId: string, quantity: number) {
  const user = await User.findById(userId);
  
  if (!user) {
     throw new CustomError('User not found', 404);
  }

  if (!user.emailVerified && user.provider !== 'google' ) {
    throw new CustomError('Please login with google to book free tickets', 403);
  }
  
  // 2. Check event-specific limit
  const existingOrders = await Order.find({
    userId,
    eventId,
    'pricing.total': 0,
    status: { $in: ['confirmed', 'pending'] } // Count pending too to prevent race conditions
  })
    .select('tickets')
    .lean(); // Performance optimization
  
  const currentEventFreeTickets = existingOrders.reduce((sum, order) => {
      return sum + order.tickets.reduce((tSum: number, t: any) => tSum + t.quantity, 0);
  }, 0);
  
  if (currentEventFreeTickets + quantity > FREE_TICKET_LIMITS.maxPerUser) {
    throw new CustomError(`Maximum ${FREE_TICKET_LIMITS.maxPerUser} free tickets allowed per event`, 400);
  }
  
  // 3. Check monthly limit
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthlyFreeStats = await Order.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        'pricing.total': 0,
        status: { $in: ['confirmed', 'pending'] },
        createdAt: { $gte: monthStart }
      }
    },
    {
      $group: {
        _id: null,
        totalTickets: {
          $sum: {
            $reduce: {
              input: '$tickets',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.quantity'] }
            }
          }
        }
      }
    }
  ]);
  
  const currentMonthlyFree = monthlyFreeStats[0]?.totalTickets || 0;
  if (currentMonthlyFree + quantity > FREE_TICKET_LIMITS.maxPerUserTotal) {
    throw new CustomError(`Monthly limit of ${FREE_TICKET_LIMITS.maxPerUserTotal} free tickets reached`, 400);
  }
}