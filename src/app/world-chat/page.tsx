'use client';

export default function WorldChatPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
      <div className="app-container">
        <div id="worldChatScreen" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => (window as any).showMainMenu()}>← Назад</button>
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
      </div>
    </>
  );
}
