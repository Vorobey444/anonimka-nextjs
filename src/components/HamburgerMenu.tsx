'use client';

import { useEffect } from 'react';

export default function HamburgerMenu() {
  useEffect(() => {
    // Загружаем menu.js скрипт
    const script = document.createElement('script');
    script.src = '/js/menu.js';
    script.async = false;
    document.head.appendChild(script);
  }, []);

  return (
    <>
      {/* Hamburger Button */}
      <div 
        className="hamburger-button"
        onClick={() => (window as any).toggleHamburgerMenu?.()}
        style={{
          position: 'fixed',
          top: '15px',
          right: '15px',
          width: '45px',
          height: '45px',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(29, 185, 84, 0.2) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.4)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 99,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{width: '24px', height: '2px', background: '#1db954', margin: '4px 0'}}></div>
        <div style={{width: '24px', height: '2px', background: '#1db954', margin: '4px 0'}}></div>
        <div style={{width: '24px', height: '2px', background: '#1db954', margin: '4px 0'}}></div>
      </div>

      {/* Menu Overlay */}
      <div
        id="hamburgerMenuOverlay"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {/* Menu Sidebar */}
        <div
          className="hamburger-menu"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '280px',
            height: '100vh',
            background: 'linear-gradient(180deg, rgba(236, 72, 153, 0.1) 0%, rgba(10, 10, 15, 1) 100%)',
            borderLeft: '1px solid rgba(236, 72, 153, 0.3)',
            overflowY: 'auto',
            padding: '20px 0',
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Menu Header */}
          <div style={{padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(236, 72, 153, 0.3)'}}>
            <h2 style={{margin: 0, fontSize: '1.5em', background: 'linear-gradient(135deg, #ec4899 0%, #1db954 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent'}}>
              Меню
            </h2>
          </div>

          {/* Menu Items */}
          <div style={{flex: 1, padding: '0', display: 'flex', flexDirection: 'column'}}>
            <button
              onClick={() => (window as any).goToHome?.()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '15px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                borderLeft: '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(236, 72, 153, 0.1)';
                (e.target as HTMLElement).style.borderLeftColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.borderLeftColor = 'transparent';
              }}
            >
              🏠 Главная
            </button>

            <button
              onClick={() => (window as any).showContacts?.()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '15px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                borderLeft: '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(236, 72, 153, 0.1)';
                (e.target as HTMLElement).style.borderLeftColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.borderLeftColor = 'transparent';
              }}
            >
              💬 Контакты
            </button>

            <button
              onClick={() => (window as any).showRules?.()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '15px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                borderLeft: '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(236, 72, 153, 0.1)';
                (e.target as HTMLElement).style.borderLeftColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.borderLeftColor = 'transparent';
              }}
            >
              📋 Правила
            </button>

            <button
              onClick={() => (window as any).showAbout?.()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '15px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                borderLeft: '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(236, 72, 153, 0.1)';
                (e.target as HTMLElement).style.borderLeftColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.borderLeftColor = 'transparent';
              }}
            >
              ℹ️ О приложении
            </button>

            <button
              onClick={() => (window as any).showPrivacy?.()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '15px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                borderLeft: '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(236, 72, 153, 0.1)';
                (e.target as HTMLElement).style.borderLeftColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.borderLeftColor = 'transparent';
              }}
            >
              🔐 Приватность
            </button>
          </div>

          {/* Menu Footer */}
          <div style={{padding: '20px', textAlign: 'center', borderTop: '1px solid rgba(236, 72, 153, 0.3)', fontSize: '0.85em', color: '#888'}}>
            <p style={{margin: 0}}>Anonimka v2.0</p>
            <p style={{margin: '5px 0 0 0'}}>© 2024 Все права защищены</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 480px) {
          .hamburger-menu {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
