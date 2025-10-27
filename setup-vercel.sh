#!/bin/bash

echo "🚀 Настройка Anonimka.Online для Vercel"
echo "======================================"

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Проверяем переменные окружения
echo "🔧 Проверяем переменные окружения..."
if [ -f .env.local ]; then
    echo "✅ Файл .env.local найден"
    echo "📋 Настройки SMTP:"
    grep "SMTP_" .env.local | sed 's/=.*/=***/'
else
    echo "⚠️  Файл .env.local не найден. Создаем пример..."
    cp .env.example .env.local 2>/dev/null || echo "Создайте .env.local с SMTP настройками"
fi

echo ""
echo "🎯 Следующие шаги для Vercel деплоя:"
echo "1. Подключите GitHub репозиторий к Vercel"
echo "2. Настройте environment переменные в Vercel Dashboard:"
echo "   - SMTP_HOST=smtp.yandex.ru"  
echo "   - SMTP_PORT=587"
echo "   - SMTP_USER=wish.online@yandex.kz"
echo "   - SMTP_PASS=aitmytqacblwvpjc" 
echo "   - SUPPORT_TO=vorobey469@yandex.ru"
echo "3. Задеплойте на Vercel"
echo ""
echo "🌐 Локальная разработка:"
echo "npm run dev - запуск в режиме разработки"
echo "npm run build - сборка для продакшена"
echo ""
echo "✨ Готово! Email система настроена как в whish.online"