## Добавление переменных Supabase в Vercel

### Шаг 1: Откройте настройки проекта
1. Перейдите на https://vercel.com/vorobey444s-projects/anonimka-nextjs
2. Нажмите **Settings** (вверху)

### Шаг 2: Добавьте переменные окружения
1. В боковом меню выберите **Environment Variables**
2. Добавьте следующие переменные:

**Переменная 1:**
```
Name: SUPABASE_URL
Value: https://fmgopveobnsapjygobay.supabase.co
Environment: Production, Preview, Development (выберите все)
```

**Переменная 2:**
```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZ29wdmVvYm5zYXBqeWdvYmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3ODk4MSwiZXhwIjoyMDc3MTU0OTgxfQ.eUjlCFG4lIs-UsKw2ErcAJOk9clteLSCHzkhUBdxIVk
Environment: Production, Preview, Development (выберите все)
```

3. Нажмите **Save** для каждой переменной

### Шаг 3: Редеплой проекта
После добавления переменных:
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите на три точки справа → **Redeploy**
4. Подтвердите редеплой

### Шаг 4: Проверка
После деплоя:
1. Откройте https://anonimka.online
2. Нажмите "Подать объявление"
3. Заполните форму (все 7 шагов, включая текст объявления)
4. Нажмите "Опубликовать"
5. Проверьте в Supabase → Table Editor → ads - должна появиться запись!

### Устранение проблем

**Ошибка "База данных не настроена":**
- Убедитесь, что переменные добавлены правильно
- Проверьте, что выбраны все окружения (Production, Preview, Development)
- Сделайте Redeploy

**Объявление не сохраняется:**
- Откройте DevTools → Console - проверьте ошибки
- Проверьте Network tab → /api/ads - посмотрите ответ
- Убедитесь, что таблица `ads` создана в Supabase
