// ================================================
// AUTH MODALS MODULE - Модальные окна авторизации
// Telegram и Email аутентификация
// ================================================

console.log('📦 Загружен модуль: auth-modals.js');

/**
 * Скрыть модальные окна авторизации немедленно (IIFE)
 */
(function hideAuthModalsImmediately() {
    const userToken = localStorage.getItem('user_token');
    
    // Если токен есть - скрываем модалки (пользователь авторизован)
    if (userToken) {
        if (document.readyState === 'loading') {
            // DOM еще не загружен, ждем
            document.addEventListener('DOMContentLoaded', function() {
                const telegramModal = document.getElementById('telegramAuthModal');
                const emailModal = document.getElementById('emailAuthModal');
                if (telegramModal) telegramModal.style.display = 'none';
                if (emailModal) emailModal.style.display = 'none';
            });
        } else {
            // DOM уже загружен
            const telegramModal = document.getElementById('telegramAuthModal');
            const emailModal = document.getElementById('emailAuthModal');
            if (telegramModal) telegramModal.style.display = 'none';
            if (emailModal) emailModal.style.display = 'none';
        }
    }
    // Если токена нет - НЕ скрываем модалки, они должны показаться
})();

/**
 * Резервный механизм: если авторизация не показалась, принудительно показать модалку
 */
function ensureAuthModalVisibility() {
    const userToken = localStorage.getItem('user_token');
    if (userToken) return;
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) return;

    const computedStyle = window.getComputedStyle(modal);
    if (computedStyle.display === 'none') {
        console.warn('⚠️ Fallback: принудительно показываем модальное окно авторизации');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '99999';
        modal.classList.remove('hidden');
        modal.removeAttribute('hidden');

        const loginWidgetContainer = document.getElementById('loginWidgetContainer');
        if (loginWidgetContainer) loginWidgetContainer.style.display = 'block';
        const loginWidgetDivider = document.getElementById('loginWidgetDivider');
        if (loginWidgetDivider) loginWidgetDivider.style.display = 'flex';

        // Гарантируем отображение основного контента модалки
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'flex';
            modalContent.style.opacity = '1';
            modalContent.style.visibility = 'visible';
        }
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.style.display = 'block';
    }
}

/**
 * Проверка и обработка возврата после авторизации
 */
function checkAndHandleAuthReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAuthorized = urlParams.get('authorized') === 'true';
    const isFromApp = urlParams.get('from_app') === 'true';
    const userId = urlParams.get('user_id');
    
    if (isAuthorized && userId) {
        console.log('✅ Возврат после авторизации, user_id:', userId);
        
        // Закрываем модальное окно авторизации
        const authModal = document.getElementById('telegramAuthModal');
        if (authModal) {
            authModal.style.display = 'none';
            console.log('✅ Модальное окно авторизации закрыто');
        }
        
        // Если это из Android приложения
        if (isFromApp && window.Telegram?.WebApp) {
            console.log('📱 Закрываем Telegram WebApp для возврата в Android');
            
            // Показываем уведомление перед закрытием
            setTimeout(() => {
                window.Telegram.WebApp.close();
            }, 500);
        }
        
        // Очищаем URL от параметров авторизации
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Перезагружаем данные пользователя
        setTimeout(() => {
            window.location.reload();
        }, isFromApp ? 1000 : 500);
    }
}

