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
    homeScreen: 'browseAds',           // Главный экран = просмотр анкет
    myProfileScreen: 'myProfileScreen',
    myAdsScreen: 'myAdsScreen',
    chatsScreen: 'chatsScreen',
    referralScreen: 'referralScreen',
    settingsScreen: 'settingsScreen'
};

let currentScreen = 'browseAds';

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
 * Переключить hamburger меню (альтернативное имя)
 */
function toggleHamburgerMenu() {
    toggleBurgerMenu();
}

/**
 * Закрыть hamburger меню (альтернативное имя)
 */
function closeHamburgerMenu() {
    closeBurgerMenu();
}

/**
 * Закрыть hamburger меню и перейти на главный экран
 */
function closeHamburgerAndGoHome() {
    closeBurgerMenu();
    showMainMenu();
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
 * Показать главное меню (синоним goToHome для HTML)
 */
function showMainMenu() {
    console.log('🏠 [MENU] Переход в главное меню');
    
    // Скрываем все экраны
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Показываем главный экран
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
        homeScreen.classList.add('active');
        homeScreen.style.display = 'flex';
    }
    
    // Обновляем Telegram кнопки
    if (typeof updateTelegramButtons === 'function') {
        updateTelegramButtons('homeScreen');
    }
    
    // Убираем Back Button в Telegram
    if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.hide();
    }
    
    currentScreen = 'homeScreen';
}

/**
 * Обработчик кнопки "Назад"
 */
function handleBackButton() {
    console.log('⬅️ [MENU] Кнопка "Назад" нажата');
    showMainMenu();
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
 * Показать правила (алиас)
 */
function showRules() {
    showRulesScreen();
}

/**
 * Показать модальное окно правил
 */
function showRulesModal() {
    document.getElementById('rulesModal').style.display = 'flex';
}

/**
 * Закрыть модальное окно правил
 */
function closeRulesModal() {
    document.getElementById('rulesModal').style.display = 'none';
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
 * Показать приватность (алиас)
 */
function showPrivacy() {
    showPrivacyScreen();
}

/**
 * Показать модальное окно приватности
 */
function showPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

/**
 * Закрыть модальное окно приватности
 */
function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
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
 * Показать контакты
 */
function showContacts() {
    const contactsScreen = document.getElementById('contactsScreen');
    if (contactsScreen) {
        // Скрываем все экраны
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        contactsScreen.classList.add('active');
        contactsScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать "О приложении"
 */
function showAbout() {
    const aboutScreen = document.getElementById('aboutScreen');
    if (aboutScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        aboutScreen.classList.add('active');
        aboutScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать редактор никнейма
 */
function showNicknameEditor() {
    showNicknameEditorScreen();
}

/**
 * Показать экран редактирования никнейма
 */
function showNicknameEditorScreen() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const nicknameScreen = document.getElementById('nicknameEditScreen');
    if (nicknameScreen) {
        nicknameScreen.classList.add('active');
        nicknameScreen.style.display = 'flex';
        
        // Заполняем текущий никнейм
        const input = nicknameScreen.querySelector('#nicknamePageInput');
        if (input) {
            const currentNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname') || '';
            input.value = currentNickname;
        }
    }
    closeBurgerMenu();
}

/**
 * Показать заблокированных пользователей
 */
function showBlockedUsers() {
    const blockedScreen = document.getElementById('blockedUsersScreen');
    if (blockedScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        blockedScreen.classList.add('active');
        blockedScreen.style.display = 'flex';
        
        // Загружаем список заблокированных
        if (typeof loadBlockedUsers === 'function') {
            loadBlockedUsers();
        }
    }
    closeBurgerMenu();
}

/**
 * Показать админ-панель
 */
function showAdminPanel() {
    const adminScreen = document.getElementById('adminScreen');
    if (adminScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        adminScreen.classList.add('active');
        adminScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать информацию об аффилиате
 */
function showAffiliateInfo() {
    const affiliateScreen = document.getElementById('affiliateInfoScreen');
    if (affiliateScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        affiliateScreen.classList.add('active');
        affiliateScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать опросы
 */
function showPolls() {
    const pollsScreen = document.getElementById('pollsScreen');
    if (pollsScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        pollsScreen.classList.add('active');
        pollsScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать FAQ Мирового чата
 */
function showWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Закрыть FAQ Мирового чата
 */
function closeWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'none';
    }
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
