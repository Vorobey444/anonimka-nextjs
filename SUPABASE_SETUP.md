# Настройка Supabase для anonimka.online

## 1. Создайте таблицу в Supabase

Зайдите в SQL Editor вашего Supabase проекта и выполните:

```sql
-- Создание таблицы для объявлений
CREATE TABLE ads (
  id BIGSERIAL PRIMARY KEY,
  gender TEXT NOT NULL,
  target TEXT NOT NULL,
  goal TEXT NOT NULL,
  age_from INTEGER,
  age_to INTEGER,
  my_age INTEGER,
  body_type TEXT,
  text TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Россия',
  region TEXT,
  city TEXT NOT NULL,
  user_id TEXT DEFAULT 'anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_ads_city ON ads(city);
CREATE INDEX idx_ads_country ON ads(country);
CREATE INDEX idx_ads_created_at ON ads(created_at DESC);

-- Включаем Row Level Security
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать объявления
CREATE POLICY "Объявления доступны всем для чтения"
  ON ads FOR SELECT
  USING (true);

-- Политика: все могут создавать объявления
CREATE POLICY "Все могут создавать объявления"
  ON ads FOR INSERT
  WITH CHECK (true);
```

## 2. Получите ключи Supabase

1. Откройте ваш проект в Supabase Dashboard
2. Перейдите в **Settings → API**
3. Скопируйте:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **Service Role Key** (секретный ключ для серверных операций)

## 3. Добавьте переменные окружения в Vercel

1. Откройте ваш проект на [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдите в **Settings → Environment Variables**
3. Добавьте следующие переменные:

```
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_KEY=ваш_service_role_key
```

⚠️ **Важно:** Используйте `Service Role Key`, а не `anon key`, так как API работает на сервере.

## 4. Протестируйте

После деплоя на Vercel:

1. Откройте https://anonimka.online
2. Нажмите "Подать объявление"
3. Заполните форму (включая текст объявления)
4. Нажмите "Опубликовать"
5. Проверьте в Supabase → Table Editor → ads - должна появиться новая запись

## 5. Просмотр объявлений

1. Нажмите "Смотреть объявления"
2. Объявления должны загрузиться из Supabase
3. Можно фильтровать по городу

## Структура API

### POST /api/ads
Создание объявления
```json
{
  "gender": "Мужчина",
  "target": "Женщину",
  "goal": "Дружба",
  "ageFrom": 18,
  "ageTo": 35,
  "myAge": 25,
  "body": "Спортивное",
  "text": "Текст объявления...",
  "country": "Россия",
  "region": "Московская область",
  "city": "Москва",
  "userId": "telegram_user_id"
}
```

### GET /api/ads
Получение объявлений
- `?city=Москва` - фильтр по городу
- `?country=Россия` - фильтр по стране

## Устранение неполадок

**Ошибка "База данных не настроена":**
- Проверьте, добавлены ли переменные `SUPABASE_URL` и `SUPABASE_SERVICE_KEY` в Vercel
- После добавления переменных сделайте редеплой (Vercel → Deployments → Redeploy)

**Ошибка при создании объявления:**
- Проверьте, создана ли таблица `ads` в Supabase
- Проверьте Row Level Security политики
- Посмотрите логи в Vercel → Functions → Logs

**Объявления не загружаются:**
- Откройте DevTools → Network и проверьте ответ от `/api/ads`
- Проверьте, есть ли данные в таблице Supabase
