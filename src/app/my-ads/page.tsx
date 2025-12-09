'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary'

function MyAdsPageContent() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/core.js" defer></script>
      <script src="/js/my-ads.js" defer></script>
      
      <div className="app-container">
        <div id="myAds" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => (window as any).showMainMenu()}>← Назад</button>
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
}
