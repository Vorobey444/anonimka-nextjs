# 🔴 Система мониторинга ошибок

## Описание

Автоматическая система отслеживания ошибок (клиентских и серверных) с отправкой уведомлений в Telegram.

- **Client-side** - JavaScript ошибки в браузерах пользователей
- **Server-side** - ошибки API routes, необработанные exceptions в Next.js

## Как работает

1. **Frontend (errorLogger.ts)** - перехватывает все ошибки в браузере:
   - JavaScript runtime errors
   - Unhandled Promise rejections
   - React component errors
   - Console.error() вызовы

2. **API (/api/log-error)** - принимает ошибки и отправляет в Telegram

3. **Telegram уведомления** - админ получает сообщение с деталями:
   - URL страницы где произошла ошибка
   - Текст ошибки и stack trace
   - User ID пользователя
   - Browser/Device информация
   - Точное время

## Что отслеживается

✅ **Отслеживается:**
- Необработанные JavaScript ошибки
- Promise rejections
- React component crashes
- Fetch/API ошибки (если добавить вручную)
- Критичные console.error вызовы

❌ **Игнорируется (спам):**
- ResizeObserver loop errors
- Browser extension errors
- Script error (CORS блокировка)
- Non-Error promise rejection (ложные срабатывания)

## Установка

Уже установлено! Файлы созданы:

```
src/
├── app/
│   ├── api/
│   │   └── log-error/
│   │       └── route.ts          # API endpoint
│   └── layout.tsx                 # Подключен ErrorLoggerProvider
├── components/
│   └── ErrorLoggerProvider.tsx   # React компонент инициализации
└── lib/
    └── errorLogger.ts             # Основная логика перехвата
```

## Использование

### Автоматическое отслеживание

Просто работает! Все ошибки отправляются автоматически.

### Ручная отправка ошибки

```typescript
import { errorLogger } from '@/lib/errorLogger';

// Отправить кастомную ошибку
errorLogger.logManual('Не удалось загрузить данные пользователя', {
  userId: '12345',
  endpoint: '/api/users/12345'
});

// В try-catch
try {
  await fetchData();
} catch (error) {
  errorLogger.logManual(`Ошибка загрузки: ${error.message}`);
  throw error;
}
```

### Установка User ID

```typescript
import { errorLogger } from '@/lib/errorLogger';

// После авторизации
errorLogger.setUserId(user.id);
```

## Пример уведомления в Telegram

```
🔴 Ошибка на сайте!

📍 URL: https://anonimka.kz/webapp/messages
⏰ Время: 2025-11-15T14:30:45.123Z
👤 User ID: 884253640

❌ Ошибка:
TypeError: Cannot read property 'map' of undefined

🌐 Browser:
Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0

📋 Stack:
at MessageList (webpack-internal:///./src/components/MessageList.tsx:45:23)
at renderWithHooks (webpack-internal:///./node_modules/react-dom/...)
```

## Настройка

### Изменить фильтры ошибок

**В `errorLogger.ts`:**
```typescript
const ignorePatterns = [
  'ResizeObserver loop',
  'Script error',
  'Extension context invalidated',
  'Ваш паттерн',  // Добавьте сюда
];
```

**В `route.ts` (серверная фильтрация):**
```typescript
const ignorePatterns = [
  'ResizeObserver loop',
  'Ваш паттерн',
];
```

### Изменить Admin ID

В `.env`:
```bash
ADMIN_TELEGRAM_ID=ваш_telegram_id
```

Или хардкод в `route.ts`:
```typescript
const ADMIN_TELEGRAM_ID = 'ваш_id';
```

## Деплой

1. Коммит и пуш:
```bash
git add .
git commit -m "Add client error monitoring"
git push
```

2. Vercel автоматически задеплоит

3. Проверьте что `TELEGRAM_BOT_TOKEN` есть в Vercel Environment Variables

## Тестирование

### Тест 1: Искусственная ошибка

Добавьте на любую страницу:
```typescript
useEffect(() => {
  // @ts-ignore
  window.testError();  // Вызовет ошибку
}, []);
```

### Тест 2: Ручная отправка

```typescript
import { errorLogger } from '@/lib/errorLogger';

errorLogger.logManual('Тестовая ошибка для проверки');
```

### Тест 3: Promise rejection

```typescript
Promise.reject('Тестовый reject');
```

## Мониторинг производительности

- **Не влияет на производительность** - ошибки отправляются асинхронно
- **Очередь** - если много ошибок, отправляются по одной с задержкой 1с
- **Не блокирует UI** - fetch без await
- **Ограничение** - максимум 1 ошибка в секунду (антиспам)

## FAQ

