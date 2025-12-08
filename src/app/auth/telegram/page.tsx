'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TelegramAuthPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram WebApp
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp

      if (tg && (tg.initData || tg.initDataUnsafe?.user)) {
        // Telegram WebApp доступен
        authenticateWithTelegram(tg)
      } else {
        // Не в Telegram - показываем инструкцию
        setLoading(false)
        setError('Откройте приложение через Telegram бота')
      }
    }
  }, [])

  const authenticateWithTelegram = async (tg: any) => {
    try {
      const user = tg.initDataUnsafe?.user
      
      if (!user || !user.id) {
        setError('Не удалось получить данные пользователя')
        setLoading(false)
        return
      }

      // Отправляем данные на сервер для верификации
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: tg.initData,
          user: user
        })
      })

      const data = await res.json()

      if (data.success) {
        // Сохраняем токен
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_id', data.userId.toString())
        localStorage.setItem('telegram_user', JSON.stringify(user))

        // Редирект на выбор никнейма или главную
        if (data.isNewUser) {
          router.push('/auth/nickname')
        } else {
          router.push('/menu')
        }
      } else {
        setError(data.error || 'Ошибка авторизации')
        setLoading(false)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Ошибка соединения с сервером')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="neon-bg"></div>

      <div className="auth-card">
        <button className="back-btn" onClick={() => router.back()}>
          ← Назад
        </button>

        <h1 className="title">✈️ Вход через Telegram</h1>

        {loading ? (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p className="loading-text">Проверяем авторизацию...</p>
          </div>
        ) : error ? (
          <>
            <div className="error-box">
              <div className="error-icon">❌</div>
              <p className="error-title">Ошибка авторизации</p>
              <p className="error-message">{error}</p>
            </div>

            <div className="info-box">
              <p><strong>📱 Как войти через Telegram:</strong></p>
              <ol>
                <li>Найдите бота <strong>@AnonimkaBot</strong> в Telegram</li>
                <li>Нажмите кнопку <strong>"Открыть приложение"</strong></li>
                <li>Приложение откроется с автоматической авторизацией</li>
              </ol>
            </div>

            <button
              className="submit-btn"
              onClick={() => window.open('https://t.me/AnonimkaBot', '_blank')}
            >
              Открыть Telegram бота
            </button>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        .neon-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(131, 56, 236, 0.15) 0%, transparent 50%);
          animation: bgPulse 8s ease-in-out infinite;
        }

        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .auth-card {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(30, 30, 45, 0.9) 100%);
          border: 2px solid #00d4ff;
          border-radius: 24px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3);
          backdrop-filter: blur(20px);
        }

        .back-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
          margin-bottom: 1rem;
          transition: color 0.3s ease;
        }

        .back-btn:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d4ff 0%, #4de2ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 2rem 0;
          text-align: center;
        }

        .loading-container {
          text-align: center;
          padding: 2rem 0;
        }

        .spinner {
          font-size: 4rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: rgba(255, 255, 255, 0.7);
          margin-top: 1rem;
          font-size: 1.1rem;
        }

        .error-box {
          background: rgba(255, 68, 68, 0.1);
          border: 2px solid rgba(255, 68, 68, 0.3);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-title {
          color: #ff4444;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .error-message {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .info-box {
          background: rgba(131, 56, 236, 0.1);
          border: 1px solid rgba(131, 56, 236, 0.3);
          color: rgba(255, 255, 255, 0.8);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          text-align: left;
        }

        .info-box p {
          margin: 0 0 1rem 0;
        }

        .info-box strong {
          color: #00d4ff;
        }

        .info-box ol {
          margin: 0;
          padding-left: 1.5rem;
        }

        .info-box li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #00d4ff 0%, #4de2ff 100%);
          border: none;
          border-radius: 12px;
          color: #0a0a0f;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
        }

        @media (max-width: 768px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }

          .title {
            font-size: 1.5rem;
          }

          .info-box {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}
