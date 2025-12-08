'use client';

export default function BrowseAdsPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/core.js" defer></script>
      <script src="/js/browse.js" defer></script>
      
      <div className="app-container">
        <div id="browseAds" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => (window as any).showMainMenu()}>← Назад</button>
            <h2>Анкеты</h2>
          </div>
          
          <div className="current-location-display">
            <p className="location-label">📍 Ваша локация:</p>
            <p className="location-value" id="browseLocationDisplay">Загрузка...</p>
            <button className="neon-button small" onClick={() => (window as any).showLocationSetup()}>
              🔄 Сменить локацию
            </button>
          </div>

          <div className="filters-container">
            <button className="filter-toggle-btn" onClick={() => (window as any).toggleFilters()}>
              🔍 Фильтры <span id="filterBadge"></span>
            </button>
            
            <div id="filtersPanel" className="filters-panel" style={{display: 'none'}}>
              <div className="filter-group">
                <label>Пол:</label>
                <div className="filter-buttons">
                  <button className="filter-btn" data-filter-type="gender" data-value="all" onClick={() => (window as any).setFilter('gender', 'all')}>Все</button>
                  <button className="filter-btn" data-filter-type="gender" data-value="male" onClick={() => (window as any).setFilter('gender', 'male')}>♂️ Мужчины</button>
                  <button className="filter-btn" data-filter-type="gender" data-value="female" onClick={() => (window as any).setFilter('gender', 'female')}>♀️ Девушки</button>
                  <button className="filter-btn" data-filter-type="gender" data-value="couple" onClick={() => (window as any).setFilter('gender', 'couple')}>👫 Пары</button>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Ищет:</label>
                <div className="filter-buttons">
                  <button className="filter-btn" data-filter-type="target" data-value="all" onClick={() => (window as any).setFilter('target', 'all')}>Все</button>
                  <button className="filter-btn" data-filter-type="target" data-value="male" onClick={() => (window as any).setFilter('target', 'male')}>♂️ Мужчину</button>
                  <button className="filter-btn" data-filter-type="target" data-value="female" onClick={() => (window as any).setFilter('target', 'female')}>♀️ Девушку</button>
                  <button className="filter-btn" data-filter-type="target" data-value="couple" onClick={() => (window as any).setFilter('target', 'couple')}>♂️♀️ Пару</button>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Ориентация:</label>
                <div className="filter-buttons">
                  <button className="filter-btn" data-filter-type="orientation" data-value="all" onClick={() => (window as any).setFilter('orientation', 'all')}>Все</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="hetero" onClick={() => (window as any).setFilter('orientation', 'hetero')}>💏 Гетеро</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="gay" onClick={() => (window as any).setFilter('orientation', 'gay')}>🔥 Гей/Лесби</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="bi" onClick={() => (window as any).setFilter('orientation', 'bi')}>😈 Би</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="pan" onClick={() => (window as any).setFilter('orientation', 'pan')}>⚡ Пан</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="ace" onClick={() => (window as any).setFilter('orientation', 'ace')}>😶 Асексуал</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="demi" onClick={() => (window as any).setFilter('orientation', 'demi')}>💫 Деми</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="queer" onClick={() => (window as any).setFilter('orientation', 'queer')}>🌪 Квир</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="grey" onClick={() => (window as any).setFilter('orientation', 'grey')}>📶 Грей</button>
                  <button className="filter-btn" data-filter-type="orientation" data-value="sever" onClick={() => (window as any).setFilter('orientation', 'sever')}>🎤 Север</button>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Возраст:</label>
                <div className="age-filter">
                  <input type="number" id="ageFrom" placeholder="От" min={18} max={99} defaultValue={18} />
                  <span>—</span>
                  <input type="number" id="ageTo" placeholder="До" min={18} max={99} defaultValue={99} />
                </div>
              </div>
              
              <div className="filter-actions">
                <button className="neon-button small" onClick={() => (window as any).applyFilters()}>✅ Применить</button>
                <button className="neon-button small secondary" onClick={() => (window as any).resetFilters()}>🔄 Сбросить</button>
              </div>
            </div>
          </div>

          <div id="adsList" className="ads-list">
            {/* Анкеты будут загружены через JS */}
          </div>
        </div>
      </div>
    </>
  );
}
