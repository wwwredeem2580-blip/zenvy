'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Event {
  _id: string;
  slug: string;
  title: string;
  tagline?: string;
  media: {
    coverImage: {
      url: string;
    };
  };
  venue: {
    name: string;
    address: {
      city: string;
    };
  };
  schedule: {
    startDate: string;
    endDate: string;
  };
}

interface PastEventsShowcaseProps {
  events: Event[];
}

export default function PastEventsShowcase({ events }: PastEventsShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovered && events.length > 0) {
      autoScrollTimer.current = setInterval(() => {
        next();
      }, 5000);
    }
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [isHovered, currentIndex, events.length]);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 bg-white overflow-hidden relative border-t border-black/5">
      {/* Background Text Overlay */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.03] select-none">
        <h2 className="text-[20vw] font-black uppercase leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-black">
          Past Events
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mb-0 flex items-end justify-between relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-indigo-500" />
            <span className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.3em]">Showcase</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-light text-[#161616] tracking-tight">
            Past <span className="font-serif italic text-indigo-400">Events</span>
          </h2>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={prev}
            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-300"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={next}
            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-300"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div 
        className="relative h-[350px] mb-12"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center h-full relative cursor-grab active:cursor-grabbing">
          <AnimatePresence initial={false} mode="popLayout">
            {events.map((event, index) => {
              // Calculate relative position to current index
              let position = index - currentIndex;
              
              // Handle wrap-around for circular carousel logic
              if (position > events.length / 2) position -= events.length;
              if (position < -events.length / 2) position += events.length;

              const isCenter = position === 0;
              const isClose = Math.abs(position) === 1;

              return (
                <motion.div
                  key={event._id}
                  initial={false}
                  animate={{
                    x: position * 360, // Fixed card width + gap
                    scale: isCenter ? 1.15 : isClose ? 0.9 : 0.7,
                    opacity: isCenter ? 1 : isClose ? 0.5 : 0,
                    zIndex: isCenter ? 20 : 10,
                    rotateY: position * -15, // Perspective effect
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 30
                  }}
                  className="absolute w-[320px] md:w-[380px] aspect-[1.4/1] rounded-none overflow-hidden bg-white border border-black/5 shadow-2xl origin-center group"
                  onClick={() => isCenter && router.push(`/events/${event.slug || event._id}`)}
                >
                  {/* Card Image */}
                  <div className="absolute inset-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700">
                    <img 
                      src={event.media?.coverImage?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="flex justify-center gap-3 relative z-10">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-500 rounded-full h-1.5 ${
              i === currentIndex ? 'w-8 bg-indigo-500' : 'w-1.5 bg-black/20 hover:bg-black/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
