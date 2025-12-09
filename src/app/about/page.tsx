'use client';

import { useEffect } from 'react';

export default function AboutPage() {
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
            <h1 style={{margin: 0, fontSize: '1.3em'}}>О приложении</h1>
          </div>

          <div style={{padding: '20px', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', fontSize: '0.95em', lineHeight: '1.7', color: '#ccc'}}>
            <div style={{textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(236, 72, 153, 0.3)', marginBottom: '20px'}}>
              <div style={{fontSize: '60px', marginBottom: '10px'}}>🎯</div>
              <h2 style={{color: '#fff', margin: '0 0 10px 0'}}>Anonimka</h2>
              <p style={{margin: '10px 0 0 0', fontSize: '0.9em'}}>Анонимное общение и знакомства</p>
            </div>

            <div style={{marginBottom: '25px'}}>
              <h3 style={{color: '#1db954', marginTop: 0}}>✨ О нас</h3>
              <p>
                Anonimka — платформа для анонимного общения и знакомств. Безопасное и приватное пространство для встреч.
              </p>
            </div>

            <div style={{marginBottom: '25px'}}>
              <h3 style={{color: '#1db954'}}>🎯 Функции</h3>
              <ul style={{paddingLeft: '20px'}}>
                <li>✓ Анонимные профили</li>
                <li>✓ Поиск по локации</li>
                <li>✓ Приватные сообщения</li>
                <li>✓ Премиум подписка</li>
              </ul>
            </div>

            <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(236, 72, 153, 0.3)', color: '#888', fontSize: '0.85em', textAlign: 'center'}}>
              <p>© 2024 Anonimka</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
