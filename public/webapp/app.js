// Инициализация Telegram Web App с безопасными fallback методами
let tg = window.Telegram?.WebApp || {
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    MainButton: {
        setText: () => {},
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    BackButton: {
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    initDataUnsafe: {
        user: null
    },
    ready: () => {},
    close: () => {}
};

// Безопасная обертка для showAlert с fallback на alert()
// Сохраняем оригинальные методы
const originalShowAlert = tg.showAlert ? tg.showAlert.bind(tg) : null;
const originalShowPopup = tg.showPopup ? tg.showPopup.bind(tg) : null;

// Безопасная обертка для showPopup с fallback на showAlert
tg.showPopup = function(params, callback) {
    // Проверяем версию и наличие метода
    const version = parseFloat(tg.version || '6.0');
    if (version >= 6.2 && originalShowPopup) {
        try {
            originalShowPopup(params, callback);
            return;
        } catch (e) {
            console.warn('showPopup failed:', e.message);
        }
    }
    
    // Fallback: используем оригинальный showAlert напрямую
    const message = params.message || params.title || 'Уведомление';
    if (originalShowAlert) {
        try {
            originalShowAlert(message, callback);
        } catch (e) {
            alert(message);
            if (callback) setTimeout(callback, 0);
        }
    } else {
        alert(message);
        if (callback) setTimeout(callback, 0);
    }
};

// Проверка, запущено ли приложение в Telegram
// Проверяем не только наличие объекта Telegram.WebApp, но и что есть платформа или initData
const isTelegramWebApp = !!(
    window.Telegram?.WebApp && 
    typeof window.Telegram.WebApp === 'object' &&
    (window.Telegram.WebApp.platform !== 'unknown' || window.Telegram.WebApp.initData)
);
console.log('🔍 Проверка Telegram WebApp:');
console.log('  - window.Telegram:', !!window.Telegram);
console.log('  - window.Telegram.WebApp:', !!window.Telegram?.WebApp);
console.log('  - platform:', window.Telegram?.WebApp?.platform);
console.log('  - initData:', window.Telegram?.WebApp?.initData);
console.log('  - initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
console.log('  - isTelegramWebApp:', isTelegramWebApp);

if (isTelegramWebApp) {
    console.log('✅ Запущено в Telegram WebApp, расширяем окно');
    tg.expand();
    tg.ready();
} else {
    console.log('⚠️ НЕ запущено в Telegram WebApp');
}

// Debug панель для отладки (показываем первые 5 секунд)
// Debug панель
let debugPanelVisible = false;
let debugPanel = null;

function toggleDebugPanel() {
    if (debugPanelVisible) {
        hideDebugPanel();
    } else {
        showDebugPanel();
    }
}

function showDebugPanel() {
    if (debugPanel && debugPanel.parentNode) {
        debugPanel.style.display = 'block';
        debugPanelVisible = true;
        return;
    }
    
    debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 10px;
        width: 90%;
        max-width: 400px;
        background: rgba(0,0,0,0.95);
        color: #00ff00;
        padding: 15px;
        font-family: monospace;
        font-size: 11px;
        z-index: 100000;
        max-height: 400px;
        overflow-y: auto;
        border: 2px solid #00ff00;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    
    updateDebugInfo();
    document.body.appendChild(debugPanel);
    debugPanelVisible = true;
}

function hideDebugPanel() {
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
    debugPanelVisible = false;
}

function updateDebugInfo() {
    if (!debugPanel) return;
    
    const currentUserId = getCurrentUserId();
    const userLocation = localStorage.getItem('userLocation');
    const parsedLocation = userLocation ? JSON.parse(userLocation) : null;
    
    const info = {
        '🔐 АВТОРИЗАЦИЯ': '━━━━━━━━━━━━━━━━',
        'isTelegramWebApp': isTelegramWebApp,
        'window.Telegram': !!window.Telegram,
        'tg exists': !!tg,
        'platform': tg?.platform || '❌ НЕТ',
        'initData length': tg?.initData?.length || 0,
        'user.id (initData)': tg?.initDataUnsafe?.user?.id || '❌ НЕТ',
        'getCurrentUserId()': currentUserId,
        'isAuthorized': !currentUserId.startsWith('web_') ? '✅ ДА' : '❌ НЕТ (веб ID)',
        
        '👤 ПРОФИЛЬ': '━━━━━━━━━━━━━━━━',
        'first_name': tg?.initDataUnsafe?.user?.first_name || '❌',
        'username': tg?.initDataUnsafe?.user?.username || '❌',
        'is_premium': tg?.initDataUnsafe?.user?.is_premium ? '⭐ ДА' : '❌',
        'nickname': document.getElementById('nicknameInput')?.value || localStorage.getItem('user_nickname') || '❌ НЕТ',
        
        '📍 ЛОКАЦИЯ': '━━━━━━━━━━━━━━━━',
        'country': parsedLocation?.country || '❌ НЕТ',
        'region': parsedLocation?.region || '❌ НЕТ',
        'city': parsedLocation?.city || '❌ НЕТ',
        'location saved': userLocation ? '✅ ЕСТЬ' : '❌ НЕТ',
        
        '💾 STORAGE': '━━━━━━━━━━━━━━━━',
        'localStorage user': localStorage.getItem('telegram_user') ? '✅ ЕСТЬ' : '❌ НЕТ',
        'localStorage nickname': localStorage.getItem('user_nickname') || '❌ НЕТ',
        'CloudStorage available': tg.CloudStorage ? '✅ ДА' : '❌ НЕТ',
        
        '🖥️ СОСТОЯНИЕ': '━━━━━━━━━━━━━━━━',
        'currentScreen': document.querySelector('.screen.active')?.id || 'unknown',
        'currentStep': currentStep + '/' + totalSteps,
        'window.currentAds': window.currentAds?.length || 0,
        
        '🔑 ДЕТАЛИ initDataUnsafe': '━━━━━━━━━━━━━━━━',
        'Full initDataUnsafe': JSON.stringify(tg?.initDataUnsafe || {}, null, 2)
    };
    
    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
            <b style="color: #00ff00; font-size: 14px;">� DEBUG PANEL</b>
            <button onclick="updateDebugInfo()" style="background: #00ff00; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: bold;">🔄 Обновить</button>
        </div>
        ${Object.entries(info).map(([k, v]) => {
            const isSection = v === '━━━━━━━━━━━━━━━━';
            if (isSection) {
                return `<div style="margin: 15px 0 8px 0; padding-top: 8px; border-top: 1px solid #00ff00;"><b style="color:#00ff00; font-size: 12px;">${k}</b></div>`;
            }
            const valueColor = v.toString().includes('✅') ? '#0f0' : v.toString().includes('❌') ? '#f80' : v.toString().includes('⭐') ? '#ff0' : '#fff';
            return `<div style="margin-bottom: 5px; padding-left: 8px;"><span style="color:#00aaff; font-size: 10px;">${k}:</span> <span style="color: ${valueColor}; font-size: 11px;">${v}</span></div>`;
        }).join('')}
    `;
}

// Создаем кнопку Debug
function createDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debugButton';
    debugBtn.innerHTML = '🐛';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00ff00, #00aa00);
        border: 2px solid #00ff00;
        color: #000;
        font-size: 24px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    debugBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.8)';
    });
    
    debugBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    });
    
    debugBtn.onclick = toggleDebugPanel;
    
    document.body.appendChild(debugBtn);
    console.log('✅ Debug кнопка создана');
}

// Данные формы
let formData = {};
let currentStep = 1;
const totalSteps = 7; // Убрали шаг с никнеймом - теперь он на главной странице

// Инициализация приложения
// Функция инициализации, которая вызывается когда DOM готов
function initializeApp() {
    console.log('🚀 Начало инициализации приложения');
    
    try {
        initializeTelegramWebApp();
        console.log('✅ Telegram WebApp инициализирован');
    } catch (e) {
        console.error('❌ Ошибка инициализации Telegram WebApp:', e);
    }
    
    // Debug кнопка отключена в продакшене
    // createDebugButton();
    
    // Задержка перед проверкой авторизации, чтобы Telegram успел передать initDataUnsafe
    setTimeout(() => {
        console.log('⏰ Начинаем проверку авторизации через 300ms');
        
        try {
            checkTelegramAuth(); // Проверка авторизации
            console.log('✅ checkTelegramAuth выполнен');
        } catch (e) {
            console.error('❌ Ошибка checkTelegramAuth:', e);
        }
        
        try {
            initializeNickname(); // Инициализация никнейма
        } catch (e) {
            console.error('❌ Ошибка initializeNickname:', e);
        }
        
        try {
            updateChatBadge(); // Первое обновление счетчика
        } catch (e) {
            console.error('❌ Ошибка updateChatBadge:', e);
        }
        
        try {
            markMessagesAsDelivered(); // Помечаем сообщения как доставленные
        } catch (e) {
            console.error('❌ Ошибка markMessagesAsDelivered:', e);
        }
        
        try {
            updateLogoutButtonVisibility(); // Обновление кнопки выхода
        } catch (e) {
            console.error('❌ Ошибка updateLogoutButtonVisibility:', e);
        }
    }, 300);
    
    try {
        checkUserLocation();
    } catch (e) {
        console.error('❌ Ошибка checkUserLocation:', e);
    }
    
    try {
        setupEventListeners();
    } catch (e) {
        console.error('❌ Ошибка setupEventListeners:', e);
    }
    
    try {
        setupContactsEventListeners();
    } catch (e) {
        console.error('❌ Ошибка setupContactsEventListeners:', e);
    }
    
    // Периодическое обновление счетчика новых запросов (каждые 30 секунд)
    setInterval(() => {
        try {
            updateChatBadge();
        } catch (e) {
            console.error('❌ Ошибка updateChatBadge в интервале:', e);
        }
    }, 30000);
    
    // Добавляем обработчик видимости страницы
    // Если пользователь вернулся после сканирования QR
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Страница стала видимой, повторная проверка авторизации');
            // Проверяем авторизацию еще раз
            setTimeout(() => {
                try {
                    checkTelegramAuth();
                    updateChatBadge(); // Обновляем счетчик при возврате
                } catch (e) {
                    console.error('❌ Ошибка при повторной проверке:', e);
                }
            }, 500);
        }
    });
    
    // Обработчик сообщений от всплывающего окна авторизации
    window.addEventListener('message', function(event) {
        // Проверяем источник сообщения
        if (event.origin !== window.location.origin) {
            return;
        }
        
        // Обработка успешной авторизации через Login Widget
        if (event.data && event.data.type === 'telegram_auth' && event.data.user) {
            console.log('✅ Получены данные авторизации от всплывающего окна:', event.data.user);
            
            // Сохраняем данные
            localStorage.setItem('telegram_user', JSON.stringify(event.data.user));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            
            // Закрываем модальное окно
            const modal = document.getElementById('telegramAuthModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Показываем уведомление
            alert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${event.data.user.first_name}!`);
            
            // Обновляем кнопку выхода
            updateLogoutButtonVisibility();
            
            // Перезагружаем страницу
            location.reload();
        }
    });
}

