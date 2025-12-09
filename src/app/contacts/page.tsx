'use client';

import { useEffect } from 'react';

export default function ContactsPage() {
  useEffect(() => {
    const loadScript = async () => {
      const script = document.createElement('script');
      script.src = '/js/menu.js';
      script.async = false;
      document.head.appendChild(script);
    };
    loadScript();
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div className="screen" style={{display: 'block'}}>
          <div className="header" style={{padding: '12px', textAlign: 'center', borderBottom: '1px solid rgba(236, 72, 153, 0.3)'}}>
            <button className="back-button" onClick={() => window.history.back()} style={{position: 'absolute', left: '12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}>
              ← Назад
            </button>
            <h1 style={{margin: 0, fontSize: '1.3em'}}>Контакты</h1>
          </div>

          <div style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
            
            <div className="contact-item" style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(29, 185, 84, 0.1) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => (window as any).openTelegramChat?.()}>
              <div style={{fontSize: '24px', marginBottom: '10px'}}>💬</div>
              <div style={{fontWeight: '600', marginBottom: '5px'}}>Telegram</div>
              <div style={{fontSize: '0.9em', color: '#bbb'}}>
                Напишите нам в Telegram
              </div>
              <div style={{fontSize: '0.85em', color: '#1db954', marginTop: '10px'}}>
                @Vorobey_444 →
              </div>
            </div>

            <div className="contact-item" style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(29, 185, 84, 0.1) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => (window as any).openEmailComposer?.()}>
              <div style={{fontSize: '24px', marginBottom: '10px'}}>📧</div>
              <div style={{fontWeight: '600', marginBottom: '5px'}}>Email</div>
              <div style={{fontSize: '0.9em', color: '#bbb'}}>
                Отправить письмо нашей команде
              </div>
              <div style={{fontSize: '0.85em', color: '#1db954', marginTop: '10px'}}>
                support@anonimka.online
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
