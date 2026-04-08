'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ChevronLeft, Sparkles, Building2, Phone, ShieldCheck, ArrowRight, CheckCircle2, Globe, Upload, Ticket, Trash, Edit, Plus, Calendar, Clock10, Save, MapPin } from 'lucide-react';
import { authService } from '@/lib/api/auth';
import { eventsService } from '@/lib/api/events';
import { useNotification } from '@/lib/context/notification';
import { businessInfoSchema, companyDetailsSchema, personalInfoSchema } from '@/schema/auth.schema';
import { TicketCard } from '@/components/ui/TicketCard';
import { TicketConfiguratorModal } from '@/components/ui/TicketConfiguratorModal';
import { BDTIcon } from '@/components/ui/Icons';
import { formatDate, formatTime } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { DocumentUploader } from '@/components/ui/DocumentUploader';
import { ScheduleBuilder } from '@/components/ui/ScheduleBuilder';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { 
  basicInfoSchema, 
  eventDetailsSchema, 
  venueSchema,
  scheduleSchema,
  logisticsSchema, 
  verificationSchema, 
  ticketsStepSchema,
  platformSchema,
  validateTicketCapacity,
  validateUniqueTicketNames
} from '@/schema/event.schema';
import { generateDescription } from '@/lib/generators/description';

interface RegisterProps {
  onSuccess: () => void;
  onGoBack: () => void;
}

type Step = 'basic' | 'details' | 'venue' | 'schedule' | 'verification' | 'tickets' | 'platform';
const eventCategory = ['concert', 'sports', 'conference', 'festival', 'theater', 'comedy', 'networking'];
const venueType = ['indoor', 'outdoor', 'hybrid'];
interface document {
  type: string;
  url: string;
  filename: string;
  objectKey: string;
}

interface ticket {
 name: string;
  price: {
    amount: number;
    currency: string;
  },
  quantity: number,
  // Visual customization
  wristbandColor: string,
  // Metadata
  isVisible: boolean,
  isActive: boolean,
  benefits: string[],
  tier: string, 
}

interface FormData {
  title: string;
  tagline: string;
  category: string;
  subCategory: string[];
  media: {
    coverImage: {
      url: string;
      alt: string;
      thumbnailUrl: string;
    }
  };
  description: string;
  schedule: {
    startDate: string;
    endDate: string;
    isMultiDay: boolean;
    timezone: string;
    doors: string;
    type: 'single' | 'multiple';
    sessions: any[];
  };
  venue: {
    name: string;
    address: {
      street: string;
      city: string;
    };
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
    capacity: number;
    type: 'indoor' | 'outdoor' | 'hybrid';
  };
  verification: {
    documents: document[];
  };
  tickets: ticket[];
  platform: {
    terms: {
      termsAccepted: boolean;
      legalPermissionAccepted: boolean;
      platformTermsAccepted: boolean;
    }
  };
}