// Проверяем готовность DOM и запускаем инициализацию
if (document.readyState === 'loading') {
    console.log('📄 DOM загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('📄 DOM уже загружен, запускаем инициализацию немедленно');
    initializeApp();
}

function initializeTelegramWebApp() {
    // Настройка темы
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Настройка главной кнопки
    tg.MainButton.setText('Главное меню');
    tg.MainButton.onClick(() => showMainMenu());
    
    // Настройка кнопки назад
    tg.BackButton.onClick(() => handleBackButton());
    
    // Показываем предупреждение если не в Telegram
    if (!isTelegramWebApp) {
        console.warn('⚠️ Приложение запущено вне Telegram WebApp. Некоторые функции недоступны.');
        
        // Показываем уведомление через 2 секунды
        setTimeout(() => {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 153, 0, 0.95);
                color: #000;
                padding: 15px 25px;
                border-radius: 10px;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(255, 153, 0, 0.3);
                max-width: 90%;
                text-align: center;
            `;
            warning.innerHTML = '⚠️ Для полного функционала откройте через Telegram бота<br><small>Функция приватных чатов будет ограничена</small>';
            document.body.appendChild(warning);
            
            // Удаляем через 7 секунд
            setTimeout(() => warning.remove(), 7000);
        }, 2000);
    }
    
    console.log('Telegram Web App initialized');
}

// Проверка авторизации через Telegram
function checkTelegramAuth() {
    console.log('🔐 Проверка авторизации...');
    console.log('  📊 Детальная диагностика:');
    console.log('    - isTelegramWebApp:', isTelegramWebApp);
    console.log('    - tg:', tg);
    console.log('    - tg.initDataUnsafe:', tg.initDataUnsafe);
    console.log('    - tg.initDataUnsafe?.user:', tg.initDataUnsafe?.user);
    console.log('    - tg.initDataUnsafe?.user?.id:', tg.initDataUnsafe?.user?.id);
    
    // Если запущено через Telegram WebApp, авторизация автоматическая
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        const userData = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
            photo_url: tg.initDataUnsafe.user.photo_url
        };
        
        console.log('✅ Данные пользователя получены:', userData);
        
        // Проверяем, была ли уже авторизация
        const savedUser = localStorage.getItem('telegram_user');
        const isNewAuth = !savedUser || JSON.stringify(userData) !== savedUser;
        
        // Сохраняем в localStorage
        localStorage.setItem('telegram_user', JSON.stringify(userData));
        localStorage.setItem('telegram_auth_time', Date.now().toString());
        console.log('✅ Авторизован через Telegram WebApp:', userData);
        
        // Закрываем модальное окно если оно было открыто
        const modal = document.getElementById('telegramAuthModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('✅ Модальное окно авторизации закрыто');
            
            // Если это новая авторизация (вернулись из бота), показываем уведомление
            if (isNewAuth) {
                // Даем время модальному окну закрыться
                setTimeout(() => {
                    tg.showAlert(`✅ Добро пожаловать, ${userData.first_name}!\n\nТеперь вы можете пользоваться всеми функциями приложения.`);
                }, 300);
            }
        }
        
        return true;
    }
    
    console.log('⚠️ Telegram авторизация недоступна');
    console.log('  - Причина: isTelegramWebApp=' + isTelegramWebApp + ', user.id=' + (tg.initDataUnsafe?.user?.id || 'null'));
    
    // Проверяем сохранённые данные из предыдущей сессии
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            console.log('✅ Найдена сохранённая авторизация:', userData);
            // Проверяем, не истекла ли авторизация (опционально)
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            // Авторизация действительна 30 дней
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                console.log('✅ Авторизация действительна');
                
                // Закрываем модальное окно если оно было открыто
                const modal = document.getElementById('telegramAuthModal');
                if (modal) {
                    modal.style.display = 'none';
                    console.log('✅ Модальное окно авторизации закрыто (сохранённая сессия)');
                }
                
                return true;
            } else {
                console.log('⚠️ Авторизация истекла');
            }
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
            localStorage.removeItem('telegram_user');
        }
    }
    
    // Если нет авторизации - показываем модальное окно
    console.log('❌ Пользователь не авторизован, показываем модальное окно');
    
    // Задержка для уверенности что DOM загружен
    setTimeout(() => {
        showTelegramAuthModal();
        
        // Дополнительная проверка через 1 секунду
        setTimeout(() => {
            const modal = document.getElementById('telegramAuthModal');
            if (modal) {
                const computedStyle = window.getComputedStyle(modal);
                console.log('🔍 Проверка видимости модального окна:');
                console.log('  - display:', computedStyle.display);
                console.log('  - visibility:', computedStyle.visibility);
                console.log('  - opacity:', computedStyle.opacity);
                console.log('  - zIndex:', computedStyle.zIndex);
                
                // Если модальное окно скрыто - принудительно показываем
                if (computedStyle.display === 'none') {
                    console.warn('⚠️ Модальное окно скрыто! Принудительно показываем...');
                    modal.style.display = 'flex';
                }
            } else {
                console.error('❌ Модальное окно не найдено в DOM!');
            }
        }, 1000);
    }, 100);
    
    return false;
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С НИКНЕЙМОМ =====

// Инициализация никнейма при загрузке приложения
function initializeNickname() {
    console.log('🎭 Инициализация никнейма...');
    
    // Проверяем сохранённый никнейм, если нет - устанавливаем "Аноним"
    const savedNickname = localStorage.getItem('user_nickname');
    
    if (!savedNickname) {
        localStorage.setItem('user_nickname', 'Аноним');
        console.log('✅ Установлен никнейм по умолчанию: Аноним');
    } else {
        console.log('✅ Загружен сохранённый никнейм:', savedNickname);
    }
}

// ===== СТРАНИЦА РЕДАКТИРОВАНИЯ НИКНЕЙМА =====

// Показать страницу редактирования никнейма (из гамбургер-меню)
function showNicknameEditorScreen() {
    closeHamburgerMenu();
    showScreen('nicknameEditScreen');
    
    // Обновляем отображение текущего никнейма
    const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    const savedNickname = localStorage.getItem('user_nickname') || 'Аноним';
    
    if (currentNicknameDisplay) {
        currentNicknameDisplay.textContent = savedNickname;
    }
    
    if (nicknameInputPage) {
        nicknameInputPage.value = savedNickname;
        setTimeout(() => nicknameInputPage.focus(), 300);
    }
    
    // Обновляем текст кнопки использования имени из Telegram
    updateTelegramNameButton();
}

// Обновить текст кнопки с именем из Telegram
function updateTelegramNameButton() {
    let telegramName = 'Аноним';
    
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
    const defaultNicknameTextPage = document.getElementById('defaultNicknameTextPage');
    if (defaultNicknameTextPage) {
        defaultNicknameTextPage.textContent = `Использовать: "${telegramName}"`;
    }
}

// Использовать имя из Telegram на странице редактирования
function useDefaultNicknamePage() {
    let telegramName = 'Аноним';
    
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    if (nicknameInputPage) {
        nicknameInputPage.value = telegramName;
    }
}

// Сбросить никнейм на "Аноним"
function resetToAnonym() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    if (nicknameInputPage) {
        nicknameInputPage.value = 'Аноним';
    }
}

// Сохранить никнейм со страницы редактирования
function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (nicknameInputPage) {
        let nickname = nicknameInputPage.value.trim();
        
        if (!nickname) {
            nickname = 'Аноним';
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('user_nickname', nickname);
        console.log('✅ Никнейм сохранён:', nickname);
        
        // Показываем уведомление и возвращаемся на главную
        if (isTelegramWebApp) {
            tg.showPopup({
                title: '✅ Сохранено',
                message: `Ваш новый псевдоним: "${nickname}"`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        // Возвращаемся на главную страницу
        setTimeout(() => {
            showMainMenu();
        }, 300);
    }
}

// Закрыть гамбургер-меню и вернуться на главную
function closeHamburgerAndGoHome() {
    closeHamburgerMenu();
    showMainMenu();
}

// УСТАРЕВШИЕ ФУНКЦИИ (удалим позже)
// Показать редактор никнейма (старая версия - не используется)
function showNicknameEditor() {
    // Теперь открываем страницу редактирования вместо inline редактора
    showNicknameEditorScreen();
}

// Сохранить никнейм (старая версия - не используется)
function saveNickname() {
    saveNicknamePage();
}

// Отменить редактирование никнейма (старая версия - не используется)
function cancelNicknameEdit() {
    showMainMenu();
}

// Использовать имя из Telegram на главной странице (старая версия - не используется)
function useDefaultNicknameMain() {
    useDefaultNicknamePage();
}

// СТАРАЯ функция для формы (оставляем для совместимости, если где-то используется)
function useDefaultNickname() {
    let telegramName = 'Аноним';
    
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.value = telegramName;
        localStorage.setItem('user_nickname', telegramName);
        
        // Показываем уведомление
        if (isTelegramWebApp) {
            tg.showPopup({
                title: '✅ Установлено',
                message: `Ваш псевдоним: "${telegramName}"`,
                buttons: [{ type: 'ok' }]
            });
        }
    }
}

// Показать модальное окно авторизации
function showTelegramAuthModal() {
    console.log('📱 Показываем модальное окно авторизации');
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) {
        console.error('❌ Модальное окно авторизации не найдено!');
        
        // Создаем временное уведомление если модалка не найдена
        alert('⚠️ Ошибка: Модальное окно авторизации не найдено в DOM!\n\nПопробуйте перезагрузить страницу.');
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
            alert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
        };
    }
    
    // Блокируем кнопку закрытия
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            alert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
            return false;
        };
    }
    
    // Генерируем уникальный auth token для этой сессии
    const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('telegram_auth_token', authToken);
    
    console.log('🔑 Auth token сгенерирован:', authToken);
    
    // Генерируем QR-код
    generateTelegramQR(authToken);
    
    // Login Widget отключен - требует настройки домена в BotFather
    // initTelegramLoginWidget();
    
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
                    console.log('✅ Обнаружена авторизация через Login Widget:', userData);
                    
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
    
    // Показываем загрузку
    if (qrLoading) {
        qrLoading.classList.remove('hidden');
    }
    
    // Создаем deep link для Telegram бота
    // Формат: https://t.me/bot_username?start=auth_token
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
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

// Обработчик Telegram Login Widget
window.onTelegramAuth = function(user) {
    console.log('🔐 Авторизация через Telegram Login Widget:', user);
    
    // Сохраняем данные пользователя
    const userData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || '',
        photo_url: user.photo_url || '',
        auth_date: user.auth_date,
        hash: user.hash
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('telegram_user', JSON.stringify(userData));
    localStorage.setItem('user_id', user.id);
    
    // Показываем успешную авторизацию
    console.log('✅ Авторизация успешна! User ID:', user.id);
    
    // Обновляем интерфейс
    currentUserId = user.id;
    checkAuthStatus();
    
    // Показываем список анкет
    showAdsList();
};

// Закрыть модальное окно (только если пользователь авторизован)
function closeTelegramAuthModal() {
    const savedUser = localStorage.getItem('telegram_user');
    if (!savedUser) {
        alert('Для продолжения использования сайта необходимо авторизоваться через Telegram');
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
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
    
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
    alert(`✅ Вы успешно авторизованы!\n\nДобро пожаловать, ${user.first_name}!\n\nТеперь вы можете создавать анкеты и получать уведомления.`);
    
    // Обновляем кнопку выхода
    updateLogoutButtonVisibility();
    
    // Перезагружаем страницу для применения авторизации
    location.reload();
};

// Получить ID текущего пользователя
function getCurrentUserId() {
    // Если в Telegram WebApp
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // Если авторизован через Login Widget
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            return userData.id?.toString();
        } catch (e) {
            console.error('Ошибка получения ID пользователя:', e);
        }
    }
    
    // Fallback - временный ID
    return 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Получить nickname текущего пользователя
function getUserNickname() {
    // Если в Telegram WebApp
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        // Приоритет: username > first_name > "Анонимный"
        return user.username || user.first_name || 'Анонимный';
    }
    
    // Если авторизован через Login Widget
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            return userData.username || userData.first_name || 'Анонимный';
        } catch (e) {
            console.error('Ошибка получения nickname:', e);
        }
    }
    
    return 'Анонимный';
}

// Получить данные пользователя по ID (для отображения ников собеседников)
function getUserData(userId) {
    // Кешируем данные пользователей в памяти
    if (!window.userDataCache) {
        window.userDataCache = {};
    }
    
    // Возвращаем из кеша если есть
    if (window.userDataCache[userId]) {
        return window.userDataCache[userId];
    }
    
    // Пока возвращаем заглушку
    return {
        id: userId,
        nickname: 'Собеседник'
    };
}

// Функция выхода из аккаунта
function handleLogout() {
    if (!confirm('Вы уверены, что хотите выйти из аккаунта?\n\nВам потребуется заново авторизоваться через Telegram.')) {
        return;
    }
    
    console.log('🚪 Выход из аккаунта...');
    
    // Очищаем все данные авторизации
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_auth_time');
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('user_nickname');
    
    // Закрываем гамбургер меню
    closeHamburgerMenu();
    
    // Показываем модальное окно авторизации
    setTimeout(() => {
        showTelegramAuthModal();
        console.log('✅ Выход выполнен, показано модальное окно авторизации');
    }, 300);
}

// Обновить отображение кнопки выхода (показывать только для браузерной авторизации)
function updateLogoutButtonVisibility() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Показываем кнопку только если пользователь НЕ в Telegram WebApp
    if (!isTelegramWebApp) {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            logoutBtn.style.display = 'flex';
        } else {
            logoutBtn.style.display = 'none';
        }
    } else {
        // В Telegram WebApp кнопка выхода не нужна
        logoutBtn.style.display = 'none';
    }
}

function setupEventListeners() {
    // Кнопки выбора города
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('filter')) {
                handleCityFilter(this.dataset.city);
            } else {
                selectCity(this.dataset.city);
            }
        });
    });

    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Кастомный город
    document.getElementById('customCity').addEventListener('input', function() {
        if (this.value.trim()) {
            clearCitySelection();
            formData.city = this.value.trim();
        }
    });
}

// Навигация между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Обновляем кнопки Telegram
    updateTelegramButtons(screenId);
}

function updateTelegramButtons(screenId) {
    switch(screenId) {
        case 'mainMenu':
            tg.BackButton.hide();
            tg.MainButton.hide();
            break;
        case 'createAd':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
        case 'browseAds':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
        case 'adDetails':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
    }
}

function handleBackButton() {
    const activeScreen = document.querySelector('.screen.active').id;
    
    switch(activeScreen) {
        case 'createAd':
            showMainMenu();
            break;
        case 'browseAds':
            showMainMenu();
            break;
        case 'adDetails':
            showBrowseAds();
            break;
        default:
            showMainMenu();
    }
}

function showMainMenu() {
    showScreen('mainMenu');
    resetForm();
    updateChatBadge(); // Обновляем счетчик запросов
}

function showCreateAd() {
    if (!userLocation) {
        tg.showAlert('Сначала выберите ваш город');
        showLocationSetup();
        return;
    }
    
    // Проверка лимита анкет
    if (userPremiumStatus.limits && userPremiumStatus.limits.ads) {
        const adsLimit = userPremiumStatus.limits.ads;
        if (adsLimit.remaining === 0) {
            if (userPremiumStatus.isPremium) {
                tg.showAlert('Вы уже создали 3 анкеты сегодня (лимит PRO). Попробуйте завтра!');
            } else {
                tg.showConfirm(
                    'Вы уже создали анкету сегодня. Оформите PRO для 3 анкет в день!',
                    (confirmed) => {
                        if (confirmed) showPremiumModal();
                    }
                );
            }
            return;
        }
    }
    
    showScreen('createAd');
    currentStep = 1;
    showStep(1);
    
    // Автоматически заполняем локацию из настроек пользователя
    formData.country = userLocation.country;
    formData.region = userLocation.region;
    formData.city = userLocation.city;
    
    // Отображаем локацию в форме
    updateFormLocationDisplay();
}

// Обновить отображение локации в форме
function updateFormLocationDisplay() {
    if (userLocation) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        const formLocationDisplay = document.getElementById('formLocationDisplay');
        if (formLocationDisplay) {
            formLocationDisplay.textContent = locationText;
        }
    }
}

function showBrowseAds() {
    showScreen('browseAds');
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    if (userLocation && browseLocationDisplay) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем анкеты по локации пользователя
    setTimeout(() => {
        if (userLocation) {
            console.log('Загружаем анкеты по локации:', userLocation);
            loadAdsByLocation(userLocation.country, userLocation.region, userLocation.city);
        } else {
            console.log('Локация не установлена, показываем все анкеты');
            loadAds();
        }
    }, 100);
}

// Показать мои анкеты
// Показать мои анкеты
function showMyAds() {
    showScreen('myAds');
    loadMyAds();
}

// Загрузить мои анкеты
async function loadMyAds() {
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) {
        console.error('❌ Элемент myAdsList не найден!');
        return;
    }
    
    myAdsList.innerHTML = '<div class="loading">Загрузка ваших анкет...</div>';
    
    try {
        const userId = getCurrentUserId();
        console.log('📋 Загрузка анкет для пользователя:', userId);
        
        if (userId.startsWith('web_')) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь через Telegram чтобы видеть свои анкеты</p>
                    <button class="neon-button primary" onclick="showTelegramAuthModal()">
                        Авторизоваться
                    </button>
                </div>
            `;
            return;
        }
        
        const ads = await getAllAds();
        console.log('📋 Всего анкет:', ads.length);
        
        const myAds = ads.filter(ad => ad.tg_id === userId);
        console.log('📋 Мои анкеты:', myAds.length);
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">📭</div>
                    <h3>У вас пока нет анкет</h3>
                    <p>Создайте первое анкете и оно появится здесь</p>
                    <button class="neon-button primary" onclick="showCreateAd()">
                        ✏️ Создать анкете
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем анкеты с кнопками действий
        myAdsList.innerHTML = myAds.map((ad, index) => {
            const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
            const ageFrom = ad.age_from || ad.ageFrom || '?';
            const ageTo = ad.age_to || ad.ageTo || '?';
            
            const authorGender = ad.gender === 'male' ? 'Мужчина' : 'Женщина';
            const authorIcon = ad.gender === 'male' ? '👨' : '👩';
            const targetText = ad.target === 'male' || ad.target === 'мужчину' ? 'мужчину' : 'женщину';
            const targetIcon = ad.target === 'male' || ad.target === 'мужчину' ? '👨' : '👩';
            
            return `
            <div class="ad-card" data-ad-id="${ad.id}">
                ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                <div class="ad-header">
                    <h3>${authorIcon} ${authorGender}, ${ad.my_age || '?'} лет</h3>
                    <span class="ad-date">📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="ad-info">
                    <div class="ad-field">
                        <span class="icon">💪</span>
                        <span><strong>Телосложение:</strong> ${ad.body_type || 'не указано'}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">🎯</span>
                        <span><strong>Цель:</strong> ${ad.goal || 'не указано'}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">${targetIcon}</span>
                        <span><strong>Ищу:</strong> ${targetText}, ${ageFrom}-${ageTo} лет</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">�</span>
                        <span>${locationData[ad.country]?.flag || '🌍'} ${ad.region}, ${ad.city}</span>
                    </div>
                    ${ad.text ? `<div class="ad-field full-width">
                        <span class="icon">�</span>
                        <span><strong>О себе:</strong> ${ad.text}</span>
                    </div>` : ''}
                </div>
                <div class="ad-actions">
                    <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">
                        🗑️ Удалить
                    </button>
                    <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">
                        ${isPinned ? '✖️ Открепить' : '📌 Закрепить (1ч)'}
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        console.log('✅ Мои анкеты отображены');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки моих анкет:', error);
        myAdsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Неизвестная ошибка'}</p>
                <button class="neon-button primary" onclick="loadMyAds()">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
}

// Управление шагами формы
function showStep(step) {
    console.log(`📍 Показываем шаг ${step} из ${totalSteps}`);
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step${step}`);
    
    if (!stepElement) {
        console.error(`❌ Элемент step${step} не найден!`);
        return;
    }
    
    stepElement.classList.add('active');
    console.log(`✅ Шаг ${step} активен`, stepElement);
    
    // Показываем/скрываем контейнер textarea
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 7) {
            textareaContainer.style.display = 'block';
            console.log('✅ Показали контейнер textarea');
            
            // ЯДЕРНАЯ ОПЦИЯ: Удаляем старый textarea и создаём новый с нуля
            let textarea = document.getElementById('adText');
            if (textarea) {
                textarea.remove();
                console.log('🗑️ Удалили старый textarea');
            }
            
            // Создаём textarea динамически
            textarea = document.createElement('textarea');
            textarea.id = 'adText';
            textarea.placeholder = 'Расскажите о себе и что ищете...';
            textarea.rows = 6;
            
            // Применяем стили напрямую
            Object.assign(textarea.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                width: '100%',
                maxWidth: '500px',
                padding: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#e0e0ff',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                height: 'auto',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: '9999',
                margin: '0 auto'
            });
            
            // Вставляем в контейнер
            textareaContainer.innerHTML = '';
            textareaContainer.appendChild(textarea);
            
            // Проверяем через небольшую задержку
            setTimeout(() => {
                const check = document.getElementById('adText');
                console.log('🔍 ДИНАМИЧЕСКИ созданный textarea:', {
                    exists: !!check,
                    display: check?.style.display,
                    visibility: check?.style.visibility,
                    computedDisplay: check ? window.getComputedStyle(check).display : 'n/a',
                    computedVisibility: check ? window.getComputedStyle(check).visibility : 'n/a',
                    offsetHeight: check?.offsetHeight,
                    offsetWidth: check?.offsetWidth,
                    clientHeight: check?.clientHeight,
                    clientWidth: check?.clientWidth
                });
            }, 100);
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    submitBtn.style.display = step === totalSteps ? 'block' : 'none';
    
    console.log('🔘 Кнопки:', {
        prev: prevBtn.style.display,
        next: nextBtn.style.display,
        submit: submitBtn.style.display
    });
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// Функции для контроля возраста
function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max) || 100;
    
    // Если поле пустое, устанавливаем начальное значение 18
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
        validateAgeRange();
    }
}

function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const minValue = parseInt(input.min) || 18;
    
    // Если поле пустое, устанавливаем начальное значение 18
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
        validateAgeRange();
    }
}

function validateAgeRange() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    if (ageFrom && ageTo) {
        const fromValue = parseInt(ageFrom.value) || 18;
        const toValue = parseInt(ageTo.value) || 18;
        
        // Если "от" больше "до", корректируем "до"
        if (fromValue > toValue) {
            ageTo.value = fromValue;
        }
    }
}

function validateCurrentStep() {
    console.log(`🔍 Валидация шага ${currentStep}`, formData);
    
    switch(currentStep) {
        case 1: // Пол
            const hasGender = !!formData.gender;
            console.log(`Шаг 1 (Пол): ${hasGender ? '✅' : '❌'}`, formData.gender);
            return hasGender;
        case 2: // Кого ищет
            const hasTarget = !!formData.target;
            console.log(`Шаг 2 (Кого ищет): ${hasTarget ? '✅' : '❌'}`, formData.target);
            return hasTarget;
        case 3: // Цель
            const hasGoal = !!formData.goal;
            console.log(`Шаг 3 (Цель): ${hasGoal ? '✅' : '❌'}`, formData.goal);
            return hasGoal;
        case 4: // Возраст партнера
            const ageFrom = document.getElementById('ageFrom').value;
            const ageTo = document.getElementById('ageTo').value;
            if (ageFrom && ageTo) {
                formData.ageFrom = ageFrom;
                formData.ageTo = ageTo;
                console.log(`Шаг 4 (Возраст партнера): ✅ ${ageFrom}-${ageTo}`);
                return true;
            }
            console.log(`Шаг 4 (Возраст партнера): ❌`);
            return false;
        case 5: // Мой возраст
            const myAge = document.getElementById('myAge').value;
            if (myAge) {
                formData.myAge = myAge;
                console.log(`Шаг 5 (Мой возраст): ✅ ${myAge}`);
                return true;
            }
            console.log(`Шаг 5 (Мой возраст): ❌`);
            return false;
        case 6: // Телосложение
            const hasBody = !!formData.body;
            console.log(`Шаг 6 (Телосложение): ${hasBody ? '✅' : '❌'}`, formData.body);
            return hasBody;
        case 7: // Текст анкеты
            const adText = document.getElementById('adText')?.value.trim();
            console.log(`Шаг 7 (Текст): textarea элемент:`, document.getElementById('adText'));
            console.log(`Шаг 7 (Текст): значение:`, adText);
            if (adText && adText.length >= 10) {
                formData.text = adText;
                console.log(`Шаг 7 (Текст): ✅ ${adText.length} символов`);
                return true;
            }
            console.log(`Шаг 7 (Текст): ❌ слишком короткий текст`);
            tg.showAlert('Пожалуйста, введите текст анкеты (минимум 10 символов)');
            return false;
    }
    return false;
}

// Обработчики выбора (старые функции удалены - используется новая система локации)

function selectGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-gender="${gender}"]`).classList.add('selected');
    formData.gender = gender;
}

function selectTarget(target) {
    document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-target="${target}"]`).classList.add('selected');
    formData.target = target;
}

