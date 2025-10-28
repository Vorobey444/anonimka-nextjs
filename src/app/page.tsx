'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Автоматический редирект на legacy SPA в /webapp/
    router.replace('/webapp/')
  }, [router])

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