// ============= РћР‘Р©РР• РљРћРќРЎРўРђРќРўР« Р РџР•Р Р•РњР•РќРќР«Р• =============

// Telegram Web App РёРЅРёС†РёР°Р»РёР·Р°С†РёСЏ
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

// ============= API Р¤РЈРќРљР¦РР =============

// РЈРЅРёРІРµСЂСЃР°Р»СЊРЅР°СЏ С„СѓРЅРєС†РёСЏ РґР»СЏ API Р·Р°РїСЂРѕСЃРѕРІ
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Р”РѕР±Р°РІР»СЏРµРј user_token РµСЃР»Рё РµСЃС‚СЊ
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

// ============= Р¤РЈРќРљР¦РР РђР’РўРћР РР—РђР¦РР =============

// РџСЂРѕРІРµСЂРєР° Р°РІС‚РѕСЂРёР·Р°С†РёРё
function checkAuth() {
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    const savedUser = localStorage.getItem('telegram_user');
    
    // Android Р°РІС‚РѕСЂРёР·Р°С†РёСЏ С‡РµСЂРµР· email
    if (userToken && authMethod === 'email') {
        return true;
    }
    
    // Telegram Р°РІС‚РѕСЂРёР·Р°С†РёСЏ
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
    
    // РџСЂРѕРІРµСЂРєР° СЃРѕС…СЂР°РЅС‘РЅРЅС‹С… РґР°РЅРЅС‹С…
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            // РђРІС‚РѕСЂРёР·Р°С†РёСЏ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅР° 30 РґРЅРµР№
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                return true;
            }
        } catch (e) {
            console.error('РћС€РёР±РєР° РїР°СЂСЃРёРЅРіР° РґР°РЅРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:', e);
        }
    }
    
    return false;
}

// РџРѕР»СѓС‡РёС‚СЊ user_id
function getUserId() {
    // Telegram
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // РР· localStorage
    return localStorage.getItem('user_id');
}

// Р’С‹С…РѕРґ
function logout() {
    if (confirm('Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ РІС‹Р№С‚Рё?')) {
        localStorage.clear();
        window.location.href = '/webapp/index.html';
    }
}

// ============= РќРђР’РР“РђР¦РРЇ =============

function goToBrowse() {
    window.location.href = '/webapp/browse.html';
}

function goToMyAds() {
    window.location.href = '/webapp/my-ads.html';
}

function goToCreateAd() {
    window.location.href = '/webapp/create-ad.html';
}

function goToChats() {
    window.location.href = '/webapp/chats.html';
}

function goToProfile() {
    window.location.href = '/webapp/profile.html';
}

function goToWorldChat() {
    window.location.href = '/webapp/world-chat.html';
}

function goToPolls() {
    window.location.href = '/webapp/polls.html';
}

function changeLocation() {
    window.location.href = '/webapp/location.html';
}

// ============= Р‘РђРќРќР•Р  РўР•РҐРќРР§Р•РЎРљРРҐ Р РђР‘РћРў =============

function insertMaintenanceBanner() {
    // Р•СЃР»Рё СѓР¶Рµ Р·Р°РєСЂС‹РІР°Р»Рё Р±Р°РЅРЅРµСЂ вЂ” РЅРµ РїРѕРєР°Р·С‹РІР°РµРј
    if (localStorage.getItem('maintenanceBannerClosed') === 'true') return;

    // Р”РѕР±Р°РІР»СЏРµРј СЃС‚РёР»Рё РѕРґРёРЅ СЂР°Р·
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
            <div class="maintenance-icon">рџ”§</div>
            <div class="maintenance-text">
                <strong>Р’РµРґСѓС‚СЃСЏ С‚РµС…РЅРёС‡РµСЃРєРёРµ СЂР°Р±РѕС‚С‹</strong> РїРѕ СѓР»СѓС‡С€РµРЅРёСЋ СЃРµСЂРІРёСЃР°. Р’РѕР·РјРѕР¶РЅС‹ РІСЂРµРјРµРЅРЅС‹Рµ РѕС€РёР±РєРё РёР»Рё РЅРµРґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ. РџСЂРѕСЃРёРј РїСЂРѕС‰РµРЅРёСЏ Р·Р° РЅРµСѓРґРѕР±СЃС‚РІР°. РЎРєРѕСЂРѕ РІСЃС‘ РїРѕС‡РёРЅРёРј! вњЁ
            </div>
        </div>
        <button class="maintenance-close" aria-label="Р—Р°РєСЂС‹С‚СЊ" title="Р—Р°РєСЂС‹С‚СЊ">Г—</button>
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
    alert('Premium С„СѓРЅРєС†РёРё РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ');
}

