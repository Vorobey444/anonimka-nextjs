# Исправление ошибки реферальной системы

## Проблема
```
null value in column "referrer_id" of relation "referrals" violates not-null constraint
```

Колонки `referrer_id` и `referred_id` были созданы с ограничением NOT NULL, но в коде мы пытаемся вставить NULL когда пользователь приходит по реферальной ссылке и его Telegram ID еще неизвестен.

## Решение

1. Открой Neon Console: https://console.neon.tech
2. Выбери проект с базой данных
3. Перейди в SQL Editor
4. Выполни миграцию из файла `neon_referrals_nullable.sql`:

```sql
ALTER TABLE referrals 
ALTER COLUMN referrer_id DROP NOT NULL;

ALTER TABLE referrals 
ALTER COLUMN referred_id DROP NOT NULL;

COMMENT ON COLUMN referrals.referrer_id IS 'Telegram ID пригласившего (может быть NULL если известен только токен)';
COMMENT ON COLUMN referrals.referred_id IS 'Telegram ID приглашенного (заполняется при создании первой анкеты)';
```

5. Нажми "Run" или Ctrl+Enter

## Что это исправит

- `referrer_id` может быть NULL если реферер пришел через веб и его Telegram ID неизвестен
- `referred_id` может быть NULL при первой регистрации (заполнится когда пользователь создаст анкету)
- Реферальная система будет работать как для Telegram пользователей, так и для веб-пользователей

## После применения

Реферальная система заработает корректно и будет:
1. Регистрировать переходы по реферальным ссылкам
2. Заполнять Telegram ID'ы по мере их обнаружения
3. Выдавать PRO подписку рефереру когда приглашенный создаст анкету
