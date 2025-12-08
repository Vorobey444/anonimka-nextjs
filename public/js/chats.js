// ============= CHATS.JS - Список чатов =============

let activeTab = 'active';

async function showMyChats() {
    showScreen('myChats');
    
    // Загружаем чаты
    await loadChats();
}

async function loadChats() {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            console.error('Нет токена пользователя');
            return;
        }
        
        const response = await fetch('/api/chats/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки чатов');
        
        const data = await response.json();
        
        if (data.success) {
            renderChats(data.active_chats || [], data.requests || []);
            updateChatCounts(data.active_chats?.length || 0, data.requests?.length || 0);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
    }
}

function renderChats(activeChats, requests) {
    const activeContainer = document.getElementById('activeChats');
    const requestsContainer = document.getElementById('chatRequests');
    
    // Рендерим активные чаты
    if (activeContainer) {
        if (activeChats.length === 0) {
            activeContainer.innerHTML = '<p class="no-chats">Пока нет активных чатов</p>';
        } else {
            activeContainer.innerHTML = '';
            activeChats.forEach(chat => {
                const chatCard = createChatCard(chat, false);
                activeContainer.appendChild(chatCard);
            });
        }
    }
    
    // Рендерим запросы
    if (requestsContainer) {
        if (requests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-chats">Нет новых запросов</p>';
        } else {
            requestsContainer.innerHTML = '';
            requests.forEach(req => {
                const reqCard = createChatCard(req, true);
                requestsContainer.appendChild(reqCard);
            });
        }
    }
}

function createChatCard(chat, isRequest) {
    const card = document.createElement('div');
    card.className = 'chat-card';
    card.innerHTML = `
        <div class="chat-info">
            <h4>${chat.nickname || 'Аноним'}</h4>
            <p class="chat-preview">${chat.last_message || 'Нет сообщений'}</p>
        </div>
        <div class="chat-actions">
            ${isRequest 
                ? `<button class="accept-btn" onclick="acceptChatRequest('${chat.id}')">✅</button>
                   <button class="reject-btn" onclick="rejectChatRequest('${chat.id}')">❌</button>`
                : `<button class="open-chat-btn" onclick="openChat('${chat.id}')">💬</button>`
            }
        </div>
    `;
    return card;
}

function updateChatCounts(activeCount, requestsCount) {
    const activeCountEl = document.getElementById('activeChatsCount');
    const requestsCountEl = document.getElementById('requestsCount');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (requestsCountEl) requestsCountEl.textContent = requestsCount;
}

function switchChatTab(tab) {
    activeTab = tab;
    
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tc => tc.classList.remove('active'));
    
    if (tab === 'active') {
        document.querySelector('[onclick*="switchChatTab(\'active\')"]')?.classList.add('active');
        document.getElementById('activeChatsTab')?.classList.add('active');
    } else {
        document.querySelector('[onclick*="switchChatTab(\'requests\')"]')?.classList.add('active');
        document.getElementById('requestsTab')?.classList.add('active');
    }
}

async function acceptChatRequest(chatId) {
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/chats/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken, chat_id: chatId })
        });
        
        const data = await response.json();
        if (data.success) {
            await loadChats();
        }
    } catch (error) {
        console.error('Ошибка принятия запроса:', error);
    }
}

async function rejectChatRequest(chatId) {
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/chats/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken, chat_id: chatId })
        });
        
        const data = await response.json();
        if (data.success) {
            await loadChats();
        }
    } catch (error) {
        console.error('Ошибка отклонения запроса:', error);
    }
}

function openChat(chatId) {
    window.location.href = `/chat?id=${chatId}`;
}

// Экспорт
window.showMyChats = showMyChats;
window.loadChats = loadChats;
window.switchChatTab = switchChatTab;
window.acceptChatRequest = acceptChatRequest;
window.rejectChatRequest = rejectChatRequest;
window.openChat = openChat;
