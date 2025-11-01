@echo off
echo ========================================
echo   Деплой на Vercel через Git Push
echo ========================================
echo.

:: Проверяем есть ли изменения
git status --short
if errorlevel 1 (
    echo [ERROR] Git репозиторий не найден
    pause
    exit /b 1
)

echo.
echo Какие изменения сделаны?
set /p COMMIT_MSG="Введите описание коммита: "

if "%COMMIT_MSG%"=="" (
    echo [ERROR] Описание не может быть пустым
    pause
    exit /b 1
)

echo.
echo [1/3] Добавляем файлы в Git...
git add .

echo [2/3] Создаем коммит...
git commit -m "%COMMIT_MSG%"

echo [3/3] Отправляем на GitHub...
git push

echo.
echo ========================================
echo   Деплой запущен!
echo ========================================
echo.
echo Vercel автоматически задеплоит изменения через 1-2 минуты.
echo Проверьте статус: https://vercel.com/dashboard
echo.
pause
