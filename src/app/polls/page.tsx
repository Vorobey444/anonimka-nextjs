'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useRouter } from 'next/navigation'

function PollsPageContent() {
  const router = useRouter();
  
  useEffect(() => {
    const loadScripts = async () => {
      const scripts = ['https://telegram.org/js/telegram-web-app.js', '/js/core.js', '/js/polls.js'];
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
        <div id="pollsScreen" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/main')}>← Назад</button>
            <h2>📊 Опросы</h2>
          </div>
          
          <div className="polls-container">
            <div className="polls-intro">
              <p>Помогите нам стать лучше! Ваше мнение очень важно для развития Anonimka.</p>
            </div>
            
            <div className="poll-card">
              <div className="poll-header">
                <span className="poll-icon">📸</span>
                <h3>Фотографии в анкетах</h3>
              </div>
              
              <div className="poll-question-full">Вам нужны фотки в анкетах?</div>
              
              <div className="poll-options-full" id="photosPollOptions">
                <button className="poll-option-full" onClick={() => (window as any).votePoll('photos_in_ads', 'yes')}>
                  <span className="poll-option-icon">✅</span>
                  Да
                </button>
                <button className="poll-option-full" onClick={() => (window as any).votePoll('photos_in_ads', 'no')}>
                  <span className="poll-option-icon">❌</span>
                  Нет это же Анонимка
                </button>
              </div>
              
              <div className="poll-results-full" id="photosPollResults" style={{display: 'none'}}>
                <div className="poll-result-item-full">
                  <div className="poll-result-text-full">
                    <span>✅ Да</span>
                    <span className="poll-percent-full" id="photosYesPercent">0%</span>
                  </div>
                  <div className="poll-bar-full">
                    <div className="poll-bar-fill-full" id="photosYesBar" style={{width: '0%'}}></div>
                  </div>
                  <div className="poll-votes-count" id="photosYesCount">0 голосов</div>
                </div>
                <div className="poll-result-item-full">
                  <div className="poll-result-text-full">
                    <span>❌ Нет это же Анонимка</span>
                    <span className="poll-percent-full" id="photosNoPercent">0%</span>
                  </div>
                  <div className="poll-bar-full">
                    <div className="poll-bar-fill-full" id="photosNoBar" style={{width: '0%'}}></div>
                  </div>
                  <div className="poll-votes-count" id="photosNoCount">0 голосов</div>
                </div>
                <div className="poll-total-full">Всего проголосовало: <span id="photosTotalVotes">0</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PollsPage() {
  return (
    <ErrorBoundary>
      <PollsPageContent />
    </ErrorBoundary>
  )
}
