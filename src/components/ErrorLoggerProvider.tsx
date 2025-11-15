'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/lib/errorLogger';

export function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Инициализация error logger
    errorLogger;

    // Устанавливаем userId если есть в localStorage или Telegram WebApp
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        errorLogger.setUserId(userId);
      }

      // Или из Telegram WebApp
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        const tgUserId = (window as any).Telegram.WebApp.initDataUnsafe.user.id;
        errorLogger.setUserId(String(tgUserId));
      }
    } catch (err) {
      console.error('Failed to initialize errorLogger userId:', err);
    }
  }, []);

  return <>{children}</>;
}
