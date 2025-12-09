'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useRouter } from 'next/navigation'

function ChatsPageContent() {
  const router = useRouter();
  
  useEffect(() => {
    const loadScripts = async () => {
      const scripts = ['https://telegram.org/js/telegram-web-app.js', '/js/core.js', '/js/chats.js'];
      for (const src of scripts) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
    };
    loadScripts();
  }, []);
  
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="myChats" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/main')}>← Назад</button>
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

export default function ChatsPage() {
  return (
    <ErrorBoundary>
      <ChatsPageContent />
    </ErrorBoundary>
  )
}
