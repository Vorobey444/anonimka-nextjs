'use client';

import './main.css';
import { useEffect } from 'react';

export default function MenuPage() {
  useEffect(() => {
    // Toggle Hamburger Menu
    (window as any).toggleHamburgerMenu = () => {
      const overlay = document.getElementById('hamburgerOverlay');
      if (overlay) {
        overlay.classList.toggle('active');
      }
    };

    // Close menu when clicking overlay
    const overlay = document.getElementById('hamburgerOverlay');
    if (overlay) {
      const handleOverlayClick = (e: MouseEvent) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      };
      overlay.addEventListener('click', handleOverlayClick);
      return () => overlay.removeEventListener('click', handleOverlayClick);
    }
  }, []);

  return (
    <>
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/core.js" defer></script>
      <script src="/js/main-page.js" defer></script>
      
      {/* Premium Toggle (показывается на всех страницах) */}
      <div className="premium-toggle" id="premiumToggle" style={{display: 'flex'}}>
        <button className="premium-btn" id="freeBtn" onClick={() => (window as any).showPremiumModal?.()}>FREE</button>
        <button className="premium-btn active pro" id="proBtn" onClick={() => (window as any).showPremiumModal?.()} title="PRO до ...">PRO</button>
      </div>

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
              <div className="user-location" onClick={() => window.location.href = '/location-setup'}>
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

      {/* Hamburger Menu Overlay */}
      <div className="hamburger-overlay" id="hamburgerOverlay">
        <div className="hamburger-menu-content">
          <div className="hamburger-header">
            <h2>Меню</h2>
            <button className="hamburger-close" onClick={() => (window as any).toggleHamburgerMenu()}>×</button>
          </div>
          <nav className="hamburger-nav">
            <a href="/main" className="hamburger-item active">
              <span className="hamburger-icon">🏠</span>
              Главная
            </a>
            <a href="/browse" className="hamburger-item">
              <span className="hamburger-icon">👁️</span>
              Смотреть анкеты
            </a>
            <a href="/create" className="hamburger-item">
              <span className="hamburger-icon">📝</span>
              Создать анкету
            </a>
            <a href="/my-ads" className="hamburger-item">
              <span className="hamburger-icon">📋</span>
              Мои анкеты
            </a>
            <a href="/chats" className="hamburger-item">
              <span className="hamburger-icon">💬</span>
              Мои чаты
            </a>
            <a href="/world-chat" className="hamburger-item">
              <span className="hamburger-icon">🌍</span>
              Мир чат
            </a>
            <a href="/polls" className="hamburger-item">
              <span className="hamburger-icon">📊</span>
              Опросы
            </a>
            <a href="/location-setup" className="hamburger-item">
              <span className="hamburger-icon">📍</span>
              Изменить локацию
            </a>
            <a href="#" className="hamburger-item" onClick={(e) => { e.preventDefault(); (window as any).showContactModal?.(); }}>
              <span className="hamburger-icon">📧</span>
              Контакты
            </a>
            <a href="#" className="hamburger-item" onClick={(e) => { e.preventDefault(); (window as any).showRulesModal?.(); }}>
              <span className="hamburger-icon">📜</span>
              Правила
            </a>
            <a href="#" className="hamburger-item" onClick={(e) => { e.preventDefault(); (window as any).showPrivacyModal?.(); }}>
              <span className="hamburger-icon">🔒</span>
              Конфиденциальность
            </a>
            <a href="#" className="hamburger-item logout-item" onClick={(e) => { e.preventDefault(); (window as any).logout?.(); }}>
              <span className="hamburger-icon">🚪</span>
              Выход
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