function selectGoal(goal) {
    document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-goal="${goal}"]`).classList.add('selected');
    formData.goal = goal;
}

function selectBody(body) {
    document.querySelectorAll('.body-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-body="${body}"]`).classList.add('selected');
    formData.body = body;
}

// Отправка анкеты
async function submitAd() {
    if (!validateCurrentStep()) {
        tg.showAlert('Заполните все поля');
        return;
    }

    try {
        // Получаем текст анкеты
        const adTextElement = document.getElementById('adText');
        const adText = adTextElement ? adTextElement.value.trim() : '';
        
        if (!adText) {
            tg.showAlert('Пожалуйста, введите текст анкеты');
            return;
        }
        
        // Получаем никнейм из localStorage (установлен на главной странице)
        const nickname = localStorage.getItem('user_nickname') || 'Аноним';
        
        console.log('📝 Никнейм из localStorage:', nickname);

        // Подготавливаем данные для отправки в Supabase
        const adData = {
            gender: formData.gender,
            target: formData.target,
            goal: formData.goal,
            ageFrom: formData.ageFrom,
            ageTo: formData.ageTo,
            myAge: formData.myAge,
            body: formData.body,
            text: adText,
            nickname: nickname, // Добавляем никнейм
            country: formData.country || 'Россия',
            region: formData.region || '',
            city: formData.city,
            // Используем новую функцию для получения ID
            tgId: getCurrentUserId()
        };

        console.log('Отправка анкеты в Supabase:', adData);
        console.log('Telegram User ID:', getCurrentUserId());
        console.log('Никнейм:', nickname);


        // Показываем индикатор загрузки
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Публикуем...';
        }

        // Отправляем в Supabase через наш API
        const result = await window.SupabaseClient.createAd(adData);
        
        console.log('анкете опубликовано:', result);

        // Обновляем статус Premium (лимиты изменились)
        await loadPremiumStatus();

        // Показываем успех
        tg.showAlert('✅ анкете успешно опубликовано!', () => {
            // Очищаем форму
            formData = {};
            currentStep = 1;
            showScreen('mainMenu');
        });

    } catch (error) {
        console.error('Ошибка создания анкеты:', error);
        
        // Проверяем ошибку лимита
        if (error.message && error.message.includes('лимит')) {
            if (error.message.includes('PRO')) {
                tg.showConfirm(
                    error.message,
                    (confirmed) => {
                        if (confirmed) showPremiumModal();
                    }
                );
            } else {
                tg.showAlert('❌ ' + error.message);
            }
        } else {
            tg.showAlert('❌ Ошибка при публикации анкеты: ' + error.message);
        }
    } finally {
        // Восстанавливаем кнопку
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Опубликовать';
        }
    }
}

// Загрузка и отображение анкет
async function loadAds(filters = {}) {
    try {
        console.log('🔄 Загрузка анкет с фильтрами:', filters);
        
        // Показываем индикатор загрузки
        const adsList = document.getElementById('adsList');
        if (adsList) {
            adsList.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Загружаем анкеты...</p>
                </div>
            `;
        }

        // Запрашиваем анкеты из Supabase через API
        console.log('📡 Вызов window.SupabaseClient.getAds...');
        const ads = await window.SupabaseClient.getAds(filters);
        
        console.log('✅ Получено анкет:', ads.length);
        console.log('📋 Первое анкете:', ads[0]);
        
        // Отображаем анкеты
        displayAds(ads, filters.city);

    } catch (error) {
        console.error('❌ Ошибка загрузки анкет:', error);
        const adsList = document.getElementById('adsList');
        if (adsList) {
            adsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button class="neon-button" onclick="loadAds()">🔄 Попробовать снова</button>
                </div>
            `;
        }
    }
}

