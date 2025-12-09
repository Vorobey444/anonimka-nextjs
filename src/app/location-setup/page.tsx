'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary'

function LocationSetupPageContent() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/location.js" defer></script>
      <script src="/js/core.js" defer></script>
      
      <div className="app-container">
        <div id="locationSetup" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" id="locationSetupBackBtn" onClick={() => window.history.back()}>← Назад</button>
            <div className="logo">
              <div className="neon-icon">🌍</div>
              <h1>Выберите вашу страну</h1>
              <p>Это поможет находить людей рядом</p>
            </div>
          </div>
          
          <div className="location-setup-container">
            {/* Кнопка автоопределения */}
            <div className="auto-location-section">
              <button className="neon-button primary full-width" id="autoDetectBtn">
                📍 Определить автоматически
              </button>
              <p className="or-divider">или выберите вручную</p>
            </div>
            
            {/* Выбор страны */}
            <div className="setup-country-selection">
              <h3>Страна</h3>
              <div className="country-buttons">
                <button type="button" className="country-btn setup-country" data-country="russia">
                  <span className="country-code">RU</span>
                  <span className="flag">🇷🇺</span>
                  Россия
                </button>
                <button type="button" className="country-btn setup-country" data-country="kazakhstan">
                  <span className="country-code">KZ</span>
                  <span className="flag">🇰🇿</span>
                  Казахстан
                </button>
                <button type="button" className="country-btn setup-country" data-country="belarus">
                  <span className="country-code">BY</span>
                  <span className="flag">🇧🇾</span>
                  Беларусь
                </button>
                <button type="button" className="country-btn setup-country" data-country="ukraine">
                  <span className="country-code">UA</span>
                  <span className="flag">🇺🇦</span>
                  Украина
                </button>
                <button type="button" className="country-btn setup-country" data-country="kyrgyzstan">
                  <span className="country-code">KG</span>
                  <span className="flag">🇰🇬</span>
                  Кыргызстан
                </button>
                <button type="button" className="country-btn setup-country" data-country="tajikistan">
                  <span className="country-code">TJ</span>
                  <span className="flag">🇹🇯</span>
                  Таджикистан
                </button>
                <button type="button" className="country-btn setup-country" data-country="uzbekistan">
                  <span className="country-code">UZ</span>
                  <span className="flag">🇺🇿</span>
                  Узбекистан
                </button>
                <button type="button" className="country-btn setup-country" data-country="armenia">
                  <span className="country-code">AM</span>
                  <span className="flag">🇦🇲</span>
                  Армения
                </button>
                <button type="button" className="country-btn setup-country" data-country="azerbaijan">
                  <span className="country-code">AZ</span>
                  <span className="flag">🇦🇿</span>
                  Азербайджан
                </button>
                <button type="button" className="country-btn setup-country" data-country="moldova">
                  <span className="country-code">MD</span>
                  <span className="flag">🇲🇩</span>
                  Молдова
                </button>
                <button type="button" className="country-btn setup-country" data-country="georgia">
                  <span className="country-code">GE</span>
                  <span className="flag">🇬🇪</span>
                  Грузия
                </button>
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
              <button className="neon-button primary full-width" id="saveLocationAndContinue">
                ✅ Подтвердить и продолжить
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LocationSetupPage() {
  return (
    <ErrorBoundary>
      <LocationSetupPageContent />
    </ErrorBoundary>
  )
}
