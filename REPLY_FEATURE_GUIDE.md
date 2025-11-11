# Инструкция: Функция "Ответить на сообщение" в приватных чатах

## Что добавлено

### 1. Свайп налево для ответа
- Пролистайте сообщение влево (мышью или пальцем)
- Появится превью с ником и текстом сообщения
- Превью можно закрыть кнопкой ×

### 2. Кнопка размера текста
- В шапке приватного чата появилась кнопка **A**
- Три размера: маленький (13px) → средний (15px) → большой (18px)
- Размер сохраняется в localStorage

### 3. Индикатор ответа
- В сообщениях-ответах показывается цитата оригинального сообщения
- Клик по индикатору → прокрутка к оригинальному сообщению
- Оригинальное сообщение моргает неоновым цветом

## Как это работает (технически)

### Frontend (public/webapp/)
**app.js:**
- `replyToMsg(messageId, nickname, messageText)` - показывает превью ответа
- `cancelReply()` - скрывает превью
- `scrollToMessage(messageId)` - прокручивает к сообщению + анимация highlight
- `setupMessageSwipeHandlers()` - обработчик свайпа влево (порог -80px)
- `toggleChatFontSize()` - переключает размер шрифта (small/medium/large)
- `applyChatFontSize()` - применяет сохраненный размер при открытии чата

**style.css:**
- `.reply-preview` - стили для превью ответа (снизу над полем ввода)
- `.message-reply-indicator` - стили для индикатора в сообщении (цитата)
- `.chat-messages.font-small/medium/large` - размеры шрифта
- `.message.highlight` - анимация highlightPulse (cyan glow)

**index.html:**
- Кнопка `<button class="chat-font-size-btn" onclick="toggleChatFontSize()">A</button>`
- Превью ответа: `<div id="replyPreview" class="reply-preview" style="display: none;">`

### Backend (src/app/api/)
**neon-messages/route.ts:**
- Добавлен параметр `replyToMessageId` в action 'send-message'
- INSERT query сохраняет `reply_to_message_id` в базу

### Database
**Миграция:** `migrations/016_add_reply_to_messages.sql`
- Добавляет колонку `reply_to_message_id INTEGER` в таблицу `messages`
- Создает индекс `idx_messages_reply_to` для быстрых запросов

## Применение миграции

### Способ 1: Через Neon Console (быстро)
1. Откройте https://console.neon.tech
2. Выберите ваш проект → SQL Editor
3. Скопируйте содержимое `migrations/016_add_reply_to_messages.sql`
4. Выполните запрос (Run)

### Способ 2: Через psql
```powershell
$env:DATABASE_URL = "postgresql://user:password@host/database"
psql $env:DATABASE_URL -f migrations/016_add_reply_to_messages.sql
```

## Проверка работы

После применения миграции выполните:
```sql
-- Проверка что колонка добавлена
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_message_id';
-- Должно вернуть: reply_to_message_id | integer | YES

-- Проверка индекса
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'messages' 
AND indexname = 'idx_messages_reply_to';
-- Должно вернуть: idx_messages_reply_to
```

## Тестирование функции

1. Откройте приватный чат в WebApp
2. Пролистайте любое сообщение влево → должно появиться превью ответа
3. Введите текст и отправьте → сообщение должно сохраниться с индикатором ответа
4. Кликните на индикатор → должно прокрутить к оригинальному сообщению
5. Нажмите кнопку **A** в шапке → размер шрифта должен меняться

## Файлы изменены

**Frontend:**
- `public/webapp/app.js` - добавлено ~120 строк (функции reply + swipe handlers)
- `public/webapp/style.css` - добавлено ~50 строк (стили reply indicator)
- `public/webapp/index.html` - кнопка A + структура reply preview

**Backend:**
- `src/app/api/neon-messages/route.ts` - добавлен параметр replyToMessageId

**Database:**
- `migrations/016_add_reply_to_messages.sql` - новая миграция

## Возможные проблемы

❌ **Ошибка "column reply_to_message_id does not exist"**
→ Миграция не применена. Выполните SQL из файла миграции.

❌ **Свайп не работает**
→ Проверьте что `data-message-id` и `data-nickname` есть в атрибутах div.message
→ Откройте DevTools → Elements → проверьте атрибуты сообщений

❌ **Индикатор ответа не показывается**
→ Проверьте что API возвращает `reply_to_message_id` в объектах messages
→ Откройте DevTools → Network → проверьте ответ `/api/neon-messages?action=get-messages`

## Готово! ✅

После применения миграции все функции работают автоматически:
- ✅ Свайп налево для ответа
- ✅ Превью ответа с ником и текстом
- ✅ Индикатор ответа в сообщениях
- ✅ Клик на индикатор → прокрутка к оригиналу
- ✅ Размер шрифта (кнопка A)
- ✅ Сохранение reply_to_message_id в базу
