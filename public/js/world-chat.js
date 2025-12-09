// ==================== WORLD CHAT ====================

let currentWorldChatTab = 'world';
let worldChatAutoRefreshInterval = null;
let worldChatLastMessageTime = null;
let worldChatLoadingController = null; // Р”Р»СЏ РѕС‚РјРµРЅС‹ РїСЂРµРґС‹РґСѓС‰РёС… Р·Р°РїСЂРѕСЃРѕРІ

// РџРѕРєР°Р·Р°С‚СЊ СЌРєСЂР°РЅ РњРёСЂ С‡Р°С‚Р°
async function showWorldChat() {
    console.log('рџЊЌ РћС‚РєСЂС‹С‚РёРµ РњРёСЂ С‡Р°С‚Р°');
    showScreen('worldChatScreen');
    
    // РџСЂРёРјРµРЅСЏРµРј СЃРѕС…СЂР°РЅРµРЅРЅС‹Р№ СЂР°Р·РјРµСЂ С€СЂРёС„С‚Р°
    const savedSize = localStorage.getItem('worldChatFontSize') || 'medium';
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
        messagesContainer.classList.add(`font-${savedSize}`);
    }
    
    // РћР±РЅРѕРІР»СЏРµРј РєРЅРѕРїРєСѓ СЂР°Р·РјРµСЂР° С€СЂРёС„С‚Р°
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (savedSize === 'small') {
            btn.style.fontSize = '12px';
        } else if (savedSize === 'medium') {
            btn.style.fontSize = '14px';
        } else {
            btn.style.fontSize = '17px';
        }
    }
    
    // Р—Р°РіСЂСѓР¶Р°РµРј СЃРѕРѕР±С‰РµРЅРёСЏ
    await loadWorldChatMessages();
    
    // РџСЂРѕРєСЂСѓС‡РёРІР°РµРј РІРЅРёР· РїРѕСЃР»Рµ РїРµСЂРІРѕР№ Р·Р°РіСЂСѓР·РєРё
    setTimeout(() => {
        const container = document.getElementById('worldChatMessages');
        const scrollContainer = container?.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, 100);
    
    // РћР±РЅРѕРІР»СЏРµРј СЃС‡РµС‚С‡РёРє СЃРёРјРІРѕР»РѕРІ
    updateWorldChatCharCount();
    
    // Р—Р°РїСѓСЃРєР°РµРј Р°РІС‚РѕРѕР±РЅРѕРІР»РµРЅРёРµ РєР°Р¶РґС‹Рµ 3 СЃРµРєСѓРЅРґС‹
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
    worldChatAutoRefreshInterval = setInterval(() => {
        loadWorldChatMessages(true); // silent reload
    }, 3000);
}

// РџРµСЂРµРєР»СЋС‡РµРЅРёРµ СЂР°Р·РјРµСЂР° С€СЂРёС„С‚Р°
function toggleFontSize() {
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (!messagesContainer) return;
    
    // РџРѕР»СѓС‡Р°РµРј С‚РµРєСѓС‰РёР№ СЂР°Р·РјРµСЂ РёР· localStorage РёР»Рё РґРµС„РѕР»С‚РЅС‹Р№ 'medium'
    let currentSize = localStorage.getItem('worldChatFontSize') || 'medium';
    
    // РџРµСЂРµРєР»СЋС‡Р°РµРј РЅР° СЃР»РµРґСѓСЋС‰РёР№ СЂР°Р·РјРµСЂ
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    // РЈРґР°Р»СЏРµРј СЃС‚Р°СЂС‹Рµ РєР»Р°СЃСЃС‹ Рё РґРѕР±Р°РІР»СЏРµРј РЅРѕРІС‹Р№
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    // РЎРѕС…СЂР°РЅСЏРµРј РІ localStorage
    localStorage.setItem('worldChatFontSize', nextSize);
    
    // РћР±РЅРѕРІР»СЏРµРј С‚РµРєСЃС‚ РєРЅРѕРїРєРё
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (nextSize === 'small') {
            btn.textContent = 'A';
            btn.style.fontSize = '12px';
        } else if (nextSize === 'medium') {
            btn.textContent = 'A';
            btn.style.fontSize = '14px';
        } else {
            btn.textContent = 'A';
            btn.style.fontSize = '17px';
        }
    }
    
    console.log('рџ“Џ Р Р°Р·РјРµСЂ С€СЂРёС„С‚Р°:', nextSize);
}

