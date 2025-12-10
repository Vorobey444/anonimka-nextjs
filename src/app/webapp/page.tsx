'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function WebAppRedirectContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Собираем все параметры URL
    const params = searchParams?.toString() || ''
    const queryString = params ? `?${params}` : ''
    
    // Редиректим на статический webapp с сохранением параметров
    window.location.href = `/webapp/index.html${queryString}`
  }, [searchParams])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0a0f',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Загрузка приложения...</p>
      </div>
    </div>
  )
}

export default function WebAppRedirect() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff'
      }}>
        <p>⏳ Загрузка...</p>
      </div>
    }>
      <WebAppRedirectContent />
    </Suspense>
  )
}
