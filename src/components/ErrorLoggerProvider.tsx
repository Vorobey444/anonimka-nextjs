'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/lib/errorLogger';

export function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Работаем только на клиенте
    if (typeof window === 'undefined' || !errorLogger) return;

    // Устанавливаем userId если есть в localStorage или Telegram WebApp
    try {
      const userId = localStorage.getItem('userId');
      if (userId && errorLogger) {
        errorLogger.setUserId(userId);
      }

      // Или из Telegram WebApp
      if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        const tgUserId = (window as any).Telegram.WebApp.initDataUnsafe.user.id;
        if (errorLogger) {
          errorLogger.setUserId(String(tgUserId));
        }
      }
    } catch (err) {
      console.error('Failed to initialize errorLogger userId:', err);
    }
  }, []);

  return <>{children}</>;
}
