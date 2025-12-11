/**
 * Модуль авторизации и управления пользователем (auth.js)
 * 
 * Функции:
 * - Проверка Telegram авторизации
 * - Инициализация пользователя в базе данных
 * - Управление никнеймом пользователя
 * - Вспомогательные функции авторизации
 */

console.log('🔐 [AUTH] Инициализация модуля авторизации');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */
// currentUserLocation определена в location.js
let currentUserNickname = null;

/**
 * ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ
 */

/**
 * Получить ID текущего пользователя
 * Возвращает user_token (предпочтительно) или Telegram ID
 */
function getCurrentUserId() {
    // Первый приоритет: user_token (для всех пользователей)
    const userToken = localStorage.getItem('user_token');
    if (userToken && userToken !== 'null' && userToken !== 'undefined') {
        return userToken;
    }
    
    // Второй приоритет: Telegram ID (для Telegram пользователей)
    const tgId = tg?.initDataUnsafe?.user?.id;
    if (tgId) {
        return tgId;
    }
    
    // Третий приоритет: сохранённый user_id (fallback для старых браузеров)
    const userId = localStorage.getItem('user_id');
    if (userId && userId !== 'null' && userId !== 'undefined') {
        return userId;
    }
    
    // Если ничего нет - возвращаем web_ идентификатор для неавторизованных
    return 'web_' + (Math.random().toString(36).substring(2, 11));
}

/**
 * Проверка авторизации в Telegram
 */
async function checkTelegramAuth() {
    console.log('🔐 [AUTH] Начало проверки Telegram авторизации');
    
    try {
        // Проверяем есть ли данные от Telegram WebApp
        const tgUser = tg?.initDataUnsafe?.user;
        
        if (tgUser && tgUser.id) {
            console.log('✅ [AUTH] Telegram пользователь найден:', {
                id: tgUser.id,
                firstName: tgUser.first_name,
                username: tgUser.username
            });
            
            // Сохраняем данные в localStorage
            localStorage.setItem('telegram_user', JSON.stringify(tgUser));
            localStorage.setItem('user_id', tgUser.id.toString());
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            
            // Скрываем модальное окно авторизации
            const modal = document.getElementById('telegramAuthModal');
            if (modal) modal.style.display = 'none';
            
            return true;
        }
        
        // Проверяем сохранённые данные авторизации
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            console.log('✅ [AUTH] Telegram пользователь восстановлен из localStorage');
            return true;
        }
        
        // Проверяем email пользователя
        const userToken = localStorage.getItem('user_token');
        if (userToken && userToken !== 'null') {
            console.log('✅ [AUTH] Email пользователь авторизован (токен найден)');
            return true;
        }
        
        console.log('⚠️ [AUTH] Авторизация не найдена');
        return false;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка проверки авторизации:', error);
        return false;
    }
}

/**
 * Инициализация пользователя в базе данных
 */
async function initializeUserInDatabase() {
    try {
        console.log('🔄 [AUTH] Инициализация пользователя в БД');
        
        // Пытаемся получить user_token
        let userToken = localStorage.getItem('user_token');
        
        // Если токена нет, создаём новый через API
        if (!userToken || userToken === 'null' || userToken === 'undefined') {
            console.log('📝 [AUTH] Токен отсутствует, запрашиваем новый...');
            
            const tgUser = tg?.initDataUnsafe?.user;
            const payload = {
                action: 'initialize',
                params: {}
            };
            
            // Если это Telegram пользователь, передаём его ID
            if (tgUser && tgUser.id) {
                payload.params.tg_id = tgUser.id;
                payload.params.tg_username = tgUser.username;
                payload.params.tg_first_name = tgUser.first_name;
                console.log('📱 [AUTH] Инициализация Telegram пользователя:', tgUser.id);
            }
            
            const response = await fetch('/api/user-init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.error) {
                console.error('❌ [AUTH] Ошибка инициализации:', result.error);
                return false;
            }
            
            // Сохраняем полученный токен
            userToken = result.data?.user_token || result.data?.token;
            if (userToken) {
                localStorage.setItem('user_token', userToken);
                console.log('✅ [AUTH] Токен создан и сохранён:', userToken.substring(0, 16) + '...');
            }
        } else {
            console.log('✅ [AUTH] Токен уже существует:', userToken.substring(0, 16) + '...');
        }
        
        // Отправляем heartbeat для обновления активности
        if (userToken) {
            try {
                await fetch('/api/user-init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'heartbeat',
                        params: { user_token: userToken }
                    })
                });
                console.log('💓 [AUTH] Heartbeat отправлен');
            } catch (e) {
                console.warn('⚠️ [AUTH] Ошибка heartbeat:', e.message);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Критическая ошибка инициализации пользователя:', error);
        return false;
    }
}

