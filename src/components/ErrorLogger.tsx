'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initErrorHandlers, logUserAction } from '@/utils/errorLogger'

/**
 * Компонент для инициализации системы логирования ошибок
 * Портировано из WORK/public/webapp/app.js
 */
export default function ErrorLogger() {
  const pathname = usePathname()

  useEffect(() => {
    // Инициализируем глобальные обработчики ошибок (только один раз)
    initErrorHandlers()

    // Логирование загрузки страницы
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📄 Page loaded: ${pathname}`)
    console.log(`⏰ Time: ${new Date().toLocaleString('ru-RU')}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Логируем действие пользователя
    logUserAction('page_load', { pathname })

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
        
        // Логируем в систему
        logUserAction('resource_load_error', {
          type: target.tagName,
          url: (target as any).src || (target as any).href,
          pathname
        })
      }
    }

    window.addEventListener('error', handleResourceError, true) // capture phase для ресурсов

    // Логирование навигации
    console.log('✅ ErrorLogger initialized for:', pathname)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleResourceError, true)
    }
  }, [pathname])

  return null // Этот компонент ничего не рендерит
}
