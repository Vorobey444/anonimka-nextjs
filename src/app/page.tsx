'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function HomeContent() {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* Уведомление о ремонте */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #ff006e 0%, #ff0080 100%)',
        color: '#ffffff',
        padding: '15px 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(255, 0, 100, 0.5)',
        zIndex: 9999,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        ⚠️ ВНИМАНИЕ! ВЕДУТСЯ РЕМОНТНЫЕ РАБОТЫ, СЕРВИС ВРЕМЕННО НЕДОСТУПЕН
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <div style={{
        marginTop: '80px',
        color: '#8338ec',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        🔧 Идут технические работы
      </div>

      <div style={{
        marginTop: '20px',
        color: '#aaaaaa',
        fontSize: '16px',
        maxWidth: '500px',
        marginBottom: '20px'
      }}>
        Приносим извинения за неудобства. Мы работаем над улучшением сервиса.
        <br />
        Скоро всё заработает!
      </div>

      {/* Кнопка "Подробнее" */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: 'transparent',
          border: '1px solid #666',
          borderRadius: '8px',
          color: '#aaaaaa',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {showDetails ? '▲ Скрыть' : '▼ Подробнее'}
      </button>

      {/* Скрытая секция */}
      {showDetails && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(131, 56, 236, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(131, 56, 236, 0.3)',
          maxWidth: '500px'
        }}>
          <div style={{
            color: '#aaaaaa',
            fontSize: '14px',
            marginBottom: '15px',
            lineHeight: '1.6'
          }}>
            Идет обновление системы авторизации через Telegram.
            <br />
            Некоторые функции могут работать нестабильно.
          </div>
          
          <button
            onClick={() => router.push('/menu')}
            style={{
              background: 'linear-gradient(135deg, rgba(131, 56, 236, 0.8) 0%, rgba(255, 0, 100, 0.6) 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(131, 56, 236, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(131, 56, 236, 0.6)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(131, 56, 236, 0.4)'
            }}
          >
            🚀 Все равно продолжить
          </button>
        </div>
      )}
    </div>
  )

  useEffect(() => {
    // КРИТИЧНО: Сразу проверяем Telegram WebApp БЕЗ задержки
    const checkAuth = () => {
      // Проверяем Telegram WebApp (приоритет)
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp
        // Проверяем что это действительно Telegram (есть initData или user)
        if (tg.initData || tg.initDataUnsafe?.user) {
          console.log('🚀 Telegram WebApp detected, redirecting immediately')
          router.replace('/menu')
          return true
        }
      }

      // Проверяем, это мобильное устройство (только по user agent)
      const userAgent = navigator.userAgent.toLowerCase()
      // Проверяем только реальные мобильные устройства, а не просто узкий экран
      const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent) && !/windows|mac|linux/i.test(userAgent)
      
      if (isMobileDevice) {
        console.log('📱 Mobile device detected, redirecting to menu')
        // Для мобильных - сразу редирект на menu
        router.replace('/menu')
        return true
      }

      return false
    }

    // Пробуем сразу, даже если Telegram SDK еще не загрузился
    if (checkAuth()) {
      return
    }

    // Если не было редиректа - показываем страницу
    setShouldRender(true)

    // Если SDK не загрузился, ждем его максимум 500мс
    const timer = setTimeout(() => {
      if (checkAuth()) {
        return
      }
      // Если и после 500мс ничего - показываем страницу
      setShouldRender(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [router])

  // Скрываем всё пока идёт проверка и редирект
  if (!shouldRender) {
    return null
  }

  const handleEmailAuth = () => {
    router.push('/auth/email')
  }

  const handleTelegramAuth = () => {
    router.push('/auth/telegram')
  }

  // Для десктопа - показываем выбор авторизации
  return (
    <div className="welcome-container">
      <div className="neon-bg"></div>

      <div className="content">
        {/* Логотип неоновой кошечки */}
        <div className="logo-container">
          <div className="neon-cat">
            <img
              src="/webapp/logo.png"
              alt="Anonimka Logo"
              className="logo-image"
            />
          </div>
          <h1 className="logo-text">ANONIMKA</h1>
          <p className="logo-subtitle">Анонимное общение без границ</p>
        </div>

        {/* Выбор авторизации */}
        <div className="auth-choice">
          <button
            className="auth-button email-button"
            onClick={handleEmailAuth}
          >
            <div className="button-content">
              <div className="icon">📧</div>
              <div className="text">Вход через почту</div>
            </div>
          </button>

          <button
            className="auth-button telegram-button"
            onClick={handleTelegramAuth}
          >
            <div className="button-content">
              <div className="icon">✈️</div>
              <div className="text">Вход через Telegram</div>
            </div>
          </button>
        </div>

        <p className="disclaimer">
          Выберите способ входа для продолжения
        </p>

        {/* Footer с важными ссылками */}
        <div className="footer-links">
          <a href="/child-safety" target="_blank" className="footer-link safety">
            🛡️ Стандарты безопасности детей
          </a>
          <a href="/delete-account" target="_blank" className="footer-link">
            Удалить аккаунт
          </a>
          <a href="/privacy" target="_blank" className="footer-link">
            Политика конфиденциальности
          </a>
        </div>
      </div>

      <style jsx>{`
        .welcome-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          position: relative;
          overflow: hidden;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .neon-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 50%, rgba(255, 0, 100, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(0, 100, 255, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          animation: bgPulse 8s ease-in-out infinite;
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
          max-width: 900px;
        }

        .logo-container {
          margin-bottom: 4rem;
        }

        .neon-cat {
          width: 200px;
          height: 200px;
          margin: 0 auto 2rem;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: neonPulse 2s ease-in-out infinite;
        }

        .logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          filter: drop-shadow(0 0 40px rgba(255, 0, 100, 0.8))
                  drop-shadow(0 0 60px rgba(0, 100, 255, 0.6))
                  drop-shadow(0 0 80px rgba(131, 56, 236, 0.4));
          box-shadow: 0 0 100px 30px rgba(255, 0, 100, 0.3),
                      0 0 150px 50px rgba(0, 100, 255, 0.2);
        }

        @keyframes neonPulse {
          0%, 100% {
            filter: drop-shadow(0 0 40px rgba(255, 0, 100, 0.8))
                    drop-shadow(0 0 60px rgba(0, 100, 255, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 50px rgba(255, 0, 100, 1))
                    drop-shadow(0 0 70px rgba(0, 100, 255, 0.8));
          }
        }

        .logo-text {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d4ff 0%, #8338ec 50%, #ff006e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 4px;
          animation: textGlow 3s ease-in-out infinite;
        }

        @keyframes textGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(131, 56, 236, 0.8)); }
        }

        .logo-subtitle {
          color: #8338ec;
          font-size: 1.2rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        .auth-choice {
          display: flex;
          gap: 2rem;
          justify-content: center;
          align-items: center;
          margin: 3rem 0;
          flex-wrap: wrap;
        }

        .auth-button {
          position: relative;
          width: 320px;
          height: 80px;
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.9) 0%, rgba(30, 30, 45, 0.8) 100%);
          border: 2px solid;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .email-button {
          border-color: #ff006e;
        }

        .telegram-button {
          border-color: #00d4ff;
        }

        .button-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0 2rem;
          height: 100%;
        }

        .icon {
          font-size: 2.5rem;
          transition: transform 0.3s ease;
        }

        .text {
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .email-button .text {
          color: #ff006e;
        }

        .telegram-button .text {
          color: #00d4ff;
        }

        .auth-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .auth-button::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(135deg, var(--glow-color-1), var(--glow-color-2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .email-button {
          --glow-color-1: #ff006e;
          --glow-color-2: #ff4d94;
        }

        .telegram-button {
          --glow-color-1: #00d4ff;
          --glow-color-2: #4de2ff;
        }

        .auth-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px -10px var(--glow-color-1);
        }

        .auth-button:hover::before {
          opacity: 1;
        }

        .auth-button:hover::after {
          opacity: 1;
        }

        .auth-button:hover .icon {
          transform: scale(1.1) rotate(5deg);
        }

        .auth-button:active {
          transform: translateY(-2px);
        }

        .disclaimer {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          margin-top: 2rem;
        }

        .footer-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.9rem;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-link:hover {
          color: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .footer-link.safety {
          color: #667eea;
          border-color: rgba(102, 126, 234, 0.3);
          font-weight: 600;
        }

        .footer-link.safety:hover {
          color: #8094ff;
          border-color: rgba(102, 126, 234, 0.6);
          background: rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
          .auth-choice {
            flex-direction: column;
            gap: 2rem;
          }

          .auth-button {
            width: 240px;
            height: 160px;
          }

          .logo-text {
            font-size: 2.5rem;
          }

          .neon-cat {
            width: 150px;
            height: 150px;
          }

          .footer-links {
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 2rem;
          }

          .footer-link {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  )
}
