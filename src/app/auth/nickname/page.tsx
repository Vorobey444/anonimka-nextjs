'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function NicknamePageContent() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    // Генерируем случайные предложения
    const adjectives = ['Тихий', 'Загадочный', 'Веселый', 'Умный', 'Дерзкий', 'Милый']
    const nouns = ['Кот', 'Панда', 'Лис', 'Волк', 'Сова', 'Дракон']
    
    const generated = []
    for (let i = 0; i < 3; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
      const noun = nouns[Math.floor(Math.random() * nouns.length)]
      const num = Math.floor(Math.random() * 999)
      generated.push(`${adj}${noun}${num}`)
    }
    setSuggestions(generated)
  }, [])

  const handleSubmit = async () => {
    const trimmed = nickname.trim()

    if (!trimmed) {
      setError('Введите никнейм')
      return
    }

    if (trimmed.length < 3) {
      setError('Никнейм должен быть не менее 3 символов')
      return
    }

    if (trimmed.length > 20) {
      setError('Никнейм должен быть не более 20 символов')
      return
    }

    if (!/^[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(trimmed)) {
      setError('Только буквы, цифры и подчеркивание')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('user_token')
      
      if (!token) {
        setError('Сессия истекла. Войдите заново')
        setTimeout(() => router.push('/'), 2000)
        return
      }

      const res = await fetch('/api/nickname', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname: trimmed })
      })

      const data = await res.json()

      if (data.success) {
        // Сохраняем никнейм
        localStorage.setItem('user_nickname', trimmed)
        
        // Редирект на главную
        router.push('/menu')
      } else {
        setError(data.error || 'Ошибка сохранения никнейма')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nickname-container">
      <div className="neon-bg"></div>

      <div className="nickname-card">
        <div className="header">
          <div className="icon">👤</div>
          <h1 className="title">Выберите никнейм</h1>
          <p className="subtitle">Это имя будут видеть другие пользователи</p>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="input-field"
            placeholder="Ваш никнейм"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
            maxLength={20}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          
          <div className="char-counter">
            {nickname.length}/20 символов
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {suggestions.length > 0 && !nickname && (
          <div className="suggestions">
            <p className="suggestions-title">💡 Или выберите готовый:</p>
            <div className="suggestions-grid">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="suggestion-btn"
                  onClick={() => setNickname(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading || !nickname.trim()}
        >
          {loading ? 'Сохранение...' : 'Продолжить →'}
        </button>

        <div className="info-box">
          <p><strong>Правила:</strong></p>
          <ul>
            <li>От 3 до 20 символов</li>
            <li>Только буквы, цифры и _</li>
            <li>Можно изменить в настройках</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .nickname-container {
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
            radial-gradient(circle at 20% 50%, rgba(131, 56, 236, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255, 0, 110, 0.15) 0%, transparent 50%);
          animation: bgPulse 8s ease-in-out infinite;
        }

        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .nickname-card {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(30, 30, 45, 0.9) 100%);
          border: 2px solid #8338ec;
          border-radius: 24px;
          padding: 3rem;
          max-width: 550px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(131, 56, 236, 0.3);
          backdrop-filter: blur(20px);
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #8338ec 0%, #ff006e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-size: 1rem;
        }

        .input-section {
          position: relative;
          margin-bottom: 1rem;
        }

        .input-field {
          width: 100%;
          padding: 1rem 1.5rem;
          font-size: 1.2rem;
          background: rgba(10, 10, 20, 0.6);
          border: 2px solid rgba(131, 56, 236, 0.3);
          border-radius: 12px;
          color: #fff;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          text-align: center;
          font-weight: 600;
        }

        .input-field:focus {
          border-color: #8338ec;
          box-shadow: 0 0 20px rgba(131, 56, 236, 0.3);
        }

        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .char-counter {
          text-align: right;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-top: 0.5rem;
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

        .suggestions {
          margin-bottom: 2rem;
        }

        .suggestions-title {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
          text-align: center;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .suggestion-btn {
          padding: 0.8rem;
          background: rgba(131, 56, 236, 0.1);
          border: 1px solid rgba(131, 56, 236, 0.3);
          border-radius: 8px;
          color: #8338ec;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .suggestion-btn:hover {
          background: rgba(131, 56, 236, 0.2);
          border-color: #8338ec;
          transform: translateY(-2px);
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #8338ec 0%, #ff006e 100%);
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
          box-shadow: 0 10px 30px rgba(131, 56, 236, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .info-box {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
          padding: 1.5rem;
          border-radius: 12px;
          margin-top: 2rem;
        }

        .info-box p {
          margin: 0 0 0.5rem 0;
          font-weight: 600;
          color: #00d4ff;
        }

        .info-box ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .info-box li {
          margin: 0.3rem 0;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .nickname-card {
            padding: 2rem 1.5rem;
          }

          .title {
            font-size: 1.5rem;
          }

          .suggestions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default function NicknamePage() {
  return (
    <ErrorBoundary>
      <NicknamePageContent />
    </ErrorBoundary>
  )
}