// Вспомогательная функция для получения всех анкет
async function getAllAds() {
    const ads = await window.SupabaseClient.getAds();
    
    // Сортируем: сначала закрепленные (и еще не истекшие), потом обычные по дате
    const now = new Date();
    return ads.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Если оба закреплены или оба не закреплены, сортируем по дате
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function displayAds(ads, city = null) {
    const adsList = document.getElementById('adsList');
    
    if (!ads || ads.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">😔</div>
                <h3>Пока нет анкет</h3>
                <p>Будьте первым, кто разместит анкете!</p>
            </div>
        `;
        return;
    }

    // Фильтруем по городу если задан
    let filteredAds = city ? ads.filter(ad => ad.city === city) : ads;
    
    // Сортируем: закрепленные вверху
    const now = new Date();
    filteredAds = filteredAds.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });

    adsList.innerHTML = filteredAds.map((ad, index) => {
        // Supabase возвращает поля с подчёркиваниями (age_from, my_age и т.д.)
        const myAge = ad.my_age || ad.myAge || '?';
        const ageFrom = ad.age_from || ad.ageFrom || '?';
        const ageTo = ad.age_to || ad.ageTo || '?';
        const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > now);
        
        return `
        <div class="ad-card" onclick="showAdDetails(${index})">
            ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
            <div class="ad-info">
                <div class="ad-field">
                    <span class="icon">🏙</span>
                    <span class="label">Город:</span>
                    <span class="value">${ad.city}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">👤</span>
                    <span class="label">Пол:</span>
                    <span class="value">${ad.gender}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🔍</span>
                    <span class="label">Ищет:</span>
                    <span class="value">${ad.target}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎯</span>
                    <span class="label">Цель:</span>
                    <span class="value">${ad.goal}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎂</span>
                    <span class="label">Мой возраст:</span>
                    <span class="value">${myAge} лет</span>
                </div>
                <div class="ad-field">
                    <span class="icon">📅</span>
                    <span class="label">Возраст партнера:</span>
                    <span class="value">${ageFrom} - ${ageTo} лет</span>
                </div>
            </div>
            <div class="ad-text">
                "${ad.text.substring(0, 100)}${ad.text.length > 100 ? '...' : ''}"
            </div>
        </div>
    `;
    }).join('');
    
    // Сохраняем анкеты для showAdDetails
    window.currentAds = filteredAds;
}

function handleCityFilter(city) {
    // Сброс выбора
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Выбор нового города
    document.querySelector(`[data-city="${city}"].filter`).classList.add('selected');

    // Запрос анкет по городу
    tg.sendData(JSON.stringify({
        action: 'getAdsByCity',
        city: city
    }));
}

function showAdDetails(index) {
    const ad = window.currentAds?.[index];
    
    if (!ad) {
        alert('анкете не найдено');
        return;
    }
    
    const adContent = document.getElementById('adContent');
    if (!adContent) return;
    
    // Сохраняем индекс для кнопки "Написать автору"
    window.currentAdIndex = index;
    
    const myAge = ad.my_age || ad.myAge || '?';
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    const bodyType = ad.body_type || ad.body || '?';
    const nickname = ad.nickname || 'Аноним';
    
    adContent.innerHTML = `
        <div class="ad-details-card">
            <div class="ad-details-header">
                <div class="ad-location">
                    <span class="location-icon">📍</span>
                    <span class="location-text">${ad.city}</span>
                </div>
                <div class="ad-date-badge">${new Date(ad.created_at).toLocaleDateString('ru-RU')}</div>
            </div>
            
            <div class="ad-author-info">
                <div class="author-avatar">👤</div>
                <div class="author-details">
                    <div class="author-name">${nickname}</div>
                    <div class="author-params">${ad.gender}, ${myAge} лет, ${bodyType}</div>
                </div>
            </div>
            
            <div class="ad-search-info">
                <div class="search-title">🔍 Ищет:</div>
                <div class="search-params">
                    <div class="param-item">
                        <span class="param-icon">👥</span>
                        <span>${ad.target}, ${ageFrom}-${ageTo} лет</span>
                    </div>
                    <div class="param-item">
                        <span class="param-icon">🎯</span>
                        <span>${ad.goal}</span>
                    </div>
                </div>
            </div>
            
            ${ad.text ? `
            <div class="ad-description-box">
                <div class="description-title">💬 О себе:</div>
                <div class="description-text">${ad.text}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Обновляем кнопку "Написать автору"
    const contactBtn = document.querySelector('#adDetails button.neon-button');
    if (contactBtn) {
        contactBtn.onclick = () => contactAuthor(index);
    }
    
    showScreen('adDetails');
}

// Написать автору анкеты
async function contactAuthor(adIndex) {
    const ad = window.currentAds?.[adIndex];
    
    if (!ad) {
        alert('анкете не найдено');
        return;
    }
    
    // Проверяем авторизацию
    const currentUserId = getCurrentUserId();
    if (currentUserId.startsWith('web_')) {
        alert('⚠️ Для отправки сообщений необходимо авторизоваться через Telegram');
        showTelegramAuthModal();
        return;
    }
    
    // Проверяем, не пытается ли пользователь написать самому себе
    if (ad.tg_id === currentUserId) {
        alert('Вы не можете отправить сообщение на своё анкете');
        return;
    }
    
    // Запрашиваем текст сообщения
    const message = prompt('Введите сообщение автору анкеты:');
    
    if (!message || message.trim() === '') {
        return;
    }
    
    try {
        // Проверяем, существует ли уже чат (используем Neon PostgreSQL)
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing',
                params: { user1: currentUserId, user2: ad.tg_id, adId: ad.id }
            })
        });

        const checkResult = await checkResponse.json();

        if (checkResult.error) {
            console.error('Error checking existing chat:', checkResult.error);
            alert('❌ Ошибка при проверке чата. Попробуйте позже.');
            return;
        }

        const existingChat = checkResult.data;

        if (existingChat) {
            if (existingChat.blocked_by) {
                alert('❌ Чат заблокирован');
                return;
            }
            if (existingChat.accepted) {
                alert('✅ Чат уже существует! Откройте раздел "Мои чаты"');
                return;
            } else {
                alert('✅ Запрос уже отправлен! Ожидайте ответа от автора.');
                return;
            }
        }

        // Создаем новый запрос на чат
        const createResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                params: { 
                    user1: currentUserId, 
                    user2: ad.tg_id, 
                    adId: ad.id,
                    message: message.trim()
                }
            })
        });

        const createResult = await createResponse.json();

        if (createResult.error) {
            console.error('Error creating chat request:', createResult.error);
            alert('❌ Ошибка при создании запроса на чат: ' + createResult.error.message);
            return;
        }

        if (createResult.data) {
            // Отправляем уведомление в Telegram через бота
            try {
                await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiverTgId: ad.tg_id,
                        senderTgId: currentUserId,
                        adId: ad.id,
                        messageText: message.trim()
                    })
                });
            } catch (notifyError) {
                console.warn('Notification failed:', notifyError);
                // Не прерываем выполнение, чат уже создан
            }

            alert('✅ Запрос на чат отправлен!\n\nАвтор анкеты получит уведомление и сможет принять ваш запрос.');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('❌ Ошибка при отправке сообщения. Попробуйте позже.');
    }
}

// Удалить мое анкете
async function deleteMyAd(adId) {
    if (!confirm('Вы уверены, что хотите удалить это анкете?')) {
        return;
    }
    
    try {
        const deleted = await window.SupabaseClient.deleteAd(adId);
        
        if (deleted) {
            tg.showAlert('✅ анкете успешно удалено');
            // Перезагружаем список
            loadMyAds();
        } else {
            tg.showAlert('❌ Не удалось удалить анкете');
        }
    } catch (error) {
        console.error('Error deleting ad:', error);
        tg.showAlert('❌ Ошибка при удалении анкеты');
    }
}

// Закрепить/открепить мое анкете
async function pinMyAd(adId, shouldPin) {
    try {
        // Если закрепляем - проверяем лимит
        if (shouldPin) {
            // Проверяем лимит закрепления
            if (userPremiumStatus.limits && userPremiumStatus.limits.pin) {
                const pinLimit = userPremiumStatus.limits.pin;
                if (!pinLimit.canUse) {
                    if (userPremiumStatus.isPremium) {
                        tg.showAlert('Вы уже использовали 3 закрепления сегодня (лимит PRO). Попробуйте завтра!');
                    } else {
                        tg.showConfirm(
                            'Закрепление доступно раз в 3 дня для FREE.\nОформите PRO для 3 закреплений в день по 1 часу!',
                            (confirmed) => {
                                if (confirmed) showPremiumModal();
                            }
                        );
                    }
                    return;
                }
            }
        }
        
        const pinned = await window.SupabaseClient.togglePinAd(adId, shouldPin);
        
        if (pinned) {
            if (shouldPin) {
                // Обновляем статус Premium (лимиты изменились)
                await loadPremiumStatus();
                
                tg.showAlert('✅ Функция успешно оплачена и включена!\n\nВаше анкете будет закреплено поверх других на 1 час.');
            } else {
                tg.showAlert('✅ анкете откреплено');
            }
            // Перезагружаем список
            loadMyAds();
        } else {
            tg.showAlert('❌ Не удалось изменить статус закрепления');
        }
    } catch (error) {
        console.error('Error pinning ad:', error);
        
        // Проверяем ошибку лимита
        if (error.message && error.message.includes('лимит')) {
            if (error.message.includes('PRO')) {
                tg.showConfirm(
                    error.message,
                    (confirmed) => {
                        if (confirmed) showPremiumModal();
                    }
                );
            } else {
                tg.showAlert('❌ ' + error.message);
            }
        } else {
            tg.showAlert('❌ Ошибка при изменении статуса закрепления');
        }
    }
}

// Автоопределение локации - перенаправляем на красивую анимацию
function autoDetectLocation() {
    console.log('autoDetectLocation вызвана - переходим к красивой анимации');
    showAutoLocationDetection();
}

// Сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('customCity').value = '';
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// Функция загрузки Email Service
async function loadEmailService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './email-service.js';
        script.onload = () => {
            console.log('✅ Email Service загружен');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Ошибка загрузки Email Service');
            reject(new Error('Failed to load Email Service'));
        };
        document.head.appendChild(script);
    });
}

// Обработка данных от бота
tg.onEvent('web_app_data_received', function(data) {
    try {
        const response = JSON.parse(data);
        
        switch(response.action) {
            case 'adsLoaded':
                displayAds(response.ads);
                break;
            case 'cityAdsLoaded':
                displayAds(response.ads, response.city);
                break;
            case 'adCreated':
                tg.showAlert('анкете создано!');
                showMainMenu();
                break;
            default:
                console.log('Unknown response:', response);
        }
    } catch (error) {
        console.error('Error parsing bot data:', error);
    }
});

// Данные локаций
const locationData = {
    russia: {
        name: 'Россия',
        flag: '🇷🇺',
        regions: {
            'Москва': ['Москва'],
            'Санкт-Петербург': ['Санкт-Петербург'],
            'Севастополь': ['Севастополь'],
            
            // Области
            'Московская область': ['Балашиха', 'Подольск', 'Химки', 'Королёв', 'Мытищи', 'Люберцы', 'Красногорск', 'Электросталь', 'Коломна', 'Одинцово'],
            'Ленинградская область': ['Гатчина', 'Выборг', 'Сосновый Бор', 'Тихвин', 'Кириши', 'Волхов'],
            'Новосибирская область': ['Новосибирск', 'Бердск', 'Искитим', 'Куйбышев', 'Обь'],
            'Свердловская область': ['Екатеринбург', 'Нижний Тагил', 'Каменск-Уральский', 'Первоуральск', 'Серов'],
            'Ростовская область': ['Ростов-на-Дону', 'Таганрог', 'Шахты', 'Новочеркасск', 'Волгодонск'],
            'Челябинская область': ['Челябинск', 'Магнитогорск', 'Златоуст', 'Миасс', 'Копейск'],
            'Нижегородская область': ['Нижний Новгород', 'Дзержинск', 'Арзамас', 'Саров', 'Бор'],
            'Самарская область': ['Самара', 'Тольятти', 'Сызрань', 'Новокуйбышевск', 'Чапаевск'],
            'Омская область': ['Омск', 'Тара', 'Калачинск', 'Исилькуль'],
            'Воронежская область': ['Воронеж', 'Борисоглебск', 'Россошь', 'Лиски'],
            'Волгоградская область': ['Волгоград', 'Волжский', 'Камышин', 'Михайловка'],
            'Пермский край': ['Пермь', 'Березники', 'Соликамск', 'Чайковский', 'Кунгур'],
            'Саратовская область': ['Саратов', 'Энгельс', 'Балаково', 'Вольск'],
            'Тюменская область': ['Тюмень', 'Тобольск', 'Ишим', 'Ялуторовск'],
            'Кемеровская область': ['Кемерово', 'Новокузнецк', 'Прокопьевск', 'Междуреченск'],
            'Томская область': ['Томск', 'Северск', 'Стрежевой', 'Асино'],
            'Тульская область': ['Тула', 'Новомосковск', 'Алексин', 'Узловая'],
            'Ярославская область': ['Ярославль', 'Рыбинск', 'Переславль-Залесский', 'Тутаев'],
            'Иркутская область': ['Иркутск', 'Братск', 'Ангарск', 'Усть-Илимск'],
            'Владимирская область': ['Владимир', 'Ковров', 'Муром', 'Александров'],
            'Ивановская область': ['Иваново', 'Кинешма', 'Шуя', 'Вичуга'],
            'Тверская область': ['Тверь', 'Ржев', 'Вышний Волочек', 'Кимры'],
            'Оренбургская область': ['Оренбург', 'Орск', 'Новотроицк', 'Бузулук'],
            'Белгородская область': ['Белгород', 'Старый Оскол', 'Губкин', 'Алексеевка'],
            'Рязанская область': ['Рязань', 'Касимов', 'Скопин', 'Сасово'],
            'Липецкая область': ['Липецк', 'Елец', 'Грязи', 'Данков'],
            'Пензенская область': ['Пенза', 'Кузнецк', 'Заречный', 'Сурск'],
            'Астраханская область': ['Астрахань', 'Ахтубинск', 'Камызяк', 'Знаменск'],
            'Калужская область': ['Калуга', 'Обнинск', 'Людиново', 'Киров'],
            'Курская область': ['Курск', 'Железногорск', 'Курчатов', 'Льгов'],
            'Кировская область': ['Киров', 'Кирово-Чепецк', 'Вятские Поляны', 'Слободской'],
            'Костромская область': ['Кострома', 'Буй', 'Нерехта', 'Волгореченск'],
            'Брянская область': ['Брянск', 'Клинцы', 'Новозыбков', 'Дятьково'],
            'Смоленская область': ['Смоленск', 'Вязьма', 'Рославль', 'Сафоново'],
            'Орловская область': ['Орёл', 'Ливны', 'Мценск', 'Болхов'],
            'Тамбовская область': ['Тамбов', 'Мичуринск', 'Рассказово', 'Моршанск'],
            'Ульяновская область': ['Ульяновск', 'Димитровград', 'Инза', 'Новоульяновск'],
            'Курганская область': ['Курган', 'Шадринск', 'Петухово', 'Далматово'],
            'Вологодская область': ['Вологда', 'Череповец', 'Сокол', 'Великий Устюг'],
            'Архангельская область': ['Архангельск', 'Северодвинск', 'Котлас', 'Новодвинск'],
            'Мурманская область': ['Мурманск', 'Апатиты', 'Мончегорск', 'Кандалакша'],
            'Новгородская область': ['Великий Новгород', 'Боровичи', 'Старая Русса', 'Валдай'],
            'Псковская область': ['Псков', 'Великие Луки', 'Остров', 'Печоры'],
            'Амурская область': ['Благовещенск', 'Белогорск', 'Свободный', 'Тында', 'Зея'],
            'Сахалинская область': ['Южно-Сахалинск', 'Корсаков', 'Холмск', 'Оха'],
            'Магаданская область': ['Магадан', 'Сусуман', 'Ола'],
            'Калининградская область': ['Калининград', 'Советск', 'Черняховск', 'Балтийск'],
            
            // Края
            'Краснодарский край': ['Краснодар', 'Сочи', 'Новороссийск', 'Армавир', 'Геленджик', 'Анапа'],
            'Красноярский край': ['Красноярск', 'Норильск', 'Ачинск', 'Канск', 'Минусинск'],
            'Приморский край': ['Владивосток', 'Находка', 'Уссурийск', 'Артём', 'Дальнегорск'],
            'Ставропольский край': ['Ставрополь', 'Пятигорск', 'Кисловодск', 'Невинномысск', 'Ессентуки'],
            'Хабаровский край': ['Хабаровск', 'Комсомольск-на-Амуре', 'Амурск', 'Советская Гавань'],
            'Алтайский край': ['Барнаул', 'Бийск', 'Рубцовск', 'Новоалтайск'],
            'Забайкальский край': ['Чита', 'Краснокаменск', 'Борзя', 'Петровск-Забайкальский'],
            'Камчатский край': ['Петропавловск-Камчатский', 'Елизово', 'Вилючинск'],
            
            // Республики
            'Татарстан': ['Казань', 'Набережные Челны', 'Нижнекамск', 'Альметьевск', 'Зеленодольск'],
            'Башкортостан': ['Уфа', 'Стерлитамак', 'Салават', 'Нефтекамск', 'Октябрьский'],
            'Дагестан': ['Махачкала', 'Хасавюрт', 'Дербент', 'Каспийск', 'Буйнакск'],
            'Якутия': ['Якутск', 'Нерюнгри', 'Мирный', 'Ленск'],
            'Бурятия': ['Улан-Удэ', 'Северобайкальск', 'Гусиноозерск'],
            'Чувашия': ['Чебоксары', 'Новочебоксарск', 'Канаш', 'Алатырь'],
            'Удмуртия': ['Ижевск', 'Сарапул', 'Воткинск', 'Глазов'],
            'Мордовия': ['Саранск', 'Рузаевка', 'Ковылкино', 'Темников'],
            'Марий Эл': ['Йошкар-Ола', 'Волжск', 'Козьмодемьянск'],
            'Коми': ['Сыктывкар', 'Ухта', 'Воркута', 'Печора'],
            'Карелия': ['Петрозаводск', 'Кондопога', 'Костомукша', 'Сегежа'],
            'Алтай': ['Горно-Алтайск', 'Кош-Агач', 'Майма'],
            'Хакасия': ['Абакан', 'Черногорск', 'Саяногорск', 'Абаза'],
            'Тыва': ['Кызыл', 'Ак-Довурак', 'Шагонар'],
            'Кабардино-Балкария': ['Нальчик', 'Прохладный', 'Баксан', 'Майский'],
            'Карачаево-Черкесия': ['Черкесск', 'Карачаевск', 'Усть-Джегута'],
            'Северная Осетия': ['Владикавказ', 'Беслан', 'Ардон', 'Моздок'],
            'Чечня': ['Грозный', 'Аргун', 'Гудермес', 'Шали'],
            'Ингушетия': ['Магас', 'Назрань', 'Карабулак', 'Малгобек'],
            'Адыгея': ['Майкоп', 'Адыгейск'],
            'Калмыкия': ['Элиста', 'Городовиковск', 'Лагань'],
            
            // Автономные округа
            'Ханты-Мансийский АО': ['Ханты-Мансийск', 'Сургут', 'Нижневартовск', 'Нефтеюганск'],
            'Ямало-Ненецкий АО': ['Салехард', 'Новый Уренгой', 'Ноябрьск', 'Надым'],
            'Ненецкий АО': ['Нарьян-Мар'],
            'Чукотский АО': ['Анадырь', 'Билибино', 'Певек'],
            'Еврейская АО': ['Биробиджан', 'Облучье']
        }
    },
    kazakhstan: {
        name: 'Казахстан',
        flag: '🇰🇿',
        regions: {
            'Алматинская область': ['Алматы', 'Талдыкорган', 'Капчагай', 'Текели', 'Жаркент'],
            'Нур-Султан': ['Нур-Султан (Астана)'],
            'Шымкент': ['Шымкент'],
            'Актюбинская область': ['Актобе', 'Хромтау', 'Алга', 'Темир'],
            'Атырауская область': ['Атырау', 'Кульсары', 'Жылыой'],
            'Западно-Казахстанская область': ['Уральск', 'Аксай', 'Казталовка'],
            'Карагандинская область': ['Караганда', 'Темиртау', 'Жезказган', 'Балхаш'],
            'Костанайская область': ['Костанай', 'Рудный', 'Житикара', 'Лисаковск'],
            'Мангистауская область': ['Актау', 'Жанаозен', 'Бейнеу'],
            'Павлодарская область': ['Павлодар', 'Экибастуз', 'Аксу'],
            'Северо-Казахстанская область': ['Петропавловск', 'Булаево', 'Тайынша'],
            'Восточно-Казахстанская область': ['Усть-Каменогорск', 'Семей', 'Риддер', 'Зыряновск'],
            'Жамбылская область': ['Тараз', 'Жанатас', 'Каратау', 'Шу'],
            'Кызылординская область': ['Кызылорда', 'Байконур', 'Арал']
        }
    }
};

// Переменные для системы локации
let selectedCountry = null;
let selectedRegion = null;
let selectedCity = null;

// Переменные для настройки локации
let setupSelectedCountry = null;
let setupSelectedRegion = null;
let setupSelectedCity = null;

// Сохраненная локация пользователя
let userLocation = null;

// Переменные для фильтра в просмотре анкет
let filterSelectedCountry = null;
let filterSelectedRegion = null;
let filterSelectedCity = null;

// Проверка сохраненной локации пользователя
function checkUserLocation() {
    console.log('checkUserLocation вызвана');
    // Попробуем получить локацию из Telegram Web App Storage
    try {
        if (tg.CloudStorage) {
            console.log('Используем Telegram Cloud Storage');
            tg.CloudStorage.getItem('userLocation', function(err, value) {
                console.log('CloudStorage результат:', {err, value});
                if (!err && value) {
                    userLocation = JSON.parse(value);
                    console.log('Найдена сохраненная локация:', userLocation);
                    displayUserLocation();
                    showMainMenu();
                } else {
                    console.log('Сохраненной локации нет, запускаем автоопределение');
                    // Автоматически определяем по IP
                    showAutoLocationDetection();
                }
            });
        } else {
            console.log('Используем localStorage');
            // Fallback - используем localStorage
            const savedLocation = localStorage.getItem('userLocation');
            console.log('localStorage результат:', savedLocation);
            if (savedLocation) {
                userLocation = JSON.parse(savedLocation);
                console.log('Найдена сохраненная локация в localStorage:', userLocation);
                displayUserLocation();
                showMainMenu();
            } else {
                console.log('Сохраненной локации нет, запускаем автоопределение');
                // Автоматически определяем по IP
                showAutoLocationDetection();
            }
        }
    } catch (error) {
        console.error('Ошибка при получении локации:', error);
        showAutoLocationDetection();
    }
}

// Определение локации по IP
async function detectLocationByIP() {
    const detectionText = document.querySelector('.detection-text');
    console.log('detectLocationByIP вызвана');
    console.log('detectionText элемент найден:', !!detectionText);
    
    if (!detectionText) {
        console.error('Элемент .detection-text не найден!');
        showPopularLocations();
        return;
    }
    
    try {
        console.log('Начинаем определение локации по IP...');
        
        // Обновляем текст анимации с красивыми фразами
        detectionText.textContent = 'Сканируем цифровой след';
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        detectionText.textContent = 'Анализируем сетевые маршруты';
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Пробуем несколько вариантов API
        detectionText.textContent = 'Определяем геолокацию';
        let locationData = null;
        
        // Вариант 1: ipinfo.io (часто работает без CORS)
        try {
            console.log('🌐 Пробуем ipinfo.io...');
            const response1 = await fetch('https://ipinfo.io/json');
            const data1 = await response1.json();
            console.log('📍 Ответ от ipinfo.io:', data1);
            
            if (data1 && data1.country) {
                locationData = {
                    country_code: data1.country,
                    country_name: data1.country,
                    region: data1.region,
                    city: data1.city,
                    source: 'ipinfo.io'
                };
                console.log('✅ Данные получены от ipinfo.io:', locationData);
            }
        } catch (e) {
            console.log('❌ ipinfo.io недоступен:', e);
        }
        
        // Вариант 2: ip-api.com (более точное определение города)
        if (!locationData) {
            try {
                console.log('🌐 Пробуем ip-api.com...');
                const response2 = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,timezone');
                const data2 = await response2.json();
                console.log('📍 Ответ от ip-api.com:', data2);
                
                if (data2 && data2.status === 'success') {
                    locationData = {
                        country_code: data2.countryCode,
                        country_name: data2.country,
                        region: data2.regionName,
                        city: data2.city,
                        source: 'ip-api.com'
                    };
                    console.log('✅ Данные получены от ip-api.com:', locationData);
                }
            } catch (e) {
                console.log('❌ ip-api.com недоступен:', e);
            }
        }
        
        // Вариант 3: Определение по часовому поясу (резервный вариант)
        if (!locationData) {
            try {
                console.log('🌐 Используем часовой пояс как резервный вариант...');
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                console.log('⏰ Часовой пояс:', timezone);
                
                locationData = guessLocationByTimezone(timezone);
                if (locationData) {
                    locationData.source = 'timezone';
                    console.log('✅ Данные получены по часовому поясу:', locationData);
                }
            } catch (e) {
                console.log('❌ Определение по часовому поясу не сработало:', e);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Данные геолокации:', locationData);
        
        if (locationData && locationData.country_code) {
            detectionText.textContent = 'Сопоставляем с базой данных';
            await new Promise(resolve => setTimeout(resolve, 600));
            
            detectionText.textContent = 'Почти готово';
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const detectedLocation = processIPLocation(locationData);
            if (detectedLocation) {
                showDetectedLocationResult(detectedLocation);
                return;
            }
        }
        
        // Если все варианты не сработали - показываем популярные варианты
        showPopularLocations();
        
    } catch (error) {
        console.error('Ошибка определения локации по IP:', error);
        showPopularLocations();
    }
}

// Определение локации по часовому поясу
function guessLocationByTimezone(timezone) {
    console.log('Определяем по часовому поясу:', timezone);
    
    // Популярные города России и Казахстана
    const timezoneMap = {
        'Europe/Moscow': { country_code: 'RU', country_name: 'Россия', region: 'Москва', city: 'Москва' },
        'Europe/Samara': { country_code: 'RU', country_name: 'Россия', region: 'Самарская область', city: 'Самара' },
        'Asia/Yekaterinburg': { country_code: 'RU', country_name: 'Россия', region: 'Свердловская область', city: 'Екатеринбург' },
        'Asia/Novosibirsk': { country_code: 'RU', country_name: 'Россия', region: 'Новосибирская область', city: 'Новосибирск' },
        'Asia/Krasnoyarsk': { country_code: 'RU', country_name: 'Россия', region: 'Красноярский край', city: 'Красноярск' },
        'Asia/Irkutsk': { country_code: 'RU', country_name: 'Россия', region: 'Иркутская область', city: 'Иркутск' },
        'Asia/Vladivostok': { country_code: 'RU', country_name: 'Россия', region: 'Приморский край', city: 'Владивосток' },
        'Asia/Almaty': { country_code: 'KZ', country_name: 'Казахстан', region: 'Алматинская область', city: 'Алматы' },
        'Asia/Qyzylorda': { country_code: 'KZ', country_name: 'Казахстан', region: 'Кызылординская область', city: 'Кызылорда' },
        'Asia/Aqtobe': { country_code: 'KZ', country_name: 'Казахстан', region: 'Актюбинская область', city: 'Актобе' }
    };
    
    return timezoneMap[timezone] || null;
}

// Показать популярные локации для выбора
function showPopularLocations() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем популярные варианты
    resultDiv.innerHTML = `
        <div class="popular-locations">
            <div class="info-icon">🌍</div>
            <h3>Выберите ваш регион</h3>
            <p>Не удалось автоматически определить местоположение.<br>Выберите один из популярных вариантов:</p>
            
            <div class="popular-options">
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Москва', 'Москва')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Москва</span>
                    </div>
                </button>
                
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Санкт-Петербург', 'Санкт-Петербург')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Санкт-Петербург</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Алматинская область', 'Алматы')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Алматы</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Нур-Султан', 'Нур-Султан (Астана)')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Нур-Султан</span>
                    </div>
                </button>
            </div>
            
            <div class="manual-choice">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать другую локацию
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Выбор популярной локации
function selectPopularLocation(country, region, city) {
    console.log('Выбрана популярная локация:', {country, region, city});
    confirmDetectedLocation(country, region, city);
}

// Обработка данных IP геолокации
function processIPLocation(data) {
    const countryCode = (data.country_code || data.country || '').toLowerCase();
    let regionName = data.region;
    let cityName = data.city;
    
    // Нормализация названий РЕГИОНОВ (английские → русские)
    const regionNormalization = {
        // Россия - области
        'Moscow Oblast': 'Московская область',
        'Leningrad Oblast': 'Ленинградская область',
        'Novosibirsk Oblast': 'Новосибирская область',
        'Sverdlovsk Oblast': 'Свердловская область',
        'Rostov Oblast': 'Ростовская область',
        'Chelyabinsk Oblast': 'Челябинская область',
        'Nizhny Novgorod Oblast': 'Нижегородская область',
        'Samara Oblast': 'Самарская область',
        'Omsk Oblast': 'Омская область',
        'Voronezh Oblast': 'Воронежская область',
        'Volgograd Oblast': 'Волгоградская область',
        'Perm Krai': 'Пермский край',
        'Saratov Oblast': 'Саратовская область',
        'Tyumen Oblast': 'Тюменская область',
        'Kemerovo Oblast': 'Кемеровская область',
        'Tomsk Oblast': 'Томская область',
        'Tula Oblast': 'Тульская область',
        'Yaroslavl Oblast': 'Ярославская область',
        'Irkutsk Oblast': 'Иркутская область',
        'Vladimir Oblast': 'Владимирская область',
        'Ivanovo Oblast': 'Ивановская область',
        'Tver Oblast': 'Тверская область',
        'Orenburg Oblast': 'Оренбургская область',
        'Belgorod Oblast': 'Белгородская область',
        'Ryazan Oblast': 'Рязанская область',
        'Lipetsk Oblast': 'Липецкая область',
        'Penza Oblast': 'Пензенская область',
        'Astrakhan Oblast': 'Астраханская область',
        'Kaluga Oblast': 'Калужская область',
        'Kursk Oblast': 'Курская область',
        'Kirov Oblast': 'Кировская область',
        'Kostroma Oblast': 'Костромская область',
        'Bryansk Oblast': 'Брянская область',
        'Smolensk Oblast': 'Смоленская область',
        'Oryol Oblast': 'Орловская область',
        'Tambov Oblast': 'Тамбовская область',
        'Ulyanovsk Oblast': 'Ульяновская область',
        'Kurgan Oblast': 'Курганская область',
        'Vologda Oblast': 'Вологодская область',
        'Arkhangelsk Oblast': 'Архангельская область',
        'Murmansk Oblast': 'Мурманская область',
        'Novgorod Oblast': 'Новгородская область',
        'Pskov Oblast': 'Псковская область',
        'Amur Oblast': 'Амурская область',
        'Sakhalin Oblast': 'Сахалинская область',
        'Magadan Oblast': 'Магаданская область',
        'Kaliningrad Oblast': 'Калининградская область',
        
        // Россия - края
        'Krasnodar Krai': 'Краснодарский край',
        'Krasnoyarsk Krai': 'Красноярский край',
        'Primorsky Krai': 'Приморский край',
        'Stavropol Krai': 'Ставропольский край',
        'Khabarovsk Krai': 'Хабаровский край',
        'Altai Krai': 'Алтайский край',
        'Zabaykalsky Krai': 'Забайкальский край',
        'Kamchatka Krai': 'Камчатский край',
        
        // Россия - республики
        'Tatarstan': 'Татарстан',
        'Bashkortostan': 'Башкортостан',
        'Dagestan': 'Дагестан',
        'Sakha': 'Якутия',
        'Buryatia': 'Бурятия',
        'Chuvashia': 'Чувашия',
        'Udmurtia': 'Удмуртия',
        'Mordovia': 'Мордовия',
        'Mari El': 'Марий Эл',
        'Komi': 'Коми',
        'Karelia': 'Карелия',
        'Altai Republic': 'Алтай',
        'Khakassia': 'Хакасия',
        'Tyva': 'Тыва',
        'Kabardino-Balkaria': 'Кабардино-Балкария',
        
        // Казахстан - области
        'Almaty Region': 'Алматинская область',
        'Astana': 'Нур-Султан',
        'Shymkent': 'Шымкент',
        'Karaganda Region': 'Карагандинская область',
        'Aktobe Region': 'Актюбинская область',
        'East Kazakhstan Region': 'Восточно-Казахстанская область',
        'Pavlodar Region': 'Павлодарская область',
        'North Kazakhstan Region': 'Северо-Казахстанская область',
        'West Kazakhstan Region': 'Западно-Казахстанская область',
        'Atyrau Region': 'Атырауская область',
        'Mangystau Region': 'Мангистауская область',
        'Kostanay Region': 'Костанайская область',
        'Kyzylorda Region': 'Кызылординская область',
        'Zhambyl Region': 'Жамбылская область',
        'Turkistan Region': 'Туркестанская область',
        'Akmola Region': 'Акмолинская область'
    };
    
    // Нормализуем регион если он в английском формате
    if (regionName && regionNormalization[regionName]) {
        console.log(`🔄 Нормализация региона: "${regionName}" → "${regionNormalization[regionName]}"`);
        regionName = regionNormalization[regionName];
    }
    
    // Нормализация названий городов (приводим к единому формату)
    // Охватываем английские названия, старые названия, разные транслитерации
    const cityNormalization = {
        // Казахстан
        'Alma-Ata': 'Алматы',
        'Almaty': 'Алматы',
        'Алма-Ата': 'Алматы',
        'Astana': 'Астана',
        'Nur-Sultan': 'Астана',
        'Nursultan': 'Астана',
        'Нур-Султан': 'Астана',
        'Akmola': 'Астана',
        'Акмола': 'Астана',
        'Shymkent': 'Шымкент',
        'Chimkent': 'Шымкент',
        'Чимкент': 'Шымкент',
        'Karaganda': 'Караганда',
        'Qaraghandy': 'Караганда',
        'Aktobe': 'Актобе',
        'Aqtobe': 'Актобе',
        'Aktau': 'Актау',
        'Aqtau': 'Актау',
        'Atyrau': 'Атырау',
        'Pavlodar': 'Павлодар',
        'Semey': 'Семей',
        'Semipalatinsk': 'Семей',
        'Семипалатинск': 'Семей',
        'Ust-Kamenogorsk': 'Усть-Каменогорск',
        'Oskemen': 'Усть-Каменогорск',
        'Petropavl': 'Петропавловск',
        'Petropavlovsk': 'Петропавловск',
        'Kostanay': 'Костанай',
        'Qostanay': 'Костанай',
        'Kyzylorda': 'Кызылорда',
        'Qyzylorda': 'Кызылорда',
        'Uralsk': 'Уральск',
        'Oral': 'Уральск',
        'Taraz': 'Тараз',
        'Zhambyl': 'Тараз',
        'Жамбыл': 'Тараз',
        'Taldykorgan': 'Талдыкорган',
        'Turkestan': 'Туркестан',
        
        // Россия
        'Moscow': 'Москва',
        'Moskva': 'Москва',
        'Sankt-Peterburg': 'Санкт-Петербург',
        'Saint Petersburg': 'Санкт-Петербург',
        'St. Petersburg': 'Санкт-Петербург',
        'Petersburg': 'Санкт-Петербург',
        'Piter': 'Санкт-Петербург',
        'Leningrad': 'Санкт-Петербург',
        'Ленинград': 'Санкт-Петербург',
        'Yekaterinburg': 'Екатеринбург',
        'Ekaterinburg': 'Екатеринбург',
        'Sverdlovsk': 'Екатеринбург',
        'Свердловск': 'Екатеринбург',
        'Novosibirsk': 'Новосибирск',
        'Nizhniy Novgorod': 'Нижний Новгород',
        'Nizhny Novgorod': 'Нижний Новгород',
        'Gorky': 'Нижний Новгород',
        'Горький': 'Нижний Новгород',
        'Kazan': 'Казань',
        'Samara': 'Самара',
        'Kuybyshev': 'Самара',
        'Куйбышев': 'Самара',
        'Chelyabinsk': 'Челябинск',
        'Omsk': 'Омск',
        'Rostov-on-Don': 'Ростов-на-Дону',
        'Rostov': 'Ростов-на-Дону',
        'Ufa': 'Уфа',
        'Krasnoyarsk': 'Красноярск',
        'Voronezh': 'Воронеж',
        'Perm': 'Пермь',
        'Molotov': 'Пермь',
        'Молотов': 'Пермь',
        'Volgograd': 'Волгоград',
        'Stalingrad': 'Волгоград',
        'Сталинград': 'Волгоград',
        'Krasnodar': 'Краснодар',
        'Saratov': 'Саратов',
        'Tyumen': 'Тюмень',
        'Tolyatti': 'Тольятти',
        'Togliatti': 'Тольятти',
        'Stavropol': 'Ставрополь',
        'Izhevsk': 'Ижевск',
        'Ulyanovsk': 'Ульяновск',
        'Simbirsk': 'Ульяновск',
        'Симбирск': 'Ульяновск',
        'Barnaul': 'Барнаул',
        'Vladivostok': 'Владивосток',
        'Irkutsk': 'Иркутск',
        'Khabarovsk': 'Хабаровск',
        'Yaroslavl': 'Ярославль',
        'Makhachkala': 'Махачкала',
        'Tomsk': 'Томск',
        'Orenburg': 'Оренбург',
        'Kemerovo': 'Кемерово',
        'Novokuznetsk': 'Новокузнецк',
        'Ryazan': 'Рязань',
        'Astrakhan': 'Астрахань',
        'Naberezhnye Chelny': 'Набережные Челны',
        'Penza': 'Пенза',
        'Kirov': 'Киров',
        'Vyatka': 'Киров',
        'Вятка': 'Киров',
        'Lipetsk': 'Липецк',
        'Kaliningrad': 'Калининград',
        'Koenigsberg': 'Калининград',
        'Кёнигсберг': 'Калининград',
        'Tula': 'Тула',
        'Kursk': 'Курск',
        'Sochi': 'Сочи',
        'Ulan-Ude': 'Улан-Удэ',
        'Tver': 'Тверь',
        'Kalinin': 'Тверь',
        'Калинин': 'Тверь',
        'Magnitogorsk': 'Магнитогорск',
        'Ivanovo': 'Иваново',
        'Bryansk': 'Брянск',
        'Belgorod': 'Белгород',
        'Surgut': 'Сургут',
        'Vladikavkaz': 'Владикавказ',
        'Ordzhonikidze': 'Владикавказ',
        'Орджоникидзе': 'Владикавказ',
        'Chita': 'Чита',
        'Nizhny Tagil': 'Нижний Тагил',
        'Arkhangelsk': 'Архангельск',
        'Murmansk': 'Мурманск',
        'Yakutsk': 'Якутск',
        'Blagoveshchensk': 'Благовещенск',
        'Belogorsk': 'Белогорск',
        'Svobodny': 'Свободный'
    };
    
    // Нормализуем название города если оно в английском формате
    if (cityName && cityNormalization[cityName]) {
        console.log(`🔄 Нормализация города: "${cityName}" → "${cityNormalization[cityName]}"`);
        cityName = cityNormalization[cityName];
    }
    
    console.log('Обработка локации:', {countryCode, regionName, cityName});
    
    // Проверяем поддерживаемые страны
    let mappedCountry = null;
    if (countryCode === 'ru' || countryCode === 'russia') {
        mappedCountry = 'russia';
    } else if (countryCode === 'kz' || countryCode === 'kazakhstan') {
        mappedCountry = 'kazakhstan';
    }
    
    if (!mappedCountry) {
        console.log('Страна не поддерживается:', countryCode);
        return null;
    }
    
    // Пытаемся найти регион и город в наших данных
    const countryData = locationData[mappedCountry];
    let foundRegion = null;
    let foundCity = null;
    
    // Поиск региона
    if (regionName) {
        for (const region in countryData.regions) {
            if (region.toLowerCase().includes(regionName.toLowerCase()) || 
                regionName.toLowerCase().includes(region.toLowerCase())) {
                foundRegion = region;
                break;
            }
        }
    }
    
    // Поиск города
    if (cityName && foundRegion) {
        const cities = countryData.regions[foundRegion];
        foundCity = cities.find(city => 
            city.toLowerCase().includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(city.toLowerCase())
        );
    }
    
    // Если город не найден в определенном регионе, ищем по всем регионам
    if (cityName && !foundCity) {
        for (const region in countryData.regions) {
            const cities = countryData.regions[region];
            const city = cities.find(city => 
                city.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(city.toLowerCase())
            );
            if (city) {
                foundRegion = region;
                foundCity = city;
                break;
            }
        }
    }
    
    // Возвращаем найденную локацию или базовую для страны
    return {
        country: mappedCountry,
        region: foundRegion || Object.keys(countryData.regions)[0],
        city: foundCity || countryData.regions[foundRegion || Object.keys(countryData.regions)[0]][0],
        detected: {
            country: data.country_name,
            region: regionName,
            city: cityName
        }
    };
}

// Показать результат определения локации
function showDetectedLocationResult(detectedLocation) {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    const countryFlag = locationData[detectedLocation.country].flag;
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем результат с предупреждением о точности
    const sourceText = detectedLocation.source || 'IP-адрес';
    resultDiv.innerHTML = `
        <div class="detected-location">
            <div class="success-icon">✨</div>
            <h3>Проверьте определённое местоположение</h3>
            <div class="location-info">
                <span class="location-flag">${countryFlag}</span>
                <span class="location-text">${detectedLocation.region}, ${detectedLocation.city}</span>
            </div>
            <p class="detection-note">⚠️ Автоопределение может быть неточным</p>
            <p class="detection-source">Источник: ${detectedLocation.detected.country}${detectedLocation.detected.region ? ', ' + detectedLocation.detected.region : ''}${detectedLocation.detected.city ? ', ' + detectedLocation.detected.city : ''}</p>
            <div class="location-actions">
                <button class="confirm-btn" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region}', '${detectedLocation.city}')">
                    ✅ Да, всё верно
                </button>
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Нет, выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Показать ошибку определения IP
function showIPDetectionError() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем ошибку
    resultDiv.innerHTML = `
        <div class="detection-error">
            <div class="error-icon">😔</div>
            <h3>Не удалось определить местоположение</h3>
            <p>Возможно, ваша страна не поддерживается или есть проблемы с подключением к интернету</p>
            <div class="location-actions">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Подтвердить определенную локацию
function confirmDetectedLocation(country, region, city) {
    console.log('Подтверждение автоматической локации:', {country, region, city});
    saveUserLocation(country, region, city);
    displayUserLocation();
    updateFormLocationDisplay();
    showMainMenu();
}

// Сбросить сохраненную локацию и запустить автоопределение
function resetAndDetectLocation() {
    console.log('Сброс локации и запуск автоопределения');
    
    // Очищаем сохраненные данные
    try {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation', function(err) {
                if (err) {
                    console.error('Ошибка удаления из CloudStorage:', err);
                } else {
                    console.log('Локация удалена из CloudStorage');
                }
            });
        }
        localStorage.removeItem('userLocation');
        console.log('Локация удалена из localStorage');
    } catch (error) {
        console.error('Ошибка очистки данных:', error);
    }
    
    // Сбрасываем переменную
    userLocation = null;
    
    // Запускаем автоопределение
    showAutoLocationDetection();
}

// Отображение текущей локации пользователя
function displayUserLocation() {
    if (userLocation) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        const locationDisplay = document.getElementById('userLocationDisplay');
        if (locationDisplay) {
            locationDisplay.textContent = locationText;
        }
        console.log('Текущая локация пользователя:', locationText);
    }
}

