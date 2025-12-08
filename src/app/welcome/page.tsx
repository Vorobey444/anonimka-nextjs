'use client'

import { useState } from 'react'
import './welcome.css'

export default function WelcomePage() {
  const handleEmailAuth = () => {
    console.log('Email auth clicked')
    // TODO: Здесь будет логика email авторизации
  }

  const handleTelegramAuth = () => {
    console.log('Telegram auth clicked')
    // TODO: Здесь будет логика Telegram авторизации
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="neon-logo">
            <div className="logo-circle">
              <img src="/logo.png" alt="Anonimka Logo" className="logo-icon" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
            </div>
          </div>
        </div>

        <h1 className="app-title">ANONIMKA</h1>
        <p className="app-subtitle">Анонимное общение без границ</p>

        <div className="auth-buttons">
          <button className="auth-btn email-btn" onClick={handleEmailAuth}>
            <span className="btn-icon">📧</span>
            <span className="btn-text">
              <span className="btn-title">ВХОД ЧЕРЕЗ</span>
              <span className="btn-subtitle">ПОЧТУ</span>
            </span>
          </button>

          <button className="auth-btn telegram-btn" onClick={handleTelegramAuth}>
            <span className="btn-icon">✈️</span>
            <span className="btn-text">
              <span className="btn-title">ВХОД ЧЕРЕЗ</span>
              <span className="btn-subtitle">TELEGRAM</span>
            </span>
          </button>
        </div>

        <p className="auth-hint">Выберите способ входа для продолжения</p>

        <div className="footer-links">
          <button className="footer-link">🛡️ Стандарты безопасности детей</button>
          <button className="footer-link">Удалить аккаунт</button>
          <button className="footer-link">Политика конфиденциальности</button>
        </div>
      </div>
    </div>
  )
}
