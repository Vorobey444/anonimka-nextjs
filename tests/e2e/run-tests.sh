#!/bin/bash

# Bash скрипт для запуска E2E тестов на Linux/Mac
# Использование: ./run-tests.sh --environment prod

set -e

# Параметры по умолчанию
ENVIRONMENT="local"
WATCH=false
INTERVAL_MINUTES=30

# Парсирование аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        -i|--interval)
            INTERVAL_MINUTES="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Определяем URL в зависимости от окружения
case $ENVIRONMENT in
    prod)
        API_URL="https://anonimka.kz"
        ;;
    staging)
        API_URL="https://staging.anonimka.kz"
        ;;
    *)
        API_URL="http://localhost:3000"
        ;;
esac

echo "🚀 E2E Тестирование Anonimka"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "API URL: $API_URL"

if [ "$WATCH" = true ]; then
    echo "Watch mode: enabled (interval: $INTERVAL_MINUTES min)"
fi

run_tests() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo ""
    echo "[$timestamp] Запуск тестов..."
    
    export API_URL
    
    if npm run test:e2e; then
        echo "[$timestamp] ✅ Тесты завершены успешно"
    else
        echo "[$timestamp] ❌ Ошибка при выполнении тестов"
    fi
}

# Запуск
run_tests

# Режим наблюдения
if [ "$WATCH" = true ]; then
    while true; do
        echo ""
        echo "⏳ Следующий запуск через $INTERVAL_MINUTES минут..."
        sleep $((INTERVAL_MINUTES * 60))
        run_tests
    done
else
    echo ""
    echo "✅ Готово!"
    echo "Отчёты сохранены в: test-reports/"
fi
