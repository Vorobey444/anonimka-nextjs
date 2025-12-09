'use client'

import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function EmailAuthPageContent() {
  const router = useRouter()

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="/webapp/app.js" defer></script>
      
      <div className="modal-overlay" style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 99999,
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="modal-content" style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%)',
          borderRadius: '30px',
          padding: '3rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(255, 0, 110, 0.4)',
          border: '3px solid #ff006e',
          position: 'relative'
        }}>
          <h2 style={{
            color: '#ff006e',
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '2rem',
            textShadow: '0 0 20px rgba(255, 0, 110, 0.6)'
          }}>📧 Вход через Email</h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '1rem'
          }}>Введите вашу почту для авторизации</p>

          <div style={{marginBottom: '1.5rem'}}>
            <input
              type="email"
              id="emailAuthInput"
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #ff006e',
                borderRadius: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                color: '#fff',
                fontSize: '1.1rem',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div id="emailAuthCodeSection" style={{display: 'none', marginBottom: '1.5rem'}}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '0.95rem'
            }}>Введите код из письма:</p>
            <input
              type="text"
              id="emailAuthCode"
              placeholder="••••••"
              maxLength={6}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #00ff88',
                borderRadius: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                color: '#fff',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                outline: 'none'
              }}
            />
          </div>

          <div id="emailAuthMessage" style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            minHeight: '1.5rem',
            color: '#00ff88',
            fontSize: '0.9rem'
          }}></div>

          <button
            id="emailAuthButton"
            className="neon-button primary"
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid #ff006e',
              borderRadius: '15px',
              background: 'rgba(255, 0, 110, 0.2)',
              color: '#ff006e',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '1rem'
            }}
          >
            Отправить код
          </button>

          <div style={{textAlign: 'center'}}>
            <button
              onClick={() => router.push('/auth/telegram')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00d4ff',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✈️ Войти через Telegram
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function EmailAuthPage() {
  return (
    <ErrorBoundary>
      <EmailAuthPageContent />
    </ErrorBoundary>
  )
}
