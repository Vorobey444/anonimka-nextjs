'use client'

import { useRouter } from 'next/navigation'

export default function EmailAuthPage() {
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
    setError('')

    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-code', email, code })
      })

      const data = await res.json()

      if (data.success) {
        // Сохраняем токен
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_id', data.userId)

        // Редирект на выбор никнейма или главную
        if (data.isNewUser) {
          router.push('/auth/nickname')
        } else {
          router.push('/menu')
        }
      } else {
        setError(data.error || 'Неверный код')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    } finally {
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

        <h1 className="title">📧 Вход через Email</h1>

        {step === 'email' ? (
          <>
            <p className="description">
              Введите ваш email для получения кода подтверждения
            </p>

            <input
              type="email"
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
            />

            {error && <div className="error-message">{error}</div>}

            <button
              className="submit-btn"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>

            <div className="info-box">
              💡 Код придет на почту в течение минуты
            </div>
          </>
        ) : (
          <>
            <p className="description">
              Введите 6-значный код из письма на<br />
              <strong>{email}</strong>
            </p>

            <input
              type="text"
              className="input-field code-input"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              maxLength={6}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
            />

            {error && <div className="error-message">{error}</div>}

            <button
              className="submit-btn"
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>

            <button
              className="link-btn"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              disabled={loading}
            >
              ← Изменить email
            </button>

            <div className="info-box">
              ⏱️ Код действителен 10 минут
            </div>
          </>
        )}
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
            radial-gradient(circle at 20% 50%, rgba(255, 0, 110, 0.15) 0%, transparent 50%),
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
          border: 2px solid #ff006e;
          border-radius: 24px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(255, 0, 110, 0.3);
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
          background: linear-gradient(135deg, #ff006e 0%, #ff4d94 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1rem 0;
          text-align: center;
        }

        .description {
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .description strong {
          color: #ff006e;
        }

        .input-field {
          width: 100%;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          background: rgba(10, 10, 20, 0.6);
          border: 2px solid rgba(255, 0, 110, 0.3);
          border-radius: 12px;
          color: #fff;
          outline: none;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
          box-sizing: border-box;
        }

        .input-field:focus {
          border-color: #ff006e;
          box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
        }

        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .code-input {
          text-align: center;
          font-size: 2rem;
          letter-spacing: 0.5rem;
          font-weight: bold;
        }

        .error-message {
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.3);
          color: #ff4444;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #ff006e 0%, #ff4d94 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 0, 110, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .link-btn {
          width: 100%;
          padding: 0.8rem;
          font-size: 1rem;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .link-btn:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.4);
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.05);
        }

        .link-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-box {
          background: rgba(131, 56, 236, 0.1);
          border: 1px solid rgba(131, 56, 236, 0.3);
          color: #8338ec;
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          margin-top: 2rem;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }

          .title {
            font-size: 1.5rem;
          }

          .code-input {
            font-size: 1.5rem;
            letter-spacing: 0.3rem;
          }
        }
      `}</style>
    </div>
  )
}
