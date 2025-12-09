'use client';

import { useEffect } from 'react';
import { initErrorHandlers } from '@/utils/errorLogger';

/**
 * Компонент для инициализации глобальных обработчиков ошибок
 * Использовать один раз в корневом layout
 */
export function ErrorLoggerInit() {
  useEffect(() => {
    initErrorHandlers();
  }, []);

  return null;
}
