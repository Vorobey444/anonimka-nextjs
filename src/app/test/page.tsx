'use client'

import { useState } from 'react'

export default function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testEmailAPI = async () => {
    setIsLoading(true)
    setTestResults([])
    
    addLog('🧪 Начинаем тестирование Email API...')
    
    const testData = {
      senderEmail: 'test@example.com',
      subject: 'Тест API Anonimka.Online',
      message: `Тестовое сообщение отправленное в ${new Date().toLocaleString('ru-RU')}

Это автоматический тест email API системы Anonimka.Online.

Система использует:
- Next.js API Routes  
- Nodemailer с Yandex SMTP
- Те же настройки что и whish.online
- Vercel Serverless Functions

Отправитель: wish.online@yandex.kz
Получатель: vorobey469@yandex.ru`
    }

    try {
      addLog('📤 Отправляем POST запрос на /api/send-email...')
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      addLog(`📊 HTTP Status: ${response.status} ${response.statusText}`)

      const result = await response.json()
      
      if (result.success) {
        addLog('✅ УСПЕХ! Email успешно отправлен!')
        addLog(`📧 MessageId: ${result.messageId}`)
        addLog(`💌 Ответ сервера: ${result.message}`)
        addLog('📬 Проверьте почту vorobey469@yandex.ru')
      } else {
        addLog(`❌ ОШИБКА: ${result.error}`)
        if (result.details) {
          addLog(`🔍 Детали: ${JSON.stringify(result.details, null, 2)}`)
        }
      }
      
    } catch (error) {
      addLog(`❌ СЕТЕВАЯ ОШИБКА: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      addLog('🏁 Тестирование завершено')
    }
  }

  const clearLogs = () => {
    setTestResults([])
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold neon-text mb-4">
            🧪 EMAIL API TESTER
          </h1>
          <p className="text-lg opacity-80">
            Тестирование email системы Anonimka.Online
          </p>
        </div>

        {/* Информация о системе */}
        <div className="neon-card mb-8">
          <h2 className="text-xl font-bold mb-4 neon-text">📋 Системная информация</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>API Endpoint:</strong> /api/send-email</p>
              <p><strong>Method:</strong> POST</p>
              <p><strong>Framework:</strong> Next.js 14</p>
              <p><strong>Runtime:</strong> Node.js Serverless</p>
            </div>
            <div>
              <p><strong>SMTP Server:</strong> smtp.yandex.ru:587</p>
              <p><strong>Отправитель:</strong> wish.online@yandex.kz</p>
              <p><strong>Получатель:</strong> vorobey469@yandex.ru</p>
              <p><strong>Library:</strong> nodemailer</p>
            </div>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={testEmailAPI}
            disabled={isLoading}
            className="neon-button disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="loading mr-2"></span>
                Тестируем...
              </>
            ) : (
              '🚀 Запустить тест'
            )}
          </button>
          
          <button
            onClick={clearLogs}
            className="neon-button"
            style={{ borderColor: '#ff006e', color: '#ff006e' }}
          >
            🗑️ Очистить логи
          </button>
        </div>

        {/* Логи */}
        <div className="neon-card">
          <h3 className="text-lg font-bold mb-4 neon-text">📊 Логи тестирования</h3>
          
          <div className="bg-black/50 p-4 rounded-lg border border-gray-600 font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="opacity-60">Нажмите "Запустить тест" для начала тестирования...</p>
            ) : (
              testResults.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Навигация */}
        <div className="text-center mt-8">
          <a href="/" className="neon-button">
            ← Вернуться на главную
          </a>
        </div>
      </div>
    </main>
  )
}