/**
 * Инициализация никнейма пользователя
 */
async function initializeNickname() {
    try {
        console.log('👤 [AUTH] Инициализация никнейма');
        
        // Проверяем сохранённый никнейм в localStorage
        const savedNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname');
        console.log('🔍 [AUTH] savedNickname:', savedNickname);
        
        // Проверяем реальный никнейм в БД через API
        const tgId = tg?.initDataUnsafe?.user?.id;
        const userToken = localStorage.getItem('user_token');
        console.log('🔍 [AUTH] tgId:', tgId, 'userToken:', userToken ? 'есть' : 'нет');
        let realNickname = null;
        
        // Если есть tgId или userToken - проверяем никнейм в БД
        if (tgId || userToken) {
            try {
                let url = '/api/users?';
                if (tgId) {
                    url += `tgId=${tgId}`;
                    console.log('🔍 [AUTH] Ищем по tgId:', tgId);
                } else if (userToken) {
                    url += `userToken=${userToken}`;
                    console.log('🔍 [AUTH] Ищем по userToken:', userToken.substring(0, 16) + '...');
                }
                
                console.log('🔍 [AUTH] Запрос никнейма:', url);
                const response = await fetch(url);
                console.log('🔍 [AUTH] Response status:', response.status);
                
                // Если пользователь не найден в БД - очищаем localStorage и редирект
                if (response.status === 404) {
                    console.error('❌ [AUTH] Пользователь не найден в БД, очищаем localStorage');
                    localStorage.clear();
                    alert('Ваша сессия устарела. Пожалуйста, авторизуйтесь заново.');
                    window.location.href = '/';
                    return false;
                }
                
                const result = await response.json();
                console.log('🔍 [AUTH] Ответ API:', JSON.stringify(result));
                
                if (result.success && result.displayNickname) {
                    realNickname = result.displayNickname;
                    // Синхронизируем с localStorage
                    localStorage.setItem('user_nickname', realNickname);
                    localStorage.setItem('userNickname', realNickname);
                    currentUserNickname = realNickname;
                    console.log('✅ [AUTH] Никнейм загружен из БД:', realNickname);
                } else {
                    console.warn('⚠️ [AUTH] API не вернул никнейм');
                }
            } catch (error) {
                console.error('❌ [AUTH] Ошибка загрузки никнейма из БД:', error);
            }
        } else {
            console.warn('⚠️ [AUTH] Нет ни tgId, ни userToken для проверки никнейма');
            return false;
        }
        
        // Если никнейма нет ни в БД, ни в localStorage - показываем модальное окно
        console.log('🔍 [AUTH] Проверка: realNickname=', realNickname, 'savedNickname=', savedNickname);
        if (!realNickname && (!savedNickname || savedNickname === 'Аноним')) {
            console.log('⚠️ [AUTH] Никнейм не установлен - показываем модальное окно');
            await showRequiredNicknameModal();
        } else {
            console.log('✅ [AUTH] Никнейм уже установлен:', realNickname || savedNickname);
            currentUserNickname = realNickname || savedNickname;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка инициализации никнейма:', error);
        return false;
    }
}

/**
 * Показать модальное окно для выбора обязательного никнейма
 */
async function showRequiredNicknameModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('requiredNicknameModal');
        const input = document.getElementById('requiredNicknameInput');
        const btn = document.getElementById('requiredNicknameBtn');
        const terms = document.getElementById('agreeTermsCheckbox');
        
        if (!modal || !input || !btn) {
            console.error('❌ [AUTH] Элементы модального окна не найдены');
            resolve(false);
            return;
        }
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
        
        // Обработчик кнопки
        const handleConfirm = async () => {
            const nickname = input.value.trim();
            
            // Валидация
            if (!nickname || nickname.length < 3) {
                tg.showAlert('Никнейм должен содержать минимум 3 символа');
                return;
            }
            
            if (nickname.length > 20) {
                tg.showAlert('Никнейм не должен превышать 20 символов');
                return;
            }
            
            // Проверяем согласие с условиями
            if (terms && !terms.checked) {
                tg.showAlert('Пожалуйста, согласитесь с условиями использования');
                return;
            }
            
            // Сохраняем никнейм
            await saveRequiredNickname(nickname);
            modal.style.display = 'none';
            resolve(true);
        };
        
        // Удаляем старый обработчик и добавляем новый
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = handleConfirm;
        
        // Также разрешаем подтверждение через Enter
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handleConfirm();
            }
        };
    });
}

