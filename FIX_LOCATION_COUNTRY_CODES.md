# Исправление кодов стран в БД

## Проблема

В старых записях пользователей коды стран хранятся как полные названия (`"kazakhstan"`, `"russia"`), а в новых - как ISO коды (`"KZ"`, `"RU"`). Из-за этого пользователи со старыми записями не видят новые анкеты, так как фильтр по локации не срабатывает.

## Решение

Миграция обновляет все старые записи в таблице `users`, заменяя полные названия стран на стандартные ISO коды.

### Что исправляется:

- `kazakhstan` / `Kazakhstan` → `KZ` (Казахстан)
- `russia` / `Russia` → `RU` (Россия)
- `kyrgyzstan` / `Kyrgyzstan` → `KG` (Кыргызстан)
- `uzbekistan` / `Uzbekistan` → `UZ` (Узбекистан)
- `tajikistan` / `Tajikistan` → `TJ` (Таджикистан)
- `turkmenistan` / `Turkmenistan` → `TM` (Туркменистан)
- `belarus` / `Belarus` → `BY` (Беларусь)

## Выполнение миграции

### ⚡ Быстрый способ (рекомендуется)

**Вариант 1: С .env.local файлом**

Создайте файл `.env.local` в корне проекта со строкой:
```
POSTGRES_URL=your_neon_database_connection_string
```

Затем запустите:
```bash
node scripts/fix-location-country-codes.js
```

**Вариант 2: Прямая передача URL**

Windows PowerShell:
```powershell
$env:POSTGRES_URL="your_connection_string"; node scripts/fix-location-country-codes.js
```

Linux/Mac:
```bash
POSTGRES_URL="your_connection_string" node scripts/fix-location-country-codes.js
```

**Вариант 3: SQL напрямую в Neon Dashboard**

1. Откройте https://console.neon.tech
2. Выберите проект anonimka
3. Перейдите в SQL Editor
4. Скопируйте и выполните содержимое файла `fix_location_country_codes.sql`

## Проверка результатов

После выполнения миграции:

```sql
-- Посмотреть распределение по странам
SELECT location_country, COUNT(*) as count 
FROM users 
WHERE location_country IS NOT NULL 
GROUP BY location_country 
ORDER BY count DESC;
```

Все страны должны быть в формате ISO кодов (2 буквы в верхнем регистре).

## Откат (если что-то пошло не так)

Миграция необратима, но вы можете вручную вернуть конкретные записи:

```sql
-- Пример отката для Казахстана
UPDATE users 
SET location_country = 'kazakhstan' 
WHERE location_country = 'KZ';
```

⚠️ **Важно**: Не откатывайте без необходимости! Старый формат вызывает проблемы с фильтрацией.
