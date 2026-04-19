'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCw, Wallet, X } from 'lucide-react';

interface PaymentStatusModalProps {
  eventId?: string;
}

export default function PaymentStatusModal({ eventId }: PaymentStatusModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  const paymentParam = searchParams.get('payment');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (paymentParam === 'success' || paymentParam === 'failed' || paymentParam === 'cancelled') {
      setShow(true);
    }
  }, [paymentParam]);

  const handleClose = () => {
    setShow(false);
    // Clean up params from URL without a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('orderId');
    url.searchParams.delete('reason');
    window.history.replaceState({}, '', url.toString());
  };

  if (!show) return null;

  const isSuccess = paymentParam === 'success';
  const isCancelled = paymentParam === 'cancelled';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative w-full max-w-[440px] bg-white border-2 border-black p-10 text-center space-y-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* Close button - tucked into corner of the brutalist box */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Circle */}
            <div className={`w-20 h-20 border-2 flex items-center justify-center mx-auto ${
              isSuccess ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
            }`}>
              {isSuccess ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
            </div>

            {/* Success State */}
            {isSuccess ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-[24px] font-semibold text-wix-text-dark tracking-tight">You're In!</h3>
                  <p className="text-[14px] text-wix-text-muted leading-relaxed">
                    Your ticket is confirmed. Check your email or visit your wallet for the details.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      // Replace history so back button works correctly
                      window.history.replaceState(null, '');
                      router.push('/wallet');
                    }}
                    className="w-full bg-black text-white py-3.5 text-[13px] font-black uppercase tracking-widest hover:bg-wix-purple transition-colors border-2 border-black"
                  >
                    View My Wallet
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3.5 text-[13px] font-bold uppercase tracking-widest border-2 border-black hover:bg-gray-50 transition-colors"
                  >
                    Back to Event
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Failure / Cancelled State */}
                <div className="space-y-2">
                  <h3 className="text-[24px] font-semibold text-wix-text-dark tracking-tight">
                    {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
                  </h3>
                  <p className="text-[14px] text-wix-text-muted leading-relaxed">
                    {isCancelled 
                      ? "You cancelled the process. No funds were deducted from your account."
                      : "We couldn't process your payment. If any amount was deducted, it will be automatically refunded."
                    }
                  </p>
                </div>

                <div className="bg-slate-50 border border-black/5 p-4 text-left">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">🔒 Security Assurance</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed">
                    Your transaction is safe. Refunds for failed attempts are processed automatically within 3-5 business days.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {orderId && (
                    <button
                      onClick={() => router.push(`/checkout/${orderId}`)}
                      className="w-full bg-black text-white py-3.5 text-[13px] font-black uppercase tracking-widest hover:bg-wix-purple transition-colors border-2 border-black flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Try Again
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (eventId) router.push(`/events/${eventId}`);
                      else handleClose();
                    }}
                    className="w-full py-3.5 text-[13px] font-bold uppercase tracking-widest border-2 border-black hover:bg-gray-50 transition-colors"
                  >
                    Return to Event
                  </button>
                  <button
                    onClick={() => router.push('/wallet')}
                    className="text-[11px] text-slate-400 hover:text-black font-bold uppercase tracking-widest transition-colors"
                  >
                    Check Order History
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
