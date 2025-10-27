'use client'

import { useState, useEffect } from 'react'
import EmailTest from '@/components/EmailTest'

// Типы для Telegram Web App
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name?: string
            last_name?: string
            username?: string
          }
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
      }
    }
  }
}

interface ContactFormData {
  senderEmail: string
  subject: string
  message: string
}

export default function Home() {
  const [formData, setFormData] = useState<ContactFormData>({
    senderEmail: '',
    subject: '',
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Инициализация Telegram Web App
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      
      // Настройка темы
      document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color || '#0a0a0f')
      document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#00d4ff')
      
      console.log('Telegram Web App инициализирован:', tg.initDataUnsafe)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: ContactFormData) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.senderEmail || !formData.message) {
      setStatus('error')
      setStatusMessage('Пожалуйста, заполните все обязательные поля')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setStatusMessage('')

    try {
      console.log('Отправляем данные через Vercel API:', formData)
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      console.log('Ответ от API:', result)

      if (result.success) {
        setStatus('success')
        setStatusMessage(result.message || 'Письмо успешно отправлено!')
        setFormData({
          senderEmail: '',
          subject: '',
          message: ''
        })
      } else {
        throw new Error(result.error || 'Ошибка при отправке письма')
      }
    } catch (error) {
      console.error('Ошибка отправки:', error)
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Произошла ошибка при отправке письма')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold neon-text mb-4">
            ANONIMKA.ONLINE
          </h1>
          <p className="text-lg md:text-xl opacity-80">
            Анонимная доска знакомств
          </p>
        </div>

        {/* Форма обратной связи */}
        <div className="neon-card">
          <h2 className="text-2xl font-bold mb-6 neon-text">
            💌 Связь с администрацией
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="senderEmail" className="block text-sm font-medium mb-2">
                Ваш Email *
              </label>
              <input
                type="email"
                id="senderEmail"
                name="senderEmail"
                value={formData.senderEmail}
                onChange={handleInputChange}
                placeholder="your-email@example.com"
                className="neon-input"
                required
              />
            </div>

            {/* Тема */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Тема сообщения
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Тема вашего сообщения"
                className="neon-input"
              />
            </div>

            {/* Сообщение */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Сообщение *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Опишите ваш вопрос или предложение..."
                rows={6}
                className="neon-input resize-vertical"
                required
              />
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={isLoading}
              className="neon-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="loading mr-2"></span>
                  Отправляем...
                </>
              ) : (
                '📤 Отправить сообщение'
              )}
            </button>
          </form>

          {/* Статус отправки */}
          {status !== 'idle' && (
            <div className={`mt-6 p-4 rounded-lg border ${
              status === 'success' 
                ? 'border-green-500 bg-green-500/10 text-success' 
                : 'border-red-500 bg-red-500/10 text-error'
            }`}>
              <p className="font-medium">
                {status === 'success' ? '✅ Успешно!' : '❌ Ошибка'}
              </p>
              <p className="text-sm mt-1">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Информация о проекте */}
        <div className="neon-card mt-8">
          <h3 className="text-xl font-bold mb-4 neon-text">
            📋 О проекте Anonimka.Online
          </h3>
          <div className="space-y-3 text-sm opacity-80">
            <p>• Анонимные объявления знакомств по городам</p>
            <p>• Безопасная платформа для поиска общения</p>
            <p>• Telegram Mini App интеграция</p>
            <p>• Модерация и защита от спама</p>
          </div>
        </div>

        {/* Email API тестирование */}
        <EmailTest className="mt-8" />

        {/* Дополнительные инструменты */}
        <div className="text-center mt-8">
          <a 
            href="/test" 
            className="neon-button"
            style={{ borderColor: '#39ff14', color: '#39ff14' }}
          >
            🧪 Расширенное тестирование API
          </a>
        </div>

        {/* Технические детали */}
        <div className="text-center mt-8 text-xs opacity-60">
          <p>Powered by Next.js + Vercel + Nodemailer</p>
          <p>Email система аналогичная whish.online</p>
        </div>
      </div>
    </main>
  )
}