import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Calendar, Clock10, Building2, User, Save, Upload, X, Trash, Loader2, AlertCircle, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';
import Switch from '@/components/ui/Switch';
import { HostEventDetailsResponse } from '@/lib/api/host-analytics';
import { DocumentUploader } from '@/components/ui/DocumentUploader';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { useNotification } from '@/lib/context/notification';
import { eventsService } from '@/lib/api/events';
import { cleanText } from '@/lib/utils';

interface EventDetailsTabProps {
  data: HostEventDetailsResponse | null;
  onUpdate: (newData: HostEventDetailsResponse) => void;
}

export const EventDetailsTab = ({ data, onUpdate }: EventDetailsTabProps) => {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [description, setDescription] = useState(data?.event?.description || '');
  const [tagline, setTagline] = useState(data?.event?.tagline || '');
  const [coverImage, setCoverImage] = useState(data?.event?.media?.coverImage?.url || '');
  const [gallery, setGallery] = useState(data?.event?.media?.gallery || []);
  const [scheduleStart, setScheduleStart] = useState(data?.event?.schedule?.startDate || '');
  const [scheduleEnd, setScheduleEnd] = useState(data?.event?.schedule?.endDate || '');
  const { showNotification } = useNotification();
  
  // Save functionality state
  const [saving, setSaving] = useState(false);
  const [galleryUploaderKey, setGalleryUploaderKey] = useState(0);
  
  // Schedule date/time picker state
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  
  // Schedule confirmation modal state
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);
  const [pendingScheduleChange, setPendingScheduleChange] = useState<{start: string, end: string} | null>(null);

  // Sync state with data when data loads
  useEffect(() => {
    if (data?.event) {
        setDescription(data.event.description || '');
        setTagline(data.event.tagline || '');
        setCoverImage(data.event.media?.coverImage?.url || '');
        setGallery(data.event.media?.gallery || []);
        setScheduleStart(data.event.schedule?.startDate || '');
        setScheduleEnd(data.event.schedule?.endDate || '');
    }
  }, [data?.event?._id]);

  // Check if schedule can be modified
  const canModifySchedule = () => {
    const status = data?.event?.status;
    const scheduleModified = data?.event?.schedule?.scheduleModified;
    
    // Only approved events can modify schedule, and only once
    return status === 'approved' && !scheduleModified;
  };

  // Validate schedule change is within ±2 hours
  const validateScheduleChange = (newStart: string, newEnd: string): boolean => {
    if (!data?.event?.schedule) return false;
    
    const originalStart = new Date(data.event.schedule.startDate);
    const originalEnd = new Date(data.event.schedule.endDate);
    const newStartDate = new Date(newStart);
    const newEndDate = new Date(newEnd);
    
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    
    const startDiff = Math.abs(newStartDate.getTime() - originalStart.getTime());
    const endDiff = Math.abs(newEndDate.getTime() - originalEnd.getTime());
    
    return startDiff <= TWO_HOURS_MS && endDiff <= TWO_HOURS_MS;
  };

  const handleSave = async () => {
    if (!data?.event) return;
    
    try {
      setSaving(true);
      
      // Validate schedule changes for approved events
      if (canModifySchedule() && (scheduleStart !== data.event.schedule?.startDate || scheduleEnd !== data.event.schedule?.endDate)) {
        if (!validateScheduleChange(scheduleStart, scheduleEnd)) {
          showNotification(
            'error',
            'Invalid Schedule Change',
            'Schedule can only be modified by ±2 hours from the original time.'
          );
          setSaving(false);
          return;
        }
        
        // Show warning for schedule modification
        setPendingScheduleChange({ start: scheduleStart, end: scheduleEnd });
        setShowScheduleConfirm(true);
        setSaving(false);
        return;
      }
      
      // Prepare update data
      const updateData: any = {
        description,
        tagline,
        media: {
          coverImage: {
            url: coverImage,
            alt: data.event.media?.coverImage?.alt || data.event.title,
            thumbnailUrl: data.event.media?.coverImage?.url
          },
          gallery
        }
      };

      // Add schedule if modified
      if (canModifySchedule() && (scheduleStart !== data.event.schedule?.startDate || scheduleEnd !== data.event.schedule?.endDate)) {
        updateData.schedule = {
          ...data.event.schedule,
          startDate: scheduleStart,
          endDate: scheduleEnd,
          scheduleModified: true
        };
      }
      
      // Call backend API
      const result = await eventsService.updateEventByStatus(
        data.event._id,
        data.event.status,
        updateData
      );

      // Handle warnings
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          showNotification('info', 'Notice', warning);
        });
      }

      showNotification('success', 'Changes Saved', result.message || 'Event details have been updated.');
      
      // Update local state with new data
      const updatedData: HostEventDetailsResponse = {
        ...data,
        event: {
          ...data.event,
          description,
          tagline,
          schedule: updateData.schedule || data.event.schedule,
          media: updateData.media
        }
      };
      
      onUpdate(updatedData);
      setMode('preview');
      
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save changes';
      showNotification('error', 'Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalDocumentsSave = async (documents: any) => {
    if(!data?.event) return;
    
    try {
      await eventsService.updateEventByStatus(
        data?.event?._id,
        data?.event?.status,
        { additionalDocuments: documents }
      );
      showNotification('success', 'Changes Saved', 'Event additional documents have been updated.');
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save changes';
      showNotification('error', 'Save Failed', errorMessage);
    }
  };
  
  const handleScheduleConfirm = async () => {
    if (!data?.event || !pendingScheduleChange) return;
    
    try {
      setSaving(true);
      setShowScheduleConfirm(false);
      
      // Prepare update data
      const updateData: any = {
        description,
        tagline,
        media: {
          coverImage: {
            url: coverImage,
            alt: data.event.media?.coverImage?.alt || data.event.title,
            thumbnailUrl: data.event.media?.coverImage?.url
          },
          gallery
        },
        schedule: {
          ...data.event.schedule,
          startDate: pendingScheduleChange.start,
          endDate: pendingScheduleChange.end,
          scheduleModified: true
        }
      };
      
      // Call backend API
      const result = await eventsService.updateEventByStatus(
        data.event._id,
        data.event.status,
        updateData
      );

      // Handle warnings
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          showNotification('info', 'Notice', warning);
        });
      }

      showNotification('success', 'Changes Saved', result.message || 'Event schedule has been updated.');
      
      // Update local state with new data
      const updatedData: HostEventDetailsResponse = {
        ...data,
        event: {
          ...data.event,
          description,
          tagline,
          schedule: updateData.schedule,
          media: updateData.media
        }
      };
      
      onUpdate(updatedData);
      setMode('preview');
      setPendingScheduleChange(null);
      
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save changes';
      showNotification('error', 'Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = (url: string) => {
      setGallery(prev => [...prev, { url, caption: '', thumbnailUrl: url, order: prev.length + 1 }]);
      // Reset the uploader by changing its key
      setGalleryUploaderKey(prev => prev + 1);
  };

  const handleRemoveGalleryImage = (index: number) => {
      setGallery(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <>
    <section className="space-y-6 animate-slide-up mb-24">
      <div className="flex items-center justify-between">
        <Switch
            label={`${mode === 'preview' ? 'Preview' : 'Edit'}`}
            sub={`${mode === 'preview' ? 'Edit' : 'Preview'}`}
            checked={mode === 'preview'}
            onChange={(checked) => setMode(checked ? 'preview' : 'edit')}
          />
         {mode === 'edit' && (
             <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                 {saving ? (
                   <>
                     <Loader2 size={18} className="animate-spin" />
                     <span className="text-sm font-medium">Saving...</span>
                   </>
                 ) : (
                   <>
                     <Save size={18} />
                     <span className="text-sm font-medium">Save Changes</span>
                   </>
                 )}
             </button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Event Details */}
        <div className="md:col-span-1 space-y-6">
          <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-0 bg-slate-50 border border-slate-100 relative group overflow-hidden"
              >
                {/* Image Section */}
                <div className="aspect-[2/1]">
                  <div className="grid h-full grid-cols-[1fr_minmax(18vw,18vw)] md:grid-cols-[1fr_minmax(7vw,7vw)] lg:grid-cols-[1fr_minmax(5vw,5vw)] xl:grid-cols-[1fr_minmax(6vw,6vw)] 2xl:grid-cols-[1fr_minmax(7vw,7vw)] gap-4">

                    {/* Main Image */}
                    <div className="relative overflow-hidden rounded-tr-lg rounded-bl-lg h-full group/cover">
                       {mode === 'edit' ? (
                           <div className="absolute inset-0 w-full h-full">
                               <ImageUploader 
                                    type="event_cover"
                                    currentImage={coverImage}
                                    onUploadComplete={(url) => setCoverImage(url)}
                                    maxSizeMB={5}
                                    acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                               />
                           </div>
                       ) : (
                            <img
                                src={
                                coverImage ||
                                "https://fastly.picsum.photos/id/1084/536/354.jpg?grayscale&hmac=Ux7nzg19e1q35mlUVZjhCLxqkR30cC-CarVg-nlIf60"
                                }
                                alt={
                                data?.event?.media?.coverImage?.alt ||
                                "Event Cover Image"
                                }
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                       )}

                      {data?.event?.status === "live" && mode === 'preview' && (
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-light text-slate-900 border border-slate-100">
                            <span className="w-1.5 h-1.5 animate-pulse bg-emerald-500 rounded-full" />
                            Live
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gallery */}
                    <div className="flex flex-col gap-2 overflow-y-auto h-full pr-1">
                      {gallery.map(
                        (img: any, idx: number) => (
                          <div
                            key={img?.id || idx}
                            className="relative overflow-hidden rounded-tr-sm rounded-bl-sm flex-shrink-0 group/item h-20 w-full"
                          >
                            <img
                              src={
                                img?.url ||
                                `https://picsum.photos/id/${101 + idx}/200/120.jpg`
                              }
                              alt={img?.caption || "Gallery image"}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                            />
                            {mode === 'edit' && (
                                <button 
                                    onClick={() => handleRemoveGalleryImage(idx)}
                                    className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full md:opacity-0 md:group-hover/item:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            )}
                          </div>
                        )
                      )}
                      
                      {/* Add Gallery Image Button (Edit Mode) */}
                      {mode === 'edit' && (
                          <div className="h-20 w-full flex-shrink-0 rounded-tr-sm rounded-bl-sm border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-brand-400 transition-all cursor-pointer flex items-center justify-center group/upload" onClick={() => document.getElementById('gallery-uploader-input')?.click()}>
                            <input
                              id="gallery-uploader-input"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const { mediaService } = await import('@/lib/api/media');
                                    const ImageKit = (await import('imagekit-javascript')).default;
                                    
                                    const auth = await mediaService.getImageKitAuth();
                                    const imagekit = new ImageKit({
                                      publicKey: auth.publicKey,
                                      urlEndpoint: auth.urlEndpoint,
                                    });
                                    
                                    const uploadResponse: any = await new Promise((resolve, reject) => {
                                      imagekit.upload({
                                        file: file,
                                        fileName: `event_gallery_${Date.now()}_${file.name}`,
                                        folder: `/zenvy/event_gallery`,
                                        useUniqueFileName: true,
                                        tags: ['event_gallery'],
                                        signature: auth.signature,
                                        expire: auth.expire,
                                        token: auth.token,
                                      }, (err: any, result: any) => {
                                        if (err) reject(new Error(err.message));
                                        else resolve(result);
                                      });
                                    });
                                    
                                    await mediaService.trackImageKitUpload({
                                      fileId: uploadResponse.fileId,
                                      url: uploadResponse.url,
                                      filename: uploadResponse.name,
                                      type: 'event_gallery',
                                      status: 'permanent',
                                    });
                                    
                                    handleGalleryUpload(uploadResponse.url);
                                    // Reset input
                                    e.target.value = '';
                                  } catch (error) {
                                    console.error('Gallery upload error:', error);
                                  }
                                }
                              }}
                              className="hidden"
                            />
                            <Upload className="w-6 h-6 text-slate-400 group-hover/upload:text-brand-500 transition-colors" />
                          </div>
                      )}
                    </div>

                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-2 ml-[-12px] mb-2">
                    <div className="flex items-center gap-2 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-[300] text-slate-900 border border-slate-100">
                      <Music size={16} className="text-brand-500" strokeWidth={1}/>
                      {data?.event?.category ? `${data.event.category.charAt(0).toUpperCase() + data.event.category.slice(1)}` : 'Category'}
                    </div>
                  </div>
                  <h2 className={`text-2xl font-[300] text-neutral-800 flex justify-between items-center tracking-tight ${mode === 'edit' ? 'opacity-50' : ''}`}>
                    {data?.event?.title || 'Event Name'}
                    {mode === 'edit' && <span className="text-xs text-slate-400 font-normal px-2 py-1 border rounded-md">Locked</span>}
                  </h2>
                  {mode === 'edit' ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Event tagline..."
                        className="w-full text-sm text-neutral-600 font-[300] px-3 py-2 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 font-[300] line-clamp-2 whitespace-pre-wrap">
                      {cleanText(data?.event?.tagline || 'Lorem ipsum dolor sit amet consectetur adipisicing elit.')}
                    </p>
                  )}
                  
                  <div className={`flex flex-col gap-2 mt-4 font-[300] text-slate-700 ${mode === 'edit' && !canModifySchedule() ? 'opacity-50' : ''}`}>
                    {mode === 'edit' && canModifySchedule() ? (
                      <>
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-xs text-amber-800 font-medium">⚠️ Schedule can be modified by ±2 hours only once</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-neutral-600 mb-2">Start Date & Time</p>
                            <div className="grid grid-cols-2 gap-2">
                              <DateInput
                                label="Start Date"
                                value={scheduleStart}
                                isOpen={startDateOpen}
                                onOpen={() => setStartDateOpen(true)}
                                onClose={() => setStartDateOpen(false)}
                                onChange={(date) => setScheduleStart(date)}
                                onNext={() => setStartTimeOpen(true)}
                              />
                              <TimeInput
                                label="Start Time"
                                value={scheduleStart}
                                isOpen={startTimeOpen}
                                onOpen={() => setStartTimeOpen(true)}
                                onClose={() => setStartTimeOpen(false)}
                                onChange={(date) => setScheduleStart(date)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-neutral-600 mb-2">End Date & Time</p>
                            <div className="grid grid-cols-2 gap-2">
                              <DateInput
                                label="End Date"
                                value={scheduleEnd}
                                isOpen={endDateOpen}
                                onOpen={() => setEndDateOpen(true)}
                                onClose={() => setEndDateOpen(false)}
                                onChange={(date) => setScheduleEnd(date)}
                                onNext={() => setEndTimeOpen(true)}
                                minDate={scheduleStart ? new Date(scheduleStart) : undefined}
                              />
                              <TimeInput
                                label="End Time"
                                value={scheduleEnd}
                                isOpen={endTimeOpen}
                                onOpen={() => setEndTimeOpen(true)}
                                onClose={() => setEndTimeOpen(false)}
                                onChange={(date) => setScheduleEnd(date)}
                                minTime={scheduleStart}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-2 text-sm justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="text-neutral-600" size={14} strokeWidth={1}/>
                            {data?.event?.schedule?.startDate ? new Date(data.event.schedule.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date'}
                          </span>
                          {mode === 'edit' && !canModifySchedule() && (
                            <span className="text-xs text-slate-400 font-normal px-2 py-1 border rounded-md">
                              {data?.event?.schedule?.scheduleModified ? 'Already Modified' : 'Locked'}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2 text-sm">
                          <Clock10 className="text-neutral-600" size={14} strokeWidth={1}/>
                          {data?.event?.schedule?.startDate && data?.event?.schedule?.endDate 
                            ? `${new Date(data.event.schedule.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(data.event.schedule.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                            : 'Time'
                          }
                        </span>
                      </>
                    )}
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 ${mode === 'edit' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <section className="p-3 bg-brand-card rounded-xl border border-brand-divider flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-brand-divider overflow-hidden flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-400" strokeWidth={1}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-[500] uppercase tracking-widest text-neutral-600 mb-1">Venue</p>
                            <div className="flex flex-col items-start leading-tight">
                            <p className="text-xs text-neutral-700 font-[400]">{data?.event?.venue?.name || 'Venue Name'}</p>
                            <p className="text-[10px] text-neutral-500 font-[300]">{data?.event?.venue?.address?.city || 'City'}, {data?.event?.venue?.address?.country || 'Country'}</p>
                            </div>
                        </div>
                        </div>
                    </section>
                    <section className="p-3 bg-brand-card rounded-xl border border-brand-divider flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-brand-divider overflow-hidden flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-400" strokeWidth={1}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-[500] uppercase tracking-widest text-neutral-600 mb-1">Organizer</p>
                            <div className="flex flex-col items-start leading-tight">
                            <p className="text-xs text-neutral-700 font-[400]">{data?.event?.organizer?.companyName || 'Compnay Name'}</p>
                            <p className="text-[10px] text-brand-500 font-[300]">View Profile</p>
                            </div>
                        </div>
                        </div>
                    </section>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-[300] text-slate-800">
                        The Experience
                        </p>
                        {mode === 'edit' && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">Editable</span>}
                    </div>
                    {mode === 'edit' ? (
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[150px] p-4 bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm font-[300] text-slate-700 leading-relaxed"
                            placeholder="Describe your event experience..."
                        />
                    ) : (
                        <div className="text-sm font-[300] text-neutral-500 leading-relaxed whitespace-pre-wrap break-words">
                          {cleanText(description) || 'No description provided.'}
                        </div>
                    )}
                  </div>

                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none" />
                <div className="absolute top-48 left-0 w-32 h-32 bg-brand-500/5 rounded-full -ml-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none" />
              </motion.div>
        </div>


        {/* Right Column: Verification Documents (Only for Pending Approval) */}
          <div className="max-w-[400px] mx-auto space-y-6">
              <div className="bg-white p-6 rounded-[2rem] flex flex-col h-full">
                 <div className="mb-6">
                      <h3 className="text-lg font-[300] text-slate-800 mb-2">Additional Verification Documents</h3>
                      <p className="text-xs text-slate-500 font-[300]">Upload additional necessary documents for event verification.</p>
                      <p className="text-xs text-slate-500 font-[300] flex items-start mt-2 gap-2"><AlertCircle className="w-3 h-3 mt-1 text-rose-500" />NOTE: These are for internal review only. Avoid Uploading unnecessary documents. This might delay the approval process.</p>
                 </div>
                 {data?.event?.status === 'pending_approval' ? (
                 <div className="flex-1">
                    <DocumentUploader 
                         onUploadComplete={(files) => {
                             console.log(files);
                             handleAdditionalDocumentsSave(files);
                         }}
                         onUploadError={(err) => {
                             showNotification('error', 'Upload Failed', err);
                         }}
                         maxFiles={5}
                         maxSizeMB={5}
                    />
                 </div>
                 ) : (
                    <p className="text-xs flex items-center gap-2 text-slate-500 font-[300]">
                      <AlertCircle className="w-4 h-4 text-brand-500" />
                      No need to upload documents. Your event is already verified.
                    </p>
                 )}
              </div>
          </div>
      </div>
    </section>
    
    {/* Schedule Change Confirmation Modal */}
    {showScheduleConfirm && data?.event && pendingScheduleChange && createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
          onClick={() => {
            setShowScheduleConfirm(false);
            setPendingScheduleChange(null);
          }}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[500px] bg-white rounded-[2rem] shadow-4xl overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="p-8 pb-4 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Bell className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-[500] text-slate-900 tracking-tight">Schedule Modification</h3>
                <p className="text-xs text-slate-500 font-[300]">This action requires confirmation</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowScheduleConfirm(false);
                setPendingScheduleChange(null);
              }} 
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Warning Message */}
          <div className="px-8 mb-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-900 font-[400] leading-relaxed">
                ⚠️ You are about to modify the event schedule. <strong>This can only be done ONCE.</strong> All attendees will be notified of this change.
              </p>
            </div>
          </div>

          {/* Schedule Comparison */}
          <div className="px-8 mb-8 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Schedule</p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={14} className="text-slate-400" />
                <span>{new Date(data.event.schedule!.startDate).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-2">New Schedule</p>
              <div className="flex items-center gap-2 text-sm text-brand-900 font-[500]">
                <Calendar size={14} className="text-brand-500" />
                <span>{new Date(pendingScheduleChange.start).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <button 
              onClick={() => {
                setShowScheduleConfirm(false);
                setPendingScheduleChange(null);
              }}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-[500] hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleScheduleConfirm}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-[500] hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                'Confirm Change'
              )}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    )}
    </>
  );
};
