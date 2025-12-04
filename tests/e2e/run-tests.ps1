# PowerShell скрипт для запуска E2E тестов на Windows
# Использование: .\run-tests.ps1 -Environment "prod"

param(
    [string]$Environment = "local",
    [switch]$Watch = $false,
    [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"

# Определяем URL в зависимости от окружения
$apiUrl = if ($Environment -eq "prod") {
    "https://anonimka.kz"
} elseif ($Environment -eq "staging") {
    "https://staging.anonimka.kz"
} else {
    "http://localhost:3000"
}

Write-Host "🚀 E2E Тестирование Anonimka" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "API URL: $apiUrl" -ForegroundColor Yellow

if ($Watch) {
    Write-Host "Watch mode: enabled (interval: $IntervalMinutes min)" -ForegroundColor Yellow
}

function Run-Tests {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "`n[$timestamp] Запуск тестов..." -ForegroundColor Green
    
    $env:API_URL = $apiUrl
    
    try {
        npm run test:e2e
        Write-Host "[$timestamp] ✅ Тесты завершены успешно" -ForegroundColor Green
    } catch {
        Write-Host "[$timestamp] ❌ Ошибка при выполнении тестов" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Запуск
Run-Tests

# Режим наблюдения
if ($Watch) {
    while ($true) {
        Write-Host "`n⏳ Следующий запуск через $IntervalMinutes минут..." -ForegroundColor Cyan
        Start-Sleep -Seconds ($IntervalMinutes * 60)
        Run-Tests
    }
} else {
    Write-Host "`n✅ Готово!" -ForegroundColor Green
    Write-Host "Отчёты сохранены в: test-reports/" -ForegroundColor Cyan
}
