'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, MoreHorizontal, ArrowLeft, Plus, Mic, ArrowUp, Sparkles, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSupport } from '@/lib/context/support';
import { useAuth } from '@/lib/context/auth';
import { Logo } from '@/components/shared/Logo';
import { TypingIndicator } from './TypingIndicator';

const ZennyAvatar = ({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) => {
  if (size === 'small') {
    return (
      <div className="w-8 h-8 bg-[#4a2bed] rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 self-end mb-1 mr-2 shadow-sm">
        <div className="relative w-4 h-4">
          <div className="absolute top-[25%] left-[20%] w-[20%] h-[20%] bg-white rounded-full"></div>
          <div className="absolute top-[25%] right-[20%] w-[20%] h-[20%] bg-white rounded-full"></div>
          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[50%] h-[12%] bg-white/50 rounded-full"></div>
          <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[12%] h-[25%] bg-white/70 rounded-full"></div>
          <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[25%] h-[25%] bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  if (size === 'medium') {
    return (
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
        <div className="relative w-7 h-7">
          <div className="absolute top-[25%] left-[16%] w-[20%] h-[20%] bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-[25%] right-[16%] w-[20%] h-[20%] bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[50%] h-[10%] bg-white/40 rounded-full"></div>
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[10%] h-[25%] bg-white/60 rounded-full"></div>
          <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[25%] h-[25%] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-20 h-20 bg-[#4a2bed] rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
      <div className="relative w-12 h-12">
        <div className="absolute top-[25%] left-[16%] w-[20%] h-[20%] bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[25%] right-[16%] w-[20%] h-[20%] bg-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-[50%] h-[10%] bg-white/30 rounded-full"></div>
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[10%] h-[25%] bg-white/50 rounded-full"></div>
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[20%] h-[20%] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
      </div>
    </div>
  );
};

export const SupportChat = () => {
  const { isOpen, toggleChat } = useSupport();
  const { user } = useAuth();
  const pathname = usePathname();

  // Hide Zenny on event detail pages to avoid overlapping with purchase buttons
  if (pathname?.startsWith('/events/') && pathname !== '/events') {
    return null;
  }

  const [message, setMessage] = useState('');
  const suggestions = [
    "Tell me about your refund policy",
    "Can I trust Zenvy?",
    "How can I host an event?"
  ];
  const [messages, setMessages] = useState<any[]>([
    { id: 1, text: "Hi there! I'm Zenny. Welcome to Zenvy! 👋", sender: 'bot', time: 'Just now' },
    { id: 2, text: "I'm here to help you get started or answer any questions you might have.", sender: 'bot', time: 'Just now' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null); // in minutes
  const [isInQueue, setIsInQueue] = useState(false); // NEW: Track if user is in queue
  const [isClosed, setIsClosed] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping, showTimeout]);

  // Utility to get or create anonymous ID
  const getOrCreateAnonymousId = (): string => {
    const key = 'zenvy_support_session_id';
    let sessionId = localStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, sessionId);
      console.log('🆔 Created new anonymous ID:', sessionId);
    } else {
      console.log('🆔 Using existing anonymous ID:', sessionId);
    }
    
    return sessionId;
  };

  // Connect to WebSocket
  useEffect(() => {
    if (isOpen && !socketRef.current) {
        // Dynamic import to avoid SSR issues if any
        import('socket.io-client').then(({ io }) => {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
            
            // Pass user credentials or anonymous ID for conversation persistence
            const anonymousId = !user ? getOrCreateAnonymousId() : null;
            const userId = user?.sub || anonymousId;
            const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
            
            console.log('🔌 Connecting to support chat:', { userId, userName, isAnonymous: !user });
            
            socketRef.current = io(`${socketUrl}/support`, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                query: {
                    userId,
                    userName,
                    anonymousId: anonymousId || undefined
                }
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to support chat');
            });

            // Handle conversation history on connection/reconnection
            socketRef.current.on('conversation_history', (data: any) => {
                console.log('Received conversation history:', data);
                if (data.messages && data.messages.length > 0) {
                    // Map server messages to client format
                    const formattedMessages = data.messages.map((msg: any, index: number) => ({
                        id: index + 1,
                        text: msg.text,
                        sender: msg.role === 'user' ? 'user' : msg.role === 'agent' ? 'bot' : 'bot',
                        time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    setMessages(formattedMessages);
                    
                    // Update admin active status if conversation is active
                    if (data.status === 'active') {
                        setIsAdminActive(true);
                    }
                } else {
                    // New conversation - show welcome messages
                    setMessages([
                        { id: 1, text: "Hi there! I'm Zenny. Welcome to Zenvy! 👋", sender: 'bot', time: 'Just now' },
                        { id: 2, text: "I'm here to help you get started or answer any questions you might have.", sender: 'bot', time: 'Just now' },
                    ]);
                }
            });

            socketRef.current.on('message', (data: any) => {
                // Clear typing state on response
                setIsTyping(false);
                setShowTimeout(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (longWaitTimeoutRef.current) clearTimeout(longWaitTimeoutRef.current);

                setMessages((prev) => [
                    ...prev, 
                    { 
                        id: Date.now(), 
                        text: data.text, 
                        sender: 'bot', 
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            });

            socketRef.current.on('queue_update', (data: { position: number, total: number, estimatedWaitMinutes?: number }) => {
                setQueuePos(data.position);
                setEstimatedWait(data.estimatedWaitMinutes || null);
                setIsInQueue(true); // User is in queue
            });
            
             socketRef.current.on('admin_joined', (data: any) => {
                 setQueuePos(null); // Clear queue when admin joins
                 setIsInQueue(false); // Re-enable input
                 setIsAdminActive(true); 
                 // Also stop any typing indicators from bot
                 setIsTyping(false);
                 setShowTimeout(false);
                 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                 if (longWaitTimeoutRef.current) clearTimeout(longWaitTimeoutRef.current);
                 
                 // Add message to chat
                 setMessages(prev => [...prev, {
                     id: Date.now(),
                     text: `${data.agentName} has joined the chat`,
                     sender: 'bot',
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 }]);
             });

            socketRef.current.on('escalated', (data: any) => {
                setIsInQueue(true); // Disable input
                setQueuePos(data.position || 1);
                // Add message to chat
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: data.message || "I've placed you in our support queue. Please wait for an agent.",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            });

            socketRef.current.on('conversation_closed', (data: any) => {
                setIsClosed(true);
                setQueuePos(null);
                setIsInQueue(false);
                setIsTyping(false);
                setShowTimeout(false);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: data.message || "Conversation ended.",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            });

            socketRef.current.on('error', (err: any) => {
                console.error('Socket error:', err);
            });
        });
    }

    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };
  }, [isOpen]);

  const handleSend = (textOverride?: string | React.MouseEvent | React.KeyboardEvent) => {
    let finalMessage = message;
    if (typeof textOverride === 'string') {
      finalMessage = textOverride;
    }
    if (!finalMessage.trim() || isClosed) return;

    const userMsg = {
        id: Date.now(), 
        text: finalMessage, 
        sender: 'user', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');

    // Clear existing timeouts
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (longWaitTimeoutRef.current) clearTimeout(longWaitTimeoutRef.current);
    setShowTimeout(false);

    // Initial 500ms delay before showing typing indicator
    // ONLY if admin is not active (otherwise we expect real replies or no indicator)
    if (!isAdminActive) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(true);
          
          // Start 20s timeout for "taking longer than usual" message
          // This runs 20s AFTER typing starts (so 20.5s total from send)
          longWaitTimeoutRef.current = setTimeout(() => {
            setShowTimeout(true);
          }, 20000);
        }, 500);
    }

    if (socketRef.current) {
        socketRef.current.emit('message', { text: userMsg.text });
    }
  };

  const handleRestart = () => {
    // Disconnect and reconnect to get a new session or clear current
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    setMessages([
      { id: Date.now(), text: "Starting a new conversation... 👋", sender: 'bot', time: 'Just now' }
    ]);
    setIsClosed(false);
    setIsAdminActive(false);
    setIsInQueue(false);
    setQueuePos(null);
    setMessage('');
    
    // Slight delay to allow re-connection logic in useEffect to trigger if needed
    // or manually trigger a re-connect by toggling a key or just letting existing useEffect handle isOpen
    // Since isOpen is true, useEffect will re-run if we nullify socketRef
    // But useEffect depends on [isOpen], so it won't re-run unless we toggle isOpen or force it.
    // Better way: emit 'start_new' or just refresh page. 
    // Let's try force re-run by toggling a key or just calling connect function if we extracted it.
    // For now, toggling isOpen quickly is a hack, but let's just use the effect dependency.
    // Actually, we can just reload the window for a full clear, simpler for "Start New".
    window.location.reload(); 
  };

  const handleCloseAndRestart = () => {
    // Emit leave_queue event to close conversation on server
    if (socketRef.current) {
      socketRef.current.emit('leave_queue');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reset state
    setMessages([
      { id: Date.now(), text: "Starting a new conversation... 👋", sender: 'bot', time: 'Just now' }
    ]);
    setIsClosed(false);
    setIsAdminActive(false);
    setIsInQueue(false);
    setQueuePos(null);
    setMessage('');
    
    // Reload to get fresh connection
    window.location.reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Helper to parse Markdown links
  const renderMessageWithLinks = (text: string) => {
    // Regex to match [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Split text by regex
    const parts = text.split(linkRegex);
    const matches = text.match(linkRegex);

    if (!matches) return text;

    const result = [];
    let lastIndex = 0;

    // We need to re-construct the array with text and links
    // The split approach above with capturing groups in JS split adds the groups to the array, 
    // but it can be tricky to map correctly if multiple links exist.
    // Let's use a simpler match/exec loop or just standard split with grouping.
    
    // Better approach:
    const elements = [];
    let match;
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      
      // Add the link
      elements.push(
        <a 
          key={match.index} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline decoration-current text-brand-600 font-medium hover:opacity-80 transition-opacity"
        >
          {match[1]}
        </a>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return <>{elements}</>;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans antialiased">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 w-full h-[100dvh] sm:static sm:w-[380px] sm:h-[600px] bg-white sm:rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[10000]"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="text-[16px] font-medium text-wix-text-dark tracking-tight">Zenny</div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleChat}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-all"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Queue Banner - Always Visible */}
            {queuePos !== null && (
                 <div className="bg-blue-50/50 backdrop-blur-sm border-b border-blue-100 p-2 flex justify-center sticky top-0 z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-blue-600 text-[10px] font-medium flex items-center gap-2 uppercase tracking-wide"
                    >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Waiting for agent • Position {queuePos}
                        {estimatedWait && (
                            <span className="text-blue-500">• ~{estimatedWait} min wait</span>
                        )}
                    </motion.div>
                 </div>
            )}

            {/* Chat Area & Empty State */}
            <div className={`flex-1 overflow-y-auto flex flex-col ${messages.length <= 2 ? 'items-center px-6 pt-12 pb-6 bg-white' : 'p-6 space-y-6 bg-slate-50/30'}`}>
              
              {messages.length <= 2 ? (
                <>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 3 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-10"
                  >
                    <ZennyAvatar />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-12"
                  >
                    <h1 className="text-[32px] font-bold text-wix-text-dark leading-tight mb-2">
                      Hello 👋
                    </h1>
                    <p className="text-gray-500 text-[16px]">
                      How can I help you today?
                    </p>
                  </motion.div>

                  <div className="w-full space-y-3 mb-8">
                    {suggestions.map((text, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSend(text)}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-all text-left border border-gray-100 rounded-2xl group hover:shadow-md"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#4a2bed]/10 transition-colors">
                          <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-[#4a2bed] rotate-45" />
                        </div>
                        <span className="text-[15px] font-medium text-wix-text-dark flex-1">{text}</span>
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100/80 px-3 py-1 rounded-full">Today</span>
                  </div>

                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'bot' && (
                        <ZennyAvatar size="small" />
                      )}
                      <div 
                        className={`max-w-[70%] p-4 rounded-2xl text-[12px] font-[400] whitespace-pre-wrap ${
                          msg.sender === 'user' 
                            ? 'bg-[#4a2bed] text-white rounded-tr-none' 
                            : 'bg-white border border-slate-100 text-wix-text-dark rounded-tl-none'
                        }`}
                      >
                        {renderMessageWithLinks(msg.text)}
                        <p className={`text-[9px] mt-2 font-[500] opacity-60 text-right`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="mb-4">
                      <TypingIndicator showTimeout={showTimeout} />
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gray-50 flex-shrink-0">
              {isClosed ? (
                 <div className="flex flex-col items-center gap-3 py-2">
                     <p className="text-xs text-slate-500">This conversation has ended.</p>
                     <button 
                        onClick={handleRestart}
                        className="px-6 py-2 bg-[#4a2bed] text-white text-xs font-medium rounded-xl hover:bg-[#3a20d0] transition-colors shadow-lg shadow-[#4a2bed]/30"
                     >
                        Start New Chat
                     </button>
                 </div>
              ) : isInQueue ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                      <p className="text-xs text-slate-500 text-center">
                          Please wait for an agent to join. You're #{queuePos} in queue.
                      </p>
                      <button 
                         onClick={handleCloseAndRestart}
                         className="px-6 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
                      >
                         Close Chat & Start New
                      </button>
                  </div>
              ) : (
                  <>
                  <div className="relative bg-white rounded-3xl border-2 border-gray-900 p-4 shadow-sm focus-within:shadow-md transition-shadow">
                    <textarea 
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask Zenny anything..."
                      className="w-full text-[15px] font-[400] text-wix-text-dark outline-none placeholder:text-gray-400 resize-none pr-12 bg-transparent"
                    />
                    <div className="absolute bottom-3 right-3">
                      <button 
                        onClick={() => handleSend()}
                        disabled={!message.trim()}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          message.trim() 
                            ? 'bg-[#4a2bed] text-white shadow-lg shadow-[#4a2bed]/30 hover:scale-105' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-[12px] text-gray-400">
                    Zenny can make mistakes. Double-check replies.
                  </p>
                  </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`w-14 h-14 bg-[#4a2bed] text-white rounded-[20px] shadow-lg shadow-[#4a2bed]/30 flex items-center justify-center transition-all duration-300 border-2 border-white ${isOpen ? 'rotate-90 opacity-0 pointer-events-none absolute' : 'opacity-100'}`}
      >
        <ZennyAvatar size="medium" />
      </motion.button>
    </div>
  );
};
