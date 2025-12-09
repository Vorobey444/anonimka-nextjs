'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ErrorLogger() {
  const pathname = usePathname()

  useEffect(() => {
    // Логирование загрузки страницы
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📄 Page loaded: ${pathname}`)
    console.log(`⏰ Time: ${new Date().toLocaleString('ru-RU')}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Глобальный обработчик ошибок JavaScript
    const handleError = (event: ErrorEvent) => {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ JavaScript Error on page:', pathname)
      console.error('📝 Message:', event.message)
      console.error('📍 File:', event.filename)
      console.error('🔢 Line:', event.lineno, 'Col:', event.colno)
      console.error('📚 Stack:', event.error?.stack)
      console.error('⏰ Time:', new Date().toLocaleString('ru-RU'))
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    // Глобальный обработчик необработанных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Unhandled Promise Rejection on page:', pathname)
      console.error('📝 Reason:', event.reason)
      console.error('📚 Stack:', event.reason?.stack)
      console.error('⏰ Time:', new Date().toLocaleString('ru-RU'))
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    // Логирование 404 ошибок (неудачные загрузки ресурсов)
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ Resource Load Error on page:', pathname)
        console.error('📦 Type:', target.tagName)
        console.error('🔗 URL:', (target as any).src || (target as any).href)
        console.error('⏰ Time:', new Date().toLocaleString('ru-RU'))
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
    }

    // Добавляем слушатели
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleResourceError, true) // capture phase для ресурсов

    // Логирование навигации
    console.log('✅ ErrorLogger initialized for:', pathname)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleResourceError, true)
    }
  }, [pathname])

  return null // Этот компонент ничего не рендерит
}
