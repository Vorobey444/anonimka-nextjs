import './globals.css'

export const metadata = {
  title: 'Anonimka',
  description: 'Анонимные знакомства без регистрации',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