/**
 * Сохранить никнейм пользователя
 */
async function saveRequiredNickname(nickname) {
    try {
        const userToken = localStorage.getItem('user_token');
        
        // Сохраняем локально
        localStorage.setItem('userNickname', nickname);
        currentUserNickname = nickname;
        
        console.log('✅ [AUTH] Никнейм сохранён:', nickname);
        
        // Отправляем на сервер для синхронизации
        if (userToken) {
            try {
                const response = await fetch('/api/user-init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update-nickname',
                        params: { 
                            user_token: userToken,
                            nickname: nickname
                        }
                    })
                });
                
                const result = await response.json();
                if (result.error) {
                    console.warn('⚠️ [AUTH] Ошибка синхронизации никнейма:', result.error);
                } else {
                    console.log('✅ [AUTH] Никнейм синхронизирован с сервером');
                }
            } catch (error) {
                console.warn('⚠️ [AUTH] Ошибка отправки никнейма на сервер:', error);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка сохранения никнейма:', error);
        return false;
    }
}

/**
 * Получить никнейм текущего пользователя
 */
function getUserNickname() {
    // Сначала проверяем память
    if (currentUserNickname) {
        return currentUserNickname;
    }
    
    // Затем проверяем localStorage
    const saved = localStorage.getItem('userNickname');
    if (saved && saved.trim() !== '') {
        currentUserNickname = saved;
        return saved;
    }
    
    // Fallback наUsername из Telegram
    const tgUsername = tg?.initDataUnsafe?.user?.username;
    if (tgUsername) {
        return '@' + tgUsername;
    }
    
    // Если ничего нет
    return 'Аноним';
}

/**
 * Выход из системы / очистка авторизации
 */
function logout() {
    console.log('🚪 [AUTH] Выход из системы');
    
    // Очищаем localStorage
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('user_email');
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('auth_method');
    
    // Очищаем глобальные переменные
    currentUserNickname = null;
    
    // Перезагружаем страницу
    window.location.reload();
}

/**
 * Проверка авторизации
 */
function isUserAuthorized() {
    const userToken = localStorage.getItem('user_token');
    const tgUser = localStorage.getItem('telegram_user');
    
    return (userToken && userToken !== 'null') || !!tgUser;
}

/**
 * Получить информацию о текущем пользователе
 */
function getCurrentUserInfo() {
    return {
        id: getCurrentUserId(),
        token: localStorage.getItem('user_token'),
        nickname: getUserNickname(),
        authorized: isUserAuthorized(),
        email: localStorage.getItem('user_email'),
        telegram_id: tg?.initDataUnsafe?.user?.id
    };
}

/**
 * Обработка выхода из аккаунта
 */
function handleLogout() {
    const isAndroid = navigator.userAgent.includes('Android');
    const authMethod = localStorage.getItem('auth_method');
    
    let confirmText = 'Вы уверены, что хотите выйти из аккаунта?';
    if (isAndroid || authMethod === 'email') {
        confirmText += '\n\nВам потребуется заново авторизоваться через email.';
    } else {
        confirmText += '\n\nВам потребуется заново авторизоваться через Telegram.';
    }
    
    if (!confirm(confirmText)) {
        return;
    }
    
    console.log('🚪 Выход из аккаунта...');
    
    // Очищаем все данные авторизации
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_auth_time');
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('user_nickname');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('user_token');
    localStorage.removeItem('auth_method');
    localStorage.removeItem('user_email');
    localStorage.removeItem('auth_time');
    localStorage.removeItem('user_id');
    localStorage.removeItem('is_premium');
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_step');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_tg_id');
    localStorage.removeItem('last_fetch_time');
    localStorage.removeItem('chat_messages');
    
    // Очищаем все ключи связанные с опросами
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('poll_voted_')) {
            localStorage.removeItem(key);
        }
    });
    
    // Закрываем гамбургер меню
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    }
    
    // Для Android - перезагружаем (MainActivity проверит отсутствие user_token)
    if (isAndroid) {
        console.log('📱 Android: reloading to trigger native auth flow...');
        window.location.reload();
    } else {
        // Для браузера - показываем нужное модальное окно авторизации
        setTimeout(() => {
            if (authMethod === 'email' || localStorage.getItem('user_email')) {
                if (typeof showEmailAuthModal === 'function') {
                    showEmailAuthModal();
                }
            } else {
                if (typeof showTelegramAuthModal === 'function') {
                    showTelegramAuthModal();
                }
            }
            console.log('✅ Выход выполнен, показано модальное окно авторизации');
        }, 300);
    }
}

