'use client'

import { useState } from 'react'
import './welcome.css'

export default function WelcomePage() {
  const [authMethod, setAuthMethod] = useState<'email' | 'telegram' | null>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'method' | 'email' | 'code'>('method')

  const handleTelegramAuth = () => {
    // Telegram WebApp авторизация
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      const user = tg.initDataUnsafe?.user
      
      if (user) {
        console.log('Telegram user:', user)
        // Здесь будет редирект в основное приложение
      }
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setStep('code')
      }
    } catch (error) {
      console.error('Error sending code:', error)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      
      if (response.ok) {
        // Здесь будет редирект в основное приложение
        console.log('Auth successful')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
    }
  }

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">ANONIMKA</h1>
        <p className="welcome-subtitle">Анонимные Свидания без Регистрации</p>

        {step === 'method' && (
          <div className="auth-methods">
            <button 
              className="auth-button telegram-button"
              onClick={handleTelegramAuth}
            >
              Войти через Telegram
            </button>

            <button 
              className="auth-button email-button"
              onClick={() => {
                setAuthMethod('email')
                setStep('email')
              }}
            >
              Войти через Email
            </button>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите ваш email"
              className="auth-input"
              required
            />
            <button type="submit" className="auth-button">
              Получить код
            </button>
            <button 
              type="button" 
              className="auth-button secondary"
              onClick={() => setStep('method')}
            >
              Назад
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="auth-form">
            <p className="code-info">Код отправлен на {email}</p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите код из письма"
              className="auth-input"
              required
            />
            <button type="submit" className="auth-button">
              Войти
            </button>
            <button 
              type="button" 
              className="auth-button secondary"
              onClick={() => setStep('email')}
            >
              Назад
            </button>
          </form>
        )}

        <p className="welcome-footer">
          Нажимая кнопку входа, вы принимаете <a href="/terms">условия использования</a>
        </p>
      </div>
    </div>
  )
}
