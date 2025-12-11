/**
 * Модуль инициализации Telegram WebApp
 * Управляет интеграцией с Telegram и настройками приложения
 */

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
    close: () => {},
    showAlert: (message) => alert(message)
};

// Проверка, запущено ли приложение в Telegram
const isTelegramWebApp = !!(
    window.Telegram?.WebApp && 
    typeof window.Telegram.WebApp === 'object' &&
    typeof window.Telegram.WebApp.ready === 'function'
);

// Проверка поддержки emoji флагов
function checkEmojiFlagSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 20;
    canvas.height = 20;
    ctx.fillText('🇷🇺', 0, 15);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] !== 0 || imageData[i + 1] !== 0 || imageData[i + 2] !== 0) {
            return true;
        }
    }
    return false;
}

// Применяем класс если флаги поддерживаются
if (checkEmojiFlagSupport()) {
    document.body.classList.add('emoji-flags-supported');
}

/**
 * Инициализация Telegram WebApp
 */
function initializeTelegramWebApp() {
    console.log('🚀 [INIT] initializeTelegramWebApp started');
    console.log('🚀 [INIT] Telegram WebApp data:', {
        platform: tg?.platform,
        version: tg?.version,
        initData: !!tg?.initData,
        initDataUnsafe: tg?.initDataUnsafe,
        start_param: tg?.initDataUnsafe?.start_param,
        user: tg?.initDataUnsafe?.user
    });
    
    // Отслеживаем визит при загрузке
    trackPageVisit('home');
    
    // Запускаем автоматическое обновление статистики
    startStatsAutoUpdate();
    
    // Настройка темы
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Настройка главной кнопки
    tg.MainButton.setText('Главное меню');
    tg.MainButton.onClick(() => showMainMenu());
    
    // Настройка кнопки назад
    tg.BackButton.onClick(() => handleBackButton());
    
    // Перехват физической кнопки назад на Android через popstate
    window.addEventListener('popstate', (event) => {
        event.preventDefault();
        handleBackButton();
        // Возвращаем состояние чтобы не было двойного срабатывания
        window.history.pushState(null, '', window.location.href);
    });
    
    // Добавляем начальное состояние в историю
    window.history.pushState(null, '', window.location.href);
    
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

/**
 * Helper: безопасная проверка поддержки CloudStorage с учетом версии WebApp
 */
function supportsCloudStorage() {
    try {
        if (!tg || !tg.CloudStorage) return false;
        if (typeof tg.isVersionAtLeast === 'function') {
            return tg.isVersionAtLeast('6.9');
        }
        const v = parseFloat(tg.version || '0');
        return v >= 6.9;
    } catch (e) {
        return false;
    }
}

/**
 * Логирование данных об открытии страницы
 */
function trackPageVisit(page = 'home') {
    // Реализация в отдельном модуле аналитики
    console.log('📊 Page visit tracked:', page);
}

/**
 * Запуск автоматического обновления статистики
 */
function startStatsAutoUpdate() {
    // Реализация в отдельном модуле статистики
    console.log('📊 Stats auto-update started');
}

/**
 * Настройка автоскрытия скроллбаров
 */
function setupAutoHideScrollbars() {
    const scrollTimeouts = new WeakMap();
    
    function attachScrollHandler(element) {
        // Проверяем что элемент может скроллиться
        if (element.scrollHeight <= element.clientHeight) return;
        
        element.addEventListener('scroll', function() {
            // Добавляем класс при скролле
            this.classList.add('scrolling');
            
            // Очищаем предыдущий таймаут
            const existingTimeout = scrollTimeouts.get(this);
            if (existingTimeout) clearTimeout(existingTimeout);
            
            // Убираем класс через 2 секунды после остановки скролла
            const newTimeout = setTimeout(() => {
                this.classList.remove('scrolling');
            }, 2000);
            
            scrollTimeouts.set(this, newTimeout);
        }, { passive: true });
    }
    
    // Функция для проверки нужен ли скролл
    function checkScrollNeed(element) {
        // Исключаем карточки анкет и модальные окна с анкетами
        if (element.classList.contains('ad-card') || 
            element.closest('.ad-card') ||
            element.classList.contains('modal-ad-card')) {
            return;
        }
        
        if (element.scrollHeight > element.clientHeight) {
            element.style.overflowY = 'auto';
        } else {
            element.style.overflowY = 'visible';
        }
    }
    
    // Добавляем обработчики на все скроллируемые элементы (исключая карточки анкет)
    const scrollableElements = document.querySelectorAll('.screen, .modal-body:not(.ad-card), .messages-list, .chat-messages');
    scrollableElements.forEach(element => {
        if (!element.classList.contains('ad-card') && !element.closest('.ad-card')) {
            attachScrollHandler(element);
            checkScrollNeed(element);
        }
    });
    
    // Наблюдаем за новыми элементами и изменением размеров
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && 
                    !node.classList.contains('ad-card') && 
                    !node.closest('.ad-card')) {
                    attachScrollHandler(node);
                    checkScrollNeed(node);
                    node.querySelectorAll('.screen, .modal-body:not(.ad-card), .messages-list, .chat-messages').forEach(el => {
                        if (!el.classList.contains('ad-card') && !el.closest('.ad-card')) {
                            attachScrollHandler(el);
                            checkScrollNeed(el);
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Пересчитываем при изменении размера окна
    window.addEventListener('resize', () => {
        scrollableElements.forEach(checkScrollNeed);
    });
}

// Экспорт функций для onclick
window.initializeTelegramWebApp = initializeTelegramWebApp;
window.supportsCloudStorage = supportsCloudStorage;
window.trackPageVisit = trackPageVisit;
window.startStatsAutoUpdate = startStatsAutoUpdate;
window.setupAutoHideScrollbars = setupAutoHideScrollbars;

console.log('🔍 Проверка Telegram WebApp:');
console.log('  - window.Telegram:', !!window.Telegram);
console.log('  - window.Telegram.WebApp:', !!window.Telegram?.WebApp);
console.log('  - platform:', window.Telegram?.WebApp?.platform);
console.log('  - initData:', window.Telegram?.WebApp?.initData);
console.log('  - initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
console.log('  - isTelegramWebApp:', isTelegramWebApp);
