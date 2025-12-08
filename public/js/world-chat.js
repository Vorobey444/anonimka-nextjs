// ============= WORLD-CHAT.JS - Мировой чат =============

let currentWorldChatTab = 'world';
let worldChatMessages = [];

async function showWorldChat() {
    showScreen('worldChatScreen');
    
    // Загружаем сообщения
    await loadWorldChatMessages();
}

async function loadWorldChatMessages() {
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch(`/api/world-chat/messages?tab=${currentWorldChatTab}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки сообщений');
        
        const data = await response.json();
        if (data.success) {
            worldChatMessages = data.messages || [];
            renderWorldChatMessages();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}

function renderWorldChatMessages() {
    const container = document.getElementById('worldChatMessages');
    if (!container) return;
    
    if (worldChatMessages.length === 0) {
        container.innerHTML = '<p class="no-messages">Пока нет сообщений</p>';
        return;
    }
    
    container.innerHTML = '';
    worldChatMessages.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.className = 'world-chat-message';
        msgEl.innerHTML = `
            <div class="message-author">${msg.nickname || 'Аноним'}</div>
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
        `;
        container.appendChild(msgEl);
    });
    
    // Скролл вниз
    container.scrollTop = container.scrollHeight;
}

function switchWorldChatTab(tab) {
    currentWorldChatTab = tab;
    
    // Обновляем UI вкладок
    document.querySelectorAll('.world-chat-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}Tab`)?.classList.add('active');
    
    // Загружаем сообщения
    loadWorldChatMessages();
}

async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/world-chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                text: message,
                tab: currentWorldChatTab
            })
        });
        
        const data = await response.json();
        if (data.success) {
            input.value = '';
            updateCharCounter();
            await loadWorldChatMessages();
        }
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
    }
}

function updateCharCounter() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    if (input && counter) {
        counter.textContent = input.value.length;
    }
}

function toggleFontSize() {
    const container = document.getElementById('worldChatMessages');
    if (!container) return;
    
    const currentSize = localStorage.getItem('world_chat_font_size') || 'normal';
    const newSize = currentSize === 'normal' ? 'large' : 'normal';
    
    localStorage.setItem('world_chat_font_size', newSize);
    container.classList.toggle('large-font', newSize === 'large');
}

function showWorldChatFAQ() {
    alert('Мировой чат - это общий чат для всех пользователей. Будьте вежливы!');
}

// Автообновление сообщений каждые 5 секунд
let worldChatInterval = null;

function startWorldChatAutoUpdate() {
    if (worldChatInterval) clearInterval(worldChatInterval);
    worldChatInterval = setInterval(loadWorldChatMessages, 5000);
}

function stopWorldChatAutoUpdate() {
    if (worldChatInterval) {
        clearInterval(worldChatInterval);
        worldChatInterval = null;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('worldChatInput');
    if (input) {
        input.addEventListener('input', updateCharCounter);
    }
});

// Экспорт
window.showWorldChat = showWorldChat;
window.loadWorldChatMessages = loadWorldChatMessages;
window.switchWorldChatTab = switchWorldChatTab;
window.sendWorldChatMessage = sendWorldChatMessage;
window.toggleFontSize = toggleFontSize;
window.showWorldChatFAQ = showWorldChatFAQ;
window.startWorldChatAutoUpdate = startWorldChatAutoUpdate;
window.stopWorldChatAutoUpdate = stopWorldChatAutoUpdate;
