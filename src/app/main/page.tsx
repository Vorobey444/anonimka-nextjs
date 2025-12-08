'use client';

export default function MenuPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
      <div className="app-container">
        <div id="mainMenu" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="hamburger-menu" onClick={() => (window as any).toggleHamburgerMenu()}>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <div className="logo">
              <div className="neon-icon">
                <img src="/logo.png" alt="Anonimka Logo" style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)'}} />
              </div>
              <h1 style={{lineHeight: '1.2', fontSize: '1.4rem'}}>Anonimka<br/><span style={{fontSize: '0.7em'}}>Анонимное общение</span></h1>
              <div className="user-location" onClick={() => (window as any).showScreen('locationSetup')}>
                <span className="location-info" id="userLocationDisplay"></span>
              </div>
              <div className="site-stats" id="adminStats" style={{display: 'none'}}>
                <span className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-value" id="totalVisits">...</span>
                </span>
                <span className="stat-divider">•</span>
                <span className="stat-item">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-value" id="onlineNow">...</span>
                </span>
                <span className="stat-divider">•</span>
                <span className="stat-item">
                  <span className="stat-icon">📢</span>
                  <span className="stat-value" id="totalAds">...</span>
                </span>
                <span className="stat-divider">•</span>
                <span className="stat-item">
                  <span className="stat-icon">🚫</span>
                  <span className="stat-value" id="blockedUsersCount">...</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="menu-buttons">
            <div style={{position: 'relative', display: 'inline-block', width: '100%'}}>
              <button className="neon-button primary" onClick={() => window.location.href = '/create'} id="createAdBtn" style={{width: '100%'}}>
                <span className="icon">📝</span>
                Создать анкету
              </button>
              <span id="adLimitBadge" className="limit-badge" style={{display: 'none'}}></span>
            </div>
            <button className="neon-button" onClick={() => window.location.href = '/browse'}>
              <span className="icon">👁️</span>
              Смотреть анкеты
            </button>
            <button className="neon-button chat-button" onClick={() => window.location.href = '/my-ads'}>
              <span className="icon">📋</span>
              Мои анкеты
            </button>
            <div style={{position: 'relative', display: 'inline-block', width: '100%'}}>
              <button className="neon-button chat-button" onClick={() => window.location.href = '/chats'} style={{width: '100%'}}>
                <span className="icon">💬</span>
                Мои чаты
              </button>
              <span id="chatBadge" className="chat-badge" style={{display: 'none'}}></span>
            </div>
            <button className="neon-button world-chat-button" onClick={() => window.location.href = '/world-chat'} style={{width: '100%'}}>
              <span className="icon">🌍</span>
              <div className="world-chat-content">
                <div className="world-chat-title">Мир чат</div>
                <div id="worldChatPreview" className="world-chat-preview">Загрузка...</div>
              </div>
            </button>
            
            <button className="neon-button" onClick={() => window.location.href = '/polls'} style={{width: '100%'}}>
              <span className="icon">📊</span>
              Опросы
            </button>
            
            <button id="referralMainButton" className="neon-button referral-button" onClick={() => (window as any).showReferralModal()} style={{display: 'none'}}>
              <span className="icon pulse-icon">🎁</span>
              Пригласи друга - месяц PRO!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
