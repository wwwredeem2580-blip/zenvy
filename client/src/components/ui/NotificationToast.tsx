'use client';

import { useNotification } from '@/lib/context/notification';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'text-green-600 bg-green-50 border-green-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-wix-purple bg-wix-purple/10 border-wix-purple/30',
};

export function NotificationToast() {
  const { notification, isVisible, hideNotification } = useNotification();

  if (!notification) return null;

  const Icon = iconMap[notification.type] || Info;
  const colorClass = colorMap[notification.type] || colorMap.info;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-6 right-6 z-[6000] max-w-[400px] w-[calc(100%-48px)] sm:w-full"
        >
          <div
            className={`flex items-start gap-3 p-4 border rounded-none ${colorClass} shadow-lg`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-semibold text-wix-text-dark">
                {notification.title}
              </h4>
              <p className="text-[13px] text-wix-text-muted mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={hideNotification}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
