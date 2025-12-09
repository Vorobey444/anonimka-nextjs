'use client';

import React, { Component, ReactNode } from 'react';
import { logErrorToServer } from '@/utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary компонент для перехвата ошибок React и их логирования
 * Портировано из системы логирования WORK/public/webapp/app.js
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('❌ [ErrorBoundary] Перехвачена ошибка:', error, errorInfo);
    
    // Логируем ошибку на сервер
    logErrorToServer(
      {
        message: error.message,
        stack: error.stack || errorInfo.componentStack || '',
      },
      'error'
    );
  }

  render() {
    if (this.state.hasError) {
      // Показываем fallback UI, если он передан
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Дефолтный UI ошибки
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#856404' }}>⚠️ Что-то пошло не так</h2>
          <p style={{ color: '#856404' }}>
            Произошла ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