// РџРµСЂРµРєР»СЋС‡РµРЅРёРµ РІРєР»Р°РґРѕРє
async function switchWorldChatTab(tab) {
    console.log('рџ”„ РџРµСЂРµРєР»СЋС‡РµРЅРёРµ РЅР° РІРєР»Р°РґРєСѓ:', tab);
    
    // РћС‚РјРµРЅСЏРµРј РїСЂРµРґС‹РґСѓС‰РёР№ Р·Р°РїСЂРѕСЃ РµСЃР»Рё РµСЃС‚СЊ
    if (worldChatLoadingController) {
        worldChatLoadingController.abort();
    }
    
    currentWorldChatTab = tab;
    
    // РЎР±СЂР°СЃС‹РІР°РµРј РєРµС€ ID СЃРѕРѕР±С‰РµРЅРёР№ РїСЂРё РїРµСЂРµРєР»СЋС‡РµРЅРёРё РІРєР»Р°РґРѕРє
    lastWorldChatMessageIds = [];
    
    // РћР±РЅРѕРІР»СЏРµРј Р°РєС‚РёРІРЅСѓСЋ РєРЅРѕРїРєСѓ
    document.querySelectorAll('.world-chat-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // РћР±РЅРѕРІР»СЏРµРј РїСЂРµС„РёРєСЃ Рё РѕС‡РёС‰Р°РµРј РїРѕР»Рµ РїСЂРё РїРµСЂРµРєР»СЋС‡РµРЅРёРё РЅР° РњРёСЂ РёР»Рё Р“РѕСЂРѕРґ
    const prefixElement = document.getElementById('worldChatPrefix');
    const input = document.getElementById('worldChatInput');
    
    if (tab === 'world') {
        prefixElement.textContent = '@';
        prefixElement.style.color = '#FFD700';
        // РћС‡РёС‰Р°РµРј РїРѕР»Рµ РµСЃР»Рё С‚Р°Рј Р±С‹Р» РЅРёРєРЅРµР№Рј РґР»СЏ Р»РёС‡РЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'city') {
        prefixElement.textContent = '&';
        prefixElement.style.color = '#00D9FF';
        // РћС‡РёС‰Р°РµРј РїРѕР»Рµ РµСЃР»Рё С‚Р°Рј Р±С‹Р» РЅРёРєРЅРµР№Рј РґР»СЏ Р»РёС‡РЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'private') {
        prefixElement.textContent = '/';
        prefixElement.style.color = '#FF006E';
    }
    
    // РћС‡РёС‰Р°РµРј РєРѕРЅС‚РµР№РЅРµСЂ РїРµСЂРµРґ Р·Р°РіСЂСѓР·РєРѕР№ РЅРѕРІС‹С… СЃРѕРѕР±С‰РµРЅРёР№
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon pulse">рџ’¬</div>
                <p>Р—Р°РіСЂСѓР·РєР° СЃРѕРѕР±С‰РµРЅРёР№...</p>
            </div>
        `;
    }
    
    // Р—Р°РіСЂСѓР¶Р°РµРј СЃРѕРѕР±С‰РµРЅРёСЏ РґР»СЏ СЌС‚РѕР№ РІРєР»Р°РґРєРё
    await loadWorldChatMessages();
}

// Р—Р°РіСЂСѓР·РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ
async function loadWorldChatMessages(silent = false) {
    try {
        // РЎРѕР·РґР°РµРј РЅРѕРІС‹Р№ AbortController РґР»СЏ СЌС‚РѕРіРѕ Р·Р°РїСЂРѕСЃР°
        worldChatLoadingController = new AbortController();
        const requestTab = currentWorldChatTab; // РЎРѕС…СЂР°РЅСЏРµРј С‚РµРєСѓС‰СѓСЋ РІРєР»Р°РґРєСѓ
        
        const userToken = localStorage.getItem('user_token');
        const userCity = localStorage.getItem('userCity') || 'РђР»РјР°С‚С‹';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: {
                    tab: requestTab,
                    userToken: userToken,
                    userCity: userCity
                }
            }),
            signal: worldChatLoadingController.signal
        });
        
        const data = await response.json();
        
        // РџСЂРѕРІРµСЂСЏРµРј С‡С‚Рѕ РІРєР»Р°РґРєР° РЅРµ РёР·РјРµРЅРёР»Р°СЃСЊ РїРѕРєР° РіСЂСѓР·РёР»РёСЃСЊ РґР°РЅРЅС‹Рµ
        if (requestTab !== currentWorldChatTab) {
            console.log(`вЏ­пёЏ РџСЂРѕРїСѓСЃРєР°РµРј СЂРµРЅРґРµСЂ РґР»СЏ ${requestTab}, С‚РµРєСѓС‰Р°СЏ РІРєР»Р°РґРєР°: ${currentWorldChatTab}`);
            return;
        }
        
        if (data.success) {
            if (!silent) {
                console.log(`вњ… Р—Р°РіСЂСѓР¶РµРЅРѕ ${data.data.length} СЃРѕРѕР±С‰РµРЅРёР№ РґР»СЏ РІРєР»Р°РґРєРё ${requestTab}`);
            }
            renderWorldChatMessages(data.data);
        } else {
            console.error('вќЊ РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРѕРѕР±С‰РµРЅРёР№:', data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('вЏ№пёЏ Р—Р°РїСЂРѕСЃ РѕС‚РјРµРЅРµРЅ (РїРµСЂРµРєР»СЋС‡РµРЅРёРµ РІРєР»Р°РґРєРё)');
        } else {
            console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРѕРѕР±С‰РµРЅРёР№:', error);
        }
    }
}

// РљСЌС€ РїРѕСЃР»РµРґРЅРёС… ID СЃРѕРѕР±С‰РµРЅРёР№ РґР»СЏ РїСЂРµРґРѕС‚РІСЂР°С‰РµРЅРёСЏ РјРѕСЂРіР°РЅРёСЏ
let lastWorldChatMessageIds = [];

// Р¤СѓРЅРєС†РёСЏ С†РµРЅР·СѓСЂС‹ РјР°С‚РµСЂРЅС‹С… СЃР»РѕРІ
function censorMessage(text) {
    if (!text) return text;
    
    // РЎРїРёСЃРѕРє РјР°С‚РµСЂРЅС‹С… СЃР»РѕРІ Рё РёС… РІР°СЂРёР°С†РёР№
    const badWords = [
        // РћСЃРЅРѕРІРЅС‹Рµ РјР°С‚С‹
        'Р±Р»СЏС‚СЊ', 'Р±Р»СЏ', 'Р±Р»СЏРґСЊ', 'Р±Р»СЏС‚', 'Р±Р»СЏРґ',
        'С…СѓР№', 'С…СѓСЏ', 'С…СѓРµ', 'С…СѓСЋ', 'С…СѓРё', 'С…РµСЂ',
        'РїРёР·РґР°', 'РїРёР·Рґ', 'РїРёР·РґРµС†', 'РїРёР·РґРµ', 'РїРёР·РґСѓ',
        'РµР±Р°С‚СЊ', 'РµР±Р°Р»', 'РµР±Р°РЅ', 'РµР±Р°', 'РµР±Сѓ', 'РµР±С‘С‚', 'РµР±С‘С€СЊ', 'РµР±Р»СЏ',
        'СЃСѓРєР°', 'СЃСѓРєРё', 'СЃСѓРєСѓ', 'СЃСѓРє',
        'РіР°РЅРґРѕРЅ', 'РіР°РЅРґРѕРЅС‹', 'РіРѕРЅРґРѕРЅ',
        'РјСѓРґР°Рє', 'РјСѓРґРёР»Р°', 'РјСѓРґР°РєРё', 'РјСѓРґР»Рѕ',
        'РґРѕР»Р±РѕРµР±', 'РґРѕР»Р±РѕС‘Р±', 'РґРёР±РёР»', 'РґРµР±РёР»',
        'СѓРµР±РѕРє', 'СѓС‘Р±РѕРє', 'СѓР±Р»СЋРґРѕРє', 'СѓР±Р»СЋРґРєРё',
        'РіРѕРІРЅРѕ', 'РіРѕРІРЅР°', 'РіР°РІРЅРѕ',
        'Р¶РѕРїР°', 'Р¶РѕРїС‹', 'Р¶РѕРїСѓ', 'Р¶РѕРї',
        'С€Р»СЋС…Р°', 'С€Р»СЋС…Рё', 'С€Р»СЋС…Сѓ',
        'РїРµС‚СѓС…', 'РїРµС‚СѓС…Рё', 'РїРёРґРѕСЂ', 'РїРёРґСЂ', 'РїРµРґРёРє',
        'С‡РјРѕ', 'С‡РјРѕС€РЅРёРє',
        // Р›Р°С‚РёРЅРёС†Р°
        'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy',
        // Р’Р°СЂРёР°С†РёРё СЃ Р·Р°РјРµРЅРѕР№ Р±СѓРєРІ
        'Р± Р» СЏ', 'Р± Р» СЏ С‚ СЊ', 'С… Сѓ Р№', 'Рї Рё Р· Рґ Р°',
        'СЃС†СѓРєР°', 'СЃСѓС‡РєР°', 'СЃСѓС‡РєРё',
        // РљР°Р·Р°С…СЃРєРёРµ РјР°С‚С‹
        'Т›Р°СЂР°Т›С€С‹', 'Р¶РµСЃС–СЂ', 'РєУ©С‚РµРє'
    ];
    
    let censored = text;
    
    // Р—Р°РјРµРЅСЏРµРј РєР°Р¶РґРѕРµ РјР°С‚РµСЂРЅРѕРµ СЃР»РѕРІРѕ РЅР° Р·РІРµР·РґРѕС‡РєРё
    badWords.forEach(word => {
        // РЎРѕР·РґР°РµРј СЂРµРіСѓР»СЏСЂРЅРѕРµ РІС‹СЂР°Р¶РµРЅРёРµ РґР»СЏ РїРѕРёСЃРєР° СЃР»РѕРІР° (РёРіРЅРѕСЂРёСЂСѓРµРј СЂРµРіРёСЃС‚СЂ)
        const regex = new RegExp(word.split('').map(char => {
            // Р­РєСЂР°РЅРёСЂСѓРµРј СЃРїРµС†СЃРёРјРІРѕР»С‹
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Р”РѕР±Р°РІР»СЏРµРј РІРѕР·РјРѕР¶РЅС‹Рµ РІР°СЂРёР°С†РёРё СЃ РїСЂРѕР±РµР»Р°РјРё/С‚РѕС‡РєР°РјРё РјРµР¶РґСѓ Р±СѓРєРІР°РјРё
            return escaped + '[\\s\\.\\-_]*';
        }).join(''), 'gi');
        
        censored = censored.replace(regex, (match) => {
            return '*'.repeat(Math.max(4, match.length));
        });
        
        // РўР°РєР¶Рµ РїСЂРѕСЃС‚Р°СЏ Р·Р°РјРµРЅР° Р±РµР· РІР°СЂРёР°С†РёР№
        const simpleRegex = new RegExp(`\\b${word}\\b`, 'gi');
        censored = censored.replace(simpleRegex, '****');
    });
    
    return censored;
}

// РћС‚СЂРёСЃРѕРІРєР° СЃРѕРѕР±С‰РµРЅРёР№
function renderWorldChatMessages(messages) {
    const container = document.getElementById('worldChatMessages');
    
    if (!container) {
        console.error('вќЊ Container worldChatMessages РЅРµ РЅР°Р№РґРµРЅ');
        return;
    }
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon">рџ’¬</div>
                <p>РџРѕРєР° РЅРµС‚ СЃРѕРѕР±С‰РµРЅРёР№</p>
                <p style="font-size: 12px; color: var(--text-gray);">Р‘СѓРґСЊС‚Рµ РїРµСЂРІС‹Рј!</p>
            </div>
        `;
        lastWorldChatMessageIds = [];
        return;
    }
    
    // РџСЂРѕРІРµСЂСЏРµРј, РёР·РјРµРЅРёР»РёСЃСЊ Р»Рё СЃРѕРѕР±С‰РµРЅРёСЏ
    const currentIds = messages.map(m => m.id);
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(lastWorldChatMessageIds);
    
    // Р•СЃР»Рё СЃРѕРѕР±С‰РµРЅРёСЏ РЅРµ РёР·РјРµРЅРёР»РёСЃСЊ, РЅРµ РїРµСЂРµСЂРёСЃРѕРІС‹РІР°РµРј
    if (!idsChanged) {
        return;
    }
    
    // РќР°С…РѕРґРёРј РЅРѕРІС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ
    const newMessageIds = currentIds.filter(id => !lastWorldChatMessageIds.includes(id));
    const hasNewMessages = newMessageIds.length > 0;
    
    lastWorldChatMessageIds = currentIds;
    
    // РџСЂРѕРІРµСЂСЏРµРј, РµСЃС‚СЊ Р»Рё placeholder Р·Р°РіСЂСѓР·РєРё (РїРµСЂРІР°СЏ Р·Р°РіСЂСѓР·РєР°)
    const hasLoadingPlaceholder = container.querySelector('.loading-placeholder');
    
    // Р•СЃР»Рё РµСЃС‚СЊ РЅРѕРІС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ Р РІ РєРѕРЅС‚РµР№РЅРµСЂРµ СѓР¶Рµ РµСЃС‚СЊ СЂРµР°Р»СЊРЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ (РЅРµ placeholder)
    if (hasNewMessages && container.children.length > 0 && !hasLoadingPlaceholder) {
        const newMessages = messages.filter(m => newMessageIds.includes(m.id));
        newMessages.forEach(msg => {
            const messageHtml = createWorldChatMessageHtml(msg);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = messageHtml;
            const messageElement = tempDiv.firstElementChild;
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
            container.appendChild(messageElement);
            
            // РџР»Р°РІРЅРѕРµ РїРѕСЏРІР»РµРЅРёРµ
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    } else {
        // РџРµСЂРІР°СЏ Р·Р°РіСЂСѓР·РєР° РёР»Рё РµСЃС‚СЊ placeholder - РїРµСЂРµСЂРёСЃРѕРІС‹РІР°РµРј РІСЃРµ
        container.innerHTML = messages.map(msg => createWorldChatMessageHtml(msg)).join('');
    }
    
    // Р’РЎР•Р“Р”Рђ РїСЂРѕРєСЂСѓС‡РёРІР°РµРј РІРЅРёР· Рє РЅРѕРІС‹Рј СЃРѕРѕР±С‰РµРЅРёСЏРј
    requestAnimationFrame(() => {
        const scrollContainer = container.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
    
    // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё long press РґР»СЏ РЅРёРєРЅРµР№РјРѕРІ
    setupLongPressHandlers();
}

// РЎРѕР·РґР°С‚СЊ HTML РґР»СЏ РѕРґРЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ (РІС‹РЅРµСЃРµРЅРѕ РІ РѕС‚РґРµР»СЊРЅСѓСЋ С„СѓРЅРєС†РёСЋ)
function createWorldChatMessageHtml(msg) {
        const isPremium = msg.is_premium || msg.isPremium || false;
        const nicknameClass = `${msg.type}-type${isPremium ? ' premium' : ''}`;
        const proР‘Р°Рґge = isPremium ? '<span class="world-chat-pro-badge">в­ђ</span>' : '';
        const time = formatMessageTime(msg.created_at || msg.createdAt);
        
        // Р”Р»СЏ Р»РёС‡РЅС‹С… СЃРѕРѕР±С‰РµРЅРёР№ РїРѕРєР°Р·С‹РІР°РµРј "РєРѕРјСѓ"
        let targetInfo = '';
        if (msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            targetInfo = ` в†’ ${msg.target_nickname || msg.targetNickname}`;
        }
        
        // РџСЂРѕРІРµСЂСЏРµРј, СЌС‚Рѕ СЃРІРѕР№ РЅРёРєРЅРµР№Рј РёР»Рё С‡СѓР¶РѕР№
        const currentUserToken = localStorage.getItem('user_token');
        const userToken = msg.user_token || msg.userToken;
        const isOwnMessage = userToken === currentUserToken;
        
        // Р”Р»СЏ СЃРІРѕРёС… Р»РёС‡РЅС‹С… СЃРѕРѕР±С‰РµРЅРёР№ РїСЂРё РєР»РёРєРµ РїРѕРґСЃС‚Р°РІР»СЏРµРј СЃРѕР±РµСЃРµРґРЅРёРєР°, Р° РЅРµ СЃРµР±СЏ
        let clickableNickname = msg.nickname;
        if (isOwnMessage && msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            clickableNickname = msg.target_nickname || msg.targetNickname;
        }
        
        // РџСЂРёРјРµРЅСЏРµРј С†РµРЅР·СѓСЂСѓ Рє СЃРѕРѕР±С‰РµРЅРёСЋ
        let censoredMessage = censorMessage(msg.message);
        
        // РЈР±РёСЂР°РµРј РїСЂРµС„РёРєСЃС‹ @ & / РёР· РЅР°С‡Р°Р»Р° СЃРѕРѕР±С‰РµРЅРёСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ
        if (censoredMessage.startsWith('@') || censoredMessage.startsWith('&') || censoredMessage.startsWith('/')) {
            censoredMessage = censoredMessage.substring(1).trim();
        }
        
        return `
            <div class="world-chat-message ${msg.type}-type">
                <div class="world-chat-header">
                    <div class="world-chat-nickname ${nicknameClass}" 
                         data-nickname="${escapeHtml(msg.nickname)}"
                         data-user-token="${userToken}"
                         data-is-own="${isOwnMessage}"
                         onclick="clickWorldChatNickname('${escapeHtml(clickableNickname)}')"
                         oncontextmenu="return showWorldChatContextMenu(event, '${escapeHtml(msg.nickname)}', '${userToken}', ${isOwnMessage})">
                        ${escapeHtml(msg.nickname)}${proР‘Р°Рґge}${targetInfo}
                    </div>
                    <div class="world-chat-time">${time}</div>
                </div>
                <div class="world-chat-text">${escapeHtml(censoredMessage)}</div>
            </div>
        `;
}

// РќР°СЃС‚СЂРѕР№РєР° long press РґР»СЏ РјРѕР±РёР»СЊРЅС‹С… СѓСЃС‚СЂРѕР№СЃС‚РІ
function setupLongPressHandlers() {
    const nicknames = document.querySelectorAll('.world-chat-nickname');
    
    nicknames.forEach(nickname => {
        let pressTimer;
        
        // Touch events РґР»СЏ РјРѕР±РёР»СЊРЅС‹С…
        nickname.addEventListener('touchstart', function(e) {
            const nick = this.getAttribute('data-nickname');
            const token = this.getAttribute('data-user-token');
            const isOwn = this.getAttribute('data-is-own') === 'true';
            
            pressTimer = setTimeout(() => {
                // Р’РёР±СЂР°С†РёСЏ РїСЂРё РґРѕР»РіРѕРј РЅР°Р¶Р°С‚РёРё (РµСЃР»Рё РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                showWorldChatContextMenu(e, nick, token, isOwn);
            }, 500); // 500ms РґР»СЏ long press
        });
        
        nickname.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        nickname.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

// РљР»РёРє РЅР° РЅРёРєРЅРµР№Рј - РґРѕР±Р°РІРёС‚СЊ РІ РёРЅРїСѓС‚ РґР»СЏ Р»РёС‡РЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
function clickWorldChatNickname(nickname) {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix');
    
    // РќР• РїРµСЂРµРєР»СЋС‡Р°РµРјСЃСЏ РЅР° РІРєР»Р°РґРєСѓ Р›РЎ, РѕСЃС‚Р°РµРјСЃСЏ РіРґРµ РµСЃС‚СЊ
    // РџСЂРѕСЃС‚Рѕ РјРµРЅСЏРµРј РїСЂРµС„РёРєСЃ РЅР° / РґР»СЏ Р»РёС‡РЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
    input.value = `${nickname} `;
    prefix.textContent = '/';
    prefix.style.color = '#FF006E';
    input.focus();
}

// РћС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ
async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix').textContent;
    let message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Р”РѕР±Р°РІР»СЏРµРј РїСЂРµС„РёРєСЃ
    message = prefix + message;
    
    // РџСЂРѕРІРµСЂСЏРµРј РґР»РёРЅСѓ (120 СЃРёРјРІРѕР»РѕРІ Р±РµР· РїСЂРµС„РёРєСЃР°)
    if (message.length - 1 > 120) {
        tg.showAlert('РњР°РєСЃРёРјСѓРј 120 СЃРёРјРІРѕР»РѕРІ');
        return;
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const nickname = localStorage.getItem('userNickname') || 'РђРЅРѕРЅРёРј';
        const isPremium = userPremiumStatus.isPremium || false;
        const city = localStorage.getItem('userCity') || 'РђР»РјР°С‚С‹';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    userToken: userToken,
                    nickname: nickname,
                    message: message,
                    isPremium: isPremium,
                    city: city
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('вњ… РЎРѕРѕР±С‰РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ');
            input.value = '';
            updateWorldChatCharCount();
            
            // РђРІС‚РѕРїРµСЂРµРєР»СЋС‡РµРЅРёРµ РїРѕСЃР»Рµ РѕС‚РїСЂР°РІРєРё Р›РЎ
            if (prefix === '/') {
                // Р•СЃР»Рё Р±С‹Р»Рё РЅР° РІРєР»Р°РґРєРµ РњРёСЂ - РїРµСЂРµРєР»СЋС‡Р°РµРјСЃСЏ РѕР±СЂР°С‚РЅРѕ РЅР° @ (РњРёСЂ)
                if (currentWorldChatTab === 'world') {
                    console.log('рџ”„ РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РїРµСЂРµРєР»СЋС‡РµРЅРёРµ РЅР° РѕР±С‰РёР№ С‡Р°С‚ РњРёСЂ (@)');
                    await switchWorldChatTab('world');
                }
                // Р•СЃР»Рё Р±С‹Р»Рё РЅР° РІРєР»Р°РґРєРµ Р“РѕСЂРѕРґ - РїРµСЂРµРєР»СЋС‡Р°РµРјСЃСЏ РѕР±СЂР°С‚РЅРѕ РЅР° & (Р“РѕСЂРѕРґ)
                else if (currentWorldChatTab === 'city') {
                    console.log('рџ”„ РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РїРµСЂРµРєР»СЋС‡РµРЅРёРµ РЅР° РѕР±С‰РёР№ С‡Р°С‚ Р“РѕСЂРѕРґ (&)');
                    await switchWorldChatTab('city');
                }
                // Р•СЃР»Рё РЅР° РІРєР»Р°РґРєРµ Р›РЎ - РїСЂРѕСЃС‚Рѕ РѕР±РЅРѕРІР»СЏРµРј
                else {
                    await loadWorldChatMessages();
                }
            } else {
                // РћР±С‹С‡РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёР№ РґР»СЏ @ Рё &
                await loadWorldChatMessages();
            }
        } else {
            console.error('вќЊ РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё:', data.error);
            
            // Р•СЃР»Рё СЌС‚Рѕ С‚Р°Р№РјР°СѓС‚ - РїРѕРєР°Р·С‹РІР°РµРј СЃРѕРѕР±С‰РµРЅРёРµ РѕС‚ СЃРµСЂРІРµСЂР° (С‚Р°Рј РїСЂР°РІРёР»СЊРЅРѕРµ РІСЂРµРјСЏ)
            if (response.status === 429) {
                tg.showAlert(data.error || 'РџРѕРґРѕР¶РґРёС‚Рµ РЅРµРјРЅРѕРіРѕ РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№');
            } else {
                tg.showAlert(data.error || 'РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ');
            }
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ:', error);
        tg.showAlert('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ');
    }
}

// РћР±РЅРѕРІР»РµРЅРёРµ СЃС‡РµС‚С‡РёРєР° СЃРёРјРІРѕР»РѕРІ
function updateWorldChatCharCount() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    
    if (input && counter) {
        // РћР±РЅРѕРІР»СЏРµРј СЃС‡РµС‚С‡РёРє СЃСЂР°Р·Сѓ
        const length = input.value.length;
        counter.textContent = length;
        
        if (length > 45) {
            counter.style.color = '#FF006E';
        } else {
            counter.style.color = 'var(--text-gray)';
        }
        
        // Р РґРѕР±Р°РІР»СЏРµРј listener РґР»СЏ РґР°Р»СЊРЅРµР№С€РёС… РёР·РјРµРЅРµРЅРёР№
        input.addEventListener('input', () => {
            const length = input.value.length;
            counter.textContent = length;
            
            if (length > 45) {
                counter.style.color = '#FF006E';
            } else {
                counter.style.color = 'var(--text-gray)';
            }
        });
    }
}

// Р—Р°РіСЂСѓР·РёС‚СЊ РїСЂРµРІСЊСЋ РїРѕСЃР»РµРґРЅРµРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РґР»СЏ РєРЅРѕРїРєРё
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-last-message'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const preview = document.getElementById('worldChatPreview');
            const msg = data.data;
            // РЈР±РёСЂР°РµРј @ РёР· СЃРѕРѕР±С‰РµРЅРёСЏ
            const cleanMessage = msg.message.replace(/^[@&\/]\s*/, '');
            preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРµРІСЊСЋ:', error);
    }
}

// РљРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ (РџРљРњ + РґРѕР»РіРѕРµ РЅР°Р¶Р°С‚РёРµ)
function showWorldChatContextMenu(event, nickname, userToken, isOwnMessage = false) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('РљРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ РґР»СЏ', nickname, 'isOwn:', isOwnMessage);
    
    // РЎРѕР·РґР°С‘Рј РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ СЃ РѕРїС†РёСЏРјРё
    const modal = document.createElement('div');
    modal.className = 'world-chat-context-menu';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-cyan);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    // Р•СЃР»Рё СЌС‚Рѕ СЃРІРѕР№ РЅРёРєРЅРµР№Рј - РїРѕРєР°Р·С‹РІР°РµРј СЃРїРµС†РёР°Р»СЊРЅРѕРµ РѕРєРЅРѕ
    if (isOwnMessage) {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Р­С‚Рѕ Р’С‹
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Р—Р°РєСЂС‹С‚СЊ
                </button>
            </div>
        `;
    } else {
        // РћР±С‹С‡РЅРѕРµ РјРµРЅСЋ РґР»СЏ РґСЂСѓРіРёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Р’С‹Р±РµСЂРёС‚Рµ РґРµР№СЃС‚РІРёРµ
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="worldChatPrivateMessage('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF006E, #C4005A);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    рџ’Њ РџСЂРёРІР°С‚ С‡Р°С‚
                </button>
                <button onclick="worldChatBlockUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #555, #333);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    рџљ« Р’ Р§РЎ
                </button>
                <button onclick="worldChatReportUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF4444, #CC0000);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    вљ пёЏ РџРѕР¶Р°Р»РѕРІР°С‚СЊСЃСЏ
                </button>
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: var(--text-light);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    РћС‚РјРµРЅР°
                </button>
            </div>
        `;
    }
    
    // Overlay РґР»СЏ Р·Р°РєСЂС‹С‚РёСЏ РїСЂРё РєР»РёРєРµ РІРЅРµ РјРµРЅСЋ
    const overlay = document.createElement('div');
    overlay.className = 'world-chat-context-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
    `;
    overlay.onclick = closeWorldChatContextMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

// Р—Р°РєСЂС‹С‚СЊ РєРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ
function closeWorldChatContextMenu() {
    const menu = document.querySelector('.world-chat-context-menu');
    const overlay = document.querySelector('.world-chat-context-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

// РњРµРЅСЋ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ СЃРѕРѕР±С‰РµРЅРёСЏ
function showDeleteMessageMenu(event, messageId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('РњРµРЅСЋ СѓРґР°Р»РµРЅРёСЏ РґР»СЏ СЃРѕРѕР±С‰РµРЅРёСЏ:', messageId);
    
    // РЎРѕР·РґР°С‘Рј РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ
    const modal = document.createElement('div');
    modal.className = 'delete-message-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-red);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--neon-red); margin-bottom: 5px;">
                РЈРґР°Р»РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ?
            </div>
            <div style="font-size: 12px; color: var(--text-gray);">
                РЎРѕРѕР±С‰РµРЅРёРµ Р±СѓРґРµС‚ СѓРґР°Р»РµРЅРѕ Сѓ РѕР±РѕРёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="deleteMessage(${messageId})" style="
                padding: 12px;
                background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                рџ—‘пёЏ РЈРґР°Р»РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ
            </button>
            <button onclick="closeDeleteMessageMenu()" style="
                padding: 12px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                РћС‚РјРµРЅР°
            </button>
        </div>
    `;
    
    // РћРІРµСЂР»РµР№
    const overlay = document.createElement('div');
    overlay.className = 'delete-message-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        animation: fadeIn 0.2s ease;
    `;
    overlay.onclick = closeDeleteMessageMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

