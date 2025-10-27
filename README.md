# Anonimka.Online - Next.js Version

Современная версия анонимной доски знакомств на Next.js с интеграцией Vercel и профессиональной email системой.

## 🚀 Особенности

- **Next.js 14** с App Router
- **TypeScript** для типобезопасности  
- **Tailwind CSS** для стилизации
- **Vercel API Routes** для серверных функций
- **Nodemailer** для отправки email (как в whish.online)
- **Telegram Mini App** интеграция
- **Cyberpunk дизайн** с neon эффектами

## 📧 Email система

Использует ту же архитектуру что и whish.online:
- SMTP через Yandex (wish.online@yandex.kz)
- Serverless функции Vercel
- Надежная доставка писем

## 🛠️ Установка и запуск

1. **Установить зависимости:**
```bash
npm install
```

2. **Настроить переменные окружения:**
Создайте файл `.env.local` с настройками:
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=wish.online@yandex.kz  
SMTP_PASS=YOUR_YANDEX_APP_PASSWORD
SUPPORT_TO=vorobey469@yandex.ru
```

3. **Запустить в режиме разработки:**
```bash
npm run dev
```

4. **Собрать для продакшена:**
```bash
npm run build
npm start
```

## 📦 Деплой на Vercel

1. Подключите GitHub репозиторий к Vercel
2. Настройте переменные окружения в Vercel Dashboard
3. Vercel автоматически задеплоит при push в main

## 🔧 Структура проекта

```
src/
├── app/
│   ├── api/
│   │   └── send-email/
│   │       └── route.ts        # API маршрут для отправки email
│   ├── globals.css             # Глобальные стили 
│   ├── layout.tsx              # Layout с Telegram Web App
│   └── page.tsx                # Главная страница с формой
```

## 🎨 Стили

- Cyberpunk тематика с neon эффектами
- Адаптивный дизайн для мобильных устройств
- Темная тема для комфортного использования
- Анимации и hover эффекты

## 📱 Telegram Integration

- Поддержка Telegram Mini App API
- Автоматическая настройка темы
- Адаптация под Telegram интерфейс
- Доступ к данным пользователя Telegram

## 🔒 Безопасность

- Валидация на клиенте и сервере
- Защита от спама
- CORS настройки
- Безопасное хранение credentials в environment переменных

## 🧪 Тестирование

Для тестирования email функционала:
1. Запустите проект локально
2. Заполните форму на главной странице
3. Проверьте консоль разработчика для логов
4. Письма будут отправляться на vorobey469@yandex.ru

## 📈 Production готовность

- ✅ TypeScript для надежности
- ✅ Error handling и логирование  
- ✅ Responsive дизайн
- ✅ SEO оптимизация
- ✅ Performance оптимизация Next.js
- ✅ Serverless архитектура Vercel