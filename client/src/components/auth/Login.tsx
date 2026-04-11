'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronLeft, Sparkles } from 'lucide-react';
import { authService } from '@/lib/api/auth';
import { useNotification } from '@/lib/context/notification';
import { loginSchema } from '@/schema/auth.schema';
import { useRouter } from 'next/navigation';

interface LoginProps {
  onLogin: () => void;
  onGoBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoBack }) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate with schema
      loginSchema.parse(formData);
      setErrors({});
      setLoading(true);
      await authService.login(formData);
      
      showNotification('success', 'Welcome back!', 'Successfully logged in');
      onLogin(); // This will redirect to dashboard
    } catch (error: any) {
      if(error.message === 'Token refresh failed') {
        showNotification('error', 'Invalid Credentials', 'Invalid Credentials');
        setErrors({ submit: 'Invalid Credentials' });
      } else if (error.errors) {
        // Zod validation errors
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      } else if (error?.response?.status === 404) {
        // User not found
        showNotification('error', 'Account Not Found', 'Please register first');
        setErrors({ submit: 'No account found with this email' });
      } else {
        // Other errors
        const message = error?.response?.data?.message || 'Login failed';
        showNotification('error', 'Login Failed', message);
        setErrors({ submit: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const url = await authService.googleLogin();
      window.location.href = url;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to initiate Google login';
      showNotification('error', 'Error', message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col mt-16 lg:flex-row min-h-screen bg-white">
      {/* Left: Login Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col justify-center items-center p-0 lg:p-20 order-2 lg:order-1"
      >
        <div className="w-full max-w-[500px] p-8 space-y-8">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-gray-900 transition-colors group font-[500]"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to onboarding
          </button>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-[300] text-neutral-800 tracking-tight">Welcome Back</h1>
            <p className="text-neutral-500 text-sm sm:text-base font-[300]">Log in to access your Zenvy Profile</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-black hover:bg-gray-50 transition-all font-[500] text-black disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {loading ? 'Redirecting...' : 'Sign in with Google'}
            </button>

            <div className="flex items-center gap-4 text-neutral-200">
              <div className="h-px flex-1 bg-neutral-100" />
              <span className="text-xs font-[500] uppercase tracking-widest text-neutral-400">or email</span>
              <div className="h-px flex-1 bg-neutral-100" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-[500] text-neutral-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Password</label>
                  <button type="button" className="text-sm font-[500] text-neutral-700 hover:text-neutral-600">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
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
              className="w-full bg-black text-white font-[600] py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-[4px_4px_0_0_#9333ea] border-2 border-black disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              <LogIn size={20} />
            </button>
          </form>

          <p className="text-center text-sm sm:text-base text-neutral-500 font-[400]">
            Don't have an account? <button onClick={onGoBack} className="text-wix-purple font-[600] border-b-2 border-transparent hover:border-wix-purple transition-all pb-0.5">Create one</button>
          </p>
        </div>
      </motion.div>

      {/* Right: Brand Showcase */}
     <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-1 bg-wix-purple hidden lg:block relative overflow-hidden flex flex-col justify-center items-center p-12 order-1 lg:order-2"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
        </div>

        {/* Sharp Geometric Background Shapes */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] border-[10px] border-white/10"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] border-[10px] border-black/10"
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-[80vh] text-center space-y-8">
          <div className='max-w-[500px] flex flex-col items-center gap-4'>
            <div className="inline-flex max-w-[400px] items-center gap-3 px-4 py-2 bg-black border-2 border-white text-white shadow-[4px_4px_0_0_#fff]">
              <Sparkles size={18} />
              <span className="text-sm font-[600] uppercase tracking-wider">Experience the Future</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tight">
              Elevate your <br />
              <span className="text-black bg-white px-2 mt-2 inline-block">Experiences.</span>
            </h2>

              <p className="text-white/90 text-lg font-[400] leading-relaxed">
                Join thousands of event architects creating unfathomably clean moments for their community.
              </p>

              <div className="flex justify-center -space-x-4 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/${i + 20}/100/100`}
                    className="w-16 h-16 border-2 border-black"
                    alt="user"
                  />
                ))}
                <div className="w-16 h-16 border-2 border-black bg-white flex items-center justify-center text-black font-black text-xl">
                  +10k
                </div>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
