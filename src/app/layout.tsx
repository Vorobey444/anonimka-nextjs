export const metadata = {
  title: 'Anonimka - Анонимное общение',
  description: 'Анонимные знакомства без регистрации',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f', color: '#ffffff', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
