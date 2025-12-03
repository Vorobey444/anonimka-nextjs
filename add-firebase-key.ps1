# Скрипт для добавления Firebase Service Account в .env.local

Write-Host "🔥 Настройка Firebase Service Account Key" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Шаги:" -ForegroundColor Yellow
Write-Host "1. Открыть: https://console.firebase.google.com/project/anonimka-f8ee8/settings/serviceaccounts/adminsdk"
Write-Host "2. Нажать 'Generate new private key'"
Write-Host "3. Скачать JSON файл"
Write-Host "4. Скопировать ВЕСЬ текст из файла"
Write-Host ""
Write-Host "5. Вставить JSON здесь (одной строкой или многострочно):"
Write-Host ""

# Читаем многострочный ввод
$jsonLines = @()
Write-Host "Вставьте JSON и нажмите Enter дважды для завершения:" -ForegroundColor Green
Write-Host ""

do {
    $line = Read-Host
    if ($line) {
        $jsonLines += $line
    }
} while ($line)

$jsonContent = $jsonLines -join ""

# Проверяем валидность JSON
try {
    $jsonObject = $jsonContent | ConvertFrom-Json
    Write-Host ""
    Write-Host "✅ JSON валиден!" -ForegroundColor Green
    Write-Host "Project ID: $($jsonObject.project_id)" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка: Невалидный JSON" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Читаем текущий .env.local
$envPath = ".env.local"
$envContent = Get-Content $envPath -Raw

# Проверяем есть ли уже FIREBASE_SERVICE_ACCOUNT
if ($envContent -match 'FIREBASE_SERVICE_ACCOUNT=') {
    Write-Host ""
    Write-Host "⚠️ FIREBASE_SERVICE_ACCOUNT уже существует в .env.local" -ForegroundColor Yellow
    $overwrite = Read-Host "Перезаписать? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "Отменено" -ForegroundColor Red
        exit 0
    }
    # Удаляем старую строку
    $envContent = $envContent -replace 'FIREBASE_SERVICE_ACCOUNT=.*\n?', ''
}

# Добавляем новую переменную
$newLine = "FIREBASE_SERVICE_ACCOUNT=$jsonContent"
$envContent = $envContent.TrimEnd() + "`n$newLine`n"

# Сохраняем
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host ""
Write-Host "✅ Успешно добавлено в .env.local!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Перезапустить dev сервер: npm run dev"
Write-Host "2. Добавить эту же переменную на Vercel:"
Write-Host "   https://vercel.com/alekseis-projects-8ba05256/anonimka-nextjs/settings/environment-variables"
Write-Host "3. Redeploy проект на Vercel"
Write-Host ""