// Показать модальное окно авторизации через Telegram
function showTelegramAuthModal() {
    console.log('📱 Показываем модальное окно авторизации');
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) {
        console.error('❌ Модальное окно авторизации не найдено!');
        
        // Создаем временное уведомление если модалка не найдена
        tg.showAlert('⚠️ Ошибка: Модальное окно авторизации не найдено в DOM!\n\nПопробуйте перезагрузить страницу.');
        return;
    }
    
    console.log('✅ Модальное окно найдено:', modal);
    
    // Блокируем весь интерфейс (делаем модальное окно обязательным)
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    console.log('✅ Стили модального окна применены. display:', modal.style.display);
    
    // Принудительно делаем видимым
    modal.classList.remove('hidden');
    modal.removeAttribute('hidden');
    
    // Блокируем закрытие по клику вне модального окна
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            e.stopPropagation();
            tg.showAlert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
        };
    }
    
    // Блокируем кнопку закрытия
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            tg.showAlert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
            return false;
        };
    }
    
    // Генерируем уникальный auth token для этой сессии
    const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('telegram_auth_token', authToken);
    
    console.log('🔑 Auth token сгенерирован:', authToken);
    
    // Генерируем QR-код
    generateTelegramQR(authToken);
    
    // ВСЕГДА показываем кнопку Deep Link (работает и в WebView и в браузере)
    console.log('🌐 Настраиваем кнопку Deep Link для авторизации');
    const loginWidgetContainer = document.getElementById('loginWidgetContainer');
    const loginWidgetDivider = document.getElementById('loginWidgetDivider');
    const deepLinkButton = document.getElementById('telegramDeepLink');
    
    // Устанавливаем Deep Link для открытия бота
    const botUsername = 'anonimka_kz_bot';
    
    // Определяем находимся ли мы в Android приложении
    const isAndroidApp = navigator.userAgent.includes('wv') || 
                       navigator.userAgent.includes('Android') ||
                       window.location.protocol === 'file:';
    
    console.log('🔍 Debug auth:', {
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        isAndroidApp: isAndroidApp,
        authToken: authToken
    });
    
    // Если в Android приложении - добавляем параметр для возврата
    const startParam = isAndroidApp ? `${authToken}_app` : authToken;
    // Используем tg://resolve чтобы открывать приложение Telegram сразу (минуя веб-превью)
    const telegramDeepLink = `tg://resolve?domain=${botUsername}&start=${startParam}`;
    
    console.log('🔗 Deep link:', telegramDeepLink);
    
    if (deepLinkButton) {
        deepLinkButton.href = telegramDeepLink;
        // Добавляем обработчик клика для принудительного открытия
        deepLinkButton.onclick = function(e) {
            e.preventDefault();
            console.log('🔗 Открываем Telegram:', telegramDeepLink, 'isTelegramWebApp:', isTelegramWebApp);

            // Внутри Telegram WebApp используем родной метод
            try {
                if (isTelegramWebApp && window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(telegramDeepLink);
                    return false;
                }
            } catch (err) {
                console.error('❌ Ошибка openTelegramLink:', err);
            }

            // Если это Android-приложение (WebView), открываем напрямую
            if (isAndroidApp) {
                window.location.href = telegramDeepLink;
                return false;
            }
            
            // Браузерный fallback: принудительный переход (без popup)
            window.location.href = telegramDeepLink;
            return false;
        };
        console.log('✅ Deep link установлен на кнопку с обработчиком клика');
    }
    
    if (loginWidgetContainer) {
        loginWidgetContainer.style.display = 'block';
    }
    if (loginWidgetDivider) {
        loginWidgetDivider.style.display = 'flex';
    }
    
    // Проверяем авторизацию каждые 2 секунды через API сервера
    const checkInterval = setInterval(async () => {
        try {
            // Проверяем на сервере, не авторизовался ли пользователь через QR на телефоне
            const response = await fetch(`/api/auth?token=${authToken}`);
            const data = await response.json();
            
            if (data.authorized && data.user) {
                console.log('✅ Авторизация через QR получена с сервера:', data.user);
                
                // Сохраняем данные пользователя
                localStorage.setItem('telegram_user', JSON.stringify(data.user));
                localStorage.setItem('telegram_auth_time', Date.now().toString());
                localStorage.removeItem('telegram_auth_token');
                
                // Закрываем модальное окно
                clearInterval(checkInterval);
                modal.style.display = 'none';
                
                // Показываем уведомление
                tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${data.user.first_name}!\n\nТеперь вы можете пользоваться сайтом как с компьютера, так и с телефона.`);
                
                // Перезагружаем страницу через 1 секунду
                setTimeout(() => location.reload(), 1000);
                return;
            }
            
            // Также проверяем localStorage (на случай авторизации через Login Widget)
            const savedUser = localStorage.getItem('telegram_user');
            const authTime = localStorage.getItem('telegram_auth_time');
            
            if (savedUser && authTime) {
                const userData = JSON.parse(savedUser);
                const timeDiff = Date.now() - parseInt(authTime);
                
                // Если авторизация произошла менее 10 секунд назад
                if (timeDiff < 10000) {
                    console.log('✅ Обнаружена авторизация через Login Widget');
                    
                    // Закрываем модальное окно
                    clearInterval(checkInterval);
                    modal.style.display = 'none';
                    localStorage.removeItem('telegram_auth_token');
                    
                    // Показываем уведомление
                    tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${userData.first_name}!`);
                    
                    // Перезагружаем страницу
                    setTimeout(() => location.reload(), 1000);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
        }
    }, 2000);
    
    // Останавливаем проверку через 10 минут
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏰ Timeout: проверка авторизации остановлена');
    }, 600000);
}