export const CreateEvent: React.FC<RegisterProps> = ({ onSuccess, onGoBack }) => {
  const { showNotification } = useNotification();
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null);
  const [scheduleModalState, setScheduleModalState] = useState<'date' | 'start-time' | 'end-time' | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSparkling, setIsSparkling] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const companyType = ['organizer', 'venue_owner', 'representative', 'artist'];
  const [formData, setFormData] = useState<FormData>({
    title: '',
    tagline: '',
    category: 'concert',
    subCategory: [],
    media: {
      coverImage: {
        url: '',
        alt: '',
        thumbnailUrl: '',
      }
    },
    description: '',
    schedule: {
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      isMultiDay: false,
      timezone: 'Asia/Dhaka',
      doors: '10:00 AM',
      type: 'single',
      sessions: [],
    },
    venue: {
      name: '',
      address: {
        street: '',
        city: '',
      },
      coordinates: {
        type: 'Point',
        coordinates: [0, 0],
      },
      capacity: 100,
      type: 'indoor'
    },
    verification: {
      documents: []
    },
    tickets: [],
    platform: {
      terms: {
        termsAccepted: true,
        legalPermissionAccepted: true,
        platformTermsAccepted: true,
      }
    },
  });

  // Animation styles for the sparkle button
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes sparkle {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
        100% { transform: scale(1) rotate(360deg); opacity: 0; }
      }
      .animate-sparkle {
        animation: sparkle 0.8s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId');
    if (draftId) {
      setDraftId(draftId);
    }
  }, []);

  useEffect(() => {
    if (draftId) {
      getDraft();
    }
  }, [draftId]);

  const getDraft = async () => {
    if (draftId) {
      const draft = await eventsService.getDraft(draftId);
      if (draft) {
        for (const key in formData) {
          if (draft[key] !== undefined) {
            setFormData(prev => ({
              ...prev,
              [key]: draft[key]
            }));
          }
        }
      }
    }
  }

  // Filter out empty strings, arrays, and objects
  const filterEmptyValues = (obj: any): any => {
    if (Array.isArray(obj)) {
      const filtered = obj.filter(item => {
        if (typeof item === 'string') return item.trim() !== '';
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object' && item !== null) {
          const cleaned = filterEmptyValues(item);
          return cleaned && Object.keys(cleaned).length > 0;
        }
        return item !== null && item !== undefined;
      });
      return filtered.length > 0 ? filtered : undefined;
    }

    if (typeof obj === 'object' && obj !== null) {
      const filtered: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // Skip empty strings, null, undefined
        if (value === '' || value === null || value === undefined) {
          return;
        }
        
        if (Array.isArray(value)) {
          const filteredArray = filterEmptyValues(value);
          if (filteredArray && filteredArray.length > 0) {
            filtered[key] = filteredArray;
          }
        } else if (typeof value === 'object') {
          const filteredObj = filterEmptyValues(value);
          if (filteredObj && Object.keys(filteredObj).length > 0) {
            filtered[key] = filteredObj;
          }
        } else {
          filtered[key] = value;
        }
      });
      return Object.keys(filtered).length > 0 ? filtered : undefined;
    }

    return obj;
  };



  const handleAutoFillDescription = () => {
    setIsSparkling(true);
    
    // Generate description after a small delay for animation
    setTimeout(() => {
      const description = generateDescription(
        formData.category,
        formData.title,
        formData.tagline
      );
      
      setFormData(prev => ({ ...prev, description }));
      if (errors.description) {
        setErrors(prev => ({ ...prev, description: '' }));
      }
      
      // Stop animation
      setTimeout(() => setIsSparkling(false), 800);
    }, 400);
  };

  // Manual save draft handler
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // Filter out empty values before saving
      const cleanedData = filterEmptyValues(formData);
      
      if (draftId) {
        // Update existing draft
        await eventsService.updateDraft(draftId, cleanedData as any);
        showNotification('success', 'Draft Saved', 'Your event draft has been updated successfully');
      } else {
        // Create new draft
        const response = await eventsService.createDraft(cleanedData as any);
        setDraftId(response.eventId);
        
        // Update URL with draftId
        const url = new URL(window.location.href);
        url.searchParams.set('draftId', response.eventId);
        window.history.pushState({}, '', url.toString());
        
        showNotification('success', 'Draft Created', 'Your event draft has been saved successfully');
      }
    } catch (error: any) {
      showNotification('error', 'Save Failed', error?.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateVenueField = (field: keyof typeof formData.venue, value: any) => {
    setFormData(prev => ({
      ...prev,
      venue: { ...prev.venue, [field]: value }
    }));
    if (errors[`venue.${field}`]) {
      setErrors(prev => ({ ...prev, [`venue.${field}`]: '' }));
    }
  };

  const updateVenueAddress = (field: keyof typeof formData.venue.address, value: string) => {
    setFormData(prev => ({
      ...prev,
      venue: {
        ...prev.venue,
        address: { ...prev.venue.address, [field]: value }
      }
    }));
    if (errors[`venue.address.${field}`]) {
      setErrors(prev => ({ ...prev, [`venue.address.${field}`]: '' }));
    }
  };

  const updateScheduleField = (field: keyof typeof formData.schedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }));
    if (errors[`schedule.${field}`]) {
      setErrors(prev => ({ ...prev, [`schedule.${field}`]: '' }));
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    try {
      let result;
      const newErrors: Record<string, string> = {};
      
      if (currentStep === 'basic') {
        result = basicInfoSchema.safeParse({
          title: formData.title,
          tagline: formData.tagline,
          category: formData.category,
        });
      } else if (currentStep === 'details') {
        result = eventDetailsSchema.safeParse({
          description: formData.description,
          coverImage: formData.media?.coverImage?.url || '',
        });
      } else if (currentStep === 'venue') {
        result = venueSchema.safeParse({
          venue: {
            name: formData.venue.name,
            capacity: Number(formData.venue.capacity) || 0,
            address: {
              street: formData.venue.address.street || '',
              city: formData.venue.address.city || '',
              country: 'Bangladesh',
            },
          },
        });
      } else if(currentStep === 'schedule') {
        result = scheduleSchema.safeParse({
          schedule: {
            startDate: formData.schedule.startDate,
            endDate: formData.schedule.endDate,
            doors: formData.schedule.doors,
          },
        });
      } else if (currentStep === 'verification') {
        result = verificationSchema.safeParse({
          verification: formData.verification,
        });
      } else if (currentStep === 'tickets') {
        // Validate tickets
        result = ticketsStepSchema.safeParse({
          tickets: formData.tickets,
        });

        // Additional custom validations
        if (result && result.success) {
          // Check total capacity
          const capacityCheck = validateTicketCapacity(formData.tickets, formData.venue.capacity);
          if (!capacityCheck.valid) {
            newErrors.tickets = capacityCheck.error!;
            setErrors(newErrors);
            showNotification('error', 'Validation Error', capacityCheck.error!);
            return false;
          }

          // Check unique names
          const uniqueCheck = validateUniqueTicketNames(formData.tickets);
          if (!uniqueCheck.valid) {
            newErrors.tickets = uniqueCheck.error!;
            setErrors(newErrors);
            showNotification('error', 'Validation Error', uniqueCheck.error!);
            return false;
          }
        }
      } else if (currentStep === 'platform') {
        result = platformSchema.safeParse({
          termsAccepted: formData.platform.terms.termsAccepted,
          legalPermissionAccepted: formData.platform.terms.legalPermissionAccepted,
          platformTermsAccepted: formData.platform.terms.platformTermsAccepted,
        });
      }

      if (result && !result.success) {
        result.error.issues.forEach((err: any) => {
          const fieldPath = err.path.join('.');
          newErrors[fieldPath] = err.message;
        });
        setErrors(newErrors);
        
        // Show first error as notification
        const firstError = Object.values(newErrors)[0];
        showNotification('error', 'Validation Error', firstError);
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error: any) {
      console.error('Validation error:', error);
      showNotification('error', 'Validation Error', 'An unexpected error occurred');
      return false;
    }
  };

  const handleNext = (nextStep: Step) => {
    if (validateStep(step)) {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step === 'basic') {
      onGoBack();
    } else if (step === 'details') {
      setStep('basic');
    } else if (step === 'venue') {
      setStep('details');
    } else if (step === 'schedule') {
      setStep('venue');
    } else if (step === 'verification') {
      setStep('schedule');
    } else if (step === 'tickets') {
      setStep('verification');
    } else if (step === 'platform') {
      setStep('tickets');
    } else {
      setStep('platform');
    }
  };

  const handleAddTicket = () => {
    setEditingTicketIndex(null);
    setIsTicketModalOpen(true);
  };

  const handleEditTicket = (index: number) => {
    setEditingTicketIndex(index);
    setIsTicketModalOpen(true);
  };

  const handleDeleteTicket = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.filter((_, i) => i !== index)
    }));
    showNotification('success', 'Ticket Deleted', 'Ticket has been removed successfully');
  };

  const handleSaveTicket = (ticketData: any) => {
    if (editingTicketIndex !== null) {
      // Edit existing ticket
      setFormData(prev => ({
        ...prev,
        tickets: prev.tickets.map((t, i) => 
          i === editingTicketIndex 
            ? {
                name: ticketData.name,
                tier: ticketData.tier,
                price: { amount: ticketData.price, currency: 'BDT' },
                quantity: ticketData.quantity,
                wristbandColor: ticketData.wristbandColor,
                benefits: ticketData.benefits,
                isVisible: true,
                isActive: true,
              }
            : t
        )
      }));
      showNotification('success', 'Ticket Updated', 'Ticket has been updated successfully');
    } else {
      // Check capacity before adding new ticket
      const currentTotal = getTotalTicketsAllocated();
      const newTotal = currentTotal + ticketData.quantity;
      
      if (formData.venue.capacity > 0 && newTotal > formData.venue.capacity) {
        showNotification(
          'error', 
          'Capacity Exceeded', 
          `Cannot add ticket. Total tickets (${newTotal}) would exceed venue capacity (${formData.venue.capacity})`
        );
        return;
      }
      
      // Add new ticket
      setFormData(prev => ({
        ...prev,
        tickets: [...prev.tickets, {
          name: ticketData.name,
          tier: ticketData.tier,
          price: { amount: ticketData.price, currency: 'BDT' },
          quantity: ticketData.quantity,
          wristbandColor: ticketData.wristbandColor,
          benefits: ticketData.benefits,
          isVisible: true,
          isActive: true,
        }]
      }));
      showNotification('success', 'Ticket Created', 'New ticket has been added successfully');
    }
  };

  const getTotalTicketsAllocated = () => {
    return formData.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  const getCapacityPercentage = () => {
    if (formData.venue.capacity === 0) return 0;
    return Math.min((getTotalTicketsAllocated() / formData.venue.capacity) * 100, 100);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-white mt-20">
      <div className="max-w-[600px] mx-auto px-6 py-12">
        {/* Top nav: back + step dots */}
        <div className="mb-10 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-wix-text-muted hover:text-wix-text-dark transition-colors text-[14px] font-medium group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {step === 'basic' ? 'Back' : 'Previous'}
          </button>
          <div className="flex gap-1.5">
            {(['basic', 'details', 'venue', 'schedule', 'verification', 'tickets', 'platform'] as Step[]).map((s) => (
              <div key={s} className={`h-1 w-8 transition-all duration-500 ${step === s ? 'bg-wix-text-dark' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'basic' && (
            <motion.div key="basic" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 1 of 7 — Basic Information</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Basic Information</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">How should we identify your event?</p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-wix-text-dark">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Gala Night 2026"
                  className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-wix-text-dark">Event Category *</label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {eventCategory.map((category) => {
                    const isActive = formData.category === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          updateField('category', category);
                        }}
                        className={`px-3 py-2 text-sm border transition-all ${
                          isActive
                            ? 'border-wix-text-dark bg-wix-text-dark text-white'
                            : 'border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    );
                  })}

                  {/* Custom Category */}
                  {!isCustomCategory ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(true);
                        updateField('category', '');
                      }}
                      className="px-3 py-2 text-sm border border-dashed border-gray-300 text-gray-500 hover:border-wix-text-dark hover:text-wix-text-dark transition-all"
                    >
                      + Add custom
                    </button>
                  ) : (
                    <input
                      autoFocus
                      type="text"
                      placeholder="Custom category"
                      value={formData.category || ''}
                      onChange={(e) => updateField('category', e.target.value)}
                      onBlur={() => {
                        if (!formData.category?.trim()) {
                          setIsCustomCategory(false);
                        }
                      }}
                      className="px-3 text-center py-2 text-[13px] bg-white border border-wix-text-dark outline-none transition-all"
                    />
                  )}
                </div>

                {errors.category && (
                  <p className="text-xs text-red-500 ml-1">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-wix-text-dark">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Experience the magic of music"
                  className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                />
                {errors.tagline && <p className="text-xs text-red-500">{errors.tagline}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('details')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Details
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 2 of 7 — Event Details</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Event Details</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Tell us more about your event.</p>
              </div>


              <ImageUploader
                type="event_cover"
                maxSizeMB={5}
                acceptedFormats={['image/jpeg', 'image/png']}
                onUploadComplete={(url, fileId) => {
                  setFormData(prev => ({
                    ...prev,
                    media: {
                      ...prev.media,
                      coverImage: {
                        url,
                        alt: formData.title || 'Event cover image',
                        thumbnailUrl: url
                      }
                    }
                  }));
                }}
                onUploadError={(error) => {
                  setErrors(prev => ({ ...prev, coverImage: error }));
                }}
                currentImage={formData.media?.coverImage?.url || ''}
              />


              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Description *</label>
                  <button
                    onClick={handleAutoFillDescription}
                    type="button"
                    disabled={isSparkling || !formData.title || !formData.category}
                    className="text-xs flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-full hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Sparkles 
                      size={14} 
                      className={`transition-all ${isSparkling ? "animate-sparkle text-yellow-500 fill-yellow-500" : "group-hover:text-brand-500"}`} 
                    />
                    {isSparkling ? "Magic..." : "Auto-fill"}
                  </button>
                </div>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Event description"
                  maxLength={5000}
                  className="w-full min-h-[150px] px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-purple-600 focus:bg-white outline-none transition-all"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description
                    ? <p className="text-xs text-red-500">{errors.description}</p>
                    : <span />
                  }
                  <span className={`text-xs font-mono tabular-nums ml-auto ${
                    (formData.description?.length || 0) > 5000
                      ? 'text-red-500'
                      : (formData.description?.length || 0) > 4000
                      ? 'text-amber-500'
                      : 'text-neutral-400'
                  }`}>
                    {formData.description?.length || 0} / 5000
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('venue')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Venue Setup
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'venue' && (
            <motion.div key="venue" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 3 of 7 — Venue Setup</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Venue Setup</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Setup your event logistics.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Venue Name *</label>
                  <input
                    type="text"
                    value={formData.venue.name || ''}
                    onChange={(e) => updateVenueField('name', e.target.value)}
                    placeholder="Grand Hotel"
                    className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                  />
                  {errors['venue.name'] && <p className="text-xs text-red-500">{errors['venue.name']}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Venue Capacity *</label>
                  <input
                    type="text"
                    value={formData.venue.capacity || ''}
                    onChange={(e) => updateVenueField('capacity', Number(e.target.value) || 0)}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                  />
                  {errors['venue.capacity'] && <p className="text-xs text-red-500">{errors['venue.capacity']}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Venue Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {venueType.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateVenueField('type', type as 'indoor' | 'outdoor' | 'hybrid')}
                      className={`px-3 py-2 text-[13px] font-medium transition-all border ${
                        formData.venue?.type === type
                          ? 'border-wix-text-dark bg-wix-text-dark text-white'
                          : 'border-wix-border-light hover:border-wix-text-dark bg-white text-wix-text-dark'
                      }`}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
                {errors['venue.type'] && <p className="text-xs text-red-500 ml-1">{errors['venue.type']}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Venue Street *</label>
                  <input
                    type="text"
                    value={formData?.venue?.address?.street || ''}
                    onChange={(e) => updateVenueAddress('street', e.target.value)}
                    placeholder="123 Main St"
                    className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                  />
                  {errors['venue.address.street'] && <p className="text-xs text-red-500">{errors['venue.address.street']}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Venue City *</label>
                  <input
                    type="text"
                    value={formData?.venue?.address?.city || ''}
                    onChange={(e) => updateVenueAddress('city', e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-black focus:border-black outline-none transition-colors text-[15px]"
                  />
                  {errors['venue.address.city'] && <p className="text-xs text-red-500">{errors['venue.address.city']}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('schedule')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Schedule
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'schedule' && (
            <motion.div key="schedule" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 4 of 7 — Schedule</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Event Schedule</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Set up your event dates and times.</p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => updateScheduleField('type', 'single')}
                  className={`px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                    (formData.schedule?.type || 'single') === 'single'
                      ? 'bg-white text-wix-text-dark shadow-sm'
                      : 'text-wix-text-muted hover:text-wix-text-dark'
                  }`}
                >
                  Single Day Event
                </button>
                <button
                  type="button"
                  onClick={() => updateScheduleField('type', 'multiple')}
                  className={`px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                    formData.schedule?.type === 'multiple'
                      ? 'bg-white text-wix-text-dark shadow-sm'
                      : 'text-wix-text-muted hover:text-wix-text-dark'
                  }`}
                >
                  Multi-Day Event
                </button>
              </div>

              {formData.schedule?.type === 'multiple' ? (
                <div className="space-y-2">
                  <ScheduleBuilder
                    sessions={formData.schedule?.sessions || []}
                    onChange={(sessions) => {
                      updateScheduleField('sessions', sessions);
                      if (sessions.length > 0) {
                        const sortedSessions = sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        updateScheduleField('startDate', sortedSessions[0].startTime);
                        updateScheduleField('endDate', sortedSessions[sortedSessions.length - 1].endTime);
                        updateScheduleField('isMultiDay', true);
                      }
                    }}
                  />
                  {errors['schedule.sessions'] && <p className="text-xs text-red-500 ml-1">{errors['schedule.sessions']}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <DateInput
                    label="Event Date"
                    value={formData.schedule.startDate || ''}
                    isOpen={scheduleModalState === 'date'}
                    onOpen={() => setScheduleModalState('date')}
                    onClose={() => setScheduleModalState(null)}
                    onChange={(val) => {
                      const date = new Date(val);
                      // Preserve time if it exists, otherwise set to 6 PM
                      if (formData.schedule.startDate) {
                        const oldDate = new Date(formData.schedule.startDate);
                        date.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
                      } else {
                        date.setHours(18, 0, 0, 0);
                      }
                      updateScheduleField('startDate', date.toISOString());
                      
                      // Update end date to same day, 3 hours later
                      const endDate = new Date(date);
                      if (formData.schedule.endDate) {
                        const oldEnd = new Date(formData.schedule.endDate);
                        endDate.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0);
                      } else {
                        endDate.setHours(21, 0, 0, 0);
                      }
                      updateScheduleField('endDate', endDate.toISOString());
                      updateScheduleField('isMultiDay', false);
                      setScheduleModalState(null);
                    }}
                    minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    error={!!errors['schedule.startDate']}
                  />
                  {errors['schedule.startDate'] && <p className="text-xs text-red-500 ml-1">{errors['schedule.startDate']}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    <TimeInput
                      label="Start Time"
                      value={formData.schedule.startDate || ''}
                      isOpen={scheduleModalState === 'start-time'}
                      onOpen={() => setScheduleModalState('start-time')}
                      onClose={() => setScheduleModalState(null)}
                      onChange={(val) => {
                        updateScheduleField('startDate', val);
                        setScheduleModalState(null);
                      }}
                      error={!!errors['schedule.startDate']}
                    />

                    <TimeInput
                      label="End Time"
                      value={formData.schedule.endDate || ''}
                      isOpen={scheduleModalState === 'end-time'}
                      onOpen={() => setScheduleModalState('end-time')}
                      onClose={() => setScheduleModalState(null)}
                      onChange={(val) => {
                        updateScheduleField('endDate', val);
                        setScheduleModalState(null);
                      }}
                      minTime={formData.schedule.startDate ? new Date(new Date(formData.schedule.startDate).getTime() + 60 * 60 * 1000).toISOString() : undefined}
                      error={!!errors['schedule.endDate']}
                    />
                  </div>
                  {errors['schedule.endDate'] && <p className="text-xs text-red-500 ml-1">{errors['schedule.endDate']}</p>}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('verification')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Verification
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'verification' && (
            <motion.div key="verification" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 5 of 7 — Verification</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Verification</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Help us keep the platform safe.</p>
              </div>

              <DocumentUploader
                onUploadComplete={(uploadedFiles) => {
                  // Convert uploaded files to document objects
                  const documents = uploadedFiles.map((file) => ({
                    type: 'verification',
                    url: '', // Backblaze files don't have direct URLs
                    filename: file.filename,
                    objectKey: file.objectKey
                  }));
                  
                  setFormData(prev => ({
                    ...prev,
                    verification: {
                      ...prev.verification,
                      documents: documents
                    }
                  }));
                }}
                onUploadError={(error) => {
                  setErrors(prev => ({ ...prev, 'verification.documents': error }));
                }}
                maxFiles={5}
                maxSizeMB={5}
              />
              {errors['verification.documents'] && <p className="text-xs text-red-500 ml-1">{errors['verification.documents']}</p>}

              {/* Display uploaded documents */}
              {formData.verification?.documents && formData.verification.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-[500] text-neutral-700 ml-1">Uploaded Documents ({formData.verification.documents.length})</label>
                  <div className="space-y-2">
                    {formData.verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-wix-border-light">
                        <div className="flex items-center gap-2">
                          <Upload size={16} className="text-brand-500" />
                          <span className="text-sm text-gray-700">{doc.filename}</span>
                        </div>
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              verification: {
                                ...prev.verification,
                                documents: prev.verification.documents.filter((_, i) => i !== index)
                              }
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('tickets')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Setup Tickets
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'tickets' && (
            <motion.div key="tickets" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 6 of 7 — Tickets</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Setup Tickets</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Create ticket tiers for your attendees.</p>
              </div>

              {/* Capacity Overview */}
              <div className="p-0 pb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className='h-7 sm:h-8 md:h-9 lg:h-10 w-[3px] bg-wix-purple'></div>
                      <p className="text-xl sm:text-2xl md:text-2xl lg:text-2xl font-[300] tracking-wider text-gray-800">
                        {getTotalTicketsAllocated()} <span className="text-[10px] font-[500] text-gray-400 uppercase tracking-[0.1em]">out of</span> {formData.venue.capacity}
                      </p>
                    </div>
                    <p className="text-[10px] font-[300] text-gray-400 uppercase tracking-[0.2em] mt-2">
                      Total Capacity
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 border ${
                    getCapacityPercentage() > 100 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-wix-purple/5 text-wix-text-dark border-wix-border-light'
                  }`}>
                    <div className={`w-2 h-2 rounded-none ${ getCapacityPercentage() > 100 ? 'bg-red-500' : 'bg-wix-text-dark'}`} />
                    <span className="text-[10px] font-[400] text-wix-text-dark uppercase tracking-widest">
                      {Math.round(getCapacityPercentage())}%
                    </span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="w-full h-2 bg-gray-100 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      getCapacityPercentage() > 100 ? 'bg-red-500' : 'bg-wix-text-dark'
                    }`}
                    style={{ width: `${Math.min(getCapacityPercentage(), 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Created Tickets */}
              <section className='space-y-6'>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-xl lg:text-xl font-[300] text-neutral-700 leading-[0.9] tracking-tight">
                    Created Tickets ({formData.tickets.length})
                  </h2>
                  <button
                      onClick={handleAddTicket}
                      title="Add New Ticket" 
                      className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-wix-text-dark border border-wix-border-light hover:border-wix-text-dark transition-all"
                    >
                    <Plus size={14} />
                    Add Ticket
                  </button>
                </div>

                {formData.tickets.length === 0 ? (
                  <div className="p-12 border border-dashed border-gray-300 text-center">
                    <Ticket size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-[14px] text-wix-text-muted mb-4">No tickets created yet</p>
                    <button
                      onClick={handleAddTicket}
                      className="px-6 py-2.5 bg-wix-text-dark text-white hover:bg-black transition-colors text-[13px] font-medium"
                    >
                      Create Your First Ticket
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="max-w-full pb-6 overflow-x-auto">
                        <div className="flex gap-4">
                          {formData.tickets.map((ticket, index) => {
                            const ticketEventDate = new Date(formData.schedule.startDate);
                            const ticketEndDate = new Date(formData.schedule.endDate);
                            
                            return (
                              <div key={index} className="min-w-[300px] w-[300px]">
                                <TicketCard ticket={{
                                  _id: `ticket-${index}`,
                                  tier: ticket.tier,
                                  name: ticket.name,
                                  controls: false,
                                  startDate: ticketEventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                                  endDate: ticketEndDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                                  startTime: formData.schedule.doors,
                                  endTime: formData.schedule.doors,
                                  price: ticket.price.amount,
                                  quantity: ticket.quantity,
                                  benefits: ticket.benefits,
                                  venue: `${formData.venue.name}, ${formData.venue.address.city}`,
                                  onClick: () => {},
                                }}
                                />
                                <div className="flex text-xs font-[400] text-slate-500 items-center gap-2 mt-2 justify-center">
                                  <button 
                                    onClick={() => handleEditTicket(index)}
                                    className="border transition-transform duration-100 flex items-center gap-2 border-gray-300 px-3 py-1.5 hover:bg-gray-50 text-wix-text-dark"
                                  >
                                    <Edit size={12} />
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTicket(index)}
                                    className="border transition-transform duration-100 flex items-center gap-2 border-red-200 hover:bg-red-50 text-red-500 px-3 py-1.5"
                                  >
                                    <Trash size={12} />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </section>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleNext('platform')}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  Review
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'platform' && (
            <motion.div key="platform" {...stepVariants} className="space-y-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-wix-purple">Step 7 of 7 — Review</span>
                <h2 className="text-[30px] font-medium tracking-tight text-wix-text-dark mt-2 leading-tight">Platform Policy</h2>
                <p className="text-wix-text-muted text-[15px] mt-1">Review your event and our Platform Policy.</p>
              </div>

              <div className="px-6 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="group cursor-pointer flex flex-col gap-3 max-w-[400px] w-full"
                >
                  <div className="aspect-[1.6/1] relative overflow-hidden rounded-tr-xl rounded-tl-xl bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <img
                      src={formData.media?.coverImage?.url || 'https://fastly.picsum.photos/id/1084/536/354.jpg?grayscale&hmac=Ux7nzg19e1q35mlUVZjhCLxqkR30cC-CarVg-nlIf60'}
                      alt={formData.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    {formData.category && (
                      <div className="absolute bottom-3 left-3 z-10 bg-[#f0ebff] text-wix-purple text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-semibold text-[#161616] leading-snug line-clamp-2 group-hover:text-wix-purple transition-colors duration-200">
                      {formData.title || "Event Title"}
                    </h3>

                    <div className="flex items-start gap-1.5 text-[12px] text-gray-500 mt-0.5">
                      <Calendar size={14} className="shrink-0 mt-[1px]" />
                      <span>
                        {formatDate(formData.schedule.startDate) || "Event Start Date"}
                        <span className="text-gray-400 ml-1">· {formatTime(formData.schedule.startDate) || "Event Start Time"}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                      <MapPin size={14} className="shrink-0" />
                      <span className="line-clamp-1">{formData.venue?.name || 'Location TBA'}, {formData.venue?.address?.city || ''}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[13px] font-bold text-[#161616]">
                        {formData?.tickets?.[0]?.price?.amount === 0 ? (
                           <span className="bg-[#d2f47c] text-[#161616] text-[11px] px-2.5 py-0.5 rounded-[4px] font-bold">Free</span>
                        ) : (
                          <span>From <BDTIcon className="inline text-[12px]" />{formData?.tickets?.[0]?.price?.amount || "0"}</span>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-400">By Zenvy</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="p-4 bg-wix-purple/5 border border-wix-purple/20 flex items-start gap-3">
                <div className="mt-0.5"><CheckCircle2 size={16} className="text-wix-purple" /></div>
                <p className="text-[13px] text-wix-text-dark font-medium leading-relaxed">
                  By clicking create, you agree to our event verification process, terms and conditions.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-white border border-wix-border-light text-wix-text-muted text-[13px] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:border-wix-text-dark hover:text-wix-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      if (draftId) {
                        await eventsService.submitEvent(draftId, formData);
                        showNotification('success', 'Event submission!', 'Event submitted successfully!');
                        onSuccess();
                      } else {
                        showNotification('error', 'Event submission!', 'Please save draft first');
                      }
                    } catch (error: any) {
                      showNotification('error', 'Event submission!', error.message || 'Failed to submit event');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-wix-text-dark text-white text-[13px] font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                  <CheckCircle2 size={20} />
                </button>
              </div>
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ticket Configurator Modal */}
      <TicketConfiguratorModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setEditingTicketIndex(null);
        }}
        onSave={handleSaveTicket}
        eventData={{
          title: formData.title || 'Your Event',
          venue: `${formData.venue.name}, ${formData.venue.address?.city || ''}`,
          startDate: new Date(formData.schedule.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          endDate: new Date(formData.schedule.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          startTime: formData.schedule.doors,
          endTime: formData.schedule.doors,
        }}
        editingTicket={
          editingTicketIndex !== null && formData.tickets[editingTicketIndex]
            ? {
                name: formData.tickets[editingTicketIndex].name,
                tier: formData.tickets[editingTicketIndex].tier,
                price: formData.tickets[editingTicketIndex].price.amount,
                quantity: formData.tickets[editingTicketIndex].quantity,
                wristbandColor: formData.tickets[editingTicketIndex].wristbandColor,
                benefits: formData.tickets[editingTicketIndex].benefits,
              }
            : null
        }
      />
    </div>
  );
};
