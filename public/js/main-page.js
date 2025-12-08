// ============= MAIN-PAGE.JS - Главное меню =============

// Показать главное меню
function showMainMenu() {
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

// Экспорт функций
window.showMainMenu = showMainMenu;
window.updateChatBadge = updateChatBadge;
window.loadPremiumStatus = loadPremiumStatus;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.goToHome = goToHome;
