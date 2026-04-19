import { Router } from 'express';
import { 
  createOrderService,
  handlePaystationCallbackService,
  getOrderService
} from './service';
import { handleError } from '../../utils/handleError';
import CustomError from '../../utils/CustomError';
import { Request, Response } from 'express';
import { isValidObjectId } from '../../utils/isValidObjectId';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

// Create a new order and get a PayStation payment URL
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub) {
      throw new CustomError('Unauthorized', 401);
    }

    const userId = req.user.sub;
    
    const orderData = {
      eventId: req.body.eventId,
      tickets: req.body.tickets,
      paymentMethod: req.body.paymentMethod,
      userId,
      buyerEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const result = await createOrderService(orderData);
    
    res.status(201).json(result);
  } catch (error: any) {
    return handleError(error, res);
  }
});

// Get a single order (authenticated)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub) {
      throw new CustomError('User not found', 404);
    }

    const { orderId } = req.query;
    if(!orderId || !isValidObjectId(orderId as string)){
      throw new CustomError('Order ID is required', 400);
    }

    const userId = req.user.sub;
    const result = await getOrderService(orderId as string, userId);
    res.status(200).json(result);
  } catch (error: any) {
    return handleError(error, res);
  }
});

/**
 * PayStation Payment Callback
 *
 * PayStation redirects the customer here after payment with URL params:
 *   ?status=Successful|Failed|Canceled&invoice_number=<orderNumber>&trx_id=<trxId>
 *
 * We verify the transaction server-side with PayStation's API before confirming,
 * then redirect the user back to the event page on the client.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { status, invoice_number, trx_id } = req.query;

  console.log(`[CALLBACK] PayStation callback received: status=${status}, invoice=${invoice_number}, trxId=${trx_id}`);

  if (!invoice_number || typeof invoice_number !== 'string') {
    console.error('[CALLBACK] Missing invoice_number in callback');
    return res.redirect(`${process.env.CLIENT_URL}/?payment=failed&reason=invalid_callback`);
  }

  try {
    const result = await handlePaystationCallbackService(
      invoice_number,
      (status as string) || 'Failed'
    );

    if (result.success) {
      // Redirect back to the event page with success flag
      if (result.eventId) {
        return res.redirect(`${process.env.CLIENT_URL}/events/${result.eventId}?payment=success&orderId=${result.orderId}`);
      }
      // Fallback: send to wallet if we can't determine the event
      return res.redirect(`${process.env.CLIENT_URL}/wallet?payment=success`);
    } else {
      // Payment failed or cancelled — send back to event page with context so the user can retry
      const reason = (status as string)?.toLowerCase() === 'canceled' ? 'cancelled' : 'failed';
      if (result.eventId) {
        return res.redirect(`${process.env.CLIENT_URL}/events/${result.eventId}?payment=${reason}&orderId=${result.orderId}`);
      }
      return res.redirect(`${process.env.CLIENT_URL}/?payment=${reason}`);
    }
  } catch (error: any) {
    console.error('[CALLBACK] Error processing PayStation callback:', error?.message);
    return res.redirect(`${process.env.CLIENT_URL}/?payment=failed&reason=server_error`);
  }
});


export default router;