export const metadata = {
  title: 'Anonimka - Анонимное общение',
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
