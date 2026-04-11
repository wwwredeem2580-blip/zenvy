'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ChevronLeft, Sparkles, Building2, Phone, ShieldCheck, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import { authService } from '@/lib/api/auth';
import { useNotification } from '@/lib/context/notification';
import { businessInfoSchema, companyDetailsSchema, personalInfoSchema } from '@/schema/auth.schema';

interface RegisterProps {
  onSuccess: () => void;
  onGoBack: () => void;
}

type Step = 'org' | 'verify' | 'basic';

interface FormData {
  // Step 1: Business Info
  businessName: string;
  businessEmail: string;
  phoneNumber: string;
  website: string;
  
  // Step 2: Company Details
  companyType: 'organizer' | 'venue_owner' | 'representative' | 'artist';
  
  // Step 3: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignupHost: React.FC<RegisterProps> = ({ onSuccess, onGoBack }) => {
  const { showNotification } = useNotification();
  const [step, setStep] = useState<Step>('org');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const companyType = ['organizer', 'venue_owner', 'representative', 'artist'];
  const [isCustomType, setIsCustomType] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessEmail: '',
    phoneNumber: '+880',
    website: '',
    companyType: 'organizer',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    try {
      let result;
      
      if (currentStep === 'org') {
        result = businessInfoSchema.safeParse({
          businessName: formData.businessName,
          businessEmail: formData.businessEmail,
          phoneNumber: formData.phoneNumber,
        });
      } else if (currentStep === 'verify') {
        result = companyDetailsSchema.safeParse({
          companyType: formData.companyType,
          website: formData.website,
        });
      } else if (currentStep === 'basic') {
        result = personalInfoSchema.safeParse({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }

      if (result && !result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error: any) {
      console.error('Validation error:', error);
      return false;
    }
  };

  const handleNext = (nextStep: Step) => {
    if (validateStep(step)) {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step === 'org') {
      onGoBack();
    } else if (step === 'verify') {
      setStep('org');
    } else {
      setStep('verify');
    }
  };

  // Manual registration
  const handleManualRegister = async () => {
    if (!validateStep('basic')) return;

    setLoading(true);
    try {
      const completeData = {
        ...formData,
      };

      await authService.registerHost(completeData);
      showNotification('success', 'Success!', 'Account created successfully');
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Registration failed';
      showNotification('error', 'Error', message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth registration
  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const businessData = {
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        companyType: formData.companyType,
      };

      const { url } = await authService.initiateGoogleRegister('host', businessData);

      // Redirect to Google OAuth
      window.location.href = url;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to initiate Google registration';
      showNotification('error', 'Error', message);
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen mt-24 lg:mt-8 bg-white flex flex-col items-center justify-center p-0 sm:p-6 relative overflow-hidden">
      {/* Sharp grid background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#9333ea_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      <motion.div
        layout
        className="w-full max-w-[500px] bg-white p-8 md:p-12 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative z-10"
      >
        <div className="mb-12 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors group font-[400]"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {step === 'org' ? 'Back' : 'Previous Step'}
          </button>

          <div className="flex gap-2">
            {(['org', 'verify', 'basic'] as Step[]).map((s) => (
              <div key={s} className={`h-1.5 w-8 transition-all duration-500 ${step === s ? 'bg-wix-purple' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Business Information */}
          {step === 'org' && (
            <motion.div key="org" {...stepVariants} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="text-wix-purple" size={20} />
                  <span className="text-xs font-[600] uppercase tracking-widest text-wix-purple">Step 1: Organization</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-[300] text-gray-900 mt-4 leading-[0.9] tracking-tight">Business Information</h2>
                <p className="text-gray-500 text-sm sm:text-base font-[300]">How should we identify your brand?</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Business Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Zenvy Studios"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
                {errors.businessName && <p className="text-xs text-red-500 ml-1">{errors.businessName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Business Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => updateField('businessEmail', e.target.value)}
                    placeholder="contact@zenvy.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
                {errors.businessEmail && <p className="text-xs text-red-500 ml-1">{errors.businessEmail}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    placeholder="0 1*** **** **"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
                {errors.phoneNumber && <p className="text-xs text-red-500 ml-1">{errors.phoneNumber}</p>}
              </div>

              <button
                onClick={() => handleNext('verify')}
                className="w-full bg-black text-white font-[600] py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all border-2 border-black disabled:opacity-50"
              >
                Next: Company Details
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {/* Step 2: Company Details */}
          {step === 'verify' && (
            <motion.div key="verify" {...stepVariants} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-wix-purple" size={20} />
                  <span className="text-xs font-[600] uppercase tracking-widest text-wix-purple">Step 2: Company Details</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-[300] text-gray-900 mt-4 leading-[0.9] tracking-tight">Additional Information</h2>
                <p className="text-gray-500 text-sm sm:text-base font-[300]">Tell us about your business more</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Business Type *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {companyType.map((type) => {
                    const isActive = formData.companyType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setIsCustomType(false);
                          updateField('companyType', type);
                        }}
                        className={`px-3 py-2 text-sm sm:text-base border-2 transition-all ${
                          isActive
                            ? 'border-wix-purple bg-wix-purple/10 text-wix-purple'
                            : 'border-wix-border-light hover:border-black bg-white text-gray-700'
                        }`}
                      >
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    );
                  })}

                  {/* Custom Type Button / Input */}
                  {!isCustomType ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomType(true);
                        updateField('companyType', '');
                      }}
                      className="px-3 py-2 whitespace-nowrap text-xs sm:text-xs border-2 border-dashed border-gray-300 text-gray-500 hover:border-black hover:text-black transition-all bg-white"
                    >
                      + Add custom
                    </button>
                  ) : (
                    <input
                      autoFocus
                      type="text"
                      placeholder="Your business type"
                      value={formData.companyType}
                      onChange={(e) => updateField('companyType', e.target.value)}
                      onBlur={() => {
                        if (!formData.companyType.trim()) {
                          setIsCustomType(false);
                        }
                      }}
                      className="px-3 py-2 text-sm sm:text-base border-2 border-wix-purple bg-white outline-none transition-all"
                    />
                  )}
                </div>

                {errors.companyType && (
                  <p className="text-xs text-red-500 ml-1">{errors.companyType}</p>
                )}
              </div>


              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://zenny.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={() => handleNext('basic')}
                className="w-full bg-black text-white font-[600] py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all border-2 border-black disabled:opacity-50"
              >
                Next: Account Setup
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {/* Step 3: Personal Info (Manual OR Google) */}
          {step === 'basic' && (
            <motion.div key="basic" {...stepVariants} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-wix-purple" size={20} strokeWidth={1} />
                  <span className="text-xs font-[600] uppercase tracking-widest text-wix-purple">Step 3: Account Setup</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-[300] text-gray-900 mt-4 leading-[0.9] tracking-tight">Your Personal Details</h1>
                <p className="text-gray-500 text-sm sm:text-base font-[300]">Choose how you'd like to sign up</p>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-black bg-white hover:bg-gray-50 transition-all font-[500] text-black disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                {loading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or sign up manually</span>
                </div>
              </div>

              {/* Manual Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Confirm *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border-2 border-red-200">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <button
                onClick={handleManualRegister}
                disabled={loading}
                className="w-full bg-black text-white font-[600] py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all border-2 border-black disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                <CheckCircle2 size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
