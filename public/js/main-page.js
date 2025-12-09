// ============= MAIN-PAGE.JS - Главное меню =============

console.log('✅ main-page.js loading...');

// Показать главное меню
function showMainMenu() {
    // Модальные окна авторизации нужны только на /welcome
    const telegramModal = document.getElementById('telegramAuthModal');
    const emailModal = document.getElementById('emailAuthModal');
    if (telegramModal) telegramModal.style.display = 'none';
    if (emailModal) emailModal.style.display = 'none';
    
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ Попытка открыть главное меню без никнейма');
        // Редирект на онбординг если нет никнейма
        window.location.href = '/onboarding';
        return;
    }
    
    showScreen('mainMenu');
    updateChatBadge();
    loadPremiumStatus();
    loadWorldChatPreview();
    hideEmailUserFeatures();
}

// Обновить счетчик непрочитанных чатов
async function updateChatBadge() {
    const badge = document.getElementById('chatBadge');
    if (!badge) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) return;
        
        const data = await apiRequest('/api/chats/unread-count', {
            method: 'POST',
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (data.success && data.unread_count > 0) {
            badge.textContent = data.unread_count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка загрузки счетчика чатов:', error);
    }
}

// Загрузить статус Premium
async function loadPremiumStatus() {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) return;
        
        const data = await apiRequest('/api/premium/status', {
            method: 'POST',
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (data.success) {
            updatePremiumUI(data.is_premium);
            updateAdLimitBadge(data.ads_count, data.max_ads);
        }
    } catch (error) {
        console.error('Ошибка загрузки Premium статуса:', error);
    }
}

// Обновить UI Premium
function updatePremiumUI(isPremium) {
    const freeBtn = document.getElementById('freeBtn');
    const proBtn = document.getElementById('proBtn');
    
    if (isPremium) {
        freeBtn?.classList.remove('active');
        proBtn?.classList.add('active');
    } else {
        freeBtn?.classList.add('active');
        proBtn?.classList.remove('active');
    }
}

// Обновить badge лимита анкет
function updateAdLimitBadge(currentAds, maxAds) {
    const badge = document.getElementById('adLimitBadge');
    if (!badge) return;
    
    if (currentAds >= maxAds) {
        badge.textContent = `${currentAds}/${maxAds}`;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Скрыть функции для email пользователей
function hideEmailUserFeatures() {
    const authMethod = localStorage.getItem('auth_method');
    if (authMethod === 'email') {
        // Скрываем функции доступные только для Telegram пользователей
        const referralBtn = document.getElementById('referralMainButton');
        if (referralBtn) referralBtn.style.display = 'none';
    }
}

// Гамбургер меню
function toggleHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay?.classList.toggle('active');
}

function closeHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay?.classList.remove('active');
}

// Навигация
function goToHome() {
    closeHamburgerMenu();
    showMainMenu();
}

// Загрузить превью последнего сообщения мир-чата
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tab: 'world',
                limit: 1
            })
        });
        
        if (!response.ok) return; // Игнорируем ошибки
        
        const data = await response.json();
        
        if (data.success && data.messages?.length > 0) {
            const preview = document.getElementById('worldChatPreview');
            if (!preview) return;
            
            const msg = data.messages[0];
            const cleanMessage = msg.text.replace(/^[@&\/]\s*/, '');
            preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.log('Превью мир-чата недоступно');
    }
}

// ============= НАВИГАЦИЯ NEXT.JS =============
// В отличие от WORK (SPA с showScreen), здесь используем навигацию между страницами

function showCreateAd() {
    console.log('🎯 [showCreateAd] Навигация на /create');
    
    // Проверка никнейма
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ Попытка создать объявление без никнейма');
        alert('Сначала выберите никнейм');
        window.location.href = '/onboarding';
        return;
    }
    
    // Проверка локации
    const location = localStorage.getItem('userCity');
    if (!location) {
        alert('Сначала выберите ваш город');
        window.location.href = '/location-setup';
        return;
    }
    
    window.location.href = '/create';
}

function showBrowseAds() {
    console.log('🎯 [showBrowseAds] Навигация на /browse');
    window.location.href = '/browse';
}

function showMyAds() {
    console.log('🎯 [showMyAds] Навигация на /my-ads');
    window.location.href = '/my-ads';
}

function showMyChats() {
    console.log('🎯 [showMyChats] Навигация на /chats');
    window.location.href = '/chats';
}

function showPolls() {
    console.log('🎯 [showPolls] Навигация на /polls');
    window.location.href = '/polls';
}

function showContacts() {
    console.log('🎯 [showContacts] Открытие модалки контактов');
    alert('Контакты:\nTelegram: @support\nEmail: support@anonimka.com');
}

function showReferralModal() {
    console.log('🎯 [showReferralModal] Открытие реферальной модалки');
    alert('Реферальная программа скоро будет доступна!');
}

function showPremiumModal() {
    console.log('🎯 [showPremiumModal] Открытие модалки Premium');
    alert('Премиум функции скоро будут доступны!');
}

// Экспорт функций
window.showMainMenu = showMainMenu;
window.updateChatBadge = updateChatBadge;
window.loadPremiumStatus = loadPremiumStatus;
window.loadWorldChatPreview = loadWorldChatPreview;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.goToHome = goToHome;

// Экспорт навигационных функций
window.showCreateAd = showCreateAd;
window.showBrowseAds = showBrowseAds;
window.showMyAds = showMyAds;
window.showMyChats = showMyChats;
window.showPolls = showPolls;
window.showContacts = showContacts;
window.showReferralModal = showReferralModal;
window.showPremiumModal = showPremiumModal;

console.log('✅ main-page.js loaded with navigation functions');
