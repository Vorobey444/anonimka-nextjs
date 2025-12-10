/**
 * Модуль навигации и меню (menu.js)
 * 
 * Функции:
 * - Управление экранами (меню, профиль, рефералка и т.д.)
 * - Переключение вкладок
 * - Бургер-меню
 */

console.log('📋 [MENU] Инициализация модуля навигации');

/**
 * Скрытые/видимые экраны
 */
const screens = {
    homeScreen: 'homeScreen',
    myProfileScreen: 'myProfileScreen',
    myAdsScreen: 'myAdsScreen',
    chatsScreen: 'chatsScreen',
    referralScreen: 'referralScreen',
    settingsScreen: 'settingsScreen'
};

let currentScreen = screens.homeScreen;

/**
 * ===== УПРАВЛЕНИЕ ЭКРАНАМИ =====
 */

/**
 * Показать определённый экран
 */
function showScreen(screenId) {
    console.log('📺 [MENU] Переход на экран:', screenId);
    
    // Скрываем все экраны
    Object.values(screens).forEach(screen => {
        const el = document.getElementById(screen);
        if (el) el.style.display = 'none';
    });
    
    // Показываем нужный экран
    const screenEl = document.getElementById(screenId);
    if (screenEl) {
        screenEl.style.display = 'flex';
        currentScreen = screenId;
        
        // Логируем для дебага
        console.log('✅ [MENU] Экран отображен');
    } else {
        console.warn('⚠️ [MENU] Экран не найден:', screenId);
    }
    
    // Обновляем меню кнопки
    updateMenuButtons();
    
    // Закрываем бургер-меню если открыто
    closeBurgerMenu();
    
    // Выполняем специфичные инициализации экрана
    initializeScreenContent(screenId);
}

/**
 * Инициализация контента экрана
 */
function initializeScreenContent(screenId) {
    switch(screenId) {
        case screens.homeScreen:
            // Главный экран - загружаем объявления
            console.log('🏠 [MENU] Инициализация главного экрана');
            if (typeof showBrowseAds === 'function') {
                showBrowseAds();
            }
            break;
            
        case screens.myProfileScreen:
            // Профиль - загружаем данные пользователя
            console.log('👤 [MENU] Инициализация профиля');
            if (typeof loadMyProfile === 'function') {
                loadMyProfile();
            }
            break;
            
        case screens.myAdsScreen:
            // Мои объявления
            console.log('📄 [MENU] Инициализация моих объявлений');
            if (typeof showMyAds === 'function') {
                showMyAds();
            }
            break;
            
        case screens.chatsScreen:
            // Чаты
            console.log('💬 [MENU] Инициализация чатов');
            if (typeof showMyChats === 'function') {
                showMyChats();
            }
            break;
            
        case screens.referralScreen:
            // Рефералка
            console.log('🎁 [MENU] Инициализация рефералки');
            if (typeof showReferralModal === 'function') {
                showReferralModal();
            }
            break;
            
        case screens.settingsScreen:
            // Настройки
            console.log('⚙️ [MENU] Инициализация настроек');
            if (typeof loadSettingsScreen === 'function') {
                loadSettingsScreen();
            }
            break;
    }
}

/**
 * ===== УПРАВЛЕНИЕ МЕНЮ КНОПКАМИ =====
 */

/**
 * Обновить состояние кнопок меню
 */
function updateMenuButtons() {
    const buttons = document.querySelectorAll('.menu-button');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        
        const targetScreen = btn.getAttribute('data-screen');
        if (targetScreen === currentScreen) {
            btn.classList.add('active');
        }
    });
}

/**
 * Инициализировать кнопки меню
 */
function initializeMenuButtons() {
    console.log('🔘 [MENU] Инициализация кнопок меню');
    
    const buttons = document.querySelectorAll('.menu-button');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            if (screen) {
                showScreen(screen);
            }
        });
    });
}

/**
 * ===== БУРГЕР МЕНЮ =====
 */

/**
 * Открыть/закрыть бургер-меню
 */
