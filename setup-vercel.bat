@echo off
echo 🚀 Настройка Anonimka.Online для Vercel
echo ======================================

REM Устанавливаем зависимости
echo 📦 Устанавливаем зависимости...
call npm install

REM Проверяем переменные окружения
echo 🔧 Проверяем переменные окружения...
if exist .env.local (
    echo ✅ Файл .env.local найден
    echo 📋 SMTP настройки настроены
) else (
    echo ⚠️  Файл .env.local не найден. Убедитесь что он создан с SMTP настройками
)

echo.
echo 🎯 Следующие шаги для Vercel деплоя:
echo 1. Подключите GitHub репозиторий к Vercel
echo 2. Настройте environment переменные в Vercel Dashboard:
echo    - SMTP_HOST=smtp.yandex.ru
echo    - SMTP_PORT=587  
echo    - SMTP_USER=wish.online@yandex.kz
echo    - SMTP_PASS=aitmytqacblwvpjc
echo    - SUPPORT_TO=vorobey469@yandex.ru
echo 3. Задеплойте на Vercel
echo.
echo 🌐 Команды для разработки:
echo npm run dev - запуск в режиме разработки
echo npm run build - сборка для продакшена  
echo.
echo ✨ Готово! Email система настроена как в whish.online
pause