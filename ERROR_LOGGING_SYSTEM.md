# 🔍 Система логирования ошибок

## Что логируется автоматически

### 1. **Все JavaScript ошибки**
- Необработанные исключения (`window.addEventListener('error')`)
- Unhandled Promise rejections
- Runtime ошибки в коде

### 2. **Контекст ошибки**
- ❌ Текст ошибки
- 📋 Stack trace (первые 800 символов)
- 📍 URL страницы
- 👤 User ID и username (если авторизован)
- ⏰ Timestamp
- 🌐 User Agent (браузер, устройство)

### 3. **Состояние приложения**
- 🔐 Авторизован ли пользователь
- 👤 Установлен ли никнейм
- 📱 Размер экрана
- 🌐 Статус интернет-соединения

### 4. **История действий**
- Последние 5-10 действий пользователя перед ошибкой
- Timestamp каждого действия
- Дополнительные детали

## Приоритеты ошибок

### 🚨 **Критичные** (отправляются с меткой [КРИТИЧНО])
- `is not defined` - необъявленные переменные
- `is not a function` - попытка вызова не-функции
- `Cannot read` - обращение к undefined/null
- Unhandled Promise rejection

### 🔴 **Обычные**
- Все остальные ошибки

## Фильтрация спама

Не отправляются ошибки:
- `ResizeObserver loop` - технические браузерные предупреждения
- `Script error` - CORS ошибки от сторонних скриптов
- `Extension context invalidated` - ошибки браузерных расширений
- `Non-Error promise rejection` - технические rejection'ы

## Дедупликация

- Одинаковые ошибки не отправляются чаще чем **раз в 30 секунд**
- Кеш автоматически очищается от старых записей

## API endpoint

`POST /api/log-error`

```typescript
interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  username?: string;
  type?: string;
  critical?: boolean;
  appState?: {
    isAuthorized: boolean;
    hasNickname: boolean;
    currentPage: string;
    screenSize: string;
    online: boolean;
  };
  recentActions?: Array<{
    action: string;
    details: any;
    timestamp: string;
  }>;
}
```

## Telegram уведомления

Формат сообщения:
```
🚨 [КРИТИЧНО] Ошибка на сайте!

📍 URL: https://anonimka.kz/webapp
⏰ Время: 2025-11-28T18:37:22.469Z
👤 User ID: 1234567890 (@username)

❌ Ошибка:
Can't find variable: customConfirmCancel

🌐 Browser:
Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2...)

📋 Stack:
@https://anonimka.kz/webapp/app.js:10942:28

📊 Состояние:
🔐 Авторизован: ✅
👤 Никнейм: ✅
📱 Экран: 390x844
🌐 Онлайн: ✅

👣 Последние действия:
1. [18:36:45] saveNickname {step: 'started'}
2. [18:37:10] openProfile {userId: 123}
3. [18:37:15] likeProfile {profileId: 456}
```

## Переменные окружения

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_telegram_id
```

## Утилиты для разработки

### `window.logUserAction(action, details)`
Логирует действие пользователя в историю
```javascript
window.logUserAction('createAd', { category: 'знакомства' });
```

### `window.logError(message, error)`
Ручное логирование ошибки
```javascript
window.logError('Custom error', new Error('Something went wrong'));
```

### `window.safeAsync(actionName, asyncFn)`
Безопасное выполнение async функции с автологированием
```javascript
await window.safeAsync('loadUserData', async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

### `window.getActionHistory()`
Показывает историю действий в консоли

### `window.getErrorCacheInfo()`
Показывает кеш ошибок

### `window.clearErrorCache()`
Очищает кеш ошибок

## Пример использования в коде

```javascript
// Автоматическое логирование при ошибках
async function someFunction() {
  window.logUserAction('someFunction', { param: 'value' });
  
  try {
    // ваш код
    const result = await fetch('/api/endpoint');
    window.logUserAction('someFunction', { success: true });
    return result;
  } catch (error) {
    // Ошибка автоматически залогируется через window.onerror
    console.error('Error:', error);
    throw error;
  }
}

// ИЛИ использовать safeAsync
async function someFunction() {
  return await window.safeAsync('someFunction', async () => {
    const result = await fetch('/api/endpoint');
    return result;
  });
}
```

## Статистика

- ✅ Автоматический перехват всех ошибок
- ✅ Дедупликация (30 сек TTL)
- ✅ Фильтрация спама
- ✅ История действий пользователя (10 последних)
- ✅ Состояние приложения при ошибке
- ✅ Приоритизация (критичные / обычные)
- ✅ Telegram уведомления в реальном времени
- ✅ No-cache для webapp файлов

## Проверка работоспособности

1. Откройте консоль браузера
2. Введите: `throw new Error('Test error')`
3. Проверьте Telegram - должно прийти уведомление
4. Введите: `window.getActionHistory()` - увидите историю действий
