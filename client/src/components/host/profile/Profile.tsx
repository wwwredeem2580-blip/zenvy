'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownLeft,
  Globe,
  ArrowRight,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCw,
  X,
  Loader2,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/auth';
import { phoneOTPAPI } from '@/lib/api/phone';
import { useNotification } from '@/lib/context/notification';
import { hostEventsService } from '@/lib/api/host';

// OTP Modal Component

/* ─── OTP Modal ─── */
const OtpModal = ({
  isOpen,
  onClose,
  phoneNumber,
  onVerify,
  onResend,
  onChangeNumber,
  verifying,
  resending,
}: {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
  verifying?: boolean;
  resending?: boolean;
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) { setOtp(['', '', '', '', '', '']); setTimer(60); return; }
    const id = setInterval(() => setTimer(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleResendClick = () => {
    if (timer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    onResend();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-[480px] p-8 sm:p-10 border border-wix-border-light shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-wix-purple/10 rounded-full flex items-center justify-center mb-6">
              <Smartphone className="w-8 h-8 text-wix-purple" />
            </div>
            <h2 className="text-2xl font-bold text-wix-text-dark mb-2">Verify Your Phone</h2>
            <p className="text-wix-text-muted text-[15px] mb-8">
              We've sent a 6-digit code to <span className="font-semibold text-wix-text-dark">{phoneNumber}</span>
            </p>
            <div className="flex gap-2 sm:gap-3 mb-8">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gray-200 text-center text-xl font-bold focus:border-wix-purple outline-none transition-colors"
                />
              ))}
            </div>
            <button
              onClick={() => onVerify(otp.join(''))}
              disabled={verifying || otp.join('').length < 6}
              className="w-full bg-wix-text-dark text-white py-4 font-bold hover:bg-black transition-colors mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleResendClick}
                disabled={timer > 0 || resending}
                className={`text-[14px] font-medium flex items-center justify-center gap-1 ${timer > 0 || resending ? 'text-gray-400 cursor-not-allowed' : 'text-wix-purple hover:opacity-80'}`}
              >
                {resending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {timer > 0 ? `Resend code in ${timer}s` : resending ? 'Sending...' : 'Resend Code'}
              </button>
              <button onClick={onChangeNumber} className="text-[14px] font-medium text-wix-text-muted hover:text-black transition-colors">
                Change Phone Number
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ─── Main Profile/Wallet page ─── */
export function Profile() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Payment method state
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '' });
  const [mfsDetails, setMfsDetails] = useState({ name: '', number: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [payoutSet, setPayoutSet] = useState(false);

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('+880');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const profile = await hostEventsService.getProfile();
        // Phone verification
        if (profile.phoneVerified && profile.phoneVerificationDetails?.phoneNumber) {
          setIsPhoneVerified(true);
          setVerifiedPhoneNumber(profile.phoneVerificationDetails.phoneNumber);
          setPhoneNumber(profile.phoneVerificationDetails.phoneNumber);
        }
        // Payment details
        const pd = profile.paymentDetails;
        if (pd) {
          const method = pd.method || 'card';
          setSelectedMethod(method);
          if (method === 'card') {
            setCardDetails({ name: pd.accountHolderName || '', number: pd.accountNumber || '', expiry: '' });
          } else {
            setMfsDetails({ name: pd.accountHolderName || '', number: pd.mobileNumber || '' });
          }
          setPayoutSet(true);
        }
      } catch (_) {
        // silent — user may not have profile yet
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);

  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: <CreditCard size={16} />, color: '#1a1a1a' },
    { id: 'bkash', name: 'bKash', icon: <span className="font-bold text-[10px]">bK</span>, color: '#D12053' },
    { id: 'nagad', name: 'Nagad', icon: <span className="font-bold text-[10px]">N</span>, color: '#F7941D' },
    { id: 'rocket', name: 'Rocket', icon: <span className="font-bold text-[10px]">R</span>, color: '#8C3494' },
    { id: 'upay', name: 'Upay', icon: <span className="font-bold text-[10px]">U</span>, color: '#005C99' },
  ];

  const currentMethod = paymentMethods.find(m => m.id === selectedMethod) || paymentMethods[0];

  /* ── Phone handlers ── */
  const handleSendOtp = async () => {
    if (!phoneNumber.startsWith('+880') || phoneNumber.replace(/\s/g, '').length < 14) {
      showNotification('error', 'Invalid Number', 'Please enter a valid Bangladesh phone number starting with +880');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await phoneOTPAPI.sendOTP(phoneNumber.replace(/\s/g, ''));
      if (res.success) {
        setShowOtpModal(true);
        showNotification('info', 'OTP Sent', `Verification code sent to ${phoneNumber}`);
      } else {
        showNotification('error', 'Failed to Send', res.message || 'Could not send OTP. Try again.');
      }
    } catch (err: any) {
      showNotification('error', 'Send Failed', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (otp.length < 6) return;
    setVerifyingOtp(true);
    try {
      const res = await phoneOTPAPI.verifyOTP(otp);
      if (res.success) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        showNotification('success', 'Phone Verified', 'Your phone number has been verified successfully.');
      } else {
        showNotification('error', 'Invalid Code', res.message || 'The OTP you entered is incorrect.');
      }
    } catch (err: any) {
      showNotification('error', 'Verification Failed', err?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const res = await phoneOTPAPI.resendOTP(phoneNumber.replace(/\s/g, ''));
      if (res.success) {
        showNotification('info', 'OTP Resent', 'A new verification code has been sent.');
      } else {
        showNotification('error', 'Resend Failed', res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      showNotification('error', 'Resend Failed', err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendingOtp(false);
    }
  };

  /* ── Save payment method ── */
  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      const isMobile = selectedMethod !== 'card';
      const details = isMobile
        ? {
            method: selectedMethod,
            mobileNumber: mfsDetails.number.replace(/\s/g, ''),
            accountHolderName: mfsDetails.name,
          }
        : {
            method: 'card',
            accountHolderName: cardDetails.name,
            accountNumber: cardDetails.number.replace(/\s/g, ''),
          };

      if (isMobile && (!details.mobileNumber || !details.accountHolderName)) {
        showNotification('error', 'Missing Fields', 'Please fill in Account Name and mobile number.');
        return;
      }
      if (!isMobile && (!details.accountHolderName || !details.accountNumber)) {
        showNotification('error', 'Missing Fields', 'Please fill in Name on Card and Card Number.');
        return;
      }

      await hostEventsService.updatePaymentDetails(details);
      setPayoutSet(true);
      showNotification('success', 'Saved', `${currentMethod.name} payout method saved successfully.`);
    } catch (err: any) {
      showNotification('error', 'Save Failed', err?.response?.data?.message || 'Failed to save payment method.');
    } finally {
      setSavingPayment(false);
    }
  };

  const profileComplete = isPhoneVerified && payoutSet;

  return (
    <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
      {/* Profile Status Banner */}
      <AnimatePresence mode="wait">
        {profileComplete ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-100 p-6 rounded-none mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-none flex items-center justify-center text-white shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 leading-tight mb-1">Profile Complete — You're Eligible to Create Events</h4>
                <p className="text-xs text-emerald-700/70">Phone verified and payout method configured. You can now publish events on Zenvy.</p>
              </div>
            </div>
            <a href="/host/events/create" className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all text-center">
              Create Event
            </a>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100 p-6 rounded-none mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-none flex items-center justify-center text-white shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest text-[11px] leading-tight mb-1">Note: Complete Your Profile</h4>
                <p className="text-xs text-indigo-700/70">Verify your phone number and add a payment method to create events.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Available Balance */}
          <div className="bg-white border border-wix-border-light p-8 rounded-none shadow-sm">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-wix-text-muted mb-4 block">Available Balance</span>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-sm font-medium text-wix-text-muted">BDT</span>
              <span className="text-4xl font-serif font-bold text-wix-text-dark">0.00</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-wix-purple text-white py-3 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-wix-purple/90 transition-all">
                Withdraw
              </button>
              <button className="bg-white border border-wix-border-light text-wix-text-dark py-3 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                Add Funds
              </button>
            </div>
          </div>

          {/* Phone Verification */}
          <div className="bg-white border border-wix-border-light p-8 rounded-none shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-wix-text-muted">Phone Verification</span>
              {isPhoneVerified && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100 rounded-none">
                  <ShieldCheck size={10} /> Verified
                </span>
              )}
            </div>
            
            {isPhoneVerified && verifiedPhoneNumber && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Smartphone size={16} />
                  <span className="text-sm font-medium">{verifiedPhoneNumber}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> verified
                </span>
              </div>
            )}

            {!isPhoneVerified && (
              <div className="relative mb-6">
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-wix-border-light p-4 pr-12 text-sm font-medium focus:outline-none focus:border-wix-purple transition-colors"
                  placeholder="+8801XXXXXXXXX"
                />
                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-wix-text-muted/30" size={18} />
              </div>
            )}

            <button 
              onClick={isPhoneVerified ? () => { setIsPhoneVerified(false); setVerifiedPhoneNumber(null); } : handleSendOtp}
              disabled={sendingOtp}
              className="w-full py-4 border border-wix-border-light text-[10px] font-bold uppercase tracking-widest text-wix-text-dark hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              {sendingOtp && <Loader2 size={14} className="animate-spin" />}
              {isPhoneVerified ? 'Change Verified Number' : (sendingOtp ? 'Sending Otp...' : 'Verify Number')}
            </button>
          </div>

          {/* Current Plan */}
          <div className="bg-white border border-wix-border-light p-8 rounded-none shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-wix-text-muted">Current Plan</span>
              <span className="px-2 py-0.5 bg-lime-100 text-lime-700 text-[9px] font-bold uppercase tracking-widest rounded-none">
                Exclusive
              </span>
            </div>
            
            <h3 className="text-2xl font-serif mb-8 text-wix-text-dark">Zenvy Organizer</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-wix-text-muted">Platform Fee</span>
                <span className="font-medium text-wix-text-dark">0% / sale</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-wix-text-muted">Events Limit</span>
                <span className="font-medium text-wix-text-dark">Unlimited</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-wix-text-muted">Payout Window</span>
                <span className="font-medium text-wix-text-dark">T+7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Payout Method Header */}
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif mb-2 text-wix-text-dark">Payout Method</h2>
                <p className="text-sm text-wix-text-muted font-light">Configure where you receive event ticket payouts.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`px-4 py-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      selectedMethod === method.id 
                        ? 'bg-wix-text-dark text-white border-wix-text-dark' 
                        : 'bg-white border-wix-border-light text-wix-text-muted hover:border-wix-text-dark'
                    }`}
                  >
                    {method.icon} {method.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Preview */}
            <div className="bg-gray-50 border border-wix-border-light p-4 sm:p-12 rounded-none relative overflow-hidden group">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-wix-text-muted/30 mb-6 sm:mb-12 text-center">Interactive Preview</div>
              
              <div className="flex justify-center mb-12">
                <motion.div 
                  className={`w-full max-w-[400px] aspect-[1.6/1] rounded-[2rem] p-6 sm:p-10 relative shadow-2xl transition-colors duration-500 overflow-hidden ${
                    selectedMethod === 'bkash' ? 'bg-[#D12053]' : 
                    selectedMethod === 'nagad' ? 'bg-[#F7941D]' :
                    selectedMethod === 'rocket' ? 'bg-[#8C3494]' :
                    selectedMethod === 'upay' ? 'bg-[#005C99]' : 'bg-slate-900'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl sm:blur-3xl opacity-50 pointer-events-none" />
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white font-bold text-xs">
                        {currentMethod.icon}
                      </div>
                      <div className="text-white/40 font-bold italic tracking-widest uppercase text-base sm:text-xl">
                        {selectedMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="my-auto py-4">
                      <div className="text-lg sm:text-2xl md:text-3xl text-white font-mono tracking-[0.15em] break-all">
                        {selectedMethod === 'card' 
                          ? (cardDetails.number || '**** **** **** 1234')
                          : (mfsDetails.number || '01XXX XXXXXX')
                        }
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Account Name</div>
                        <div className="text-[10px] sm:text-sm font-bold text-white uppercase tracking-widest truncate max-w-[120px] sm:max-w-[200px]">
                          {selectedMethod === 'card' ? cardDetails.name : mfsDetails.name || 'Your Name'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Status</div>
                        <div className="text-[10px] sm:text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-wix-text-muted/30">
                <RotateCw size={12} /> Hover to interact
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="pt-12 border-t border-wix-border-light">
            <h3 className="text-2xl font-serif mb-8 text-wix-text-dark">Configure {currentMethod.name} Payout</h3>
            
            <form className="space-y-8 w-full max-w-[720px]" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-wix-text-dark">Account Name</label>
                <input 
                  type="text" 
                  value={selectedMethod === 'card' ? cardDetails.name : mfsDetails.name}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (selectedMethod === 'card') setCardDetails(p => ({ ...p, name: val }));
                    else setMfsDetails(p => ({ ...p, name: val }));
                  }}
                  className="w-full bg-transparent border-b border-wix-border-light py-4 focus:outline-none focus:border-wix-text-dark transition-colors text-lg font-serif text-wix-text-dark" 
                  placeholder="ARIFUL ISLAM"
                />
              </div>

              {selectedMethod === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-wix-text-dark">Card Number</label>
                    <input 
                      type="text" 
                      value={cardDetails.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardDetails(p => ({ ...p, number: val }));
                      }}
                      placeholder="**** **** **** 1234" 
                      className="w-full bg-transparent border-b border-wix-border-light py-4 focus:outline-none focus:border-wix-text-dark transition-colors text-lg font-serif text-wix-text-dark" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-wix-text-dark">Expiry Date</label>
                    <input 
                      type="text" 
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails(p => ({ ...p, expiry: e.target.value }))}
                      placeholder="MM/YY" 
                      className="w-full bg-transparent border-b border-wix-border-light py-4 focus:outline-none focus:border-wix-text-dark transition-colors text-lg font-serif text-wix-text-dark" 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-wix-text-dark">{currentMethod.name} Number</label>
                  <input 
                    type="text" 
                    value={mfsDetails.number}
                    onChange={(e) => setMfsDetails(p => ({ ...p, number: e.target.value }))}
                    className="w-full bg-transparent border-b border-wix-border-light py-4 focus:outline-none focus:border-wix-text-dark transition-colors text-lg font-serif text-wix-text-dark" 
                    placeholder="01921296777"
                  />
                </div>
              )}

              <button 
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="bg-wix-text-dark text-white px-10 py-5 rounded-none text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center gap-2"
              >
                {savingPayment && <Loader2 size={14} className="animate-spin" />}
                {savingPayment ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        phoneNumber={phoneNumber}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onChangeNumber={() => setShowOtpModal(false)}
        verifying={verifyingOtp}
        resending={resendingOtp}
      />
    </div>
  );
}
