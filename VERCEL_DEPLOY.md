# 🚀 Деплой Anonimka.Online на Vercel

Пошаговая инструкция по развертыванию Next.js приложения с email системой на Vercel.

## 📋 Предварительные требования

- Аккаунт GitHub
- Аккаунт Vercel (бесплатный)
- Проект загружен в GitHub репозиторий

## 🎯 Шаги деплоя

### 1. Подготовка репозитория

```bash
# Инициализируем git репозиторий (если еще не сделано)
git init

# Добавляем файлы 
git add .

# Создаем коммит
git commit -m "Initial commit: Anonimka.Online Next.js app with Vercel email system"

# Подключаем к GitHub
git remote add origin https://github.com/YOUR_USERNAME/anonimka-nextjs.git
git branch -M main
git push -u origin main
```

### 2. Импорт в Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub аккаунт
3. Нажмите **"New Project"**
4. Выберите ваш GitHub репозиторий `anonimka-nextjs`
5. Нажмите **"Import"**

### 3. Настройка Environment Variables

В Vercel Dashboard перейдите в **Settings → Environment Variables** и добавьте:

| Переменная | Значение | Описание |
|------------|----------|-----------|
| `SMTP_HOST` | `smtp.yandex.ru` | SMTP сервер Yandex |
| `SMTP_PORT` | `587` | Порт для TLS |
| `SMTP_USER` | `wish.online@yandex.kz` | Email отправителя |
| `SMTP_PASS` | `aitmytqacblwvpjc` | Пароль приложения |
| `SUPPORT_TO` | `vorobey469@yandex.ru` | Email получателя |

⚠️ **Важно:** Добавьте переменные для всех окружений (Production, Preview, Development)

### 4. Deploy

1. После настройки переменных нажмите **"Deploy"**
2. Vercel автоматически соберет и развернет приложение
3. Получите URL вашего приложения (например: `anonimka-nextjs.vercel.app`)

## 🧪 Тестирование после деплоя

1. Откройте ваше приложение по Vercel URL
2. Используйте кнопку **"Запустить тест"** для проверки email API
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь что письма приходят на `vorobey469@yandex.ru`

## 🔧 Автоматические обновления

После первого деплоя, каждый push в `main` ветку будет автоматически:
1. Запускать сборку проекта
2. Деплоить новую версию
3. Обновлять production URL

## 📱 Custom Domain (опционально)

Для использования домена `anonimka.online`:

1. В Vercel Dashboard перейдите в **Settings → Domains**
2. Добавьте домен `anonimka.online`
3. Настройте DNS записи у вашего провайдера:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## 🔍 Мониторинг и логи

- **Function Logs**: Vercel → Functions → View Logs
- **Analytics**: Vercel → Analytics (для проверки трафика)
- **Speed Insights**: автоматически включены

## 📈 Performance оптимизация

Vercel автоматически предоставляет:
- ✅ CDN глобальное кеширование
- ✅ Automatic HTTPS
- ✅ Serverless Functions
- ✅ Edge Runtime поддержка
- ✅ Image Optimization

## 🚨 Troubleshooting

### Email не отправляется
1. Проверьте Environment Variables в Vercel
2. Проверьте логи Functions в Vercel Dashboard
3. Убедитесь что SMTP credentials корректны

### Build ошибки
1. Проверьте что все зависимости в `package.json`
2. Убедитесь в корректности TypeScript кода
3. Проверьте логи сборки в Vercel

### Runtime ошибки
1. Проверьте Server Function логи
2. Убедитесь что все environment переменные настроены
3. Проверьте CORS настройки в `next.config.js`

## ✨ Результат

После успешного деплоя у вас будет:
- 🌐 Production приложение на Vercel
- 📧 Работающая email система (как в whish.online)
- 🚀 Автоматические обновления при git push
- 📱 Поддержка Telegram Mini App
- 🔒 HTTPS и безопасность из коробки

**URL приложения:** `https://your-project.vercel.app`