# Система идентификации пользователей (Telegram + Email)

## Обзор

Система поддерживает два типа авторизации:
1. **Telegram** - через Telegram WebApp или QR-код (веб-версия)
2. **Email** - через код подтверждения (Android приложение)

## Архитектура

### Таблица `users`

Основная таблица для хранения пользователей обоих типов:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,              -- Telegram ID или auto-increment для email
  user_token VARCHAR(64) UNIQUE NOT NULL, -- Уникальный токен пользователя
  nickname VARCHAR(100),
  email VARCHAR(255) UNIQUE,          -- Email (для email-пользователей)
  email_verified BOOLEAN DEFAULT FALSE,
  auth_method VARCHAR(50) DEFAULT 'telegram', -- 'telegram' или 'email'
  created_from VARCHAR(20) DEFAULT 'webapp',  -- 'webapp', 'android', 'ios'
  last_login_at TIMESTAMP,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP,
  ...
);
```

### user_token

**Ключевой идентификатор** для всех операций:
- Для Telegram: детерминированный HMAC(tg_id + secret)
- Для Email: криптографически случайный SHA-256

**Преимущества:**
- Единый идентификатор для обоих типов пользователей
- Не раскрывает Telegram ID или Email
- Позволяет работать без привязки к конкретной платформе

## Утилиты

### `src/lib/userIdentity.ts`

```typescript
// Получить информацию о пользователе по токену
const identity = await getUserIdentity(userToken);
// Результат:
{
  type: 'telegram' | 'email',
  id: number,
  tgId: number | null,     // только для Telegram
  email: string | null,     // только для Email
  userToken: string,
  authMethod: 'telegram' | 'email'
}

// Генерация токенов
const tgToken = generateTelegramUserToken(tgId);
const emailToken = generateEmailUserToken(email);

// Получить токен по ID
const token = await getUserTokenByTgId(tgId);
const token = await getUserTokenByEmail(email);
```

### `src/lib/authMiddleware.ts`

```typescript
// Middleware для защищенных endpoints
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // auth.userIdentity содержит всю информацию о пользователе
  const { userIdentity, userToken } = auth;
  
  logWithUser(userIdentity, 'User action performed');
}

// Резолвинг пользователя из разных источников
const identity = await resolveUserIdentity({
  tgId: body.tgId,
  email: body.email,
  userToken: body.userToken
});
```

## Миграция существующих endpoints

### До (только Telegram):
```typescript
export async function POST(req: NextRequest) {
  const { tgId } = await req.json();
  
  const user = await sql`
    SELECT * FROM users WHERE id = ${tgId}
  `;
}
```

### После (Telegram + Email):
```typescript
import { authenticate, logWithUser } from '@/lib/authMiddleware';

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userIdentity, userToken } = auth;
  
  // Работаем с user_token вместо tgId
  const user = await sql`
    SELECT * FROM users WHERE user_token = ${userToken}
  `;
  
  logWithUser(userIdentity, 'Operation completed');
}
```

## Примеры использования

### 1. Создание анкеты

**Telegram пользователь:**
```javascript
// Frontend
const userToken = generateUserToken(tgId); // детерминированный

// Backend
POST /api/ads
{
  "userToken": "abc123...",
  // tgId не нужен! Все через userToken
}
```

**Email пользователь:**
```javascript
// Frontend (Android)
const userToken = response.user.userToken; // получен после email auth

// Backend
POST /api/ads
{
  "userToken": "def456...",
  // Система автоматически определит что это email пользователь
}
```

### 2. Отправка уведомлений

```typescript
// Старый способ (только Telegram):
await sendNotification(receiverTgId);

// Новый способ (универсальный):
const receiverIdentity = await getUserIdentity(receiverToken);

if (receiverIdentity.type === 'telegram' && receiverIdentity.tgId) {
  await sendTelegramNotification(receiverIdentity.tgId);
} else if (receiverIdentity.type === 'email') {
  // Email пользователи пока не получают уведомления
  console.log('Email notifications not yet implemented');
}
```

### 3. Проверка Premium статуса

```typescript
// Оба типа пользователей работают одинаково:
const userInfo = await sql`
  SELECT is_premium, premium_until 
  FROM users 
  WHERE user_token = ${userToken}
`;
```

## Правила миграции

### ✅ Делать:
1. Использовать `user_token` как основной идентификатор
2. Использовать `authenticate()` middleware для всех защищенных endpoints
3. Проверять `userIdentity.type` только когда нужны платформо-специфичные функции (например, Telegram уведомления)
4. Логировать с помощью `logWithUser()` для правильного отображения типа пользователя

### ❌ Не делать:
1. Не использовать `tgId` напрямую (только через `userIdentity.tgId` когда необходимо)
2. Не требовать обязательные `tgId` в API запросах
3. Не делать предположения о типе пользователя без проверки
4. Не раскрывать email или tgId в логах (использовать `getUserDisplayId()`)

## Обратная совместимость

Система полностью обратно совместима:
- Старые пользователи с `tgId` продолжают работать
- API endpoints принимают как `tgId`, так и `userToken`
- Frontend может работать как раньше (с tgId), middleware автоматически резолвит

## Безопасность

- `user_token` НЕ раскрывает tgId или email
- Email адреса НЕ отображаются в публичных API
- Telegram ID НЕ отображаются в публичных API
- Все коммуникации через безопасные токены

## Чеклист миграции endpoint

- [ ] Добавить `authenticate()` middleware
- [ ] Заменить прямые обращения к `tgId` на `userToken`
- [ ] Обновить SQL запросы для работы с `user_token`
- [ ] Добавить поддержку обоих типов пользователей в логике
- [ ] Обновить логирование на `logWithUser()`
- [ ] Протестировать с Telegram пользователями
- [ ] Протестировать с Email пользователями
- [ ] Проверить обратную совместимость
