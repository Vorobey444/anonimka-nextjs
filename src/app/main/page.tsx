'use client';

import './main.css';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'

function MenuPageContent() {
  useEffect(() => {
    // Динамическая загрузка скриптов в правильном порядке
    const loadScripts = async () => {
      const scripts = [
        'https://telegram.org/js/telegram-web-app.js',
        '/js/location.js',
        '/js/core.js',
        '/js/main-page.js'
      ];

      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false; // Загружать последовательно
          script.onload = () => {
            console.log(`✅ Loaded: ${src}`);
            resolve();
          };
          script.onerror = () => {
            console.error(`❌ Failed to load: ${src}`);
            reject();
          };
          document.head.appendChild(script);
        });
      }
      
      console.log('🎉 All scripts loaded, checking functions...');
      console.log('showCreateAd:', typeof (window as any).showCreateAd);
      console.log('toggleHamburgerMenu:', typeof (window as any).toggleHamburgerMenu);
    };

    loadScripts();
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      {/* Premium Toggle */}
      <div className="premium-toggle" id="premiumToggle" style={{display: 'flex'}}>
        <button className="premium-btn" id="freeBtn" onClick={() => (window as any).showPremiumModal?.()}>FREE</button>
        <button className="premium-btn active pro" id="proBtn" onClick={() => (window as any).showPremiumModal?.()} title="PRO до ...">PRO</button>
      </div>

      <div className="app-container">
        {/* Главное меню */}
        <div id="mainMenu" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="hamburger-menu" onClick={() => (window as any).toggleHamburgerMenu?.()}>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <div className="logo">
              <div className="neon-icon">
                <img src="/logo.png" alt="Anonimka Logo" style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)'}} />
              </div>
              <h1 style={{lineHeight: '1.2', fontSize: '1.4rem'}}>Anonimka<br/><span style={{fontSize: '0.7em'}}>Анонимное общение</span></h1>
              <div className="user-location" onClick={() => (window as any).showScreen?.('locationSetup')}>
                <span className="location-info" id="userLocationDisplay"></span>
              </div>
              {/* Счетчик посещений (только для админов) */}
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
              <button className="neon-button primary" onClick={() => (window as any).showCreateAd?.()} id="createAdBtn" style={{width: '100%'}}>
                <span className="icon">📝</span>
                Создать анкету
              </button>
              <span id="adLimitBadge" className="limit-badge" style={{display: 'none'}}></span>
            </div>
            <button className="neon-button" onClick={() => (window as any).showBrowseAds?.()}>
              <span className="icon">👁️</span>
              Смотреть анкеты
            </button>
            <button className="neon-button chat-button" onClick={() => (window as any).showMyAds?.()}>
              <span className="icon">📋</span>
              Мои анкеты
            </button>
            <div style={{position: 'relative', display: 'inline-block', width: '100%'}}>
              <button className="neon-button chat-button" onClick={() => (window as any).showMyChats?.()} style={{width: '100%'}}>
                <span className="icon">💬</span>
                Мои чаты
              </button>
              <span id="chatBadge" className="chat-badge" style={{display: 'none'}}></span>
            </div>
            <button className="neon-button world-chat-button" onClick={() => (window as any).showWorldChat?.()} style={{width: '100%'}}>
              <span className="icon">🌍</span>
              <div className="world-chat-content">
                <div className="world-chat-title">Мир чат</div>
                <div id="worldChatPreview" className="world-chat-preview">Загрузка...</div>
              </div>
            </button>

            <button className="neon-button" onClick={() => (window as any).showPolls?.()} style={{width: '100%'}}>
              <span className="icon">📊</span>
              Опросы
            </button>

            <button id="referralMainButton" className="neon-button referral-button" onClick={() => (window as any).showReferralModal?.()} style={{display: 'none'}}>
              <span className="icon pulse-icon">🎁</span>
              Пригласи друга - месяц PRO!
            </button>

            {/* Sticky Note Beta Notice (временно скрыт) */}
            <div className="sticky-note" onClick={() => (window as any).showContacts?.()} style={{display: 'none'}}>
              <div className="sticky-note-tape"></div>
              <div className="sticky-note-content">
                <p className="sticky-note-text">🐛 Нашёл баг, ошибку или есть предложения?!</p>
                <p className="sticky-note-link">Напиши нам! →</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MenuPage() {
  return (
    <ErrorBoundary>
      <MenuPageContent />
    </ErrorBoundary>
  )
}
