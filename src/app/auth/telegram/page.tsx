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

  useEffect(() => {
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
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .auth-container {
          width: 100%;
          max-width: 500px;
          animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .auth-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .auth-header p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.1);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .close-btn:hover {
          background: rgba(0, 0, 0, 0.2);
          transform: scale(1.1);
        }
        
        .benefits {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          color: white;
        }
        
        .benefits h3 {
          font-size: 16px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .benefits ul {
          list-style: none;
        }
        
        .benefits li {
          font-size: 14px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .qr-section {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .qr-section h3 {
          font-size: 18px;
          color: #1a1a2e;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .qr-wrapper {
          background: white;
          border-radius: 15px;
          padding: 20px;
          display: inline-block;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          margin-bottom: 15px;
          min-height: 280px;
          min-width: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        #qrcode {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-loading {
          text-align: center;
          color: #666;
        }
        
        .qr-loading p {
          margin-top: 10px;
          font-size: 14px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .qr-instruction {
          font-size: 13px;
          color: #666;
          line-height: 1.8;
          margin-bottom: 15px;
        }
        
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .btn {
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        
        .btn-secondary:hover {
          background: #667eea;
          color: white;
        }
        
        .divider {
          text-align: center;
          margin: 20px 0;
          color: #ccc;
          font-size: 14px;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          display: inline-block;
          width: 40%;
          height: 1px;
          background: #ccc;
          vertical-align: middle;
          margin: 0 10px;
        }
      `}</style>
      
      <div className="auth-container">
        <button className="close-btn" onClick={() => router.push('/')}>✕</button>
        
        <div className="auth-card">
          <div className="auth-header">
            <h1>🔐 Вход через Telegram</h1>
            <p>Безопасная авторизация за несколько секунд</p>
          </div>
          
          <div className="benefits">
            <h3>✨ С авторизацией ты получишь:</h3>
            <ul>
              <li>✅ Создавать и редактировать свою анкету</li>
              <li>✅ Видеть все сообщения и уведомления</li>
              <li>✅ Начать приватный чат с кем угодно</li>
            </ul>
          </div>
          
          <div className="qr-section">
            <h3>📱 Отсканируй QR-код</h3>
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
