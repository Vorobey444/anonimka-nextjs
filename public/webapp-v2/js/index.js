// ============= ГЛАВНАЯ СТРАНИЦА (МЕНЮ) =============

let currentUserLocation = null;

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация главной страницы...');
    
    // Проверяем авторизацию
    if (!checkAuth()) {
        console.log('Требуется авторизация');
        return;
    }
    
    // Загружаем данные
    await loadUserLocation();
    await loadAdLimitBadge();
    await loadChatBadge();
    await loadWorldChatPreview();
    await checkAdminStatus();
    await loadReferralButton();
});

// ============= ЗАГРУЗКА ЛОКАЦИИ =============

async function loadUserLocation() {
    try {
        // Проверяем localStorage
        const savedLocation = localStorage.getItem('userLocation');
        
        if (savedLocation) {
            currentUserLocation = JSON.parse(savedLocation);
            displayUserLocation();
            return;
        }
        
        // Если нет - загружаем из БД
        const userId = getUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (userId || userToken) {
            let url = '/api/users?';
            if (userId) url += `tgId=${userId}`;
            else if (userToken) url += `userToken=${userToken}`;
            
            const data = await apiRequest(url);
            
            if (data.success && data.location) {
                currentUserLocation = data.location;
                localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));
                displayUserLocation();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки локации:', error);
        displayUserLocation(); // Покажем "Загрузка..." или дефолтное значение
    }
}

function displayUserLocation() {
    const locationDisplay = document.getElementById('userLocationDisplay');
    if (!locationDisplay) return;
    
    if (!currentUserLocation) {
        locationDisplay.textContent = '📍 Выберите город';
        return;
    }
    
    const { country, region, city } = currentUserLocation;
    
    // Словарь флагов стран
    const countryFlags = {
        'kazakhstan': '🇰🇿',
        'russia': '🇷🇺',
        'belarus': '🇧🇾',
        'kyrgyzstan': '🇰🇬',
        'uzbekistan': '🇺🇿',
        'armenia': '🇦🇲',
        'azerbaijan': '🇦🇿',
        'moldova': '🇲🇩',
        'georgia': '🇬🇪'
    };
    
    const flag = countryFlags[country] || '📍';
    
    // Избегаем дублирования если регион = город
    const locationPart = region === city ? city : `${region}, ${city}`;
    locationDisplay.textContent = `${flag} ${locationPart}`;
}

// ============= ЛИМИТ АНКЕТ =============

async function loadAdLimitBadge() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/ads/my?tgId=${userId}`);
        
        if (data.success && data.ads) {
            const adCount = data.ads.length;
            const maxAds = 3; // TODO: получать из премиум-статуса
            
            const badge = document.getElementById('adLimitBadge');
            if (badge && adCount > 0) {
                badge.textContent = `${adCount}/${maxAds}`;
                badge.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки лимита анкет:', error);
    }
}

// ============= СЧЕТЧИК НЕПРОЧИТАННЫХ ЧАТОВ =============

async function loadChatBadge() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/chats?userId=${userId}`);
        
        if (data.success && data.chats) {
            const unreadCount = data.chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
            
            const badge = document.getElementById('chatBadge');
            if (badge && unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки счетчика чатов:', error);
    }
}

// ============= ПРЕВЬЮ МИР ЧАТА =============

async function loadWorldChatPreview() {
    try {
        const previewEl = document.getElementById('worldChatPreview');
        if (!previewEl) return;
        
        const data = await apiRequest('/api/world-chat/latest');
        
        if (data.success && data.message) {
            const { gender, text } = data.message;
            const genderIcon = gender === 'male' ? '👨' : '👩';
            previewEl.textContent = `${genderIcon}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
        } else {
            previewEl.textContent = 'Пока нет сообщений...';
        }
    } catch (error) {
        console.error('Ошибка загрузки превью мир чата:', error);
        const previewEl = document.getElementById('worldChatPreview');
        if (previewEl) previewEl.textContent = 'Загрузка...';
    }
}

// ============= АДМИН СТАТИСТИКА =============

async function checkAdminStatus() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/admin/check?userId=${userId}`);
        
        if (data.isAdmin) {
            await loadAdminStats();
        }
    } catch (error) {
        console.error('Ошибка проверки админ статуса:', error);
    }
}

async function loadAdminStats() {
    try {
        const data = await apiRequest('/api/admin/stats');
        
        if (data.success) {
            const adminStats = document.getElementById('adminStats');
            if (adminStats) {
                adminStats.style.display = 'flex';
                
                document.getElementById('totalVisits').textContent = data.totalVisits || 0;
                document.getElementById('onlineNow').textContent = data.onlineNow || 0;
                document.getElementById('totalAds').textContent = data.totalAds || 0;
                document.getElementById('blockedUsersCount').textContent = data.blockedUsers || 0;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки админ статистики:', error);
    }
}

// ============= РЕФЕРАЛЬНАЯ КНОПКА =============

async function loadReferralButton() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/users?tgId=${userId}`);
        
        if (data.success && !data.isPremium) {
            const button = document.getElementById('referralMainButton');
            if (button) {
                button.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки реферальной кнопки:', error);
    }
}

// ============= PREMIUM TOGGLE =============

document.getElementById('freeBtn')?.addEventListener('click', function() {
    // TODO: показать FREE контент
    this.classList.add('active');
    document.getElementById('proBtn').classList.remove('active');
});

document.getElementById('proBtn')?.addEventListener('click', function() {
    showPremiumModal();
});
