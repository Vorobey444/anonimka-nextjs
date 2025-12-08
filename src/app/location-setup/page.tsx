'use client';

export default function LocationSetupPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/core.js" defer></script>
      
      <div className="app-container">
        <div id="locationSetup" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" id="locationSetupBackBtn" onClick={() => window.history.back()}>← Назад</button>
            <div className="logo">
              <div className="neon-icon">🌍</div>
              <h1>Выберите вашу страну</h1>
              <p>Это поможет показывать релевантные объявления</p>
            </div>
          </div>
          
          <div className="location-setup-container">
            {/* Кнопка автоопределения */}
            <div className="auto-detect-section" style={{marginBottom: '1.5rem'}}>
              <button type="button" className="neon-button secondary full-width" id="autoDetectBtn">
                📍 Определить автоматически
              </button>
              <p style={{textAlign: 'center', margin: '1rem 0', opacity: 0.7, fontSize: '0.9rem'}}>или выберите вручную</p>
            </div>
            
            {/* Выбор страны */}
            <div className="setup-country-selection">
              <h3>Страна</h3>
              <div className="country-buttons">
                <button type="button" className="country-btn setup-country" data-country="russia">
                  <span className="flag">🇷🇺</span>
                  Россия
                </button>
                <button type="button" className="country-btn setup-country" data-country="kazakhstan">
                  <span className="flag">🇰🇿</span>
                  Казахстан
                </button>
              </div>
            </div>

            {/* Выбор региона */}
            <div className="setup-region-selection" style={{display: 'none'}}>
              <h3>Регион/область</h3>
              <div className="search-container">
                <input type="text" className="setup-region-input" placeholder="Начните вводить название..." />
                <div className="suggestions-list setup-region-suggestions"></div>
              </div>
            </div>

            {/* Выбор города */}
            <div className="setup-city-selection" style={{display: 'none'}}>
              <h3>Город</h3>
              <div className="search-container">
                <input type="text" className="setup-city-input" placeholder="Введите название города..." />
                <div className="suggestions-list setup-city-suggestions"></div>
              </div>
            </div>

            {/* Отображение выбранной локации */}
            <div className="setup-selected-location" style={{display: 'none'}}>
              <div className="location-display">
                <span className="setup-location-text"></span>
                <button type="button" className="reset-setup-location">🔄 Изменить</button>
              </div>
              <button type="button" className="neon-button primary full-width confirm-setup-location">
                ✅ Подтвердить и продолжить
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
