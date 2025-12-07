// ============= РЎРџРРЎРћРљ Р§РђРўРћР’ =============

let chats = [];
let currentTab = 'all';

window.addEventListener('DOMContentLoaded', () => {
    loadChats();
});

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#chatTabs .tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderChats();
}

async function loadChats() {
    const list = document.getElementById('chatsList');
    list.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР°...</div>';

    try {
        const userId = getUserId();
        if (!userId) {
            list.innerHTML = '<div class="empty-state">РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ</div>';
            return;
        }

        const data = await apiRequest(`/api/chats?userId=${userId}`);
        chats = data.chats || [];
        renderChats();
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё С‡Р°С‚РѕРІ:', error);
        list.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‡Р°С‚С‹</div>';
    }
}

function renderChats() {
    const list = document.getElementById('chatsList');
    if (!chats.length) {
        list.innerHTML = '<div class="empty-state">Р§Р°С‚РѕРІ РїРѕРєР° РЅРµС‚</div>';
        return;
    }

    const filtered = chats.filter(chat => {
        if (currentTab === 'unread') return (chat.unread_count || 0) > 0;
        return true;
    });

    if (!filtered.length) {
        list.innerHTML = '<div class="empty-state">РќРµРїСЂРѕС‡РёС‚Р°РЅРЅС‹С… РЅРµС‚</div>';
        return;
    }

    list.innerHTML = '';

    filtered.forEach(chat => {
        const card = document.createElement('div');
        card.className = 'chat-card neon-card';

        const genderIcon = chat.other_gender === 'female' ? 'рџ‘©' : chat.other_gender === 'male' ? 'рџ‘Ё' : 'рџ‘¤';
        const unread = chat.unread_count || 0;
        const lastMsg = chat.last_message || {};
        const lastText = lastMsg.text ? lastMsg.text.slice(0, 80) : 'РЎРѕРѕР±С‰РµРЅРёР№ РїРѕРєР° РЅРµС‚';

        card.innerHTML = `
            <div class="chat-card-header">
                <div class="avatar-placeholder">${genderIcon}</div>
                <div class="chat-card-info">
                    <div class="chat-card-title">${chat.other_nickname || 'РђРЅРѕРЅРёРј'}</div>
                    <div class="chat-card-subtitle">${lastMsg.time ? formatDate(lastMsg.time) : ''}</div>
                </div>
                <div class="chat-card-badges">
                    ${unread > 0 ? `<span class="badge warning">${unread > 99 ? '99+' : unread}</span>` : ''}
                </div>
            </div>
            <div class="chat-card-body">
                <p>${lastText}</p>
            </div>
        `;

        card.onclick = () => openChat(chat.id);
        list.appendChild(card);
    });
}

function openChat(chatId) {
    window.location.href = `/webapp/chat.html?chatId=${encodeURIComponent(chatId)}`;
}

// Р­РєСЃРїРѕСЂС‚
window.switchTab = switchTab;