**Q: Получу ли я спам если у пользователя много ошибок?**
A: Нет, есть очередь и фильтры. Повторяющиеся ошибки отправляются с задержкой.

**Q: Работает ли в production?**
A: Да, работает везде где есть JavaScript.

**Q: Увидит ли пользователь что ошибка отправлена?**
A: Нет, всё происходит незаметно в фоне.

**Q: Что если пользователь оффлайн?**
A: Ошибка не отправится, но это не критично.

**Q: Можно отключить для разработки?**
A: Да, добавьте проверку:
```typescript
if (process.env.NODE_ENV === 'production') {
  errorLogger.logError(...);
}
```

## Серверные ошибки (Server-side)

### Как работает

**`serverErrorLogger.ts`** - логирует серверные ошибки:
- API route exceptions
- Database errors
- Unhandled Promise rejections
- Uncaught exceptions

### Использование в API routes

**Автоматическая обертка:**
```typescript
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handler(request: Request) {
  // Ваш код API route
  const data = await fetchData();
  return Response.json(data);
}

// Оборачиваем в withErrorLogging - автоматически ловит ошибки
export const POST = withErrorLogging(handler, '/api/your-endpoint');
```

**Ручное логирование:**
```typescript
import { ServerErrorLogger } from '@/lib/serverErrorLogger';

export async function POST(request: Request) {
  try {
    // Ваш код
  } catch (error) {
    await ServerErrorLogger.logError(error as Error, {
      endpoint: '/api/reports',
      method: 'POST',
      statusCode: 500,
      userId: reporterId,
    });
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**С помощью wrap() helper:**
```typescript
import { ServerErrorLogger } from '@/lib/serverErrorLogger';

const result = await ServerErrorLogger.wrap(
  async () => {
    // Код который может упасть
    return await dangerousOperation();
  },
  {
    endpoint: '/api/dangerous',
    method: 'POST',
    userId: '12345',
  }
);
```

### Middleware

**`middleware.ts`** - ловит глобальные необработанные ошибки:
- `unhandledRejection` - Promise без catch
- `uncaughtException` - синхронные ошибки без try-catch

### Rate Limiting

Защита от спама:
- Максимум **10 ошибок в минуту** отправляются в Telegram
- Остальные только логируются в Vercel Logs

### Environment

Telegram alerts только в **production**:
```typescript
if (process.env.VERCEL_ENV === 'production') {
  // Отправляем в Telegram
}
```

В development - только console.error

## Пример серверного уведомления

```
🔴 Серверная ошибка!

📍 Endpoint: POST /api/reports
📊 Status: 500
⏰ Время: 2025-11-15T14:30:45.123Z
👤 User ID: 884253640
🌍 Environment: production

❌ Ошибка:
Error: Failed to connect to database

📋 Stack:
at sql.query (/var/task/node_modules/@vercel/postgres/dist/index.js:45:12)
at POST (/var/task/.next/server/app/api/reports/route.js:23:18)
```

## Vercel Logs Integration

### Прямая интеграция (альтернатива)

Можно настроить **Vercel Log Drains** для отправки всех логов:

1. Vercel Dashboard → Settings → Log Drains
2. Add Log Drain → Webhook URL
3. Создайте endpoint `/api/vercel-logs` который парсит и отправляет ошибки

**Пример `/api/vercel-logs/route.ts`:**
```typescript
export async function POST(request: Request) {
  const logs = await request.json();
  
  // Фильтруем только ERROR и WARNING
  const errors = logs.filter((log: any) => 
    log.level === 'error' || log.level === 'warning'
  );
  
  // Отправляем в Telegram
  for (const error of errors) {
    await sendTelegramAlert(error);
  }
  
  return Response.json({ success: true });
}
```

Но текущий способ проще и не требует дополнительных endpoint'ов.

## Итог

✅ Автоматический мониторинг **клиентских** ошибок  
✅ Автоматический мониторинг **серверных** ошибок  
✅ Мгновенные уведомления в Telegram  
✅ Детальная информация для отладки  
✅ Фильтрация спама и ложных срабатываний  
✅ Rate limiting (не более 10 ошибок/мин)  
✅ Не влияет на UX пользователей  
✅ Работает в production, не спамит в development  

Теперь вы узнаете о проблемах на сайте **раньше** чем пользователи успеют пожаловаться! 🎯

### Проверить работу

**1. Vercel Logs:**
https://vercel.com/dashboard → ваш проект → Logs

**2. Telegram бот:**
Получайте уведомления в личных сообщениях

**3. Тестирование:**
- Client: `throw new Error('Test')` в консоли браузера
- Server: Вызовите API с невалидными данными