// Алиас для обратной совместимости
const updateUserLocationDisplay = displayUserLocation;

// Сохранение локации пользователя
function saveUserLocation(country, region, city) {
    userLocation = {
        country: country,
        region: region,
        city: city,
        timestamp: Date.now()
    };
    
    try {
        if (tg.CloudStorage) {
            tg.CloudStorage.setItem('userLocation', JSON.stringify(userLocation), function(err) {
                if (!err) {
                    console.log('Локация сохранена в Telegram Cloud Storage');
                } else {
                    console.error('Ошибка сохранения в Cloud Storage:', err);
                    localStorage.setItem('userLocation', JSON.stringify(userLocation));
                }
            });
        } else {
            localStorage.setItem('userLocation', JSON.stringify(userLocation));
            console.log('Локация сохранена в localStorage');
        }
    } catch (error) {
        console.error('Ошибка сохранения локации:', error);
    }
}

// Показать экран автоматического определения локации
function showAutoLocationDetection() {
    console.log('Показываем экран автоматического определения локации');
    showScreen('autoLocationDetection');
    // Запускаем определение через небольшую задержку для показа анимации
    setTimeout(() => {
        console.log('Запускаем определение локации по IP');
        detectLocationByIP();
    }, 1000);
}

// Показать экран выбора способа определения локации
function showLocationChoiceScreen() {
    console.log('Показываем экран выбора способа определения локации');
    showScreen('locationChoice');
}

// Показать экран ручной настройки локации
function showManualLocationSetup() {
    showScreen('locationSetup');
    resetSetupLocation();
    
    // Показываем кнопку "Назад" если локация уже была установлена
    const locationBackBtn = document.getElementById('locationBackBtn');
    if (locationBackBtn) {
        const hasLocation = localStorage.getItem('userLocation') || (tg.CloudStorage && userLocation);
        locationBackBtn.style.display = hasLocation ? 'block' : 'none';
    }
}

// Показать экран настройки локации (старая функция для совместимости)
function showLocationSetup() {
    showManualLocationSetup();
}

// Сохранить локацию и перейти к главному меню
function saveLocationAndContinue() {
    if (setupSelectedCountry && setupSelectedRegion && setupSelectedCity) {
        saveUserLocation(setupSelectedCountry, setupSelectedRegion, setupSelectedCity);
        displayUserLocation();
        updateFormLocationDisplay();
        showMainMenu();
    } else {
        tg.showAlert('Пожалуйста, выберите страну, регион и город');
    }
}