// Генерация QR-кода для Telegram авторизации
function generateTelegramQR(authToken) {
    const qrcodeContainer = document.getElementById('qrcode');
    const qrLoading = document.getElementById('qrLoading');
    
    if (!qrcodeContainer) return;
    
    // Очищаем контейнер
    qrcodeContainer.innerHTML = '';
    
    // Показываем загрузку с собакой
    if (qrLoading) {
        qrLoading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Генерируем QR-код...</p>
        `;
        qrLoading.classList.remove('hidden');
    }
    
    // Создаем deep link для Telegram бота
    // Формат: https://t.me/bot_username?start=auth_token
    const botUsername = 'anonimka_kz_bot';
    const telegramDeepLink = `https://t.me/${botUsername}?start=${authToken}`;
    
    console.log('Генерация QR-кода для:', telegramDeepLink);
    
    // Генерируем QR-код через небольшую задержку для плавности
    setTimeout(() => {
        try {
            new QRCode(qrcodeContainer, {
                text: telegramDeepLink,
                width: 240,
                height: 240,
                colorDark: "#8338ec",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Скрываем загрузку
            if (qrLoading) {
                qrLoading.classList.add('hidden');
            }
            
            console.log('QR-код успешно сгенерирован');
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            if (qrLoading) {
                qrLoading.innerHTML = '<p style="color: #ff0066;">❌ Ошибка генерации QR-кода</p>';
            }
        }
    }, 100);
}

// Закрыть модальное окно (только если пользователь авторизован)
function closeTelegramAuthModal() {
    const savedUser = localStorage.getItem('telegram_user');
    if (!savedUser) {
        tg.showAlert('Для продолжения использования сайта необходимо авторизоваться через Telegram');
        return;
    }
    
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Инициализация Telegram Login Widget
function initTelegramLoginWidget() {
    const container = document.getElementById('telegramLoginWidget');
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Имя бота для Telegram Login Widget
    const botUsername = 'anonimka_kz_bot';
    
    // Создаём iframe для Telegram Login Widget
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin + '/webapp/auth.html');
    script.setAttribute('data-request-access', 'write');
    
    container.appendChild(script);
    
    console.log('Telegram Login Widget инициализирован для бота:', botUsername);
}

// Callback после успешной авторизации через Telegram Login Widget
window.onTelegramAuth = function(user) {
    console.log('✅ Успешная авторизация через Telegram Login Widget:', user);
    
    // Сохраняем данные пользователя
    localStorage.setItem('telegram_user', JSON.stringify(user));
    localStorage.setItem('telegram_auth_time', Date.now().toString());
    
    // Закрываем модальное окно
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ Модальное окно авторизации закрыто');
    }
    
    // Показываем уведомление
    tg.showAlert(`✅ Вы успешно авторизованы!\n\nДобро пожаловать, ${user.first_name}!\n\nТеперь вы можете создавать анкеты и получать уведомления.`);
    
    // Обновляем кнопку выхода
    if (typeof updateLogoutButtonVisibility === 'function') {
        updateLogoutButtonVisibility();
    }
    
    // Перезагружаем страницу для применения авторизации
    location.reload();
};

// Показать модальное окно авторизации через Email
function showEmailAuthModal() {
    console.log('📧 Показываем модальное окно email авторизации');
    
    // Создаем модальное окно динамически
    let modal = document.getElementById('emailAuthModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emailAuthModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 99999;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
                border-radius: 30px;
                padding: 3rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(255, 0, 110, 0.4);
                border: 3px solid #ff006e;
                position: relative;
            ">
                <h2 style="
                    color: #ff006e;
                    text-align: center;
                    margin-bottom: 1.5rem;
                    font-size: 2rem;
                    text-shadow: 0 0 20px rgba(255, 0, 110, 0.6);
                ">📧 Вход через Email</h2>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 1rem;
                ">Введите вашу почту для авторизации</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <input 
                        type="email" 
                        id="emailAuthInput" 
                        placeholder="your@email.com"
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 2px solid #ff006e;
                            border-radius: 15px;
                            background: rgba(26, 26, 46, 0.8);
                            color: #fff;
                            font-size: 1.1rem;
                            text-align: center;
                            outline: none;
                            transition: all 0.3s ease;
                        "
                    />
                </div>
                
                <div id="emailAuthCodeSection" style="display: none; margin-bottom: 1.5rem;">
                    <p style="
                        color: rgba(255, 255, 255, 0.8);
                        text-align: center;
                        margin-bottom: 1rem;
                        font-size: 0.95rem;
                    ">Введите код из письма:</p>
                    <input 
                        type="text" 
                        id="emailAuthCode" 
                        placeholder="••••••"
                        maxlength="6"
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 2px solid #00ff88;
                            border-radius: 15px;
                            background: rgba(26, 26, 46, 0.8);
                            color: #fff;
                            font-size: 1.5rem;
                            text-align: center;
                            letter-spacing: 0.5rem;
                            outline: none;
                        "
                    />
                </div>
                
                <div id="emailAuthMessage" style="
                    text-align: center;
                    margin-bottom: 1.5rem;
                    min-height: 1.5rem;
                    color: #00ff88;
                    font-size: 0.9rem;
                "></div>
                
                <button 
                    id="emailAuthButton" 
                    class="neon-button primary"
                    style="
                        width: 100%;
                        padding: 1rem;
                        border: 2px solid #ff006e;
                        border-radius: 15px;
                        background: rgba(255, 0, 110, 0.2);
                        color: #ff006e;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-bottom: 1rem;
                    "
                >
                    Отправить код
                </button>
                
                <div style="text-align: center;">
                    <button 
                        onclick="switchToTelegramAuth()"
                        style="
                            background: none;
                            border: none;
                            color: #00d4ff;
                            text-decoration: underline;
                            cursor: pointer;
                            font-size: 1rem;
                        "
                    >
                        ✈️ Войти через Telegram
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий
        const emailInput = modal.querySelector('#emailAuthInput');
        const codeInput = modal.querySelector('#emailAuthCode');
        const button = modal.querySelector('#emailAuthButton');
        const messageDiv = modal.querySelector('#emailAuthMessage');
        const codeSection = modal.querySelector('#emailAuthCodeSection');
        
        let emailSent = false;
        
        button.onclick = async () => {
            if (!emailSent) {
                // Отправка кода
                const email = emailInput.value.trim().toLowerCase();
                
                if (!email || !email.includes('@')) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ Введите корректный email';
                    return;
                }
                
                button.disabled = true;
                button.textContent = 'Отправка...';
                messageDiv.textContent = '⏳ Отправляем код...';
                
                try {
                    const response = await fetch('/api/auth/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'send-code',
                            email 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        emailSent = true;
                        messageDiv.style.color = '#00ff88';
                        messageDiv.textContent = '✅ Код отправлен на ' + email;
                        codeSection.style.display = 'block';
                        button.textContent = 'Войти';
                        emailInput.disabled = true;
                        codeInput.focus();
                    } else {
                        throw new Error(data.error || 'Ошибка отправки кода');
                    }
                } catch (error) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ ' + error.message;
                    button.textContent = 'Отправить код';
                } finally {
                    button.disabled = false;
                }
            } else {
                // Проверка кода
                const code = codeInput.value.trim();
                
                if (!code || code.length !== 6) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ Введите 6-значный код';
                    return;
                }
                
                button.disabled = true;
                button.textContent = 'Проверка...';
                messageDiv.textContent = '⏳ Проверяем код...';
                
                try {
                    const response = await fetch('/api/auth/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'verify-code',
                            email: emailInput.value.trim().toLowerCase(),
                            code 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.user?.userToken) {
                        localStorage.setItem('user_token', data.user.userToken);
                        localStorage.setItem('auth_method', 'email');
                        localStorage.setItem('user_email', emailInput.value.trim().toLowerCase());
                        if (data.user.id) {
                            localStorage.setItem('user_id', data.user.id.toString());
                        }
                        
                        messageDiv.style.color = '#00ff88';
                        messageDiv.textContent = '✅ Авторизация успешна!';
                        
                        setTimeout(() => {
                            modal.style.display = 'none';
                            location.reload();
                        }, 1500);
                    } else {
                        throw new Error(data.error || 'Неверный код');
                    }
                } catch (error) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ ' + error.message;
                    button.textContent = 'Войти';
                    button.disabled = false;
                }
            }
        };
        
        // Enter для отправки
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') button.click();
        });
        
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') button.click();
        });
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.querySelector('#emailAuthInput')?.focus();
    }, 100);
}

