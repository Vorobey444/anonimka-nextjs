'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку
    console.error('🚨 App Error:', error);
    
    // Проверяем на ошибку рассинхрона версий
    const isVersionMismatch = 
      error.message?.includes('Failed to find Server Action') ||
      error.message?.includes('older or newer deployment') ||
      error.message?.includes('NEXT_NOT_FOUND');
    
    if (isVersionMismatch) {
      console.log('🔄 Обнаружен рассинхрон версий, перезагружаем страницу...');
      // Очищаем кеш и перезагружаем
      if (typeof window !== 'undefined') {
        // Добавляем параметр для обхода кеша
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now().toString());
        window.location.href = url.toString();
      }
      return;
    }
  }, [error]);

  // Проверяем на ошибку версий
  const isVersionError = 
    error.message?.includes('Failed to find Server Action') ||
    error.message?.includes('older or newer deployment');

  if (isVersionError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#e0e0e0'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔄</div>
        <h2 style={{ marginBottom: '15px', color: '#00d9ff' }}>Обновление приложения</h2>
        <p style={{ marginBottom: '25px', color: '#888', maxWidth: '300px' }}>
          Доступна новая версия. Страница будет перезагружена автоматически.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #00d9ff, #8338ec)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Обновить сейчас
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e0'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>😔</div>
      <h2 style={{ marginBottom: '15px', color: '#ff6b6b' }}>Что-то пошло не так</h2>
      <p style={{ marginBottom: '25px', color: '#888', maxWidth: '300px' }}>
        Произошла ошибка. Попробуйте обновить страницу.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 25px',
            background: 'rgba(0, 217, 255, 0.2)',
            border: '1px solid rgba(0, 217, 255, 0.5)',
            borderRadius: '25px',
            color: '#00d9ff',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          Попробовать снова
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 25px',
            background: 'linear-gradient(135deg, #00d9ff, #8338ec)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '0.95rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}
