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
    homeScreen: 'mainMenu',            // Главный экран = главное меню с кнопками
    myProfileScreen: 'mainMenu',       // Пока нет отдельного экрана профиля
    myAdsScreen: 'myAds',
    chatsScreen: 'myChats',
    referralScreen: 'mainMenu',        // Пока нет отдельного экрана реферала
    settingsScreen: 'mainMenu'         // Пока нет отдельного экрана настроек
};

let currentScreen = 'mainMenu';

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
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active');
        }
    });
    
    // Показываем нужный экран с правильными стилями
    const screenEl = document.getElementById(screenId);
    if (screenEl) {
        screenEl.style.display = 'flex';
        screenEl.style.flexDirection = 'column';
        screenEl.style.alignItems = 'center';
        screenEl.classList.add('active');
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
    
    // Обновляем кнопки Telegram
    if (typeof updateTelegramButtons === 'function') {
        updateTelegramButtons(screenId);
    }
}

/**
 * Инициализация контента экрана
 */
function initializeScreenContent(screenId) {
    switch(screenId) {
        case screens.homeScreen:
            // Главный экран - mainMenu
            console.log('🏠 [MENU] Инициализация главного экрана (mainMenu)');
            // Загружаем превью последнего сообщения для кнопки Мир чат
            if (typeof loadWorldChatPreview === 'function') {
                loadWorldChatPreview();
            }
            break;
            
        case 'browseAds':
            // Экран просмотра анкет - загружаем объявления
            console.log('👁️ [MENU] Инициализация экрана просмотра анкет');
            if (typeof loadAds === 'function') {
                loadAds();
            }
            // Устанавливаем UI фильтра локации
            if (typeof setFilterLocationUI === 'function') {
                setFilterLocationUI();
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
            // Мои объявления - загружаем список
            console.log('📄 [MENU] Инициализация моих объявлений');
            if (typeof loadMyAds === 'function') {
                loadMyAds();
            }
            break;
            
        case screens.chatsScreen:
            // Чаты - загружаем список чатов
            console.log('💬 [MENU] Инициализация чатов');
            if (typeof loadMyChats === 'function') {
                loadMyChats();
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
    const overlay = document.getElementById('hamburgerMenuOverlay');
    if (overlay) {
        overlay.classList.toggle('active');
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
 * Обновить активный пункт меню
 */
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

/**
 * Обновить кнопки Telegram в зависимости от экрана
 */
function updateTelegramButtons(screenId) {
    if (typeof tg === 'undefined' || !tg) return;
    
    switch(screenId) {
        case 'mainMenu':
        case 'homeScreen':
            if (tg.BackButton) tg.BackButton.hide();
            if (tg.MainButton) tg.MainButton.hide();
            break;
        case 'createAd':
        case 'browseAds':
        case 'adDetails':
        case 'chatScreen':
        case 'chatsScreen':
        case 'worldChatScreen':
        case 'locationSetup':
        case 'locationChoice':
        case 'autoLocationDetection':
        case 'referralScreen':
            if (tg.BackButton) tg.BackButton.show();
            if (tg.MainButton) tg.MainButton.hide();
            break;
        default:
            if (tg.BackButton) tg.BackButton.show();
            if (tg.MainButton) tg.MainButton.hide();
            break;
    }
}

/**
 * Обработчик кнопки назад в Telegram
 */
function handleBackButton() {
    const activeScreen = document.querySelector('.screen.active')?.id;
    
    switch(activeScreen) {
        case 'createAd':
        case 'browseAds':
        case 'chatsScreen':
        case 'worldChatScreen':
        case 'locationSetup':
        case 'locationChoice':
        case 'autoLocationDetection':
        case 'referralScreen':
            showMainMenu();
            break;
        case 'adDetails':
            if (typeof showBrowseAds === 'function') showBrowseAds();
            break;
        case 'chatScreen':
            if (typeof showScreen === 'function') showScreen('chatsScreen');
            break;
        default:
            showMainMenu();
    }
}

/**
 * Открыть бургер-меню
 */
function openBurgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    if (overlay) {
        overlay.classList.add('active');
        console.log('📖 [MENU] Бургер-меню открыто');
    }
}

/**
 * Закрыть бургер-меню
 */
function closeBurgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    if (overlay) {
        overlay.classList.remove('active');
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
    
    // Обновляем отображение локации
    if (typeof updateLocationDisplay === 'function') {
        updateLocationDisplay();
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
async function showBlockedUsers() {
    closeBurgerMenu();
    const container = document.getElementById('blockedUsersContainer');
    
    // Показываем экран
    const blockedScreen = document.getElementById('blockedUsersScreen');
    if (blockedScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        blockedScreen.classList.add('active');
        blockedScreen.style.display = 'flex';
    }
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Загрузка...</p>
        </div>
    `;
    
    try {
        // Получаем идентификатор пользователя (userToken для email, userId для Telegram)
        let userToken = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userToken || userToken === 'null' || userToken === 'undefined') {
            const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
            if (!userId || userId.startsWith('web_')) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="neon-icon">🔒</div>
                        <h3>Требуется авторизация</h3>
                        <p>Для просмотра заблокированных пользуйтесь Telegram</p>
                    </div>
                `;
                return;
            }
            userToken = userId;
        }
        
        const response = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-blocked-users',
                params: { userToken: userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка</h3>
                    <p>${result.error}</p>
                </div>
            `;
            return;
        }
        
        const blockedUsers = result.data || [];
        
        if (blockedUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="neon-icon">✅</div>
                    <h3>Список пуст</h3>
                    <p>У вас нет заблокированных пользователей</p>
                </div>
            `;
            return;
        }
        
        const escapeHtmlFn = typeof escapeHtml === 'function' ? escapeHtml : (str) => str;
        const formatTimeFn = typeof formatChatTime === 'function' ? formatChatTime : (t) => t;
        
        container.innerHTML = blockedUsers.map(user => `
            <div class="blocked-user-card">
                <div class="blocked-user-info">
                    <span class="blocked-user-icon">👤</span>
                    <div class="blocked-user-details">
                        <div class="blocked-user-name">${escapeHtmlFn(user.blocked_nickname || 'Неизвестный')}</div>
                        <div class="blocked-user-date">Заблокирован ${formatTimeFn(user.created_at)}</div>
                    </div>
                </div>
                <button class="unblock-btn" onclick="unblockUserFromList('${user.blocked_token}')" title="Разблокировать">
                    ×
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки заблокированных:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>Не удалось загрузить список</p>
            </div>
        `;
    }
}

/**
 * Разблокировать пользователя из списка заблокированных
 */
async function unblockUserFromList(blockedId) {
    const userToken = localStorage.getItem('user_token');
    
    tg.showConfirm('Разблокировать пользователя?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/user-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unblock-user',
                    params: { blockerToken: userToken, blockedToken: blockedId }
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка: ' + result.error);
                return;
            }
            
            tg.showAlert('✅ Пользователь разблокирован');
            // Перезагружаем список
            showBlockedUsers();
            
        } catch (error) {
            console.error('Ошибка разблокировки:', error);
            tg.showAlert('Ошибка при разблокировке');
        }
    });
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

// Алиасы для совместимости
function showNicknameChange() {
    showNicknameEditor();
}

function showAffiliateProgram() {
    showAffiliateInfo();
}

// Экспорт функций в глобальную область
window.showScreen = showScreen;
window.showMainMenu = showMainMenu;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.toggleBurgerMenu = toggleBurgerMenu;
window.closeBurgerMenu = closeBurgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.openBurgerMenu = openBurgerMenu;
window.showPolls = showPolls;
window.showContacts = showContacts;
window.showAbout = showAbout;
window.showNicknameChange = showNicknameChange;
window.showNicknameEditor = showNicknameEditor;
window.showBlockedUsers = showBlockedUsers;
window.unblockUserFromList = unblockUserFromList;
window.showAdminPanel = showAdminPanel;
window.showAffiliateProgram = showAffiliateProgram;
window.showAffiliateInfo = showAffiliateInfo;
window.initializeMenuModule = initializeMenuModule;
window.closeHamburgerAndGoHome = closeHamburgerAndGoHome;
window.updateActiveMenuItem = updateActiveMenuItem;
window.updateTelegramButtons = updateTelegramButtons;
window.handleBackButton = handleBackButton;
window.goToHome = goToHome;
window.goToProfile = goToProfile;
window.goToMyAds = goToMyAds;
window.goToChats = goToChats;
window.goToReferral = goToReferral;
window.goToSettings = goToSettings;
window.showRulesScreen = showRulesScreen;
window.showRules = showRules;
window.showRulesModal = showRulesModal;
window.closeRulesModal = closeRulesModal;
window.showPrivacyScreen = showPrivacyScreen;
window.showPrivacy = showPrivacy;
window.showPrivacyModal = showPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.showContactsScreen = showContactsScreen;
window.closeModal = closeModal;
window.logoutUser = logoutUser;
window.showWorldChatFAQ = showWorldChatFAQ;
window.closeWorldChatFAQ = closeWorldChatFAQ;
window.showNicknameEditorScreen = showNicknameEditorScreen;
window.handleBackButton = handleBackButton;
window.updateMenuButtons = updateMenuButtons;
window.initializeMenuButtons = initializeMenuButtons;

/**
 * Открыть партнёрскую программу в Telegram боте
 */
function openAffiliateProgram() {
    const botUsername = 'anonimka_kz_bot';
    const botProfileUrl = `https://t.me/${botUsername}`;
    
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(botProfileUrl);
    } else {
        window.open(botProfileUrl, '_blank');
    }
}

/**
 * Голосование в опросе
 */
async function votePoll(pollId, answer) {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        alert('Ошибка: токен пользователя не найден');
        return;
    }
    
    try {
        const response = await fetch('/api/poll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Token': userToken
            },
            body: JSON.stringify({
                poll_id: pollId,
                answer: answer
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem(`poll_voted_${pollId}`, 'true');
            loadPollResults(pollId);
        } else {
            if (data.error === 'Already voted') {
                alert('Вы уже проголосовали в этом опросе!');
                loadPollResults(pollId);
            } else {
                alert('Ошибка голосования: ' + (data.error || 'Неизвестная ошибка'));
            }
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        alert('Ошибка соединения с сервером');
    }
}

/**
 * Загрузить результаты опроса
 */
async function loadPollResults(pollId) {
    let prefix = '';
    if (pollId === 'photos_in_ads') {
        prefix = 'photos';
    }
    
    const optionsElement = document.getElementById(`${prefix}PollOptions`);
    const resultsElement = document.getElementById(`${prefix}PollResults`);
    
    if (!optionsElement || !resultsElement) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const headers = { 'Content-Type': 'application/json' };
        if (userToken) headers['X-User-Token'] = userToken;
        
        const response = await fetch(`/api/poll?poll_id=${pollId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            const total = data.results.yes + data.results.no;
            const yesPercent = total > 0 ? Math.round((data.results.yes / total) * 100) : 0;
            const noPercent = total > 0 ? Math.round((data.results.no / total) * 100) : 0;
            
            if (data.hasVoted) {
                optionsElement.style.display = 'none';
                resultsElement.style.display = 'block';
                resultsElement.innerHTML = `
                    <div class="poll-result">
                        <span>✅ Да</span>
                        <div class="progress-bar"><div class="progress" style="width: ${yesPercent}%"></div></div>
                        <span>${yesPercent}% (${data.results.yes})</span>
                    </div>
                    <div class="poll-result">
                        <span>❌ Нет</span>
                        <div class="progress-bar"><div class="progress" style="width: ${noPercent}%"></div></div>
                        <span>${noPercent}% (${data.results.no})</span>
                    </div>
                    <p style="margin-top: 10px; color: var(--muted);">Всего голосов: ${total}</p>
                `;
            } else {
                optionsElement.style.display = 'flex';
                resultsElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
    }
}

/**
 * Установить приложение на рабочий стол
 */
function promptInstallApp() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown';
    
    if (!isTelegramWebApp && window.deferredPWAPrompt) {
        window.deferredPWAPrompt.prompt();
        window.deferredPWAPrompt.userChoice.then((choiceResult) => {
            window.deferredPWAPrompt = null;
        });
        return;
    }
    
    if (!isTelegramWebApp && !window.deferredPWAPrompt) {
        if (isIOS) {
            tg.showAlert(
                '📲 Установка на iPhone (Safari):\\n\\n' +
                '1️⃣ Нажмите кнопку "Поделиться" (квадрат со стрелкой)\\n\\n' +
                '2️⃣ Прокрутите вниз и выберите "На экран Домой"\\n\\n' +
                '3️⃣ Нажмите "Добавить"\\n\\n' +
                '✨ Готово! Иконка появится на рабочем столе'
            );
        } else {
            tg.showAlert(
                '📲 Установка в браузере:\\n\\n' +
                '1. Откройте меню браузера (⋮ или ⚙️)\\n' +
                '2. Выберите "Установить приложение" или "Добавить на главный экран"\\n' +
                '3. Подтвердите установку'
            );
        }
        return;
    }
    
    if (window.Telegram?.WebApp?.addToHomeScreen && !isIOS) {
        try {
            window.Telegram.WebApp.addToHomeScreen();
        } catch (error) {
            tg.showAlert('❌ Не удалось создать ярлык. Попробуйте через меню Telegram (⋮).');
        }
    } else {
        if (isIOS) {
            tg.showAlert(
                '📲 Установка на iPhone:\\n\\n' +
                '1️⃣ Нажмите ⋮ (три точки) в ПРАВОМ ВЕРХНЕМ углу\\n\\n' +
                '2️⃣ Выберите "Создать ярлык" или "Add to Home Screen"\\n\\n' +
                '3️⃣ Нажмите "Добавить"'
            );
        } else {
            tg.showAlert(
                '📲 Создание ярлыка:\\n\\n' +
                '1. Откройте меню Telegram (⋮ в правом верхнем углу)\\n' +
                '2. Выберите "Создать ярлык"\\n' +
                '3. Подтвердите добавление на рабочий стол'
            );
        }
    }
}

/**
 * Переключение вкладок админ-панели
 */
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const tabContent = document.getElementById(`admin-${tab}`);
    if (tabContent) tabContent.style.display = 'block';
    
    if (tab === 'users') loadAdminUsers();
}

/**
 * Загрузить список пользователей для админ-панели
 */
async function loadAdminUsers() {
    try {
        const container = document.getElementById('admin-users-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка...</div>';
        
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = '<div class="error">Ошибка загрузки</div>';
            return;
        }
        
        if (!data.users?.length) {
            container.innerHTML = '<div class="empty">Нет пользователей</div>';
            return;
        }
        
        container.innerHTML = data.users.map(user => `
            <div class="admin-user-item">
                <div class="user-info">
                    <span class="nickname">${user.display_nickname || 'Аноним'}</span>
                    <span class="id">ID: ${user.telegram_id || user.id}</span>
                </div>
                <div class="user-status ${user.is_premium ? 'premium' : ''}">
                    ${user.is_premium ? '⭐ PRO' : 'FREE'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

/**
 * Отправить уведомление всем пользователям
 */
async function sendAdminNotification() {
    const message = document.getElementById('adminNotificationText')?.value?.trim();
    if (!message) {
        tg.showAlert('Введите текст уведомления');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        if (data.success) {
            tg.showAlert(`✅ Отправлено ${data.count} уведомлений`);
            document.getElementById('adminNotificationText').value = '';
        } else {
            tg.showAlert('Ошибка: ' + data.error);
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        tg.showAlert('Ошибка при отправке');
    }
}

/**
 * ===== АДМИНСКИЕ ФУНКЦИИ =====
 */

// Переменные для статуса админа
let isAdminUser = false;
let adminCheckCompleted = false;

/**
 * Загрузить статистику сайта (для админов)
 */
async function loadSiteStats() {
    try {
        // Проверяем is_admin только один раз
        if (!adminCheckCompleted) {
            let userId = tg?.initDataUnsafe?.user?.id;
            if (!userId) {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        userId = userData?.id;
                    } catch (e) {
                        console.warn('[ADMIN STATS] Ошибка парсинга telegram_user:', e);
                    }
                }
            }
            
            const userToken = localStorage.getItem('user_token');
            
            if (userId) {
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&user_id=${userId}`);
                    const userStatusData = await userStatusResponse.json();
                    isAdminUser = userStatusData.is_admin === true;
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа:', err);
                }
            } else if (userToken) {
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&userToken=${userToken}`);
                    const userStatusData = await userStatusResponse.json();
                    isAdminUser = userStatusData.is_admin === true;
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа по токену:', err);
                }
            }
            
            adminCheckCompleted = true;
            
            // Скрываем/показываем элементы админа
            const adminStatsEl = document.getElementById('adminStats');
            if (adminStatsEl) {
                adminStatsEl.style.display = isAdminUser ? 'flex' : 'none';
            }

            const adminMenuItem = document.getElementById('adminMenuItem');
            if (adminMenuItem) {
                adminMenuItem.style.display = isAdminUser ? 'flex' : 'none';
            }
        }
        
        if (!isAdminUser) return;
        
        const response = await fetch('/api/analytics?metric=all');
        const data = await response.json();
        
        const totalVisitsEl = document.getElementById('totalVisits');
        const onlineNowEl = document.getElementById('onlineNow');
        const totalAdsEl = document.getElementById('totalAds');
        const blockedUsersEl = document.getElementById('blockedUsersCount');
        
        if (totalVisitsEl && data.total_unique_users !== undefined) {
            totalVisitsEl.textContent = formatNumber(data.total_unique_users);
        }
        
        if (onlineNowEl && data.unique_last_24h !== undefined) {
            onlineNowEl.textContent = formatNumber(data.unique_last_24h);
        }
        
        if (totalAdsEl && data.total_ads !== undefined) {
            totalAdsEl.textContent = formatNumber(data.total_ads);
        }
        
        if (blockedUsersEl && data.blocked_users !== undefined) {
            blockedUsersEl.textContent = formatNumber(data.blocked_users);
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

/**
 * Запустить автообновление статистики
 */
function startStatsAutoUpdate() {
    loadSiteStats();
    setInterval(() => {
        if (isAdminUser) {
            loadSiteStats();
        }
    }, 10000);
}

/**
 * Форматирование чисел
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
}

/**
 * Форматирование даты
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

/**
 * Запрос к API администратора
 */
async function fetchAdminData(action, params = {}) {
    const adminToken = localStorage.getItem('user_token');
    if (!adminToken) {
        throw new Error('Не найден user_token для запроса администратора');
    }

    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params, adminToken })
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Ошибка админ-запроса');
    }
    return data;
}

/**
 * Забанить пользователя (админ)
 */
async function banUserFromAdmin(userToken) {
    const reason = prompt('Причина блокировки?', 'Нарушение правил');
    if (reason === null) return;
    const hoursInput = prompt('Длительность бана в часах (пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    try {
        await fetchAdminData('ban-user', { userToken, reason, durationHours });
        loadAdminUsers();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

/**
 * Снять бан с пользователя (админ)
 */
async function unbanUserFromAdmin(userToken) {
    if (!confirm('Снять бан с пользователя?')) return;
    try {
        await fetchAdminData('unban-user', { userToken });
        loadAdminUsers();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

/**
 * Заблокировать анкету (админ)
 */
async function blockAdFromAdmin(adId) {
    const reason = prompt('Причина блокировки анкеты?', 'Модерация');
    if (reason === null) return;
    const hoursInput = prompt('Длительность блокировки (часов, пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    try {
        await fetchAdminData('block-ad', { adId, reason, durationHours });
        if (typeof loadAdminAds === 'function') loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

/**
 * Разблокировать анкету (админ)
 */
async function unblockAdFromAdmin(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    try {
        await fetchAdminData('unblock-ad', { adId });
        if (typeof loadAdminAds === 'function') loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

window.openAffiliateProgram = openAffiliateProgram;
window.votePoll = votePoll;
window.loadPollResults = loadPollResults;
window.promptInstallApp = promptInstallApp;
window.switchAdminTab = switchAdminTab;
window.loadAdminUsers = loadAdminUsers;
window.sendAdminNotification = sendAdminNotification;
window.loadSiteStats = loadSiteStats;
window.startStatsAutoUpdate = startStatsAutoUpdate;
window.fetchAdminData = fetchAdminData;
window.banUserFromAdmin = banUserFromAdmin;
window.unbanUserFromAdmin = unbanUserFromAdmin;
window.blockAdFromAdmin = blockAdFromAdmin;
window.unblockAdFromAdmin = unblockAdFromAdmin;
window.formatDateTime = formatDateTime;

/**
 * Проверяет является ли это Android приложение
 */
function isAndroidApp() {
    return typeof AndroidAuth !== 'undefined' && AndroidAuth.isAndroid && AndroidAuth.isAndroid();
}

/**
 * Инициализирует Android-специфичные элементы меню
 */
function initializeAndroidMenu() {
    if (!isAndroidApp()) {
        console.log('📱 [MENU] Not Android app, hiding Android-specific menu items');
        document.querySelectorAll('.android-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'flex');
        return;
    }
    
    console.log('✅ [MENU] Android app detected, showing Android menu items');
    document.querySelectorAll('.android-only').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'none');
}

window.isAndroidApp = isAndroidApp;
window.initializeAndroidMenu = initializeAndroidMenu;

// Инициализируем Android меню при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAndroidMenu);
} else {
    initializeAndroidMenu();
}

// Закрытие меню при клике вне меню (как в backup)
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    const menu = overlay?.querySelector('.hamburger-menu-content');
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    
    if (overlay && menu) {
        document.addEventListener('click', (e) => {
            // Если меню открыто и клик НЕ внутри меню и НЕ на кнопке открытия
            if (overlay.classList.contains('active') && 
                !menu.contains(e.target) && 
                !hamburgerBtn?.contains(e.target)) {
                closeBurgerMenu();
            }
        });
    }
});

console.log('✅ [MENU] Модуль навигации загружен');