// Переключиться на Telegram авторизацию
function switchToTelegramAuth() {
    const emailModal = document.getElementById('emailAuthModal');
    if (emailModal) {
        emailModal.style.display = 'none';
    }
    showTelegramAuthModal();
}

// Переключиться на Email авторизацию
function switchToEmailAuth() {
    const telegramModal = document.getElementById('telegramAuthModal');
    if (telegramModal) {
        telegramModal.style.display = 'none';
    }
    showEmailAuthModal();
}

// Показать модальное окно реферальной ссылки
function showReferralModal() {
    const modal = document.getElementById('referralModal');
    const referralLinkEl = document.getElementById('referralLink');
    modal.style.display = 'flex';
    // Получаем user_token текущего пользователя
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        referralLinkEl.textContent = 'Авторизуйтесь для получения реферальной ссылки';
        return;
    }
    // Генерируем реферальную ссылку
    const botUsername = 'anonimka_kz_bot';
    // Используем startapp, чтобы параметр попал в WebApp как start_param
    const referralLink = `https://t.me/${botUsername}?startapp=ref_${userToken}`;
    referralLinkEl.textContent = referralLink;
    window.currentReferralLink = referralLink;
}

// Получить текущий ID пользователя для серверных лимитов (предпочтительно Telegram ID)
function getCurrentUserId() {
    // 1) Telegram WebApp user
    if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return String(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
    // 2) Telegram Login Widget сохранённый пользователь
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            if (userData?.id) {
                return String(userData.id);
            }
        } catch (e) {
            console.error('Ошибка получения ID пользователя:', e);
        }
    }
    // 3) Для чисто веб-пользователей (без Telegram) возвращаем null — сервер будет работать по user_token
    return null;
}