// Инициализация системы локации
function initLocationSelector() {
    // Обработчики для кнопок стран (форма создания)
    document.querySelectorAll('.form-country:not(.filter-country)').forEach(btn => {
        btn.addEventListener('click', function() {
            selectCountry(this.dataset.country);
        });
    });
    
    // Обработчики для кнопок стран (фильтр просмотра)
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectFilterCountry(this.dataset.country);
        });
    });
    
    // Обработчики для экрана настройки локации
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectSetupCountry(this.dataset.country);
        });
    });

    // Обработчики для полей ввода регионов и городов (форма создания)
    const regionInput = document.querySelector('.form-region-input:not(.filter-region-input)');
    const cityInput = document.querySelector('.form-city-input:not(.filter-city-input)');
    
    if (regionInput) {
        regionInput.addEventListener('input', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('keyup', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('focus', function() {
            showAllRegions();
        });
        
        regionInput.addEventListener('click', function() {
            showAllRegions();
        });
    }
    
    if (cityInput) {
        cityInput.addEventListener('input', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('keyup', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('focus', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
        
        cityInput.addEventListener('click', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
    }
    
    // Обработчики для полей ввода фильтра
    const filterRegionInput = document.querySelector('.filter-region-input');
    const filterCityInput = document.querySelector('.filter-city-input');
    
    if (filterRegionInput) {
        filterRegionInput.addEventListener('input', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('keyup', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('focus', function() {
            showAllFilterRegions();
        });
        
        filterRegionInput.addEventListener('click', function() {
            showAllFilterRegions();
        });
    }
    
    if (filterCityInput) {
        filterCityInput.addEventListener('input', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('keyup', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('focus', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
        
        filterCityInput.addEventListener('click', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
    }
    
    // Обработчики для полей настройки локации
    const setupRegionInput = document.querySelector('.setup-region-input');
    const setupCityInput = document.querySelector('.setup-city-input');
    
    console.log('Настройка обработчиков для настройки локации');
    console.log('setupRegionInput найден:', !!setupRegionInput);
    console.log('setupCityInput найден:', !!setupCityInput);
    
    if (setupRegionInput) {
        setupRegionInput.addEventListener('input', function() {
            console.log('input событие на регион в настройке:', this.value);
            handleSetupRegionInput(this.value);
        });
        
        setupRegionInput.addEventListener('keyup', function() {
            handleSetupRegionInput(this.value);
        });
        
        setupRegionInput.addEventListener('focus', function() {
            // Всегда показываем все регионы при фокусе, независимо от содержимого
            showAllSetupRegions();
        });
        
        setupRegionInput.addEventListener('click', function() {
            showAllSetupRegions();
        });
    }
    
    if (setupCityInput) {
        setupCityInput.addEventListener('input', function() {
            console.log('input событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('keyup', function() {
            console.log('keyup событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('focus', function() {
            console.log('focus событие на город в настройке');
            if (setupSelectedRegion) {
                // Задержка чтобы избежать конфликта с hideAllSuggestions
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            } else {
                console.log('Регион не выбран, не показываем города');
            }
        });
        
        setupCityInput.addEventListener('click', function(e) {
            console.log('click событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
            if (setupSelectedRegion) {
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            }
        });
        
        setupCityInput.addEventListener('mousedown', function(e) {
            console.log('mousedown событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
        });
    }
    
    // Кнопка сброса локации (форма)
    const resetBtn = document.querySelector('.reset-form-location:not(.reset-filter-location)');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetLocationSelection);
    }
    
    // Кнопка сброса локации (фильтр)
    const resetFilterBtn = document.querySelector('.reset-filter-location');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilterLocationSelection);
    }
    
    // Кнопка сброса настройки локации
    const resetSetupBtn = document.querySelector('.reset-setup-location');
    if (resetSetupBtn) {
        resetSetupBtn.addEventListener('click', resetSetupLocation);
    }

    // Скрытие списков при клике вне их
    document.addEventListener('click', function(e) {
        // Не скрываем если клик по полю ввода или списку предложений
        if (!e.target.closest('.search-container') && !e.target.classList.contains('setup-region-input') && !e.target.classList.contains('setup-city-input')) {
            hideAllSuggestions();
        }
    });
}

// Выбор страны
function selectCountry(countryCode) {
    selectedCountry = countryCode;
    selectedRegion = null;
    selectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"]`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.form-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.form-city-selection').style.display = 'none';
    document.querySelector('.form-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.form-region-input').value = '';
    document.querySelector('.form-city-input').value = '';
    
    console.log('Выбрана страна:', locationData[countryCode].name);
}

// Обработка ввода региона
function handleRegionInput(value) {
    if (!selectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showRegionSuggestions(filtered);
}

// Показать все регионы
function showAllRegions() {
    if (!selectedCountry) return;
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    showRegionSuggestions(regions);
}

// Показать предложения регионов
function showRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.form-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона
function selectRegion(regionName) {
    selectedRegion = regionName;
    selectedCity = null;
    
    document.querySelector('.form-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.form-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.form-city-input').value = '';
    document.querySelector('.form-city-input').focus();
    
    console.log('Выбран регион:', regionName);
}

// Обработка ввода города
function handleCityInput(value) {
    if (!selectedCountry || !selectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showCitySuggestions(filtered);
}

// Показать все города
function showAllCities() {
    if (!selectedCountry || !selectedRegion) return;
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    showCitySuggestions(cities);
}

// Показать предложения городов
function showCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.form-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор города
function selectCity(cityName) {
    selectedCity = cityName;
    
    document.querySelector('.form-city-input').value = cityName;
    hideAllSuggestions();
    
    // Обновляем данные формы
    formData.country = selectedCountry;
    formData.region = selectedRegion;
    formData.city = cityName;
    
    // Показываем выбранную локацию
    showSelectedLocation();
    
    console.log('Выбран город:', cityName);
    console.log('Полная локация:', `${locationData[selectedCountry].name}, ${selectedRegion}, ${cityName}`);
}

// Показать выбранную локацию
function showSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.form-selected-location');
    const locationText = document.querySelector('.form-location-text');
    
    const fullLocation = `${locationData[selectedCountry].flag} ${selectedRegion}, ${selectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.form-region-selection').style.display = 'none';
    document.querySelector('.form-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс выбора локации
function resetLocationSelection() {
    selectedCountry = null;
    selectedRegion = null;
    selectedCity = null;
    
    // Очищаем данные формы
    delete formData.country;
    delete formData.region;
    delete formData.city;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой существования)
    const regionInput = document.querySelector('.form-region-input');
    const cityInput = document.querySelector('.form-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой существования)
    const regionSection = document.querySelector('.form-region-selection');
    const citySection = document.querySelector('.form-city-selection');
    const selectedSection = document.querySelector('.form-selected-location');
    if (regionSection) regionSection.style.display = 'none';
    if (citySection) citySection.style.display = 'none';
    if (selectedSection) selectedSection.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Выбор локации сброшен');
}

// Скрыть все списки предложений
function hideAllSuggestions() {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        list.classList.remove('active');
        list.style.display = 'none';
        list.innerHTML = '';
    });
}

// Скрыть все списки кроме указанного
function hideOtherSuggestions(keepClass) {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        if (!list.classList.contains(keepClass)) {
            list.classList.remove('active');
            list.style.display = 'none';
            list.innerHTML = '';
        }
    });
}

// Обновляем обработчики событий
function setupEventListeners() {
    // Инициализируем систему локации
    initLocationSelector();
    
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Фильтры в просмотре анкет
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.addEventListener('click', function() {
            handleCityFilter(this.dataset.city);
        });
    });
}

// Обновляем валидацию первого шага
function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            // Первый шаг - выбор пола
            return formData.gender;
        case 2:
            return formData.target;
        case 3:
            return formData.goal;
        case 4:
            const ageFrom = document.getElementById('ageFrom').value;
            const ageTo = document.getElementById('ageTo').value;
            if (ageFrom && ageTo) {
                formData.ageFrom = ageFrom;
                formData.ageTo = ageTo;
                return true;
            }
            return false;
        case 5:
            const myAge = document.getElementById('myAge').value;
            if (myAge) {
                formData.myAge = myAge;
                return true;
            }
            return false;
        case 6:
            return formData.body;
        case 7:
            const adText = document.getElementById('adText').value.trim();
            if (adText) {
                formData.text = adText;
                return true;
            }
            return false;
    }
    return false;
}

// Обновляем сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс системы локации
    resetLocationSelection();
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// === ФУНКЦИИ ДЛЯ ФИЛЬТРА В ПРОСМОТРЕ анкет ===

// Выбор страны для фильтра
function selectFilterCountry(countryCode) {
    filterSelectedCountry = countryCode;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].filter-country`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.filter-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    console.log('Выбрана страна для фильтра:', locationData[countryCode].name);
}

// Обработка ввода региона для фильтра
function handleFilterRegionInput(value) {
    if (!filterSelectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterRegionSuggestions(filtered);
}

// Показать все регионы для фильтра
function showAllFilterRegions() {
    if (!filterSelectedCountry) return;
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    showFilterRegionSuggestions(regions);
}

// Показать предложения регионов для фильтра
function showFilterRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.filter-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectFilterRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор региона для фильтра
function selectFilterRegion(regionName) {
    filterSelectedRegion = regionName;
    filterSelectedCity = null;
    
    document.querySelector('.filter-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.filter-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.filter-city-input').value = '';
    document.querySelector('.filter-city-input').focus();
    
    console.log('Выбран регион для фильтра:', regionName);
}

// Обработка ввода города для фильтра
function handleFilterCityInput(value) {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterCitySuggestions(filtered);
}

// Показать все города для фильтра
function showAllFilterCities() {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    showFilterCitySuggestions(cities);
}

// Показать предложения городов для фильтра
function showFilterCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.filter-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectFilterCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор города для фильтра
function selectFilterCity(cityName) {
    filterSelectedCity = cityName;
    
    document.querySelector('.filter-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showFilterSelectedLocation();
    
    // Загружаем анкеты по выбранной локации
    loadAdsByLocation(filterSelectedCountry, filterSelectedRegion, cityName);
    
    console.log('Выбран город для фильтра:', cityName);
    console.log('Полная локация фильтра:', `${locationData[filterSelectedCountry].name}, ${filterSelectedRegion}, ${cityName}`);
}

// Показать выбранную локацию для фильтра
function showFilterSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    const fullLocation = `${locationData[filterSelectedCountry].flag} ${filterSelectedRegion}, ${filterSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Установка UI фильтра на основе локации пользователя
function setFilterLocationUI() {
    if (!userLocation) {
        console.log('setFilterLocationUI: локация пользователя не установлена');
        return;
    }
    
    console.log('setFilterLocationUI: устанавливаем UI для локации', userLocation);
    
    // Устанавливаем активную кнопку страны
    const countryButtons = document.querySelectorAll('.filter-country');
    console.log('Найдено кнопок стран для фильтра:', countryButtons.length);
    
    countryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.country === userLocation.country) {
            btn.classList.add('active');
            console.log('Активирована кнопка страны:', btn.dataset.country);
        }
    });
    
    // Заполняем поля ввода
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    
    console.log('regionInput найден:', !!regionInput);
    console.log('cityInput найден:', !!cityInput);
    
    if (regionInput) regionInput.value = userLocation.region;
    if (cityInput) cityInput.value = userLocation.city;
    
    // Показываем все секции как заполненные
    const regionSection = document.querySelector('.filter-region-selection');
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    console.log('Секции найдены:', {
        regionSection: !!regionSection,
        citySection: !!citySection,
        selectedLocationDiv: !!selectedLocationDiv,
        locationText: !!locationText
    });
    
    if (regionSection) {
        regionSection.style.display = 'block';
        regionSection.style.opacity = '1';
    }
    
    if (citySection) {
        citySection.style.display = 'block';
        citySection.style.opacity = '1';
    }
    
    if (selectedLocationDiv && locationText) {
        const fullLocation = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        locationText.textContent = fullLocation;
        selectedLocationDiv.style.display = 'block';
        selectedLocationDiv.style.opacity = '1';
        console.log('Установлен текст локации:', fullLocation);
    }
    
    console.log('UI фильтра установлен на локацию пользователя:', userLocation);
}

// Сброс выбора локации для фильтра
function resetFilterLocationSelection() {
    filterSelectedCountry = null;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    // Скрываем все секции кроме выбора страны
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    hideAllSuggestions();
    
    // Загружаем все анкеты
    loadAds();
    
    console.log('Выбор локации фильтра сброшен');
}

// Загрузка анкет по локации
function loadAdsByLocation(country, region, city) {
    try {
        console.log('🌍 Запрос анкет по локации:', {country, region, city});
        
        // Формируем фильтры для загрузки
        const filters = {};
        if (country) filters.country = country;
        if (city) filters.city = city;
        
        console.log('🔍 Итоговые фильтры для API:', filters);
        
        // Загружаем через наш API
        loadAds(filters);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки анкет по локации:', error);
    }
}

// === ФУНКЦИИ ДЛЯ НАСТРОЙКИ ЛОКАЦИИ ===

// Выбор страны в настройке
function selectSetupCountry(countryCode) {
    setupSelectedCountry = countryCode;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].setup-country`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.setup-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.setup-city-selection').style.display = 'none';
    document.querySelector('.setup-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.setup-region-input').value = '';
    document.querySelector('.setup-city-input').value = '';
    
    console.log('Выбрана страна для настройки:', locationData[countryCode].name);
}

// Обработка ввода региона в настройке
function handleSetupRegionInput(value) {
    if (!setupSelectedCountry) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showSetupRegionSuggestions(filtered);
}

// Показать все регионы в настройке
function showAllSetupRegions() {
    if (!setupSelectedCountry) return;
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    showSetupRegionSuggestions(regions);
}

// Показать предложения регионов в настройке
function showSetupRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.setup-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectSetupRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона в настройке
function selectSetupRegion(regionName) {
    setupSelectedRegion = regionName;
    setupSelectedCity = null;
    
    document.querySelector('.setup-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.setup-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    const cityInput = document.querySelector('.setup-city-input');
    cityInput.value = '';
    
    console.log('Выбран регион в настройке:', regionName);
    console.log('Доступные города:', locationData[setupSelectedCountry].regions[regionName]);
    
    // Показываем все доступные города для выбранного региона
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

// Обработка ввода города в настройке
function handleSetupCityInput(value) {
    console.log('handleSetupCityInput вызвана со значением:', value);
    console.log('setupSelectedCountry:', setupSelectedCountry);
    console.log('setupSelectedRegion:', setupSelectedRegion);
    
    if (!setupSelectedCountry || !setupSelectedRegion) {
        console.log('Страна или регион не выбраны, выходим');
        return;
    }
    
    if (!value.trim()) {
        console.log('Пустое значение, скрываем предложения');
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[setupSelectedCountry].regions[setupSelectedRegion];
    console.log('Доступные города:', cities);
    
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    console.log('Отфильтрованные города:', filtered);
    
    showSetupCitySuggestions(filtered);
}

// Показать все города в настройке
function showAllSetupCities() {
    console.log('showAllSetupCities вызвана');
    console.log('setupSelectedCountry:', setupSelectedCountry);
    console.log('setupSelectedRegion:', setupSelectedRegion);
    
    if (!setupSelectedCountry || !setupSelectedRegion) {
        console.log('Страна или регион не выбраны, не показываем города');
        return;
    }
    
    const cities = locationData[setupSelectedCountry].regions[setupSelectedRegion];
    console.log('Города для региона', setupSelectedRegion, ':', cities);
    
    // Принудительно скрываем другие списки перед показом нового
    hideOtherSuggestions('setup-city-suggestions');
    showSetupCitySuggestions(cities);
}

// Показать предложения городов в настройке
function showSetupCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.setup-city-suggestions');
    
    console.log('showSetupCitySuggestions вызвана с городами:', cities);
    console.log('Контейнер найден:', suggestionsContainer);
    
    if (!suggestionsContainer) {
        console.error('Контейнер для предложений городов не найден!');
        return;
    }
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    // Очищаем и заполняем контент
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectSetupCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    // Принудительно показываем
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
    
    // Дополнительная проверка что элемент видим
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(suggestionsContainer);
        console.log('Стиль display после показа:', computedStyle.display);
        console.log('Класс active есть:', suggestionsContainer.classList.contains('active'));
    }, 10);
    console.log('Список городов отображен, HTML:', suggestionsContainer.innerHTML);
}

// Выбор города в настройке
function selectSetupCity(cityName) {
    setupSelectedCity = cityName;
    
    document.querySelector('.setup-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showSetupSelectedLocation();
    
    console.log('Выбран город в настройке:', cityName);
}

// Показать выбранную локацию в настройке
function showSetupSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.setup-selected-location');
    const locationText = document.querySelector('.setup-location-text');
    
    const fullLocation = `${locationData[setupSelectedCountry].flag} ${setupSelectedRegion}, ${setupSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.setup-region-selection').style.display = 'none';
    document.querySelector('.setup-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс настройки локации
function resetSetupLocation() {
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой на существование)
    const regionInput = document.querySelector('.setup-region-input');
    const cityInput = document.querySelector('.setup-city-input');
    
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой на существование)
    const regionSelection = document.querySelector('.setup-region-selection');
    const citySelection = document.querySelector('.setup-city-selection');
    const selectedLocation = document.querySelector('.setup-selected-location');
    
    if (regionSelection) regionSelection.style.display = 'none';
    if (citySelection) citySelection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Настройка локации сброшена');
}

// Отладочные функции
window.debugApp = {
    formData: () => console.log(formData),
    currentStep: () => console.log(currentStep),
    tg: () => console.log(tg),
    locationData: () => console.log(locationData),
    selectedLocation: () => console.log({selectedCountry, selectedRegion, selectedCity}),
    filterLocation: () => console.log({filterSelectedCountry, filterSelectedRegion, filterSelectedCity}),
    setupLocation: () => console.log({setupSelectedCountry, setupSelectedRegion, setupSelectedCity}),
    userLocation: () => console.log(userLocation),
    checkStorage: () => {
        const localData = localStorage.getItem('userLocation');
        console.log('localStorage userLocation:', localData);
        if (tg.CloudStorage) {
            tg.CloudStorage.getItem('userLocation', (err, value) => {
                console.log('CloudStorage userLocation:', {err, value});
            });
        }
    },
    clearUserLocation: () => {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation');
        }
        localStorage.removeItem('userLocation');
        userLocation = null;
        showAutoLocationDetection();
    },
    forceAutoDetection: () => {
        showAutoLocationDetection();
    }
};

// =============== ГАМБУРГЕР МЕНЮ ===============

function toggleHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.toggle('active');
}

function closeHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.remove('active');
}

// Закрытие меню при клике на overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeHamburgerMenu();
        }
    });
});

// Функции навигации по меню
function goToHome() {
    closeHamburgerMenu();
    showMainMenu();
    updateActiveMenuItem('home');
}

function showContacts() {
    closeHamburgerMenu();
    showScreen('contacts');
    updateActiveMenuItem('contacts');
}

// Флаг для отслеживания инициализации обработчиков формы
let emailFormHandlersInitialized = false;

function showEmailForm() {
    showScreen('emailForm');
    // Очищаем форму при открытии
    document.getElementById('senderEmail').value = '';
    document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
    document.getElementById('emailMessage').value = '';
    document.getElementById('emailStatus').style.display = 'none';
    
    // Показываем подсказку
    showEmailStatus('loading', '💡 Заполните форму ниже. Письмо будет отправлено через защищённый сервер anonimka.online');
    
    // Инициализируем обработчики только один раз
    if (!emailFormHandlersInitialized) {
        setTimeout(() => {
            setupEmailFormHandlers();
        }, 100);
    }
}

// Отдельная функция для настройки обработчиков формы (вызывается только один раз)
function setupEmailFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    
    console.log('setupEmailFormHandlers вызвана');
    console.log('contactForm найдена:', !!contactForm);
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleEmailSubmit);
        console.log('Обработчик submit добавлен к форме');
        emailFormHandlersInitialized = true;
    }
}

function showRules() {
    closeHamburgerMenu();
    showScreen('rules');
    updateActiveMenuItem('rules');
}

function showPrivacy() {
    closeHamburgerMenu();
    showScreen('privacy');
    updateActiveMenuItem('privacy');
}

function showAbout() {
    closeHamburgerMenu();
    showScreen('about');
    updateActiveMenuItem('about');
}

function updateActiveMenuItem(activeId) {
    // Убираем активный класс со всех элементов
    document.querySelectorAll('.hamburger-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс к нужному элементу
    const activeItem = document.querySelector(`.hamburger-item[onclick*="${activeId}"], .hamburger-item[onclick="goToHome()"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Функции для контактов
function openEmailComposer() {
    console.log('openEmailComposer вызвана');
    const recipient = 'aleksey@vorobey444.ru';
    const subject = encodeURIComponent('Обращение через anonimka.online');
    const body = encodeURIComponent(`Здравствуйте!\n\nПишу вам через анонимную доску анкет anonimka.online\n\n[Опишите вашу проблему или вопрос]\n\nС уважением,\n[Ваше имя]`);
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}

function openTelegramChat() {
    console.log('openTelegramChat вызвана');
    
    const telegramUrl = 'https://t.me/Vorobey_444';
    
    // Пробуем открыть через Telegram Web App API
    if (tg && tg.openTelegramLink) {
        console.log('Используем tg.openTelegramLink');
        tg.openTelegramLink(telegramUrl);
    } else if (tg && tg.openLink) {
        console.log('Используем tg.openLink');
        tg.openLink(telegramUrl);
    } else {
        console.log('Используем window.open как fallback');
        // Fallback - обычная ссылка
        window.open(telegramUrl, '_blank');
    }
}

// Настройка обработчиков событий для контактов
function setupContactsEventListeners() {
    console.log('Настройка обработчиков контактов');
    
    // НЕ добавляем обработчики формы здесь - они добавляются в setupEmailFormHandlers
    // который вызывается из showEmailForm()
    
    // Добавляем обработчики событий для Telegram контакта
    const telegramContact = document.querySelector('.contact-item[onclick*="openTelegramChat"]');
    
    if (telegramContact) {
        console.log('Найден элемент telegram контакта, добавляем обработчик');
        telegramContact.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по telegram контакту');
            openTelegramChat();
        });
    }
}

// Обработчик отправки письма - ГЛОБАЛЬНАЯ ФУНКЦИЯ
window.handleEmailSubmit = async function(event) {
    if (event) event.preventDefault();
    console.log('🚀 handleEmailSubmit вызвана - РАБОТАЕТ!');
    
    const senderEmail = document.getElementById('senderEmail');
    const subject = document.getElementById('emailSubject');
    const message = document.getElementById('emailMessage');
    const sendBtn = document.getElementById('sendEmailBtn');
    
    console.log('Элементы формы:', {
        senderEmail: !!senderEmail,
        subject: !!subject, 
        message: !!message,
        sendBtn: !!sendBtn
    });
    
    if (!senderEmail || !subject || !message) {
        console.error('❌ Не найдены элементы формы!');
        alert('Ошибка: элементы формы не найдены');
        return;
    }
    
    const emailValue = senderEmail.value.trim();
    const subjectValue = subject.value.trim();
    const messageValue = message.value.trim();
    
    console.log('Значения полей:', { emailValue, subjectValue, messageValue });
    
    // Валидация
    if (!emailValue || !messageValue) {
        console.log('❌ Валидация не прошла: пустые поля');
        showEmailStatus('error', '❌ Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (messageValue.length < 3) {
        console.log('❌ Валидация не прошла: короткое сообщение');
        showEmailStatus('error', '❌ Сообщение должно содержать минимум 3 символа');
        return;
    }
    
    console.log('✅ Валидация прошла успешно');
    
    // Подготавливаем данные письма заранее (нужно и для fallback в catch)
    const emailData = {
        senderEmail: (senderEmail?.value || '').trim(),
        subject: (subject?.value || 'Обращение через anonimka.online').trim() || 'Обращение через anonimka.online',
        message: (message?.value || '').trim()
    };

    // Показываем загрузку
    showEmailStatus('loading', '📤 Отправляем письмо...');
    if (sendBtn) sendBtn.disabled = true;
    
    try {
        // Обновим данные из проверенных полей (для надёжности)
        emailData.senderEmail = emailValue;
        emailData.subject = subjectValue || emailData.subject;
        emailData.message = messageValue;

        console.log('📧 Пытаемся отправить через бэкенд...');
        
        // Сначала пытаемся отправить через бэкенд
        const result = await sendEmailToBackend(emailData);
        
        // Если бэкенд сработал успешно
        if (result && result.success) {
            console.log('✅ Письмо отправлено через бэкенд!');
            showEmailStatus('success', '✅ Письмо успешно отправлено!');
            
            // Очищаем форму
            document.getElementById('senderEmail').value = '';
            document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
            document.getElementById('emailMessage').value = '';
            
            return; // Выходим из функции, не переходя к mailto
        }
        
        // Если бэкенд не сработал, fallback не нужен для localhost
        // (ошибка будет обработана в catch блоке)
        
    } catch (error) {
        console.error('❌ Ошибка при отправке через бэкенд:', error);
        
        // Fallback: открываем mailto
        console.log('📧 Переходим к mailto fallback...');
        
        const subject_encoded = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body_encoded = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject_encoded}&body=${body_encoded}`;
        
        console.log('📧 Mailto ссылка создана:', mailtoLink);
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        showEmailStatus('success', '✅ Почтовый клиент открыт! Если письмо не открылось, данные для ручной отправки ниже:');
        
        // Показываем данные для ручной отправки
        setTimeout(() => {
            showManualEmailOption(emailData);
        }, 2000);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
};
// Показать опцию ручной отправки
function showManualEmailOption(emailData) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = 'email-status error';
    statusDiv.innerHTML = `
        📋 <strong>Данные для ручной отправки:</strong>
        <br><br>
        <strong>На:</strong> aleksey@vorobey444.ru<br>
        <strong>От:</strong> ${emailData.senderEmail}<br>
        <strong>Тема:</strong> ${emailData.subject}<br>
        <strong>Сообщение:</strong><br>
        ${emailData.message.replace(/\n/g, '<br>')}
        <br><br>
        <button class="neon-button secondary" onclick="copyEmailData('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📋 Копировать данные
        </button>
        <button class="neon-button primary" onclick="openManualMailto('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📧 Открыть почту
        </button>
    `;
}

// Копировать данные письма
function copyEmailData(senderEmail, subject, message) {
    const emailText = `На: aleksey@vorobey444.ru
От: ${senderEmail}
Тема: ${subject}

${message}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailText).then(() => {
            showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
    }
}

// Открыть почтовый клиент вручную
function openManualMailto(senderEmail, subject, message) {
    const mailtoData = {
        senderEmail,
        subject,
        message
    };
    
    sendEmailViaMailto(mailtoData).then(result => {
        if (result.success) {
            showEmailStatus('success', result.message);
        } else {
            showEmailStatus('error', result.error);
        }
    });
}

// Глобальные функции для использования в onclick
window.copyEmailData = copyEmailData;
window.openManualMailto = openManualMailto;

// Показать статус отправки
function showEmailStatus(type, message) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = `email-status ${type}`;
    
    if (type === 'loading') {
        statusDiv.innerHTML = `<div class="loading-spinner"></div>${message}`;
    } else {
        statusDiv.innerHTML = message;
    }
    
    statusDiv.style.display = 'block';
    
    // Автоматически скрываем сообщение через 5 секунд (кроме ошибок)
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Отправка письма на бэкенд
async function sendEmailToBackend(emailData) {
    try {
        // Определяем URL бэкенда
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('Текущий хост:', window.location.hostname);
        console.log('Это localhost?', isLocalhost);
        
        // Для локального тестирования используем Yandex Email сервер
        if (isLocalhost) {
            const backendUrl = 'http://localhost:5000/send-email';
            console.log('📧 Отправляем через Yandex SMTP сервер:', backendUrl);
            console.log('📨 Данные письма:', emailData);
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Детали ошибки:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Успешная отправка через Yandex:', result);
            return result;
        }
        
        // Для продакшена используем простую отправку как в whish.online
        console.log('📧 Продакшен: отправляем как в whish.online - просто и надёжно...');
        
        // Загружаем простую функцию email
        if (typeof window.sendEmailWhishStyle === 'undefined') {
            console.log('Загружаем Email Service...');
            await loadEmailService();
        }

        // Используем простую функцию отправки
        return window.sendEmailWhishStyle(emailData);
    } catch (error) {
        console.log('Бэкенд недоступен, используем альтернативный способ');
        console.error('Ошибка при отправке на бэкенд:', error);
        
        // Если бэкенд недоступен, используем Telegram Bot API
        return await sendEmailViaTelegram(emailData);
    }
}

// Альтернативная отправка через Telegram бота или mailto
async function sendEmailViaTelegram(emailData) {
    try {
        // Сначала пробуем через Telegram Web App
        if (tg && tg.sendData) {
            console.log('Отправляем через Telegram Web App');
            tg.sendData(JSON.stringify({
                action: 'sendEmail',
                data: {
                    senderEmail: emailData.senderEmail,
                    subject: emailData.subject,
                    message: emailData.message
                }
            }));
            
            return {
                success: true,
                message: 'Сообщение отправлено через Telegram бота'
            };
        } else {
            console.log('Telegram Web App недоступен, используем mailto');
            // Используем стандартный mailto как последний вариант
            return sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Ошибка Telegram отправки:', error);
        return sendEmailViaMailto(emailData);
    }
}

// Отправка через стандартный mailto
async function sendEmailViaMailto(emailData) {
    try {
        const subject = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject}&body=${body}`;
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        return {
            success: true,
            message: 'Открыт почтовый клиент для отправки. Если письмо не открылось автоматически, скопируйте данные и отправьте вручную.'
        };
    } catch (error) {
        console.error('Ошибка mailto:', error);
        return {
            success: false,
            error: 'Не удалось открыть почтовый клиент. Отправьте письмо вручную на aleksey@vorobey444.ru'
        };
    }
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ЧАТАМИ =====

let currentChatId = null;
let chatPollingInterval = null;

// Показать список чатов
async function showMyChats() {
    showScreen('myChats');
    await loadMyChats();
}

// Переключение вкладок
function switchChatTab(tab) {
    // Переключаем активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    
    // Переключаем контент
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'active') {
        document.getElementById('activeChatsTab').classList.add('active');
    } else if (tab === 'requests') {
        document.getElementById('requestsTab').classList.add('active');
    }
}

// Загрузить список чатов пользователя
async function loadMyChats() {
    const activeChats = document.getElementById('activeChats');
    const chatRequests = document.getElementById('chatRequests');
    
    try {
        // Пытаемся получить userId из Telegram или localStorage
        let userId = tg.initDataUnsafe?.user?.id;
        
        if (!userId) {
            // Пробуем получить из сохраненных данных
            const savedUser = localStorage.getItem('telegram_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                userId = userData.id;
                console.log('✅ User ID получен из localStorage:', userId);
            }
        } else {
            console.log('✅ User ID получен из Telegram:', userId);
        }
        
        if (!userId) {
            console.error('❌ User ID не найден ни в Telegram, ни в localStorage');
            const errorHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">🔒</div>
                    <h3>Необходима авторизация</h3>
                    <p>Для доступа к чатам откройте приложение через Telegram бота</p>
                </div>
            `;
            activeChats.innerHTML = errorHTML;
            chatRequests.innerHTML = errorHTML;
            return;
        }

        console.log('📡 Загружаем чаты для пользователя:', userId);

        // Получаем принятые чаты через Neon API
        const acceptedResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId }
            })
        });
        const acceptedResult = await acceptedResponse.json();
        
        // Получаем входящие запросы через Neon API
        const pendingResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-pending',
                params: { userId }
            })
        });
        const pendingResult = await pendingResponse.json();

        if (acceptedResult.error || pendingResult.error) {
            const error = acceptedResult.error || pendingResult.error;
            console.warn('⚠️ Ошибка загрузки чатов:', error.message);
            const errorHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">⚠️</div>
                    <h3>Чаты недоступны</h3>
                    <p>Ошибка подключения к базе данных</p>
                </div>
            `;
            activeChats.innerHTML = errorHTML;
            chatRequests.innerHTML = errorHTML;
            return;
        }

        const acceptedChats = acceptedResult.data || [];
        const pendingRequests = pendingResult.data || [];

        console.log('📊 Принятые чаты:', acceptedChats.length);
        console.log('📊 Входящие запросы:', pendingRequests.length);
        console.log('📋 Детали запросов:', pendingRequests);

        // Обновляем счетчики
        document.getElementById('activeChatsCount').textContent = acceptedChats.length;
        document.getElementById('requestsCount').textContent = pendingRequests.length;

        // Отображаем открытые чаты
        if (acceptedChats.length === 0) {
            activeChats.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">💬</div>
                    <h3>Нет открытых чатов</h3>
                    <p>Принятые чаты появятся здесь</p>
                </div>
            `;
        } else {
            activeChats.innerHTML = acceptedChats.map(chat => {
                const lastMessageTime = chat.last_message_time ? formatChatTime(chat.last_message_time) : (chat.updated_at ? formatChatTime(chat.updated_at) : '');
                const lastMessage = chat.last_message || 'Нажмите для открытия чата';
                const lastMessagePreview = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
                
                return `
                    <div class="chat-card" onclick="openChat('${chat.id}')">
                        <div class="chat-card-header">
                            <span class="chat-ad-id" onclick="event.stopPropagation(); showAdModal('${chat.ad_id}');">💬 анкете #${chat.ad_id || 'N/A'}</span>
                            <span class="chat-time">${lastMessageTime}</span>
                        </div>
                        <div class="chat-preview">
                            ${lastMessagePreview}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Отображаем запросы на чаты
        if (pendingRequests.length === 0) {
            chatRequests.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">📨</div>
                    <h3>Нет новых запросов</h3>
                    <p>Запросы на чаты от других пользователей появятся здесь</p>
                </div>
            `;
        } else {
            chatRequests.innerHTML = pendingRequests.map(chat => {
                const requestTime = chat.created_at ? formatChatTime(chat.created_at) : '';
                // Определяем, кто отправитель (не текущий пользователь)
                const isUser1 = chat.user1 === userId;
                const senderId = isUser1 ? chat.user2 : chat.user1;
                const senderName = 'Анонимный пользователь';
                const messageText = chat.message || 'Хочет начать диалог';
                
                // Pro значок (будет добавлено после получения статуса)
                const proBadge = chat.sender_is_premium ? '<span class="pro-badge">⭐ PRO</span>' : '';
                
                return `
                    <div class="chat-request-card">
                        <div class="request-header">
                            <span class="request-ad-id">📨 анкете #${chat.ad_id || 'N/A'}</span>
                            <span class="request-time">${requestTime}</span>
                        </div>
                        <div class="request-message">
                            <strong>${senderName} ${proBadge}</strong><br>
                            "${messageText}"
                        </div>
                        <div class="request-actions">
                            <button class="request-btn request-btn-accept" onclick="acceptChatRequest('${chat.id}')">
                                ✅ Создать приватный чат
                            </button>
                            <button class="request-btn request-btn-reject" onclick="rejectChatRequest('${chat.id}')">
                                ❌ Отклонить
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('❌ Критическая ошибка в loadMyChats:', error);
        console.error('Stack trace:', error.stack);
        const errorHTML = `
            <div class="empty-chats">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>Не удалось загрузить чаты</p>
                <p style="font-size: 12px; color: #888;">${error.message}</p>
            </div>
        `;
        activeChats.innerHTML = errorHTML;
        chatRequests.innerHTML = errorHTML;
    }
}

// Принять запрос на чат
async function acceptChatRequest(chatId) {
    try {
        console.log('✅ Принимаем запрос на чат:', chatId);
        
        const userId = getCurrentUserId();
        
        // Используем Neon API
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'accept',
                params: { chatId, userId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.warn('⚠️ Ошибка:', result.error.message);
            tg.showAlert('Ошибка при принятии запроса');
            return;
        }

        tg.showAlert('✅ Чат создан!');
        await loadMyChats(); // Перезагружаем список
        updateChatBadge(); // Обновляем счетчик
        
    } catch (error) {
        console.error('Критическая ошибка acceptChatRequest:', error);
        tg.showAlert('Произошла ошибка');
    }
}

// Отклонить запрос на чат
async function rejectChatRequest(chatId) {
    try {
        console.log('❌ Отклоняем запрос на чат:', chatId);
        
        const userId = getCurrentUserId();
        
        // Используем Neon API
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reject',
                params: { chatId, userId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.warn('⚠️ Ошибка:', result.error.message);
            tg.showAlert('Ошибка при отклонении запроса');
            return;
        }

        tg.showAlert('Запрос отклонён');
        await loadMyChats(); // Перезагружаем список
        updateChatBadge(); // Обновляем счетчик
        
    } catch (error) {
        console.error('Критическая ошибка rejectChatRequest:', error);
        tg.showAlert('Произошла ошибка');
    }
}

// Обновить счетчик новых запросов и непрочитанных сообщений на кнопке "Мои чаты"
async function updateChatBadge() {
    try {
        const userId = getCurrentUserId();
        
        if (!userId || userId.startsWith('web_')) {
            return; // Не показываем счетчик для неавторизованных
        }

        // Получаем количество запросов
        const requestsResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'count-requests',
                params: { userId }
            })
        });
        const requestsResult = await requestsResponse.json();
        
        // Получаем количество непрочитанных сообщений
        const unreadResponse = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'total-unread',
                params: { userId }
            })
        });
        const unreadResult = await unreadResponse.json();
        
        const badge = document.getElementById('chatBadge');
        
        if (requestsResult.error || unreadResult.error) {
            // Тихо скрываем счетчик если есть ошибка
            console.warn('⚠️ Ошибка обновления счетчика чатов');
            if (badge) badge.style.display = 'none';
            return;
        }
        
        const requestsCount = requestsResult.data?.count || 0;
        const unreadCount = unreadResult.data?.count || 0;
        const totalCount = requestsCount + unreadCount;
        
        if (badge) {
            if (totalCount > 0) {
                badge.textContent = totalCount;
                badge.style.display = 'inline-block';
                console.log(`📊 Счётчик чатов: ${requestsCount} запросов + ${unreadCount} непрочитанных = ${totalCount}`);
            } else {
                badge.style.display = 'none';
            }
        }
        
    } catch (error) {
        // Тихо обрабатываем ошибку без вывода в консоль
        const badge = document.getElementById('chatBadge');
        if (badge) badge.style.display = 'none';
    }
}

// Открыть чат
async function openChat(chatId) {
    console.log('💬 Открываем чат:', chatId);
    
    currentChatId = chatId;
    showScreen('chatView');
    
    // Загружаем информацию о чате через Neon API
    try {
        const userId = getCurrentUserId();
        
        // Отмечаем пользователя как активного в этом чате
        await markUserActive(userId, chatId);
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (result.error || !result.data) {
            tg.showAlert('Ошибка загрузки чата');
            showMyChats();
            return;
        }
        
        // Находим нужный чат
        const chat = result.data.find(c => c.id == chatId);
        
        if (!chat) {
            tg.showAlert('Чат не найден');
            showMyChats();
            return;
        }

        // Обновляем заголовок
        document.getElementById('chatTitle').textContent = 'Анонимный чат';
        document.getElementById('chatAdId').textContent = `анкете #${chat.ad_id || 'N/A'}`;

        // Загружаем сообщения
        await loadChatMessages(chatId);
        
        // Принудительно скроллим вниз после загрузки
        const scrollContainer = document.querySelector('.chat-messages-container');
        setTimeout(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            console.log('🔽 Принудительный скролл после открытия чата');
        }, 200);
        
        // Помечаем сообщения как прочитанные
        await markMessagesAsRead(chatId);
        
        // Запускаем периодическое обновление сообщений
        startChatPolling(chatId);
        
    } catch (error) {
        console.error('Ошибка открытия чата:', error);
        tg.showAlert('Ошибка загрузки чата');
        showMyChats();
    }
}

// Загрузить сообщения чата
async function loadChatMessages(chatId, silent = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const scrollContainer = document.querySelector('.chat-messages-container');
    
    // Показываем загрузку только при первом открытии
    if (!silent) {
        messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 20px;">Загрузка сообщений...</p>';
    }
    
    try {
        // Получаем сообщения через Neon API
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: { chatId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.error('Ошибка загрузки сообщений:', result.error);
            if (!silent) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки сообщений</p>';
            }
            return;
        }

        const messages = result.data || [];

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Нет сообщений. Начните диалог!</p>';
            return;
        }

        const userId = getCurrentUserId();
        
        // Проверяем, нужно ли обновлять (есть ли новые сообщения)
        const currentMessagesCount = messagesContainer.querySelectorAll('.message').length;
        if (silent && currentMessagesCount === messages.length) {
            // Нет новых сообщений, не обновляем
            return;
        }
        
        // Сохраняем позицию скролла только для silent режима
        const wasAtBottom = silent ? 
            (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : 
            true; // При первой загрузке всегда скроллим вниз
        
        messagesContainer.innerHTML = messages.map(msg => {
            const isMine = msg.sender_id == userId;
            const messageClass = isMine ? 'sent' : 'received';
            const time = formatMessageTime(msg.created_at);
            
            // Ник для входящих сообщений из базы данных
            let nicknameHtml = '';
            if (!isMine) {
                // Используем sender_nickname из сообщения или fallback
                const nickname = msg.sender_nickname || 'Собеседник';
                nicknameHtml = `<div class="message-nickname">${escapeHtml(nickname)}</div>`;
            }
            
            // Фото если есть
            let photoHtml = '';
            if (msg.photo_url) {
                photoHtml = `<img src="${escapeHtml(msg.photo_url)}" class="message-photo" alt="Фото" onclick="showPhotoModal('${escapeHtml(msg.photo_url)}')" />`;
            }
            
            // Текст сообщения (если есть)
            let messageTextHtml = '';
            if (msg.message) {
                messageTextHtml = `<div class="message-text">${escapeHtml(msg.message)}</div>`;
            }
            
            // Статусы доставки (только для отправленных сообщений)
            let statusIcon = '';
            if (isMine) {
                if (msg.read) {
                    // Прочитано - 2 неоновые галочки
                    statusIcon = '<span class="message-status read">✓✓</span>';
                } else if (msg.delivered) {
                    // Доставлено - 2 серые галочки
                    statusIcon = '<span class="message-status delivered">✓✓</span>';
                } else {
                    // Отправлено - 1 серая галочка
                    statusIcon = '<span class="message-status sent">✓</span>';
                }
            }
            
            return `
                <div class="message ${messageClass}">
                    ${nicknameHtml}
                    ${photoHtml}
                    ${messageTextHtml}
                    <div class="message-time">${time} ${statusIcon}</div>
                </div>
            `;
        }).join('');

        // Прокручиваем вниз если это первая загрузка или были внизу
        if (!silent || wasAtBottom) {
            // Сначала пробуем немедленно
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            
            // Затем с небольшой задержкой для гарантии (браузер может не успеть отрендерить)
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
                console.log('📜 Скролл выполнен:', {
                    scrollTop: scrollContainer.scrollTop,
                    scrollHeight: scrollContainer.scrollHeight,
                    clientHeight: scrollContainer.clientHeight
                });
            }, 100);
            
            // И ещё раз с бОльшей задержкой на случай медленного рендеринга
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 300);
        }

    } catch (error) {
        console.error('Ошибка:', error);
        if (!silent) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки</p>';
        }
    }
}

// Отправить сообщение
// Глобальная переменная для выбранного фото
let selectedPhoto = null;

// Обработка выбора фото
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка размера (макс 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
        tg.showAlert('Файл слишком большой! Максимум 5 МБ');
        event.target.value = '';
        return;
    }
    
    // Проверка типа
    if (!file.type.startsWith('image/')) {
        tg.showAlert('Можно прикрепить только изображения!');
        event.target.value = '';
        return;
    }
    
    selectedPhoto = file;
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photoPreview');
        const img = document.getElementById('photoPreviewImage');
        img.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Удалить выбранное фото
function removePhoto() {
    selectedPhoto = null;
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').style.display = 'none';
}

// Показать фото в модальном окне
function showPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    modalImage.src = photoUrl;
    modal.classList.add('active');
    modal.style.display = 'flex';
}

// Закрыть модальное окно фото
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    modal.classList.remove('active');
    modal.style.display = 'none';
    modalImage.src = '';
}

// Загрузить фото в Telegram и получить file_id
async function uploadPhotoToTelegram(file, userId) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', userId);
        
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        return result.data;
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        throw error;
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input.value.trim();

    // Проверяем что есть либо текст либо фото
    if (!messageText && !selectedPhoto) return;
    
    if (!currentChatId) return;

    const userId = getCurrentUserId();
    if (!userId || userId.startsWith('web_')) {
        tg.showAlert('Ошибка: необходима авторизация');
        return;
    }

    try {
        let photoData = null;
        
        // Загружаем фото если выбрано
        if (selectedPhoto) {
            // Проверяем лимит
            const limitsCheck = await fetch('/api/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check-photo-limit',
                    params: { userId }
                })
            });
            const limitsResult = await limitsCheck.json();
            
            if (limitsResult.data && !limitsResult.data.canSend) {
                const isPremium = limitsResult.data.isPremium;
                if (isPremium) {
                    tg.showAlert('Технический лимит превышен');
                } else {
                    tg.showConfirm(
                        `У вас осталось ${limitsResult.data.remaining} фото сегодня.\nОформите PRO для безлимита!`,
                        (confirmed) => {
                            if (confirmed) showPremiumModal();
                        }
                    );
                }
                return;
            }
            
            // Показываем индикатор загрузки
            input.disabled = true;
            input.placeholder = '📤 Загрузка фото...';
            
            // Загружаем фото
            photoData = await uploadPhotoToTelegram(selectedPhoto, userId);
            
            console.log('✅ Фото загружено:', photoData);
        }
        
        // Получаем nickname отправителя
        const senderNickname = getUserNickname();
        
        // Отправляем сообщение через Neon API
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: { 
                    chatId: currentChatId, 
                    senderId: userId,
                    messageText: messageText || '📸 Фото',
                    senderNickname,
                    // Пропускаем уведомление в Telegram если есть фото
                    // Фото доступны только в WebApp
                    skipNotification: photoData ? true : false,
                    photoUrl: photoData?.photo_url || null,
                    telegramFileId: photoData?.file_id || null
                }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.error('Ошибка отправки:', result.error);
            
            // Проверяем ошибку лимита
            if (result.error.limit) {
                if (result.error.isPremium === false) {
                    tg.showConfirm(
                        result.error.message,
                        (confirmed) => {
                            if (confirmed) showPremiumModal();
                        }
                    );
                } else {
                    tg.showAlert(result.error.message);
                }
            } else {
                tg.showAlert('Ошибка отправки сообщения');
            }
            return;
        }

        // Обновляем статус Premium (лимиты изменились)
        if (photoData) {
            await loadPremiumStatus();
        }

        // Очищаем поле ввода и фото
        input.value = '';
        removePhoto();

        // Перезагружаем сообщения
        await loadChatMessages(currentChatId);

    } catch (error) {
        console.error('Ошибка:', error);
        tg.showAlert('Ошибка отправки сообщения: ' + error.message);
    } finally {
        // Восстанавливаем input
        input.disabled = false;
        input.placeholder = 'Введите сообщение...';
    }
}

