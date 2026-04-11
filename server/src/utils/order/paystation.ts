import axios from 'axios';

const PAYSTATION_BASE_URL = 'https://api.paystation.com.bd';

export interface InitiatePaymentParams {
  invoice_number: string;
  payment_amount: number;
  cust_name: string;
  cust_phone: string;
  cust_email: string;
  callback_url: string;
  currency?: string;
  cust_address?: string;
  reference?: string;
  checkout_items?: string;
}

export interface InitiatePaymentResult {
  status_code: string;
  status: string;
  message: string;
  payment_amount?: string;
  invoice_number?: string;
  payment_url?: string;
}

export interface TransactionVerificationResult {
  status_code: string;
  status: string;
  message: string;
  data?: {
    invoice_number: string;
    trx_status: string;
    trx_id: string;
    payment_amount: string;
    order_date_time: string;
    payer_mobile_no: string;
    payment_method: string;
    reference: string;
    checkout_items: string;
  };
}

/**
 * Initiates a payment via the PayStation gateway.
 * Returns a payment_url to redirect the customer to.
 */
export async function initiatePaystationPayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  try {
    const merchantId = process.env.PAYSTATION_MERCHANT_ID;
    const password = process.env.PAYSTATION_PASSWORD;

    if (!merchantId || !password) {
      console.error('[PAYSTATION] Missing PAYSTATION_MERCHANT_ID or PAYSTATION_PASSWORD env vars');
      return {
        status_code: '9999',
        status: 'failed',
        message: 'Payment gateway is not configured',
      };
    }

    // PayStation expects multipart/form-data or form-encoded body
    const formData = new URLSearchParams();
    formData.append('merchantId', merchantId);
    formData.append('password', password);
    formData.append('invoice_number', params.invoice_number);
    formData.append('currency', params.currency || 'BDT');
    formData.append('payment_amount', String(params.payment_amount));
    formData.append('pay_with_charge', '0'); // Customer bears gateway charge
    formData.append('cust_name', params.cust_name);
    formData.append('cust_phone', params.cust_phone);
    formData.append('cust_email', params.cust_email);
    formData.append('cust_address', params.cust_address || 'Not Provided');
    formData.append('callback_url', params.callback_url);
    if (params.reference) formData.append('reference', params.reference);
    if (params.checkout_items) formData.append('checkout_items', params.checkout_items);

    console.log(`[PAYSTATION] Initiating payment for invoice: ${params.invoice_number}, amount: ${params.payment_amount}`);

    const response = await axios.post<InitiatePaymentResult>(
      `${PAYSTATION_BASE_URL}/initiate-payment`,
      formData,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      }
    );

    console.log(`[PAYSTATION] Initiate response: status_code=${response.data.status_code}, status=${response.data.status}`);
    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data;
    console.error('[PAYSTATION] Initiate payment error:', errData || error.message);
    return {
      status_code: '9999',
      status: 'failed',
      message: errData?.message || 'PayStation payment initiation failed',
    };
  }
}

/**
 * Verifies a transaction status with PayStation by invoice number.
 * Always call this on callback to prevent status spoofing.
 */
export async function verifyPaystationTransaction(
  invoice_number: string
): Promise<TransactionVerificationResult> {
  try {
    const merchantId = process.env.PAYSTATION_MERCHANT_ID;

    if (!merchantId) {
      return {
        status_code: '9999',
        status: 'failed',
        message: 'Payment gateway is not configured',
      };
    }

    const formData = new URLSearchParams();
    formData.append('invoice_number', invoice_number);

    console.log(`[PAYSTATION] Verifying transaction for invoice: ${invoice_number}`);

    const response = await axios.post<TransactionVerificationResult>(
      `${PAYSTATION_BASE_URL}/transaction-status`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'merchantId': merchantId,
        },
        timeout: 15000,
      }
    );

    console.log(`[PAYSTATION] Verify response: status_code=${response.data.status_code}, trx_status=${response.data.data?.trx_status}`);
    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data;
    console.error('[PAYSTATION] Verify transaction error:', errData || error.message);
    return {
      status_code: '9999',
      status: 'failed',
      message: errData?.message || 'PayStation transaction verification failed',
    };
  }
}
