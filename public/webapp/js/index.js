// ============= Р“Р›РђР’РќРђРЇ РЎРўР РђРќРР¦Рђ (РњР•РќР®) =============

let currentUserLocation = null;

// РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ СЃС‚СЂР°РЅРёС†С‹
document.addEventListener('DOMContentLoaded', async function() {
    console.log('РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РіР»Р°РІРЅРѕР№ СЃС‚СЂР°РЅРёС†С‹...');
    
    // РџСЂРѕРІРµСЂСЏРµРј Р°РІС‚РѕСЂРёР·Р°С†РёСЋ
    if (!checkAuth()) {
        console.log('РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ');
        return;
    }
    
    // Р—Р°РіСЂСѓР¶Р°РµРј РґР°РЅРЅС‹Рµ
    await loadUserLocation();
    await loadAdLimitBadge();
    await loadChatBadge();
    await loadWorldChatPreview();
    await checkAdminStatus();
    await loadReferralButton();
});

// ============= Р—РђР“Р РЈР—РљРђ Р›РћРљРђР¦РР =============

async function loadUserLocation() {
    try {
        // РџСЂРѕРІРµСЂСЏРµРј localStorage
        const savedLocation = localStorage.getItem('userLocation');
        
        if (savedLocation) {
            currentUserLocation = JSON.parse(savedLocation);
            displayUserLocation();
            return;
        }
        
        // Р•СЃР»Рё РЅРµС‚ - Р·Р°РіСЂСѓР¶Р°РµРј РёР· Р‘Р”
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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р»РѕРєР°С†РёРё:', error);
        displayUserLocation(); // РџРѕРєР°Р¶РµРј "Р—Р°РіСЂСѓР·РєР°..." РёР»Рё РґРµС„РѕР»С‚РЅРѕРµ Р·РЅР°С‡РµРЅРёРµ
    }
}

function displayUserLocation() {
    const locationDisplay = document.getElementById('userLocationDisplay');
    if (!locationDisplay) return;
    
    if (!currentUserLocation) {
        locationDisplay.textContent = 'рџ“Ќ Р’С‹Р±РµСЂРёС‚Рµ РіРѕСЂРѕРґ';
        return;
    }
    
    const { country, region, city } = currentUserLocation;
    
    // РЎР»РѕРІР°СЂСЊ С„Р»Р°РіРѕРІ СЃС‚СЂР°РЅ
    const countryFlags = {
        'kazakhstan': 'рџ‡°рџ‡ї',
        'russia': 'рџ‡·рџ‡є',
        'belarus': 'рџ‡§рџ‡ѕ',
        'kyrgyzstan': 'рџ‡°рџ‡¬',
        'uzbekistan': 'рџ‡єрџ‡ї',
        'armenia': 'рџ‡¦рџ‡І',
        'azerbaijan': 'рџ‡¦рџ‡ї',
        'moldova': 'рџ‡Ірџ‡©',
        'georgia': 'рџ‡¬рџ‡Є'
    };
    
    const flag = countryFlags[country] || 'рџ“Ќ';
    
    // РР·Р±РµРіР°РµРј РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ РµСЃР»Рё СЂРµРіРёРѕРЅ = РіРѕСЂРѕРґ
    const locationPart = region === city ? city : `${region}, ${city}`;
    locationDisplay.textContent = `${flag} ${locationPart}`;
}

// ============= Р›РРњРРў РђРќРљР•Рў =============

async function loadAdLimitBadge() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/ads/my?tgId=${userId}`);
        
        if (data.success && data.ads) {
            const adCount = data.ads.length;
            const maxAds = 3; // TODO: РїРѕР»СѓС‡Р°С‚СЊ РёР· РїСЂРµРјРёСѓРј-СЃС‚Р°С‚СѓСЃР°
            
            const badge = document.getElementById('adLimitBadge');
            if (badge && adCount > 0) {
                badge.textContent = `${adCount}/${maxAds}`;
                badge.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р»РёРјРёС‚Р° Р°РЅРєРµС‚:', error);
    }
}

// ============= РЎР§Р•РўР§РРљ РќР•РџР РћР§РРўРђРќРќР«РҐ Р§РђРўРћР’ =============

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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃС‡РµС‚С‡РёРєР° С‡Р°С‚РѕРІ:', error);
    }
}

// ============= РџР Р•Р’Р¬Р® РњРР  Р§РђРўРђ =============

async function loadWorldChatPreview() {
    try {
        const previewEl = document.getElementById('worldChatPreview');
        if (!previewEl) return;
        
        const data = await apiRequest('/api/world-chat/latest');
        
        if (data.success && data.message) {
            const { gender, text } = data.message;
            const genderIcon = gender === 'male' ? 'рџ‘Ё' : 'рџ‘©';
            previewEl.textContent = `${genderIcon}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
        } else {
            previewEl.textContent = 'РџРѕРєР° РЅРµС‚ СЃРѕРѕР±С‰РµРЅРёР№...';
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРµРІСЊСЋ РјРёСЂ С‡Р°С‚Р°:', error);
        const previewEl = document.getElementById('worldChatPreview');
        if (previewEl) previewEl.textContent = 'Р—Р°РіСЂСѓР·РєР°...';
    }
}

// ============= РђР”РњРРќ РЎРўРђРўРРЎРўРРљРђ =============

async function checkAdminStatus() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await apiRequest(`/api/admin/check?userId=${userId}`);
        
        if (data.isAdmin) {
            await loadAdminStats();
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° РїСЂРѕРІРµСЂРєРё Р°РґРјРёРЅ СЃС‚Р°С‚СѓСЃР°:', error);
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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°РґРјРёРЅ СЃС‚Р°С‚РёСЃС‚РёРєРё:', error);
    }
}

// ============= Р Р•Р¤Р•Р РђР›Р¬РќРђРЇ РљРќРћРџРљРђ =============

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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЂРµС„РµСЂР°Р»СЊРЅРѕР№ РєРЅРѕРїРєРё:', error);
    }
}

// ============= PREMIUM TOGGLE =============

document.getElementById('freeBtn')?.addEventListener('click', function() {
    // TODO: РїРѕРєР°Р·Р°С‚СЊ FREE РєРѕРЅС‚РµРЅС‚
    this.classList.add('active');
    document.getElementById('proBtn').classList.remove('active');
});

document.getElementById('proBtn')?.addEventListener('click', function() {
    showPremiumModal();
});

