'use client'

import { useState } from 'react'
import './welcome.css'

export default function WelcomePage() {
  const handleEmailAuth = () => {
    console.log('Email auth clicked')
    // TODO: Здесь будет логика email авторизации
    window.location.href = '/main'
  }

  const handleTelegramAuth = () => {
    console.log('Telegram auth clicked')
    // TODO: Здесь будет логика Telegram авторизации
    window.location.href = '/main'
  }

  const showChildSafety = () => {
    window.location.href = '/child-safety'
  }

  const showDeleteAccount = () => {
    window.location.href = '/delete-account'
  }

  const showPrivacyPolicy = () => {
    window.location.href = '/privacy'
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="neon-logo">
            <div className="logo-circle">
              <img src="/logo.png" alt="Anonimka Logo" className="logo-icon" />
            </div>
          </div>
          <h1 className="app-title">ANONIMKA</h1>
          <p className="app-subtitle">Анонимное общение без границ</p>
        </div>

        <div className="auth-buttons">
          <button className="auth-btn email-btn" onClick={handleEmailAuth}>
            <div className="btn-content">
              <div className="btn-icon">📧</div>
              <div className="btn-text">Вход через почту</div>
            </div>
          </button>

          <button className="auth-btn telegram-btn" onClick={handleTelegramAuth}>
            <div className="btn-content">
              <div className="btn-icon">✈️</div>
              <div className="btn-text">Вход через Telegram</div>
            </div>
          </button>
        </div>

        <p className="auth-hint">Выберите способ входа для продолжения</p>

        <div className="footer-links">
          <button className="footer-link safety" onClick={showChildSafety}>🛡️ Стандарты безопасности детей</button>
          <button className="footer-link" onClick={showDeleteAccount}>Удалить аккаунт</button>
          <button className="footer-link" onClick={showPrivacyPolicy}>Политика конфиденциальности</button>
        </div>
      </div>
    </div>
  )
}
