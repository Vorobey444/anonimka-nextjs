// ============= ОБЩИЕ КОНСТАНТЫ И ПЕРЕМЕННЫЕ =============

// Telegram Web App инициализация
let tg = window.Telegram?.WebApp || {
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    MainButton: { setText: () => {}, onClick: () => {}, show: () => {}, hide: () => {} },
    BackButton: { onClick: () => {}, show: () => {}, hide: () => {} },
    initDataUnsafe: { user: null },
    ready: () => {},
    close: () => {},
    showAlert: (message) => alert(message)
};

const isTelegramWebApp = !!(window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown');

// ============= API ФУНКЦИИ =============

// Универсальная функция для API запросов
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Добавляем user_token если есть
    const userToken = localStorage.getItem('user_token');
    if (userToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${userToken}`;
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ============= ФУНКЦИИ АВТОРИЗАЦИИ =============

// Проверка авторизации
function checkAuth() {
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    const savedUser = localStorage.getItem('telegram_user');
    
    // Android авторизация через email
    if (userToken && authMethod === 'email') {
        return true;
    }
    
    // Telegram авторизация
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        const userData = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
        };
        localStorage.setItem('telegram_user', JSON.stringify(userData));
        localStorage.setItem('user_id', userData.id.toString());
        return true;
    }
    
    // Проверка сохранённых данных
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            // Авторизация действительна 30 дней
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                return true;
            }
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
        }
    }
    
    return false;
}

// Получить user_id
function getUserId() {
    // Telegram
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // Из localStorage
    return localStorage.getItem('user_id');
}

// Выход
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.clear();
        window.location.href = '/webapp-v2/index.html';
    }
}

// ============= НАВИГАЦИЯ =============

function goToBrowse() {
    window.location.href = '/webapp-v2/browse.html';
}

function goToMyAds() {
    window.location.href = '/webapp-v2/my-ads.html';
}

function goToCreateAd() {
    window.location.href = '/webapp-v2/create-ad.html';
}

function goToChats() {
    window.location.href = '/webapp-v2/chats.html';
}

function goToProfile() {
    window.location.href = '/webapp-v2/profile.html';
}

function goToWorldChat() {
    // TODO: Реализовать страницу мир чата
    alert('Мир чат в разработке');
}

function goToPolls() {
    // TODO: Реализовать страницу опросов
    alert('Опросы в разработке');
}

function changeLocation() {
    // TODO: Реализовать смену локации
    alert('Смена локации в разработке');
}

// ============= БАННЕР ТЕХНИЧЕСКИХ РАБОТ =============

function insertMaintenanceBanner() {
    // Если уже закрывали баннер — не показываем
    if (localStorage.getItem('maintenanceBannerClosed') === 'true') return;

    // Добавляем стили один раз
    if (!document.getElementById('maintenanceBannerStyles')) {
        const style = document.createElement('style');
        style.id = 'maintenanceBannerStyles';
        style.textContent = `
            .maintenance-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                padding: 12px 40px 12px 16px;
                z-index: 10001;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                animation: maintenanceSlideDown 0.3s ease;
                font-size: 14px;
                line-height: 1.5;
            }
            @keyframes maintenanceSlideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .maintenance-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .maintenance-icon { font-size: 20px; flex-shrink: 0; }
            .maintenance-text { flex: 1; }
            .maintenance-text strong { font-weight: 600; }
            .maintenance-close {
                position: absolute;
                top: 50%;
                right: 12px;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s;
            }
            .maintenance-close:hover { background: rgba(255,255,255,0.3); transform: translateY(-50%) scale(1.05); }
            .maintenance-close:active { transform: translateY(-50%) scale(0.95); }
            body.has-maintenance-banner { padding-top: 56px; }
            @media (max-width: 768px) {
                .maintenance-banner { font-size: 13px; padding: 10px 36px 10px 12px; }
                .maintenance-icon { font-size: 18px; }
                body.has-maintenance-banner { padding-top: 52px; }
            }
        `;
        document.head.appendChild(style);
    }

    const banner = document.createElement('div');
    banner.id = 'maintenanceBanner';
    banner.className = 'maintenance-banner';
    banner.innerHTML = `
        <div class="maintenance-banner-content">
            <div class="maintenance-icon">🔧</div>
            <div class="maintenance-text">
                <strong>Ведутся технические работы</strong> по улучшению сервиса. Возможны временные ошибки или недоступность. Просим прощения за неудобства. Скоро всё починим! ✨
            </div>
        </div>
        <button class="maintenance-close" aria-label="Закрыть" title="Закрыть">×</button>
    `;

    const closeBtn = banner.querySelector('.maintenance-close');
    closeBtn?.addEventListener('click', closeMaintenanceBanner);

    document.body.prepend(banner);
    document.body.classList.add('has-maintenance-banner');
}

function closeMaintenanceBanner() {
    const banner = document.getElementById('maintenanceBanner');
    if (!banner) return;

    banner.style.animation = 'none';
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.2s ease';

    setTimeout(() => {
        banner.remove();
        document.body.classList.remove('has-maintenance-banner');
        localStorage.setItem('maintenanceBannerClosed', 'true');
    }, 200);
}

// ============= HAMBURGER MENU =============

function toggleHamburgerMenu() {
    const menu = document.getElementById('hamburgerMenu');
    const overlay = document.getElementById('hamburgerMenuOverlay');
    
    if (menu && overlay) {
        const isOpen = menu.classList.contains('open');
        
        if (isOpen) {
            menu.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            menu.classList.add('open');
            overlay.classList.add('active');
        }
    }
}

// ============= PREMIUM =============

function showPremiumModal() {
    alert('Premium функции в разработке');
}

// ============= РЕФЕРАЛЬНАЯ ПРОГРАММА =============

function showReferralModal() {
    const modal = document.getElementById('referralModal');
    if (modal) {
        modal.style.display = 'flex';
        loadReferralInfo();
    }
}

function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function loadReferralInfo() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/referrals?userId=${userId}`);
        
        if (data.success) {
            const input = document.getElementById('referralLinkInput');
            if (input) {
                input.value = data.referralLink || '';
            }
            
            const stats = document.getElementById('referralStats');
            const referredCount = document.getElementById('referredCount');
            const premiumUntil = document.getElementById('premiumUntil');
            
            if (stats && referredCount && premiumUntil) {
                stats.style.display = 'block';
                referredCount.textContent = data.referredCount || 0;
                premiumUntil.textContent = data.premiumUntil || '-';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки реферальной информации:', error);
    }
}

