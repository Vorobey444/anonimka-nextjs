'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Проверяем, это мобильное устройство или WebView (только по user agent)
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      // Проверяем только реальные мобильные устройства, а не просто узкий экран
      const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent) && !/windows|mac|linux/i.test(userAgent)
      
      if (isMobileDevice) {
        setIsMobile(true)
        // Для мобильных - сразу редирект на webapp
        router.replace('/webapp/')
      }
    }
    
    checkMobile()
  }, [router])

  const handleEmailAuth = () => {
    router.push('/webapp/?auth=email')
  }

  const handleTelegramAuth = () => {
    router.push('/webapp/?auth=telegram')
  }

  // Если мобильный - показываем загрузку
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: '#00d4ff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            ⏳
          </div>
          <p style={{ fontSize: '1.25rem', opacity: 0.8 }}>
            Загрузка Anonimka.Online...
          </p>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // Для десктопа - показываем выбор авторизации
  return (
    <div className="welcome-container">
      <div className="neon-bg"></div>
      
      <div className="content">
        {/* Логотип неоновой кошечки */}
        <div className="logo-container">
          <div className="neon-cat">
            <div className="cat-hood">
              <div className="hood-left"></div>
              <div className="hood-right"></div>
            </div>
            <div className="cat-face">
              <div className="cat-ear cat-ear-left"></div>
              <div className="cat-ear cat-ear-right"></div>
              <div className="cat-eyes">
                <div className="cat-eye cat-eye-left"></div>
                <div className="cat-eye cat-eye-right"></div>
              </div>
              <div className="cat-nose"></div>
              <div className="cat-whiskers">
                <div className="whisker whisker-left-1"></div>
                <div className="whisker whisker-left-2"></div>
                <div className="whisker whisker-right-1"></div>
                <div className="whisker whisker-right-2"></div>
              </div>
            </div>
          </div>
          <h1 className="logo-text">Anonimka</h1>
          <p className="logo-subtitle">Анонимное общение без границ</p>
        </div>

        {/* Выбор авторизации */}
        <div className="auth-choice">
          <button 
            className="auth-button red-pill"
            onClick={handleEmailAuth}
          >
            <div className="pill-icon">📧</div>
            <span className="pill-text">Вход через почту</span>
            <div className="pill-glow red-glow"></div>
          </button>

          <button 
            className="auth-button blue-pill"
            onClick={handleTelegramAuth}
          >
            <div className="pill-icon">✈️</div>
            <span className="pill-text">Вход через Telegram</span>
            <div className="pill-glow blue-glow"></div>
          </button>
        </div>

        <p className="disclaimer">
          Выберите способ входа для продолжения
        </p>
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
          filter: drop-shadow(0 0 30px rgba(0, 212, 255, 0.8));
        }

        .cat-hood {
          position: absolute;
          width: 180px;
          height: 140px;
          left: 10px;
          top: 0;
          background: linear-gradient(135deg, #8338ec 0%, #ff006e 100%);
          border-radius: 90px 90px 20px 20px;
          animation: neonPulse 2s ease-in-out infinite;
        }

        .hood-left, .hood-right {
          position: absolute;
          width: 60px;
          height: 80px;
          background: linear-gradient(135deg, #8338ec 0%, #ff006e 100%);
          bottom: -20px;
        }

        .hood-left {
          left: 0;
          border-radius: 0 0 0 40px;
          transform: skewX(-10deg);
        }

        .hood-right {
          right: 0;
          border-radius: 0 0 40px 0;
          transform: skewX(10deg);
        }

        .cat-face {
          position: absolute;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
          border-radius: 50%;
          left: 40px;
          top: 50px;
          border: 3px solid #00d4ff;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
        }

        .cat-ear {
          position: absolute;
          width: 30px;
          height: 35px;
          background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
          border: 3px solid #00d4ff;
          border-bottom: none;
        }

        .cat-ear-left {
          top: -20px;
          left: 10px;
          border-radius: 20px 20px 0 0;
          transform: rotate(-15deg);
        }

        .cat-ear-right {
          top: -20px;
          right: 10px;
          border-radius: 20px 20px 0 0;
          transform: rotate(15deg);
        }

        .cat-eyes {
          display: flex;
          justify-content: center;
          gap: 25px;
          margin-top: 35px;
        }

        .cat-eye {
          width: 15px;
          height: 15px;
          background: #00ff88;
          border-radius: 50%;
          box-shadow: 0 0 15px #00ff88;
          animation: eyeBlink 4s ease-in-out infinite;
        }

        @keyframes eyeBlink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }

        .cat-nose {
          width: 10px;
          height: 8px;
          background: #ff006e;
          border-radius: 50%;
          margin: 8px auto;
          box-shadow: 0 0 10px #ff006e;
        }

        .cat-whiskers {
          position: relative;
        }

        .whisker {
          position: absolute;
          height: 2px;
          width: 40px;
          background: linear-gradient(90deg, #00d4ff 0%, transparent 100%);
          top: -30px;
        }

        .whisker-left-1 { left: -35px; transform: rotate(-20deg); }
        .whisker-left-2 { left: -35px; top: -22px; transform: rotate(-10deg); }
        .whisker-right-1 { right: -35px; transform: rotate(20deg) scaleX(-1); }
        .whisker-right-2 { right: -35px; top: -22px; transform: rotate(10deg) scaleX(-1); }

        @keyframes neonPulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(131, 56, 236, 0.6)); }
          50% { filter: drop-shadow(0 0 40px rgba(255, 0, 110, 0.8)); }
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
          gap: 3rem;
          justify-content: center;
          align-items: center;
          margin: 3rem 0;
          flex-wrap: wrap;
        }

        .auth-button {
          position: relative;
          width: 280px;
          height: 180px;
          background: rgba(26, 26, 46, 0.8);
          border: 3px solid;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-size: 1.3rem;
          font-weight: 600;
          overflow: hidden;
        }

        .red-pill {
          border-color: #ff006e;
          color: #ff006e;
        }

        .blue-pill {
          border-color: #00d4ff;
          color: #00d4ff;
        }

        .auth-button:hover {
          transform: translateY(-10px) scale(1.05);
        }

        .red-pill:hover {
          background: rgba(255, 0, 110, 0.1);
          box-shadow: 0 10px 50px rgba(255, 0, 110, 0.5);
        }

        .blue-pill:hover {
          background: rgba(0, 212, 255, 0.1);
          box-shadow: 0 10px 50px rgba(0, 212, 255, 0.5);
        }

        .pill-icon {
          font-size: 3.5rem;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .pill-text {
          font-size: 1.3rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .pill-glow {
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        .red-glow {
          background: radial-gradient(circle, rgba(255, 0, 110, 0.4) 0%, transparent 70%);
        }

        .blue-glow {
          background: radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%);
        }

        .auth-button:hover .pill-glow {
          opacity: 1;
        }

        .disclaimer {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          margin-top: 2rem;
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
        }
      `}</style>
    </div>
  )
}