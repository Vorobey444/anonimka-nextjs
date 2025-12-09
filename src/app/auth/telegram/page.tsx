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
    // Генерируем QR код при загрузке
    const initAuth = async () => {
      try {
        // Генерируем уникальный auth token для этой сессии
        const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('telegram_auth_token', authToken)

        console.log('🔑 Auth token сгенерирован:', authToken)

        // Генерируем QR-код
        await generateTelegramQR(authToken)

        // Настраиваем Deep Link
        setupTelegramDeepLink(authToken)

        // Запускаем проверку авторизации
        startAuthCheckPolling(
          authToken,
          (user) => {
            // Успешная авторизация
            handleTelegramAuthSuccess(user, (userData) => {
              console.log('✅ Авторизация успешна!', userData)
              // Закрываем модаль и перенаправляем
              setTimeout(() => {
                router.push('/main')
              }, 1000)
            })
          },
          () => {
            // Timeout
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
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>

      <div className="app-container">
        <div id="telegramAuthModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-overlay"></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔐 Авторизация через Telegram</h2>
              <button className="modal-close" onClick={() => router.push('/')}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="auth-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Требуется авторизация</h3>
                <p>Для продолжения использования сайта необходимо авторизоваться через Telegram.</p>
                <p>Это позволит:</p>
                <ul>
                  <li>✅ Создавать анкеты</li>
                  <li>✅ Получать уведомления о сообщениях</li>
                  <li>✅ Создавать приватные чаты</li>
                </ul>
              </div>

              <div className="telegram-login-container">
                <h4>📱 Отсканируйте QR-код</h4>
                <p className="qr-instruction">
                  1. Откройте камеру в мобильном приложении Telegram
                  <br />
                  2. Наведите на QR-код ниже
                  <br />
                  3. Нажмите "Открыть сайт" в боте
                  <br />
                  4. Авторизация завершится автоматически!
                </p>

                <div className="qr-code-wrapper">
                  <div id="qrcode"></div>
                  <div className="qr-loading" id="qrLoading">
                    <div className="spinner"></div>
                    <p>Генерация QR-кода...</p>
                  </div>
                </div>

                <div className="or-divider" id="loginWidgetDivider" style={{ display: 'none' }}>
                  <span>или</span>
                </div>

                <div id="loginWidgetContainer" style={{ display: 'none' }}>
                  <a
                    id="telegramDeepLink"
                    href="#"
                    className="telegram-login-button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Войти через Telegram
                  </a>
                  <p className="login-hint">Откроется приложение Telegram на вашем устройстве</p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={() => router.push('/auth/email')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff006e',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem',
                    }}
                  >
                    📧 Войти через Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-warning {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .warning-icon {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .auth-warning h3 {
          color: #ff6464;
          margin: 10px 0;
          font-size: 1.4rem;
        }

        .auth-warning p {
          color: var(--text-gray);
          margin: 5px 0;
        }

        .auth-warning ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
          text-align: left;
        }

        .auth-warning li {
          color: var(--text-gray);
          margin: 5px 0;
        }

        .telegram-login-container {
          text-align: center;
        }

        .telegram-login-container h4 {
          color: #8338ec;
          margin: 20px 0 10px 0;
          font-size: 1.2rem;
        }

        .qr-instruction {
          color: var(--text-gray);
          font-size: 0.9rem;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .qr-code-wrapper {
          display: flex;
          justify-content: center;
          margin: 30px 0;
          min-height: 280px;
          align-items: center;
        }

        .qr-code-wrapper div {
          background: white;
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(131, 56, 236, 0.3);
        }

        .qr-loading {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 15px;
          border: 3px solid rgba(131, 56, 236, 0.3);
          border-top-color: #8338ec;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .or-divider {
          color: var(--text-gray);
          margin: 20px 0;
          position: relative;
        }

        .or-divider span {
          background: #0a0a0f;
          padding: 0 10px;
        }

        .or-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
          z-index: -1;
        }

        .telegram-login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #0088cc, #0077b6);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          margin-bottom: 10px;
        }

        .telegram-login-button:hover {
          background: linear-gradient(135deg, #0099dd, #0088cc);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 136, 204, 0.3);
        }

        .login-hint {
          color: var(--text-gray);
          font-size: 0.85rem;
          margin-top: 10px;
        }

        @media (max-width: 480px) {
          .qr-code-wrapper {
            min-height: 200px;
          }

          .qr-instruction {
            font-size: 0.85rem;
          }

          .telegram-login-container h4 {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  )
}

export default function TelegramAuthPage() {
  return (
    <ErrorBoundary>
      <TelegramAuthPageContent />
    </ErrorBoundary>
  )
}
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="/webapp/app.js" defer></script>
      
      <div className="app-container">
        <div id="telegramAuthModal" className="modal" style={{display: 'block'}}>
          <div className="modal-overlay"></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔐 Авторизация через Telegram</h2>
              <button className="modal-close" onClick={() => router.push('/')}>✕</button>
            </div>
            <div className="modal-body">
              <div className="auth-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Требуется авторизация</h3>
                <p>Для продолжения использования сайта необходимо авторизоваться через Telegram.</p>
                <p>Это позволит:</p>
                <ul>
                  <li>✅ Создавать анкеты</li>
                  <li>✅ Получать уведомления о сообщениях</li>
                  <li>✅ Создавать приватные чаты</li>
                </ul>
              </div>

              <div className="telegram-login-container">
                <h4>📷 Отсканируйте QR-код</h4>
                <p className="qr-instruction">
                  1. Откройте камеру в мобильном приложении Telegram<br />
                  2. Наведите на QR-код ниже<br />
                  3. Нажмите "Открыть сайт" в боте<br />
                  4. Авторизация завершится автоматически!
                </p>

                <div className="qr-code-wrapper">
                  <div id="qrcode"></div>
                  <div className="qr-loading" id="qrLoading">
                    <div className="spinner"></div>
                    <p>Генерация QR-кода...</p>
                  </div>
                </div>

                <div className="or-divider" id="loginWidgetDivider" style={{display: 'none'}}>
                  <span>или</span>
                </div>

                <div id="loginWidgetContainer" style={{display: 'none'}}>
                  <a id="telegramDeepLink" href="#" className="telegram-login-button" target="_blank">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Войти через Telegram
                  </a>
                  <p className="login-hint">Откроется приложение Telegram на вашем устройстве</p>
                </div>

                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                  <button
                    onClick={() => router.push('/auth/email')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff006e',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    📧 Войти через Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function TelegramAuthPage() {
  return (
    <ErrorBoundary>
      <TelegramAuthPageContent />
    </ErrorBoundary>
  )
}