function copyReferralLink() {
    const input = document.getElementById('referralLinkInput');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('✅ Ссылка скопирована!');
    }
}

// ============= КОНТАКТЫ И О ПРИЛОЖЕНИИ =============

function showContacts() {
    alert('Контакты:\n\nПо всем вопросам обращайтесь в Telegram: @support');
}

function showAbout() {
    alert('Anonimka v2.0\n\nАнонимное общение без границ\n\n© 2024');
}

// ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Обработка ошибок
function handleError(error, context = '') {
    console.error(`Ошибка${context ? ' в ' + context : ''}:`, error);
    alert(`Произошла ошибка${context ? ' при ' + context : ''}. Попробуйте позже.`);
}

// ============= ИНИЦИАЛИЗАЦИЯ =============

document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js loaded');
    
    // Проверяем авторизацию
    if (!checkAuth()) {
        console.log('Пользователь не авторизован');
        // Для Android не редиректим (авторизация в native app)
        const isAndroid = navigator.userAgent.includes('Android');
        if (!isAndroid) {
            // Для веб-версии редирект на главную
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = '/webapp-v2/index.html';
            }
        }
    }
    
    // Инициализация Telegram Web App
    if (isTelegramWebApp) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a0f');
        tg.setBackgroundColor('#0a0a0f');
    }

    // Показываем баннер о технических работах (один раз, пока не закрыт)
    insertMaintenanceBanner();
});

// Экспорт функций для использования в других файлах
window.apiRequest = apiRequest;
window.checkAuth = checkAuth;
window.getUserId = getUserId;
window.logout = logout;
window.formatDate = formatDate;
window.handleError = handleError;
