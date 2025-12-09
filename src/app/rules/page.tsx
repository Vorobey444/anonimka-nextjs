'use client';

import { useEffect } from 'react';

export default function RulesPage() {
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
            <h1 style={{margin: 0, fontSize: '1.3em'}}>Правила</h1>
          </div>

          <div style={{padding: '20px', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', fontSize: '0.95em', lineHeight: '1.7', color: '#ccc'}}>
            <h3 style={{color: '#1db954'}}>1. Контент и поведение</h3>
            <ul style={{paddingLeft: '20px'}}>
              <li>✓ Все анкеты должны быть заполнены честно</li>
              <li>✓ Запрещены оскорбления и угрозы</li>
              <li>✓ Запрещен спам и мошенничество</li>
            </ul>

            <h3 style={{color: '#1db954'}}>2. Фотографии</h3>
            <ul style={{paddingLeft: '20px'}}>
              <li>✓ Только ваши собственные фото</li>
              <li>✓ Запрещены фото других людей</li>
            </ul>

            <h3 style={{color: '#1db954'}}>3. Конфиденциальность</h3>
            <ul style={{paddingLeft: '20px'}}>
              <li>✓ Не делитесь личной информацией</li>
              <li>✓ Не передавайте деньги незнакомцам</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