// ============= Р Р•Р¤Р•Р РђР›Р¬РќРђРЇ РџР РћР“Р РђРњРњРђ =============

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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЂРµС„РµСЂР°Р»СЊРЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРё:', error);
    }
}

function copyReferralLink() {
    const input = document.getElementById('referralLinkInput');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('вњ… РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР°!');
    }
}

// ============= РљРћРќРўРђРљРўР« Р Рћ РџР РР›РћР–Р•РќРР =============

function showContacts() {
    alert('РљРѕРЅС‚Р°РєС‚С‹:\n\nРџРѕ РІСЃРµРј РІРѕРїСЂРѕСЃР°Рј РѕР±СЂР°С‰Р°Р№С‚РµСЃСЊ РІ Telegram: @support');
}

function showAbout() {
    alert('Anonimka v2.0\n\nРђРЅРѕРЅРёРјРЅРѕРµ РѕР±С‰РµРЅРёРµ Р±РµР· РіСЂР°РЅРёС†\n\nВ© 2024');
}

// ============= Р’РЎРџРћРњРћР“РђРўР•Р›Р¬РќР«Р• Р¤РЈРќРљР¦РР =============

// Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ РґР°С‚С‹
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'С‚РѕР»СЊРєРѕ С‡С‚Рѕ';
    if (minutes < 60) return `${minutes} РјРёРЅ РЅР°Р·Р°Рґ`;
    if (hours < 24) return `${hours} С‡ РЅР°Р·Р°Рґ`;
    if (days < 7) return `${days} Рґ РЅР°Р·Р°Рґ`;
    
    return date.toLocaleDateString('ru-RU');
}

// РћР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє
function handleError(error, context = '') {
    console.error(`РћС€РёР±РєР°${context ? ' РІ ' + context : ''}:`, error);
    alert(`РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°${context ? ' РїСЂРё ' + context : ''}. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.`);
}

// ============= РРќРР¦РРђР›РР—РђР¦РРЇ =============

document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js loaded');
    
    // РџСЂРѕРІРµСЂСЏРµРј Р°РІС‚РѕСЂРёР·Р°С†РёСЋ
    if (!checkAuth()) {
        console.log('РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ');
        // Р”Р»СЏ Android РЅРµ СЂРµРґРёСЂРµРєС‚РёРј (Р°РІС‚РѕСЂРёР·Р°С†РёСЏ РІ native app)
        const isAndroid = navigator.userAgent.includes('Android');
        if (!isAndroid) {
            // Р”Р»СЏ РІРµР±-РІРµСЂСЃРёРё СЂРµРґРёСЂРµРєС‚ РЅР° РіР»Р°РІРЅСѓСЋ
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = '/webapp/index.html';
            }
        }
    }
    
    // РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Telegram Web App
    if (isTelegramWebApp) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a0f');
        tg.setBackgroundColor('#0a0a0f');
    }

    // РџРѕРєР°Р·С‹РІР°РµРј Р±Р°РЅРЅРµСЂ Рѕ С‚РµС…РЅРёС‡РµСЃРєРёС… СЂР°Р±РѕС‚Р°С… (РѕРґРёРЅ СЂР°Р·, РїРѕРєР° РЅРµ Р·Р°РєСЂС‹С‚)
    insertMaintenanceBanner();
});

// Р­РєСЃРїРѕСЂС‚ С„СѓРЅРєС†РёР№ РґР»СЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ РІ РґСЂСѓРіРёС… С„Р°Р№Р»Р°С…
window.apiRequest = apiRequest;
window.checkAuth = checkAuth;
window.getUserId = getUserId;
window.logout = logout;
window.formatDate = formatDate;
window.handleError = handleError;