// Пометить сообщения как прочитанные
async function markMessagesAsRead(chatId) {
    try {
        const userId = getCurrentUserId();
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-read',
                params: { chatId, userId }
            })
        });
        const result = await response.json();
        
        if (result.error) {
            console.warn('⚠️ Ошибка пометки сообщений как прочитанных:', result.error);
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsRead:', error);
    }
}

// Пометить сообщения как доставленные (при открытии приложения)
async function markMessagesAsDelivered() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            return; // Не помечаем для неавторизованных
        }
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-delivered',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (result.error) {
            console.warn('⚠️ Ошибка пометки сообщений как доставленных:', result.error);
        } else {
            console.log('✅ Сообщения помечены как доставленные');
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsDelivered:', error);
    }
}

// Запустить автообновление чата
function startChatPolling(chatId) {
    // Останавливаем предыдущий интервал
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    const userId = getCurrentUserId();

    // Обновляем каждые 3 секунды в silent режиме (без мигания)
    chatPollingInterval = setInterval(async () => {
        if (currentChatId === chatId) {
            await loadChatMessages(chatId, true); // true = silent режим
            // Обновляем активность пользователя
            await markUserActive(userId, chatId);
        } else {
            // Отмечаем как неактивного при выходе из чата
            await markUserInactive(userId);
            clearInterval(chatPollingInterval);
        }
    }, 3000);
}

