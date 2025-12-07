import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorLoggerProvider } from '@/components/ErrorLoggerProvider'

const inter = Inter({ subsets: ['latin'] })

// Removed 'force-dynamic' - causes issues with client components and digest errors
// Let Next.js handle static/dynamic rendering automatically
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Anonimka - Анонимный чат',
  description: 'Анонимное общение без границ - чат с незнакомцами в вашем городе',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className={inter.className}>
        <ErrorLoggerProvider>
          {children}
        </ErrorLoggerProvider>
      </body>
    </html>
  )
}