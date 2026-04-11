'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { authService } from '@/lib/api/auth';
import { useNotification } from '@/lib/context/notification';
import { userRegisterSchema } from '@/schema/auth.schema';

interface SignupUserProps {
  onSuccess: () => void;
  onGoBack: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignupUser: React.FC<SignupUserProps> = ({ onSuccess, onGoBack }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
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

  const validateForm = (): boolean => {
    const result = userRegisterSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.registerUser(formData);
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

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const { url } = await authService.initiateGoogleRegister('user', {});
      window.location.href = url;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to initiate Google registration';
      showNotification('error', 'Error', message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-24 lg:mt-0 bg-white flex flex-col items-center justify-center p-0 sm:p-6 relative overflow-hidden">
      {/* Sharp grid background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#9333ea_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white p-8 md:p-12 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative z-10"
      >
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors group font-[400] mb-8"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-wix-purple" size={20} strokeWidth={1} />
              <span className="text-xs font-[600] uppercase tracking-widest text-wix-purple">Join as Attendee</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-[300] text-gray-900 mt-4 leading-[0.9] tracking-tight">Create Your Account</h1>
            <p className="text-gray-500 text-sm sm:text-base font-[300]">Discover and attend amazing events</p>
          </div>

          <form onSubmit={handleManualRegister} className="space-y-6">
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
                <span className="px-4 bg-white text-gray-500">or sign up with email</span>
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
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-[600] py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all border-2 border-black disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <CheckCircle2 size={20} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