/**
 * Алиас для logout
 */
function logout() {
    handleLogout();
}

/**
 * Обновить отображение кнопки выхода
 */
function updateLogoutButtonVisibility() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Проверяем реальную Telegram авторизацию (через WebApp)
    const hasRealTelegramAuth = !!(window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
    const authMethod = localStorage.getItem('auth_method');
    const hasEmailAuth = authMethod === 'email' || !!localStorage.getItem('user_email');
    const hasLoginWidget = !!localStorage.getItem('telegram_user');
    const hasUserToken = !!localStorage.getItem('user_token');
    const isAndroid = navigator.userAgent.includes('Android');

    // Показываем кнопку для браузерной авторизации (email или login widget)
    if ((isAndroid && hasEmailAuth) || (!hasRealTelegramAuth && (hasEmailAuth || hasLoginWidget || hasUserToken))) {
        logoutBtn.style.display = 'flex';
    } else {
        // В Telegram WebApp кнопка выхода не нужна (встроенная авторизация)
        logoutBtn.style.display = 'none';
    }
}

/**
 * Сохранить никнейм со страницы настроек
 */
async function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (!nicknameInputPage) return;
    
    let nickname = nicknameInputPage.value.trim();
    
    if (!nickname) {
        tg.showAlert('❌ Никнейм не может быть пустым');
        return;
    }
    
    let tgIdAuth = null;
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    const isAndroid = navigator.userAgent.includes('Android');
    const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
    
    if (authMethod === 'email' || (isAndroid && userToken)) {
        tgIdAuth = 99999999;
    } else if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        tgIdAuth = Number(window.Telegram.WebApp.initDataUnsafe.user.id);
    } else {
        const savedUserJson = localStorage.getItem('telegram_user');
        if (savedUserJson) {
            try {
                const u = JSON.parse(savedUserJson);
                if (u?.id) tgIdAuth = Number(u.id);
            } catch (e) {}
        }
    }

    if (!tgIdAuth) {
        tg.showAlert('❌ Не удалось получить данные авторизации');
        return;
    }

    try {
        const payload = { tgId: tgIdAuth, nickname: nickname };
        if (userToken) payload.userToken = userToken;
        
        const response = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            tg.showAlert(result.error || 'Ошибка сохранения никнейма');
            return;
        }
        
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('userNickname', nickname);
        
        const header = document.getElementById('nicknameHeader');
        if (header) header.textContent = nickname;
        
        tg.showAlert('✅ Никнейм сохранён!');
        
    } catch (error) {
        console.error('Ошибка сохранения никнейма:', error);
        tg.showAlert('Ошибка: ' + error.message);
    }
}

// Экспорт функций для onclick
window.getCurrentUserId = getCurrentUserId;
window.checkTelegramAuth = checkTelegramAuth;
window.initializeUserInDatabase = initializeUserInDatabase;
window.initializeNickname = initializeNickname;
window.showRequiredNicknameModal = showRequiredNicknameModal;
window.saveRequiredNickname = saveRequiredNickname;
window.getUserNickname = getUserNickname;
window.logout = logout;
window.isUserAuthorized = isUserAuthorized;
window.getCurrentUserInfo = getCurrentUserInfo;
window.handleLogout = handleLogout;
window.updateLogoutButtonVisibility = updateLogoutButtonVisibility;
window.saveNicknamePage = saveNicknamePage;

console.log('✅ [AUTH] Модуль авторизации инициализирован');
