'use client'

import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function LocationChoicePageContent() {
  const router = useRouter()

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="locationChoice" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/menu')}>← Назад</button>
            <div className="logo">
              <div className="neon-icon">🌍</div>
              <h1>Выберите способ</h1>
              <p>Как определить вашу локацию?</p>
            </div>
          </div>

          <div className="location-choice-container">
            <button 
              className="location-choice-btn auto" 
              onClick={() => router.push('/location/auto')}
            >
              <div className="choice-icon">📍</div>
              <h3>Определить автоматически</h3>
              <p>Мы определим ваше местоположение по IP-адресу</p>
            </button>

            <button 
              className="location-choice-btn manual" 
              onClick={() => router.push('/location/setup')}
            >
              <div className="choice-icon">🎯</div>
              <h3>Выбрать вручную</h3>
              <p>Вы сами укажете страну, регион и город</p>
            </button>
          </div>

          <div className="info-box">
            💡 Локация используется для подбора анкет из вашего региона
          </div>
        </div>
      </div>
    </>
  )
}

export default function LocationChoicePage() {
  return (
    <ErrorBoundary>
      <LocationChoicePageContent />
    </ErrorBoundary>
  )
}
