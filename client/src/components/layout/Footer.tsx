'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  const router = useRouter();

  return (
    <footer className="bg-ink text-bg/60 py-20 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <button 
              onClick={() => router.push('/')}
              className="text-2xl font-serif tracking-tight font-semibold flex items-center gap-2 text-bg mb-6"
            >
              <div className="w-8 h-8 bg-bg rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-ink rounded-sm rotate-45" />
              </div>
              Zenvy
            </button>
            <p className="text-sm leading-relaxed mb-8">
              The premier event discovery and ticketing platform for the modern Bangladeshi audience.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-bg transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-bg transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-bg transition-colors"><Facebook size={20} /></a>
            </div>
          </div>
          
          <div>
            <h5 className="text-bg font-medium mb-6 uppercase tracking-widest text-xs">Explore</h5>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => router.push('/events')} className="hover:text-bg transition-colors">All Events</button></li>
              <li><a href="#" className="hover:text-bg transition-colors">Music Concerts</a></li>
              <li><a href="#" className="hover:text-bg transition-colors">Art Exhibitions</a></li>
              <li><a href="#" className="hover:text-bg transition-colors">Tech Summits</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-bg font-medium mb-6 uppercase tracking-widest text-xs">For Organizers</h5>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => router.push('/host/dashboard')} className="hover:text-bg transition-colors">Dashboard</button></li>
              <li><button onClick={() => router.push('/host/events/create')} className="hover:text-bg transition-colors">Create Event</button></li>
              <li><a href="#" className="hover:text-bg transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-bg transition-colors">Resources</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-bg font-medium mb-6 uppercase tracking-widest text-xs">Support</h5>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-bg transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-bg transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-bg transition-colors">Privacy Policy</a></li>
              <li><button onClick={() => router.push('/contact')} className="hover:text-bg transition-colors">Contact Us</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs uppercase tracking-widest">
          <p>© 2026 Zenvy Technologies Ltd. All rights reserved.</p>
          <p>Made with precision in Dhaka.</p>
        </div>
      </div>
    </footer>
  );
};
