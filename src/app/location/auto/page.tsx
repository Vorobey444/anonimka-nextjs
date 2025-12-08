'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoLocationPage() {
  const router = useRouter()
  const [status, setStatus] = useState('detecting')
  const [location, setLocation] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = async () => {
    try {
      setStatus('detecting')
      
      // Вызываем API для определения локации по IP
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()

      if (data.country_name && data.city) {
        setLocation({
          country: data.country_name,
          region: data.region,
          city: data.city
        })
        setStatus('success')

        // Сохраняем в localStorage
        localStorage.setItem('user_location', JSON.stringify({
          country: data.country_name,
          region: data.region,
          city: data.city,
          auto: true
        }))

        // Автоматически переходим на главную через 2 секунды
        setTimeout(() => {
          router.push('/menu')
        }, 2000)
      } else {
        throw new Error('Не удалось определить локацию')
      }
    } catch (err: any) {
      console.error('Location detection error:', err)
      setError(err.message || 'Ошибка определения локации')
      setStatus('error')
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="autoLocationDetection" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.back()}>← Назад</button>
            <h2>Определение локации</h2>
          </div>

          <div className="location-detection-content">
            {status === 'detecting' && (
              <>
                <div className="radar-container">
                  <div className="radar">
                    <div className="radar-circle"></div>
                    <div className="radar-circle"></div>
                    <div className="radar-circle"></div>
                    <div className="radar-line"></div>
                  </div>
                </div>
                <h3>Определяем ваше местоположение...</h3>
                <p className="status-text">Анализируем IP-адрес</p>
              </>
            )}

            {status === 'success' && location && (
              <>
                <div className="success-icon">✅</div>
                <h3>Локация определена!</h3>
                <div className="location-result">
                  <p><strong>Страна:</strong> {location.country}</p>
                  {location.region && <p><strong>Регион:</strong> {location.region}</p>}
                  <p><strong>Город:</strong> {location.city}</p>
                </div>
                <p className="status-text">Перенаправляем на главную страницу...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="error-icon">❌</div>
                <h3>Не удалось определить</h3>
                <p className="error-text">{error}</p>
                <button 
                  className="neon-button"
                  onClick={() => router.push('/location/setup')}
                >
                  Указать вручную
                </button>
                <button 
                  className="secondary-button"
                  onClick={detectLocation}
                >
                  Попробовать снова
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .location-detection-content {
          text-align: center;
          padding: 2rem;
        }

        .radar-container {
          display: flex;
          justify-content: center;
          margin: 3rem 0;
        }

        .radar {
          position: relative;
          width: 200px;
          height: 200px;
        }

        .radar-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 50%;
          animation: radarPulse 2s ease-out infinite;
        }

        .radar-circle:nth-child(1) {
          width: 60px;
          height: 60px;
          animation-delay: 0s;
        }

        .radar-circle:nth-child(2) {
          width: 120px;
          height: 120px;
          animation-delay: 0.5s;
        }

        .radar-circle:nth-child(3) {
          width: 180px;
          height: 180px;
          animation-delay: 1s;
        }

        .radar-line {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 90px;
          background: linear-gradient(to bottom, #00d4ff, transparent);
          transform-origin: bottom center;
          animation: radarSpin 2s linear infinite;
        }

        @keyframes radarPulse {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        @keyframes radarSpin {
          0% { transform: translate(-50%, -100%) rotate(0deg); }
          100% { transform: translate(-50%, -100%) rotate(360deg); }
        }

        .success-icon, .error-icon {
          font-size: 5rem;
          margin: 2rem 0;
        }

        .location-result {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: left;
        }

        .location-result p {
          margin: 0.5rem 0;
          color: var(--text-color);
        }

        .status-text {
          color: var(--text-gray);
          margin: 1rem 0;
        }

        .error-text {
          color: #ff4444;
          margin: 1rem 0;
        }

        .secondary-button {
          width: 100%;
          max-width: 400px;
          padding: 1rem;
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          color: var(--text-color);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  )
}
