'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useRouter } from 'next/navigation'

function MyAdsPageContent() {
  const router = useRouter();
  
  useEffect(() => {
    const loadScripts = async () => {
      const scripts = ['https://telegram.org/js/telegram-web-app.js', '/js/core.js', '/js/my-ads.js'];
      for (const src of scripts) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
    };
    loadScripts();
  }, []);
  
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="myAds" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/main')}>← Назад</button>
            <h2>Мои анкеты</h2>
          </div>

          <div id="myAdsList" className="ads-list">
            {/* Анкеты пользователя будут загружены через JS */}
          </div>
        </div>
      </div>
    </>
  );
}

export default function MyAdsPage() {
  return (
    <ErrorBoundary>
      <MyAdsPageContent />
    </ErrorBoundary>
  )
}
