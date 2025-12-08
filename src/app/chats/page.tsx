'use client';

export default function ChatsPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
      <div className="app-container">
        <div id="myChats" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => (window as any).showMainMenu()}>← Назад</button>
            <h2>💬 Мои чаты</h2>
          </div>

          <div className="tabs-container">
            <button className="tab-btn active" onClick={() => (window as any).switchChatTab('active')}>
              <span className="tab-icon">✅</span>
              <span className="tab-label">Открытые чаты</span>
              <span className="tab-badge" id="activeChatsCount">0</span>
            </button>
            <button className="tab-btn" onClick={() => (window as any).switchChatTab('requests')}>
              <span className="tab-icon">📨</span>
              <span className="tab-label">Запросы</span>
              <span className="tab-badge" id="requestsCount">0</span>
            </button>
          </div>

          <div className="chats-container">
            <div id="activeChatsTab" className="tab-content active">
              <div id="activeChats" className="chats-list">
                <div className="loading-placeholder">
                  <div className="neon-icon pulse">💬</div>
                  <p>Загрузка чатов...</p>
                </div>
              </div>
            </div>

            <div id="requestsTab" className="tab-content">
              <div id="chatRequests" className="chats-list">
                <div className="loading-placeholder">
                  <div className="neon-icon pulse">📨</div>
                  <p>Загрузка запросов...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
