'use client'

import { useRouter } from 'next/navigation'

export default function TelegramAuthPage() {
  const router = useRouter()

  return (
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
