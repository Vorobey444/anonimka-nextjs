'use client';

export default function ChatPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
      <div className="app-container">
        <div id="chatView" className="screen" style={{display: 'block'}}>
          <div className="header chat-header">
            <button className="back-btn" onClick={() => (window as any).showMyChats()}>← Назад</button>
            <div className="chat-info">
              <h2 id="chatTitle" style={{lineHeight: '1.2', fontSize: '1.2rem'}}>Anonimka<br/><span style={{fontSize: '0.65em'}}>Анонимное общение</span></h2>
              <p id="chatAdId" className="chat-subtitle"></p>
            </div>
            <button className="chat-font-size-btn" onClick={() => (window as any).toggleChatFontSize()} id="chatFontSizeBtn" title="Размер шрифта">A</button>
            <button className="chat-menu-btn" onClick={() => (window as any).toggleChatMenu()}>⋮</button>
          </div>
          
          <div id="chatMenu" className="chat-menu-dropdown" style={{display: 'none'}}>
            <button className="chat-menu-item" onClick={() => (window as any).toggleBlockUser()}>
              <span id="blockMenuText">🚫 Заблокировать собеседника</span>
            </button>
            <button className="chat-menu-item danger" onClick={() => (window as any).confirmDeleteChat()}>
              🗑️ Удалить чат
            </button>
          </div>

          <div className="chat-messages-container">
            <div id="chatMessages" className="chat-messages">
              {/* Сообщения будут загружены через JS */}
            </div>
          </div>

          <div id="blockWarning" className="block-warning" style={{display: 'none'}}>
            ⚠️ Собеседник внес вас в черный список
          </div>

          <div id="replyPreview" className="reply-preview" style={{display: 'none'}}>
            <div className="reply-preview-content">
              <div className="reply-preview-header">
                В ответ <span id="replyToNickname"></span>
              </div>
              <div className="reply-preview-text" id="replyToText"></div>
            </div>
            <button className="reply-preview-close" onClick={() => (window as any).cancelReply()}>×</button>
          </div>

          <div className="chat-input-container">
            <input type="file" id="photoInput" accept="image/*" style={{display: 'none'}} onChange={(e) => (window as any).handlePhotoSelect(e)} />
            <input type="file" id="cameraInput" accept="image/*" capture="environment" style={{display: 'none'}} onChange={(e) => (window as any).handlePhotoSelect(e)} />
            <button className="attach-photo-button" onClick={() => (window as any).showPhotoSourceMenu()} title="Прикрепить фото">
              <span>📷</span>
            </button>
            <div id="photoPreview" className="photo-preview" style={{display: 'none'}}>
              <img id="photoPreviewImage" src="" alt="Preview" />
              <button className="remove-photo-button" onClick={() => (window as any).removePhoto()}>×</button>
            </div>
            <input type="text" id="messageInput" className="chat-input" placeholder="Введите сообщение..." onKeyPress={(e) => {if(e.key === 'Enter') (window as any).sendMessage()}} />
            <button id="sendButton" className="send-button" onClick={() => (window as any).sendMessage()}>
              <span className="send-icon">✈️</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
