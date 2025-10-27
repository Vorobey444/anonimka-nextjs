'use client'

import { useState } from 'react'

interface EmailTestProps {
  className?: string
}

export default function EmailTest({ className = '' }: EmailTestProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testEmailAPI = async () => {
    setIsLoading(true)
    setTestResult('')

    const testData = {
      senderEmail: 'test@example.com',
      subject: 'Тест API anonimka.online',
      message: `Тестовое сообщение отправленное в ${new Date().toLocaleString('ru-RU')}\n\nЭто автоматический тест email API системы Anonimka.Online через Vercel + Nodemailer.\n\nСистема использует те же SMTP настройки что и whish.online.`
    }

    try {
      console.log('🧪 Тестируем API /api/send-email...')
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const result = await response.json()
      
      if (result.success) {
        setTestResult(`✅ Тест успешен!\n\nMessageId: ${result.messageId}\nОтвет: ${result.message}`)
        console.log('✅ Email API работает:', result)
      } else {
        setTestResult(`❌ Ошибка теста:\n\n${result.error}\n\nДетали: ${JSON.stringify(result.details, null, 2)}`)
        console.error('❌ Ошибка API:', result)
      }
    } catch (error) {
      setTestResult(`❌ Сетевая ошибка:\n\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      console.error('❌ Ошибка запроса:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`neon-card ${className}`}>
      <h3 className="text-xl font-bold mb-4 neon-text">
        🧪 Тест Email API
      </h3>
      
      <p className="text-sm opacity-80 mb-6">
        Протестируйте работу email API системы. Письмо будет отправлено на vorobey469@yandex.ru через Yandex SMTP.
      </p>

      <button
        onClick={testEmailAPI}
        disabled={isLoading}
        className="neon-button mb-6 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="loading mr-2"></span>
            Тестируем API...
          </>
        ) : (
          '🚀 Запустить тест'
        )}
      </button>

      {testResult && (
        <div className={`p-4 rounded-lg border font-mono text-sm ${
          testResult.includes('✅') 
            ? 'border-green-500 bg-green-500/10 text-success' 
            : 'border-red-500 bg-red-500/10 text-error'
        }`}>
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      <div className="mt-6 text-xs opacity-60">
        <p><strong>Техническая информация:</strong></p>
        <ul className="mt-2 space-y-1">
          <li>• API: /api/send-email (Vercel Serverless Function)</li>
          <li>• SMTP: smtp.yandex.ru:587</li>
          <li>• Отправитель: wish.online@yandex.kz</li>
          <li>• Получатель: vorobey469@yandex.ru</li>
          <li>• Библиотека: nodemailer</li>
        </ul>
      </div>
    </div>
  )
}