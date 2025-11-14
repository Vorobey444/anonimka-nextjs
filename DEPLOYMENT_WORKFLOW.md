# 🚀 Workflow для тестирования и деплоя

## Структура веток:

```
main (production)          → anonimka.kz (основной сайт)
   ↑
   | (после тестов)
   |
development (staging)      → auto-preview.vercel.app
   ↑
   | (разработка)
   |
feature/* (фичи)           → preview-branch.vercel.app
```

## 📋 Процесс работы:

### 1. Разработка новой фичи:

```bash
# Создать ветку от development
git checkout development
git pull
git checkout -b feature/new-feature

# Делать изменения
# Коммитить
git add .
git commit -m "Добавлена новая фича"
git push origin feature/new-feature
```

### 2. Тестирование:

```bash
# Vercel автоматически создаст preview для feature/new-feature
# Ссылка будет вида: anonimka-nextjs-git-feature-new-feature.vercel.app

# Протестировать на preview URL
# Если все ОК → мержим в development
```

### 3. Staging тест:

```bash
# Мержим в development
git checkout development
git merge feature/new-feature
git push origin development

# Development деплоится на отдельный URL
# Полное тестирование на staging
```

### 4. Production:

```bash
# Если все работает → мержим в main
git checkout main
git merge development
git push origin main

# Автоматически деплоится на anonimka.kz
```

## ⚙️ Настройка Vercel:

### В Vercel Dashboard:

1. **Settings → Git**
   - Production Branch: `main`
   - Preview Branches: `development`, `feature/*`

2. **Settings → Environment Variables**
   - Скопировать переменные для Preview окружений

3. **Settings → Domains**
   - Production: `anonimka.kz`
   - Development: `dev.anonimka.kz` (опционально)

## 🔐 Переменные окружения:

### Production (main):
- DATABASE_URL → production база
- TELEGRAM_BOT_TOKEN → production бот

### Staging (development):
- DATABASE_URL → staging база (можно ту же или отдельную)
- TELEGRAM_BOT_TOKEN → test бот (создать отдельный через @BotFather)

## 🧪 Как создать тестовый бот:

1. @BotFather → `/newbot`
2. Имя: `Anonimka Test`
3. Username: `anonimka_test_bot`
4. Получить токен
5. Добавить в Vercel Environment Variables для Preview

## 📱 Тестирование Web App:

### Production:
```
https://t.me/anonimka_kz_bot/Anonimka
```

### Staging (test bot):
```
https://t.me/anonimka_test_bot/Anonimka
```

## 🚨 Важно:

- **НИКОГДА не пушить в main напрямую!**
- Всегда через `development` → тест → `main`
- Preview URLs создаются автоматически для каждого PR
- Можно откатиться на любой предыдущий деплой в Vercel

## 📊 Vercel Dashboard:

- **Deployments** - все деплои с preview URLs
- **Analytics** - статистика посещений
- **Logs** - логи ошибок

## 🔄 Быстрые команды:

### Переключение на ветки:
```bash
# На production
git checkout main

# На staging
git checkout development

# Создать новую фичу
git checkout development
git checkout -b feature/название
```

### Синхронизация:
```bash
# Обновить development из main
git checkout development
git merge main
git push origin development
```

### Откат изменений:
```bash
# В Vercel Dashboard → Deployments → выбрать старый деплой → Promote to Production
```
