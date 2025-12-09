'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  generateTelegramQR,
  setupTelegramDeepLink,
  startAuthCheckPolling,
  handleTelegramAuthSuccess,
} from '@/utils/telegramAuth'

function TelegramAuthPageContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const initAuth = async () => {
      try {
        const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('telegram_auth_token', authToken)

        console.log('🔑 Auth token сгенерирован:', authToken)

        await generateTelegramQR(authToken)
        setupTelegramDeepLink(authToken)

        startAuthCheckPolling(
          authToken,
          (user) => {
            handleTelegramAuthSuccess(user, (userData) => {
              console.log('✅ Авторизация успешна!', userData)
              setTimeout(() => {
                router.push('/main')
              }, 1000)
            })
          },
          () => {
            console.log('⏰ Время ожидания авторизации истекло')
          }
        )

        setIsLoading(false)
      } catch (err) {
        console.error('Ошибка при инициализации авторизации:', err)
        setIsLoading(false)
      }
    }

    initAuth()
  }, [router, isMounted])

  if (!isMounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: '#8338ec'
      }}>
        <div>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="welcome-container">
      <style>{`
        .welcome-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .neon-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(255, 0, 100, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(0, 100, 255, 0.15) 0%, transparent 50%);
          animation: bgPulse 8s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }

        .logo-container {
          margin-bottom: 2rem;
        }

        .logo-text {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d4ff 0%, #8338ec 50%, #ff006e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          animation: textGlow 3s ease-in-out infinite;
        }

        @keyframes textGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(131, 56, 236, 0.8)); }
        }

        .logo-subtitle {
          color: #8338ec;
          font-size: 1rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        .telegram-card {
          position: relative;
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(30, 30, 45, 0.9) 100%);
          border: 2px solid;
          border-image: linear-gradient(135deg, #00d4ff, #8338ec, #ff006e) 1;
          border-radius: 20px;
          padding: 2rem;
          margin-top: 2rem;
          box-shadow: 
            0 0 20px rgba(0, 212, 255, 0.3),
            0 0 40px rgba(131, 56, 236, 0.2),
            0 0 60px rgba(255, 0, 100, 0.1);
          animation: cardGlow 3s ease-in-out infinite;
        }

        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(131, 56, 236, 0.2); }
          50% { box-shadow: 0 0 30px rgba(131, 56, 236, 0.4), 0 0 50px rgba(255, 0, 100, 0.2); }
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #8338ec;
          background: transparent;
          color: #8338ec;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(131, 56, 236, 0.2);
          box-shadow: 0 0 20px rgba(131, 56, 236, 0.5);
        }

        .qr-title {
          font-size: 1.5rem;
          color: #00d4ff;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .qr-instruction {
          color: #aaaaaa;
          font-size: 0.9rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .qr-wrapper {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(131, 56, 236, 0.05) 100%);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 1.5rem;
          min-height: 280px;
          min-width: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 20px rgba(0, 212, 255, 0.2),
            inset 0 0 20px rgba(131, 56, 236, 0.1);
        }

        #qrcode {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-loading {
          text-align: center;
          color: #8338ec;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 212, 255, 0.3);
          border-top: 3px solid #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 12px 20px;
          border-radius: 12px;
          border: 2px solid;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(131, 56, 236, 0.2) 100%);
          border-color: #00d4ff;
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.4) 0%, rgba(131, 56, 236, 0.3) 100%);
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.6), inset 0 0 30px rgba(0, 212, 255, 0.2);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: linear-gradient(135deg, rgba(255, 0, 100, 0.2) 0%, rgba(131, 56, 236, 0.2) 100%);
          border-color: #ff006e;
          color: #ff006e;
          box-shadow: 0 0 20px rgba(255, 0, 100, 0.3), inset 0 0 20px rgba(255, 0, 100, 0.1);
        }

        .btn-secondary:hover {
          background: linear-gradient(135deg, rgba(255, 0, 100, 0.4) 0%, rgba(131, 56, 236, 0.3) 100%);
          box-shadow: 0 0 30px rgba(255, 0, 100, 0.6), inset 0 0 30px rgba(255, 0, 100, 0.2);
          transform: translateY(-2px);
        }

        .divider {
          color: #666;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .benefits {
          background: linear-gradient(135deg, rgba(131, 56, 236, 0.1) 0%, rgba(255, 0, 100, 0.05) 100%);
          border: 1px solid rgba(131, 56, 236, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: #aaaaaa;
        }

        .benefits h3 {
          color: #8338ec;
          font-size: 1rem;
          margin-bottom: 0.8rem;
        }

        .benefits ul {
          list-style: none;
          padding: 0;
        }

        .benefits li {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 480px) {
          .logo-text {
            font-size: 1.8rem;
          }

          .telegram-card {
            padding: 1.5rem;
          }

          .qr-wrapper {
            min-height: 240px;
            min-width: 240px;
          }
        }
      `}</style>

      <div className="neon-bg"></div>

      <div className="content">
        <div className="logo-container">
          <h1 className="logo-text">🔐 ANONIMKA</h1>
          <p className="logo-subtitle">Вход через Telegram</p>
        </div>

        <div className="telegram-card">
          <button className="close-btn" onClick={() => router.push('/')}>✕</button>

          <div className="benefits">
            <h3>✨ С авторизацией ты получишь:</h3>
            <ul>
              <li>✅ Создавать и редактировать свою анкету</li>
              <li>✅ Видеть все сообщения и уведомления</li>
              <li>✅ Начать приватный чат с кем угодно</li>
            </ul>
          </div>

          <h3 className="qr-title">📱 Отсканируй QR-код</h3>

          <p className="qr-instruction">
            Используй приложение Telegram на телефоне:<br/>
            Камера → Наведи на QR → Открыть сайт
          </p>

          <div className="qr-wrapper">
            <div id="qrcode"></div>
            <div className="qr-loading" id="qrLoading" style={{ display: 'none' }}>
              <div className="spinner"></div>
              <p>Генерируем QR-код...</p>
            </div>
          </div>

          <div className="button-group">
            <button
              id="telegramDeepLink"
              className="btn btn-primary"
              style={{ cursor: 'pointer' }}
            >
              🚀 Открыть бота в Telegram
            </button>

            <div className="divider">или</div>

            <button
              onClick={() => router.push('/auth/email')}
              className="btn btn-secondary"
            >
              📧 Войти через Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TelegramAuthPage() {
  return (
    <ErrorBoundary>
      <TelegramAuthPageContent />
    </ErrorBoundary>
  )
}