// Получить nickname текущего пользователя
function getUserNickname() {
    // Сначала пытаемся получить никнейм из localStorage (оба возможных ключа)
    const savedNickname1 = localStorage.getItem('userNickname');
    const savedNickname2 = localStorage.getItem('user_nickname');
    const savedNickname = savedNickname1 || savedNickname2;
    if (savedNickname && savedNickname !== 'null' && savedNickname !== 'undefined') {
        return savedNickname;
    }
    // Если никнейм не установлен, возвращаем "Аноним"
    return 'Аноним';
}

// Получить локацию пользователя
function getUserLocation() {
    const locationStr = localStorage.getItem('userLocation');
    console.log('📍 localStorage.userLocation:', locationStr);
    if (locationStr === 'null' || locationStr === 'undefined') {
        console.warn('⚠️ userLocation содержит строку null/undefined, очищаем');
        localStorage.removeItem('userLocation');
        return null;
    }
    if (locationStr) {
        try {
            const parsed = JSON.parse(locationStr);
            console.log('📍 Parsed location:', parsed);
            if (!parsed || typeof parsed !== 'object') return null;
            const normalized = {
                country: parsed.country || null,
                region: parsed.region || null,
                city: parsed.city || null,
                timestamp: parsed.timestamp || Date.now()
            };
            return normalized;
        } catch (e) {
            console.error('Ошибка парсинга userLocation:', e);
            localStorage.removeItem('userLocation');
            return null;
        }
    }
    console.log('⚠️ userLocation не найден в localStorage');
    return null;
}

