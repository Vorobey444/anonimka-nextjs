# 🔐 Система авторизации с синхронизацией между устройствами

## Как это работает

Пользователь может авторизоваться **одним из двух способов**:

### 📱 Вариант 1: QR-код (с компьютера, авторизация через телефон)

**Для чего:** Пользователь хочет работать на сайте с компьютера, но авторизоваться через Telegram на телефоне.

**Как работает:**
1. Пользователь открывает https://anonimka.kz/webapp/ на компьютере
2. Видит модальное окно с QR-кодом
3. Сканирует QR-код **камерой мобильного Telegram**
4. Telegram открывает бота @anonimka_kz_bot
5. Бот автоматически отправляет данные пользователя на сервер
6. **Модальное окно на компьютере автоматически закрывается**
7. Пользователь авторизован и может работать на сайте **с компьютера**

**Технический поток:**
```
Компьютер (браузер)          Телефон (Telegram)           Сервер (API)
       │                              │                         │
       ├─ Генерирует auth_token       │                         │
       ├─ Показывает QR с токеном     │                         │
       │                              │                         │
       │        ◄─── Сканирует QR     │                         │
       │                              ├─ Открывает бота         │
       │                              ├─ /start auth_12345      │
       │                              │                         │
       │                              ├─ POST /api/auth ───────►│
       │                              │   {token, user_data}   │
       │                              │                         │
       ├─ GET /api/auth?token=12345 ──────────────────────────►│
       │◄──────────────────────────── {authorized: true, user} │
       │                              │                         │
       ├─ Закрывает модальное окно    │                         │
       ├─ Сохраняет в localStorage    │                         │
       ├─ Перезагружает страницу     │                         │
       │                              │                         │
       ▼ Авторизован!                 │                         │
```

### 🖥️ Вариант 2: Telegram Login Widget (с компьютера)

**Для чего:** Пользователь работает на компьютере и хочет авторизоваться прямо в браузере (без телефона).

**Как работает:**
1. Пользователь видит кнопку "Log in with Telegram"
2. Нажимает на неё
3. Открывается popup с Telegram авторизацией
4. После авторизации данные передаются через postMessage
5. Модальное окно закрывается автоматически

## Компоненты системы

### 1. Frontend (app.js)

**Функции:**
- `checkTelegramAuth()` - проверяет авторизацию при загрузке
- `showTelegramAuthModal()` - показывает модальное окно и запускает polling
- `generateTelegramQR(token)` - генерирует QR-код с deep link
- `initTelegramLoginWidget()` - инициализирует Telegram Login Widget

**Polling механизм:**
```javascript
setInterval(async () => {
    // Проверка на сервере каждые 2 секунды
    const response = await fetch(`/api/auth?token=${authToken}`);
    const data = await response.json();
    
    if (data.authorized) {
        // Сохранить данные, закрыть модал, перезагрузить
    }
}, 2000);
```

### 2. Backend API (route.ts)

**Endpoint:** `/api/auth`

**POST** - Сохранить данные авторизации
```typescript
POST /api/auth
{
    "token": "auth_1762016108299_4hitqp9wj",
    "user": {
        "id": 884253640,
        "first_name": "Алексей",
        "username": "Vorobey_444"
    }
}
```

**GET** - Проверить авторизацию
```typescript
GET /api/auth?token=auth_1762016108299_4hitqp9wj

Response:
{
    "authorized": true,
    "user": {...}
}
// ИЛИ
{
    "authorized": false
}
```

**Хранилище:**
- In-memory Map (для разработки)
- В продакшене: Redis с TTL 5 минут

### 3. Telegram Bot (bot.py)

**Обработчик QR-авторизации:**
```python
if auth_param.startswith('auth_'):
    # 1. Формируем user_data
    user_data = {
        'id': user_id,
        'first_name': user.first_name,
        'username': user.username
    }
    
    # 2. Отправляем на сервер
    async with aiohttp.ClientSession() as session:
        await session.post(
            f"{API_BASE_URL}/api/auth",
            json={'token': auth_param, 'user': user_data}
        )
    
    # 3. Уведомляем пользователя
    await update.message.reply_text("✅ Окно на компьютере закроется автоматически")
```

## Безопасность

1. **Токены одноразовые** - после использования удаляются из хранилища
2. **Время жизни 5 минут** - старые токены автоматически очищаются
3. **CORS настроен** - только с домена anonimka.kz
4. **Данные не хранятся на сервере** - только в localStorage клиента

## Улучшения для продакшена

### Вместо polling → WebSocket или SSE

**Server-Sent Events (SSE):**
```javascript
const eventSource = new EventSource(`/api/auth/stream?token=${authToken}`);
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.authorized) {
        // Авторизация прошла!
    }
};
```

**WebSocket:**
```javascript
const ws = new WebSocket(`wss://anonimka.kz/ws/auth?token=${authToken}`);
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Обработка авторизации
};
```

### Redis для хранения токенов

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Сохранить с TTL 5 минут
await redis.setex(`auth:${token}`, 300, JSON.stringify(userData));

// Получить и удалить
const data = await redis.getdel(`auth:${token}`);
```

## Тестирование

1. Откройте https://anonimka.kz/webapp/ на компьютере
2. Откройте консоль браузера (F12)
3. Отсканируйте QR телефоном
4. Наблюдайте логи:
   - `🔑 Auth token сгенерирован: auth_...`
   - `✅ Авторизация через QR получена с сервера: {...}`
   - `✅ Модальное окно авторизации закрыто`

## Статус

✅ Реализовано
- QR-авторизация с синхронизацией
- Telegram Login Widget
- API endpoint для обмена данными
- Бот отправляет данные на сервер
- Frontend polling каждые 2 секунды
- Автоматическое закрытие модального окна

🔄 В планах
- WebSocket для real-time уведомлений
- Redis для продакшена
- Мобильная адаптация модального окна
