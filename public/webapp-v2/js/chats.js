// ============= СПИСОК ЧАТОВ =============

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
    list.innerHTML = '<div class="empty-state">Загрузка...</div>';

    try {
        const userId = getUserId();
        if (!userId) {
            list.innerHTML = '<div class="empty-state">Требуется авторизация</div>';
            return;
        }

        const data = await apiRequest(`/api/chats?userId=${userId}`);
        chats = data.chats || [];
        renderChats();
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        list.innerHTML = '<div class="empty-state">Не удалось загрузить чаты</div>';
    }
}

function renderChats() {
    const list = document.getElementById('chatsList');
    if (!chats.length) {
        list.innerHTML = '<div class="empty-state">Чатов пока нет</div>';
        return;
    }

    const filtered = chats.filter(chat => {
        if (currentTab === 'unread') return (chat.unread_count || 0) > 0;
        return true;
    });

    if (!filtered.length) {
        list.innerHTML = '<div class="empty-state">Непрочитанных нет</div>';
        return;
    }

    list.innerHTML = '';

    filtered.forEach(chat => {
        const card = document.createElement('div');
        card.className = 'chat-card neon-card';

        const genderIcon = chat.other_gender === 'female' ? '👩' : chat.other_gender === 'male' ? '👨' : '👤';
        const unread = chat.unread_count || 0;
        const lastMsg = chat.last_message || {};
        const lastText = lastMsg.text ? lastMsg.text.slice(0, 80) : 'Сообщений пока нет';

        card.innerHTML = `
            <div class="chat-card-header">
                <div class="avatar-placeholder">${genderIcon}</div>
                <div class="chat-card-info">
                    <div class="chat-card-title">${chat.other_nickname || 'Аноним'}</div>
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
    window.location.href = `/webapp-v2/chat.html?chatId=${encodeURIComponent(chatId)}`;
}

// Экспорт
window.switchTab = switchTab;