// Получить данные пользователя по ID (для отображения ников собеседников)
function getUserData(userId) {
    // Кешируем данные пользователей в памяти
    if (!window.userDataCache) {
        window.userDataCache = {};
    }
    return window.userDataCache[userId] || null;
}

// Загрузить данные пользователя асинхронно
async function loadUserData(userId) {
    if (!userId) return null;
    
    // Проверяем кеш
    if (window.userDataCache && window.userDataCache[userId]) {
        return window.userDataCache[userId];
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) return null;
        
        const userData = await response.json();
        
        // Сохраняем в кеш
        if (!window.userDataCache) {
            window.userDataCache = {};
        }
        window.userDataCache[userId] = userData;
        
        return userData;
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        return null;
    }
}

/**
 * Показать форму обратной связи по email
 */
function showEmailForm() {
    showScreen('emailForm');
    const senderEmail = document.getElementById('senderEmail');
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    const emailStatus = document.getElementById('emailStatus');
    
    if (senderEmail) senderEmail.value = '';
    if (emailSubject) emailSubject.value = 'Обращение через anonimka.online';
    if (emailMessage) emailMessage.value = '';
    if (emailStatus) emailStatus.style.display = 'none';
}

/**
 * Отправить email через форму
 */
async function handleEmailSubmit(event) {
    if (event) event.preventDefault();
    
    const senderEmail = document.getElementById('senderEmail')?.value?.trim();
    const emailSubject = document.getElementById('emailSubject')?.value?.trim();
    const emailMessage = document.getElementById('emailMessage')?.value?.trim();
    
    if (!senderEmail || !emailMessage) {
        tg.showAlert('Заполните все обязательные поля');
        return;
    }
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: senderEmail,
                subject: emailSubject || 'Обращение через anonimka.online',
                message: emailMessage
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert('✅ Письмо отправлено!');
            if (document.getElementById('emailMessage')) {
                document.getElementById('emailMessage').value = '';
            }
        } else {
            tg.showAlert('Ошибка: ' + (data.error || 'Не удалось отправить'));
        }
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        tg.showAlert('Ошибка при отправке письма');
    }
}

// Экспорт функций для onclick
window.showTelegramAuthModal = showTelegramAuthModal;
window.closeTelegramAuthModal = closeTelegramAuthModal;
window.generateTelegramQR = generateTelegramQR;
window.initTelegramLoginWidget = initTelegramLoginWidget;
window.showEmailAuthModal = showEmailAuthModal;
window.switchToTelegramAuth = switchToTelegramAuth;
window.switchToEmailAuth = switchToEmailAuth;
window.showReferralModal = showReferralModal;
window.getCurrentUserId = getCurrentUserId;
window.getUserNickname = getUserNickname;
window.getUserLocation = getUserLocation;
window.getUserData = getUserData;
window.loadUserData = loadUserData;
window.showEmailForm = showEmailForm;
window.handleEmailSubmit = handleEmailSubmit;
window.ensureAuthModalVisibility = ensureAuthModalVisibility;
window.checkAndHandleAuthReturn = checkAndHandleAuthReturn;

console.log('✅ Модуль auth-modals.js инициализирован');