function toggleBurgerMenu() {
    const menu = document.getElementById('burgerMenu');
    const hamburger = document.querySelector('.hamburger-icon');
    
    if (!menu) return;
    
    const isOpen = menu.style.display === 'flex';
    
    if (isOpen) {
        closeBurgerMenu();
    } else {
        openBurgerMenu();
    }
}

/**
 * Открыть бургер-меню
 */
function openBurgerMenu() {
    const menu = document.getElementById('burgerMenu');
    const hamburger = document.querySelector('.hamburger-icon');
    
    if (menu) {
        menu.style.display = 'flex';
        menu.classList.add('open');
        
        if (hamburger) {
            hamburger.classList.add('active');
        }
        
        console.log('📖 [MENU] Бургер-меню открыто');
    }
}

/**
 * Закрыть бургер-меню
 */
function closeBurgerMenu() {
    const menu = document.getElementById('burgerMenu');
    const hamburger = document.querySelector('.hamburger-icon');
    
    if (menu) {
        menu.style.display = 'none';
        menu.classList.remove('open');
        
        if (hamburger) {
            hamburger.classList.remove('active');
        }
        
        console.log('📖 [MENU] Бургер-меню закрыто');
    }
}

/**
 * ===== БЫСТРЫЕ ПЕРЕХОДЫ =====
 */

/**
 * На главный экран
 */
function goToHome() {
    showScreen(screens.homeScreen);
}

/**
 * На профиль
 */
function goToProfile() {
    showScreen(screens.myProfileScreen);
}

/**
 * На мои объявления
 */
function goToMyAds() {
    showScreen(screens.myAdsScreen);
}

/**
 * На чаты
 */
function goToChats() {
    showScreen(screens.chatsScreen);
}

/**
 * На рефералку
 */
function goToReferral() {
    showScreen(screens.referralScreen);
}

/**
 * На настройки
 */
function goToSettings() {
    showScreen(screens.settingsScreen);
}

/**
 * ===== ДОПОЛНИТЕЛЬНЫЕ ЭКРАНЫ =====
 */

/**
 * Показать экран правил
 */
function showRulesScreen() {
    const modal = document.getElementById('rulesModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать экран приватности
 */
function showPrivacyScreen() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать экран контактов
 */
function showContactsScreen() {
    const modal = document.getElementById('contactsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Закрыть любой модальный экран
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Выход из аккаунта
 */
function logoutUser() {
    const confirm = window.confirm('Вы уверены? Вы выйдете из аккаунта и все данные будут удалены.');
    
    if (confirm) {
        console.log('🚪 [MENU] Выход из аккаунта');
        
        // Вызываем функцию выхода из auth.js
        if (typeof logout === 'function') {
            logout();
        }
        
        // Переходим на главный экран
        showScreen(screens.homeScreen);
        closeBurgerMenu();
    }
}

/**
 * Обработка обратных кнопок (Android)
 */
function setupBackButtonHandler() {
    if (!tg?.BackButton) return;
    
    // Обработка back-кнопки в Telegram
    tg.BackButton.onClick(() => {
        const menu = document.getElementById('burgerMenu');
        
        // Если меню открыто - закрываем его
        if (menu && menu.style.display === 'flex') {
            closeBurgerMenu();
            tg.BackButton.hide();
            return;
        }
        
        // Если на главном экране - ничего не делаем
        if (currentScreen === screens.homeScreen) {
            return;
        }
        
        // Иначе переходим на главный экран
        showScreen(screens.homeScreen);
    });
}

/**
 * ===== ИНИЦИАЛИЗАЦИЯ =====
 */

/**
 * Инициализировать модуль меню
 */
function initializeMenuModule() {
    console.log('🚀 [MENU] Инициализация модуля навигации');
    
    // Инициализируем кнопки меню
    initializeMenuButtons();
    
    // Инициализируем back button handler
    setupBackButtonHandler();
    
    // Показываем главный экран
    showScreen(screens.homeScreen);
    
    console.log('✅ [MENU] Модуль навигации инициализирован');
}

console.log('✅ [MENU] Модуль навигации загружен');
