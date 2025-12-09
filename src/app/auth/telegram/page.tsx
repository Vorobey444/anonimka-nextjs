'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function TelegramAuthPageContent() {
  const router = useRouter()

  useEffect(() => {
    // Генерируем QR код при загрузке
    const generateQRCode = async () => {
      try {
        // Загружаем QRCode.js библиотеку если её нет
        if (typeof (window as any).QRCode === 'undefined') {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
          script.onload = () => {
            generateQR()
          }
          document.head.appendChild(script)
        } else {
          generateQR()
        }
      } catch (err) {
        console.error('Ошибка при загрузке QRCode:', err)
      }
    }

    const generateQR = () => {
      const qrContainer = document.getElementById('qrcode')
      if (qrContainer && qrContainer.children.length === 0) {
        try {
          const qrData = `https://${window.location.host}/api/telegram-login`
          new (window as any).QRCode(qrContainer, {
            text: qrData,
            width: 256,
            height: 256,
            colorDark: '#8338ec',
            colorLight: '#ffffff',
            correctLevel: (window as any).QRCode.CorrectLevel.H,
          })
          // Скрываем loading после генерации
          const qrLoading = document.getElementById('qrLoading')
          if (qrLoading) {
            qrLoading.style.display = 'none'
          }
        } catch (err) {
          console.error('Ошибка при генерации QR:', err)
        }
      }
    }

    generateQRCode()
  }, [])
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
