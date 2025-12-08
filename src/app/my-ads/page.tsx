'use client';

export default function MyAdsPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
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