// Форматирование времени для списка чатов
function formatChatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Форматирование времени для сообщений
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обработчик нажатия Enter в поле ввода
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// ============= ОТСЛЕЖИВАНИЕ АКТИВНОСТИ ПОЛЬЗОВАТЕЛЕЙ =============

// Отметить пользователя как активного в чате
async function markUserActive(userId, chatId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-active',
                params: { userId, chatId }
            })
        });
        console.log('👤 Активность отмечена:', { userId, chatId });
    } catch (error) {
        console.error('Ошибка отметки активности:', error);
    }
}

// Отметить пользователя как неактивного
async function markUserInactive(userId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-inactive',
                params: { userId }
            })
        });
        console.log('👋 Пользователь неактивен:', { userId });
    } catch (error) {
        console.error('Ошибка отметки неактивности:', error);
    }
}

// При закрытии приложения отмечаем пользователя как неактивного
window.addEventListener('beforeunload', () => {
    const userId = getCurrentUserId();
    if (userId) {
        // Используем sendBeacon для гарантированной отправки при закрытии
        navigator.sendBeacon('/api/user-activity', JSON.stringify({
            action: 'mark-inactive',
            params: { userId }
        }));
    }
});

// ============= МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА анкеты =============

// Показать анкете в модальном окне
async function showAdModal(adId) {
    const modal = document.getElementById('adModal');
    const modalBody = document.getElementById('adModalBody');
    
    if (!adId || adId === 'N/A') {
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>анкете не найдено</h3>
                <p>ID анкеты недоступен</p>
            </div>
        `;
        modal.style.display = 'flex';
        return;
    }
    
    // Показать модалку с загрузкой
    modal.style.display = 'flex';
    modalBody.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Загрузка анкеты...</p>
        </div>
    `;
    
    try {
        // Получаем анкете из базы
        const response = await fetch(`/api/ads?id=${adId}`);
        const result = await response.json();
        
        if (result.error || !result.data) {
            throw new Error(result.error?.message || 'анкете не найдено');
        }
        
        const ad = result.data;
        
        // Отображаем анкете
        modalBody.innerHTML = `
            <div class="ad-detail-view">
                <div class="ad-detail-header">
                    <h3>${escapeHtml(ad.title)}</h3>
                    <span class="ad-price">${ad.price ? ad.price + ' ₽' : 'Договорная'}</span>
                </div>
                
                ${ad.photo_url ? `
                    <div class="ad-photo">
                        <img src="${ad.photo_url}" alt="Фото анкеты" />
                    </div>
                ` : ''}
                
                <div class="ad-detail-info">
                    <p class="ad-description">${escapeHtml(ad.description || 'Без описания')}</p>
                    
                    <div class="ad-meta">
                        <div class="ad-meta-item">
                            <span class="meta-label">📍 Локация:</span>
                            <span class="meta-value">${ad.city || 'Не указано'}</span>
                        </div>
                        <div class="ad-meta-item">
                            <span class="meta-label">📅 Создано:</span>
                            <span class="meta-value">${formatChatTime(ad.created_at)}</span>
                        </div>
                        <div class="ad-meta-item">
                            <span class="meta-label">🆔 ID:</span>
                            <span class="meta-value">#${ad.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки анкеты:', error);
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Закрыть модальное окно
function closeAdModal() {
    const modal = document.getElementById('adModal');
    modal.style.display = 'none';
}

// Закрытие модалки по клику вне её
window.addEventListener('click', (event) => {
    const modal = document.getElementById('adModal');
    if (event.target === modal) {
        closeAdModal();
    }
    
    const premiumModal = document.getElementById('premiumModal');
    if (event.target === premiumModal) {
        closePremiumModal();
    }
});

// ============= PREMIUM СИСТЕМА =============

// Глобальная переменная для хранения статуса Premium
let userPremiumStatus = {
    isPremium: false,
    country: 'KZ',
    limits: null
};

// Загрузить статус Premium при запуске приложения
async function loadPremiumStatus() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            console.log('⚠️ Пользователь не авторизован, Premium статус недоступен');
            return;
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-user-status',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('Ошибка загрузки Premium статуса:', result.error);
            return;
        }
        
        userPremiumStatus = result.data;
        updatePremiumUI();
        updateAdLimitBadge();
        
        console.log('✅ Premium статус загружен:', userPremiumStatus);
    } catch (error) {
        console.error('Ошибка loadPremiumStatus:', error);
    }
}

// Обновить индикатор лимита анкет
function updateAdLimitBadge() {
    const badge = document.getElementById('adLimitBadge');
    if (!badge || !userPremiumStatus.limits) return;
    
    const adsLimit = userPremiumStatus.limits.ads;
    const used = adsLimit.used || 0;
    const max = adsLimit.max || 1;
    const remaining = adsLimit.remaining || 0;
    
    if (remaining === 0) {
        // Лимит исчерпан
        badge.textContent = `${used}/${max} 🚫`;
        badge.className = 'limit-badge danger';
        badge.style.display = 'block';
    } else if (remaining === 1 && !userPremiumStatus.isPremium) {
        // Осталось 1 (для FREE это последнее)
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge warning';
        badge.style.display = 'block';
    } else if (used > 0) {
        // Показываем прогресс
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge';
        badge.style.display = 'block';
    } else {
        // Ещё не создано анкет
        badge.style.display = 'none';
    }
}

// Обновить UI переключателя Premium
function updatePremiumUI() {
    const freeBtn = document.getElementById('freeBtn');
    const proBtn = document.getElementById('proBtn');
    
    if (!freeBtn || !proBtn) return;
    
    // Убираем активные классы
    freeBtn.classList.remove('active', 'free');
    proBtn.classList.remove('active', 'pro');
    
    if (userPremiumStatus.isPremium) {
        // PRO активен
        proBtn.classList.add('active', 'pro');
    } else {
        // FREE активен
        freeBtn.classList.add('active', 'free');
    }
}

// Показать модальное окно тарифов
async function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    modal.style.display = 'flex';
    
    // Загружаем цены для страны пользователя
    try {
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-pricing',
                params: { country: userPremiumStatus.country }
            })
        });
        
        const result = await response.json();
        
        if (result.data && result.data.pro) {
            // Обновляем цену PRO
            document.getElementById('proPriceAmount').textContent = result.data.pro.price;
            document.getElementById('proPriceCurrency').textContent = result.data.pro.currency;
        }
    } catch (error) {
        console.error('Ошибка загрузки цен:', error);
    }
    
    // Обновляем кнопки в зависимости от текущего статуса
    updatePremiumModalButtons();
}

// Закрыть модальное окно тарифов
function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    modal.style.display = 'none';
}

// Обновить кнопки в модальном окне
function updatePremiumModalButtons() {
    const freeBtn = document.querySelector('.pricing-card:not(.featured) .pricing-btn');
    const proBtn = document.getElementById('activatePremiumBtn');
    
    if (userPremiumStatus.isPremium) {
        // Пользователь PRO
        if (freeBtn) {
            freeBtn.textContent = 'Понизить до FREE';
            freeBtn.disabled = false;
            freeBtn.onclick = () => selectPlan('free');
        }
        if (proBtn) {
            proBtn.textContent = '✅ Активен';
            proBtn.disabled = true;
        }
    } else {
        // Пользователь FREE
        if (freeBtn) {
            freeBtn.textContent = 'Текущий план';
            freeBtn.disabled = true;
        }
        if (proBtn) {
            proBtn.textContent = 'Оформить PRO';
            proBtn.disabled = false;
        }
    }
}

// Выбор тарифа FREE (для теста - переключение обратно)
async function selectPlan(plan) {
    if (plan === 'free' && userPremiumStatus.isPremium) {
        // Отключаем Premium (только для теста)
        await activatePremium(); // Переключает статус
    }
}

// Активировать Premium (для теста - переключение)
async function activatePremium() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        // Показываем загрузку
        const btn = document.getElementById('activatePremiumBtn');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Обработка...';
        btn.disabled = true;
        
        // Переключаем статус (для теста)
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-premium',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        // Обновляем локальный статус
        userPremiumStatus.isPremium = result.data.isPremium;
        
        // Обновляем UI
        updatePremiumUI();
        updatePremiumModalButtons();
        
        // Показываем уведомление
        if (result.data.isPremium) {
            tg.showAlert('🎉 Поздравляем! PRO активирован на 30 дней!\n\nТеперь доступны:\n✅ Безлимит фото\n✅ До 3 анкет в день\n✅ Закрепление 3 раза в день');
        } else {
            tg.showAlert('Вы вернулись на FREE тариф\n\nДоступны базовые функции');
        }
        
        // Закрываем модалку через 1 секунду
        setTimeout(() => {
            closePremiumModal();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка активации Premium:', error);
        tg.showAlert('Ошибка: ' + error.message);
        
        // Возвращаем кнопку
        const btn = document.getElementById('activatePremiumBtn');
        if (btn) {
            btn.textContent = 'Оформить PRO';
            btn.disabled = false;
        }
    }
}

// Проверить лимит фото перед отправкой
async function checkPhotoLimit() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            return { canSend: false, reason: 'Необходима авторизация' };
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-photo-limit',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            return { canSend: false, reason: result.error.message };
        }
        
        if (!result.data.canSend) {
            const remaining = result.data.remaining || 0;
            return {
                canSend: false,
                reason: `Достигнут лимит фото на сегодня!\n\nFREE: 5 фото в день\nОсталось: ${remaining}\n\nОформите PRO для безлимита фото!`
            };
        }
        
        return { canSend: true };
    } catch (error) {
        console.error('Ошибка проверки лимита фото:', error);
        return { canSend: true }; // В случае ошибки разрешаем
    }
}

// Увеличить счётчик фото после успешной отправки
async function incrementPhotoCount() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) return;
        
        await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'increment-photo-count',
                params: { userId }
            })
        });
        
        // Обновляем статус
        await loadPremiumStatus();
    } catch (error) {
        console.error('Ошибка увеличения счётчика фото:', error);
    }
}

// Вызываем загрузку Premium статуса при инициализации
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем статус с задержкой, чтобы userId успел инициализироваться
    setTimeout(() => {
        loadPremiumStatus();
    }, 1000);
});


