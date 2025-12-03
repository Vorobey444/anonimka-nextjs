# Скрипт для сборки и установки Android APK с поддержкой push-уведомлений

Write-Host "🔨 Сборка Android APK с push-уведомлениями..." -ForegroundColor Cyan
Write-Host ""

# Переходим в директорию android
Set-Location "android"

# Очистка предыдущей сборки
Write-Host "🧹 Очистка..." -ForegroundColor Yellow
.\gradlew clean

# Сборка debug APK
Write-Host ""
Write-Host "🔨 Сборка APK..." -ForegroundColor Yellow
.\gradlew assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ APK собран успешно!" -ForegroundColor Green
    Write-Host ""
    
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
    
    if (Test-Path $apkPath) {
        Write-Host "📱 APK: $apkPath" -ForegroundColor Cyan
        Write-Host ""
        
        # Проверяем подключенные устройства
        $devices = adb devices | Select-String -Pattern "device$"
        
        if ($devices.Count -gt 0) {
            Write-Host "📲 Найдено устройств: $($devices.Count)" -ForegroundColor Green
            Write-Host ""
            Write-Host "📦 Установка APK..." -ForegroundColor Yellow
            
            adb install -r $apkPath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ APK установлен успешно!" -ForegroundColor Green
                Write-Host ""
                Write-Host "🎉 Теперь:" -ForegroundColor Cyan
                Write-Host "1. Откройте приложение на телефоне"
                Write-Host "2. Разрешите уведомления при запросе"
                Write-Host "3. Отправьте тестовое сообщение"
                Write-Host "4. Проверьте логи: adb logcat | Select-String 'FCM'"
            } else {
                Write-Host ""
                Write-Host "❌ Ошибка установки APK" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️ Устройства не найдены" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Подключите устройство через USB и включите отладку по USB"
            Write-Host "Затем установите вручную: adb install -r $apkPath"
        }
    } else {
        Write-Host "❌ APK не найден: $apkPath" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Ошибка сборки!" -ForegroundColor Red
}

Set-Location ".."
