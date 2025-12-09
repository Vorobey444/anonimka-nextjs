'use client';

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useRouter } from 'next/navigation'

function WorldChatPageContent() {
  const router = useRouter();
  
  // Initialize world chat when component mounts
  React.useEffect(() => {
    const initWorldChat = () => {
      if (typeof window !== 'undefined' && (window as any).showWorldChat) {
        (window as any).showWorldChat();
      } else {
        // Retry if script not loaded yet
        setTimeout(initWorldChat, 100);
      }
    };
    initWorldChat();
  }, []);
  
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/js/core.js" defer></script>
      <script src="/js/world-chat.js" defer></script>
      
      <div className="app-container">
        <div id="worldChatScreen" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/main')}>← Назад</button>
            <h2>🌍 Мир чат</h2>
            <button className="world-chat-faq-btn" onClick={() => (window as any).showWorldChatFAQ()} title="Инструкция">?</button>
          </div>

          <div className="world-chat-messages-container">
            <div id="worldChatMessages" className="world-chat-messages">
              <div className="loading-placeholder">
                <div className="neon-icon pulse">💬</div>
                <p>Загрузка сообщений...</p>
              </div>
            </div>
          </div>

          <div className="world-chat-footer">
            <div className="world-chat-tabs">
              <button className="world-chat-tab active" onClick={() => (window as any).switchWorldChatTab('world')} id="worldTab">Мир</button>
              <button className="world-chat-tab" onClick={() => (window as any).switchWorldChatTab('city')} id="cityTab">Город</button>
              <button className="world-chat-tab" onClick={() => (window as any).switchWorldChatTab('private')} id="privateTab">ЛС</button>
              <button className="world-chat-font-size-btn" onClick={() => (window as any).toggleFontSize()} id="fontSizeBtn" title="Размер шрифта">A</button>
            </div>

            <div className="world-chat-input-container">
              <div className="world-chat-input-wrapper">
                <span className="world-chat-prefix" id="worldChatPrefix">@</span>
                <input 
                  type="text" 
                  id="worldChatInput" 
                  className="world-chat-input" 
                  placeholder="Введите сообщение..." 
                  maxLength={120}
                  onKeyPress={(e) => {if(e.key === 'Enter') (window as any).sendWorldChatMessage()}}
                  onInput={() => (window as any).updateWorldChatCharCount?.()}
                />
                <div className="world-chat-char-counter">
                  <span id="worldChatCharCount">0</span>/120
                </div>
              </div>
              <button className="world-chat-send-btn" onClick={() => (window as any).sendWorldChatMessage()}>
                <span>📤</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* FAQ Modal */}
        <div id="worldChatFAQModal" className="modal" style={{display: 'none'}}>
          <div className="modal-content world-chat-faq-content">
            <span className="modal-close" onClick={() => (window as any).closeWorldChatFAQ()}>&times;</span>
            <h2>❓ Как пользоваться Мир чатом</h2>
            <div className="modal-text world-chat-faq-text">
              <p><strong>🌍 Что такое Мир чат?</strong></p>
              <p>Это публичный чат где вы можете общаться с пользователями со всего мира. Есть три вкладки для разного типа общения.</p>
              
              <p><strong>📱 Три вкладки чата:</strong></p>
              <ul>
                <li><span style={{color: '#ffaa00'}}>МИР</span> — общайтесь с пользователями со всего мира (префикс <span style={{color: '#ffaa00'}}>@</span>)</li>
                <li><span style={{color: '#00ffff'}}>ГОРОД</span> — общайтесь только с людьми из вашего города (префикс <span style={{color: '#00ffff'}}>&amp;</span>)</li>
                <li><span style={{color: '#ff0000'}}>ЛС</span> — личные сообщения (префикс <span style={{color: '#ff0000'}}>/</span>)</li>
              </ul>

              <p><strong>⭐ Звездочка в никнейме:</strong></p>
              <p>Золотая звезда ⭐ означает что у пользователя есть PRO подписка. PRO можно получить бесплатно пригласив друга!</p>
              
              <p><strong>✍️ Как отправить сообщение:</strong></p>
              <ul>
                <li>Выберите нужную вкладку (Мир, Город или ЛС)</li>
                <li>Введите текст (максимум 120 символов)</li>
                <li>Нажмите кнопку отправки 📤</li>
              </ul>

              <p><strong>📏 Размер текста:</strong></p>
              <p>Нажмите кнопку <strong>A</strong> над кнопкой отправки сообщения чтобы изменить размер шрифта (маленький → средний → большой).</p>
              
              <p><strong>💬 Как создать приватный чат:</strong></p>
              <p>Нажмите и удерживайте палец на никнейме пользователя в Мир или Город чате. В открывшемся меню выберите &quot;Приват чат&quot; чтобы начать личную переписку.</p>
              
              <p><strong>📍 Пример использования:</strong></p>
              <p>1. Хотите найти людей по всему миру? → Выберите вкладку <span style={{color: '#ffaa00'}}>МИР</span><br/>
              2. Хотите найти соседей? → Выберите вкладку <span style={{color: '#00ffff'}}>ГОРОД</span><br/>
              3. Хотите написать приватно? → Создайте чат через долгое нажатие на ник или выберите вкладку <span style={{color: '#ff0000'}}>ЛС</span></p>
              
              <p><strong>⚠️ Правила:</strong></p>
              <ul>
                <li>Будьте вежливы и уважайте других</li>
                <li>Запрещены оскорбления и спам</li>
                <li>Сообщения модерируются (автоцензура)</li>
                <li>За нарушения возможна блокировка</li>
              </ul>

              <p><strong>💡 Совет:</strong></p>
              <p>Используйте МИР чат для общения с интересными людьми, ГОРОД чат для местных встреч, а ЛС для приватного общения!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorldChatPage() {
  return (
    <ErrorBoundary>
      <WorldChatPageContent />
    </ErrorBoundary>
  )
}
